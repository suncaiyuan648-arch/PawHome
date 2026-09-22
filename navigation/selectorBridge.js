/**
 * In-memory selector return bridge.
 *
 * This is a local contract seam for a caller that opened a selector and later
 * receives a result. It deliberately has no uni-app, storage, eventChannel,
 * page, or fixture dependency. The `bridge: 'eventChannel'` field mirrors the
 * route contract as a handoff marker; this module does not create or forward a
 * cross-page eventChannel.
 */

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const SELECTOR_KINDS = Object.freeze(['address', 'region', 'animal'])
const DEFAULT_SELECTOR_TTL_MS = 5 * 60 * 1000
const MAX_SELECTOR_TTL_MS = 24 * 60 * 60 * 1000
let bridgeInstanceSequence = 0

class SelectorBridgeError extends Error {
	constructor(code, message, details) {
		super(message)
		this.name = 'SelectorBridgeError'
		this.code = code
		this.details = details || {}
	}
}

function fail(code, message, details) {
	throw new SelectorBridgeError(code, message, details)
}

function isPlainRecord(value) {
	if (value === null || typeof value !== 'object') return false
	const prototype = Object.getPrototypeOf(value)
	return prototype === Object.prototype || prototype === null
}

function assertPlainRecord(value, label) {
	if (!isPlainRecord(value)) fail('INVALID_REQUEST', `${label} must be a plain object`, { label })
}

function assertSafeKey(key, label) {
	if (DANGEROUS_KEYS.has(key)) fail('PROTOTYPE_KEY', `${label} contains a prototype key`, { key })
}

function assertId(value, label) {
	if (typeof value !== 'string' || !value || value.length > 128 || !SAFE_ID.test(value)) {
		fail('INVALID_ID', `${label} must be a restricted non-empty ID`, { label })
	}
	return value
}

function assertKind(value) {
	if (typeof value !== 'string' || !SELECTOR_KINDS.includes(value)) {
		fail('UNKNOWN_SELECTOR', `Unknown selector kind: ${String(value)}`, { kind: value })
	}
	return value
}

function assertNoUnknownKeys(value, allowed, label) {
	for (const key of Object.keys(value)) {
		assertSafeKey(key, label)
		if (!allowed.includes(key)) fail('UNKNOWN_PARAMETER', `${label} contains an unsupported field: ${key}`, { key })
	}
}

function cloneAndFreeze(value, label, seen = new Set()) {
	if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
	if (typeof value === 'number') {
		if (!Number.isFinite(value)) fail('INVALID_CONTEXT', `${label} contains a non-finite number`, { label })
		return value
	}
	if (typeof value !== 'object') fail('INVALID_CONTEXT', `${label} contains an unsupported value`, { label })
	if (seen.has(value)) fail('INVALID_CONTEXT', `${label} must not contain cycles`, { label })
	seen.add(value)
	let copy
	if (Array.isArray(value)) {
		copy = value.map((item, index) => cloneAndFreeze(item, `${label}[${index}]`, seen))
	} else {
		if (!isPlainRecord(value)) fail('INVALID_CONTEXT', `${label} must contain plain objects`, { label })
		copy = {}
		for (const key of Object.keys(value)) {
			assertSafeKey(key, label)
			copy[key] = cloneAndFreeze(value[key], `${label}.${key}`, seen)
		}
	}
	seen.delete(value)
	Object.freeze(copy)
	return copy
}

function assertClock(now) {
	const value = now()
	if (!Number.isFinite(value)) fail('INVALID_CLOCK', 'now() must return a finite number')
	return value
}

function assertRequestEnvelope(input, label) {
	assertPlainRecord(input, label)
	assertNoUnknownKeys(input, ['kind', 'requestId', 'result'], label)
	assertKind(input.kind)
	assertId(input.requestId, 'requestId')
	return input
}

function assertResult(kind, result, requestId) {
	assertPlainRecord(result, 'selector result')
	for (const key of Object.keys(result)) assertSafeKey(key, 'selector result')
	if (kind === 'address') {
		assertNoUnknownKeys(result, ['addressId'], 'selector result')
		if (Object.keys(result).length !== 1) fail('MISSING_RESULT', 'address result requires addressId')
		return Object.freeze({ kind, requestId, addressId: assertId(result.addressId, 'addressId') })
	}
	if (kind === 'region') {
		assertNoUnknownKeys(result, ['parts'], 'selector result')
		if (!Array.isArray(result.parts) || result.parts.length < 1 || result.parts.length > 4) {
			fail('INVALID_RESULT', 'region result parts must contain one to four names')
		}
		const parts = result.parts.map((part, index) => {
			if (typeof part !== 'string' || !part || part.trim() !== part || part.length > 64) {
				fail('INVALID_REGION_PART', `parts[${index}] must be a short non-empty name`)
			}
			if (/[\u0000-\u001f\u007f]/.test(part)) {
				fail('INVALID_REGION_PART', `parts[${index}] contains a control character`)
			}
			try {
				encodeURIComponent(part)
			} catch (error) {
				fail('INVALID_UNICODE', `parts[${index}] contains invalid Unicode`)
			}
			return part
		})
		return Object.freeze({ kind, requestId, parts: Object.freeze(parts.slice()) })
	}
	assertNoUnknownKeys(result, ['animalIds'], 'selector result')
	if (!Array.isArray(result.animalIds) || result.animalIds.length < 1 || result.animalIds.length > 6) {
		fail('INVALID_RESULT', 'animalIds must contain one to six IDs')
	}
	const animalIds = result.animalIds.map((animalId, index) => assertId(animalId, `animalIds[${index}]`))
	if (new Set(animalIds).size !== animalIds.length) fail('DUPLICATE_ID', 'animalIds must be unique')
	return Object.freeze({ kind, requestId, animalIds: Object.freeze(animalIds.slice()) })
}

