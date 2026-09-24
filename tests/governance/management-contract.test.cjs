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

const POLICY = Object.freeze({
  profile: Object.freeze({ readStates: ['active'], editStates: ['active'] }),
  yard: Object.freeze({
    readStates: ['active'],
    manageStates: ['active'],
    editStates: ['active'],
    ownerRoles: ['yard_owner', 'owner'],
    yardOwnerRoles: ['yard_owner'],
  }),
  animal: Object.freeze({
    readStates: ['active', 'draft'],
    manageStates: ['active', 'draft'],
    editStates: ['active', 'draft'],
    yardOwnerRoles: ['yard_owner'],
    managerRoles: ['animal_manager'],
  }),
})

function provider(id, roles) {
  return () => ({ actor: { id, roles } })
}

function profile(overrides = {}) {
  return { userId: 'user-a', status: 'active', visibility: 'public', ...overrides }
}

function yard(overrides = {}) {
  return {
    yardId: 'yard-a',
    yardOwnerId: 'yard-owner-a',
    status: 'active',
    visibility: 'public',
    ...overrides,
  }
}

function animal(overrides = {}) {
  return {
    animalId: 'animal-a',
    yardId: 'yard-a',
    yardOwnerId: 'yard-owner-a',
    managerIds: ['animal-manager-a'],
    cloudParentIds: ['cloud-parent-a'],
    status: 'active',
    visibility: 'public',
    ...overrides,
  }
}

function throwsCode(callback, code) {
  assert.throws(callback, (error) => error && error.code === code)
}

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-management-contract-'))
  await fs.writeFile(path.join(tempRoot, 'package.tson'), '{"type":"module"}\n')
  await fs.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
  await fs.copyFile(
    path.join(ROOT, 'navigation/actorCapabilities.ts'),
    path.join(tempRoot, 'navigation/actorCapabilities.ts'),
  )
  await fs.copyFile(
    path.join(ROOT, 'navigation/managementContracts.ts'),
    path.join(tempRoot, 'navigation/managementContracts.ts'),
  )
  api = await import(
    `${pathToFileURL(path.join(tempRoot, 'navigation/managementContracts.ts')).href}?test=${Date.now()}-${Math.random()}`
  )
})

