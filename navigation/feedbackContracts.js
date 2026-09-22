/**
 * Pure feedback-task and evidence contract.
 *
 * This module is a read-model seam for the feeding and social domains.  It
 * has no Vue, uni-app, page, package, storage, or network dependency.  A
 * domain adapter supplies the trusted actor, the already-resolved order and
 * animal records, and an explicit policy version.  This contract never
 * performs a write and never treats a dynamic route/query value as proof of
 * ownership or permission.
 *
 * The policy is deliberately required.  Required/maximum counts, the
 * feedback window, and whether deleted/withdrawn evidence remains counted
 * are product rules and cannot be inferred from a page or a fixture.
 */

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

export const FEEDBACK_KINDS = Object.freeze({
	DYNAMIC: 'dynamic',
	FEEDING_EVIDENCE: 'feeding_evidence',
})

export const FEEDBACK_KIND_VALUES = Object.freeze(Object.values(FEEDBACK_KINDS))

export const EVIDENCE_STATES = Object.freeze([
	'pending',
	'active',
	'corrected',
	'deleted',
	'withdrawn',
	'rejected',
])

export const FEEDBACK_TASK_STATUSES = Object.freeze([
	'scheduled',
	'pending',
	'completed',
	'excess',
	'overdue',
])

export class FeedbackContractError extends Error {
	constructor(code, message, details) {
		super(message)
		this.name = 'FeedbackContractError'
		this.code = code
		this.details = details || {}
	}
}

function fail(code, message, details) {
	throw new FeedbackContractError(code, message, details)
}

function own(value, key) {
	return Object.prototype.hasOwnProperty.call(value, key)
}

function isPlainRecord(value) {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
	const prototype = Object.getPrototypeOf(value)
	if (prototype === Object.prototype || prototype === null) return true
	// WeChat native objects can cross a JS realm boundary.  Accept an ordinary
	// cross-realm Object but continue to reject class instances.
	const descriptor = Object.getOwnPropertyDescriptor(prototype, 'constructor')
	return Object.getPrototypeOf(prototype) === null
		&& Object.prototype.toString.call(value) === '[object Object]'
		&& descriptor
		&& typeof descriptor.value === 'function'
		&& descriptor.value.name === 'Object'
}

function rejectDangerousKeys(value, label) {
	for (const key of Object.getOwnPropertyNames(value)) {
		if (DANGEROUS_KEYS.has(key)) fail('PROTOTYPE_KEY', `${label} contains a prototype key`, { key })
	}
	if (Object.getOwnPropertySymbols(value).length) {
		fail('UNKNOWN_FIELD', `${label} cannot contain symbol fields`)
	}
}

function assertRecord(value, label) {
	if (!isPlainRecord(value)) fail('INVALID_RECORD', `${label} must be a plain object`, { label })
	rejectDangerousKeys(value, label)
}

function assertAllowedFields(value, allowed, label) {
	for (const key of Object.keys(value)) {
		if (!allowed.has(key)) fail('UNKNOWN_FIELD', `Unknown ${label} field: ${key}`, { key })
	}
}

function assertId(value, label) {
	if (typeof value !== 'string' || value.length === 0) {
		fail('MISSING_ID', `${label} is required`, { label })
	}
	if (value !== value.trim() || !SAFE_ID.test(value) || URL_MARKERS.test(value)) {
		fail('INVALID_ID', `${label} must be an opaque ID`, { label })
	}
	return value
}

function assertVersion(value, label = 'policyVersion') {
	if (typeof value !== 'string' || value.length === 0 || value !== value.trim()) {
		fail('MISSING_POLICY_VERSION', `${label} is required`, { label })
	}
	if (!SAFE_ID.test(value) || URL_MARKERS.test(value)) {
		fail('INVALID_POLICY_VERSION', `${label} must be an opaque version`, { label })
	}
	return value
}

function assertEnum(value, label, allowed) {
	if (typeof value !== 'string' || !allowed.includes(value)) {
		fail('INVALID_ENUM', `${label} is not supported`, { label, allowed })
	}
	return value
}

