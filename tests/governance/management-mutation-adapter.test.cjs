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
  yard: Object.freeze({ readStates: ['active'], manageStates: ['active'], editStates: ['active'], ownerRoles: ['yard_owner'], yardOwnerRoles: ['yard_owner'] }),
  animal: Object.freeze({ readStates: ['active'], manageStates: ['active'], editStates: ['active'], yardOwnerRoles: ['yard_owner'], managerRoles: ['animal_manager'] }),
})

function actor(id, roles = []) { return () => ({ actor: { id, roles } }) }
function profile(overrides = {}) { return { userId: 'user-a', status: 'active', visibility: 'public', nickname: 'A', ...overrides } }
function yard(overrides = {}) { return { yardId: 'yard-a', yardOwnerId: 'owner-a', status: 'active', visibility: 'public', name: 'A yard', ...overrides } }
function animal(overrides = {}) { return { animalId: 'animal-a', yardId: 'yard-a', yardOwnerId: 'owner-a', managerIds: ['manager-a'], status: 'active', visibility: 'public', name: 'A cat', ...overrides } }

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-management-mutation-'))
  await fs.writeFile(path.join(tempRoot, 'package.tson'), '{"type":"module"}\n')
  await fs.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
  await fs.mkdir(path.join(tempRoot, 'packages/account/services'), { recursive: true })
  for (const file of ['actorCapabilities.ts', 'managementContracts.ts']) {
    await fs.copyFile(path.join(ROOT, 'navigation', file), path.join(tempRoot, 'navigation', file))
  }
  for (const file of ['managementAdapter.ts', 'managementMutationAdapter.ts']) {
    await fs.copyFile(path.join(ROOT, 'packages/account/services', file), path.join(tempRoot, 'packages/account/services', file))
  }
  api = await import(`${pathToFileURL(path.join(tempRoot, 'packages/account/services/managementMutationAdapter.ts')).href}?test=${Date.now()}`)
})

after(async () => { if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true }) })

test('management mutations require an injected writer and fail closed when storage is absent', () => {
  const result = api.updateProfile('user-a', { nickname: 'New' }, {
    actorProvider: actor('user-a'),
    policy: POLICY,
    reader: () => profile(),
  })
  assert.equal(result.success, false)
  assert.equal(result.error.code, 'WRITER_MISSING')
  assert.equal(result.canWrite, false)
})

test('profile, yard and animal writes use fresh relation capabilities and preserve identity', () => {
  const writes = []
  const writer = context => { writes.push(context); return context.next }
  const profileResult = api.updateProfile('user-a', { nickname: 'B' }, { actorProvider: actor('user-a'), policy: POLICY, reader: () => profile(), writer })
  assert.equal(profileResult.success, true)
  assert.equal(profileResult.data.record.nickname, 'B')
  assert.equal(writes[0].next.userId, 'user-a')

  const yardResult = api.updateYard('yard-a', { name: 'B yard' }, { actorProvider: actor('owner-a', ['yard_owner']), policy: POLICY, reader: () => yard(), writer })
  assert.equal(yardResult.success, true)

  const animalResult = api.updateAnimal('animal-a', { name: 'B cat' }, {
    actorProvider: actor('manager-a', ['animal_manager']),
    policy: POLICY,
    reader: () => animal(),
    readers: { yard: () => yard() },
    writer,
  })
  assert.equal(animalResult.success, true)
  assert.equal(animalResult.data.record.animalId, 'animal-a')
  assert.equal(writes.length, 3)
})

test('untrusted fields, ownership changes, and non-owner actors never write', () => {
  let called = 0
  const writer = () => { called += 1; return true }
  const forbidden = api.updateYard('yard-a', { ownerId: 'other-owner' }, { actorProvider: actor('owner-a', ['yard_owner']), policy: POLICY, reader: () => yard(), writer })
  assert.equal(forbidden.error.code, 'FIELD_NOT_EDITABLE')
  const denied = api.updateYard('yard-a', { name: 'Nope' }, { actorProvider: actor('other-owner', ['yard_owner']), policy: POLICY, reader: () => yard(), writer })
  assert.equal(denied.error.code, 'FORBIDDEN')
  assert.equal(called, 0)
})

test('writer acknowledgements reject unsupported primitive values', () => {
  const result = api.updateProfile('user-a', { nickname: 'New' }, {
    actorProvider: actor('user-a'),
    policy: POLICY,
    reader: () => profile(),
    writer: () => 'saved',
  })
  assert.equal(result.success, false)
  assert.equal(result.error.code, 'INVALID_WRITER_RESULT')
  assert.equal(result.canWrite, false)
})
