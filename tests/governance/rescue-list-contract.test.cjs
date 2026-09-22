'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
let tempRoot
let api

function actor(id, roles) {
  return () => ({ actor: { id, roles } })
}

const MINE_A = Object.freeze({
  id: 'rescue-a',
  applicationType: 'rescue',
  applicant: { id: 'actor-a', name: '申请人 A' },
  applicationStatus: 'platform_pending',
  status: 'pending',
  summary: '待平台审核',
})

const MINE_B = Object.freeze({
  id: 'rescue-b',
  applicationType: 'rescue',
  applicant: { id: 'actor-b', name: '申请人 B' },
  applicationStatus: 'platform_approved',
  status: 'pending',
})

const REVIEW_PENDING = Object.freeze({
  rescueId: 'rescue-a',
  id: 'rescue-a',
  applicationType: 'rescue',
  reviewItemId: 'review-a',
  reviewerId: 'reviewer-a',
  applicationStatus: 'platform_approved',
  status: 'pending',
})

const REVIEW_APPROVED = Object.freeze({
  rescueId: 'rescue-b',
  id: 'rescue-b',
  applicationType: 'rescue',
  reviewItemId: 'review-b',
  reviewerId: 'reviewer-a',
  applicationStatus: 'platform_approved',
  reviewStatus: 'approved',
  status: 'paid',
})

before(async () => {
  tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'pawhome-rescue-list-'))
  await fsp.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
  await fsp.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
  await fsp.copyFile(path.join(ROOT, 'navigation/actorCapabilities.js'), path.join(tempRoot, 'navigation/actorCapabilities.js'))
  await fsp.copyFile(path.join(ROOT, 'navigation/rescueListContract.js'), path.join(tempRoot, 'navigation/rescueListContract.js'))
  api = await import(`${pathToFileURL(path.join(tempRoot, 'navigation/rescueListContract.js')).href}?test=${Date.now()}`)
})

after(async () => {
  if (tempRoot) await fsp.rm(tempRoot, { recursive: true, force: true })
})

function throwsCode(fn, code) {
  assert.throws(fn, error => error && error.code === code)
}

