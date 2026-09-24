'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after, beforeEach } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
let tempRoot
let api
const storage = new Map()

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-dynamic-reader-'))
  await fs.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
  await fs.mkdir(path.join(tempRoot, 'packages/dynamic/services'), { recursive: true })
  await fs.copyFile(
    path.join(ROOT, 'packages/dynamic/services/reader.ts'),
    path.join(tempRoot, 'packages/dynamic/services/reader.ts'),
  )
  globalThis.uni = {
    getStorageSync(key) {
      return storage.get(key)
    },
    setStorageSync() {
      throw new Error('reader must not write')
    },
  }
  api = await import(
    `${pathToFileURL(path.join(tempRoot, 'packages/dynamic/services/reader.ts')).href}?test=${Date.now()}`
  )
})

beforeEach(() => storage.clear())
after(async () => {
  delete globalThis.uni
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

function actor(id) {
  return { id, roles: ['applicant'] }
}

test('dynamic detail reads one persisted record and normalizes every rendered field', () => {
  storage.set(
    'PAWHOME_DYNAMIC_RECORDS',
    JSON.stringify([
      {
        id: 'dynamic-real-1',
        authorId: 'actor-a',
        author: { name: '真实作者', avatar: '/author.png' },
        yard: { id: 'yard-real', name: '真实小院', avatar: '/yard.png' },
        body: '来自持久层的正文',
        media: [{ url: '/media.png' }],
        comments: [{ id: 'comment-1', copy: '当前评论' }],
        createdAt: '2026-09-19',
        location: '江西',
        likeCount: 7,
        commentCount: 1,
      },
    ]),
  )
  const result = api.readDynamicRecord('dynamic-real-1', { actor: actor('actor-a') })
  assert.equal(result.code, 'OK')
  const model = api.normalizeDynamicRecord(result.record)
  assert.equal(model.dynamicId, 'dynamic-real-1')
  assert.equal(model.yard.name, '真实小院')
  assert.equal(model.author.name, '真实作者')
  assert.equal(model.copy, '来自持久层的正文')
  assert.deepEqual(model.mediaItems, ['/media.png'])
  assert.equal(model.likes, 7)
  assert.equal(model.commentsTotal, 1)
})

test('dynamic media reader returns only usable string sources from persisted metadata', () => {
  const model = api.normalizeDynamicRecord({
    id: 'dynamic-media-1',
    mediaItems: [
      '/one.png',
      { url: '/two.png' },
      { url: 12, src: '/three.png' },
      { path: '/four.png' },
      null,
      { url: false },
    ],
  })
  assert.deepEqual(model.mediaItems, ['/one.png', '/two.png', '/three.png', '/four.png'])
})

test('public records are readable without an actor while private records stay actor scoped', () => {
  storage.set(
    'PAWHOME_DYNAMIC_RECORDS',
    JSON.stringify([
      { id: 'dynamic-public', authorId: 'actor-a', public: true },
      { id: 'dynamic-private', authorId: 'actor-a', visibility: 'private' },
    ]),
  )
  assert.equal(api.readDynamicRecord('dynamic-public', { requireActor: false }).code, 'OK')
  assert.equal(
    api.readDynamicRecord('dynamic-private', { actor: actor('actor-b') }).code,
    'FORBIDDEN',
  )
  assert.equal(api.readDynamicRecord('dynamic-private', { actor: actor('actor-a') }).code, 'OK')
})

test('missing, malformed, and forged IDs fail closed without storage writes', () => {
  assert.equal(
    api.readDynamicRecord('dynamic-real-1', { actor: actor('actor-a') }).code,
    'READER_MISSING',
  )
  storage.set('PAWHOME_DYNAMIC_RECORDS', '{broken')
  assert.equal(
    api.readDynamicRecord('dynamic-real-1', { actor: actor('actor-a') }).code,
    'INVALID_STORAGE',
  )
  assert.equal(
    api.readDynamicRecord('dynamic/evil', { actor: actor('actor-a') }).code,
    'INVALID_ID',
  )
})

test('detail page and deep-link shell share the reader instead of fixture content', async () => {
  const page = await fs.readFile(path.join(ROOT, 'packages/dynamic/pages/detail/index.vue'), 'utf8')
  const shell = await fs.readFile(
    path.join(ROOT, 'packages/dynamic/pages/deep-link/index.vue'),
    'utf8',
  )
  assert.match(page, /readDynamicRecord/)
  assert.match(page, /normalizeDynamicRecord/)
  assert.match(shell, /readDynamicRecord/)
  assert.doesNotMatch(page, /getPawHomeYardMock|DYNAMIC_DETAIL_COMMENTS|哎 又忍不住开始书写小作文/)
  assert.doesNotMatch(shell, /PAWHOME_DYNAMIC_RECORDS|rows\.find/)
})
