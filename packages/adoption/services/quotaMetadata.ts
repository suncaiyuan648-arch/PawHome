export type AdoptionQuotaMode = 'support' | 'quota' | 'quota-detail'

export interface AdoptionQuotaSupporter {
	id: number
	name: string
	avatar: string
}

export interface AdoptionQuotaLedgerEntry {
	id: number
	name: string
	amount: string
}

export interface AdoptionQuotaDetailRow {
	label: string
	value: string
}

export interface AdoptionQuotaPageState {
	mode: AdoptionQuotaMode
	recordId: string
	invalid: boolean
	supportList: AdoptionQuotaSupporter[]
	ledger: AdoptionQuotaLedgerEntry[]
	showInsufficient: boolean
	detailRows: AdoptionQuotaDetailRow[]
}

export interface AdoptionQuotaRouteState {
	recordId: string
	invalid: boolean
	showInsufficient: boolean
}

const SUPPORTERS: readonly AdoptionQuotaSupporter[] = Object.freeze([
	{ id: 1, name: '小白', avatar: '/static/figma/feature/f4348f6f415792a279a216f5422aabc6f064ce25.jpg' },
	{ id: 2, name: '小苹果', avatar: '/static/figma/feature/a7e819e25e2ebbe3e40d655a2ccedfb5b6dd4e52.jpg' },
	{ id: 3, name: '小苹果', avatar: '/static/figma/feature/a7e819e25e2ebbe3e40d655a2ccedfb5b6dd4e52.jpg' },
])

const LEDGER: readonly AdoptionQuotaLedgerEntry[] = Object.freeze([
	{ id: 1, name: '云养3天豆豆', amount: '' },
	{ id: 2, name: '领养菠萝', amount: '-100' },
	{ id: 3, name: '云养7天豆豆', amount: '+300' },
	{ id: 4, name: '领养小黑失败-额度返还', amount: '+100' },
	{ id: 5, name: '领养小黑', amount: '-100' },
])

const DETAIL_ROWS: readonly AdoptionQuotaDetailRow[] = Object.freeze([
	{ label: '交易方式', value: '投喂云养获得' },
	{ label: '交易时间', value: '2026-01-30 13:53:12' },
	{ label: '交易场景', value: '领养额度' },
	{ label: '交易单号', value: '76465456563563453563653' },
])

const MODE_TITLES: Readonly<Record<AdoptionQuotaMode, string>> = Object.freeze({
	support: '助力领养',
	quota: '领养额度',
	'quota-detail': '明细详情',
})

function isAdoptionQuotaMode(value: unknown): value is AdoptionQuotaMode {
	return typeof value === 'string' && Object.prototype.hasOwnProperty.call(MODE_TITLES, value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function createAdoptionQuotaPageState(mode: AdoptionQuotaMode): AdoptionQuotaPageState {
	return {
		mode,
		recordId: '',
		invalid: false,
		supportList: SUPPORTERS.map((supporter) => ({ ...supporter })),
		ledger: LEDGER.map((entry) => ({ ...entry })),
		showInsufficient: false,
		detailRows: DETAIL_ROWS.map((row) => ({ ...row })),
	}
}

export function resolveAdoptionQuotaRouteState(options: unknown, mode: AdoptionQuotaMode): AdoptionQuotaRouteState {
	const source = isRecord(options) ? options : {}
	let recordId = ''
	try {
		recordId = String(source.quotaId || source.id || source.recordId || '')
	} catch {
		recordId = ''
	}
	return {
		recordId,
		invalid: mode === 'quota-detail' && !recordId,
		showInsufficient: source.popup === 'insufficient',
	}
}

export function getAdoptionQuotaTitle(mode: AdoptionQuotaMode): string {
	return isAdoptionQuotaMode(mode) ? MODE_TITLES[mode] : '领养'
}
