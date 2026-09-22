import { animalIdsOfOrder, isFeedbackEligible } from './orderAssociation.js'
import { getPawHomeYardMock } from '@/utils/yardMock.js'

const STORAGE_KEY = 'PAWHOME_FEEDING_ORDERS'

function readPersistedOrders() {
  try {
    const raw = typeof uni !== 'undefined' && uni && typeof uni.getStorageSync === 'function'
      ? uni.getStorageSync(STORAGE_KEY)
      : undefined
    if (raw === undefined || raw === null || raw === '') return null
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(parsed) ? parsed.filter(item => item && typeof item === 'object' && !Array.isArray(item)) : []
  } catch (error) {
    return []
  }
}

// The publish sheet only needs the yard's selectable orders. Keep this seam
// inside the publish package. A persisted source takes precedence over the
// visual fallback so the feedback writer and picker operate on one identity.
export function getFeedingOrders({ yardId = '1', yardOwnerId = '' } = {}) {
  const yard = getPawHomeYardMock()
  const persisted = readPersistedOrders()
  const source = persisted === null
    ? (yard && Array.isArray(yard.feedingOrders) ? yard.feedingOrders : [])
    : persisted
  const items = source
    .filter((order) => String(order.yardId || yardId) === String(yardId)
      && (!yardOwnerId || String(order.yardOwnerId || '') === String(yardOwnerId)))
    .filter(order => !animalIdsOfOrder(order).error && animalIdsOfOrder(order).values.length && isFeedbackEligible(order))
    .map((order) => ({
      ...order,
      id: order.id || order.orderId,
      petIds: animalIdsOfOrder(order).values,
      avatar: order.userAvatar || order.avatar,
      userName: order.userName || order.name || '投粮人',
      userAvatar: order.userAvatar || order.avatar,
      feedbackTag: order.feedbackTag || order.feedbackCountText || order.topText || '待反馈',
    }))
  return Promise.resolve({
    success: true,
    source: 'publish-local',
    data: { variant: 'yard', yardId: String(yardId), yardOwnerId: String(yardOwnerId || ''), items, total: items.length },
    error: null
  })
}
