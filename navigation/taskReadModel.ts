/**
 * Pure, read-only task aggregation contract.
 *
 * Domain resolvers are injected by the caller. They receive only a freshly
 * resolved trusted actor and must return task-summary candidates for their
 * own domain. This module never reads storage, accepts query parameters,
 * builds URLs, or exposes a task write operation. A resolver failure or a
 * malformed candidate is explicitly skipped and recorded in diagnostics;
 * the remaining domains can still be rendered safely.
 */

import { resolveTrustedActor } from './actorCapabilities.ts'
import {
	TASK_BUSINESS_TYPES,
	normalizeTaskSummary,
	isTaskProcessed,
	getTaskAccess,
	type TaskBusinessType,
	type TaskSummary,
} from './taskContracts.ts'

type JsonRecord = Record<string, unknown>
type TaskActor = { id: string; roles: readonly string[] }
type TaskResolverContext = { actor: TaskActor }
type TaskResolver = (context: TaskResolverContext) => unknown
type TaskResolvers = Partial<Record<TaskBusinessType, TaskResolver>>

interface TaskReadOptions {
	actorProvider?: () => unknown
	resolvers?: TaskResolvers
}

interface TaskSkip {
	domain: TaskBusinessType
	index: number
	code: string
}

interface TaskDiagnostics {
	scanned: number
	accepted: number
	skipped: readonly TaskSkip[]
	actorError: { code: string } | null
}

interface TaskReadModel {
	actor: TaskActor | null
	all: readonly TaskSummary[]
	pending: readonly TaskSummary[]
	processed: readonly TaskSummary[]
	diagnostics: TaskDiagnostics
}

const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

class TaskReadModelError extends Error {
	readonly code: string
	readonly details: JsonRecord

	constructor(code: string, message: string, details: JsonRecord = {}) {
		super(message)
		this.name = 'TaskReadModelError'
		this.code = code
		this.details = details
	}
}

function fail(code: string, message: string, details?: JsonRecord): never {
	throw new TaskReadModelError(code, message, details)
}

