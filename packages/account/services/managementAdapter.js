/**
 * Read-only binding for profile, yard, and animal management records.
 *
 * The management contract is deliberately storage agnostic.  This module is
 * the small seam that a domain can bind to a real reader when that reader is
 * available.  There is no management storage in the current repository: the
 * default configuration therefore returns an explicit empty/failure result
 * instead of importing `yardMock`, `petRosterMockApi`, or a page fixture.
 *
 * A reader receives exactly one opaque, already validated ID field:
 * `{ userId }`, `{ yardId }`, or `{ animalId }`.  It must synchronously return
 * one persisted record (or `{ success, data }`).  Query parameters, displayed
 * roles, managed flags, and status values never reach a reader and never
 * authorize a request.  This module never writes and does not expose an
 * editor or mutation callback.
 */

import { resolveTrustedActor } from '../../../navigation/actorCapabilities.js'
import {
	MANAGEMENT_CAPABILITIES,
	evaluateManagementCapabilities,
} from '../../../navigation/managementContracts.js'

const RESOURCE_TYPES = Object.freeze(['profile', 'yard', 'animal'])
const ACCESS_MODES = Object.freeze(['public', 'private', 'management'])
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const DEMO_ID = /^demo(?:[-_:]|$)/i
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

const RESOURCE_ID_FIELDS = Object.freeze({
	profile: 'userId',
	yard: 'yardId',
	animal: 'animalId',
})

// A resource may use its own namespaced IDs (`yard-*`, `animal-*`, and so on),
// but a route from another domain must fail before a reader is called.  Numeric
// IDs remain valid for the legacy yard records.
const CROSS_DOMAIN_PREFIXES = Object.freeze({
	profile: Object.freeze(['yard', 'animal', 'pet', 'rescue', 'feeding', 'order', 'dynamic', 'application', 'adoption', 'review', 'task']),
	yard: Object.freeze(['user', 'profile', 'animal', 'pet', 'rescue', 'feeding', 'order', 'dynamic', 'application', 'adoption', 'review', 'task']),
	animal: Object.freeze(['user', 'profile', 'yard', 'rescue', 'feeding', 'order', 'dynamic', 'application', 'adoption', 'review', 'task']),
})

const CAPABILITY_FOR = Object.freeze({
	profile: Object.freeze({
		public: MANAGEMENT_CAPABILITIES.PROFILE_READ_PUBLIC,
		private: MANAGEMENT_CAPABILITIES.PROFILE_READ_PRIVATE,
		management: MANAGEMENT_CAPABILITIES.PROFILE_READ_PRIVATE,
	}),
	yard: Object.freeze({
		public: MANAGEMENT_CAPABILITIES.YARD_READ_PUBLIC,
		private: MANAGEMENT_CAPABILITIES.YARD_MANAGEMENT_READ_PRIVATE,
		management: MANAGEMENT_CAPABILITIES.YARD_MANAGEMENT_READ_PRIVATE,
	}),
	animal: Object.freeze({
		public: MANAGEMENT_CAPABILITIES.ANIMAL_READ_PUBLIC,
		private: MANAGEMENT_CAPABILITIES.ANIMAL_MANAGEMENT_READ_PRIVATE,
		management: MANAGEMENT_CAPABILITIES.ANIMAL_MANAGEMENT_READ_PRIVATE,
	}),
})

const EDIT_CAPABILITY_FOR = Object.freeze({
	profile: MANAGEMENT_CAPABILITIES.PROFILE_EDIT,
	yard: MANAGEMENT_CAPABILITIES.YARD_EDIT,
	animal: MANAGEMENT_CAPABILITIES.ANIMAL_EDIT,
})

