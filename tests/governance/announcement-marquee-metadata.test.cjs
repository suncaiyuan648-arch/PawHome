'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
let metadata

before(async () => {
  metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'utils/announcementMetadata.ts')).href}?test=${Date.now()}`
  )
})

test('announcement payload extraction accepts arrays, JSON and nested API envelopes', () => {
  const first = { id: 'first', text: '第一条' }
  const second = { id: 'second', text: '第二条' }
  assert.deepEqual(metadata.extractAnnouncementItems([first]), [first])
  assert.deepEqual(
    metadata.extractAnnouncementItems(JSON.stringify({ data: { announcements: [second] } })),
    [second],
  )
  assert.deepEqual(metadata.extractAnnouncementItems({ items: [] }), [])
  assert.deepEqual(metadata.extractAnnouncementItems('malformed response'), ['malformed response'])
  assert.deepEqual(metadata.extractAnnouncementItems(null), [])
  assert.deepEqual(metadata.extractAnnouncementItems(0), [])
})

test('announcement normalization narrows unknown input and retains source metadata', () => {
  const source = { _id: 42, content: '  欢迎来小院  ', feedingWeightJin: 4 }
  const normalized = metadata.normalizeAnnouncement(source)
  assert.deepEqual(normalized, {
    id: '42',
    text: '欢迎来小院',
    raw: source,
  })
  assert.deepEqual(metadata.normalizeAnnouncement('  一条旧公告  '), {
    id: '一条旧公告',
    text: '一条旧公告',
    raw: { text: '  一条旧公告  ' },
  })
  assert.equal(metadata.normalizeAnnouncement({ title: '  ' }), null)
  assert.equal(metadata.normalizeAnnouncement(null), null)
})

test('feeding weight prefers structured metadata and converts legacy copy to jin', () => {
  assert.equal(
    metadata.getAnnouncementFeedingWeightJin({ feedingWeightJin: 40, text: '投喂4斤' }),
    40,
  )
  assert.equal(metadata.getAnnouncementFeedingWeightJin({ text: '投粮4公斤' }), 8)
  assert.equal(metadata.getAnnouncementFeedingWeightJin({ content: '投喂250克' }), 0.5)
  assert.equal(metadata.getAnnouncementFeedingWeightJin({ title: '投粮3斤' }), 3)
  assert.equal(metadata.getAnnouncementFeedingWeightJin({ text: '普通公告' }), null)
})

test('marquee consumes shared metadata, declares its emits and has no explicit any escape hatch', async () => {
  const component = await fs.readFile(
    path.join(ROOT, 'components/PawAnnouncementMarquee.vue'),
    'utf8',
  )
  const homeMocks = await fs.readFile(path.join(ROOT, 'utils/homeFeedMockData.ts'), 'utf8')
  const yardMocks = await fs.readFile(path.join(ROOT, 'utils/yardMock.ts'), 'utf8')
  assert.doesNotMatch(component, /\bany\b/)
  assert.doesNotMatch(component, /Record\s*<\s*string\s*,\s*any\s*>/)
  assert.match(component, /items:\s*\{\s*type:\s*Array\s+as\s+PropType<AnnouncementInput\[]>/)
  assert.match(component, /queued:\s*\(/)
  assert.match(component, /finished:\s*\(/)
  assert.match(component, /click:\s*\(/)
  assert.match(homeMocks, /HomeAnnouncementMockMetadata\s*=\s*AnnouncementMetadata/)
  assert.match(yardMocks, /YardAnnouncementItem\s*=\s*AnnouncementMetadata/)
})
