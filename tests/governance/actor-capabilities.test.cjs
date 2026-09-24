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

const POLICY = Object.freeze({
  adoptionApplication: Object.freeze({
    read: Object.freeze({ roles: ['applicant', 'owner', 'reviewer'], states: ['pending', 'pickup', 'adoption_confirmed'], stateFields: ['status'] }),
    write: Object.freeze({ roles: ['applicant'], states: ['pickup'], stateFields: ['status'] }),
  }),
  rewardClaim: Object.freeze({
    read: Object.freeze({ roles: ['applicant'], states: ['adoption_confirmed', 'reward'], stateFields: ['status'] }),
    write: Object.freeze({ roles: ['applicant'], states: ['adoption_confirmed', 'reward'], stateFields: ['status'] }),
  }),
  rescueReview: Object.freeze({
    read: Object.freeze({ roles: ['reviewer'], states: ['pending', 'reviewed'], stateFields: ['reviewStatus'] }),
    write: Object.freeze({ roles: ['reviewer'], states: ['pending'], stateFields: ['reviewStatus'] }),
  }),
  yardManagement: Object.freeze({
    read: Object.freeze({ roles: ['yard_owner'], states: ['active'], stateFields: ['status'] }),
    write: Object.freeze({ roles: ['yard_owner'], states: ['active'], stateFields: ['status'] }),
  }),
  animalEdit: Object.freeze({
    read: Object.freeze({ roles: ['yard_owner', 'animal_manager'], states: ['active', 'draft'], stateFields: ['status'] }),
    write: Object.freeze({ roles: ['yard_owner', 'animal_manager'], states: ['active', 'draft'], stateFields: ['status'] }),
  }),
})

const records = Object.freeze({
  applicationA: Object.freeze({
    applicationId: 'application-a',
    applicantId: 'actor-a',
    ownerId: 'yard-owner-a',
    reviewerId: 'reviewer-a',
    status: 'pending',
  }),
  applicationB: Object.freeze({
    applicationId: 'application-b',
    applicantId: 'actor-b',
    ownerId: 'yard-owner-b',
    reviewerId: 'reviewer-b',
    status: 'pending',
  }),
  rewardA: Object.freeze({
    applicationId: 'application-a',
    applicantId: 'actor-a',
    status: 'adoption_confirmed',
  }),
  rescueReviewA: Object.freeze({
    reviewItemId: 'review-a',
    rescueId: 'rescue-a',
    reviewerId: 'reviewer-a',
    status: 'pending',
    reviewStatus: 'pending',
  }),
  rescueReviewB: Object.freeze({
    reviewItemId: 'review-b',
    rescueId: 'rescue-b',
    reviewerId: 'reviewer-b',
    status: 'pending',
    reviewStatus: 'pending',
  }),
  yardA: Object.freeze({ yardId: 'yard-a', ownerId: 'yard-owner-a', status: 'active' }),
  yardB: Object.freeze({ yardId: 'yard-b', ownerId: 'yard-owner-b', status: 'active' }),
  animalA: Object.freeze({
    animalId: 'animal-a',
    yardId: 'yard-a',
    yardOwnerId: 'yard-owner-a',
    managerIds: ['animal-manager-a'],
    status: 'active',
  }),
})

function session(id, roles) {
  return { sessionId: `session-${id}`, actor: { id, roles } }
}

function provider(id, roles) {
  return () => session(id, roles)
}

function context(actorProvider, object, query) {
  return { actorProvider, object, policy: POLICY, query }
}

function throwsCode(fn, code) {
  assert.throws(fn, error => error && error.code === code)
}

before(async () => {
  tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'pawhome-actor-capabilities-'))
  await fsp.writeFile(path.join(tempRoot, 'package.tson'), '{"type":"module"}\n')
  await fsp.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
  await fsp.copyFile(
    path.join(ROOT, 'navigation/actorCapabilities.ts'),
    path.join(tempRoot, 'navigation/actorCapabilities.ts')
  )
  api = await import(`${pathToFileURL(path.join(tempRoot, 'navigation/actorCapabilities.ts')).href}?test=${Date.now()}`)
})

after(async () => {
  if (tempRoot) await fsp.rm(tempRoot, { recursive: true, force: true })
})

