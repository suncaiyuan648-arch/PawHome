'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after, beforeEach } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const RESCUE_KEY = 'PAWHOME_RESCUES'

let tempRoot
let api

const MINE_A = {
  id: 'rescue-real-a',
  applicationType: 'rescue',
  applicant: { id: 'actor-a', name: '申请人 A' },
  applicationStatus: 'platform_pending',
  status: 'pending',
  summary: 'A 的真实救助申请',
}

const MINE_B = {
  id: 'rescue-real-b',
  applicationType: 'rescue',
  applicant: { id: 'actor-b', name: '申请人 B' },
  applicationStatus: 'platform_approved',
  status: 'pending',
  summary: 'B 的真实救助申请',
}

const REVIEW_PENDING = {
  id: 'rescue-real-review',
  rescueId: 'rescue-real-review',
  applicationType: 'rescue',
  reviewItemId: 'review-real-a',
  reviewerId: 'reviewer-a',
  applicationStatus: 'platform_approved',
  status: 'pending',
  description: '待评审的真实救助申请',
}

function actor(id, roles) {
  return () => ({ actor: { id, roles } })
}

function resetStorage() {
  globalThis.uni.storage.clear()
  globalThis.uni.reads.length = 0
  globalThis.uni.writes.length = 0
}

function seed(records) {
  globalThis.uni.storage.set(RESCUE_KEY, JSON.stringify(records))
}

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-rescue-lists-adapter-'))
  await fs.cp(path.join(ROOT, 'contracts'), path.join(tempRoot, 'contracts'), { recursive: true })
  await fs.writeFile(path.join(tempRoot, 'package.tson'), '{"type":"module"}\n')
  await fs.cp(
    path.join(ROOT, 'services/domainReads'),
    path.join(tempRoot, 'services/domainReads'),
    { recursive: true },
  )
  await fs.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
  await fs.mkdir(path.join(tempRoot, 'utils'), { recursive: true })
  await fs.mkdir(path.join(tempRoot, 'packages/rescue/services'), { recursive: true })
  for (const file of ['actorCapabilities.ts', 'rescueListContract.ts']) {
    await fs.copyFile(path.join(ROOT, 'navigation', file), path.join(tempRoot, 'navigation', file))
  }
  await fs.copyFile(
    path.join(ROOT, 'utils/rescueStorage.ts'),
    path.join(tempRoot, 'utils/rescueStorage.ts'),
  )
  await fs.copyFile(
    path.join(ROOT, 'packages/rescue/services/lists.ts'),
    path.join(tempRoot, 'packages/rescue/services/lists.ts'),
  )

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

  api = await import(
    `${pathToFileURL(path.join(tempRoot, 'packages/rescue/services/lists.ts')).href}?test=${Date.now()}-${Math.random()}`
  )
})

beforeEach(resetStorage)

after(async () => {
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
  delete globalThis.uni
})

test('mine adapter reads only saved rescue records and forces includeDemo false', () => {
  const forged = { ...MINE_A, id: 'rescue-injected', applicant: { id: 'actor-a' } }
  const model = api.readRescueMine({
    actorProvider: actor('actor-a', ['applicant']),
    includeDemo: true,
    records: [forged],
    resolver: () => [forged],
    query: { applicantId: 'actor-a', managed: true, role: 'applicant' },
  })

  assert.deepEqual(
    model.items.map((item) => item.rescueId),
    [],
  )
  assert.equal(globalThis.uni.reads.filter((key) => key === RESCUE_KEY).length, 1)
  assert.equal(globalThis.uni.writes.length, 0)
  assert.equal(model.readOnly, true)
  assert.equal(model.canWrite, false)
})

test('mine adapter uses trusted applicant ownership and re-reads current storage on every call', () => {
  seed([MINE_A, MINE_B])
  let currentActor = 'actor-a'
  const provider = () => ({ actor: { id: currentActor, roles: ['applicant'] } })

  const first = api.readRescueMine({ actorProvider: provider })
  assert.deepEqual(
    first.items.map((item) => item.rescueId),
    ['rescue-real-a'],
  )
  assert.equal(first.items[0].summary, 'A 的真实救助申请')

  currentActor = 'actor-b'
  const second = api.readRescueMine({ actorProvider: provider })
  assert.deepEqual(
    second.items.map((item) => item.rescueId),
    ['rescue-real-b'],
  )
  assert.equal(globalThis.uni.reads.filter((key) => key === RESCUE_KEY).length, 2)

  seed([{ ...MINE_B, summary: 'B 的当前快照' }])
  const refreshed = api.readRescueMine({ actorProvider: provider })
  assert.equal(refreshed.items[0].summary, 'B 的当前快照')
  assert.equal(globalThis.uni.writes.length, 0)
})