function resolveTrustedActor(actorProvider) {
	if (typeof actorProvider !== 'function') fail('ACTOR_PROVIDER_REQUIRED', 'A trusted actorProvider function is required')
	let provided
	try {
		provided = actorProvider()
	} catch (error) {
		fail('ACTOR_PROVIDER_FAILED', 'The trusted actorProvider failed')
	}
	if (!isPlainRecord(provided)) fail('ACTOR_PROVIDER_FAILED', 'The trusted actorProvider must return an actor/session record')
	const actor = own(provided, 'actor') ? provided.actor : provided
	assertRecord(actor, 'trusted actor')
	const actorId = assertId(own(actor, 'id') ? actor.id : actor.actorId, 'trusted actor.id')
	return Object.freeze({ id: actorId })
}

function normalizeTimestamp(value, label, { required = false } = {}) {
	if (value === undefined || value === null || value === '') {
		if (required) fail('MISSING_TIMESTAMP', `${label} is required`, { label })
		return null
	}
	let milliseconds
	if (typeof value === 'number' && Number.isSafeInteger(value)) {
		milliseconds = value
	} else if (typeof value === 'string' && value.trim()) {
		try {
			milliseconds = Date.parse(value)
		} catch (error) {
			fail('INVALID_TIMESTAMP', `${label} is not a valid timestamp`, { label })
		}
	} else {
		fail('INVALID_TIMESTAMP', `${label} must be an epoch millisecond or ISO timestamp`, { label })
	}
	if (!Number.isFinite(milliseconds) || milliseconds < 0) {
		fail('INVALID_TIMESTAMP', `${label} is not a valid timestamp`, { label })
	}
	try {
		return Object.freeze({ milliseconds, value: new Date(milliseconds).toISOString() })
	} catch (error) {
		fail('INVALID_TIMESTAMP', `${label} is outside the supported timestamp range`, { label })
	}
}

function timestampValue(value, label, options) {
	return normalizeTimestamp(value, label, options)
}

function normalizePolicy(policy) {
	if (!isPlainRecord(policy)) fail('POLICY_REQUIRED', 'An explicit feedback policy is required')
	assertRecord(policy, 'feedback policy')
	assertAllowedFields(policy, new Set([
		'version', 'evidenceKinds', 'requiredCount', 'maximumCount',
		'startsAt', 'expiresAt', 'countRules', 'lastFeedbackStates',
	]), 'feedback policy')
	const version = assertVersion(policy.version, 'policy.version')
	if (!Array.isArray(policy.evidenceKinds) || policy.evidenceKinds.length === 0) {
		fail('POLICY_KINDS_REQUIRED', 'policy.evidenceKinds must explicitly allow at least one feedback kind')
	}
	const evidenceKinds = []
	for (const kind of policy.evidenceKinds) {
		const normalized = assertEnum(kind, 'policy.evidenceKinds[]', FEEDBACK_KIND_VALUES)
		if (!evidenceKinds.includes(normalized)) evidenceKinds.push(normalized)
	}
	if (!Number.isSafeInteger(policy.requiredCount) || policy.requiredCount < 0) {
		fail('INVALID_POLICY_COUNT', 'policy.requiredCount must be a non-negative safe integer')
	}
	if (!Number.isSafeInteger(policy.maximumCount) || policy.maximumCount < policy.requiredCount) {
		fail('INVALID_POLICY_COUNT', 'policy.maximumCount must be a safe integer >= requiredCount')
	}
	const startsAt = timestampValue(policy.startsAt, 'policy.startsAt')
	const expiresAt = timestampValue(policy.expiresAt, 'policy.expiresAt')
	if (startsAt && expiresAt && expiresAt.milliseconds <= startsAt.milliseconds) {
		fail('INVALID_POLICY_WINDOW', 'policy.expiresAt must be after policy.startsAt')
	}
	if (!isPlainRecord(policy.countRules)) fail('COUNT_RULES_REQUIRED', 'policy.countRules must explicitly define every evidence state')
	assertRecord(policy.countRules, 'policy.countRules')
	for (const key of Object.keys(policy.countRules)) {
		if (!EVIDENCE_STATES.includes(key)) fail('UNKNOWN_COUNT_STATE', `Unknown count rule state: ${key}`)
	}
	const countRules = {}
	for (const state of EVIDENCE_STATES) {
		if (!own(policy.countRules, state)) fail('COUNT_RULE_REQUIRED', `policy.countRules.${state} is required`, { state })
		const rule = policy.countRules[state]
		if (rule !== 'count' && rule !== 'exclude') {
			fail('INVALID_COUNT_RULE', `policy.countRules.${state} must be count or exclude`, { state })
		}
		countRules[state] = rule
	}
	if (!Array.isArray(policy.lastFeedbackStates)) {
		fail('LAST_FEEDBACK_RULE_REQUIRED', 'policy.lastFeedbackStates must be explicitly supplied')
	}
	const lastFeedbackStates = []
	for (const state of policy.lastFeedbackStates) {
		const normalized = assertEnum(state, 'policy.lastFeedbackStates[]', EVIDENCE_STATES)
		if (!lastFeedbackStates.includes(normalized)) lastFeedbackStates.push(normalized)
	}
	return Object.freeze({
		version,
		evidenceKinds: Object.freeze(evidenceKinds),
		requiredCount: policy.requiredCount,
		maximumCount: policy.maximumCount,
		startsAt: startsAt ? startsAt.value : null,
		expiresAt: expiresAt ? expiresAt.value : null,
		countRules: Object.freeze(countRules),
		lastFeedbackStates: Object.freeze(lastFeedbackStates),
	})
}

