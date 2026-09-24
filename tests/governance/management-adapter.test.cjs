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

const POLICY = Object.freeze({
  profile: Object.freeze({ readStates: ['active'], editStates: ['active'] }),
  yard: Object.freeze({
    readStates: ['active'],
    manageStates: ['active'],
    editStates: ['active'],
    ownerRoles: ['yard_owner'],
    yardOwnerRoles: ['yard_owner'],
  }),
  animal: Object.freeze({
    readStates: ['active'],
    manageStates: ['active'],
    editStates: ['active'],
    yardOwnerRoles: ['yard_owner'],
    managerRoles: ['animal_manager'],
  }),
})

function actor(id, roles = []) {
  return () => ({ actor: { id, roles } })
}

function profile(overrides = {}) {
  return {
    userId: 'user-a',
    status: 'active',
    visibility: 'public',
    nickname: 'A',
    phone: 'private',
    ...overrides,
  }
}

function yard(overrides = {}) {
  return {
    yardId: 'yard-a',
    yardOwnerId: 'owner-a',
    status: 'active',
    visibility: 'public',
    name: 'A yard',
    ...overrides,
  }
}

function animal(overrides = {}) {
  return {
    animalId: 'animal-a',
    yardId: 'yard-a',
    yardOwnerId: 'owner-a',
    managerIds: ['manager-a'],
    status: 'active',
    visibility: 'public',
    name: 'A cat',
    privateNote: 'private',
    ...overrides,
  }
}

function readerMap(overrides = {}) {
  return {
    profile: ({ userId }) => profile({ userId }),
    yard: ({ yardId }) => yard({ yardId }),
    animal: ({ animalId }) => animal({ animalId }),
    ...overrides,
  }
}

function readWith(resourceType, id, options = {}) {
  return api.readManagementResourceWithReader(resourceType, id, {
    policy: POLICY,
    actorProvider: actor('user-a'),
    reader: readerMap()[resourceType],
    ...options,
  })
}

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-management-adapter-'))
  await fs.writeFile(path.join(tempRoot, 'package.tson'), '{"type":"module"}\n')
  await fs.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
  await fs.mkdir(path.join(tempRoot, 'packages/account/services'), { recursive: true })
  await fs.copyFile(
    path.join(ROOT, 'navigation/actorCapabilities.ts'),
    path.join(tempRoot, 'navigation/actorCapabilities.ts'),
  )
  await fs.copyFile(
    path.join(ROOT, 'navigation/managementContracts.ts'),
    path.join(tempRoot, 'navigation/managementContracts.ts'),
  )
  await fs.copyFile(
    path.join(ROOT, 'packages/account/services/managementAdapter.ts'),
    path.join(tempRoot, 'packages/account/services/managementAdapter.ts'),
  )
  api = await import(
    `${pathToFileURL(path.join(tempRoot, 'packages/account/services/managementAdapter.ts')).href}?test=${Date.now()}`
  )
})

