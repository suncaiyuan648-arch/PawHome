/**
 * Bind the account task surface to shared canonical domain read adapters.
 *
 * This module is intentionally a thin source composition layer. It does not
 * read route/query values, translate arbitrary record aliases, infer an actor,
 * or perform writes. Adoption and rescue use their existing read-only
 * adapters through the shared domainReads layer; feeding and dynamic use the
 * same explicit persisted keys as the account page runtime.
 */

import {
  createTaskSummary,
  type TaskActionType,
  type TaskStatus,
  type TaskSummary,
} from '../../../navigation/taskContracts.ts'
import { readAdoptionApplication } from '../../../services/domainReads/adoption/applicationAdapter.ts'
import { readAdoptionReviewList } from '../../../services/domainReads/adoption/reviewAdapter.ts'
import { readRescueMine, readRescueReviewList } from '../../../services/domainReads/rescue/lists.ts'
import { readRescueStateById } from '../../../services/domainReads/rescue/stateAdapter.ts'
import { getAdoptionRecords } from '../../../utils/adoptionStorage.ts'

type JsonRecord = Record<string, unknown>
type TaskReaderActor = { id: string; roles: readonly string[] }
type TaskReaderContext = { actor: TaskReaderActor }
type DomainTaskReader = (context: TaskReaderContext) => ReaderEnvelope

interface TaskStage {
  actionType: TaskActionType
  status: TaskStatus
}

interface TaskDiagnostic {
  domain: 'adoption' | 'rescue' | 'feeding' | 'dynamic'
  index: number
  code: string
}

interface ReaderDiagnostics {
  scanned: number
  accepted: number
  skipped: readonly TaskDiagnostic[]
}

interface ReaderEnvelope {
  success: boolean
  data: {
    items: TaskSummary[]
  }
  error: { code: string } | null
  readOnly: true
  canWrite: false
  diagnostics?: ReaderDiagnostics
}

interface StorageRead {
  rows: unknown[]
  error: string | null
}

const ADOPTION_APPLICANT_STAGE: Readonly<Record<string, TaskStage>> = Object.freeze({
  cloud_pending: Object.freeze({ actionType: 'apply', status: 'pending' }),
  pending: Object.freeze({ actionType: 'apply', status: 'pending' }),
  pickup: Object.freeze({ actionType: 'confirm', status: 'pending' }),
  owner_confirm: Object.freeze({ actionType: 'confirm', status: 'in_progress' }),
  owner_confirm_pending: Object.freeze({ actionType: 'confirm', status: 'in_progress' }),
  jury_confirm: Object.freeze({ actionType: 'confirm', status: 'in_progress' }),
  jury_confirm_pending: Object.freeze({ actionType: 'confirm', status: 'in_progress' }),
  adoption_confirmed: Object.freeze({ actionType: 'claim_reward', status: 'pending' }),
  reward: Object.freeze({ actionType: 'claim_reward', status: 'pending' }),
  reward_done: Object.freeze({ actionType: 'claim_reward', status: 'completed' }),
  rejected: Object.freeze({ actionType: 'apply', status: 'failed' }),
  cloud_rejected: Object.freeze({ actionType: 'apply', status: 'failed' }),
  abandoned: Object.freeze({ actionType: 'apply', status: 'cancelled' }),
})

const RESCUE_APPLICANT_STAGE: Readonly<Record<string, TaskStage>> = Object.freeze({
  platform_pending: Object.freeze({ actionType: 'apply', status: 'pending' }),
  platform_approved: Object.freeze({ actionType: 'fund', status: 'pending' }),
  platform_rejected: Object.freeze({ actionType: 'apply', status: 'failed' }),
})

const REVIEW_TASK_STATUS: Readonly<Record<string, 'pending' | 'processed'>> = Object.freeze({
  pending: 'pending',
  approved: 'processed',
  rejected: 'processed',
})

const REVIEW_ROLES: ReadonlySet<string> = Object.freeze(
  new Set(['owner', 'cloud_parent', 'reviewer']),
)

const FEEDING_KEY = 'PAWHOME_FEEDING_ORDERS'
const DYNAMIC_KEY = 'PAWHOME_DYNAMIC_RECORDS'

class DomainTaskReaderError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'DomainTaskReaderError'
    this.code = code
  }
}

