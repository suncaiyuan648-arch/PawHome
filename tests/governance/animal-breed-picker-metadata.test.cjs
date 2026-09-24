'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('breed picker metadata provides isolated state and species-specific mock lists', async () => {
	const metadata = await import(`${pathToFileURL(path.join(ROOT, 'packages/animal/services/breedPickerMetadata.ts')).href}?test=${Date.now()}`)
	const firstState = metadata.createBreedPickerPageState()
	const secondState = metadata.createBreedPickerPageState()
	const mutableBase = metadata.createBreedPickerBaseList('cat')
	const catBreeds = metadata.createBreedPickerList('cat', ['自定义猫', '橘猫'])
	const dogBreeds = metadata.createBreedPickerList('dog', ['自定义狗'])

	assert.deepEqual(firstState, {
		kind: 'cat', searchKey: '', customList: [], selected: '', showSup: false,
		supInput: '', showSupResult: false, pendingSupBreed: '',
	})
	firstState.customList.push('local mutation')
	mutableBase.pop()
	assert.deepEqual(secondState.customList, [])
	assert.deepEqual(catBreeds, ['白猫', '橘猫', '狸花猫', '三花猫', '简州猫', '奶牛猫', '英短', '美短', '自定义猫'])
	assert.equal(metadata.createBreedPickerBaseList('cat').length, 8)
	assert.equal(dogBreeds.includes('中华田园犬'), true)
	assert.equal(dogBreeds.includes('自定义狗'), true)
	assert.deepEqual(metadata.createBreedPickerBaseList('cat').slice(0, 2), ['白猫', '橘猫'])
})

test('breed picker route, opener payload, and input events are narrowed from unknown', async () => {
	const metadata = await import(`${pathToFileURL(path.join(ROOT, 'packages/animal/services/breedPickerMetadata.ts')).href}?route=${Date.now()}`)
	assert.deepEqual(metadata.normalizeBreedPickerRoute({ species: 'dog', popup: 'supplement-input' }), {
		kind: 'dog', popup: 'supplement-input',
	})
	assert.deepEqual(metadata.normalizeBreedPickerRoute({ kind: 'dog', popup: 'untrusted' }), {
		kind: 'dog', popup: '',
	})
	assert.deepEqual(metadata.normalizeBreedPickerRoute(null), { kind: 'cat', popup: '' })
	assert.equal(metadata.normalizeBreedPickerInitPayload({ breed: '  英短  ' }), '英短')
	assert.equal(metadata.normalizeBreedPickerInitPayload({ breed: 7 }), '')
	assert.equal(metadata.readBreedPickerInputValue({ detail: { value: '搜索' } }), '搜索')
	assert.equal(metadata.readBreedPickerInputValue({ detail: { value: 7 } }), '')
	assert.equal(metadata.readBreedPickerInputValue(null), '')
})

test('breed picker consumes shared mock metadata and has no explicit any annotations', async () => {
	const page = await fs.readFile(path.join(ROOT, 'packages/animal/pages/breed-picker/index.vue'), 'utf8')
	const metadata = await fs.readFile(path.join(ROOT, 'packages/animal/services/breedPickerMetadata.ts'), 'utf8')
	for (const source of [page, metadata]) {
		assert.doesNotMatch(source, /\bany\b/)
		assert.doesNotMatch(source, /Record\s*<\s*string\s*,\s*any\s*>/)
	}
	assert.match(page, /data\(\):\s*BreedPickerPageState/)
	assert.match(page, /createBreedPickerPageState\(\)/)
	assert.match(page, /createBreedPickerList\(this\.kind, this\.customList\)/)
	assert.match(page, /normalizeBreedPickerInitPayload\(payload\)/)
	assert.match(metadata, /BREED_PICKER_MOCKS/)
})
