/**
 * Persisted notification records and stable business deep links.
 *
 * The notification package owns the message list.  A message is only a
 * routing envelope: the target page must re-read the current business record
 * through the package-local production reader before rendering or exposing
 * any action.  Keeping that reader local avoids hoisting every navigation
 * policy module into the main package when this page is compiled.
 * This store is append-only.  There is deliberately no delete, read-state,
 * or business mutation API here.
 */

type JsonRecord = Readonly<Record<string, unknown>>
export type MessageCategory = 'interaction' | 'order' | 'service' | 'system' | 'activity' | 'pet'
export type BusinessType = 'adoption' | 'rescue' | 'feeding' | 'dynamic'
type ActorRole = 'applicant' | 'owner' | 'reviewer' | 'cloud_parent' | 'yard_owner' | 'animal_manager'
type MessageRouteName = 'adoption.progress' | 'rescue.progress' | 'rescue.detail' | 'feeding.order.detail' | 'dynamic.detail'
type BusinessIdField = 'applicationId' | 'rescueId' | 'orderId' | 'dynamicId'

interface Actor {
	readonly id: string
	readonly roles: readonly ActorRole[]
}

interface DeepLink {
	readonly source: 'message'
	readonly businessType: BusinessType
	readonly businessId: string
	readonly targetKind?: 'progress'
	readonly routeName: MessageRouteName
	readonly url: string
}

interface MessageRecord {
	readonly messageId: string
	readonly eventKey?: string
	readonly recipientId?: string
	readonly category: MessageCategory
	readonly title: string
	readonly preview: string
	readonly createdAt: string
	readonly businessType: BusinessType
	readonly businessId: string
	readonly reviewItemId?: string
	readonly deepLink: DeepLink
}

export type MessageDraft = Omit<MessageRecord, 'deepLink'>
export interface MessageActionResult {
	readonly success: true
	readonly actorId: string
	readonly idempotencyKey?: string
	readonly actionId?: string
	readonly toStatus?: string
	readonly businessType?: BusinessType
	readonly businessId?: string
	readonly applicationId?: string
	readonly rescueId?: string
	readonly orderId?: string
	readonly dynamicId?: string
	readonly reviewItemId?: string
}

interface StoreError {
	readonly code: string
	readonly message: string
	readonly [key: string]: unknown
}

interface FailureResult {
	readonly success: false
	readonly data: unknown
	readonly error: StoreError
	readonly actor: Actor | null
	readonly readOnly: true
	readonly canWrite: false
	readonly diagnostics?: {
		readonly skipped: readonly MessageDiagnostic[]
	}
	readonly [key: string]: unknown
}

interface MessageDiagnostic {
	readonly index: number
	readonly code: string
}

interface MessageReadSuccess {
	readonly success: true
	readonly data: {
		readonly items: readonly MessageRecord[]
		readonly total: number
	}
	readonly error: null
	readonly actor: Actor
	readonly readOnly: true
	readonly canWrite: false
	readonly diagnostics: {
		readonly scanned: number
		readonly accepted: number
		readonly skipped: readonly MessageDiagnostic[]
	}
}

interface MessageItemSuccess {
	readonly success: true
	readonly data: { readonly item: MessageRecord }
	readonly error: null
	readonly actor: Actor
	readonly readOnly: true
	readonly canWrite: false
	readonly diagnostics: {
		readonly scanned: number
		readonly accepted: number
		readonly skipped: readonly MessageDiagnostic[]
	}
}

interface AppendSuccess {
	readonly success: true
	readonly data: { readonly item: MessageRecord }
	readonly error: null
	readonly readOnly: false
	readonly canWrite: true
	readonly idempotent: boolean
	readonly wrote: boolean
}

export interface ReadMessageOptions {
	readonly actorProvider?: () => unknown
	readonly category?: MessageCategory
}

export interface AppendMessageOptions {
	readonly authorize?: MessageAuthorizer
}