// Public projections intentionally contain only display data.  An authorized
// private/management read receives a defensive copy of the complete safe
// persisted record, while a public read never forwards private fields such as
// phone/contact/notes by accident.
const PUBLIC_FIELDS = Object.freeze({
	profile: Object.freeze([
		'userId', 'status', 'state', 'visibility', 'isPublic', 'name', 'nickname',
		'avatar', 'level', 'bio', 'tags', 'stats', 'createdAt', 'updatedAt',
	]),
	yard: Object.freeze([
		'yardId', 'status', 'state', 'visibility', 'isPublic', 'name', 'avatar',
		'verified', 'location', 'district', 'distance', 'tags', 'description',
		'intro', 'stats', 'gallery', 'createdAt', 'updatedAt',
	]),
	animal: Object.freeze([
		'animalId', 'yardId', 'status', 'state', 'visibility', 'isPublic', 'name',
		'avatar', 'species', 'speciesLabel', 'breed', 'tags', 'description', 'desc',
		'petValue', 'value', 'gender', 'neuter', 'vaccine', 'personality', 'birthday', 'birthValue',
		'createdAt', 'updatedAt',
	]),
})

const TOP_LEVEL_OPTIONS = new Set([
	'actorProvider', 'policy', 'readers', 'resourceType', 'resource', 'access',
	'mode', 'intent', 'cancelled', 'query', 'userId', 'yardId', 'animalId',
	'includeDemo', 'reader',
])
const AUTH_INJECTION_FIELDS = new Set(['role', 'managed', 'state', 'status', 'outcome', 'canWrite', 'write', 'writer', 'record', 'records'])

class ManagementAdapterError extends Error {
	constructor(code, message, details) {
		super(message)
		this.name = 'ManagementAdapterError'
		this.code = code
		this.details = details || {}
	}
}

function fail(code, message, details) {
	throw new ManagementAdapterError(code, message, details)
}

function own(value, key) {
	return Object.prototype.hasOwnProperty.call(value, key)
}

function isPlainRecord(value) {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
	const prototype = Object.getPrototypeOf(value)
	if (prototype === Object.prototype || prototype === null) return true
	const descriptor = Object.getOwnPropertyDescriptor(prototype, 'constructor')
	return Object.getPrototypeOf(prototype) === null
		&& Object.prototype.toString.call(value) === '[object Object]'
		&& descriptor
		&& typeof descriptor.value === 'function'
		&& descriptor.value.name === 'Object'
}

function rejectDangerousKeys(value, label, seen = new WeakSet()) {
	if (value === null || typeof value !== 'object') return
	if (seen.has(value)) return
	seen.add(value)
	for (const key of Reflect.ownKeys(value)) {
		if (typeof key === 'symbol' || DANGEROUS_KEYS.has(key)) {
			fail('PROTOTYPE_KEY', `${label} contains a forbidden key`, { key: String(key) })
		}
		const child = value[key]
		if (child && typeof child === 'object') rejectDangerousKeys(child, `${label}.${key}`, seen)
	}
}

function assertPlainRecord(value, label) {
	if (!isPlainRecord(value)) fail('INVALID_RECORD', `${label} must be a plain object`, { label })
	rejectDangerousKeys(value, label)
}

function isThenable(value) {
	return value !== null
		&& (typeof value === 'object' || typeof value === 'function')
		&& typeof value.then === 'function'
}

function errorCode(error, fallback) {
	return error && typeof error.code === 'string' && error.code ? error.code : fallback
}

function safeText(value) {
	return value === undefined || value === null ? '' : String(value)
}

function normalizeResource(value) {
	if (typeof value !== 'string' || !RESOURCE_TYPES.includes(value)) {
		fail('INVALID_RESOURCE_TYPE', 'management resourceType is not supported')
	}
	return value
}

