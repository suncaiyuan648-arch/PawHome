'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after, beforeEach } = require('node:test')
const { auditSourceBoundaries } = require('../../scripts/lib/package-audit-boundaries.cjs')

const ROOT = path.resolve(__dirname, '../..')
const ADOPTION_KEY = 'PAWHOME_ADOPTIONS'
const RESCUE_KEY = 'PAWHOME_RESCUES'
const FEEDING_KEY = 'PAWHOME_FEEDING_ORDERS'
const DYNAMIC_KEY = 'PAWHOME_DYNAMIC_RECORDS'

let tempRoot
let api
let readersApi
let storage
let writes

function actor(id, roles) {
	return { id, roles }
}

function contextFor(value) {
	return Object.freeze({ actor: Object.freeze({ id: value.id, roles: Object.freeze(value.roles.slice()) }) })
}

function seed(key, records) {
	storage.set(key, JSON.stringify(records))
}

function adoption(overrides = {}) {
	return {
		id: 'adoption-real-a',
		applicationId: 'adoption-real-a',
		applicationType: 'adoption',
		applicantId: 'actor-a',
		ownerPawId: 'owner-a',
		status: 'pending',
		cloudParentRequired: false,
		...overrides,
	}
}

function rescue(overrides = {}) {
	return {
		id: 'rescue-real-a',
		rescueId: 'rescue-real-a',
		applicationType: 'rescue',
		applicant: { id: 'actor-a', name: '申请人' },
		applicationStatus: 'platform_pending',
		status: 'pending',
		...overrides,
	}
}

before(async () => {
	tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-task-domain-readers-'))
	await fs.cp(path.join(ROOT, 'contracts'), path.join(tempRoot, 'contracts'), { recursive: true })
	await fs.writeFile(path.join(tempRoot, 'package.tson'), '{"type":"module"}\n')
	await fs.cp(path.join(ROOT, 'services/domainReads'), path.join(tempRoot, 'services/domainReads'), { recursive: true })
	for (const dir of [
		'navigation', 'utils', 'packages/account/services',
		'packages/adoption/services', 'packages/rescue/services',
	]) await fs.mkdir(path.join(tempRoot, dir), { recursive: true })
	for (const file of ['actorCapabilities.ts', 'taskContracts.ts', 'taskReadModel.ts', 'adoptionConditionContract.ts', 'adoptionReviewContract.ts', 'rescueListContract.ts']) {
		await fs.copyFile(path.join(ROOT, 'navigation', file), path.join(tempRoot, 'navigation', file))
	}
	for (const file of ['adoptionStorage.ts', 'adoptionMockData.ts', 'rescueStorage.ts']) {
		await fs.copyFile(path.join(ROOT, 'utils', file), path.join(tempRoot, 'utils', file))
	}
	await fs.copyFile(path.join(ROOT, 'packages/account/services/taskAdapter.ts'), path.join(tempRoot, 'packages/account/services/taskAdapter.ts'))
	await fs.copyFile(path.join(ROOT, 'packages/account/services/domainTaskReaders.ts'), path.join(tempRoot, 'packages/account/services/domainTaskReaders.ts'))
	await fs.copyFile(path.join(ROOT, 'packages/adoption/services/applicationAdapter.ts'), path.join(tempRoot, 'packages/adoption/services/applicationAdapter.ts'))
	await fs.copyFile(path.join(ROOT, 'packages/adoption/services/actorCapabilities.ts'), path.join(tempRoot, 'packages/adoption/services/actorCapabilities.ts'))
	await fs.copyFile(path.join(ROOT, 'packages/adoption/services/adoptionConditionContract.ts'), path.join(tempRoot, 'packages/adoption/services/adoptionConditionContract.ts'))
	await fs.copyFile(path.join(ROOT, 'packages/adoption/services/reviewAdapter.ts'), path.join(tempRoot, 'packages/adoption/services/reviewAdapter.ts'))
	await fs.copyFile(path.join(ROOT, 'packages/rescue/services/lists.ts'), path.join(tempRoot, 'packages/rescue/services/lists.ts'))
	await fs.copyFile(path.join(ROOT, 'packages/rescue/services/stateContract.ts'), path.join(tempRoot, 'packages/rescue/services/stateContract.ts'))
	await fs.copyFile(path.join(ROOT, 'packages/rescue/services/stateAdapter.ts'), path.join(tempRoot, 'packages/rescue/services/stateAdapter.ts'))

	storage = new Map()
	writes = []
	globalThis.uni = {
		getStorageSync(key) { return storage.get(key) },
		setStorageSync(key, value) { writes.push({ key, value }); storage.set(key, value) },
		removeStorageSync(key) { storage.delete(key) },
	}
	api = await import(`${pathToFileURL(path.join(tempRoot, 'packages/account/services/taskAdapter.ts')).href}?test=${Date.now()}-${Math.random()}`)
	readersApi = await import(`${pathToFileURL(path.join(tempRoot, 'packages/account/services/domainTaskReaders.ts')).href}?test=${Date.now()}-${Math.random()}`)
})