export interface ProduceMessageOptions {
	readonly action: MessageActionResult
	readonly recipientId: string
	readonly businessType: BusinessType
	readonly businessId: string
	readonly reviewItemId?: string
	readonly category?: MessageCategory
	readonly title: string
	readonly preview?: string
	readonly createdAt?: string
	readonly eventKey?: string
	readonly actorProvider?: () => unknown
	readonly authorize?: MessageProducerAuthorizer
}

export interface ResolveMessageOptions {
	readonly actorProvider?: () => unknown
	readonly readers?: Partial<Record<BusinessType, MessageCurrentReader>>
	readonly authorize?: MessageResolveAuthorizer
}

export interface ReaderContext {
	readonly businessType: BusinessType
	readonly businessId: string
	readonly actor: Actor
}

export interface ResolveContext {
	readonly actor: Actor
	readonly target: DeepLink
	readonly record: JsonRecord
}

type ResolveCurrentResult =
	| Readonly<{ status: 'ready'; code: 'OK'; actor: Actor; target: DeepLink; record: JsonRecord }>
	| Readonly<{ status: 'empty'; code: string; actor: Actor; target: DeepLink; record: null }>

interface ResolvedMessageReady {
	readonly success: true
	readonly status: 'ready'
	readonly data: {
		readonly item: MessageRecord
		readonly target: DeepLink
		readonly record: JsonRecord
	}
	readonly error: null
	readonly actor: Actor
	readonly readOnly: true
	readonly canWrite: false
}

interface ResolvedMessageEmpty {
	readonly success: false
	readonly status: 'empty'
	readonly data: {
		readonly item: MessageRecord
		readonly target: DeepLink
		readonly record: null
	}
	readonly error: StoreError
	readonly actor: Actor
	readonly readOnly: true
	readonly canWrite: false
}

export type ResolvedMessageResult = ResolvedMessageReady | ResolvedMessageEmpty

export interface EventChannel {
	emit(name: string, value: unknown): void
}

export type MessageCurrentReader = (context: ReaderContext) => unknown
type Reader = MessageCurrentReader
export type MessageAuthorizer = (message: MessageRecord) => boolean
export type MessageProducerAuthorizer = (context: Readonly<{
	actor: Actor
	action: MessageActionResult
	message: MessageRecord
}>) => boolean
export type MessageResolveAuthorizer = (context: ResolveContext) => boolean
type ProducerAuthorizer = MessageProducerAuthorizer
type ResolveAuthorizer = MessageResolveAuthorizer

interface RawRead {
	readonly rows: unknown[]
	readonly present: boolean
	readonly error: string | null
}

interface PersistedRows {
	readonly rows: unknown[]
	readonly present: boolean
	readonly error: string | null
}

interface LoadedRecord {
	readonly record: JsonRecord | null
	readonly error: string | null
}

export const MESSAGE_STORAGE_KEY = 'PAWHOME_MESSAGES'
export const MESSAGE_CATEGORIES: readonly string[] = Object.freeze([
	'interaction',
	'order',
	'service',
	'system',
	'activity',
	'pet',
])

const BUSINESS_TYPES: readonly BusinessType[] = Object.freeze(['adoption', 'rescue', 'feeding', 'dynamic'])
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const DANGEROUS_KEYS: ReadonlySet<string> = new Set(['__proto__', 'prototype', 'constructor'])
const ACTOR_ROLES: readonly ActorRole[] = Object.freeze([
	'applicant',
	'owner',
	'reviewer',
	'cloud_parent',
	'yard_owner',
	'animal_manager',
])
const MESSAGE_FIELDS: ReadonlySet<string> = new Set([
	'messageId',
	'eventKey',
	'recipientId',
	'category',
	'title',
	'preview',
	'createdAt',
	'businessType',
	'businessId',
	'reviewItemId',
	'legacyState',
	'actorRole',
	'outcome',
	'deepLink',
])

