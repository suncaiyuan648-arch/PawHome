'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
let tempRoot
let homeFeedMocks

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-home-feed-metadata-'))
  const utilsRoot = path.join(tempRoot, 'utils')
  await fs.mkdir(utilsRoot, { recursive: true })
  await fs.copyFile(
    path.join(ROOT, 'utils/homeFeedMockData.ts'),
    path.join(utilsRoot, 'homeFeedMockData.ts'),
  )
  homeFeedMocks = await import(
    `${pathToFileURL(path.join(utilsRoot, 'homeFeedMockData.ts')).href}?test=${Date.now()}`
  )
})

after(async () => {
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

test('home feed mock cards have stable identity and the complete card display metadata', () => {
  const cards = homeFeedMocks.createHomeFeedMockCards()
  assert.equal(cards.length, 50)
  assert.equal(new Set(cards.map((card) => card.id)).size, cards.length)
  for (const card of cards) {
    assert.equal(typeof card.id, 'string')
    assert.equal(typeof card.cover, 'string')
    assert.equal(typeof card.distance, 'string')
    assert.equal(typeof card.district, 'string')
    assert.equal(typeof card.title, 'string')
    assert.equal(typeof card.liked, 'boolean')
    assert.equal(typeof card.likes, 'number')
  }
  assert.equal(homeFeedMocks.createHomeFeedMockCards(3).length, 3)
})

test('home announcements, tabs, and yard cards expose valid metadata and clone per page state', () => {
  const announcements = homeFeedMocks.createHomeAnnouncementMocks()
  const announcementCopy = homeFeedMocks.createHomeAnnouncementMocks()
  assert.equal(announcements.length, 10)
  assert.ok(announcements.every((item) => item.id && item.text))
  announcements[0].text = 'page-local edit'
  assert.notEqual(announcementCopy[0].text, 'page-local edit')
  assert.notEqual(homeFeedMocks.HOME_ANNOUNCEMENT_MOCKS[0].text, 'page-local edit')

  assert.deepEqual(
    homeFeedMocks.createHomeFeedTabMocks().map((tab) => tab.key),
    ['dynamic', 'yard', 'joined'],
  )
  const yards = homeFeedMocks.createHomeYardCardMocks()
  assert.deepEqual(
    yards.map((yard) => yard.variant),
    ['badges', 'org'],
  )
})

test('home page and feed card no longer declare any-typed state or mock values', async () => {
  for (const file of [
    'pages/index/index.vue',
    'components/dynamic/FeedCard.vue',
    'utils/homeFeedMockData.ts',
  ]) {
    const source = await fs.readFile(path.join(ROOT, file), 'utf8')
    assert.doesNotMatch(source, /\bany\b/, `${file} still contains an any annotation`)
    assert.doesNotMatch(source, /Record\s*<\s*string\s*,\s*any\s*>/)
  }
})
