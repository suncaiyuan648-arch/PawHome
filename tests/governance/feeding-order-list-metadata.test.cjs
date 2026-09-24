'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
let tempRoot
let feedingApi
let metadata

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-feeding-order-list-'))
  await fs.writeFile(path.join(tempRoot, 'package.json'), JSON.stringify({ type: 'module' }))
  await fs.mkdir(path.join(tempRoot, 'utils'), { recursive: true })
  await fs.mkdir(path.join(tempRoot, 'packages/feeding/services'), { recursive: true })
  await fs.copyFile(
    path.join(ROOT, 'utils/profileNav.ts'),
    path.join(tempRoot, 'utils/profileNav.ts'),
  )

  const apiSource = await fs.readFile(
    path.join(ROOT, 'packages/feeding/services/orderMockApi.ts'),
    'utf8',
  )
  await fs.writeFile(
    path.join(tempRoot, 'packages/feeding/services/orderMockApi.ts'),
    apiSource.replace("'@/utils/profileNav.ts'", "'../../../utils/profileNav.ts'"),
  )
  await fs.copyFile(
    path.join(ROOT, 'packages/feeding/services/orderListMetadata.ts'),
    path.join(tempRoot, 'packages/feeding/services/orderListMetadata.ts'),
  )

  feedingApi = await import(
    `${pathToFileURL(path.join(tempRoot, 'packages/feeding/services/orderMockApi.ts')).href}?api=${Date.now()}`
  )
  metadata = await import(
    `${pathToFileURL(path.join(tempRoot, 'packages/feeding/services/orderListMetadata.ts')).href}?metadata=${Date.now()}`
  )
})

after(async () => {
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

test('feeding order list projects typed mock records without mutating the source fixtures', async () => {
  const result = await feedingApi.getFeedingOrders()
  const items = metadata.createFeedingOrderListItems(result.data.items, 'mine')

  assert.equal(items.length, 5)
  assert.ok(items.every((item) => typeof item.statusBadge === 'number'))
  assert.deepEqual(
    items.map((item) => item.id),
    result.data.items.map((item) => item.id),
  )
  const timeoutItem = items.find((item) => item.id === 'f1')
  const sourceTimeoutItem = result.data.items.find((item) => item.id === 'f1')
  assert.notEqual(timeoutItem, sourceTimeoutItem)
  assert.match(timeoutItem.orderCopy, /^反馈已超时.+，我们会尽快通知小院反馈$/)
  assert.equal(sourceTimeoutItem.orderCopy, '反馈已超时6天，我们会尽快通知小院反馈')

  const yardResult = await feedingApi.getFeedingOrders({
    variant: 'yard',
    yardOwnerId: 'yard-owner-1',
  })
  const yardItems = metadata.createFeedingOrderListItems(yardResult.data.items, 'yard')
  assert.ok(yardItems.every((item) => typeof item.statusBadge === 'number'))
  assert.deepEqual(
    yardItems.map((item) => item.orderCopy),
    yardResult.data.items.map((item) => item.orderCopy),
  )
})

test('feeding order page and toolbar metadata provide independent typed defaults and sort guards', () => {
  const firstPage = metadata.createFeedingOrderListPageState()
  const secondPage = metadata.createFeedingOrderListPageState()
  const firstToolbar = metadata.createFeedingOrderToolbarState('cat', 'newest')
  const secondToolbar = metadata.createFeedingOrderToolbarState('', 'untrusted-sort')

  assert.deepEqual(firstPage, { items: [], keyword: '', sort: 'smart', loading: false })
  assert.notEqual(firstPage.items, secondPage.items)
  assert.equal(firstToolbar.inputValue, 'cat')
  assert.equal(firstToolbar.sortKey, 'newest')
  assert.equal(secondToolbar.sortKey, 'smart')
  assert.notEqual(firstToolbar.sortOptions, secondToolbar.sortOptions)
  assert.deepEqual(
    firstToolbar.sortOptions.map((option) => option.key),
    ['smart', 'newest', 'status'],
  )
  assert.deepEqual(
    firstToolbar.sortOptions.map((option) => option.label),
    ['智能排序', '最新投粮', '按状态'],
  )
  assert.equal(metadata.isFeedingOrderSort('status'), true)
  assert.equal(metadata.isFeedingOrderSort({ key: 'status' }), false)
})

test('feeding order list and toolbar consume shared service contracts without explicit any annotations', async () => {
  const listPage = await fs.readFile(
    path.join(ROOT, 'packages/feeding/components/PawFeedingOrderList.vue'),
    'utf8',
  )
  const toolbar = await fs.readFile(
    path.join(ROOT, 'packages/feeding/components/PawFeedingOrderToolbar.vue'),
    'utf8',
  )
  const listMetadata = await fs.readFile(
    path.join(ROOT, 'packages/feeding/services/orderListMetadata.ts'),
    'utf8',
  )
  const mockApi = await fs.readFile(
    path.join(ROOT, 'packages/feeding/services/orderMockApi.ts'),
    'utf8',
  )

  for (const source of [listPage, toolbar, listMetadata, mockApi])
    assert.doesNotMatch(source, /\bany\b/)
  assert.match(listPage, /data\(\):\s*FeedingOrderListPageState/)
  assert.match(listPage, /createFeedingOrderListItems\(result\.data\.items, this\.variant\)/)
  assert.match(toolbar, /data\(\):\s*FeedingOrderToolbarState/)
  assert.match(listMetadata, /interface FeedingOrderListItem extends FeedingOrderItem/)
  assert.match(mockApi, /interface FeedingOrderFixture/)
})
