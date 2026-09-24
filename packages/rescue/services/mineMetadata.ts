import type { MineFilter, MineItem, MineReadModel, MineStatus } from './mineReader.ts'

export interface RescueMineTab {
	key: MineFilter
	label: string
}

export type RescueMineStatusTone = 'success' | 'danger' | 'warning'

export interface RescueMineStatusPresentation {
	label: string
	tone: RescueMineStatusTone
}

export interface RescueMinePageState {
	activeFilter: MineFilter
	tabs: RescueMineTab[]
	model: Pick<MineReadModel, 'items' | 'pending' | 'processed'>
	actorError: MineReadModel['diagnostics']['actorError']
}

const MINE_TABS: readonly RescueMineTab[] = Object.freeze([
	{ key: 'all', label: '全部' },
	{ key: 'platform_pending', label: '审核中' },
	{ key: 'platform_approved', label: '已通过' },
	{ key: 'platform_rejected', label: '未通过' }
])

const STATUS_PRESENTATION: Readonly<Record<MineStatus, RescueMineStatusPresentation>> = Object.freeze({
	platform_pending: { label: '审核中', tone: 'warning' },
	platform_approved: { label: '已通过', tone: 'success' },
	platform_rejected: { label: '未通过', tone: 'danger' }
})

const UNKNOWN_STATUS_PRESENTATION: RescueMineStatusPresentation = Object.freeze({ label: '状态未知', tone: 'warning' })

export function createRescueMineTabs(): RescueMineTab[] {
	return MINE_TABS.map((tab) => ({ ...tab }))
}

export function createRescueMinePageState(): RescueMinePageState {
	return {
		activeFilter: 'all',
		tabs: createRescueMineTabs(),
		model: { items: [], pending: [], processed: [] },
		actorError: null
	}
}

export function isMineFilter(value: unknown): value is MineFilter {
	return value === 'all'
		|| value === 'platform_pending'
		|| value === 'platform_approved'
		|| value === 'platform_rejected'
}

export function countRescueMineItems(items: readonly MineItem[], filter: MineFilter): number {
	return filter === 'all' ? items.length : items.filter((item) => item.applicationStatus === filter).length
}

export function getRescueMineStatusPresentation(status: MineStatus): RescueMineStatusPresentation {
	if (status === 'platform_pending' || status === 'platform_approved' || status === 'platform_rejected') {
		return { ...STATUS_PRESENTATION[status] }
	}
	return { ...UNKNOWN_STATUS_PRESENTATION }
}
