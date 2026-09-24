/**
 * Local rescue-review read/write boundary.
 *
 * This adapter intentionally has no navigation or domain-storage imports. It
 * binds the already agreed PAWHOME_RESCUES storage shape only at this
 * subpackage boundary, and accepts reader/writer injections for governance and
 * future server integration. Review writes are limited to the review axis;
 * funding and payment state are never accepted as an action.
 */

type JsonRecord = Record<string, unknown>
export type RescueReviewActorProvider = () => unknown
export type RescueReviewStatus = 'pending' | 'approved' | 'rejected'
export type RescueReviewOutcome = Exclude<RescueReviewStatus, 'pending'>
export type RescueReviewFilter = 'all' | 'pending' | 'processed' | 'approved' | 'rejected'
export type RescueReviewRecord = Readonly<Record<string, unknown>>

export interface RescueReviewSession {
  readonly sessionId: string
  readonly actorId: string
  readonly roles: readonly string[]
}

type ActorProvider = RescueReviewActorProvider
type ReviewSession = RescueReviewSession
type ReviewStatus = RescueReviewStatus
type ReviewOutcome = RescueReviewOutcome
type ReviewFilter = RescueReviewFilter

export type RescueReviewReader = (
  context: Readonly<{ actor: RescueReviewSession }>,
) => readonly RescueReviewRecord[]

export interface RescueReviewWriterContext {
  readonly records: readonly RescueReviewRecord[]
  readonly current: RescueReviewRecord
  readonly next: RescueReviewRecord
  readonly actor: RescueReviewSession
  readonly action: RescueReviewOutcome
  readonly idempotencyKey: string
}

export type RescueReviewWriter = (context: Readonly<RescueReviewWriterContext>) => void

interface RescueReviewReadOptions {
  readonly actorProvider?: RescueReviewActorProvider
  readonly reader?: RescueReviewReader
}

export interface RescueReviewListOptions extends RescueReviewReadOptions {
  readonly filter?: RescueReviewFilter
}

export interface RescueReviewDetailOptions extends RescueReviewReadOptions {
  readonly reviewItemId: string
  readonly rescueId?: string
}

type RescueReviewOutcomeOption =
  | { readonly outcome: RescueReviewOutcome; readonly action?: never; readonly status?: never }
  | { readonly action: RescueReviewOutcome; readonly outcome?: never; readonly status?: never }
  | { readonly status: RescueReviewOutcome; readonly outcome?: never; readonly action?: never }

type RescueReviewActionIdentity =
  | { readonly idempotencyKey: string; readonly requestId?: string }
  | { readonly requestId: string; readonly idempotencyKey?: string }

export type RescueReviewActionOptions = RescueReviewReadOptions &
  Omit<RescueReviewDetailOptions, keyof RescueReviewReadOptions> &
  RescueReviewOutcomeOption &
  RescueReviewActionIdentity & { readonly writer?: RescueReviewWriter; readonly now?: string }

type ReviewReader = RescueReviewReader
type ReviewWriter = RescueReviewWriter

interface ReviewOptions extends JsonRecord {
  readonly actorProvider?: unknown
  readonly reader?: unknown
  readonly writer?: unknown
  readonly filter?: unknown
  readonly reviewItemId?: unknown
  readonly rescueId?: unknown
  readonly outcome?: unknown
  readonly action?: unknown
  readonly status?: unknown
  readonly idempotencyKey?: unknown
  readonly requestId?: unknown
  readonly now?: unknown
}

interface ReviewSkip extends JsonRecord {
  readonly index: number
  readonly code: string
}

interface ReviewActor {
  readonly id: string
  readonly roles: readonly string[]
}

interface ReviewItem extends JsonRecord {
  readonly rescueId: string
  readonly reviewItemId: string
  readonly status: ReviewStatus
  readonly reviewerId: string
  readonly summary?: string | number | boolean
  readonly description?: string | number | boolean
  readonly detail?: string | number | boolean
  readonly amount?: string | number | boolean
  readonly createdLabel?: string | number | boolean
  readonly ownerName?: string | number | boolean
  readonly applicationStatus?: string | number | boolean
  readonly media?: readonly string[]
}

