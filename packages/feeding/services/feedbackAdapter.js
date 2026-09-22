/**
 * Read-only feedback task adapter.
 *
 * The feedback contract owns policy, evidence, association, actor and
 * idempotency validation.  This module supplies a bounded read source: the
 * existing feeding order reader can provide empty-evidence task shells, and
 * a future dynamic/evidence repository may be supplied through the explicit
 * synchronous `reader` seam.  Caller records, query fields and displayed
 * roles are never accepted as data or authorization.
 */
import {
	FEEDBACK_KINDS,
	FEEDBACK_KIND_VALUES,
	normalizeFeedbackPolicy,
	summarizeFeedbackTask,
} from '../../../navigation/feedbackContracts.js'
import { resolveTrustedActor } from '../../../navigation/actorCapabilities.js'
import { getFeedingOrders } from './orderMockApi.js'

const PERSPECTIVES = Object.freeze(['mine', 'yard'])
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const TASK_ID_PATTERN = /^feedback-task:[A-Za-z0-9._:|=-]{1,511}$/

function isRecord(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function optionsOf(value) {
	return isRecord(value) ? value : {}
}

function text(value) {
	return value === undefined || value === null ? '' : String(value)
}

function errorCode(error, fallback = 'FEEDBACK_READ_FAILED') {
	return error && typeof error.code === 'string' && error.code ? error.code : fallback
}

function frozen(value, seen = new WeakSet()) {
	if (value === null || typeof value !== 'object' || seen.has(value)) return value
	seen.add(value)
	for (const key of Object.keys(value)) frozen(value[key], seen)
	return Object.freeze(value)
}

function failure(code, message, actor = null, data = null) {
	return frozen({
		success: false,
		source: 'mock',
		data,
		error: { code, message },
		actor,
		readOnly: true,
		canWrite: false,
	})
}

function success(data, actor, source = 'mock') {
	return frozen({
		success: true,
		source,
		data,
		error: null,
		actor,
		readOnly: true,
		canWrite: false,
	})
}

function emptyData(kind = '', perspective = 'mine', policyVersion = '') {
	return {
		items: [],
		total: 0,
		kind,
		perspective,
		policyVersion,
		diagnostics: [],
	}
}

function resolveActor(actorProvider) {
	try {
		const actor = resolveTrustedActor(actorProvider)
		return actor ? { actor, error: null } : { actor: null, error: { code: 'NO_ACTOR' } }
	} catch (error) {
		return { actor: null, error }
	}
}

function normalizeNow(value) {
	if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
		const date = new Date(value)
		if (Number.isFinite(date.getTime())) return value
	}
	if (typeof value === 'string' && value && value === value.trim()) {
		const parsed = Date.parse(value)
		if (Number.isFinite(parsed) && parsed >= 0 && Number.isFinite(new Date(parsed).getTime())) return value
	}
	throw Object.assign(new Error('feedback now must be a valid timestamp'), { code: 'INVALID_TIMESTAMP' })
}

function normalizeKind(value) {
	if (!FEEDBACK_KIND_VALUES.includes(value)) {
		throw Object.assign(new Error('feedback kind is required'), { code: 'INVALID_KIND' })
	}
	return value
}

function normalizePerspective(value) {
	const result = value === undefined || value === null || value === '' ? 'mine' : value
	if (!PERSPECTIVES.includes(result)) {
		throw Object.assign(new Error('feedback perspective is unsupported'), { code: 'INVALID_PERSPECTIVE' })
	}
	return result
}

function normalizeYardId(value) {
	if (value === undefined || value === null || value === '') return ''
	if (typeof value !== 'string' || value !== value.trim() || !SAFE_ID.test(value) || URL_MARKERS.test(value)) {
		throw Object.assign(new Error('yardId must be an opaque ID'), { code: 'INVALID_YARD_ID' })
	}
	return value
}

function normalizeTaskId(value) {
	if (typeof value !== 'string' || !value) {
		throw Object.assign(new Error('taskId is required'), { code: 'MISSING_TASK_ID' })
	}
	if (value !== value.trim() || !TASK_ID_PATTERN.test(value) || URL_MARKERS.test(value)) {
		throw Object.assign(new Error('taskId must be an opaque ID'), { code: 'INVALID_TASK_ID' })
	}
	return value
}

function requestContext(actor, kind, policy, now, perspective, yardId) {
	return frozen({
		actor,
		kind,
		policyVersion: policy.version,
		now,
		perspective,
		yardId,
	})
}

function defaultFeedingTask(raw, context) {
	if (!isRecord(raw)) throw Object.assign(new Error('feeding order must be an object'), { code: 'INVALID_ORDER' })
	const orderId = raw.id !== undefined ? raw.id : raw.orderId
	const petIds = Array.isArray(raw.petIds) ? raw.petIds : []
	const animalId = raw.petId !== undefined ? raw.petId : (petIds.length === 1 ? petIds[0] : undefined)
	const yardId = raw.yardId
	return {
		kind: FEEDBACK_KINDS.FEEDING_EVIDENCE,
		actorId: context.actor.id,
		policyVersion: context.policyVersion,
		order: { orderId, animalId, yardId },
		animal: { animalId, yardId },
		evidence: [],
		...(raw.nextFeedbackAt === undefined ? {} : { nextFeedbackAt: raw.nextFeedbackAt }),
	}
}