const SOURCE_KEYS: Readonly<Record<BusinessType, {
	readonly storageKey: string
	readonly fields: readonly string[]
}>> = Object.freeze({
	adoption: Object.freeze({ storageKey: 'PAWHOME_ADOPTIONS', fields: ['applicationId', 'id'] }),
	rescue: Object.freeze({ storageKey: 'PAWHOME_RESCUES', fields: ['rescueId', 'id'] }),
	feeding: Object.freeze({ storageKey: 'PAWHOME_REWARD_ORDERS', fields: ['orderId', 'id'] }),
	dynamic: Object.freeze({ storageKey: 'PAWHOME_DYNAMIC_RECORDS', fields: ['dynamicId', 'id'] }),
})

const BUSINESS_ID_FIELDS: Readonly<Record<BusinessType, BusinessIdField>> = Object.freeze({
	adoption: 'applicationId',
	rescue: 'rescueId',
	feeding: 'orderId',
	dynamic: 'dynamicId',
})

function own(value: object, key: string): boolean {
	return Object.prototype.hasOwnProperty.call(value, key)
}

function plain(value: unknown): value is JsonRecord {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
	const prototype = Object.getPrototypeOf(value)
	return prototype === Object.prototype || prototype === null
}

function isObjectLike(value: unknown): value is object {
	return value !== null && (typeof value === 'object' || typeof value === 'function')
}

function storeError(code: string, message: string, details: JsonRecord = {}): Error & { code: string } {
	const error = Object.assign(new Error(message), { code })
	Object.assign(error, details)
	return error
}

function errorCode(error: unknown, fallback: string): string {
	if (!isObjectLike(error)) return fallback
	const code = Reflect.get(error, 'code')
	return typeof code === 'string' && code ? code : fallback
}

function errorMessage(error: unknown, fallback: string): string {
	if (!isObjectLike(error)) return fallback
	const message = Reflect.get(error, 'message')
	return typeof message === 'string' && message ? message : fallback
}

function rejectDangerous(value: unknown, label: string): asserts value is JsonRecord {
	if (!plain(value)) throw storeError('INVALID_RECORD', label + ' must be a plain object')
	for (const key of Object.keys(value)) {
		if (DANGEROUS_KEYS.has(key)) throw storeError('PROTOTYPE_KEY', label + ' contains a prototype key')
	}
}

function freeze<T>(value: T, seen = new WeakSet<object>()): T {
	if (value === null || typeof value !== 'object' || seen.has(value)) return value
	seen.add(value)
	for (const key of Reflect.ownKeys(value)) freeze(Reflect.get(value, key), seen)
	return Object.freeze(value)
}

function fail(
	code: string,
	message: string,
	actor: Actor | null = null,
	data: unknown = null,
	extra: JsonRecord = {},
): FailureResult {
	const result: FailureResult = {
		success: false,
		data,
		error: { code, message },
		actor,
		readOnly: true,
		canWrite: false,
	}
	return freeze(Object.assign(result, extra))
}

function isMessageCategory(value: unknown): value is MessageCategory {
	return typeof value === 'string' && MESSAGE_CATEGORIES.some((candidate) => candidate === value)
}

function isBusinessType(value: unknown): value is BusinessType {
	return typeof value === 'string' && BUSINESS_TYPES.some((candidate) => candidate === value)
}

function isActorRole(value: unknown): value is ActorRole {
	return typeof value === 'string' && ACTOR_ROLES.some((candidate) => candidate === value)
}

function isReader(value: unknown): value is Reader {
	return typeof value === 'function'
}

function isMessageAuthorizer(value: unknown): value is MessageAuthorizer {
	return typeof value === 'function'
}

function isProducerAuthorizer(value: unknown): value is ProducerAuthorizer {
	return typeof value === 'function'
}

function isResolveAuthorizer(value: unknown): value is ResolveAuthorizer {
	return typeof value === 'function'
}

function isEventChannel(value: unknown): value is EventChannel {
	return plain(value) && typeof value.emit === 'function'
}

function isThenable(value: unknown): boolean {
	return isObjectLike(value) && typeof Reflect.get(value, 'then') === 'function'
}

function id(value: unknown, label: string, { allowEmpty = false }: { allowEmpty?: boolean } = {}): string {
	if (allowEmpty && (value === undefined || value === null || value === '')) return ''
	if (typeof value !== 'string' || !value || value !== value.trim() || !SAFE_ID.test(value) || URL_MARKERS.test(value)) {
		throw storeError(value ? 'INVALID_ID' : 'MISSING_ID', label + ' must be an opaque ID')
	}
	return value
}