export const normalizeFeedbackPolicy = normalizePolicy

function normalizeIdentityFields(input, kind, { evidence = true, requireAttempt = true } = {}) {
	const actorId = assertId(input.actorId, 'actorId')
	const policyVersion = assertVersion(input.policyVersion)
	const attemptKey = requireAttempt ? assertId(input.attemptKey, 'attemptKey') : null
	const dynamicId = input.dynamicId === undefined ? undefined : assertId(input.dynamicId, 'dynamicId')
	if (kind === FEEDBACK_KINDS.DYNAMIC) {
		if (!dynamicId) fail('MISSING_DYNAMIC_ID', 'ordinary dynamic feedback requires dynamicId')
		if (own(input, 'order') || own(input, 'animal') || own(input, 'orderId') || own(input, 'animalId') || own(input, 'yardId')) {
			fail('CROSS_DOMAIN_FIELD', 'ordinary dynamic feedback cannot carry order/animal associations')
		}
	} else if (kind === FEEDBACK_KINDS.FEEDING_EVIDENCE) {
		if (evidence && !dynamicId) fail('MISSING_DYNAMIC_ID', 'feeding evidence must point to its dynamic evidence carrier')
		if (!evidence) return { actorId, policyVersion, attemptKey, dynamicId }
		if (!input.order || !input.animal) fail('MISSING_ASSOCIATION', 'feeding evidence requires resolved order and animal records')
	} else {
		fail('INVALID_ENUM', 'feedback kind is not supported', { kind })
	}
	return { actorId, policyVersion, attemptKey, dynamicId }
}

function normalizeOrderAndAnimal(orderInput, animalInput) {
	assertRecord(orderInput, 'feedback order')
	assertAllowedFields(orderInput, new Set(['orderId', 'animalId', 'yardId']), 'feedback order')
	assertRecord(animalInput, 'feedback animal')
	assertAllowedFields(animalInput, new Set(['animalId', 'yardId']), 'feedback animal')
	const orderId = assertId(orderInput.orderId, 'order.orderId')
	const orderAnimalId = assertId(orderInput.animalId, 'order.animalId')
	const orderYardId = assertId(orderInput.yardId, 'order.yardId')
	const animalId = assertId(animalInput.animalId, 'animal.animalId')
	const animalYardId = assertId(animalInput.yardId, 'animal.yardId')
	if (orderAnimalId !== animalId) fail('ASSOCIATION_CONFLICT', 'order and animal identify different animals')
	if (orderYardId !== animalYardId) fail('CROSS_YARD_ASSOCIATION', 'order and animal belong to different yards')
	return Object.freeze({ orderId, animalId, yardId: orderYardId })
}

function identityPart(value) {
	return `${value.length}:${value}`
}

/**
 * The business key identifies one legal feedback attempt.  requestId is
 * intentionally absent: transport retries with a new requestId must still
 * resolve to the same attempt.  A new attemptKey is the only way to count a
 * different feedback event.
 */