function normalizeId(value, label, resource, { required = true } = {}) {
	let id
	if (typeof value === 'string') {
		if (value !== value.trim()) fail('INVALID_ID', `${label} must not contain surrounding whitespace`)
		id = value
	} else if (typeof value === 'number' && Number.isSafeInteger(value)) {
		id = String(value)
	} else if (value === undefined || value === null || value === '') {
		if (required) fail('MISSING_ID', `${label} is required`)
		return ''
	} else {
		fail('INVALID_ID', `${label} must be an opaque ID`)
	}
	if (!id) {
		if (required) fail('MISSING_ID', `${label} is required`)
		return ''
	}
	if (!SAFE_ID.test(id) || URL_MARKERS.test(id)) fail('INVALID_ID', `${label} must be an opaque ID`)
	if (DEMO_ID.test(id)) fail('DEMO_RECORD_REJECTED', `${label} cannot address a demo record`)
	const prefixes = CROSS_DOMAIN_PREFIXES[resource] || []
	const lower = id.toLowerCase()
	const prefix = prefixes.find(candidate => lower === candidate
		|| lower.startsWith(`${candidate}-`)
		|| lower.startsWith(`${candidate}_`)
		|| lower.startsWith(`${candidate}:`))
	if (prefix) fail('CROSS_DOMAIN_ID', `${label} belongs to another business domain`, { prefix })
	return id
}

function normalizeQuery(query) {
	if (query === undefined || query === null) return undefined
	assertPlainRecord(query, 'management query')
	for (const key of Object.keys(query)) {
		if (AUTH_INJECTION_FIELDS.has(key)) {
			// These fields remain locator/display hints at the canonical contract,
			// but the adapter must never accept them as a top-level authority.
			if (!['role', 'managed', 'state'].includes(key)) {
				fail('UNTRUSTED_AUTH_FIELD', `management query field ${key} is not accepted`)
			}
			continue
		}
		if (!['userId', 'yardId', 'animalId'].includes(key)) {
			fail('UNKNOWN_QUERY_FIELD', `Unknown management query field: ${key}`, { key })
		}
	}
	const result = {}
	for (const key of ['userId', 'yardId', 'animalId']) {
		if (own(query, key)) result[key] = query[key]
	}
	// The contract validates the hint values and deliberately ignores managed,
	// role, and state for authorization.  Preserve only the locator IDs here so
	// an adapter cannot accidentally turn a display hint into an authority.
	return result
}

function normalizeAccess(options) {
	const raw = options.access === undefined ? options.mode : options.access
	const value = raw === undefined || raw === null || raw === '' ? 'public' : raw
	if (value === 'edit') return 'management'
	if (typeof value !== 'string' || !ACCESS_MODES.includes(value)) {
		fail('INVALID_ACCESS', 'management access mode is not supported')
	}
	return value
}

function normalizeOptions(options) {
	if (options === undefined || options === null) return {}
	assertPlainRecord(options, 'management adapter options')
	for (const key of Object.keys(options)) {
		if (key === 'access') continue
		if (!TOP_LEVEL_OPTIONS.has(key)) {
			if (AUTH_INJECTION_FIELDS.has(key)) fail('UNTRUSTED_AUTH_FIELD', `management option ${key} is not accepted`)
			fail('UNKNOWN_FIELD', `Unknown management option: ${key}`, { key })
		}
		if (AUTH_INJECTION_FIELDS.has(key)) fail('UNTRUSTED_AUTH_FIELD', `management option ${key} is not accepted`)
	}
	if (options.includeDemo === true) fail('DEMO_FALLBACK_DISABLED', 'management readers cannot enable demo fallback')
	if (options.cancelled !== undefined && typeof options.cancelled !== 'boolean') fail('INVALID_CANCELLED', 'cancelled must be boolean')
	if (options.intent !== undefined && options.intent !== 'cancel' && options.intent !== 'read' && options.intent !== 'edit') {
		fail('INVALID_INTENT', 'management intent is not supported')
	}
	if (options.readers !== undefined) assertPlainRecord(options.readers, 'management readers')
	if (options.reader !== undefined && typeof options.reader !== 'function') fail('READER_REQUIRED', 'management reader must be a function')
	return options
}

