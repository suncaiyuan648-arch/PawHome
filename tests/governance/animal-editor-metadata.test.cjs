'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('animal editor defaults and choice options are shared metadata with isolated copies', async () => {
	const metadata = await import(`${pathToFileURL(path.join(ROOT, 'utils/animalEditorMetadata.ts')).href}?test=${Date.now()}`)
	const first = metadata.createAnimalEditorMockMetadata()
	assert.deepEqual(first, {
		form: {
			status: '待领养', name: '小坏蛋', breed: '白猫', gender: '男生', neuter: '未绝育',
			vaccine: '接种中', personality: '', desc: '',
		},
		petValue: 15,
		personalityValue: 50,
		birthValue: '2020-06-27',
	})
	first.form.name = 'local change'
	assert.equal(metadata.createAnimalEditorMockMetadata().form.name, '小坏蛋')
	const statuses = metadata.createAnimalEditorOptions('status')
	assert.deepEqual(statuses, ['待领养', '已领养', '失踪', '死亡'])
	statuses.pop()
	assert.deepEqual(metadata.createAnimalEditorOptions('status'), ['待领养', '已领养', '失踪', '死亡'])
	assert.equal(metadata.getAnimalEditorFormField('gender'), 'gender')
	assert.equal(metadata.getAnimalEditorPopupKind('sterilization'), 'neuter')
	assert.equal(metadata.getAnimalEditorPopupKind({ popup: 'status' }), null)
})

test('animal editor and selection sheet consume typed contracts without any or escape casts', async () => {
	const editor = await fs.readFile(path.join(ROOT, 'packages/animal/pages/editor/index.vue'), 'utf8')
	const sheet = await fs.readFile(path.join(ROOT, 'packages/animal/pages/editor/components/PawSelectionSheet.vue'), 'utf8')
	for (const source of [editor, sheet]) {
		assert.doesNotMatch(source, /\bany\b/)
		assert.doesNotMatch(source, /as\s+any/)
	}
	assert.match(editor, /data\(\):\s*AnimalEditorPageState/)
	assert.match(editor, /createAnimalEditorMockMetadata\(\)/)
	assert.match(editor, /getAnimalEditorPopupKind\(route\.popup\)/)
	assert.match(editor, /actorProvider\s*\}/)
	assert.match(sheet, /PropType<SelectionItem\[\]>/)
	assert.match(sheet, /data\(\):\s*PawSelectionSheetState/)
	assert.match(sheet, /NormalizedSelectionItem\[\]/)
})
