'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const vm = require('node:vm')
const { pathToFileURL } = require('node:url')
const { test, before, after } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

let tempEsmRoot

async function loadEsm(file) {
  if (!tempEsmRoot) {
    tempEsmRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-route-contracts-'))
    await fs.writeFile(path.join(tempEsmRoot, 'package.json'), '{"type":"module"}\n')
    await fs.mkdir(path.join(tempEsmRoot, 'navigation'), { recursive: true })
    await fs.copyFile(path.join(ROOT, 'navigation/routeContracts.js'), path.join(tempEsmRoot, 'navigation/routeContracts.js'))
    await fs.copyFile(path.join(ROOT, 'navigation/legacyRoutes.js'), path.join(tempEsmRoot, 'navigation/legacyRoutes.js'))
    await fs.copyFile(path.join(ROOT, 'navigation/weixinLoadOptions.js'), path.join(tempEsmRoot, 'navigation/weixinLoadOptions.js'))
  }
  const fileUrl = pathToFileURL(path.join(tempEsmRoot, file)).href
  return import(`${fileUrl}?test=${Date.now()}-${Math.random()}`)
}

let contracts
let legacy
let weixin

before(async () => {
  contracts = await loadEsm('navigation/routeContracts.js')
  legacy = await loadEsm('navigation/legacyRoutes.js')
  weixin = await loadEsm('navigation/weixinLoadOptions.js')
})

after(async () => {
  if (tempEsmRoot) await fs.rm(tempEsmRoot, { recursive: true, force: true })
})

function api(module) {
  return module.namespace || module
}

function throwsCode(fn, code) {
  assert.throws(fn, (error) => error && error.code === code)
}

test('target registry keeps the four tabs and marks animal-picker fallback only', () => {
  const { ROUTE_REGISTRY } = api(contracts)
  for (const name of ['tab.home', 'tab.selfRun', 'tab.message', 'tab.me']) {
    assert.equal(ROUTE_REGISTRY[name].tab, true)
    assert.equal(ROUTE_REGISTRY[name].navigation, 'switchTab')
  }
  assert.equal(ROUTE_REGISTRY['adoption.animal-picker'].fallbackOnly, true)
  assert.equal(ROUTE_REGISTRY['account.tasks'].path, '/packages/account/pages/tasks/index')
})

test('build and parse encode Unicode once and preserve literal percent escapes', () => {
  const { buildRoute, parseRoute } = api(contracts)
  const url = buildRoute('discovery.search', { q: '猫 %2F + 你好', scope: 'dynamic' })
  assert.match(url, /%E7%8C%AB/)
  assert.match(url, /%252F/)
  assert.deepEqual(parseRoute(url).params, { q: '猫 %2F + 你好', scope: 'dynamic' })
  assert.equal(parseRoute('/packages/discovery/pages/search/index?q=a%252Fb&scope=dynamic').params.q, 'a%2Fb')
  throwsCode(() => parseRoute('/packages/discovery/pages/search/index?q=%E0%A4%A&scope=dynamic'), 'MALFORMED_ENCODING')
  throwsCode(() => buildRoute('discovery.search', { q: '\ud800', scope: 'dynamic' }), 'INVALID_UNICODE')
})

test('query arrays, objects, duplicate keys, unknown keys and prototype keys are rejected', () => {
  const { buildRoute, parseRoute } = api(contracts)
  throwsCode(() => buildRoute('discovery.search', { q: ['a'], scope: 'dynamic' }), 'INVALID_QUERY_VALUE')
  throwsCode(() => buildRoute('discovery.search', { q: { value: 'a' }, scope: 'dynamic' }), 'INVALID_QUERY_VALUE')
  throwsCode(() => parseRoute('/packages/discovery/pages/search/index?q=a&q=b&scope=dynamic'), 'DUPLICATE_PARAMETER')
  throwsCode(() => parseRoute('/packages/discovery/pages/search/index?q=a&scope=dynamic&unknown=x'), 'UNKNOWN_PARAMETER')
  throwsCode(() => parseRoute('/packages/discovery/pages/search/index?__proto__=x&q=a&scope=dynamic'), 'PROTOTYPE_KEY')
})