function readersOf(options, fixed) {
	const readers = fixed || options.readers || {}
	assertPlainRecord(readers, 'management readers')
	for (const key of Object.keys(readers)) {
		if (!RESOURCE_TYPES.includes(key)) fail('UNKNOWN_READER_DOMAIN', `Unknown management reader domain: ${key}`, { key })
		if (typeof readers[key] !== 'function') fail('INVALID_READER', `${key} management reader must be a function`)
	}
	return readers
}

function actorSnapshot(actorProvider) {
	try {
		return { actor: resolveTrustedActor(actorProvider), error: null }
	} catch (error) {
		return { actor: null, error }
	}
}

function freezeDeep(value, seen = new WeakSet()) {
	if (value === null || typeof value !== 'object' || seen.has(value)) return value
	seen.add(value)
	for (const key of Reflect.ownKeys(value)) freezeDeep(value[key], seen)
	return Object.freeze(value)
}

function failure(code, message, actor = null, details = {}) {
	return freezeDeep({
		success: false,
		source: 'reader',
		data: null,
		error: { code, message, ...details },
		actor,
		readOnly: true,
		canWrite: false,
	})
}

function emptyForMissingReader(resourceType, actor, access) {
	return failure('READER_MISSING', `${resourceType} management reader is unavailable`, actor, { access })
}

function readRecord(reader, resourceType, id) {
	const field = RESOURCE_ID_FIELDS[resourceType]
	let result
	try {
		result = reader(Object.freeze({ [field]: id }))
	} catch (error) {
		throw new ManagementAdapterError(errorCode(error, 'READER_FAILED'), `${resourceType} management reader failed`)
	}
	if (isThenable(result)) {
		// A rejected promise must be observed before returning, otherwise a bad
		// async reader creates an unhandled rejection outside the adapter.
		if (typeof result.catch === 'function') result.catch(() => {})
		throw new ManagementAdapterError('ASYNC_READER_UNSUPPORTED', `${resourceType} management reader must return synchronously`)
	}
	if (result === undefined || result === null) return null
	assertPlainRecord(result, `${resourceType} management reader result`)
	if (own(result, 'success') && result.success === false) {
		const sourceError = isPlainRecord(result.error) ? result.error : null
		throw new ManagementAdapterError(errorCode(sourceError, 'SOURCE_READ_FAILED'), `${resourceType} management source read failed`)
	}
	const record = own(result, 'data') ? result.data : own(result, 'record') ? result.record : result
	if (record === undefined || record === null) return null
	assertPlainRecord(record, `${resourceType} management record`)
	return record
}

function identityOf(record, resourceType) {
	const field = RESOURCE_ID_FIELDS[resourceType]
	const id = normalizeId(record[field], `${resourceType}.${field}`, resourceType)
	return id
}

function assertRecordIdentity(record, resourceType, requestedId) {
	const actualId = identityOf(record, resourceType)
	if (actualId !== requestedId) fail('READER_SCOPE_VIOLATION', `${resourceType} reader returned a different record`)
	if (resourceType === 'animal') {
		const yardId = normalizeId(record.yardId, 'animal.yardId', 'yard')
		if (!yardId) fail('MISSING_ID', 'animal.yardId is required')
	}
}

function cloneSafe(value, seen = new WeakMap()) {
	if (value === null || typeof value !== 'object') {
		if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') {
			fail('INVALID_RECORD', 'management record contains an unsupported value')
		}
		return value
	}
	if (seen.has(value)) fail('INVALID_RECORD', 'management record contains a cycle')
	seen.set(value, true)
	if (Array.isArray(value)) return value.map(item => cloneSafe(item, seen))
	if (!isPlainRecord(value)) fail('INVALID_RECORD', 'management record contains a non-plain object')
	const output = {}
	for (const key of Object.keys(value)) output[key] = cloneSafe(value[key], seen)
	return output
}

