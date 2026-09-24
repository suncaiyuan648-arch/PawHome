/** Shared fixture and display metadata for home and yard announcements. */
export interface AnnouncementMetadata {
	id: string
	text: string
	feedingWeightJin?: number
}

export type AnnouncementInput = string | {
  id?: string | number
  _id?: string | number
  key?: string | number
  text?: string
  content?: string
  title?: string
  feedingWeightJin?: number
}
function isAnnouncementSource(value: AnnouncementRecord): value is Exclude<AnnouncementInput, string> {
  return ['id', '_id', 'key'].every(key => value[key] === undefined || typeof value[key] === 'string' || typeof value[key] === 'number')
    && ['text', 'content', 'title'].every(key => value[key] === undefined || typeof value[key] === 'string')
    && (value.feedingWeightJin === undefined || typeof value.feedingWeightJin === 'number')
}

export type AnnouncementRecordInput = Exclude<AnnouncementInput, string>

export interface NormalizedAnnouncement {
	id: string
	text: string
	raw: AnnouncementRecordInput
}

type AnnouncementRecord = Record<string, unknown>

function isRecord(value: unknown): value is AnnouncementRecord {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isUnknownArray(value: unknown): value is unknown[] {
	return Array.isArray(value)
}

/** Parse JSON response bodies and keep the parser result behind an unknown boundary. */
export function parseAnnouncementPayload(payload: unknown): unknown {
	if (typeof payload !== 'string') return payload
	try {
		const parsed: unknown = JSON.parse(payload)
		return parsed
	} catch {
		return payload
	}
}

/** Accept the common API wrappers used by both polling and socket sources. */
export function extractAnnouncementItems(payload: unknown): unknown[] {
	const value = parseAnnouncementPayload(payload)
	if (isUnknownArray(value)) return value
	if (!value) return []
	if (!isRecord(value)) return [value]

	for (const key of ['items', 'notices', 'announcements', 'data'] as const) {
		const candidate = value[key]
		if (isUnknownArray(candidate)) return candidate
	}

	if (isRecord(value.data)) return extractAnnouncementItems(value.data)
	return [value]
}

/** Normalize legacy strings and API records into the marquee's queue shape. */
export function normalizeAnnouncement(item: unknown): NormalizedAnnouncement | null {
	if (item === null || item === undefined) return null

	const source: AnnouncementRecord = isRecord(item)
		? item
		: Array.isArray(item)
			? {}
			: { text: item }
	const text = String(source.text || source.content || source.title || '').trim()
	if (!text) return null

	const rawId = source.id || source._id || source.key || text
	return {
		id: String(rawId),
		text,
		raw: isAnnouncementSource(source) ? source : { id: String(rawId), text },
	}
}

/** Return a structured weight, or infer one from legacy announcement copy. */
export function getAnnouncementFeedingWeightJin(item: AnnouncementRecordInput | null | undefined): number | null {
	const source = item || {}
	const weight = source.feedingWeightJin
	if (weight !== undefined && weight !== null) return Number(String(weight))

	const copy = String(source.text || source.content || source.title || '')
	const match = copy.match(/(?:投粮|投喂)\s*(\d+(?:\.\d+)?)\s*(公斤|千克|kg|斤|克|g)/i)
	if (!match) return null

	const amount = Number(match[1])
	const unit = match[2]
	if (/^(公斤|千克|kg)$/i.test(unit)) return amount * 2
	if (/^(克|g)$/i.test(unit)) return amount / 500
	return amount
}

export function normalizeAnnouncementItems(value: unknown): Exclude<AnnouncementInput, string>[] {
  return extractAnnouncementItems(value).flatMap(item => {
    const parsed = normalizeAnnouncement(item)
    return parsed ? [parsed.raw] : []
  })
}
