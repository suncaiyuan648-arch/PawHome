/**
 * Pure order type, association, visibility, and capability contract.
 *
 * This module is deliberately independent from Vue, uni-app, pages, and
 * storage.  Domain adapters provide a trusted actor, read the persisted
 * records, and call the injected writer only after this contract has returned
 * an allowed order.  The contract itself never performs a write.
 */

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

export const NORMAL_FEED = 'normal_feed'
export const ADOPTION_GIFT = 'adoption_gift'

export const ORDER_TYPES = Object.freeze({
	NORMAL_FEED,
	ADOPTION_GIFT,
})

export const ORDER_TYPE_VALUES = Object.freeze(Object.values(ORDER_TYPES))

export const ORDER_STATUSES = Object.freeze([
	'draft',
	'pending_payment',
	'submitted',
	'paid',
	'shipping',
	'delivered',
	'fulfilled',
	'completed',
	'failed',
	'cancelled',
	'expired',
])

export const ORDER_OPERATIONS = Object.freeze({
	READ: 'read',
	HIDE: 'hide',
	PAY: 'pay',
	REFUND: 'refund',
	REORDER: 'reorder',
	FULFILL: 'fulfill',
})

export const ORDER_CAPABILITIES = Object.freeze({
	READ_PRIVATE: 'order.read_private',
	HIDE_FOR_SELF: 'order.hide_for_self',
	NORMAL_FEED_PAY: 'order.normal_feed.pay',
	NORMAL_FEED_REFUND: 'order.normal_feed.refund',
	NORMAL_FEED_REORDER: 'order.normal_feed.reorder',
	FULFILL: 'order.fulfill',
})

export const ORDER_TYPE_CAPABILITIES = Object.freeze({
	[NORMAL_FEED]: Object.freeze([
		ORDER_CAPABILITIES.READ_PRIVATE,
		ORDER_CAPABILITIES.HIDE_FOR_SELF,
		ORDER_CAPABILITIES.NORMAL_FEED_PAY,
		ORDER_CAPABILITIES.NORMAL_FEED_REFUND,
		ORDER_CAPABILITIES.NORMAL_FEED_REORDER,
		ORDER_CAPABILITIES.FULFILL,
	]),
	[ADOPTION_GIFT]: Object.freeze([
		ORDER_CAPABILITIES.READ_PRIVATE,
		ORDER_CAPABILITIES.HIDE_FOR_SELF,
		ORDER_CAPABILITIES.FULFILL,
	]),
})

const ALLOWED_FIELDS = new Set([
	'id',
	'orderId',
	'orderType',
	'type',
	'applicationId',
	'recordId',
	'userId',
	'yardOwnerId',
	'yardId',
	'animalId',
	'status',
	'deliveryStatus',
	'deliveryProgress',
	'amount',
	'currency',
	'createdAt',
	'updatedAt',
])

const CROSS_DOMAIN_APPLICATION_PREFIXES = Object.freeze([
	'rescue',
	'feeding',
	'order',
	'dynamic',
	'yard',
	'animal',
])

const CROSS_DOMAIN_ORDER_PREFIXES = Object.freeze([
	'application',
	'adoption',
	'rescue',
	'dynamic',
	'animal',
])

const FULFILLABLE_STATUSES = new Set(['submitted', 'paid', 'shipping', 'delivered'])

export class OrderContractError extends Error {
	constructor(code, message, details) {
		super(message)
		this.name = 'OrderContractError'
		this.code = code
		this.details = details || {}
	}
}

function fail(code, message, details) {
	throw new OrderContractError(code, message, details)
}

function isPlainRecord(value) {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
	const proto = Object.getPrototypeOf(value)
	if (proto === Object.prototype || proto === null) return true
	const descriptor = Object.getOwnPropertyDescriptor(proto, 'constructor')
	return Object.getPrototypeOf(proto) === null
		&& Object.prototype.toString.call(value) === '[object Object]'
		&& descriptor
		&& typeof descriptor.value === 'function'
		&& descriptor.value.name === 'Object'
}

function rejectDangerousKeys(value, label) {
	for (const key of Object.getOwnPropertyNames(value)) {
		if (DANGEROUS_KEYS.has(key)) fail('PROTOTYPE_KEY', `${label} contains a prototype key`, { key })
	}
	if (Object.getOwnPropertySymbols(value).length) {
		fail('UNKNOWN_FIELD', `${label} cannot contain symbol fields`)
	}
}

