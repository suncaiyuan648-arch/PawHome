'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after, beforeEach } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const ADOPTION_KEY = 'PAWHOME_ADOPTIONS'

let tempRoot
let api
let storage
let reads
let writes

const POLICY_ALL = Object.freeze({
	selection: 'all',
	legalStates: ['pending', 'approved', 'rejected'],
	pendingStates: ['pending'],
	approvedStates: ['approved'],
	rejectedStates: ['rejected'],
})

function actor(id, roles) {
	return () => ({ actor: { id, roles } })
}

function base(overrides = {}) {
	return {
		id: 'adoption-real-1',
		applicantId: 'applicant-a',
		ownerPawId: 'owner-a',
		status: 'pending',
		cloudParentRequired: false,
		yardId: 'yard-a',
		yardName: '真实小院',
		ownerName: '院主 A',
		applyText: '申请说明中的私密内容',
		mediaPaths: ['/private/photo.png'],
		pets: [{ id: 'pet-a', name: '小猫', avatar: '/pet.png', privateNote: '不要泄露' }],
		...overrides,
	}
}

function seed(records) {
	storage.set(ADOPTION_KEY, JSON.stringify(records))
}

function reset() {
	storage.clear()
	reads.length = 0
	writes.length = 0
}

before(async () => {
	tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-adoption-application-adapter-'))
	await fs.cp(path.join(ROOT, 'contracts'), path.join(tempRoot, 'contracts'), { recursive: true })
	await fs.writeFile(path.join(tempRoot, 'package.tson'), '{"type":"module"}\n')
	await fs.cp(path.join(ROOT, 'services/domainReads'), path.join(tempRoot, 'services/domainReads'), { recursive: true })
	await fs.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
	await fs.mkdir(path.join(tempRoot, 'utils'), { recursive: true })
	await fs.mkdir(path.join(tempRoot, 'packages/adoption/services'), { recursive: true })
	for (const file of ['actorCapabilities.ts', 'adoptionConditionContract.ts']) {
		await fs.copyFile(path.join(ROOT, 'navigation', file), path.join(tempRoot, 'navigation', file))
	}
	await fs.copyFile(path.join(ROOT, 'utils/adoptionStorage.ts'), path.join(tempRoot, 'utils/adoptionStorage.ts'))
	await fs.copyFile(
		path.join(ROOT, 'packages/adoption/services/applicationAdapter.ts'),
		path.join(tempRoot, 'packages/adoption/services/applicationAdapter.ts')
	)
	for (const file of ['actorCapabilities.ts', 'adoptionConditionContract.ts']) {
		await fs.copyFile(
			path.join(ROOT, 'packages/adoption/services', file),
			path.join(tempRoot, 'packages/adoption/services', file)
		)
	}
	storage = new Map()
	reads = []
	writes = []
	globalThis.uni = {
		getStorageSync(key) { reads.push(key); return storage.get(key) },
		setStorageSync(key, value) { writes.push({ key, value }); storage.set(key, value) },
		removeStorageSync(key) { storage.delete(key) },
	}
	api = await import(`${pathToFileURL(path.join(tempRoot, 'packages/adoption/services/applicationAdapter.ts')).href}?test=${Date.now()}-${Math.random()}`)
})

beforeEach(reset)

after(async () => {
	if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
	delete globalThis.uni
})

test('adapter is a read-only adoption boundary and has no page, payment, or writer dependency', async () => {
	const source = await fs.readFile(path.join(ROOT, 'services/domainReads/adoption/applicationAdapter.ts'), 'utf8')
	assert.match(source, /getAdoptionRecords/)
	assert.match(source, /includeDemo:\s*false/)
	assert.match(source, /readAdoptionCondition/)
	assert.match(source, /ADOPTION_TRANSITIONS/)
	assert.doesNotMatch(source, /setStorageSync|removeStorageSync|transitionAdoption|beginReward|uni\.request/i)
	assert.deepEqual(api.ADOPTION_APPLICATION_PERSPECTIVES, ['applicant', 'owner', 'cloud_parent'])
})

