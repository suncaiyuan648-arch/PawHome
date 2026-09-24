/** Local/mock yard reader and writer for the management editor. */
import { resolveTrustedActor } from '../../../navigation/actorCapabilities.ts'
import { evaluateManagementCapabilities } from '../../../navigation/managementContracts.ts'

export const YARD_STORAGE_KEY = 'PAWHOME_YARD_RECORDS'
const EDITABLE_FIELDS = Object.freeze([
  'name',
  'avatar',
  'description',
  'intro',
  'location',
  'district',
  'tags',
  'gallery',
])
const POLICY = Object.freeze({
  yard: Object.freeze({
    readStates: ['active'],
    manageStates: ['active'],
    editStates: ['active'],
    ownerRoles: ['yard_owner'],
    yardOwnerRoles: ['yard_owner'],
  }),
})
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/

type JsonRecord = Record<string, unknown>
type Actor = NonNullable<ReturnType<typeof resolveTrustedActor>>

export interface LocalManagementStorage {
  getStorageSync(key: string): unknown
  setStorageSync(key: string, value: string): void
}
type StorageLike = LocalManagementStorage

interface YardRecord extends JsonRecord {
  yardId: string
}

interface LocalAccess {
  canRead: boolean
  canEdit: boolean
}

interface LocalData {
  record?: JsonRecord
  yard?: JsonRecord
  access: LocalAccess
  capabilities?: Readonly<Record<string, boolean>>
}

interface LocalError {
  code: string
  message: string
}

export interface LocalResult {
  success: boolean
  data: LocalData | null
  error: LocalError | null
  readOnly: boolean
  canWrite: boolean
  actor?: Actor | null
  source?: string
  wrote?: boolean
}

