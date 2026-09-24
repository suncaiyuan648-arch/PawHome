'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('feeding detail fallback metadata is typed, complete, and isolated per component instance', async () => {
  const metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'packages/feeding/services/detailMetadata.ts')).href}?test=${Date.now()}`
  )
  const firstState = metadata.createFeedingDetailFigmaState()
  assert.equal(firstState.avatarImgs.length, 4)
  assert.equal(firstState.photoImgs.length, 3)
  assert.equal(
    firstState.avatarImgs[0],
    '/static/figma/feeding/2aa0d5e4a47ba5a30dfbda447d2b0e0acab9c94f.png',
  )
  firstState.avatarImgs[0] = 'local-change'
  assert.notEqual(metadata.createFeedingDetailFigmaState().avatarImgs[0], 'local-change')

  const timeline = metadata.createFeedingTimelineFallback()
  assert.deepEqual(timeline, [
    { day: '23', month: '6月', indexText: '3/5' },
    { day: '22', month: '6月', indexText: '2/5' },
    { day: '21', month: '6月', indexText: '1/5' },
  ])
  timeline.pop()
  assert.equal(metadata.createFeedingTimelineFallback().length, 3)

  const emptyDetail = metadata.createEmptyFeedingOrderDetail()
  assert.equal(emptyDetail.perspective, 'cloud-parent')
  emptyDetail.petTags.push('local-change')
  assert.deepEqual(metadata.createEmptyFeedingOrderDetail().petTags, [])
})

test('feeding order page and detail component consume shared domain and state contracts without any', async () => {
  const page = await fs.readFile(
    path.join(ROOT, 'packages/feeding/pages/order/detail/index.vue'),
    'utf8',
  )
  const component = await fs.readFile(
    path.join(ROOT, 'packages/feeding/components/PawFeedingDetailFigma.vue'),
    'utf8',
  )
  for (const source of [page, component]) {
    assert.doesNotMatch(source, /\bany\b/)
    assert.doesNotMatch(source, /as\s+any/)
    assert.doesNotMatch(source, /Record<string,\s*any>/)
  }
  assert.match(page, /data\(\):\s*FeedingOrderDetailPageState/)
  assert.match(page, /onLoad\(options:\s*unknown/)
  assert.match(page, /type FeedingOrderDetailModel\s*=\s*Extract/)
  assert.match(component, /PropType<FeedingOrderDetail\s*\|\s*null>/)
  assert.match(component, /data\(\):\s*FeedingDetailFigmaState/)
  assert.match(component, /createFeedingTimelineFallback\(\)/)
})
