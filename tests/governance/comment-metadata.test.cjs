'use strict'

const assert = require('node:assert/strict')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('comment profile identity preserves both nested and legacy inline authors', async () => {
  const metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'components/dynamic/commentMetadata.ts')).href}?test=${Date.now()}`
  )
  assert.deepEqual(
    metadata.commentProfileIdentity({
      id: 'comment-nested',
      author: { pawId: 'user-nested', name: '嵌套作者', avatar: '/nested.png' },
    }),
    { pawId: 'user-nested', name: '嵌套作者', avatar: '/nested.png' },
  )
  assert.deepEqual(
    metadata.commentProfileIdentity({
      id: 'comment-legacy',
      name: '旧评论作者',
      avatar: '/legacy.png',
    }),
    { pawId: 'comment-legacy', name: '旧评论作者', avatar: '/legacy.png' },
  )
})
