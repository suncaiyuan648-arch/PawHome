import { animalIdsOfOrder, isFeedbackEligible } from './orderAssociation.ts'
import { getPawHomeYardMock } from '@/utils/yardMock.ts'

type JsonRecord = Record<string, unknown>

export interface FeedingOrderPickerOptions {
  readonly variant?: 'yard'
  readonly yardId?: string
  readonly yardOwnerId?: string
}

export interface FeedingOrderPickerItem extends JsonRecord {
  readonly id: string
  readonly petIds: readonly string[]
  readonly avatar: string
  readonly userName: string
  readonly userAvatar: string
  readonly feedbackTag: string
}

interface PickerData {
  readonly variant: 'yard'
  readonly yardId: string
  readonly yardOwnerId: string
  readonly items: readonly FeedingOrderPickerItem[]
  readonly total: number
}

interface PickerResult {
  readonly success: true
  readonly source: 'publish-local'
  readonly data: PickerData
  readonly error: null
}

const STORAGE_KEY = 'PAWHOME_FEEDING_ORDERS'

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function readPersistedOrders(): JsonRecord[] | null {
  try {
    const raw: unknown =
      typeof uni !== 'undefined' && uni && typeof uni.getStorageSync === 'function'
        ? uni.getStorageSync(STORAGE_KEY)
        : undefined
    if (raw === undefined || raw === null || raw === '') return null
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(parsed) ? parsed.filter(isRecord) : []
  } catch {
    return []
  }
}

// The publish sheet only needs the yard's selectable orders. Keep this seam
// inside the publish package. A persisted source takes precedence over the
// visual fallback so the feedback writer and picker operate on one identity.
function displayText(value: unknown, fallback = ''): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback
}

export function getFeedingOrders(options: FeedingOrderPickerOptions = {}): Promise<PickerResult> {
  const input = options
  const yardId = input.yardId === undefined ? '1' : input.yardId
  const yardOwnerId = input.yardOwnerId === undefined ? '' : input.yardOwnerId
  const yard = getPawHomeYardMock()
  const persisted = readPersistedOrders()
  const source: readonly JsonRecord[] = persisted === null ? yard.feedingOrders : persisted
  const items: FeedingOrderPickerItem[] = source
    .filter(
      (order) =>
        String(order.yardId || yardId) === String(yardId) &&
        (!yardOwnerId || String(order.yardOwnerId || '') === String(yardOwnerId)),
    )
    .filter((order) => {
      const association = animalIdsOfOrder(order)
      return !association.error && association.values.length > 0 && isFeedbackEligible(order)
    })
    .map((order) => {
      const association = animalIdsOfOrder(order)
      return {
        ...order,
        id: displayText(order.id || order.orderId),
        petIds: association.values,
        avatar: displayText(order.userAvatar || order.avatar),
        userName: displayText(order.userName || order.name, '投粮人'),
        userAvatar: displayText(order.userAvatar || order.avatar),
        feedbackTag: displayText(
          order.feedbackTag || order.feedbackCountText || order.topText,
          '待反馈',
        ),
      }
    })
    .filter((order) => Boolean(order.id))
  return Promise.resolve({
    success: true,
    source: 'publish-local',
    data: {
      variant: 'yard',
      yardId: String(yardId),
      yardOwnerId: String(yardOwnerId || ''),
      items,
      total: items.length,
    },
    error: null,
  })
}
