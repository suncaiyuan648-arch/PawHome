'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const METADATA_PATH = path.join(ROOT, 'packages/account/services/helpedAnimalsMetadata.ts')

test('helped-animal photo metadata preserves the mock order and isolates page copies', async () => {
	const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
	const first = metadata.createHelpedAnimalsPageMetadata()
	const second = metadata.createHelpedAnimalsPageMetadata()

	assert.equal(first.photoList.length, 11)
	assert.equal(first.photoList[0], '/static/figma/helped/animal-01.jpg')
	assert.equal(first.photoList[6], '/static/figma/helped/animal-07.png')
	assert.equal(first.photoList[10], '/static/figma/helped/animal-11.jpg')
	first.photoList[0] = 'page-local'
	assert.equal(second.photoList[0], '/static/figma/helped/animal-01.jpg')
})

test('helped-animal preview options select a valid photo and reject invalid indexes', async () => {
	const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
	const photos = metadata.createHelpedAnimalsPageMetadata().photoList
	const selection = metadata.createHelpedAnimalPreviewOptions(photos, 3)

	assert.deepEqual(selection, { urls: photos, current: '/static/figma/helped/animal-04.jpg' })
	assert.notEqual(selection.urls, photos)
	assert.equal(metadata.createHelpedAnimalPreviewOptions(photos, -1), null)
	assert.equal(metadata.createHelpedAnimalPreviewOptions(photos, 11), null)
	assert.equal(metadata.createHelpedAnimalPreviewOptions(photos, 1.5), null)
})

test('helped-animal page consumes typed metadata without explicit any annotations', async () => {
	const page = await fs.readFile(path.join(ROOT, 'packages/account/pages/helped-animals/index.vue'), 'utf8')
	const metadata = await fs.readFile(METADATA_PATH, 'utf8')
	assert.doesNotMatch(page, /\bany\b/)
	assert.doesNotMatch(page, /Record<string,\s*any>/)
	assert.match(page, /data\(\):\s*HelpedAnimalsPageState/)
	assert.match(page, /onThumbTap\(index:\s*number\)/)
	assert.match(page, /createHelpedAnimalPreviewOptions\(this\.photoList, index\)/)
	assert.doesNotMatch(metadata, /\bany\b/)
})
