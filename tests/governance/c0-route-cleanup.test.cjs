'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const JSON5 = require('json5')
const YAML = require('yaml')
const test = require('node:test')

const repoRoot = path.resolve(__dirname, '..', '..')

function registeredRoutes() {
  const pages = JSON5.parse(fs.readFileSync(path.join(repoRoot, 'pages.json'), 'utf8'))
  const routes = new Set((pages.pages || []).map((page) => `/pages/${page.path}`))
  for (const pack of pages.subPackages || pages.subpackages || []) {
    for (const page of pack.pages || []) routes.add(`/${pack.root}/${page.path}`)
  }
  return routes
}

test('C0 legacy wrapper routes are removed after canonical state migration', () => {
  const routes = registeredRoutes()
  for (const route of [
    '/pages/meMore/feedingDetail',
    '/pages/meMore/feedingDetail90',
    '/pages/meMore/feedingDetail91',
    '/pages/meMore/feedingDetail92',
    '/packages/dynamic/pages/editor/indexOrder',
    '/pages/adoption/pickCats',
    '/pages/yard/rescueReview',
  ]) {
    assert.equal(routes.has(route), false, `${route} must not remain registered`)
    assert.equal(fs.existsSync(path.join(repoRoot, `${route.slice(1)}.vue`)), false, `${route} source must be removed`)
  }
  assert.equal(routes.has('/packages/feeding/pages/order/detail/index'), true)
  assert.equal(fs.existsSync(path.join(repoRoot, 'packages/feeding/pages/order/detail/index.vue')), true)
})

test('C0 dynamic detail moves into the dynamic package', () => {
  const routes = registeredRoutes()
  for (const route of ['/pages/dynamicDetail/index', '/pages/dynamicDetail/deepLink']) {
    assert.equal(routes.has(route), false, `${route} must not remain registered`)
    assert.equal(fs.existsSync(path.join(repoRoot, `${route.slice(1)}.vue`)), false, `${route} source must be removed`)
  }
  for (const route of ['/packages/dynamic/pages/detail/index', '/packages/dynamic/pages/deep-link/index']) {
    assert.equal(routes.has(route), true, `${route} must be registered`)
    assert.equal(fs.existsSync(path.join(repoRoot, `${route.slice(1)}.vue`)), true, `${route} source must exist`)
  }
})

test('C0 address routes move from meMore into the address package', () => {
  const routes = registeredRoutes()
  for (const route of [
    '/pages/meMore/shippingAddress',
    '/pages/meMore/addShippingAddress',
    '/pages/meMore/addServiceAddress',
    '/pages/meMore/regionSelector',
  ]) {
    assert.equal(routes.has(route), false, `${route} must not remain registered`)
    assert.equal(fs.existsSync(path.join(repoRoot, `${route.slice(1)}.vue`)), false, `${route} source must be removed`)
  }
  for (const route of [
    '/packages/address/pages/list/index',
    '/packages/address/pages/editor/index',
    '/packages/address/pages/region-picker/index',
  ]) {
    assert.equal(routes.has(route), true, `${route} must be registered`)
    assert.equal(fs.existsSync(path.join(repoRoot, `${route.slice(1)}.vue`)), true, `${route} source must exist`)
  }
})

test('Figma states point to canonical pages with explicit state queries', () => {
  const map = YAML.parse(fs.readFileSync(path.join(repoRoot, 'docs/design/figma-map.yaml'), 'utf8'))
  const selectOrder = map.pages.publish_dynamic.states.select_order
  assert.equal(selectOrder.route, '/packages/dynamic/pages/editor/index')
  assert.equal(selectOrder.source, 'packages/dynamic/pages/editor/index.vue')
  assert.equal(selectOrder.query.state, 'select-order')

  const pickCats = map.pages.adoption.states.pick_cats
  assert.equal(pickCats.route, '/packages/adoption/pages/apply/index')
  assert.equal(pickCats.source, 'packages/adoption/pages/apply/index.vue')
  assert.equal(pickCats.query.state, 'pick-cats')

  const feeding = map.pages.feeding_order_detail
  assert.equal(feeding.route, '/packages/feeding/pages/order/detail/index')
  assert.equal(feeding.source, 'packages/feeding/pages/order/detail/index.vue')
  assert.equal(feeding.states.variant_90.query.variant, 90)
  assert.equal(feeding.states.variant_91.query.perspective, 'yard-manager')
  assert.equal(feeding.states.variant_92.query.variant, 92)
})