function actorOf(provider: unknown): { actor: Actor | null; error: { code: string } | null } {
	let value: unknown
	try {
		value = typeof provider === 'function' ? provider() : null
	} catch {
		return { actor: null, error: { code: 'ACTOR_PROVIDER_FAILED' } }
	}
	const source = isRecordWithActor(value) ? value.actor : value
	if (!plain(source)) return { actor: null, error: { code: 'NO_ACTOR' } }
	const actorId = source.id || source.actorId
	const rawRoles: unknown[] = Array.isArray(source.roles)
		? source.roles
		: source.role === undefined ? [] : [source.role]
	if (
		typeof actorId !== 'string'
		|| !SAFE_ID.test(actorId)
		|| URL_MARKERS.test(actorId)
		|| rawRoles.some((role) => !isActorRole(role))
	) {
		return { actor: null, error: { code: 'INVALID_ACTOR' } }
	}
	const roles = rawRoles.filter(isActorRole)
	return { actor: freeze({ id: actorId, roles: [...new Set(roles)] }), error: null }
}

function isRecordWithActor(value: unknown): value is JsonRecord & { readonly actor: unknown } {
	return plain(value) && own(value, 'actor')
}

function deepLinkFor(input: {
	readonly businessType: BusinessType
	readonly businessId: string
	readonly reviewItemId?: string
}): DeepLink {
	const reviewTarget = input.businessType === 'adoption'
		? '/packages/adoption/pages/progress/index'
		: input.businessType === 'rescue'
			? '/packages/rescue/pages/progress/index'
			: ''
	const directTarget = input.businessType === 'adoption'
		? '/packages/adoption/pages/progress/index'
		: input.businessType === 'rescue'
			? '/packages/rescue/pages/detail/index'
			: input.businessType === 'feeding'
				? '/packages/feeding/pages/order/detail/index'
				: '/packages/dynamic/pages/deep-link/index'
	const target = input.reviewItemId ? reviewTarget : directTarget
	if (!target) throw storeError('INVALID_BUSINESS_TYPE', 'message deep-link target is unsupported')
	const field = input.businessType === 'adoption'
		? 'applicationId'
		: input.businessType === 'rescue'
			? 'rescueId'
			: input.businessType === 'feeding'
				? 'orderId'
				: 'dynamicId'
	let routeName: MessageRouteName
	if (input.businessType === 'adoption') routeName = 'adoption.progress'
	else if (input.businessType === 'rescue') routeName = input.reviewItemId ? 'rescue.progress' : 'rescue.detail'
	else if (input.businessType === 'feeding') routeName = 'feeding.order.detail'
	else routeName = 'dynamic.detail'
	const query = encodeURIComponent(field) + '=' + encodeURIComponent(input.businessId)
	const targetKind = input.businessType === 'rescue' && input.reviewItemId ? 'progress' : undefined
	const link: DeepLink = {
		source: 'message',
		businessType: input.businessType,
		businessId: input.businessId,
		...(targetKind ? { targetKind } : {}),
		routeName,
		url: target + '?' + query,
	}
	return freeze(link)
}

