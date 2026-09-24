'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after, beforeEach } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const REWARD_KEY = 'PAWHOME_REWARD_ORDERS'
let tempRoot
let api
let feedingApi

const SELF_ID = '2876598765'
const GIFT = {
  id: 'gift-order-real',
  recordId: 'application-real',
  status: 'submitted',
  userId: 'actor-a',
  yardOwnerId: 'owner-a',
  yardId: 'yard-a',
  address: { id: 'private-address', phone: 'should-not-leak' },
}

function actor(id, roles) {
  return () => ({ actor: { id, roles } })
}

function reset() {
  globalThis.uni.storage.clear()
  globalThis.uni.reads.length = 0
  globalThis.uni.writes.length = 0
}

function seedReward(records) {
  globalThis.uni.storage.set(REWARD_KEY, JSON.stringify(records))
}

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-order-adapter-'))
  await fs.writeFile(path.join(tempRoot, 'package.tson'), '{"type":"module"}\n')
  await fs.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
  await fs.mkdir(path.join(tempRoot, 'utils'), { recursive: true })
  await fs.mkdir(path.join(tempRoot, 'packages/feeding/services'), { recursive: true })

  for (const file of ['actorCapabilities.ts', 'orderContracts.ts']) {
    await fs.copyFile(path.join(ROOT, 'navigation', file), path.join(tempRoot, 'navigation', file))
  }
  await fs.copyFile(path.join(ROOT, 'utils/rewardOrderStorage.ts'), path.join(tempRoot, 'utils/rewardOrderStorage.ts'))
  await fs.copyFile(path.join(ROOT, 'utils/profileNav.ts'), path.join(tempRoot, 'utils/profileNav.ts'))
  const feedingSource = await fs.readFile(path.join(ROOT, 'packages/feeding/services/orderMockApi.ts'), 'utf8')
  await fs.writeFile(path.join(tempRoot, 'packages/feeding/services/orderMockApi.ts'), feedingSource.replace("'@/utils/profileNav.ts'", "'../../../utils/profileNav.ts'"))
  await fs.copyFile(path.join(ROOT, 'packages/feeding/services/orderAdapter.ts'), path.join(tempRoot, 'packages/feeding/services/orderAdapter.ts'))

  globalThis.uni = {
    storage: new Map(),
    reads: [],
    writes: [],
    getStorageSync(key) {
      this.reads.push(key)
      return this.storage.get(key)
    },
    setStorageSync(key, value) {
      this.writes.push({ key, value })
      this.storage.set(key, value)
    },
  }
  api = await import(`${pathToFileURL(path.join(tempRoot, 'packages/feeding/services/orderAdapter.ts')).href}?test=${Date.now()}-${Math.random()}`)
  feedingApi = await import(`${pathToFileURL(path.join(tempRoot, 'packages/feeding/services/orderMockApi.ts')).href}?api-test=${Date.now()}-${Math.random()}`)
})

after(async () => {
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
  delete globalThis.uni
})

beforeEach(reset)

test('adapter is read-only and binds the existing order contract/storage seams', async () => {
  const source = await fs.readFile(path.join(ROOT, 'packages/feeding/services/orderAdapter.ts'), 'utf8')
  assert.match(source, /orderContracts\.ts/)
  assert.match(source, /rewardOrderStorage\.ts/)
  assert.match(source, /getFeedingOrders/)
  assert.doesNotMatch(source, /setStorageSync|removeStorageSync|saveRewardOrder|createRewardOrder|payOrder|refundOrder/i)
  assert.equal(api.readOrderList.constructor.name, 'AsyncFunction')
})

test('feeding mock API returns stable list, detail, timeline, logistics, and timeout projections', async () => {
  const list = await feedingApi.getFeedingOrders({
    variant: 'yard',
    yardOwnerId: 'yard-owner-1',
    yardId: '1',
    sort: 'newest',
  })
  assert.equal(list.success, true)
  assert.equal(list.source, 'mock')
  assert.equal(list.data.total, 5)
  assert.deepEqual(list.data.items.map((item) => item.id), [
    'yard-order-1', 'yard-order-2', 'yard-order-3', 'yard-order-4', 'yard-order-5'
  ])

  const detail = await feedingApi.getFeedingOrderDetail({
    type: 'yard-owner',
    orderId: 'yard-order-4',
    yardOwnerId: 'yard-owner-1',
  })
  assert.equal(detail.success, true)
  assert.equal(detail.data.perspective, 'yard-owner')
  assert.equal(detail.data.orderId, 'yard-order-4')
  assert.equal(detail.data.orderNo, 'FEED-yard-order-4')
  assert.equal(detail.data.timeline.length, 3)
  assert.equal(detail.data.logistics.length, 4)
  assert.equal(feedingApi.formatFeedbackTimeout('2025-01-01T00:00:00Z', Date.parse('2025-01-01T02:00:00Z')), '2小时')
  assert.equal(feedingApi.formatFeedbackTimeout('2025-01-01T00:00:00Z', Date.parse('2025-01-04T00:00:00Z')), '3天')
  assert.equal(feedingApi.formatFeedbackTimeout('invalid-date'), '')
})