function own(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function isPlainRecord(value: unknown): value is JsonRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function isTaskReaderActor(value: unknown): value is TaskReaderActor {
  return (
    isPlainRecord(value) &&
    typeof value.id === 'string' &&
    Array.isArray(value.roles) &&
    value.roles.every((role): role is string => typeof role === 'string')
  )
}

function codeError(code: string, message: string): DomainTaskReaderError {
  return new DomainTaskReaderError(code, message)
}

function errorCode(error: unknown, fallback: string): string {
  if (error === null || (typeof error !== 'object' && typeof error !== 'function')) return fallback
  const code = Reflect.get(error, 'code')
  return typeof code === 'string' && code ? code : fallback
}

function freeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value !== null && typeof value === 'object' && !seen.has(value)) {
    seen.add(value)
    for (const key of Reflect.ownKeys(value)) freeze(Reflect.get(value, key), seen)
    Object.freeze(value)
  }
  return value
}

function assertReaderContext(context: unknown): TaskReaderActor {
  if (!isPlainRecord(context) || !Object.isFrozen(context)) {
    throw codeError('INVALID_READER_CONTEXT', 'task reader context must be frozen')
  }
  const keys = Object.keys(context)
  if (keys.length !== 1 || keys[0] !== 'actor') {
    throw codeError('INVALID_READER_CONTEXT', 'task reader context only accepts actor')
  }
  if (!isTaskReaderActor(context.actor) || !Object.isFrozen(context.actor)) {
    throw codeError('INVALID_READER_CONTEXT', 'task reader context needs a trusted actor')
  }
  return context.actor
}

function diagnostic(
  domain: TaskDiagnostic['domain'],
  index: unknown,
  code: unknown,
): TaskDiagnostic {
  return {
    domain,
    index: typeof index === 'number' && Number.isSafeInteger(index) ? index : -1,
    code: typeof code === 'string' && code ? code : 'READER_FAILED',
  }
}

function envelope(items: TaskSummary[], skipped: TaskDiagnostic[] = []): ReaderEnvelope {
  const count = Array.isArray(items) ? items.length : 0
  return freeze({
    success: true,
    data: { items: Array.isArray(items) ? items : [] },
    error: null,
    readOnly: true,
    canWrite: false,
    diagnostics: { scanned: count, accepted: count, skipped },
  })
}

function failedEnvelope(code: string): ReaderEnvelope {
  return freeze({
    success: false,
    data: { items: [] },
    error: { code },
    readOnly: true,
    canWrite: false,
  })
}

function actorProvider(actor: TaskReaderActor): () => { actor: TaskReaderActor } {
  return () => ({ actor })
}

function task(input: JsonRecord): TaskSummary {
  try {
    return createTaskSummary(input)
  } catch (error) {
    throw codeError(errorCode(error, 'INVALID_TASK'), 'domain task summary is invalid')
  }
}

function adoptionApplicantReader(context: TaskReaderContext): ReaderEnvelope {
  const actor = assertReaderContext(context)
  if (!actor.roles.includes('applicant')) return envelope([])

  let records: unknown
  try {
    records = getAdoptionRecords({ includeDemo: false })
  } catch (error) {
    return failedEnvelope(errorCode(error, 'ADOPTION_READER_FAILED'))
  }
  if (!Array.isArray(records)) return failedEnvelope('INVALID_READER_RESULT')

  const items: TaskSummary[] = []
  const skipped: TaskDiagnostic[] = []
  records.forEach((record: unknown, index: number) => {
    if (!isPlainRecord(record) || typeof record.id !== 'string' || !record.id) {
      skipped.push(diagnostic('adoption', index, 'MISSING_ID'))
      return
    }
    const read: unknown = readAdoptionApplication(record.id, {
      actorProvider: actorProvider(actor),
      perspective: 'applicant',
    })
    const readData = isPlainRecord(read) && isPlainRecord(read.data) ? read.data : null
    if (!isPlainRecord(read) || read.success !== true || !readData) {
      const code = isPlainRecord(read) ? errorCode(read.error, '') : ''
      if (!['FORBIDDEN', 'NOT_FOUND'].includes(code)) {
        skipped.push(diagnostic('adoption', index, code || 'ADOPTION_READER_FAILED'))
      }
      return
    }
    const status = typeof readData.status === 'string' ? readData.status : ''
    const stage = ADOPTION_APPLICANT_STAGE[status]
    if (!stage) {
      skipped.push(diagnostic('adoption', index, 'UNKNOWN_APPLICATION_STATUS'))
      return
    }
    try {
      items.push(
        task({
          businessType: 'adoption',
          businessId: readData.applicationId,
          actorId: actor.id,
          actorRole: 'applicant',
          actionType: stage.actionType,
          status: stage.status,
        }),
      )
    } catch (error) {
      skipped.push(diagnostic('adoption', index, errorCode(error, 'INVALID_TASK')))
    }
  })
  return envelope(items, skipped)
}