function assertRecord(value, label) {
	if (!isPlainRecord(value)) fail('INVALID_ORDER', `${label} must be a plain object`)
	rejectDangerousKeys(value, label)
}

function normalizeId(value) {
	return typeof value === 'string' ? value.trim() : ''
}

function assertOpaqueId(value, label) {
	if (typeof value !== 'string' || value.length === 0) {
		fail('MISSING_ID', `${label} is required`, { label })
	}
	if (value !== value.trim() || !SAFE_ID.test(value) || URL_MARKERS.test(value)) {
		fail('INVALID_ID', `${label} must be an opaque ID`, { label })
	}
	return value
}

function looksLikeDomainId(value, prefixes) {
	const lower = value.toLowerCase()
	return prefixes.some((prefix) => lower === prefix
		|| lower.startsWith(`${prefix}-`)
		|| lower.startsWith(`${prefix}_`)
		|| lower.startsWith(`${prefix}:`))
}

function assertApplicationId(value, label = 'applicationId') {
	const id = assertOpaqueId(value, label)
	if (looksLikeDomainId(id, CROSS_DOMAIN_APPLICATION_PREFIXES)) {
		fail('CROSS_DOMAIN_ID', `${label} belongs to another business domain`, { label, value: id })
	}
	return id
}

function assertOrderId(value) {
	const id = assertOpaqueId(value, 'orderId')
	if (looksLikeDomainId(id, CROSS_DOMAIN_ORDER_PREFIXES)) {
		fail('CROSS_DOMAIN_ID', 'orderId belongs to another business domain', { value: id })
	}
	return id
}

function assertOptionalOpaqueId(value, label) {
	if (value === undefined || value === null || value === '') return undefined
	return assertOpaqueId(value, label)
}

function assertEnum(value, label, allowed) {
	if (typeof value !== 'string' || !allowed.includes(value)) {
		fail('INVALID_ENUM', `${label} is not supported`, { label, allowed })
	}
	return value
}

function readAliasedValue(input, primary, alias, label) {
	const first = input[primary]
	const second = input[alias]
	if (first !== undefined && second !== undefined && normalizeId(first) !== normalizeId(second)) {
		fail('CONFLICTING_FIELD', `${primary} and ${alias} disagree`, { primary, alias })
	}
	return first !== undefined ? first : second
}

function assertAllowedFields(input) {
	for (const key of Object.keys(input)) {
		if (!ALLOWED_FIELDS.has(key)) fail('UNKNOWN_FIELD', `Unknown order field: ${key}`, { key })
	}
}

function normalizeOrderType(input) {
	return assertEnum(
		readAliasedValue(input, 'orderType', 'type', 'orderType'),
		'orderType',
		ORDER_TYPE_VALUES
	)
}

/**
 * Normalize one order while retaining the legacy recordId alias only for an
 * adoption gift.  A normal feeding order cannot accidentally become linked
 * to an adoption application through a generic recordId.
 */
export function normalizeOrderRecord(input) {
	assertRecord(input, 'order')
	assertAllowedFields(input)

	const orderType = normalizeOrderType(input)
	const orderId = assertOrderId(readAliasedValue(input, 'orderId', 'id', 'orderId'))
	const userId = assertOpaqueId(input.userId, 'userId')
	const yardOwnerId = assertOptionalOpaqueId(input.yardOwnerId, 'yardOwnerId')
	const yardId = assertOptionalOpaqueId(input.yardId, 'yardId')
	const animalId = assertOptionalOpaqueId(input.animalId, 'animalId')
	const status = assertEnum(input.status, 'status', ORDER_STATUSES)
	const applicationValue = input.applicationId
	const recordValue = input.recordId

	let applicationId
	let recordId
	if (orderType === ADOPTION_GIFT) {
		if (applicationValue === undefined && recordValue === undefined) {
			fail('MISSING_APPLICATION_ID', 'adoption gift requires applicationId or its legacy recordId')
		}
		applicationId = assertApplicationId(applicationValue !== undefined ? applicationValue : recordValue)
		if (recordValue !== undefined) {
			recordId = assertApplicationId(recordValue, 'recordId')
			if (recordId !== applicationId) {
				fail('ASSOCIATION_CONFLICT', 'applicationId and recordId must identify the same application', {
					applicationId,
					recordId,
				})
			}
		} else {
			recordId = applicationId
		}
	} else if (applicationValue !== undefined || recordValue !== undefined) {
		fail('ASSOCIATION_NOT_ALLOWED', 'normal feeding orders cannot carry an adoption application association')
	}

	const result = {
		orderId,
		orderType,
		userId,
		...(yardOwnerId === undefined ? {} : { yardOwnerId }),
		...(yardId === undefined ? {} : { yardId }),
		...(animalId === undefined ? {} : { animalId }),
		status,
		...(applicationId === undefined ? {} : { applicationId, recordId }),
	}
	for (const key of ['deliveryStatus', 'deliveryProgress', 'amount', 'currency', 'createdAt', 'updatedAt']) {
		if (input[key] !== undefined) result[key] = input[key]
	}
	return Object.freeze(result)
}