test('trusted applicant receives a private current snapshot with the requested application ID', () => {
	seed([base()])
	const result = api.readAdoptionApplication('adoption-real-1', {
		actorProvider: actor('applicant-a', ['applicant']),
		query: { role: 'owner', managed: true, status: 'adoption_confirmed', outcome: 'approved' },
	})
	assert.equal(result.success, true)
	assert.equal(result.data.applicationId, 'adoption-real-1')
	assert.equal(result.data.status, 'pending')
	assert.equal(result.data.perspective, 'applicant')
	assert.equal(result.data.applyText, '申请说明中的私密内容')
	assert.equal(result.data.pets[0].privateNote, undefined)
	assert.equal(result.readOnly, true)
	assert.equal(result.canWrite, false)
	assert.equal(reads.filter(key => key === ADOPTION_KEY).length, 1)
	assert.equal(writes.length, 0)
	assert.equal(Object.isFrozen(result), true)
	assert.equal(Object.isFrozen(result.data), true)
	assert.equal(Object.isFrozen(result.data.pets[0]), true)
})

test('another applicant cannot use query role or managed flags to read the private application', () => {
	seed([base()])
	const result = api.readAdoptionApplication('adoption-real-1', {
		actorProvider: actor('applicant-b', ['applicant']),
		perspective: 'applicant',
		query: { applicantId: 'applicant-a', role: 'owner', managed: true },
	})
	assert.equal(result.success, false)
	assert.equal(result.error.code, 'FORBIDDEN')
	assert.equal(result.data, null)
	assert.equal(result.readOnly, true)
	assert.equal(writes.length, 0)
})

test('demo deep links are forbidden even when the actor matches the visible demo label', () => {
	const result = api.readAdoptionApplication('demo-pending', { actorProvider: actor('applicant-a', ['applicant']) })
	assert.equal(result.success, false)
	assert.equal(result.error.code, 'NOT_FOUND')
	assert.equal(reads.length, 0)
	assert.equal(writes.length, 0)
})

test('owner view requires an explicit perspective and receives only the public minimum', () => {
	seed([base()])
	const implicit = api.readAdoptionApplication('adoption-real-1', { actorProvider: actor('owner-a', ['yard_owner']) })
	assert.equal(implicit.success, false)
	assert.equal(implicit.error.code, 'PERSPECTIVE_REQUIRED')

	const result = api.readAdoptionApplication('adoption-real-1', {
		actorProvider: actor('owner-a', ['yard_owner']),
		perspective: 'owner',
		query: { status: 'adoption_confirmed', applicantId: 'owner-a' },
	})
	assert.equal(result.success, true)
	assert.equal(result.data.perspective, 'owner')
	assert.equal(result.data.yardName, '真实小院')
	assert.equal(result.data.applyText, undefined)
	assert.equal(result.data.applicantId, undefined)
	assert.equal(result.data.mediaPaths, undefined)
	assert.equal(result.data.pets[0].privateNote, undefined)
})

test('multi-cloud-parent reads require an explicit policy and use the canonical condition result', () => {
	const record = base({
		id: 'adoption-cloud-1',
		status: 'cloud_pending',
		cloudParentRequired: true,
		cloudParentIds: ['cloud-a', 'cloud-b'],
		cloudParentApprovals: ['cloud-a'],
	})
	seed([record])
	const missingPolicy = api.readAdoptionApplication('adoption-cloud-1', {
		actorProvider: actor('cloud-a', ['cloud_parent']),
		perspective: 'cloud_parent',
	})
	assert.equal(missingPolicy.success, false)
	assert.equal(missingPolicy.error.code, 'MULTI_CLOUD_PARENT_POLICY_REQUIRED')

	const policyConflict = api.readAdoptionApplication('adoption-cloud-1', {
		actorProvider: actor('cloud-a', ['cloud_parent']),
		perspective: 'cloud_parent',
		cloudParentPolicy: POLICY_ALL,
		policy: { ...POLICY_ALL, selection: 'any' },
	})
	assert.equal(policyConflict.success, false)
	assert.equal(policyConflict.error.code, 'CONFLICTING_POLICY')

	const approved = api.readAdoptionApplication('adoption-cloud-1', {
		actorProvider: actor('cloud-a', ['cloud_parent']),
		perspective: 'cloud_parent',
		cloudParentPolicy: { ...POLICY_ALL, selection: 'any' },
	})
	assert.equal(approved.success, true)
	assert.equal(approved.data.condition.decision, 'approved')
	assert.deepEqual(approved.data.condition.reviews, [{ id: 'cloud-a', state: 'approved' }])
	assert.equal(approved.data.applyText, undefined)
})

