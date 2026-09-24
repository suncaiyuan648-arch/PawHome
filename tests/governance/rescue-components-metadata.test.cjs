'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const METADATA_PATH = path.join(ROOT, 'packages/rescue/services/componentMetadata.ts')
const STORAGE_PATH = path.join(ROOT, 'utils/rescueStorage.ts')
const COMPONENTS = [
  'packages/rescue/components/RescueApplicantProgress.vue',
  'packages/rescue/components/RescueDetailView.vue',
  'packages/rescue/components/RescueFundList.vue',
  'packages/rescue/components/RescueProofForm.vue',
  'packages/rescue/components/RescueProofList.vue',
]
const PAGES = [
  'packages/rescue/pages/detail/index.vue',
  'packages/rescue/pages/proof/create/index.vue',
  'packages/rescue/pages/proof/list/index.vue',
  'packages/rescue/pages/progress/index.vue',
  'packages/rescue/pages/result/index.vue',
]

test('rescue component metadata creates fresh fund and proof form states', async () => {
  const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?state=${Date.now()}`)
  const firstFund = metadata.createRescueFundListState()
  const secondFund = metadata.createRescueFundListState()
  const firstForm = metadata.createRescueProofFormState()
  const secondForm = metadata.createRescueProofFormState()

  assert.deepEqual(firstFund, { rescueItems: [], activeStatus: 'pending' })
  assert.deepEqual(firstForm, {
    name: '',
    relation: '',
    note: '',
    idNo: '',
    agreementChecked: false,
    submitting: false,
  })
  firstFund.rescueItems.push({ id: 'local' })
  firstForm.name = 'local'
  assert.deepEqual(secondFund.rescueItems, [])
  assert.equal(secondForm.name, '')
})

test('rescue application status presentation is whitelisted and returned as a copy', async () => {
  const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?status=${Date.now()}`)
  const pending = metadata.getRescueApplicationStatusPresentation('platform_pending')

  assert.deepEqual(pending, { text: '平台审核中', tone: 'pending' })
  assert.deepEqual(metadata.getRescueApplicationStatusPresentation('platform_approved'), {
    text: '平台审核成功',
    tone: 'success',
  })
  assert.equal(metadata.getRescueApplicationStatusPresentation('future-status'), null)
  assert.equal(
    metadata.getRescueApplicationStatusPresentation({ status: 'platform_pending' }),
    null,
  )
  pending.text = 'local'
  assert.equal(
    metadata.getRescueApplicationStatusPresentation('platform_pending').text,
    '平台审核中',
  )
})

