'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('image cropper state factory returns fresh typed drag and pinch state', async () => {
	const metadata = await import(pathToFileURL(path.join(ROOT, 'packages/yard/services/imageCropperMetadata.ts')).href + '?state=' + Date.now())
	const first = metadata.createPawImageCropperState()
	const second = metadata.createPawImageCropperState()

	assert.deepEqual(first, {
		imagePath: '', imageInfo: null, baseWidth: 0, baseHeight: 0,
		offsetX: 0, offsetY: 0, scaleValue: 1, loading: false, touchState: null,
	})
	first.touchState = { type: 'pinch', distance: 40, scale: 1.2 }
	assert.equal(second.touchState, null)
	assert.equal(first.touchState.type, 'pinch')
})

test('image cropper normalizes native image metadata and path results', async () => {
	const metadata = await import(pathToFileURL(path.join(ROOT, 'packages/yard/services/imageCropperMetadata.ts')).href + '?normalize=' + Date.now())

	assert.deepEqual(metadata.normalizePawImageCropperInfo({ width: 640, height: '480' }), { width: 640, height: 480 })
	assert.equal(metadata.normalizePawImageCropperInfo({ width: Infinity, height: 480 }), null)
	assert.equal(metadata.normalizePawImageCropperInfo({ width: 640 }), null)
	assert.equal(metadata.normalizePawImageCropperPath('/tmp/cropped.png'), '/tmp/cropped.png')
	assert.equal(metadata.normalizePawImageCropperPath(''), null)
})

test('image cropper component uses explicit state, touch, result, and emit contracts without any', async () => {
	const component = await fs.readFile(path.join(ROOT, 'packages/yard/pages/create/components/form/PawImageCropper.vue'), 'utf8')
	const metadata = await fs.readFile(path.join(ROOT, 'packages/yard/services/imageCropperMetadata.ts'), 'utf8')

	assert.doesNotMatch(component, /\bany\b/)
	assert.doesNotMatch(metadata, /\bany\b/)
	assert.match(component, /data\(\): PawImageCropperState/)
	assert.match(component, /onTouchStart\(event: PawEvent\)/)
	assert.match(component, /'update:visible': \(value: boolean\)/)
	assert.match(component, /confirm: \(path: string\)/)
	assert.match(metadata, /type PawImageCropperTouchState = PawImageCropperPinchState \| PawImageCropperDragState/)
})