test('required IDs, restricted IDs and enums fail closed in both directions', () => {
  const { buildRoute, parseRoute } = api(contracts)
  throwsCode(() => buildRoute('rescue.detail', {}), 'MISSING_PARAMETER')
  throwsCode(() => parseRoute('/packages/rescue/pages/detail/index'), 'MISSING_PARAMETER')
  throwsCode(() => buildRoute('rescue.detail', { rescueId: '../first' }), 'INVALID_ID')
  throwsCode(() => buildRoute('rescue.detail', { rescueId: '猫' }), 'INVALID_ID')
  throwsCode(() => buildRoute('discovery.search', { q: 'x', scope: 'all' }), 'INVALID_ENUM')
  throwsCode(() => buildRoute('discovery.search', { q: 'x', scope: 'dynamic', role: 'reviewer' }), 'UNKNOWN_PARAMETER')
  throwsCode(() => buildRoute('adoption.apply', { yardId: 'yard-1', animalIds: 'cat-1,cat-1' }), 'DUPLICATE_ID')
  throwsCode(() => buildRoute('adoption.apply', { yardId: 'yard-1', animalIds: 'cat-1,cat-2,cat-3,cat-4,cat-5,cat-6,cat-7' }), 'INVALID_ID_LIST')
  throwsCode(() => buildRoute('address.list', { kind: 'shipping', intent: 'select' }), 'MISSING_PARAMETER')
  throwsCode(() => buildRoute('dynamic.editor', { scene: 'feeding-feedback' }), 'MISSING_PARAMETER')
  throwsCode(() => buildRoute('adoption.jury.detail', { reviewItemId: 'review-a' }), 'MISSING_PARAMETER')
  throwsCode(() => buildRoute('rescue.review.detail', { reviewItemId: 'review-a' }), 'MISSING_PARAMETER')
  throwsCode(() => buildRoute('adoption.jury.detail', { reviewItemId: 'review-a', businessType: 'rescue' }), 'INVALID_ENUM')
  throwsCode(() => buildRoute('rescue.review.detail', { reviewItemId: 'review-a', businessType: 'adoption' }), 'INVALID_ENUM')
})

test('scheme, fragment and path traversal inputs are rejected', () => {
  const { parseRoute } = api(contracts)
  throwsCode(() => parseRoute('javascript:alert(1)'), 'UNSAFE_URL')
  throwsCode(() => parseRoute('https://example.com/packages/rescue/pages/detail/index'), 'UNSAFE_URL')
  throwsCode(() => parseRoute('/packages/rescue/pages/../adoption/pages/detail/index'), 'UNSAFE_URL')
  throwsCode(() => parseRoute('/packages/rescue/pages/%2e%2e/detail/index'), 'UNSAFE_URL')
  throwsCode(() => parseRoute('/packages/rescue/pages/detail/index#fragment'), 'UNSAFE_URL')
})

test('navigator requires active physical path registration and fails closed', () => {
  const { navigateRoute, ROUTE_REGISTRY } = api(contracts)
  const calls = []
  const uniApi = {
    navigateTo: (payload) => { calls.push(['navigateTo', payload]); return payload },
    switchTab: (payload) => { calls.push(['switchTab', payload]); return payload },
  }
  throwsCode(() => navigateRoute('rescue.detail', { rescueId: 'r-1' }, { uniApi }), 'NO_ACTIVE_REGISTRY')
  throwsCode(() => navigateRoute('rescue.detail', { rescueId: 'r-1' }, {
    registeredRoutes: ['rescue.detail'],
    uniApi,
  }), 'ROUTE_NOT_ACTIVE')
  navigateRoute('rescue.detail', { rescueId: 'r-1' }, {
    registeredRoutes: [ROUTE_REGISTRY['rescue.detail'].path],
    uniApi,
  })
  navigateRoute('tab.home', {}, {
    registeredRoutes: { 'tab.home': ROUTE_REGISTRY['tab.home'].path },
    uniApi,
  })
  assert.deepEqual(calls, [
    ['navigateTo', { url: '/packages/rescue/pages/detail/index?rescueId=r-1' }],
    ['switchTab', { url: '/pages/index/index' }],
  ])
  throwsCode(() => navigateRoute('tab.home', { q: 'x' }, {
    registeredRoutes: { 'tab.home': ROUTE_REGISTRY['tab.home'].path },
    uniApi,
  }), 'UNKNOWN_PARAMETER')
})