test('actor contract is pure and exports stable actor roles and capability categories', () => {
  const source = fs.readFileSync(path.join(ROOT, 'navigation/actorCapabilities.ts'), 'utf8')
  assert.doesNotMatch(source, /(?:import|require\s*\()[^\n]*(?:vue|uni|pages|packages|storage|mock)/i)
  assert.deepEqual(api.resolveTrustedActor(provider(' actor-a ', ['applicant', 'applicant'])), {
    id: 'actor-a',
    roles: ['applicant'],
  })
  assert.ok(Array.isArray(api.ACTOR_ROLES))
  assert.ok(api.CAPABILITIES.ADOPTION_APPLICATION_READ_PRIVATE)
  assert.ok(api.CAPABILITIES.REWARD_CLAIM)
  assert.ok(api.CAPABILITIES.RESCUE_REVIEW_WRITE)
  assert.ok(api.CAPABILITIES.YARD_MANAGEMENT)
  assert.ok(api.CAPABILITIES.ANIMAL_EDIT)
})

test('empty session, missing provider, malformed actor, and unknown trusted role fail closed', () => {
  const { CAPABILITIES } = api
  assert.equal(api.resolveTrustedActor(() => null), null)
  assert.equal(api.canCapability(CAPABILITIES.REWARD_CLAIM, context(() => null, records.rewardA)), false)
  throwsCode(() => api.assertCapability(CAPABILITIES.REWARD_CLAIM, context(() => null, records.rewardA)), 'CAPABILITY_DENIED')
  assert.equal(api.canCapability(CAPABILITIES.REWARD_CLAIM, context(undefined, records.rewardA)), false)
  throwsCode(() => api.resolveTrustedActor(() => ({ actor: { id: 'actor-a', roles: ['super_admin'] } })), 'UNKNOWN_ACTOR_ROLE')
  assert.equal(api.canCapability(
    CAPABILITIES.REWARD_CLAIM,
    context(() => ({ actor: { id: 'actor-a', roles: ['super_admin'] } }), records.rewardA)
  ), false)
})

test('legal owner, reviewer, yard owner, and animal manager relationships receive only their policy capabilities', () => {
  const { CAPABILITIES } = api
  assert.equal(api.canCapability(
    CAPABILITIES.ADOPTION_APPLICATION_READ_PRIVATE,
    context(provider('yard-owner-a', ['owner']), records.applicationA)
  ), true)
  assert.equal(api.canCapability(
    CAPABILITIES.RESCUE_REVIEW_WRITE,
    context(provider('reviewer-a', ['reviewer']), records.rescueReviewA)
  ), true)
  assert.equal(api.canCapability(
    CAPABILITIES.YARD_MANAGEMENT,
    context(provider('yard-owner-a', ['yard_owner']), records.yardA)
  ), true)
  assert.equal(api.canCapability(
    CAPABILITIES.ANIMAL_EDIT,
    context(provider('animal-manager-a', ['animal_manager']), records.animalA)
  ), true)
  assert.equal(api.canCapability(
    CAPABILITIES.REWARD_CLAIM,
    context(provider('actor-a', ['applicant']), records.rewardA)
  ), true)
})

test('A cannot use B application, order, rescue, yard, or animal IDs to obtain a capability', () => {
  const { CAPABILITIES } = api
  const forgedQuery = {
    applicationId: 'application-b',
    orderId: 'order-b',
    rescueId: 'rescue-b',
    yardId: 'yard-b',
    animalId: 'animal-b',
    userId: 'actor-b',
    role: 'reviewer',
    reviewerId: 'reviewer-a',
    managed: true,
    state: 'pickup',
    outcome: 'reward-claimed',
  }
  assert.equal(api.canCapability(
    CAPABILITIES.ADOPTION_APPLICATION_READ_PRIVATE,
    context(provider('actor-a', ['applicant']), records.applicationB, forgedQuery)
  ), false)
  assert.equal(api.canCapability(
    CAPABILITIES.REWARD_CLAIM,
    context(provider('actor-a', ['applicant']), { ...records.rewardA, applicationId: 'application-b', applicantId: 'actor-b' }, forgedQuery)
  ), false)
  assert.equal(api.canCapability(
    CAPABILITIES.RESCUE_REVIEW_WRITE,
    context(provider('reviewer-a', ['reviewer']), records.rescueReviewB, forgedQuery)
  ), false)
  assert.equal(api.canCapability(
    CAPABILITIES.YARD_MANAGEMENT,
    context(provider('yard-owner-a', ['yard_owner']), records.yardB, forgedQuery)
  ), false)
  assert.equal(api.canCapability(
    CAPABILITIES.ANIMAL_EDIT,
    context(provider('animal-manager-a', ['animal_manager']), { ...records.animalA, yardId: 'yard-b', yardOwnerId: 'yard-owner-b', managerIds: ['animal-manager-b'] }, forgedQuery)
  ), false)
})

test('query managed, role, state, outcome, and reviewerId never replace the trusted actor or record', () => {
  const { CAPABILITIES } = api
  const query = { managed: true, role: 'reviewer', state: 'pickup', outcome: 'approved', reviewerId: 'reviewer-a' }
  assert.equal(api.canCapability(
    CAPABILITIES.RESCUE_REVIEW_WRITE,
    context(provider('actor-a', ['applicant']), records.rescueReviewA, query)
  ), false)
  assert.equal(api.canCapability(
    CAPABILITIES.ADOPTION_APPLICATION_WRITE,
    context(provider('actor-a', ['applicant']), records.applicationA, { ...query, state: 'pickup' })
  ), false)
  // The object state remains authoritative.  A query claiming a legal state
  // cannot upgrade an unknown or otherwise disallowed record.
  assert.equal(api.canCapability(
    CAPABILITIES.ADOPTION_APPLICATION_READ_PRIVATE,
    context(provider('actor-a', ['applicant']), { ...records.applicationA, status: 'future_status' }, { state: 'pending' })
  ), false)
})

test('unknown, missing, conflicting, and malformed object states are denied', () => {
  const { CAPABILITIES } = api
  const actor = provider('actor-a', ['applicant'])
  for (const object of [
    { ...records.applicationA, status: 'future_status' },
    { ...records.applicationA, status: undefined },
    { ...records.applicationA, status: 42 },
  ]) {
    assert.equal(api.canCapability(CAPABILITIES.ADOPTION_APPLICATION_READ_PRIVATE, context(actor, object)), false)
    assert.equal(api.canCapability(CAPABILITIES.ADOPTION_APPLICATION_WRITE, context(actor, object)), false)
  }
  // The policy deliberately selects `status`; an unrelated/legacy axis does
  // not silently become a second state source.
  assert.equal(api.canCapability(CAPABILITIES.ADOPTION_APPLICATION_READ_PRIVATE, context(
    actor,
    { ...records.applicationA, applicationStatus: 'rejected' }
  )), true)
  assert.equal(api.canCapability(CAPABILITIES.YARD_MANAGEMENT, context(
    provider('yard-owner-a', ['yard_owner']),
    { ...records.yardA, status: 'unknown-yard-state' }
  )), false)
})

test('rescue review reads its explicit review axis while ignoring the independent application status axis', () => {
  const { CAPABILITIES } = api
  const reviewRecord = {
    ...records.rescueReviewA,
    status: 'pending',
    reviewStatus: 'pending',
    applicationStatus: 'platform_rejected',
  }
  assert.equal(api.canCapability(
    CAPABILITIES.RESCUE_REVIEW_READ_PRIVATE,
    context(provider('reviewer-a', ['reviewer']), reviewRecord)
  ), true)
  assert.equal(api.canCapability(
    CAPABILITIES.RESCUE_REVIEW_WRITE,
    context(provider('reviewer-a', ['reviewer']), reviewRecord)
  ), true)
  assert.equal(api.canCapability(
    CAPABILITIES.RESCUE_REVIEW_READ_PRIVATE,
    context(provider('reviewer-a', ['reviewer']), { ...reviewRecord, status: 'pending', reviewStatus: 'future_review_state' })
  ), false)
})

test('private reads and writes are guarded and denied requests perform zero injected operations', () => {
  const { CAPABILITIES } = api
  let privateReads = 0
  let writes = 0
  const denied = context(provider('actor-a', ['applicant']), records.applicationB, {
    applicationId: 'application-b',
    role: 'owner',
    managed: true,
    state: 'pickup',
  })
  throwsCode(() => api.readPrivate(
    CAPABILITIES.ADOPTION_APPLICATION_READ_PRIVATE,
    denied,
    () => { privateReads += 1 }
  ), 'CAPABILITY_DENIED')
  throwsCode(() => api.writeWithCapability(
    CAPABILITIES.ADOPTION_APPLICATION_WRITE,
    denied,
    () => { writes += 1 }
  ), 'CAPABILITY_DENIED')
  assert.equal(privateReads, 0)
  assert.equal(writes, 0)

  throwsCode(() => api.readPrivate(
    CAPABILITIES.ADOPTION_APPLICATION_WRITE,
    context(provider('actor-a', ['applicant']), records.applicationA),
    () => { privateReads += 1 }
  ), 'PRIVATE_READ_CAPABILITY_REQUIRED')
  assert.equal(privateReads, 0)
})

test('authorized private read and write execute once with fresh record state', () => {
  const { CAPABILITIES } = api
  let reads = 0
  let writes = 0
  let current = records.rescueReviewA
  const guardedContext = {
    actorProvider: provider('reviewer-a', ['reviewer']),
    policy: POLICY,
    readObject: () => {
      reads += 1
      return current
    },
  }
  const privateValue = api.readPrivate(
    CAPABILITIES.RESCUE_REVIEW_READ_PRIVATE,
    guardedContext,
    (record, authorization) => ({ id: record.rescueId, actorId: authorization.actorId })
  )
  assert.deepEqual(privateValue, { id: 'rescue-a', actorId: 'reviewer-a' })
  assert.equal(reads, 1)
  const result = api.writeWithCapability(
    CAPABILITIES.RESCUE_REVIEW_WRITE,
    guardedContext,
    (record, authorization) => {
      writes += 1
      return { recordId: record.reviewItemId, actorId: authorization.actorId }
    }
  )
  assert.deepEqual(result, { recordId: 'review-a', actorId: 'reviewer-a' })
  assert.equal(reads, 2)
  assert.equal(writes, 1)

  current = { ...records.rescueReviewA, reviewStatus: 'reviewed' }
  assert.throws(() => api.writeWithCapability(
    CAPABILITIES.RESCUE_REVIEW_WRITE,
    guardedContext,
    () => { writes += 1 }
  ), error => error && error.code === 'CAPABILITY_DENIED')
  assert.equal(writes, 1)
})

test('session switching re-reads the provider and isolates capabilities by actor', () => {
  const { CAPABILITIES } = api
  let active = session('actor-a', ['applicant'])
  const evaluator = api.createCapabilityEvaluator({ actorProvider: () => active, policy: POLICY })
  assert.equal(evaluator.can(CAPABILITIES.ADOPTION_APPLICATION_READ_PRIVATE, records.applicationA), true)
  assert.equal(evaluator.can(CAPABILITIES.ADOPTION_APPLICATION_READ_PRIVATE, records.applicationB), false)
  active = session('actor-b', ['applicant'])
  assert.equal(evaluator.can(CAPABILITIES.ADOPTION_APPLICATION_READ_PRIVATE, records.applicationA), false)
  assert.equal(evaluator.can(CAPABILITIES.ADOPTION_APPLICATION_READ_PRIVATE, records.applicationB), true)
  assert.equal(evaluator.evaluate(records.applicationA).actor.id, 'actor-b')
})

test('missing policy and malformed object ownership stay fail-closed', () => {
  const { CAPABILITIES } = api
  assert.equal(api.canCapability(CAPABILITIES.YARD_MANAGEMENT, {
    actorProvider: provider('yard-owner-a', ['yard_owner']),
    object: records.yardA,
  }), false)
  assert.equal(api.canCapability(CAPABILITIES.YARD_MANAGEMENT, context(
    provider('yard-owner-a', ['yard_owner']),
    { ...records.yardA, ownerId: { id: 'yard-owner-a' } }
  )), false)
  assert.equal(api.canCapability(CAPABILITIES.ANIMAL_EDIT, context(
    provider('yard-owner-a', ['yard_owner']),
    { ...records.animalA, yardOwnerId: 'yard-owner-b' }
  )), false)
  assert.equal(api.canCapability('animal.delete', context(
    provider('yard-owner-a', ['yard_owner']), records.animalA
  )), false)
})
