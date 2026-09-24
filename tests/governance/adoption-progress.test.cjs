'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after, beforeEach } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const pagePath = path.join(ROOT, 'packages/adoption/pages/progress/index.vue')
const viewPath = path.join(ROOT, 'packages/adoption/components/AdoptionProgressView.vue')
const servicePath = path.join(ROOT, 'packages/adoption/services/progress.ts')
const metadataPath = path.join(ROOT, 'packages/adoption/services/progressPageMetadata.ts')
const ADOPTION_KEY = 'PAWHOME_ADOPTIONS'

let pageSource
let viewSource
let serviceSource
let metadataSource
let service
let storage
let tempRoot

function resetStorage() {
  storage.clear()
}

function setStorage(key, value) {
  storage.set(key, value)
}

before(async () => {
  pageSource = await fs.readFile(pagePath, 'utf8')
  viewSource = await fs.readFile(viewPath, 'utf8')
  serviceSource = await fs.readFile(servicePath, 'utf8')
  metadataSource = await fs.readFile(metadataPath, 'utf8')

  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-adoption-progress-'))

  await fs.cp(path.join(ROOT, 'contracts'), path.join(tempRoot, 'contracts'), { recursive: true })
  await fs.writeFile(path.join(tempRoot, 'package.tson'), '{"type":"module"}\n')
  await fs.mkdir(path.join(tempRoot, 'utils'), { recursive: true })
  await fs.mkdir(path.join(tempRoot, 'packages/adoption/services'), { recursive: true })
  await fs.mkdir(path.join(tempRoot, 'services/domainReads/adoption'), { recursive: true })
  await fs.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
  await fs.copyFile(
    path.join(ROOT, 'utils/adoptionStorage.ts'),
    path.join(tempRoot, 'utils/adoptionStorage.ts'),
  )
  await fs.copyFile(
    path.join(ROOT, 'services/domainReads/adoption/applicationAdapter.ts'),
    path.join(tempRoot, 'services/domainReads/adoption/applicationAdapter.ts'),
  )
  await fs.copyFile(
    path.join(ROOT, 'navigation/actorCapabilities.ts'),
    path.join(tempRoot, 'navigation/actorCapabilities.ts'),
  )
  await fs.copyFile(
    path.join(ROOT, 'navigation/adoptionConditionContract.ts'),
    path.join(tempRoot, 'navigation/adoptionConditionContract.ts'),
  )
  await fs.copyFile(
    path.join(ROOT, 'packages/adoption/services/applicationAdapter.ts'),
    path.join(tempRoot, 'packages/adoption/services/applicationAdapter.ts'),
  )
  await fs.copyFile(
    path.join(ROOT, 'packages/adoption/services/actorCapabilities.ts'),
    path.join(tempRoot, 'packages/adoption/services/actorCapabilities.ts'),
  )
  await fs.copyFile(
    path.join(ROOT, 'packages/adoption/services/adoptionConditionContract.ts'),
    path.join(tempRoot, 'packages/adoption/services/adoptionConditionContract.ts'),
  )
  await fs.writeFile(
    path.join(tempRoot, 'packages/adoption/services/progress.ts'),
    serviceSource.replace("'@/utils/adoptionStorage.ts'", "'../../../utils/adoptionStorage.ts'"),
  )

  storage = new Map()
  globalThis.uni = {
    getStorageSync(key) {
      return storage.get(key)
    },
    setStorageSync(key, value) {
      storage.set(key, value)
    },
    removeStorageSync(key) {
      storage.delete(key)
    },
  }
  service = await import(
    `${pathToFileURL(path.join(tempRoot, 'packages/adoption/services/progress.ts')).href}?test=${Date.now()}`
  )
})

beforeEach(resetStorage)

