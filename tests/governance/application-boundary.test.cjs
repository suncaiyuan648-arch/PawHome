'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after, beforeEach } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const ADOPTION_KEY = 'PAWHOME_ADOPTIONS'
const RESCUE_KEY = 'PAWHOME_RESCUES'
const REWARD_KEY = 'PAWHOME_REWARD_ORDERS'
const ACTOR_KEY = 'PAWHOME_ACTOR_SESSION'
const FIXTURE_ACTOR_ID = 'fixture-applicant'

let tempEsmRoot
let api
let adoptionStorage
let rescueStorage

async function loadEsm() {
  if (!tempEsmRoot) {
    tempEsmRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-application-boundary-'))
    await fs.cp(path.join(ROOT, 'contracts'), path.join(tempEsmRoot, 'contracts'), {
      recursive: true,
    })
    await fs.writeFile(path.join(tempEsmRoot, 'package.tson'), '{"type":"module"}\n')
    await fs.mkdir(path.join(tempEsmRoot, 'utils'), { recursive: true })
    for (const file of [
      'applicationMockApi.ts',
      'adoptionStorage.ts',
      'rescueStorage.ts',
      'rewardOrderStorage.ts',
    ]) {
      await fs.copyFile(path.join(ROOT, 'utils', file), path.join(tempEsmRoot, 'utils', file))
    }
  }
  const fileUrl = pathToFileURL(path.join(tempEsmRoot, 'utils/applicationMockApi.ts')).href
  return import(`${fileUrl}?test=${Date.now()}-${Math.random()}`)
}

function resetStorage() {
  globalThis.uni.storage.clear()
  globalThis.uni.reads.length = 0
  globalThis.uni.writes.length = 0
  globalThis.uni.readFailKeys.clear()
  globalThis.uni.failKeys.clear()
}

function storageValue(key) {
  return globalThis.uni.storage.has(key) ? globalThis.uni.storage.get(key) : undefined
}

function readOrders() {
  const raw = storageValue(REWARD_KEY)
  return raw ? JSON.parse(raw) : []
}

function seedAdoption(id, status = 'reward') {
  globalThis.uni.storage.set(ACTOR_KEY, { actor: { id: FIXTURE_ACTOR_ID, roles: ['applicant'] } })
  return adoptionStorage.addAdoption({
    id,
    status,
    applicantId: FIXTURE_ACTOR_ID,
    applicantUserId: FIXTURE_ACTOR_ID,
    userId: FIXTURE_ACTOR_ID,
    ownerName: '测试院主',
    yardId: 'yard-real',
    pets: [{ id: `${id}-pet`, name: '测试猫' }],
  })
}

function seedRescue(id) {
  return rescueStorage.createRescue({
    id,
    applicantName: '测试求助人',
    description: '真实救助记录',
  })
}

function assertFailed(result, code) {
  assert.equal(result.success, false)
  assert.equal(result.source, 'mock')
  assert.equal(result.error.code, code)
}

before(async () => {
  globalThis.uni = {
    storage: new Map(),
    reads: [],
    writes: [],
    readFailKeys: new Set(),
    failKeys: new Set(),
    getStorageSync(key) {
      this.reads.push(key)
      if (this.readFailKeys.has(key)) throw new Error(`read failed: ${key}`)
      return this.storage.get(key)
    },
    setStorageSync(key, value) {
      this.writes.push({ key, value })
      if (this.failKeys.has(key)) throw new Error(`write failed: ${key}`)
      this.storage.set(key, value)
    },
    removeStorageSync(key) {
      this.storage.delete(key)
    },
  }
  api = await loadEsm()
  const loaded = await import(
    `${pathToFileURL(path.join(tempEsmRoot, 'utils/adoptionStorage.ts')).href}?test=${Date.now()}-adoption`
  )
  const rescue = await import(
    `${pathToFileURL(path.join(tempEsmRoot, 'utils/rescueStorage.ts')).href}?test=${Date.now()}-rescue`
  )
  adoptionStorage = loaded
  rescueStorage = rescue
})

beforeEach(resetStorage)

after(async () => {
  if (tempEsmRoot) await fs.rm(tempEsmRoot, { recursive: true, force: true })
})

test('unknown application types fail closed without reading or mutating either domain', () => {
  for (const type of [undefined, null, ' ', 'unknown']) {
    for (const operation of [
      () => api.createApplication(type, { id: 'forged' }),
      () => api.getApplication(type, 'forged'),
      () => api.getApplicationStatus(type, 'forged'),
      () => api.updateApplication(type, 'forged', { status: 'reward' }),
      () => api.advanceApplication(type, 'forged', 'reward'),
      () => api.listApplications(type),
      () => api.reopenApplication(type, 'forged'),
    ]) {
      const snapshot = new Map(globalThis.uni.storage)
      const reads = globalThis.uni.reads.length
      const writes = globalThis.uni.writes.length
      assertFailed(operation(), 'INVALID_TYPE')
      assert.deepEqual(globalThis.uni.storage, snapshot)
      assert.equal(globalThis.uni.reads.length, reads)
      assert.equal(globalThis.uni.writes.length, writes)
    }
  }
})