test('selector contracts carry requestId only and require eventChannel bridge', () => {
  const { createSelectorRequest, validateSelectorResponse } = api(contracts)
  const request = createSelectorRequest('region', 'req-1')
  assert.deepEqual(request, { kind: 'region', requestId: 'req-1', bridge: 'eventChannel', autoRedirect: false })
  assert.deepEqual(validateSelectorResponse('region', { requestId: 'req-1' }, 'req-1'), {
    requestId: 'req-1', bridge: 'eventChannel', autoRedirect: false,
  })
  throwsCode(() => validateSelectorResponse('region', { requestId: 'req-2' }, 'req-1'), 'REQUEST_ID_MISMATCH')
  throwsCode(() => validateSelectorResponse('region', { requestId: 'req-1', selectedId: 'x' }, 'req-1'), 'UNKNOWN_PARAMETER')
})

test('auth continuations are a small route whitelist, never arbitrary return URLs', () => {
  const { buildAuthContinuation, parseAuthContinuation } = api(contracts)
  const continuation = buildAuthContinuation('adoption.apply', { yardId: 'yard-1' })
  assert.equal(continuation.intent, 'adoption.apply')
  assert.deepEqual(parseAuthContinuation(continuation.url).params, { yardId: 'yard-1' })
  throwsCode(() => buildAuthContinuation('dynamic.detail', { dynamicId: 'dynamic-1' }), 'INVALID_CONTINUATION_TARGET')
  throwsCode(() => parseAuthContinuation('/packages/dynamic/pages/detail/index?dynamicId=dynamic-1'), 'UNKNOWN_ROUTE_PATH')
  throwsCode(() => parseAuthContinuation('javascript:alert(1)'), 'UNSAFE_URL')
})

test('feature legacy hotspots require explicit modes and never fall back to first demo', () => {
  const { resolveLegacyRoute } = api(legacy)
  assert.equal(resolveLegacyRoute('/pages/feature/index?mode=rescue-detail&rescueId=rescue-7').routeName, 'rescue.detail')
  assert.equal(resolveLegacyRoute('/pages/feature/index?mode=album&petId=animal-7').params.animalId, 'animal-7')
  assert.equal(resolveLegacyRoute('/pages/feature/index?mode=invite').routeName, 'account.invite')
  throwsCode(() => resolveLegacyRoute('/pages/feature/index?mode=rescue-detail'), 'MISSING_ID')
  throwsCode(() => resolveLegacyRoute('/pages/feature/index?mode=unknown'), 'UNKNOWN_FEATURE_MODE')
  throwsCode(() => resolveLegacyRoute('/pages/feature/index?mode=rescue-detail&rescueId=r-1&id=r-2'), 'CONFLICTING_ALIAS')
  throwsCode(() => resolveLegacyRoute({ path: '/pages/feature/index?mode=invite', query: { mode: 'album' } }), 'CONFLICTING_QUERY')
})

