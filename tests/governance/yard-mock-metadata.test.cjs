'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
let tempRoot
let yardMock
let petDetailMetadata
let yardReviewFeedMetadata
let yardCreateMetadata

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-yard-mock-metadata-'))
  const utilsRoot = path.join(tempRoot, 'utils')
  await fs.mkdir(utilsRoot, { recursive: true })
  for (const file of ['yardMock.ts', 'petDetailMetadata.ts']) {
    await fs.copyFile(path.join(ROOT, 'utils', file), path.join(utilsRoot, file))
  }
  yardMock = await import(
    `${pathToFileURL(path.join(utilsRoot, 'yardMock.ts')).href}?test=${Date.now()}`
  )
  petDetailMetadata = await import(
    `${pathToFileURL(path.join(utilsRoot, 'petDetailMetadata.ts')).href}?test=${Date.now()}`
  )
  yardReviewFeedMetadata = await import(
    `${pathToFileURL(path.join(ROOT, 'utils/yardReviewFeedMetadata.ts')).href}?test=${Date.now()}`
  )
  yardCreateMetadata = await import(
    `${pathToFileURL(path.join(ROOT, 'utils/yardCreateMetadata.ts')).href}?test=${Date.now()}`
  )
})

after(async () => {
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

test('yard fixtures expose explicit pet, order, announcement, rank, and comment metadata', () => {
  const yard = yardMock.getPawHomeYardMock()
  const petIds = new Set(yard.pets.map((pet) => pet.id))
  assert.ok(yard.pets.length > 0)
  assert.ok(yard.feedingOrders.length > 0)
  assert.ok(yard.announcementItems.every((item) => item.id && item.text))
  assert.ok(
    yard.rankItems.every(
      (item) => item.id && item.pawId && item.text && item.avatar && item.rankTitle,
    ),
  )
  assert.ok(
    yard.comments.every((comment) => comment.id && comment.author.name && comment.author.avatar),
  )
  for (const order of yard.feedingOrders) {
    assert.ok(
      order.petIds.every((petId) => petIds.has(petId)),
      `unknown pet association in ${order.id}`,
    )
  }
})

test('rank ticker metadata narrows shared yard ranks and retains string-label compatibility', () => {
  const yard = yardMock.getPawHomeYardMock()
  const firstRank = yard.rankItems[0]
  const rows = yardMock.normalizeYardRankScrollItems([
    firstRank,
    '历史用户名',
    { text: 12, level: '3', avatar: '/rank.png', extra: 'not projected' },
    null,
  ])

  assert.equal(yardMock.isYardRankItem(firstRank), true)
  assert.equal(yardMock.isYardRankItem({ id: 'rank-incomplete', text: '不完整' }), false)
  assert.deepEqual(rows[0], firstRank)
  assert.deepEqual(rows[1], { id: 1, text: '历史用户名' })
  assert.deepEqual(rows[2], { id: 2, text: '12', level: 3, avatar: '/rank.png' })
  assert.equal(rows.length, 3)
  rows[0].text = '页面局部修改'
  assert.notEqual(firstRank.text, '页面局部修改')
})

test('rank ticker components consume shared metadata and declare validated emits without any', async () => {
  const seamless = await fs.readFile(path.join(ROOT, 'components/SeamlessScroll.vue'), 'utf8')
  const strip = await fs.readFile(path.join(ROOT, 'components/yard/YardFeedRankStrip.vue'), 'utf8')
  const yardMetadata = await fs.readFile(path.join(ROOT, 'utils/yardMock.ts'), 'utf8')

  for (const source of [seamless, strip]) {
    assert.doesNotMatch(source, /\bany\b/)
    assert.doesNotMatch(source, /Record\s*<\s*string\s*,\s*any\s*>/)
  }
  assert.match(seamless, /PropType<YardRankScrollInput\[\]>/)
  assert.match(seamless, /data\(\):\s*SeamlessScrollState/)
  assert.match(seamless, /normalizeYardRankScrollItems\(this\.items\)/)
  assert.match(seamless, /['"]user-click['"]:\s*\(item: YardRankScrollItem\)/)
  assert.match(strip, /PropType<YardRankItem\[\]>/)
  assert.match(strip, /['"]rank-user['"]:\s*\(item: YardRankItem\)/)
  assert.match(strip, /leaderboard:\s*\(\)\s*=>\s*true/)
  assert.match(yardMetadata, /interface YardRankScrollItem/)
  assert.match(yardMetadata, /function isYardRankItem/)
})

test('pet detail fallback and strip fixtures are complete and cloned per consumer', () => {
  const firstPet = petDetailMetadata.createPetDetailFallbackMock()
  const secondPet = petDetailMetadata.createPetDetailFallbackMock()
  assert.equal(typeof firstPet.name, 'string')
  assert.equal(typeof firstPet.statusLabel, 'string')
  assert.ok(firstPet.tags.length > 0)
  assert.ok(firstPet.gallery.length > 0)
  firstPet.tags.push('page-local')
  assert.ok(!secondPet.tags.includes('page-local'))

  const firstStrip = petDetailMetadata.createPetDetailStripMocks()
  const secondStrip = petDetailMetadata.createPetDetailStripMocks()
  assert.equal(firstStrip.length, 8)
  assert.equal(new Set(firstStrip.map((item) => item.id)).size, firstStrip.length)
  firstStrip[0].avatar = 'page-local.png'
  assert.notEqual(secondStrip[0].avatar, 'page-local.png')

  const normalized = petDetailMetadata.normalizePetDetailRecord(
    {
      animalId: 'animal-1',
      name: '小白',
      avatar: '/animal.png',
      description: '等待领养',
      gallery: [{ url: '/one.png' }, '/two.png', { src: '/three.png' }],
      tags: ['温顺', 1],
      foodJin: '3.5',
      customMetadata: 'preserved',
    },
    '/fallback.png',
  )
  assert.ok(normalized)
  assert.equal(normalized.id, 'animal-1')
  assert.equal(normalized.name, '小白')
  assert.equal(normalized.desc, '等待领养')
  assert.deepEqual(normalized.gallery, ['/one.png', '/two.png', '/three.png'])
  assert.deepEqual(normalized.tags, ['温顺'])
  assert.equal(normalized.foodJin, 3.5)
  assert.equal(normalized.customMetadata, 'preserved')
  assert.equal(
    petDetailMetadata.normalizePetDetailRecord({ name: '缺少标识' }, '/fallback.png'),
    null,
  )
  assert.equal(petDetailMetadata.normalizePetDetailRecord(null, '/fallback.png'), null)

  const sourcePets = yardMock.getPawHomeYardMock().pets
  const sourceStatus = sourcePets[3].statusLabel
  const variantPets = petDetailMetadata.createPetDetailFigmaVariantPets(sourcePets)
  assert.notEqual(variantPets, sourcePets)
  assert.equal(sourcePets[3].statusLabel, sourceStatus)
  assert.equal(variantPets[3].avatar, '/static/figma/adoption-flow/pet-hero.png')
  assert.equal(variantPets[3].statusLabel, '已云养')
  assert.notEqual(variantPets[3].gallery, sourcePets[3].gallery)
  assert.notEqual(variantPets[3].tags, sourcePets[3].tags)
})

test('yard review feed fixtures have discriminated reply metadata and isolated mutable copies', () => {
  const first = yardReviewFeedMetadata.createYardReviewFeedMocks()
  const second = yardReviewFeedMetadata.createYardReviewFeedMocks()
  assert.equal(first.replies.length, 6)
  assert.equal(first.throwRecords.length, 4)
  assert.ok(first.replies.every((reply) => reply.id && reply.name && reply.avatar))
  assert.ok(first.throwRecords.every((record) => record.id && record.name && record.level > 0))
  const voiceReply = first.replies.find((reply) => reply.kind === 'voice')
  assert.ok(voiceReply)
  assert.ok(voiceReply.voiceBars.length > 0)
  assert.ok(first.main.mediaUrls.length > 0)

  first.main.mediaUrls[0] = 'page-local.png'
  first.replies[0].likes += 1
  voiceReply.voiceBars.push(3)
  first.throwRecords[0].name = 'page-local'
  assert.notEqual(second.main.mediaUrls[0], 'page-local.png')
  assert.notEqual(second.replies[0].likes, first.replies[0].likes)
  assert.notEqual(
    second.replies.find((reply) => reply.kind === 'voice').voiceBars.length,
    voiceReply.voiceBars.length,
  )
  assert.notEqual(second.throwRecords[0].name, 'page-local')
})

test('yard creation preview address is a shared typed fixture and recorder results are narrowed', async () => {
  const firstAddress = yardCreateMetadata.createYardCreateRecordedAddressMock()
  const secondAddress = yardCreateMetadata.createYardCreateRecordedAddressMock()
  assert.equal(firstAddress.id, 'figma-recorded')
  assert.deepEqual(firstAddress.regionParts, [])
  firstAddress.regionParts.push('页面临时修改')
  assert.deepEqual(secondAddress.regionParts, [])
  assert.deepEqual(yardCreateMetadata.YARD_CREATE_RECORDED_ADDRESS_MOCK.regionParts, [])

  assert.deepEqual(
    yardCreateMetadata.normalizeYardRecorderStopMetadata({
      duration: '2500',
      tempFilePath: '/tmp/record.mp3',
    }),
    { durationMs: 2500, tempFilePath: '/tmp/record.mp3' },
  )
  assert.deepEqual(
    yardCreateMetadata.normalizeYardRecorderStopMetadata({ duration: 'bad', tempFilePath: 3 }),
    {
      durationMs: null,
      tempFilePath: '',
    },
  )

  const page = await fs.readFile(path.join(ROOT, 'packages/yard/pages/create/index.vue'), 'utf8')
  const addressPicker = await fs.readFile(
    path.join(ROOT, 'components/address/PawAddressPickerCard.vue'),
    'utf8',
  )
  assert.doesNotMatch(page, /\bany\b/)
  assert.doesNotMatch(page, /\bas any\b/)
  assert.match(page, /data\(\):\s*YardCreatePageState/)
  assert.match(page, /createYardCreateRecordedAddressMock\(\)/)
  assert.doesNotMatch(addressPicker, /\bany\b/)
  assert.match(addressPicker, /PropType<AddressRecord \| null>/)
  assert.match(addressPicker, /data\(\):\s*PawAddressPickerCardState/)
})

test('yard review feed consumes shared fixtures, declares events, and has no explicit any types', async () => {
  const source = await fs.readFile(path.join(ROOT, 'components/yard/YardReviewFeed.vue'), 'utf8')
  assert.doesNotMatch(source, /\bany\b/)
  assert.doesNotMatch(source, /Record\s*<\s*string\s*,\s*any\s*>/)
  assert.match(source, /data\(\):\s*YardReviewFeedState/)
  assert.match(source, /createYardReviewFeedMocks/)
  for (const event of ['composer-voice', 'composer-pick-image', 'tab-change', 'reply-send']) {
    assert.match(source, new RegExp(`['"]${event}['"]\\s*:`), `${event} must be declared`)
  }
})

test('yard and pet detail display components no longer use any annotations', async () => {
  for (const file of [
    'components/PawYardDetailFigma.vue',
    'packages/animal/pages/detail/components/PawPetDetailFigma.vue',
    'packages/animal/pages/detail/index.vue',
    'utils/petDetailMetadata.ts',
  ]) {
    const source = await fs.readFile(path.join(ROOT, file), 'utf8')
    assert.doesNotMatch(source, /\bany\b/, `${file} still contains an any annotation`)
  }
})

test('pet roster consumes shared yard and owner metadata without any annotations', async () => {
  const roster = await fs.readFile(path.join(ROOT, 'components/PawPetRoster.vue'), 'utf8')
  const metadata = await fs.readFile(path.join(ROOT, 'utils/petRosterMockApi.ts'), 'utf8')
  assert.doesNotMatch(roster, /\bany\b/)
  assert.doesNotMatch(roster, /Record\s*<\s*string\s*,\s*any\s*>/)
  assert.match(roster, /data\(\):\s*PawPetRosterState/)
  assert.match(roster, /type\s*\{\s*YardPet/)
  assert.match(roster, /PET_ROSTER_(?:PENDING|ASSIGNED)_OWNER_MOCK/)
  assert.match(metadata, /interface\s+PetRosterCardOwner/)
  assert.match(metadata, /PET_ROSTER_PENDING_OWNER_MOCK/)
  assert.match(metadata, /PET_ROSTER_ASSIGNED_OWNER_MOCK/)
})
