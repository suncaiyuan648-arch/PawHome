/**
 * Read-only gate for social comment/post deletion and correction intents.
 *
 * The repository has no approved social persistence writer or moderation
 * policy. This contract therefore validates the current actor and exact
 * object relation, then returns an explicit unavailable result. It never
 * treats a role/query/status hint as authority and never mutates a record.
 */

import { resolveTrustedActor } from './actorCapabilities.ts'

type JsonRecord = Record<string, unknown>
export type SocialMutationIntent = 'delete' | 'correct'

interface TrustedActor {
	id: string
	roles: readonly string[]
}

export interface SocialMutationTarget {
	intent: SocialMutationIntent
	dynamicId: string
	commentId: string
}

export interface SocialMutationRecord extends Readonly<Record<string, unknown>> {
	dynamicId: string
	commentId: string
}

export interface SocialMutationInput {
	intent: SocialMutationIntent
	dynamicId: string
	commentId: string
	record: SocialMutationRecord
	actorProvider: () => unknown
}

export interface SocialMutationResult {
	status: 'empty'
	code: string
	message: string
	actor: TrustedActor | null
	target: SocialMutationTarget | null
	readOnly: true
	canWrite: false
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const INTENTS: readonly SocialMutationIntent[] = Object.freeze(['delete', 'correct'])
const INPUT_KEYS = new Set(['intent', 'dynamicId', 'commentId', 'record', 'actorProvider'])
const RELATION_FIELDS = Object.freeze(['authorId', 'authorUserId', 'userId', 'ownerId'])

export class SocialMutationContractError extends Error {
	readonly code: string
	readonly details: JsonRecord

	constructor(code: string, message: string, details: JsonRecord = {}) {
		super(message)
		this.name = 'SocialMutationContractError'
		this.code = code
		this.details = details
	}
}

function fail(code: string, message: string, details?: JsonRecord): never {
	throw new SocialMutationContractError(code, message, details)
}

function own(value: object, key: PropertyKey): boolean {
	return Object.prototype.hasOwnProperty.call(value, key)
}

function isObjectRecord(value: unknown): value is JsonRecord {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isPlainRecord(value: unknown): value is JsonRecord {
	if (!isObjectRecord(value)) return false
	const prototype = Object.getPrototypeOf(value)
	return prototype === Object.prototype || prototype === null
}

function assertRecord(value: unknown, label: string): asserts value is JsonRecord {
	if (!isPlainRecord(value)) fail('INVALID_RECORD', `${label} must be a plain object`)
	for (const key of Object.keys(value)) {
		if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
			fail('PROTOTYPE_KEY', `${label} contains a forbidden key`, { key })
		}
	}
}

function id(value: unknown, label: string): string {
	if (typeof value !== 'string' || !value || value !== value.trim() || !SAFE_ID.test(value) || URL_MARKERS.test(value)) {
		fail('INVALID_ID', `${label} must be an opaque ID`, { label })
	}
	return value
}

function isObjectLike(value: unknown): value is object {
	return value !== null && typeof value === 'object'
}

function frozen<T>(value: T, seen = new WeakSet<object>()): T {
	if (!isObjectLike(value) || seen.has(value)) return value
	seen.add(value)
	if (Array.isArray(value)) {
		for (const item of value) frozen(item, seen)
	} else if (isObjectRecord(value)) {
		for (const key of Object.keys(value)) frozen(value[key], seen)
	}
	Object.freeze(value)
	return value
}

function failure(
	code: string,
	message: string,
	actor: TrustedActor | null = null,
	target: SocialMutationTarget | null = null,
): SocialMutationResult {
	return frozen({ status: 'empty', code, message, actor, target, readOnly: true, canWrite: false })
}

function errorCode(error: unknown, fallback: string): string {
	return isObjectRecord(error) && typeof error.code === 'string' ? error.code : fallback
}

function errorMessage(error: unknown, fallback: string): string {
	return error instanceof Error && error.message ? error.message : fallback
}

function isSocialMutationIntent(value: unknown): value is SocialMutationIntent {
	return value === 'delete' || value === 'correct'
}

function actorRelation(record: JsonRecord, actorId: string): boolean {
	return RELATION_FIELDS.some((field) => {
		if (!own(record, field)) return false
		const relation = record[field]
		return Array.isArray(relation) ? relation.includes(actorId) : relation === actorId
	})
}

/**
 * Validate one exact social object and return a non-writing decision.
 * `record` must be a fresh current record supplied by the caller's domain
 * reader; this function never reads a fixture or storage key itself.
 */
export function evaluateSocialMutation(input: SocialMutationInput): SocialMutationResult {
	try {
		assertRecord(input, 'social mutation input')
		for (const key of Object.keys(input)) {
			if (!INPUT_KEYS.has(key)) fail('UNKNOWN_FIELD', `Unknown social mutation field: ${key}`, { key })
		}
		if (!isSocialMutationIntent(input.intent)) fail('INVALID_INTENT', 'Only delete and correct intents are supported')
		const dynamicId = id(input.dynamicId, 'dynamicId')
		const commentId = id(input.commentId, 'commentId')
		const record = input.record
		assertRecord(record, 'social mutation record')
		if (record.dynamicId !== dynamicId || record.commentId !== commentId) {
			return failure('OBJECT_MISMATCH', 'social mutation target does not match the current record')
		}
		let actor: TrustedActor | null
		try {
			actor = resolveTrustedActor(input.actorProvider)
		} catch (error) {
			return failure(errorCode(error, 'ACTOR_PROVIDER_FAILED'), 'trusted actor is unavailable')
		}
		if (!actor) return failure('NO_ACTOR', 'trusted actor is unavailable')
		const target = Object.freeze({ intent: input.intent, dynamicId, commentId })
		if (!actorRelation(record, actor.id)) return failure('FORBIDDEN', 'actor is not the current social author', actor, target)
		// The relation is necessary but deliberately not sufficient: no approved
		// social writer/moderation policy exists in this repository yet.
		return failure('SOCIAL_MUTATION_UNAVAILABLE', 'social deletion and correction are not enabled', actor, target)
	} catch (error) {
		return failure(errorCode(error, 'SOCIAL_CONTRACT_FAILED'), errorMessage(error, 'social mutation rejected'))
	}
}

export const evaluateSocialMutationIntent = evaluateSocialMutation
export const SOCIAL_MUTATION_INTENTS = INTENTS