after(async () => {
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

test('management adapter is a read-only reader seam with no page or storage binding', async () => {
  const source = await fs.readFile(
    path.join(ROOT, 'packages/account/services/managementAdapter.ts'),
    'utf8',
  )
  assert.match(source, /managementContracts\.ts/)
  assert.doesNotMatch(source, /from\s+['"][^'"]*(?:pages|utils\/|storage|mock)/i)
  assert.doesNotMatch(source, /setStorageSync|removeStorageSync|save[A-Z]|update[A-Z]|delete[A-Z]/)
  assert.equal(typeof api.readProfile, 'function')
  assert.equal(typeof api.readYard, 'function')
  assert.equal(typeof api.readAnimal, 'function')
})

test('missing storage readers return an explicit empty result and never import demo fixtures', () => {
  const result = api.readManagementResource('yard', 'yard-a', {
    actorProvider: actor('owner-a'),
    policy: POLICY,
  })
  assert.equal(result.success, false)
  assert.equal(result.error.code, 'READER_MISSING')
  assert.equal(result.data, null)
  assert.equal(result.readOnly, true)
  assert.equal(result.canWrite, false)
  const demo = api.readManagementResource('yard', 'yard-a', {
    actorProvider: actor('owner-a'),
    policy: POLICY,
    includeDemo: true,
  })
  assert.equal(demo.error.code, 'DEMO_FALLBACK_DISABLED')
})

test('public reads expose only public fields and query role/managed hints cannot grant private access', () => {
  let received
  const result = readWith('profile', 'user-a', {
    actorProvider: actor('other-user', ['cloud_parent']),
    query: { role: 'owner', managed: true, state: 'active' },
    reader(context) {
      received = context
      return profile()
    },
  })
  assert.equal(result.success, true)
  assert.equal(result.data.record.nickname, 'A')
  assert.equal('phone' in result.data.record, false)
  assert.equal(result.data.access.canEdit, false)
  assert.equal(result.canWrite, false)
  assert.deepEqual(received, { userId: 'user-a' })
})

test('profile private access requires the trusted owner and returns a defensive private snapshot', () => {
  const own = readWith('profile', 'user-a', {
    access: 'private',
    actorProvider: actor('user-a'),
    reader: ({ userId }) => profile({ userId, visibility: 'private' }),
  })
  assert.equal(own.success, true)
  assert.equal(own.data.record.phone, 'private')
  assert.equal(own.data.capabilities['profile.readPrivate'], true)
  assert.equal(own.data.capabilities['profile.edit'], true)
  assert.equal(own.readOnly, true)
  assert.equal(own.canWrite, false)
  assert.ok(Object.isFrozen(own))
  assert.ok(Object.isFrozen(own.data.record))

  const other = readWith('profile', 'user-a', {
    access: 'private',
    actorProvider: actor('other-user'),
    reader: ({ userId }) => profile({ userId, visibility: 'private' }),
  })
  assert.equal(other.success, false)
  assert.equal(other.error.code, 'FORBIDDEN')
  assert.equal(other.data, null)
})

test('yard management requires a trusted owner relation; non-owner query hints stay denied', () => {
  const owner = readWith('yard', 'yard-a', {
    access: 'management',
    actorProvider: actor('owner-a', ['yard_owner']),
    reader: ({ yardId }) => yard({ yardId }),
  })
  assert.equal(owner.success, true)
  assert.equal(owner.data.capabilities['yard.management.readPrivate'], true)
  assert.equal(owner.data.capabilities['yard.edit'], true)
  assert.equal(owner.canWrite, false)

  const other = readWith('yard', 'yard-a', {
    access: 'management',
    actorProvider: actor('other-user', ['yard_owner']),
    query: { role: 'yard_owner', managed: true, state: 'active' },
    reader: ({ yardId }) => yard({ yardId, yardOwnerId: 'owner-a' }),
  })
  assert.equal(other.success, false)
  assert.equal(other.error.code, 'FORBIDDEN')
  assert.equal(other.error.reason, 'YARD_OWNER_RELATION_REQUIRED')
})

test('cloud parent cannot manage animals; explicit manager and current parent yard owner can read management data', () => {
  const cloudParent = readWith('animal', 'animal-a', {
    access: 'management',
    actorProvider: actor('cloud-parent-a', ['cloud_parent']),
    readers: readerMap(),
  })
  assert.equal(cloudParent.success, false)
  assert.equal(cloudParent.error.code, 'FORBIDDEN')

  const manager = readWith('animal', 'animal-a', {
    access: 'management',
    actorProvider: actor('manager-a', ['animal_manager']),
    readers: readerMap(),
    reader: readerMap().animal,
  })
  assert.equal(manager.success, true)
  assert.equal(manager.data.record.privateNote, 'private')
  assert.equal(manager.data.capabilities['animal.edit'], true)

  const owner = readWith('animal', 'animal-a', {
    access: 'management',
    actorProvider: actor('owner-a', ['yard_owner']),
    readers: readerMap(),
    reader: readerMap().animal,
  })
  assert.equal(owner.success, true)
  assert.equal(owner.data.capabilities['animal.management.readPrivate'], true)
})

test('cross-yard locator and cross-domain/demo IDs fail before a reader can return another record', () => {
  let calls = 0
  const reader = () => {
    calls += 1
    return animal()
  }
  const crossYard = readWith('animal', 'animal-a', {
    yardId: 'yard-b',
    reader,
  })
  assert.equal(crossYard.success, false)
  assert.equal(crossYard.error.code, 'CROSS_YARD_RELATION')
  assert.equal(calls, 1)

  for (const [resourceType, id] of [
    ['animal', 'yard-a'],
    ['yard', 'animal-a'],
    ['profile', 'yard-a'],
    ['animal', 'demo-animal-a'],
    ['yard', 'yard/a'],
  ]) {
    const result = readWith(resourceType, id, { reader })
    assert.equal(result.success, false)
    assert.ok(['CROSS_DOMAIN_ID', 'DEMO_RECORD_REJECTED', 'INVALID_ID'].includes(result.error.code))
  }
  assert.equal(calls, 1)
})

test('reader exceptions, promises, malformed records, and forged records fail closed', () => {
  const throwing = readWith('yard', 'yard-a', {
    reader: () => {
      throw new Error('boom')
    },
  })
  assert.equal(throwing.success, false)
  assert.equal(throwing.error.code, 'READER_FAILED')

  const asyncResult = readWith('yard', 'yard-a', { reader: () => Promise.resolve(yard()) })
  assert.equal(asyncResult.success, false)
  assert.equal(asyncResult.error.code, 'ASYNC_READER_UNSUPPORTED')

  const malformed = readWith('yard', 'yard-a', {
    reader: () => ({ id: 'other-yard', status: 'active' }),
  })
  assert.equal(malformed.success, false)
  assert.ok(['MISSING_ID', 'READER_SCOPE_VIOLATION'].includes(malformed.error.code))

  const forged = api.readYard('yard-a', {
    policy: POLICY,
    actorProvider: actor('owner-a', ['yard_owner']),
    record: yard({ yardOwnerId: 'owner-a' }),
    readers: readerMap(),
  })
  assert.equal(forged.success, false)
  assert.equal(forged.error.code, 'UNTRUSTED_AUTH_FIELD')
})

test('cancelled editor reads consume no reader and always retain the read-only envelope', () => {
  let calls = 0
  const result = readWith('yard', 'yard-a', {
    intent: 'cancel',
    reader: () => {
      calls += 1
      return yard()
    },
  })
  assert.equal(result.success, true)
  assert.equal(result.cancelled, true)
  assert.equal(result.data, null)
  assert.equal(result.readOnly, true)
  assert.equal(result.canWrite, false)
  assert.equal(calls, 0)
})

test('fixed adapter re-reads actor and source, while per-call reader replacement is rejected', () => {
  let current = 'owner-a'
  let reads = 0
  const adapter = api.createManagementAdapter({
    actorProvider: () => ({ actor: { id: current, roles: ['yard_owner'] } }),
    policy: POLICY,
    readers: {
      yard: ({ yardId }) => {
        reads += 1
        return yard({ yardId })
      },
    },
  })
  assert.equal(adapter.readYard('yard-a', { access: 'management' }).success, true)
  current = 'owner-b'
  const denied = adapter.readYard('yard-a', { access: 'management' })
  assert.equal(denied.success, false)
  assert.equal(denied.error.reason, 'YARD_OWNER_RELATION_REQUIRED')
  assert.equal(reads, 2)
  const replaced = adapter.readYard('yard-a', {
    reader: () => yard({ yardOwnerId: 'owner-b' }),
    access: 'management',
  })
  assert.equal(replaced.success, false)
  assert.equal(replaced.error.code, 'READER_OVERRIDE_UNSUPPORTED')
})