export function feedbackBusinessKey(input) {
	assertRecord(input, 'feedback identity')
	assertAllowedFields(input, new Set(['kind', 'dynamicId', 'orderId', 'animalId', 'yardId', 'actorId', 'policyVersion', 'attemptKey']), 'feedback identity')
	const kind = assertEnum(input.kind, 'kind', FEEDBACK_KIND_VALUES)
	if (kind === FEEDBACK_KINDS.FEEDING_EVIDENCE && own(input, 'dynamicId')) {
		fail('CROSS_DOMAIN_FIELD', 'feeding business keys must use order/animal identity, not a dynamicId')
	}
	const identity = normalizeIdentityFields(input, kind, { evidence: false })
	const values = [kind]
	if (kind === FEEDBACK_KINDS.DYNAMIC) values.push(identity.dynamicId)
	else values.push(assertId(input.orderId, 'orderId'), assertId(input.animalId, 'animalId'), assertId(input.yardId, 'yardId'))
	values.push(identity.actorId, identity.policyVersion, identity.attemptKey)
	return `feedback:${values.map(identityPart).join('|')}`
}

export function feedbackRequestKey(input) {
	assertRecord(input, 'feedback request identity')
	assertAllowedFields(input, new Set(['kind', 'dynamicId', 'orderId', 'animalId', 'yardId', 'actorId', 'policyVersion', 'attemptKey', 'requestId']), 'feedback request identity')
	const requestId = assertId(input.requestId, 'requestId')
	const { requestId: ignored, ...businessInput } = input
	return `${feedbackBusinessKey(businessInput)}|request:${identityPart(requestId)}`
}

function normalizeEvidenceRecord(input, policy) {
	if (!isPlainRecord(input)) fail('INVALID_EVIDENCE', 'feedback evidence must be a plain object')
	assertRecord(input, 'feedback evidence')
	assertAllowedFields(input, new Set([
		'evidenceId', 'dynamicId', 'kind', 'actorId', 'policyVersion', 'attemptKey',
		'requestId', 'state', 'createdAt', 'order', 'animal', 'mutationIntent',
	]), 'feedback evidence')
	const kind = assertEnum(input.kind, 'kind', FEEDBACK_KIND_VALUES)
	const normalizedPolicy = normalizePolicy(policy)
	if (!normalizedPolicy.evidenceKinds.includes(kind)) {
		fail('POLICY_KIND_NOT_ALLOWED', `policy ${normalizedPolicy.version} does not allow ${kind}`)
	}
	if (own(input, 'mutationIntent')) {
		fail('MUTATION_INTENT_NOT_SUPPORTED', 'evidence deletion, withdrawal, and correction are not write operations of this contract')
	}
	const evidenceId = assertId(input.evidenceId, 'evidenceId')
	const identity = normalizeIdentityFields(input, kind)
	if (identity.policyVersion !== normalizedPolicy.version) {
		fail('POLICY_VERSION_MISMATCH', 'evidence policyVersion does not match the injected policy')
	}
	const requestId = assertId(input.requestId, 'requestId')
	const state = assertEnum(input.state, 'state', EVIDENCE_STATES)
	const createdAt = timestampValue(input.createdAt, 'createdAt', { required: true })
	let association = null
	if (kind === FEEDBACK_KINDS.FEEDING_EVIDENCE) {
		association = normalizeOrderAndAnimal(input.order, input.animal)
	} else {
		if (input.order || input.animal) fail('CROSS_DOMAIN_FIELD', 'ordinary dynamic evidence cannot carry order/animal records')
	}
	const businessInput = {
		kind,
		actorId: identity.actorId,
		policyVersion: identity.policyVersion,
		attemptKey: identity.attemptKey,
		...(kind === FEEDBACK_KINDS.DYNAMIC
			? { dynamicId: identity.dynamicId }
			: { orderId: association.orderId, animalId: association.animalId, yardId: association.yardId }),
	}
	const businessKey = feedbackBusinessKey(businessInput)
	return Object.freeze({
		evidenceId,
		dynamicId: identity.dynamicId || null,
		kind,
		actorId: identity.actorId,
		policyVersion: identity.policyVersion,
		attemptKey: identity.attemptKey,
		requestId,
		requestKey: feedbackRequestKey({ ...businessInput, requestId }),
		businessKey,
		state,
		createdAt: createdAt.value,
		_createdAt: createdAt.milliseconds,
		...(association || {}),
	})
}

export const normalizeFeedbackEvidence = normalizeEvidenceRecord

