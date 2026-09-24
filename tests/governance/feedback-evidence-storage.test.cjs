'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after, beforeEach } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const KEY = 'PAWHOME_FEEDBACK_EVIDENCE'
let tempRoot
let api

const POLICY = Object.freeze({
  version: 'feedback-v1',
  evidenceKinds: ['dynamic', 'feeding_evidence'],
  requiredCount: 2,
  maximumCount: 3,
  startsAt: '2026-09-01T00:00:00Z',
  expiresAt: '2026-10-01T00:00:00Z',
  countRules: { pending: 'exclude', active: 'count', corrected: 'count', deleted: 'exclude', withdrawn: 'exclude', rejected: 'exclude' },
  lastFeedbackStates: ['active', 'corrected'],
})

function actor(id = 'actor-a') {
  return () => ({ actor: { id, roles: [] } })
}

function dynamic(overrides = {}) {
  return {
    evidenceId: 'dynamic-evidence-1', dynamicId: 'dynamic-1', kind: 'dynamic', actorId: 'actor-a',
    policyVersion: POLICY.version, attemptKey: 'attempt-1', requestId: 'request-1', state: 'active',
    createdAt: '2026-09-05T00:00:00Z', ...overrides,
  }
}

function feeding(overrides = {}) {
  return {
    evidenceId: 'feeding-evidence-1', dynamicId: 'dynamic-feed-1', kind: 'feeding_evidence', actorId: 'actor-a',
    policyVersion: POLICY.version, attemptKey: 'attempt-feed-1', requestId: 'request-feed-1', state: 'active',
    createdAt: '2026-09-05T00:00:00Z',
    order: { orderId: 'order-1', animalId: 'animal-1', yardId: 'yard-1' },
    animal: { animalId: 'animal-1', yardId: 'yard-1' }, ...overrides,
  }
}

function reset() {
  globalThis.uni.storage.clear()
  globalThis.uni.reads.length = 0
  globalThis.uni.writes.length = 0
  globalThis.uni.failWrite = false
}

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-feedback-evidence-'))
  await fs.writeFile(path.join(tempRoot, 'package.tson'), '{"type":"module"}\n')
  await fs.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
  await fs.mkdir(path.join(tempRoot, 'packages/feeding/services'), { recursive: true })
  for (const file of ['actorCapabilities.ts', 'feedbackContracts.ts']) {
    await fs.copyFile(path.join(ROOT, 'navigation', file), path.join(tempRoot, 'navigation', file))
  }
  await fs.copyFile(
    path.join(ROOT, 'packages/feeding/services/feedbackEvidenceStorage.ts'),
    path.join(tempRoot, 'packages/feeding/services/feedbackEvidenceStorage.ts')
  )
  globalThis.uni = {
    storage: new Map(), reads: [], writes: [], failWrite: false,
    getStorageSync(key) { this.reads.push(key); return this.storage.get(key) },
    setStorageSync(key, value) {
      this.writes.push({ key, value })
      if (this.failWrite) throw new Error('write failed')
      this.storage.set(key, value)
    },
  }
  api = await import(`${pathToFileURL(path.join(tempRoot, 'packages/feeding/services/feedbackEvidenceStorage.ts')).href}?test=${Date.now()}`)
})

beforeEach(reset)