function messageInput(value: unknown, { requireRecipient = true }: { requireRecipient?: boolean } = {}): MessageRecord {
	rejectDangerous(value, 'message')
	for (const key of Object.keys(value)) {
		if (!MESSAGE_FIELDS.has(key)) throw storeError('UNKNOWN_FIELD', 'Unknown message field: ' + key)
	}
	const messageId = id(value.messageId, 'messageId')
	const recipientId = requireRecipient
		? id(value.recipientId, 'recipientId')
		: id(value.recipientId, 'recipientId', { allowEmpty: true })
	const category = value.category
	if (!isMessageCategory(category)) throw storeError('INVALID_CATEGORY', 'message category is unsupported')
	const title = value.title
	if (typeof title !== 'string' || !title.trim() || title.length > 120) {
		throw storeError('INVALID_TITLE', 'message title is invalid')
	}
	const preview = value.preview
	if (typeof preview !== 'string' || preview.length > 240) throw storeError('INVALID_PREVIEW', 'message preview is invalid')
	const createdAt = value.createdAt
	if (typeof createdAt !== 'string' || !createdAt.trim() || createdAt.length > 64) {
		throw storeError('INVALID_TIMESTAMP', 'message createdAt is invalid')
	}
	const eventKey = value.eventKey === undefined ? undefined : id(value.eventKey, 'eventKey')
	const businessType = value.businessType
	if (!isBusinessType(businessType)) throw storeError('MISSING_BUSINESS_TYPE', 'message businessType is required')
	const businessId = id(value.businessId, 'businessId')
	const reviewItemId = value.reviewItemId === undefined ? '' : id(value.reviewItemId, 'reviewItemId')
	const deepLink = deepLinkFor({
		businessType,
		businessId,
		...(reviewItemId ? { reviewItemId } : {}),
	})
	const record: MessageRecord = {
		messageId,
		...(eventKey === undefined ? {} : { eventKey }),
		...(recipientId ? { recipientId } : {}),
		category,
		title: title.trim(),
		preview,
		createdAt: createdAt.trim(),
		businessType,
		businessId,
		...(reviewItemId ? { reviewItemId } : {}),
		deepLink,
	}
	return freeze(record)
}

function readRaw(): RawRead {
	if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') {
		return { rows: [], present: false, error: null }
	}
	let raw: unknown
	try {
		raw = uni.getStorageSync<unknown>(MESSAGE_STORAGE_KEY)
	} catch {
		return { rows: [], present: true, error: 'STORAGE_READ_FAILED' }
	}
	if (raw === undefined || raw === null || raw === '') return { rows: [], present: false, error: null }
	try {
		const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
		if (!Array.isArray(parsed)) return { rows: [], present: true, error: 'INVALID_STORAGE' }
		return { rows: parsed, present: true, error: null }
	} catch {
		return { rows: [], present: true, error: 'INVALID_STORAGE' }
	}
}

function writeRaw(rows: readonly unknown[]): void {
	if (typeof uni === 'undefined' || !uni || typeof uni.setStorageSync !== 'function') {
		throw storeError('WRITER_MISSING', 'message storage writer is unavailable')
	}
	try {
		uni.setStorageSync(MESSAGE_STORAGE_KEY, JSON.stringify(rows))
	} catch {
		throw storeError('STORAGE_WRITE_FAILED', 'message storage write was not acknowledged')
	}
}

function persistedRows(key: string): PersistedRows {
	if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') {
		return { present: false, rows: [], error: null }
	}
	let raw: unknown
	try {
		raw = uni.getStorageSync<unknown>(key)
	} catch {
		return { present: true, rows: [], error: 'STORAGE_READ_FAILED' }
	}
	if (raw === undefined || raw === null || raw === '') return { present: false, rows: [], error: null }
	try {
		const value: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
		return Array.isArray(value)
			? { present: true, rows: value, error: null }
			: { present: true, rows: [], error: 'INVALID_STORAGE' }
	} catch {
		return { present: true, rows: [], error: 'INVALID_STORAGE' }
	}
}

