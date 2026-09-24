'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('location fallback fixtures are typed metadata and return isolated filtered copies', async () => {
	const metadata = await import(`${pathToFileURL(path.join(ROOT, 'utils/locationMetadata.ts')).href}?test=${Date.now()}`)
	const allPlaces = metadata.createLocationFallbackMetadata('长沙市')
	assert.equal(allPlaces.list.length, 7)
	const filtered = metadata.createLocationFallbackMetadata('长沙市', '鼎丰')
	assert.deepEqual(filtered.list.map(place => place.id), ['nearby-dingfeng'])
	filtered.list[0].name = 'local mutation'
	assert.equal(metadata.createLocationFallbackMetadata('长沙市').list[0].name, '鼎丰前城')
})

test('location service normalizes external candidates and uses fallback results without uni runtime', async () => {
	const service = await import(`${pathToFileURL(path.join(ROOT, 'utils/locationService.ts')).href}?test=${Date.now()}`)
	assert.deepEqual(service.normalizeLocationPlace({
		title: '地点名',
		formattedAddress: '详细地址',
		distanceMeters: 1250,
		latitude: '28.2',
		longitude: '112.9',
		privateMetadata: 'not exposed',
	}, 2), {
		id: 'location-2',
		name: '地点名',
		address: '详细地址',
		distance: '1.3km',
		latitude: 28.2,
		longitude: 112.9,
	})
	assert.deepEqual(service.normalizeLocationPlace({ name: '坐标异常', latitude: 95, longitude: '' }, 0), {
		id: 'location-0', name: '坐标异常', address: '坐标异常', distance: '',
		latitude: undefined, longitude: undefined,
	})
	assert.deepEqual(await service.fetchLocationPlaces({ city: '长沙市', keyword: '鼎丰' }), {
		city: '长沙市',
		list: [{ id: 'nearby-dingfeng', name: '鼎丰前城', address: '雨花区中意一路167号', distance: '0.4km' }],
	})
	assert.equal(await service.getPreciseLocation(), null)
})

test('location sheet uses shared place metadata and explicit state/emits without any', async () => {
	const component = await fs.readFile(path.join(ROOT, 'components/location/PawLocationPickerSheet.vue'), 'utf8')
	assert.doesNotMatch(component, /\bany\b/)
	assert.doesNotMatch(component, /Record\s*<\s*string\s*,\s*any\s*>/)
	assert.match(component, /data\(\):\s*LocationPickerState/)
	assert.match(component, /places:\s*LocationPlace\[\]/)
	assert.match(component, /searchTimer:\s*ReturnType<typeof setTimeout>\s*\|\s*null/)
	assert.match(component, /select:\s*\(place:\s*LocationPlace\)/)
})