test('adoptionFlow resolves explicit domains, read-only frame 48/49, and long rescue safely', () => {
  const { resolveLegacyRoute } = api(legacy)
  const info = resolveLegacyRoute('/pages/meMore/adoptionFlow?type=adoption&id=app-1&frame=48')
  assert.equal(info.routeName, 'adoption.progress')
  assert.deepEqual(info.params, { applicationId: 'app-1', view: 'adoption-info' })
  assert.equal(info.readOnly, true)
  const application = resolveLegacyRoute('/pages/meMore/adoptionFlow?source=adoption&id=app-1&frame=49')
  assert.equal(application.params.view, 'application')
  const rescue = resolveLegacyRoute('/pages/meMore/adoptionFlow?state=long&id=rescue-1')
  assert.equal(rescue.routeName, 'rescue.progress')
  assert.deepEqual(rescue.params, { rescueId: 'rescue-1' })
  const otherFrame = resolveLegacyRoute('/pages/meMore/adoptionFlow?type=adoption&id=app-1&frame=57')
  assert.equal(otherFrame.routeName, 'adoption.progress')
  assert.equal(otherFrame.params.view, undefined)
  throwsCode(() => resolveLegacyRoute('/pages/meMore/adoptionFlow?state=long&type=adoption&id=x-1'), 'CONFLICTING_DOMAIN')
  throwsCode(() => resolveLegacyRoute('/pages/meMore/adoptionFlow?type=adoption&source=rescue&id=x-1'), 'CONFLICTING_DOMAIN')
  throwsCode(() => resolveLegacyRoute('/pages/meMore/adoptionFlow?type=rescue&frame=48&id=x-1'), 'CONFLICTING_FRAME')
  throwsCode(() => resolveLegacyRoute('/pages/meMore/adoptionFlow?type=adoption'), 'MISSING_ID')
  throwsCode(() => resolveLegacyRoute('/pages/meMore/adoptionFlow?applicationId=app-1&id=app-2'), 'CONFLICTING_ID')
})

test('adoptApply and success split rescue/adoption without frame or source confusion', () => {
  const { resolveLegacyRoute } = api(legacy)
  const rescueApply = resolveLegacyRoute('/pages/adoption/adoptApply?state=long&source=rescue')
  assert.equal(rescueApply.routeName, 'rescue.apply')
  const adoptionApply = resolveLegacyRoute('/pages/adoption/adoptApply?source=adoption&yardId=yard-1&animalIds=cat-1%2Ccat-2')
  assert.equal(adoptionApply.routeName, 'adoption.apply')
  assert.deepEqual(adoptionApply.params, { yardId: 'yard-1', animalIds: 'cat-1,cat-2' })
  throwsCode(() => resolveLegacyRoute('/pages/adoption/adoptApply?state=long&type=adoption&yardId=yard-1'), 'CONFLICTING_DOMAIN')
  throwsCode(() => resolveLegacyRoute('/pages/adoption/adoptApply?source=rescue&yardId=yard-1'), 'CONFLICTING_DOMAIN')
  throwsCode(() => resolveLegacyRoute('/pages/adoption/adoptApply?source=adoption'), 'MISSING_ID')
  assert.equal(resolveLegacyRoute('/pages/adoption/adoptApplySuccess?recordId=app-2').routeName, 'adoption.result')
  assert.equal(resolveLegacyRoute('/pages/adoption/adoptApplySuccess?type=rescue&rescueId=rescue-2').routeName, 'rescue.result')
  throwsCode(() => resolveLegacyRoute('/pages/adoption/adoptApplySuccess?type=adoption&rescueId=r-1'), 'CONFLICTING_DOMAIN')
  throwsCode(() => resolveLegacyRoute('/pages/adoption/adoptApplySuccess?type=rescue&applicationId=a-1'), 'CONFLICTING_DOMAIN')
  throwsCode(() => resolveLegacyRoute('/pages/adoption/adoptApplySuccess?applicationId=app-1&id=app-2'), 'CONFLICTING_ID')
})

