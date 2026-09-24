export type RelationListTab = 'follow' | 'fans'

export interface RelationUserRow {
	pawId: string
	nickname: string
	avatar: string
	fansCount: number
	followed: boolean
}

export interface RelationsPageState {
	pageTitle: string
	ownerPawId: string
	listTab: RelationListTab
	followingRows: RelationUserRow[]
	fansRows: RelationUserRow[]
}

export interface RelationsRouteOptions {
	pageTitle: string
	ownerPawId: string
	listTab: RelationListTab
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function decodeRouteValue(value: unknown): string {
	const raw = typeof value === 'string'
		? value
		: typeof value === 'number' && Number.isFinite(value)
			? String(value)
			: ''
	try {
		return decodeURIComponent(raw)
	} catch {
		return raw
	}
}

export function normalizeRelationsRouteOptions(value: unknown): RelationsRouteOptions {
	const source = isRecord(value) ? value : {}
	const rawTab = typeof source.tab === 'string' ? source.tab.toLowerCase() : 'following'
	return {
		pageTitle: decodeRouteValue(source.nickname),
		ownerPawId: decodeRouteValue(source.userId || source.pawId),
		listTab: rawTab === 'fans' || rawTab === 'followers' ? 'fans' : 'follow'
	}
}

function createRelationRows(): RelationUserRow[] {
	return Array.from({ length: 5 }, (_, index) => ({
		pawId: String(23456789 + index),
		nickname: 'Q',
		avatar: '/static/figma/follow/avatar.png',
		fansCount: 315,
		followed: false
	}))
}

export function createRelationsPageMetadata(): RelationsPageState {
	const rows = createRelationRows()
	return {
		pageTitle: '',
		ownerPawId: '',
		listTab: 'follow',
		followingRows: rows.map((row) => ({ ...row })),
		fansRows: rows.map((row) => ({ ...row }))
	}
}
