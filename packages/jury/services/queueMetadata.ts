import type { JuryItem } from '@/utils/juryMock.ts'

export type JuryQueueTab = 'pending' | 'finished'
export type JuryQueueReviewType = '' | 'adoption' | 'rescue'

export interface JuryQueuePageState {
  activeTab: JuryQueueTab
  reviewType: JuryQueueReviewType
  juryItems: JuryItem[]
}

export interface JuryQueueRouteOptions {
  reviewType: JuryQueueReviewType
  activeTab: JuryQueueTab
}

export interface JuryQueueListItem extends JuryItem {
  isFinished: boolean
}

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizeReviewType(value: unknown): JuryQueueReviewType {
  if (typeof value !== 'string') return ''
  const normalized = value.trim().toLowerCase()
  return normalized === 'rescue' || normalized === 'adoption' ? normalized : ''
}

export function createJuryQueuePageState(): JuryQueuePageState {
  return {
    activeTab: 'pending',
    reviewType: '',
    juryItems: [],
  }
}

export function normalizeJuryQueueRouteOptions(value: unknown): JuryQueueRouteOptions {
  const options = isRecord(value) ? value : {}
  const requestedReviewType =
    options.businessType || options.reviewType || options.type || options.juryType
  return {
    reviewType: normalizeReviewType(requestedReviewType),
    activeTab: options.tab === 'finished' || options.state === 'finished' ? 'finished' : 'pending',
  }
}

export function projectJuryQueueItems(items: readonly JuryItem[]): JuryQueueListItem[] {
  return items.map((item) => ({
    ...item,
    isFinished: item.status !== 'pending',
  }))
}
