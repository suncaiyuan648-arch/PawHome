/** Local/mock animal reader and writer for the management editor. */
import { resolveTrustedActor } from '../../../navigation/actorCapabilities.ts'
import { evaluateManagementCapabilities } from '../../../navigation/managementContracts.ts'

export const ANIMAL_STORAGE_KEY = 'PAWHOME_ANIMAL_RECORDS'
export const YARD_STORAGE_KEY = 'PAWHOME_YARD_RECORDS'
const EDITABLE_FIELDS = Object.freeze([
  'species', 'name', 'avatar', 'breed', 'tags', 'description', 'desc', 'status', 'state',
  'petValue', 'value', 'gender', 'neuter', 'vaccine', 'personality', 'birthday', 'birthValue',
])
const POLICY = Object.freeze({
  yard: Object.freeze({
    readStates: ['active'],
    manageStates: ['active'],
    editStates: ['active'],
    ownerRoles: ['yard_owner'],
    yardOwnerRoles: ['yard_owner'],
  }),
  animal: Object.freeze({
    readStates: ['active'],
    manageStates: ['active'],
    editStates: ['active'],
    yardOwnerRoles: ['yard_owner'],
    managerRoles: ['animal_manager'],
  }),
})
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const STATUS_LABELS = new Set(['待领养', '已领养', '失踪', '死亡'])

type JsonRecord = Record<string, unknown>
type Actor = NonNullable<ReturnType<typeof resolveTrustedActor>>
type AnimalSpecies = 'cat' | 'dog'

export interface LocalManagementStorage {
  getStorageSync(key: string): unknown
  setStorageSync(key: string, value: string): void
}
type StorageLike = LocalManagementStorage

interface AnimalRecord extends JsonRecord {
  animalId: string
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

interface LocalResult {
  success: boolean
  data: LocalData | null
  error: LocalError | null
  readOnly: boolean
  canWrite: boolean
  actor?: Actor | null
  source?: string
  wrote?: boolean
}

export interface AnimalManagementOptions {
  yardId?: string
  actorProvider?: () => unknown
  storage?: LocalManagementStorage
  now?: string
}

export interface AnimalManagementPatch {
  species?: AnimalSpecies
  name?: string
  avatar?: string
  breed?: string
  tags?: readonly string[]
  description?: string
  desc?: string
  status?: string
  state?: string
  petValue?: number
  value?: number
  gender?: string
  neuter?: string
  vaccine?: string
  personality?: string
  birthValue?: string
}

export interface CreateAnimalManagementInput extends AnimalManagementPatch {
  name: string
  breed: string
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
  return isRecord(value)
    && typeof value.getStorageSync === 'function'
    && typeof value.setStorageSync === 'function'
}

function storageOf(storage: unknown): StorageLike | null {
  if (isStorageLike(storage)) return storage
  if (typeof uni !== 'undefined' && uni && typeof uni.getStorageSync === 'function' && typeof uni.setStorageSync === 'function') {
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
      error: { code: errorCode(error, 'ACTOR_RESOLUTION_FAILED'), message: 'trusted actor is unavailable' },
    }
  }
}

