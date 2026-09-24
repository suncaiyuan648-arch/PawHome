/**
 * Dynamic detail read boundary.
 *
 * The detail page, its message bridge, and its task entry all resolve the
 * current record from `PAWHOME_DYNAMIC_RECORDS`. A route/query value only
 * identifies a record; it never supplies the author, yard, body, media, or
 * comments. Missing, malformed, or inaccessible records fail closed.
 */

type JsonRecord = Record<string, unknown>
export type DynamicReadCode = 'OK' | 'INVALID_ID' | 'STORAGE_READ_FAILED' | 'READER_MISSING' | 'INVALID_STORAGE' | 'NOT_FOUND' | 'AUTH_REQUIRED' | 'FORBIDDEN'

interface DynamicReadResult {
	readonly code: DynamicReadCode
	readonly record: JsonRecord | null
}

export interface DynamicReadOptions {
	readonly actor?: unknown
	readonly requireActor?: boolean
	readonly allowPublic?: boolean
}

type ReadOptions = DynamicReadOptions

interface StoredRows {
	readonly code: 'STORAGE_READ_FAILED' | 'READER_MISSING' | 'INVALID_STORAGE' | null
	readonly rows: readonly unknown[]
}

interface NormalizedYard extends JsonRecord {
	readonly id: unknown
	readonly name: unknown
	readonly avatar: unknown
	readonly owner: unknown
	readonly pets: readonly unknown[]
	readonly announcementItems: readonly unknown[]
	readonly feeders: readonly unknown[]
	readonly rankItems: readonly unknown[]
}

interface NormalizedAuthor extends JsonRecord {
	readonly name: unknown
	readonly avatar: unknown
}

interface NormalizedDynamicRecord extends JsonRecord {
	readonly dynamicId: unknown
	readonly yardId: string
	readonly yard: NormalizedYard
	readonly author: NormalizedAuthor
	readonly currentUser: { readonly avatar: unknown }
	readonly mediaItems: readonly string[]
	readonly comments: readonly unknown[]
	readonly copy: string
	readonly meta: string
	readonly feedingSource: string
	readonly feedSummary: string
	readonly likes: number
	readonly liked: boolean
	readonly commentsTotal: number
	readonly announcementItems: readonly unknown[]
	readonly feeders: readonly unknown[]
	readonly rankItems: readonly unknown[]
}

export const STORAGE_KEY = 'PAWHOME_DYNAMIC_RECORDS'
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const ANONYMOUS_IDS = new Set(['anonymous', 'anon', 'guest', 'unknown', '匿名', '匿名用户'])

