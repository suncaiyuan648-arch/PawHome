'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('adoption evidence fixtures and proof comments use normalized clone-safe metadata', async () => {
  const metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'packages/adoption/services/evidenceMetadata.ts')).href}?test=${Date.now()}`
  )
  const firstState = metadata.createAdoptionEvidencePageState()
  assert.deepEqual(firstState, {
    story: '',
    selectedPhotos: ['', ''],
    proofList: [],
    examples: [metadata.ADOPTION_EVIDENCE_EXAMPLE_IMAGE, metadata.ADOPTION_EVIDENCE_EXAMPLE_IMAGE],
  })
  firstState.examples[0] = 'local-change'
  firstState.selectedPhotos[0] = 'local-photo'
  const secondState = metadata.createAdoptionEvidencePageState()
  assert.equal(secondState.examples[0], metadata.ADOPTION_EVIDENCE_EXAMPLE_IMAGE)
  assert.equal(secondState.selectedPhotos[0], '')

  assert.deepEqual(
    metadata.normalizeAdoptionEvidenceProof(
      {
        proofId: 'proof-a',
        nickname: '小林',
        userAvatar: '/avatar.png',
        content: '我在现场见过。',
        createdAtText: '昨天 20:45',
        city: '长沙',
        likeCount: '3',
        liked: false,
        level: '2',
      },
      2,
    ),
    {
      id: 'proof-a',
      name: '小林',
      level: 2,
      avatar: '/avatar.png',
      text: '我在现场见过。',
      meta: '昨天 20:45　长沙',
      likes: 3,
      liked: false,
    },
  )
  assert.deepEqual(metadata.normalizeAdoptionEvidenceProof(null, 0), {
    id: 'proof-1',
    name: '证实人',
    level: 1,
    avatar: metadata.ADOPTION_EVIDENCE_EXAMPLE_IMAGE,
    text: '已提交证实信息。',
    meta: '刚刚',
    likes: 0,
    liked: true,
  })
  assert.equal(
    metadata.readAdoptionEvidenceProofEntries({
      proofList: [{ id: 'a' }],
      evidenceList: [{ id: 'b' }],
    })[0].id,
    'a',
  )
  assert.equal(
    metadata.readAdoptionEvidenceProofEntries({ evidenceList: [{ id: 'b' }] })[0].id,
    'b',
  )
})

test('adoption evidence route records, image picker results, and photo updates are narrowed', async () => {
  const metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'packages/adoption/services/evidenceMetadata.ts')).href}?test=${Date.now()}`
  )
  assert.deepEqual(
    metadata.readAdoptionEvidenceDraft({
      confirmStory: ' 真实经历 ',
      proofPhotos: ['/before.png', '/after.png', '/extra.png'],
    }),
    {
      story: ' 真实经历 ',
      photos: ['/before.png', '/after.png'],
    },
  )
  assert.deepEqual(metadata.readAdoptionEvidenceDraft(null), { story: '', photos: ['', ''] })
  assert.deepEqual(
    metadata.readChosenEvidenceMediaPaths({
      tempFiles: [{ tempFilePath: '/media-a.png' }, {}, null],
    }),
    ['/media-a.png'],
  )
  assert.deepEqual(
    metadata.readChosenEvidenceMediaPaths({ tempFilePaths: ['/image-a.png', null] }),
    ['/image-a.png'],
  )
  assert.deepEqual(metadata.updateAdoptionEvidencePhoto(['/before.png', '/after.png'], 1, ''), [
    '/before.png',
    '',
  ])
  assert.deepEqual(metadata.normalizeAdoptionEvidencePhotos([42, '/after.png']), ['', '/after.png'])
})

test('adoption evidence component consumes explicit metadata and event types without any', async () => {
  const source = await fs.readFile(
    path.join(ROOT, 'packages/adoption/components/PawAdoptionEvidence.vue'),
    'utf8',
  )
  assert.doesNotMatch(source, /\bany\b/)
  assert.doesNotMatch(source, /as\s+any/)
  assert.doesNotMatch(source, /Record<string,\s*any>/)
  assert.match(source, /data\(\):\s*AdoptionEvidencePageState/)
  assert.match(source, /readAdoptionEvidenceProofEntries\(record\)/)
  assert.match(source, /choosePhoto\(index:\s*number\)/)
  assert.match(source, /submitted:\s*\(payload:\s*AdoptionEvidenceSubmitPayload\)/)
})
