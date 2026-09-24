'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('history metadata contains typed feed and discriminated yard fixtures with isolated copies', async () => {
  const metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'packages/account/services/historyMetadata.ts')).href}?test=${Date.now()}`
  )
  const first = metadata.createHistoryPageMetadata()
  const second = metadata.createHistoryPageMetadata()
  assert.equal(first.activeTab, 'feed')
  assert.equal(first.feedList.length, 6)
  assert.deepEqual(
    first.feedList.map((item) => item.dynamicId),
    [
      'history-dynamic-1',
      'history-dynamic-2',
      'history-dynamic-3',
      'history-dynamic-4',
      'history-dynamic-5',
      'history-dynamic-6',
    ],
  )
  assert.deepEqual(
    first.yardList.map((item) => item.variant),
    ['badges', 'org'],
  )
  assert.equal(first.yardList[0].gallery.length, 4)

  first.feedList[0].liked = true
  first.yardList[0].badges.push('local')
  first.yardList[0].gallery[0].caption = 'local'
  assert.equal(second.feedList[0].liked, false)
  assert.deepEqual(second.yardList[0].badges, ['6只猫咪', '已成立2个月', '入驻4人'])
  assert.equal(second.yardList[0].gallery[0].caption, '开饭了开饭了开饭')
})

test('history feed presentation and route-state normalization preserve the page states', async () => {
  const metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'packages/account/services/historyMetadata.ts')).href}?test=${Date.now()}`
  )
  const source = metadata.createHistoryFeedMocks()
  const display = metadata.createHistoryFeedDisplayMocks(source)
  assert.equal(display.length, 4)
  assert.deepEqual(
    display.map((item) => item.cover),
    [
      '/static/figma/history-feed-1.png?v=2',
      '/static/figma/history-feed-2.png?v=2',
      '/static/figma/history-feed-3.png?v=2',
      '/static/figma/history-feed-4.png?v=2',
    ],
  )
  assert.ok(
    display.every(
      (item) =>
        item.title === '小猫吃的好开心' && item.distance === '3.2km' && item.district === '金水区',
    ),
  )
  assert.deepEqual(
    display.map((item) => item.liked),
    [false, true, false, false],
  )
  assert.equal(display[1].likes, 32)
  assert.equal(source[0].cover, '/static/figma/history/white-cat.jpg')
  assert.equal(metadata.normalizeHistoryRouteState({ state: 'yard' }), 'yard')
  assert.equal(metadata.normalizeHistoryRouteState({ state: 'empty' }), 'empty')
  assert.equal(metadata.normalizeHistoryRouteState({ state: 'unknown' }), null)
  assert.equal(metadata.normalizeHistoryRouteState(null), null)
})

test('history page consumes shared typed metadata without explicit any annotations', async () => {
  const page = await fs.readFile(
    path.join(ROOT, 'packages/account/pages/history/index.vue'),
    'utf8',
  )
  const metadata = await fs.readFile(
    path.join(ROOT, 'packages/account/services/historyMetadata.ts'),
    'utf8',
  )
  assert.doesNotMatch(page, /\bany\b/)
  assert.doesNotMatch(page, /Record<string,\s*any>/)
  assert.match(page, /data\(\):\s*HistoryPageState/)
  assert.match(page, /onLoad\(options:\s*unknown/)
  assert.match(page, /createHistoryPageMetadata\(\)/)
  assert.doesNotMatch(metadata, /\bany\b/)
})