function publicProjection(record, resourceType) {
	const result = {}
	for (const field of PUBLIC_FIELDS[resourceType]) {
		if (own(record, field)) result[field] = cloneSafe(record[field])
	}
	return result
}

function projectRecord(record, resourceType, access) {
	return access === 'public' ? publicProjection(record, resourceType) : cloneSafe(record)
}

function locatorFor(resourceType, id, options) {
	const locator = {}
	const field = RESOURCE_ID_FIELDS[resourceType]
	const allowedFields = resourceType === 'animal' ? new Set(['animalId', 'yardId']) : new Set([field])
	locator[field] = id
	if (options.query) {
		const query = normalizeQuery(options.query)
		for (const key of ['userId', 'yardId', 'animalId']) {
			if (query && own(query, key)) {
				if (!allowedFields.has(key)) fail('CROSS_DOMAIN_ID', `${key} is outside the ${resourceType} management scope`)
				const queryResource = key === 'userId' ? 'profile' : key === 'yardId' ? 'yard' : 'animal'
				const queryId = normalizeId(query[key], `query.${key}`, queryResource)
				if (key === field && queryId !== id) fail('LOCATOR_CONFLICT', `${key} locator values disagree`)
				locator[key] = queryId
			}
		}
	}
	for (const key of ['userId', 'yardId', 'animalId']) {
		if (!own(options, key)) continue
		if (!allowedFields.has(key)) fail('CROSS_DOMAIN_ID', `${key} is outside the ${resourceType} management scope`)
		const optionResource = key === 'userId' ? 'profile' : key === 'yardId' ? 'yard' : 'animal'
		const optionId = normalizeId(options[key], key, optionResource)
		if (key === field && optionId !== id) fail('LOCATOR_CONFLICT', `${key} locator values disagree`)
		locator[key] = optionId
	}
	return locator
}

function evaluate(resourceType, record, yard, actor, policy, locator, cancelled) {
	const input = {
		actorProvider: () => actor,
		policy,
		resourceType,
		object: record,
		...locator,
		...(yard ? { yard } : {}),
		...(cancelled ? { cancelled: true } : {}),
	}
	return evaluateManagementCapabilities(input)
}

