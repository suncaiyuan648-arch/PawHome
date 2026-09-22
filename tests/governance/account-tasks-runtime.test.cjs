'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after, beforeEach } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
let tempRoot
let api
const storage = new Map()
let writes = 0

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-account-tasks-runtime-'))
  await fs.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
  await fs.mkdir(path.join(tempRoot, 'packages/account/services'), { recursive: true })
  await fs.copyFile(path.join(ROOT, 'packages/account/services/tasksRuntime.js'), path.join(tempRoot, 'packages/account/services/tasksRuntime.js'))
  globalThis.uni = {
    getStorageSync(key) { return storage.get(key) },
    setStorageSync(key, value) { writes += 1; storage.set(key, value) },
  }
  api = await import(`${pathToFileURL(path.join(tempRoot, 'packages/account/services/tasksRuntime.js')).href}?test=${Date.now()}`)
})

beforeEach(() => { storage.clear(); writes = 0 })

after(async () => {
  delete globalThis.uni
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

function actor(id = 'actor-a', roles = ['applicant']) {
  return { actor: { id, roles } }
}

test('reads persisted adoption/rescue/feeding/dynamic tasks for the trusted actor only', () => {
  storage.set('PAWHOME_ACTOR_SESSION', actor())
  storage.set('PAWHOME_ADOPTIONS', JSON.stringify([{ id: 'adoption-a', applicantId: 'actor-a', status: 'pending' }]))
  storage.set('PAWHOME_RESCUES', JSON.stringify([{ id: 'rescue-a', applicant: { id: 'actor-a' }, applicationStatus: 'platform_pending' }]))
  storage.set('PAWHOME_FEEDING_ORDERS', JSON.stringify([{ id: 'order-a', userId: 'actor-a', status: 'active' }]))
  storage.set('PAWHOME_DYNAMIC_RECORDS', JSON.stringify([{ id: 'dynamic-a', authorId: 'actor-a', status: 'draft' }]))
  const result = api.readAccountTasks()
  assert.deepEqual(result.all.map(item => [item.businessType, item.businessId, item.actionType]), [
    ['adoption', 'adoption-a', 'apply'],
    ['rescue', 'rescue-a', 'apply'],
    ['feeding', 'order-a', 'feedback'],
    ['dynamic', 'dynamic-a', 'publish'],
  ])
  assert.equal(result.pending.length, 4)
  assert.equal(result.readOnly, true)
  assert.equal(result.canWrite, false)
  assert.equal(writes, 0)
})

test('missing persistent feeding/dynamic sources remain explicit and never use fixtures', () => {
  storage.set('PAWHOME_ACTOR_SESSION', actor())
  const result = api.readAccountTasks()
  assert.equal(result.all.length, 0)
  assert.ok(result.diagnostics.skipped.some(item => item.domain === 'feeding' && item.code === 'READER_MISSING'))
  assert.ok(result.diagnostics.skipped.some(item => item.domain === 'dynamic' && item.code === 'READER_MISSING'))
  assert.equal(writes, 0)
})

test('malformed IDs and storage fail closed without actor/query escalation', () => {
  storage.set('PAWHOME_ACTOR_SESSION', actor())
  storage.set('PAWHOME_FEEDING_ORDERS', JSON.stringify([{ id: 'https://evil', userId: 'actor-a', status: 'active' }]))
  storage.set('PAWHOME_DYNAMIC_RECORDS', '{broken')
  const result = api.readAccountTasks()
  assert.equal(result.all.length, 0)
  assert.ok(result.diagnostics.skipped.some(item => item.domain === 'feeding' && item.code === 'INVALID_ID'))
  assert.ok(result.diagnostics.skipped.some(item => item.domain === 'dynamic' && item.code === 'INVALID_STORAGE'))
  assert.equal(writes, 0)
})

test('missing or malformed actor is empty and does not read business sources', () => {
  storage.set('PAWHOME_FEEDING_ORDERS', JSON.stringify([{ id: 'order-a', userId: 'actor-a', status: 'active' }]))
  const result = api.readAccountTasks()
  assert.equal(result.actor, null)
  assert.equal(result.all.length, 0)
  assert.equal(result.diagnostics.actorError.code, 'NO_ACTOR')
  assert.equal(writes, 0)
})

test('conflicting duplicate task identities are discarded instead of first-row wins', () => {
  storage.set('PAWHOME_ACTOR_SESSION', actor())
  storage.set('PAWHOME_FEEDING_ORDERS', JSON.stringify([
    { id: 'order-conflict', orderId: 'order-other', userId: 'actor-a', status: 'active' },
  ]))
  const result = api.readAccountTasks()
  assert.equal(result.all.length, 0)
  assert.equal(result.pending.length, 0)
  assert.equal(result.processed.length, 0)
  assert.ok(result.diagnostics.skipped.some(item => item.code === 'CONFLICTING_RECORD'))
  assert.equal(result.readOnly, true)
  assert.equal(result.canWrite, false)
  assert.equal(writes, 0)
})

test('all ownership aliases must agree; a matching alias cannot win a conflict', () => {
  storage.set('PAWHOME_ACTOR_SESSION', actor())
  storage.set('PAWHOME_ADOPTIONS', JSON.stringify([
    { id: 'adoption-applicant-conflict', applicantId: 'actor-a', userId: 'actor-b', status: 'pending' },
  ]))
  storage.set('PAWHOME_RESCUES', JSON.stringify([
    { id: 'rescue-applicant-conflict', rescueId: 'rescue-applicant-conflict', applicant: { id: 'actor-a', pawId: 'actor-b' }, applicationStatus: 'platform_pending' },
  ]))
  storage.set('PAWHOME_FEEDING_ORDERS', JSON.stringify([
    { id: 'order-donor-conflict', userId: 'actor-a', donorId: 'actor-b', status: 'active' },
  ]))
  storage.set('PAWHOME_DYNAMIC_RECORDS', JSON.stringify([
    { id: 'dynamic-author-conflict', authorId: 'actor-a', userId: 'actor-b', status: 'draft' },
  ]))
  const result = api.readAccountTasks()
  assert.equal(result.all.length, 0)
  assert.equal(result.diagnostics.skipped.filter(item => item.code === 'CONFLICTING_RECORD').length >= 4, true)
  assert.equal(writes, 0)
})

test('yard_owner may read an owner adoption review and rescue reviewerId is equivalent to reviewerIds', () => {
  storage.set('PAWHOME_ACTOR_SESSION', actor('owner-a', ['yard_owner']))
  storage.set('PAWHOME_ADOPTIONS', JSON.stringify([{
    id: 'adoption-owner-review',
    applicationId: 'adoption-owner-review',
    applicantId: 'applicant-a',
    ownerId: 'owner-a',
    status: 'pending',
    review: { reviewItemId: 'review-owner', reviewerRole: 'owner', reviewerId: 'owner-a', status: 'pending' },
  }]))
  storage.set('PAWHOME_RESCUES', JSON.stringify([{
    id: 'rescue-review-nested',
    rescueId: 'rescue-review-nested',
    applicantId: 'applicant-a',
    applicationStatus: 'platform_approved',
    review: { reviewItemId: 'review-rescue', reviewerIds: ['reviewer-a'], status: 'pending' },
  }]))
  const owner = api.readAccountTasks()
  assert.deepEqual(owner.all.map(item => [item.businessType, item.actorRole, item.actionType, item.reviewItemId]), [
    ['adoption', 'owner', 'review', 'review-owner'],
  ])

  storage.set('PAWHOME_ACTOR_SESSION', actor('reviewer-a', ['reviewer']))
  const reviewer = api.readAccountTasks()
  assert.deepEqual(reviewer.all.map(item => [item.businessType, item.actorRole, item.actionType, item.reviewItemId]), [
    ['rescue', 'reviewer', 'review', 'review-rescue'],
  ])
  assert.equal(writes, 0)
})