after(async () => {
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

test('the page is a persisted, applicant-only boundary with explicit route validation', () => {
  assert.match(pageSource, /<PawPageNav\b/)
  assert.match(pageSource, /onShow\s*\(\)/)
  assert.match(metadataSource, /buildRoute\('adoption\.progress', params\)/)
  assert.match(metadataSource, /decodeWeixinLoadOptions\(options\)/)
  assert.match(pageSource, /resolveAdoptionProgressRoute\(options\)/)
  assert.match(pageSource, /readAdoptionProgress\(this\.applicationId,/)
  assert.match(pageSource, /view === 'adoption-info'/)
  assert.match(pageSource, /view === 'application'/)
  assert.match(pageSource, /buildRoute\('adoption\.confirmation'/)
  assert.doesNotMatch(pageSource, /adoptionConfirm\?recordId=/)
  assert.match(pageSource, /adoption\/pages\/reward\/claim\/index\?applicationId=/)
  assert.doesNotMatch(
    pageSource,
    /PawAdoptionFlowFigma|PawRewardOrderSheet|getDemoAdoptions|getLastAdoptionId|rescueStorage|rescueMock|frame\s*=/,
  )
  assert.doesNotMatch(pageSource, /adoptionAudit|juryDetail|mode\s*===|role\s*===/)
  assert.match(serviceSource, /readAdoptionApplication/)
  assert.doesNotMatch(serviceSource, /getAdoptionById\(/)
  assert.match(viewSource, /AdoptionProgressTimeline/)
  assert.match(viewSource, /PropType<AdoptionProgressRecordView>/)
  assert.doesNotMatch(viewSource, /fake-home-indicator|home-indicator|status-bar|capsule/)
})

test('missing IDs and demo IDs fail closed while a saved ID is readable', () => {
  assert.equal(service.readAdoptionProgress('').error.code, 'MISSING_ID')
  assert.equal(service.readAdoptionProgress('demo-pending').error.code, 'NOT_FOUND')

  setStorage('PAWHOME_ACTOR_SESSION', { actor: { id: 'actor-a', roles: ['applicant'] } })
  const saved = service.readAdoptionProgress('saved-pending')
  assert.equal(saved.success, false)
  const raw = JSON.stringify([
    {
      id: 'saved-pending',
      applicantId: 'actor-a',
      status: 'pending',
      yardName: '真实小院',
      pets: [{ id: 'saved-cat', name: '真实猫' }],
    },
  ])
  setStorage(ADOPTION_KEY, raw)
  const loaded = service.readAdoptionProgress('saved-pending')
  assert.equal(loaded.success, true)
  assert.equal(loaded.data.id, 'saved-pending')
  assert.equal(loaded.data.status, 'pending')
  assert.equal(loaded.data.yardName, '真实小院')
})

test('status presentation and reward transition come from the stored record, never the URL view', () => {
  setStorage('PAWHOME_ACTOR_SESSION', { actor: { id: 'actor-a', roles: ['applicant'] } })
  setStorage(
    ADOPTION_KEY,
    JSON.stringify([
      {
        id: 'saved-confirmed',
        applicantId: 'actor-a',
        status: 'adoption_confirmed',
        pets: [{ id: 'saved-cat', name: '真实猫' }],
      },
    ]),
  )
  const current = service.readAdoptionProgress('saved-confirmed')
  const presentation = service.statusPresentation(current.data)
  assert.equal(presentation.status, 'adoption_confirmed')
  assert.equal(presentation.progress.percent, '100%')
  assert.equal(presentation.canClaimReward, true)

  const changed = service.beginReward('saved-confirmed')
  assert.equal(changed.success, true)
  assert.equal(changed.data.id, 'saved-confirmed')
  assert.equal(changed.data.status, 'reward')
  assert.equal(service.beginReward('demo-reward').error.code, 'NOT_FOUND')
})

test('missing or mismatched applicant sessions cannot read or reward another actor application', () => {
  setStorage(
    ADOPTION_KEY,
    JSON.stringify([{ id: 'saved-private', applicantId: 'actor-a', status: 'pending' }]),
  )
  assert.equal(service.readAdoptionProgress('saved-private').error.code, 'NO_ACTOR')

  setStorage('PAWHOME_ACTOR_SESSION', { actor: { id: 'actor-b', roles: ['applicant'] } })
  const denied = service.readAdoptionProgress('saved-private')
  assert.equal(denied.success, false)
  assert.equal(denied.error.code, 'FORBIDDEN')
  assert.equal(service.beginReward('saved-private').error.code, 'FORBIDDEN')
})
