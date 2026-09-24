/**
 * Append-only local feedback-evidence storage seam.
 *
 * This is a persistence adapter, not a moderation or correction API. Every
 * read and append is scoped by a freshly resolved actor and an explicit
 * feedback policy. Delete, withdraw, and correction are intentionally not
 * exported; the canonical contract rejects those mutation intents.
 */
import { resolveTrustedActor } from '../../../navigation/actorCapabilities.ts'
import {
	FEEDBACK_KINDS,
	normalizeFeedbackEvidence,
	normalizeFeedbackPolicy,
	type EvidenceState,
	type FeedbackKind,
	type FeedbackPolicy,
} from '../../../navigation/feedbackContracts.ts'

type JsonRecord = Record<string, unknown>

interface TrustedActor {
	readonly id: string
}

interface NormalizedEvidence extends JsonRecord {
	readonly evidenceId: string
	readonly dynamicId: string | null
	readonly kind: FeedbackKind
	readonly actorId: string
	readonly policyVersion: string
	readonly attemptKey: string
	readonly requestId: string
	readonly requestKey: string
	readonly businessKey: string
	readonly state: EvidenceState
	readonly createdAt: string
	readonly orderId?: string
	readonly animalId?: string
	readonly yardId?: string
}

interface EvidenceListData {
	readonly items: readonly NormalizedEvidence[]
	readonly total: number
	readonly diagnostics: readonly JsonRecord[]
}

interface FeedbackError {
	readonly code: string
	readonly message: string
}

interface FeedbackEnvelopeBase {
	readonly source: 'storage'
	readonly actor: TrustedActor | null
	readonly readOnly: true
	readonly canWrite: false
}

interface FeedbackSuccess<T> extends FeedbackEnvelopeBase {
	readonly success: true
	readonly data: T
	readonly error: null
	readonly idempotent?: boolean
}

interface FeedbackFailure<T> extends FeedbackEnvelopeBase {
	readonly success: false
	readonly data: T | null
	readonly error: FeedbackError
}

type FeedbackResult<T> = FeedbackSuccess<T> | FeedbackFailure<T>

export interface FeedbackEvidenceOptions {
	readonly actorProvider: () => unknown
	readonly policy: FeedbackPolicy
	readonly kind?: FeedbackKind
	readonly dynamicId?: string
	readonly orderId?: string
	readonly animalId?: string
	readonly yardId?: string
}

export interface FeedbackEvidenceInputBase {
	readonly evidenceId: string
	readonly actorId: string
	readonly policyVersion: string
	readonly attemptKey: string
	readonly requestId: string
	readonly state: EvidenceState
	readonly createdAt: string | number
}

export type FeedbackEvidenceInput = FeedbackEvidenceInputBase & (
	| Readonly<{ kind: 'dynamic'; dynamicId: string; order?: never; animal?: never }>
	| Readonly<{
		kind: 'feeding_evidence'
		dynamicId: string
		order: Readonly<{ orderId: string; animalId: string; yardId: string }>
		animal: Readonly<{ animalId: string; yardId: string }>
	}>
)

interface ActorResolution {
	readonly actor: TrustedActor | null
	readonly error: unknown | null
}

export const FEEDBACK_EVIDENCE_STORAGE_KEY = 'PAWHOME_FEEDBACK_EVIDENCE'

function frozen<T>(value: T, seen = new WeakSet<object>()): T {
	if (value === null || typeof value !== 'object' || seen.has(value)) return value
	seen.add(value)
	for (const key of Object.keys(value)) frozen(Reflect.get(value, key), seen)
	return Object.freeze(value)
}

function failure<T = never>(code: string, message: string, actor: TrustedActor | null = null, data: T | null = null): FeedbackFailure<T> {
	return frozen({ success: false, source: 'storage', data, error: { code, message }, actor, readOnly: true, canWrite: false })
}

function success<T>(data: T, actor: TrustedActor, extra: Readonly<{ idempotent?: boolean }> = {}): FeedbackSuccess<T> {
	return frozen({ success: true, source: 'storage', data, error: null, actor, readOnly: true, canWrite: false, ...extra })
}

