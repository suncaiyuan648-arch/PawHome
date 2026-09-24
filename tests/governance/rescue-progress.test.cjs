'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after } = require('node:test')
const ts = require('typescript')

const projectRoot = path.resolve(__dirname, '..', '..')
const pageFile = path.join(projectRoot, 'packages/rescue/pages/progress/index.vue')
const componentFile = path.join(projectRoot, 'packages/rescue/components/RescueApplicantProgress.vue')
const progressServiceFile = path.join(projectRoot, 'packages/rescue/services/progress.ts')
const rescueStorageFile = path.join(projectRoot, 'utils/rescueStorage.ts')
let tempEsmRoot
let routeApi
let rescueMetadata
let progressApi
let storage

before(async () => {
  tempEsmRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'pawhome-rescue-progress-'))
  await fsp.cp(path.join(projectRoot, 'contracts'), path.join(tempEsmRoot, 'contracts'), { recursive: true })
  await fsp.writeFile(path.join(tempEsmRoot, 'package.tson'), '{"type":"module"}\n')
  await fsp.mkdir(path.join(tempEsmRoot, 'navigation'), { recursive: true })
  await fsp.mkdir(path.join(tempEsmRoot, 'packages/rescue/services'), { recursive: true })
  await fsp.mkdir(path.join(tempEsmRoot, 'services/domainReads'), { recursive: true })
  await fsp.mkdir(path.join(tempEsmRoot, 'utils'), { recursive: true })
  await fsp.copyFile(path.join(projectRoot, 'navigation/routeContracts.ts'), path.join(tempEsmRoot, 'navigation/routeContracts.ts'))
  await fsp.copyFile(path.join(projectRoot, 'navigation/weixinLoadOptions.ts'), path.join(tempEsmRoot, 'navigation/weixinLoadOptions.ts'))
  await fsp.copyFile(progressServiceFile, path.join(tempEsmRoot, 'packages/rescue/services/progress.ts'))
  await fsp.copyFile(path.join(projectRoot, 'packages/rescue/services/stateAdapter.ts'), path.join(tempEsmRoot, 'packages/rescue/services/stateAdapter.ts'))
  await fsp.cp(path.join(projectRoot, 'services/domainReads/rescue'), path.join(tempEsmRoot, 'services/domainReads/rescue'), { recursive: true })
  await fsp.copyFile(rescueStorageFile, path.join(tempEsmRoot, 'utils/rescueStorage.ts'))
  storage = new Map()
  globalThis.uni = {
    getStorageSync(key) { return storage.get(key) },
    setStorageSync(key, value) { storage.set(key, value) },
    removeStorageSync(key) { storage.delete(key) }
  }
  const helperUrl = pathToFileURL(path.join(tempEsmRoot, 'navigation/weixinLoadOptions.ts')).href
  routeApi = {
    ...(await import(`${helperUrl}?test=${Date.now()}-${Math.random()}`)),
    ...(await import(`${pathToFileURL(path.join(tempEsmRoot, 'navigation/routeContracts.ts')).href}?test=${Date.now()}-${Math.random()}`))
  }
  rescueMetadata = await import(`${pathToFileURL(path.join(projectRoot, 'packages/rescue/services/componentMetadata.ts')).href}?test=${Date.now()}-${Math.random()}`)
  routeApi.resolveRescueRecordLoadRoute = rescueMetadata.resolveRescueRecordLoadRoute
  progressApi = await import(`${pathToFileURL(path.join(tempEsmRoot, 'packages/rescue/services/progress.ts')).href}?test=${Date.now()}-${Math.random()}`)
})

after(async () => {
  if (tempEsmRoot) await fsp.rm(tempEsmRoot, { recursive: true, force: true })
})

function readScript(file) {
  const source = fs.readFileSync(file, 'utf8')
  const match = source.match(/<script(?:\s+[^>]*)?>\s*([\s\S]*?)\s*<\/script>/)
  assert.ok(match, `${file} must contain a script block`)
  return { source, script: match[1] }
}