function currentRecord(type: BusinessType, businessId: string, actor: Actor, readers: ResolveMessageOptions['readers']): LoadedRecord {
	const readerMap = readers || {}
	const injected = readerMap[type]
	if (injected !== undefined && !isReader(injected)) return { record: null, error: 'INVALID_READER' }
	if (isReader(injected)) {
		try {
			const result = injected(Object.freeze({ businessType: type, businessId, actor }))
			if (isThenable(result)) return { record: null, error: 'ASYNC_READER_UNSUPPORTED' }
			if (!result) return { record: null, error: 'NOT_FOUND' }
			if (!plain(result)) return { record: null, error: 'INVALID_RECORD' }
			return { record: result, error: null }
		} catch (error) {
			return { record: null, error: errorCode(error, 'READER_FAILED') }
		}
	}
	const sourceKeys = SOURCE_KEYS[type]
	const keys = type === 'feeding'
		? ['PAWHOME_REWARD_ORDERS', 'PAWHOME_FEEDING_ORDERS']
		: [sourceKeys.storageKey]
	for (const key of keys) {
		const loaded = persistedRows(key)
		if (loaded.error) return { record: null, error: loaded.error }
		if (!loaded.present) continue
		const found = loaded.rows.find(
			(item): item is JsonRecord => plain(item) && sourceKeys.fields.some((field) => item[field] === businessId),
		)
		if (found) {
			const identity = BUSINESS_ID_FIELDS[type]
			const identityValue = found[identity]
			const record: JsonRecord = {
				...found,
				[identity]: typeof identityValue === 'string' && identityValue
					? identityValue
					: typeof found.id === 'string' && found.id ? found.id : businessId,
			}
			return { record: freeze(record), error: null }
		}
	}
	return { record: null, error: 'READER_MISSING' }
}

function scoped(row: MessageRecord, actorId: string): boolean {
	return row.recipientId === actorId
}

function scalarIds(values: readonly unknown[]): string[] {
	return values
		.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
		.map((value) => value.trim())
}

function applicantIds(record: JsonRecord): string[] {
	const nested = plain(record.applicant) ? [record.applicant.id, record.applicant.pawId] : []
	return scalarIds([record.applicantId, record.applicantUserId, record.userId, ...nested])
}

function reviewItemIds(record: JsonRecord): string[] {
	const review = plain(record.review) ? record.review : null
	return scalarIds([record.reviewItemId, ...(review ? [review.reviewItemId] : [])])
}

function genericActorIds(record: JsonRecord): string[] {
	const nested = plain(record.applicant) ? [record.applicant.id, record.applicant.pawId] : []
	return scalarIds([
		record.applicantId,
		record.applicantUserId,
		record.userId,
		record.userPawId,
		record.donorId,
		record.ownerId,
		record.ownerPawId,
		record.yardOwnerId,
		record.authorId,
		...nested,
	])
}

function recordAllowsMessage(item: MessageRecord, record: JsonRecord, actorId: string): boolean {
	if (item.reviewItemId) {
		const reviewIds = reviewItemIds(record)
		const applicant = applicantIds(record)
		return reviewIds.length > 0
			&& new Set(reviewIds).size === 1
			&& reviewIds[0] === item.reviewItemId
			&& applicant.length > 0
			&& new Set(applicant).size === 1
			&& applicant[0] === actorId
	}
	return genericActorIds(record).includes(actorId) || item.category === 'system' || item.category === 'activity'
}

function resolveCurrentMessage(
	item: MessageRecord,
	actor: Actor,
	readers: ResolveMessageOptions['readers'],
	authorize: ResolveAuthorizer | undefined,
): ResolveCurrentResult {
	const loaded = currentRecord(item.businessType, item.businessId, actor, readers)
	if (loaded.error || loaded.record === null) {
		return { status: 'empty', code: loaded.error || 'NOT_FOUND', actor, target: item.deepLink, record: null }
	}
	const target = item.deepLink
	const allowed = authorize
		? (() => {
			try {
				return authorize(Object.freeze({ actor, target, record: loaded.record })) === true
			} catch {
				return false
			}
		})()
		: recordAllowsMessage(item, loaded.record, actor.id)
	if (!allowed) return { status: 'empty', code: 'FORBIDDEN', actor, target, record: null }
	return { status: 'ready', code: 'OK', actor, target, record: loaded.record }
}

