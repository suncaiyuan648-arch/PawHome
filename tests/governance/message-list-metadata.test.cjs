'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const METADATA_PATH = path.join(ROOT, 'packages/message/services/messageListMetadata.ts')

test('notification list metadata preserves category labels and creates isolated tabs', async () => {
  const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
  const actorProvider = () => null
  const first = metadata.createNotificationListPageMetadata(actorProvider)
  const second = metadata.createNotificationListPageMetadata(actorProvider)

  assert.equal(first.category, 'order')
  assert.deepEqual(first.tabs, [
    { key: 'interaction', label: '互动' },
    { key: 'order', label: '订单' },
    { key: 'service', label: '服务' },
    { key: 'system', label: '系统' },
    { key: 'activity', label: '活动' },
    { key: 'pet', label: '宠物' },
  ])
  assert.notEqual(first.tabs, second.tabs)
  assert.notEqual(first.tabs[0], second.tabs[0])
  assert.equal(first.actorProvider, actorProvider)
})

test('notification route options accept only supported category and scalar message IDs', async () => {
  const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
  assert.deepEqual(
    metadata.normalizeNotificationRouteOptions({ category: 'pet', messageId: 'msg-1' }),
    {
      category: 'pet',
      messageId: 'msg-1',
    },
  )
  assert.deepEqual(
    metadata.normalizeNotificationRouteOptions({ category: 'invalid', messageId: 42 }),
    { messageId: '42' },
  )
  assert.deepEqual(
    metadata.normalizeNotificationRouteOptions({ category: { value: 'order' }, messageId: null }),
    {},
  )
  assert.deepEqual(metadata.normalizeNotificationRouteOptions(null), {})
})

test('notification list page consumes service-derived types without explicit any annotations', async () => {
  const page = await fs.readFile(path.join(ROOT, 'packages/message/pages/list/index.vue'), 'utf8')
  const metadata = await fs.readFile(METADATA_PATH, 'utf8')
  assert.doesNotMatch(page, /\bany\b/)
  assert.doesNotMatch(page, /Record<string,\s*any>/)
  assert.match(page, /data\(\):\s*NotificationListPageState/)
  assert.match(page, /onLoad\(options:\s*unknown/)
  assert.match(page, /openMessage\(item:\s*NotificationMessageOpenInput\)/)
  assert.match(metadata, /ReturnType<typeof readMessages>/)
  assert.doesNotMatch(metadata, /\bany\b/)
})
