/**
 * Reward-order persistence seam.
 *
 * This module intentionally has no dependency on adoption/rescue fixtures or
 * page code.  `recordId` is the legacy field; `applicationId` is the explicit
 * association used by the current contract.  Both names point to one order
 * record and are never used as independent sources.
 */
export const REWARD_ORDER_STORAGE_KEY = 'PAWHOME_REWARD_ORDERS'

export interface RewardOrderRecord {
  id: string
  applicationId: string
  recordId: string
  [key: string]: unknown
}

function normalizeId(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function storageDataError(code: string, message: string): Error & { code: string } {
  const error = new Error(message) as Error & { code: string }
  error.code = code
  return error
}

export function normalizeRewardOrder(order: unknown): RewardOrderRecord | null {
  if (!isRecord(order)) return null
  const id = normalizeId(order.id || order.orderId)
  const recordId = normalizeId(order.recordId)
  const applicationId = normalizeId(order.applicationId)
  if (!id) return null
  if (recordId && applicationId && recordId !== applicationId) return null
  const actorIds = ['userId', 'userPawId', 'applicantId', 'applicantUserId']
    .map((field) => normalizeId(order[field]))
    .filter(Boolean)
  if (new Set(actorIds).size > 1) return null
  const linkedId = applicationId || recordId
  if (!linkedId) return null
  return {
    ...order,
    id,
    applicationId: linkedId,
    recordId: recordId || linkedId,
  } as RewardOrderRecord
}

function normalizeOrderList(value: unknown): RewardOrderRecord[] {
  if (!Array.isArray(value)) {
    throw storageDataError('INVALID_ORDER_STORAGE', '奖励订单存储根结构必须是数组')
  }
  const normalized: RewardOrderRecord[] = []
  const orderIds = new Set<string>()
  const applicationIds = new Set<string>()
  value.forEach((order, index) => {
    const next = normalizeRewardOrder(order)
    if (!next) {
      throw storageDataError('INVALID_ORDER_RECORD', `奖励订单第 ${index + 1} 条记录无效`)
    }
    if (orderIds.has(next.id)) {
      throw storageDataError('DUPLICATE_ORDER_ID', `奖励订单 ID 重复: ${next.id}`)
    }
    if (applicationIds.has(next.applicationId)) {
      throw storageDataError(
        'AMBIGUOUS_APPLICATION_ORDER',
        `领养单关联了多个奖励订单: ${next.applicationId}`,
      )
    }
    orderIds.add(next.id)
    applicationIds.add(next.applicationId)
    normalized.push(next)
  })
  return normalized
}

/** Reads exactly the persisted order list; storage/JSON errors are surfaced. */
export function readRewardOrders(): RewardOrderRecord[] {
  const raw: unknown = uni.getStorageSync(REWARD_ORDER_STORAGE_KEY)
  if (raw === undefined || raw === null || raw === '') return []
  let value
  try {
    value = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    throw storageDataError('INVALID_ORDER_STORAGE', '奖励订单存储不是合法 JSON')
  }
  return normalizeOrderList(value)
}

/** Writes exactly one normalized order list; write failures are surfaced. */
export function writeRewardOrders(orders: readonly RewardOrderRecord[]): RewardOrderRecord[] {
  const normalized = normalizeOrderList(orders)
  uni.setStorageSync(REWARD_ORDER_STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

export function findRewardOrderById(
  orderId: string,
  orders: RewardOrderRecord[] = readRewardOrders(),
): RewardOrderRecord | null {
  const id = normalizeId(orderId)
  if (!id) return null
  return normalizeOrderList(orders).find((order) => normalizeId(order && order.id) === id) || null
}

export function findRewardOrderByApplicationId(
  applicationId: string,
  orders: RewardOrderRecord[] = readRewardOrders(),
): RewardOrderRecord | null {
  const id = normalizeId(applicationId)
  if (!id) return null
  return normalizeOrderList(orders).find((order) => normalizeId(order.applicationId) === id) || null
}