test('rescue proof legacy aliases resolve only to the rescue proof routes', () => {
  const { resolveLegacyRoute } = api(legacy)
  const list = resolveLegacyRoute('/pages/meMore/rescueProofList?source=rescue&rescueId=rescue-1&id=rescue-1')
  assert.equal(list.routeName, 'rescue.proof.list')
  assert.deepEqual(list.params, { rescueId: 'rescue-1' })
  assert.equal(list.readOnly, true)
  const form = resolveLegacyRoute('/pages/meMore/rescueProofForm?sourceType=rescue&recordId=rescue-2')
  assert.equal(form.routeName, 'rescue.proof.create')
  assert.deepEqual(form.params, { rescueId: 'rescue-2' })
  assert.equal(form.readOnly, false)
  throwsCode(() => resolveLegacyRoute('/pages/meMore/rescueProofList?source=adoption&rescueId=rescue-1'), 'CONFLICTING_DOMAIN')
  throwsCode(() => resolveLegacyRoute('/pages/meMore/rescueProofForm?source=rescue&rescueId=rescue-1&id=rescue-2'), 'CONFLICTING_ALIAS')
  throwsCode(() => resolveLegacyRoute('/pages/meMore/rescueProofList?source=rescue'), 'MISSING_ID')
  throwsCode(() => resolveLegacyRoute('/pages/meMore/rescueProofForm?rescueId=rescue-1'), 'CONFLICTING_DOMAIN')
})

test('juryDetail requires injected real metadata and rejects query conflicts', () => {
  const { resolveLegacyRoute } = api(legacy)
  const resolver = (id) => ({ reviewItemId: id, businessType: id === 'rescue-review-1' ? 'rescue' : 'adoption' })
  assert.equal(resolveLegacyRoute('/pages/yard/juryDetail?itemId=adoption-review-1', { reviewMetadataResolver: resolver }).routeName, 'adoption.jury.detail')
  assert.equal(resolveLegacyRoute('/pages/yard/juryDetail?reviewItemId=rescue-review-1&type=rescue', { reviewMetadataResolver: resolver }).routeName, 'rescue.review.detail')
  assert.equal(resolveLegacyRoute('/pages/yard/juryDetail?itemId=adoption-review-1&reviewType=adoption&juryType=adoption', { reviewMetadataResolver: resolver }).routeName, 'adoption.jury.detail')
  throwsCode(() => resolveLegacyRoute('/pages/yard/juryDetail?itemId=missing'), 'MISSING_METADATA_RESOLVER')
  throwsCode(() => resolveLegacyRoute('/pages/yard/juryDetail?itemId=adoption-review-1&type=rescue', { reviewMetadataResolver: resolver }), 'CONFLICTING_DOMAIN')
  throwsCode(() => resolveLegacyRoute('/pages/yard/juryDetail?itemId=adoption-review-1&reviewType=rescue', { reviewMetadataResolver: resolver }), 'CONFLICTING_DOMAIN')
  throwsCode(() => resolveLegacyRoute('/pages/yard/juryDetail?itemId=missing', { reviewMetadataResolver: () => null }), 'INVALID_REVIEW_METADATA')
  const forgedRole = resolveLegacyRoute('/pages/yard/juryDetail?itemId=adoption-review-1&role=reviewer', { reviewMetadataResolver: resolver })
  assert.equal(forgedRole.routeName, 'adoption.jury.detail')
  assert.deepEqual(forgedRole.ignoredCapabilities, { role: 'reviewer' })
})

test('jury metadata cannot substitute the first record or disagree about its business type', () => {
  const { resolveLegacyRoute } = api(legacy)
  const url = '/pages/yard/juryDetail?itemId=review-2'
  for (const metadata of [
    { businessType: 'rescue' },
    { id: 'review-1', businessType: 'rescue' },
    { id: 'review-1', reviewItemId: 'review-2', businessType: 'rescue' },
    { id: 'review-2', businessType: 'rescue', type: 'adoption' },
  ]) throwsCode(() => resolveLegacyRoute(url, { reviewMetadataResolver: () => metadata }), 'INVALID_REVIEW_METADATA')
  assert.equal(resolveLegacyRoute(url, { reviewMetadataResolver: () => ({ id: 'review-2', businessType: 'rescue' }) }).routeName, 'rescue.review.detail')
})

