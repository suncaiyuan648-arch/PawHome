import type { HomeFeedTemplateMetadata } from '@/utils/homeFeedMockData.ts'

export type HistoryTabKey = 'feed' | 'yard'
export type HistoryRouteState = 'yard' | 'empty' | null

export interface HistoryFeedItem extends HomeFeedTemplateMetadata {
	dynamicId: string
	userAvatar: string
	userName: string
	pawId: string
	yardId: string
}

export interface HistoryGalleryItem {
	img: string
	caption: string
}

interface HistoryYardBase {
	yardId: string
	yardName?: string
	userAvatar: string
	userName: string
	pawId: string
	verified: boolean
	distance: string
	district: string
	desc: string
	gallery: HistoryGalleryItem[]
}

export interface HistoryBadgeYard extends HistoryYardBase {
	variant: 'badges'
	badges: string[]
}

export interface HistoryOrganizationYard extends HistoryYardBase {
	variant: 'org'
	orgName: string
}

export type HistoryYardItem = HistoryBadgeYard | HistoryOrganizationYard

export interface HistoryProfileTarget {
	pawId: string
	userName: string
	userAvatar: string
}

export interface HistoryPageState {
	activeTab: HistoryTabKey
	feedList: HistoryFeedItem[]
	yardList: HistoryYardItem[]
}

const DEFAULT_HISTORY_FEED: readonly HistoryFeedItem[] = [
	{
		dynamicId: 'history-dynamic-1',
		cover: '/static/figma/history/white-cat.jpg',
		title: '小猫吃的好开心',
		distance: '3.2km',
		district: '金水区',
		userAvatar: '/static/figma/history/user.png',
		userName: '朝阳小区猫猫队',
		pawId: '100001',
		yardId: '1',
		likes: 37,
		liked: false
	},
	{
		dynamicId: 'history-dynamic-2',
		cover: '/static/figma/history/food.jpg',
		title: '小院午后阳光正好',
		distance: '1.8km',
		district: '二七区',
		userAvatar: '/static/figma/history/user.png',
		userName: '朝阳小区猫猫队',
		pawId: '100001',
		yardId: '2',
		likes: 32,
		liked: true
	},
	{
		dynamicId: 'history-dynamic-3',
		cover: '/static/figma/history/pattern.jpg',
		title: '今天多喂了一点粮',
		distance: '5.0km',
		district: '中原区',
		userAvatar: '/static/figma/history/user.png',
		userName: '朝阳小区猫猫队',
		pawId: '100001',
		yardId: '1',
		likes: 24,
		liked: false
	},
	{
		dynamicId: 'history-dynamic-4',
		cover: '/static/figma/history/cat-bowl.png',
		title: '猫咪排队吃饭中',
		distance: '2.1km',
		district: '管城区',
		userAvatar: '/static/figma/history/user.png',
		userName: '朝阳小区猫猫队',
		pawId: '100001',
		yardId: '1',
		likes: 41,
		liked: true
	},
	{
		dynamicId: 'history-dynamic-5',
		cover: '/static/figma/history/food.jpg',
		title: '新来的橘猫很乖',
		distance: '4.5km',
		district: '惠济区',
		userAvatar: '/static/figma/history/user.png',
		userName: '朝阳小区猫猫队',
		pawId: '100001',
		yardId: '2',
		likes: 18,
		liked: false
	},
	{
		dynamicId: 'history-dynamic-6',
		cover: '/static/figma/history/cat-bowl.png',
		title: '投喂记录打卡',
		distance: '900m',
		district: '高新区',
		userAvatar: '/static/figma/history/user.png',
		userName: '朝阳小区猫猫队',
		pawId: '100001',
		yardId: '1',
		likes: 56,
		liked: false
	}
]

const DEFAULT_HISTORY_YARDS: readonly HistoryYardItem[] = [
	{
		yardId: '1',
		userAvatar: '/static/figma/home/yard-avatar.png',
		userName: '我就是要喂猫',
		pawId: 'yard_owner_001',
		verified: true,
		distance: '3.2km',
		district: '金水区',
		variant: 'badges',
		badges: ['6只猫咪', '已成立2个月', '入驻4人'],
		desc: '春去秋来二十年的救助流浪猫时间匆匆而去，在此希望每个...',
		gallery: Array.from({ length: 4 }, () => ({ img: '/static/figma/history-yard-gallery.png', caption: '开饭了开饭了开饭' }))
	},
	{
		yardId: '2',
		userAvatar: '/static/figma/home/yard-avatar.png',
		userName: '我就是要喂猫',
		pawId: 'yard_owner_001',
		verified: true,
		distance: '3.2km',
		district: '金水区',
		variant: 'org',
		orgName: '合肥市希望流浪动物基地',
		desc: '春去秋来二十年的救助流浪猫时间匆匆而去，在此希望每个...',
		gallery: Array.from({ length: 4 }, () => ({ img: '/static/figma/history-yard-gallery.png', caption: '开饭了开饭了开饭' }))
	}
]

const HISTORY_FEED_COVERS = [
	'/static/figma/history-feed-1.png?v=2',
	'/static/figma/history-feed-2.png?v=2',
	'/static/figma/history-feed-3.png?v=2',
	'/static/figma/history-feed-4.png?v=2'
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function cloneHistoryYards(): HistoryYardItem[] {
	return DEFAULT_HISTORY_YARDS.map((item) => ({
		...item,
		gallery: item.gallery.map((galleryItem) => ({ ...galleryItem })),
		...(item.variant === 'badges' ? { badges: [...item.badges] } : {})
	}))
}

export function createHistoryFeedMocks(): HistoryFeedItem[] {
	return DEFAULT_HISTORY_FEED.map((item) => ({ ...item }))
}

export function createHistoryYardMocks(): HistoryYardItem[] {
	return cloneHistoryYards()
}

export function createHistoryFeedDisplayMocks(items: readonly HistoryFeedItem[]): HistoryFeedItem[] {
	return items.slice(0, HISTORY_FEED_COVERS.length).map((item, index) => ({
		...item,
		cover: HISTORY_FEED_COVERS[index] || HISTORY_FEED_COVERS[0],
		title: '小猫吃的好开心',
		distance: '3.2km',
		district: '金水区',
		likes: index === 1 ? 32 : 37,
		liked: index === 1
	}))
}

export function createHistoryPageMetadata(): HistoryPageState {
	return {
		activeTab: 'feed',
		feedList: createHistoryFeedMocks(),
		yardList: createHistoryYardMocks()
	}
}

export function normalizeHistoryRouteState(value: unknown): HistoryRouteState {
	if (!isRecord(value)) return null
	const state = value.state
	return state === 'yard' || state === 'empty' ? state : null
}