function transpileRuntimeScript(source) {
  return ts.transpileModule(source.replace(/\bdefineComponent\(/g, '('), {
    compilerOptions: { target: ts.ScriptTarget.ES2019, module: ts.ModuleKind.None }
  }).outputText
}

function loadPage(stub) {
  const { script } = readScript(pageFile)
  const withoutImports = transpileRuntimeScript(script.replace(/^import[^\n]+\n/gm, '').replace('export default', 'return'))
  return new Function('readRescueProgress', 'RescueApplicantProgress', 'resolveRescueRecordLoadRoute', 'createRescueProgressPageState', withoutImports)(
    stub,
    {},
    routeApi.resolveRescueRecordLoadRoute,
    rescueMetadata.createRescueProgressPageState
  )
}

function loadComponent() {
  const { script } = readScript(componentFile)
  const withoutImports = transpileRuntimeScript(script.replace(/^import[^\n]+\n/gm, '').replace('export default', 'return'))
  const statusMetadata = {
    platform_pending: { text: '平台审核中', tone: 'pending' },
    platform_approved: { text: '平台审核成功', tone: 'success' },
    platform_rejected: { text: '平台审核未通过', tone: 'danger' }
  }
  return new Function('getRescueApplicationStatusPresentation', 'PawPageNav', 'PawIcon', 'PawStatusPill', 'LevelBadge', 'PawAdoptionPetsCard', withoutImports)(
    status => Object.prototype.hasOwnProperty.call(statusMetadata, status) ? statusMetadata[status] : null,
    {}, {}, {}, {}, {}
  )
}

test('rescue progress page requires rescueId, reads the progress service by exact ID, and refreshes onShow', () => {
  const calls = []
  const record = { id: 'rescue-real-1', rescueId: 'rescue-real-1', applicationStatus: 'platform_pending' }
  const page = loadPage(id => {
    calls.push({ id })
    return id === record.id
      ? { success: true, data: record, error: null }
      : { success: false, data: null, error: { code: 'NOT_FOUND' } }
  })
  const vm = Object.assign(page.data(), page.methods)
  page.onLoad.call(vm, {})
  assert.equal(vm.loadState, 'missing-id')
  assert.equal(vm.record, null)
  assert.equal(calls.length, 0)
  page.onShow.call(vm)
  assert.equal(calls.length, 0)

  page.onLoad.call(vm, { rescueId: encodeURIComponent(record.id) })
  assert.equal(vm.loadState, 'ready')
  assert.equal(vm.record, record)
  assert.deepEqual(calls[0], { id: record.id })
  page.onShow.call(vm)
  assert.equal(calls.length, 2)
  assert.deepEqual(calls[1], { id: record.id })
})

test('rescue progress page keeps not-found and malformed IDs empty instead of showing a demo pending state', () => {
  const calls = []
  const page = loadPage(id => {
    calls.push({ id })
    return { success: false, data: null, error: { code: 'NOT_FOUND' } }
  })
  const vm = Object.assign(page.data(), page.methods)
  page.onLoad.call(vm, { rescueId: 'missing-rescue' })
  assert.equal(vm.loadState, 'not-found')
  assert.equal(vm.record, null)
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], { id: 'missing-rescue' })
  page.onLoad.call(vm, { rescueId: '%E0%A4%A' })
  assert.equal(vm.loadState, 'invalid-params')
  assert.equal(vm.record, null)
  assert.equal(calls.length, 1)
  page.onShow.call(vm)
  assert.equal(vm.loadState, 'invalid-params')
  assert.equal(calls.length, 1)
})

test('rescue progress rejects invalid IDs and unknown query parameters before reading storage', () => {
  const calls = []
  const page = loadPage(id => {
    calls.push({ id })
    return { success: false, data: null, error: { code: 'NOT_FOUND' } }
  })
  const vm = Object.assign(page.data(), page.methods)
  for (const options of [
    { rescueId: 'bad/id' },
    { rescueId: 'rescue-real-1', type: 'rescue' },
    { rescueId: 'rescue-real-1', frame: 'legacy' },
    { rescueId: 42 },
    { rescueId: 'rescue-real-1', extra: 'unexpected' }
  ]) {
    page.onLoad.call(vm, options)
    assert.equal(vm.loadState, 'invalid-params')
    assert.equal(vm.record, null)
    assert.equal(calls.length, 0)
  }
})

test('WeChat boundary decoding happens once and preserves literal plus and percent text', () => {
  const decoded = routeApi.decodeWeixinLoadOptions({ state: '%E7%8C%AB%20%252F%20%2B' })
  assert.equal(decoded.state, '猫 %2F +')
  assert.throws(() => routeApi.decodeWeixinLoadOptions({ rescueId: '%E0%A4%A' }), error => error && error.code === 'MALFORMED_ENCODING')
})

