/**
 * Local-only writers for the two publish contexts.
 *
 * A normal dynamic is an author-scoped record. A feeding feedback publish is
 * a compound operation: the order, animal and yard are read again from local
 * persistence, the current actor must be the yard owner, one dynamic record
 * carries the body/media, and canonical evidence rows point back to that
 * dynamic. No route or page mock is treated as proof of a relationship.
 */
import { resolveTrustedActor } from '@/navigation/actorCapabilities.ts'
import {
	FEEDBACK_KINDS,
	normalizeFeedbackEvidence,
	normalizeFeedbackPolicy,
	summarizeFeedbackTask,
} from '@/navigation/feedbackContracts.ts'
import type { FeedbackPolicy, FeedbackTaskSummary } from '@/navigation/feedbackContracts.ts'

type JsonRecord = Record<string, unknown>
type FeedbackTime = string | number
type FeedbackActor = NonNullable<ReturnType<typeof resolveTrustedActor>>
type NormalizedEvidence = ReturnType<typeof normalizeFeedbackEvidence>

export interface FeedbackStoragePort {
	getStorageSync(key: string): unknown
	setStorageSync(key: string, value: unknown): void
	removeStorageSync?(key: string): void
}

export type FeedbackSelectionRef = string | Readonly<{
	id?: string
	orderId?: string
	animalId?: string
	petId?: string
	yardId?: string
}>
export type FeedbackAssociationRef = Exclude<FeedbackSelectionRef, string>
export type FeedbackMediaInput = string | Readonly<{ url?: string; src?: string; path?: string }>

interface StorageChange {
	key: string
	value: string
}

interface FeedbackAssociation {
	orderId: string
	animalId: string
	yardId: string
}

interface FeedbackIds extends FeedbackAssociation {
	animalYardId?: string
}

interface AssociationResult {
	orderId: string
	animalId: string
	yardId: string
	animalYardId: string
}

interface ActorResolution {
	actor: FeedbackActor | null
	error: unknown | null
}

interface RelationResult {
	values: string[]
	error: string | null
}

interface FeedbackSummaryData {
	orderId: string
	animalId: string
	yardId: string
	completedCount: number
	requiredCount: number
	maximumCount: number
	status: FeedbackTaskSummary['status']
	lastFeedbackAt: string | null
	evidenceCount: number
}

interface FeedbackPair {
	order: JsonRecord
	animal: JsonRecord
	yard: JsonRecord
	ids: FeedbackAssociation
	policy: FeedbackPolicy
}

interface PublishSuccess<T> {
	success: true
	data: T
	error: null
	actor: FeedbackActor
	readOnly: boolean
	canWrite: boolean
	idempotent?: boolean
	wrote?: boolean
}

interface PublishFailure {
	success: false
	data: null
	error: Readonly<{ code: string; message: string }>
	actor: FeedbackActor | null
	readOnly: true
	canWrite: false
}

type PublishResult<T> = PublishSuccess<T> | PublishFailure

interface FeedbackPublishData {
	dynamicId: string
	record: JsonRecord
	evidence: JsonRecord[]
	associations: FeedbackAssociation[]
	summaries: FeedbackSummaryData[]
	completedCount?: number
	requiredCount?: number
	maximumCount?: number
}

interface DynamicPublishData {
	dynamicId: string
	record: JsonRecord
}

export interface FeedbackPublishOptions {
	readonly order?: FeedbackSelectionRef
	readonly animal?: FeedbackSelectionRef
	readonly orders?: readonly FeedbackSelectionRef[]
	readonly animals?: readonly FeedbackSelectionRef[]
	readonly orderId?: string
	readonly animalId?: string
	readonly orderIds?: readonly string[]
	readonly animalIds?: readonly string[]
	readonly content?: string
	readonly mediaList?: readonly FeedbackMediaInput[]
	readonly media?: readonly FeedbackMediaInput[]
	readonly actorProvider?: () => unknown
	readonly policy?: FeedbackPolicy | LocalFeedbackPolicy
	readonly attemptKey?: string
	readonly requestId?: string
	readonly evidenceId?: string
	readonly dynamicId?: string
	readonly createdAt?: string | number
	readonly storage?: FeedbackStoragePort
	readonly requirePersistedAssociation?: boolean
}

export interface DynamicPublishOptions {
	readonly content?: string
	readonly mediaList?: readonly FeedbackMediaInput[]
	readonly media?: readonly FeedbackMediaInput[]
	readonly actorProvider?: () => unknown
	readonly attemptKey?: string
	readonly dynamicId?: string
	readonly yardId?: string
	readonly createdAt?: string | number
	readonly storage?: FeedbackStoragePort
}

export interface FeedbackSummaryOptions {
	readonly order?: FeedbackAssociationRef
	readonly animal?: FeedbackAssociationRef
	readonly actorProvider?: () => unknown
	readonly policy?: FeedbackPolicy | LocalFeedbackPolicy
	readonly now?: string | number
	readonly storage?: FeedbackStoragePort
	readonly requirePersistedAssociation?: boolean
}

export interface AppendFeedbackOptions extends FeedbackPublishOptions {
	readonly requestId?: string
	readonly evidenceId?: string
}

type PublisherExtra = { idempotent?: boolean; wrote?: boolean }
type LocalFeedbackPolicy = Omit<FeedbackPolicy, 'startsAt' | 'expiresAt'> & {
	startsAt: undefined
	expiresAt: undefined
}