test('the production entry ignores injected review resolvers so a page cannot forge approval', () => {
	seed([base({ id: 'adoption-cloud-single', cloudParentRequired: true, cloudParentIds: ['cloud-a'], status: 'cloud_pending' })])
	let called = false
	const result = api.readAdoptionApplication('adoption-cloud-single', {
		actorProvider: actor('applicant-a', ['applicant']),
		reviewResolver: () => {
			called = true
			return [{ id: 'cloud-a', state: 'approved' }]
		},
	})
	assert.equal(result.success, true)
	assert.equal(called, false)
	assert.equal(result.data.condition.decision, 'pending')
})

test('status aliases and actor relation aliases fail closed on conflicts', () => {
	seed([base({ id: 'adoption-status-conflict', applicationStatus: 'adoption_confirmed' })])
	const status = api.readAdoptionApplication('adoption-status-conflict', { actorProvider: actor('applicant-a', ['applicant']) })
	assert.equal(status.success, false)
	assert.equal(status.error.code, 'CONFLICTING_STATUS')

	seed([base({ id: 'adoption-relation-conflict', applicantUserId: 'applicant-b' })])
	const relation = api.readAdoptionApplication('adoption-relation-conflict', { actorProvider: actor('applicant-a', ['applicant']) })
	assert.equal(relation.success, false)
	assert.equal(relation.error.code, 'CONFLICTING_RELATION')
})

test('malformed, URL, and cross-domain IDs are rejected before storage access', () => {
	for (const id of ['', ' adoption-real-1 ', 'adoption/1', 'https://example.test/a', 'rescue-real-1', 'feeding-order-1', 'yard-1']) {
		const result = api.readAdoptionApplication(id, { actorProvider: actor('applicant-a', ['applicant']) })
		assert.equal(result.success, false)
		assert.ok(['MISSING_ID', 'INVALID_ID', 'CROSS_DOMAIN_ID'].includes(result.error.code), `${id}: ${result.error.code}`)
	}
	assert.equal(reads.length, 0)
})

test('storage and asynchronous resolver failures remain read-only and fail closed', () => {
	seed([base({ id: 'adoption-resolver-1' })])
	const thrown = api.readAdoptionApplicationWithResolver('adoption-resolver-1', {
		actorProvider: actor('applicant-a', ['applicant']),
		resolver: () => { throw new Error('storage unavailable') },
	})
	assert.equal(thrown.success, false)
	assert.equal(thrown.error.code, 'STORAGE_READ_FAILED')
	assert.equal(thrown.canWrite, false)

	const asyncResult = api.readAdoptionApplicationWithResolver('adoption-resolver-1', {
		actorProvider: actor('applicant-a', ['applicant']),
		resolver: () => Promise.resolve(base({ id: 'adoption-resolver-1' })),
	})
	assert.equal(asyncResult.success, false)
	assert.equal(asyncResult.error.code, 'ASYNC_RESOLVER_UNSUPPORTED')
	assert.equal(asyncResult.readOnly, true)
	assert.equal(writes.length, 0)
})

test('the adapter re-reads trusted actor and persisted storage on each request', () => {
	seed([base({ applicantId: 'applicant-a' }), base({ id: 'adoption-real-2', applicantId: 'applicant-b' })])
	let current = 'applicant-a'
	const provider = () => ({ actor: { id: current, roles: ['applicant'] } })
	assert.equal(api.readAdoptionApplication('adoption-real-1', { actorProvider: provider }).success, true)
	current = 'applicant-b'
	assert.equal(api.readAdoptionApplication('adoption-real-1', { actorProvider: provider }).error.code, 'FORBIDDEN')
	seed([base({ applicantId: 'applicant-b', applyText: '最新快照' })])
	const latest = api.readAdoptionApplication('adoption-real-1', { actorProvider: provider })
	assert.equal(latest.success, true)
	assert.equal(latest.data.applyText, '最新快照')
	assert.equal(reads.filter(key => key === ADOPTION_KEY).length, 3)
	assert.equal(writes.length, 0)
})
