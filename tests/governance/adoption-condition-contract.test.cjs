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

const TRANSITIONS = Object.freeze({
  cloud_pending: Object.freeze(['pending', 'rejected', 'abandoned']),
  pending: Object.freeze(['pickup', 'rejected', 'abandoned']),
  pickup: Object.freeze(['owner_confirm_pending', 'owner_confirm', 'abandoned', 'rejected']),
  owner_confirm_pending: Object.freeze(['jury_confirm_pending', 'rejected', 'abandoned']),
  owner_confirm: Object.freeze(['jury_confirm', 'rejected', 'abandoned']),
  jury_confirm_pending: Object.freeze(['adoption_confirmed', 'rejected', 'abandoned']),
  jury_confirm: Object.freeze(['adoption_confirmed', 'rejected', 'abandoned']),
  adoption_confirmed: Object.freeze(['reward', 'abandoned']),
})

const POLICY_ALL = Object.freeze({
  selection: 'all',
  legalStates: ['pending', 'approved', 'rejected'],
  pendingStates: ['pending'],
  approvedStates: ['approved'],
  rejectedStates: ['rejected'],
})

const BASE = Object.freeze({
  id: 'adoption-a',
  applicantId: 'actor-a',
  ownerPawId: 'owner-a',
  status: 'cloud_pending',
  cloudParentRequired: true,
})

function actor(id, roles) {
  return () => ({ actor: { id, roles } })
}

function throwsCode(fn, code) {
  assert.throws(fn, error => error && error.code === code)
}

before(async () => {
  tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'pawhome-adoption-condition-'))
  await fsp.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
  await fsp.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
  await fsp.copyFile(
    path.join(ROOT, 'navigation/adoptionConditionContract.js'),
    path.join(tempRoot, 'navigation/adoptionConditionContract.js')
  )
  api = await import(`${pathToFileURL(path.join(tempRoot, 'navigation/adoptionConditionContract.js')).href}?test=${Date.now()}`)
})

after(async () => {
  if (tempRoot) await fsp.rm(tempRoot, { recursive: true, force: true })
})