function readResource(resourceType, idValue, rawOptions, fixed = {}, allowReaderOverride = false) {
	let options
	try {
		options = normalizeOptions(rawOptions)
		for (const key of ['resourceType', 'resource']) {
			if (options[key] !== undefined && options[key] !== resourceType) {
				fail('RESOURCE_TYPE_CONFLICT', `${key} does not match the management reader domain`)
			}
		}
		if (!allowReaderOverride && options.reader !== undefined) {
			fail('READER_OVERRIDE_UNSUPPORTED', 'the production management reader cannot be replaced per call')
		}
		resourceType = normalizeResource(resourceType)
		const idField = RESOURCE_ID_FIELDS[resourceType]
		const id = normalizeId(idValue, idField, resourceType)
		const access = normalizeAccess(options)
		const locator = locatorFor(resourceType, id, options)
		const actorState = actorSnapshot(fixed.actorProvider || options.actorProvider)
		if (actorState.error) return failure(errorCode(actorState.error, 'ACTOR_PROVIDER_FAILED'), 'trusted actor is unavailable')
		const actor = actorState.actor
		const cancelled = options.cancelled === true || options.intent === 'cancel'
		if (cancelled) {
			return freezeDeep({
				success: true,
				source: 'reader',
				data: null,
				error: null,
				actor,
				cancelled: true,
				readOnly: true,
				canWrite: false,
			})
		}
		const readers = readersOf(options, fixed.readers)
		const reader = allowReaderOverride && options.reader ? options.reader : readers[resourceType]
		if (typeof reader !== 'function') return emptyForMissingReader(resourceType, actor, access)

		const record = readRecord(reader, resourceType, id)
		if (!record) return failure('NOT_FOUND', `${resourceType} management record was not found`, actor, { access })
		assertRecordIdentity(record, resourceType, id)
		if (resourceType === 'animal' && own(locator, 'yardId')) {
			const actualYardId = normalizeId(record.yardId, 'animal.yardId', 'yard')
			if (locator.yardId !== actualYardId) fail('CROSS_YARD_RELATION', 'animal.yardId does not match yardId locator')
		}

		// An animal manager/yard owner needs the current parent-yard context.  It
		// is read by the yard reader using the animal's persisted yardId, never a
		// query supplied by the caller.  Public animal reads do not require this
		// extra read and therefore remain usable while the yard reader is absent.
		let yard = null
		let parentReadError = null
		if (resourceType === 'animal' && access !== 'public') {
			const yardReader = readers.yard
			if (typeof yardReader === 'function') {
				try {
					yard = readRecord(yardReader, 'yard', normalizeId(record.yardId, 'animal.yardId', 'yard'))
					if (yard) assertRecordIdentity(yard, 'yard', normalizeId(record.yardId, 'animal.yardId', 'yard'))
				} catch (error) {
					parentReadError = error
				}
			}
		}
		if (parentReadError && !isPlainRecord(parentReadError)) parentReadError = new ManagementAdapterError('YARD_READER_FAILED', 'yard context could not be read')

		const result = evaluate(resourceType, record, yard, actor, fixed.policy !== undefined ? fixed.policy : options.policy, locator, false)
		if (result.error) return failure(errorCode(result.error, 'MANAGEMENT_CONTRACT_FAILED'), 'management capability evaluation failed', actor, { access })
		const readCapability = CAPABILITY_FOR[resourceType][access]
		const editCapability = EDIT_CAPABILITY_FOR[resourceType]
		const canRead = result.capabilities[readCapability] === true
		if (!canRead) {
			const reason = result.reasons[readCapability] || (parentReadError ? 'YARD_CONTEXT_READ_FAILED' : 'FORBIDDEN')
			return failure('FORBIDDEN', `${resourceType} management read is not allowed`, actor, { access, reason })
		}
		const data = {
			resourceType,
			[idField]: id,
			record: projectRecord(record, resourceType, access),
			access: {
				mode: access,
				canRead: true,
				canEdit: result.capabilities[editCapability] === true,
			},
			capabilities: result.capabilities,
			reasons: result.reasons,
			...(parentReadError ? { diagnostics: [{ code: 'YARD_CONTEXT_READ_FAILED' }] } : {}),
		}
		return freezeDeep({
			success: true,
			source: 'reader',
			data,
			error: null,
			actor,
			readOnly: true,
			canWrite: false,
		})
	} catch (error) {
		return failure(errorCode(error, 'MANAGEMENT_ADAPTER_FAILED'), safeText(error && error.message) || 'management read failed')
	}
}

/** Read one profile using its explicit persisted userId. */
export function readProfile(userId, options = {}) {
	return readResource('profile', userId, options)
}

/** Read one yard using its explicit persisted yardId. */
export function readYard(yardId, options = {}) {
	return readResource('yard', yardId, options)
}

/** Read one animal using its explicit persisted animalId. */
export function readAnimal(animalId, options = {}) {
	return readResource('animal', animalId, options)
}

export const readProfileById = readProfile
export const readYardById = readYard
export const readAnimalById = readAnimal

/** Generic resource entry point; callers must name the domain explicitly. */
export function readManagementResource(resourceType, id, options = {}) {
	if (resourceType === 'profile') return readProfile(id, options)
	if (resourceType === 'yard') return readYard(id, options)
	if (resourceType === 'animal') return readAnimal(id, options)
	return failure('INVALID_RESOURCE_TYPE', 'management resourceType is not supported')
}

