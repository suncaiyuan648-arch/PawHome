'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
let metadata

test('publish editor fixture metadata is associated and isolated per editor instance', async () => {
  metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'packages/dynamic/services/publishEditorMetadata.ts')).href}?test=${Date.now()}`
  )
  const first = metadata.createPublishEditorMocks()
  const second = metadata.createPublishEditorMocks()
  const cloudPets = first.pets.filter((pet) => pet.state === 'cloud')

  assert.ok(first.orders.length > 0)
  assert.ok(first.animals.length > 0)
  assert.ok(first.animals.every((animal) => cloudPets.some((pet) => pet.id === animal.id)))
  assert.ok(
    first.orders.every((order) =>
      order.petIds.every((petId) => first.pets.some((pet) => pet.id === petId)),
    ),
  )

  first.orders[0].petIds.push('page-local-pet')
  first.animals[0].name = 'page-local name'
  assert.ok(!second.orders[0].petIds.includes('page-local-pet'))
  assert.notEqual(second.animals[0].name, 'page-local name')
})

test('API orders and persisted animals are narrowed into publish-editor metadata', () => {
  const normalizedOrder = metadata.normalizePublishEditorOrder({
    orderId: 'api-order-1',
    name: '投喂人',
    avatar: '/avatar.png',
    animalId: 'animal-1',
    animalIds: ['animal-1'],
    petIds: ['animal-1'],
    kg: 2,
  })
  assert.equal(normalizedOrder.id, 'api-order-1')
  assert.deepEqual(normalizedOrder.petIds, ['animal-1'])
  assert.equal(normalizedOrder.userName, '投喂人')
  assert.equal(normalizedOrder.userAvatar, '/avatar.png')
  assert.equal(normalizedOrder.kg, 2)
  assert.equal(normalizedOrder.feedbackTag, '待反馈')

  assert.equal(
    metadata.normalizePublishEditorOrder({
      id: 'bad-order',
      animalIds: ['animal-1'],
      petIds: ['animal-2'],
    }),
    null,
  )
  assert.equal(metadata.normalizePublishEditorOrder({ id: 'bad-order', petIds: [] }), null)
  assert.deepEqual(
    metadata.normalizePublishEditorPet({ animalId: 'animal-1', image: '/animal.png' }),
    {
      animalId: 'animal-1',
      image: '/animal.png',
      id: 'animal-1',
      name: '猫咪',
      avatar: '/animal.png',
      state: 'cloud',
    },
  )
  assert.equal(metadata.normalizePublishEditorPet({ name: 'no id' }), null)
})

test('publish editor and selection sheets do not use explicit any annotations', async () => {
  for (const file of [
    'packages/dynamic/pages/editor/index.vue',
    'packages/dynamic/components/PawOrderSelectSheet.vue',
    'packages/dynamic/components/PawPetSelectSheet.vue',
  ]) {
    const source = await fs.readFile(path.join(ROOT, file), 'utf8')
    assert.doesNotMatch(source, /\bany\b/, `${file} still contains an any annotation`)
    assert.doesNotMatch(
      source,
      /Record\s*<\s*string\s*,\s*any\s*>/,
      `${file} still has an open any dictionary`,
    )
  }
})