test('rescue progress service projects one saved snapshot through the canonical state contract and remains read-only', () => {
  storage.clear()
  const saved = [{
    id: 'rescue-real-1',
    applicationStatus: 'platform_approved',
    reviewStatus: 'approved',
    fundingStatus: 'funding_pending',
    status: 'approved',
    applicantName: '真实求助人'
  }]
  storage.set('PAWHOME_RESCUES', JSON.stringify(saved))
  const result = progressApi.readRescueProgress('rescue-real-1')
  assert.equal(result.success, true)
  assert.equal(result.data.id, 'rescue-real-1')
  assert.equal(result.data.applicantName, '真实求助人')
  assert.equal(result.data.applicationStatus, 'platform_approved')
  assert.equal(result.data.rescueState.applicationStatus, 'platform_approved')
  assert.equal(result.data.rescueState.reviewStatus, 'approved')
  assert.equal(result.data.rescueState.fundingStatus, 'funding_pending')
  assert.equal(result.readOnly, true)
  assert.equal(result.canWrite, false)
  assert.equal(Object.isFrozen(result.data), true)
  assert.equal(storage.get('PAWHOME_RESCUES'), JSON.stringify(saved))
})

test('rescue progress service excludes demos and exposes contradictory state without inventing a paid result', () => {
  storage.clear()
  assert.equal(progressApi.readRescueProgress('rescue-demo-001').error.code, 'NOT_FOUND')
  storage.set('PAWHOME_RESCUES', JSON.stringify([{
    id: 'rescue-invalid',
    applicationStatus: 'platform_pending',
    reviewStatus: 'rejected',
    fundingStatus: 'funding_paid'
  }]))
  const invalid = progressApi.readRescueProgress('rescue-invalid')
  assert.equal(invalid.success, true)
  assert.equal(invalid.data.rescueState.validity, 'invalid')
  assert.equal(invalid.data.rescueState.funding.paid, false)
  assert.equal(invalid.data.rescueState.funding.displayStatus, 'unknown')
  assert.equal(invalid.canWrite, false)
  assert.equal(progressApi.readRescueProgress('bad/id').error.code, 'INVALID_ID')
  assert.equal(progressApi.readRescueProgress(42).error.code, 'INVALID_ID')
  assert.equal(progressApi.readRescueProgress(['rescue-invalid']).error.code, 'INVALID_ID')
})

test('rescue progress presentation derives pending, approved, rejected and unknown states from applicationStatus', () => {
  const component = loadComponent()
  const context = record => {
    const value = { record }
    for (const name of ['statusMeta', 'isApproved', 'isRejected']) {
      Object.defineProperty(value, name, { get: () => component.computed[name].call(value) })
    }
    return value
  }
  const pending = context({ applicationStatus: 'platform_pending' })
  const approved = context({ applicationStatus: 'platform_approved' })
  const rejected = context({ applicationStatus: 'platform_rejected' })
  const unknown = context({ applicationStatus: 'future_status' })
  assert.equal(component.computed.statusTitle.call(pending), '平台审核中')
  assert.equal(component.computed.statusTitle.call(approved), '平台审核成功')
  assert.equal(component.computed.statusTitle.call(rejected), '平台审核未通过')
  assert.equal(component.computed.statusTitle.call(unknown), '申请状态暂不可识别')
  assert.equal(component.computed.statusCopy.call(unknown), '当前救助申请状态无法识别，请稍后重试。')
  assert.equal(component.computed.isApproved.call(rejected), false)
  assert.equal(component.computed.isApproved.call(approved), true)
})

test('rescue progress migration does not import the aggregate application API and retains the approved layout/navigation', () => {
  const page = readScript(pageFile).source
  const component = readScript(componentFile).source
  const metadata = fs.readFileSync(path.join(projectRoot, 'packages/rescue/services/componentMetadata.ts'), 'utf8')
  assert.match(page, /readRescueProgress\(this\.rescueId,/)
  assert.doesNotMatch(page, /getRescueById/)
  assert.doesNotMatch(page, /includeDemo:\s*false/)
  assert.match(page, /onShow\s*\(\)/)
  assert.match(page, /resolveRescueRecordLoadRoute\(options, 'rescue\.progress'\)/)
  assert.match(page, /resolveRescueRecordLoadRoute/)
  assert.match(metadata, /decodeWeixinLoadOptions/)
  assert.doesNotMatch(page, /options\.(?:id|recordId)/)
  assert.doesNotMatch(page, /decodeQueryValue/)
  assert.doesNotMatch(page, /applicationMockApi/)
  assert.doesNotMatch(component, /applicationMockApi/)
  for (const token of ['PawPageNav', 'PawAdoptionPetsCard', 'PawStatusPill', 'applicationStatus', 'platform_approved', 'platform_rejected', 'qa-rescue-applicant-progress-empty']) {
    assert.match(component, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
  assert.match(component, /没有审核|审核结果|平台审核未通过/)
})
