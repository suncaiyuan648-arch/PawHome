'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
let tempRoot
let mockData
let reviewMetadata
let rescueMockData

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-adoption-mock-metadata-'))
  const utilsRoot = path.join(tempRoot, 'utils')
  await fs.mkdir(utilsRoot, { recursive: true })
  for (const file of [
    'adoptionMockData.ts',
    'adoptionReviewMetadata.ts',
    'rescueApplicationMockData.ts',
  ]) {
    await fs.copyFile(path.join(ROOT, 'utils', file), path.join(utilsRoot, file))
  }
  mockData = await import(
    `${pathToFileURL(path.join(utilsRoot, 'adoptionMockData.ts')).href}?test=${Date.now()}`
  )
  reviewMetadata = await import(
    `${pathToFileURL(path.join(utilsRoot, 'adoptionReviewMetadata.ts')).href}?test=${Date.now()}`
  )
  rescueMockData = await import(
    `${pathToFileURL(path.join(utilsRoot, 'rescueApplicationMockData.ts')).href}?test=${Date.now()}`
  )
})

after(async () => {
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

test('adoption fixture metadata supplies stable pet identity and picker price/state fields', () => {
  const applicationPets = mockData.ADOPTION_APPLICATION_PET_MOCKS
  const pickerPets = mockData.ADOPTION_PICK_PET_MOCKS
  assert.ok(applicationPets.length > 0)
  assert.ok(pickerPets.length >= applicationPets.length)

  for (const pet of applicationPets) {
    assert.equal(typeof pet.id, 'string')
    assert.equal(typeof pet.name, 'string')
    assert.equal(typeof pet.avatar, 'string')
  }
  for (const pet of pickerPets) {
    assert.equal(typeof pet.id, 'string')
    assert.equal(typeof pet.name, 'string')
    assert.equal(typeof pet.avatar, 'string')
    assert.equal(typeof pet.price, 'number')
    assert.equal(typeof pet.disabled, 'boolean')
  }
  assert.equal(new Set(pickerPets.map((pet) => pet.id)).size, pickerPets.length)
})

test('application pages receive independent mutable copies of the shared pet fixtures', () => {
  const first = mockData.createAdoptionApplicationPetMocks()
  const second = mockData.createAdoptionApplicationPetMocks()
  first[0].name = 'page-local edit'
  assert.notEqual(second[0].name, 'page-local edit')
  assert.notEqual(mockData.ADOPTION_APPLICATION_PET_MOCKS[0].name, 'page-local edit')
})

test('adoption review metadata narrows persisted records and shares cloned fallback pets', () => {
  const record = reviewMetadata.normalizeAdoptionReviewRecord({
    id: 'application-review-1',
    applicationId: 'application-review-1',
    status: 'pending',
    yardId: 'yard-1',
    yardName: '小院一号',
    ownerName: '院主',
    applicantId: 'applicant-1',
    applicantName: '申请人',
    applicantAvatar: '/applicant.png',
    applicantLevel: '2',
    applicant: { id: 'applicant-1', pawId: 'paw-applicant-1' },
    mediaPaths: ['/one.png', null, 3, '/two.png'],
    proofPhotos: ['/proof.png', false],
    cloudParentIds: ['cloud-1', 2],
    cloudParentApprovals: ['cloud-1'],
    pets: [
      { id: 'pet-1', name: '团子', avatar: '/pet.png' },
      { name: '缺少标识', avatar: '/invalid.png' },
    ],
  })

  assert.ok(record)
  assert.equal(record.applicationId, 'application-review-1')
  assert.equal(record.applicantLevel, 2)
  assert.deepEqual(record.mediaPaths, ['/one.png', '/two.png'])
  assert.deepEqual(record.proofPhotos, ['/proof.png'])
  assert.deepEqual(record.cloudParentIds, ['cloud-1'])
  assert.deepEqual(
    record.pets.map((pet) => pet.id),
    ['pet-1'],
  )
  assert.equal(reviewMetadata.normalizeAdoptionReviewRecord({ status: 'pending' }), null)

  const first = reviewMetadata.createAdoptionReviewFallbackPets()
  const second = reviewMetadata.createAdoptionReviewFallbackPets()
  assert.equal(first.length, 1)
  assert.ok(first[0].id && first[0].name && first[0].avatar)
  first[0].name = '页面内修改'
  assert.notEqual(second[0].name, '页面内修改')
  assert.notEqual(mockData.ADOPTION_REVIEW_FALLBACK_PETS[0].name, '页面内修改')
})

test('adoption review queue card metadata retains review identity and derives display labels', async () => {
  const item = {
    applicationId: 'application-1',
    reviewItemId: 'review-item-1',
    applicationType: 'adoption',
    phase: 'cloud_parent',
    reviewStatus: 'pending',
    bucket: 'pending',
    applicationStatus: 'cloud_pending',
    reviewerRole: 'cloud_parent',
    reviewerId: 'cloud-1',
    applicantId: 'applicant-1',
    ownerId: 'owner-1',
    cloudParentIds: ['cloud-1'],
    cloudParent: {
      count: 1,
      required: true,
      decision: 'pending',
      canProceed: false,
      decisionRequired: true,
      reason: '',
      reviews: [],
    },
    readOnly: true,
    canWrite: false,
  }
  const card = reviewMetadata.createAdoptionReviewQueueCard(item, null)
  assert.equal(card.applicationId, 'application-1')
  assert.equal(card.reviewItemId, 'review-item-1')
  assert.equal(card.reviewerRole, 'cloud_parent')
  assert.equal(card.statusText, '待云家长审批')
  assert.equal(card.detailMode, 'cloudReview')
  assert.equal(card.applicant.name, 'applicant-1')
  assert.deepEqual(card.pets, [])

  const detailPage = await fs.readFile(
    path.join(ROOT, 'packages/adoption/pages/review/detail/index.vue'),
    'utf8',
  )
  const cardComponent = await fs.readFile(
    path.join(ROOT, 'components/adoption/PawAdoptionReviewCard.vue'),
    'utf8',
  )
  assert.doesNotMatch(detailPage, /\bany\b/)
  assert.doesNotMatch(cardComponent, /\bany\b/)
  assert.match(detailPage, /data\(\):\s*AdoptionReviewPageState/)
  assert.match(cardComponent, /PropType<AdoptionReviewQueueCardMetadata>/)
})

test('adoption review metadata indexes persisted aliases and labels jury review explicitly', () => {
  const records = reviewMetadata.createAdoptionReviewRecordIndex([
    {
      id: 'record-1',
      recordId: 'legacy-1',
      applicationId: 'application-1',
      applicantName: '申请人',
    },
  ])
  assert.equal(records.get('application-1').id, 'record-1')
  assert.equal(records.get('legacy-1').applicationId, 'application-1')

  const juryItem = {
    applicationId: 'application-jury',
    reviewItemId: 'review-jury',
    phase: 'jury',
    reviewStatus: 'pending',
    reviewerRole: 'reviewer',
  }
  assert.equal(
    reviewMetadata.createAdoptionReviewQueueCard(juryItem, null).statusText,
    '待评审团确认',
  )
})

test('adoption review list shares typed page/card metadata without local mock models or any', async () => {
  const page = await fs.readFile(
    path.join(ROOT, 'packages/adoption/pages/review/list/index.vue'),
    'utf8',
  )
  const metadataPath = path.join(ROOT, 'packages/adoption/services/reviewListMetadata.ts')
  const metadata = await fs.readFile(metadataPath, 'utf8')
  const pageMetadata = await import(`${pathToFileURL(metadataPath).href}?test=${Date.now()}`)
  const first = pageMetadata.createAdoptionReviewListPageState(() => null)
  const second = pageMetadata.createAdoptionReviewListPageState(() => null)

  assert.deepEqual(first.tabs, [
    { key: 'pending', label: '待审核' },
    { key: 'reviewed', label: '已审核' },
  ])
  first.tabs[0].label = 'local'
  first.items.pending.push({ applicationId: 'local' })
  assert.equal(second.tabs[0].label, '待审核')
  assert.deepEqual(second.items.pending, [])
  assert.equal(pageMetadata.isAdoptionReviewTab('reviewed'), true)
  assert.equal(pageMetadata.isAdoptionReviewTab('other'), false)

  for (const source of [page, metadata]) {
    assert.doesNotMatch(source, /\bany\b/)
    assert.doesNotMatch(source, /Record<string,\s*any>/)
  }
  assert.match(page, /data\(\):\s*AdoptionReviewListPageState/)
  assert.match(
    page,
    /createAdoptionReviewQueueCard\(item, records\.get\(item\.applicationId\) \?\? null\)/,
  )
  assert.match(
    page,
    /createAdoptionReviewRecordIndex\(getAdoptionRecords\(\{ includeDemo: false \}\)\)/,
  )
  assert.doesNotMatch(page, /function\s+(?:modeForItem|statusMeta|cardForItem)\s*\(/)
  assert.match(metadata, /Record<AdoptionReviewTab, AdoptionReviewQueueCardMetadata\[]>/)
})

test('adoption jury detail consumes shared jury metadata without explicit any types', async () => {
  const juryPage = await fs.readFile(
    path.join(ROOT, 'packages/adoption/pages/jury/detail/index.vue'),
    'utf8',
  )
  const juryMock = await fs.readFile(path.join(ROOT, 'utils/juryMock.ts'), 'utf8')
  const juryStorage = await fs.readFile(path.join(ROOT, 'utils/juryStorage.ts'), 'utf8')

  assert.doesNotMatch(juryPage, /\bany\b/)
  assert.doesNotMatch(juryPage, /\bas any\b/)
  assert.match(juryPage, /data\(\):\s*JuryDetailPageState/)
  assert.match(
    juryPage,
    /type JuryReviewActionResult\s*=\s*JuryReviewActionSuccess\s*\|\s*JuryReviewActionFailure/,
  )
  assert.match(
    juryPage,
    /import type \{ JuryEvidence, JuryItem, JuryPet, JuryVote \} from ['"]@\/utils\/juryMock\.ts['"]/,
  )
  assert.match(juryMock, /export interface JuryItem extends JsonRecord/)
  assert.match(juryMock, /export interface JuryYard extends JsonRecord/)
  assert.match(
    juryStorage,
    /import type \{ JuryItem, JuryItemStatus, JuryReviewType, JuryVote \} from ['"]\.\/juryMock\.ts['"]/,
  )
  assert.doesNotMatch(juryStorage, /export interface JuryItem(?:\s|\{)/)
})

test('rescue application form mocks expose a typed field schema and independent page state', () => {
  const fields = rescueMockData.RESCUE_APPLICATION_HELP_FIELD_MOCKS
  const first = rescueMockData.createRescueApplicationHelpFieldMocks()
  const second = rescueMockData.createRescueApplicationHelpFieldMocks()
  assert.deepEqual(
    fields.map((field) => field.key),
    ['amount', 'receiver', 'name', 'age', 'identity', 'location'],
  )
  assert.ok(
    fields.every((field) => typeof field.label === 'string' && typeof field.value === 'string'),
  )
  first[0].value = '100'
  assert.equal(second[0].value, '')
  assert.equal(fields[0].value, '')
})
