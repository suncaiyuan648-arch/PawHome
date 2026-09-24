/**
 * Read-only rescue list adapter backed by the existing PAWHOME_RESCUES key.
 *
 * The list contract owns actor and record validation. This module only binds
 * that contract to the real rescue storage reader: demo records are always
 * excluded, callers cannot inject records/resolvers, and no write API is
 * exposed here.
 */
import {
  readRescueMine as readRescueMineContract,
  readRescueReviewList as readRescueReviewListContract,
  type RescueListFilter,
} from '../../../navigation/rescueListContract.ts'
import { getRescueRecords } from '../../../utils/rescueStorage.ts'

type JsonRecord = Readonly<Record<string, unknown>>
type RescueListContractModel = ReturnType<typeof readRescueMineContract>
type RescueListResult = RescueListContractModel & { readonly readOnly: true }
export interface RescueListReadOptions {
  readonly actorProvider?: () => unknown
  readonly filter?: RescueListFilter
}

const REAL_RESCUE_READ_OPTIONS = Object.freeze({ includeDemo: false })
const REVIEW_STATUS_VALUES: readonly string[] = Object.freeze(['pending', 'approved', 'rejected'])

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function optionsOf(options: unknown): RescueListReadOptions {
  return isRecord(options) ? options as RescueListReadOptions : {}
}

function readCurrentRescueRecords(context: unknown): unknown[] {
  // The contract resolves the actor before invoking this resolver. Keeping
  // the context intentionally unused prevents storage from treating a query
  // field or a displayed role as an authorization source.
  void context
  return getRescueRecords(REAL_RESCUE_READ_OPTIONS)
}

function explicitReviewStatuses(record: JsonRecord): string[] {
  const values: string[] = []
  const review = isRecord(record.review) ? record.review : null
  const sources: readonly (readonly [JsonRecord | null, string])[] = [
    [record, 'reviewStatus'],
    [record, 'voteStatus'],
    [review, 'status'],
    [review, 'reviewStatus'],
    [review, 'voteStatus'],
  ]
  for (const [source, field] of sources) {
    if (!source || !Object.prototype.hasOwnProperty.call(source, field) || source[field] === undefined) continue
    const value = String(source[field]).trim()
    if (!values.includes(value)) values.push(value)
  }
  return values
}

function adaptReviewRecord(record: unknown): unknown {
  if (!isRecord(record) || !Object.prototype.hasOwnProperty.call(record, 'status')) return record
  const legacyStatus = record.status === undefined || record.status === null ? '' : String(record.status).trim()
  const explicit = explicitReviewStatuses(record)
  // rescueStorage keeps a legacy status field on every normalized record. If
  // an explicit review alias repeats that same value, remove only the
  // redundant compatibility alias; disagreement remains in the record so the
  // canonical contract rejects it instead of repairing a conflict.
  if (explicit.length === 1 && explicit[0] === legacyStatus && REVIEW_STATUS_VALUES.includes(legacyStatus)) {
    const copy = { ...record }
    delete copy.status
    return copy
  }
  return record
}

function readCurrentReviewRecords(context: unknown): unknown[] {
  return readCurrentRescueRecords(context).map(adaptReviewRecord)
}

function readOnlyModel(model: RescueListContractModel): RescueListResult {
  return Object.freeze({
    ...model,
    readOnly: true,
    canWrite: false,
  })
}

function errorCode(error: unknown): string {
  if (error !== null && typeof error === 'object' && 'code' in error && typeof error.code === 'string' && error.code) {
    return error.code
  }
  return 'RESCUE_LIST_READ_FAILED'
}

function failedReadModel(error: unknown): RescueListResult {
  const items = Object.freeze([])
  return Object.freeze({
    actor: null,
    items,
    pending: items,
    processed: items,
    readOnly: true,
    canWrite: false,
    diagnostics: Object.freeze({
      scanned: 0,
      accepted: 0,
      skipped: items,
      actorError: Object.freeze({ code: errorCode(error) }),
    }),
  })
}

function safelyRead(read: () => RescueListContractModel): RescueListResult {
  try {
    return readOnlyModel(read())
  } catch (error) {
    // A malformed filter or an unexpected contract boundary error must not
    // become a partial list or an implicit authorization result.
    return failedReadModel(error)
  }
}

/** Read the current actor's own rescue applications from real storage. */
export function readRescueMine(options: RescueListReadOptions = {}): RescueListResult {
  const source = optionsOf(options)
  return safelyRead(() => readRescueMineContract({
    actorProvider: source.actorProvider,
    filter: source.filter,
    resolver: readCurrentRescueRecords,
  }))
}

/** Read rescue review tasks explicitly assigned to the current reviewer. */
export function readRescueReviewList(options: RescueListReadOptions = {}): RescueListResult {
  const source = optionsOf(options)
  return safelyRead(() => readRescueReviewListContract({
    actorProvider: source.actorProvider,
    filter: source.filter,
    resolver: readCurrentReviewRecords,
  }))
}

export const getRescueMine = readRescueMine
export const getRescueReviewList = readRescueReviewList