test('saved reward records map to adoption_gift and legacy recordId without leaking address data', async () => {
  seedReward([GIFT])
  const result = await api.readOrderById('gift-order-real', {
    source: 'reward',
    actorProvider: actor('actor-a', ['applicant']),
    userPawId: 'owner-a',
    managed: true,
    role: 'yard_owner',
  })

  assert.equal(result.success, true)
  assert.equal(result.data.order.orderType, 'adoption_gift')
  assert.equal(result.data.order.applicationId, 'application-real')
  assert.equal(result.data.order.recordId, 'application-real')
  assert.equal(result.data.order.userId, 'actor-a')
  assert.equal('address' in result.data.order, false)
  assert.equal(result.data.access.canRead, true)
  assert.equal(result.readOnly, true)
  assert.equal(result.canWrite, false)
  assert.equal(globalThis.uni.writes.length, 0)
})

test('gift lookup uses the stable applicationId association and never crosses into feeding orders', async () => {
  seedReward([GIFT])
  const found = await api.readGiftOrderByApplicationId('application-real', {
    actorProvider: actor('actor-a', ['applicant']),
  })
  assert.equal(found.success, true)
  assert.equal(found.data.order.orderId, 'gift-order-real')
  assert.equal(found.data.order.applicationId, 'application-real')
  assert.equal((await api.readGiftOrderByApplicationId('f1', {
    source: 'feeding',
    actorProvider: actor(SELF_ID, ['applicant']),
  })).error.code, 'NOT_FOUND')
  assert.equal((await api.readGiftOrderByApplicationId('rescue-001', {
    actorProvider: actor('actor-a', ['applicant']),
  })).error.code, 'CROSS_DOMAIN_ID')
  assert.equal((await api.readGiftOrderByApplicationId(' application-real ', {
    actorProvider: actor('actor-a', ['applicant']),
  })).error.code, 'INVALID_ID')
})

test('ordinary feeding read model is scoped by trusted actor and owner perspective', async () => {
  const mine = await api.readOrderList({
    source: 'feeding',
    perspective: 'mine',
    actorProvider: actor(SELF_ID, ['applicant']),
    userPawId: 'yard-user-f1',
    yardOwnerId: 'yard-owner-1',
    managed: true,
    role: 'yard_owner',
  })
  assert.equal(mine.success, true)
  assert.deepEqual(mine.data.items.map((item) => item.order.orderId), ['f5', 'f1', 'f2', 'f3', 'f4'])
  assert.ok(mine.data.items.every((item) => item.order.orderType === 'normal_feed' && item.order.userId === SELF_ID))
  assert.ok(mine.data.items.every((item) => item.access.canRead === true))

  const owner = await api.readOrderList({
    source: 'feeding',
    perspective: 'yard',
    yardId: '1',
    actorProvider: actor('yard-owner-1', ['yard_owner']),
    userPawId: SELF_ID,
  })
  assert.equal(owner.success, true)
  assert.deepEqual(owner.data.items.map((item) => item.order.orderId), [
    'yard-order-3', 'yard-order-1', 'yard-order-2', 'yard-order-4', 'yard-order-5'
  ])
  assert.ok(owner.data.items.every((item) => item.order.yardOwnerId === 'yard-owner-1'))
  assert.equal(owner.data.items.find((item) => item.order.orderId === 'yard-order-3').access.canFulfill, false)
  assert.ok(owner.data.items.filter((item) => item.order.orderId !== 'yard-order-3').every((item) => item.access.canFulfill === true))
  assert.equal(globalThis.uni.writes.length, 0)
})