/** Normalize a persisted order list and reject ambiguous reward associations. */
export function normalizeOrderList(value) {
	if (!Array.isArray(value)) fail('INVALID_ORDER_LIST', 'order storage must be an array')
	const normalized = []
	const orderIds = new Set()
	const applicationIds = new Set()
	for (const [index, order] of value.entries()) {
		let next
		try {
			next = normalizeOrderRecord(order)
		} catch (error) {
			if (error instanceof OrderContractError) {
				fail(error.code, `order ${index + 1}: ${error.message}`, { index, ...error.details })
			}
			throw error
		}
		if (orderIds.has(next.orderId)) fail('DUPLICATE_ORDER_ID', `duplicate orderId: ${next.orderId}`)
		if (next.orderType === ADOPTION_GIFT && applicationIds.has(next.applicationId)) {
			fail('AMBIGUOUS_APPLICATION_ORDER', `application has more than one gift order: ${next.applicationId}`)
		}
		orderIds.add(next.orderId)
		if (next.orderType === ADOPTION_GIFT) applicationIds.add(next.applicationId)
		normalized.push(next)
	}
	return Object.freeze(normalized)
}

export function findGiftOrderByApplicationId(orders, applicationId) {
	const id = assertApplicationId(applicationId)
	return normalizeOrderList(orders).find((order) => order.orderType === ADOPTION_GIFT && order.applicationId === id) || null
}

export function rewardAssociationKey(applicationId) {
	return `reward:application:${assertApplicationId(applicationId)}`
}

function normalizeActor(actor) {
	if (!isPlainRecord(actor)) return null
	const id = normalizeId(actor.id !== undefined ? actor.id : actor.actorId)
	if (!id || !SAFE_ID.test(id) || URL_MARKERS.test(id)) return null
	const roles = Array.isArray(actor.roles) ? actor.roles.filter((role) => typeof role === 'string') : []
	return { id, roles }
}

function hasYardRole(actor) {
	return actor.roles.includes('yard_owner') || actor.roles.includes('owner') || actor.roles.includes('fulfillment_manager')
}

function deniedAccess(reason = 'FORBIDDEN') {
	return Object.freeze({
		canRead: false,
		hiddenForActor: false,
		canHide: false,
		canPay: false,
		canRefund: false,
		canReorder: false,
		canFulfill: false,
		reason,
	})
}

function visibilityEntryKey(entry) {
	return visibilityKey(entry.userId, entry.orderId)
}

/** A visibility record is scoped to exactly one user and one order. */
export function normalizeVisibilityEntry(input) {
	assertRecord(input, 'visibility entry')
	for (const key of Object.keys(input)) {
		if (!['userId', 'orderId', 'hidden'].includes(key)) fail('UNKNOWN_FIELD', `Unknown visibility field: ${key}`)
	}
	const userId = assertOpaqueId(input.userId, 'visibility.userId')
	const orderId = assertOrderId(input.orderId)
	if (typeof input.hidden !== 'boolean') fail('INVALID_VISIBILITY', 'visibility.hidden must be boolean')
	return Object.freeze({ userId, orderId, hidden: input.hidden })
}

export function visibilityKey(userId, orderId) {
	const user = assertOpaqueId(userId, 'visibility.userId')
	const order = assertOrderId(orderId)
	return `order-visibility:${user}:${order}`
}

export function isOrderHiddenForUser(entries, userId, orderId) {
	const key = visibilityKey(userId, orderId)
	if (!Array.isArray(entries)) fail('INVALID_VISIBILITY', 'visibility entries must be an array')
	// A malformed visibility row must not be silently ignored at an access
	// boundary: callers either repair the scoped data or receive a deny result.
	return entries.map(normalizeVisibilityEntry)
		.some((entry) => entry.hidden && visibilityEntryKey(entry) === key)
}

