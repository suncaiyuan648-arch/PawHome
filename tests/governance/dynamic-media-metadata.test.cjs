'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('dynamic media fixtures and object inputs become stable viewer items', async () => {
  const metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'utils/dynamicMediaMetadata.ts')).href}?test=${Date.now()}`
  )
  const objectItem = { id: 'media-2', src: '/two.png', extra: 'preserved' }
  const items = metadata.createDynamicMediaViewerItems(
    [
      '/one.png',
      objectItem,
      { url: 12, src: '/three.png' },
      { path: '/four.png' },
      null,
      { url: 12 },
    ],
    '/fallback.png',
  )

  assert.deepEqual(
    items.map(({ id, src }) => ({ id, src })),
    [
      { id: '0', src: '/one.png' },
      { id: 'media-2', src: '/two.png' },
      { id: '2', src: '/three.png' },
      { id: '3', src: '/four.png' },
    ],
  )
  assert.equal(items[1].original, objectItem)
  assert.deepEqual(metadata.createDynamicMediaViewerItems([null, false, {}], '/fallback.png'), [
    { id: 'fallback', src: '/fallback.png', original: '/fallback.png' },
  ])
})

test('dynamic media change events are narrowed and clamped to the displayed list', async () => {
  const metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'utils/dynamicMediaMetadata.ts')).href}?events=${Date.now()}`
  )
  assert.equal(metadata.readDynamicMediaIndex({ detail: { current: 2 } }, 3), 2)
  assert.equal(metadata.readDynamicMediaIndex({ detail: { current: '1' } }, 3), 1)
  assert.equal(metadata.readDynamicMediaIndex({ detail: { current: 8 } }, 3), 2)
  assert.equal(metadata.readDynamicMediaIndex({ detail: { current: -1 } }, 3), 0)
  assert.equal(metadata.readDynamicMediaIndex({ detail: { current: 'bad' } }, 3), 0)
  assert.equal(metadata.readDynamicMediaIndex(null, 3), 0)

  const item = metadata.createDynamicMediaViewerItems(['/one.png'], '/fallback.png')[0]
  const preview = metadata.createDynamicMediaPreviewPayload(item, 0)
  assert.deepEqual(preview, { item: '/one.png', index: 0 })
})

test('dynamic media viewer consumes the shared media contract without any annotations', async () => {
  const component = await fs.readFile(
    path.join(ROOT, 'components/dynamic/DynamicMediaViewer.vue'),
    'utf8',
  )
  const metadata = await fs.readFile(path.join(ROOT, 'utils/dynamicMediaMetadata.ts'), 'utf8')
  for (const source of [component, metadata]) {
    assert.doesNotMatch(source, /\bany\b/)
    assert.doesNotMatch(source, /Record\s*<\s*string\s*,\s*any\s*>/)
  }
  assert.match(component, /PropType<DynamicMediaInput\[\]>/)
  assert.match(component, /data\(\):\s*DynamicMediaViewerState/)
  assert.match(component, /createDynamicMediaViewerItems\(this\.items, this\.fallback\)/)
  assert.match(component, /createDynamicMediaPreviewPayload\(item, index\)/)
})
