'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('yard feed package and rights mock metadata is typed, stable, and cloned per popup', async () => {
	const metadata = await import(`${pathToFileURL(path.join(ROOT, 'components/yard/yardFeedPopupMetadata.ts')).href}?test=${Date.now()}`)
	const first = metadata.createYardFeedPopupState()
	assert.equal(first.selectedKey, 'c')
	assert.equal(first.packages.length, 3)
	assert.deepEqual(first.packages.map(({ key, jin, price, payPriceLabel }) => ({ key, jin, price, payPriceLabel })), [
		{ key: 'a', jin: 0.4, price: 6.9, payPriceLabel: '6.9' },
		{ key: 'b', jin: 4, price: 29.9, payPriceLabel: '29.9' },
		{ key: 'c', jin: 40, price: 299.9, payPriceLabel: '119.9' },
	])
	assert.equal(first.feedRights.length, 6)
	first.packages[0].price = 0
	first.feedRights[0] = 'local change'
	const second = metadata.createYardFeedPopupState()
	assert.equal(second.packages[0].price, 6.9)
	assert.equal(second.feedRights[0], metadata.YARD_FEED_RIGHTS[0])
	assert.equal(Object.isFrozen(metadata.YARD_FEED_PACKAGE_OPTIONS[0]), true)
	assert.equal(Object.isFrozen(metadata.YARD_FEED_RIGHTS), true)
})

test('payment parameters are normalized without leaking invalid providers or mutating input', async () => {
	const metadata = await import(`${pathToFileURL(path.join(ROOT, 'components/yard/yardFeedPopupMetadata.ts')).href}?payment=${Date.now()}`)
	const input = {
		provider: 'wxpay', timeStamp: 1780000000, nonceStr: 'nonce', package: 'prepay_id=abc',
		signType: 'MD5', paySign: 'signature', traceId: 'trace-a',
	}
	const result = metadata.readYardFeedPaymentParams(input)
	assert.deepEqual(result, {
		provider: 'wxpay', timeStamp: '1780000000', nonceStr: 'nonce', package: 'prepay_id=abc',
		signType: 'MD5', paySign: 'signature', traceId: 'trace-a',
	})
	assert.equal(input.timeStamp, 1780000000)
	assert.equal(metadata.readYardFeedPaymentParams({ ...input, provider: 'unsupported' })?.provider, undefined)
	assert.equal(metadata.readYardFeedPaymentParams({ ...input, paySign: '' }), null)
	assert.equal(metadata.readYardFeedPaymentParams([]), null)
	assert.equal(metadata.toYardFeedUniPaymentParams(result).provider, 'wxpay')
	assert.equal(metadata.toYardFeedUniPaymentParams({ ...result, provider: 'alipay' }).provider, 'alipay')
})

test('yard feed popup and its detail tabber use shared typed fixtures and payment contracts', async () => {
	const popup = await fs.readFile(path.join(ROOT, 'components/YardFeedPopup.vue'), 'utf8')
	const tabber = await fs.readFile(path.join(ROOT, 'packages/animal/pages/detail/components/DetailTabber.vue'), 'utf8')
	for (const source of [popup, tabber]) {
		assert.doesNotMatch(source, /\bany\b/)
		assert.doesNotMatch(source, /as\s+any/)
		assert.doesNotMatch(source, /Record<string,\s*any>/)
	}
	assert.match(popup, /data\(\):\s*YardFeedPopupState/)
	assert.match(popup, /createYardFeedPopupState\(\)/)
	assert.match(popup, /readYardFeedPaymentParams\(this\.paymentParams\)/)
	assert.match(tabber, /data\(\):\s*DetailTabberState/)
	assert.match(tabber, /YardFeedPaymentPayload/)
})
