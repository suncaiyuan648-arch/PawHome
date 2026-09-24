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
let writes = []

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-order-visibility-'))
  await fs.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
  await fs.mkdir(path.join(tempRoot, 'packages/feeding/services'), { recursive: true })
  await fs.copyFile(path.join(ROOT, 'packages/feeding/services/orderVisibilityStorage.ts'), path.join(tempRoot, 'packages/feeding/services/orderVisibilityStorage.ts'))
  globalThis.uni = {
    getStorageSync(key) { return storage.get(key) },
    setStorageSync(key, value) { writes.push({ key, value }); storage.set(key, value) },
  }
  api = await import(`${pathToFileURL(path.join(tempRoot, 'packages/feeding/services/orderVisibilityStorage.ts')).href}?test=${Date.now()}`)
})

beforeEach(() => { storage.clear(); writes = [] })

after(async () => {
  delete globalThis.uni
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

function actor(id = 'actor-a') { return () => ({ actor: { id, roles: ['applicant'] } }) }

test('hide is scoped to the current user and retries are idempotent', () => {
  const first = api.hideOrderForUser('feed-order-1', { actorProvider: actor() })
  assert.equal(first.success, true)
  assert.equal(first.idempotent, false)
  const retry = api.hideOrderForUser('feed-order-1', { actorProvider: actor() })
  assert.equal(retry.success, true)
  assert.equal(retry.idempotent, true)
  assert.equal(writes.length, 2)
  assert.equal(api.readVisibility({ actorProvider: actor(), orderId: 'feed-order-1' }).data.items[0].hidden, true)
  assert.equal(api.readVisibility({ actorProvider: actor('actor-b'), orderId: 'feed-order-1' }).data.total, 0)
})

test('unhide changes only this user row and never removes the order record', () => {
  api.hideOrderForUser('feed-order-1', { actorProvider: actor() })
  api.hideOrderForUser('feed-order-1', { actorProvider: actor('actor-b') })
  const result = api.unhideOrderForUser('feed-order-1', { actorProvider: actor() })
  assert.equal(result.success, true)
  assert.equal(api.readVisibility({ actorProvider: actor(), orderId: 'feed-order-1' }).data.items[0].hidden, false)
  assert.equal(api.readVisibility({ actorProvider: actor('actor-b'), orderId: 'feed-order-1' }).data.items[0].hidden, true)
})

test('invalid actor, cross-domain ID, malformed storage, and write failure fail closed', () => {
  assert.equal(api.hideOrderForUser('feed-order-1', { actorProvider: () => null }).error.code, 'NO_ACTOR')
  assert.equal(api.hideOrderForUser('application-1', { actorProvider: actor() }).error.code, 'CROSS_DOMAIN_ID')
  storage.set(api.ORDER_VISIBILITY_STORAGE_KEY, '{broken')
  assert.equal(api.readVisibility({ actorProvider: actor() }).error.code, 'INVALID_VISIBILITY_STORAGE')
  storage.clear()
  globalThis.uni.setStorageSync = () => { throw new Error('blocked') }
  assert.equal(api.hideOrderForUser('feed-order-1', { actorProvider: actor() }).error.code, 'STORAGE_WRITE_FAILED')
})
