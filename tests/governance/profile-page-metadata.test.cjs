'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('profile fixtures use explicit metadata and return isolated mutable page state', async () => {
  const metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'packages/account/services/profilePageMetadata.ts')).href}?test=${Date.now()}`
  )
  const first = metadata.createProfilePageMockMetadata()
  const second = metadata.createProfilePageMockMetadata()

  assert.equal(first.reviewList.length, 1)
  assert.equal(first.profileTimeline.length, 4)
  assert.equal(first.feedList.length, 0)
  assert.equal(first.adoptList.length, 2)
  assert.equal(first.adoptList[0].cats.length, 5)
  assert.equal(first.donateList.length, 3)
  assert.deepEqual(
    first.joinedList.map((item) => item.variant),
    ['badges', 'org'],
  )
  assert.equal(first.joinedList[0].gallery.length, 4)

  first.profileTags.push('page-local')
  first.stats.fans = 0
  first.adoptList[0].cats[0].name = 'changed'
  first.donateList[0].topBadge.notify = 0
  first.joinedList[0].badges.push('page-local')
  first.joinedList[0].gallery[0].caption = 'page-local'
  first.yardList[0].gallery[0].caption = 'yard-local'
  assert.deepEqual(second.profileTags, ['男生', '安徽'])
  assert.equal(second.stats.fans, 185)
  assert.equal(second.adoptList[0].cats[0].name, '小灰灰')
  assert.equal(second.donateList[0].topBadge.notify, 3)
  assert.deepEqual(second.joinedList[0].badges, ['6只猫咪', '已成立2个月', '入驻4人'])
  assert.equal(second.joinedList[0].gallery[0].caption, '开饭了开饭了开饭')
  assert.notEqual(first.joinedList[0].gallery, first.yardList[0].gallery)

  const feed = metadata.createProfileFeedMocks('小明', '/avatar.png')
  assert.equal(feed.length, 4)
  assert.ok(feed.every((item) => item.userName === '小明' && item.userAvatar === '/avatar.png'))
})

test('profile route, record, stats, and action boundaries narrow unknown data', async () => {
  const metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'packages/account/services/profilePageMetadata.ts')).href}?test=${Date.now()}`
  )
  assert.deepEqual(
    metadata.normalizeProfileRouteOptions({
      userId: 'user%3A1',
      nickname: '小%20明',
      state: 'dynamic-long',
    }),
    {
      userId: 'user:1',
      pawId: '',
      nickname: '小 明',
      avatar: '',
      state: 'dynamic-long',
    },
  )
  assert.equal(metadata.normalizeProfileRouteOptions({ userId: '%E0%A4%A' }).userId, '%E0%A4%A')
  assert.equal(metadata.normalizeProfileRouteOptions(null).userId, '')
  assert.deepEqual(
    metadata.normalizeProfileStats(
      { fans: '12', likes: Number.NaN, extra: 99 },
      {
        follow: 2,
        fans: 185,
        likes: 185,
        donate: 13,
      },
    ),
    { follow: 2, fans: 12, likes: 185, donate: 13 },
  )
  assert.deepEqual(
    metadata.normalizePublicProfileRecord({
      userId: 'u-1',
      nickname: '小明',
      tags: ['志愿者', 7],
      verified: true,
      level: 2,
    }),
    {
      userId: 'u-1',
      nickname: '小明',
      tags: ['志愿者'],
      verified: true,
      level: 2,
    },
  )
  assert.deepEqual(
    metadata.normalizePublicProfileRecord({ userId: 'u-2', stats: { fans: 12, unknown: 3 } }).stats,
    { fans: 12 },
  )
  assert.equal(metadata.normalizePublicProfileRecord({ arbitrary: true }), null)
  assert.equal(metadata.resolveProfileActionKey({ key: 'edit' }), 'edit')
  assert.equal(metadata.resolveProfileActionKey({ key: 'unknown' }), null)
  const cyclicAction = {}
  cyclicAction.key = cyclicAction
  assert.equal(metadata.resolveProfileActionKey(cyclicAction), null)
})

test('profile page consumes typed metadata and has no explicit any escape hatch', async () => {
  const page = await fs.readFile(
    path.join(ROOT, 'packages/account/pages/profile/index.vue'),
    'utf8',
  )
  const metadata = await fs.readFile(
    path.join(ROOT, 'packages/account/services/profilePageMetadata.ts'),
    'utf8',
  )
  assert.doesNotMatch(page, /\bany\b/)
  assert.doesNotMatch(page, /Record<string,\s*any>/)
  assert.match(page, /data\(\):\s*ProfilePageState/)
  assert.match(page, /onLoad\(rawQuery:\s*unknown/)
  assert.match(page, /createProfilePageMockMetadata\(\)/)
  assert.doesNotMatch(metadata, /\bany\b/)
})