export interface LocalManagementOptions {
  actorProvider?: () => unknown
  storage?: LocalManagementStorage
  now?: string
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

function result(
  success: boolean,
  data: LocalData | null,
  error: LocalError | null,
  extra: Partial<Pick<LocalResult, 'actor' | 'source' | 'wrote' | 'readOnly' | 'canWrite'>> = {},
): LocalResult {
  return Object.freeze({
    success,
    data: data || null,
    error: error || null,
    readOnly: !success || extra.wrote !== true,
    canWrite: extra.wrote === true,
    ...extra,
  })
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function errorCode(error: unknown, fallback: string): string {
  return isRecord(error) && typeof error.code === 'string' && error.code ? error.code : fallback
}

function storageError(code: string, message: string): Error & { code: string } {
  return Object.assign(new Error(message), { code })
}

function isStorageLike(value: unknown): value is StorageLike {
  return (
    isRecord(value) &&
    typeof value.getStorageSync === 'function' &&
    typeof value.setStorageSync === 'function'
  )
}

function storageOf(storage: unknown): StorageLike | null {
  if (isStorageLike(storage)) return storage
  if (
    typeof uni !== 'undefined' &&
    uni &&
    typeof uni.getStorageSync === 'function' &&
    typeof uni.setStorageSync === 'function'
  ) {
    return {
      getStorageSync: (key: string) => uni.getStorageSync<unknown>(key),
      setStorageSync: (key: string, value: string) => uni.setStorageSync(key, value),
    }
  }
  return null
}

function actorOf(actorProvider: unknown): { actor: Actor | null; error: LocalError | null } {
  try {
    const actor = resolveTrustedActor(actorProvider)
    return actor
      ? { actor, error: null }
      : { actor: null, error: { code: 'NO_ACTOR', message: 'trusted actor is unavailable' } }
  } catch (error) {
    return {
      actor: null,
      error: {
        code: errorCode(error, 'ACTOR_RESOLUTION_FAILED'),
        message: 'trusted actor is unavailable',
      },
    }
  }
}

function readRows(storage: unknown): unknown[] {
  const target = storageOf(storage)
  if (!target) throw storageError('STORAGE_UNAVAILABLE', 'yard storage is unavailable')
  let raw: unknown
  try {
    raw = target.getStorageSync(YARD_STORAGE_KEY)
  } catch {
    throw storageError('STORAGE_READ_FAILED', 'yard storage read failed')
  }
  if (raw === undefined || raw === null || raw === '') return []
  let rows: unknown
  try {
    rows = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    throw storageError('INVALID_STORAGE', 'yard storage is invalid')
  }
  if (!Array.isArray(rows)) throw storageError('INVALID_STORAGE', 'yard storage must be an array')
  return rows
}

function idOf(value: unknown): string {
  return typeof value === 'string' && value === value.trim() && SAFE_ID.test(value) ? value : ''
}

function copyRecord(record: JsonRecord): JsonRecord {
  const serialized = JSON.stringify(record)
  if (serialized === undefined) return { ...record }
  const copied: unknown = JSON.parse(serialized)
  return isRecord(copied) ? copied : { ...record }
}

function stringify(value: unknown): string {
  const serialized = JSON.stringify(value)
  return serialized === undefined ? 'null' : serialized
}

function failure(code: string, message: string, actor: Actor | null = null): LocalResult {
  return result(false, null, { code, message }, { actor })
}

function isPublicRecord(record: JsonRecord): boolean {
  if (record.visibility === 'private' || record.isPublic === false) return false
  const state = record.status || record.state
  return !state || state === 'active' || state === 'published'
}

/** Public read used by detail pages; query values never create or authorize a record. */
export function readPublicYard(
  yardId: string,
  { storage }: LocalManagementOptions = {},
): LocalResult {
  const id = idOf(yardId)
  if (!id) return failure('INVALID_ID', 'yardId is invalid')
  let rows: unknown[]
  try {
    rows = readRows(storage)
  } catch (error) {
    return failure(errorCode(error, 'YARD_READ_FAILED'), 'yard read failed closed')
  }
  const record = rows.find(
    (item): item is YardRecord =>
      isRecord(item) && typeof item.yardId === 'string' && item.yardId === id,
  )
  if (!record) return failure('READER_MISSING', 'yard record is unavailable')
  if (!isPublicRecord(record)) return failure('FORBIDDEN', 'yard is not public')
  return result(
    true,
    { record: copyRecord(record), access: { canRead: true, canEdit: false } },
    null,
    { source: 'local', readOnly: true, canWrite: false },
  )
}

function readAuthorized(
  id: string,
  record: JsonRecord,
  actor: Actor,
): { access: ReturnType<typeof evaluateManagementCapabilities>; error: string | null } {
  const access = evaluateManagementCapabilities({
    actorProvider: () => ({ actor }),
    yard: record,
    yardId: id,
    policy: POLICY,
  })
  if (!access.capabilities['yard.edit'])
    return { access, error: access.reasons['yard.edit'] || 'FORBIDDEN' }
  return { access, error: null }
}

export function readLocalYard(
  yardId: string,
  { actorProvider, storage }: LocalManagementOptions = {},
): LocalResult {
  const id = idOf(yardId)
  if (!id) return failure('INVALID_ID', 'yardId is invalid')
  const resolved = actorOf(actorProvider)
  if (resolved.error || !resolved.actor)
    return failure(resolved.error?.code || 'NO_ACTOR', 'trusted actor is unavailable')
  let rows: unknown[]
  try {
    rows = readRows(storage)
  } catch (error) {
    return failure(errorCode(error, 'YARD_READ_FAILED'), 'yard read failed closed', resolved.actor)
  }
  const record = rows.find(
    (item): item is YardRecord =>
      isRecord(item) && typeof item.yardId === 'string' && item.yardId === id,
  )
  if (!record) return failure('READER_MISSING', 'yard record is unavailable', resolved.actor)
  const auth = readAuthorized(id, record, resolved.actor)
  if (auth.error) return failure('FORBIDDEN', 'yard edit is not allowed', resolved.actor)
  return result(
    true,
    {
      record: copyRecord(record),
      access: { canRead: true, canEdit: true },
      capabilities: auth.access.capabilities,
    },
    null,
    { actor: resolved.actor, source: 'local', readOnly: true, canWrite: false },
  )
}

export function updateLocalYard(
  yardId: string,
  patch: YardManagementPatch,
  { actorProvider, storage, now = new Date().toISOString() }: LocalManagementOptions = {},
): LocalResult {
  if (!isRecord(patch)) return failure('INVALID_PATCH', 'yard patch is invalid')
  const keys = Object.keys(patch)
  if (!keys.length) return failure('EMPTY_PATCH', 'yard patch is empty')
  if (keys.some((key) => !EDITABLE_FIELDS.includes(key)))
    return failure('FIELD_NOT_EDITABLE', 'yard field is not editable')
  const current = readLocalYard(yardId, { actorProvider, storage })
  if (!current.success) return current
  const target = storageOf(storage)
  let rows: unknown[]
  try {
    rows = readRows(target)
  } catch (error) {
    return failure(
      errorCode(error, 'YARD_READ_FAILED'),
      'yard read failed closed',
      current.actor || null,
    )
  }
  const index = rows.findIndex((item) => isRecord(item) && item.yardId === yardId)
  if (index < 0)
    return failure('READER_MISSING', 'yard record is unavailable', current.actor || null)
  const existing = rows[index]
  if (!isRecord(existing)) {
    return failure('READER_MISSING', 'yard record is unavailable', current.actor || null)
  }
  const next: YardRecord = { ...existing, ...copyRecord(patch), yardId, updatedAt: now }
  try {
    if (!target)
      return failure(
        'STORAGE_WRITE_FAILED',
        'yard update was not acknowledged',
        current.actor || null,
      )
    target.setStorageSync(
      YARD_STORAGE_KEY,
      stringify(rows.map((item, itemIndex) => (itemIndex === index ? next : item))),
    )
  } catch {
    return failure(
      'STORAGE_WRITE_FAILED',
      'yard update was not acknowledged',
      current.actor || null,
    )
  }
  return result(
    true,
    { record: copyRecord(next), access: { canRead: true, canEdit: true } },
    null,
    { actor: current.actor || null, source: 'local', wrote: true, readOnly: false, canWrite: true },
  )
}

export { EDITABLE_FIELDS }
