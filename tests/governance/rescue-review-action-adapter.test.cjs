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

const pending = {
  id: 'rescue-review-a', rescueId: 'rescue-review-a', applicationType: 'rescue',
  reviewItemId: 'review-a', reviewerId: 'reviewer-a', status: 'pending',
  summary: '待审核救助', applicant: { id: 'applicant-a' },
}

const actor = (id = 'reviewer-a', roles = ['reviewer']) => () => ({
  sessionId: `session-${id}`, actor: { id, roles },
})

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-rescue-review-action-governance-'))
  await fs.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
  const target = path.join(tempRoot, 'reviewActionAdapter.ts')
  await fs.copyFile(path.join(ROOT, 'packages/rescue/services/reviewActionAdapter.ts'), target)
  api = await import(`${pathToFileURL(target).href}?test=${Date.now()}-${Math.random()}`)
})

after(async () => {
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

test('rescue review read model requires a fresh trusted reviewer session and explicit relation', () => {
  const denied = api.readRescueReviewList({ actorProvider: () => null, reader: () => [pending] })
  assert.deepEqual(denied.items, [])
  assert.equal(denied.diagnostics.actorError.code, 'NO_SESSION')

  const applicantOnly = api.readRescueReviewList({
    actorProvider: actor('applicant-a', ['applicant']), reader: () => [pending],
  })
  assert.deepEqual(applicantOnly.items, [])
  assert.equal(applicantOnly.diagnostics.actorError.code, 'REVIEWER_ROLE_REQUIRED')

  const forged = { ...pending, reviewerId: undefined, applicant: { id: 'reviewer-a' } }
  const noRelation = api.readRescueReviewList({ actorProvider: actor(), reader: () => [forged] })
  assert.deepEqual(noRelation.items, [])
  assert.ok(noRelation.diagnostics.skipped.some(item => item.code === 'MISSING_REVIEWER_RELATION'))
})

test('rescue review detail projects display metadata and filters media to strings', () => {
  const detail = api.readRescueReviewDetail({
    actorProvider: actor(),
    reader: () => [{ ...pending, detail: '需要进一步核实', amount: 120, media: ['/evidence-a.png', 17, '/evidence-b.png'] }],
    reviewItemId: 'review-a',
  })
  assert.equal(detail.canRead, true)
  assert.equal(detail.item.detail, '需要进一步核实')
  assert.equal(detail.item.amount, 120)
  assert.deepEqual(detail.item.media, ['/evidence-a.png', '/evidence-b.png'])
})

test('rescue review action is idempotent, permits only pending terminal decisions, and never pays', () => {
  let records = [{ ...pending }]
  let writes = 0
  const reader = () => records
  const writer = ({ next }) => { writes += 1; records = [next] }
  const base = { actorProvider: actor(), reader, writer, reviewItemId: 'review-a' }

  const approved = api.applyRescueReviewAction({ ...base, outcome: 'approved', idempotencyKey: 'review-a-1' })
  assert.equal(approved.toStatus, 'approved')
  assert.equal(approved.fundingChanged, false)
  assert.equal(writes, 1)
  assert.equal(api.applyRescueReviewAction({ ...base, outcome: 'approved', idempotencyKey: 'review-a-1' }).duplicate, true)
  assert.equal(writes, 1)
  assert.throws(() => api.applyRescueReviewAction({ ...base, outcome: 'rejected', idempotencyKey: 'review-a-2' }), error => error.code === 'INVALID_TRANSITION')
  assert.throws(() => api.applyRescueReviewAction({ ...base, outcome: 'paid', idempotencyKey: 'review-a-paid' }), error => error.code === 'PAYMENT_ACTION_FORBIDDEN')
  assert.equal(writes, 1)
})

test('review action source has no root navigation/storage import or payment writer', async () => {
  const source = await fs.readFile(path.join(ROOT, 'packages/rescue/services/reviewActionAdapter.ts'), 'utf8')
  assert.doesNotMatch(source, /(?:from\s+['"][^'"]*(?:navigation|utils\/rescueStorage)|require\s*\()/)
  assert.doesNotMatch(source, /(?:transitionRescueFunding|createPayment|pay\s*\()/i)
  assert.match(source, /pending: Object\.freeze\(\['approved', 'rejected'\]\)/)
})

test('rescue review pages use the adapter contracts and contain no explicit any types', async () => {
  const detailPage = await fs.readFile(path.join(ROOT, 'packages/rescue/pages/review/detail/index.vue'), 'utf8')
  const listPage = await fs.readFile(path.join(ROOT, 'packages/rescue/pages/review/list/index.vue'), 'utf8')
  for (const source of [detailPage, listPage]) {
    assert.doesNotMatch(source, /\bany\b/)
    assert.doesNotMatch(source, /as\s+any/)
    assert.doesNotMatch(source, /Record<string,\s*any>/)
  }
  assert.match(detailPage, /data\(\):\s*RescueReviewDetailPageState/)
  assert.match(detailPage, /model:\s*RescueReviewDetailResult/)
  assert.match(detailPage, /onLoad\(options:\s*unknown/)
  assert.match(detailPage, /notifyReviewAction\(action:\s*RescueReviewActionResult\)/)
  assert.match(listPage, /data\(\):\s*RescueReviewListPageState/)
  assert.match(listPage, /model:\s*RescueReviewListResult/)
  assert.match(listPage, /openDetail\(item:\s*RescueReviewListResult\['items'\]\[number\]\)/)
})
