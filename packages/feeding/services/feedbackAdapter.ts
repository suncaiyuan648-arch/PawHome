/**
 * Read-only feedback task adapter.
 *
 * The feedback contract owns policy, evidence, association, actor and
 * idempotency validation.  This module supplies a bounded read source: the
 * existing feeding order reader can provide empty-evidence task shells, and
 * a future dynamic/evidence repository may be supplied through the explicit
 * synchronous `reader` seam.  Caller records, query fields and displayed
 * roles are never accepted as data or authorization.
 */
import {
	FEEDBACK_KINDS,
	FEEDBACK_KIND_VALUES,
	normalizeFeedbackPolicy,
	summarizeFeedbackTask,
	type FeedbackKind,
	type FeedbackPolicy,
	type FeedbackTaskSummary,
} from '../../../navigation/feedbackContracts.ts'
import { resolveTrustedActor } from '../../../navigation/actorCapabilities.ts'
import { getFeedingOrders } from './orderMockApi.ts'

type JsonRecord = Record<string, unknown>
export type FeedbackPerspective = 'mine' | 'yard'
type Perspective = FeedbackPerspective
export type FeedbackTime = string | number

interface TrustedActor {
	readonly id: string
}

export interface FeedbackReaderContext {
	readonly actor: TrustedActor
	readonly kind: FeedbackKind
	readonly policyVersion: string
	readonly now: FeedbackTime
	readonly perspective: Perspective
	readonly yardId: string
}

export type FeedbackReader = (context: FeedbackReaderContext) => unknown

export interface FeedbackTaskReadOptions {
	readonly actorProvider: () => unknown
	readonly reader?: FeedbackReader
	readonly kind: FeedbackKind
	readonly policy?: FeedbackPolicy
	readonly now?: FeedbackTime
	readonly perspective?: FeedbackPerspective
	readonly yardId?: string
}

export interface FeedbackTaskDetailReadOptions extends FeedbackTaskReadOptions {
	readonly taskId: string
}

type FeedbackOptions = FeedbackTaskReadOptions & Partial<Pick<FeedbackTaskDetailReadOptions, 'taskId'>>

interface LoadedCandidates {
	readonly items: readonly unknown[]
	readonly source: string
}

interface FeedbackListData extends JsonRecord {
	readonly items: readonly FeedbackTaskSummary[]
	readonly total: number
	readonly kind: FeedbackKind | ''
	readonly perspective: Perspective
	readonly policyVersion: string
	readonly diagnostics: readonly JsonRecord[]
}

interface FeedbackDetailData extends JsonRecord {
	readonly item: FeedbackTaskSummary
	readonly taskId: string
	readonly kind: FeedbackKind
	readonly perspective: Perspective
	readonly policyVersion: string
}

interface FeedbackError {
	readonly code: string
	readonly message: string
}

interface FeedbackEnvelopeBase {
	readonly source: string
	readonly actor: TrustedActor | null
	readonly readOnly: true
	readonly canWrite: false
}

interface FeedbackSuccess<T> extends FeedbackEnvelopeBase {
	readonly success: true
	readonly data: T
	readonly error: null
}

interface FeedbackFailure<T> extends FeedbackEnvelopeBase {
	readonly success: false
	readonly data: T | null
	readonly error: FeedbackError
}

type FeedbackResult<T> = FeedbackSuccess<T> | FeedbackFailure<T>

interface ActorResolution {
	readonly actor: TrustedActor | null
	readonly error: unknown | null
}

interface CollectionFailure {
	readonly error: unknown
	readonly actor: TrustedActor | null
	readonly kind: FeedbackKind | ''
	readonly perspective: Perspective
	readonly policyVersion: string
}

interface CollectionSuccess {
	readonly actor: TrustedActor
	readonly kind: FeedbackKind
	readonly perspective: Perspective
	readonly policyVersion: string
	readonly items: readonly FeedbackTaskSummary[]
	readonly diagnostics: readonly JsonRecord[]
	readonly scanned: number
	readonly source: string
	readonly mode: 'list' | 'detail'
}

type CollectionResult = CollectionFailure | CollectionSuccess

const PERSPECTIVES: readonly Perspective[] = Object.freeze(['mine', 'yard'])
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const TASK_ID_PATTERN = /^feedback-task:[A-Za-z0-9._:|=-]{1,511}$/

