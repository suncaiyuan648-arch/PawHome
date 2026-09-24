'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after, beforeEach } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const KEY = 'PAWHOME_ADOPTIONS'
let tempRoot
let api
let storage

function actor(id = 'owner-a', roles = ['owner']) {
  return () => ({ actor: { id, roles } })
}

function ownerRecord(overrides = {}) {
  return {
    id: 'adoption-record-a',
    applicationType: 'adoption',
    businessType: 'adoption',
    applicationId: 'application-a',
    applicantId: 'applicant-a',
    ownerId: 'owner-a',
    status: 'pending',
    yardId: 'yard-a',
    applicantName: '申请人 A',
    pets: [],
    review: {
      applicationId: 'application-a',
      reviewItemId: 'review-owner-a',
      phase: 'owner',
      reviewerRole: 'owner',
      reviewerId: 'owner-a',
      status: 'pending',
    },
    ...overrides,
  }
}

function seed(records) {
  storage.set(KEY, JSON.stringify(records))
}

function reset() {
  storage.clear()
  globalThis.uni = {
    getStorageSync(key) {
      return storage.get(key)
    },
    setStorageSync(key, value) {
      storage.set(key, value)
    },
    removeStorageSync(key) {
      storage.delete(key)
    },
  }
}

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-adoption-review-action-'))
  await fs.cp(path.join(ROOT, 'contracts'), path.join(tempRoot, 'contracts'), { recursive: true })
  await fs.writeFile(path.join(tempRoot, 'package.tson'), '{"type":"module"}\n')
  await fs.mkdir(path.join(tempRoot, 'packages/adoption/services'), { recursive: true })
  await fs.mkdir(path.join(tempRoot, 'services/domainReads/adoption'), { recursive: true })
  await fs.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
  await fs.mkdir(path.join(tempRoot, 'utils'), { recursive: true })
  await fs.copyFile(
    path.join(ROOT, 'packages/adoption/services/reviewActionAdapter.ts'),
    path.join(tempRoot, 'packages/adoption/services/reviewActionAdapter.ts'),
  )
  await fs.copyFile(
    path.join(ROOT, 'packages/adoption/services/reviewAdapter.ts'),
    path.join(tempRoot, 'packages/adoption/services/reviewAdapter.ts'),
  )
  await fs.copyFile(
    path.join(ROOT, 'services/domainReads/adoption/reviewAdapter.ts'),
    path.join(tempRoot, 'services/domainReads/adoption/reviewAdapter.ts'),
  )
  for (const file of [
    'actorCapabilities.ts',
    'adoptionConditionContract.ts',
    'adoptionReviewContract.ts',
  ]) {
    await fs.copyFile(path.join(ROOT, 'navigation', file), path.join(tempRoot, 'navigation', file))
  }
  await fs.copyFile(
    path.join(ROOT, 'utils/adoptionStorage.ts'),
    path.join(tempRoot, 'utils/adoptionStorage.ts'),
  )
  storage = new Map()
  reset()
  api = await import(
    `${pathToFileURL(path.join(tempRoot, 'packages/adoption/services/reviewActionAdapter.ts')).href}?test=${Date.now()}`
  )
})

beforeEach(reset)

after(async () => {
  await fs.rm(tempRoot, { recursive: true, force: true })
  delete globalThis.uni
})

test('adoption review action requires the canonical reviewer relation and updates a saved record once', () => {
  seed([ownerRecord()])
  const input = {
    actorProvider: actor(),
    applicationId: 'application-a',
    reviewItemId: 'review-owner-a',
    outcome: 'approved',
    idempotencyKey: 'review-owner-a-approved',
    now: '2026-09-21T00:00:00Z',
  }
  const first = api.applyAdoptionReviewAction(input)
  assert.equal(first.success, true)
  assert.equal(first.wrote, true)
  assert.equal(first.applicationStatus, 'pickup')
  const saved = JSON.parse(storage.get(KEY))[0]
  assert.equal(saved.status, 'pickup')
  assert.equal(saved.review.status, 'approved')
  const retry = api.applyAdoptionReviewAction(input)
  assert.equal(retry.duplicate, true)
  assert.equal(retry.wrote, false)
})

test('adoption review action rejects demos, forged actors and idempotency conflicts without a write', () => {
  seed([ownerRecord()])
  const forged = () =>
    api.applyAdoptionReviewAction({
      actorProvider: actor('owner-b'),
      applicationId: 'application-a',
      reviewItemId: 'review-owner-a',
      outcome: 'approved',
      idempotencyKey: 'review-forged',
    })
  assert.throws(forged, (error) =>
    ['ACTOR_MISMATCH', 'NOT_FOUND', 'ACTOR_ROLE_REQUIRED'].includes(error.code),
  )
  const approved = api.applyAdoptionReviewAction({
    actorProvider: actor(),
    applicationId: 'application-a',
    reviewItemId: 'review-owner-a',
    outcome: 'approved',
    idempotencyKey: 'review-conflict',
  })
  assert.equal(approved.success, true)
  const savedAfterApproval = storage.get(KEY)
  assert.throws(
    () =>
      api.applyAdoptionReviewAction({
        actorProvider: actor(),
        applicationId: 'application-a',
        reviewItemId: 'review-owner-a',
        outcome: 'rejected',
        idempotencyKey: 'review-conflict',
      }),
    (error) => error.code === 'IDEMPOTENCY_CONFLICT' || error.code === 'INVALID_TRANSITION',
  )
  assert.equal(storage.get(KEY), savedAfterApproval)
  assert.throws(
    () =>
      api.applyAdoptionReviewAction({
        actorProvider: actor('yard_card_owner'),
        applicationId: 'demo-pending',
        reviewItemId: 'review-owner-a',
        outcome: 'approved',
        idempotencyKey: 'demo-action',
      }),
    (error) => ['NOT_FOUND', 'ACTOR_MISMATCH'].includes(error.code),
  )
})
