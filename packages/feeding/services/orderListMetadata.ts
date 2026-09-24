import {
  FEEDING_ORDER_SORT_OPTIONS,
  formatFeedbackTimeout,
  type FeedingOrderItem,
  type FeedingOrderSort,
  type FeedingOrderSortOption,
  type FeedingOrderVariant,
} from './orderMockApi.ts'

export interface FeedingOrderListItem extends FeedingOrderItem {
  statusBadge: number
  orderCopy: string
}

export interface FeedingOrderListPageState {
  items: FeedingOrderListItem[]
  keyword: string
  sort: FeedingOrderSort
  loading: boolean
}

export interface FeedingOrderToolbarState {
  inputValue: string
  sortKey: FeedingOrderSort
  sortOpen: boolean
  sortOptions: FeedingOrderSortOption[]
}

export interface MyFeedingPageState {
  userPawId: string
  emptyState: boolean
}

export interface YardFeedingOrdersPageState {
  yardId: string
  yardOwnerId: string
}

export interface FeedingPublishResultPageState {
  dynamicId: string
  body: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function readFeedingRouteText(options: unknown, key: string): string {
  if (!isRecord(options)) return ''
  const value = options[key]
  return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))
    ? String(value)
    : ''
}

export function createMyFeedingPageState(userPawId: string): MyFeedingPageState {
  return { userPawId, emptyState: false }
}

export function createYardFeedingOrdersPageState(): YardFeedingOrdersPageState {
  return { yardId: '1', yardOwnerId: 'yard-owner-1' }
}

export function createFeedingPublishResultPageState(): FeedingPublishResultPageState {
  return { dynamicId: '', body: '' }
}

export function isFeedingOrderSort(value: unknown): value is FeedingOrderSort {
  return FEEDING_ORDER_SORT_OPTIONS.some((option) => option.key === value)
}

export function createFeedingOrderListPageState(): FeedingOrderListPageState {
  return { items: [], keyword: '', sort: 'smart', loading: false }
}

export function createFeedingOrderToolbarState(
  keyword: string,
  sort: FeedingOrderSort,
): FeedingOrderToolbarState {
  return {
    inputValue: keyword,
    sortKey: isFeedingOrderSort(sort) ? sort : 'smart',
    sortOpen: false,
    sortOptions: [...FEEDING_ORDER_SORT_OPTIONS],
  }
}

export function createFeedingOrderListItems(
  items: readonly FeedingOrderItem[],
  variant: FeedingOrderVariant,
): FeedingOrderListItem[] {
  return items.map((item) => ({
    ...item,
    statusBadge: item.statusBadge ?? 0,
    orderCopy:
      variant === 'mine' && item.stateKey === 'cloud-active-timeout' && item.nextFeedbackAt
        ? `反馈已超时${formatFeedbackTimeout(item.nextFeedbackAt)}，我们会尽快通知小院反馈`
        : item.orderCopy || item.progressText || '',
  }))
}