function pickLatestDuplicate(previous, current) {
	if (previous._createdAt > current._createdAt) return previous
	if (current._createdAt > previous._createdAt) return current
	if (previous.state !== current.state) {
		fail('CONFLICTING_EVIDENCE', 'duplicate feedback attempt has conflicting states at the same timestamp', {
			businessKey: current.businessKey,
		})
	}
	return previous
}

function isEvidenceWithinWindow(item, policy, nowMilliseconds) {
	if (item._createdAt > nowMilliseconds) return false
	if (policy.startsAt !== null && item._createdAt < Date.parse(policy.startsAt)) return false
	if (policy.expiresAt !== null && item._createdAt > Date.parse(policy.expiresAt)) return false
	return true
}

/**
 * Dedupe evidence by business attempt, then count it through the injected
 * policy.  A request retry with a different requestId is one attempt; a new
 * attemptKey is a separate legal feedback.  Reusing one requestId across
 * different attempts is rejected as a replay/collision.
 */
export function dedupeFeedbackEvidence(evidence, { policy, now } = {}) {
	const normalizedPolicy = normalizePolicy(policy)
	if (!Array.isArray(evidence)) fail('INVALID_EVIDENCE_LIST', 'feedback evidence must be an array')
	const current = now === undefined ? null : timestampValue(now, 'now', { required: true })
	const byBusinessKey = new Map()
	const requestToBusiness = new Map()
	const idToBusiness = new Map()
	for (const item of evidence) {
		const normalized = normalizeEvidenceRecord(item, normalizedPolicy)
		const previousRequest = requestToBusiness.get(normalized.requestId)
		if (previousRequest && previousRequest !== normalized.businessKey) {
			fail('REQUEST_KEY_REUSE', 'requestId cannot be reused for a different feedback attempt')
		}
		requestToBusiness.set(normalized.requestId, normalized.businessKey)
		const previousId = idToBusiness.get(normalized.evidenceId)
		if (previousId && previousId !== normalized.businessKey) {
			fail('DUPLICATE_EVIDENCE_ID', 'evidenceId cannot identify different feedback attempts')
		}
		idToBusiness.set(normalized.evidenceId, normalized.businessKey)
		if (current && !isEvidenceWithinWindow(normalized, normalizedPolicy, current.milliseconds)) continue
		const previous = byBusinessKey.get(normalized.businessKey)
		byBusinessKey.set(normalized.businessKey, previous ? pickLatestDuplicate(previous, normalized) : normalized)
	}
	return Object.freeze(Array.from(byBusinessKey.values()))
}

function latestFeedbackAt(evidence, policy) {
	let latest = null
	for (const item of evidence) {
		if (!policy.lastFeedbackStates.includes(item.state)) continue
		if (!latest || item._createdAt > latest._createdAt) latest = item
	}
	return latest ? latest.createdAt : null
}

/**
 * Build the read model used by a task/list adapter.  All counts and temporal
 * status are derived from the injected policy and caller-supplied `now`.
 */
