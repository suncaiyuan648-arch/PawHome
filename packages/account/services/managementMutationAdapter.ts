/**
 * Capability-gated editor seam for profile, yard and animal records.
 *
 * The repository does not have a production management writer yet. This
 * adapter makes that boundary explicit: every call performs a fresh trusted
 * actor read and a fresh management read, validates a small field allowlist,
 * and returns WRITER_MISSING until the domain injects its acknowledged writer.
 * It never accepts role/managed/state/query values as authority and never
 * changes ownership, IDs, status or relations through an editor patch.
 */

import {
	readManagementResourceWithReader,
	type ManagementActor,
	type ManagementActorProvider,
	type ManagementPolicyInput,
	type ManagementReaderFor,
	type ManagementReaderMap,
	type ManagementReaderOptions,
	type ManagementResourceType,
} from './managementAdapter.ts'

type JsonRecord = Record<string, unknown>
type ResourceType = ManagementResourceType

export interface ProfileManagementPatch {
	name?: string
	nickname?: string
	avatar?: string
	bio?: string
	tags?: readonly string[]
}

export interface YardManagementPatch {
	name?: string
	avatar?: string
	description?: string
	intro?: string
	location?: string
	district?: string
	tags?: readonly string[]
	gallery?: readonly string[]
}

export interface AnimalManagementPatch {
	name?: string
	avatar?: string
	breed?: string
	tags?: readonly string[]
	description?: string
	desc?: string
}

export interface ManagementPatchByResource {
	profile: ProfileManagementPatch
	yard: YardManagementPatch
	animal: AnimalManagementPatch
}

export interface ManagementMutationContext<R extends ResourceType = ResourceType> {
	resourceType: R
	id: string
	actor: ManagementActor | null
	current: Readonly<Record<string, unknown>>
	patch: Readonly<ManagementPatchByResource[R]>
	next: Readonly<Record<string, unknown>>
}

export type ManagementWriterResult = void | boolean | Readonly<Record<string, unknown>> | null

export type ManagementMutationWriter<R extends ResourceType = ResourceType> = (
	context: Readonly<ManagementMutationContext<R>>,
) => ManagementWriterResult

export interface ManagementMutationOptions<R extends ResourceType = ResourceType> {
	actorProvider?: ManagementActorProvider
	reader?: ManagementReaderFor<R>
	readers?: ManagementReaderMap
	policy?: ManagementPolicyInput | null
	writer?: ManagementMutationWriter<R>
	intent?: 'edit' | 'cancel'
	cancelled?: boolean
	yardReader?: ManagementReaderFor<'yard'>
}

export interface ErrorInfo {
  code: string
  message: string
}

export interface MutationData extends JsonRecord {
  resourceType?: ResourceType
  record?: Readonly<Record<string, unknown>>
}

export interface MutationResult {
  success: boolean
  data: MutationData | null
  error: ErrorInfo | null
  actor: JsonRecord | null
  readOnly: boolean
  canWrite: boolean
  wrote?: boolean
  cancelled?: boolean
}

interface RuntimeMutationOptions {
  actorProvider?: unknown
  reader?: unknown
  readers?: unknown
  policy?: unknown
  writer?: unknown
  intent?: unknown
  cancelled?: unknown
  yardReader?: unknown
}

type Callable = (...args: unknown[]) => unknown

const RESOURCE_TYPES: readonly ResourceType[] = Object.freeze(['profile', 'yard', 'animal'])
const ID_FIELD: Readonly<Record<ResourceType, string>> = Object.freeze({
  profile: 'userId',
  yard: 'yardId',
  animal: 'animalId',
})
const EDITABLE_FIELDS: Readonly<Record<ResourceType, readonly string[]>> = Object.freeze({
  profile: Object.freeze(['name', 'nickname', 'avatar', 'bio', 'tags']),
  yard: Object.freeze(['name', 'avatar', 'description', 'intro', 'location', 'district', 'tags', 'gallery']),
  animal: Object.freeze(['name', 'avatar', 'breed', 'tags', 'description', 'desc']),
})
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

class ManagementMutationError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ManagementMutationError'
    this.code = code
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isResourceType(value: unknown): value is ResourceType {
  return value === 'profile' || value === 'yard' || value === 'animal'
}