/** Read current actor's notification envelopes. */
export function readMessages(
	{ actorProvider, category }: ReadMessageOptions = {},
): MessageReadResult {
	const resolved = actorOf(actorProvider)
	if (resolved.error || resolved.actor === null) {
		return fail(resolved.error?.code || 'NO_ACTOR', 'trusted actor is unavailable')
	}
	const actor = resolved.actor
	if (category !== undefined && !isMessageCategory(category)) {
		return fail('INVALID_CATEGORY', 'message category is unsupported', actor)
	}
	const raw = readRaw()
	if (raw.error) return fail(raw.error, 'message storage could not be read', actor)
	const items: MessageRecord[] = []
	const skipped: MessageDiagnostic[] = []
	for (const [index, value] of raw.rows.entries()) {
		try {
			const normalized = messageInput(value)
			if (normalized.category !== category && category !== undefined) continue
			if (scoped(normalized, actor.id)) items.push(normalized)
		} catch (error) {
			skipped.push({ index, code: errorCode(error, 'INVALID_MESSAGE') })
		}
	}
	items.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
	return freeze({
		success: true,
		data: { items, total: items.length },
		error: null,
		actor,
		readOnly: true,
		canWrite: false,
		diagnostics: { scanned: raw.rows.length, accepted: items.length, skipped },
	})
}

type MessageReadResult = FailureResult | MessageReadSuccess

export function readMessageById(
	messageId: string,
	{ actorProvider }: ReadMessageOptions = {},
): FailureResult | MessageItemSuccess {
	let target: string
	try {
		target = id(messageId, 'messageId')
	} catch (error) {
		return fail(errorCode(error, 'INVALID_ID'), 'message ID is invalid')
	}
	const result = readMessages({ actorProvider })
	if (!result.success) return result
	const item = result.data.items.find((value) => value.messageId === target)
	return item
		? freeze({ ...result, data: { item }, readOnly: true, canWrite: false })
		: fail('NOT_FOUND', 'message was not found', result.actor)
}

/**
 * Append one message only after a domain producer explicitly authorizes it.
 * authorize receives the frozen canonical envelope and must return true.
 * The same messageId/eventKey is idempotent; no replacement or deletion is
 * performed on a retry.
 */
export function appendMessage(
	message: MessageDraft,
	{ authorize }: AppendMessageOptions = {},
): FailureResult | AppendSuccess {
	let normalized: MessageRecord
	try {
		normalized = messageInput(message)
	} catch (error) {
		return fail(errorCode(error, 'INVALID_MESSAGE'), errorMessage(error, 'message is invalid'))
	}
	if (!isMessageAuthorizer(authorize)) return fail('WRITER_MISSING', 'message producer authorization is unavailable')
	let approved: boolean
	try {
		approved = authorize(normalized) === true
	} catch {
		return fail('AUTHORIZATION_FAILED', 'message producer authorization failed')
	}
	if (!approved) return fail('FORBIDDEN', 'message producer authorization was denied')
	const raw = readRaw()
	if (raw.error) return fail(raw.error, 'message storage could not be read')
	const existing = raw.rows
		.map((row): MessageRecord | null => {
			try {
				return messageInput(row)
			} catch {
				return null
			}
		})
		.filter((row): row is MessageRecord => row !== null)
	const duplicate = existing.find((row) => (
		row.messageId === normalized.messageId
		|| (normalized.eventKey !== undefined && row.eventKey === normalized.eventKey)
	))
	if (duplicate) {
		return freeze({
			success: true,
			data: { item: duplicate },
			error: null,
			readOnly: false,
			canWrite: true,
			idempotent: true,
			wrote: false,
		})
	}
	try {
		writeRaw([...raw.rows, normalized])
	} catch (error) {
		return fail(errorCode(error, 'STORAGE_WRITE_FAILED'), errorMessage(error, 'message write failed'))
	}
	return freeze({
		success: true,
		data: { item: normalized },
		error: null,
		readOnly: false,
		canWrite: true,
		idempotent: false,
		wrote: true,
	})
}

/**
 * Domain action producer for the local-only integration boundary.  Callers
 * must provide the successful action result and an explicit authorization
 * predicate.  The current trusted actor is re-read here, so a stale page
 * cannot emit a notification after the account has switched.  This function
 * never performs the business action itself and remains idempotent through
 * eventKey/messageId in appendMessage.
 */
