export type SearchTabKey = 'dynamic' | 'yard' | 'user'

export interface SearchTab {
	key: SearchTabKey
	label: string
}

export interface SearchPageState {
	pageState: string
	keyword: string
	latestSearchKeyword: string
	historyList: string[]
	editMode: boolean
	hasSearched: boolean
	showDeleteAllDialog: boolean
	activeTab: SearchTabKey
	tabs: SearchTab[]
}

export interface SearchRouteOptions {
	pageState: string
	popup: string
}

const DEMO_SEARCH_HISTORY: readonly string[] = ['狸花猫', '545876656', '幸福小区', '年糕', '朝阳小区喂猫小院', '喂猫日记', '阿平的喂猫日记']

const SEARCH_TABS: readonly SearchTab[] = [
	{ key: 'dynamic', label: '动态' },
	{ key: 'yard', label: '小院' },
	{ key: 'user', label: '用户' }
]

export function createSearchTabs(): SearchTab[] {
	return SEARCH_TABS.map((tab) => ({ ...tab }))
}

export function createSearchPageMetadata(): SearchPageState {
	return {
		pageState: '',
		keyword: '',
		latestSearchKeyword: '',
		historyList: [],
		editMode: false,
		hasSearched: false,
		showDeleteAllDialog: false,
		activeTab: 'dynamic',
		tabs: createSearchTabs()
	}
}

export function createDemoSearchHistory(): string[] {
	return [...DEMO_SEARCH_HISTORY]
}

export function normalizeSearchHistory(value: unknown): string[] {
	if (!Array.isArray(value)) return []
	return value.filter((entry): entry is string => typeof entry === 'string' && Boolean(entry))
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function routeText(value: unknown): string {
	if (typeof value === 'string') return value
	if (typeof value === 'number' && Number.isFinite(value)) return String(value)
	return ''
}

export function normalizeSearchRouteOptions(value: unknown): SearchRouteOptions {
	const route = isRecord(value) ? value : {}
	return {
		pageState: routeText(route.state),
		popup: routeText(route.popup)
	}
}

export function isSearchTabKey(value: string): value is SearchTabKey {
	return SEARCH_TABS.some((tab) => tab.key === value)
}