function adoptionReviewReader(context: TaskReaderContext): ReaderEnvelope {
  const actor = assertReaderContext(context)
  if (!actor.roles.some((role) => REVIEW_ROLES.has(role))) return envelope([])

  let result: unknown
  try {
    result = readAdoptionReviewList({ actorProvider: actorProvider(actor) })
  } catch (error) {
    return failedEnvelope(errorCode(error, 'ADOPTION_REVIEW_READER_FAILED'))
  }
  if (!isPlainRecord(result) || !Array.isArray(result.items))
    return failedEnvelope('INVALID_READER_RESULT')

  const items: TaskSummary[] = []
  const skipped: TaskDiagnostic[] = []
  result.items.forEach((item: unknown, index: number) => {
    const statusKey =
      isPlainRecord(item) && typeof item.reviewStatus === 'string' ? item.reviewStatus : ''
    const status = REVIEW_TASK_STATUS[statusKey]
    if (!status) {
      skipped.push(diagnostic('adoption', index, 'UNKNOWN_REVIEW_STATUS'))
      return
    }
    try {
      items.push(
        task({
          businessType: 'adoption',
          businessId: isPlainRecord(item) ? item.applicationId : undefined,
          actorId: actor.id,
          actorRole: isPlainRecord(item) ? item.reviewerRole : undefined,
          actionType: 'review',
          status,
          reviewItemId: isPlainRecord(item) ? item.reviewItemId : undefined,
        }),
      )
    } catch (error) {
      skipped.push(diagnostic('adoption', index, errorCode(error, 'INVALID_TASK')))
    }
  })

  const diagnostics = isPlainRecord(result.diagnostics) ? result.diagnostics : null
  if (diagnostics && Array.isArray(diagnostics.skipped)) {
    for (const item of diagnostics.skipped) {
      if (isPlainRecord(item) && typeof item.code === 'string') {
        skipped.push(diagnostic('adoption', item.index, item.code))
      }
    }
  }
  return envelope(items, skipped)
}

function adoptionReader(context: TaskReaderContext): ReaderEnvelope {
  assertReaderContext(context)
  const applicant = adoptionApplicantReader(context)
  const reviewer = adoptionReviewReader(context)
  return envelope(
    [...applicant.data.items, ...reviewer.data.items],
    [...(applicant.diagnostics?.skipped || []), ...(reviewer.diagnostics?.skipped || [])],
  )
}

function rescueMineReader(context: TaskReaderContext): ReaderEnvelope {
  const actor = assertReaderContext(context)
  if (!actor.roles.includes('applicant')) return envelope([])

  let source: unknown
  try {
    source = readRescueMine({ actorProvider: actorProvider(actor) })
  } catch (error) {
    return failedEnvelope(errorCode(error, 'RESCUE_READER_FAILED'))
  }
  if (!isPlainRecord(source) || !Array.isArray(source.items))
    return failedEnvelope('INVALID_READER_RESULT')

  const items: TaskSummary[] = []
  const skipped: TaskDiagnostic[] = []
  source.items.forEach((item: unknown, index: number) => {
    if (!isPlainRecord(item) || typeof item.rescueId !== 'string' || !item.rescueId) {
      skipped.push(diagnostic('rescue', index, 'MISSING_RESCUE_ID'))
      return
    }
    const state: unknown = readRescueStateById(item.rescueId, { includeDemo: false })
    const stateData = isPlainRecord(state) && isPlainRecord(state.data) ? state.data : null
    const projection = stateData && isPlainRecord(stateData.state) ? stateData.state : null
    if (!isPlainRecord(state) || state.success !== true || !projection) {
      skipped.push(
        diagnostic(
          'rescue',
          index,
          isPlainRecord(state)
            ? errorCode(state.error, 'RESCUE_STATE_READ_FAILED')
            : 'RESCUE_STATE_READ_FAILED',
        ),
      )
      return
    }
    if (projection.validity === 'invalid') {
      skipped.push(diagnostic('rescue', index, 'INVALID_RESCUE_STATE'))
      return
    }
    const status =
      typeof projection.applicationStatus === 'string' ? projection.applicationStatus : ''
    const stage = RESCUE_APPLICANT_STAGE[status]
    if (!stage) {
      skipped.push(diagnostic('rescue', index, 'UNKNOWN_APPLICATION_STATUS'))
      return
    }
    try {
      items.push(
        task({
          businessType: 'rescue',
          businessId: item.rescueId,
          actorId: actor.id,
          actorRole: 'applicant',
          actionType: stage.actionType,
          status: stage.status,
        }),
      )
    } catch (error) {
      skipped.push(diagnostic('rescue', index, errorCode(error, 'INVALID_TASK')))
    }
  })
  return envelope(items, skipped)
}

