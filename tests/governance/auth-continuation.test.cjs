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
let storage

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-auth-continuation-'))
  await fs.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
  await fs.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
  for (const file of ['actorCapabilities.js', 'routeContracts.js', 'deeplinkContracts.js', 'authContinuationStorage.js']) {
    await fs.copyFile(path.join(ROOT, 'navigation', file), path.join(tempRoot, 'navigation', file))
  }
  storage = new Map()
  globalThis.uni = {
    getStorageSync(key) { return storage.get(key) },
    setStorageSync(key, value) { storage.set(key, value) },
    removeStorageSync(key) { storage.delete(key) },
  }
  api = await import(`${pathToFileURL(path.join(tempRoot, 'navigation/authContinuationStorage.js')).href}?test=${Date.now()}`)
})

beforeEach(() => storage.clear())

after(async () => {
  delete globalThis.uni
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

function target(overrides = {}) {
  return {
    source: 'message',
    businessType: 'dynamic',
    businessId: 'dynamic-a',
    routeName: 'dynamic.detail',
    url: '/packages/dynamic/pages/deep-link/index?dynamicId=dynamic-a',
    ...overrides,
  }
}

test('continuations persist only validated targets and restore without submit capability', () => {
  const saved = api.saveAuthContinuation({ target: target(), messageId: 'message-a', category: 'interaction' })
  assert.equal(saved.success, true)
  const unauthenticated = api.restoreStoredAuthContinuation({ authenticated: false })
  assert.equal(unauthenticated.code, 'AUTH_REQUIRED')
  assert.equal(unauthenticated.canSubmit, false)
  const restored = api.restoreStoredAuthContinuation({ authenticated: true })
  assert.equal(restored.status, 'ready')
  assert.equal(restored.target.url, target().url)
  assert.equal(restored.continuation.messageId, 'message-a')
  assert.equal(restored.canSubmit, false)
})

test('rescue applicant progress targets survive auth continuation validation', () => {
  const saved = api.saveAuthContinuation({ target: {
    source: 'message',
    businessType: 'rescue',
    businessId: 'rescue-a',
    targetKind: 'progress',
    routeName: 'rescue.progress',
    url: '/packages/rescue/pages/progress/index?rescueId=rescue-a',
  }, messageId: 'message-rescue', category: 'service' })
  assert.equal(saved.success, true)
  const restored = api.restoreStoredAuthContinuation({ authenticated: true })
  assert.equal(restored.status, 'ready')
  assert.equal(restored.target.routeName, 'rescue.progress')
  assert.equal(restored.target.targetKind, 'progress')
})

test('malformed, cross-domain, and message-without-ID continuations fail closed', () => {
  assert.equal(api.saveAuthContinuation({ target: target({ businessType: 'rescue', routeName: 'dynamic.detail' }) }).success, false)
  assert.equal(api.saveAuthContinuation({ target: target(), category: 'forged' }).success, false)
  assert.equal(api.saveAuthContinuation({ target: target() }).success, false)
  storage.set(api.AUTH_CONTINUATION_STORAGE_KEY, '{broken')
  assert.equal(api.restoreStoredAuthContinuation({ authenticated: true }).code, 'INVALID_STORAGE')
})