after(async () => {
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

test('management contract is pure and exposes separate read and edit capabilities', async () => {
  const source = await fs.readFile(path.join(ROOT, 'navigation/managementContracts.ts'), 'utf8')
  assert.doesNotMatch(
    source,
    /(?:from\s+['"][^'"]*(?:vue|uni|pages|storage|mock)|require\s*\([^)]*(?:vue|uni|pages|storage|mock)|uni\.)/i,
  )
  assert.ok(api.MANAGEMENT_CAPABILITIES.PROFILE_EDIT)
  assert.ok(api.MANAGEMENT_CAPABILITIES.YARD_EDIT)
  assert.ok(api.MANAGEMENT_CAPABILITIES.ANIMAL_EDIT)
  assert.equal('write' in api, false)
  assert.equal('save' in api, false)
})

test('own profile can read private data and edit; another profile stays public-read only', () => {
  const own = api.evaluateManagementCapabilities({
    actorProvider: provider('user-a', []),
    profile: profile(),
    policy: POLICY,
  })
  assert.equal(own.permissions.profile.readPublic, true)
  assert.equal(own.permissions.profile.readPrivate, true)
  assert.equal(own.permissions.profile.edit, true)
  assert.equal(own.readOnly, true)
  assert.equal(own.canWrite, false)

  const other = api.evaluateManagementCapabilities({
    actorProvider: provider('user-a', []),
    profile: profile({ userId: 'user-b' }),
    policy: POLICY,
  })
  assert.equal(other.permissions.profile.readPublic, true)
  assert.equal(other.permissions.profile.readPrivate, false)
  assert.equal(other.permissions.profile.edit, false)
  assert.equal(other.reasons[api.MANAGEMENT_CAPABILITIES.PROFILE_EDIT], 'ACTOR_NOT_PROFILE_OWNER')
})

test('yard edit requires a trusted yard owner relation; ordinary users and animal managers cannot edit it', () => {
  const owner = api.evaluateManagementCapabilities({
    actorProvider: provider('yard-owner-a', ['yard_owner']),
    yard: yard(),
    policy: POLICY,
  })
  assert.equal(owner.permissions.yard.readPublic, true)
  assert.equal(owner.permissions.yard.managementRead, true)
  assert.equal(owner.permissions.yard.edit, true)

  for (const actor of [
    provider('user-a', []),
    provider('animal-manager-a', ['animal_manager']),
    provider('cloud-parent-a', ['cloud_parent']),
    provider('yard-owner-b', ['yard_owner']),
  ]) {
    const result = api.evaluateManagementCapabilities({
      actorProvider: actor,
      yard: yard(),
      policy: POLICY,
      query: { managed: true, role: 'yard_owner', state: 'active' },
    })
    assert.equal(result.permissions.yard.readPublic, true)
    assert.equal(result.permissions.yard.managementRead, false)
    assert.equal(result.permissions.yard.edit, false)
  }

  const genericOwner = api.evaluateManagementCapabilities({
    actorProvider: provider('owner-a', ['owner']),
    yard: yard({ ownerId: 'owner-a' }),
    policy: POLICY,
  })
  assert.equal(genericOwner.permissions.yard.edit, true)
})

test('cloud parent is not an animal manager; explicit animal manager or yard owner relation is required', () => {
  const cloudParent = api.evaluateManagementCapabilities({
    actorProvider: provider('cloud-parent-a', ['cloud_parent']),
    animal: animal(),
    policy: POLICY,
  })
  assert.equal(cloudParent.permissions.animal.readPublic, true)
  assert.equal(cloudParent.permissions.animal.managementRead, false)
  assert.equal(cloudParent.permissions.animal.edit, false)

  const manager = api.evaluateManagementCapabilities({
    actorProvider: provider('animal-manager-a', ['animal_manager']),
    animal: animal(),
    policy: POLICY,
  })
  assert.equal(manager.permissions.animal.managementRead, true)
  assert.equal(manager.permissions.animal.edit, true)

  const yardOwner = api.evaluateManagementCapabilities({
    actorProvider: provider('yard-owner-a', ['yard_owner']),
    yard: yard(),
    animal: animal(),
    policy: POLICY,
  })
  assert.equal(yardOwner.permissions.animal.managementRead, true)
  assert.equal(yardOwner.permissions.animal.edit, true)

  const genericOwner = api.evaluateManagementCapabilities({
    actorProvider: provider('yard-owner-a', ['owner']),
    yard: yard(),
    animal: animal(),
    policy: POLICY,
  })
  assert.equal(genericOwner.permissions.animal.edit, false)
})

test('animal and yard IDs must agree; unrelated yard context cannot authorize animal management', () => {
  const result = api.evaluateManagementCapabilities({
    actorProvider: provider('yard-owner-a', ['yard_owner']),
    yard: yard({ yardId: 'yard-b' }),
    animal: animal({ yardId: 'yard-a' }),
    policy: POLICY,
  })
  assert.equal(result.error.code, 'CROSS_YARD_RELATION')
  assert.equal(result.permissions.yard.edit, false)
  assert.equal(result.permissions.animal.edit, false)

  const direct = api.evaluateManagementCapabilities({
    actorProvider: provider('yard-owner-a', ['yard_owner']),
    animal: animal({ yardId: 'yard-b' }),
    policy: POLICY,
  })
  assert.equal(direct.permissions.animal.edit, true)
})

test('managed, role, and state query hints cannot replace trusted relations or object state', () => {
  const denied = api.evaluateManagementCapabilities({
    actorProvider: provider('user-a', []),
    yard: yard({ yardOwnerId: 'yard-owner-b' }),
    policy: POLICY,
    query: { managed: true, role: 'yard_owner', state: 'active' },
  })
  assert.equal(denied.permissions.yard.edit, false)
  assert.equal(
    denied.reasons[api.MANAGEMENT_CAPABILITIES.YARD_EDIT],
    'YARD_OWNER_RELATION_REQUIRED',
  )

  const unknownState = api.evaluateManagementCapabilities({
    actorProvider: provider('yard-owner-a', ['yard_owner']),
    yard: yard({ status: 'future-state' }),
    policy: POLICY,
    query: { managed: true, role: 'yard_owner', state: 'active' },
  })
  assert.equal(unknownState.permissions.yard.edit, false)
  assert.equal(unknownState.reasons[api.MANAGEMENT_CAPABILITIES.YARD_EDIT], 'STATE_NOT_ALLOWED')

  const conflictingState = api.evaluateManagementCapabilities({
    actorProvider: provider('yard-owner-a', ['yard_owner']),
    yard: yard({ status: 'active', state: 'draft' }),
    policy: POLICY,
  })
  assert.equal(conflictingState.permissions.yard.edit, false)
  assert.equal(conflictingState.reasons[api.MANAGEMENT_CAPABILITIES.YARD_EDIT], 'CONFLICTING_STATE')
})

test('unknown query fields, malformed IDs, and conflicting locators fail closed', () => {
  const unknownQuery = api.evaluateManagementCapabilities({
    actorProvider: provider('yard-owner-a', ['yard_owner']),
    yard: yard(),
    policy: POLICY,
    query: { managed: true, role: 'yard_owner', state: 'active', outcome: 'approved' },
  })
  assert.equal(unknownQuery.error.code, 'UNKNOWN_QUERY_FIELD')
  assert.equal(unknownQuery.permissions.yard.edit, false)

  const locatorConflict = api.evaluateManagementCapabilities({
    actorProvider: provider('user-a', []),
    profile: profile(),
    userId: 'user-b',
    policy: POLICY,
  })
  assert.equal(locatorConflict.error.code, 'LOCATOR_MISMATCH')
  assert.equal(locatorConflict.permissions.profile.edit, false)

  const malformed = api.evaluateManagementCapabilities({
    actorProvider: provider('yard-owner-a', ['yard_owner']),
    yard: yard({ yardOwnerId: { id: 'yard-owner-a' } }),
    policy: POLICY,
  })
  assert.equal(malformed.error.code, 'INVALID_ID')
  assert.equal(malformed.permissions.yard.edit, false)

  const invalidResource = api.evaluateManagementCapabilities({
    actorProvider: provider('yard-owner-a', ['yard_owner']),
    object: yard(),
    resourceType: 'review',
    policy: POLICY,
  })
  assert.equal(invalidResource.error.code, 'INVALID_RESOURCE_TYPE')
  assert.equal(invalidResource.canWrite, false)
})

test('relationship aliases must agree instead of silently unioning IDs', () => {
  for (const context of [
    { yard: yard({ ownerId: 'owner-a', ownerIds: ['owner-b'] }) },
    { yard: yard({ yardOwnerId: 'yard-owner-a', yardOwnerIds: ['yard-owner-b'] }) },
    { animal: animal({ managerId: 'animal-manager-a', managerIds: ['animal-manager-b'] }) },
    { animal: animal({ cloudParentId: 'cloud-parent-a', cloudParentIds: ['cloud-parent-b'] }) },
  ]) {
    const result = api.evaluateManagementCapabilities({
      actorProvider: provider('yard-owner-a', ['yard_owner']),
      ...context,
      policy: POLICY,
    })
    assert.equal(result.error.code, 'CONFLICTING_RELATION')
    assert.equal(result.canWrite, false)
  }

  const validMany = api.evaluateManagementCapabilities({
    actorProvider: provider('animal-manager-a', ['animal_manager']),
    animal: animal({ managerIds: ['animal-manager-a', 'animal-manager-b'] }),
    policy: POLICY,
  })
  assert.equal(validMany.permissions.animal.edit, true)
})

test('object and locator IDs with surrounding whitespace are malformed', () => {
  for (const context of [
    {
      actorProvider: provider('user-a', []),
      profile: profile({ userId: ' user-a' }),
      policy: POLICY,
    },
    {
      actorProvider: provider('yard-owner-a', ['yard_owner']),
      yard: yard({ yardId: 'yard-a ' }),
      policy: POLICY,
    },
    {
      actorProvider: provider('yard-owner-a', ['yard_owner']),
      yard: yard(),
      yardId: ' yard-a',
      policy: POLICY,
    },
    {
      actorProvider: provider('yard-owner-a', ['yard_owner']),
      yard: yard(),
      query: { yardId: 'yard-a ' },
      policy: POLICY,
    },
  ]) {
    const result = api.evaluateManagementCapabilities(context)
    assert.equal(result.error.code, 'INVALID_ID')
    assert.equal(result.canWrite, false)
  }
})

test('policy and state boundaries are explicit; no policy does not create edit authority', () => {
  const result = api.evaluateManagementCapabilities({
    actorProvider: provider('yard-owner-a', ['yard_owner']),
    yard: yard(),
    animal: animal(),
  })
  assert.equal(result.permissions.yard.readPublic, false)
  assert.equal(result.permissions.yard.edit, false)
  assert.equal(result.permissions.animal.edit, false)
  assert.equal(result.reasons[api.MANAGEMENT_CAPABILITIES.YARD_EDIT], 'POLICY_MISSING')

  throwsCode(
    () => api.normalizePolicy({ yard: { readStates: ['active'], unknown: true } }),
    'UNKNOWN_POLICY_FIELD',
  )
  throwsCode(() => api.normalizePolicy({ animal: { editStates: [''] } }), 'INVALID_POLICY')
  throwsCode(
    () => api.normalizePolicy({ yard: { readStates: ['active'], readableStates: ['draft'] } }),
    'CONFLICTING_POLICY_FIELD',
  )

  const malformedCancelled = api.evaluateManagementCapabilities({
    actorProvider: provider('yard-owner-a', ['yard_owner']),
    yard: yard(),
    policy: POLICY,
    cancelled: 'true',
  })
  assert.equal(malformedCancelled.error.code, 'INVALID_CANCELLED')
  assert.equal(malformedCancelled.cancelled, false)
})

test('cancelled reads have no mutation surface and return deeply frozen results', () => {
  const result = api.evaluateManagementCapabilities({
    actorProvider: provider('yard-owner-a', ['yard_owner']),
    yard: yard(),
    policy: POLICY,
    intent: 'cancel',
  })
  assert.equal(result.cancelled, true)
  assert.equal(result.readOnly, true)
  assert.equal(result.canWrite, false)
  for (const capability of api.CAPABILITY_LIST) assert.equal(result.capabilities[capability], false)
  assert.equal(Object.isFrozen(result), true)
  assert.equal(Object.isFrozen(result.actor), true)
  assert.equal(Object.isFrozen(result.capabilities), true)
  assert.equal(Object.isFrozen(result.permissions.yard), true)
  assert.equal(Object.isFrozen(result.records), true)
  assert.equal(Object.isFrozen(result.records.yard), true)
  assert.throws(() => {
    result.permissions.yard.edit = true
  }, TypeError)
})

test('trusted actor is read afresh after a session switch', () => {
  let current = { actor: { id: 'yard-owner-a', roles: ['yard_owner'] } }
  const evaluator = api.createManagementEvaluator({ actorProvider: () => current, policy: POLICY })
  assert.equal(evaluator.can(api.MANAGEMENT_CAPABILITIES.YARD_EDIT, { yard: yard() }), true)
  current = { actor: { id: 'yard-owner-b', roles: ['yard_owner'] } }
  assert.equal(evaluator.can(api.MANAGEMENT_CAPABILITIES.YARD_EDIT, { yard: yard() }), false)
  assert.equal(evaluator.evaluate({ yard: yard() }).actor.id, 'yard-owner-b')
  current = { actor: { id: 'yard-owner-a', roles: ['yard_owner'] } }
  const authorization = evaluator.assert(api.MANAGEMENT_CAPABILITIES.YARD_EDIT, { yard: yard() })
  assert.equal(authorization.readOnly, true)
  assert.equal(authorization.canWrite, false)
})

test('missing or invalid actor cannot read private management data', () => {
  const missing = api.evaluateManagementCapabilities({ yard: yard(), policy: POLICY })
  assert.equal(missing.actor, null)
  assert.equal(missing.permissions.yard.readPublic, false)
  assert.equal(missing.permissions.yard.managementRead, false)
  assert.equal(missing.permissions.yard.edit, false)

  const invalid = api.evaluateManagementCapabilities({
    actorProvider: () => ({ actor: { id: 'user-a', roles: ['not-a-role'] } }),
    yard: yard(),
    policy: POLICY,
  })
  assert.equal(invalid.actor, null)
  assert.equal(invalid.error.code, 'UNKNOWN_ACTOR_ROLE')
  assert.equal(invalid.permissions.yard.edit, false)
})
