'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
let tempEsmRoot
let bridgeModule

async function loadBridge() {
	if (!tempEsmRoot) {
		tempEsmRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-selector-bridge-'))
		await fs.writeFile(path.join(tempEsmRoot, 'package.json'), '{"type":"module"}\n')
		await fs.mkdir(path.join(tempEsmRoot, 'navigation'), { recursive: true })
		await fs.copyFile(
			path.join(ROOT, 'navigation/selectorBridge.js'),
			path.join(tempEsmRoot, 'navigation/selectorBridge.js')
		)
	}
	const fileUrl = pathToFileURL(path.join(tempEsmRoot, 'navigation/selectorBridge.js')).href
	return import(`${fileUrl}?test=${Date.now()}-${Math.random()}`)
}

function throwsCode(fn, code) {
	assert.throws(fn, (error) => error && error.code === code)
}

before(async () => {
	bridgeModule = await loadBridge()
})

after(async () => {
	if (tempEsmRoot) await fs.rm(tempEsmRoot, { recursive: true, force: true })
})

test('request shape matches the selector route contract and context is isolated in memory', () => {
	const { createSelectorBridge } = bridgeModule
	let now = 1000
	const context = { applicationId: 'app-1', nested: { callerView: 'confirm' } }
	const callbacks = []
	const bridge = createSelectorBridge({
		now: () => now,
		idFactory: (kind) => `${kind}-request-1`
	})
	const request = bridge.createRequest({
		kind: 'address',
		callerId: 'caller-a',
		context,
		ttlMs: 50,
		onConfirm: (payload, savedContext) => callbacks.push({ payload, savedContext })
	})
	context.applicationId = 'changed-outside'
	context.nested.callerView = 'changed-outside'

	assert.deepEqual(request, {
		kind: 'address',
		requestId: 'address-request-1',
		callerId: 'caller-a',
		expiresAt: 1050,
		bridge: 'eventChannel',
		autoRedirect: false
	})
	assert.equal(Object.prototype.hasOwnProperty.call(request, 'url'), false)
	const result = bridge.confirm({
		kind: 'address',
		requestId: request.requestId,
		result: { addressId: 'address-1' }
	})
	assert.deepEqual(result, { kind: 'address', requestId: request.requestId, addressId: 'address-1' })
	assert.deepEqual(callbacks, [{
		payload: result,
		savedContext: { applicationId: 'app-1', nested: { callerView: 'confirm' } }
	}])
	assert.equal(Object.isFrozen(callbacks[0].savedContext), true)
	assert.equal(bridge.pendingCount(), 0)
	assert.equal(now, 1000)
})

test('address, region, and animal confirmations return only their frozen identifier shapes', () => {
	const { createSelectorBridge } = bridgeModule
	const bridge = createSelectorBridge({ idFactory: (kind, time, sequence) => `${kind}-${sequence}` })
	const address = bridge.createRequest({ kind: 'address', callerId: 'caller-a' })
	const region = bridge.createRequest({ kind: 'region', callerId: 'caller-b' })
	const animal = bridge.createRequest({ kind: 'animal', callerId: 'caller-c' })

	assert.deepEqual(bridge.confirm({
		kind: 'address', requestId: address.requestId, result: { addressId: 'addr-1' }
	}), { kind: 'address', requestId: 'address-1', addressId: 'addr-1' })
	const regionResult = bridge.confirm({
		kind: 'region', requestId: region.requestId,
		result: { parts: ['北京市', '北京市', '朝阳区', '望京街道'] }
	})
	const animalResult = bridge.confirm({
		kind: 'animal', requestId: animal.requestId, result: { animalIds: ['cat-1', 'cat-2'] }
	})
	assert.deepEqual(regionResult, {
		kind: 'region', requestId: 'region-2', parts: ['北京市', '北京市', '朝阳区', '望京街道']
	})
	assert.deepEqual(animalResult, {
		kind: 'animal', requestId: 'animal-3', animalIds: ['cat-1', 'cat-2']
	})
	assert.equal(Object.isFrozen(regionResult), true)
	assert.equal(Object.isFrozen(regionResult.parts), true)
	assert.equal(Object.isFrozen(animalResult.animalIds), true)
})

