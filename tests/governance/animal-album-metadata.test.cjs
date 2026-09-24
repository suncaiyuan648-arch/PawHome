'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('animal album fixture and actions are shared metadata with isolated mutable copies', async () => {
  const metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'packages/animal/services/albumMetadata.ts')).href}?test=${Date.now()}`
  )
  const items = metadata.createAnimalAlbumItems()
  assert.equal(items.length, 14)
  assert.deepEqual(items[0], {
    id: 'album-01',
    src: '/static/figma/feature/album-original-01.jpeg',
    kind: 'image',
    categories: ['image', 'daily'],
    pinned: true,
    favorite: true,
  })
  assert.equal(items[7].hidden, true)
  items[0].categories.push('feeding')
  items[0].pinned = false
  assert.deepEqual(metadata.createAnimalAlbumItems()[0].categories, ['image', 'daily'])
  assert.equal(metadata.createAnimalAlbumItems()[0].pinned, true)
  assert.deepEqual(
    metadata.createAnimalAlbumFilters().map(({ key }) => key),
    ['all', 'favorite', 'image', 'video', 'feeding', 'daily'],
  )
  assert.deepEqual(
    metadata.createAnimalAlbumMenuActions().map(({ key }) => key),
    ['pin', 'favorite', 'hide', 'delete'],
  )
})

test('animal album page consumes explicit state and metadata types without any escape hatches', async () => {
  const page = await fs.readFile(path.join(ROOT, 'packages/animal/pages/album/index.vue'), 'utf8')
  assert.doesNotMatch(page, /\bany\b/)
  assert.doesNotMatch(page, /as\s+any/)
  assert.doesNotMatch(page, /Record<string,\s*any>/)
  assert.match(page, /data\(\):\s*AnimalAlbumPageState/)
  assert.match(page, /createAnimalAlbumItems\(\)/)
  assert.match(page, /onLoad\(options:\s*unknown/)
  assert.match(page, /handleAlbumMenuAction\(key:\s*AnimalAlbumMenuActionKey\)/)
})
