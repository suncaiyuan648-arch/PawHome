'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const METADATA_PATH = path.join(ROOT, 'packages/jury/services/queueMetadata.ts')

test('jury queue state is fresh and route aliases normalize to the supported business and tab values', async () => {
	const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
	const first = metadata.createJuryQueuePageState()
	const second = metadata.createJuryQueuePageState()
	assert.deepEqual(first, { activeTab: 'pending', reviewType: '', juryItems: [] })
	first.juryItems.push({ id: 'local' })
	assert.deepEqual(second.juryItems, [])

	assert.deepEqual(metadata.normalizeJuryQueueRouteOptions({ businessType: 'RESCUE', tab: 'finished' }), {
		reviewType: 'rescue', activeTab: 'finished',
	})
	assert.deepEqual(metadata.normalizeJuryQueueRouteOptions({ reviewType: 'adoption', state: 'finished' }), {
		reviewType: 'adoption', activeTab: 'finished',
	})
	assert.deepEqual(metadata.normalizeJuryQueueRouteOptions({ businessType: 'future', type: 'rescue', tab: 'unknown' }), {
		reviewType: '', activeTab: 'pending',
	})
	assert.deepEqual(metadata.normalizeJuryQueueRouteOptions(null), { reviewType: '', activeTab: 'pending' })
})

test('jury queue projects item completion from the shared status contract without mutating source rows', async () => {
	const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
	const items = [
		{ id: 'pending', status: 'pending' },
		{ id: 'voted', status: 'voted' },
		{ id: 'closed', status: 'closed' },
	]
	const projected = metadata.projectJuryQueueItems(items)
	assert.deepEqual(projected.map(({ id, isFinished }) => ({ id, isFinished })), [
		{ id: 'pending', isFinished: false },
		{ id: 'voted', isFinished: true },
		{ id: 'closed', isFinished: true },
	])
	assert.deepEqual(items.map((item) => Object.keys(item)), [['id', 'status'], ['id', 'status'], ['id', 'status']])
})

test('jury queue page and card use shared domain types rather than explicit any contracts', async () => {
	const page = await fs.readFile(path.join(ROOT, 'packages/jury/pages/queue/index.vue'), 'utf8')
	const card = await fs.readFile(path.join(ROOT, 'packages/jury/pages/queue/components/PawJuryItemCard.vue'), 'utf8')
	const metadata = await fs.readFile(METADATA_PATH, 'utf8')
	for (const source of [page, card, metadata]) {
		assert.doesNotMatch(source, /\bany\b/)
		assert.doesNotMatch(source, /Record<string,\s*any>/)
	}
	assert.match(page, /data\(\):\s*JuryQueuePageState/)
	assert.match(page, /onLoad\(options:\s*unknown/)
	assert.match(page, /normalizeJuryQueueRouteOptions\(options\)/)
	assert.match(card, /PropType<JuryItem>/)
	assert.match(card, /'identity-click':\s*\(identity:\s*JuryIdentity/)
})