/** Generic object-shaped entry point for callers that already carry a route. */
export function readManagement(options = {}) {
	if (!isPlainRecord(options)) return failure('INVALID_OPTIONS', 'management adapter options must be a plain object')
	let resourceType
	try {
		if (options.resourceType !== undefined && options.resource !== undefined && options.resourceType !== options.resource) {
			fail('RESOURCE_TYPE_CONFLICT', 'resource and resourceType locators disagree')
		}
		resourceType = normalizeResource(options.resourceType === undefined ? options.resource : options.resourceType)
		const idField = RESOURCE_ID_FIELDS[resourceType]
		return readResource(resourceType, options[idField], options)
	} catch (error) {
		return failure(errorCode(error, 'MANAGEMENT_ADAPTER_FAILED'), safeText(error && error.message) || 'management read failed')
	}
}

export const readProfilePublic = (userId, options = {}) => readProfile(userId, { ...options, access: 'public' })
export const readProfilePrivate = (userId, options = {}) => readProfile(userId, { ...options, access: 'private' })
export const readYardPublic = (yardId, options = {}) => readYard(yardId, { ...options, access: 'public' })
export const readYardManagement = (yardId, options = {}) => readYard(yardId, { ...options, access: 'management' })
export const readAnimalPublic = (animalId, options = {}) => readAnimal(animalId, { ...options, access: 'public' })
export const readAnimalManagement = (animalId, options = {}) => readAnimal(animalId, { ...options, access: 'management' })

/**
 * Explicit reader seam for tests and future transport adapters.  The reader
 * still receives only its validated ID and all actor/visibility checks run
 * through the canonical management contract.
 */
export function readManagementResourceWithReader(resourceType, id, options = {}) {
	if (!isPlainRecord(options)) return failure('INVALID_OPTIONS', 'management adapter options must be a plain object')
	if (typeof options.reader !== 'function') return failure('READER_REQUIRED', 'management reader is unavailable')
	return readResource(resourceType, id, options, {}, true)
}

export const readManagementWithReader = readManagementResourceWithReader
export const readManagementByResource = readManagementResource
export const readManagementById = readManagementResource

/**
 * Create a stable read-only adapter.  `policy`, `readers`, and
 * `actorProvider` are fixed at construction; a page cannot replace them with
 * query or role values.  Calling `read` re-reads the actor and record each
 * time, so a session switch cannot retain stale management authority.
 */
export function createManagementAdapter({ actorProvider, policy, readers = {} } = {}) {
	let fixedReaders
	try {
		fixedReaders = readersOf({ readers }, readers)
	} catch (error) {
		// Keep construction non-throwing for a missing/incomplete storage seam;
		// malformed reader configuration is reported by each read.
		fixedReaders = null
	}
	const fixed = Object.freeze({ actorProvider, policy, readers: fixedReaders || Object.freeze({}) })
	const read = (resourceType, id, options = {}) => readResource(resourceType, id, options, fixed)
	return Object.freeze({
		read,
		readManagement: (options = {}) => {
			if (!isPlainRecord(options)) return failure('INVALID_OPTIONS', 'management adapter options must be a plain object')
			const resourceType = options.resourceType || options.resource
			const idField = RESOURCE_ID_FIELDS[resourceType]
			return idField ? read(resourceType, options[idField], options) : failure('INVALID_RESOURCE_TYPE', 'management resourceType is not supported')
		},
		readProfile: (id, options = {}) => read('profile', id, options),
		readYard: (id, options = {}) => read('yard', id, options),
		readAnimal: (id, options = {}) => read('animal', id, options),
		readProfileById: (id, options = {}) => read('profile', id, options),
		readYardById: (id, options = {}) => read('yard', id, options),
		readAnimalById: (id, options = {}) => read('animal', id, options),
		readResource: read,
		canWrite: () => false,
	})
}

export const createAccountManagementAdapter = createManagementAdapter

export {
	ACCESS_MODES,
	RESOURCE_TYPES,
	ManagementAdapterError,
}