function isObjectRecord(value: unknown): value is JsonRecord {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isPlainRecord(value: unknown): value is JsonRecord {
	if (!isObjectRecord(value)) return false
	const prototype = Object.getPrototypeOf(value)
	if (prototype === Object.prototype || prototype === null) return true
	const constructorDescriptor = Object.getOwnPropertyDescriptor(prototype, 'constructor')
	return Object.getPrototypeOf(prototype) === null
		&& Object.prototype.toString.call(value) === '[object Object]'
		&& constructorDescriptor !== undefined
		&& typeof constructorDescriptor.value === 'function'
		&& constructorDescriptor.value.name === 'Object'
}

function rejectDangerousKeys(value: object, label: string): void {
	for (const key of Object.getOwnPropertyNames(value)) {
		if (DANGEROUS_KEYS.has(key)) fail('PROTOTYPE_KEY', `${label} contains a prototype key`, { key })
	}
	if (Object.getOwnPropertySymbols(value).length) {
		fail('UNKNOWN_FIELD', `${label} cannot contain symbol fields`)
	}
}

function isTaskBusinessType(value: string): value is TaskBusinessType {
	return TASK_BUSINESS_TYPES.some((candidate) => candidate === value)
}

function isTaskResolver(value: unknown): value is TaskResolver {
	return typeof value === 'function'
}

function assertResolvers(resolvers: unknown): Readonly<TaskResolvers> {
	if (!isPlainRecord(resolvers)) {
		fail('RESOLVERS_REQUIRED', 'Task domain resolvers must be a plain object')
	}
	rejectDangerousKeys(resolvers, 'task resolvers')
	const normalized: TaskResolvers = {}
	for (const domain of TASK_BUSINESS_TYPES) {
		const resolver = resolvers[domain]
		if (resolver === undefined) continue
		if (!isTaskResolver(resolver)) {
			fail('INVALID_RESOLVER', `${domain} resolver must be a function`, { domain })
		}
		normalized[domain] = resolver
	}
	for (const key of Object.keys(resolvers)) {
		if (!isTaskBusinessType(key)) {
			fail('UNKNOWN_RESOLVER_DOMAIN', `Unknown task resolver domain: ${key}`, { domain: key })
		}
	}
	return Object.freeze(normalized)
}

function emptyBucket(): readonly TaskSummary[] {
	return Object.freeze([])
}

function frozenSkip(domain: TaskBusinessType, index: number, code: string): TaskSkip {
	return Object.freeze({ domain, index, code })
}

function errorCode(error: unknown, fallback: string): string {
	return isObjectRecord(error) && typeof error.code === 'string' ? error.code : fallback
}

interface DiagnosticsOptions {
	scanned?: number
	accepted?: number
	skipped?: readonly TaskSkip[]
	actorError?: unknown
}

function frozenDiagnostics({ scanned = 0, accepted = 0, skipped = [], actorError = null }: DiagnosticsOptions = {}): TaskDiagnostics {
	return Object.freeze({
		scanned,
		accepted,
		skipped: Object.freeze(skipped.slice()),
		actorError: actorError ? Object.freeze({ code: errorCode(actorError, 'ACTOR_CONTRACT_FAILED') }) : null,
	})
}

interface EmptyReadModelOptions {
	actor?: TaskActor | null
	diagnostics?: TaskDiagnostics
}

function emptyReadModel({ actor = null, diagnostics }: EmptyReadModelOptions = {}): TaskReadModel {
	const all = emptyBucket()
	return Object.freeze({
		actor,
		all,
		pending: all,
		processed: all,
		diagnostics: diagnostics || frozenDiagnostics(),
	})
}

function immutableIdentity(summary: TaskSummary): string {
	return [
		summary.businessType,
		summary.businessId,
		summary.actorId,
		summary.actionType,
		summary.reviewItemId === undefined ? '' : summary.reviewItemId,
	].join('\u0000')
}

type ThenableLike = {
	then: (...args: never[]) => unknown
	catch?: (onRejected: () => void) => unknown
}

function isThenable(value: unknown): value is ThenableLike {
	if (value === null || (typeof value !== 'object' && typeof value !== 'function')) return false
	return 'then' in value && typeof value.then === 'function'
}

function cleanupRejectedThenable(value: ThenableLike): void {
	if ('catch' in value && typeof value.catch === 'function') value.catch(() => {})
}

/** De-duplicate normalized resolver results; conflicting review落点 is skipped. */
function dedupeReadTasks(items: readonly TaskSummary[], skipped: TaskSkip[]): TaskSummary[] {
	const byTaskId = new Map<string, TaskSummary>()
	const identityByTaskId = new Map<string, string>()
	const conflicted = new Set<string>()

	for (const item of items) {
		if (conflicted.has(item.taskId)) continue
		const previous = byTaskId.get(item.taskId)
		if (!previous) {
			byTaskId.set(item.taskId, item)
			identityByTaskId.set(item.taskId, immutableIdentity(item))
			continue
		}

		if (identityByTaskId.get(item.taskId) !== immutableIdentity(item)) {
			byTaskId.delete(item.taskId)
			identityByTaskId.delete(item.taskId)
			conflicted.add(item.taskId)
			skipped.push(frozenSkip(item.businessType, -1, 'DUPLICATE_CONFLICT'))
			continue
		}

		// A processed refresh wins over pending, while a duplicate with the same
		// state keeps the first resolver's role label.
		if (!isTaskProcessed(previous) && isTaskProcessed(item)) byTaskId.set(item.taskId, item)
	}

	return Array.from(byTaskId.values())
}

function partition(items: readonly TaskSummary[]): {
	all: readonly TaskSummary[]
	pending: readonly TaskSummary[]
	processed: readonly TaskSummary[]
} {
	const pending: TaskSummary[] = []
	const processed: TaskSummary[] = []
	for (const item of items) {
		if (isTaskProcessed(item)) processed.push(item)
		else pending.push(item)
	}
	return {
		all: Object.freeze(items.slice()),
		pending: Object.freeze(pending),
		processed: Object.freeze(processed),
	}
}

function readTaskSummaries({ actorProvider, resolvers = {} }: TaskReadOptions = {}): TaskReadModel {
	if (typeof actorProvider !== 'function') {
		fail('ACTOR_PROVIDER_REQUIRED', 'A trusted actor provider is required')
	}
	const sourceResolvers = assertResolvers(resolvers)

	let actor: TaskActor | null
	try {
		actor = resolveTrustedActor(actorProvider)
	} catch (error) {
		return emptyReadModel({
			diagnostics: frozenDiagnostics({ actorError: error }),
		})
	}
	if (!actor) {
		return emptyReadModel({
			diagnostics: frozenDiagnostics({ actorError: { code: 'NO_ACTOR' } }),
		})
	}

	const candidates: TaskSummary[] = []
	const skipped: TaskSkip[] = []
	let scanned = 0

	for (const domain of TASK_BUSINESS_TYPES) {
		const resolver = sourceResolvers[domain]
		if (resolver === undefined) continue

		// This is the complete resolver input. In particular, there is no query,
		// route, status override, actorRole override, or URL context.
		const context = Object.freeze({ actor })
		let result: unknown
		try {
			result = resolver(context)
			if (isThenable(result)) {
				// The contract is synchronous. Prevent an injected rejected Promise
				// from becoming an unhandled rejection before it is skipped.
				cleanupRejectedThenable(result)
				skipped.push(frozenSkip(domain, -1, 'ASYNC_RESOLVER_UNSUPPORTED'))
				continue
			}
		} catch (error) {
			skipped.push(frozenSkip(domain, -1, errorCode(error, 'RESOLVER_FAILED')))
			continue
		}

		if (!Array.isArray(result)) {
			skipped.push(frozenSkip(domain, -1, 'INVALID_RESOLVER_RESULT'))
			continue
		}

		for (let index = 0; index < result.length; index += 1) {
			scanned += 1
			const candidate = result[index]
			try {
				if (!isPlainRecord(candidate)) fail('INVALID_TASK', 'Task candidate must be a plain object')
				rejectDangerousKeys(candidate, 'task candidate')
				const summary = normalizeTaskSummary(candidate)
				if (summary.businessType !== domain) {
					fail('CROSS_DOMAIN_TASK', 'Resolver returned another business domain', { domain })
				}
				if (!getTaskAccess(summary, actor).canRead) {
					fail('ACTOR_MISMATCH', 'Task candidate belongs to another actor')
				}
				candidates.push(summary)
			} catch (error) {
				skipped.push(frozenSkip(domain, index, errorCode(error, 'INVALID_TASK')))
			}
		}
	}

	const unique = dedupeReadTasks(candidates, skipped)
	const buckets = partition(unique)
	return Object.freeze({
		actor,
		all: buckets.all,
		pending: buckets.pending,
		processed: buckets.processed,
		diagnostics: frozenDiagnostics({
			scanned,
			accepted: unique.length,
			skipped,
		}),
	})
}

function createTaskReadModel({ actorProvider, resolvers = {} }: TaskReadOptions = {}) {
	const sourceResolvers = assertResolvers(resolvers)
	return Object.freeze({
		read: () => readTaskSummaries({ actorProvider, resolvers: sourceResolvers }),
		aggregate: () => readTaskSummaries({ actorProvider, resolvers: sourceResolvers }),
		canWrite: (): false => false,
	})
}

export {
	TaskReadModelError,
	readTaskSummaries,
	createTaskReadModel,
}