function isRecord(value: unknown): value is JsonRecord {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function optionsOf(value: FeedbackTaskReadOptions | FeedbackTaskDetailReadOptions): FeedbackOptions {
	return value
}

function errorCode(error: unknown, fallback = 'FEEDBACK_READ_FAILED'): string {
	return isRecord(error) && typeof error.code === 'string' && error.code ? error.code : fallback
}

function frozen<T>(value: T, seen = new WeakSet<object>()): T {
	if (value === null || typeof value !== 'object' || seen.has(value)) return value
	seen.add(value)
	for (const key of Object.keys(value)) frozen(Reflect.get(value, key), seen)
	return Object.freeze(value)
}

function failure<T = never>(code: string, message: string, actor: TrustedActor | null = null, data: T | null = null): FeedbackFailure<T> {
	return frozen({
		success: false,
		source: 'mock',
		data,
		error: { code, message },
		actor,
		readOnly: true,
		canWrite: false,
	})
}

function success<T>(data: T, actor: TrustedActor, source = 'mock'): FeedbackSuccess<T> {
	return frozen({
		success: true,
		source,
		data,
		error: null,
		actor,
		readOnly: true,
		canWrite: false,
	})
}

function emptyData(kind: FeedbackKind | '' = '', perspective: Perspective = 'mine', policyVersion = ''): FeedbackListData {
	return {
		items: [],
		total: 0,
		kind,
		perspective,
		policyVersion,
		diagnostics: [],
	}
}

function resolveActor(actorProvider: unknown): ActorResolution {
	try {
		const actor = resolveTrustedActor(actorProvider)
		return actor ? { actor, error: null } : { actor: null, error: { code: 'NO_ACTOR' } }
	} catch (error) {
		return { actor: null, error }
	}
}

function normalizeNow(value: unknown): FeedbackTime {
	if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
		const date = new Date(value)
		if (Number.isFinite(date.getTime())) return value
	}
	if (typeof value === 'string' && value && value === value.trim()) {
		const parsed = Date.parse(value)
		if (Number.isFinite(parsed) && parsed >= 0 && Number.isFinite(new Date(parsed).getTime())) return value
	}
	throw Object.assign(new Error('feedback now must be a valid timestamp'), { code: 'INVALID_TIMESTAMP' })
}

function isFeedbackKind(value: unknown): value is FeedbackKind {
	return typeof value === 'string' && FEEDBACK_KIND_VALUES.some(candidate => candidate === value)
}

function normalizeKind(value: unknown): FeedbackKind {
	if (!isFeedbackKind(value)) {
		throw Object.assign(new Error('feedback kind is required'), { code: 'INVALID_KIND' })
	}
	return value
}

function normalizePerspective(value: unknown): Perspective {
	const result = value === undefined || value === null || value === '' ? 'mine' : value
	if (typeof result !== 'string' || !PERSPECTIVES.some(candidate => candidate === result)) {
		throw Object.assign(new Error('feedback perspective is unsupported'), { code: 'INVALID_PERSPECTIVE' })
	}
	return result === 'yard' ? 'yard' : 'mine'
}

function normalizeYardId(value: unknown): string {
	if (value === undefined || value === null || value === '') return ''
	if (typeof value !== 'string' || value !== value.trim() || !SAFE_ID.test(value) || URL_MARKERS.test(value)) {
		throw Object.assign(new Error('yardId must be an opaque ID'), { code: 'INVALID_YARD_ID' })
	}
	return value
}

function normalizeTaskId(value: unknown): string {
	if (typeof value !== 'string' || !value) {
		throw Object.assign(new Error('taskId is required'), { code: 'MISSING_TASK_ID' })
	}
	if (value !== value.trim() || !TASK_ID_PATTERN.test(value) || URL_MARKERS.test(value)) {
		throw Object.assign(new Error('taskId must be an opaque ID'), { code: 'INVALID_TASK_ID' })
	}
	return value
}

function requestContext(
	actor: TrustedActor,
	kind: FeedbackKind,
	policy: FeedbackPolicy,
	now: FeedbackTime,
	perspective: Perspective,
	yardId: string,
): FeedbackReaderContext {
	return frozen({
		actor,
		kind,
		policyVersion: policy.version,
		now,
		perspective,
		yardId,
	})
}