beforeEach(() => {
	storage.clear()
	writes.length = 0
})

after(async () => {
	if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
	delete globalThis.uni
})

test('task composition and domain entry points have no cross-subpackage or main-to-subpackage dependency', () => {
	const audit = auditSourceBoundaries(tempRoot)
	assert.deepEqual(audit.missing, [])
	assert.deepEqual(audit.crossPackage, [])
	assert.deepEqual(audit.unresolvedDynamic, [])
	assert.equal(audit.pass, true)
})

test('binds persisted adoption and rescue read adapters into canonical task summaries', () => {
	seed(ADOPTION_KEY, [adoption()])
	seed(RESCUE_KEY, [rescue()])
	const sourceReaders = readersApi.createDomainTaskReaders()
	const result = api.readAccountTasks({
		actorProvider: () => ({ actor: actor('actor-a', ['applicant']) }),
		readers: sourceReaders,
	})
	assert.deepEqual(result.all.map(item => [item.businessType, item.businessId, item.actionType, item.status]), [
		['adoption', 'adoption-real-a', 'apply', 'pending'],
		['rescue', 'rescue-real-a', 'apply', 'pending'],
	])
	assert.equal(result.all.every(item => item.actorId === 'actor-a'), true)
	assert.equal(result.readOnly, true)
	assert.equal(result.canWrite, false)
	assert.equal(Object.isFrozen(result), true)
	assert.equal(Object.isFrozen(result.all[0]), true)
	assert.ok(result.diagnostics.skipped.some(item => item.domain === 'feeding' && item.code === 'READER_MISSING'))
	assert.ok(result.diagnostics.skipped.some(item => item.domain === 'dynamic' && item.code === 'READER_MISSING'))
	assert.deepEqual(writes, [])
})

test('feeding and dynamic readers bind their persisted records without fixture fallback', () => {
	seed(FEEDING_KEY, [
		{ id: 'order-real-a', userId: 'actor-a', yardId: 'yard-a', status: 'active' },
		{ id: 'order-other', userId: 'actor-b', yardId: 'yard-a', status: 'active' },
	])
	seed(DYNAMIC_KEY, [
		{ id: 'dynamic-real-a', authorId: 'actor-a', status: 'draft' },
		{ id: 'dynamic-other', authorId: 'actor-b', status: 'published' },
	])
	const result = api.readAccountTasks({
		actorProvider: () => ({ actor: actor('actor-a', ['applicant']) }),
		readers: readersApi.createDomainTaskReaders(),
	})
	assert.deepEqual(result.all.map(item => [item.businessType, item.businessId, item.actorRole, item.actionType, item.status]), [
		['feeding', 'order-real-a', 'donor', 'feedback', 'in_progress'],
		['dynamic', 'dynamic-real-a', 'author', 'publish', 'pending'],
	])
	assert.equal(result.diagnostics.skipped.some(item => item.code === 'READER_MISSING'), false)
	assert.equal(result.readOnly, true)
	assert.equal(result.canWrite, false)
	assert.deepEqual(writes, [])
})

