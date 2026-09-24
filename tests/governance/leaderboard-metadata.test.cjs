'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('leaderboard metadata covers every tab with complete podium, rank, and self rows', async () => {
  const metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'packages/discovery/services/rankingMetadata.ts')).href}?test=${Date.now()}`
  )
  const page = metadata.createLeaderboardPageMetadata()
  assert.deepEqual(
    page.tabList.map(({ key }) => key),
    ['day_feed', 'year_feed', 'day_gain', 'year_gain'],
  )
  assert.equal(page.activeTab, 'day_feed')
  assert.equal(page.topThree.length, 3)
  assert.equal(page.rankList.length, 7)
  assert.equal(page.selfRow.rankLabel, '未上榜')

  for (const tab of page.tabList) {
    const board = metadata.createLeaderboardBoard(tab.key)
    assert.equal(board.topThree.length, 3, `${tab.key} should have a three-person podium`)
    assert.ok(board.topThree.every((item) => item.name && item.avatar && item.city))
    assert.ok(
      board.rankList.every(
        (item) => Number.isInteger(item.rank) && item.rank > 3 && item.name && item.city,
      ),
    )
    assert.ok(board.selfRow.name && board.selfRow.rankLabel && board.selfRow.city)
  }
  assert.equal(
    metadata.createLeaderboardBoard('year_feed').topThree[0].avatar,
    '/static/figma/leaderboard/avatar-xiangzi-original.png',
  )
})

test('leaderboard page and board factories isolate mutable rows and tabs', async () => {
  const metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'packages/discovery/services/rankingMetadata.ts')).href}?test=${Date.now()}`
  )
  const firstPage = metadata.createLeaderboardPageMetadata()
  const secondPage = metadata.createLeaderboardPageMetadata()
  firstPage.topThree[0].name = 'changed'
  firstPage.rankList[0].rank = 99
  firstPage.selfRow.city = 'changed'
  firstPage.tabList[0].label = 'changed'
  assert.equal(secondPage.topThree[0].name, '项子涵')
  assert.equal(secondPage.rankList[0].rank, 4)
  assert.equal(secondPage.selfRow.city, '长沙')
  assert.equal(secondPage.tabList[0].label, '日投粮榜')

  const firstBoard = metadata.createLeaderboardBoard('year_gain')
  firstBoard.topThree[0].avatar = 'page-local.png'
  firstBoard.rankList[0].name = 'page-local'
  const secondBoard = metadata.createLeaderboardBoard('year_gain')
  assert.equal(
    secondBoard.topThree[0].avatar,
    '/static/figma/leaderboard/avatar-xiangzi-original.png',
  )
  assert.equal(secondBoard.rankList[0].name, '和风喵喵屋')
})

test('ranking page consumes typed shared metadata without any escape hatches', async () => {
  const page = await fs.readFile(
    path.join(ROOT, 'packages/discovery/pages/ranking/index.vue'),
    'utf8',
  )
  const metadata = await fs.readFile(
    path.join(ROOT, 'packages/discovery/services/rankingMetadata.ts'),
    'utf8',
  )
  assert.doesNotMatch(page, /\bany\b/)
  assert.doesNotMatch(page, /Record<string,\s*any>/)
  assert.match(page, /data\(\):\s*LeaderboardPageState/)
  assert.match(page, /onTabChange\(key:\s*LeaderboardTabKey\)/)
  assert.match(page, /createLeaderboardPageMetadata\(\)/)
  assert.doesNotMatch(page, /\bTAB_BOARD\b/)
  assert.doesNotMatch(metadata, /\bany\b/)
})
