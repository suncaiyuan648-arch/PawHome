'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after, beforeEach } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
let tempRoot
let api
const storage = new Map()
let writes = 0

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-message-store-'))
  await fs.cp(path.join(ROOT, 'contracts'), path.join(tempRoot, 'contracts'), { recursive: true })
  await fs.writeFile(path.join(tempRoot, 'package.tson'), '{"type":"module"}\n')
  await fs.mkdir(path.join(tempRoot, 'packages/message/services'), { recursive: true })
  await fs.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
  await fs.mkdir(path.join(tempRoot, 'utils'), { recursive: true })
  await fs.copyFile(
    path.join(ROOT, 'packages/message/services/messageStore.ts'),
    path.join(tempRoot, 'packages/message/services/messageStore.ts'),
  )
  for (const file of [
    'actorCapabilities.ts',
    'deeplinkContracts.ts',
    'productionDeepLinkResolver.ts',
    'routeContracts.ts',
  ]) {
    await fs.copyFile(path.join(ROOT, 'navigation', file), path.join(tempRoot, 'navigation', file))
  }
  for (const file of ['adoptionStorage.ts', 'rescueStorage.ts', 'rewardOrderStorage.ts']) {
    await fs.copyFile(path.join(ROOT, 'utils', file), path.join(tempRoot, 'utils', file))
  }
  globalThis.uni = {
    getStorageSync(key) {
      return storage.get(key)
    },
    setStorageSync(key, value) {
      writes += 1
      storage.set(key, value)
    },
  }
  api = await import(
    `${pathToFileURL(path.join(tempRoot, 'packages/message/services/messageStore.ts')).href}?test=${Date.now()}`
  )
})

