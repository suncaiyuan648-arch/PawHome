'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('animal roster entry pages share explicit, isolated state metadata', async () => {
  const metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'packages/animal/services/rosterEntryMetadata.ts')).href}?test=${Date.now()}`
  )
  const owned = metadata.createAnimalRosterEntryPageState('owned')
  const sponsored = metadata.createAnimalRosterEntryPageState('sponsored')
  const nextOwned = metadata.createAnimalRosterEntryPageState('owned')

  assert.deepEqual(owned, { userId: '', ready: false, message: '缺少用户 ID，无法读取我的宠物' })
  assert.deepEqual(sponsored, {
    userId: '',
    ready: false,
    message: '缺少用户 ID，无法读取云养宠物',
  })
  owned.userId = 'local change'
  owned.ready = true
  assert.deepEqual(nextOwned, {
    userId: '',
    ready: false,
    message: '缺少用户 ID，无法读取我的宠物',
  })
})

test('animal roster route IDs are read from unknown and reject malformed values', async () => {
  const metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'packages/animal/services/rosterEntryMetadata.ts')).href}?route=${Date.now()}`
  )
  assert.equal(metadata.normalizeAnimalRosterEntryUserId({ userId: '  actor-1  ' }), 'actor-1')
  assert.equal(metadata.normalizeAnimalRosterEntryUserId({ userId: 123 }), '123')
  for (const value of [
    null,
    [],
    'actor-1',
    { userId: '' },
    { userId: 0 },
    { userId: true },
    { userId: 'bad/id' },
    { userId: 'a'.repeat(129) },
  ]) {
    assert.equal(metadata.normalizeAnimalRosterEntryUserId(value), '')
  }
})

test('animal roster entry pages use shared domain event types without any annotations', async () => {
  const files = [
    'packages/animal/pages/mine/index.vue',
    'packages/animal/pages/sponsored/index.vue',
    'packages/animal/services/rosterEntryMetadata.ts',
  ]
  const sources = await Promise.all(files.map((file) => fs.readFile(path.join(ROOT, file), 'utf8')))
  for (const source of sources) {
    assert.doesNotMatch(source, /\bany\b/)
    assert.doesNotMatch(source, /Record\s*<\s*string\s*,\s*any\s*>/)
  }
  assert.match(sources[0], /data\(\):\s*AnimalRosterEntryPageState/)
  assert.match(sources[0], /openPetDetail\(pet:\s*YardPet\)/)
  assert.match(sources[1], /openYardDetail\(yard:\s*PetRosterYardInfo\)/)
  assert.match(sources[1], /openYardPets\(yard:\s*PetRosterYardInfo\)/)
  assert.match(sources[1], /openPetDetail\(pet:\s*YardPet\)/)
})