test('gift and normal feeding sources stay isolated', async () => {
  seedReward([GIFT])
  const gift = await api.readOrderList({ source: 'reward', actorProvider: actor('actor-a', ['applicant']) })
  const feeding = await api.readOrderList({ source: 'feeding', actorProvider: actor(SELF_ID, ['applicant']) })
  assert.deepEqual(gift.data.items.map((item) => item.order.orderId), ['gift-order-real'])
  assert.ok(gift.data.items.every((item) => item.order.orderType === 'adoption_gift'))
  assert.ok(feeding.data.items.every((item) => item.order.orderType === 'normal_feed'))
})

test('hidden order is invisible only to that user while owner fulfillment remains readable', async () => {
  seedReward([GIFT])
  const hidden = [{ userId: 'actor-a', orderId: 'gift-order-real', hidden: true }]
  const user = await api.readOrderById('gift-order-real', {
    source: 'reward',
    actorProvider: actor('actor-a', ['applicant']),
    hiddenEntries: hidden,
  })
  assert.equal(user.success, false)
  assert.equal(user.error.code, 'FORBIDDEN')

  const owner = await api.readOrderById('gift-order-real', {
    source: 'reward',
    actorProvider: actor('owner-a', ['yard_owner']),
    hiddenEntries: hidden,
  })
  assert.equal(owner.success, true)
  assert.equal(owner.data.access.canFulfill, true)
  assert.equal(owner.data.access.hiddenForActor, false)
})

test('each call resolves actor and exact IDs; missing or unauthorized IDs never fall back', async () => {
  let current = SELF_ID
  const provider = () => ({ actor: { id: current, roles: ['applicant'] } })
  const first = await api.readOrderById('f1', { source: 'feeding', actorProvider: provider })
  assert.equal(first.success, true)
  current = 'other-user'
  const second = await api.readOrderById('f1', { source: 'feeding', actorProvider: provider })
  assert.equal(second.success, false)
  assert.equal(second.error.code, 'NOT_FOUND')
  const missing = await api.readOrderById('does-not-exist', { source: 'feeding', actorProvider: provider })
  assert.equal(missing.success, false)
  assert.equal(missing.error.code, 'NOT_FOUND')
  assert.equal((await api.readOrderById('', { actorProvider: provider })).error.code, 'MISSING_ORDER_ID')
  assert.equal((await api.readOrderById(' f1 ', { actorProvider: provider })).error.code, 'INVALID_ORDER_ID')
  assert.equal((await api.readOrderById('application-001', { actorProvider: provider })).error.code, 'CROSS_DOMAIN_ID')
})

test('invalid actor, forged source parameters, and visibility data fail closed', async () => {
  const noActor = await api.readOrderList({ source: 'feeding', perspective: 'yard', yardId: '1' })
  assert.equal(noActor.success, false)
  assert.equal(noActor.error.code, 'ACTOR_PROVIDER_REQUIRED')

  const badRole = await api.readOrderList({ source: 'feeding', perspective: 'yard', yardId: '1', actorProvider: actor('other-user', ['applicant']), yardOwnerId: 'yard-owner-1' })
  assert.deepEqual(badRole.data.items, [])
  assert.equal(badRole.success, true)

  const invalidVisibility = await api.readOrderList({ source: 'feeding', actorProvider: actor(SELF_ID, ['applicant']), hiddenEntries: 'forged' })
  assert.equal(invalidVisibility.success, false)
  assert.equal(invalidVisibility.error.code, 'INVALID_VISIBILITY')
  assert.equal(globalThis.uni.writes.length, 0)
})

test('malformed reward storage is empty and never repaired or written', async () => {
  globalThis.uni.storage.set(REWARD_KEY, '{broken')
  const result = await api.readOrderList({ source: 'reward', actorProvider: actor('actor-a', ['applicant']) })
  assert.equal(result.success, true)
  assert.deepEqual(result.data.items, [])
  assert.equal(result.data.diagnostics[0].code, 'INVALID_ORDER_STORAGE')
  assert.equal(globalThis.uni.writes.length, 0)
})

test('legacy reward records without actor relation remain fail-closed', async () => {
  seedReward([{ id: 'legacy-no-actor', recordId: 'application-legacy', status: 'submitted' }])
  const list = await api.readOrderList({ source: 'reward', actorProvider: actor('actor-a', ['applicant']) })
  assert.deepEqual(list.data.items, [])
  assert.ok(list.data.diagnostics.some((item) => item.code === 'MISSING_ID'))
  const detail = await api.readOrderById('legacy-no-actor', { source: 'reward', actorProvider: actor('actor-a', ['applicant']) })
  assert.equal(detail.success, false)
  assert.equal(detail.error.code, 'NOT_FOUND')
})