function defaultFeedingTask(raw: unknown, context: FeedbackReaderContext): JsonRecord {
	if (!isRecord(raw)) throw Object.assign(new Error('feeding order must be an object'), { code: 'INVALID_ORDER' })
	const orderId = raw.id !== undefined ? raw.id : raw.orderId
	const petIds = Array.isArray(raw.petIds) ? raw.petIds : []
	const animalId = raw.petId !== undefined ? raw.petId : (petIds.length === 1 ? petIds[0] : undefined)
	const yardId = raw.yardId
	return {
		kind: FEEDBACK_KINDS.FEEDING_EVIDENCE,
		actorId: context.actor.id,
		policyVersion: context.policyVersion,
		order: { orderId, animalId, yardId },
		animal: { animalId, yardId },
		evidence: [],
		...(raw.nextFeedbackAt === undefined ? {} : { nextFeedbackAt: raw.nextFeedbackAt }),
	}
}

async function readDefaultFeedingTasks(context: FeedbackReaderContext): Promise<LoadedCandidates> {
	let response: unknown
	try {
		response = await getFeedingOrders({
			variant: context.perspective,
			userPawId: context.perspective === 'mine' ? context.actor.id : undefined,
			yardOwnerId: context.perspective === 'yard' ? context.actor.id : undefined,
			yardId: context.yardId || undefined,
		})
	} catch {
		throw Object.assign(new Error('feeding order reader failed'), { code: 'FEEDING_READER_FAILED' })
	}
	if (!isRecord(response) || response.success !== true || !isRecord(response.data) || !Array.isArray(response.data.items)) {
		throw Object.assign(new Error('feeding order reader returned an invalid result'), { code: 'FEEDING_READER_FAILED' })
	}
	return {
		items: response.data.items.map(item => defaultFeedingTask(item, context)),
		source: typeof response.source === 'string' && response.source ? response.source : 'mock',
	}
}

function isFeedbackReader(value: unknown): value is FeedbackReader {
	return typeof value === 'function'
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
	return isRecord(value) && typeof value.then === 'function'
}

async function readCandidates({ reader, context, kind }: { reader: unknown; context: FeedbackReaderContext; kind: FeedbackKind }): Promise<LoadedCandidates> {
	if (reader !== undefined) {
		if (!isFeedbackReader(reader)) throw Object.assign(new Error('feedback reader must be a function'), { code: 'INVALID_READER' })
		let value: unknown
		try {
			value = reader(context)
		} catch (error) {
			throw Object.assign(new Error('feedback reader failed'), { code: errorCode(error, 'READER_FAILED') })
		}
		if (isPromiseLike(value)) {
			const catchMethod = isRecord(value) ? value.catch : undefined
			if (typeof catchMethod === 'function') catchMethod.call(value, () => {})
			throw Object.assign(new Error('feedback reader must return synchronously'), { code: 'ASYNC_READER_UNSUPPORTED' })
		}
		if (!Array.isArray(value)) throw Object.assign(new Error('feedback reader must return an array'), { code: 'INVALID_READER_RESULT' })
		return { items: value, source: 'reader' }
	}

	if (kind === FEEDBACK_KINDS.DYNAMIC) {
		throw Object.assign(new Error('dynamic feedback reader is not configured'), { code: 'READER_REQUIRED' })
	}
	return readDefaultFeedingTasks(context)
}

function normalizeCandidates(
	rawItems: readonly unknown[],
	policy: FeedbackPolicy,
	now: FeedbackTime,
	actorProvider: () => unknown,
	diagnostics: JsonRecord[],
): FeedbackTaskSummary[] {
	const normalized: FeedbackTaskSummary[] = []
	rawItems.forEach((input, index) => {
		try {
			normalized.push(summarizeFeedbackTask(input, { policy, now, actorProvider }))
		} catch (error) {
			diagnostics.push({ index, code: errorCode(error, 'INVALID_FEEDBACK_TASK') })
		}
	})
	const byId = new Map<string, FeedbackTaskSummary>()
	const conflicted = new Set<string>()
	for (const item of normalized) {
		if (conflicted.has(item.taskId)) continue
		const old = byId.get(item.taskId)
		if (!old) {
			byId.set(item.taskId, item)
			continue
		}
		if (JSON.stringify(old) !== JSON.stringify(item)) {
			byId.delete(item.taskId)
			conflicted.add(item.taskId)
			diagnostics.push({ index: -1, code: 'DUPLICATE_TASK_CONFLICT', taskId: item.taskId })
		}
	}
	return [...byId.values()]
}

