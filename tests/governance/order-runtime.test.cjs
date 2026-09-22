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
const storage = new Map()

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-order-runtime-'))
  await fs.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
  await fs.mkdir(path.join(tempRoot, 'packages/feeding/services'), { recursive: true })
  await fs.copyFile(path.join(ROOT, 'packages/feeding/services/orderRuntime.js'), path.join(tempRoot, 'packages/feeding/services/orderRuntime.js'))
  globalThis.uni = { getStorageSync: key => storage.get(key) }
  api = await import(`${pathToFileURL(path.join(tempRoot, 'packages/feeding/services/orderRuntime.js')).href}?test=${Date.now()}`)
})

after(async () => { delete globalThis.uni; if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true }) })

function actor(id) { return () => ({ actor: { id, roles: ['applicant'] } }) }

test('persisted order detail separates gift and normal feeding types and scopes by actor', async () => {
  storage.set('PAWHOME_REWARD_ORDERS', JSON.stringify([{ id: 'gift-1', applicationId: 'app-1', userId: 'actor-a', status: 'paid' }]))
  storage.set('PAWHOME_FEEDING_ORDERS', JSON.stringify([{ id: 'feed-1', userPawId: 'actor-a', yardId: 'yard-a', animalId: 'animal-a', stateKey: 'completed' }]))
  const gift = await api.readPersistedOrderDetail('gift-1', { actorProvider: actor('actor-a') })
  const feed = await api.readPersistedOrderDetail('feed-1', { actorProvider: actor('actor-a') })
  const other = await api.readPersistedOrderDetail('gift-1', { actorProvider: actor('actor-b') })
  assert.equal(gift.data.order.orderType, 'adoption_gift')
  assert.equal(feed.data.order.orderType, 'normal_feed')
  assert.equal(feed.data.order.status, 'completed')
  assert.equal(other.error.code, 'NOT_FOUND')
})

test('hidden visibility is a per-user read gate and malformed storage fails closed', async () => {
  const hidden = await api.readPersistedOrderDetail('feed-1', { actorProvider: actor('actor-a'), hiddenEntries: [{ userId: 'actor-a', orderId: 'feed-1', hidden: true }] })
  assert.equal(hidden.error.code, 'HIDDEN')
  storage.set('PAWHOME_FEEDING_ORDERS', '{bad')
  const invalid = await api.readPersistedOrderDetail('feed-1', { actorProvider: actor('actor-a') })
  assert.equal(invalid.error.code, 'INVALID_ORDER_STORAGE')
})