test('adoption and rescue records coexist while rescue creation writes only rescue storage', () => {
  const adoption = seedAdoption('adoption-real', 'pending')
  const adoptionBefore = storageValue(ADOPTION_KEY)
  const rescue = api.createApplication('rescue', { id: 'rescue-real' })
  assert.equal(adoption.id, 'adoption-real')
  assert.equal(rescue.success, true)
  assert.equal(rescue.data.applicationType, 'rescue')
  assert.equal(storageValue(ADOPTION_KEY), adoptionBefore)
  assert.ok(storageValue(RESCUE_KEY))
  assert.equal(api.getApplication('adoption', 'rescue-real', { includeDemo: false }).success, false)
})

test('reward creation requires a saved adoption and a legal claim stage', () => {
  seedAdoption('early-app', 'pending')
  seedRescue('rescue-app')
  const before = storageValue(REWARD_KEY)
  const writes = globalThis.uni.writes.length

  assertFailed(api.createRewardOrder('missing-app', { id: 'address-1' }), 'APPLICATION_NOT_FOUND')
  assertFailed(api.createRewardOrder('rescue-app', { id: 'address-1' }), 'APPLICATION_NOT_FOUND')
  assertFailed(api.createRewardOrder('early-app', { id: 'address-1' }), 'INVALID_STAGE')
  assertFailed(api.createRewardOrder('early-app', {}), 'MISSING_ADDRESS')
  assert.equal(storageValue(REWARD_KEY), before)
  assert.equal(globalThis.uni.writes.length, writes)
})

test('reward_done is idempotent only when its existing order is explicitly associated', () => {
  seedAdoption('legacy-app', 'reward_done')
  globalThis.uni.setStorageSync(
    REWARD_KEY,
    JSON.stringify([
      {
        id: 'legacy-order',
        recordId: 'legacy-app',
        status: 'submitted',
      },
    ]),
  )
  const fetched = api.getRewardOrderById('legacy-order')
  assert.equal(fetched.success, true)
  assert.equal(fetched.data.applicationId, 'legacy-app')
  assert.equal(fetched.data.recordId, 'legacy-app')
  const retried = api.createRewardOrder('legacy-app', { id: 'address-legacy' })
  assert.equal(retried.success, true)
  assert.equal(retried.data.id, 'legacy-order')
  assert.equal(readOrders().length, 1)

  resetStorage()
  seedAdoption('done-without-order', 'reward_done')
  const rewardWrites = globalThis.uni.writes.filter((entry) => entry.key === REWARD_KEY).length
  assertFailed(
    api.createRewardOrder('done-without-order', { id: 'address-1' }),
    'REWARD_ORDER_MISSING',
  )
  assert.equal(
    globalThis.uni.writes.filter((entry) => entry.key === REWARD_KEY).length,
    rewardWrites,
  )
})

test('a retry for one application returns the one saved order, including explicit legacy compatibility', () => {
  seedAdoption('one-order-app', 'reward')
  const first = api.createRewardOrder('one-order-app', { id: 'address-1', label: '一号地址' })
  const second = api.createRewardOrder('one-order-app', { id: 'address-2', label: '二号地址' })
  assert.equal(first.success, true)
  assert.equal(second.success, true)
  assert.equal(second.data.id, first.data.id)
  assert.equal(first.data.applicationId, 'one-order-app')
  assert.equal(first.data.recordId, 'one-order-app')
  assert.equal(readOrders().length, 1)

  const directLegacy = {
    id: 'record-only-order',
    recordId: 'one-order-app',
    status: 'submitted',
  }
  globalThis.uni.setStorageSync(REWARD_KEY, JSON.stringify([directLegacy]))
  const exact = api.getRewardOrderById('record-only-order')
  assert.equal(exact.success, true)
  assert.equal(exact.data.applicationId, 'one-order-app')
  assertFailed(api.getRewardOrderById('other-order'), 'NOT_FOUND')
})

test('missing or unknown order IDs never fall back to another stored/demo order', () => {
  globalThis.uni.setStorageSync(
    REWARD_KEY,
    JSON.stringify([
      {
        id: 'known-order',
        recordId: 'known-app',
        status: 'submitted',
      },
    ]),
  )
  assertFailed(api.getRewardOrderById(''), 'MISSING_ORDER_ID')
  assertFailed(api.getRewardOrderById('demo-reward-order'), 'NOT_FOUND')
})