function assertReason(reason) {
	if (reason === undefined) return 'cancelled'
	if (typeof reason !== 'string' || !reason || reason.length > 64 || /[\u0000-\u001f\u007f]/.test(reason)) {
		fail('INVALID_REASON', 'cancel reason must be a short non-empty string')
	}
	return reason
}

function callbackFailure(error, phase) {
	const failure = new SelectorBridgeError('CALLBACK_FAILED', `${phase} callback failed`)
	failure.cause = error
	return failure
}

function asyncCallbackFailure(result, phase) {
	const failure = new SelectorBridgeError('ASYNC_CALLBACK_UNSUPPORTED', `${phase} callback must complete synchronously`)
	failure.cause = result
	return failure
}

function createBridgeNonce() {
	bridgeInstanceSequence += 1
	const randomPart = Math.random().toString(36).slice(2, 10) || '0'
	return `s${bridgeInstanceSequence}-${randomPart}`
}

/**
 * Creates an isolated, memory-only request bridge.
 *
 * Request shape: { kind, callerId, context?, ttlMs?, onConfirm?, onCancel? }.
 * Returned request shape: { kind, requestId, callerId, expiresAt,
 * bridge: 'eventChannel', autoRedirect: false }. Context stays in memory and
 * is passed as a separate callback argument so it cannot enter a URL/result.
 */
