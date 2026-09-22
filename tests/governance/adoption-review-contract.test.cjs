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

const OWNER_PENDING = Object.freeze({
  applicationType: 'adoption',
  businessType: 'adoption',
  applicationId: 'application-a',
  applicantId: 'applicant-a',
  ownerId: 'owner-a',
  status: 'pending',
  cloudParentIds: [],
  cloudParentRequired: false,
  review: {
    applicationType: 'adoption',
    applicationId: 'application-a',
    reviewItemId: 'review-owner-a',
    phase: 'owner',
    reviewerRole: 'owner',
    reviewerId: 'owner-a',
    status: 'pending',
  },
})

const CLOUD_PENDING = Object.freeze({
  applicationType: 'adoption',
  applicationId: 'application-cloud-a',
  applicantId: 'applicant-a',
  ownerId: 'owner-a',
  status: 'cloud_pending',
  cloudParentRequired: true,
  cloudParentIds: ['cloud-a'],
  review: {
    applicationId: 'application-cloud-a',
    reviewItemId: 'review-cloud-a',
    phase: 'cloud_parent',
    reviewerRole: 'cloud_parent',
    reviewerId: 'cloud-a',
    status: 'pending',
  },
})

const JURY_PENDING = Object.freeze({
  applicationType: 'adoption',
  applicationId: 'application-jury-a',
  applicantId: 'applicant-a',
  ownerId: 'owner-a',
  status: 'jury_confirm_pending',
  cloudParentIds: [],
  cloudParentRequired: false,
  review: {
    applicationId: 'application-jury-a',
    reviewItemId: 'review-jury-a',
    phase: 'jury',
    reviewerRole: 'reviewer',
    reviewerId: 'reviewer-a',
    status: 'pending',
  },
})

const CLOUD_POLICY_ALL = Object.freeze({
  selection: 'all',
  legalStates: ['pending', 'approved', 'rejected'],
  pendingStates: ['pending'],
  approvedStates: ['approved'],
  rejectedStates: ['rejected'],
})

before(async () => {
  tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'pawhome-adoption-review-'))
  await fsp.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
  await fsp.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
  for (const file of ['actorCapabilities.js', 'adoptionConditionContract.js', 'adoptionReviewContract.js']) {
    await fsp.copyFile(path.join(ROOT, 'navigation', file), path.join(tempRoot, 'navigation', file))
  }
  api = await import(`${pathToFileURL(path.join(tempRoot, 'navigation/adoptionReviewContract.js')).href}?test=${Date.now()}`)
})

after(async () => {
  if (tempRoot) await fsp.rm(tempRoot, { recursive: true, force: true })
})

function throwsCode(fn, code) {
  assert.throws(fn, error => error && error.code === code)
}

