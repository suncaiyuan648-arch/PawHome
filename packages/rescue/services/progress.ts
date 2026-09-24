/**
 * Read-only rescue applicant progress seam.
 *
 * The page needs the persisted record's display fields, while the status
 * shown to the applicant must come from the canonical three-axis state
 * contract. This service reads one exact record (with demos disabled), feeds
 * that same snapshot through the canonical state contract, and exposes the
 * projection without adding a writer or trusting route fields as state.
 */
import {
  normalizeRescueState,
  type RescueStateProjection,
} from '../../../services/domainReads/rescue/stateContract.ts'
import {
  getRescueById,
  type RescueAnimal,
  type RescueRecord,
} from '../../../utils/rescueStorage.ts'
import type {
  RescueApplicantProgressRecord,
  RescueProgressRecordSnapshot,
} from './componentMetadata.ts'

type JsonRecord = Record<string, unknown>
type ActorProvider = () => unknown

interface ActorSummary {
  readonly id: string
}

interface ActorContext {
  readonly id: string
  readonly provided: boolean
}

interface ProgressError {
  readonly code: string
  readonly message: string
}

export type ProgressData = RescueApplicantProgressRecord

interface ProgressFailure {
  readonly success: false
  readonly data: null
  readonly error: ProgressError
  readonly readOnly: true
  readonly canWrite: false
  readonly actor?: ActorSummary
}

interface ProgressSuccess {
  readonly success: true
  readonly data: ProgressData
  readonly error: null
  readonly readOnly: true
  readonly canWrite: false
  readonly actor?: ActorSummary
}

export type RescueProgressResult = ProgressFailure | ProgressSuccess

interface ApplicantRelations {
  readonly values: string[]
  readonly error: string | null
}

export interface ReadRescueProgressOptions {
  readonly actorProvider?: ActorProvider
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const ANONYMOUS_IDS = new Set(['anonymous', 'anon', 'guest', 'unknown', '匿名', '匿名用户'])

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function failure(
  code: string,
  message: string,
  actor: ActorSummary | null = null,
): ProgressFailure {
  return Object.freeze({
    success: false,
    data: null,
    error: Object.freeze({ code, message }),
    readOnly: true,
    canWrite: false,
    ...(actor ? { actor } : {}),
  })
}

function cloneAndFreeze(value: unknown, seen = new WeakMap<object, unknown>()): unknown {
  if (value === null || typeof value !== 'object') return value
  if (seen.has(value)) return seen.get(value)

  if (Array.isArray(value)) {
    const output: unknown[] = []
    seen.set(value, output)
    value.forEach((item, index) => {
      output[index] = cloneAndFreeze(item, seen)
    })
    return Object.freeze(output)
  }

  if (!isRecord(value)) return value
  const output: JsonRecord = {}
  seen.set(value, output)
  for (const key of Object.keys(value)) output[key] = cloneAndFreeze(value[key], seen)
  return Object.freeze(output)
}

function isProgressData(value: unknown): value is ProgressData {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.rescueId === 'string' &&
    value.applicationType === 'rescue' &&
    typeof value.applicationStatus === 'string' &&
    isRecord(value.rescueState)
  )
}

function freezeProgressData(value: ProgressData): ProgressData {
  const cloned = cloneAndFreeze(value)
  return isProgressData(cloned) ? cloned : value
}

function errorCode(error: unknown, fallback: string): string {
  return isRecord(error) && typeof error.code === 'string' && error.code ? error.code : fallback
}

function normalizeId(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim()
}

function isActorProvider(value: unknown): value is ActorProvider {
  return typeof value === 'function'
}

function actorFrom(provider: unknown): ActorContext {
  let providerFn: ActorProvider
  if (isActorProvider(provider)) {
    providerFn = provider
  } else {
    if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') {
      return { id: '', provided: false }
    }
    let session: unknown
    try {
      session = uni.getStorageSync('PAWHOME_ACTOR_SESSION')
    } catch {
      return { id: '', provided: true }
    }
    if (session === undefined || session === null || session === '')
      return { id: '', provided: false }
    providerFn = () => session
  }

  let raw: unknown
  try {
    raw = providerFn()
  } catch {
    return { id: '', provided: true }
  }
  const actorValue = isRecord(raw) && raw.actor ? raw.actor : raw
  const id = isRecord(actorValue) ? normalizeId(actorValue.id || actorValue.actorId) : ''
  return {
    id:
      ID_PATTERN.test(id) && !URL_MARKERS.test(id) && !ANONYMOUS_IDS.has(id.toLowerCase())
        ? id
        : '',
    provided: true,
  }
}

function applicantIds(record: RescueRecord): ApplicantRelations {
  const values: string[] = []
  const applicant = isRecord(record.applicant) ? record.applicant : null
  const candidates: unknown[] = [
    record.applicantId,
    record.applicantUserId,
    record.userId,
    applicant?.id,
    applicant?.pawId,
  ]
  for (const value of candidates) {
    if (value === undefined || value === null || value === '') continue
    const id = normalizeId(value)
    if (!ID_PATTERN.test(id) || URL_MARKERS.test(id) || ANONYMOUS_IDS.has(id.toLowerCase())) {
      return { values: [], error: 'INVALID_APPLICANT_RELATION' }
    }
    if (!values.includes(id)) values.push(id)
  }
  if (values.length > 1) return { values: [], error: 'CONFLICTING_APPLICANT_RELATION' }
  return { values, error: null }
}

