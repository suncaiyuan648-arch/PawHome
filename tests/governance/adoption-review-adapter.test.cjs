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

function actor(id, roles) {
	return () => ({ actor: { id, roles } })
}

function ownerReview(overrides = {}) {
	return {
		id: 'adoption-real-a',
		applicationType: 'adoption',
		businessType: 'adoption',
		applicationId: 'application-a',
		applicantId: 'applicant-a',
		ownerId: 'owner-a',
		status: 'pending',
		cloudParentIds: [],
		review: {
			applicationId: 'application-a',
			reviewItemId: 'review-owner-a',
			phase: 'owner',
			reviewerRole: 'owner',
			reviewerId: 'owner-a',
			status: 'pending',
		},
		...overrides,
	}
}

function cloudReview(overrides = {}) {
	return {
		id: 'adoption-cloud-a',
		applicationType: 'adoption',
		applicationId: 'application-cloud-a',
		applicantId: 'applicant-a',
		ownerId: 'owner-a',
		status: 'cloud_pending',
		cloudParentRequired: true,
		cloudParentIds: ['cloud-a'],
		review: {
			applicationId: 'application-cloud-a',
			reviewItemId: 'review-cloud-a',
			phase: 'cloud_parent',
			reviewerRole: 'cloud_parent',
			reviewerId: 'cloud-a',
			status: 'pending',
		},
		...overrides,
	}
}

function seed(records) {
	storage.set(ADOPTION_KEY, JSON.stringify(records))
}

function reset() {
	storage.clear()
	globalThis.uni.reads = []
	globalThis.uni.writes = []
	globalThis.uni.getStorageSync = function getStorageSync(key) {
		this.reads.push(key)
		return storage.get(key)
	}
	globalThis.uni.setStorageSync = function setStorageSync(key, value) {
		this.writes.push({ key, value })
		storage.set(key, value)
	}
}

before(async () => {
	tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-adoption-review-adapter-'))
	await fs.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
	await fs.cp(path.join(ROOT, 'services/domainReads'), path.join(tempRoot, 'services/domainReads'), { recursive: true })
	await fs.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
	await fs.mkdir(path.join(tempRoot, 'utils'), { recursive: true })
	await fs.mkdir(path.join(tempRoot, 'packages/adoption/services'), { recursive: true })
	for (const file of ['actorCapabilities.js', 'adoptionConditionContract.js', 'adoptionReviewContract.js']) {
		await fs.copyFile(path.join(ROOT, 'navigation', file), path.join(tempRoot, 'navigation', file))
	}
	await fs.copyFile(path.join(ROOT, 'utils/adoptionStorage.js'), path.join(tempRoot, 'utils/adoptionStorage.js'))
	await fs.copyFile(
		path.join(ROOT, 'packages/adoption/services/reviewAdapter.js'),
		path.join(tempRoot, 'packages/adoption/services/reviewAdapter.js')
	)
	storage = new Map()
	globalThis.uni = {
		reads: [],
		writes: [],
		getStorageSync(key) {
			this.reads.push(key)
			return storage.get(key)
		},
		setStorageSync(key, value) {
			this.writes.push({ key, value })
			storage.set(key, value)
		},
		removeStorageSync(key) {
			storage.delete(key)
		},
	}
	api = await import(`${pathToFileURL(path.join(tempRoot, 'packages/adoption/services/reviewAdapter.js')).href}?test=${Date.now()}`)
})

beforeEach(reset)

after(async () => {
	if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
	delete globalThis.uni
})

test('adapter binds the canonical contract and existing storage with no write surface', async () => {
	const source = await fs.readFile(path.join(ROOT, 'services/domainReads/adoption/reviewAdapter.js'), 'utf8')
	assert.match(source, /adoptionReviewContract\.js/)
	assert.match(source, /adoptionStorage\.js/)
	assert.match(source, /includeDemo: false/)
	assert.doesNotMatch(source, /setStorageSync|removeStorageSync|saveAdoption|addAdoption|updateAdoption|transitionAdoption/i)
	assert.equal(typeof api.readAdoptionReviewList, 'function')
	assert.equal(typeof api.readAdoptionReviewDetail, 'function')
	assert.equal(typeof api.getAdoptionReviewList, 'function')
	assert.equal(typeof api.getAdoptionReviewDetail, 'function')
})

