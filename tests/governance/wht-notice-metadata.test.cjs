'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const METADATA_PATH = path.join(ROOT, 'components/WhtNoticeBar/noticeMetadata.ts')

test('notice bar metadata validates theme and platform states with fresh defaults', async () => {
  const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?state=${Date.now()}`)
  const first = metadata.createWhtNoticeBarState()
  const second = metadata.createWhtNoticeBarState()

  assert.equal(metadata.isWhtNoticeBarType('warning'), true)
  assert.equal(metadata.isWhtNoticeBarType('future'), false)
  assert.deepEqual(first, {
    isShow: true,
    isReady: false,
    textWidth: 0,
    containerWidth: 0,
    animation: null,
    animationData: null,
    platform: '',
    loopTimer: null,
  })
  first.platform = 'mp'
  assert.equal(second.platform, '')
})

test('notice bar rect results are narrowed from selector callback shapes', async () => {
  const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?rect=${Date.now()}`)

  assert.deepEqual(metadata.normalizeWhtNoticeRect({ width: 128, height: 20 }), { width: 128 })
  assert.deepEqual(metadata.normalizeWhtNoticeRect([{ width: 72 }]), { width: 72 })
  assert.equal(metadata.normalizeWhtNoticeRect({ width: '72' }), null)
  assert.equal(metadata.normalizeWhtNoticeRect([]), null)
  assert.equal(metadata.normalizeWhtNoticeRect(null), null)
})

test('notice bar declares click and close events and contains no explicit any types', async () => {
  const component = await fs.readFile(path.join(ROOT, 'components/WhtNoticeBar/index.vue'), 'utf8')
  const metadata = await fs.readFile(METADATA_PATH, 'utf8')

  assert.doesNotMatch(component, /\bany\b/)
  assert.doesNotMatch(metadata, /\bany\b/)
  assert.match(component, /data\(\): WhtNoticeBarState/)
  assert.match(component, /getRect\(selector: string\): Promise<WhtNoticeRect \| null>/)
  assert.match(component, /click: \(\) => true/)
  assert.match(component, /close: \(\) => true/)
})
