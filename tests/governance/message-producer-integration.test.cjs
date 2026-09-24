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
let storage

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-message-producer-'))
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
  storage = new Map()
  globalThis.uni = {
    getStorageSync(key) {
      return storage.get(key)
    },
    setStorageSync(key, value) {
      storage.set(key, value)
    },
  }
  api = await import(
    `${pathToFileURL(path.join(tempRoot, 'packages/message/services/messageStore.ts')).href}?test=${Date.now()}`
  )
})

beforeEach(() => {
  storage.clear()
  storage.set('PAWHOME_ACTOR_SESSION', { actor: { id: 'reviewer-a', roles: ['reviewer'] } })
})

after(async () => {
  delete globalThis.uni
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

function action(overrides = {}) {
  return {
    success: true,
    actorId: 'reviewer-a',
    idempotencyKey: 'rescue-review-review-a-approved',
    rescueId: 'rescue-a',
    reviewItemId: 'review-a',
    toStatus: 'approved',
    ...overrides,
  }
}

test('a successful local review action produces one actor-authorized, idempotent notification', () => {
  const result = api.produceLocalActionNotification({
    action: action(),
    recipientId: 'applicant-a',
    businessType: 'rescue',
    businessId: 'rescue-a',
    reviewItemId: 'review-a',
    category: 'service',
    title: '救助审核已通过',
    preview: '已通过',
    actorProvider: () => storage.get('PAWHOME_ACTOR_SESSION'),
    authorize: ({ actor, message }) =>
      actor.id === 'reviewer-a' && message.recipientId === 'applicant-a',
  })
  assert.equal(result.success, true)
  assert.equal(result.wrote, true)
  const retry = api.produceLocalActionNotification({
    action: action({ toStatus: 'approved' }),
    recipientId: 'applicant-a',
    businessType: 'rescue',
    businessId: 'rescue-a',
    reviewItemId: 'review-a',
    category: 'service',
    title: '重试不覆盖',
    preview: 'x',
    actorProvider: () => storage.get('PAWHOME_ACTOR_SESSION'),
    authorize: () => true,
  })
  assert.equal(retry.idempotent, true)
  assert.equal(JSON.parse(storage.get(api.MESSAGE_STORAGE_KEY)).length, 1)
})

test('stale actors and unauthorized cross-recipient producers fail without a message write', () => {
  const denied = api.produceLocalActionNotification({
    action: action({ actorId: 'reviewer-b' }),
    recipientId: 'applicant-a',
    businessType: 'rescue',
    businessId: 'rescue-a',
    reviewItemId: 'review-a',
    category: 'service',
    title: 'x',
    preview: 'x',
    actorProvider: () => storage.get('PAWHOME_ACTOR_SESSION'),
    authorize: () => true,
  })
  assert.equal(denied.error.code, 'ACTOR_MISMATCH')
  const forbidden = api.produceLocalActionNotification({
    action: action(),
    recipientId: 'applicant-b',
    businessType: 'rescue',
    businessId: 'rescue-a',
    reviewItemId: 'review-a',
    category: 'service',
    title: 'x',
    preview: 'x',
    actorProvider: () => storage.get('PAWHOME_ACTOR_SESSION'),
    authorize: () => false,
  })
  assert.equal(forbidden.error.code, 'FORBIDDEN')
  assert.equal(storage.has(api.MESSAGE_STORAGE_KEY), false)
})

test('a producer cannot bind a successful action to another business or review item', () => {
  const wrongBusiness = api.produceLocalActionNotification({
    action: action({ rescueId: 'rescue-other' }),
    recipientId: 'applicant-a',
    businessType: 'rescue',
    businessId: 'rescue-a',
    reviewItemId: 'review-a',
    category: 'service',
    title: 'x',
    preview: 'x',
    actorProvider: () => storage.get('PAWHOME_ACTOR_SESSION'),
    authorize: () => true,
  })
  assert.equal(wrongBusiness.error.code, 'ACTION_TARGET_MISMATCH')
  const wrongReview = api.produceLocalActionNotification({
    action: action({ reviewItemId: 'review-other' }),
    recipientId: 'applicant-a',
    businessType: 'rescue',
    businessId: 'rescue-a',
    reviewItemId: 'review-a',
    category: 'service',
    title: 'x',
    preview: 'x',
    actorProvider: () => storage.get('PAWHOME_ACTOR_SESSION'),
    authorize: () => true,
  })
  assert.equal(wrongReview.error.code, 'ACTION_TARGET_MISMATCH')
  assert.equal(storage.has(api.MESSAGE_STORAGE_KEY), false)
})