beforeEach(() => {
  storage.clear()
  writes = 0
})
after(async () => {
  delete globalThis.uni
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

function actor(id = 'actor-a', roles = ['applicant']) {
  return () => ({ actor: { id, roles } })
}

function message(overrides = {}) {
  return {
    messageId: 'message-a',
    eventKey: 'event-a',
    recipientId: 'actor-a',
    category: 'order',
    title: '订单状态更新',
    preview: '订单已完成',
    createdAt: '2026-09-19T10:00:00.000Z',
    businessType: 'feeding',
    businessId: 'order-a',
    ...overrides,
  }
}

test('message producer requires explicit authorization and is idempotent', () => {
  assert.equal(api.appendMessage(message()).error.code, 'WRITER_MISSING')
  const denied = api.appendMessage(message(), { authorize: () => false })
  assert.equal(denied.error.code, 'FORBIDDEN')
  const created = api.appendMessage(message(), { authorize: () => true })
  assert.equal(created.success, true)
  assert.equal(created.wrote, true)
  assert.equal(writes, 1)
  const retry = api.appendMessage(message({ title: '重试' }), { authorize: () => true })
  assert.equal(retry.idempotent, true)
  assert.equal(retry.data.item.title, '订单状态更新')
  assert.equal(writes, 1)
})

test('review notifications route applicants to their own progress readers', () => {
  const adoption = api.appendMessage(
    message({
      messageId: 'message-adoption-review',
      eventKey: 'event-adoption-review',
      category: 'system',
      businessType: 'adoption',
      businessId: 'application-a',
      reviewItemId: 'review-a',
    }),
    { authorize: () => true },
  )
  const rescue = api.appendMessage(
    message({
      messageId: 'message-rescue-review',
      eventKey: 'event-rescue-review',
      category: 'system',
      businessType: 'rescue',
      businessId: 'rescue-a',
      reviewItemId: 'review-r',
    }),
    { authorize: () => true },
  )
  assert.equal(adoption.data.item.reviewItemId, 'review-a')
  assert.equal(adoption.data.item.deepLink.routeName, 'adoption.progress')
  assert.equal(
    adoption.data.item.deepLink.url,
    '/packages/adoption/pages/progress/index?applicationId=application-a',
  )
  assert.equal(rescue.data.item.reviewItemId, 'review-r')
  assert.equal(rescue.data.item.deepLink.routeName, 'rescue.progress')
  assert.equal(rescue.data.item.deepLink.targetKind, 'progress')
  assert.equal(
    rescue.data.item.deepLink.url,
    '/packages/rescue/pages/progress/index?rescueId=rescue-a',
  )
})

test('review notifications re-read the applicant-owned record and expose no reviewer target', () => {
  api.appendMessage(
    message({
      messageId: 'message-adoption-applicant',
      eventKey: 'event-adoption-applicant',
      category: 'system',
      businessType: 'adoption',
      businessId: 'application-a',
      reviewItemId: 'review-a',
    }),
    { authorize: () => true },
  )
  storage.set(
    'PAWHOME_ADOPTIONS',
    JSON.stringify([
      {
        id: 'application-a',
        applicantId: 'actor-a',
        reviewItemId: 'review-a',
        status: 'pending',
      },
    ]),
  )
  const destination = api.resolveMessageDestination('message-adoption-applicant', {
    actorProvider: actor(),
  })
  assert.equal(destination.success, true)
  assert.equal(destination.data.target.routeName, 'adoption.progress')
  assert.equal(destination.data.record.applicationId, 'application-a')
  assert.equal(destination.data.target.url.includes('jury'), false)
})

test('rescue review notifications accept the nested applicant relation and reject stale review IDs', () => {
  api.appendMessage(
    message({
      messageId: 'message-rescue-applicant',
      eventKey: 'event-rescue-applicant',
      category: 'service',
      businessType: 'rescue',
      businessId: 'rescue-a',
      reviewItemId: 'review-r',
    }),
    { authorize: () => true },
  )
  storage.set(
    'PAWHOME_RESCUES',
    JSON.stringify([
      {
        id: 'rescue-a',
        applicant: { id: 'actor-a' },
        review: { reviewItemId: 'review-r' },
        status: 'pending',
      },
    ]),
  )
  const ready = api.resolveMessageDestination('message-rescue-applicant', {
    actorProvider: actor(),
  })
  assert.equal(ready.success, true)
  assert.equal(ready.data.target.routeName, 'rescue.progress')
  storage.set(
    'PAWHOME_RESCUES',
    JSON.stringify([
      {
        id: 'rescue-a',
        applicant: { id: 'actor-a' },
        review: { reviewItemId: 'review-other' },
        status: 'pending',
      },
    ]),
  )
  const stale = api.resolveMessageDestination('message-rescue-applicant', {
    actorProvider: actor(),
  })
  assert.equal(stale.success, false)
  assert.equal(stale.error.code, 'FORBIDDEN')
})

test('messages are actor scoped and deep links re-read the current persisted record', () => {
  api.appendMessage(message(), { authorize: () => true })
  storage.set(
    'PAWHOME_FEEDING_ORDERS',
    JSON.stringify([{ id: 'order-a', userId: 'actor-a', status: 'completed' }]),
  )
  const read = api.readMessages({ actorProvider: actor() })
  assert.equal(read.success, true)
  assert.deepEqual(
    read.data.items.map((item) => item.messageId),
    ['message-a'],
  )
  assert.equal(api.readMessages({ actorProvider: actor('actor-b') }).data.items.length, 0)
  const destination = api.resolveMessageDestination('message-a', { actorProvider: actor() })
  assert.equal(destination.success, true)
  assert.equal(destination.data.target.routeName, 'feeding.order.detail')
  assert.equal(destination.data.record.orderId, 'order-a')
  assert.equal(destination.canWrite, false)
})

test('public dynamic message recipients open the same persisted detail record', () => {
  api.appendMessage(
    message({
      messageId: 'message-dynamic',
      eventKey: 'event-dynamic',
      recipientId: 'actor-b',
      category: 'interaction',
      title: '动态有新互动',
      businessType: 'dynamic',
      businessId: 'dynamic-a',
    }),
    { authorize: () => true },
  )
  storage.set(
    'PAWHOME_DYNAMIC_RECORDS',
    JSON.stringify([
      {
        id: 'dynamic-a',
        authorId: 'actor-a',
        body: '当前动态正文',
        public: true,
      },
    ]),
  )
  const destination = api.resolveMessageDestination('message-dynamic', {
    actorProvider: actor('actor-b'),
  })
  assert.equal(destination.success, true)
  assert.equal(destination.data.record.dynamicId, 'dynamic-a')
  assert.equal(destination.data.record.body, '当前动态正文')
})

test('malformed messages, missing actor and missing current records fail closed', () => {
  storage.set(
    api.MESSAGE_STORAGE_KEY,
    JSON.stringify([{ ...message(), recipientId: 'actor-a', businessId: 'order-a/evil' }]),
  )
  const malformed = api.readMessages({ actorProvider: actor() })
  assert.equal(malformed.success, true)
  assert.equal(malformed.data.items.length, 0)
  assert.equal(malformed.diagnostics.skipped[0].code, 'INVALID_ID')
  assert.equal(api.readMessages({ actorProvider: () => null }).error.code, 'NO_ACTOR')
  storage.set(api.MESSAGE_STORAGE_KEY, JSON.stringify([message()]))
  const missing = api.resolveMessageDestination('message-a', { actorProvider: actor() })
  assert.equal(missing.success, false)
  assert.equal(missing.error.code, 'READER_MISSING')
})

test('eventChannel receives only a read-only resolved target', () => {
  api.appendMessage(message(), { authorize: () => true })
  storage.set(
    'PAWHOME_FEEDING_ORDERS',
    JSON.stringify([{ id: 'order-a', userId: 'actor-a', status: 'completed' }]),
  )
  const emitted = []
  const channel = {
    emit(name, value) {
      emitted.push({ name, value })
    },
  }
  const result = api.resolveMessageDestination('message-a', { actorProvider: actor() })
  assert.equal(api.emitMessageDeepLink(channel, result), true)
  assert.equal(emitted[0].name, 'pawhome.message.deep-link')
  assert.equal(emitted[0].value.canWrite, false)
  assert.equal(api.emitMessageDeepLink(channel, { success: false }), false)
})
