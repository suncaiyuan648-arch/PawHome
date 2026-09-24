'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('PawImage metadata normalizes supported sources, display modes, and CSS sizes', async () => {
  const metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'components/base/pawImageMetadata.ts')).href}?test=${Date.now()}`
  )
  assert.equal(metadata.asPawImageCssSize(34), '34px')
  assert.equal(metadata.asPawImageCssSize('100%'), '100%')
  assert.equal(metadata.asPawImageCssSize(''), '')
  assert.equal(metadata.asPawImageCssSize(null), '')
  assert.equal(metadata.normalizePawImageUrl('  /static/pet.png  '), '/static/pet.png')
  assert.equal(
    metadata.normalizePawImageUrl('https://example.test/pet.png'),
    'https://example.test/pet.png',
  )
  assert.equal(metadata.normalizePawImageUrl('cloud://bucket/pet.png'), 'cloud://bucket/pet.png')
  assert.equal(metadata.normalizePawImageUrl('relative/pet.png'), '')
  assert.equal(metadata.readPawImageSourceUrl({ src: '', url: '/fallback.png' }), '/fallback.png')
  assert.equal(
    metadata.readPawImageSourceUrl({ path: 'wxfile://tmp/pet.png' }),
    'wxfile://tmp/pet.png',
  )
  assert.equal(metadata.readPawImageSourceUrl({ image: 'javascript:alert(1)' }), '')
  assert.equal(metadata.readPawImageSourceUrl(['not-an-image-object']), '')
  assert.equal(metadata.isPackagedPawImageUrl('/STATIC/pet.png'), true)
  assert.equal(metadata.isPackagedPawImageUrl('cloud://bucket/pet.png'), false)
  assert.equal(
    metadata.readCompressedPawImageUrl({ tempFilePath: '/tmp/compressed.png' }),
    '/tmp/compressed.png',
  )
  assert.equal(metadata.readCompressedPawImageUrl({ tempFilePath: 'relative.png' }), '')
  assert.equal(metadata.normalizePawImageDisplayMode('original'), 'original')
  assert.equal(metadata.normalizePawImageDisplayMode('unknown'), 'square')
})

test('PawImage preview events validate their payload shape', async () => {
  const metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'components/base/pawImageMetadata.ts')).href}?events=${Date.now()}`
  )
  assert.equal(
    metadata.isPawImagePreviewPayload({ current: '/a.png', currentIndex: 0, urls: ['/a.png'] }),
    true,
  )
  assert.equal(
    metadata.isPawImagePreviewPayload({
      current: '/a.png',
      currentIndex: Number.NaN,
      urls: ['/a.png'],
    }),
    false,
  )
  assert.equal(
    metadata.isPawImagePreviewPayload({ current: '/a.png', currentIndex: 0, urls: ['/a.png', 2] }),
    false,
  )
  assert.equal(metadata.isPawImageEvent({ type: 'load', detail: { width: 32, height: 32 } }), true)
  assert.equal(metadata.isPawImageEvent({}), false)
  assert.equal(metadata.isPawImageEvent({ type: 1 }), false)
  assert.equal(metadata.isPawImageEvent(null), false)
})

test('PawImage component uses explicit preview source and event contracts without any', async () => {
  const source = await fs.readFile(path.join(ROOT, 'components/base/PawImage.vue'), 'utf8')
  const metadataSource = await fs.readFile(
    path.join(ROOT, 'components/base/pawImageMetadata.ts'),
    'utf8',
  )
  for (const file of [source, metadataSource]) {
    assert.doesNotMatch(file, /\bany\b/)
    assert.doesNotMatch(file, /as\s+any/)
    assert.doesNotMatch(file, /Record<string,\s*any>/)
  }
  assert.match(source, /previewUrls:\s*\{\s*type:\s*Array as PropType<PawImagePreviewSource\[\]>/)
  assert.match(source, /preview:\s*\(payload:\s*PawImagePreviewPayload\)/)
  assert.match(source, /Promise\.all\(urls\.map\(preparePreviewImageUrl\)\)/)
})
