'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const METADATA_PATH = path.join(ROOT, 'packages/discovery/services/searchResultMetadata.ts')

test('search result metadata preserves dynamic, yard and user mock contracts', async () => {
	const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
	const state = metadata.createSearchResultTabsMetadata()

	assert.deepEqual(state.tabs.map((tab) => tab.key), ['dynamic', 'yard', 'user'])
	assert.deepEqual(state.dynamicList.map((item) => item.pawId), ['search-feed-1', 'search-feed-2', 'search-feed-3', 'search-feed-4'])
	assert.equal(state.dynamicList[1].liked, true)
	assert.deepEqual(state.yardList.map((yard) => yard.variant), ['badges', 'org'])
	assert.deepEqual(state.yardList[0].badges, ['剩6只/共32只', '已成立2个月', '入驻4人'])
	assert.equal(state.yardList[1].orgName, '合肥市希望流浪动物基地')
	assert.equal(state.userList.length, 5)
	assert.deepEqual(state.userList.map((user) => user.pawLabel), ['小红书号：', '逢猫号：', '逢猫号：', '逢猫号：', '逢猫号：'])
})

test('search result fixtures and nested yard metadata are isolated across component instances', async () => {
	const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
	const first = metadata.createSearchResultTabsMetadata()
	const second = metadata.createSearchResultTabsMetadata()

	first.dynamicList[0].liked = true
	first.dynamicList[0].likes += 1
	first.yardList[0].badges[0] = 'local'
	first.yardList[0].gallery[0].caption = 'local'
	first.yardList[1].gallery[0].img = 'local'
	first.userList[0].name = 'local'

	assert.equal(second.dynamicList[0].liked, false)
	assert.equal(second.dynamicList[0].likes, 37)
	assert.equal(second.yardList[0].badges[0], '剩6只/共32只')
	assert.equal(second.yardList[0].gallery[0].caption, '开饭了开饭了开饭')
	assert.equal(second.yardList[1].gallery[0].img, '/static/figma/search/yard-gallery-exact.png')
	assert.equal(second.userList[0].name, 'Q')
})

test('search dynamic columns retain the original alternating index distribution', async () => {
	const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
	const { dynamicList } = metadata.createSearchResultTabsMetadata()
	const columns = metadata.splitSearchDynamicColumns(dynamicList)

	assert.deepEqual(columns.map((column) => column.map((entry) => entry.index)), [[0, 2], [1, 3]])
	assert.deepEqual(columns.map((column) => column.map((entry) => entry.item.pawId)), [
		['search-feed-1', 'search-feed-3'],
		['search-feed-2', 'search-feed-4']
	])
})

test('search result component consumes typed metadata and has no explicit any annotations', async () => {
	const component = await fs.readFile(path.join(ROOT, 'packages/discovery/pages/search/components/SearchResultTabs.vue'), 'utf8')
	const metadata = await fs.readFile(METADATA_PATH, 'utf8')
	assert.doesNotMatch(component, /\bany\b/)
	assert.doesNotMatch(component, /Record<string,\s*any>/)
	assert.match(component, /data\(\):\s*SearchResultTabsState/)
	assert.match(component, /openDynamicAuthor\(item:\s*SearchDynamicResult\)/)
	assert.match(component, /openYardCard\(yard:\s*SearchYardResult\)/)
	assert.match(component, /openUserRow\(u:\s*SearchUserResult\)/)
	assert.doesNotMatch(metadata, /\bany\b/)
})