test('wrong kind, wrong request, and invalid result do not consume another pending request', () => {
	const { createSelectorBridge } = bridgeModule
	const bridge = createSelectorBridge({ idFactory: () => 'request-1' })
	const request = bridge.createRequest({ kind: 'address', callerId: 'caller-a' })
	throwsCode(() => bridge.confirm({ kind: 'region', requestId: request.requestId, result: { parts: ['p-1'] } }), 'REQUEST_KIND_MISMATCH')
	throwsCode(() => bridge.confirm({ kind: 'address', requestId: request.requestId, result: { phone: '13800000000' } }), 'UNKNOWN_PARAMETER')
	throwsCode(() => bridge.confirm({ kind: 'address', requestId: 'other-request', result: { addressId: 'addr-1' } }), 'UNKNOWN_REQUEST')
	assert.equal(bridge.pendingCount(), 1)
	assert.deepEqual(bridge.confirm({
		kind: 'address', requestId: request.requestId, result: { addressId: 'addr-1' }
	}), { kind: 'address', requestId: 'request-1', addressId: 'addr-1' })
})

test('unknown kinds, malformed requests, sensitive fields, and invalid identifier lists fail closed', () => {
	const { createSelectorBridge } = bridgeModule
	const bridge = createSelectorBridge({ idFactory: (kind, time, sequence) => `${kind}-${sequence}` })
	throwsCode(() => bridge.createRequest({ kind: 'unknown', callerId: 'caller-a' }), 'UNKNOWN_SELECTOR')
	throwsCode(() => bridge.createRequest({ kind: 'address', callerId: 'caller a' }), 'INVALID_ID')
	throwsCode(() => bridge.createRequest({ kind: 'address', callerId: 'caller-a', context: { phone: () => {} } }), 'INVALID_CONTEXT')
	throwsCode(() => bridge.createRequest({ kind: 'address', callerId: 'caller-a', extra: true }), 'UNKNOWN_PARAMETER')

	const address = bridge.createRequest({ kind: 'address', callerId: 'caller-a' })
	throwsCode(() => bridge.confirm({
		kind: 'address', requestId: address.requestId, result: { addressId: 'addr-1', name: '姓名' }
	}), 'UNKNOWN_PARAMETER')
	throwsCode(() => bridge.confirm({
		kind: 'address', requestId: address.requestId, result: { addressId: '../address' }
	}), 'INVALID_ID')
	assert.equal(bridge.pendingCount(), 1)
	const region = bridge.createRequest({ kind: 'region', callerId: 'caller-b' })
	throwsCode(() => bridge.confirm({ kind: 'region', requestId: region.requestId, result: { parts: ['北京市', ''] } }), 'INVALID_REGION_PART')
	const animal = bridge.createRequest({ kind: 'animal', callerId: 'caller-c' })
	throwsCode(() => bridge.confirm({
		kind: 'animal', requestId: animal.requestId, result: { animalIds: ['cat-1', 'cat-1'] }
	}), 'DUPLICATE_ID')
	assert.equal(bridge.pendingCount(), 3)
})

test('region parts preserve four-level Chinese names, including same-name levels, with bounded text only', () => {
	const { createSelectorBridge } = bridgeModule
	const bridge = createSelectorBridge({ idFactory: (kind, time, sequence) => `${kind}-${sequence}` })
	const valid = bridge.createRequest({ kind: 'region', callerId: 'caller-a' })
	assert.deepEqual(bridge.confirm({
		kind: 'region', requestId: valid.requestId,
		result: { parts: ['北京市', '北京市', '朝阳区', '望京街道'] }
	}), {
		kind: 'region', requestId: valid.requestId,
		parts: ['北京市', '北京市', '朝阳区', '望京街道']
	})

	const invalid = [
		{ code: 'INVALID_RESULT', result: { parts: [] } },
		{ code: 'INVALID_REGION_PART', result: { parts: ['湖南省', ' ', '雨花区'] } },
		{ code: 'INVALID_REGION_PART', result: { parts: ['湖南省', '', '雨花区'] } },
		{ code: 'INVALID_REGION_PART', result: { parts: ['湖南省', '长沙市', '雨花区', 'x'.repeat(65)] } },
		{ code: 'INVALID_REGION_PART', result: { parts: ['湖南省', '长沙市\n', '雨花区'] } }
	]
	for (const { code, result } of invalid) {
		const request = bridge.createRequest({ kind: 'region', callerId: `caller-${bridge.pendingCount() + 1}` })
		throwsCode(() => bridge.confirm({ kind: 'region', requestId: request.requestId, result }), code)
	}
})