function rescueReviewReader(context: TaskReaderContext): ReaderEnvelope {
  const actor = assertReaderContext(context)
  if (!actor.roles.includes('reviewer')) return envelope([])

  let source: unknown
  try {
    source = readRescueReviewList({ actorProvider: actorProvider(actor) })
  } catch (error) {
    return failedEnvelope(errorCode(error, 'RESCUE_REVIEW_READER_FAILED'))
  }
  if (!isPlainRecord(source) || !Array.isArray(source.items))
    return failedEnvelope('INVALID_READER_RESULT')

  const items: TaskSummary[] = []
  const skipped: TaskDiagnostic[] = []
  source.items.forEach((item: unknown, index: number) => {
    const statusKey = isPlainRecord(item) && typeof item.status === 'string' ? item.status : ''
    const status = REVIEW_TASK_STATUS[statusKey]
    if (!status) {
      skipped.push(diagnostic('rescue', index, 'UNKNOWN_REVIEW_STATUS'))
      return
    }
    try {
      items.push(
        task({
          businessType: 'rescue',
          businessId: isPlainRecord(item) ? item.rescueId : undefined,
          actorId: actor.id,
          actorRole: 'reviewer',
          actionType: 'review',
          status,
          reviewItemId: isPlainRecord(item) ? item.reviewItemId : undefined,
        }),
      )
    } catch (error) {
      skipped.push(diagnostic('rescue', index, errorCode(error, 'INVALID_TASK')))
    }
  })

  const diagnostics = isPlainRecord(source.diagnostics) ? source.diagnostics : null
  if (diagnostics && Array.isArray(diagnostics.skipped)) {
    for (const item of diagnostics.skipped) {
      if (isPlainRecord(item) && typeof item.code === 'string') {
        skipped.push(diagnostic('rescue', item.index, item.code))
      }
    }
  }
  return envelope(items, skipped)
}

function rescueReader(context: TaskReaderContext): ReaderEnvelope {
  assertReaderContext(context)
  const mine = rescueMineReader(context)
  const review = rescueReviewReader(context)
  return envelope(
    [...mine.data.items, ...review.data.items],
    [...(mine.diagnostics?.skipped || []), ...(review.diagnostics?.skipped || [])],
  )
}

function readPersistedRows(key: string): StorageRead {
  if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') {
    return { rows: [], error: 'READER_MISSING' }
  }
  let raw: unknown
  try {
    raw = uni.getStorageSync(key)
  } catch {
    return { rows: [], error: 'STORAGE_READ_FAILED' }
  }
  if (raw === undefined || raw === null || raw === '') return { rows: [], error: 'READER_MISSING' }
  try {
    const rows: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(rows) ? { rows, error: null } : { rows: [], error: 'INVALID_STORAGE' }
  } catch {
    return { rows: [], error: 'INVALID_STORAGE' }
  }
}

function opaqueId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value === value.trim() &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value) &&
    !/[/?#%]|:\/\//.test(value)
  )
}

function hasAliasConflict(record: JsonRecord, fields: readonly string[]): boolean {
  const values = fields
    .filter((field) => own(record, field))
    .map((field) => record[field])
    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
    .map((value) => value.trim())
  return values.length > 1 && new Set(values).size > 1
}