function readRows(storage: unknown, key: string): unknown[] {
  const target = storageOf(storage)
  if (!target) throw storageError('STORAGE_UNAVAILABLE', 'animal storage is unavailable')
  let raw: unknown
  try {
    raw = target.getStorageSync(key)
  } catch {
    throw storageError('STORAGE_READ_FAILED', 'animal storage read failed')
  }
  if (raw === undefined || raw === null || raw === '') return []
  let rows: unknown
  try {
    rows = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    throw storageError('INVALID_STORAGE', 'animal storage is invalid')
  }
  if (!Array.isArray(rows)) throw storageError('INVALID_STORAGE', 'animal storage must be an array')
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

function normalizeStatus(value: unknown, fallback = 'active'): string {
  const text = typeof value === 'string' ? value.trim() : ''
  return STATUS_LABELS.has(text) ? 'active' : (text || fallback)
}

function isSpecies(value: unknown): value is AnimalSpecies {
  return value === 'cat' || value === 'dog'
}

function normalizeSpecies(patch: JsonRecord = {}): AnimalSpecies {
  if (patch.species === 'dog' || patch.kind === 'dog') return 'dog'
  if (patch.species === 'cat' || patch.kind === 'cat') return 'cat'
  const breed = typeof patch.breed === 'string' ? patch.breed : ''
  return /金毛|柴犬|拉布拉多|边牧|萨摩耶|哈士奇|贵宾|泰迪|柯基|牧羊犬|雪纳瑞|比熊|狗/.test(breed) ? 'dog' : 'cat'
}

function isPublicRecord(record: JsonRecord): boolean {
  if (record.visibility === 'private' || record.isPublic === false) return false
  const state = record.status || record.state
  return !state || state === 'active' || state === 'published' || state === '待领养' || state === '已领养'
}

/** Public read used by detail/roster pages; it never evaluates management access. */
export function readPublicAnimal(animalId: string, { yardId, storage }: AnimalManagementOptions = {}): LocalResult {
  const id = idOf(animalId)
  if (!id) return failure('INVALID_ID', 'animalId is invalid')
  const requestedYardId = yardId === undefined || yardId === '' ? '' : idOf(yardId)
  if (yardId !== undefined && !requestedYardId) return failure('INVALID_ID', 'yardId is invalid')
  let rows: unknown[]
  try {
    rows = readRows(storage, ANIMAL_STORAGE_KEY)
  } catch (error) {
    return failure(errorCode(error, 'ANIMAL_READ_FAILED'), 'animal read failed closed')
  }
  const record = rows.find(
    (item): item is AnimalRecord => isRecord(item) && typeof item.animalId === 'string' && item.animalId === id,
  )
  if (!record) return failure('READER_MISSING', 'animal record is unavailable')
  if (requestedYardId && record.yardId !== requestedYardId) return failure('CROSS_YARD_RELATION', 'animal does not belong to yardId')
  if (!isPublicRecord(record)) return failure('FORBIDDEN', 'animal is not public')
  return result(
    true,
    { record: copyRecord(record), access: { canRead: true, canEdit: false } },
    null,
    { source: 'local', readOnly: true, canWrite: false },
  )
}

function readParentYard(yardId: unknown, storage: unknown): JsonRecord | null {
  try {
    const rows = readRows(storage, YARD_STORAGE_KEY)
    const yard = rows.find((item) => isRecord(item) && item.yardId === yardId)
    return isRecord(yard) ? yard : null
  } catch {
    return null
  }
}

function authorize(
  animalId: string,
  yardId: unknown,
  record: JsonRecord,
  yard: JsonRecord | null,
  actor: Actor,
): { access: ReturnType<typeof evaluateManagementCapabilities>; error: string | null } {
  const access = evaluateManagementCapabilities({
    actorProvider: () => ({ actor }),
    animal: record,
    yard: yard || undefined,
    animalId,
    yardId,
    policy: POLICY,
  })
  if (!access.capabilities['animal.edit']) return { access, error: access.reasons['animal.edit'] || 'FORBIDDEN' }
  return { access, error: null }
}

function authorizeYard(
  yardId: string,
  yard: JsonRecord,
  actor: Actor,
): { access: ReturnType<typeof evaluateManagementCapabilities>; error: string | null } {
  const access = evaluateManagementCapabilities({
    actorProvider: () => ({ actor }),
    yard,
    yardId,
    policy: POLICY,
  })
  if (!access.capabilities['yard.edit']) return { access, error: access.reasons['yard.edit'] || 'FORBIDDEN' }
  return { access, error: null }
}

export function readLocalAnimal(animalId: string, { yardId, actorProvider, storage }: AnimalManagementOptions = {}): LocalResult {
  const id = idOf(animalId)
  if (!id) return failure('INVALID_ID', 'animalId is invalid')
  const requestedYardId = yardId === undefined || yardId === '' ? '' : idOf(yardId)
  if (yardId !== undefined && !requestedYardId) return failure('INVALID_ID', 'yardId is invalid')
  const resolved = actorOf(actorProvider)
  if (resolved.error || !resolved.actor) return failure(resolved.error?.code || 'NO_ACTOR', 'trusted actor is unavailable')
  let rows: unknown[]
  try {
    rows = readRows(storage, ANIMAL_STORAGE_KEY)
  } catch (error) {
    return failure(errorCode(error, 'ANIMAL_READ_FAILED'), 'animal read failed closed', resolved.actor)
  }
  const record = rows.find(
    (item): item is AnimalRecord => isRecord(item) && typeof item.animalId === 'string' && item.animalId === id,
  )
  if (!record) return failure('READER_MISSING', 'animal record is unavailable', resolved.actor)
  if (requestedYardId && record.yardId !== requestedYardId) return failure('CROSS_YARD_RELATION', 'animal does not belong to yardId', resolved.actor)
  const parent = readParentYard(record.yardId, storage)
  const auth = authorize(id, record.yardId, record, parent, resolved.actor)
  if (auth.error) return failure('FORBIDDEN', 'animal edit is not allowed', resolved.actor)
  return result(
    true,
    { record: copyRecord(record), access: { canRead: true, canEdit: true }, capabilities: auth.access.capabilities },
    null,
    { actor: resolved.actor, source: 'local', readOnly: true, canWrite: false },
  )
}

export function updateLocalAnimal(
  animalId: string,
  patch: AnimalManagementPatch,
  { yardId, actorProvider, storage, now = new Date().toISOString() }: AnimalManagementOptions = {},
): LocalResult {
  if (!isRecord(patch)) return failure('INVALID_PATCH', 'animal patch is invalid')
  if (Object.prototype.hasOwnProperty.call(patch, 'species') && !isSpecies(patch.species)) {
    return failure('INVALID_SPECIES', 'species must be cat or dog')
  }
  const keys = Object.keys(patch)
  if (!keys.length) return failure('EMPTY_PATCH', 'animal patch is empty')
  if (keys.some((key) => !EDITABLE_FIELDS.includes(key))) return failure('FIELD_NOT_EDITABLE', 'animal field is not editable')
  const current = readLocalAnimal(animalId, { yardId, actorProvider, storage })
  if (!current.success) return current
  const target = storageOf(storage)
  let rows: unknown[]
  try {
    rows = readRows(target, ANIMAL_STORAGE_KEY)
  } catch (error) {
    return failure(errorCode(error, 'ANIMAL_READ_FAILED'), 'animal read failed closed', current.actor || null)
  }
  const index = rows.findIndex((item) => isRecord(item) && item.animalId === animalId)
  if (index < 0) return failure('READER_MISSING', 'animal record is unavailable', current.actor || null)
  const existing = rows[index]
  if (!isRecord(existing) || typeof animalId !== 'string') {
    return failure('READER_MISSING', 'animal record is unavailable', current.actor || null)
  }
  const statusValue = patch.status || patch.state
  const next: JsonRecord = {
    ...existing,
    ...copyRecord(patch),
    species: isSpecies(patch.species) ? patch.species : (isSpecies(existing.species) ? existing.species : 'cat'),
    animalId,
    yardId: existing.yardId,
    updatedAt: now,
  }
  if (statusValue) {
    next.statusLabel = statusValue
    next.status = normalizeStatus(statusValue, typeof existing.status === 'string' ? existing.status : 'active')
  }
  try {
    if (!target) return failure('STORAGE_WRITE_FAILED', 'animal update was not acknowledged', current.actor || null)
    target.setStorageSync(ANIMAL_STORAGE_KEY, stringify(rows.map((item, itemIndex) => itemIndex === index ? next : item)))
  } catch {
    return failure('STORAGE_WRITE_FAILED', 'animal update was not acknowledged', current.actor || null)
  }
  return result(
    true,
    { record: copyRecord(next), access: { canRead: true, canEdit: true } },
    null,
    { actor: current.actor || null, source: 'local', wrote: true, readOnly: false, canWrite: true },
  )
}

/** Create a managed animal record in local storage after a fresh yard check. */
export function createLocalAnimal(
  yardId: string,
  patch: CreateAnimalManagementInput,
  { actorProvider, storage, now = new Date().toISOString() }: AnimalManagementOptions = {},
): LocalResult {
  const requestedYardId = idOf(yardId)
  if (!requestedYardId) return failure('INVALID_ID', 'yardId is invalid')
  if (!isRecord(patch)) return failure('INVALID_PATCH', 'animal patch is invalid')
  if (Object.prototype.hasOwnProperty.call(patch, 'species') && !isSpecies(patch.species)) {
    return failure('INVALID_SPECIES', 'species must be cat or dog')
  }
  const keys = Object.keys(patch)
  if (keys.some((key) => !EDITABLE_FIELDS.includes(key))) return failure('FIELD_NOT_EDITABLE', 'animal field is not editable')
  if (patch.species !== undefined && !isSpecies(patch.species)) return failure('INVALID_SPECIES', 'species must be cat or dog')
  if (!String(patch.name || '').trim()) return failure('INVALID_NAME', 'animal name is required')
  if (!String(patch.breed || '').trim()) return failure('INVALID_BREED', 'animal breed is required')
  const resolved = actorOf(actorProvider)
  if (resolved.error || !resolved.actor) return failure(resolved.error?.code || 'NO_ACTOR', 'trusted actor is unavailable')
  const yard = readParentYard(requestedYardId, storage)
  if (!yard) return failure('YARD_MISSING', 'yard record is unavailable', resolved.actor)
  const yardAuth = authorizeYard(requestedYardId, yard, resolved.actor)
  if (yardAuth.error) return failure('FORBIDDEN', 'animal create is not allowed', resolved.actor)
  const target = storageOf(storage)
  let rows: unknown[]
  try {
    rows = readRows(target, ANIMAL_STORAGE_KEY)
  } catch (error) {
    return failure(errorCode(error, 'ANIMAL_READ_FAILED'), 'animal read failed closed', resolved.actor)
  }
  const animalId = `animal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const statusLabel = patch.status || patch.state || '待领养'
  const next: JsonRecord = {
    ...copyRecord(patch),
    species: normalizeSpecies(patch),
    animalId,
    yardId: requestedYardId,
    yardOwnerId: yard.yardOwnerId || yard.ownerId || yard.ownerUserId || undefined,
    status: normalizeStatus(statusLabel),
    statusLabel,
    visibility: patch.visibility || 'public',
    createdAt: now,
    updatedAt: now,
  }
  try {
    if (!target) return failure('STORAGE_WRITE_FAILED', 'animal create was not acknowledged', resolved.actor)
    target.setStorageSync(ANIMAL_STORAGE_KEY, stringify(rows.concat(next)))
  } catch {
    return failure('STORAGE_WRITE_FAILED', 'animal create was not acknowledged', resolved.actor)
  }
  return result(
    true,
    { record: copyRecord(next), access: { canRead: true, canEdit: true }, capabilities: yardAuth.access.capabilities },
    null,
    { actor: resolved.actor, source: 'local', wrote: true, readOnly: false, canWrite: true },
  )
}

export function canCreateLocalAnimal(yardId: string, { actorProvider, storage }: AnimalManagementOptions = {}): LocalResult {
  const requestedYardId = idOf(yardId)
  if (!requestedYardId) return failure('INVALID_ID', 'yardId is invalid')
  const resolved = actorOf(actorProvider)
  if (resolved.error || !resolved.actor) return failure(resolved.error?.code || 'NO_ACTOR', 'trusted actor is unavailable')
  const yard = readParentYard(requestedYardId, storage)
  if (!yard) return failure('YARD_MISSING', 'yard record is unavailable', resolved.actor)
  const auth = authorizeYard(requestedYardId, yard, resolved.actor)
  if (auth.error) return failure('FORBIDDEN', 'animal create is not allowed', resolved.actor)
  return result(
    true,
    { yard: copyRecord(yard), access: { canRead: true, canEdit: true }, capabilities: auth.access.capabilities },
    null,
    { actor: resolved.actor, source: 'local', readOnly: true, canWrite: false },
  )
}

export { EDITABLE_FIELDS }
