'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const METADATA_PATH = path.join(ROOT, 'packages/discovery/services/searchPageMetadata.ts')

test('search page state and mock history are typed metadata with isolated mutable copies', async () => {
  const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
  const first = metadata.createSearchPageMetadata()
  const second = metadata.createSearchPageMetadata()
  const firstHistory = metadata.createDemoSearchHistory()
  const secondHistory = metadata.createDemoSearchHistory()

  assert.equal(first.activeTab, 'dynamic')
  assert.deepEqual(
    first.tabs.map((tab) => tab.key),
    ['dynamic', 'yard', 'user'],
  )
  assert.deepEqual(firstHistory, [
    '狸花猫',
    '545876656',
    '幸福小区',
    '年糕',
    '朝阳小区喂猫小院',
    '喂猫日记',
    '阿平的喂猫日记',
  ])

  first.tabs[0].label = 'local'
  first.historyList.push('local')
  firstHistory[0] = 'local'
  assert.equal(second.tabs[0].label, '动态')
  assert.deepEqual(second.historyList, [])
  assert.equal(secondHistory[0], '狸花猫')
})

test('search route options preserve supported page states and normalize unknown values', async () => {
  const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
  assert.deepEqual(metadata.normalizeSearchRouteOptions({ state: 'yard', popup: 'delete' }), {
    pageState: 'yard',
    popup: 'delete',
  })
  assert.deepEqual(metadata.normalizeSearchRouteOptions({ state: 'idle_delete', popup: 3 }), {
    pageState: 'idle_delete',
    popup: '3',
  })
  assert.deepEqual(metadata.normalizeSearchRouteOptions({ state: { forged: true }, popup: null }), {
    pageState: '',
    popup: '',
  })
  assert.deepEqual(metadata.normalizeSearchRouteOptions(null), { pageState: '', popup: '' })
  assert.equal(metadata.isSearchTabKey('dynamic'), true)
  assert.equal(metadata.isSearchTabKey('deleting'), false)
})

test('persisted search history is narrowed to truthy strings', async () => {
  const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
  assert.deepEqual(
    metadata.normalizeSearchHistory(['cat', '', 0, null, '0', { query: 'yard' }, false]),
    ['cat', '0'],
  )
  assert.deepEqual(metadata.normalizeSearchHistory({ history: ['cat'] }), [])
})

test('search page consumes shared state and history metadata without explicit any annotations', async () => {
  const page = await fs.readFile(
    path.join(ROOT, 'packages/discovery/pages/search/index.vue'),
    'utf8',
  )
  const metadata = await fs.readFile(METADATA_PATH, 'utf8')
  assert.doesNotMatch(page, /\bany\b/)
  assert.doesNotMatch(page, /Record<string,\s*any>/)
  assert.match(page, /data\(\):\s*SearchPageState/)
  assert.match(page, /onLoad\(options:\s*unknown/)
  assert.match(page, /normalizeSearchHistory\(list\)/)
  assert.match(page, /createDemoSearchHistory\(\)/)
  assert.doesNotMatch(metadata, /\bany\b/)
})