export function summarizeFeedbackTask(input, { policy, now, actorProvider } = {}) {
	if (!isPlainRecord(input)) fail('INVALID_TASK', 'feedback task must be a plain object')
	assertRecord(input, 'feedback task')
	assertAllowedFields(input, new Set([
		'taskId', 'kind', 'dynamicId', 'actorId', 'policyVersion', 'attemptKey',
		'order', 'animal', 'evidence', 'nextFeedbackAt',
	]), 'feedback task')
	const normalizedPolicy = normalizePolicy(policy)
	const current = timestampValue(now, 'now', { required: true })
	const policyStart = normalizedPolicy.startsAt ? Date.parse(normalizedPolicy.startsAt) : null
	const policyEnd = normalizedPolicy.expiresAt ? Date.parse(normalizedPolicy.expiresAt) : null
	const kind = assertEnum(input.kind, 'kind', FEEDBACK_KIND_VALUES)
	if (!normalizedPolicy.evidenceKinds.includes(kind)) fail('POLICY_KIND_NOT_ALLOWED', `policy ${normalizedPolicy.version} does not allow ${kind}`)
	const trustedActor = resolveTrustedActor(actorProvider)
	const identity = normalizeIdentityFields(input, kind, { evidence: false, requireAttempt: false })
	if (identity.policyVersion !== normalizedPolicy.version) fail('POLICY_VERSION_MISMATCH', 'task policyVersion does not match the injected policy')
	if (trustedActor.id !== identity.actorId) fail('ACTOR_MISMATCH', 'task actorId must match the trusted actorProvider')
	if (!Array.isArray(input.evidence)) fail('INVALID_EVIDENCE_LIST', 'feedback task evidence must be an array')
	const association = kind === FEEDBACK_KINDS.FEEDING_EVIDENCE
		? normalizeOrderAndAnimal(input.order, input.animal)
		: null
	const evidence = dedupeFeedbackEvidence(input.evidence, { policy: normalizedPolicy, now: current.value })
	const filtered = evidence.filter((item) => {
		if (item.kind !== kind || item.actorId !== identity.actorId || item.policyVersion !== normalizedPolicy.version) {
			fail('TASK_EVIDENCE_CONFLICT', 'task evidence does not belong to the task actor, kind, or policy version')
		}
		if (kind === FEEDBACK_KINDS.DYNAMIC && item.dynamicId !== identity.dynamicId) fail('TASK_EVIDENCE_CONFLICT', 'dynamic evidence belongs to another dynamic')
		if (kind === FEEDBACK_KINDS.FEEDING_EVIDENCE
			&& (item.orderId !== association.orderId || item.animalId !== association.animalId || item.yardId !== association.yardId)) {
			fail('TASK_EVIDENCE_CONFLICT', 'feeding evidence belongs to another order, animal, or yard')
		}
		return normalizedPolicy.countRules[item.state] === 'count'
	})
	const completedCount = filtered.length
	let status
	if (policyStart !== null && current.milliseconds < policyStart) status = 'scheduled'
	else if (completedCount < normalizedPolicy.requiredCount) {
		status = policyEnd !== null && current.milliseconds > policyEnd ? 'overdue' : 'pending'
	} else if (completedCount === normalizedPolicy.requiredCount) status = 'completed'
	else status = 'excess'
	const dynamicId = kind === FEEDBACK_KINDS.DYNAMIC ? identity.dynamicId : undefined
	const taskValues = [kind]
	if (kind === FEEDBACK_KINDS.DYNAMIC) taskValues.push(dynamicId)
	else taskValues.push(association.orderId, association.animalId, association.yardId)
	taskValues.push(identity.actorId, normalizedPolicy.version)
	const taskId = `feedback-task:${taskValues.map(identityPart).join('|')}`
	if (input.taskId !== undefined && input.taskId !== taskId) fail('TASK_ID_MISMATCH', 'taskId does not match the feedback object and actor')
	const nextAt = timestampValue(input.nextFeedbackAt, 'nextFeedbackAt')
	return Object.freeze({
		taskId,
		kind,
		...(dynamicId === undefined ? {} : { dynamicId }),
		...(association || {}),
		actorId: identity.actorId,
		policyVersion: normalizedPolicy.version,
		requiredCount: normalizedPolicy.requiredCount,
		maximumCount: normalizedPolicy.maximumCount,
		completedCount,
		status,
		limitExceeded: completedCount > normalizedPolicy.maximumCount,
		nextFeedbackAt: nextAt ? nextAt.value : null,
		lastFeedbackAt: latestFeedbackAt(evidence, normalizedPolicy),
		expiresAt: normalizedPolicy.expiresAt,
		isOverdue: status === 'overdue',
		evidenceCount: evidence.length,
	})
}

export const createFeedbackTaskSummary = summarizeFeedbackTask

function deniedTaskAccess(reason) {
	return Object.freeze({ canRead: false, canWriteOrder: false, canWriteAnimal: false, canDeleteEvidence: false, canCorrectEvidence: false, reason })
}

export function getFeedbackTaskAccess(task, { actorProvider } = {}) {
	if (!isPlainRecord(task) || typeof task.actorId !== 'string') return deniedTaskAccess('INVALID_TASK')
	let trustedActor
	try {
		trustedActor = resolveTrustedActor(actorProvider)
	} catch (error) {
		return deniedTaskAccess(error.code || 'ACTOR_PROVIDER_FAILED')
	}
	const canRead = trustedActor.id === task.actorId
	return Object.freeze({
		canRead,
		canWriteOrder: false,
		canWriteAnimal: false,
		canDeleteEvidence: false,
		canCorrectEvidence: false,
		reason: canRead ? 'actor-match' : 'actor-mismatch',
	})
}

export function canReadFeedbackTask(task, options) {
	return getFeedbackTaskAccess(task, options).canRead
}