async function collect(options: FeedbackTaskReadOptions | FeedbackTaskDetailReadOptions, mode: 'list' | 'detail' = 'list'): Promise<CollectionResult> {
	const source = optionsOf(options)
	let kind: FeedbackKind | '' = ''
	let perspective: Perspective = 'mine'
	let yardId: string
	let policy: FeedbackPolicy | null = null
	let now: FeedbackTime
	try {
		kind = normalizeKind(source.kind)
		perspective = normalizePerspective(source.perspective)
		yardId = normalizeYardId(source.yardId)
		policy = normalizeFeedbackPolicy(source.policy)
		now = normalizeNow(source.now)
	} catch (error) {
		return { error, actor: null, kind, perspective, policyVersion: policy ? policy.version : '' }
	}

	const resolved = resolveActor(source.actorProvider)
	const actor = resolved.actor
	if (resolved.error || !actor) {
		return { error: resolved.error || { code: 'NO_ACTOR' }, actor: null, kind, perspective, policyVersion: policy.version }
	}
	const context = requestContext(actor, kind, policy, now, perspective, yardId)
	let loaded: LoadedCandidates
	try {
		loaded = await readCandidates({ reader: source.reader, context, kind })
	} catch (error) {
		return { error, actor, kind, perspective, policyVersion: policy.version }
	}
	const diagnostics: JsonRecord[] = []
	const items = normalizeCandidates(loaded.items, policy, now, source.actorProvider, diagnostics)
	return { actor, kind, perspective, policyVersion: policy.version, items, diagnostics, scanned: loaded.items.length, source: loaded.source, mode }
}

function failureForCollected(collected: CollectionFailure): FeedbackFailure<FeedbackListData> {
	const code = errorCode(collected.error, 'FEEDBACK_READ_FAILED')
	const data = emptyData(collected.kind, collected.perspective, collected.policyVersion)
	return failure(code, 'feedback task read failed closed', collected.actor, {
		...data,
		diagnostics: [...data.diagnostics, { index: -1, code }],
	})
}

/** Read all feedback tasks for one explicit kind and policy snapshot. */
export async function readFeedbackTaskList(options: FeedbackTaskReadOptions): Promise<FeedbackResult<FeedbackListData>> {
	const collected = await collect(options, 'list')
	if ('error' in collected) return failureForCollected(collected)
	const data: FeedbackListData = {
		items: collected.items,
		total: collected.items.length,
		kind: collected.kind,
		perspective: collected.perspective,
		policyVersion: collected.policyVersion,
		diagnostics: collected.diagnostics,
	}
	return success(data, collected.actor, collected.source)
}

/** Read one task by its derived, stable taskId; no fallback item is allowed. */
export async function readFeedbackTaskDetail(options: FeedbackTaskDetailReadOptions): Promise<FeedbackResult<FeedbackDetailData>> {
	const source = optionsOf(options)
	let taskId: string
	try {
		taskId = normalizeTaskId(source.taskId)
	} catch (error) {
		return failure(errorCode(error, 'INVALID_TASK_ID'), 'feedback task ID is invalid')
	}
	const collected = await collect(source, 'detail')
	if ('error' in collected) {
		const listFailure = failureForCollected(collected)
		return failure(listFailure.error.code, listFailure.error.message, collected.actor)
	}
	const item = collected.items.find(candidate => candidate.taskId === taskId) || null
	if (!item) return failure('NOT_FOUND', 'feedback task was not found for this actor', collected.actor)
	const data: FeedbackDetailData = {
		item,
		taskId,
		kind: collected.kind,
		perspective: collected.perspective,
		policyVersion: collected.policyVersion,
	}
	return success(data, collected.actor, collected.source)
}

export const getFeedbackTaskList = readFeedbackTaskList
export const getFeedbackTaskDetail = readFeedbackTaskDetail
export const readFeedbackTasks = readFeedbackTaskList
export const readFeedbackTask = readFeedbackTaskDetail
