'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const METADATA_PATH = path.join(ROOT, 'packages/rescue/services/mineMetadata.ts')

test('rescue mine tabs and page state are typed metadata with per-page mutable copies', async () => {
	const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
	const first = metadata.createRescueMinePageState()
	const second = metadata.createRescueMinePageState()
	assert.deepEqual(first.tabs, [
		{ key: 'all', label: '全部' },
		{ key: 'platform_pending', label: '审核中' },
		{ key: 'platform_approved', label: '已通过' },
		{ key: 'platform_rejected', label: '未通过' },
	])
	assert.equal(first.activeFilter, 'all')
	first.tabs[0].label = 'local'
	first.model.items.push({ rescueId: 'local', applicationStatus: 'platform_pending', status: 'platform_pending' })
	assert.equal(second.tabs[0].label, '全部')
	assert.deepEqual(second.model.items, [])
})

test('rescue mine counts and status presentations follow the domain status whitelist', async () => {
	const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
	const items = [
		{ rescueId: 'pending', applicationStatus: 'platform_pending' },
		{ rescueId: 'approved', applicationStatus: 'platform_approved' },
		{ rescueId: 'rejected', applicationStatus: 'platform_rejected' },
	]
	assert.equal(metadata.countRescueMineItems(items, 'all'), 3)
	assert.equal(metadata.countRescueMineItems(items, 'platform_pending'), 1)
	assert.equal(metadata.countRescueMineItems(items, 'platform_approved'), 1)
	assert.equal(metadata.countRescueMineItems(items, 'platform_rejected'), 1)
	assert.deepEqual(metadata.getRescueMineStatusPresentation('platform_pending'), { label: '审核中', tone: 'warning' })
	assert.deepEqual(metadata.getRescueMineStatusPresentation('platform_approved'), { label: '已通过', tone: 'success' })
	assert.deepEqual(metadata.getRescueMineStatusPresentation('platform_rejected'), { label: '未通过', tone: 'danger' })
	assert.deepEqual(metadata.getRescueMineStatusPresentation({ forged: true }), { label: '状态未知', tone: 'warning' })
	const localPresentation = metadata.getRescueMineStatusPresentation('platform_pending')
	localPresentation.label = 'local'
	assert.equal(metadata.getRescueMineStatusPresentation('platform_pending').label, '审核中')
	assert.equal(metadata.isMineFilter('platform_approved'), true)
	assert.equal(metadata.isMineFilter('approved'), false)
})

test('rescue mine page reuses the persisted reader model and has no explicit any escape hatches', async () => {
	const page = await fs.readFile(path.join(ROOT, 'packages/rescue/pages/mine/index.vue'), 'utf8')
	const metadata = await fs.readFile(METADATA_PATH, 'utf8')
	const reader = await fs.readFile(path.join(ROOT, 'packages/rescue/services/mineReader.ts'), 'utf8')
	for (const source of [page, metadata, reader]) {
		assert.doesNotMatch(source, /\bany\b/)
		assert.doesNotMatch(source, /Record<string,\s*any>/)
	}
	assert.match(page, /data\(\):\s*RescueMinePageState/)
	assert.match(page, /readRescueMinePage\(\{\s*actorProvider:.*filter:\s*this\.activeFilter\s*\}\)/s)
	assert.doesNotMatch(page, /as\s+any/)
	assert.match(metadata, /Pick<MineReadModel,\s*'items'\s*\|\s*'pending'\s*\|\s*'processed'>/)
	assert.match(reader, /export interface MineReadModel/)
})