test('review list reads only persisted records and honors an explicit reviewer perspective', () => {
	seed([ownerReview(), cloudReview()])
	const owner = api.readAdoptionReviewList({
		actorProvider: actor('owner-a', ['owner']),
		reviewerRole: 'owner',
		filter: 'pending',
		includeDemo: true,
		role: 'cloud_parent',
		managed: true,
		state: 'approved',
		query: { role: 'cloud_parent', reviewerId: 'cloud-a' },
		records: [cloudReview()],
		resolver: () => [cloudReview()],
	})
	assert.deepEqual(owner.items.map(item => item.reviewItemId), ['review-owner-a'])
	assert.equal(owner.items[0].reviewerRole, 'owner')
	assert.equal(owner.readOnly, true)
	assert.equal(owner.canWrite, false)
	assert.equal(globalThis.uni.reads.filter(key => key === ADOPTION_KEY).length, 1)
	assert.equal(globalThis.uni.writes.length, 0)

	const forgedRole = api.readAdoptionReviewList({
		actorProvider: actor('owner-a', ['owner']),
		reviewerRole: 'cloud_parent',
		role: 'cloud_parent',
		query: { reviewerRole: 'cloud_parent' },
	})
	assert.deepEqual(forgedRole.items, [])
	assert.ok(forgedRole.diagnostics.skipped.some(item => ['ACTOR_ROLE_REQUIRED', 'ACTOR_MISMATCH'].includes(item.code)))
})

test('review detail requires exact reviewItemId/applicationId and never exposes applicant detail', () => {
	seed([ownerReview()])
	const found = api.readAdoptionReviewDetail({
		actorProvider: actor('owner-a', ['owner']),
		reviewerRole: 'owner',
		applicationId: 'application-a',
		reviewItemId: 'review-owner-a',
		perspective: 'applicant',
		query: { perspective: 'applicant' },
	})
	assert.equal(found.canRead, true)
	assert.equal(found.item.applicationId, 'application-a')
	assert.equal(found.item.reviewItemId, 'review-owner-a')
	assert.equal(found.item.reviewerRole, 'owner')
	assert.equal(found.item.readOnly, true)
	assert.equal(found.item.canWrite, false)

	const wrongApplication = api.readAdoptionReviewDetail({
		actorProvider: actor('owner-a', ['owner']),
		applicationId: 'application-other',
		reviewItemId: 'review-owner-a',
	})
	assert.equal(wrongApplication.canRead, false)
	assert.equal(wrongApplication.reason, 'NOT_FOUND')
	const wrongReviewItem = api.readAdoptionReviewDetail({
		actorProvider: actor('owner-a', ['owner']),
		applicationId: 'application-a',
		reviewItemId: 'review-owner-b',
	})
	assert.equal(wrongReviewItem.canRead, false)
	assert.equal(wrongReviewItem.reason, 'NOT_FOUND')
})

test('cross-user records and applicant actors cannot enter or read the reviewer queue', () => {
	seed([ownerReview({
		id: 'adoption-owner-b',
		applicationId: 'application-b',
		ownerId: 'owner-b',
		review: { ...ownerReview().review, applicationId: 'application-b', reviewItemId: 'review-owner-b', reviewerId: 'owner-b' },
	})])
	const otherOwner = api.readAdoptionReviewList({ actorProvider: actor('owner-a', ['owner']), reviewerRole: 'owner' })
	assert.deepEqual(otherOwner.items, [])
	assert.ok(otherOwner.diagnostics.skipped.some(item => ['ACTOR_MISMATCH', 'ACTOR_ROLE_REQUIRED'].includes(item.code)))
	const applicant = api.readAdoptionReviewDetail({
		actorProvider: actor('applicant-a', ['applicant']),
		applicationId: 'application-b',
		reviewItemId: 'review-owner-b',
	})
	assert.equal(applicant.canRead, false)
	assert.ok(['ACTOR_ROLE_REQUIRED', 'ACTOR_MISMATCH'].includes(applicant.reason))
})

test('demo records are excluded by default and includeDemo/query injection cannot opt them in', () => {
	const list = api.readAdoptionReviewList({
		actorProvider: actor('yard_card_owner', ['owner']),
		reviewerRole: 'owner',
		includeDemo: true,
		query: { includeDemo: true },
	})
	assert.deepEqual(list.items, [])
	const detail = api.readAdoptionReviewDetail({
		actorProvider: actor('yard_card_owner', ['owner']),
		reviewerRole: 'owner',
		applicationId: 'review-v2-owner-pending-1',
		reviewItemId: 'review-v2-owner-pending-1',
		includeDemo: true,
	})
	assert.equal(detail.canRead, false)
	assert.equal(detail.reason, 'NOT_FOUND')
})