test('canonical editors implement migrated sheet states', () => {
  const postFeed = fs.readFileSync(path.join(repoRoot, 'packages/dynamic/pages/editor/index.vue'), 'utf8')
  assert.match(postFeed, /options\.state === ['"]select-order['"]/)
  assert.match(postFeed, /showOrderSheet = true/)

  const adoptApply = fs.readFileSync(path.join(repoRoot, 'packages/adoption/pages/apply/index.vue'), 'utf8')
  assert.match(adoptApply, /query\.state === ['"]pick-cats['"]/)
  assert.match(adoptApply, /pickerOnly/)
})

test('C0 account asset routes split the old meMore aggregate and remove its sources', () => {
  const routes = registeredRoutes()
  for (const route of ['/pages/meMore/myAssets', '/pages/meMore/myCloudPets']) {
    assert.equal(routes.has(route), false, `${route} must not remain registered`)
    assert.equal(fs.existsSync(path.join(repoRoot, `${route.slice(1)}.vue`)), false, `${route} source must be removed`)
  }
  for (const route of [
    '/packages/yard/pages/animals/index',
    '/packages/animal/pages/mine/index',
    '/packages/animal/pages/sponsored/index',
    '/packages/account/pages/medals/index',
    '/packages/account/pages/medals/map/index',
    '/packages/account/pages/medals/achievement/index'
  ]) {
    assert.equal(routes.has(route), true, `${route} must be registered`)
    assert.equal(fs.existsSync(path.join(repoRoot, `${route.slice(1)}.vue`)), true, `${route} source must exist`)
  }
  const map = YAML.parse(fs.readFileSync(path.join(repoRoot, 'docs/design/figma-map.yaml'), 'utf8'))
  assert.equal(map.pages.account.states.animal_mine.route, '/packages/animal/pages/mine/index')
  assert.equal(map.pages.account.states.animal_sponsored.route, '/packages/animal/pages/sponsored/index')
  assert.equal(map.pages.account.states.medals_map.route, '/packages/account/pages/medals/map/index')
})

test('C0 account and business pages remove meMore/user production sources', () => {
  const routes = registeredRoutes()
  const migrated = [
    ['/pages/meMore/browsingHistory', '/packages/account/pages/history/index'],
    ['/pages/meMore/level', '/packages/account/pages/level/index'],
    ['/pages/meMore/levelRules', '/packages/account/pages/level/rules/index'],
    ['/pages/meMore/annualReport', '/packages/account/pages/annual-report/index'],
    ['/pages/meMore/helpedAnimals', '/packages/account/pages/helped-animals/index'],
    ['/pages/user/profile', '/packages/account/pages/profile/index'],
    ['/pages/user/followFans', '/packages/account/pages/relations/index'],
    ['/pages/meMore/myAdoption', '/packages/adoption/pages/mine/index'],
    ['/pages/meMore/adoptionConfirm', '/packages/adoption/pages/confirmation/index'],
    ['/pages/meMore/myFeedings', '/packages/feeding/pages/mine/index'],
    ['/pages/meMore/yardFeedOrders', '/packages/feeding/pages/yard-orders/index'],
    ['/pages/meMore/rescueProofList', '/packages/rescue/pages/proof/list/index'],
    ['/pages/meMore/rescueProofForm', '/packages/rescue/pages/proof/create/index'],
  ]
  for (const [legacy, canonical] of migrated) {
    assert.equal(routes.has(legacy), false, `${legacy} must not remain registered`)
    assert.equal(fs.existsSync(path.join(repoRoot, `${legacy.slice(1)}.vue`)), false, `${legacy} source must be removed`)
    assert.equal(routes.has(canonical), true, `${canonical} must be registered`)
    assert.equal(fs.existsSync(path.join(repoRoot, `${canonical.slice(1)}.vue`)), true, `${canonical} source must exist`)
  }
  assert.equal(routes.has('/packages/rescue/pages/mine/index'), true)
  assert.equal(fs.existsSync(path.join(repoRoot, 'packages/rescue/pages/mine/index.vue')), true)
  assert.equal(routes.has('/packages/rescue/pages/review/list/index'), true)
  assert.equal(routes.has('/packages/adoption/pages/review/list/index'), true)
  assert.equal(routes.has('/packages/adoption/pages/review/detail/index'), true)
})

test('C0 leaves meMore, user, and retired detail roots without production page sources', () => {
  const productionVueFiles = (relativeDir) => {
    const dir = path.join(repoRoot, relativeDir)
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.vue'))
      .map((entry) => `${relativeDir}/${entry.name}`)
  }
  assert.deepEqual(productionVueFiles('pages/meMore'), [])
  assert.deepEqual(productionVueFiles('pages/user'), [])
  assert.deepEqual(productionVueFiles('pages/dynamicDetail'), [])
  assert.deepEqual(productionVueFiles('pages/commodityDetails'), [])
  for (const relativeDir of ['pages/meMore', 'pages/user', 'pages/dynamicDetail', 'pages/commodityDetails']) {
    const dir = path.join(repoRoot, relativeDir)
    if (!fs.existsSync(dir)) continue
    const nested = fs.readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    assert.equal(nested.length, 0, `${relativeDir} must not retain a production page manifest`)
  }
  for (const relative of [
    'pages/meMore/components/PawAdoptionFlowFigma.vue',
    'pages/meMore/components/PawAdoptionProofForm.vue',
    'pages/yard/components/overlay/PawSelectionSheet.vue',
  ]) {
    assert.equal(fs.existsSync(path.join(repoRoot, relative)), false, `${relative} must not remain after migration`)
  }
})

test('C0 adoption and feature roots split into semantic package pages', () => {
  const routes = registeredRoutes()
  const migrated = [
    ['/pages/adoption/petDetail', '/packages/animal/pages/detail/index'],
    ['/pages/adoption/adoptApply', '/packages/adoption/pages/apply/index'],
    ['/pages/adoption/adoptApplySuccess', '/packages/adoption/pages/result/index'],
    ['/pages/adoption/extras', '/packages/adoption/pages/support/index'],
    ['/pages/adoption/result', '/packages/adoption/pages/result/index'],
    ['/pages/adoption/submitOrder', '/packages/adoption/pages/reward/claim/index'],
    ['/pages/feature/index', '/packages/account/pages/invite/index'],
  ]
  for (const [legacy, canonical] of migrated) {
    assert.equal(routes.has(legacy), false, `${legacy} must not remain registered`)
    assert.equal(fs.existsSync(path.join(repoRoot, `${legacy.slice(1)}.vue`)), false, `${legacy} source must be removed`)
    assert.equal(routes.has(canonical), true, `${canonical} must be registered`)
    assert.equal(fs.existsSync(path.join(repoRoot, `${canonical.slice(1)}.vue`)), true, `${canonical} source must exist`)
  }
  for (const route of [
    '/packages/rescue/pages/apply/index',
    '/packages/rescue/pages/result/index',
    '/packages/animal/pages/album/index',
    '/packages/adoption/pages/quota/index',
    '/packages/adoption/pages/quota/detail/index',
  ]) {
    assert.equal(routes.has(route), true, `${route} must be registered`)
    assert.equal(fs.existsSync(path.join(repoRoot, `${route.slice(1)}.vue`)), true, `${route} source must exist`)
  }
  const rescueApply = fs.readFileSync(path.join(repoRoot, 'packages/rescue/pages/apply/index.vue'), 'utf8')
  const adoptionApply = fs.readFileSync(path.join(repoRoot, 'packages/adoption/pages/apply/index.vue'), 'utf8')
  assert.match(rescueApply, /this\.longMode = true/)
  assert.match(rescueApply, /createApplication\('rescue'/)
  assert.doesNotMatch(rescueApply, /createApplication\('adoption'/)
  assert.match(adoptionApply, /this\.rescueMode = false/)
  assert.match(adoptionApply, /createApplication\('adoption'/)
  assert.doesNotMatch(adoptionApply, /createApplication\('rescue'/)
})

test('C0 discovery, message, and publish roots move to semantic packages', () => {
  const routes = registeredRoutes()
  const migrated = [
    ['/pages/messageDetail/index', '/packages/message/pages/list/index'],
    ['/pages/citySelect/index', '/packages/discovery/pages/city-picker/index'],
    ['/pages/search/index', '/packages/discovery/pages/search/index'],
    ['/pages/leaderboard/index', '/packages/discovery/pages/ranking/index'],
    ['/pages/publishDynamic/postFeed', '/packages/dynamic/pages/editor/index'],
    ['/pages/publishDynamic/postSuccess', '/packages/dynamic/pages/result/index'],
  ]
  for (const [legacy, canonical] of migrated) {
    assert.equal(routes.has(legacy), false, `${legacy} must not remain registered`)
    assert.equal(fs.existsSync(path.join(repoRoot, `${legacy.slice(1)}.vue`)), false, `${legacy} source must be removed`)
    assert.equal(routes.has(canonical), true, `${canonical} must be registered`)
    assert.equal(fs.existsSync(path.join(repoRoot, `${canonical.slice(1)}.vue`)), true, `${canonical} source must exist`)
  }
  assert.equal(routes.has('/packages/feeding/pages/result/index'), true)
  assert.equal(fs.existsSync(path.join(repoRoot, 'packages/feeding/pages/result/index.vue')), true)
})

test('C0 keeps development-only pages available for local QA', () => {
  const routes = registeredRoutes()
  for (const route of ['/pages/dev/paw-icon-lab', '/pages/dev/yard-feed-icon-lab']) {
    assert.equal(routes.has(route), true, `${route} must remain registered for dev-only QA`)
    assert.equal(fs.existsSync(path.join(repoRoot, `${route.slice(1)}.vue`)), true, `${route} source must remain available`)
  }
})

test('C0 adoptionFlow legacy page is removed after progress route split', () => {
  const routes = registeredRoutes()
  assert.equal(routes.has('/pages/meMore/adoptionFlow'), false)
  assert.equal(fs.existsSync(path.join(repoRoot, 'pages/meMore/adoptionFlow.vue')), false)
  assert.equal(routes.has('/packages/adoption/pages/progress/index'), true)
  assert.equal(routes.has('/packages/rescue/pages/progress/index'), true)
  const map = YAML.parse(fs.readFileSync(path.join(repoRoot, 'docs/design/figma-map.yaml'), 'utf8'))
  const reward = map.pages.adoption.states.flow_progress_reward
  assert.equal(reward.route, '/packages/adoption/pages/progress/index')
  assert.equal(reward.source, 'packages/adoption/pages/progress/index.vue')
  assert.equal(reward.query.applicationId, 'demo-reward')
})

test('C0 yard onboarding, create, editors, breed picker and jury queue move to semantic packages', () => {
  const routes = registeredRoutes()
  const migrated = [
    ['/pages/yard/catGuide', '/packages/yard/pages/onboarding/index'],
    ['/pages/yard/createCatYard', '/packages/yard/pages/create/index'],
    ['/pages/yard/breedPicker', '/packages/animal/pages/breed-picker/index'],
    ['/pages/yard/editor', '/packages/yard/pages/editor/index'],
    ['/pages/yard/animalEditor', '/packages/animal/pages/editor/index'],
    ['/pages/yard/addKitten', '/packages/animal/pages/editor/index'],
    ['/pages/yard/juryPanel', '/packages/jury/pages/queue/index'],
    ['/pages/yard/yardCats', '/packages/yard/pages/manage/animals/index'],
    ['/pages/yard/yardCertify', '/packages/yard/pages/certification/index'],
  ]
  for (const [legacy, canonical] of migrated) {
    assert.equal(routes.has(legacy), false, `${legacy} must not remain registered`)
    assert.equal(fs.existsSync(path.join(repoRoot, `${legacy.slice(1)}.vue`)), false, `${legacy} source must be removed`)
    assert.equal(routes.has(canonical), true, `${canonical} must be registered`)
    assert.equal(fs.existsSync(path.join(repoRoot, `${canonical.slice(1)}.vue`)), true, `${canonical} source must exist`)
  }
})

test('C0 jury detail is split by explicit business type and removes the old source', () => {
  const routes = registeredRoutes()
  assert.equal(routes.has('/pages/yard/juryDetail'), false)
  assert.equal(fs.existsSync(path.join(repoRoot, 'pages/yard/juryDetail.vue')), false)
  for (const route of [
    '/packages/adoption/pages/jury/detail/index',
    '/packages/rescue/pages/review/detail/index',
  ]) {
    assert.equal(routes.has(route), true, `${route} must be registered`)
    assert.equal(fs.existsSync(path.join(repoRoot, `${route.slice(1)}.vue`)), true, `${route} source must exist`)
  }
  const map = YAML.parse(fs.readFileSync(path.join(repoRoot, 'docs/design/figma-map.yaml'), 'utf8'))
  const jury = map.pages.jury.states
  assert.equal(jury.pending_detail.route, '/packages/rescue/pages/review/detail/index')
  assert.equal(jury.pending_detail.source, 'packages/rescue/pages/review/detail/index.vue')
  assert.equal(jury.pending_detail.query.businessType, 'rescue')
  assert.equal(jury.voted_detail.route, '/packages/adoption/pages/jury/detail/index')
  assert.equal(jury.voted_detail.source, 'packages/adoption/pages/jury/detail/index.vue')
  assert.equal(jury.voted_detail.query.businessType, 'adoption')
})

test('C0 migrated animal and yard forms keep local write seams fail-closed', () => {
  const animalEditor = fs.readFileSync(path.join(repoRoot, 'packages/animal/pages/editor/index.vue'), 'utf8')
  const yardCertification = fs.readFileSync(path.join(repoRoot, 'packages/yard/pages/certification/index.vue'), 'utf8')
  for (const source of [animalEditor, yardCertification]) {
    assert.match(source, /<PawPageNav\b/)
    assert.doesNotMatch(source, /getMenuButtonBoundingClientRect\s*\(/)
  }
  assert.match(animalEditor, /动物资料保存暂不可用/)
  assert.match(yardCertification, /认证提交暂不可用/)
  assert.doesNotMatch(animalEditor, /已保存/)
  assert.doesNotMatch(yardCertification, /redirectTo\s*\(/)
})

test('C0 yard detail moves out of commodity naming and requires the canonical yard ID', () => {
  const routes = registeredRoutes()
  assert.equal(routes.has('/pages/commodityDetails/index'), false)
  assert.equal(fs.existsSync(path.join(repoRoot, 'pages/commodityDetails/index.vue')), false)
  assert.equal(routes.has('/packages/yard/pages/detail/index'), true)
  const source = fs.readFileSync(path.join(repoRoot, 'packages/yard/pages/detail/index.vue'), 'utf8')
  assert.match(source, /resolveYardDetailRoute\(options\)/)
  const routeMetadata = fs.readFileSync(path.join(repoRoot, 'packages/yard/services/yardDetailMetadata.ts'), 'utf8')
  assert.match(routeMetadata, /value\.yardId/)
  assert.match(source, /小院详情暂不可用/)
  assert.doesNotMatch(source, /options\.id\b/)
  const map = YAML.parse(fs.readFileSync(path.join(repoRoot, 'docs/design/figma-map.yaml'), 'utf8'))
  assert.equal(map.pages.yard_detail.route, '/packages/yard/pages/detail/index')
  assert.equal(map.pages.yard_detail.source, 'packages/yard/pages/detail/index.vue')
  for (const state of ['dynamic', 'dynamic_empty', 'feeding', 'dynamic_expanded']) {
    assert.equal(map.pages.yard_detail.states[state].query.yardId, '1')
  }
})