test('idFactory collisions are rejected without replacing the first request', () => {
	const { createSelectorBridge } = bridgeModule
	const bridge = createSelectorBridge({ idFactory: () => 'same-request' })
	const first = bridge.createRequest({ kind: 'address', callerId: 'caller-a' })
	throwsCode(() => bridge.createRequest({ kind: 'region', callerId: 'caller-b' }), 'DUPLICATE_REQUEST_ID')
	assert.equal(bridge.pendingCount(), 1)
	assert.equal(bridge.hasPending('address', first.requestId), true)
	throwsCode(() => bridge.confirm({ kind: 'region', requestId: first.requestId, result: { parts: ['p-1'] } }), 'REQUEST_KIND_MISMATCH')
	assert.equal(bridge.hasPending('address', first.requestId), true)
	bridge.confirm({ kind: 'address', requestId: first.requestId, result: { addressId: 'addr-1' } })
	throwsCode(() => bridge.createRequest({ kind: 'address', callerId: 'caller-c' }), 'DUPLICATE_REQUEST_ID')
})

test('parallel requests stay isolated and caller destruction cancels only that caller', () => {
	const { createSelectorBridge } = bridgeModule
	const cancelled = []
	const bridge = createSelectorBridge({ idFactory: (kind, time, sequence) => `${kind}-${sequence}` })
	const first = bridge.createRequest({ kind: 'address', callerId: 'caller-a', onCancel: (payload) => cancelled.push(payload) })
	const second = bridge.createRequest({ kind: 'animal', callerId: 'caller-a', onCancel: (payload) => cancelled.push(payload) })
	const other = bridge.createRequest({ kind: 'region', callerId: 'caller-b', onCancel: (payload) => cancelled.push(payload) })

	const destroyed = bridge.cancelCaller('caller-a')
	assert.deepEqual(destroyed, [
		{ kind: 'address', requestId: first.requestId, reason: 'caller-destroyed' },
		{ kind: 'animal', requestId: second.requestId, reason: 'caller-destroyed' }
	])
	assert.deepEqual(cancelled, destroyed)
	assert.equal(bridge.pendingCount(), 1)
	assert.equal(bridge.hasPending('region', other.requestId), true)
	throwsCode(() => bridge.confirm({ kind: 'address', requestId: first.requestId, result: { addressId: 'addr-1' } }), 'UNKNOWN_REQUEST')
	bridge.cancel({ kind: 'region', requestId: other.requestId })
	assert.equal(bridge.pendingCount(), 0)
})

test('expiration cleanup and direct confirmation reject expired requests and consume once', () => {
	const { createSelectorBridge } = bridgeModule
	let now = 100
	const cancelled = []
	const bridge = createSelectorBridge({ now: () => now, idFactory: (kind, time, sequence) => `${kind}-${sequence}` })
	const first = bridge.createRequest({
		kind: 'address', callerId: 'caller-a', ttlMs: 10,
		onCancel: (payload) => cancelled.push(payload)
	})
	now = 110
	assert.deepEqual(bridge.cleanupExpired(), [{ kind: 'address', requestId: first.requestId, reason: 'expired' }])
	assert.deepEqual(cancelled, [{ kind: 'address', requestId: first.requestId, reason: 'expired' }])
	throwsCode(() => bridge.confirm({ kind: 'address', requestId: first.requestId, result: { addressId: 'addr-1' } }), 'UNKNOWN_REQUEST')

	now = 200
	const second = bridge.createRequest({ kind: 'region', callerId: 'caller-b', ttlMs: 5, onCancel: (payload) => cancelled.push(payload) })
	now = 205
	throwsCode(() => bridge.confirm({ kind: 'region', requestId: second.requestId, result: { parts: ['p-1'] } }), 'EXPIRED_REQUEST')
	throwsCode(() => bridge.cancel({ kind: 'region', requestId: second.requestId }), 'UNKNOWN_REQUEST')
	assert.equal(bridge.pendingCount(), 0)
})

