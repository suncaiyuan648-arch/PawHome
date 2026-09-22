'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
let tempRoot
let api

before(async () => {
	tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-order-contract-'))
	await fs.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
	const sourcePath = path.join(ROOT, 'navigation/orderContracts.js')
	const targetPath = path.join(tempRoot, 'orderContracts.js')
	await fs.copyFile(sourcePath, targetPath)
	api = await import(`${pathToFileURL(targetPath).href}?test=${Date.now()}-${Math.random()}`)
})

after(async () => {
	if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

function gift(overrides = {}) {
	return {
		orderId: 'gift-order-001',
		orderType: api.ADOPTION_GIFT,
		applicationId: 'application-001',
		userId: 'user-001',
		yardOwnerId: 'yard-owner-001',
		yardId: 'yard-001',
		status: 'submitted',
		...overrides,
	}
}

function feed(overrides = {}) {
	return {
		orderId: 'feed-order-001',
		orderType: api.NORMAL_FEED,
		userId: 'user-001',
		yardOwnerId: 'yard-owner-001',
		yardId: 'yard-001',
		status: 'pending_payment',
		...overrides,
	}
}

function throwsCode(callback, code) {
	assert.throws(callback, (error) => error && error.code === code)
}

test('contract is pure and does not import Vue, uni, pages, storage, or mocks', async () => {
	const source = await fs.readFile(path.join(ROOT, 'navigation/orderContracts.js'), 'utf8')
	assert.doesNotMatch(source, /(?:from\s+['"][^'"]*(?:vue|uni|pages|storage|mock)|require\s*\([^)]*(?:vue|uni|pages|storage|mock)|uni\.)/i)
	assert.equal(api.NORMAL_FEED, 'normal_feed')
	assert.equal(api.ADOPTION_GIFT, 'adoption_gift')
})

test('normal feeding and adoption gift remain distinct order types', () => {
	const normal = api.normalizeOrderRecord(feed())
	const giftOrder = api.normalizeOrderRecord(gift())
	assert.equal(normal.orderType, api.NORMAL_FEED)
	assert.equal(giftOrder.orderType, api.ADOPTION_GIFT)
	assert.ok(api.ORDER_TYPE_CAPABILITIES[api.NORMAL_FEED].includes(api.ORDER_CAPABILITIES.NORMAL_FEED_PAY))
	assert.equal(api.ORDER_TYPE_CAPABILITIES[api.ADOPTION_GIFT].includes(api.ORDER_CAPABILITIES.NORMAL_FEED_PAY), false)
	assert.equal('applicationId' in normal, false)
	assert.equal(giftOrder.applicationId, giftOrder.recordId)
	assert.equal(api.rewardAssociationKey(giftOrder.applicationId), 'reward:application:application-001')
})

test('applicationId and legacy recordId are one association source', () => {
	assert.equal(api.normalizeOrderRecord(gift({ recordId: 'application-001' })).recordId, 'application-001')
	assert.equal(api.normalizeOrderRecord(gift({ applicationId: undefined, recordId: 'application-002' })).applicationId, 'application-002')
	throwsCode(() => api.normalizeOrderRecord(gift({ recordId: 'application-002' })), 'ASSOCIATION_CONFLICT')
	throwsCode(() => api.normalizeOrderRecord(feed({ recordId: 'application-001' })), 'ASSOCIATION_NOT_ALLOWED')
	throwsCode(() => api.normalizeOrderRecord(gift({ applicationId: undefined, recordId: undefined })), 'MISSING_APPLICATION_ID')
})

test('unknown, URL, and cross-domain IDs fail closed', () => {
	throwsCode(() => api.normalizeOrderRecord(feed({ orderType: 'mystery' })), 'INVALID_ENUM')
	throwsCode(() => api.normalizeOrderRecord(feed({ type: api.ADOPTION_GIFT })), 'CONFLICTING_FIELD')
	throwsCode(() => api.normalizeOrderRecord(feed({ id: 'another-order-001' })), 'CONFLICTING_FIELD')
	throwsCode(() => api.normalizeOrderRecord(feed({ orderId: 'https://example.test/order-1' })), 'INVALID_ID')
	throwsCode(() => api.normalizeOrderRecord(gift({ applicationId: 'rescue-001' })), 'CROSS_DOMAIN_ID')
	throwsCode(() => api.normalizeOrderRecord(gift({ applicationId: 'application-001', recordId: 'rescue-001' })), 'CROSS_DOMAIN_ID')
	throwsCode(() => api.normalizeOrderRecord(feed({ orderId: 'application-001' })), 'CROSS_DOMAIN_ID')
	throwsCode(() => api.normalizeOrderRecord(feed({ query: { role: 'yard_owner' } })), 'UNKNOWN_FIELD')
})

test('duplicate gift association is rejected in a collection and exact retry is idempotent', () => {
	throwsCode(() => api.normalizeOrderList([gift(), gift({ orderId: 'gift-order-002' })]), 'AMBIGUOUS_APPLICATION_ORDER')
	let writes = 0
	const first = api.saveRewardOrder(gift(), {
		readOrders: () => [],
		writeOrders: (orders) => { writes += 1; assert.equal(orders[0].recordId, orders[0].applicationId); return { success: true } },
	})
	assert.equal(first.success, true)
	const existing = api.saveRewardOrder(gift({ orderId: 'gift-order-retry' }), {
		readOrders: () => [first.data],
		writeOrders: () => { writes += 1; return { success: true } },
	})
	assert.equal(existing.success, true)
	assert.equal(existing.idempotent, true)
	assert.equal(existing.data.orderId, 'gift-order-001')
	assert.equal(writes, 1)
})

test('user visibility is scoped by userId and orderId; yard owner fulfillment survives user hide', () => {
	const hidden = [{ userId: 'user-001', orderId: 'gift-order-001', hidden: true }]
	assert.equal(api.visibilityKey('user-001', 'gift-order-001'), 'order-visibility:user-001:gift-order-001')
	assert.equal(api.isOrderHiddenForUser(hidden, 'user-001', 'gift-order-001'), true)
	assert.equal(api.isOrderHiddenForUser(hidden, 'user-002', 'gift-order-001'), false)
	const userAccess = api.getOrderAccess(gift(), { id: 'user-001', roles: ['applicant'] }, { hiddenEntries: hidden })
	const ownerAccess = api.getOrderAccess(gift(), { id: 'yard-owner-001', roles: ['yard_owner'] }, { hiddenEntries: hidden })
	assert.equal(userAccess.canRead, false)
	assert.equal(userAccess.canHide, true)
	assert.equal(userAccess.canPay, false)
	assert.equal(ownerAccess.canRead, true)
	assert.equal(ownerAccess.canFulfill, true)
	assert.equal(api.canOrderAction(api.ORDER_OPERATIONS.FULFILL, gift(), { id: 'yard-owner-001', roles: ['yard_owner'] }, { hiddenEntries: hidden }), true)
})

test('adoption gifts never inherit normal feeding pay, refund, or reorder operations', () => {
	const actor = { id: 'user-001', roles: ['applicant', 'donor'] }
	for (const operation of [api.ORDER_OPERATIONS.PAY, api.ORDER_OPERATIONS.REFUND, api.ORDER_OPERATIONS.REORDER]) {
		assert.equal(api.canOrderAction(operation, gift({ status: 'pending_payment' }), actor), false)
	}
	assert.equal(api.canOrderAction(api.ORDER_OPERATIONS.PAY, feed({ status: 'pending_payment' }), actor), true)
	assert.equal(api.canOrderAction(api.ORDER_OPERATIONS.REFUND, feed({ status: 'paid' }), actor), true)
	assert.equal(api.canOrderAction(api.ORDER_OPERATIONS.REORDER, feed({ status: 'completed' }), actor), true)
})

test('status, URL/query fields, and forged roles cannot grant write capability', () => {
	const actor = { id: 'other-user-001', roles: ['yard_owner'] }
	const forged = api.getOrderAccess(feed({ status: 'pending_payment' }), actor, {
		query: { userId: 'user-001', role: 'donor', status: 'paid', managed: true },
	})
	assert.equal(forged.canPay, false)
	assert.equal(forged.canRefund, false)
	assert.equal(forged.canFulfill, false)
	assert.equal(api.canOrderAction('unknown-write', feed({ status: 'completed' }), { id: 'user-001', roles: ['admin'] }), false)
	assert.equal(api.canOrderAction(api.ORDER_OPERATIONS.FULFILL, gift({ status: 'completed' }), { id: 'yard-owner-001', roles: ['reviewer'] }), false)
})

test('malformed actor/order and invalid visibility entries fail closed without a write path', () => {
	const access = api.getOrderAccess(gift(), { id: 'user-001', roles: ['applicant'] }, { hiddenEntries: [{ userId: 'user-001', orderId: 'https://bad', hidden: true }] })
	assert.equal(access.canRead, false)
	assert.equal(api.getOrderAccess(gift(), null).canRead, false)
	assert.equal(api.getOrderAccess({ ...gift(), status: 'future' }, { id: 'user-001' }).canRead, false)
	throwsCode(() => api.normalizeVisibilityEntry({ userId: 'user-001', orderId: 'gift-order-001', hidden: 'yes' }), 'INVALID_VISIBILITY')
})

test('failed reward saves return failure and never report success', () => {
	let calls = 0
	const failed = api.saveRewardOrder(gift(), {
		readOrders: () => [],
		writeOrders: () => { calls += 1; return false },
	})
	assert.equal(failed.success, false)
	assert.equal(failed.error.code, 'STORAGE_WRITE_FAILED')
	assert.equal(calls, 1)
	const thrown = api.saveRewardOrder(gift({ orderId: 'gift-order-002' }), {
		readOrders: () => [],
		writeOrders: () => { throw new Error('write failed') },
	})
	assert.equal(thrown.success, false)
	assert.equal(thrown.error.code, 'STORAGE_WRITE_FAILED')
})

test('save adapter rejects missing acknowledgement, malformed reads, and normal feeding input', () => {
	const noAck = api.saveRewardOrder(gift(), { readOrders: () => [], writeOrders: () => undefined })
	assert.equal(noAck.success, false)
	assert.equal(noAck.error.code, 'STORAGE_WRITE_FAILED')
	const malformedRead = api.saveRewardOrder(gift(), { readOrders: () => 'not-an-array', writeOrders: () => true })
	assert.equal(malformedRead.success, false)
	assert.equal(malformedRead.error.code, 'INVALID_ORDER_LIST')
	const normal = api.saveRewardOrder(feed(), { readOrders: () => [], writeOrders: () => true })
	assert.equal(normal.success, false)
	assert.equal(normal.error.code, 'INVALID_ORDER_TYPE')
})

test('normalized records, lists, and capabilities are immutable', () => {
	const order = api.normalizeOrderRecord(gift())
	assert.equal(Object.isFrozen(order), true)
	assert.throws(() => { order.status = 'completed' }, TypeError)
	assert.equal(order.status, 'submitted')
	assert.equal(Object.isFrozen(api.normalizeOrderList([gift()])), true)
	assert.equal(Object.isFrozen(api.getOrderAccess(gift(), { id: 'user-001', roles: [] })), true)
})