function isRecord(value: unknown): value is JsonRecord {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function actorOf(actorProvider: unknown): ActorResolution {
	try {
		const actor = resolveTrustedActor(actorProvider)
		return actor ? { actor, error: null } : { actor: null, error: { code: 'NO_ACTOR' } }
	} catch (error) {
		return { actor: null, error }
	}
}

function errorCode(error: unknown, fallback: string): string {
	return isRecord(error) && typeof error.code === 'string' && error.code ? error.code : fallback
}

function codedError(code: string, message: string): Error & { code: string } {
	return Object.assign(new Error(message), { code })
}

function readRaw(): unknown[] {
	let raw: unknown
	try {
		raw = uni.getStorageSync(FEEDBACK_EVIDENCE_STORAGE_KEY)
	} catch {
		throw codedError('STORAGE_READ_FAILED', 'feedback evidence storage read failed')
	}
	if (raw === undefined || raw === null || raw === '') return []
	let value: unknown
	try {
		value = typeof raw === 'string' ? JSON.parse(raw) : raw
	} catch {
		throw codedError('INVALID_EVIDENCE_STORAGE', 'feedback evidence storage is not valid JSON')
	}
	if (!Array.isArray(value)) throw codedError('INVALID_EVIDENCE_STORAGE', 'feedback evidence storage must be an array')
	return value
}

function storedInput(item: JsonRecord): JsonRecord {
	const order = isRecord(item.order) ? item.order : {}
	const animal = isRecord(item.animal) ? item.animal : {}
	const common: JsonRecord = {
		evidenceId: item.evidenceId,
		...(item.dynamicId ? { dynamicId: item.dynamicId } : {}),
		kind: item.kind,
		actorId: item.actorId,
		policyVersion: item.policyVersion,
		attemptKey: item.attemptKey,
		requestId: item.requestId,
		state: item.state,
		createdAt: item.createdAt,
	}
	if (item.kind === FEEDBACK_KINDS.FEEDING_EVIDENCE) {
		const orderId = item.orderId || order.orderId
		const animalId = item.animalId || order.animalId || animal.animalId
		const yardId = item.yardId || order.yardId || animal.yardId
		common.order = { orderId, animalId, yardId }
		common.animal = { animalId, yardId }
	}
	return common
}

function persistedInput(normalized: NormalizedEvidence): JsonRecord {
	return storedInput(normalized)
}

function normalizeStored(raw: readonly unknown[], policy: FeedbackPolicy): NormalizedEvidence[] {
	const items: NormalizedEvidence[] = []
	const ids = new Set<string>()
	for (const value of raw) {
		if (!isRecord(value)) throw codedError('INVALID_EVIDENCE_RECORD', 'feedback evidence row is not an object')
		const evidenceId = String(value.evidenceId || '')
		if (!evidenceId || ids.has(evidenceId)) throw codedError('DUPLICATE_EVIDENCE_ID', 'feedback evidence ID is duplicated')
		ids.add(evidenceId)
		try {
			items.push(normalizeFeedbackEvidence(storedInput(value), policy))
		} catch (error) {
			throw codedError(errorCode(error, 'INVALID_EVIDENCE_RECORD'), 'feedback evidence row is invalid')
		}
	}
	return items
}

function listData(items: readonly NormalizedEvidence[], diagnostics: readonly JsonRecord[] = []): EvidenceListData {
	return { items, total: items.length, diagnostics }
}

function matches(item: NormalizedEvidence, options: Pick<FeedbackEvidenceOptions, 'kind' | 'dynamicId' | 'orderId' | 'animalId' | 'yardId'>): boolean {
	if (options.kind !== undefined && item.kind !== options.kind) return false
	for (const key of ['dynamicId', 'orderId', 'animalId', 'yardId'] as const) {
		if (options[key] !== undefined && options[key] !== '' && item[key] !== options[key]) return false
	}
	return true
}

/** Read only the current actor's canonical evidence rows. */
export function readFeedbackEvidence(options: FeedbackEvidenceOptions): FeedbackResult<EvidenceListData> {
	const resolved = actorOf(options.actorProvider)
	const actor = resolved.actor
	if (resolved.error || !actor) return failure(errorCode(resolved.error, 'NO_ACTOR'), 'trusted actor is unavailable')
	try {
		const policy = normalizeFeedbackPolicy(options.policy)
		const items = normalizeStored(readRaw(), policy).filter(item => matches(item, options))
		return success(listData(items.filter(item => item.actorId === actor.id)), actor)
	} catch (error) {
		return failure(errorCode(error, 'FEEDBACK_READ_FAILED'), 'feedback evidence read failed closed', actor)
	}
}

/**
 * Append one canonical evidence row. Repeating an existing attempt is
 * idempotent and never writes a second row; a different attemptKey is a new
 * legal record. This seam is for local persistence tests and future backend
 * replacement, not for a real submission UI.
 */
export function appendFeedbackEvidence(input: FeedbackEvidenceInput, options: FeedbackEvidenceOptions): FeedbackResult<NormalizedEvidence> {
	const resolved = actorOf(options.actorProvider)
	const actor = resolved.actor
	if (resolved.error || !actor) return failure(errorCode(resolved.error, 'NO_ACTOR'), 'trusted actor is unavailable')
	let normalized: NormalizedEvidence
	let policy: FeedbackPolicy
	try {
		policy = normalizeFeedbackPolicy(options.policy)
		normalized = normalizeFeedbackEvidence(input, policy)
		if (normalized.actorId !== actor.id) return failure('ACTOR_MISMATCH', 'evidence actor does not match the trusted actor', actor)
	} catch (error) {
		return failure(errorCode(error, 'INVALID_EVIDENCE'), 'feedback evidence is invalid', actor)
	}
	let existing: NormalizedEvidence[]
	try {
		existing = normalizeStored(readRaw(), policy)
	} catch (error) {
		return failure(errorCode(error, 'FEEDBACK_READ_FAILED'), 'existing evidence is invalid; append refused', actor)
	}
	const sameId = existing.find(item => item.evidenceId === normalized.evidenceId)
	if (sameId && sameId.businessKey !== normalized.businessKey) {
		return failure('DUPLICATE_EVIDENCE_ID', 'evidenceId belongs to another attempt', actor)
	}
	const sameAttempt = existing.find(item => item.businessKey === normalized.businessKey)
	if (sameAttempt) return success(sameAttempt, actor, { idempotent: true })
	const next = [...existing.map(persistedInput), persistedInput(normalized)]
	try {
		uni.setStorageSync(FEEDBACK_EVIDENCE_STORAGE_KEY, JSON.stringify(next))
	} catch {
		return failure('STORAGE_WRITE_FAILED', 'feedback evidence append was not acknowledged', actor)
	}
	return success(normalized, actor, { idempotent: false })
}

export const readEvidence = readFeedbackEvidence
export const appendEvidence = appendFeedbackEvidence
