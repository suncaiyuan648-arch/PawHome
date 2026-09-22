/**
 * Append-only local feedback-evidence storage seam.
 *
 * This is a persistence adapter, not a moderation or correction API.  Every
 * read and append is scoped by a freshly resolved actor and an explicit
 * feedback policy.  Delete, withdraw, and correction are intentionally not
 * exported; the canonical contract rejects those mutation intents.
 */
import { resolveTrustedActor } from '../../../navigation/actorCapabilities.js'
import {
	FEEDBACK_KINDS,
	normalizeFeedbackEvidence,
} from '../../../navigation/feedbackContracts.js'

export const FEEDBACK_EVIDENCE_STORAGE_KEY = 'PAWHOME_FEEDBACK_EVIDENCE'

function frozen(value, seen = new WeakSet()) {
	if (value === null || typeof value !== 'object' || seen.has(value)) return value
	seen.add(value)
	for (const key of Object.keys(value)) frozen(value[key], seen)
	return Object.freeze(value)
}

function failure(code, message, actor = null, data = null) {
	return frozen({ success: false, source: 'storage', data, error: { code, message }, actor, readOnly: true, canWrite: false })
}

function success(data, actor, extra = {}) {
	return frozen({ success: true, source: 'storage', data, error: null, actor, readOnly: true, canWrite: false, ...extra })
}