test('conflicting status, relationship, domain, and malformed IDs fail closed per record', () => {
	seed([
		ownerReview({ applicationStatus: 'pickup' }),
		ownerReview({ id: 'adoption-status-conflict', applicationId: 'application-status-conflict', applicationStatus: 'pickup', review: { ...ownerReview().review, applicationId: 'application-status-conflict', reviewItemId: 'review-status-conflict', status: 'approved' } }),
		ownerReview({ id: 'adoption-review-conflict', applicationId: 'application-review-conflict', review: { ...ownerReview().review, applicationId: 'application-review-conflict', reviewItemId: 'review-review-conflict', status: 'pending', reviewStatus: 'approved' } }),
		ownerReview({ id: 'adoption-relation-conflict', applicationId: 'application-relation-conflict', ownerId: 'owner-a', ownerPawId: 'owner-b', review: { ...ownerReview().review, applicationId: 'application-relation-conflict', reviewItemId: 'review-relation-conflict' } }),
		ownerReview({ id: 'adoption-cross-domain', applicationId: 'rescue-a', review: { ...ownerReview().review, applicationId: 'rescue-a', reviewItemId: 'review-cross-domain' } }),
		ownerReview({ id: 'adoption-malformed', applicationId: 'application-malformed', review: { ...ownerReview().review, applicationId: 'application-malformed', reviewItemId: 'rescue-review-a' } }),
	])
	const result = api.readAdoptionReviewList({ actorProvider: actor('owner-a', ['owner']), reviewerRole: 'owner' })
	assert.deepEqual(result.items, [])
	const codes = new Set(result.diagnostics.skipped.map(item => item.code))
	assert.ok(codes.has('CONFLICTING_APPLICATION_STATUS') || codes.has('INCONSISTENT_REVIEW_STAGE'))
	assert.ok(codes.has('CONFLICTING_REVIEW_STATUS') || codes.has('INCONSISTENT_REVIEW_STAGE'))
	assert.ok(codes.has('CONFLICTING_OWNER') || codes.has('CONFLICTING_OWNER_ID') || codes.has('ACTOR_MISMATCH'))
	assert.ok(codes.has('CROSS_DOMAIN_ID') || codes.has('CROSS_DOMAIN_RECORD'))
	assert.equal(codes.has('CROSS_DOMAIN_ID'), true)
})

test('storage exceptions and async/forged resolver inputs return an empty frozen read model without writes', () => {
	seed([ownerReview()])
	globalThis.uni.getStorageSync = function throwingStorage() {
		this.reads.push(ADOPTION_KEY)
		throw new Error('storage unavailable')
	}
	const storageFailure = api.readAdoptionReviewList({ actorProvider: actor('owner-a', ['owner']) })
	assert.deepEqual(storageFailure.items, [])
	assert.equal(storageFailure.readOnly, true)
	assert.equal(storageFailure.canWrite, false)
	assert.equal(globalThis.uni.writes.length, 0)

	globalThis.uni.getStorageSync = function getStorageSync(key) {
		this.reads.push(key)
		return storage.get(key)
	}
	const injected = api.readAdoptionReviewList({
		actorProvider: () => Promise.resolve({ actor: { id: 'owner-a', roles: ['owner'] } }),
		resolver: async () => [ownerReview()],
		records: [ownerReview()],
	})
	assert.deepEqual(injected.items, [])
	assert.equal(injected.readOnly, true)
	assert.equal(injected.canWrite, false)

	const detailInjected = api.readAdoptionReviewDetail({
		actorProvider: actor('owner-a', ['owner']),
		applicationId: 'application-a',
		reviewItemId: 'review-owner-a',
		resolver: () => Promise.resolve(ownerReview()),
		record: ownerReview({ id: 'forged-record' }),
	})
	assert.equal(detailInjected.canRead, true)
	assert.equal(detailInjected.item.applicationId, 'application-a')
	assert.equal(detailInjected.item.reviewItemId, 'review-owner-a')
	assert.equal(globalThis.uni.writes.length, 0)
})

test('successful list and detail snapshots are deeply frozen', () => {
	seed([ownerReview()])
	const list = api.readAdoptionReviewList({ actorProvider: actor('owner-a', ['owner']) })
	assert.equal(Object.isFrozen(list), true)
	assert.equal(Object.isFrozen(list.items), true)
	assert.equal(Object.isFrozen(list.items[0]), true)
	assert.equal(Object.isFrozen(list.pending), true)
	assert.equal(Object.isFrozen(list.diagnostics), true)
	const detail = api.readAdoptionReviewDetail({ actorProvider: actor('owner-a', ['owner']), applicationId: 'application-a', reviewItemId: 'review-owner-a' })
	assert.equal(Object.isFrozen(detail), true)
	assert.equal(Object.isFrozen(detail.item), true)
	assert.equal(detail.item.readOnly, true)
	assert.equal(detail.item.canWrite, false)
})
