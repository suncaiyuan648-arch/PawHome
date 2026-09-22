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
	tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-task-adapter-'))
	await fs.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
	await fs.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
	await fs.mkdir(path.join(tempRoot, 'packages/account/services'), { recursive: true })
	await Promise.all([
		'actorCapabilities.js',
		'taskContracts.js',
		'taskReadModel.js',
	].map(file => fs.copyFile(path.join(ROOT, 'navigation', file), path.join(tempRoot, 'navigation', file))))
	await fs.copyFile(
		path.join(ROOT, 'packages/account/services/taskAdapter.js'),
		path.join(tempRoot, 'packages/account/services/taskAdapter.js')
	)
	api = await import(`${pathToFileURL(path.join(tempRoot, 'packages/account/services/taskAdapter.js')).href}?test=${Date.now()}-${Math.random()}`)
})

after(async () => {
	if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

function actor(id = 'actor-001', roles = ['applicant', 'reviewer']) {
	return { id, roles }
}

function task(domain, overrides = {}) {
	const defaults = {
		adoption: {
			businessType: 'adoption', businessId: 'adopt-001', actorRole: 'applicant',
			actionType: 'confirm', reviewItemId: 'review-adopt-001',
		},
		rescue: {
			businessType: 'rescue', businessId: 'rescue-001', actorRole: 'reviewer',
			actionType: 'review', reviewItemId: 'review-rescue-001',
		},
		feeding: {
			businessType: 'feeding', businessId: 'feed-001', actorRole: 'donor',
			actionType: 'feedback',
		},
		dynamic: {
			businessType: 'dynamic', businessId: 'post-001', actorRole: 'author',
			actionType: 'publish',
		},
	}[domain]
	return { ...defaults, actorId: 'actor-001', status: 'pending', ...overrides }
}

test('binds canonical adoption/rescue/feeding readers into a frozen read-only model', () => {
	const contexts = []
	const result = api.readAccountTasks({
		actorProvider: () => actor(),
		readers: {
			adoption: context => {
				contexts.push(context)
				return { readOnly: true, canWrite: false, items: [task('adoption')] }
			},
			rescue: context => {
				contexts.push(context)
				return [task('rescue')]
			},
			feeding: context => {
				contexts.push(context)
				return { success: true, readOnly: true, canWrite: false, data: { items: [task('feeding')] } }
			},
		},
	})

	assert.deepEqual(result.all.map(item => item.businessType), ['adoption', 'rescue', 'feeding'])
	assert.deepEqual(result.pending.map(item => item.businessId), ['adopt-001', 'rescue-001', 'feed-001'])
	assert.equal(result.readOnly, true)
	assert.equal(result.canWrite, false)
	assert.equal(Object.isFrozen(result), true)
	assert.equal(Object.isFrozen(result.all), true)
	assert.equal(Object.isFrozen(result.all[0]), true)
	assert.equal(Object.isFrozen(result.diagnostics), true)
	assert.equal(Object.isFrozen(result.diagnostics.skipped.at(-1)), true)
	assert.deepEqual(contexts.map(context => Object.keys(context)), [['actor'], ['actor'], ['actor']])
	assert.equal(Object.isFrozen(contexts[0]), true)
	assert.equal(Object.isFrozen(contexts[0].actor), true)
	assert.ok(result.diagnostics.skipped.some(item => item.code === 'READER_MISSING' && item.domain === 'dynamic'))
})

test('refreshes the trusted actor and ignores query, actorRole, and status injection', () => {
	let current = actor('actor-a', ['applicant'])
	let providerCalls = 0
	const seen = []
	const adapter = api.createTaskAdapter({
		actorProvider: () => {
			providerCalls += 1
			return { actor: current }
		},
		readers: {
			adoption: context => {
				seen.push(context)
				return [task('adoption', {
					actorId: context.actor.id,
					actorRole: 'applicant',
				})]
			},
		},
	})

	const first = adapter.read({ query: { actorId: 'actor-b' }, actorRole: 'reviewer', status: 'processed' })
	assert.equal(first.actor.id, 'actor-a')
	assert.equal(first.all[0].actorId, 'actor-a')
	current = actor('actor-b', ['applicant'])
	const second = adapter.aggregate({ query: { actorId: 'actor-a' }, actorRole: 'owner', status: 'completed' })
	assert.equal(second.actor.id, 'actor-b')
	assert.equal(second.all[0].actorId, 'actor-b')
	assert.equal(providerCalls, 2)
	assert.deepEqual(seen.map(context => Object.keys(context)), [['actor'], ['actor']])
	assert.equal(adapter.canWrite(), false)
})

test('requires explicit stable task fields and rejects aliases, query fields, forged actors, and cross-domain values', () => {
	const result = api.readAccountTasks({
		actorProvider: () => actor(),
		readers: {
			adoption: () => [
				task('adoption'),
				{ id: 'adopt-alias', actorId: 'actor-001', actorRole: 'applicant', actionType: 'apply', status: 'pending' },
				task('adoption', { query: 'actor-001' }),
				task('adoption', { actorId: 'actor-999' }),
				task('adoption', { businessType: 'rescue', businessId: 'rescue-001', actorRole: 'reviewer', actionType: 'review', reviewItemId: 'review-rescue-001' }),
				task('adoption', { businessId: 'https://evil.test/adopt-001' }),
			],
		},
	})

	assert.equal(result.all.length, 1)
	assert.equal(result.all[0].businessId, 'adopt-001')
	assert.equal(result.diagnostics.accepted, 1)
	assert.equal(result.diagnostics.scanned, 6)
	assert.equal(result.diagnostics.skipped.filter(item => item.domain === 'adoption').length, 5)
	assert.equal(result.diagnostics.skipped.some(item => item.code === 'UNKNOWN_FIELD'), true)
	assert.equal(result.diagnostics.skipped.some(item => item.code === 'ACTOR_MISMATCH'), true)
	assert.equal(result.diagnostics.skipped.some(item => item.code === 'CROSS_DOMAIN_TASK'), true)
})

test('delegates refresh de-duplication and conflicting review落点 handling to taskReadModel', () => {
	const result = api.readAccountTasks({
		actorProvider: () => actor(),
		readers: {
			adoption: () => [
				task('adoption', { status: 'pending', actorRole: 'applicant' }),
				task('adoption', { status: 'processed', actorRole: 'reviewer' }),
				task('adoption', { reviewItemId: 'review-conflict', status: 'processed' }),
			],
		},
	})

	assert.equal(result.all.length, 0)
	assert.equal(result.pending.length, 0)
	assert.equal(result.processed.length, 0)
	assert.equal(result.diagnostics.accepted, 0)
	assert.equal(result.diagnostics.skipped.find(item => item.code === 'DUPLICATE_CONFLICT').domain, 'adoption')
})

test('skips throwing, async, and invalid readers while keeping a healthy domain', () => {
	const result = api.readAccountTasks({
		actorProvider: () => actor(),
		readers: {
			adoption: () => { throw Object.assign(new Error('reader failed'), { code: 'ADOPTION_READER_FAILED' }) },
			rescue: () => Promise.resolve([task('rescue')]),
			feeding: () => ({ data: [] }),
			dynamic: () => [task('dynamic')],
		},
	})

	assert.deepEqual(result.all.map(item => item.businessType), ['dynamic'])
	assert.deepEqual(result.diagnostics.skipped.map(item => item.code), [
		'ADOPTION_READER_FAILED',
		'ASYNC_RESOLVER_UNSUPPORTED',
		'INVALID_READER_RESULT',
	])
})

test('missing or unsafe persistence evidence is an explicit empty diagnostic', () => {
	const missing = api.readAccountTasks({ actorProvider: () => actor() })
	assert.deepEqual(missing.all, [])
	assert.deepEqual(missing.diagnostics.skipped.map(item => item.code), [
		'READER_MISSING', 'READER_MISSING', 'READER_MISSING', 'READER_MISSING',
	])

	const failedSource = api.readAccountTasks({
		actorProvider: () => actor(),
		readers: {
			adoption: () => ({
				success: false,
				readOnly: true,
				canWrite: false,
				data: null,
				error: { code: 'NO_SAFE_PERSISTENCE_EVIDENCE' },
			}),
		},
	})
	assert.deepEqual(failedSource.all, [])
	assert.equal(failedSource.diagnostics.skipped.some(item => item.code === 'NO_SAFE_PERSISTENCE_EVIDENCE'), true)
	assert.equal(failedSource.diagnostics.skipped.filter(item => item.code === 'READER_MISSING').length, 3)
	assert.equal(failedSource.readOnly, true)
	assert.equal(failedSource.canWrite, false)
})

test('unknown reader domains fail closed before any configured reader is called', () => {
	let calls = 0
	const result = api.readAccountTasks({
		actorProvider: () => actor(),
		readers: {
			yard: () => { calls += 1; return [task('adoption')] },
			adoption: () => { calls += 1; return [task('adoption')] },
		},
	})

	assert.equal(calls, 0)
	assert.deepEqual(result.all, [])
	assert.equal(result.diagnostics.skipped[0].domain, 'adapter')
	assert.equal(result.diagnostics.skipped[0].code, 'UNKNOWN_READER_DOMAIN')
})

test('missing or invalid actor is fail-closed and does not invoke readers', () => {
	let calls = 0
	const result = api.readAccountTasks({
		actorProvider: () => null,
		readers: { adoption: () => { calls += 1; return [task('adoption')] } },
		query: { actorId: 'actor-001', role: 'applicant' },
	})

	assert.equal(calls, 0)
	assert.deepEqual(result.all, [])
	assert.equal(result.diagnostics.actorError.code, 'NO_ACTOR')
	assert.equal(result.readOnly, true)
	assert.equal(result.canWrite, false)
})

test('unsafe reader envelope cannot expose write capability', () => {
	const result = api.readAccountTasks({
		actorProvider: () => actor(),
		readers: {
			adoption: () => ({ readOnly: false, canWrite: true, items: [task('adoption')] }),
		},
	})

	assert.deepEqual(result.all, [])
	assert.equal(result.diagnostics.skipped[0].code, 'UNSAFE_READER_RESULT')
	assert.equal(result.readOnly, true)
	assert.equal(result.canWrite, false)
})