test('malformed order JSON or a non-array root fails without erasing the stored value', () => {
  for (const raw of ['{"broken"', '{"not":"an array"}', '42']) {
    resetStorage()
    globalThis.uni.storage.set(REWARD_KEY, raw)
    const writes = globalThis.uni.writes.length
    assertFailed(api.getRewardOrderById('known-order'), 'INVALID_ORDER_STORAGE')
    assert.equal(storageValue(REWARD_KEY), raw)
    assert.equal(globalThis.uni.writes.length, writes)
  }
})

test('invalid records, association conflicts, duplicate order IDs, and ambiguous applications fail closed', () => {
  const malformedLists = [
    { code: 'INVALID_ORDER_RECORD', value: [{ id: 'order-without-application' }] },
    {
      code: 'INVALID_ORDER_RECORD',
      value: [{ id: 'conflicting-order', recordId: 'app-a', applicationId: 'app-b' }],
    },
    {
      code: 'DUPLICATE_ORDER_ID',
      value: [
        { id: 'duplicate-order', recordId: 'app-a' },
        { id: 'duplicate-order', recordId: 'app-b' },
      ],
    },
    {
      code: 'AMBIGUOUS_APPLICATION_ORDER',
      value: [
        { id: 'order-a', recordId: 'same-app' },
        { id: 'order-b', applicationId: 'same-app' },
      ],
    },
  ]
  for (const { code, value } of malformedLists) {
    resetStorage()
    const raw = JSON.stringify(value)
    globalThis.uni.storage.set(REWARD_KEY, raw)
    assertFailed(api.getRewardOrderById(value[0].id), code)
    assert.equal(storageValue(REWARD_KEY), raw)
    assert.equal(globalThis.uni.writes.length, 0)
  }
})

test('createRewardOrder never overwrites malformed or conflicting existing order data', () => {
  seedAdoption('protected-app', 'reward')
  const raw = JSON.stringify([
    {
      id: 'conflicting-order',
      recordId: 'other-app',
      applicationId: 'protected-app',
    },
  ])
  globalThis.uni.storage.set(REWARD_KEY, raw)
  const rewardWrites = globalThis.uni.writes.filter((entry) => entry.key === REWARD_KEY).length
  assertFailed(api.createRewardOrder('protected-app', { id: 'address-1' }), 'INVALID_ORDER_RECORD')
  assert.equal(storageValue(REWARD_KEY), raw)
  assert.equal(
    globalThis.uni.writes.filter((entry) => entry.key === REWARD_KEY).length,
    rewardWrites,
  )
})

test('a reward storage read exception is distinct from invalid persisted data', () => {
  globalThis.uni.readFailKeys.add(REWARD_KEY)
  const writes = globalThis.uni.writes.length
  assertFailed(api.getRewardOrderById('known-order'), 'STORAGE_READ_FAILED')
  assert.equal(globalThis.uni.writes.length, writes)
})

test('adoption storage read exceptions retain its existing swallowed-read limitation', () => {
  globalThis.uni.readFailKeys.add(ADOPTION_KEY)
  const result = api.getApplication('adoption', 'missing-real-app', { includeDemo: false })
  assertFailed(result, 'NOT_FOUND')
})

test('reward order save failures are returned and leave the application unchanged', () => {
  seedAdoption('write-fail-app', 'reward')
  const before = api.getApplication('adoption', 'write-fail-app', { includeDemo: false })
  globalThis.uni.failKeys.add(REWARD_KEY)
  const result = api.createRewardOrder('write-fail-app', { id: 'address-1' })
  assertFailed(result, 'STORAGE_WRITE_FAILED')
  const after = api.getApplication('adoption', 'write-fail-app', { includeDemo: false })
  assert.equal(after.success, true)
  assert.equal(after.data.status, before.data.status)
  assert.equal(storageValue(REWARD_KEY), undefined)
})

test('an order saved before an application transition failure is reused on retry', () => {
  seedAdoption('intermediate-app', 'reward')
  const created = api.createRewardOrder('intermediate-app', { id: 'address-1' })
  assert.equal(created.success, true)
  globalThis.uni.failKeys.add(ADOPTION_KEY)
  assertFailed(
    api.advanceApplication('adoption', 'intermediate-app', 'reward_done', {
      rewardOrderId: created.data.id,
    }),
    'STORAGE_WRITE_FAILED',
  )
  globalThis.uni.failKeys.delete(ADOPTION_KEY)
  const retry = api.createRewardOrder('intermediate-app', { id: 'address-1' })
  assert.equal(retry.success, true)
  assert.equal(retry.data.id, created.data.id)
  assert.equal(readOrders().length, 1)
})

test('adoption write errors are structured failures instead of false success', () => {
  seedAdoption('adoption-write-fail', 'pending')
  globalThis.uni.failKeys.add(ADOPTION_KEY)
  const result = api.updateApplication('adoption', 'adoption-write-fail', { status: 'rejected' })
  assertFailed(result, 'STORAGE_WRITE_FAILED')
})