test('contract is pure, has explicit status/filter whitelists, and no write API', () => {
  const source = fs.readFileSync(path.join(ROOT, 'navigation/rescueListContract.js'), 'utf8')
  assert.doesNotMatch(source, /(?:import|require\s*\()[^\n]*(?:vue|uni|pages|packages|storage|mock|network)/i)
  assert.deepEqual(api.RESCUE_MINE_STATUSES, ['platform_pending', 'platform_approved', 'platform_rejected'])
  assert.deepEqual(api.RESCUE_REVIEW_STATUSES, ['pending', 'approved', 'rejected'])
  assert.equal(Object.keys(api).some(key => /write|save|delete|update|transition/i.test(key)), false)
})

test('mine list uses trusted applicant ownership and ignores query role/managed/state overrides', () => {
  const result = api.readRescueMine({
    actorProvider: actor('actor-a', ['applicant']),
    records: [MINE_A, MINE_B],
    query: { applicantId: 'actor-b', role: 'applicant', managed: true, state: 'platform_approved' },
  })
  assert.deepEqual(result.items.map(item => item.rescueId), ['rescue-a'])
  assert.equal(result.items[0].applicationStatus, 'platform_pending')
  assert.equal(result.canWrite, false)

  const forgedGenericUser = api.readRescueMine({
    actorProvider: actor('actor-a', ['applicant']),
    records: [{ ...MINE_A, applicant: undefined, applicantId: undefined, userId: 'actor-a' }],
    query: { managed: true },
  })
  assert.equal(forgedGenericUser.items.length, 0)
})

test('mine list requires applicant role, explicit relation, and status whitelist', () => {
  const wrongRole = api.readRescueMine({ actorProvider: actor('actor-a', ['reviewer']), records: [MINE_A] })
  assert.equal(wrongRole.items.length, 0)
  assert.equal(wrongRole.diagnostics.actorError.code, 'ACTOR_ROLE_REQUIRED')

  const result = api.readRescueMine({
    actorProvider: actor('actor-a', ['applicant']),
    records: [MINE_A, { ...MINE_A, id: 'rescue-invalid', applicationStatus: 'future' }, { ...MINE_A, id: 'rescue-invalid-meta', summary: { unsafe: true } }, { id: 'rescue-no-owner', applicationStatus: 'platform_pending' }],
  })
  assert.deepEqual(result.items.map(item => item.rescueId), ['rescue-a'])
  assert.ok(result.diagnostics.skipped.some(item => item.code === 'INVALID_MINE_STATUS'))
  assert.ok(result.diagnostics.skipped.some(item => item.code === 'INVALID_METADATA'))
  assert.ok(result.diagnostics.skipped.some(item => item.code === 'ACTOR_MISMATCH' || item.code === 'MISSING_APPLICANT_RELATION' || item.code === 'MISSING_DOMAIN'))
  throwsCode(() => api.readRescueMine({ actorProvider: actor('actor-a', ['applicant']), records: [MINE_A], filter: 'pending' }), 'INVALID_STATUS_FILTER')
})

test('mine refresh duplicates collapse while conflicting records are removed fail-closed', () => {
  const duplicate = api.readRescueMine({
    actorProvider: actor('actor-a', ['applicant']),
    records: [MINE_A, { ...MINE_A }],
  })
  assert.equal(duplicate.items.length, 1)
  assert.equal(duplicate.diagnostics.accepted, 1)

  const conflicting = api.readRescueMine({
    actorProvider: actor('actor-a', ['applicant']),
    records: [MINE_A, { ...MINE_A, applicationStatus: 'platform_rejected' }],
  })
  assert.equal(conflicting.items.length, 0)
  assert.ok(conflicting.diagnostics.skipped.some(item => item.code === 'DUPLICATE_CONFLICT'))
})

test('both list boundaries require an explicit rescue domain discriminator', () => {
  const result = api.readRescueMine({
    actorProvider: actor('actor-a', ['applicant']),
    records: [
      { ...MINE_A, id: 'rescue-adoption-shaped', applicationType: 'adoption' },
      { ...MINE_A, id: 'rescue-domain-missing', applicationType: undefined },
      { ...MINE_A, id: 'rescue-domain-conflict', businessType: 'adoption' },
      { ...MINE_A, id: 'animal-001', applicationType: 'rescue' },
    ],
  })
  assert.equal(result.items.length, 0)
  assert.ok(result.diagnostics.skipped.some(item => item.code === 'CROSS_DOMAIN_RECORD'))
  assert.ok(result.diagnostics.skipped.some(item => item.code === 'MISSING_DOMAIN'))
  assert.ok(result.diagnostics.skipped.some(item => item.code === 'CROSS_DOMAIN_ID'))

  const review = api.readRescueReviewList({
    actorProvider: actor('reviewer-a', ['reviewer']),
    records: [{ ...REVIEW_PENDING, id: 'review-adoption-shaped', rescueId: 'review-adoption-shaped', applicationType: 'adoption' }],
  })
  assert.equal(review.items.length, 0)
  assert.ok(review.diagnostics.skipped.some(item => item.code === 'CROSS_DOMAIN_RECORD'))
})

test('mine status filters and pending/processed buckets are derived from the record', () => {
  const records = [MINE_A, MINE_B]
  const all = api.readRescueMine({ actorProvider: actor('actor-a', ['applicant']), records: [MINE_A] })
  assert.deepEqual(all.pending.map(item => item.rescueId), ['rescue-a'])
  const approved = api.readRescueMine({ actorProvider: actor('actor-b', ['applicant']), records, filter: 'platform_approved' })
  assert.deepEqual(approved.items.map(item => item.rescueId), ['rescue-b'])
  assert.deepEqual(approved.processed.map(item => item.rescueId), ['rescue-b'])
})

test('review list requires rescueId, reviewItemId, reviewer relation, and a trusted reviewer actor', () => {
  const result = api.readRescueReviewList({
    actorProvider: actor('reviewer-a', ['reviewer']),
    records: [REVIEW_PENDING, REVIEW_APPROVED],
  })
  assert.deepEqual(result.items.map(item => [item.rescueId, item.reviewItemId]), [['rescue-a', 'review-a'], ['rescue-b', 'review-b']])
  assert.deepEqual(result.pending.map(item => item.reviewItemId), ['review-a'])
  assert.deepEqual(result.processed.map(item => item.reviewItemId), ['review-b'])
  assert.equal(result.canWrite, false)

  const applicant = api.readRescueReviewList({ actorProvider: actor('actor-a', ['applicant']), records: [REVIEW_PENDING] })
  assert.equal(applicant.items.length, 0)
  assert.equal(applicant.diagnostics.actorError.code, 'ACTOR_ROLE_REQUIRED')
})

test('review task state and filters stay within the whitelist', () => {
  const invalid = api.readRescueReviewList({
    actorProvider: actor('reviewer-a', ['reviewer']),
    records: [
      { ...REVIEW_PENDING, rescueId: 'rescue-invalid', id: 'rescue-invalid', status: 'future' },
      { ...REVIEW_PENDING, rescueId: 'rescue-missing-item', id: 'rescue-missing-item', reviewItemId: undefined },
      { ...REVIEW_PENDING, rescueId: 'rescue-missing-reviewer', id: 'rescue-missing-reviewer', reviewerId: undefined },
      { ...REVIEW_PENDING, rescueId: 'rescue-null-review-status', id: 'rescue-null-review-status', reviewStatus: null, status: 'pending' },
    ],
  })
  assert.equal(invalid.items.length, 0)
  assert.ok(invalid.diagnostics.skipped.some(item => item.code === 'INVALID_REVIEW_STATUS'))
  assert.ok(invalid.diagnostics.skipped.some(item => item.code === 'MISSING_REVIEW_ITEM_ID'))
  assert.ok(invalid.diagnostics.skipped.some(item => item.code === 'MISSING_REVIEWER_RELATION' || item.code === 'MISSING_ID'))
  throwsCode(() => api.readRescueReviewList({ actorProvider: actor('reviewer-a', ['reviewer']), records: [REVIEW_PENDING], filter: 'platform_pending' }), 'INVALID_STATUS_FILTER')
  const pending = api.readRescueReviewList({ actorProvider: actor('reviewer-a', ['reviewer']), records: [REVIEW_PENDING, REVIEW_APPROVED], filter: 'pending' })
  assert.deepEqual(pending.items.map(item => item.reviewItemId), ['review-a'])
})

test('funding-only legacy status never substitutes for a review decision', () => {
  const result = api.readRescueReviewList({
    actorProvider: actor('reviewer-a', ['reviewer']),
    records: [
      REVIEW_APPROVED,
      { ...REVIEW_PENDING, id: 'rescue-funding-only', rescueId: 'rescue-funding-only', reviewItemId: 'review-funding-only', status: 'paid', reviewStatus: undefined },
    ],
  })
  assert.deepEqual(result.items.map(item => [item.rescueId, item.status]), [['rescue-b', 'approved']])
  assert.ok(result.diagnostics.skipped.some(item => item.code === 'MISSING_REVIEW_STATUS'))
})

test('review IDs cannot be inferred from rescueId and cross-domain IDs fail closed', () => {
  const result = api.readRescueReviewList({
    actorProvider: actor('reviewer-a', ['reviewer']),
    records: [
      { ...REVIEW_PENDING, reviewItemId: undefined },
      { ...REVIEW_PENDING, rescueId: 'adoption-a', id: 'adoption-a' },
      { ...REVIEW_PENDING, reviewItemId: 'feeding-review-a' },
      { ...REVIEW_PENDING, review: { reviewItemId: 'review-a', rescueId: 'rescue-other' } },
    ],
  })
  assert.equal(result.items.length, 0)
  assert.ok(result.diagnostics.skipped.some(item => item.code === 'MISSING_REVIEW_ITEM_ID'))
  assert.ok(result.diagnostics.skipped.some(item => item.code === 'CROSS_DOMAIN_ID'))
  assert.ok(result.diagnostics.skipped.some(item => item.code === 'CONFLICTING_REVIEW_ITEM_ID' || item.code === 'CONFLICTING_RESCUE_ID' || item.code === 'CONFLICTING_ID'))
})

test('review aliases must agree and forged reviewer fields cannot grant access', () => {
  const result = api.readRescueReviewList({
    actorProvider: actor('reviewer-a', ['reviewer']),
    records: [
      { ...REVIEW_PENDING, reviewerId: 'reviewer-b', reviewerIds: ['reviewer-a'] },
      { ...REVIEW_PENDING, reviewerId: 'reviewer-b' },
    ],
    query: { reviewerId: 'reviewer-a', role: 'reviewer', status: 'pending' },
  })
  assert.equal(result.items.length, 0)
  assert.ok(result.diagnostics.skipped.some(item => item.code === 'CONFLICTING_REVIEWER_RELATION'))
  assert.ok(result.diagnostics.skipped.some(item => item.code === 'ACTOR_MISMATCH'))
})

test('resolver receives only a trusted actor and resolver failures remain explicit empty read models', () => {
  let received
  const resolved = api.readRescueReviewList({
    actorProvider: actor('reviewer-a', ['reviewer']),
    query: { rescueId: 'rescue-b', role: 'reviewer' },
    resolver(context) {
      received = context
      return [REVIEW_PENDING]
    },
  })
  assert.deepEqual(resolved.items.map(item => item.reviewItemId), ['review-a'])
  assert.equal(received.actor.id, 'reviewer-a')
  assert.equal(Object.prototype.hasOwnProperty.call(received, 'query'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(received, 'rescueId'), false)

  const bad = api.readRescueReviewList({ actorProvider: actor('reviewer-a', ['reviewer']), resolver: () => Promise.reject(new Error('network')) })
  assert.equal(bad.items.length, 0)
  assert.equal(bad.diagnostics.actorError.code, 'ASYNC_RESOLVER_UNSUPPORTED')
  const thrown = api.readRescueReviewList({ actorProvider: actor('reviewer-a', ['reviewer']), resolver: () => { throw null } })
  assert.equal(thrown.items.length, 0)
  assert.equal(thrown.diagnostics.actorError.code, 'RESOLVER_FAILED')
  throwsCode(() => api.readRescueMine({ actorProvider: actor('actor-a', ['applicant']), resolver: 'not-a-function' }), 'INVALID_RESOLVER')
})

test('actor provider is resolved afresh, and no records or list buckets are writable through the result', () => {
  let id = 'actor-a'
  const provider = () => ({ actor: { id, roles: ['applicant'] } })
  const model = api.readRescueMine({ actorProvider: provider, records: [MINE_A, MINE_B] })
  assert.deepEqual(model.items.map(item => item.rescueId), ['rescue-a'])
  id = 'actor-b'
  const switched = api.readRescueMine({ actorProvider: provider, records: [MINE_A, MINE_B] })
  assert.deepEqual(switched.items.map(item => item.rescueId), ['rescue-b'])
  assert.equal(Object.isFrozen(model), true)
  assert.equal(Object.isFrozen(model.items), true)
  assert.equal(Object.isFrozen(model.pending), true)
  assert.equal(model.write, undefined)
})