const LOCAL_LAST_FEEDBACK_STATES: FeedbackPolicy['lastFeedbackStates'] = Object.freeze(['active', 'corrected'])

export const FEEDBACK_EVIDENCE_STORAGE_KEY = 'PAWHOME_FEEDBACK_EVIDENCE'
export const DYNAMIC_STORAGE_KEY = 'PAWHOME_DYNAMIC_RECORDS'
export const FEEDING_ORDER_STORAGE_KEY = 'PAWHOME_FEEDING_ORDERS'
export const YARD_STORAGE_KEY = 'PAWHOME_YARD_RECORDS'
export const ANIMAL_STORAGE_KEY = 'PAWHOME_ANIMAL_RECORDS'

export const LOCAL_FEEDBACK_POLICY: LocalFeedbackPolicy = Object.freeze({
	version: 'feedback-local-v1',
	evidenceKinds: [FEEDBACK_KINDS.FEEDING_EVIDENCE],
	requiredCount: 2,
	maximumCount: 5,
	startsAt: undefined,
	expiresAt: undefined,
	countRules: Object.freeze({
		pending: 'exclude',
		active: 'count',
		corrected: 'count',
		deleted: 'exclude',
		withdrawn: 'exclude',
		rejected: 'exclude',
	}),
	lastFeedbackStates: LOCAL_LAST_FEEDBACK_STATES,
})

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const ANONYMOUS_IDS = new Set(['anonymous', 'anon', 'guest', 'unknown', '匿名', '匿名用户'])

