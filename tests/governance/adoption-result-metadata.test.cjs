'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const METADATA_PATH = path.join(ROOT, 'packages/adoption/services/resultMetadata.ts')

test('adoption result metadata covers all six established variants and preserves display copy', async () => {
	const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
	const variants = ['80', '81', '82', '83', '84', '85']
	assert.deepEqual(variants.map((variant) => metadata.getAdoptionResultConfig(variant).title), [
		'领取成功', '已同意领养申请', '已确认领养', '已驳回', '太棒了', '申请成功',
	])
	assert.equal(metadata.getAdoptionResultConfig('80').buttonText, '查看订单')
	assert.equal(metadata.getAdoptionResultConfig('83').failed, true)
	assert.equal(metadata.getAdoptionResultConfig('83').failureIconName, 'status/adoption-rejected')
	assert.equal(metadata.getAdoptionResultConfig('83').descriptionMaxWidth, 254)
	assert.equal(metadata.getAdoptionResultConfig('invalid').title, '领取成功')
})

test('adoption result route normalization maps known outcomes and narrows route values', async () => {
	const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
	assert.deepEqual(metadata.normalizeAdoptionResultRouteOptions({
		outcome: 'review-rejected',
		applicationId: 'application%3A12',
		orderId: 42,
		nextMode: 'owner',
		reviewerRole: 'reviewer',
		reviewerId: 'person-1',
	}), {
		variant: '83',
		outcome: 'review-rejected',
		recordId: 'application:12',
		orderId: '42',
		nextMode: 'owner',
		reviewerRole: 'reviewer',
		reviewerId: 'person-1',
	})
	assert.deepEqual(metadata.normalizeAdoptionResultRouteOptions({ outcome: 'future-state', variant: '84', id: { forged: true } }), {
		variant: '84',
		outcome: 'future-state',
		recordId: '',
		orderId: '',
		nextMode: '',
		reviewerRole: '',
		reviewerId: '',
	})
	assert.equal(metadata.normalizeAdoptionResultRouteOptions(null).variant, '85')
})

test('adoption result page uses the shared typed metadata without explicit any annotations', async () => {
	const page = await fs.readFile(path.join(ROOT, 'packages/adoption/pages/result/index.vue'), 'utf8')
	const metadata = await fs.readFile(METADATA_PATH, 'utf8')
	assert.doesNotMatch(page, /\bany\b/)
	assert.doesNotMatch(page, /Record<string,\s*any>/)
	assert.match(page, /data\(\):\s*AdoptionResultPageState/)
	assert.match(page, /onLoad\(options:\s*unknown/)
	assert.match(page, /normalizeAdoptionResultRouteOptions\(options\)/)
	assert.match(metadata, /Readonly<Record<AdoptionResultVariant, AdoptionResultConfig>>/)
	assert.doesNotMatch(metadata, /\bany\b/)
})