/**
 * Compute read and operation capabilities from the normalized record and a
 * trusted session actor.  No URL/query/role field supplied beside the actor
 * is consulted.  A user-hidden order remains readable by its yard owner.
 */
export function getOrderAccess(orderInput, actorInput, options = {}) {
	try {
		const order = normalizeOrderRecord(orderInput)
		const actor = normalizeActor(actorInput)
		if (!actor) return deniedAccess('INVALID_ACTOR')
		const isUser = actor.id === order.userId
		const isYardOwner = actor.id === order.yardOwnerId && hasYardRole(actor)
		const hiddenForActor = isUser && isOrderHiddenForUser(options.hiddenEntries || [], actor.id, order.orderId)
		const canRead = (isUser && !hiddenForActor) || isYardOwner
		const userCanOperate = isUser && !hiddenForActor
		return Object.freeze({
			canRead,
			hiddenForActor,
			canHide: isUser,
			canPay: userCanOperate && order.orderType === NORMAL_FEED && order.status === 'pending_payment',
			canRefund: userCanOperate && order.orderType === NORMAL_FEED && ['paid', 'shipping'].includes(order.status),
			canReorder: userCanOperate && order.orderType === NORMAL_FEED && ['completed', 'cancelled', 'expired'].includes(order.status),
			canFulfill: isYardOwner && FULFILLABLE_STATUSES.has(order.status),
			reason: canRead ? 'ALLOWED' : 'FORBIDDEN',
		})
	} catch (error) {
		if (error instanceof OrderContractError) return deniedAccess(error.code)
		return deniedAccess('INVALID_ORDER')
	}
}

export const deriveOrderCapabilities = getOrderAccess

export function canOrderAction(operation, order, actor, options = {}) {
	const access = getOrderAccess(order, actor, options)
	switch (operation) {
		case ORDER_OPERATIONS.READ:
			return access.canRead
		case ORDER_OPERATIONS.HIDE:
			return access.canHide
		case ORDER_OPERATIONS.PAY:
			return access.canPay
		case ORDER_OPERATIONS.REFUND:
			return access.canRefund
		case ORDER_OPERATIONS.REORDER:
			return access.canReorder
		case ORDER_OPERATIONS.FULFILL:
			return access.canFulfill
		default:
			return false
	}
}

function success(data, extra = {}) {
	return { success: true, data, error: null, ...extra }
}

function failure(code, message, data = null) {
	return { success: false, data, error: { code, message } }
}

function explicitWriteSuccess(value) {
	return value === true || (isPlainRecord(value) && value.success === true)
}

/**
 * Dependency-injected reward save boundary.  The adapter must explicitly
 * acknowledge a successful write; undefined/false or a thrown error can
 * never be reported as success.  A pre-existing gift for the same
 * application is returned idempotently and the writer is not called.
 */
export function saveRewardOrder(orderInput, { readOrders, writeOrders } = {}) {
	let order
	try {
		order = normalizeOrderRecord(orderInput)
	} catch (error) {
		if (error instanceof OrderContractError) return failure(error.code, error.message)
		return failure('INVALID_ORDER', 'order is invalid')
	}
	if (order.orderType !== ADOPTION_GIFT) {
		return failure('INVALID_ORDER_TYPE', 'only adoption gifts use the reward save contract')
	}
	if (typeof readOrders !== 'function' || typeof writeOrders !== 'function') {
		return failure('MISSING_STORAGE_ADAPTER', 'readOrders and writeOrders adapters are required')
	}

	let current
	try {
		current = normalizeOrderList(readOrders())
	} catch (error) {
		if (error instanceof OrderContractError) return failure(error.code, error.message)
		return failure('STORAGE_READ_FAILED', 'order read failed')
	}
	const existing = current.find((item) => item.orderType === ADOPTION_GIFT && item.applicationId === order.applicationId)
	if (existing) return success(existing, { created: false, idempotent: true })

	try {
		const acknowledged = writeOrders([order, ...current])
		if (!explicitWriteSuccess(acknowledged)) return failure('STORAGE_WRITE_FAILED', 'order save was not acknowledged')
	} catch (error) {
		return failure('STORAGE_WRITE_FAILED', 'order save failed')
	}
	return success(order, { created: true, idempotent: false })
}