test('postSuccess and myAssets do not infer forbidden state or default demo IDs', () => {
  const { resolveLegacyRoute } = api(legacy)
  assert.equal(resolveLegacyRoute('/pages/publishDynamic/postSuccess?dynamicId=dynamic-1').routeName, 'dynamic.result')
  const feedingResult = resolveLegacyRoute('/pages/publishDynamic/postSuccess?state=feeding&orderId=order-1')
  assert.equal(feedingResult.routeName, 'feeding.result')
  assert.equal(feedingResult.params.outcome, 'feeding-completed')
  const feedbackResult = resolveLegacyRoute('/pages/publishDynamic/postSuccess?scene=feeding-feedback&orderId=order-1')
  assert.equal(feedbackResult.params.outcome, 'feedback-published')
  throwsCode(() => resolveLegacyRoute('/pages/publishDynamic/postSuccess'), 'MISSING_ID')
  throwsCode(() => resolveLegacyRoute('/pages/publishDynamic/postSuccess?orderId=order-1'), 'MISSING_DOMAIN')
  throwsCode(() => resolveLegacyRoute('/pages/publishDynamic/postSuccess?type=feeding'), 'MISSING_ID')
  throwsCode(() => resolveLegacyRoute('/pages/publishDynamic/postSuccess?type=dynamic&orderId=order-1'), 'CONFLICTING_DOMAIN')
  throwsCode(() => resolveLegacyRoute('/pages/publishDynamic/postSuccess?state=feeding&orderId=order-1&dynamicId=dynamic-1'), 'CONFLICTING_DOMAIN')
  throwsCode(() => resolveLegacyRoute('/pages/publishDynamic/postSuccess?type=feeding&scene=feeding-feedback&orderId=order-1'), 'CONFLICTING_RESULT_INTENT')
  assert.equal(resolveLegacyRoute('/pages/meMore/myAssets?mode=pets&yardId=yard-1').routeName, 'yard.animals')
  assert.equal(resolveLegacyRoute('/pages/meMore/myAssets?mode=pets&state=owned&userId=2876598765&role=owner').routeName, 'animal.mine')
  assert.equal(resolveLegacyRoute('/pages/meMore/myAssets?mode=medals').routeName, 'account.medals')
  assert.equal(resolveLegacyRoute('/pages/meMore/myAssets?mode=medals&first=1').routeName, 'account.medals.achievement')
  assert.equal(resolveLegacyRoute('/pages/meMore/myAssets?mode=medals&first=true').routeName, 'account.medals.achievement')
  throwsCode(() => resolveLegacyRoute('/pages/meMore/myAssets?mode=pets'), 'MISSING_ID')
  throwsCode(() => resolveLegacyRoute('/pages/meMore/myAssets?mode=pets&state=owned'), 'MISSING_ID')
  throwsCode(() => resolveLegacyRoute('/pages/meMore/myAssets?mode=unknown'), 'INVALID_ENUM')
  assert.equal(resolveLegacyRoute('/pages/meMore/myCloudPets?userPawId=2876598765').routeName, 'animal.sponsored')
  throwsCode(() => resolveLegacyRoute('/pages/meMore/myCloudPets'), 'MISSING_ID')
})

test('removed discovery/message/publish links resolve to registered semantic targets', () => {
  const { resolveLegacyRoute } = api(legacy)
  const message = resolveLegacyRoute('/pages/messageDetail/index?type=interaction&messageId=message-1')
  assert.equal(message.routeName, 'message.list')
  assert.deepEqual(message.params, { category: 'interaction', messageId: 'message-1' })
  assert.equal(resolveLegacyRoute('/pages/citySelect/index?current=%E9%95%BF%E6%B2%99').routeName, 'discovery.cityPicker')
  assert.equal(resolveLegacyRoute('/pages/search/index?state=dynamic').routeName, 'discovery.search')
  assert.equal(resolveLegacyRoute('/pages/search/index?q=&state=idle_delete').url, '/packages/discovery/pages/search/index?state=idle_delete')
  assert.equal(resolveLegacyRoute('/pages/leaderboard/index').routeName, 'discovery.ranking')
  assert.equal(resolveLegacyRoute('/pages/publishDynamic/postFeed?state=select-order').routeName, 'dynamic.editor')
  const feedback = resolveLegacyRoute('/pages/publishDynamic/postSuccess?scene=feeding-feedback&orderId=order-1&dynamicId=dynamic-1')
  assert.equal(feedback.routeName, 'feeding.result')
  assert.equal(feedback.params.dynamicId, 'dynamic-1')
})