interface ReviewListDiagnostics {
  readonly scanned: number
  readonly accepted: number
  readonly skipped: readonly JsonRecord[]
  readonly actorError: JsonRecord | null
}

export interface RescueReviewListResult {
  readonly actor: ReviewActor | null
  readonly items: readonly ReviewItem[]
  readonly pending: readonly ReviewItem[]
  readonly processed: readonly ReviewItem[]
  readonly canWrite: boolean
  readonly readOnly: boolean
  readonly diagnostics: ReviewListDiagnostics
}

interface ReviewDetailFailure {
  readonly actor: null
  readonly item: null
  readonly canRead: false
  readonly canWrite: false
  readonly readOnly: true
  readonly reason: string
  readonly diagnostics: Readonly<{ actorError: Readonly<{ code: string }> }>
}

interface ReviewDetailSuccess {
  readonly actor: ReviewActor
  readonly item: ReviewItem
  readonly record: JsonRecord
  readonly canRead: true
  readonly canWrite: boolean
  readonly readOnly: false
  readonly reason: ''
}

export type RescueReviewDetailResult = ReviewDetailFailure | ReviewDetailSuccess

export interface RescueReviewActionResult {
  readonly success: true
  readonly duplicate: boolean
  readonly wrote: boolean
  readonly rescueId: string
  readonly reviewItemId: string
  readonly fromStatus: ReviewStatus
  readonly toStatus: ReviewOutcome | ReviewStatus
  readonly actorId: string
  readonly idempotencyKey: string
  readonly fundingChanged: false
}

interface PreviousAction {
  readonly actionId: string
  readonly outcome: ReviewOutcome
}

const RESCUE_STORAGE_KEY = 'PAWHOME_RESCUES'
const ACTOR_SESSION_STORAGE_KEY = 'PAWHOME_ACTOR_SESSION'
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const REVIEW_STATUSES: readonly ReviewStatus[] = Object.freeze(['pending', 'approved', 'rejected'])
const REVIEW_ACTIONS: readonly ReviewOutcome[] = Object.freeze(['approved', 'rejected'])
const REVIEW_FILTERS: readonly ReviewFilter[] = Object.freeze([
  'all',
  'pending',
  'processed',
  'approved',
  'rejected',
])
const REVIEW_TRANSITIONS = Object.freeze({
  pending: Object.freeze(['approved', 'rejected']),
  approved: Object.freeze([]),
  rejected: Object.freeze([]),
})
const FUNDING_ACTIONS: ReadonlySet<string> = new Set([
  'paid',
  'unpaid',
  'funding_pending',
  'funding_failed',
  'funding_paid',
])
const CROSS_DOMAIN_PREFIXES: readonly string[] = Object.freeze([
  'adoption',
  'feeding',
  'order',
  'dynamic',
  'yard',
  'animal',
])

export class RescueReviewActionError extends Error {
  readonly code: string
  readonly details: JsonRecord

  constructor(code: string, message: string, details: JsonRecord = {}) {
    super(message)
    this.name = 'RescueReviewActionError'
    this.code = code
    this.details = details
  }
}

function fail(code: string, message: string, details: unknown = {}): never {
  throw new RescueReviewActionError(code, message, isRecord(details) ? details : {})
}

function own(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim()
}

function id(value: unknown, label: string, options: Readonly<{ required?: boolean }> = {}): string {
  const result = text(value)
  if (!result) {
    if (options.required) fail('MISSING_ID', `${label} is required`)
    return ''
  }
  if (!SAFE_ID.test(result)) fail('INVALID_ID', `${label} must be an opaque ID`)
  const lower = result.toLowerCase()
  if (
    CROSS_DOMAIN_PREFIXES.some(
      (prefix) =>
        lower === prefix ||
        lower.startsWith(`${prefix}-`) ||
        lower.startsWith(`${prefix}_`) ||
        lower.startsWith(`${prefix}:`),
    )
  ) {
    fail('CROSS_DOMAIN_ID', `${label} belongs to another domain`)
  }
  return result
}

function freeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (!value || typeof value !== 'object' || seen.has(value)) return value
  seen.add(value)
  Object.keys(value).forEach((key) => freeze(Reflect.get(value, key), seen))
  return Object.freeze(value)
}

function safeError(error: unknown, fallback: string): string {
  return isRecord(error) && typeof error.code === 'string' && error.code ? error.code : fallback
}

function emptyList(code: string): RescueReviewListResult {
  const items: readonly ReviewItem[] = Object.freeze([])
  const skipped: readonly JsonRecord[] = Object.freeze([])
  return Object.freeze({
    actor: null,
    items,
    pending: items,
    processed: items,
    canWrite: false,
    readOnly: true,
    diagnostics: Object.freeze({
      scanned: 0,
      accepted: 0,
      skipped,
      actorError: Object.freeze({ code }),
    }),
  })
}

function emptyDetail(code: string): ReviewDetailFailure {
  return Object.freeze({
    actor: null,
    item: null,
    canRead: false,
    canWrite: false,
    readOnly: true,
    reason: code,
    diagnostics: Object.freeze({ actorError: Object.freeze({ code }) }),
  })
}

function isActorProvider(value: unknown): value is ActorProvider {
  return typeof value === 'function'
}

function isReviewReader(value: unknown): value is ReviewReader {
  return typeof value === 'function'
}

function isReviewWriter(value: unknown): value is ReviewWriter {
  return typeof value === 'function'
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return isRecord(value) && typeof value.then === 'function'
}

function isReviewStatus(value: string): value is ReviewStatus {
  return REVIEW_STATUSES.some((candidate) => candidate === value)
}

function isReviewOutcome(value: string): value is ReviewOutcome {
  return REVIEW_ACTIONS.some((candidate) => candidate === value)
}

function isReviewFilter(value: string): value is ReviewFilter {
  return REVIEW_FILTERS.some((candidate) => candidate === value)
}

/** The only actor source used by the production pages in this subpackage. */
export function createReviewSessionProvider(): ActorProvider {
  return () => {
    if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') return null
    try {
      return uni.getStorageSync(ACTOR_SESSION_STORAGE_KEY) || null
    } catch {
      return null
    }
  }
}

function resolveTrustedReviewSessionInput(actorProvider: unknown): ReviewSession {
  if (!isActorProvider(actorProvider))
    fail('ACTOR_PROVIDER_REQUIRED', 'A trusted session provider is required')
  let supplied: unknown
  try {
    supplied = actorProvider()
  } catch {
    fail('ACTOR_PROVIDER_FAILED', 'The trusted session provider failed')
  }
  if (!isRecord(supplied)) fail('NO_SESSION', 'A trusted reviewer session is required')
  const sessionId = id(supplied.sessionId || supplied.id, 'sessionId', { required: true })
  const actor = isRecord(supplied.actor) ? supplied.actor : null
  if (!actor) fail('NO_ACTOR', 'The trusted session has no actor')
  const actorId = id(actor.id || actor.actorId, 'actorId', { required: true })
  const roles = Array.isArray(actor.roles)
    ? actor.roles.map(text).filter(Boolean)
    : [text(actor.role)].filter(Boolean)
  if (!roles.includes('reviewer'))
    fail('REVIEWER_ROLE_REQUIRED', 'The trusted actor is not a reviewer')
  return freeze({ sessionId, actorId, roles: Array.from(new Set(roles)) })
}

/** Resolve a fresh, session-backed reviewer. Query parameters are not read. */
export function resolveTrustedReviewSession(
  actorProvider: RescueReviewActorProvider,
): ReviewSession {
  return resolveTrustedReviewSessionInput(actorProvider)
}

