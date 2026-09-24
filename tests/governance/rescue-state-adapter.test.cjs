'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after, beforeEach } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const adapterPath = path.join(ROOT, 'packages/rescue/services/stateAdapter.ts')
const canonicalAdapterPath = path.join(ROOT, 'services/domainReads/rescue/stateAdapter.ts')
const storagePath = path.join(ROOT, 'utils/rescueStorage.ts')
const RESCUE_KEY = 'PAWHOME_RESCUES'

let tempRoot
let adapter
let storage

before(async () => {
	tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-rescue-state-adapter-'))
	await fs.cp(path.join(ROOT, 'contracts'), path.join(tempRoot, 'contracts'), { recursive: true })
	await fs.writeFile(path.join(tempRoot, 'package.tson'), '{"type":"module"}\n')
	await fs.mkdir(path.join(tempRoot, 'packages/rescue/services'), { recursive: true })
	await fs.mkdir(path.join(tempRoot, 'utils'), { recursive: true })
	await fs.cp(path.join(ROOT, 'services/domainReads'), path.join(tempRoot, 'services/domainReads'), { recursive: true })
	await fs.copyFile(storagePath, path.join(tempRoot, 'utils/rescueStorage.ts'))
	await fs.copyFile(adapterPath, path.join(tempRoot, 'packages/rescue/services/stateAdapter.ts'))
	storage = new Map()
	globalThis.uni = {
		getStorageSync(key) { return storage.get(key) },
		setStorageSync(key, value) { storage.set(key, value) },
		removeStorageSync(key) { storage.delete(key) }
	}
	adapter = await import(`${pathToFileURL(path.join(tempRoot, 'packages/rescue/services/stateAdapter.ts')).href}?test=${Date.now()}`)
})

beforeEach(() => storage.clear())

after(async () => {
	if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

test('state adapter requires an opaque rescueId and never falls back on malformed input', () => {
	for (const id of ['', 'rescue/1', 'rescue?1', ' rescue-1 ', 'https://example.test']) {
		const result = adapter.readRescueStateById(id)
		assert.equal(result.success, false)
		assert.ok(['MISSING_ID', 'INVALID_ID'].includes(result.error.code))
		assert.equal(result.readOnly, true)
		assert.equal(result.canWrite, false)
	}
})

test('saved rescue records are read from the single PAWHOME_RESCUES key with three state axes', () => {
	storage.set(RESCUE_KEY, JSON.stringify([{
		id: 'rescue-real-1',
		applicationStatus: 'platform_approved',
		status: 'approved',
		fundingStatus: 'funding_pending'
	}]))
	const result = adapter.readRescueStateById('rescue-real-1')
	assert.equal(result.success, true)
	assert.equal(result.source, 'mock')
	assert.equal(result.data.rescueId, 'rescue-real-1')
	assert.equal(result.data.state.applicationStatus, 'platform_approved')
	assert.equal(result.data.state.reviewStatus, 'approved')
	assert.equal(result.data.state.fundingStatus, 'funding_pending')
	assert.equal(result.readOnly, true)
	assert.equal(result.canWrite, false)
	assert.equal(Object.isFrozen(result), true)
	assert.equal(Object.isFrozen(result.data), true)
})

test('missing IDs do not show demo records by default; public demos require an explicit option', () => {
	assert.equal(adapter.readRescueStateById('rescue-demo-001').error.code, 'NOT_FOUND')
	const demo = adapter.readRescueStateById('rescue-demo-001', { includeDemo: true })
	assert.equal(demo.success, true)
	assert.equal(demo.data.rescueId, 'rescue-demo-001')
})

test('invalid or contradictory state remains read-only and never becomes a successful paid result', () => {
	storage.set(RESCUE_KEY, JSON.stringify([{
		id: 'rescue-invalid',
		applicationStatus: 'platform_pending',
		status: 'rejected',
		fundingStatus: 'funding_paid'
	}]))
	const result = adapter.readRescueStateById('rescue-invalid')
	assert.equal(result.success, true)
	assert.equal(result.data.state.validity, 'invalid')
	assert.equal(result.data.state.funding.paid, false)
	assert.equal(result.data.state.funding.displayStatus, 'unknown')
	assert.equal(result.canWrite, false)
})

test('resolver seam is synchronous, receives only a frozen ID context, and fails closed on promises/errors', () => {
	let received
	const record = { applicationStatus: 'platform_pending' }
	const ok = adapter.readRescueStateWithResolver('rescue-resolver-1', {
		includeDemo: true,
		resolver(context) {
			received = context
			return record
		}
	})
	assert.equal(ok.success, true)
	assert.equal(received.rescueId, 'rescue-resolver-1')
	assert.equal(received.includeDemo, true)
	assert.equal(Object.isFrozen(received), true)
	assert.equal(adapter.readRescueStateWithResolver('rescue-resolver-1', { resolver: () => Promise.resolve(record) }).error.code, 'ASYNC_RESOLVER_UNSUPPORTED')
	assert.equal(adapter.readRescueStateWithResolver('rescue-resolver-1', { resolver: () => { throw new Error('boom') } }).error.code, 'STORAGE_READ_FAILED')
})

test('adapter source has no write API or unrelated storage key', async () => {
	const source = await fs.readFile(canonicalAdapterPath, 'utf8')
	assert.match(source, /getRescueById/)
	assert.match(source, /normalizeRescueState/)
	assert.doesNotMatch(source, /setStorageSync|removeStorageSync|createRescue|updateRescue|PAWHOME_ADOPTIONS/)
})

