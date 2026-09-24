'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('yard roster entry pages consume shared pet and owner models without explicit any types', async () => {
  const publicPage = await fs.readFile(
    path.join(ROOT, 'packages/yard/pages/animals/index.vue'),
    'utf8',
  )
  const managedPage = await fs.readFile(
    path.join(ROOT, 'packages/yard/pages/manage/animals/index.vue'),
    'utf8',
  )

  for (const source of [publicPage, managedPage]) {
    assert.doesNotMatch(source, /\bany\b/)
    assert.doesNotMatch(source, /as\s+any/)
    assert.ok(source.includes("import type { YardPet } from '@/utils/yardMock.ts'"))
    assert.match(source, /onLoad\(options: unknown = \{\}\)/)
  }

  assert.match(publicPage, /data\(\): YardAnimalsPageState/)
  assert.ok(
    publicPage.includes("import type { PetRosterCardOwner } from '@/utils/petRosterMockApi.ts'"),
  )
  assert.match(managedPage, /data\(\): YardManagedAnimalsPageState/)
  assert.match(managedPage, /isYardRosterController\(roster\)/)
  assert.match(managedPage, /UniNamespace\.ShowActionSheetRes/)
})
