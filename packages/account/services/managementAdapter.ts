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

import { resolveTrustedActor, type ActorRole } from '../../../navigation/actorCapabilities.ts'
import {
	MANAGEMENT_CAPABILITIES,
	evaluateManagementCapabilities,
} from '../../../navigation/managementContracts.ts'

type JsonRecord = Record<string, unknown>
export type ManagementResourceType = 'profile' | 'yard' | 'animal'
export type ManagementAccessMode = 'public' | 'private' | 'management'
type ResourceType = ManagementResourceType
type AccessMode = ManagementAccessMode
type ManagementCapability = typeof MANAGEMENT_CAPABILITIES[keyof typeof MANAGEMENT_CAPABILITIES]
export interface ManagementActor {
	id: string
	roles: readonly ActorRole[]
}

export type ManagementActorIdentity = Readonly<(
	| { id: string; actorId?: string }
	| { actorId: string; id?: string }
) & {
	roles?: readonly ActorRole[]
	role?: ActorRole | readonly ActorRole[] | null
}>

export type ManagementActorSession = ManagementActorIdentity | Readonly<{ actor: ManagementActorIdentity | null }>
export type ManagementActorProvider = () => ManagementActorSession | null | undefined

export interface ManagementStatePolicyInput {
	readStates?: readonly string[] | null
	readableStates?: readonly string[] | null
	manageStates?: readonly string[] | null
	manageableStates?: readonly string[] | null
	managementStates?: readonly string[] | null
	editStates?: readonly string[] | null
	editableStates?: readonly string[] | null
}

export type ManagementProfilePolicyInput = ManagementStatePolicyInput
export interface ManagementYardPolicyInput extends ManagementStatePolicyInput {
	ownerRoles?: readonly ActorRole[]
	yardOwnerRoles?: readonly ActorRole[]
}
export interface ManagementAnimalPolicyInput extends ManagementStatePolicyInput {
	yardOwnerRoles?: readonly ActorRole[]
	managerRoles?: readonly ActorRole[]
}

export interface ManagementPolicyInput {
	profile?: ManagementProfilePolicyInput | null
	yard?: ManagementYardPolicyInput | null
	animal?: ManagementAnimalPolicyInput | null
}

export interface ManagementQuery {
	userId?: string
	yardId?: string
	animalId?: string
	role?: ActorRole
	managed?: boolean
	state?: string
}

export interface ManagementReaderLocatorByResource {
	profile: Readonly<{ userId: string }>
	yard: Readonly<{ yardId: string }>
	animal: Readonly<{ animalId: string }>
}

export type ManagementReaderFor<R extends ManagementResourceType> = (
	locator: ManagementReaderLocatorByResource[R],
) => unknown

export interface ManagementReaderMap {
	profile?: ManagementReaderFor<'profile'>
	yard?: ManagementReaderFor<'yard'>
	animal?: ManagementReaderFor<'animal'>
}

export interface ManagementReadOptions {
	actorProvider?: ManagementActorProvider
	policy?: ManagementPolicyInput | null
	readers?: ManagementReaderMap
	access?: ManagementAccessMode
	mode?: ManagementAccessMode | 'edit'
	intent?: 'cancel' | 'read' | 'edit'
	cancelled?: boolean
	query?: ManagementQuery
	userId?: string
	yardId?: string
	animalId?: string
	includeDemo?: false
}

export interface ManagementReaderOptions<R extends ManagementResourceType = ManagementResourceType>
	extends ManagementReadOptions {
	reader: ManagementReaderFor<R>
}

export interface ManagementAdapterOptions {
	actorProvider?: ManagementActorProvider
	policy?: ManagementPolicyInput | null
	readers?: ManagementReaderMap
}

export type ManagementReadRecord = JsonRecord

interface ManagementReadDataFields extends JsonRecord {
	record: ManagementReadRecord
	access: {
		mode: ManagementAccessMode
		canRead: true
		canEdit: boolean
	}
	capabilities: Readonly<Record<string, boolean>>
	reasons: Readonly<Record<string, string>>
	diagnostics?: readonly { code: string }[]
}

