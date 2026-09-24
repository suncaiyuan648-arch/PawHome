'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const METADATA_PATH = path.join(ROOT, 'packages/adoption/services/mineMetadata.ts')

test('adoption mine page state is explicit and creates independent list instances', async () => {
	const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
	const first = metadata.createAdoptionMinePageState()
	const second = metadata.createAdoptionMinePageState()
	assert.deepEqual(first, { pageState: 'list', adoptionList: [] })
	first.pageState = 'empty'
	first.adoptionList.push({ id: 'local' })
	assert.equal(second.pageState, 'list')
	assert.deepEqual(second.adoptionList, [])
})

test('adoption mine route values are narrowed and status tones use a closed mapping', async () => {
	const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
	assert.deepEqual(metadata.normalizeAdoptionMineRouteOptions({ state: 'empty', openDetail: 'application%3A1' }), {
		pageState: 'empty',
		openDetailId: 'application:1',
	})
	assert.deepEqual(metadata.normalizeAdoptionMineRouteOptions({ state: { forged: true }, openDetail: '%E0%A4%A' }), {
		pageState: 'list',
		openDetailId: '%E0%A4%A',
	})
	assert.deepEqual(metadata.normalizeAdoptionMineRouteOptions(null), { pageState: 'list', openDetailId: '' })
	assert.equal(metadata.getAdoptionMineStatusTone('red'), 'danger')
	assert.equal(metadata.getAdoptionMineStatusTone('green'), 'success')
	assert.equal(metadata.getAdoptionMineStatusTone('grey'), 'neutral')
	assert.equal(metadata.getAdoptionMineStatusTone({ forged: true }), 'neutral')
})

test('adoption mine page reuses shared adoption cards and has no explicit any escape hatches', async () => {
	const page = await fs.readFile(path.join(ROOT, 'packages/adoption/pages/mine/index.vue'), 'utf8')
	const metadata = await fs.readFile(METADATA_PATH, 'utf8')
	const storage = await fs.readFile(path.join(ROOT, 'utils/adoptionStorage.ts'), 'utf8')
	for (const source of [page, metadata]) {
		assert.doesNotMatch(source, /\bany\b/)
		assert.doesNotMatch(source, /Record<string,\s*any>/)
	}
	assert.match(page, /data\(\):\s*AdoptionMinePageState/)
	assert.match(page, /onLoad\(options:\s*unknown\)/)
	assert.match(page, /createAdoptionMinePageState\(\)/)
	assert.match(page, /\.map\(toAdoptionCard\)/)
	assert.match(page, /card is AdoptionCard => card !== null/)
	assert.match(page, /statusTone\(tone:\s*string\)/)
	assert.match(await fs.readFile(path.join(ROOT, 'contracts/applications.ts'), 'utf8'), /export interface AdoptionCard extends AdoptionRecord/)
	assert.match(storage, /export function toAdoptionCard\(record: unknown\): AdoptionCard \| null/)
})
