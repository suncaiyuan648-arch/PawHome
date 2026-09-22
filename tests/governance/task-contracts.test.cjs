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

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-task-contracts-'))
  await fs.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
  await fs.copyFile(
    path.join(ROOT, 'navigation/taskContracts.js'),
    path.join(tempRoot, 'taskContracts.js')
  )
  api = await import(`${pathToFileURL(path.join(tempRoot, 'taskContracts.js')).href}?test=${Date.now()}`)
})

after(async () => {
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

function summary(overrides = {}) {
  return {
    businessType: 'adoption',
    businessId: 'adopt-001',
    actorId: 'actor-001',
    actorRole: 'applicant',
    actionType: 'confirm',
    status: 'pending',
    reviewItemId: 'review-001',
    ...overrides,
  }
}

function errorCode(callback, code) {
  assert.throws(callback, error => error && error.code === code)
}

test('multi-role actor keeps every object/phase task and task identity ignores display role', () => {
  const items = [
    summary({ actorRole: 'applicant', actionType: 'confirm' }),
    summary({ actorRole: 'owner', actionType: 'review', reviewItemId: 'review-002' }),
    summary({ businessType: 'rescue', businessId: 'rescue-001', actorRole: 'reviewer', actionType: 'review', reviewItemId: 'review-003' }),
    summary({ businessType: 'feeding', businessId: 'order-001', actorRole: 'donor', actionType: 'feedback', reviewItemId: undefined }),
    summary({ businessType: 'dynamic', businessId: 'dynamic-001', actorRole: 'author', actionType: 'publish', reviewItemId: undefined }),
  ]
  const result = api.dedupeTaskSummaries(items)
  assert.equal(result.length, items.length)
  assert.deepEqual(result.map(item => item.businessType), ['adoption', 'adoption', 'rescue', 'feeding', 'dynamic'])

  const applicant = api.normalizeTaskSummary(summary({ actorRole: 'applicant' }))
  const owner = api.normalizeTaskSummary(summary({ actorRole: 'owner' }))
  assert.equal(applicant.taskId, owner.taskId)
  assert.equal(applicant.actorRole, 'applicant')
  assert.equal(owner.actorRole, 'owner')
})

test('refreshes are idempotent and a processed task remains readable at its business落点', () => {
  const pending = summary({ status: 'pending' })
  const processed = summary({ status: 'processed' })
  const result = api.dedupeTaskSummaries([pending, pending, processed, pending])
  assert.equal(result.length, 1)
  assert.equal(result[0].taskId, api.taskIdFor(pending))
  assert.equal(result[0].status, 'processed')
  assert.equal(result[0].businessType, 'adoption')
  assert.equal(result[0].businessId, 'adopt-001')
  assert.equal(result[0].reviewItemId, 'review-001')
  assert.deepEqual(api.getTaskState(result[0]), {
    status: 'processed',
    bucket: 'processed',
    processed: true,
  })
  assert.equal(api.canReadTaskSummary(result[0], { id: 'actor-001', roles: ['forged'] }), true)
})

test('forged role/status never grants write capability or changes identity', () => {
  const normal = api.normalizeTaskSummary(summary({ actorRole: 'applicant', status: 'pending' }))
  const forged = api.normalizeTaskSummary(summary({ actorRole: 'owner', status: 'completed' }))
  assert.equal(normal.taskId, forged.taskId)
  assert.equal(api.getTaskAccess(forged, { id: 'actor-001', roles: ['owner'] }).canRead, true)
  assert.equal(api.getTaskAccess(forged, { id: 'actor-001', roles: ['owner'] }).canWrite, false)
  assert.equal(api.getTaskAccess(forged, { id: 'actor-001', roles: ['reviewer'] }).canWrite, false)
  assert.equal(api.canWriteTaskSummary(forged), false)
  assert.equal(api.canWriteTaskSummary({ actorRole: 'reviewer', status: 'completed' }), false)
})

test('task identity is deterministic and isolates actor, object, phase, and business domain', () => {
  const first = summary()
  assert.equal(api.taskIdFor(first), api.taskIdFor({ ...first }))
  assert.notEqual(api.taskIdFor(first), api.taskIdFor({ ...first, actorId: 'actor-002' }))
  assert.notEqual(api.taskIdFor(first), api.taskIdFor({ ...first, businessId: 'adopt-002' }))
  assert.notEqual(api.taskIdFor(first), api.taskIdFor({ ...first, actionType: 'apply' }))
  assert.notEqual(api.taskIdFor(first), api.taskIdFor({ ...first, businessType: 'rescue', businessId: 'rescue-001', actorRole: 'reviewer', actionType: 'review', reviewItemId: 'review-002' }))
  assert.equal(api.taskIdFor(first).startsWith('task:'), true)
})

test('unknown, empty, URL, prototype, and cross-domain inputs fail closed', () => {
  errorCode(() => api.normalizeTaskSummary(summary({ businessType: 'order' })), 'INVALID_ENUM')
  errorCode(() => api.normalizeTaskSummary(summary({ businessId: '' })), 'MISSING_VALUE')
  errorCode(() => api.normalizeTaskSummary(summary({ businessId: 'https://example.test/adopt-001' })), 'INVALID_ID')
  errorCode(() => api.normalizeTaskSummary(summary({ status: 'approved' })), 'INVALID_ENUM')
  errorCode(() => api.normalizeTaskSummary(summary({ actionType: 'review', businessType: 'feeding', businessId: 'order-001', actorRole: 'donor', reviewItemId: undefined })), 'INVALID_ENUM')
  errorCode(() => api.normalizeTaskSummary(summary({ businessType: 'adoption', businessId: 'rescue-001' })), 'CROSS_DOMAIN_ID')
  errorCode(() => api.normalizeTaskSummary(summary({ businessType: 'adoption', reviewItemId: 'rescue-review-001' })), 'CROSS_DOMAIN_ID')
  errorCode(() => api.normalizeTaskSummary(summary({ businessType: 'feeding', businessId: 'order-001', actorRole: 'donor', actionType: 'feedback', reviewItemId: 'review-001' })), 'CROSS_DOMAIN_FIELD')
  errorCode(() => api.normalizeTaskSummary(summary({ url: '/packages/adoption/pages/review/detail/index' })), 'UNKNOWN_FIELD')

  const polluted = Object.create(null)
  Object.assign(polluted, summary())
  Object.defineProperty(polluted, '__proto__', { value: 'polluted', enumerable: true })
  errorCode(() => api.normalizeTaskSummary(polluted), 'PROTOTYPE_KEY')

  errorCode(() => api.normalizeTaskSummary(summary({ taskId: 'task:forged' })), 'TASK_ID_MISMATCH')
})

test('domain fields stay explicit and do not accept aliases or arbitrary URLs', () => {
  for (const item of [
    summary({ adoptionId: 'adopt-001' }),
    summary({ rescueId: 'rescue-001' }),
    summary({ orderId: 'order-001' }),
    summary({ dynamicId: 'dynamic-001' }),
    summary({ reviewItemId: 'https://example.test/review-001' }),
  ]) {
    errorCode(() => api.normalizeTaskSummary(item), item.reviewItemId && item.reviewItemId.startsWith('http') ? 'INVALID_ID' : 'UNKNOWN_FIELD')
  }
})

test('normalization and de-duplication are read-only and expose no write callback path', () => {
  let writes = 0
  const callback = () => { writes += 1 }
  const normalized = api.normalizeTaskSummary(summary())
  assert.equal(Object.isFrozen(normalized), true)
  assert.throws(() => { normalized.status = 'completed' }, TypeError)
  assert.equal(normalized.status, 'pending')
  errorCode(() => api.normalizeTaskSummary(summary({ write: callback })), 'UNKNOWN_FIELD')
  assert.equal(writes, 0)

  const list = api.dedupeTaskSummaries([normalized])
  assert.equal(Object.isFrozen(list), true)
  assert.equal(api.canWriteTaskSummary(normalized), false)
  assert.equal(writes, 0)
})