function relationIds(record: JsonRecord): string[] {
  const review = isRecord(record.review) ? record.review : null
  const values: string[][] = []
  const sources: Array<readonly [JsonRecord | null, string]> = [
    [record, 'reviewerId'],
    [record, 'reviewerIds'],
    [review, 'reviewerId'],
    [review, 'reviewerIds'],
  ]
  for (const [source, field] of sources) {
    if (!source || !own(source, field) || source[field] === undefined) continue
    const raw = Array.isArray(source[field]) ? source[field] : [source[field]]
    if (!raw.length) fail('MISSING_REVIEWER_RELATION', 'Reviewer relation is empty')
    const current = raw.map((value) => id(value, `reviewer relation ${field}`, { required: true }))
    values.push(Array.from(new Set(current)).sort())
  }
  if (!values.length) fail('MISSING_REVIEWER_RELATION', 'A review item must identify its reviewer')
  const first = JSON.stringify(values[0])
  if (values.some((value) => JSON.stringify(value) !== first))
    fail('CONFLICTING_REVIEWER_RELATION', 'Reviewer relation aliases disagree')
  return values[0]
}

function reviewItemIdFor(record: JsonRecord): string {
  const review = isRecord(record.review) ? record.review : null
  const values: string[] = []
  const sources: Array<readonly [JsonRecord | null, string]> = [
    [record, 'reviewItemId'],
    [review, 'reviewItemId'],
  ]
  for (const [source, field] of sources) {
    if (source && own(source, field) && source[field] !== undefined)
      values.push(id(source[field], `review ${field}`, { required: true }))
  }
  if (!values.length) fail('MISSING_REVIEW_ITEM_ID', 'A review item must identify reviewItemId')
  if (new Set(values).size !== 1)
    fail('CONFLICTING_REVIEW_ITEM_ID', 'reviewItemId aliases disagree')
  return values[0]
}

function rescueIdFor(record: JsonRecord): string {
  const values: string[] = []
  if (own(record, 'rescueId')) values.push(id(record.rescueId, 'rescueId', { required: true }))
  if (own(record, 'id')) values.push(id(record.id, 'record.id', { required: true }))
  const nonEmpty = values.filter(Boolean)
  if (!nonEmpty.length) fail('MISSING_RESCUE_ID', 'A review item must identify rescueId')
  if (new Set(nonEmpty).size !== 1) fail('CONFLICTING_RESCUE_ID', 'rescueId aliases disagree')
  return nonEmpty[0]
}

function statusFor(record: JsonRecord): ReviewStatus {
  const review = isRecord(record.review) ? record.review : null
  const values: ReviewStatus[] = []
  const fields: Array<readonly [JsonRecord | null, string]> = [
    [record, 'reviewStatus'],
    [record, 'voteStatus'],
    [review, 'status'],
    [review, 'reviewStatus'],
    [review, 'voteStatus'],
  ]
  for (const [source, field] of fields) {
    if (!source || !own(source, field) || source[field] === undefined) continue
    const value = text(source[field])
    if (!isReviewStatus(value))
      fail('INVALID_REVIEW_STATUS', 'Review status is not in the whitelist')
    values.push(value)
  }
  // Existing rescue records use the legacy `status` field for review state.
  // Funding aliases are deliberately rejected instead of becoming a review.
  if (own(record, 'status') && record.status !== undefined) {
    const value = text(record.status)
    if (FUNDING_ACTIONS.has(value))
      fail('FUNDING_STATE_NOT_REVIEW', 'Funding state cannot authorize a review action')
    if (!isReviewStatus(value))
      fail('INVALID_REVIEW_STATUS', 'Review status is not in the whitelist')
    values.push(value)
  }
  if (!values.length) fail('MISSING_REVIEW_STATUS', 'A review item must identify its review status')
  if (new Set(values).size !== 1)
    fail('CONFLICTING_REVIEW_STATUS', 'Review status aliases disagree')
  return values[0]
}

