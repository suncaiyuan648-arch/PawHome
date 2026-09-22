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

const POLICY = Object.freeze({
	version: 'feedback-v1',
	evidenceKinds: ['dynamic', 'feeding_evidence'],
	requiredCount: 2,
	maximumCount: 3,
	startsAt: '2026-09-01T00:00:00Z',
	expiresAt: '2026-10-01T00:00:00Z',
	countRules: {
		pending: 'exclude', active: 'count', corrected: 'count',
		deleted: 'exclude', withdrawn: 'exclude', rejected: 'exclude',
	},
	lastFeedbackStates: ['active', 'corrected'],
})

function actor(id = 'actor-001', roles = []) {
	return () => ({ actor: { id, roles } })
}

function order(overrides = {}) {
	return { orderId: 'order-001', animalId: 'animal-001', yardId: 'yard-001', ...overrides }
}

function animal(overrides = {}) {
	return { animalId: 'animal-001', yardId: 'yard-001', ...overrides }
}

function dynamicEvidence(overrides = {}) {
	return {
		evidenceId: 'dynamic-evidence-001',
		dynamicId: 'dynamic-001',
		kind: 'dynamic',
		actorId: 'actor-001',
		policyVersion: POLICY.version,
		attemptKey: 'attempt-001',
		requestId: 'request-001',
		state: 'active',
		createdAt: '2026-09-05T00:00:00Z',
		...overrides,
	}
}

function feedingEvidence(overrides = {}) {
	return {
		evidenceId: 'feeding-evidence-001',
		dynamicId: 'dynamic-001',
		kind: 'feeding_evidence',
		actorId: 'actor-001',
		policyVersion: POLICY.version,
		attemptKey: 'attempt-001',
		requestId: 'request-001',
		state: 'active',
		createdAt: '2026-09-05T00:00:00Z',
		order: order(),
		animal: animal(),
		...overrides,
	}
}

function dynamicTask(overrides = {}) {
	return {
		kind: 'dynamic',
		dynamicId: 'dynamic-001',
		actorId: 'actor-001',
		policyVersion: POLICY.version,
		evidence: [dynamicEvidence()],
		...overrides,
	}
}

function feedingTask(overrides = {}) {
	return {
		kind: 'feeding_evidence',
		actorId: 'actor-001',
		policyVersion: POLICY.version,
		order: order(),
		animal: animal(),
		evidence: [feedingEvidence()],
		...overrides,
	}
}

before(async () => {
	tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-feedback-adapter-'))
	await fs.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
	await fs.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
	await fs.mkdir(path.join(tempRoot, 'utils'), { recursive: true })
	await fs.mkdir(path.join(tempRoot, 'packages/feeding/services'), { recursive: true })
	for (const file of ['feedbackContracts.js', 'actorCapabilities.js']) {
		await fs.copyFile(path.join(ROOT, 'navigation', file), path.join(tempRoot, 'navigation', file))
	}
	await fs.copyFile(path.join(ROOT, 'utils/profileNav.js'), path.join(tempRoot, 'utils/profileNav.js'))
	const feedingSource = await fs.readFile(path.join(ROOT, 'packages/feeding/services/orderMockApi.js'), 'utf8')
	await fs.writeFile(path.join(tempRoot, 'packages/feeding/services/orderMockApi.js'), feedingSource.replace("'@/utils/profileNav.js'", "'../../../utils/profileNav.js'"))
	await fs.copyFile(
		path.join(ROOT, 'packages/feeding/services/feedbackAdapter.js'),
		path.join(tempRoot, 'packages/feeding/services/feedbackAdapter.js')
	)
	api = await import(`${pathToFileURL(path.join(tempRoot, 'packages/feeding/services/feedbackAdapter.js')).href}?test=${Date.now()}`)
})