test('callback exceptions happen after consumption and cannot trigger a second callback', () => {
	const { createSelectorBridge } = bridgeModule
	let bridge
	let callbackCount = 0
	bridge = createSelectorBridge({ idFactory: (kind, time, sequence) => `${kind}-${sequence}` })
	const request = bridge.createRequest({
		kind: 'address',
		callerId: 'caller-a',
		onConfirm: () => {
			callbackCount += 1
			throwsCode(() => bridge.confirm({
				kind: 'address', requestId: request.requestId, result: { addressId: 'addr-1' }
			}), 'UNKNOWN_REQUEST')
			throw new Error('caller callback failed')
		}
	})
	throwsCode(() => bridge.confirm({
		kind: 'address', requestId: request.requestId, result: { addressId: 'addr-1' }
	}), 'CALLBACK_FAILED')
	assert.equal(callbackCount, 1)
	throwsCode(() => bridge.confirm({
		kind: 'address', requestId: request.requestId, result: { addressId: 'addr-1' }
	}), 'UNKNOWN_REQUEST')

	const cancelRequest = bridge.createRequest({
		kind: 'region', callerId: 'caller-a', onCancel: () => { throw new Error('cancel callback failed') }
	})
	throwsCode(() => bridge.cancel({ kind: 'region', requestId: cancelRequest.requestId }), 'CALLBACK_FAILED')
	throwsCode(() => bridge.cancel({ kind: 'region', requestId: cancelRequest.requestId }), 'UNKNOWN_REQUEST')

	const asyncRequest = bridge.createRequest({
		kind: 'animal', callerId: 'caller-a', onConfirm: () => Promise.resolve('later')
	})
	throwsCode(() => bridge.confirm({
		kind: 'animal', requestId: asyncRequest.requestId, result: { animalIds: ['cat-1'] }
	}), 'ASYNC_CALLBACK_UNSUPPORTED')
	throwsCode(() => bridge.confirm({
		kind: 'animal', requestId: asyncRequest.requestId, result: { animalIds: ['cat-1'] }
	}), 'UNKNOWN_REQUEST')
})

test('restart loses in-memory requests and does not consume a request from another bridge', () => {
	const { createSelectorBridge } = bridgeModule
	let now = 1000
	const firstBridge = createSelectorBridge({ now: () => now })
	const request = firstBridge.createRequest({ kind: 'address', callerId: 'caller-a' })
	const secondResults = []
	const secondBridge = createSelectorBridge({ now: () => now })
	const secondRequest = secondBridge.createRequest({
		kind: 'address', callerId: 'caller-a',
		onConfirm: (payload) => secondResults.push(payload)
	})
	assert.notEqual(request.requestId, secondRequest.requestId)
	throwsCode(() => secondBridge.confirm({
		kind: 'address', requestId: request.requestId, result: { addressId: 'addr-1' }
	}), 'UNKNOWN_REQUEST')
	assert.equal(secondBridge.hasPending('address', secondRequest.requestId), true)
	secondBridge.confirm({ kind: 'address', requestId: secondRequest.requestId, result: { addressId: 'addr-2' } })
	assert.deepEqual(secondResults, [{ kind: 'address', requestId: secondRequest.requestId, addressId: 'addr-2' }])
	assert.equal(firstBridge.hasPending('address', request.requestId), true)
})