function reviewDescriptor(record: JsonRecord, session: ReviewSession): ReviewItem {
  const reviewItemId = reviewItemIdFor(record)
  const rescueId = rescueIdFor(record)
  const reviewers = relationIds(record)
  if (!reviewers.includes(session.actorId))
    fail('ACTOR_MISMATCH', 'Review item does not belong to the trusted reviewer')
  const status = statusFor(record)
  const metadata: JsonRecord = {}
  for (const field of [
    'summary',
    'description',
    'detail',
    'amount',
    'createdAt',
    'createdLabel',
    'ownerName',
    'ownerAvatar',
    'applicationStatus',
    'yardName',
  ]) {
    const value = record[field]
    if (
      own(record, field) &&
      (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    )
      metadata[field] = value
  }
  const mediaValue = Array.isArray(record.mediaPaths)
    ? record.mediaPaths
    : Array.isArray(record.media)
      ? record.media
      : []
  const media = mediaValue.filter((value): value is string => typeof value === 'string').slice(0, 6)
  if (media.length) metadata.media = media
  return freeze({ rescueId, reviewItemId, status, reviewerId: session.actorId, ...metadata })
}

function readStorageRecords(): JsonRecord[] {
  if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') return []
  try {
    const raw: unknown = uni.getStorageSync(RESCUE_STORAGE_KEY)
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(parsed) ? parsed.filter(isRecord) : []
  } catch {
    return []
  }
}

function writeStorageRecords(records: readonly JsonRecord[]): void {
  if (typeof uni === 'undefined' || !uni || typeof uni.setStorageSync !== 'function')
    fail('STORAGE_WRITE_UNAVAILABLE', 'Rescue review storage is unavailable')
  uni.setStorageSync(RESCUE_STORAGE_KEY, JSON.stringify(records))
}

function readRecords(options: ReviewOptions, context: ReviewSession): JsonRecord[] {
  let reader: ReviewReader | null = null
  if (options.reader !== undefined) {
    if (!isReviewReader(options.reader)) fail('INVALID_READER', 'Review reader must be a function')
    reader = options.reader
  }
  const result: unknown = reader ? reader(Object.freeze({ actor: context })) : readStorageRecords()
  if (isPromiseLike(result))
    fail('ASYNC_READER_UNSUPPORTED', 'Review reader must return synchronously')
  if (!Array.isArray(result)) fail('INVALID_READER_RESULT', 'Review reader must return an array')
  return result.filter(isRecord)
}

function findReviewRecord(
  records: readonly JsonRecord[],
  expectedReviewItemId: unknown,
  expectedRescueId: unknown,
): JsonRecord | null {
  const reviewItemId = id(expectedReviewItemId, 'reviewItemId', { required: true })
  const rescueId = expectedRescueId ? id(expectedRescueId, 'rescueId') : ''
  return (
    records.find((record) => {
      try {
        if (reviewItemIdFor(record) !== reviewItemId) return false
        return !rescueId || rescueIdFor(record) === rescueId
      } catch {
        return false
      }
    }) || null
  )
}

function idempotencyFor(record: JsonRecord): PreviousAction | null {
  const review = isRecord(record.review) ? record.review : null
  const action = review && isRecord(review.lastAction) ? review.lastAction : null
  if (!action) return null
  const actionId = text(action.idempotencyKey || action.actionId)
  const outcome = text(action.outcome || action.status)
  return actionId && isReviewOutcome(outcome) ? { actionId, outcome } : null
}

function nextRecordFor(
  record: JsonRecord,
  outcome: ReviewOutcome,
  session: ReviewSession,
  actionId: string,
  actionAt: string,
): JsonRecord {
  const next: JsonRecord = { ...record }
  const existingReview: JsonRecord = isRecord(record.review) ? { ...record.review } : {}
  const hadNestedReview = isRecord(record.review)
  const hadReviewStatus = own(record, 'reviewStatus')
  const hadVoteStatus = own(record, 'voteStatus')
  const legacyStatus = text(record.status)
  const lastAction = {
    idempotencyKey: actionId,
    outcome,
    actorId: session.actorId,
    sessionId: session.sessionId,
    at: actionAt,
  }
  if (hadReviewStatus) next.reviewStatus = outcome
  if (hadVoteStatus) next.voteStatus = outcome
  if (hadNestedReview || (!hadReviewStatus && !hadVoteStatus && isReviewStatus(legacyStatus))) {
    existingReview.status = outcome
    existingReview.lastAction = lastAction
    next.review = existingReview
  }
  if (!hadReviewStatus && !hadVoteStatus && isReviewStatus(legacyStatus)) next.status = outcome
  if (!hadNestedReview && (hadReviewStatus || hadVoteStatus)) {
    next.review = { reviewItemId: reviewItemIdFor(record), status: outcome, lastAction }
  }
  if (!next.review)
    next.review = { reviewItemId: reviewItemIdFor(record), status: outcome, lastAction }
  return next
}

function writeReviewRecord(
  options: ReviewOptions,
  records: readonly JsonRecord[],
  current: JsonRecord,
  next: JsonRecord,
  context: Pick<RescueReviewWriterContext, 'actor' | 'action' | 'idempotencyKey'>,
): void {
  if (options.writer !== undefined) {
    if (!isReviewWriter(options.writer)) fail('INVALID_WRITER', 'Review writer must be a function')
    const result: unknown = options.writer(Object.freeze({ records, current, next, ...context }))
    if (isPromiseLike(result))
      fail('ASYNC_WRITER_UNSUPPORTED', 'Review writer must return synchronously')
    return
  }
  const currentId = rescueIdFor(current)
  const updated = records.map((item) => {
    try {
      return rescueIdFor(item) === currentId ? next : item
    } catch {
      return item
    }
  })
  writeStorageRecords(updated)
}

function actionOutcome(value: unknown): ReviewOutcome {
  const result = text(value)
  if (FUNDING_ACTIONS.has(result))
    fail('PAYMENT_ACTION_FORBIDDEN', 'Funding and payment actions are outside rescue review')
  if (!isReviewOutcome(result))
    fail('INVALID_REVIEW_ACTION', 'Review action must approve or reject')
  return result
}

function actionKey(value: unknown): string {
  const result = id(value, 'idempotencyKey', { required: true })
  if (result.length > 128) fail('VALUE_TOO_LONG', 'idempotencyKey is too long')
  return result
}

function cloneValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneValue)
  if (!isRecord(value)) return value
  const output: JsonRecord = {}
  for (const key of Object.keys(value)) output[key] = cloneValue(value[key])
  return output
}

