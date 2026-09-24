'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const METADATA_PATH = path.join(ROOT, 'packages/adoption/services/quotaMetadata.ts')
const PAGES = [
	'packages/adoption/pages/support/index.vue',
	'packages/adoption/pages/quota/index.vue',
	'packages/adoption/pages/quota/detail/index.vue',
]

test('adoption quota metadata provides typed fixture rows and isolated page states', async () => {
	const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?state=${Date.now()}`)
	const support = metadata.createAdoptionQuotaPageState('support')
	const quota = metadata.createAdoptionQuotaPageState('quota')
	const detail = metadata.createAdoptionQuotaPageState('quota-detail')

	assert.equal(support.supportList.length, 3)
	assert.deepEqual(quota.ledger.map(({ amount }) => amount), ['', '-100', '+300', '+100', '-100'])
	assert.equal(detail.detailRows.length, 4)
	assert.equal(metadata.getAdoptionQuotaTitle('support'), '助力领养')
	assert.equal(metadata.getAdoptionQuotaTitle('quota-detail'), '明细详情')
	assert.equal(metadata.getAdoptionQuotaTitle('future-mode'), '领养')
	support.ledger[0].name = 'local'
	quota.supportList[0].name = 'local'
	assert.equal(detail.ledger[0].name, '云养3天豆豆')
	assert.equal(metadata.createAdoptionQuotaPageState('support').supportList[0].name, '小白')
})

test('adoption quota route metadata preserves aliases and optional insufficient-state behavior', async () => {
	const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?routes=${Date.now()}`)
	assert.deepEqual(metadata.resolveAdoptionQuotaRouteState({ quotaId: '', id: 42, recordId: 'fallback', popup: 'insufficient' }, 'support'), {
		recordId: '42', invalid: false, showInsufficient: true,
	})
	assert.deepEqual(metadata.resolveAdoptionQuotaRouteState({}, 'quota-detail'), {
		recordId: '', invalid: true, showInsufficient: false,
	})
	assert.deepEqual(metadata.resolveAdoptionQuotaRouteState(null, 'quota'), {
		recordId: '', invalid: false, showInsufficient: false,
	})
	const malformed = { toString() { throw new Error('cannot stringify') } }
	assert.equal(metadata.resolveAdoptionQuotaRouteState({ quotaId: malformed }, 'support').recordId, '')
})

test('adoption quota pages share typed metadata and contain no local mock copies or any annotations', async () => {
	const [metadata, ...pages] = await Promise.all([
		fs.readFile(METADATA_PATH, 'utf8'),
		...PAGES.map((relative) => fs.readFile(path.join(ROOT, relative), 'utf8')),
	])
	for (const source of [metadata, ...pages]) {
		assert.doesNotMatch(source, /\bany\b/)
		assert.doesNotMatch(source, /Record<string,\s*any>/)
	}
	assert.match(pages[0], /createAdoptionQuotaPageState\('support'\)/)
	assert.match(pages[1], /createAdoptionQuotaPageState\('quota'\)/)
	assert.match(pages[2], /createAdoptionQuotaPageState\('quota-detail'\)/)
	assert.equal(pages.filter((source) => /onLoad\(options: unknown/.test(source)).length, 3)
	assert.equal(pages.join('\n').includes("name: '小白'"), false)
})
