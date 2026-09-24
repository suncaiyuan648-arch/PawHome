export interface DynamicMediaObjectMetadata extends Record<string, unknown> {
	id?: unknown
	url?: unknown
	src?: unknown
	path?: unknown
}

export type DynamicMediaInput = string | DynamicMediaObjectMetadata

export interface DynamicMediaViewerItem {
	id: string
	src: string
	original: DynamicMediaInput
}

export interface DynamicMediaPreviewPayload {
	item: DynamicMediaInput
	index: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function sourceOf(value: DynamicMediaInput): string {
	if (typeof value === 'string') return value.trim() ? value : ''
	for (const candidate of [value.url, value.src, value.path]) {
		if (typeof candidate === 'string' && candidate.trim()) return candidate
	}
	return ''
}

function idOf(value: DynamicMediaInput, index: number): string {
	if (typeof value === 'string') return String(index)
	const id = value.id
	if (typeof id === 'string' && id.trim()) return id
	if (typeof id === 'number' && Number.isFinite(id)) return String(id)
	return String(index)
}

export function createDynamicMediaViewerItems(items: readonly DynamicMediaInput[], fallback: string): DynamicMediaViewerItem[] {
	const normalized = items.flatMap((input, index) => {
		if (typeof input !== 'string' && !isRecord(input)) return []
		const original: DynamicMediaInput = input
		const src = sourceOf(original)
		return src ? [{ id: idOf(original, index), src, original }] : []
	})
	return normalized.length ? normalized : [{ id: 'fallback', src: fallback, original: fallback }]
}

export function readDynamicMediaIndex(event: unknown, mediaCount: number): number {
	if (!isRecord(event) || !isRecord(event.detail)) return 0
	const value = event.detail.current
	const index = typeof value === 'number'
		? value
		: typeof value === 'string' && value.trim()
			? Number(value)
			: Number.NaN
	if (!Number.isInteger(index)) return 0
	return Math.min(Math.max(index, 0), Math.max(mediaCount - 1, 0))
}

export function createDynamicMediaPreviewPayload(
	item: DynamicMediaViewerItem,
	index: number,
): DynamicMediaPreviewPayload {
	return { item: item.original, index }
}
