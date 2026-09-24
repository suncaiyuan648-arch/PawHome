'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const METADATA_PATH = path.join(ROOT, 'utils/rewardOrderMetadata.ts')

test('reward order sheet state factory returns an explicit initial state', async () => {
  const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?state=${Date.now()}`)
  const first = metadata.createRewardOrderSheetState()
  const second = metadata.createRewardOrderSheetState()

  assert.deepEqual(first, { selectedAddress: null, selectedAddressId: '', submitting: false })
  first.selectedAddressId = 'address-1'
  assert.equal(second.selectedAddressId, '')
})

test('reward order metadata narrows saved addresses and validates submitted event payloads', async () => {
  const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?normalize=${Date.now()}`)
  const address = metadata.normalizeRewardOrderAddress({
    id: 12,
    name: '收件人',
    phone: '13300000000',
    regionParts: ['湖南省', 3, '长沙市', '雨花区', '芙蓉区', '天心区'],
    detail: '中意一路',
    isDefault: true,
    extra: 'kept as unknown metadata',
  })

  assert.deepEqual(address, {
    id: '12',
    name: '收件人',
    phone: '13300000000',
    regionParts: ['湖南省', '长沙市', '雨花区', '芙蓉区'],
    detail: '中意一路',
    isDefault: true,
    extra: 'kept as unknown metadata',
  })
  assert.equal(metadata.normalizeRewardOrderAddress({ id: '  ' }), null)
  assert.equal(metadata.normalizeRewardOrderAddress(null), null)
  assert.equal(
    metadata.isRewardOrderSubmittedPayload({
      order: { id: 'order-1' },
      record: { id: 'application-1' },
      recordId: 'application-1',
    }),
    true,
  )
  assert.equal(
    metadata.isRewardOrderSubmittedPayload({ order: {}, record: {}, recordId: '' }),
    false,
  )
})

test('reward order sheet reuses address and order contracts with typed events and no any', async () => {
  const component = await fs.readFile(
    path.join(ROOT, 'components/adoption/PawRewardOrderSheet.vue'),
    'utf8',
  )
  const metadata = await fs.readFile(METADATA_PATH, 'utf8')

  assert.doesNotMatch(component, /\bany\b/)
  assert.doesNotMatch(metadata, /\bany\b/)
  assert.match(component, /data\(\): RewardOrderSheetState/)
  assert.match(component, /onAddressSelected\(address: AddressRecord\)/)
  assert.match(component, /submitted: \(payload: RewardOrderSubmittedPayload\)/)
  assert.match(metadata, /selectedAddress: AddressRecord \| null/)
  assert.match(metadata, /order: RewardOrderRecord/)
})