function isCallable(value: unknown): value is Callable {
  return typeof value === 'function'
}

function freeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value !== null && typeof value === 'object' && !seen.has(value)) {
    seen.add(value)
    for (const key of Reflect.ownKeys(value)) freeze(Reflect.get(value, key), seen)
    Object.freeze(value)
  }
  return value
}

function result(
  success: boolean,
  data: MutationData | null,
  error: ErrorInfo | null,
  extra: Partial<Pick<MutationResult, 'actor' | 'readOnly' | 'canWrite' | 'wrote' | 'cancelled'>> = {},
): MutationResult {
  const { actor = null, readOnly = true, canWrite = false, ...flags } = extra
  return freeze({
    success,
    data: data || null,
    error: error || null,
    actor,
    readOnly,
    canWrite,
    ...flags,
  })
}

function errorCode(error: unknown, fallback: string): string {
  return isRecord(error) && typeof error.code === 'string' && error.code ? error.code : fallback
}

function errorMessage(error: unknown, fallback: string): string {
  return isRecord(error) && typeof error.message === 'string' && error.message ? error.message : fallback
}

function fail(codeValue: string, message: string, actor: JsonRecord | null = null, data: MutationData | null = null): MutationResult {
  return result(false, data, { code: codeValue, message }, {
    actor,
    readOnly: true,
    canWrite: false,
  })
}

function safePatch(resourceType: ResourceType, patch: unknown): JsonRecord {
  if (!isRecord(patch)) throw new ManagementMutationError('INVALID_PATCH', 'editor patch must be a plain object')
  const allowed = new Set(EDITABLE_FIELDS[resourceType])
  const output: JsonRecord = {}
  for (const key of Object.keys(patch)) {
    if (DANGEROUS_KEYS.has(key)) {
      throw new ManagementMutationError('PROTOTYPE_KEY', 'editor patch contains a prototype key')
    }
    if (!allowed.has(key)) {
      throw new ManagementMutationError('FIELD_NOT_EDITABLE', 'field ' + key + ' is not editable')
    }
    const value = patch[key]
    if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') {
      throw new ManagementMutationError('INVALID_PATCH_VALUE', 'field ' + key + ' has an unsupported value')
    }
    if (value && typeof value === 'object') {
      const json = JSON.stringify(value)
      if (json === undefined) {
        throw new ManagementMutationError('INVALID_PATCH_VALUE', 'field ' + key + ' is not serializable')
      }
      const parsed: unknown = JSON.parse(json)
      output[key] = parsed
    } else {
      output[key] = value
    }
  }
  if (!Object.keys(output).length) throw new ManagementMutationError('EMPTY_PATCH', 'editor patch is empty')
  return output
}

function isThenable(value: unknown): boolean {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) return false
  return typeof Reflect.get(value, 'then') === 'function'
}

function writerResult(value: unknown): Readonly<Record<string, unknown>> | null {
  if (isThenable(value)) throw new ManagementMutationError('ASYNC_WRITER_UNSUPPORTED', 'management writer must return synchronously')
  if (value === false || (isRecord(value) && value.success === false)) {
    const error = isRecord(value) && isRecord(value.error) ? value.error : null
    throw new ManagementMutationError(
      errorCode(error, 'WRITER_REJECTED'),
      errorMessage(error, 'management writer rejected the update'),
    )
  }
  if (value === undefined || value === null || value === true) return null
  if (isRecord(value)) return value
  throw new ManagementMutationError('INVALID_WRITER_RESULT', 'management writer returned an unsupported acknowledgement')
}

function actorFromResult(value: JsonRecord): JsonRecord | null {
  return isRecord(value.actor) ? value.actor : null
}

/**
 * Update one management record after a fresh capability check.
 *
 * Required options: actorProvider, reader. The writer is intentionally
 * explicit; omitting it is a deterministic production-safe fail-closed path.
 */
