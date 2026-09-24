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
const storage = new Map()
let writes = 0

function actor(id = 'actor-a', roles = ['applicant']) {
	return () => ({ actor: { id, roles } })
}

before(async () => {
	tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-production-deeplink-'))
	await fs.cp(path.join(ROOT, 'contracts'), path.join(tempRoot, 'contracts'), { recursive: true })
	await fs.writeFile(path.join(tempRoot, 'package.tson'), '{"type":"module"}\n')
	await fs.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
	await fs.mkdir(path.join(tempRoot, 'utils'), { recursive: true })
	for (const file of ['routeContracts.ts', 'actorCapabilities.ts', 'deeplinkContracts.ts', 'productionDeepLinkResolver.ts']) {
		await fs.copyFile(path.join(ROOT, 'navigation', file), path.join(tempRoot, 'navigation', file))
	}
	for (const file of ['adoptionStorage.ts', 'rescueStorage.ts', 'rewardOrderStorage.ts']) {
		await fs.copyFile(path.join(ROOT, 'utils', file), path.join(tempRoot, 'utils', file))
	}
	globalThis.uni = {
		getStorageSync(key) { return storage.get(key) },
		setStorageSync(key, value) { writes += 1; storage.set(key, value) },
		removeStorageSync(key) { writes += 1; storage.delete(key) },
	}
	api = await import(`${pathToFileURL(path.join(tempRoot, 'navigation/productionDeepLinkResolver.ts')).href}?test=${Date.now()}`)
})

after(async () => {
	delete globalThis.uni
	if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

test('production readers bind persisted adoption, rescue, and feeding records without demo fallback', () => {
	storage.set('PAWHOME_ADOPTIONS', JSON.stringify([{ id: 'application-real-1', status: 'pending', applicantName: '真实申请' }]))
	storage.set('PAWHOME_RESCUES', JSON.stringify([{ id: 'rescue-real-1', status: 'pending', applicant: { id: 'actor-a', name: '真实求助人' } }]))
	storage.set('PAWHOME_REWARD_ORDERS', JSON.stringify([{ id: 'order-real-1', applicationId: 'application-real-1', status: 'paid' }]))

	const adoption = api.resolveProductionDeepLink({ source: 'message', businessType: 'adoption', businessId: 'application-real-1' })
	const rescue = api.resolveProductionDeepLink({ source: 'message', businessType: 'rescue', businessId: 'rescue-real-1' })
	const feeding = api.resolveProductionDeepLink({ source: 'message', businessType: 'feeding', businessId: 'order-real-1' })
	assert.equal(adoption.status, 'ready')
	assert.equal(adoption.record.applicationId, 'application-real-1')
	assert.equal(rescue.status, 'ready')
	assert.equal(rescue.record.rescueId, 'rescue-real-1')
	assert.equal(feeding.status, 'ready')
	assert.equal(feeding.record.orderId, 'order-real-1')
	assert.equal(feeding.canWrite, false)

	const demo = api.resolveProductionDeepLink({ source: 'message', businessType: 'adoption', businessId: 'demo-pending' })
	assert.equal(demo.status, 'empty')
	assert.equal(demo.code, 'NOT_FOUND')
	assert.equal(writes, 0)
})

test('dynamic links fail closed until a real reader exists; an injected reader receives IDs and actor only', () => {
	let seen
	const resolver = api.createProductionDeepLinkResolver({
		actorProvider: actor('actor-a'),
		readers: {
			dynamic(context) {
				seen = context
				return { businessType: 'dynamic', dynamicId: context.businessId, body: 'current' }
			},
		},
	})
	const task = resolver.resolveTask({
		source: 'task',
		businessType: 'dynamic',
		businessId: 'dynamic-real-1',
		legacyState: 'old',
	})
	assert.equal(task.status, 'ready')
	assert.deepEqual(Object.keys(seen).sort(), ['actor', 'businessId', 'businessType'])
	assert.equal(seen.businessId, 'dynamic-real-1')
	assert.equal(seen.actor.id, 'actor-a')
	assert.equal('legacyState' in seen, false)

	const missing = api.resolveProductionDeepLink({ source: 'message', businessType: 'dynamic', businessId: 'dynamic-real-1' })
	assert.equal(missing.status, 'empty')
	assert.equal(missing.code, 'READER_MISSING')
})

test('default feeding and dynamic readers bind their persisted records when keys are present', () => {
	storage.set('PAWHOME_FEEDING_ORDERS', JSON.stringify([{ id: 'order-feed-1', status: 'active' }]))
	storage.set('PAWHOME_DYNAMIC_RECORDS', JSON.stringify([{ id: 'dynamic-real-1', body: 'persisted' }]))
	const feeding = api.resolveProductionDeepLink({ source: 'message', businessType: 'feeding', businessId: 'order-feed-1' })
	const dynamic = api.resolveProductionDeepLink({ source: 'message', businessType: 'dynamic', businessId: 'dynamic-real-1' })
	assert.equal(feeding.status, 'ready')
	assert.equal(feeding.record.orderId, 'order-feed-1')
	assert.equal(dynamic.status, 'ready')
	assert.equal(dynamic.record.dynamicId, 'dynamic-real-1')
})

test('task links require a trusted actor before a production reader is called', () => {
	let calls = 0
	const result = api.resolveProductionDeepLink(
		{ source: 'task', businessType: 'rescue', businessId: 'rescue-real-1' },
		{ readers: { rescue: () => { calls += 1; return { rescueId: 'rescue-real-1' } } } },
	)
	assert.equal(result.status, 'empty')
	assert.equal(result.code, 'AUTH_REQUIRED')
	assert.equal(calls, 0)
})
