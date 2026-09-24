import type { AdoptionCard } from '@/utils/adoptionStorage.ts'

export type AdoptionMineDisplayState = 'list' | 'empty'
export type AdoptionMineStatusTone = 'danger' | 'success' | 'neutral'

export interface AdoptionMinePageState {
	pageState: AdoptionMineDisplayState
	adoptionList: AdoptionCard[]
}

export interface AdoptionMineRouteState {
	pageState: AdoptionMineDisplayState
	openDetailId: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function routeText(value: unknown): string {
	if (typeof value !== 'string' && typeof value !== 'number') return ''
	const text = String(value)
	try {
		return decodeURIComponent(text)
	} catch {
		return text
	}
}

export function createAdoptionMinePageState(): AdoptionMinePageState {
	return { pageState: 'list', adoptionList: [] }
}

export function normalizeAdoptionMineRouteOptions(input: unknown): AdoptionMineRouteState {
	if (!isRecord(input)) return { pageState: 'list', openDetailId: '' }
	return {
		pageState: input.state === 'empty' ? 'empty' : 'list',
		openDetailId: routeText(input.openDetail),
	}
}

export function getAdoptionMineStatusTone(tone: string): AdoptionMineStatusTone {
	if (tone === 'red') return 'danger'
	if (tone === 'green') return 'success'
	return 'neutral'
}