function isRecord(value: unknown): value is JsonRecord {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isStoragePort(value: unknown): value is FeedbackStoragePort {
	return isRecord(value)
		&& typeof value.getStorageSync === 'function'
		&& typeof value.setStorageSync === 'function'
}

function storageOf(storage: unknown): FeedbackStoragePort | null {
	if (isStoragePort(storage)) return storage
	if (typeof uni !== 'undefined' && isStoragePort(uni)) return uni
	return null
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

function fail(code: string, message: string, actor: FeedbackActor | null = null, extra: JsonRecord = {}): PublishFailure {
	return { success: false, data: null, error: { code, message }, actor, readOnly: true, canWrite: false, ...extra }
}

function ok<T>(data: T, actor: FeedbackActor, extra: PublisherExtra = {}): PublishSuccess<T> {
	return { success: true, data, error: null, actor, readOnly: extra.wrote === true ? false : true, canWrite: extra.wrote === true, ...extra }
}

function text(value: unknown): string {
	return value === undefined || value === null ? '' : String(value).trim()
}

function validId(value: unknown): boolean {
	const id = text(value)
	return Boolean(id && SAFE_ID.test(id) && !URL_MARKERS.test(id) && !ANONYMOUS_IDS.has(id.toLowerCase()))
}

function idOrEmpty(value: unknown): string {
	const id = text(value)
	return validId(id) ? id : ''
}

// Keep the feedback service self-contained because governance tests load it
// in an isolated temporary tree. Aliases must describe one identical animal set.
function animalIdsOfOrder(order: JsonRecord = {}): { values: string[]; error: string | null } {
	const singular: string[] = []
	const sets: string[][] = []
	const valid = (value: unknown): value is string => typeof value === 'string' && SAFE_ID.test(value)
	const invalid = (): { values: string[]; error: string } => ({ values: [], error: 'INVALID_ANIMAL_RELATION' })
	for (const field of ['animalId', 'petId']) {
		if (!Object.prototype.hasOwnProperty.call(order, field)) continue
		const value = order[field]
		if (!valid(value)) return invalid()
		singular.push(value)
	}
	for (const field of ['animalIds', 'petIds']) {
		if (!Object.prototype.hasOwnProperty.call(order, field)) continue
		const source = order[field]
		if (!Array.isArray(source) || !source.length) return invalid()
		const values: unknown[] = source
		const validValues = values.filter((id): id is string => valid(id))
		if (validValues.length !== values.length) return invalid()
		sets.push([...new Set(validValues)].sort())
	}
	if (new Set(singular).size > 1) return invalid()
	if (sets.some(ids => ids.join('|') !== sets[0].join('|'))) return invalid()
	if (sets.length && singular.some(id => !sets[0].includes(id))) return invalid()
	return { values: sets[0] || [...new Set(singular)], error: null }
}

function isFeedbackEligible(order: JsonRecord = {}): boolean {
	const types = ['orderType', 'type'].filter(key => order[key] !== undefined).map(key => order[key])
	if (types.some(type => type !== 'normal_feed')) return false
	const states = ['status', 'stateKey', 'deliveryStatus']
		.filter(key => order[key] !== undefined)
		.map(key => order[key])
	const allowed = ['delivered', 'fulfilled', 'completed', 'cloud-active-timeout', 'cloud-active-feedback'] as const
	return states.length > 0 && states.every(state => allowed.some(eligibleState => eligibleState === state))
}

function copy(value: JsonRecord): JsonRecord {
	const serialized = JSON.stringify(value)
	if (serialized === undefined) throw new Error('record cannot be serialized')
	const result: unknown = JSON.parse(serialized)
	if (!isRecord(result)) throw new Error('serialized record is invalid')
	return result
}

function readValue(storage: unknown, key: string): unknown {
	const target = storageOf(storage)
	if (!target) throw Object.assign(new Error('storage is unavailable'), { code: 'STORAGE_UNAVAILABLE' })
	try { return target.getStorageSync(key) } catch {
		throw Object.assign(new Error(`storage read failed: ${key}`), { code: 'STORAGE_READ_FAILED' })
	}
}

function readArray(storage: unknown, key: string, { missingOk = true }: { missingOk?: boolean } = {}): { present: boolean; rows: unknown[]; raw: unknown } {
	const raw = readValue(storage, key)
	if (raw === undefined || raw === null || raw === '') {
		if (!missingOk) throw Object.assign(new Error(`${key} is missing`), { code: 'READER_MISSING' })
		return { present: false, rows: [], raw }
	}
	try {
		const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
		if (!Array.isArray(parsed)) throw new Error('storage value is not an array')
		const rows: unknown[] = parsed
		return { present: true, rows, raw }
	} catch {
		throw Object.assign(new Error(`${key} is invalid`), { code: 'INVALID_STORAGE' })
	}
}

function readRaw(storage: unknown): unknown[] {
	return readArray(storage, FEEDBACK_EVIDENCE_STORAGE_KEY).rows
}

function inputOf(value: unknown): JsonRecord {
	const item = isRecord(value) ? value : {}
	const order = isRecord(item.order) ? item.order : {}
	const animal = isRecord(item.animal) ? item.animal : {}
	return {
		evidenceId: item.evidenceId,
		dynamicId: item.dynamicId,
		kind: item.kind,
		actorId: item.actorId,
		policyVersion: item.policyVersion,
		attemptKey: item.attemptKey,
		requestId: item.requestId,
		state: item.state,
		createdAt: item.createdAt,
		order: { orderId: order.orderId || item.orderId, animalId: order.animalId || item.animalId, yardId: order.yardId || item.yardId },
		animal: { animalId: animal.animalId || item.animalId, yardId: animal.yardId || item.yardId },
	}
}

function normalizeRows(raw: readonly unknown[], policy: FeedbackPolicy): NormalizedEvidence[] {
	return raw.map(input => normalizeFeedbackEvidence(inputOf(input), policy))
}

function idsOf(value: unknown): FeedbackIds {
	const record = isRecord(value) ? value : {}
	return {
		orderId: idOrEmpty(record.orderId || record.id),
		animalId: idOrEmpty(record.animalId || record.petId),
		yardId: idOrEmpty(record.yardId),
	}
}

function associationOf(order: unknown, animal: unknown): AssociationResult {
	const orderIds = idsOf(order)
	const animalIds = idsOf(animal)
	return {
		orderId: orderIds.orderId,
		animalId: animalIds.animalId || orderIds.animalId,
		yardId: orderIds.yardId || animalIds.yardId,
		animalYardId: animalIds.yardId || orderIds.yardId,
	}
}

function summaryFor(items: readonly NormalizedEvidence[], actor: FeedbackActor, ids: FeedbackIds, policy: FeedbackPolicy, now: FeedbackTime): FeedbackSummaryData {
	const association = { orderId: ids.orderId, animalId: ids.animalId, yardId: ids.yardId }
	const evidence = items
		.filter(item => item.actorId === actor.id && item.orderId === ids.orderId && item.animalId === ids.animalId && item.yardId === ids.yardId)
		.map(inputOf)
	const task = summarizeFeedbackTask({
		kind: FEEDBACK_KINDS.FEEDING_EVIDENCE,
		actorId: actor.id,
		policyVersion: policy.version,
		order: association,
		animal: { animalId: ids.animalId, yardId: ids.animalYardId || ids.yardId },
		evidence,
	}, { policy, now, actorProvider: () => ({ actor }) })
	return {
		orderId: ids.orderId,
		animalId: ids.animalId,
		yardId: ids.yardId,
		completedCount: task.completedCount,
		requiredCount: task.requiredCount,
		maximumCount: task.maximumCount,
		status: task.status,
		lastFeedbackAt: task.lastFeedbackAt,
		evidenceCount: task.evidenceCount,
	}
}

function relationValues(record: JsonRecord, fields: readonly string[]): RelationResult {
	const values: string[] = []
	for (const field of fields) {
		if (!Object.prototype.hasOwnProperty.call(record, field)) continue
		const source = record[field]
		const list: unknown[] = Array.isArray(source) ? source : [source]
		for (const entry of list) {
			const id = idOrEmpty(entry)
			if (!id) return { values: [], error: 'INVALID_RELATION' }
			if (!values.includes(id)) values.push(id)
		}
	}
	return { values, error: null }
}

function nestedRelationValues(record: JsonRecord, paths: readonly string[]): RelationResult {
	const values: string[] = []
	for (const path of paths) {
		const parts = path.split('.')
		let current: unknown = record
		for (const part of parts) current = isRecord(current) ? current[part] : undefined
		if (current === undefined || current === null || current === '') continue
		const id = idOrEmpty(current)
		if (!id) return { values: [], error: 'INVALID_RELATION' }
		if (!values.includes(id)) values.push(id)
	}
	return { values, error: null }
}

function ownerRelation(record: JsonRecord): RelationResult {
	const direct = relationValues(record, ['yardOwnerId', 'ownerPawId', 'ownerUserId', 'yardManagerId', 'ownerId'])
	if (direct.error) return direct
	const nested = nestedRelationValues(record, ['yard.ownerId', 'yard.yardOwnerId', 'yard.ownerPawId', 'yard.owner.id', 'yard.owner.pawId'])
	if (nested.error) return nested
	const values = [...new Set([...direct.values, ...nested.values])]
	if (values.length > 1) return { values: [], error: 'CONFLICTING_OWNER_RELATION' }
	return { values, error: null }
}

function assertOwner(record: JsonRecord, actorId: string, { required = true }: { required?: boolean } = {}): void {
	const relation = ownerRelation(record)
	if (relation.error) throw Object.assign(new Error('owner relation is invalid'), { code: 'INVALID_OWNER_RELATION' })
	if (!relation.values.length) {
		if (required) throw Object.assign(new Error('owner relation is missing'), { code: 'MISSING_OWNER_RELATION' })
		return
	}
	if (!relation.values.includes(actorId)) throw Object.assign(new Error('actor is not the yard owner'), { code: 'FORBIDDEN' })
}

function isSafeInteger(value: unknown): value is number {
	return typeof value === 'number' && Number.isSafeInteger(value)
}

function policyFor(order: JsonRecord, override: unknown): FeedbackPolicy {
	const source: JsonRecord = isRecord(override)
		? override
		: isRecord(order.feedbackPolicy)
			? order.feedbackPolicy
			: {
				...(isSafeInteger(order.feedbackRequiredCount) ? { requiredCount: order.feedbackRequiredCount } : {}),
				...(isSafeInteger(order.feedbackMaximumCount) ? { maximumCount: order.feedbackMaximumCount } : {}),
				...(order.feedbackPolicyVersion ? { version: order.feedbackPolicyVersion } : {}),
				...(order.feedbackStartsAt ? { startsAt: order.feedbackStartsAt } : {}),
				...(order.feedbackExpiresAt ? { expiresAt: order.feedbackExpiresAt } : {}),
			}
	const merged: JsonRecord = { ...LOCAL_FEEDBACK_POLICY, ...source }
	if (isSafeInteger(merged.maximumCount) && !isSafeInteger(source.requiredCount)
		&& !isSafeInteger(order.feedbackRequiredCount) && isSafeInteger(merged.requiredCount)) {
		merged.requiredCount = Math.min(merged.requiredCount, merged.maximumCount)
	}
	try { return normalizeFeedbackPolicy(merged) } catch (error) {
		throw Object.assign(new Error('feedback policy is invalid'), { code: errorCode(error, 'INVALID_FEEDBACK_POLICY') })
	}
}

function ensureEligible(order: JsonRecord): void {
	if (!isFeedbackEligible(order)) throw Object.assign(new Error('order is not eligible for feedback'), { code: 'FEEDBACK_NOT_ELIGIBLE' })
}

function selectedList(input: unknown, plural: string, singular: string): JsonRecord[] {
	const record = isRecord(input) ? input : {}
	if (Array.isArray(record[plural])) {
		const values: unknown[] = record[plural]
		return values.filter(isRecord)
	}
	if (isRecord(record[singular])) return [record[singular]]
	return []
}

function selectedIds(input: unknown, plural: string, singular: string): string[] {
	const record = isRecord(input) ? input : {}
	const source: unknown[] = Array.isArray(record[plural]) ? record[plural] : record[singular] !== undefined ? [record[singular]] : []
	return source
		.map(value => {
			if (!isRecord(value)) return value
			return value.id || value.orderId || value.animalId || value.petId
		})
		.map(idOrEmpty)
		.filter(Boolean)
}

function exactRow(rows: readonly unknown[], id: string, aliases: readonly string[], code: string): JsonRecord {
	const candidates = rows.filter((row): row is JsonRecord => isRecord(row) && aliases.some(alias => text(row[alias]) === id))
	if (candidates.length > 1) throw Object.assign(new Error(`${code} is ambiguous`), { code: `CONFLICTING_${code}` })
	const row = candidates[0]
	if (!row) throw Object.assign(new Error(`${code} was not found`), { code: `${code}_NOT_FOUND` })
	const suppliedIds = aliases.filter(alias => Object.prototype.hasOwnProperty.call(row, alias)).map(alias => idOrEmpty(row[alias]))
	if (suppliedIds.some(value => !value) || new Set(suppliedIds).size > 1) {
		throw Object.assign(new Error(`${code} aliases conflict`), { code: `CONFLICTING_${code}` })
	}
	return row
}

function readFeedbackContext(
	input: FeedbackPublishOptions,
	{ storage, actor }: { storage?: unknown; actor: FeedbackActor },
): FeedbackPair[] {
	const orderIds = selectedIds(input, 'orderIds', 'orderId')
	const animalIds = selectedIds(input, 'animalIds', 'animalId')
	const orderInputs = selectedList(input, 'orders', 'order')
	const requestedOrderIds = orderIds.length ? orderIds : orderInputs.map(value => idsOf(value).orderId).filter(Boolean)
	const requestedAnimalIds = animalIds.length ? animalIds : selectedList(input, 'animals', 'animal').map(value => idsOf(value).animalId).filter(Boolean)
	if (!requestedOrderIds.length) throw Object.assign(new Error('feedback order is required'), { code: 'MISSING_ASSOCIATION' })

	const orderRows = readArray(storage, FEEDING_ORDER_STORAGE_KEY, { missingOk: false }).rows
	const yardRows = readArray(storage, YARD_STORAGE_KEY, { missingOk: false }).rows
	const animalRows = readArray(storage, ANIMAL_STORAGE_KEY, { missingOk: false }).rows
	const orders = requestedOrderIds.map(id => exactRow(orderRows, id, ['orderId', 'id'], 'ORDER'))
	const pairs: FeedbackPair[] = []
	const seen = new Set<string>()
	for (const order of orders) {
		const orderId = idOrEmpty(order.orderId || order.id)
		const nestedYardId = isRecord(order.yard) ? order.yard.id : undefined
		const yardId = idOrEmpty(order.yardId || nestedYardId)
		if (!orderId || !yardId) throw Object.assign(new Error('order association is incomplete'), { code: 'MISSING_ASSOCIATION' })
		assertOwner(order, actor.id)
		ensureEligible(order)
		const yard = exactRow(yardRows, yardId, ['yardId', 'id'], 'YARD')
		assertOwner(yard, actor.id)
		const orderAnimals = animalIdsOfOrder(order)
		if (orderAnimals.error) throw Object.assign(new Error('order animal relation is invalid'), { code: orderAnimals.error })
		if (!orderAnimals.values.length) throw Object.assign(new Error('animal relation missing'), { code: 'MISSING_ASSOCIATION' })
		const candidates = requestedAnimalIds.length
			? (orderAnimals.values.length ? requestedAnimalIds.filter(animalId => orderAnimals.values.includes(animalId)) : requestedAnimalIds)
			: orderAnimals.values
		if (!candidates.length) {
			if (requestedAnimalIds.length && orderAnimals.values.length) continue
			throw Object.assign(new Error('feedback animal is required'), { code: 'MISSING_ASSOCIATION' })
		}
		for (const animalId of candidates) {
			const animal = exactRow(animalRows, animalId, ['animalId', 'id'], 'ANIMAL')
			const nestedAnimalYardId = isRecord(animal.yard) ? animal.yard.id : undefined
			const animalYardId = idOrEmpty(animal.yardId || nestedAnimalYardId)
			if (!animalYardId || animalYardId !== yardId) throw Object.assign(new Error('animal does not belong to order yard'), { code: 'CROSS_YARD_ASSOCIATION' })
			const key = `${orderId}|${animalId}|${yardId}`
			if (seen.has(key)) continue
			seen.add(key)
			pairs.push({ order, animal, yard, ids: { orderId, animalId, yardId }, policy: policyFor(order, input.policy) })
		}
	}
	if (!pairs.length) throw Object.assign(new Error('feedback association is empty'), { code: 'MISSING_ASSOCIATION' })
	if (requestedAnimalIds.length && requestedAnimalIds.some(animalId => !pairs.some(pair => pair.ids.animalId === animalId))) {
		throw Object.assign(new Error('order and animal are not associated'), { code: 'ASSOCIATION_CONFLICT' })
	}
	return pairs
}

function hash(value: string): string {
	let result = 2166136261
	for (let index = 0; index < value.length; index += 1) {
		result ^= value.charCodeAt(index)
		result = Math.imul(result, 16777619)
	}
	return (result >>> 0).toString(36)
}

function dynamicIdFor(kind: 'feedback' | 'dynamic', actorId: string, attemptKey: string, requested: unknown): string {
	if (requested !== undefined && requested !== null && requested !== '') {
		const id = idOrEmpty(requested)
		if (!id) throw Object.assign(new Error('dynamicId is invalid'), { code: 'INVALID_DYNAMIC_ID' })
		return id
	}
	return `${kind}-${hash(`${actorId}|${attemptKey}`)}`
}

function mediaOf(value: unknown): string[] {
	const source: unknown[] = Array.isArray(value) ? value : []
	return source
		.map(item => {
			if (typeof item === 'string') return item.trim()
			if (isRecord(item)) return item.url || item.src || item.path
			return undefined
		})
		.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
		.map(item => item.trim())
		.slice(0, 9)
}

function serialize(value: unknown): string {
	const serialized = JSON.stringify(value)
	if (serialized === undefined) throw new Error('value cannot be serialized')
	return serialized
}

function writePair(storage: unknown, changes: readonly StorageChange[]): void {
	const target = storageOf(storage)
	if (!target) throw Object.assign(new Error('storage is unavailable'), { code: 'STORAGE_UNAVAILABLE' })
	const previous = changes.map(change => ({ key: change.key, value: readValue(target, change.key) }))
	try {
		for (const change of changes) target.setStorageSync(change.key, change.value)
	} catch {
		for (const item of previous) {
			try {
				if (item.value === undefined && typeof target.removeStorageSync === 'function') target.removeStorageSync(item.key)
				else target.setStorageSync(item.key, item.value)
			} catch { /* best effort rollback for a local adapter */ }
		}
		throw Object.assign(new Error('local publish write was not acknowledged'), { code: 'STORAGE_WRITE_FAILED' })
	}
}

function normalizeEvidenceRows(raw: readonly unknown[], policy: FeedbackPolicy): NormalizedEvidence[] {
	try { return normalizeRows(raw, policy) } catch (error) {
		throw Object.assign(new Error('existing feedback evidence is invalid'), { code: errorCode(error, 'FEEDBACK_READ_FAILED') })
	}
}

function relevantEvidenceRows(raw: readonly unknown[], ids: FeedbackIds, actorId: string): unknown[] {
	return raw.filter(item => {
		const normalized = inputOf(item)
		const order = isRecord(normalized.order) ? normalized.order : {}
		const animal = isRecord(normalized.animal) ? normalized.animal : {}
		return normalized.actorId === actorId
			&& text(order.orderId) === ids.orderId
			&& text(order.animalId || animal.animalId) === ids.animalId
			&& text(order.yardId || animal.yardId) === ids.yardId
	})
}

/** Strict feeding-feedback publish. */
export function publishLocalFeedback({
	order, animal, orders, animals, orderId, animalId, orderIds, animalIds,
	content = '', mediaList, media, actorProvider, policy, attemptKey,
	requestId, evidenceId, dynamicId, createdAt = new Date().toISOString(), storage,
}: FeedbackPublishOptions = {}): PublishResult<FeedbackPublishData> {
	const resolved = actorOf(actorProvider)
	if (resolved.error || !resolved.actor) return fail(errorCode(resolved.error, 'NO_ACTOR'), 'trusted actor is unavailable')
	const actor = resolved.actor
	const key = text(attemptKey)
	if (!validId(key)) return fail('MISSING_ATTEMPT_KEY', 'feedback attemptKey is required', actor)
	const body = text(content)
	const mediaItems = mediaOf(mediaList || media)
	if (!body && !mediaItems.length) return fail('EMPTY_DYNAMIC', '反馈正文或媒体至少需要一项', actor)
	let pairs: FeedbackPair[]
	let normalizedExisting: unknown[]
	let currentRecords: unknown[]
	try {
		pairs = readFeedbackContext({ order, animal, orders, animals, orderId, animalId, orderIds, animalIds, policy }, { storage, actor })
		currentRecords = readArray(storage, DYNAMIC_STORAGE_KEY).rows
		normalizedExisting = readRaw(storage)
	} catch (error) {
		return fail(errorCode(error, 'FEEDBACK_READ_FAILED'), '反馈关联数据读取失败，未保存任何内容', actor)
	}

	let targetDynamicId
	try { targetDynamicId = dynamicIdFor('feedback', actor.id, key, dynamicId) } catch (error) {
		return fail(errorCode(error, 'INVALID_DYNAMIC_ID'), '动态 ID 无效', actor)
	}
	const existingDynamic = currentRecords.find((item): item is JsonRecord => isRecord(item) && text(item.dynamicId || item.id) === targetDynamicId)
	if (existingDynamic && (idOrEmpty(existingDynamic.authorId) !== actor.id || existingDynamic.attemptKey !== key || existingDynamic.kind !== 'feeding-feedback')) {
		return fail('DYNAMIC_ID_CONFLICT', '动态 ID 已属于其他发布', actor)
	}

	const nextEvidence: JsonRecord[] = []
	const newEvidence: NormalizedEvidence[] = []
	const summaries: FeedbackSummaryData[] = []
	try {
		for (const pair of pairs) {
			const rowsForPolicy = normalizeEvidenceRows(relevantEvidenceRows(normalizedExisting, pair.ids, actor.id), pair.policy)
			const summary = summaryFor(rowsForPolicy, actor, pair.ids, pair.policy, createdAt)
			const sameAttempt = rowsForPolicy.find(item => item.actorId === actor.id
				&& item.orderId === pair.ids.orderId && item.animalId === pair.ids.animalId && item.yardId === pair.ids.yardId && item.attemptKey === key)
			if (!sameAttempt && summary.completedCount >= summary.maximumCount) {
				throw Object.assign(new Error('feedback maximum count reached'), { code: 'FEEDBACK_LIMIT_REACHED' })
			}
			summaries.push(summary)
			if (sameAttempt) continue
			const suffix = `${key}-${hash(`${pair.ids.orderId}|${pair.ids.animalId}`)}`
			const raw: JsonRecord = {
				evidenceId: evidenceId || `feedback-${hash(`${targetDynamicId}|${pair.ids.orderId}|${pair.ids.animalId}`)}`,
				dynamicId: targetDynamicId,
				kind: FEEDBACK_KINDS.FEEDING_EVIDENCE,
				actorId: actor.id,
				policyVersion: pair.policy.version,
				attemptKey: key,
				requestId: requestId || `request-${hash(`${targetDynamicId}|${suffix}`)}`,
				state: 'active',
				createdAt,
				order: { orderId: pair.ids.orderId, animalId: pair.ids.animalId, yardId: pair.ids.yardId },
				animal: { animalId: pair.ids.animalId, yardId: pair.ids.yardId },
			}
			const normalized = normalizeFeedbackEvidence(raw, pair.policy)
			const sameId = relevantEvidenceRows(normalizedExisting, pair.ids, actor.id).map((item): NormalizedEvidence | null => {
				try { return normalizeFeedbackEvidence(inputOf(item), pair.policy) } catch { return null }
			}).find(item => item !== null && item.evidenceId === normalized.evidenceId)
			if (sameId && sameId.businessKey !== normalized.businessKey) throw Object.assign(new Error('evidence ID belongs to another attempt'), { code: 'DUPLICATE_EVIDENCE_ID' })
			nextEvidence.push(raw)
			newEvidence.push(normalized)
		}
	} catch (error) {
		return fail(errorCode(error, 'INVALID_EVIDENCE'), '反馈证据无效，未保存任何内容', actor)
	}

	const record: JsonRecord = existingDynamic || {
		id: targetDynamicId,
		dynamicId: targetDynamicId,
		kind: 'feeding-feedback',
		visibility: 'public',
		authorId: actor.id,
		author: { id: actor.id },
		attemptKey: key,
		createdAt,
	}
	const associations: FeedbackAssociation[] = pairs.map(pair => ({ orderId: pair.ids.orderId, animalId: pair.ids.animalId, yardId: pair.ids.yardId }))
	const nextRecord: JsonRecord = {
		...record,
		body,
		content: body,
		copy: body,
		media: mediaItems.slice(),
		mediaItems: mediaItems.slice(),
		feedback: { kind: FEEDBACK_KINDS.FEEDING_EVIDENCE, associations, evidenceIds: newEvidence.map(item => item.evidenceId) },
		feedbackOrderIds: [...new Set(associations.map(item => item.orderId))],
		feedbackAnimalIds: [...new Set(associations.map(item => item.animalId))],
		yardId: associations[0].yardId,
	}
	if (existingDynamic && nextEvidence.length === 0) {
		return ok({ dynamicId: targetDynamicId, record: copy(existingDynamic), evidence: [], associations, summaries }, actor, { idempotent: true, wrote: false })
	}
	const nextRecords: unknown[] = existingDynamic
			? currentRecords.map(item => isRecord(item) && text(item.dynamicId || item.id) === targetDynamicId ? nextRecord : item)
		: [nextRecord, ...currentRecords]
	try {
		writePair(storage, [
			{ key: DYNAMIC_STORAGE_KEY, value: serialize(nextRecords) },
			{ key: FEEDBACK_EVIDENCE_STORAGE_KEY, value: serialize([...normalizedExisting, ...nextEvidence]) },
		])
	} catch (error) {
		return fail(errorCode(error, 'STORAGE_WRITE_FAILED'), '反馈未保存，请重试', actor)
	}
	const allNormalized = [...normalizedExisting, ...newEvidence]
	const finalSummaries = pairs.map(pair => summaryFor(
		normalizeEvidenceRows(relevantEvidenceRows(allNormalized, pair.ids, actor.id), pair.policy),
		actor,
		pair.ids,
		pair.policy,
		createdAt,
	))
	return ok({
		dynamicId: targetDynamicId,
		record: copy(nextRecord),
		evidence: newEvidence.map(copy),
		associations,
		summaries: finalSummaries,
		completedCount: finalSummaries.reduce((sum, item) => sum + item.completedCount, 0),
		requiredCount: finalSummaries.reduce((sum, item) => sum + item.requiredCount, 0),
		maximumCount: finalSummaries.reduce((sum, item) => sum + item.maximumCount, 0),
	}, actor, { idempotent: false, wrote: true })
}

/** Ordinary dynamic writer. It deliberately does not accept feedback fields. */
export function publishLocalDynamic({ content = '', mediaList, media, actorProvider, attemptKey, dynamicId, yardId, createdAt = new Date().toISOString(), storage }: DynamicPublishOptions = {}): PublishResult<DynamicPublishData> {
	const resolved = actorOf(actorProvider)
	if (resolved.error || !resolved.actor) return fail(errorCode(resolved.error, 'NO_ACTOR'), 'trusted actor is unavailable')
	const actor = resolved.actor
	const body = text(content)
	const mediaItems = mediaOf(mediaList || media)
	if (!body && !mediaItems.length) return fail('EMPTY_DYNAMIC', '动态正文或媒体至少需要一项', actor)
	const key = text(attemptKey)
	if (!validId(key)) return fail('MISSING_ATTEMPT_KEY', 'dynamic attemptKey is required', actor)
	let records: unknown[]
	try { records = readArray(storage, DYNAMIC_STORAGE_KEY).rows } catch (error) { return fail(errorCode(error, 'DYNAMIC_READ_FAILED'), '动态读取失败', actor) }
	let id
	try { id = dynamicIdFor('dynamic', actor.id, key, dynamicId) } catch (error) { return fail(errorCode(error, 'INVALID_DYNAMIC_ID'), '动态 ID 无效', actor) }
	const existing = records.find((item): item is JsonRecord => isRecord(item) && text(item.dynamicId || item.id) === id)
	if (existing) {
		if (idOrEmpty(existing.authorId) !== actor.id || existing.kind === 'feeding-feedback') return fail('DYNAMIC_ID_CONFLICT', '动态 ID 已属于其他发布', actor)
		return ok({ dynamicId: id, record: copy(existing) }, actor, { idempotent: true, wrote: false })
	}
	const record: JsonRecord = {
		id,
		dynamicId: id,
		kind: 'dynamic',
		visibility: 'public',
		authorId: actor.id,
		author: { id: actor.id },
		body,
		content: body,
		copy: body,
		media: mediaItems.slice(),
		mediaItems: mediaItems.slice(),
		attemptKey: key,
		createdAt,
		...(validId(yardId) ? { yardId: text(yardId) } : {}),
		comments: [],
		likeCount: 0,
	}
	try { writePair(storage, [{ key: DYNAMIC_STORAGE_KEY, value: serialize([record, ...records]) }]) } catch (error) { return fail(errorCode(error, 'STORAGE_WRITE_FAILED'), '动态未保存，请重试', actor) }
	return ok({ dynamicId: id, record: copy(record) }, actor, { idempotent: false, wrote: true })
}

export function readLocalFeedbackSummary({ order, animal, actorProvider, policy = LOCAL_FEEDBACK_POLICY, now = new Date().toISOString(), storage, requirePersistedAssociation = false }: FeedbackSummaryOptions = {}): PublishResult<FeedbackSummaryData | FeedbackSummaryData[]> {
	const resolved = actorOf(actorProvider)
	if (resolved.error || !resolved.actor) return fail(errorCode(resolved.error, 'NO_ACTOR'), 'trusted actor is unavailable')
	const actor = resolved.actor
	if (requirePersistedAssociation) {
		try {
			const pairs = readFeedbackContext({ order, animal, policy }, { storage, actor })
			const raw = relevantEvidenceRows(readRaw(storage), pairs[0].ids, actor.id)
			const data = pairs.length === 1
				? summaryFor(normalizeRows(raw, pairs[0].policy), actor, pairs[0].ids, pairs[0].policy, now)
				: pairs.map(pair => summaryFor(normalizeRows(relevantEvidenceRows(readRaw(storage), pair.ids, actor.id), pair.policy), actor, pair.ids, pair.policy, now))
			return { success: true, data, error: null, actor, readOnly: true, canWrite: false }
		} catch (error) { return fail(errorCode(error, 'FEEDBACK_READ_FAILED'), 'feedback count read failed closed', actor) }
	}
	const ids = associationOf(order, animal)
	if (!ids.orderId || !ids.animalId || !ids.yardId) return fail('MISSING_ASSOCIATION', 'feedback order, animal, and yard are required', actor)
	try {
		const normalizedPolicy = normalizeFeedbackPolicy(policy)
		const items = normalizeRows(readRaw(storage), normalizedPolicy)
		return { success: true, data: summaryFor(items, actor, ids, normalizedPolicy, now), error: null, actor, readOnly: true, canWrite: false }
	} catch (error) { return fail(errorCode(error, 'FEEDBACK_READ_FAILED'), 'feedback count read failed closed', actor) }
}

/** Compatibility helper for the old pure evidence tests. */
export function appendLocalFeedback(options: AppendFeedbackOptions = {}): PublishResult<FeedbackSummaryData | FeedbackPublishData> {
	// In a real uni-app runtime this always goes through the strict path. The
	// unbound branch preserves the old injected-storage unit seam while callers
	// migrate to publishLocalFeedback.
	if (options.requirePersistedAssociation === true || typeof uni !== 'undefined') return publishLocalFeedback(options)
	const { order, animal, actorProvider, policy = LOCAL_FEEDBACK_POLICY, attemptKey, requestId, evidenceId, dynamicId, createdAt = new Date().toISOString(), storage } = options
	const resolved = actorOf(actorProvider)
	if (resolved.error || !resolved.actor) return fail(errorCode(resolved.error, 'NO_ACTOR'), 'trusted actor is unavailable')
	const actor = resolved.actor
	const ids = associationOf(order, animal)
	if (!ids.orderId || !ids.animalId || !ids.yardId) return fail('MISSING_ASSOCIATION', 'feedback order, animal, and yard are required', actor)
	const suffix = text(attemptKey) || `attempt-${Date.now()}`
	let normalizedPolicy: FeedbackPolicy
	try { normalizedPolicy = normalizeFeedbackPolicy(policy) } catch (error) { return fail(errorCode(error, 'INVALID_EVIDENCE'), 'feedback evidence is invalid', actor) }
	const raw: JsonRecord = { evidenceId: evidenceId || `feedback-${ids.orderId}-${ids.animalId}-${suffix}`, dynamicId: dynamicId || `dynamic-${ids.orderId}-${ids.animalId}`, kind: FEEDBACK_KINDS.FEEDING_EVIDENCE, actorId: actor.id, policyVersion: normalizedPolicy.version, attemptKey: suffix, requestId: requestId || `request-${ids.orderId}-${ids.animalId}-${suffix}`, state: 'active', createdAt, order: { orderId: ids.orderId, animalId: ids.animalId, yardId: ids.yardId }, animal: { animalId: ids.animalId, yardId: ids.animalYardId || ids.yardId } }
	let normalized: NormalizedEvidence
	try { normalized = normalizeFeedbackEvidence(raw, normalizedPolicy) } catch (error) { return fail(errorCode(error, 'INVALID_EVIDENCE'), 'feedback evidence is invalid', actor) }
	const target = storageOf(storage)
	if (!target) return fail('STORAGE_UNAVAILABLE', 'feedback storage is unavailable', actor)
	let existing: NormalizedEvidence[]
	try { existing = normalizeRows(readRaw(target), normalizedPolicy) } catch (error) { return fail(errorCode(error, 'FEEDBACK_READ_FAILED'), 'existing feedback evidence is invalid', actor) }
	const sameId = existing.find(item => item.evidenceId === normalized.evidenceId)
	if (sameId && sameId.businessKey !== normalized.businessKey) return fail('DUPLICATE_EVIDENCE_ID', 'evidenceId belongs to another attempt', actor)
	const sameAttempt = existing.find(item => item.businessKey === normalized.businessKey)
	if (sameAttempt) return ok(summaryFor(existing, actor, ids, normalizedPolicy, createdAt), actor, { idempotent: true, wrote: false })
	try { target.setStorageSync(FEEDBACK_EVIDENCE_STORAGE_KEY, serialize([...existing.map(inputOf), raw])) } catch { return fail('STORAGE_WRITE_FAILED', 'feedback evidence append was not acknowledged', actor) }
	return ok(summaryFor([...existing, normalized], actor, ids, normalizedPolicy, createdAt), actor, { idempotent: false, wrote: true })
}
