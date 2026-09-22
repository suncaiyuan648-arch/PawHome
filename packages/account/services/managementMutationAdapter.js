/**
 * Capability-gated editor seam for profile, yard and animal records.
 *
 * The repository does not have a production management writer yet.  This
 * adapter makes that boundary explicit: every call performs a fresh trusted
 * actor read and a fresh management read, validates a small field allowlist,
 * and returns WRITER_MISSING until the domain injects its acknowledged writer.
 * It never accepts role/managed/state/query values as authority and never
 * changes ownership, IDs, status or relations through an editor patch.
 */

import { readManagementResourceWithReader } from './managementAdapter.js'

const RESOURCE_TYPES = Object.freeze(['profile', 'yard', 'animal'])
const ID_FIELD = Object.freeze({ profile: 'userId', yard: 'yardId', animal: 'animalId' })
const EDITABLE_FIELDS = Object.freeze({
  profile: Object.freeze(['name', 'nickname', 'avatar', 'bio', 'tags']),
  yard: Object.freeze(['name', 'avatar', 'description', 'intro', 'location', 'district', 'tags', 'gallery']),
  animal: Object.freeze(['name', 'avatar', 'breed', 'tags', 'description', 'desc']),
})
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

function freeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value
  seen.add(value)
  for (const key of Reflect.ownKeys(value)) freeze(value[key], seen)
  return Object.freeze(value)
}

function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function result(success, data, error, extra = {}) {
  return freeze({ success, data: data || null, error: error || null, ...extra })
}

function code(error, fallback) {
  return error && typeof error.code === 'string' && error.code ? error.code : fallback
}

function fail(codeValue, message, actor = null, data = null) {
  return result(false, data, { code: codeValue, message }, {
    actor,
    readOnly: true,
    canWrite: false,
  })
}

function safePatch(resourceType, patch) {
  if (!record(patch)) throw Object.assign(new Error('editor patch must be a plain object'), { code: 'INVALID_PATCH' })
  const allowed = new Set(EDITABLE_FIELDS[resourceType] || [])
  const output = {}
  for (const key of Object.keys(patch)) {
    if (DANGEROUS_KEYS.has(key)) throw Object.assign(new Error('editor patch contains a prototype key'), { code: 'PROTOTYPE_KEY' })
    if (!allowed.has(key)) throw Object.assign(new Error(`field ${key} is not editable`), { code: 'FIELD_NOT_EDITABLE' })
    const value = patch[key]
    if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') {
      throw Object.assign(new Error(`field ${key} has an unsupported value`), { code: 'INVALID_PATCH_VALUE' })
    }
    if (value && typeof value === 'object') {
      // Keep nested form values data-only and reject prototype-bearing values.
      const json = JSON.stringify(value)
      if (json === undefined) throw Object.assign(new Error(`field ${key} is not serializable`), { code: 'INVALID_PATCH_VALUE' })
      output[key] = JSON.parse(json)
    } else output[key] = value
  }
  if (!Object.keys(output).length) throw Object.assign(new Error('editor patch is empty'), { code: 'EMPTY_PATCH' })
  return output
}

function writerResult(value) {
  if (value && typeof value.then === 'function') throw Object.assign(new Error('management writer must return synchronously'), { code: 'ASYNC_WRITER_UNSUPPORTED' })
  if (value === false || (record(value) && value.success === false)) {
    const error = record(value) && record(value.error) ? value.error : null
    throw Object.assign(new Error(error && error.message || 'management writer rejected the update'), { code: code(error, 'WRITER_REJECTED') })
  }
  return value === undefined ? null : value
}

/**
 * Update one management record after a fresh capability check.
 *
 * Required options: actorProvider, reader. `writer` is intentionally
 * explicit; omitting it is a deterministic production-safe fail-closed path.
 */
export function updateManagementResource(resourceType, id, patch, options = {}) {
  if (!RESOURCE_TYPES.includes(resourceType)) return fail('INVALID_RESOURCE_TYPE', 'management resourceType is not supported')
  const source = record(options) ? options : {}
  let normalizedPatch
  try {
    normalizedPatch = safePatch(resourceType, patch)
  } catch (error) {
    return fail(code(error, 'INVALID_PATCH'), error.message || 'management patch is invalid')
  }
  if (source.cancelled === true || source.intent === 'cancel') {
    return result(true, null, null, { actor: null, cancelled: true, readOnly: true, canWrite: false })
  }
  if (source.intent !== undefined && source.intent !== 'edit') return fail('INVALID_INTENT', 'management mutation requires intent=edit')
  if (typeof source.reader !== 'function') return fail('READER_REQUIRED', 'management reader is unavailable')
  if (typeof source.writer !== 'function') return fail('WRITER_MISSING', 'management writer is unavailable')

  let current
  try {
    current = readManagementResourceWithReader(resourceType, id, {
      actorProvider: source.actorProvider,
      reader: source.reader,
      readers: source.readers || (typeof source.yardReader === 'function' ? { yard: source.yardReader } : undefined),
      policy: source.policy,
      access: 'management',
    })
  } catch (error) {
    return fail(code(error, 'MANAGEMENT_READ_FAILED'), error.message || 'management record could not be read')
  }
  if (!current || current.success !== true || !current.data || !current.data.access || current.data.access.canEdit !== true) {
    return fail(current && current.error && current.error.code || 'FORBIDDEN', 'management edit is not allowed', current && current.actor || null)
  }
  const actor = current.actor || null
  const idField = ID_FIELD[resourceType]
  const existing = record(current.data.record) ? current.data.record : {}
  const next = { ...existing, ...normalizedPatch, [idField]: existing[idField] || id }
  // Never allow an editor writer to change the authoritative identity or
  // relation fields even when the injected writer inspects `next` directly.
  if (next[idField] !== existing[idField]) return fail('IDENTITY_MUTATION_FORBIDDEN', 'management editor cannot change record identity', actor)
  const context = freeze({ resourceType, id: existing[idField], actor, current: freeze({ ...existing }), patch: freeze({ ...normalizedPatch }), next: freeze({ ...next }) })
  let acknowledged
  try {
    acknowledged = writerResult(source.writer(context))
  } catch (error) {
    return fail(code(error, 'WRITER_FAILED'), error.message || 'management write failed', actor)
  }
  return result(true, { resourceType, [idField]: existing[idField], record: acknowledged || next }, null, {
    actor,
    readOnly: false,
    canWrite: true,
    wrote: true,
  })
}

export const updateProfile = (id, patch, options = {}) => updateManagementResource('profile', id, patch, options)
export const updateYard = (id, patch, options = {}) => updateManagementResource('yard', id, patch, options)
export const updateAnimal = (id, patch, options = {}) => updateManagementResource('animal', id, patch, options)

export { EDITABLE_FIELDS, RESOURCE_TYPES }