after(async () => {
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

test('storage seam is append-only and exposes no delete or correction API', async () => {
  const source = await fs.readFile(path.join(ROOT, 'packages/feeding/services/feedbackEvidenceStorage.ts'), 'utf8')
  assert.doesNotMatch(source, /removeStorageSync|deleteFeedback|correctFeedback|withdrawFeedback/)
  assert.equal(typeof api.readFeedbackEvidence, 'function')
  assert.equal(typeof api.appendFeedbackEvidence, 'function')
  assert.equal(Object.keys(api).some(key => /delete|correct|withdraw|remove/i.test(key)), false)
})

test('append normalizes one actor scoped row and read returns a frozen canonical model', () => {
  const appended = api.appendFeedbackEvidence(dynamic(), { actorProvider: actor(), policy: POLICY })
  assert.equal(appended.success, true)
  assert.equal(appended.idempotent, false)
  assert.equal(globalThis.uni.writes.length, 1)
  const read = api.readFeedbackEvidence({ actorProvider: actor(), policy: POLICY, kind: 'dynamic', dynamicId: 'dynamic-1' })
  assert.equal(read.success, true)
  assert.equal(read.data.total, 1)
  assert.equal(read.data.items[0].businessKey, appended.data.businessKey)
  assert.equal(Object.isFrozen(read), true)
  assert.equal(Object.isFrozen(read.data.items[0]), true)
  assert.equal(read.readOnly, true)
  assert.equal(read.canWrite, false)
})

test('same attempt is idempotent while a new attemptKey appends a second row', () => {
  const first = api.appendFeedbackEvidence(dynamic(), { actorProvider: actor(), policy: POLICY })
  const retry = api.appendFeedbackEvidence(dynamic({ evidenceId: 'dynamic-retry', requestId: 'request-retry' }), { actorProvider: actor(), policy: POLICY })
  assert.equal(retry.success, true)
  assert.equal(retry.idempotent, true)
  assert.equal(globalThis.uni.writes.length, 1)
  const next = api.appendFeedbackEvidence(dynamic({ evidenceId: 'dynamic-2', attemptKey: 'attempt-2', requestId: 'request-2' }), { actorProvider: actor(), policy: POLICY })
  assert.equal(next.success, true)
  assert.equal(next.idempotent, false)
  assert.equal(globalThis.uni.writes.length, 2)
  assert.equal(api.readFeedbackEvidence({ actorProvider: actor(), policy: POLICY, dynamicId: 'dynamic-1' }).data.total, 2)
  assert.equal(first.data.businessKey, retry.data.businessKey)
})

test('actor mismatch, mutation intent, malformed association, and write failure fail closed', () => {
  const mismatch = api.appendFeedbackEvidence(dynamic(), { actorProvider: actor('actor-b'), policy: POLICY })
  assert.equal(mismatch.success, false)
  assert.equal(mismatch.error.code, 'ACTOR_MISMATCH')
  assert.equal(globalThis.uni.writes.length, 0)
  const mutation = api.appendFeedbackEvidence(dynamic({ mutationIntent: 'delete' }), { actorProvider: actor(), policy: POLICY })
  assert.equal(mutation.success, false)
  assert.equal(mutation.error.code, 'MUTATION_INTENT_NOT_SUPPORTED')
  const malformed = api.appendFeedbackEvidence(feeding({ animal: { animalId: 'animal-2', yardId: 'yard-1' } }), { actorProvider: actor(), policy: POLICY })
  assert.equal(malformed.success, false)
  assert.equal(malformed.error.code, 'ASSOCIATION_CONFLICT')
  globalThis.uni.failWrite = true
  const failed = api.appendFeedbackEvidence(dynamic(), { actorProvider: actor(), policy: POLICY })
  assert.equal(failed.success, false)
  assert.equal(failed.error.code, 'STORAGE_WRITE_FAILED')
})

test('reads are actor and association scoped; feeding and dynamic evidence remain separate', () => {
  api.appendFeedbackEvidence(dynamic(), { actorProvider: actor(), policy: POLICY })
  api.appendFeedbackEvidence(feeding(), { actorProvider: actor(), policy: POLICY })
  assert.equal(api.readFeedbackEvidence({ actorProvider: actor(), policy: POLICY, kind: 'dynamic' }).data.total, 1)
  assert.equal(api.readFeedbackEvidence({ actorProvider: actor(), policy: POLICY, kind: 'feeding_evidence', orderId: 'order-1', animalId: 'animal-1', yardId: 'yard-1' }).data.total, 1)
  assert.equal(api.readFeedbackEvidence({ actorProvider: actor('actor-b'), policy: POLICY }).data.total, 0)
  assert.equal(api.readFeedbackEvidence({ actorProvider: actor(), policy: POLICY, kind: 'feeding_evidence', orderId: 'order-other' }).data.total, 0)
})

test('invalid storage never gets silently rewritten', () => {
  const malformed = '{"broken"'
  globalThis.uni.storage.set(KEY, malformed)
  const read = api.readFeedbackEvidence({ actorProvider: actor(), policy: POLICY })
  assert.equal(read.success, false)
  assert.equal(read.error.code, 'INVALID_EVIDENCE_STORAGE')
  const append = api.appendFeedbackEvidence(dynamic({ evidenceId: 'new' }), { actorProvider: actor(), policy: POLICY })
  assert.equal(append.success, false)
  assert.equal(globalThis.uni.storage.get(KEY), malformed)
  assert.equal(globalThis.uni.writes.length, 0)
})