function cloneRecord(record: JsonRecord): JsonRecord {
  const cloned = cloneValue(record)
  return isRecord(cloned) ? cloned : {}
}

export function readRescueReviewList(
  options: RescueReviewListOptions = {},
): RescueReviewListResult {
  const source: ReviewOptions = isRecord(options) ? options : {}
  let session: ReviewSession
  try {
    session = resolveTrustedReviewSessionInput(source.actorProvider)
  } catch (error) {
    return emptyList(safeError(error, 'REVIEW_READ_DENIED'))
  }
  let records: JsonRecord[]
  try {
    records = readRecords(source, session)
  } catch (error) {
    return emptyList(safeError(error, 'REVIEW_READ_FAILED'))
  }
  const filterValue = source.filter === undefined ? 'pending' : text(source.filter)
  if (!isReviewFilter(filterValue)) return emptyList('INVALID_STATUS_FILTER')
  const skipped: ReviewSkip[] = []
  const items: ReviewItem[] = []
  records.forEach((record, index) => {
    try {
      const item = reviewDescriptor(record, session)
      const visible =
        filterValue === 'all' ||
        (filterValue === 'pending' && item.status === 'pending') ||
        (filterValue === 'processed' && item.status !== 'pending') ||
        item.status === filterValue
      if (visible) items.push(item)
    } catch (error) {
      skipped.push({ index, code: safeError(error, 'INVALID_RECORD') })
    }
  })
  const pending = items.filter((item) => item.status === 'pending')
  const processed = items.filter((item) => item.status !== 'pending')
  return Object.freeze({
    actor: Object.freeze({ id: session.actorId, roles: session.roles }),
    items: Object.freeze(items),
    pending: Object.freeze(pending),
    processed: Object.freeze(processed),
    canWrite: true,
    readOnly: false,
    diagnostics: Object.freeze({
      scanned: records.length,
      accepted: items.length,
      skipped: Object.freeze(skipped),
      actorError: null,
    }),
  })
}