test('review adapter requires reviewer capability and explicit review metadata', () => {
  seed([
    REVIEW_PENDING,
    {
      ...REVIEW_PENDING,
      id: 'rescue-explicit-review',
      rescueId: 'rescue-explicit-review',
      reviewItemId: 'review-explicit',
      reviewStatus: 'pending',
    },
    {
      ...REVIEW_PENDING,
      id: 'rescue-conflicting-review',
      rescueId: 'rescue-conflicting-review',
      reviewItemId: 'review-conflicting',
      reviewStatus: 'approved',
    },
    {
      ...REVIEW_PENDING,
      id: 'rescue-malformed-review',
      rescueId: 'rescue-malformed-review',
      reviewItemId: 'review-malformed',
      reviewStatus: null,
    },
    {
      ...REVIEW_PENDING,
      id: 'rescue-no-review-id',
      rescueId: 'rescue-no-review-id',
      reviewItemId: undefined,
    },
    {
      ...REVIEW_PENDING,
      id: 'rescue-applicant-proof',
      rescueId: 'rescue-applicant-proof',
      reviewerId: undefined,
      applicant: { id: 'reviewer-a' },
      proofList: [{ pawId: 'reviewer-a' }],
    },
    {
      ...REVIEW_PENDING,
      id: 'rescue-paid-only',
      rescueId: 'rescue-paid-only',
      reviewItemId: 'review-paid-only',
      reviewStatus: undefined,
      status: 'paid',
    },
  ])

  const model = api.readRescueReviewList({ actorProvider: actor('reviewer-a', ['reviewer']) })
  assert.deepEqual(
    model.items.map((item) => [item.rescueId, item.reviewItemId]),
    [
      ['rescue-real-review', 'review-real-a'],
      ['rescue-explicit-review', 'review-explicit'],
    ],
  )
  assert.deepEqual(
    model.pending.map((item) => item.reviewItemId),
    ['review-real-a', 'review-explicit'],
  )
  assert.deepEqual(model.processed, [])
  assert.equal(model.readOnly, true)
  assert.equal(model.canWrite, false)
  assert.ok(model.diagnostics.skipped.some((item) => item.code === 'MISSING_REVIEW_ITEM_ID'))
  assert.ok(
    model.diagnostics.skipped.some(
      (item) => item.code === 'MISSING_REVIEWER_RELATION' || item.code === 'ACTOR_MISMATCH',
    ),
  )
  assert.ok(model.diagnostics.skipped.some((item) => item.code === 'MISSING_REVIEW_STATUS'))
  assert.ok(model.diagnostics.skipped.some((item) => item.code === 'CONFLICTING_STATUS'))
  assert.ok(model.diagnostics.skipped.some((item) => item.code === 'MISSING_ID'))

  const applicant = api.readRescueReviewList({ actorProvider: actor('actor-a', ['applicant']) })
  assert.deepEqual(applicant.items, [])
  assert.equal(applicant.diagnostics.actorError.code, 'ACTOR_ROLE_REQUIRED')
  assert.equal(globalThis.uni.reads.filter((key) => key === RESCUE_KEY).length, 1)
})

test('adapter output is frozen and excludes mutable rescue details', () => {
  seed([
    {
      ...MINE_A,
      proofList: [{ id: 'proof-private', story: 'private' }],
      animals: [{ id: 'animal-private' }],
    },
  ])
  const model = api.readRescueMine({ actorProvider: actor('actor-a', ['applicant']) })

  assert.equal(Object.isFrozen(model), true)
  assert.equal(Object.isFrozen(model.items), true)
  assert.equal(Object.isFrozen(model.items[0]), true)
  assert.equal(Object.isFrozen(model.pending), true)
  assert.equal(Object.isFrozen(model.processed), true)
  assert.equal(Object.isFrozen(model.diagnostics), true)
  assert.equal('proofList' in model.items[0], false)
  assert.equal('animals' in model.items[0], false)
  assert.equal(model.write, undefined)
})

test('contract and storage failures remain empty read models without writes', () => {
  seed([MINE_A])
  const invalidFilter = api.readRescueMine({
    actorProvider: actor('actor-a', ['applicant']),
    filter: 'pending',
  })
  assert.deepEqual(invalidFilter.items, [])
  assert.equal(invalidFilter.diagnostics.actorError.code, 'INVALID_STATUS_FILTER')
  assert.equal(invalidFilter.readOnly, true)
  assert.equal(invalidFilter.canWrite, false)
  assert.equal(globalThis.uni.writes.length, 0)

  globalThis.uni.storage.set(RESCUE_KEY, '{broken')
  const malformed = api.readRescueMine({ actorProvider: actor('actor-a', ['applicant']) })
  assert.deepEqual(malformed.items, [])
  assert.equal(malformed.readOnly, true)
  assert.equal(malformed.canWrite, false)
  assert.equal(globalThis.uni.writes.length, 0)
})
