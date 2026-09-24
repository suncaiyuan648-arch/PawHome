'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('shared avatar consumers use one profile contract for yard and dynamic feeders', async () => {
  const metadata = await fs.readFile(path.join(ROOT, 'utils/avatarStackMetadata.ts'), 'utf8')
  const detail = await fs.readFile(
    path.join(ROOT, 'packages/dynamic/services/detailMetadata.ts'),
    'utf8',
  )
  const yard = await fs.readFile(path.join(ROOT, 'utils/yardMock.ts'), 'utf8')
  const stack = await fs.readFile(path.join(ROOT, 'components/identity/PawAvatarStack.vue'), 'utf8')
  const sourceRow = await fs.readFile(
    path.join(ROOT, 'components/dynamic/FeedingSourceRow.vue'),
    'utf8',
  )

  assert.match(metadata, /interface AvatarStackProfile/)
  assert.match(metadata, /avatar:\s*string/)
  assert.match(metadata, /type AvatarStackItem = string \| AvatarStackProfile/)
  assert.match(detail, /DynamicDetailFeeder = AvatarStackItem/)
  assert.match(yard, /interface YardFeeder extends AvatarStackProfile/)
  assert.match(stack, /PropType<AvatarStackItem\[\]>/)
  assert.match(sourceRow, /PropType<AvatarStackItem\[\]>/)
})

test('shared visual component inputs avoid any and retain narrow value contracts', async () => {
  const files = [
    'components/base/PawBadge.vue',
    'components/base/PawCheckbox.vue',
    'components/base/PawDivider.vue',
    'components/dynamic/FeedingSourceRow.vue',
    'components/dynamic/VoiceComment.vue',
    'components/identity/PawAvatarStack.vue',
  ]
  const sources = await Promise.all(files.map((file) => fs.readFile(path.join(ROOT, file), 'utf8')))

  for (const source of sources) assert.doesNotMatch(source, /\bany\b/)
  assert.match(sources[0], /PropType<BadgeOffset>/)
  assert.match(sources[1], /function isCheckboxSize\(value: unknown\): value is CheckboxSize/)
  assert.match(sources[2], /function cssLength\(value: string \| number\)/)
  assert.match(sources[4], /PropType<number\[]>/)
})