function feedingPersistentReader(context: TaskReaderContext): ReaderEnvelope {
  const actor = assertReaderContext(context)
  const source = readPersistedRows(FEEDING_KEY)
  if (source.error) return failedEnvelope(source.error)

  const items: TaskSummary[] = []
  const skipped: TaskDiagnostic[] = []
  source.rows.forEach((record, index) => {
    if (!isPlainRecord(record)) {
      skipped.push(diagnostic('feeding', index, 'INVALID_RECORD'))
      return
    }
    if (
      hasAliasConflict(record, ['id', 'orderId']) ||
      hasAliasConflict(record, ['userId', 'userPawId', 'donorId']) ||
      hasAliasConflict(record, ['yardOwnerId', 'ownerPawId'])
    ) {
      skipped.push(diagnostic('feeding', index, 'CONFLICTING_RECORD'))
      return
    }
    const rawId = record.orderId || record.id
    const id = typeof rawId === 'string' ? rawId : ''
    if (!opaqueId(id) || /^demo(?:[-_:]|$)/i.test(id)) {
      skipped.push(diagnostic('feeding', index, 'INVALID_ID'))
      return
    }
    const donor = [record.userId, record.userPawId, record.donorId].includes(actor.id)
    const owner =
      (actor.roles.includes('yard_owner') ||
        actor.roles.includes('owner') ||
        actor.roles.includes('fulfillment_manager')) &&
      [record.yardOwnerId, record.ownerPawId].includes(actor.id)
    if (!donor && !owner) return
    const status = record.feedbackStatus || record.status || record.stateKey
    const normalized: TaskStatus =
      typeof status === 'string' && ['completed', 'fulfilled', 'processed', 'done'].includes(status)
        ? 'completed'
        : typeof status === 'string' &&
            ['active', 'in_progress', 'shipping', 'delivered'].includes(status)
          ? 'in_progress'
          : 'pending'
    try {
      items.push(
        task({
          businessType: 'feeding',
          businessId: id,
          actorId: actor.id,
          actorRole: owner ? 'owner' : 'donor',
          actionType: owner ? 'fulfill' : 'feedback',
          status: normalized,
        }),
      )
    } catch (error) {
      skipped.push(diagnostic('feeding', index, errorCode(error, 'INVALID_TASK')))
    }
  })
  return envelope(items, skipped)
}

function dynamicPersistentReader(context: TaskReaderContext): ReaderEnvelope {
  const actor = assertReaderContext(context)
  const source = readPersistedRows(DYNAMIC_KEY)
  if (source.error) return failedEnvelope(source.error)

  const items: TaskSummary[] = []
  const skipped: TaskDiagnostic[] = []
  source.rows.forEach((record, index) => {
    if (!isPlainRecord(record)) {
      skipped.push(diagnostic('dynamic', index, 'INVALID_RECORD'))
      return
    }
    if (
      hasAliasConflict(record, ['id', 'dynamicId']) ||
      hasAliasConflict(record, ['authorId', 'userId', 'userPawId', 'ownerId']) ||
      hasAliasConflict(record, ['status', 'state'])
    ) {
      skipped.push(diagnostic('dynamic', index, 'CONFLICTING_RECORD'))
      return
    }
    const rawId = record.dynamicId || record.id
    const id = typeof rawId === 'string' ? rawId : ''
    if (!opaqueId(id) || /^demo(?:[-_:]|$)/i.test(id)) {
      skipped.push(diagnostic('dynamic', index, 'INVALID_ID'))
      return
    }
    const owner = [record.authorId, record.userId, record.userPawId, record.ownerId].includes(
      actor.id,
    )
    if (!owner) return
    const status = record.status || record.state
    const normalized: TaskStatus =
      typeof status === 'string' &&
      ['published', 'completed', 'processed', 'deleted'].includes(status)
        ? 'completed'
        : typeof status === 'string' && ['draft', 'pending', 'review'].includes(status)
          ? 'pending'
          : 'in_progress'
    try {
      items.push(
        task({
          businessType: 'dynamic',
          businessId: id,
          actorId: actor.id,
          actorRole: 'author',
          actionType: 'publish',
          status: normalized,
        }),
      )
    } catch (error) {
      skipped.push(diagnostic('dynamic', index, errorCode(error, 'INVALID_TASK')))
    }
  })
  return envelope(items, skipped)
}

/** Return the four account task readers. */
export function createDomainTaskReaders(): Readonly<
  Record<'adoption' | 'rescue' | 'feeding' | 'dynamic', DomainTaskReader>
> {
  return Object.freeze({
    adoption: adoptionReader,
    rescue: rescueReader,
    feeding: feedingPersistentReader,
    dynamic: dynamicPersistentReader,
  })
}

export const getDomainTaskReaders = createDomainTaskReaders
export const buildDomainTaskReaders = createDomainTaskReaders

export { ADOPTION_APPLICANT_STAGE, RESCUE_APPLICANT_STAGE }
