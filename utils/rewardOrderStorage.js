/**
 * Reward-order persistence seam.
 *
 * This module intentionally has no dependency on adoption/rescue fixtures or
 * page code.  `recordId` is the legacy field; `applicationId` is the explicit
 * association used by the current contract.  Both names point to one order
 * record and are never used as independent sources.
 */
export const REWARD_ORDER_STORAGE_KEY = 'PAWHOME_REWARD_ORDERS'

function normalizeId(value) {
	return value === undefined || value === null ? '' : String(value).trim()
}

function isRecord(value) {
	return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function storageDataError(code, message) {
	const error = new Error(message)
	error.code = code
	return error
}

export function normalizeRewardOrder(order) {
	if (!isRecord(order)) return null
	const id = normalizeId(order.id || order.orderId)
	const recordId = normalizeId(order.recordId)
	const applicationId = normalizeId(order.applicationId)
	if (!id) return null
	if (recordId && applicationId && recordId !== applicationId) return null
	const actorIds = ['userId', 'userPawId', 'applicantId', 'applicantUserId']
		.map(field => normalizeId(order[field]))
		.filter(Boolean)
	if (new Set(actorIds).size > 1) return null
	const linkedId = applicationId || recordId
	if (!linkedId) return null
	return {
		...order,
		id,
		applicationId: linkedId,
		recordId: recordId || linkedId
	}
}

function normalizeOrderList(value) {
	if (!Array.isArray(value)) {
		throw storageDataError('INVALID_ORDER_STORAGE', '奖励订单存储根结构必须是数组')
	}
	const normalized = []
	const orderIds = new Set()
	const applicationIds = new Set()
	value.forEach((order, index) => {
		const next = normalizeRewardOrder(order)
		if (!next) {
			throw storageDataError('INVALID_ORDER_RECORD', `奖励订单第 ${index + 1} 条记录无效`)
		}
		if (orderIds.has(next.id)) {
			throw storageDataError('DUPLICATE_ORDER_ID', `奖励订单 ID 重复: ${next.id}`)
		}
		if (applicationIds.has(next.applicationId)) {
			throw storageDataError('AMBIGUOUS_APPLICATION_ORDER', `领养单关联了多个奖励订单: ${next.applicationId}`)
		}
		orderIds.add(next.id)
		applicationIds.add(next.applicationId)
		normalized.push(next)
	})
	return normalized
}

/** Reads exactly the persisted order list; storage/JSON errors are surfaced. */
export function readRewardOrders() {
	const raw = uni.getStorageSync(REWARD_ORDER_STORAGE_KEY)
	if (raw === undefined || raw === null || raw === '') return []
	let value
	try {
		value = typeof raw === 'string' ? JSON.parse(raw) : raw
	} catch (error) {
		throw storageDataError('INVALID_ORDER_STORAGE', '奖励订单存储不是合法 JSON')
	}
	return normalizeOrderList(value)
}

/** Writes exactly one normalized order list; write failures are surfaced. */
export function writeRewardOrders(orders) {
	const normalized = normalizeOrderList(orders)
	uni.setStorageSync(REWARD_ORDER_STORAGE_KEY, JSON.stringify(normalized))
	return normalized
}

export function findRewardOrderById(orderId, orders = readRewardOrders()) {
	const id = normalizeId(orderId)
	if (!id) return null
	return normalizeOrderList(orders).find((order) => normalizeId(order && order.id) === id) || null
}

export function findRewardOrderByApplicationId(applicationId, orders = readRewardOrders()) {
	const id = normalizeId(applicationId)
	if (!id) return null
	return normalizeOrderList(orders).find((order) => normalizeId(order.applicationId) === id) || null
}