export function updateManagementResource<R extends ResourceType>(
	resourceType: R,
	id: string,
	patch: ManagementPatchByResource[NoInfer<R>],
	options?: ManagementMutationOptions<NoInfer<R>>,
): MutationResult
export function updateManagementResource(
	resourceType: unknown,
	id: unknown,
	patch: unknown,
	options: RuntimeMutationOptions = {},
): MutationResult {
  if (!isResourceType(resourceType)) return fail('INVALID_RESOURCE_TYPE', 'management resourceType is not supported')
  let normalizedPatch: JsonRecord
  try {
    normalizedPatch = safePatch(resourceType, patch)
  } catch (error) {
    return fail(errorCode(error, 'INVALID_PATCH'), errorMessage(error, 'management patch is invalid'))
  }
	const source: RuntimeMutationOptions = isRecord(options) ? options : {}
  if (source.cancelled === true || source.intent === 'cancel') {
    return result(true, null, null, { actor: null, cancelled: true, readOnly: true, canWrite: false })
  }
  if (source.intent !== undefined && source.intent !== 'edit') {
    return fail('INVALID_INTENT', 'management mutation requires intent=edit')
  }
  if (!isCallable(source.reader)) return fail('READER_REQUIRED', 'management reader is unavailable')
  if (!isCallable(source.writer)) return fail('WRITER_MISSING', 'management writer is unavailable')

  let current: unknown
	try {
		current = readManagementResourceWithReader(resourceType, id as string, {
			actorProvider: source.actorProvider as ManagementActorProvider | undefined,
			reader: source.reader as ManagementReaderFor<ResourceType>,
			readers: (source.readers || (isCallable(source.yardReader) ? { yard: source.yardReader as ManagementReaderFor<'yard'> } : undefined)) as ManagementReaderMap | undefined,
			policy: source.policy as ManagementPolicyInput | undefined,
			access: 'management',
		} satisfies ManagementReaderOptions)
  } catch (error) {
    return fail(errorCode(error, 'MANAGEMENT_READ_FAILED'), errorMessage(error, 'management record could not be read'))
  }
  if (!isRecord(current)) return fail('FORBIDDEN', 'management edit is not allowed')
  const currentData = isRecord(current.data) ? current.data : null
  const currentAccess = currentData && isRecord(currentData.access) ? currentData.access : null
  if (current.success !== true || !currentData || !currentAccess || currentAccess.canEdit !== true) {
    return fail(
      isRecord(current.error) ? errorCode(current.error, 'FORBIDDEN') : 'FORBIDDEN',
      'management edit is not allowed',
      actorFromResult(current),
    )
  }
  const actor = actorFromResult(current)
  const idField = ID_FIELD[resourceType]
	const existing: JsonRecord = currentData && isRecord(currentData.record) ? currentData.record : {}
  const next: JsonRecord = { ...existing, ...normalizedPatch, [idField]: existing[idField] || id }
  // Never allow an editor writer to change the authoritative identity or
  // relation fields even when the injected writer inspects next directly.
  if (next[idField] !== existing[idField]) {
    return fail('IDENTITY_MUTATION_FORBIDDEN', 'management editor cannot change record identity', actor)
  }
  const context = freeze({
    resourceType,
    id: existing[idField],
    actor,
    current: freeze({ ...existing }),
    patch: freeze({ ...normalizedPatch }),
    next: freeze({ ...next }),
  })
	let acknowledged: Readonly<Record<string, unknown>> | null
  try {
    acknowledged = writerResult(source.writer(context))
  } catch (error) {
    return fail(errorCode(error, 'WRITER_FAILED'), errorMessage(error, 'management write failed'), actor)
  }
  return result(
    true,
    { resourceType, [idField]: existing[idField], record: acknowledged || next },
    null,
    {
      actor,
      readOnly: false,
      canWrite: true,
      wrote: true,
    },
  )
}

export const updateProfile = (id: string, patch: ProfileManagementPatch, options: ManagementMutationOptions<'profile'> = {}): MutationResult =>
	updateManagementResource('profile', id, patch, options)

export const updateYard = (id: string, patch: YardManagementPatch, options: ManagementMutationOptions<'yard'> = {}): MutationResult =>
	updateManagementResource('yard', id, patch, options)

export const updateAnimal = (id: string, patch: AnimalManagementPatch, options: ManagementMutationOptions<'animal'> = {}): MutationResult =>
	updateManagementResource('animal', id, patch, options)

export { EDITABLE_FIELDS, RESOURCE_TYPES, ManagementMutationError }