after(async () => {
	if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

test('adapter uses the canonical feedback contract and exposes no write or storage surface', async () => {
	const source = await fs.readFile(path.join(ROOT, 'packages/feeding/services/feedbackAdapter.js'), 'utf8')
	assert.match(source, /feedbackContracts\.js/)
	assert.match(source, /orderMockApi\.js/)
	assert.match(source, /summarizeFeedbackTask/)
	assert.doesNotMatch(source, /setStorageSync|removeStorageSync|\b(?:save|update|remove|delete)Storage|submitFeedback|writeFeedback/i)
	assert.equal(typeof api.readFeedbackTaskList, 'function')
	assert.equal(typeof api.readFeedbackTaskDetail, 'function')
})

test('default feeding reader is actor-scoped, explicit-policy driven, and has no caller record/query injection', async () => {
	const result = await api.readFeedbackTaskList({
		kind: 'feeding_evidence',
		policy: POLICY,
		now: '2026-09-10T00:00:00Z',
		actorProvider: actor('2876598765', ['applicant']),
		perspective: 'mine',
		role: 'yard',
		query: { userPawId: 'attacker', state: 'completed' },
		records: [feedingTask({ actorId: 'attacker' })],
	})
	assert.equal(result.success, true)
	assert.equal(result.data.kind, 'feeding_evidence')
	assert.equal(result.data.total, 5)
	assert.ok(result.data.items.every(item => item.actorId === '2876598765'))
	assert.ok(result.data.items.every(item => item.orderId.startsWith('f')))
	assert.ok(result.data.items.every(item => item.completedCount === 0 && item.status === 'pending'))
	assert.equal(result.readOnly, true)
	assert.equal(result.canWrite, false)
})

test('dynamic tasks require the explicit safe reader seam; no demo or static fallback exists', async () => {
	const result = await api.readFeedbackTaskList({
		kind: 'dynamic',
		policy: POLICY,
		now: '2026-09-10T00:00:00Z',
		actorProvider: actor(),
		records: [dynamicTask()],
		query: { dynamicId: 'dynamic-001' },
	})
	assert.equal(result.success, false)
	assert.equal(result.error.code, 'READER_REQUIRED')
	assert.deepEqual(result.data.items, [])
	assert.equal(result.readOnly, true)
	assert.equal(result.canWrite, false)
})

test('safe synchronous reader keeps dynamic and feeding evidence domains separate', async () => {
	let received
	const dynamic = await api.readFeedbackTaskList({
		kind: 'dynamic',
		policy: POLICY,
		now: '2026-09-10T00:00:00Z',
		actorProvider: actor(),
		reader(context) {
			received = context
			return [dynamicTask()]
		},
		records: [feedingTask()],
	})
	assert.equal(dynamic.success, true)
	assert.equal(dynamic.data.total, 1)
	assert.equal(dynamic.data.items[0].kind, 'dynamic')
	assert.equal('orderId' in dynamic.data.items[0], false)
	assert.equal(Object.isFrozen(received), true)
	assert.equal(received.policyVersion, POLICY.version)
	assert.equal('query' in received, false)

	const feeding = await api.readFeedbackTaskList({
		kind: 'feeding_evidence',
		policy: POLICY,
		now: '2026-09-10T00:00:00Z',
		actorProvider: actor(),
		reader: () => [feedingTask()],
	})
	assert.equal(feeding.success, true)
	assert.equal(feeding.data.items[0].kind, 'feeding_evidence')
	assert.equal(feeding.data.items[0].orderId, 'order-001')
	assert.equal(feeding.data.items[0].animalId, 'animal-001')
	assert.equal(feeding.data.items[0].yardId, 'yard-001')
})

test('detail lookup uses the stable derived taskId and never falls back to another task', async () => {
	const options = {
		kind: 'dynamic',
		policy: POLICY,
		now: '2026-09-10T00:00:00Z',
		actorProvider: actor(),
		reader: () => [dynamicTask()],
	}
	const list = await api.readFeedbackTaskList(options)
	const taskId = list.data.items[0].taskId
	const found = await api.readFeedbackTaskDetail({ ...options, taskId, perspective: 'yard', role: 'attacker' })
	assert.equal(found.success, true)
	assert.equal(found.data.item.taskId, taskId)
	assert.equal(found.data.item.dynamicId, 'dynamic-001')
	const missing = await api.readFeedbackTaskDetail({ ...options, taskId: 'feedback-task:missing' })
	assert.equal(missing.success, false)
	assert.equal(missing.error.code, 'NOT_FOUND')
	const malformed = await api.readFeedbackTaskDetail({ ...options, taskId: ' dynamic-task ' })
	assert.equal(malformed.success, false)
	assert.equal(malformed.error.code, 'INVALID_TASK_ID')
})

test('wrong actor, malformed associations, cross-domain fields, mutation intent, and duplicate request reuse fail closed', async () => {
	const result = await api.readFeedbackTaskList({
		kind: 'feeding_evidence',
		policy: POLICY,
		now: '2026-09-10T00:00:00Z',
		actorProvider: actor(),
		reader: () => [
			feedingTask({ actorId: 'actor-other' }),
			feedingTask({ order: order({ animalId: 'animal-other' }) }),
			feedingTask({ animal: animal({ yardId: 'yard-other' }) }),
			feedingTask({ evidence: [feedingEvidence({ mutationIntent: 'delete' })] }),
			feedingTask({ evidence: [
				feedingEvidence(),
				feedingEvidence({ evidenceId: 'evidence-other', attemptKey: 'attempt-other' }),
			] }),
			{
				...dynamicTask(),
				kind: 'dynamic',
				evidence: [dynamicEvidence({ orderId: 'order-001' })],
			},
		],
	})
	assert.equal(result.success, true)
	assert.deepEqual(result.data.items, [])
	const codes = new Set(result.data.diagnostics.map(item => item.code))
	assert.ok(codes.has('ACTOR_MISMATCH'))
	assert.ok(codes.has('ASSOCIATION_CONFLICT') || codes.has('CROSS_YARD_ASSOCIATION'))
	assert.ok(codes.has('MUTATION_INTENT_NOT_SUPPORTED'))
	assert.ok(codes.has('REQUEST_KEY_REUSE'))
})

test('invalid policy/time, async reader, and reader result errors return frozen failures', async () => {
	const badPolicy = await api.readFeedbackTaskList({ kind: 'dynamic', policy: null, now: '2026-09-10T00:00:00Z', actorProvider: actor(), reader: () => [] })
	assert.equal(badPolicy.success, false)
	assert.equal(badPolicy.error.code, 'POLICY_REQUIRED')
	const badNow = await api.readFeedbackTaskList({ kind: 'dynamic', policy: POLICY, now: 'tomorrow-ish', actorProvider: actor(), reader: () => [] })
	assert.equal(badNow.success, false)
	assert.equal(badNow.error.code, 'INVALID_TIMESTAMP')
	const asyncReader = await api.readFeedbackTaskList({ kind: 'dynamic', policy: POLICY, now: '2026-09-10T00:00:00Z', actorProvider: actor(), reader: async () => [dynamicTask()] })
	assert.equal(asyncReader.success, false)
	assert.equal(asyncReader.error.code, 'ASYNC_READER_UNSUPPORTED')
	const badReader = await api.readFeedbackTaskList({ kind: 'dynamic', policy: POLICY, now: '2026-09-10T00:00:00Z', actorProvider: actor(), reader: () => ({ items: [dynamicTask()] }) })
	assert.equal(badReader.success, false)
	assert.equal(badReader.error.code, 'INVALID_READER_RESULT')
	assert.equal(Object.isFrozen(asyncReader), true)
	assert.equal(Object.isFrozen(asyncReader.data), true)
})

test('policy counts/window and output snapshots remain read-only and deeply frozen', async () => {
	const result = await api.readFeedbackTaskList({
		kind: 'feeding_evidence',
		policy: { ...POLICY, requiredCount: 1, maximumCount: 1 },
		now: '2026-09-10T00:00:00Z',
		actorProvider: actor(),
		reader: () => [feedingTask()],
	})
	assert.equal(result.success, true)
	assert.equal(result.data.items[0].status, 'completed')
	assert.equal(result.data.items[0].completedCount, 1)
	assert.equal(Object.isFrozen(result), true)
	assert.equal(Object.isFrozen(result.data), true)
	assert.equal(Object.isFrozen(result.data.items), true)
	assert.equal(Object.isFrozen(result.data.items[0]), true)
	assert.equal(Object.isFrozen(result.data.diagnostics), true)
	assert.equal(result.data.items[0].canWrite, undefined)
	assert.equal(result.readOnly, true)
	assert.equal(result.canWrite, false)
})