test('contract is pure, exports explicit adoption review axes, and has no writer', () => {
  const source = fs.readFileSync(path.join(ROOT, 'navigation/adoptionReviewContract.js'), 'utf8')
  assert.doesNotMatch(source, /(?:import|require\s*\()[^\n]*(?:vue|uni|pages|packages|storage|mock|network)/i)
  assert.deepEqual(api.ADOPTION_REVIEW_PHASES, ['cloud_parent', 'owner', 'owner_confirmation', 'jury'])
  assert.deepEqual(api.ADOPTION_REVIEW_STATUSES, ['pending', 'approved', 'rejected'])
  assert.deepEqual(api.ADOPTION_REVIEW_LIST_FILTERS, ['all', 'pending', 'processed', 'approved', 'rejected'])
  assert.equal(Object.keys(api).some(key => /write|save|delete|update|transition/i.test(key)), false)
})

test('list uses a trusted owner relationship and ignores query role, managed, and status', () => {
  const result = api.readAdoptionReviewList({
    actorProvider: actor('owner-a', ['owner']),
    records: [OWNER_PENDING],
    query: { role: 'reviewer', managed: true, status: 'approved', reviewerId: 'owner-b' },
  })
  assert.deepEqual(result.items.map(item => item.reviewItemId), ['review-owner-a'])
  assert.equal(result.items[0].reviewStatus, 'pending')
  assert.equal(result.items[0].bucket, 'pending')
  assert.equal(result.canWrite, false)
})

test('each review phase has an explicit role and reviewer relation', () => {
  const cloud = api.readAdoptionReviewList({ actorProvider: actor('cloud-a', ['cloud_parent']), records: [CLOUD_PENDING] })
  assert.equal(cloud.items[0].reviewerRole, 'cloud_parent')
  const jury = api.readAdoptionReviewList({ actorProvider: actor('reviewer-a', ['reviewer']), records: [JURY_PENDING] })
  assert.equal(jury.items[0].phase, 'jury')
  const yardOwner = api.readAdoptionReviewList({ actorProvider: actor('owner-a', ['yard_owner']), records: [OWNER_PENDING] })
  assert.equal(yardOwner.items.length, 1)

  const ownerAsCloud = api.readAdoptionReviewList({ actorProvider: actor('owner-a', ['owner']), records: [CLOUD_PENDING] })
  assert.equal(ownerAsCloud.items.length, 0)
  assert.ok(ownerAsCloud.diagnostics.skipped.some(item => item.code === 'ACTOR_ROLE_REQUIRED' || item.code === 'ACTOR_MISMATCH'))
  const phaseMismatch = api.readAdoptionReviewList({
    actorProvider: actor('owner-a', ['owner']),
    records: [{ ...OWNER_PENDING, review: { ...OWNER_PENDING.review, phase: 'jury', reviewerRole: 'reviewer' } }],
  })
  assert.ok(phaseMismatch.diagnostics.skipped.some(item => item.code === 'ACTOR_MISMATCH' || item.code === 'REVIEW_ROLE_PHASE_MISMATCH' || item.code === 'INCONSISTENT_REVIEW_STAGE'))
})

test('reviewerIds-only jury metadata is valid, while reviewer aliases and owner/cloud aliases conflict closed', () => {
  const idsOnly = api.readAdoptionReviewList({
    actorProvider: actor('reviewer-a', ['reviewer']),
    records: [{ ...JURY_PENDING, review: { ...JURY_PENDING.review, reviewerId: undefined, reviewerIds: ['reviewer-a'] } }],
  })
  assert.equal(idsOnly.items.length, 1)
  assert.equal(idsOnly.items[0].reviewerId, 'reviewer-a')

  const reviewerConflict = api.readAdoptionReviewList({
    actorProvider: actor('reviewer-a', ['reviewer']),
    records: [{ ...JURY_PENDING, review: { ...JURY_PENDING.review, reviewerIds: ['reviewer-b'] } }],
  })
  assert.ok(reviewerConflict.diagnostics.skipped.some(item => item.code === 'CONFLICTING_REVIEWER_ID' || item.code === 'ACTOR_MISMATCH'))
  const crossSourceSetConflict = api.readAdoptionReviewList({
    actorProvider: actor('reviewer-a', ['reviewer']),
    records: [{ ...JURY_PENDING, reviewerIds: ['reviewer-a', 'reviewer-b'], review: { ...JURY_PENDING.review, reviewerId: undefined, reviewerIds: ['reviewer-a'] } }],
  })
  assert.ok(crossSourceSetConflict.diagnostics.skipped.some(item => item.code === 'CONFLICTING_REVIEWER_ID' || item.code === 'CONFLICTING_REVIEWER'))

  const ownerConflict = api.readAdoptionReviewList({
    actorProvider: actor('owner-a', ['owner']),
    records: [{ ...OWNER_PENDING, ownerPawId: 'owner-b' }],
  })
  assert.ok(ownerConflict.diagnostics.skipped.some(item => item.code === 'CONFLICTING_OWNER' || item.code === 'CONFLICTING_OWNER_ID' || item.code === 'ACTOR_MISMATCH'))

  const cloudConflict = api.readAdoptionReviewList({
    actorProvider: actor('cloud-a', ['cloud_parent']),
    records: [{ ...CLOUD_PENDING, cloudParentId: 'cloud-b' }],
  })
  assert.ok(cloudConflict.diagnostics.skipped.some(item => item.code === 'CONFLICTING_CLOUD_PARENT' || item.code === 'CONFLICTING_CLOUD_PARENT_ID' || item.code === 'ACTOR_MISMATCH'))
})

test('application and review IDs are explicit opaque IDs and remain in the adoption domain', () => {
  const bad = api.readAdoptionReviewList({
    actorProvider: actor('owner-a', ['owner']),
    records: [
      { ...OWNER_PENDING, applicationId: undefined },
      { ...OWNER_PENDING, applicationId: 'rescue-a' },
      { ...OWNER_PENDING, applicationId: 'application/a' },
      { ...OWNER_PENDING, applicationType: 'rescue' },
      { ...OWNER_PENDING, businessType: 'feeding' },
      { ...OWNER_PENDING, review: { ...OWNER_PENDING.review, reviewItemId: undefined } },
    ],
  })
  assert.equal(bad.items.length, 0)
  assert.ok(bad.diagnostics.skipped.some(item => item.code === 'MISSING_APPLICATION_ID' || item.code === 'MISSING_ID'))
  assert.ok(bad.diagnostics.skipped.some(item => item.code === 'CROSS_DOMAIN_ID'))
  assert.ok(bad.diagnostics.skipped.some(item => item.code === 'INVALID_ID'))
  assert.ok(bad.diagnostics.skipped.some(item => item.code === 'CROSS_DOMAIN_RECORD'))
  assert.ok(bad.diagnostics.skipped.some(item => item.code === 'MISSING_REVIEW_ITEM_ID' || item.code === 'MISSING_ID'))

  const malformedDetail = api.readAdoptionReviewDetail({
    actorProvider: actor('owner-a', ['owner']),
    applicationId: 'application-a',
    reviewItemId: 'rescue-review-a',
    record: OWNER_PENDING,
  })
  assert.equal(malformedDetail.canRead, false)
  assert.equal(malformedDetail.reason, 'CROSS_DOMAIN_ID')
  assert.equal(Object.isFrozen(malformedDetail.diagnostics.actorError), true)
})

test('review status is a separate explicit axis; application status alone cannot create a processed review', () => {
  const result = api.readAdoptionReviewList({
    actorProvider: actor('owner-a', ['owner']),
    records: [{ ...OWNER_PENDING, status: 'pickup', review: { ...OWNER_PENDING.review, status: undefined } }],
  })
  assert.equal(result.items.length, 0)
  assert.ok(result.diagnostics.skipped.some(item => item.code === 'MISSING_REVIEW_STATUS' || item.code === 'INVALID_REVIEW_STATUS'))
  const invalid = api.readAdoptionReviewList({
    actorProvider: actor('owner-a', ['owner']),
    records: [{ ...OWNER_PENDING, review: { ...OWNER_PENDING.review, status: 'future' } }],
  })
  assert.ok(invalid.diagnostics.skipped.some(item => item.code === 'INVALID_REVIEW_STATUS' || item.code === 'INCONSISTENT_REVIEW_STAGE'))

  const applicationAlias = api.readAdoptionReviewList({
    actorProvider: actor('owner-a', ['owner']),
    records: [(() => { const { status, ...rest } = OWNER_PENDING; return { ...rest, applicationStatus: 'pending' } })()],
  })
  assert.equal(applicationAlias.items.length, 1)
  const applicationAliasConflict = api.readAdoptionReviewList({
    actorProvider: actor('owner-a', ['owner']),
    records: [{ ...OWNER_PENDING, applicationStatus: 'pickup' }],
  })
  assert.ok(applicationAliasConflict.diagnostics.skipped.some(item => item.code === 'CONFLICTING_APPLICATION_STATUS'))

  const cloudRejected = api.readAdoptionReviewDetail({
    actorProvider: actor('cloud-a', ['cloud_parent']),
    reviewItemId: 'review-cloud-rejected',
    record: {
      ...CLOUD_PENDING,
      applicationId: 'application-cloud-rejected',
      status: 'cloud_rejected',
      failureStage: 'cloud_parent',
      review: { ...CLOUD_PENDING.review, applicationId: 'application-cloud-rejected', reviewItemId: 'review-cloud-rejected', status: 'rejected' },
    },
  })
  assert.equal(cloudRejected.canRead, true)
})

test('pending and processed buckets and status filters derive only from the review status whitelist', () => {
  const approved = { ...OWNER_PENDING, applicationId: 'application-b', ownerId: 'owner-a', status: 'pickup', review: { ...OWNER_PENDING.review, applicationId: 'application-b', reviewItemId: 'review-owner-b', status: 'approved' } }
  const rejected = { ...OWNER_PENDING, applicationId: 'application-c', ownerId: 'owner-a', status: 'rejected', failureStage: 'owner_review', review: { ...OWNER_PENDING.review, applicationId: 'application-c', reviewItemId: 'review-owner-c', status: 'rejected' } }
  const all = api.readAdoptionReviewList({ actorProvider: actor('owner-a', ['owner']), records: [OWNER_PENDING, approved, rejected] })
  assert.deepEqual(all.pending.map(item => item.reviewItemId), ['review-owner-a'])
  assert.deepEqual(all.processed.map(item => item.reviewItemId), ['review-owner-b', 'review-owner-c'])
  assert.deepEqual(api.readAdoptionReviewList({ actorProvider: actor('owner-a', ['owner']), records: [OWNER_PENDING, approved, rejected], filter: 'processed' }).items.map(item => item.reviewItemId), ['review-owner-b', 'review-owner-c'])
  assert.deepEqual(api.readAdoptionReviewList({ actorProvider: actor('owner-a', ['owner']), records: [OWNER_PENDING, approved, rejected], filter: 'approved' }).items.map(item => item.reviewItemId), ['review-owner-b'])
})

test('zero, one, and multiple cloud parents never choose an implicit any/all policy', () => {
  const zero = api.readAdoptionReviewList({ actorProvider: actor('owner-a', ['owner']), records: [OWNER_PENDING] })
  assert.equal(zero.items[0].cloudParent.decision, 'skip')
  const one = api.readAdoptionReviewList({ actorProvider: actor('owner-a', ['owner']), records: [{ ...OWNER_PENDING, applicationId: 'application-one', ownerId: 'owner-a', cloudParentRequired: true, cloudParentIds: ['cloud-a'], review: { ...OWNER_PENDING.review, applicationId: 'application-one', reviewItemId: 'review-one', status: 'pending' } }] })
  assert.equal(one.items[0].cloudParent.count, 1)
  assert.equal(one.items[0].cloudParent.decision, 'pending')
  const multi = api.readAdoptionReviewList({ actorProvider: actor('owner-a', ['owner']), records: [{ ...OWNER_PENDING, applicationId: 'application-many', ownerId: 'owner-a', cloudParentRequired: true, cloudParentIds: ['cloud-a', 'cloud-b'], review: { ...OWNER_PENDING.review, applicationId: 'application-many', reviewItemId: 'review-many' } }] })
  assert.equal(multi.items[0].cloudParent.decision, 'decision_required')
  assert.equal(multi.items[0].cloudParent.decisionRequired, true)
  assert.equal(multi.items[0].cloudParent.selection, undefined)
  const explicit = api.readAdoptionReviewList({ actorProvider: actor('owner-a', ['owner']), cloudParentPolicy: { ...CLOUD_POLICY_ALL, selection: 'any' }, records: [{ ...OWNER_PENDING, applicationId: 'application-explicit', ownerId: 'owner-a', cloudParentRequired: true, cloudParentIds: ['cloud-a', 'cloud-b'], cloudParentApprovals: ['cloud-a'], review: { ...OWNER_PENDING.review, applicationId: 'application-explicit', reviewItemId: 'review-explicit' } }] })
  assert.equal(explicit.items[0].cloudParent.selection, 'any')
  assert.equal(explicit.items[0].cloudParent.decision, 'approved')
})

test('owner confirmation may hand off to jury, but cannot jump directly to adoption confirmed', () => {
  const valid = api.readAdoptionReviewDetail({
    actorProvider: actor('owner-a', ['owner']),
    reviewItemId: 'review-confirm-a',
    record: {
      ...OWNER_PENDING,
      applicationId: 'application-confirm-a',
      status: 'jury_confirm_pending',
      review: { ...OWNER_PENDING.review, applicationId: 'application-confirm-a', reviewItemId: 'review-confirm-a', phase: 'owner_confirmation', status: 'approved' },
    },
  })
  assert.equal(valid.canRead, true)
  const skipped = api.readAdoptionReviewDetail({
    actorProvider: actor('owner-a', ['owner']),
    reviewItemId: 'review-confirm-b',
    record: {
      ...OWNER_PENDING,
      applicationId: 'application-confirm-b',
      status: 'adoption_confirmed',
      review: { ...OWNER_PENDING.review, applicationId: 'application-confirm-b', reviewItemId: 'review-confirm-b', phase: 'owner_confirmation', status: 'approved' },
    },
  })
  assert.equal(skipped.canRead, false)
  assert.equal(skipped.reason, 'INCONSISTENT_REVIEW_STAGE')
})

test('jury rejection accepts the existing jury_confirm failure stage, and app-only route input still needs a real review item', () => {
  const rejected = api.readAdoptionReviewDetail({
    actorProvider: actor('reviewer-a', ['reviewer']),
    reviewItemId: 'review-jury-rejected',
    record: {
      ...JURY_PENDING,
      applicationId: 'application-jury-rejected',
      status: 'rejected',
      failureStage: 'jury_confirm',
      review: { ...JURY_PENDING.review, applicationId: 'application-jury-rejected', reviewItemId: 'review-jury-rejected', status: 'rejected' },
    },
  })
  assert.equal(rejected.canRead, true)
  const appOnly = api.readAdoptionReviewDetail({
    actorProvider: actor('owner-a', ['owner']),
    applicationId: 'application-a',
    record: OWNER_PENDING,
  })
  assert.equal(appOnly.canRead, false)
  assert.equal(appOnly.reason, 'MISSING_ID')
})

test('applicant detail is private to the applicant relation and cannot be forged by query', () => {
  const own = api.readAdoptionReviewDetail({
    actorProvider: actor('applicant-a', ['applicant']),
    applicationId: 'application-a',
    reviewItemId: 'review-owner-a',
    record: OWNER_PENDING,
    query: { applicantId: 'applicant-b', role: 'owner', managed: true, status: 'adoption_confirmed' },
  })
  assert.equal(own.canRead, true)
  assert.equal(own.item.perspective, 'applicant')
  const other = api.readAdoptionReviewDetail({
    actorProvider: actor('applicant-b', ['applicant']),
    applicationId: 'application-a',
    reviewItemId: 'review-owner-a',
    record: OWNER_PENDING,
    query: { applicantId: 'applicant-a' },
  })
  assert.equal(other.canRead, false)
  assert.equal(other.reason, 'ACTOR_MISMATCH')
  const applicantAliasConflict = api.readAdoptionReviewDetail({
    actorProvider: actor('applicant-b', ['applicant']),
    applicationId: 'application-a',
    reviewItemId: 'review-owner-a',
    record: { ...OWNER_PENDING, applicantIds: ['applicant-a'], applicantId: 'applicant-b' },
  })
  assert.equal(applicantAliasConflict.canRead, false)
  assert.equal(applicantAliasConflict.reason, 'CONFLICTING_APPLICANT')
})

test('review item ID must belong to the requested application and domain', () => {
  const mismatch = api.readAdoptionReviewDetail({
    actorProvider: actor('owner-a', ['owner']),
    applicationId: 'application-b',
    reviewItemId: 'review-owner-a',
    record: OWNER_PENDING,
  })
  assert.equal(mismatch.canRead, false)
  assert.equal(mismatch.reason, 'APPLICATION_ID_MISMATCH')
  const nestedMismatch = api.readAdoptionReviewList({
    actorProvider: actor('owner-a', ['owner']),
    records: [{ ...OWNER_PENDING, review: { ...OWNER_PENDING.review, applicationId: 'application-b' } }],
  })
  assert.ok(nestedMismatch.diagnostics.skipped.some(item => item.code === 'CONFLICTING_APPLICATION_ID'))
})

test('duplicate identical review snapshots collapse; conflicts and malformed records are dropped', () => {
  const duplicate = api.readAdoptionReviewList({ actorProvider: actor('owner-a', ['owner']), records: [OWNER_PENDING, { ...OWNER_PENDING, review: { ...OWNER_PENDING.review } }] })
  assert.equal(duplicate.items.length, 1)
  const conflict = api.readAdoptionReviewList({ actorProvider: actor('owner-a', ['owner']), records: [OWNER_PENDING, { ...OWNER_PENDING, status: 'pickup', review: { ...OWNER_PENDING.review, status: 'approved' } }] })
  assert.equal(conflict.items.length, 0)
  assert.ok(conflict.diagnostics.skipped.some(item => item.code === 'DUPLICATE_CONFLICT'))
})

test('list and detail resolver boundaries receive trusted actor and fail closed for async/invalid results', () => {
  let listInput
  const list = api.readAdoptionReviewList({ actorProvider: actor('owner-a', ['owner']), query: { role: 'reviewer', status: 'approved' }, resolver(input) { listInput = input; return [OWNER_PENDING] } })
  assert.equal(list.items.length, 1)
  assert.equal(listInput.actor.id, 'owner-a')
  assert.equal(Object.prototype.hasOwnProperty.call(listInput, 'query'), false)
  const detail = api.readAdoptionReviewDetail({ actorProvider: actor('owner-a', ['owner']), reviewItemId: 'review-owner-a', resolver(input) { assert.equal(input.actor.id, 'owner-a'); return OWNER_PENDING } })
  assert.equal(detail.canRead, true)
  const asyncList = api.readAdoptionReviewList({ actorProvider: actor('owner-a', ['owner']), resolver: () => Promise.resolve([OWNER_PENDING]) })
  assert.equal(asyncList.items.length, 0)
  assert.equal(asyncList.diagnostics.actorError.code, 'ASYNC_RESOLVER_UNSUPPORTED')
  const asyncDetail = api.readAdoptionReviewDetail({ actorProvider: actor('owner-a', ['owner']), reviewItemId: 'review-owner-a', resolver: () => Promise.resolve(OWNER_PENDING) })
  assert.equal(asyncDetail.canRead, false)
  assert.equal(asyncDetail.reason, 'ASYNC_RESOLVER_UNSUPPORTED')
})

test('read models are frozen and expose no mutation capability', () => {
  const result = api.readAdoptionReviewList({ actorProvider: actor('owner-a', ['owner']), records: [OWNER_PENDING] })
  assert.equal(Object.isFrozen(result), true)
  assert.equal(Object.isFrozen(result.items), true)
  assert.equal(Object.isFrozen(result.items[0]), true)
  assert.equal(Object.isFrozen(result.items[0].cloudParent), true)
  assert.equal(Object.isFrozen(result.items[0].cloudParent.reviews), true)
  if (result.items[0].cloudParent.reviews[0]) assert.equal(Object.isFrozen(result.items[0].cloudParent.reviews[0]), true)
  assert.equal(result.items[0].canWrite, false)
  assert.equal(result.items[0].readOnly, true)
  const detail = api.readAdoptionReviewDetail({ actorProvider: actor('owner-a', ['owner']), reviewItemId: 'review-owner-a', record: OWNER_PENDING })
  assert.equal(Object.isFrozen(detail), true)
  assert.equal(detail.canWrite, false)
})