export type ManagementReadData = ManagementReadDataFields & (
	| { resourceType: 'profile'; userId: string }
	| { resourceType: 'yard'; yardId: string }
	| { resourceType: 'animal'; animalId: string }
)

export interface ManagementError extends JsonRecord {
	code: string
	message: string
}

export interface ManagementResult {
	success: boolean
	source: 'reader'
	data: ManagementReadData | null
	error: ManagementError | null
	actor: ManagementActor | null
	readOnly: true
	canWrite: false
	cancelled?: boolean
}

export type ManagementRouteOptions = ManagementReadOptions & (
	| { resourceType: 'profile'; resource?: 'profile'; userId: string; yardId?: never; animalId?: never }
	| { resourceType: 'yard'; resource?: 'yard'; yardId: string; userId?: never; animalId?: never }
	| { resourceType: 'animal'; resource?: 'animal'; animalId: string; userId?: never; yardId?: never }
	| { resource: 'profile'; resourceType?: 'profile'; userId: string; yardId?: never; animalId?: never }
	| { resource: 'yard'; resourceType?: 'yard'; yardId: string; userId?: never; animalId?: never }
	| { resource: 'animal'; resourceType?: 'animal'; animalId: string; userId?: never; yardId?: never }
)

export interface ManagementAdapter {
	read(resourceType: ManagementResourceType, id: string, options?: ManagementReadOptions): ManagementResult
	readManagement(options: ManagementRouteOptions): ManagementResult
	readProfile(id: string, options?: ManagementReadOptions): ManagementResult
	readYard(id: string, options?: ManagementReadOptions): ManagementResult
	readAnimal(id: string, options?: ManagementReadOptions): ManagementResult
	readProfileById(id: string, options?: ManagementReadOptions): ManagementResult
	readYardById(id: string, options?: ManagementReadOptions): ManagementResult
	readAnimalById(id: string, options?: ManagementReadOptions): ManagementResult
	readResource(resourceType: ManagementResourceType, id: string, options?: ManagementReadOptions): ManagementResult
	canWrite(): false
}

type Actor = NonNullable<ReturnType<typeof resolveTrustedActor>>
type Reader = (locator: JsonRecord) => unknown
type ReaderMap = Partial<Record<ResourceType, Reader>>

interface FixedOptions {
	actorProvider?: unknown
	policy?: unknown
	readers?: ReaderMap
}

interface CapabilityEvaluation {
	error: unknown
	capabilities: Readonly<Record<string, boolean>>
	reasons: Readonly<Record<string, string>>
}

const RESOURCE_TYPES: readonly ResourceType[] = Object.freeze(['profile', 'yard', 'animal'])
const ACCESS_MODES: readonly AccessMode[] = Object.freeze(['public', 'private', 'management'])
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const DEMO_ID = /^demo(?:[-_:]|$)/i
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

const RESOURCE_ID_FIELDS: Readonly<Record<ResourceType, string>> = Object.freeze({
	profile: 'userId',
	yard: 'yardId',
	animal: 'animalId',
})

// A resource may use its own namespaced IDs (`yard-*`, `animal-*`, and so on),
// but a route from another domain must fail before a reader is called.  Numeric
// IDs remain valid for the legacy yard records.
const CROSS_DOMAIN_PREFIXES: Readonly<Record<ResourceType, readonly string[]>> = Object.freeze({
	profile: Object.freeze(['yard', 'animal', 'pet', 'rescue', 'feeding', 'order', 'dynamic', 'application', 'adoption', 'review', 'task']),
	yard: Object.freeze(['user', 'profile', 'animal', 'pet', 'rescue', 'feeding', 'order', 'dynamic', 'application', 'adoption', 'review', 'task']),
	animal: Object.freeze(['user', 'profile', 'yard', 'rescue', 'feeding', 'order', 'dynamic', 'application', 'adoption', 'review', 'task']),
})