function readOptionalString(record: JsonRecord, key: string): string | undefined {
  const value = record[key]
  return typeof value === 'string' && value ? value : undefined
}

function readNestedString(
  record: JsonRecord,
  directKey: string,
  nestedKey: string,
  nestedField: string,
): string | undefined {
  return (
    readOptionalString(record, directKey) ||
    (isRecord(record[nestedKey]) ? readOptionalString(record[nestedKey], nestedField) : undefined)
  )
}

function validateId(rescueId: unknown): string | ProgressFailure {
  if (typeof rescueId !== 'string') return failure('INVALID_ID', '救助单 ID 格式不合法')
  if (rescueId !== rescueId.trim()) return failure('INVALID_ID', '救助单 ID 格式不合法')
  const id = normalizeId(rescueId)
  if (!id) return failure('MISSING_ID', '缺少救助单 ID')
  if (!ID_PATTERN.test(id) || URL_MARKERS.test(id))
    return failure('INVALID_ID', '救助单 ID 格式不合法')
  return id
}

function safeAnimals(snapshot: RescueRecord): RescueAnimal[] {
  return Array.isArray(snapshot.animals)
    ? snapshot.animals.map((animal) => ({
        id: animal.id,
        yardPetId: animal.yardPetId,
        name: animal.name,
        avatar: animal.avatar,
      }))
    : []
}

function safeRecord(
  snapshot: RescueRecord,
  projection: RescueStateProjection,
  strict: boolean,
): RescueProgressRecordSnapshot {
  if (!strict) return snapshot
  const source: JsonRecord = snapshot
  const receiver = isRecord(source.receiver)
    ? { name: normalizeId(source.receiver.name) }
    : undefined
  return {
    id: snapshot.id,
    rescueId: snapshot.rescueId || snapshot.id,
    applicationType: 'rescue',
    status: snapshot.status,
    statusText: snapshot.statusText,
    applicationStatus: projection.applicationStatus,
    reviewStatus: readNestedString(source, 'reviewStatus', 'review', 'status'),
    fundingStatus: readNestedString(source, 'fundingStatus', 'funding', 'status'),
    ownerName: snapshot.ownerName,
    ownerAvatar: snapshot.ownerAvatar,
    ownerLevel: snapshot.ownerLevel,
    createdAt: snapshot.createdAt,
    createdLabel: snapshot.createdLabel,
    helpType: snapshot.helpType,
    amount: snapshot.amount,
    views: snapshot.views,
    description: snapshot.description,
    detail: snapshot.detail,
    summary: snapshot.summary,
    media: Array.isArray(snapshot.media) ? snapshot.media.slice(0, 6) : [],
    mediaPaths: Array.isArray(snapshot.mediaPaths) ? snapshot.mediaPaths.slice(0, 6) : [],
    animals: safeAnimals(snapshot),
    receiver,
  }
}

/** Read one persisted rescue record and its canonical state projection. */
export function readRescueProgress(
  rescueId: string,
  options: ReadRescueProgressOptions = {},
): RescueProgressResult {
  const validId = validateId(rescueId)
  if (typeof validId !== 'string') return validId
  const source = options
  let snapshot: RescueRecord | null
  try {
    snapshot = getRescueById(validId, { includeDemo: false })
  } catch (error) {
    return failure(errorCode(error, 'STORAGE_READ_FAILED'), '救助申请读取失败')
  }
  if (!snapshot) return failure('NOT_FOUND', '找不到这条救助申请')

  const owners = applicantIds(snapshot)
  const actor = actorFrom(source.actorProvider)
  if (owners.error)
    return failure(owners.error, '救助申请缺少有效申请人关系', actor.id ? { id: actor.id } : null)
  if (owners.values.length && actor.provided && !actor.id)
    return failure('NO_ACTOR', '请先登录后查看救助进度')
  if (owners.values.length && actor.id !== owners.values[0]) {
    return failure('FORBIDDEN', '当前账号无权查看这条救助申请', actor.id ? { id: actor.id } : null)
  }
  if (actor.provided && !owners.values.length) {
    return failure(
      'MISSING_APPLICANT_RELATION',
      '救助申请缺少申请人关系',
      actor.id ? { id: actor.id } : null,
    )
  }

  let projection: RescueStateProjection
  try {
    projection = normalizeRescueState(snapshot)
  } catch {
    return failure('STATE_READ_FAILED', '救助状态读取失败')
  }
  const strict = actor.provided
  const record = safeRecord(snapshot, projection, strict)
  const data: ProgressData = {
    ...record,
    applicationStatus: projection.applicationStatus,
    rescueState: projection,
  }
  return Object.freeze({
    success: true,
    data: freezeProgressData(data),
    error: null,
    readOnly: true,
    canWrite: false,
    ...(actor.id ? { actor: { id: actor.id } } : {}),
  })
}

export const readRescueApplicantProgress = readRescueProgress
