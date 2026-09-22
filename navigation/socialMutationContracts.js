/**
 * Read-only gate for social comment/post deletion and correction intents.
 *
 * The repository has no approved social persistence writer or moderation
 * policy.  This contract therefore validates the current actor and exact
 * object relation, then returns an explicit unavailable result.  It never
 * treats a role/query/status hint as authority and never mutates a record.
 */

import { resolveTrustedActor } from './actorCapabilities.js'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const INTENTS = Object.freeze(['delete', 'correct'])
const INPUT_KEYS = new Set(['intent', 'dynamicId', 'commentId', 'record', 'actorProvider'])
const RELATION_FIELDS = Object.freeze(['authorId', 'authorUserId', 'userId', 'ownerId'])

export class SocialMutationContractError extends Error {
	constructor(code, message, details) {
		super(message)
		this.name = 'SocialMutationContractError'
		this.code = code
		this.details = details || {}
	}
}

function fail(code, message, details) {
	throw new SocialMutationContractError(code, message, details)
}

function own(value, key) {
	return Object.prototype.hasOwnProperty.call(value, key)
}

function isPlainRecord(value) {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
	const prototype = Object.getPrototypeOf(value)
	return prototype === Object.prototype || prototype === null
}

function assertRecord(value, label) {
	if (!isPlainRecord(value)) fail('INVALID_RECORD', `${label} must be a plain object`)
	for (const key of Object.keys(value)) {
		if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
			fail('PROTOTYPE_KEY', `${label} contains a forbidden key`, { key })
		}
	}
}

function id(value, label) {
	if (typeof value !== 'string' || !value || value !== value.trim() || !SAFE_ID.test(value) || URL_MARKERS.test(value)) {
		fail('INVALID_ID', `${label} must be an opaque ID`, { label })
	}
	return value
}

function frozen(value, seen = new WeakSet()) {
	if (value === null || typeof value !== 'object' || seen.has(value)) return value
	seen.add(value)
	for (const key of Object.keys(value)) frozen(value[key], seen)
	return Object.freeze(value)
}

function failure(code, message, actor = null, target = null) {
	return frozen({ status: 'empty', code, message, actor, target, readOnly: true, canWrite: false })
}

function actorRelation(record, actorId) {
	return RELATION_FIELDS.some(field => own(record, field) && (
		Array.isArray(record[field]) ? record[field].includes(actorId) : record[field] === actorId
	))
}

/**
 * Validate one exact social object and return a non-writing decision.
 * `record` must be a fresh current record supplied by the caller's domain
 * reader; this function never reads a fixture or storage key itself.
 */
export function evaluateSocialMutation(input = {}) {
	try {
		assertRecord(input, 'social mutation input')
		for (const key of Object.keys(input)) {
			if (!INPUT_KEYS.has(key)) fail('UNKNOWN_FIELD', `Unknown social mutation field: ${key}`, { key })
		}
		if (!INTENTS.includes(input.intent)) fail('INVALID_INTENT', 'Only delete and correct intents are supported')
		const dynamicId = id(input.dynamicId, 'dynamicId')
		const commentId = id(input.commentId, 'commentId')
		assertRecord(input.record, 'social mutation record')
		if (input.record.dynamicId !== dynamicId || input.record.commentId !== commentId) {
			return failure('OBJECT_MISMATCH', 'social mutation target does not match the current record')
		}
		let actor
		try {
			actor = resolveTrustedActor(input.actorProvider)
		} catch (error) {
			return failure(error.code || 'ACTOR_PROVIDER_FAILED', 'trusted actor is unavailable')
		}
		if (!actor) return failure('NO_ACTOR', 'trusted actor is unavailable')
		const target = Object.freeze({ intent: input.intent, dynamicId, commentId })
		if (!actorRelation(input.record, actor.id)) return failure('FORBIDDEN', 'actor is not the current social author', actor, target)
		// The relation is necessary but deliberately not sufficient: no approved
		// social writer/moderation policy exists in this repository yet.
		return failure('SOCIAL_MUTATION_UNAVAILABLE', 'social deletion and correction are not enabled', actor, target)
	} catch (error) {
		return failure(error.code || 'SOCIAL_CONTRACT_FAILED', error.message || 'social mutation rejected')
	}
}

export const evaluateSocialMutationIntent = evaluateSocialMutation
export { INTENTS as SOCIAL_MUTATION_INTENTS }
