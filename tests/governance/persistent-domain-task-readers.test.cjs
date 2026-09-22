'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after, beforeEach } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
let tempRoot
let feeding
let accountTasks
const storage = new Map()

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-persistent-domain-readers-'))
  await fs.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
  await fs.mkdir(path.join(tempRoot, 'packages/feeding/services'), { recursive: true })
  await fs.mkdir(path.join(tempRoot, 'packages/account/services'), { recursive: true })
  await fs.copyFile(path.join(ROOT, 'packages/feeding/services/taskReader.js'), path.join(tempRoot, 'packages/feeding/services/taskReader.js'))
  await fs.copyFile(path.join(ROOT, 'packages/account/services/tasksRuntime.js'), path.join(tempRoot, 'packages/account/services/tasksRuntime.js'))
  globalThis.uni = { getStorageSync(key) { return storage.get(key) }, setStorageSync() { throw new Error('reader must not write') } }
  feeding = await import(`${pathToFileURL(path.join(tempRoot, 'packages/feeding/services/taskReader.js')).href}?test=${Date.now()}`)
  accountTasks = await import(`${pathToFileURL(path.join(tempRoot, 'packages/account/services/tasksRuntime.js')).href}?test=${Date.now()}-dynamic`)
})

beforeEach(() => storage.clear())
after(async () => { delete globalThis.uni; if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true }) })

function actor(id = 'actor-a', roles = ['applicant']) { return () => ({ actor: { id, roles } }) }

test('feeding reader scopes persisted orders by donor or yard owner', () => {
  storage.set('PAWHOME_FEEDING_ORDERS', JSON.stringify([
    { id: 'order-a', userId: 'actor-a', status: 'active' },
    { id: 'order-b', userId: 'actor-b', status: 'active' },
    { id: 'order-c', yardOwnerId: 'owner-a', status: 'completed' },
  ]))
  const donor = feeding.readTasks({ actorProvider: actor() })
  assert.deepEqual(donor.data.items.map(item => item.businessId), ['order-a'])
  const owner = feeding.readTasks({ actorProvider: actor('owner-a', ['yard_owner']) })
  assert.deepEqual(owner.data.items.map(item => [item.businessId, item.actionType, item.status]), [['order-c', 'fulfill', 'completed']])
})

test('dynamic reader scopes persisted posts and has no fixture fallback', () => {
  storage.set('PAWHOME_ACTOR_SESSION', { actor: { id: 'actor-a', roles: ['applicant'] } })
  storage.set('PAWHOME_DYNAMIC_RECORDS', JSON.stringify([
    { id: 'dynamic-a', authorId: 'actor-a', status: 'draft' },
    { id: 'dynamic-b', authorId: 'actor-b', status: 'published' },
  ]))
  const result = accountTasks.readAccountTasks()
  assert.deepEqual(result.all.filter(item => item.businessType === 'dynamic').map(item => [item.businessId, item.status]), [['dynamic-a', 'pending']])
  storage.clear()
  storage.set('PAWHOME_ACTOR_SESSION', { actor: { id: 'actor-a', roles: ['applicant'] } })
  const missing = accountTasks.readAccountTasks()
  assert.ok(missing.diagnostics.skipped.some(item => item.domain === 'dynamic' && item.code === 'READER_MISSING'))
})

test('malformed storage, IDs, and actors fail closed without writes', () => {
  storage.set('PAWHOME_FEEDING_ORDERS', JSON.stringify([{ id: 'https://evil', userId: 'actor-a', status: 'active' }]))
  assert.equal(feeding.readTasks({ actorProvider: actor() }).data.items.length, 0)
  storage.set('PAWHOME_ACTOR_SESSION', { actor: { id: 'actor-a', roles: ['applicant'] } })
  storage.set('PAWHOME_DYNAMIC_RECORDS', '{broken')
  assert.ok(accountTasks.readAccountTasks().diagnostics.skipped.some(item => item.domain === 'dynamic' && item.code === 'INVALID_STORAGE'))
  assert.equal(feeding.readTasks({ actorProvider: () => null }).error.code, 'NO_ACTOR')
})
