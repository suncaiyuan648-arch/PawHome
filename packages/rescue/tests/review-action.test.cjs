'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')
const { pathToFileURL } = require('node:url')
const { test, before, after } = require('node:test')

const ROOT = path.resolve(__dirname, '..')
let tempRoot
let api

const PENDING = {
  id: 'rescue-review-a',
  rescueId: 'rescue-review-a',
  applicationType: 'rescue',
  reviewItemId: 'review-a',
  reviewerId: 'reviewer-a',
  status: 'pending',
  summary: '待审核救助',
  applicant: { id: 'applicant-a' },
}

function session(id = 'reviewer-a', roles = ['reviewer']) {
  return () => ({ sessionId: `session-${id}`, actor: { id, roles } })
}

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-rescue-review-action-'))
  await fs.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
  const target = path.join(tempRoot, 'reviewActionAdapter.ts')
  await fs.copyFile(path.join(ROOT, 'services/reviewActionAdapter.ts'), target)
  api = await import(`${pathToFileURL(target).href}?test=${Date.now()}-${Math.random()}`)
})

after(async () => {
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

test('review reads fail closed without a trusted session and require explicit reviewer relation', () => {
  const noSession = api.readRescueReviewList({ actorProvider: () => null, reader: () => [PENDING] })
  assert.deepEqual(noSession.items, [])
  assert.equal(noSession.diagnostics.actorError.code, 'NO_SESSION')

  const forged = {
    ...PENDING,
    id: 'rescue-review-forged',
    rescueId: 'rescue-review-forged',
    reviewItemId: 'review-forged',
    reviewerId: undefined,
    applicant: { id: 'reviewer-a' },
  }
  const model = api.readRescueReviewList({ actorProvider: session(), reader: () => [forged] })
  assert.deepEqual(model.items, [])
  assert.ok(model.diagnostics.skipped.some((item) => item.code === 'MISSING_REVIEWER_RELATION'))
})

test('review writes allow only pending to approved/rejected and do not touch funding', () => {
  let records = [{ ...PENDING }]
  let writes = 0
  const reader = () => records
  const writer = ({ next }) => {
    writes += 1
    records = [next]
    return next
  }

  const first = api.applyRescueReviewAction({
    actorProvider: session(),
    reader,
    writer,
    reviewItemId: 'review-a',
    outcome: 'approved',
    idempotencyKey: 'review-a-approve-1',
    now: '2026-09-19T00:00:00Z',
  })
  assert.equal(first.success, true)
  assert.equal(first.toStatus, 'approved')
  assert.equal(first.fundingChanged, false)
  assert.equal(writes, 1)
  assert.equal(records[0].status, 'approved')
  assert.equal(records[0].review.lastAction.idempotencyKey, 'review-a-approve-1')

  const duplicate = api.applyRescueReviewAction({
    actorProvider: session(),
    reader,
    writer,
    reviewItemId: 'review-a',
    outcome: 'approved',
    idempotencyKey: 'review-a-approve-1',
  })
  assert.equal(duplicate.duplicate, true)
  assert.equal(writes, 1)

  assert.throws(
    () =>
      api.applyRescueReviewAction({
        actorProvider: session(),
        reader,
        writer,
        reviewItemId: 'review-a',
        outcome: 'rejected',
        idempotencyKey: 'review-a-reject-1',
      }),
    (error) => error && error.code === 'INVALID_TRANSITION',
  )
  assert.equal(writes, 1)

  assert.throws(
    () =>
      api.applyRescueReviewAction({
        actorProvider: session(),
        reader,
        writer,
        reviewItemId: 'review-a',
        outcome: 'paid',
        idempotencyKey: 'review-a-paid-1',
      }),
    (error) => error && error.code === 'PAYMENT_ACTION_FORBIDDEN',
  )
  assert.equal(writes, 1)
})

test('action identity and aliases cannot cross rescue domains or reviewer relations', () => {
  assert.throws(
    () =>
      api.applyRescueReviewAction({
        actorProvider: session(),
        reader: () => [PENDING],
        writer: () => {},
        reviewItemId: 'adoption-review-a',
        outcome: 'approved',
        idempotencyKey: 'a-1',
      }),
    (error) => error && error.code === 'CROSS_DOMAIN_ID',
  )

  assert.throws(
    () =>
      api.applyRescueReviewAction({
        actorProvider: session('reviewer-b'),
        reader: () => [PENDING],
        writer: () => {},
        reviewItemId: 'review-a',
        outcome: 'approved',
        idempotencyKey: 'a-2',
      }),
    (error) => error && error.code === 'ACTOR_MISMATCH',
  )
})

test('adapter source stays package-local and exposes no payment or navigation writer', async () => {
  const source = await fs.readFile(path.join(ROOT, 'services/reviewActionAdapter.ts'), 'utf8')
  assert.doesNotMatch(
    source,
    /(?:from\s+['"][^'"]*(?:navigation|utils\/rescueStorage)|require\s*\()/,
  )
  assert.doesNotMatch(
    source,
    /(?:setStorageSync\([^)]*(?:PAYMENT|FUNDING)|transitionRescueFunding|createPayment|pay\s*\()/i,
  )
  assert.match(source, /PAYMENT_ACTION_FORBIDDEN/)
})
