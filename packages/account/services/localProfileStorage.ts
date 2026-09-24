/** Local/mock profile reader and writer for the profile editor page. */
import { resolveTrustedActor } from '../../../navigation/actorCapabilities.ts'
import { evaluateManagementCapabilities } from '../../../navigation/managementContracts.ts'

export const PROFILE_STORAGE_KEY = 'PAWHOME_PROFILE_RECORDS'
const EDITABLE_FIELDS = Object.freeze(['name', 'nickname', 'avatar', 'bio', 'tags'])
const POLICY = Object.freeze({
  profile: Object.freeze({ readStates: ['active'], editStates: ['active'] }),
})
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/

type JsonRecord = Record<string, unknown>
type Actor = NonNullable<ReturnType<typeof resolveTrustedActor>>

interface StorageLike {
  getStorageSync(key: string): unknown
  setStorageSync(key: string, value: string): void
}

interface ProfileRecord extends JsonRecord {
  userId: string
}

export interface LocalProfilePatch {
  name?: string
  nickname?: string
  avatar?: string
  bio?: string
  tags?: string[]
}

interface ProfileAccess {
  canRead: boolean
  canEdit: boolean
}

interface ProfileData {
  record: JsonRecord
  access: ProfileAccess
  capabilities?: Readonly<Record<string, boolean>>
}

interface ProfileError {
  code: string
  message: string
}

interface ProfileResult {
  success: boolean
  data: ProfileData | null
  error: ProfileError | null
  readOnly: boolean
  canWrite: boolean
  actor?: Actor | null
  source?: string
  wrote?: boolean
}

interface ProfileOptions {
  actorProvider?: () => unknown
  storage?: StorageLike
  now?: string
}

function result(
  success: boolean,
  data: ProfileData | null,
  error: ProfileError | null,
  extra: Partial<Pick<ProfileResult, 'actor' | 'source' | 'wrote' | 'readOnly' | 'canWrite'>> = {},
): ProfileResult {
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

function actorOf(actorProvider: unknown): { actor: Actor | null; error: ProfileError | null } {
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
  if (!target) throw storageError('STORAGE_UNAVAILABLE', 'profile storage is unavailable')
  let raw: unknown
  try {
    raw = target.getStorageSync(PROFILE_STORAGE_KEY)
  } catch {
    throw storageError('STORAGE_READ_FAILED', 'profile storage read failed')
  }
  if (raw === undefined || raw === null || raw === '') return []
  let rows: unknown
  try {
    rows = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    throw storageError('INVALID_STORAGE', 'profile storage is invalid')
  }
  if (!Array.isArray(rows))
    throw storageError('INVALID_STORAGE', 'profile storage must be an array')
  return rows
}

function idOf(value: unknown): string {
  if (typeof value !== 'string' || value !== value.trim() || !SAFE_ID.test(value)) return ''
  return value
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

function failure(code: string, message: string, actor: Actor | null = null): ProfileResult {
  return result(false, null, { code, message }, { actor })
}

function isPublicRecord(record: JsonRecord): boolean {
  if (record.visibility === 'private' || record.isPublic === false) return false
  const state = record.status || record.state
  return !state || state === 'active' || state === 'published'
}

/** Read the public projection without accepting a query supplied identity. */
export function readPublicProfile(userId: string, { storage }: ProfileOptions = {}): ProfileResult {
  const id = idOf(userId)
  if (!id) return failure('INVALID_ID', 'profile userId is invalid')
  let rows: unknown[]
  try {
    rows = readRows(storage)
  } catch (error) {
    return failure(errorCode(error, 'PROFILE_READ_FAILED'), 'profile read failed closed')
  }
  const record = rows.find(
    (item): item is ProfileRecord =>
      isRecord(item) && typeof item.userId === 'string' && item.userId === id,
  )
  if (!record) return failure('READER_MISSING', 'profile record is unavailable')
  if (!isPublicRecord(record)) return failure('FORBIDDEN', 'profile is not public')
  return result(
    true,
    { record: copyRecord(record), access: { canRead: true, canEdit: false } },
    null,
    { source: 'local', readOnly: true, canWrite: false },
  )
}

function authorize(
  userId: string,
  record: JsonRecord,
  actor: Actor,
): { access: ReturnType<typeof evaluateManagementCapabilities>; error: string | null } {
  const access = evaluateManagementCapabilities({
    actorProvider: () => ({ actor }),
    profile: record,
    policy: POLICY,
    userId,
  })
  if (!access.capabilities['profile.edit'])
    return { access, error: access.reasons['profile.edit'] || 'FORBIDDEN' }
  return { access, error: null }
}

export function readLocalProfile(
  userId: string,
  { actorProvider, storage }: ProfileOptions = {},
): ProfileResult {
  const id = idOf(userId)
  if (!id) return failure('INVALID_ID', 'profile userId is invalid')
  const resolved = actorOf(actorProvider)
  if (resolved.error || !resolved.actor)
    return failure(resolved.error?.code || 'NO_ACTOR', 'trusted actor is unavailable')
  let rows: unknown[]
  try {
    rows = readRows(storage)
  } catch (error) {
    return failure(
      errorCode(error, 'PROFILE_READ_FAILED'),
      'profile read failed closed',
      resolved.actor,
    )
  }
  const record = rows.find(
    (item): item is ProfileRecord =>
      isRecord(item) && typeof item.userId === 'string' && item.userId === id,
  )
  if (!record) return failure('READER_MISSING', 'profile record is unavailable', resolved.actor)
  const auth = authorize(id, record, resolved.actor)
  if (auth.error) return failure('FORBIDDEN', 'profile edit is not allowed', resolved.actor)
  return result(
    true,
    {
      record: copyRecord(record),
      access: { canRead: true, canEdit: true },
      capabilities: auth.access.capabilities,
    },
    null,
    { actor: resolved.actor, readOnly: true, canWrite: false, source: 'local' },
  )
}

export function updateLocalProfile(
  userId: string,
  patch: LocalProfilePatch,
  { actorProvider, storage, now = new Date().toISOString() }: ProfileOptions = {},
): ProfileResult {
  if (!isRecord(patch)) return failure('INVALID_PATCH', 'profile patch is invalid')
  const keys = Object.keys(patch)
  if (!keys.length) return failure('EMPTY_PATCH', 'profile patch is empty')
  if (keys.some((key) => !EDITABLE_FIELDS.includes(key)))
    return failure('FIELD_NOT_EDITABLE', 'profile field is not editable')
  const current = readLocalProfile(userId, { actorProvider, storage })
  if (!current.success) return current
  const target = storageOf(storage)
  let rows: unknown[]
  try {
    rows = readRows(target)
  } catch (error) {
    return failure(
      errorCode(error, 'PROFILE_READ_FAILED'),
      'profile read failed closed',
      current.actor || null,
    )
  }
  const index = rows.findIndex((item) => isRecord(item) && item.userId === userId)
  if (index < 0)
    return failure('READER_MISSING', 'profile record is unavailable', current.actor || null)
  const existing = rows[index]
  if (!isRecord(existing) || typeof userId !== 'string') {
    return failure('READER_MISSING', 'profile record is unavailable', current.actor || null)
  }
  const next: ProfileRecord = { ...existing, ...copyRecord(patch), userId, updatedAt: now }
  try {
    target?.setStorageSync(
      PROFILE_STORAGE_KEY,
      stringify(rows.map((item, itemIndex) => (itemIndex === index ? next : item))),
    )
  } catch {
    return failure(
      'STORAGE_WRITE_FAILED',
      'profile update was not acknowledged',
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