const CAPABILITY_FOR: Readonly<Record<ResourceType, Readonly<Record<AccessMode, ManagementCapability>>>> = Object.freeze({
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

const EDIT_CAPABILITY_FOR: Readonly<Record<ResourceType, ManagementCapability>> = Object.freeze({
	profile: MANAGEMENT_CAPABILITIES.PROFILE_EDIT,
	yard: MANAGEMENT_CAPABILITIES.YARD_EDIT,
	animal: MANAGEMENT_CAPABILITIES.ANIMAL_EDIT,
})

// Public projections intentionally contain only display data.  An authorized
// private/management read receives a defensive copy of the complete safe
// persisted record, while a public read never forwards private fields such as
// phone/contact/notes by accident.
const PUBLIC_FIELDS: Readonly<Record<ResourceType, readonly string[]>> = Object.freeze({
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
	readonly code: string
	readonly details: JsonRecord

	constructor(code: string, message: string, details: JsonRecord = {}) {
		super(message)
		this.name = 'ManagementAdapterError'
		this.code = code
		this.details = details
	}
}

function fail(code: string, message: string, details: JsonRecord = {}): never {
	throw new ManagementAdapterError(code, message, details)
}

function own(value: object, key: string): boolean {
	return Object.prototype.hasOwnProperty.call(value, key)
}

function isPlainRecord(value: unknown): value is JsonRecord {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
	const prototype = Object.getPrototypeOf(value)
	if (prototype === Object.prototype || prototype === null) return true
	const descriptor = Object.getOwnPropertyDescriptor(prototype, 'constructor')
	return Object.getPrototypeOf(prototype) === null
		&& Object.prototype.toString.call(value) === '[object Object]'
		&& descriptor !== undefined
		&& typeof descriptor.value === 'function'
		&& descriptor.value.name === 'Object'
}

function rejectDangerousKeys(value: unknown, label: string, seen = new WeakSet<object>()): void {
	if (value === null || typeof value !== 'object') return
	if (seen.has(value)) return
	seen.add(value)
	for (const key of Reflect.ownKeys(value)) {
		if (typeof key === 'symbol' || DANGEROUS_KEYS.has(key)) {
			fail('PROTOTYPE_KEY', `${label} contains a forbidden key`, { key: String(key) })
		}
		const child = Reflect.get(value, key)
		if (child && typeof child === 'object') rejectDangerousKeys(child, `${label}.${key}`, seen)
	}
}

function assertPlainRecord(value: unknown, label: string): asserts value is JsonRecord {
	if (!isPlainRecord(value)) fail('INVALID_RECORD', `${label} must be a plain object`, { label })
	rejectDangerousKeys(value, label)
}

function isThenable(value: unknown): value is object {
	return value !== null
		&& (typeof value === 'object' || typeof value === 'function')
		&& typeof Reflect.get(value, 'then') === 'function'
}

function errorCode(error: unknown, fallback: string): string {
	if (error === null || (typeof error !== 'object' && typeof error !== 'function')) return fallback
	const code = Reflect.get(error, 'code')
	return typeof code === 'string' && code ? code : fallback
}

function errorMessage(error: unknown): string {
	if (error === null || (typeof error !== 'object' && typeof error !== 'function')) return ''
	const message = Reflect.get(error, 'message')
	return typeof message === 'string' ? message : ''
}

function isResourceType(value: unknown): value is ResourceType {
	return value === 'profile' || value === 'yard' || value === 'animal'
}

function normalizeResource(value: unknown): ResourceType {
	if (!isResourceType(value)) {
		fail('INVALID_RESOURCE_TYPE', 'management resourceType is not supported')
	}
	return value
}

function normalizeId(value: unknown, label: string, resource: ResourceType, { required = true }: { required?: boolean } = {}): string {
	let id: string
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

function normalizeQuery(query: unknown): JsonRecord | undefined {
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
	const result: JsonRecord = {}
	for (const key of ['userId', 'yardId', 'animalId']) {
		if (own(query, key)) result[key] = query[key]
	}
	// The contract validates the hint values and deliberately ignores managed,
	// role, and state for authorization.  Preserve only the locator IDs here so
	// an adapter cannot accidentally turn a display hint into an authority.
	return result
}

function normalizeAccess(options: JsonRecord): AccessMode {
	const raw = options.access === undefined ? options.mode : options.access
	const value = raw === undefined || raw === null || raw === '' ? 'public' : raw
	if (value === 'edit') return 'management'
	if (!isAccessMode(value)) {
		fail('INVALID_ACCESS', 'management access mode is not supported')
	}
	return value
}

function isAccessMode(value: unknown): value is AccessMode {
	return value === 'public' || value === 'private' || value === 'management'
}

function normalizeOptions(options: unknown): JsonRecord {
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

function isReader(value: unknown): value is Reader {
	return typeof value === 'function'
}

function readersOf(options: JsonRecord, fixed: unknown): ReaderMap {
	const readers: unknown = fixed || options.readers || {}
	assertPlainRecord(readers, 'management readers')
	const normalized: ReaderMap = {}
	for (const key of Object.keys(readers)) {
		if (!isResourceType(key)) fail('UNKNOWN_READER_DOMAIN', `Unknown management reader domain: ${key}`, { key })
		if (!isReader(readers[key])) fail('INVALID_READER', `${key} management reader must be a function`)
		normalized[key] = readers[key] as Reader
	}
	return normalized
}

function actorSnapshot(actorProvider: unknown): { actor: Actor | null; error: unknown | null } {
	try {
		return { actor: resolveTrustedActor(actorProvider), error: null }
	} catch (error) {
		return { actor: null, error }
	}
}

function freezeDeep<T>(value: T, seen = new WeakSet<object>()): T {
	if (value === null || typeof value !== 'object' || seen.has(value)) return value
	seen.add(value)
	for (const key of Reflect.ownKeys(value)) freezeDeep(Reflect.get(value, key), seen)
	return Object.freeze(value)
}

function failure(code: string, message: string, actor: Actor | null = null, details: JsonRecord = {}): ManagementResult {
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

function emptyForMissingReader(resourceType: ResourceType, actor: Actor | null, access: AccessMode): ManagementResult {
	return failure('READER_MISSING', `${resourceType} management reader is unavailable`, actor, { access })
}

function readRecord(reader: Reader, resourceType: ResourceType, id: string): JsonRecord | null {
	const field = RESOURCE_ID_FIELDS[resourceType]
	let result: unknown
	try {
		result = reader(Object.freeze({ [field]: id }))
	} catch (error) {
		throw new ManagementAdapterError(errorCode(error, 'READER_FAILED'), `${resourceType} management reader failed`)
	}
	if (isThenable(result)) {
		// A rejected promise must be observed before returning, otherwise a bad
		// async reader creates an unhandled rejection outside the adapter.
		const catchMethod = Reflect.get(result, 'catch')
		if (typeof catchMethod === 'function') Reflect.apply(catchMethod, result, [() => {}])
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

function identityOf(record: JsonRecord, resourceType: ResourceType): string {
	const field = RESOURCE_ID_FIELDS[resourceType]
	const id = normalizeId(record[field], `${resourceType}.${field}`, resourceType)
	return id
}

function assertRecordIdentity(record: JsonRecord, resourceType: ResourceType, requestedId: string): void {
	const actualId = identityOf(record, resourceType)
	if (actualId !== requestedId) fail('READER_SCOPE_VIOLATION', `${resourceType} reader returned a different record`)
	if (resourceType === 'animal') {
		const yardId = normalizeId(record.yardId, 'animal.yardId', 'yard')
		if (!yardId) fail('MISSING_ID', 'animal.yardId is required')
	}
}

function cloneSafe(value: unknown, seen = new WeakMap<object, true>()): unknown {
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
	const output: JsonRecord = {}
	for (const key of Object.keys(value)) output[key] = cloneSafe(value[key], seen)
	return output
}

function publicProjection(record: JsonRecord, resourceType: ResourceType): JsonRecord {
	const result: JsonRecord = {}
	for (const field of PUBLIC_FIELDS[resourceType]) {
		if (own(record, field)) result[field] = cloneSafe(record[field])
	}
	return result
}

function projectRecord(record: JsonRecord, resourceType: ResourceType, access: AccessMode): JsonRecord {
	if (access === 'public') return publicProjection(record, resourceType)
	const cloned = cloneSafe(record)
	if (!isPlainRecord(cloned)) fail('INVALID_RECORD', 'management record projection is invalid')
	return cloned
}

function locatorFor(resourceType: ResourceType, id: string, options: JsonRecord): JsonRecord {
	const locator: JsonRecord = {}
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

function evaluate(
	resourceType: ResourceType,
	record: JsonRecord,
	yard: JsonRecord | null,
	actor: Actor | null,
	policy: unknown,
	locator: JsonRecord,
	cancelled: boolean,
): CapabilityEvaluation {
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

function readResource(
	resourceType: unknown,
	idValue: unknown,
	rawOptions: unknown,
	fixed: FixedOptions = {},
	allowReaderOverride = false,
): ManagementResult {
	let options: JsonRecord
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
			const resource = normalizeResource(resourceType)
			const idField = RESOURCE_ID_FIELDS[resource]
			const id = normalizeId(idValue, idField, resource)
			const access = normalizeAccess(options)
			const locator = locatorFor(resource, id, options)
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
			const reader: unknown = allowReaderOverride && options.reader ? options.reader : readers[resource]
			if (!isReader(reader)) return emptyForMissingReader(resource, actor, access)

			const record = readRecord(reader, resource, id)
			if (!record) return failure('NOT_FOUND', `${resource} management record was not found`, actor, { access })
			assertRecordIdentity(record, resource, id)
			if (resource === 'animal' && own(locator, 'yardId')) {
			const actualYardId = normalizeId(record.yardId, 'animal.yardId', 'yard')
			if (locator.yardId !== actualYardId) fail('CROSS_YARD_RELATION', 'animal.yardId does not match yardId locator')
		}

		// An animal manager/yard owner needs the current parent-yard context.  It
		// is read by the yard reader using the animal's persisted yardId, never a
		// query supplied by the caller.  Public animal reads do not require this
		// extra read and therefore remain usable while the yard reader is absent.
		let yard: JsonRecord | null = null
		let parentReadError: unknown = null
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

		const result = evaluate(resource, record, yard, actor, fixed.policy !== undefined ? fixed.policy : options.policy, locator, false)
		if (result.error) return failure(errorCode(result.error, 'MANAGEMENT_CONTRACT_FAILED'), 'management capability evaluation failed', actor, { access })
		const readCapability = CAPABILITY_FOR[resource][access]
		const editCapability = EDIT_CAPABILITY_FOR[resource]
		const canRead = result.capabilities[readCapability] === true
		if (!canRead) {
			const reason = result.reasons[readCapability] || (parentReadError ? 'YARD_CONTEXT_READ_FAILED' : 'FORBIDDEN')
			return failure('FORBIDDEN', `${resource} management read is not allowed`, actor, { access, reason })
		}
		const dataFields: ManagementReadDataFields = {
			record: projectRecord(record, resource, access),
			access: {
				mode: access,
				canRead: true,
				canEdit: result.capabilities[editCapability] === true,
			},
			capabilities: result.capabilities,
			reasons: result.reasons,
			...(parentReadError ? { diagnostics: [{ code: 'YARD_CONTEXT_READ_FAILED' }] } : {}),
		}
		const data: ManagementReadData = resource === 'profile'
			? { resourceType: resource, userId: id, ...dataFields }
			: resource === 'yard'
				? { resourceType: resource, yardId: id, ...dataFields }
				: { resourceType: resource, animalId: id, ...dataFields }
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
		return failure(errorCode(error, 'MANAGEMENT_ADAPTER_FAILED'), errorMessage(error) || 'management read failed')
	}
}

/** Read one profile using its explicit persisted userId. */
export function readProfile(userId: string, options: ManagementReadOptions = {}): ManagementResult {
	return readResource('profile', userId, options)
}

/** Read one yard using its explicit persisted yardId. */
export function readYard(yardId: string, options: ManagementReadOptions = {}): ManagementResult {
	return readResource('yard', yardId, options)
}

/** Read one animal using its explicit persisted animalId. */
export function readAnimal(animalId: string, options: ManagementReadOptions = {}): ManagementResult {
	return readResource('animal', animalId, options)
}

export const readProfileById = readProfile
export const readYardById = readYard
export const readAnimalById = readAnimal

/** Generic resource entry point; callers must name the domain explicitly. */
export function readManagementResource(
	resourceType: ManagementResourceType,
	id: string,
	options: ManagementReadOptions = {},
): ManagementResult {
	return readResource(resourceType, id, options)
}

/** Generic object-shaped entry point for callers that already carry a route. */
export function readManagement(options: ManagementRouteOptions): ManagementResult
export function readManagement(options: unknown = {}): ManagementResult {
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
		return failure(errorCode(error, 'MANAGEMENT_ADAPTER_FAILED'), errorMessage(error) || 'management read failed')
	}
}

function withAccess(options: unknown, access: AccessMode): JsonRecord {
	const source = isPlainRecord(options) ? options : {}
	return { ...source, access }
}

export const readProfilePublic = (userId: string, options: ManagementReadOptions = {}): ManagementResult => readProfile(userId, withAccess(options, 'public'))
export const readProfilePrivate = (userId: string, options: ManagementReadOptions = {}): ManagementResult => readProfile(userId, withAccess(options, 'private'))
export const readYardPublic = (yardId: string, options: ManagementReadOptions = {}): ManagementResult => readYard(yardId, withAccess(options, 'public'))
export const readYardManagement = (yardId: string, options: ManagementReadOptions = {}): ManagementResult => readYard(yardId, withAccess(options, 'management'))
export const readAnimalPublic = (animalId: string, options: ManagementReadOptions = {}): ManagementResult => readAnimal(animalId, withAccess(options, 'public'))
export const readAnimalManagement = (animalId: string, options: ManagementReadOptions = {}): ManagementResult => readAnimal(animalId, withAccess(options, 'management'))

/**
 * Explicit reader seam for tests and future transport adapters.  The reader
 * still receives only its validated ID and all actor/visibility checks run
 * through the canonical management contract.
 */
export function readManagementResourceWithReader<R extends ManagementResourceType>(
	resourceType: R,
	id: string,
	options: ManagementReaderOptions<NoInfer<R>>,
): ManagementResult
export function readManagementResourceWithReader(
	resourceType: unknown,
	id: unknown,
	options: unknown = {},
): ManagementResult {
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
export function createManagementAdapter(options: ManagementAdapterOptions = {}): ManagementAdapter {
	const source = isPlainRecord(options) ? options : {}
	const actorProvider = source.actorProvider
	const policy = source.policy
	const readers = source.readers || {}
	let fixedReaders: ReaderMap | null
	try {
		fixedReaders = readersOf({ readers }, readers)
	} catch {
		// Keep construction non-throwing for a missing/incomplete storage seam;
		// malformed reader configuration is reported by each read.
		fixedReaders = null
	}
	const fixed = Object.freeze({ actorProvider, policy, readers: fixedReaders || Object.freeze({}) })
	const read = (resourceType: ManagementResourceType, id: string, options: ManagementReadOptions = {}): ManagementResult => readResource(resourceType, id, options, fixed)
	return Object.freeze({
		read,
		readManagement: (options: ManagementRouteOptions) => {
			if (!isPlainRecord(options)) return failure('INVALID_OPTIONS', 'management adapter options must be a plain object')
			const resourceValue = options.resourceType || options.resource
			if (!isResourceType(resourceValue)) return failure('INVALID_RESOURCE_TYPE', 'management resourceType is not supported')
			const id = resourceValue === 'profile'
				? options.userId
				: resourceValue === 'yard' ? options.yardId : options.animalId
			return read(resourceValue, id || '', options)
		},
		readProfile: (id: string, options: ManagementReadOptions = {}) => read('profile', id, options),
		readYard: (id: string, options: ManagementReadOptions = {}) => read('yard', id, options),
		readAnimal: (id: string, options: ManagementReadOptions = {}) => read('animal', id, options),
		readProfileById: (id: string, options: ManagementReadOptions = {}) => read('profile', id, options),
		readYardById: (id: string, options: ManagementReadOptions = {}) => read('yard', id, options),
		readAnimalById: (id: string, options: ManagementReadOptions = {}) => read('animal', id, options),
		readResource: read,
		canWrite: () => false,
	}) as ManagementAdapter
}

export const createAccountManagementAdapter = createManagementAdapter

export {
	ACCESS_MODES,
	RESOURCE_TYPES,
	ManagementAdapterError,
}