function isRecord(value: unknown): value is JsonRecord {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function validId(value: unknown): value is string {
	return typeof value === 'string' && value === value.trim() && SAFE_ID.test(value) && !URL_MARKERS.test(value)
}

function actorId(actor: unknown): string {
	if (!isRecord(actor)) return ''
	const value = actor.id || actor.actorId
	return validId(value) && !ANONYMOUS_IDS.has(value.toLowerCase()) ? value : ''
}

function readRows(): StoredRows {
	let raw: unknown
	try {
		raw = typeof uni !== 'undefined' && uni && typeof uni.getStorageSync === 'function'
			? uni.getStorageSync(STORAGE_KEY)
			: undefined
	} catch {
		return { code: 'STORAGE_READ_FAILED', rows: [] }
	}
	if (raw === undefined || raw === null || raw === '') return { code: 'READER_MISSING', rows: [] }
	try {
		const rows: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
		return Array.isArray(rows) ? { code: null, rows } : { code: 'INVALID_STORAGE', rows: [] }
	} catch {
		return { code: 'INVALID_STORAGE', rows: [] }
	}
}

function owns(record: JsonRecord, id: string): boolean {
	if (!id) return false
	const directOwnership = [record.authorId, record.userId, record.userPawId, record.ownerId].includes(id)
	const author = isRecord(record.author) ? record.author : null
	const nestedOwnership = author !== null && [author.id, author.pawId]
		.some(value => Boolean(value) && !ANONYMOUS_IDS.has(String(value).toLowerCase()) && value === id)
	return directOwnership || nestedOwnership
}

function canRead(
	record: JsonRecord,
	actor: unknown,
	{ allowPublic = true, requireActor = true }: { allowPublic?: boolean; requireActor?: boolean } = {},
): boolean {
	const id = actorId(actor)
	if (owns(record, id)) return true
	const allowed = Array.isArray(record.readerIds) ? record.readerIds : record.allowedActorIds
	if (id && Array.isArray(allowed) && allowed.includes(id)) return true
	if (!allowPublic || record.visibility === 'private' || record.access === 'private' || record.public === false) return false
	return !requireActor || Boolean(id) || record.visibility === 'public' || record.public === true
}

function readOptions(value: unknown): ReadOptions {
	return isRecord(value) ? value : {}
}

/**
 * Read one current dynamic record. `requireActor` is false only for the
 * public detail page; private records still require a matching actor.
 */
export function readDynamicRecord(dynamicId: string, options: DynamicReadOptions = {}): DynamicReadResult {
	if (!validId(dynamicId)) return { code: 'INVALID_ID', record: null }
	const input = readOptions(options)
	const actor = input.actor === undefined ? null : input.actor
	const requireActor = input.requireActor === undefined ? true : Boolean(input.requireActor)
	const allowPublic = input.allowPublic === undefined ? true : Boolean(input.allowPublic)
	const source = readRows()
	if (source.code) return { code: source.code, record: null }
	const candidate = source.rows.find(item => isRecord(item) && (item.dynamicId === dynamicId || item.id === dynamicId))
	if (!isRecord(candidate)) return { code: 'NOT_FOUND', record: null }
	if (requireActor && !actorId(actor)) return { code: 'AUTH_REQUIRED', record: null }
	if (!canRead(candidate, actor, { allowPublic, requireActor })) return { code: 'FORBIDDEN', record: null }
	return { code: 'OK', record: Object.freeze({ ...candidate, dynamicId: candidate.dynamicId || candidate.id || dynamicId }) }
}

function arrayOrEmpty(value: unknown): unknown[] {
	return Array.isArray(value) ? value : []
}

function normalizeMediaItem(item: unknown): string | undefined {
	if (typeof item === 'string') return item || undefined
	if (!isRecord(item)) return undefined
	return [item.url, item.src, item.path]
		.find((source): source is string => typeof source === 'string' && Boolean(source.trim()))
}

/** Build the defensive display model consumed by the dynamic detail page. */
export function normalizeDynamicRecord(input: unknown): NormalizedDynamicRecord | null {
	if (!isRecord(input)) return null
	const record = input
	const author = isRecord(record.author) ? record.author : {}
	const yard = isRecord(record.yard) ? record.yard : {}
	const mediaSource = Array.isArray(record.mediaItems) ? record.mediaItems
		: Array.isArray(record.media) ? record.media
			: arrayOrEmpty(record.mediaPaths)
	const mediaItems = mediaSource
		.map(normalizeMediaItem)
		.filter((source): source is string => typeof source === 'string')
	const comments = arrayOrEmpty(record.comments)
	const yardId = String(record.yardId || yard.id || '')
	const yardValue: NormalizedYard = Object.freeze({
		...yard,
		id: yard.id || yardId,
		name: yard.name || record.yardName || '',
		avatar: yard.avatar || record.yardAvatar || '',
		owner: yard.owner || (record.yardOwnerId ? { pawId: record.yardOwnerId } : undefined),
		pets: arrayOrEmpty(yard.pets),
		announcementItems: arrayOrEmpty(yard.announcementItems),
		feeders: arrayOrEmpty(yard.feeders),
		rankItems: arrayOrEmpty(yard.rankItems),
	})
	const normalizedAuthor: NormalizedAuthor = Object.freeze({
		...author,
		name: author.name || record.authorName || '',
		avatar: author.avatar || record.authorAvatar || '',
	})
	const likesValue = record.likeCount || record.likes
	const commentsTotalValue = record.commentsTotal || record.commentCount
	return Object.freeze({
		dynamicId: record.dynamicId || record.id,
		yardId,
		yard: yardValue,
		author: normalizedAuthor,
		currentUser: Object.freeze({ avatar: record.currentUserAvatar || '' }),
		mediaItems,
		comments,
		copy: String(record.copy || record.body || record.content || record.text || ''),
		meta: String(record.meta || record.createdLabel || [record.createdAt, record.location].filter(Boolean).join('  ')),
		feedingSource: String(record.feedingSource || record.sourceText || ''),
		feedSummary: String(record.feedSummary || ''),
		likes: Number.isFinite(Number(likesValue)) ? Number(likesValue) : 0,
		liked: record.liked === true,
		commentsTotal: Number.isFinite(Number(commentsTotalValue)) ? Number(commentsTotalValue) : comments.length,
		announcementItems: yardValue.announcementItems,
		feeders: yardValue.feeders,
		rankItems: yardValue.rankItems,
	})
}
