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

function actor(id = 'actor-a') { return () => ({ actor: { id, roles: ['applicant'] } }) }
function storage() {
  const values = new Map()
  return { values, getStorageSync(key) { return values.get(key) }, setStorageSync(key, value) { values.set(key, value) } }
}
function input(extra = {}) {
  return { order: { orderId: 'order-a', yardId: 'yard-a' }, animal: { animalId: 'animal-a', yardId: 'yard-a' }, actorProvider: actor(), ...extra }
}

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-feedback-publisher-'))
  await fs.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
  await fs.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
  await fs.copyFile(path.join(ROOT, 'navigation/actorCapabilities.js'), path.join(tempRoot, 'navigation/actorCapabilities.js'))
  await fs.copyFile(path.join(ROOT, 'navigation/feedbackContracts.js'), path.join(tempRoot, 'navigation/feedbackContracts.js'))
  await fs.mkdir(path.join(tempRoot, 'packages/dynamic/services'), { recursive: true })
  let source = await fs.readFile(path.join(ROOT, 'packages/dynamic/services/feedbackPublisher.js'), 'utf8')
  source = source.replace("'@/navigation/actorCapabilities.js'", "'../../../navigation/actorCapabilities.js'")
  source = source.replace("'@/navigation/feedbackContracts.js'", "'../../../navigation/feedbackContracts.js'")
  await fs.writeFile(path.join(tempRoot, 'packages/dynamic/services/feedbackPublisher.js'), source)
  api = await import(`${pathToFileURL(path.join(tempRoot, 'packages/dynamic/services/feedbackPublisher.js')).href}?test=${Date.now()}`)
})

after(async () => {
  delete globalThis.uni
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

test('publisher appends actor-scoped evidence, counts it, and makes retries idempotent', () => {
  const sink = storage()
  const first = api.appendLocalFeedback({ ...input(), storage: sink, attemptKey: 'attempt-a' })
  assert.equal(first.success, true)
  assert.equal(first.wrote, true)
  assert.equal(first.data.completedCount, 1)
  const retry = api.appendLocalFeedback({ ...input(), storage: sink, attemptKey: 'attempt-a' })
  assert.equal(retry.success, true)
  assert.equal(retry.idempotent, true)
  assert.equal(retry.wrote, false)
  const second = api.appendLocalFeedback({ ...input(), storage: sink, attemptKey: 'attempt-b' })
  assert.equal(second.success, true)
  assert.equal(second.data.completedCount, 2)
  const summary = api.readLocalFeedbackSummary({ ...input(), storage: sink })
  assert.equal(summary.success, true)
  assert.equal(summary.data.status, 'completed')
})

test('publisher refuses missing actors and cross-yard associations without writing', () => {
  const sink = storage()
  const missingActor = api.appendLocalFeedback({ ...input({ actorProvider: () => null }), storage: sink, attemptKey: 'attempt-a' })
  assert.equal(missingActor.success, false)
  assert.equal(missingActor.error.code, 'NO_ACTOR')
  const conflict = api.appendLocalFeedback({ order: { orderId: 'order-a', yardId: 'yard-a' }, animal: { animalId: 'animal-a', yardId: 'yard-b' }, actorProvider: actor(), storage: sink, attemptKey: 'attempt-b' })
  assert.equal(conflict.success, false)
  assert.equal(conflict.error.code, 'CROSS_YARD_ASSOCIATION')
  assert.equal(sink.values.has(api.FEEDBACK_EVIDENCE_STORAGE_KEY), false)
})

test('runtime publisher stores feedback body/media and canonical associations only after fresh owner reads', () => {
  const sink = storage()
  sink.setStorageSync(api.FEEDING_ORDER_STORAGE_KEY, JSON.stringify([{
    orderId: 'order-a',
    yardId: 'yard-a',
    yardOwnerId: 'actor-a',
    animalId: 'animal-a',
    status: 'delivered',
  }]))
  sink.setStorageSync(api.YARD_STORAGE_KEY, JSON.stringify([{
    yardId: 'yard-a',
    yardOwnerId: 'actor-a',
    status: 'active',
  }]))
  sink.setStorageSync(api.ANIMAL_STORAGE_KEY, JSON.stringify([{
    animalId: 'animal-a',
    yardId: 'yard-a',
    status: 'active',
  }]))
  globalThis.uni = sink
  const published = api.publishLocalFeedback({
    orders: [{ orderId: 'order-a' }],
    animals: [{ animalId: 'animal-a' }],
    content: '今天已收到猫粮，猫咪状态稳定。',
    mediaList: ['wxfile://feedback-a.jpg'],
    actorProvider: actor(),
    storage: sink,
    attemptKey: 'attempt-runtime-a',
  })
  assert.equal(published.success, true, published.error && published.error.message)
  assert.equal(published.wrote, true)
  const records = JSON.parse(sink.values.get(api.DYNAMIC_STORAGE_KEY))
  assert.equal(records[0].body, '今天已收到猫粮，猫咪状态稳定。')
  assert.deepEqual(records[0].media, ['wxfile://feedback-a.jpg'])
  assert.deepEqual(records[0].feedback.associations, [{ orderId: 'order-a', animalId: 'animal-a', yardId: 'yard-a' }])
  const evidence = JSON.parse(sink.values.get(api.FEEDBACK_EVIDENCE_STORAGE_KEY))
  assert.equal(evidence[0].dynamicId, published.data.dynamicId)
  assert.deepEqual(evidence[0].order, { orderId: 'order-a', animalId: 'animal-a', yardId: 'yard-a' })

  const denied = api.publishLocalFeedback({
    orders: [{ orderId: 'order-a' }],
    animals: [{ animalId: 'animal-a' }],
    content: '越权反馈',
    actorProvider: actor('actor-b'),
    storage: sink,
    attemptKey: 'attempt-runtime-b',
  })
  assert.equal(denied.success, false)
  assert.equal(denied.error.code, 'FORBIDDEN')
  assert.equal(JSON.parse(sink.values.get(api.DYNAMIC_STORAGE_KEY)).length, 1)
})