test('removed profile, yard, animal, and dynamic links resolve to canonical semantic targets', () => {
  const { resolveLegacyRoute } = api(legacy)
  assert.equal(resolveLegacyRoute('/pages/user/profile?pawId=user-a').url, '/packages/account/pages/profile/index?userId=user-a')
  assert.equal(resolveLegacyRoute('/pages/commodityDetails/index?yardId=yard-a').url, '/packages/yard/pages/detail/index?yardId=yard-a')
  assert.equal(resolveLegacyRoute('/pages/adoption/petDetail?animalId=animal-a&yardId=yard-a').url, '/packages/animal/pages/detail/index?animalId=animal-a&yardId=yard-a')
  assert.equal(resolveLegacyRoute('/pages/dynamicDetail/index?dynamicId=dynamic-a').url, '/packages/dynamic/pages/deep-link/index?dynamicId=dynamic-a')
  assert.equal(resolveLegacyRoute('/pages/dynamicDetail/deepLink?id=dynamic-a').url, '/packages/dynamic/pages/deep-link/index?dynamicId=dynamic-a')
  throwsCode(() => resolveLegacyRoute('/pages/user/profile?pawId=user-a&userId=user-b'), 'CONFLICTING_ALIAS')
  throwsCode(() => resolveLegacyRoute('/pages/adoption/petDetail?animalId=animal-a&petId=animal-b'), 'CONFLICTING_ALIAS')
  throwsCode(() => resolveLegacyRoute('/pages/user/profile'), 'MISSING_ID')
  throwsCode(() => resolveLegacyRoute('/pages/commodityDetails/index?unknown=yard-a'), 'UNKNOWN_PARAMETER')
  throwsCode(() => resolveLegacyRoute('/pages/adoption/petDetail?yardId=yard-a'), 'MISSING_ID')
  throwsCode(() => resolveLegacyRoute('/pages/dynamicDetail/index?dynamicId=dynamic-a&state=comments-empty'), 'UNKNOWN_PARAMETER')
})

test('unsupported legacy routes are reported instead of claiming full migration', () => {
  const { resolveLegacyRoute } = api(legacy)
  throwsCode(() => resolveLegacyRoute('/pages/meMore/settings'), 'UNSUPPORTED_LEGACY_ROUTE')
})


test('Weixin onLoad adapter decodes the observed native values exactly once', () => {
  const { decodeWeixinLoadOptions } = weixin
  const raw = { q: '%E7%8C%AB%20%252F%20%2B', applicationId: 'app%3A1', plus: 'a+b' }
  const decoded = decodeWeixinLoadOptions(raw)
  assert.equal(decoded.q, '\u732b %2F +')
  assert.equal(decoded.plus, 'a+b')
  assert.equal(raw.applicationId, 'app%3A1')
  assert.equal(contracts.buildRoute('adoption.progress', { applicationId: decoded.applicationId }), '/packages/adoption/pages/progress/index?applicationId=app%3A1')
})

test('Weixin onLoad adapter rejects malformed encodings, prototype keys and decoded duplicate keys', () => {
  const decode = weixin.decodeWeixinLoadOptions
  throwsCode(() => decode({ id: '%E0%A4' }), 'MALFORMED_ENCODING')
  throwsCode(() => decode({ id: '%ZZ' }), 'MALFORMED_ENCODING')
  throwsCode(() => decode({ '%5F%5Fproto%5F%5F': 'x' }), 'PROTOTYPE_KEY')
  throwsCode(() => decode({ id: 'a', '%69d': 'b' }), 'DUPLICATE_PARAMETER')
  assert.throws(() => decode({ id: ['a'] }))
})

test('Weixin onLoad adapter accepts a native cross-realm plain options object', () => {
  const decode = weixin.decodeWeixinLoadOptions
  const nativeOptions = vm.runInNewContext('({ rescueId: "rescue-1" })')
  assert.equal(decode(nativeOptions).rescueId, 'rescue-1')
})
