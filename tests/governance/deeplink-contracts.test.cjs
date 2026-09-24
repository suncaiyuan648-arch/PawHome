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

const rescueLink = Object.freeze({
  source: 'message',
  businessType: 'rescue',
  businessId: 'rescue-a',
  legacyState: 'platform_pending',
})

const rescueRecord = Object.freeze({
  businessType: 'rescue',
  rescueId: 'rescue-a',
  applicationStatus: 'platform_approved',
})

function actor(id = 'actor-a', roles = ['applicant']) {
  return () => ({ actor: { id, roles } })
}

function throwsCode(fn, code) {
  assert.throws(fn, error => error && error.code === code)
}

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-deeplink-contract-'))
  await fs.writeFile(path.join(tempRoot, 'package.tson'), '{"type":"module"}\n')
  await fs.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
  for (const file of ['routeContracts.ts', 'actorCapabilities.ts', 'deeplinkContracts.ts']) {
    await fs.copyFile(path.join(ROOT, 'navigation', file), path.join(tempRoot, 'navigation', file))
  }
  api = await import(`${pathToFileURL(path.join(tempRoot, 'navigation/deeplinkContracts.ts')).href}?test=${Date.now()}-${Math.random()}`)
})

after(async () => {
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

test('deep-link contract is pure and exposes no write or navigation side effect', async () => {
  const source = await fs.readFile(path.join(ROOT, 'navigation/deeplinkContracts.ts'), 'utf8')
  assert.doesNotMatch(source, /(?:from|import)\s+['"][^'"]*(?:vue|uni|storage|mock|network)[^'"]*['"]/i)
  assert.doesNotMatch(source, /(?:uni\.|setStorage|removeStorage|submit\s*\()/i)
  assert.equal(Object.keys(api).some(key => /write|submit|navigate|storage|delete|update/i.test(key)), false)
  const target = api.createDeepLink(rescueLink)
  assert.equal(Object.isFrozen(target), true)
  assert.equal(target.canWrite, undefined)
})

test('message and task envelopes use stable business IDs and route through the allowlist', () => {
  const rescue = api.createDeepLink(rescueLink)
  assert.equal(rescue.routeName, 'rescue.detail')
  assert.equal(rescue.url, '/packages/rescue/pages/detail/index?rescueId=rescue-a')
  const review = api.createTaskDeepLink({ businessType: 'rescue', businessId: 'rescue-a', reviewItemId: 'review-a' })
  assert.equal(review.routeName, 'rescue.review.detail')
  assert.equal(review.reviewItemId, 'review-a')
  assert.equal(review.url, '/packages/rescue/pages/review/detail/index?businessType=rescue&reviewItemId=review-a')
  assert.equal(api.parseDeepLink(review.url).businessId, undefined)
  assert.equal(api.parseDeepLink(review.url).reviewItemId, 'review-a')
  const progress = api.createDeepLink({ source: 'message', businessType: 'rescue', businessId: 'rescue-a', targetKind: 'progress' })
  assert.equal(progress.routeName, 'rescue.progress')
  assert.equal(progress.url, '/packages/rescue/pages/progress/index?rescueId=rescue-a')
  assert.equal(api.parseDeepLink(progress.url).targetKind, 'progress')
  assert.equal(api.createDeepLink({ businessType: 'feeding', businessId: 'order-a' }).url, '/packages/feeding/pages/order/detail/index?orderId=order-a')
  assert.equal(api.createDeepLink({ businessType: 'dynamic', businessId: 'dynamic-a' }).routeName, 'dynamic.detail')
})

test('old status, role, and outcome hints cannot change the current target', () => {
  const first = api.createDeepLink({ ...rescueLink, legacyState: 'platform_pending', actorRole: 'reviewer', outcome: 'paid' })
  const second = api.createDeepLink({ ...rescueLink, legacyState: 'platform_rejected', actorRole: 'applicant', outcome: 'application-submitted' })
  assert.equal(first.url, second.url)
  assert.equal(first.routeName, second.routeName)
  assert.equal('legacyState' in first, false)
  let seen
  const result = api.resolveDeepLink(first, {
    actorProvider: actor('actor-a'),
    resolver(context) {
      seen = context
      return rescueRecord
    },
  })
  assert.equal(result.status, 'ready')
  assert.equal(result.record.applicationStatus, 'platform_approved')
  assert.equal('legacyState' in seen, false)
})

test('unknown routes, arbitrary paths, schemes, traversal, and route mismatches fail closed', () => {
  throwsCode(() => api.createDeepLink({ ...rescueLink, routeName: 'dynamic.detail' }), 'TARGET_MISMATCH')
  throwsCode(() => api.createDeepLink({ ...rescueLink, routeName: 'unknown.route' }), 'INVALID_ENUM')
  throwsCode(() => api.parseDeepLink('/packages/unknown/pages/detail/index?rescueId=rescue-a'), 'UNKNOWN_ROUTE_PATH')
  throwsCode(() => api.parseDeepLink('https://evil.example/rescue-a'), 'UNSAFE_URL')
  throwsCode(() => api.parseDeepLink('/packages/rescue/pages/detail/index?rescueId=../other'), 'INVALID_ID')
  throwsCode(() => api.parseDeepLink('/packages/rescue/pages/detail/index?rescueId=rescue-a&x=1'), 'UNKNOWN_PARAMETER')
})

test('missing, cross-domain, URL, and forged identifiers are rejected', () => {
  throwsCode(() => api.createDeepLink({ source: 'message', businessType: 'rescue' }), 'MISSING_ID')
  throwsCode(() => api.createDeepLink({ source: 'message', businessType: 'rescue', businessId: 'adoption-a' }), 'CROSS_DOMAIN_ID')
  throwsCode(() => api.createDeepLink({ source: 'message', businessType: 'rescue', businessId: 'rescue-a/../b' }), 'INVALID_ID')
  throwsCode(() => api.createDeepLink({ source: 'message', businessType: 'rescue', businessId: 'rescue-a', reviewItemId: 'review-a', routeName: 'rescue.detail' }), 'TARGET_MISMATCH')
  throwsCode(() => api.createDeepLink({ source: 'message', businessType: 'feeding', businessId: 'order-a', reviewItemId: 'review-a' }), 'CROSS_DOMAIN_FIELD')
  throwsCode(() => api.createDeepLink({ source: 'message', businessType: 'adoption', businessId: 'application-a', targetKind: 'progress' }), 'CROSS_DOMAIN_FIELD')
  throwsCode(() => api.createDeepLink({ source: 'message', businessType: 'rescue', businessId: 'rescue-a', reviewItemId: 'review-a', targetKind: 'progress' }), 'CROSS_DOMAIN_FIELD')
  const forged = { ...rescueLink }
  Object.defineProperty(forged, '__proto__', { value: 'actor-b', enumerable: true })
  throwsCode(() => api.createDeepLink(forged), 'PROTOTYPE_KEY')
})

test('task source is explicit and unknown source cannot enter the resolver', () => {
  assert.equal(api.createTaskDeepLink({ businessType: 'dynamic', businessId: 'post-a' }).source, 'task')
  throwsCode(() => api.createDeepLink({ ...rescueLink, source: 'external' }), 'INVALID_ENUM')
  throwsCode(() => api.createDeepLink({ ...rescueLink, source: 'task', extra: 'forged' }), 'UNKNOWN_FIELD')
})

test('resolveDeepLink re-reads by IDs only and rejects a missing record', () => {
  const calls = []
  const result = api.resolveDeepLink(rescueLink, {
    actorProvider: actor('actor-a'),
    resolver(context) {
      calls.push(context)
      return rescueRecord
    },
  })
  assert.equal(result.status, 'ready')
  assert.deepEqual(calls[0], {
    actor: { id: 'actor-a', roles: ['applicant'] },
    businessType: 'rescue',
    businessId: 'rescue-a',
  })
  const missing = api.resolveDeepLink(rescueLink, { resolver: () => null })
  assert.deepEqual({ status: missing.status, code: missing.code, record: missing.record }, { status: 'empty', code: 'NOT_FOUND', record: null })
})

test('resolver failures, async resolvers, wrong domain, and wrong IDs stay empty', () => {
  const base = { actorProvider: actor('actor-a') }
  const failed = api.resolveDeepLink(rescueLink, { ...base, resolver: () => { throw new Error('network') } })
  assert.equal(failed.code, 'RESOLVER_FAILED')
  const asyncResult = api.resolveDeepLink(rescueLink, { ...base, resolver: () => Promise.reject(new Error('late')) })
  assert.equal(asyncResult.code, 'ASYNC_RESOLVER_UNSUPPORTED')
  const wrongDomain = api.resolveDeepLink(rescueLink, { ...base, resolver: () => ({ businessType: 'adoption', applicationId: 'app-a' }) })
  assert.equal(wrongDomain.code, 'CROSS_DOMAIN_RECORD')
  const wrongId = api.resolveDeepLink(rescueLink, { ...base, resolver: () => ({ businessType: 'rescue', rescueId: 'rescue-b' }) })
  assert.equal(wrongId.code, 'BUSINESS_ID_MISMATCH')
})

test('review deep links require the explicit review item and preserve it on re-read', () => {
  const link = api.createTaskDeepLink({ businessType: 'rescue', businessId: 'rescue-a', reviewItemId: 'review-a' })
  const seen = []
  const ready = api.resolveDeepLink(link, {
    actorProvider: actor('reviewer-a', ['reviewer']),
    resolver(context) {
      seen.push(context)
      return { businessType: 'rescue', rescueId: 'rescue-a', reviewItemId: 'review-a', status: 'processed' }
    },
  })
  assert.equal(ready.status, 'ready')
  assert.equal(seen[0].reviewItemId, 'review-a')
  const missing = api.resolveDeepLink({ businessType: 'rescue', businessId: 'rescue-a', reviewItemId: 'review-a' }, { resolver: () => ({ rescueId: 'rescue-a' }) })
  assert.equal(missing.code, 'REVIEW_ITEM_ID_MISSING')
  const parsed = api.parseDeepLink('/packages/rescue/pages/review/detail/index?businessType=rescue&reviewItemId=review-a')
  assert.equal(parsed.businessId, undefined)
  assert.equal(parsed.reviewItemId, 'review-a')
})

test('task links require authentication and forged actor input cannot authorize them', () => {
  const task = api.createTaskDeepLink({ businessType: 'rescue', businessId: 'rescue-a', reviewItemId: 'review-a' })
  const calls = []
  const noActor = api.resolveDeepLink(task, { resolver: context => { calls.push(context); return { businessType: 'rescue', rescueId: 'rescue-a', reviewItemId: 'review-a' } } })
  assert.equal(noActor.code, 'AUTH_REQUIRED')
  assert.equal(calls.length, 0)
  const forged = api.resolveDeepLink(task, {
    actorProvider: () => ({ actor: { id: 'reviewer-b', roles: ['reviewer'] } }),
    resolver: context => ({ businessType: 'rescue', rescueId: 'rescue-a', reviewItemId: 'review-a', actorId: 'reviewer-a', role: 'reviewer' }),
    authorize: ({ actor }) => actor && actor.id === 'reviewer-a',
  })
  assert.equal(forged.code, 'FORBIDDEN')
})

test('authorize is re-evaluated on current data and denies without exposing private record', () => {
  let allow = true
  const link = api.createDeepLink(rescueLink)
  const denied = api.resolveDeepLink(link, {
    actorProvider: actor('actor-a'),
    resolver: () => rescueRecord,
    authorize: () => allow,
  })
  assert.equal(denied.status, 'ready')
  allow = false
  const next = api.resolveDeepLink(link, {
    actorProvider: actor('actor-a'),
    resolver: () => rescueRecord,
    authorize: () => allow,
  })
  assert.equal(next.code, 'FORBIDDEN')
  assert.equal(next.record, null)
})

test('auth restore resumes only a target and never replays submission', () => {
  const calls = []
  const pending = api.restoreAfterAuth(rescueLink, { authenticated: false, bridge: () => { calls.push('bridge') } })
  assert.equal(pending.code, 'AUTH_REQUIRED')
  assert.equal(pending.canSubmit, false)
  assert.equal(calls.length, 0)
  const ready = api.restoreAfterAuth(rescueLink, { authenticated: true })
  assert.equal(ready.code, 'OK')
  assert.equal(ready.canSubmit, false)
  assert.equal(ready.target.url, '/packages/rescue/pages/detail/index?rescueId=rescue-a')
})

test('auth bridge failures are explicit and successful bridge still returns no submit capability', async () => {
  const thrown = api.restoreAfterAuth(rescueLink, { authenticated: true, bridge: () => { throw new Error('bridge down') } })
  assert.deepEqual({ status: thrown.status, code: thrown.code, canSubmit: thrown.canSubmit }, { status: 'bridge_failed', code: 'BRIDGE_FAILED', canSubmit: false })
  const rejected = api.restoreAfterAuth(rescueLink, { authenticated: true, bridge: () => false })
  assert.equal(rejected.code, 'BRIDGE_REJECTED')
  const asyncBridge = api.restoreAfterAuth(rescueLink, { authenticated: true, bridge: () => Promise.reject(new Error('late')) })
  assert.equal(asyncBridge.code, 'ASYNC_BRIDGE_UNSUPPORTED')
  const success = api.restoreAfterAuth(rescueLink, { authenticated: true, bridge: () => { } })
  assert.equal(success.status, 'ready')
  assert.equal(success.canSubmit, false)
})

test('resolved records and result buckets are defensive and malformed actor input fails closed', () => {
  const source = { ...rescueRecord, nested: { mutable: true } }
  const ready = api.resolveDeepLink(rescueLink, { resolver: () => source })
  assert.equal(Object.isFrozen(ready.record), true)
  assert.equal(Object.isFrozen(ready.record.nested), true)
  source.nested.mutable = false
  assert.equal(ready.record.nested.mutable, true)
  const invalidActor = api.resolveDeepLink(rescueLink, { actorProvider: () => ({ actor: { id: 'actor-a', roles: ['reviewer'] } }), resolver: () => rescueRecord })
  assert.equal(invalidActor.status, 'ready')
  const malformed = api.resolveDeepLink(rescueLink, { actorProvider: () => ({ actor: { id: '../actor', roles: ['applicant'] } }), resolver: () => rescueRecord })
  assert.equal(malformed.code, 'INVALID_ID')
})