export function createSelectorBridge(options = {}) {
	assertPlainRecord(options, 'bridge options')
	assertNoUnknownKeys(options, ['now', 'idFactory', 'defaultTtlMs'], 'bridge options')
	const now = options.now === undefined ? () => Date.now() : options.now
	if (typeof now !== 'function') fail('INVALID_CLOCK', 'now must be a function')
	const bridgeNonce = createBridgeNonce()
	const idFactory = options.idFactory === undefined
		? ((kind, currentTime, sequence) => `selector-${bridgeNonce}-${kind}-${currentTime}-${sequence}`)
		: options.idFactory
	if (typeof idFactory !== 'function') fail('INVALID_ID_FACTORY', 'idFactory must be a function')
	const defaultTtlMs = options.defaultTtlMs === undefined ? DEFAULT_SELECTOR_TTL_MS : options.defaultTtlMs
	if (!Number.isInteger(defaultTtlMs) || defaultTtlMs < 1 || defaultTtlMs > MAX_SELECTOR_TTL_MS) {
		fail('INVALID_TTL', 'defaultTtlMs must be a positive integer within one day')
	}

	const pending = new Map()
	const issuedRequestIds = new Set()
	let sequence = 0

	function createRequest(input) {
		assertPlainRecord(input, 'selector request')
		assertNoUnknownKeys(input, ['kind', 'callerId', 'context', 'ttlMs', 'onConfirm', 'onCancel'], 'selector request')
		const kind = assertKind(input.kind)
		const callerId = assertId(input.callerId, 'callerId')
		const context = input.context === undefined ? Object.freeze({}) : cloneAndFreeze(input.context, 'context')
		const ttlMs = input.ttlMs === undefined ? defaultTtlMs : input.ttlMs
		if (!Number.isInteger(ttlMs) || ttlMs < 1 || ttlMs > MAX_SELECTOR_TTL_MS) {
			fail('INVALID_TTL', 'ttlMs must be a positive integer within one day')
		}
		if (input.onConfirm !== undefined && typeof input.onConfirm !== 'function') {
			fail('INVALID_CALLBACK', 'onConfirm must be a function')
		}
		if (input.onCancel !== undefined && typeof input.onCancel !== 'function') {
			fail('INVALID_CALLBACK', 'onCancel must be a function')
		}
		const currentTime = assertClock(now)
		let requestId
		try {
			requestId = idFactory(kind, currentTime, ++sequence)
		} catch (error) {
			fail('INVALID_ID_FACTORY', 'idFactory failed')
		}
		assertId(requestId, 'requestId')
		if (issuedRequestIds.has(requestId)) fail('DUPLICATE_REQUEST_ID', `requestId was already issued: ${requestId}`)
		issuedRequestIds.add(requestId)
		const expiresAt = currentTime + ttlMs
		const entry = {
			kind,
			requestId,
			callerId,
			context,
			expiresAt,
			onConfirm: input.onConfirm,
			onCancel: input.onCancel
		}
		pending.set(requestId, entry)
		return Object.freeze({
			kind,
			requestId,
			callerId,
			expiresAt,
			bridge: 'eventChannel',
			autoRedirect: false
		})
	}

	function findEntry(kind, requestId) {
		assertKind(kind)
		assertId(requestId, 'requestId')
		const entry = pending.get(requestId)
		if (!entry) fail('UNKNOWN_REQUEST', `Unknown selector request: ${requestId}`, { requestId })
		if (entry.kind !== kind) {
			fail('REQUEST_KIND_MISMATCH', 'selector kind does not match the pending request', {
				requestId,
				expectedKind: entry.kind,
				actualKind: kind
			})
		}
		return entry
	}

	function invoke(entry, callback, payload, phase) {
		if (typeof callback !== 'function') return
		let callbackResult
		try {
			callbackResult = callback(payload, entry.context)
		} catch (error) {
			throw callbackFailure(error, phase)
		}
		if (callbackResult && (typeof callbackResult === 'object' || typeof callbackResult === 'function')) {
			let then
			try {
				then = callbackResult.then
			} catch (error) {
				throw callbackFailure(error, phase)
			}
			if (typeof then === 'function') {
				// Attach a rejection handler before rejecting the synchronous bridge
				// contract, so an async callback cannot become an unhandled rejection.
				try { Promise.resolve(callbackResult).catch(() => {}) } catch (error) { /* ignore thenable cleanup failure */ }
				throw asyncCallbackFailure(callbackResult, phase)
			}
		}
	}

	function consume(entry, payload, callback, phase) {
		// Delete before user code runs. Reentrant confirm/cancel therefore cannot
		// consume the same request twice.
		pending.delete(entry.requestId)
		invoke(entry, callback, payload, phase)
		return payload
	}

	function expireDue(currentTime, notify = true) {
		const expired = Array.from(pending.values()).filter((entry) => entry.expiresAt <= currentTime)
		expired.forEach((entry) => pending.delete(entry.requestId))
		const payloads = expired.map((entry) => Object.freeze({
			kind: entry.kind,
			requestId: entry.requestId,
			reason: 'expired'
		}))
		if (notify) {
			let firstError
			expired.forEach((entry, index) => {
				try {
					invoke(entry, entry.onCancel, payloads[index], 'cancel')
				} catch (error) {
					if (!firstError) firstError = error
				}
			})
			if (firstError) throw firstError
		}
		return payloads
	}

	function confirm(input) {
		assertRequestEnvelope(input, 'confirm request')
		const entry = findEntry(input.kind, input.requestId)
		const currentTime = assertClock(now)
		if (entry.expiresAt <= currentTime) {
			pending.delete(entry.requestId)
			const payload = Object.freeze({ kind: entry.kind, requestId: entry.requestId, reason: 'expired' })
			invoke(entry, entry.onCancel, payload, 'cancel')
			fail('EXPIRED_REQUEST', 'selector request has expired', { requestId: entry.requestId })
		}
		const payload = assertResult(entry.kind, input.result, entry.requestId)
		return consume(entry, payload, entry.onConfirm, 'confirm')
	}

	function cancel(input) {
		assertPlainRecord(input, 'cancel request')
		assertNoUnknownKeys(input, ['kind', 'requestId', 'reason'], 'cancel request')
		const entry = findEntry(input.kind, input.requestId)
		const payload = Object.freeze({
			kind: entry.kind,
			requestId: entry.requestId,
			reason: assertReason(input.reason)
		})
		return consume(entry, payload, entry.onCancel, 'cancel')
	}

	function cancelCaller(callerId, reason = 'caller-destroyed') {
		assertId(callerId, 'callerId')
		const normalizedReason = assertReason(reason)
		const entries = Array.from(pending.values()).filter((entry) => entry.callerId === callerId)
		entries.forEach((entry) => pending.delete(entry.requestId))
		const payloads = entries.map((entry) => Object.freeze({
			kind: entry.kind,
			requestId: entry.requestId,
			reason: normalizedReason
		}))
		let firstError
		entries.forEach((entry, index) => {
			try {
				invoke(entry, entry.onCancel, payloads[index], 'cancel')
			} catch (error) {
				if (!firstError) firstError = error
			}
		})
		if (firstError) throw firstError
		return payloads
	}

	function cleanupExpired() {
		return expireDue(assertClock(now))
	}

	return Object.freeze({
		createRequest,
		confirm,
		cancel,
		cancelCaller,
		cleanupExpired,
		pendingCount: () => pending.size,
		hasPending: (kind, requestId) => {
			assertKind(kind)
			assertId(requestId, 'requestId')
			return pending.has(requestId) && pending.get(requestId).kind === kind
		}
	})
}

// All production callers and selector pages must import this same instance.
// The factory is for isolated tests/scopes, not one independent bridge per page.
export const selectorBridge = createSelectorBridge()

export {
	DEFAULT_SELECTOR_TTL_MS,
	SELECTOR_KINDS,
	SelectorBridgeError,
}
