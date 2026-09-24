'use strict'

const assert = require('node:assert/strict')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
let readYardEditorResource
let readAnimalEditorResource

before(async () => {
  const yardUrl = pathToFileURL(
    path.join(ROOT, 'packages/yard/services/managementEditorGate.ts'),
  ).href
  const animalUrl = pathToFileURL(
    path.join(ROOT, 'packages/animal/services/animalManagementEditorGate.ts'),
  ).href
  readYardEditorResource = (await import(`${yardUrl}?test=${Date.now()}`)).readEditorResource
  readAnimalEditorResource = (await import(`${animalUrl}?test=${Date.now()}-animal`))
    .readEditorResource
})

test('yard editor gate validates its resource and ID, then stays fail-closed', () => {
  assert.deepEqual(readYardEditorResource('yard', 'yard-a'), {
    success: false,
    error: { code: 'READER_MISSING' },
    readOnly: true,
    canWrite: false,
  })
  assert.equal(readYardEditorResource('animal', 'yard-a').error.code, 'INVALID_ID')
  assert.equal(readYardEditorResource('yard', '  ').error.code, 'INVALID_ID')
  assert.equal(readYardEditorResource('yard', 7).error.code, 'INVALID_ID')
})

test('animal editor gate validates its resource and ID, then stays fail-closed', () => {
  assert.deepEqual(readAnimalEditorResource('animal', 'animal-a'), {
    success: false,
    error: { code: 'READER_MISSING' },
    readOnly: true,
    canWrite: false,
  })
  assert.equal(readAnimalEditorResource('yard', 'animal-a').error.code, 'INVALID_ID')
  assert.equal(readAnimalEditorResource('animal', '').error.code, 'INVALID_ID')
  assert.equal(readAnimalEditorResource('animal', null).error.code, 'INVALID_ID')
})