export function produceLocalActionNotification({
	action,
	recipientId,
	businessType,
	businessId,
	reviewItemId,
	category = 'system',
	title,
	preview = '',
	createdAt = new Date().toISOString(),
	eventKey,
	actorProvider,
	authorize,
}: ProduceMessageOptions): FailureResult | AppendSuccess {
	if (!plain(action) || action.success !== true || typeof action.actorId !== 'string' || !action.actorId) {
		return fail('ACTION_REQUIRED', 'a successful local action is required before producing a message')
	}
	const resolved = actorOf(actorProvider)
	if (resolved.error || resolved.actor === null) {
		return fail(resolved.error?.code || 'NO_ACTOR', 'trusted actor is unavailable', resolved.actor)
	}
	const actor = resolved.actor
	if (actor.id !== action.actorId) return fail('ACTOR_MISMATCH', 'the notification producer actor is stale', actor)
	const actionEventKey: unknown = eventKey || action.idempotencyKey || action.actionId
	const actionStatus = typeof action.toStatus === 'string' ? action.toStatus : 'updated'
	const fallbackMessageKey = String(businessType) + '-' + String(businessId) + '-' + actionStatus
	const messageId = 'message-' + (actionEventKey ? String(actionEventKey) : fallbackMessageKey)
	let normalized: MessageRecord
	try {
		normalized = messageInput({
			messageId,
			eventKey: actionEventKey,
			recipientId,
			category,
			title,
			preview,
			createdAt,
			businessType,
			businessId,
			...(reviewItemId ? { reviewItemId } : {}),
		})
	} catch (error) {
		return fail(errorCode(error, 'INVALID_MESSAGE'), errorMessage(error, 'message is invalid'), actor)
	}
	return appendMessage(normalized, {
		authorize: (message: MessageRecord) => {
			if (message.recipientId === actor.id) return true
			if (!isProducerAuthorizer(authorize)) return false
			try {
				return authorize(Object.freeze({ actor, action, message })) === true
			} catch {
				return false
			}
		},
	})
}

/** Resolve a message against the current actor and current business record. */
export function resolveMessageDestination(
	messageId: string,
	{ actorProvider, readers, authorize }: ResolveMessageOptions = {},
): FailureResult | ResolvedMessageResult {
	const message = readMessageById(messageId, { actorProvider })
	if (!message.success) return message
	const item = message.data.item
	const resolveAuthorizer = isResolveAuthorizer(authorize) ? authorize : undefined
	const invalidAuthorizer = authorize !== undefined && authorize !== null && resolveAuthorizer === undefined
	const resolved = resolveCurrentMessage(item, message.actor, readers, ({ actor, record }) => {
		if (invalidAuthorizer || item.recipientId !== actor.id) return false
		if (resolveAuthorizer) return resolveAuthorizer({ actor, target: item.deepLink, record })
		const publicDynamic = item.businessType === 'dynamic'
			&& record.visibility !== 'private'
			&& record.access !== 'private'
			&& record.public !== false
		return recordAllowsMessage(item, record, actor.id) || publicDynamic
	})
	if (resolved.status === 'ready' && resolved.record) {
		return freeze({ success: true, status: 'ready', data: { item, target: resolved.target, record: resolved.record }, error: null, actor: resolved.actor, readOnly: true, canWrite: false })
	}
	return freeze({ success: false, status: 'empty', data: { item, target: resolved.target, record: null }, error: { code: resolved.code, message: 'message target is unavailable' }, actor: resolved.actor, readOnly: true, canWrite: false })
}

/** Emit a resolved envelope over a WeChat eventChannel when available. */
export function emitMessageDeepLink(eventChannel: EventChannel, result: FailureResult | ResolvedMessageResult): boolean {
	if (!isEventChannel(eventChannel)
		|| result === null
		|| typeof result !== 'object'
		|| result.success !== true
		|| !plain(result.data)
		|| !result.data.target) return false
	try {
		eventChannel.emit('pawhome.message.deep-link', freeze({
			target: result.data.target,
			status: result.status,
			canWrite: false,
		}))
		return true
	} catch {
		return false
	}
}

export const createMessageRecord = messageInput
export const listMessages = readMessages
export const appendProducedMessage = appendMessage
export const produceActionNotification = produceLocalActionNotification