export function readRescueReviewDetail(): RescueReviewDetailResult
export function readRescueReviewDetail(options: RescueReviewDetailOptions): RescueReviewDetailResult
export function readRescueReviewDetail(
  options?: RescueReviewDetailOptions,
): RescueReviewDetailResult {
  const source: ReviewOptions = isRecord(options) ? options : {}
  let session: ReviewSession
  try {
    session = resolveTrustedReviewSessionInput(source.actorProvider)
  } catch (error) {
    return emptyDetail(safeError(error, 'REVIEW_READ_DENIED'))
  }
  try {
    const records = readRecords(source, session)
    const record = findReviewRecord(records, source.reviewItemId, source.rescueId)
    if (!record) return emptyDetail('NOT_FOUND')
    const item = reviewDescriptor(record, session)
    return Object.freeze({
      actor: Object.freeze({ id: session.actorId, roles: session.roles }),
      item,
      record: freeze(cloneRecord(record)),
      canRead: true,
      canWrite: item.status === 'pending',
      readOnly: false,
      reason: '',
    })
  } catch (error) {
    return emptyDetail(safeError(error, 'REVIEW_READ_FAILED'))
  }
}

export function applyRescueReviewAction(): RescueReviewActionResult
export function applyRescueReviewAction(
  options: RescueReviewActionOptions,
): RescueReviewActionResult
export function applyRescueReviewAction(
  options?: RescueReviewActionOptions,
): RescueReviewActionResult {
  const source: ReviewOptions = isRecord(options) ? options : {}
  const session = resolveTrustedReviewSessionInput(source.actorProvider)
  const outcome = actionOutcome(source.outcome || source.action || source.status)
  const actionId = actionKey(source.idempotencyKey || source.requestId)
  const records = readRecords(source, session)
  const current = findReviewRecord(records, source.reviewItemId, source.rescueId)
  if (!current) fail('NOT_FOUND', 'Review item was not found')
  const item = reviewDescriptor(current, session)
  const previousAction = idempotencyFor(current)
  if (previousAction && previousAction.actionId === actionId) {
    if (previousAction.outcome !== outcome)
      fail('IDEMPOTENCY_CONFLICT', 'Idempotency key was used for another outcome')
    return freeze({
      success: true,
      duplicate: true,
      wrote: false,
      rescueId: item.rescueId,
      reviewItemId: item.reviewItemId,
      fromStatus: item.status,
      toStatus: item.status,
      actorId: session.actorId,
      idempotencyKey: actionId,
      fundingChanged: false,
    })
  }
  const allowed: readonly string[] = REVIEW_TRANSITIONS[item.status]
  if (!allowed.includes(outcome))
    fail('INVALID_TRANSITION', 'Only pending reviews may be approved or rejected')
  const actionAt = source.now === undefined ? new Date().toISOString() : text(source.now)
  if (!actionAt) fail('INVALID_TIMESTAMP', 'Review action timestamp is required')
  const next = nextRecordFor(current, outcome, session, actionId, actionAt)
  writeReviewRecord(source, records, current, next, {
    actor: session,
    action: outcome,
    idempotencyKey: actionId,
  })
  return freeze({
    success: true,
    duplicate: false,
    wrote: true,
    rescueId: item.rescueId,
    reviewItemId: item.reviewItemId,
    fromStatus: item.status,
    toStatus: outcome,
    actorId: session.actorId,
    idempotencyKey: actionId,
    fundingChanged: false,
  })
}

export const REVIEW_STATUS_VALUES = REVIEW_STATUSES
export const REVIEW_ACTION_VALUES = REVIEW_ACTIONS
export const RESCUE_REVIEW_TRANSITIONS = REVIEW_TRANSITIONS
export const getRescueReviewList = readRescueReviewList
export const getRescueReviewDetail = readRescueReviewDetail
export const transitionRescueReview = applyRescueReviewAction
