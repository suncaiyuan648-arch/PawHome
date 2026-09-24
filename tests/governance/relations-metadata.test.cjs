'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('relation fixtures have stable user fields and isolated follow/fans state', async () => {
  const metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'packages/account/services/relationMetadata.ts')).href}?test=${Date.now()}`
  )
  const first = metadata.createRelationsPageMetadata()
  const second = metadata.createRelationsPageMetadata()
  assert.equal(first.listTab, 'follow')
  assert.equal(first.followingRows.length, 5)
  assert.equal(first.fansRows.length, 5)
  assert.deepEqual(
    first.followingRows.map((row) => row.pawId),
    ['23456789', '23456790', '23456791', '23456792', '23456793'],
  )
  assert.ok(
    first.followingRows.every(
      (row) => row.nickname === 'Q' && row.fansCount === 315 && !row.followed,
    ),
  )

  first.followingRows[0].followed = true
  first.fansRows[0].nickname = 'page-local'
  assert.equal(first.fansRows[0].followed, false)
  assert.equal(second.followingRows[0].followed, false)
  assert.equal(second.fansRows[0].nickname, 'Q')
  assert.notEqual(first.followingRows[0], first.fansRows[0])
})

test('relation route options normalize encoded identity and legacy tab names', async () => {
  const metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'packages/account/services/relationMetadata.ts')).href}?test=${Date.now()}`
  )
  assert.deepEqual(
    metadata.normalizeRelationsRouteOptions({
      userId: 'paw%3A1',
      pawId: 'ignored',
      nickname: '%E6%99%93%E6%99%93',
      tab: 'FOLLOWERS',
    }),
    { pageTitle: '晓晓', ownerPawId: 'paw:1', listTab: 'fans' },
  )
  assert.deepEqual(
    metadata.normalizeRelationsRouteOptions({ userId: '', pawId: 'legacy-paw-id', tab: 'fans' }),
    {
      pageTitle: '',
      ownerPawId: 'legacy-paw-id',
      listTab: 'fans',
    },
  )
  assert.equal(
    metadata.normalizeRelationsRouteOptions({ nickname: '%E0%A4%A' }).pageTitle,
    '%E0%A4%A',
  )
  assert.deepEqual(metadata.normalizeRelationsRouteOptions(null), {
    pageTitle: '',
    ownerPawId: '',
    listTab: 'follow',
  })
})

test('relations page consumes shared typed metadata without explicit any annotations', async () => {
  const page = await fs.readFile(
    path.join(ROOT, 'packages/account/pages/relations/index.vue'),
    'utf8',
  )
  const metadata = await fs.readFile(
    path.join(ROOT, 'packages/account/services/relationMetadata.ts'),
    'utf8',
  )
  assert.doesNotMatch(page, /\bany\b/)
  assert.doesNotMatch(page, /Record<string,\s*any>/)
  assert.match(page, /data\(\):\s*RelationsPageState/)
  assert.match(page, /onLoad\(query:\s*unknown/)
  assert.match(page, /createRelationsPageMetadata\(\)/)
  assert.doesNotMatch(metadata, /\bany\b/)
})