test('contract remains pure, exports the adoption condition seam, and exposes no writer', () => {
  const source = fs.readFileSync(path.join(ROOT, 'navigation/adoptionConditionContract.js'), 'utf8')
  assert.doesNotMatch(source, /(?:import|require\s*\()[^\n]*(?:vue|uni|pages|packages|storage|mock)/i)
  assert.deepEqual(api.ADOPTION_CLOUD_PARENT_SELECTIONS, ['any', 'all', 'specific'])
  assert.deepEqual(api.ADOPTION_PERSPECTIVES, ['applicant', 'cloud_parent', 'owner'])
  assert.equal(typeof api.createAdoptionTransitionContract, 'function')
  assert.equal(typeof api.readAdoptionCondition, 'function')
  assert.equal(typeof api.canEnterAdoption, 'function')
  assert.equal(Object.keys(api).some(key => /write|save|transitionAdoption/i.test(key)), false)
})

test('uses the injected transition boundary and rejects a direct owner-confirmation jump', () => {
  const transition = api.createAdoptionTransitionContract(TRANSITIONS)
  assert.equal(transition.canTransition('owner_confirm_pending', 'jury_confirm_pending'), true)
  assert.equal(transition.canTransition('owner_confirm_pending', 'adoption_confirmed'), false)
  assert.deepEqual(transition.allowedNext('owner_confirm_pending'), ['jury_confirm_pending', 'rejected', 'abandoned'])
  throwsCode(() => api.createAdoptionTransitionContract({ pending: ['pickup', 1] }), 'INVALID_TRANSITIONS')
  assert.equal(api.canEnterAdoption({
    record: { ...BASE, status: 'owner_confirm_pending', cloudParentIds: [] },
    targetStatus: 'adoption_confirmed',
    transitions: TRANSITIONS,
  }).allowed, false)
})

test('trusted applicant, cloud-parent, and owner perspectives cannot be forged by query or record state', () => {
  const record = { ...BASE, cloudParentIds: ['cloud-a'] }
  const applicant = api.readAdoptionCondition({
    record,
    actorProvider: actor('actor-a', ['applicant']),
    perspective: 'applicant',
    query: { role: 'owner', managed: true, state: 'adoption_confirmed' },
  })
  assert.equal(applicant.canRead, true)
  assert.equal(applicant.canWrite, false)
  assert.equal(applicant.perspective, 'applicant')
  assert.equal(applicant.currentStatus, 'cloud_pending')

  const forged = api.readAdoptionCondition({
    record,
    actorProvider: actor('actor-b', ['applicant']),
    perspective: 'owner',
    query: { role: 'owner', managed: true, state: 'pickup' },
  })
  assert.equal(forged.canRead, false)
  assert.equal(forged.canWrite, false)
  assert.equal(forged.reason, 'PERSPECTIVE_NOT_AUTHORIZED')

  const cloud = api.readAdoptionCondition({
    record,
    actorProvider: actor('cloud-a', ['cloud_parent']),
    perspective: 'cloud_parent',
  })
  assert.equal(cloud.canRead, true)
  const owner = api.readAdoptionCondition({
    record: { ...record, ownerPawId: 'owner-a' },
    actorProvider: actor('owner-a', ['yard_owner']),
    perspective: 'owner',
  })
  assert.equal(owner.canRead, true)

  const genericUser = api.readAdoptionCondition({
    record: { ...BASE, applicantId: undefined, userId: 'actor-a', cloudParentIds: [] },
    actorProvider: actor('actor-a', ['applicant']),
    perspective: 'applicant',
  })
  assert.equal(genericUser.canRead, false)
  assert.equal(genericUser.reason, 'PERSPECTIVE_NOT_AUTHORIZED')
})

test('zero cloud parents explicitly skip the cloud-parent condition', () => {
  const result = api.evaluateCloudParentCondition({ record: { ...BASE, cloudParentIds: [], cloudParentRequired: false } })
  assert.deepEqual({ count: result.count, decision: result.decision, canProceed: result.canProceed }, { count: 0, decision: 'skip', canProceed: true })
  const advance = api.canEnterAdoption({
    record: { ...BASE, cloudParentIds: [], cloudParentRequired: false, status: 'cloud_pending' },
    targetStatus: 'pending',
    transitions: TRANSITIONS,
  })
  assert.equal(advance.allowed, true)
})

test('cloudParentRequired must agree with the authoritative parent ID set', () => {
  const optionalWithIds = api.evaluateCloudParentCondition({
    record: { ...BASE, cloudParentIds: ['cloud-a'], cloudParentRequired: false },
  })
  assert.equal(optionalWithIds.decision, 'decision_required')
  assert.equal(optionalWithIds.reason, 'CLOUD_PARENT_REQUIREMENT_CONFLICT')
  assert.equal(optionalWithIds.canProceed, false)

  const requiredWithoutIds = api.evaluateCloudParentCondition({
    record: { ...BASE, cloudParentIds: [], cloudParentRequired: true },
  })
  assert.equal(requiredWithoutIds.decision, 'decision_required')
  assert.equal(requiredWithoutIds.reason, 'CLOUD_PARENT_REQUIREMENT_CONFLICT')
  assert.equal(requiredWithoutIds.canProceed, false)
})

test('one cloud parent waits for review and only an existing approval proves it may proceed', () => {
  const waiting = api.evaluateCloudParentCondition({ record: { ...BASE, cloudParentIds: ['cloud-a'] } })
  assert.equal(waiting.count, 1)
  assert.equal(waiting.decision, 'pending')
  assert.equal(waiting.canProceed, false)

  const approved = api.evaluateCloudParentCondition({ record: { ...BASE, cloudParentIds: ['cloud-a'], cloudParentApprovals: ['cloud-a'] } })
  assert.equal(approved.decision, 'approved')
  assert.equal(approved.canProceed, true)
  const blocked = api.canEnterAdoption({
    record: { ...BASE, cloudParentIds: ['cloud-a'] },
    targetStatus: 'pending',
    transitions: TRANSITIONS,
  })
  assert.equal(blocked.allowed, false)
  assert.equal(blocked.reason, 'CLOUD_PARENT_REVIEW_REQUIRED')
})

test('multiple cloud parents fail closed without an explicit product policy', () => {
  const result = api.evaluateCloudParentCondition({ record: { ...BASE, cloudParentIds: ['cloud-a', 'cloud-b'] } })
  assert.equal(result.decision, 'decision_required')
  assert.equal(result.decisionRequired, true)
  assert.equal(result.canProceed, false)
  assert.equal(result.reason, 'MULTI_CLOUD_PARENT_POLICY_REQUIRED')
  const advance = api.canEnterAdoption({
    record: { ...BASE, cloudParentIds: ['cloud-a', 'cloud-b'] },
    targetStatus: 'pending',
    transitions: TRANSITIONS,
  })
  assert.equal(advance.reason, 'DECISION_REQUIRED')
})

test('terminal rejection or abandonment follows the injected legal edge while review is pending', () => {
  const rejected = api.canEnterAdoption({
    record: { ...BASE, cloudParentIds: ['cloud-a'], status: 'cloud_pending' },
    targetStatus: 'rejected',
    transitions: TRANSITIONS,
  })
  assert.equal(rejected.allowed, true)
  assert.equal(rejected.reason, 'LEGAL_TRANSITION')
  assert.equal(rejected.cloudParent.reason, 'TERMINAL_TRANSITION')

  const abandoned = api.canEnterAdoption({
    record: { ...BASE, cloudParentIds: ['cloud-a'], status: 'cloud_pending' },
    targetStatus: 'abandoned',
    transitions: TRANSITIONS,
  })
  assert.equal(abandoned.allowed, true)
})

test('policy must explicitly declare selection and a complete legal state mapping', () => {
  throwsCode(() => api.evaluateCloudParentCondition({
    record: { ...BASE, cloudParentIds: ['cloud-a', 'cloud-b'] },
    policy: { legalStates: ['pending'], pendingStates: ['pending'], approvedStates: [], rejectedStates: [] },
  }), 'POLICY_SELECTION_REQUIRED')
  throwsCode(() => api.evaluateCloudParentCondition({
    record: { ...BASE, cloudParentIds: ['cloud-a', 'cloud-b'] },
    policy: { selection: 'all', legalStates: ['pending', 'approved'], pendingStates: ['pending'], approvedStates: [], rejectedStates: [] },
  }), 'POLICY_STATE_MAPPING_REQUIRED')
  throwsCode(() => api.evaluateCloudParentCondition({
    record: { ...BASE, cloudParentIds: ['cloud-a', 'cloud-b'] },
    policy: { ...POLICY_ALL, approvedStates: ['future'] },
  }), 'POLICY_STATE_NOT_LEGAL')
})

test('explicit all/any/specific policies produce different decisions without a default product choice', () => {
  const record = { ...BASE, cloudParentIds: ['cloud-a', 'cloud-b'], cloudParentApprovals: ['cloud-a'] }
  const all = api.evaluateCloudParentCondition({ record, policy: POLICY_ALL })
  assert.equal(all.selection, 'all')
  assert.equal(all.decision, 'pending')
  const any = api.evaluateCloudParentCondition({
    record,
    policy: { ...POLICY_ALL, selection: 'any' },
  })
  assert.equal(any.decision, 'approved')
  const specific = api.evaluateCloudParentCondition({
    record,
    policy: { ...POLICY_ALL, selection: 'specific', specificIds: ['cloud-a'], specificSelection: 'all' },
  })
  assert.equal(specific.decision, 'approved')
  const outside = api.evaluateCloudParentCondition({
    record,
    policy: { ...POLICY_ALL, selection: 'specific', specificIds: ['cloud-c'], specificSelection: 'all' },
  })
  assert.equal(outside.decision, 'decision_required')
  assert.equal(outside.canProceed, false)
})

test('review resolver is required for richer states and cannot receive query or actor overrides', () => {
  let resolverInput
  const record = { ...BASE, cloudParentIds: ['cloud-a'], status: 'cloud_pending' }
  const waiting = api.evaluateCloudParentCondition({
    record,
    policy: POLICY_ALL,
    reviewResolver(input) {
      resolverInput = input
      return [{ id: 'cloud-a', state: 'pending' }]
    },
  })
  assert.equal(waiting.decision, 'pending')
  assert.equal(resolverInput.record.status, 'cloud_pending')
  assert.equal(Object.prototype.hasOwnProperty.call(resolverInput, 'query'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(resolverInput, 'actor'), false)

  const failed = api.evaluateCloudParentCondition({
    record,
    policy: POLICY_ALL,
    reviewResolver: () => [{ id: 'cloud-a', state: 'unapproved' }],
  })
  assert.equal(failed.decision, 'decision_required')
  assert.equal(failed.canProceed, false)
  // The policy did not legalize this state, so it cannot be treated as approval.
  assert.equal(failed.decisionRequired, true)
  assert.equal(failed.reason, 'REVIEW_STATE_NOT_LEGAL')

  const singleUndeclared = api.evaluateCloudParentCondition({
    record: { ...BASE, cloudParentIds: ['cloud-a'] },
    reviewResolver: () => [{ id: 'cloud-a', state: 'rejected' }],
  })
  assert.equal(singleUndeclared.decision, 'rejected')
  assert.equal(singleUndeclared.canProceed, false)
})

test('old links re-read current record stage and never replay a stale query stage', () => {
  const first = api.readAdoptionCondition({
    record: { ...BASE, cloudParentIds: [] },
    actorProvider: actor('actor-a', ['applicant']),
    perspective: 'applicant',
    query: { status: 'adoption_confirmed' },
  })
  assert.equal(first.currentStatus, 'cloud_pending')
  const second = api.readAdoptionCondition({
    record: { ...BASE, cloudParentIds: [], status: 'pickup' },
    actorProvider: actor('actor-a', ['applicant']),
    perspective: 'applicant',
    query: { status: 'cloud_pending' },
  })
  assert.equal(second.currentStatus, 'pickup')
})

test('malformed IDs, conflicting parent IDs, and missing transitions fail closed', () => {
  throwsCode(() => api.evaluateCloudParentCondition({ record: { ...BASE, cloudParentIds: ['cloud/a'] } }), 'INVALID_ID')
  throwsCode(() => api.evaluateCloudParentCondition({ record: { ...BASE, cloudParentIds: ['cloud-a'], cloudParentPawId: 'cloud-b' } }), 'CONFLICTING_CLOUD_PARENT_IDS')
  const conflictingReview = api.evaluateCloudParentCondition({
    record: { ...BASE, cloudParentIds: ['cloud-a'], cloudParentApprovals: ['cloud-a'], cloudParentRejections: ['cloud-a'] },
  })
  assert.equal(conflictingReview.decision, 'decision_required')
  assert.equal(conflictingReview.reason, 'CONFLICTING_REVIEW_DECISIONS')
  throwsCode(() => api.canEnterAdoption({ record: { ...BASE, cloudParentIds: [] }, targetStatus: 'pending' }), 'INVALID_TRANSITIONS')
  assert.equal(api.getAdoptionConditionAccess({
    record: { ...BASE, cloudParentIds: [] },
    actorProvider: actor('actor-a', ['applicant']),
  }).canWrite, false)
  assert.equal(api.readAdoptionCondition({
    record: { ...BASE, cloudParentIds: [] },
    actorProvider: () => ({ actor: { id: 'bad/id', roles: ['applicant'] } }),
    perspective: 'applicant',
  }).canRead, false)
})