function record(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function actorOf(actorProvider) {
	try {
		const actor = resolveTrustedActor(actorProvider)
		return actor ? { actor, error: null } : { actor: null, error: { code: 'NO_ACTOR' } }
	} catch (error) {
		return { actor: null, error }
	}
}

function errorCode(error, fallback) {
	return error && typeof error.code === 'string' && error.code ? error.code : fallback
}

function readRaw() {
	let raw
	try {
		raw = uni.getStorageSync(FEEDBACK_EVIDENCE_STORAGE_KEY)
	} catch (error) {
		throw Object.assign(new Error('feedback evidence storage read failed'), { code: 'STORAGE_READ_FAILED' })
	}
	if (raw === undefined || raw === null || raw === '') return []
	let value
	try {
		value = typeof raw === 'string' ? JSON.parse(raw) : raw
	} catch (error) {
		throw Object.assign(new Error('feedback evidence storage is not valid JSON'), { code: 'INVALID_EVIDENCE_STORAGE' })
	}
	if (!Array.isArray(value)) throw Object.assign(new Error('feedback evidence storage must be an array'), { code: 'INVALID_EVIDENCE_STORAGE' })
	return value
}

function storedInput(item) {
	const order = record(item.order) ? item.order : {}
	const animal = record(item.animal) ? item.animal : {}
	const common = {
		evidenceId: item.evidenceId,
		...(item.dynamicId ? { dynamicId: item.dynamicId } : {}),
		kind: item.kind,
		actorId: item.actorId,
		policyVersion: item.policyVersion,
		attemptKey: item.attemptKey,
		requestId: item.requestId,
		state: item.state,
		createdAt: item.createdAt,
	}
	if (item.kind === FEEDBACK_KINDS.FEEDING_EVIDENCE) {
		const orderId = item.orderId || order.orderId
		const animalId = item.animalId || order.animalId || animal.animalId
		const yardId = item.yardId || order.yardId || animal.yardId
		common.order = { orderId, animalId, yardId }
		common.animal = { animalId, yardId }
	}
	return common
}

function persistedInput(normalized) {
	return storedInput(normalized)
}

function normalizeStored(raw, policy) {
	const items = []
	const ids = new Set()
	for (const item of raw) {
		if (!record(item)) throw Object.assign(new Error('feedback evidence row is not an object'), { code: 'INVALID_EVIDENCE_RECORD' })
		const id = String(item.evidenceId || '')
		if (!id || ids.has(id)) throw Object.assign(new Error('feedback evidence ID is duplicated'), { code: 'DUPLICATE_EVIDENCE_ID' })
		ids.add(id)
		try {
			items.push(normalizeFeedbackEvidence(storedInput(item), policy))
		} catch (error) {
			throw Object.assign(new Error('feedback evidence row is invalid'), { code: errorCode(error, 'INVALID_EVIDENCE_RECORD') })
		}
	}
	return items
}

function listData(items, diagnostics = []) {
	return { items, total: items.length, diagnostics }
}

function filterItems(items, options, actor) {
	const result = items.filter(item => item.actorId === actor.id)
	if (options.kind !== undefined && options.kind !== '' && result.some(item => item.kind !== options.kind)) {
		return result.filter(item => item.kind === options.kind)
	}
	if (options.kind) return result.filter(item => item.kind === options.kind)
	return result
}

function matches(item, options) {
	if (options.kind !== undefined && options.kind !== '' && item.kind !== options.kind) return false
	for (const key of ['dynamicId', 'orderId', 'animalId', 'yardId']) {
		if (options[key] !== undefined && options[key] !== '' && item[key] !== options[key]) return false
	}
	return true
}

/** Read only the current actor's canonical evidence rows. */
export function readFeedbackEvidence(options = {}) {
	const resolved = actorOf(options.actorProvider)
	if (resolved.error || !resolved.actor) return failure(errorCode(resolved.error, 'NO_ACTOR'), 'trusted actor is unavailable')
	try {
		const items = normalizeStored(readRaw(), options.policy).filter(item => matches(item, options))
		return success(listData(items.filter(item => item.actorId === resolved.actor.id)), resolved.actor)
	} catch (error) {
		return failure(errorCode(error, 'FEEDBACK_READ_FAILED'), 'feedback evidence read failed closed', resolved.actor)
	}
}

/**
 * Append one canonical evidence row.  Repeating an existing attempt is
 * idempotent and never writes a second row; a different attemptKey is a new
 * legal record.  This seam is for local persistence tests and future backend
 * replacement, not for a real submission UI.
 */
export function appendFeedbackEvidence(input, { actorProvider, policy } = {}) {
	const resolved = actorOf(actorProvider)
	if (resolved.error || !resolved.actor) return failure(errorCode(resolved.error, 'NO_ACTOR'), 'trusted actor is unavailable')
	let normalized
	try {
		normalized = normalizeFeedbackEvidence(input, policy)
		if (normalized.actorId !== resolved.actor.id) return failure('ACTOR_MISMATCH', 'evidence actor does not match the trusted actor', resolved.actor)
	} catch (error) {
		return failure(errorCode(error, 'INVALID_EVIDENCE'), 'feedback evidence is invalid', resolved.actor)
	}
	let existing
	try {
		existing = normalizeStored(readRaw(), policy)
	} catch (error) {
		return failure(errorCode(error, 'FEEDBACK_READ_FAILED'), 'existing evidence is invalid; append refused', resolved.actor)
	}
	const sameId = existing.find(item => item.evidenceId === normalized.evidenceId)
	if (sameId && sameId.businessKey !== normalized.businessKey) return failure('DUPLICATE_EVIDENCE_ID', 'evidenceId belongs to another attempt', resolved.actor)
	const sameAttempt = existing.find(item => item.businessKey === normalized.businessKey)
	if (sameAttempt) return success(sameAttempt, resolved.actor, { idempotent: true })
	const next = [...existing.map(persistedInput), persistedInput(normalized)]
	try {
		uni.setStorageSync(FEEDBACK_EVIDENCE_STORAGE_KEY, JSON.stringify(next))
	} catch (error) {
		return failure('STORAGE_WRITE_FAILED', 'feedback evidence append was not acknowledged', resolved.actor)
	}
	return success(normalized, resolved.actor, { idempotent: false })
}

export const readEvidence = readFeedbackEvidence
export const appendEvidence = appendFeedbackEvidence