test('rescue record routes and result IDs narrow unknown page inputs without weakening route contracts', async () => {
  const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?routes=${Date.now()}`)
  assert.deepEqual(metadata.resolveRescueRecordRoute({ rescueId: 'rescue-1' }, 'rescue.detail'), {
    ok: true,
    rescueId: 'rescue-1',
  })
  assert.deepEqual(
    metadata.resolveRescueRecordRoute(
      { rescueId: 'rescue-1', extra: 'unexpected' },
      'rescue.progress',
    ),
    {
      ok: false,
      loadState: 'invalid-params',
    },
  )
  assert.deepEqual(metadata.resolveRescueRecordRoute({ rescueId: 42 }, 'rescue.proof.list'), {
    ok: false,
    loadState: 'invalid-params',
  })
  assert.deepEqual(metadata.resolveRescueRecordRoute({}, 'rescue.proof.create'), {
    ok: false,
    loadState: 'missing-id',
  })
  assert.deepEqual(
    metadata.resolveRescueRecordLoadRoute({ rescueId: '%E0%A4%A' }, 'rescue.progress'),
    {
      ok: false,
      loadState: 'invalid-params',
    },
  )
  assert.equal(metadata.rescueResultIdFromOptions({ rescueId: 42 }), '42')
  assert.equal(metadata.rescueResultIdFromOptions(null), '')
  assert.equal(metadata.createRescueRecordPageState().record, null)
  assert.equal(metadata.createRescueProgressPageState().loadState, 'idle')
  assert.deepEqual(metadata.createRescueResultPageState(), { rescueId: '' })
})

test('rescue applicant information rows are normalized to the shared display contract', async () => {
  const storage = await import(`${pathToFileURL(STORAGE_PATH).href}?rows=${Date.now()}`)
  const record = storage.normalizeRescueRecord({
    id: 'rescue-display-1',
    applicantRows: [
      { label: 123, value: 456, source: 'legacy' },
      { label: null, value: null },
      'not-a-row',
    ],
  })

  assert.deepEqual(record.applicantRows, [
    { label: '123', value: '456', source: 'legacy' },
    { label: '', value: '' },
  ])
})

test('rescue demo fixtures use a typed seed contract and normalize into shared records', async () => {
  const storage = await import(`${pathToFileURL(STORAGE_PATH).href}?fixtures=${Date.now()}`)
  const normalized = storage.normalizeRescueRecord({
    id: 'rescue-proof-1',
    proofList: [
      {
        userName: '小明',
        relation: '邻居',
        userAvatar: '/neighbor.png',
        note: '现场看过',
        likeCount: 3,
        liked: true,
      },
    ],
  })
  assert.deepEqual(
    normalized.proofList.map(({ name, relationship, avatar, story, likes, liked }) => ({
      name,
      relationship,
      avatar,
      story,
      likes,
      liked,
    })),
    [
      {
        name: '小明',
        relationship: '邻居',
        avatar: '/neighbor.png',
        story: '现场看过',
        likes: 3,
        liked: true,
      },
    ],
  )
  const previousUni = globalThis.uni
  globalThis.uni = { getStorageSync: () => '' }

  try {
    const records = storage.getRescueRecords()
    assert.equal(records.length, 14)
    assert.equal(records[0].applicationType, 'rescue')
    assert.equal(records[0].proofList[0].level, 1)
    assert.equal(records[0].proofList[0].likes, 0)
  } finally {
    if (previousUni === undefined) delete globalThis.uni
    else globalThis.uni = previousUni
  }
})

test('rescue detail components reuse shared record and proof types without any escape hatches', async () => {
  const sources = await Promise.all(
    COMPONENTS.map((relative) => fs.readFile(path.join(ROOT, relative), 'utf8')),
  )
  const pages = await Promise.all(
    PAGES.map((relative) => fs.readFile(path.join(ROOT, relative), 'utf8')),
  )
  const metadata = await fs.readFile(METADATA_PATH, 'utf8')
  const storage = await fs.readFile(STORAGE_PATH, 'utf8')
  const proof = await fs.readFile(path.join(ROOT, 'packages/rescue/services/proof.ts'), 'utf8')

  for (const source of [...sources, ...pages, metadata, storage, proof]) {
    assert.doesNotMatch(source, /\bany\b/)
    assert.doesNotMatch(source, /Record<string,\s*any>|\bas\s+any\b/)
  }
  assert.match(sources[1], /PropType<RescueRecord \| null>/)
  assert.match(sources[2], /data\(\): RescueFundListState/)
  assert.match(sources[3], /data\(\): RescueProofFormState/)
  assert.match(sources[4], /NormalizedRescueProof/)
  assert.match(
    await fs.readFile(path.join(ROOT, 'contracts/applications.ts'), 'utf8'),
    /applicantRows: RescueApplicantInfoRow\[\]/,
  )
  assert.match(
    await fs.readFile(path.join(ROOT, 'contracts/applications.ts'), 'utf8'),
    /export interface RescueRecordMock/,
  )
  assert.match(
    storage,
    /function createDemoRescue\(\s*index: number,\s*status: RescueStatus,\s*statusText: string,?\s*\): RescueRecordMock/,
  )
  assert.match(storage, /const DEMO_RESCUES: RescueRecordMock\[\]/)
  assert.match(proof, /export interface NormalizedRescueProof/)
  assert.equal(
    pages.filter((source) =>
      /data\(\)\s*\{\s*return createRescue(?:Record|Progress|Result)PageState\(\)/.test(source),
    ).length,
    5,
  )
  assert.doesNotMatch(pages.join('\n'), /Record<string,\s*any>/)
  assert.match(pages[0], /onLoad\(options: unknown/)
  assert.match(pages[1], /resolveRescueRecordLoadRoute\(options, 'rescue\.proof\.create'\)/)
  assert.match(pages[3], /resolveRescueRecordLoadRoute\(options, 'rescue\.progress'\)/)
  assert.match(pages[4], /rescueResultIdFromOptions\(options\)/)
})