async function readDefaultFeedingTasks(context) {
	let response
	try {
		response = await getFeedingOrders({
			variant: context.perspective,
			userPawId: context.perspective === 'mine' ? context.actor.id : undefined,
			yardOwnerId: context.perspective === 'yard' ? context.actor.id : undefined,
			yardId: context.yardId || undefined,
		})
	} catch (error) {
		throw Object.assign(new Error('feeding order reader failed'), { code: 'FEEDING_READER_FAILED' })
	}
	if (!response || response.success !== true || !response.data || !Array.isArray(response.data.items)) {
		throw Object.assign(new Error('feeding order reader returned an invalid result'), { code: 'FEEDING_READER_FAILED' })
	}
	return { items: response.data.items.map(item => defaultFeedingTask(item, context)), source: response.source || 'mock' }
}

async function readCandidates({ reader, context, kind }) {
	if (reader !== undefined) {
		if (typeof reader !== 'function') throw Object.assign(new Error('feedback reader must be a function'), { code: 'INVALID_READER' })
		let value
		try {
			value = reader(context)
		} catch (error) {
			throw Object.assign(new Error('feedback reader failed'), { code: errorCode(error, 'READER_FAILED') })
		}
		if (value && typeof value.then === 'function') {
			if (typeof value.catch === 'function') value.catch(() => {})
			throw Object.assign(new Error('feedback reader must return synchronously'), { code: 'ASYNC_READER_UNSUPPORTED' })
		}
		if (!Array.isArray(value)) throw Object.assign(new Error('feedback reader must return an array'), { code: 'INVALID_READER_RESULT' })
		return { items: value, source: 'reader' }
	}

	if (kind === FEEDBACK_KINDS.DYNAMIC) {
		throw Object.assign(new Error('dynamic feedback reader is not configured'), { code: 'READER_REQUIRED' })
	}
	return readDefaultFeedingTasks(context)
}

function normalizeCandidates(rawItems, policy, now, actorProvider, diagnostics) {
	const normalized = []
	rawItems.forEach((input, index) => {
		try {
			normalized.push(summarizeFeedbackTask(input, { policy, now, actorProvider }))
		} catch (error) {
			diagnostics.push({ index, code: errorCode(error, 'INVALID_FEEDBACK_TASK') })
		}
	})
	const byId = new Map()
	const conflicted = new Set()
	for (const item of normalized) {
		if (conflicted.has(item.taskId)) continue
		const old = byId.get(item.taskId)
		if (!old) {
			byId.set(item.taskId, item)
			continue
		}
		if (JSON.stringify(old) !== JSON.stringify(item)) {
			byId.delete(item.taskId)
			conflicted.add(item.taskId)
			diagnostics.push({ index: -1, code: 'DUPLICATE_TASK_CONFLICT', taskId: item.taskId })
		}
	}
	return [...byId.values()]
}

async function collect(options, mode = 'list') {
	const source = optionsOf(options)
	let kind
	let perspective
	let yardId
	let policy
	let now
	try {
		kind = normalizeKind(source.kind)
		perspective = normalizePerspective(source.perspective)
		yardId = normalizeYardId(source.yardId)
		policy = normalizeFeedbackPolicy(source.policy)
		now = normalizeNow(source.now)
	} catch (error) {
		return { error, actor: null, kind: kind || '', perspective: perspective || 'mine', policyVersion: policy ? policy.version : '' }
	}

	const resolved = resolveActor(source.actorProvider)
	if (resolved.error || !resolved.actor) {
		return { error: resolved.error || { code: 'NO_ACTOR' }, actor: null, kind, perspective, policyVersion: policy.version }
	}
	const actor = resolved.actor
	const context = requestContext(actor, kind, policy, now, perspective, yardId)
	let loaded
	try {
		loaded = await readCandidates({ reader: source.reader, context, kind })
	} catch (error) {
		return { error, actor, kind, perspective, policyVersion: policy.version }
	}
	const diagnostics = []
	const items = normalizeCandidates(loaded.items, policy, now, source.actorProvider, diagnostics)
	return { actor, kind, perspective, policyVersion: policy.version, items, diagnostics, scanned: loaded.items.length, source: loaded.source, mode }
}

function failureForCollected(collected) {
	const code = errorCode(collected.error, 'FEEDBACK_READ_FAILED')
	const data = emptyData(collected.kind, collected.perspective, collected.policyVersion)
	data.diagnostics.push({ index: -1, code })
	return failure(code, 'feedback task read failed closed', collected.actor, data)
}

/** Read all feedback tasks for one explicit kind and policy snapshot. */
export async function readFeedbackTaskList(options = {}) {
	const collected = await collect(options, 'list')
	if (collected.error) return failureForCollected(collected)
	const data = {
		items: collected.items,
		total: collected.items.length,
		kind: collected.kind,
		perspective: collected.perspective,
		policyVersion: collected.policyVersion,
		diagnostics: collected.diagnostics,
	}
	return success(data, collected.actor, collected.source)
}

/** Read one task by its derived, stable taskId; no fallback item is allowed. */
export async function readFeedbackTaskDetail(options = {}) {
	const source = optionsOf(options)
	let taskId
	try {
		taskId = normalizeTaskId(source.taskId)
	} catch (error) {
		return failure(errorCode(error, 'INVALID_TASK_ID'), 'feedback task ID is invalid')
	}
	const collected = await collect(source, 'detail')
	if (collected.error) return failureForCollected(collected)
	const item = collected.items.find(candidate => candidate.taskId === taskId) || null
	if (!item) return failure('NOT_FOUND', 'feedback task was not found for this actor', collected.actor)
	return success({
		item,
		taskId,
		kind: collected.kind,
		perspective: collected.perspective,
		policyVersion: collected.policyVersion,
	}, collected.actor, collected.source)
}

export const getFeedbackTaskList = readFeedbackTaskList
export const getFeedbackTaskDetail = readFeedbackTaskDetail
export const readFeedbackTasks = readFeedbackTaskList
export const readFeedbackTask = readFeedbackTaskDetail