test('review readers use explicit reviewer relation and map only canonical review status', () => {
	seed(ADOPTION_KEY, [adoption({
		id: 'adoption-review-a',
		applicationId: 'adoption-review-a',
		applicantId: 'applicant-a',
		ownerPawId: 'owner-a',
		status: 'pending',
		review: {
			applicationType: 'adoption',
			applicationId: 'adoption-review-a',
			reviewItemId: 'review-adoption-a',
			phase: 'owner',
			reviewerRole: 'owner',
			reviewerId: 'owner-a',
			status: 'pending',
		},
	})])
	seed(RESCUE_KEY, [rescue({
		id: 'rescue-review-a',
		rescueId: 'rescue-review-a',
		applicant: { id: 'applicant-b' },
		reviewItemId: 'review-rescue-a',
		reviewerId: 'reviewer-a',
		status: 'approved',
		applicationStatus: 'platform_approved',
	})])
	const result = api.readAccountTasks({
		actorProvider: () => ({ actor: actor('owner-a', ['owner']) }),
		readers: readersApi.createDomainTaskReaders(),
	})
	assert.deepEqual(result.all.map(item => [item.businessType, item.businessId, item.actorRole, item.actionType, item.status, item.reviewItemId]), [
		['adoption', 'adoption-review-a', 'owner', 'review', 'pending', 'review-adoption-a'],
	])

	const reviewer = api.readAccountTasks({
		actorProvider: () => ({ actor: actor('reviewer-a', ['reviewer']) }),
		readers: readersApi.createDomainTaskReaders(),
	})
	assert.deepEqual(reviewer.all.map(item => [item.businessType, item.businessId, item.actionType, item.status, item.reviewItemId]), [
		['rescue', 'rescue-review-a', 'review', 'processed', 'review-rescue-a'],
	])
})

test('application and rescue readers fail closed for demos, malformed states, and cross-user data', () => {
	seed(ADOPTION_KEY, [
		adoption({ id: 'demo-pending', applicationId: 'demo-pending', applicantId: 'actor-a' }),
		adoption({ id: 'adoption-other', applicationId: 'adoption-other', applicantId: 'actor-b' }),
		adoption({ id: 'adoption-unknown', applicationId: 'adoption-unknown', status: 'made-up' }),
	])
	seed(RESCUE_KEY, [rescue({ id: 'rescue-invalid', rescueId: 'rescue-invalid', applicationStatus: 'made-up' })])
	const result = api.readAccountTasks({
		actorProvider: () => ({ actor: actor('actor-a', ['applicant']) }),
		readers: readersApi.createDomainTaskReaders(),
	})
	assert.equal(result.all.some(item => item.businessId === 'demo-pending'), false)
	assert.equal(result.all.some(item => item.businessId === 'adoption-other'), false)
	assert.equal(result.all.some(item => item.businessId === 'adoption-unknown'), false)
	assert.equal(result.all.some(item => item.businessId === 'rescue-invalid'), false)
	assert.ok(result.diagnostics.skipped.some(item => ['UNKNOWN_APPLICATION_STATUS', 'INVALID_STATUS'].includes(item.code)))
	assert.deepEqual(writes, [])
})

test('each domain reader accepts only the frozen actor context and missing domains stay explicit', () => {
	const sourceReaders = readersApi.createDomainTaskReaders()
	const actorValue = actor('actor-a', ['applicant'])
	assert.throws(() => sourceReaders.adoption({ actor: actorValue }), error => error.code === 'INVALID_READER_CONTEXT')
	assert.throws(() => sourceReaders.rescue({ actor: actorValue, query: 'forged' }), error => error.code === 'INVALID_READER_CONTEXT')
	const context = contextFor(actorValue)
	const feeding = sourceReaders.feeding(context)
	const dynamic = sourceReaders.dynamic(context)
	assert.equal(feeding.error.code, 'READER_MISSING')
	assert.equal(dynamic.error.code, 'READER_MISSING')
	assert.equal(feeding.canWrite, false)
	assert.equal(dynamic.readOnly, true)
	assert.equal(Object.isFrozen(feeding), true)
})

test('reader errors and asynchronous reader injection are handled by taskAdapter without writes', async () => {
	const sourceReaders = readersApi.createDomainTaskReaders()
	const result = api.readAccountTasks({
		actorProvider: () => ({ actor: actor('actor-a', ['applicant']) }),
		readers: {
			...sourceReaders,
			adoption: () => { throw Object.assign(new Error('broken'), { code: 'ADOPTION_SOURCE_FAILED' }) },
			rescue: () => Promise.resolve([]),
		},
	})
	assert.deepEqual(result.all, [])
	assert.ok(result.diagnostics.skipped.some(item => item.code === 'ADOPTION_SOURCE_FAILED'))
	assert.ok(result.diagnostics.skipped.some(item => item.code === 'ASYNC_RESOLVER_UNSUPPORTED'))
	assert.deepEqual(writes, [])
	await Promise.resolve()
})
