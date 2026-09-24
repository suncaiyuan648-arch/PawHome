'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after, beforeEach } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const ADOPTION_KEY = 'PAWHOME_ADOPTIONS'
const REWARD_KEY = 'PAWHOME_REWARD_ORDERS'
const ACTOR_KEY = 'PAWHOME_ACTOR_SESSION'
let tempRoot
let api
let storage
let writes

function session(id) {
  return { actor: { id, roles: ['applicant'] } }
}

function useActor(id) {
  storage.set(ACTOR_KEY, session(id))
}

function reset() {
  storage.clear()
  writes = []
}

function recordId(result) {
  assert.equal(result.success, true, result.error && result.error.message)
  assert.ok(result.data && result.data.id)
  return result.data.id
}

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-adoption-identity-chain-'))
  await fs.cp(path.join(ROOT, 'contracts'), path.join(tempRoot, 'contracts'), { recursive: true })
  await fs.writeFile(path.join(tempRoot, 'package.tson'), '{"type":"module"}\n')
  await fs.mkdir(path.join(tempRoot, 'utils'), { recursive: true })
  for (const file of [
    'applicationMockApi.ts',
    'adoptionStorage.ts',
    'rescueStorage.ts',
    'rewardOrderStorage.ts',
  ]) {
    await fs.copyFile(path.join(ROOT, 'utils', file), path.join(tempRoot, 'utils', file))
  }
  storage = new Map()
  globalThis.uni = {
    getStorageSync(key) {
      return storage.get(key)
    },
    setStorageSync(key, value) {
      writes.push({ key, value })
      storage.set(key, value)
    },
    removeStorageSync(key) {
      storage.delete(key)
    },
  }
  api = await import(
    `${pathToFileURL(path.join(tempRoot, 'utils/applicationMockApi.ts')).href}?test=${Date.now()}`
  )
})

beforeEach(reset)

after(async () => {
  delete globalThis.uni
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

test('normal adoption creation binds the trusted session actor and rejects a forged applicant relation', () => {
  useActor('applicant-a')
  const created = api.createApplication('adoption', {
    applicantId: 'applicant-b',
    status: 'pending',
    ownerPawId: 'owner-a',
    pets: [{ id: 'pet-a', name: '小猫' }],
  })
  assert.equal(created.success, false)
  assert.equal(created.error.code, 'ACTOR_MISMATCH')
  assert.equal(storage.has(ADOPTION_KEY), false)

  const record = api.createApplication('adoption', {
    status: 'pending',
    ownerPawId: 'owner-a',
    pets: [{ id: 'pet-a', name: '小猫' }],
  })
  const id = recordId(record)
  const saved = JSON.parse(storage.get(ADOPTION_KEY))[0]
  assert.equal(saved.id, id)
  assert.equal(saved.applicantId, 'applicant-a')
  assert.equal(saved.applicantUserId, 'applicant-a')
  assert.equal(saved.userId, 'applicant-a')
})

test('confirmation material is applicant-owned and writes the full evidence payload once', () => {
  useActor('applicant-a')
  const id = recordId(api.createApplication('adoption', { status: 'pickup', pets: [] }))
  const before = writes.length

  useActor('applicant-b')
  const denied = api.submitAdoptionEvidence(id, { photos: ['a.png', 'b.png'], story: '越权' })
  assert.equal(denied.success, false)
  assert.equal(denied.error.code, 'FORBIDDEN')
  assert.equal(writes.length, before)

  useActor('applicant-a')
  const accepted = api.submitAdoptionEvidence(id, {
    photos: ['a.png', 'b.png'],
    story: '我已经把小猫带回家了',
  })
  assert.equal(accepted.success, true, accepted.error && accepted.error.message)
  const saved = JSON.parse(storage.get(ADOPTION_KEY))[0]
  assert.equal(saved.status, 'owner_confirm_pending')
  assert.deepEqual(saved.proofPhotos, ['a.png', 'b.png'])
  assert.equal(saved.confirmStory, '我已经把小猫带回家了')
})

test('reward order creation and exact detail are bound to applicationId plus applicant actor', () => {
  useActor('applicant-a')
  const id = recordId(api.createApplication('adoption', { status: 'reward', pets: [] }))

  useActor('applicant-b')
  const deniedCreate = api.createRewardOrder(id, { id: 'address-a' })
  assert.equal(deniedCreate.success, false)
  assert.equal(deniedCreate.error.code, 'FORBIDDEN')
  assert.equal(storage.has(REWARD_KEY), false)

  useActor('applicant-a')
  const created = api.createRewardOrder(id, { id: 'address-a', label: '家' })
  assert.equal(created.success, true, created.error && created.error.message)
  assert.equal(created.data.applicationId, id)
  assert.equal(created.data.userId, 'applicant-a')

  useActor('applicant-b')
  const deniedRead = api.getRewardOrderById(created.data.id)
  assert.equal(deniedRead.success, false)
  assert.equal(deniedRead.error.code, 'FORBIDDEN')

  useActor('applicant-a')
  const exact = api.getRewardOrderById(created.data.id)
  assert.equal(exact.success, true)
  assert.equal(exact.data.applicationId, id)
  assert.equal(api.getRewardOrderById('missing-order').error.code, 'NOT_FOUND')
})
