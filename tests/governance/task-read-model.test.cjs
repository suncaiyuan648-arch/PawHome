'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
let tempRoot
let api

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-task-read-model-'))
  await fs.writeFile(path.join(tempRoot, 'package.tson'), '{"type":"module"}\n')
  await Promise.all(
    ['actorCapabilities.ts', 'taskContracts.ts', 'taskReadModel.ts'].map((file) =>
      fs.copyFile(path.join(ROOT, 'navigation', file), path.join(tempRoot, file)),
    ),
  )
  api = await import(
    `${pathToFileURL(path.join(tempRoot, 'taskReadModel.ts')).href}?test=${Date.now()}`
  )
})

after(async () => {
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

function actor(id = 'actor-001', roles = ['applicant', 'reviewer']) {
  return { id, roles }
}

function task(overrides = {}) {
  return {
    businessType: 'adoption',
    businessId: 'adopt-001',
    actorId: 'actor-001',
    actorRole: 'applicant',
    actionType: 'confirm',
    status: 'pending',
    reviewItemId: 'review-001',
    ...overrides,
  }
}

test('aggregates injected domains into frozen pending/processed read buckets', () => {
  const seen = []
  const result = api.readTaskSummaries({
    actorProvider: () => actor(),
    resolvers: {
      adoption: (context) => {
        seen.push(context)
        return [
          task(),
          task({ actionType: 'review', actorRole: 'reviewer', reviewItemId: 'review-002' }),
        ]
      },
      rescue: ({ actor: trusted }) => [
        {
          businessType: 'rescue',
          businessId: 'rescue-001',
          actorId: trusted.id,
          actorRole: 'reviewer',
          actionType: 'review',
          status: 'processed',
          reviewItemId: 'review-003',
        },
      ],
      feeding: ({ actor: trusted }) => [
        {
          businessType: 'feeding',
          businessId: 'feed-001',
          actorId: trusted.id,
          actorRole: 'donor',
          actionType: 'feedback',
          status: 'pending',
        },
      ],
      dynamic: ({ actor: trusted }) => [
        {
          businessType: 'dynamic',
          businessId: 'dynamic-001',
          actorId: trusted.id,
          actorRole: 'author',
          actionType: 'publish',
          status: 'completed',
        },
      ],
    },
  })

  assert.equal(result.all.length, 5)
  assert.equal(result.pending.length, 3)
  assert.equal(result.processed.length, 2)
  assert.deepEqual(
    result.all.map((item) => item.businessType),
    ['adoption', 'adoption', 'rescue', 'feeding', 'dynamic'],
  )
  assert.equal(Object.isFrozen(result.all), true)
  assert.equal(Object.isFrozen(result.pending[0]), true)
  assert.equal(Object.isFrozen(result.diagnostics), true)
  assert.equal(seen.length, 1)
  assert.deepEqual(Object.keys(seen[0]), ['actor'])
  assert.equal('query' in seen[0], false)
})

test('refresh duplicates de-duplicate by taskId and processed state wins', () => {
  const result = api.readTaskSummaries({
    actorProvider: () => actor(),
    resolvers: {
      adoption: () => [
        task({ status: 'pending', actorRole: 'applicant' }),
        task({ status: 'pending', actorRole: 'reviewer' }),
        task({ status: 'processed', actorRole: 'applicant' }),
      ],
    },
  })
  assert.equal(result.all.length, 1)
  assert.equal(result.all[0].status, 'processed')
  assert.equal(result.all[0].businessId, 'adopt-001')
  assert.equal(result.all[0].reviewItemId, 'review-001')
  assert.equal(result.diagnostics.accepted, 1)
})

test('actorRole and status are metadata and cannot grant a write capability', () => {
  const result = api.readTaskSummaries({
    actorProvider: () => actor('actor-001', ['applicant']),
    resolvers: {
      adoption: () => [task({ actorRole: 'owner', status: 'completed' })],
    },
  })
  assert.equal(result.all.length, 1)
  assert.equal(result.all[0].actorRole, 'owner')
  assert.equal(result.all[0].status, 'completed')
  assert.equal(
    api.createTaskReadModel({ actorProvider: () => actor(), resolvers: {} }).canWrite(),
    false,
  )
})

test('malformed, forged, URL, query, and cross-domain candidates are skipped', () => {
  const writes = { count: 0 }
  const result = api.readTaskSummaries({
    actorProvider: () => actor(),
    resolvers: {
      adoption: () => [
        task({ actorId: 'actor-999' }),
        task({
          businessType: 'rescue',
          businessId: 'rescue-001',
          actorRole: 'reviewer',
          actionType: 'review',
          reviewItemId: 'review-002',
        }),
        task({ businessId: 'https://evil.test/adopt-001' }),
        task({ status: 'approved' }),
        task({ actorRole: 'not-a-role' }),
        task({ query: '/packages/adoption/pages/review/detail/index' }),
        task({
          write: () => {
            writes.count += 1
          },
        }),
        task({ businessId: 'rescue-001' }),
      ],
    },
  })
  assert.equal(result.all.length, 0)
  assert.equal(result.diagnostics.accepted, 0)
  assert.equal(result.diagnostics.skipped.length, 8)
  assert.equal(writes.count, 0)
  assert.equal(
    result.all.some((item) =>
      Object.values(item).some((value) => typeof value === 'string' && value.includes('/')),
    ),
    false,
  )
})

test('resolver failures and async/invalid results are explicit skips without blocking healthy domains', () => {
  let healthyCalls = 0
  const result = api.readTaskSummaries({
    actorProvider: () => actor(),
    resolvers: {
      adoption: () => {
        throw new Error('fixture failed')
      },
      rescue: () => Promise.reject(new Error('async failure')),
      feeding: () => ({ data: [] }),
      dynamic: () => {
        healthyCalls += 1
        return [
          {
            businessType: 'dynamic',
            businessId: 'dynamic-001',
            actorId: 'actor-001',
            actorRole: 'author',
            actionType: 'publish',
            status: 'pending',
          },
        ]
      },
    },
  })
  assert.equal(healthyCalls, 1)
  assert.equal(result.all.length, 1)
  assert.deepEqual(
    result.diagnostics.skipped.map((item) => item.code),
    ['RESOLVER_FAILED', 'ASYNC_RESOLVER_UNSUPPORTED', 'INVALID_RESOLVER_RESULT'],
  )
})

test('conflicting duplicate business落点 is discarded fail-closed', () => {
  const result = api.readTaskSummaries({
    actorProvider: () => actor(),
    resolvers: {
      adoption: () => [
        task({ reviewItemId: 'review-001' }),
        task({ reviewItemId: 'review-999', status: 'processed' }),
      ],
    },
  })
  assert.equal(result.all.length, 0)
  assert.equal(result.diagnostics.accepted, 0)
  assert.equal(result.diagnostics.skipped.at(-1).code, 'DUPLICATE_CONFLICT')
})

test('missing or failed trusted actor is fail-closed and does not call resolvers', () => {
  let calls = 0
  const missing = api.readTaskSummaries({
    actorProvider: () => null,
    resolvers: {
      adoption: () => {
        calls += 1
        return [task()]
      },
    },
  })
  assert.equal(missing.all.length, 0)
  assert.equal(missing.diagnostics.actorError.code, 'NO_ACTOR')

  const failed = api.readTaskSummaries({
    actorProvider: () => {
      throw new Error('session unavailable')
    },
    resolvers: {
      adoption: () => {
        calls += 1
        return [task()]
      },
    },
  })
  assert.equal(failed.all.length, 0)
  assert.equal(failed.diagnostics.actorError.code, 'ACTOR_PROVIDER_FAILED')
  assert.equal(calls, 0)
})

test('createTaskReadModel resolves actor afresh so session switching cannot reuse stale tasks', () => {
  let current = actor('actor-001')
  const model = api.createTaskReadModel({
    actorProvider: () => current,
    resolvers: {
      adoption: ({ actor: trusted }) => [task({ actorId: trusted.id })],
    },
  })
  assert.equal(model.read().all[0].actorId, 'actor-001')
  current = actor('actor-002')
  assert.equal(model.aggregate().all[0].actorId, 'actor-002')
})
