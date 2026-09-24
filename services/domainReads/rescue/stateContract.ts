/**
 * Read-only contract for the three independent rescue state axes.
 *
 * This module deliberately has no Vue, uni-app, page, or storage dependency.
 * It consumes a rescue record, including the legacy rescueStorage shape, and
 * returns a defensive projection. It does not perform state transitions or
 * grant any funding capability.
 */

type JsonRecord = Readonly<Record<string, unknown>>
type AxisName = 'application' | 'review' | 'funding'
type StateValidity = 'valid' | 'unknown' | 'invalid'
type ParseCode = 'OK' | 'STATE_UNKNOWN' | 'INVALID_JSON' | 'INVALID_RECORD'
type ApplicationStatus = 'platform_pending' | 'platform_approved' | 'platform_rejected' | 'unknown'
type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'unknown'
type FundingStatus = 'funding_pending' | 'funding_failed' | 'funding_paid' | 'unknown'
type ReviewKnownStatus = Exclude<ReviewStatus, 'unknown'>
type FundingKnownStatus = Exclude<FundingStatus, 'unknown'>

interface StateFieldDefinition {
  readonly axis: AxisName
  readonly canonical: string
  readonly values: readonly string[]
  readonly sources: readonly string[]
}

export interface RescueStateError {
  readonly axis: AxisName
  readonly code: string
  readonly fields: readonly string[]
  readonly message: string
}

interface AxisResult<T extends string> {
  status: T | typeof UNKNOWN_STATE
  source: string | null
  known: boolean
  supplied: boolean
}

interface AxisView<T extends string> {
  status: T
  known: boolean
  source: string | null
}

interface FundingView extends AxisView<FundingStatus> {
  paid: boolean | null
  displayStatus: FundingStatus
}

interface RescueStateCapabilities {
  canWriteFunding: false
  canTransitionFunding: false
}

export interface RescueStateProjection {
  readonly validity: StateValidity
  readonly applicationStatus: ApplicationStatus
  readonly reviewStatus: ReviewStatus
  readonly voteStatus: ReviewStatus
  readonly fundingStatus: FundingStatus
  readonly application: AxisView<ApplicationStatus>
  readonly review: AxisView<ReviewStatus>
  readonly vote: AxisView<ReviewStatus>
  readonly funding: FundingView
  readonly capabilities: RescueStateCapabilities
  readonly errors: readonly RescueStateError[]
}

export interface RescueStateParseResult {
  readonly ok: boolean
  readonly code: ParseCode
  readonly state: RescueStateProjection
  readonly error: string
}

interface Candidate {
  field: string
  value: string
}

interface AxisConfig<T extends string> {
  axis: AxisName
  paths: readonly string[]
  aliases: Readonly<Record<string, T>>
  values: ReadonlySet<T>
}

interface AxisResolution<T extends string> {
  result: AxisResult<T>
  errors: RescueStateError[]
}

export const UNKNOWN_STATE = 'unknown'

export const RESCUE_APPLICATION_STATUS: Readonly<{
  pending: 'platform_pending'
  approved: 'platform_approved'
  rejected: 'platform_rejected'
  unknown: 'unknown'
}> = Object.freeze({
  pending: 'platform_pending',
  approved: 'platform_approved',
  rejected: 'platform_rejected',
  unknown: UNKNOWN_STATE,
})

export const RESCUE_REVIEW_STATUS: Readonly<{
  pending: 'pending'
  approved: 'approved'
  rejected: 'rejected'
  unknown: 'unknown'
}> = Object.freeze({
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  unknown: UNKNOWN_STATE,
})

export const RESCUE_FUNDING_STATUS: Readonly<{
  pending: 'funding_pending'
  failed: 'funding_failed'
  paid: 'funding_paid'
  unknown: 'unknown'
}> = Object.freeze({
  pending: 'funding_pending',
  failed: 'funding_failed',
  paid: 'funding_paid',
  unknown: UNKNOWN_STATE,
})

export const RESCUE_STATE_FIELD_DICTIONARY: Readonly<
  Record<'applicationStatus' | 'reviewStatus' | 'fundingStatus', StateFieldDefinition>
> = Object.freeze({
  applicationStatus: Object.freeze({
    axis: 'application',
    canonical: 'applicationStatus',
    values: Object.freeze(['platform_pending', 'platform_approved', 'platform_rejected']),
    sources: Object.freeze(['applicationStatus', 'application.status']),
  }),
  reviewStatus: Object.freeze({
    axis: 'review',
    canonical: 'review.status',
    values: Object.freeze(['pending', 'approved', 'rejected']),
    sources: Object.freeze([
      'reviewStatus',
      'review.status',
      'voteStatus',
      'vote.status',
      'status[pending|rejected]',
    ]),
  }),
  fundingStatus: Object.freeze({
    axis: 'funding',
    canonical: 'funding.status',
    values: Object.freeze(['funding_pending', 'funding_failed', 'funding_paid']),
    sources: Object.freeze([
      'fundingStatus',
      'funding.status',
      'fundingOutcome',
      'status[unpaid|paid]',
    ]),
  }),
})

const APPLICATION_VALUES: ReadonlySet<ApplicationStatus> = new Set([
  RESCUE_APPLICATION_STATUS.pending,
  RESCUE_APPLICATION_STATUS.approved,
  RESCUE_APPLICATION_STATUS.rejected,
])

const REVIEW_VALUES: ReadonlySet<ReviewStatus> = new Set([
  RESCUE_REVIEW_STATUS.pending,
  RESCUE_REVIEW_STATUS.approved,
  RESCUE_REVIEW_STATUS.rejected,
])

const FUNDING_VALUES: ReadonlySet<FundingStatus> = new Set([
  RESCUE_FUNDING_STATUS.pending,
  RESCUE_FUNDING_STATUS.failed,
  RESCUE_FUNDING_STATUS.paid,
])

const APPLICATION_ALIASES: Readonly<Record<string, ApplicationStatus>> = Object.freeze({
  platform_pending: RESCUE_APPLICATION_STATUS.pending,
  platform_approved: RESCUE_APPLICATION_STATUS.approved,
  platform_rejected: RESCUE_APPLICATION_STATUS.rejected,
})

const REVIEW_ALIASES: Readonly<Record<string, ReviewStatus>> = Object.freeze({
  pending: RESCUE_REVIEW_STATUS.pending,
  review_pending: RESCUE_REVIEW_STATUS.pending,
  vote_pending: RESCUE_REVIEW_STATUS.pending,
  approved: RESCUE_REVIEW_STATUS.approved,
  review_approved: RESCUE_REVIEW_STATUS.approved,
  vote_approved: RESCUE_REVIEW_STATUS.approved,
  rejected: RESCUE_REVIEW_STATUS.rejected,
  review_rejected: RESCUE_REVIEW_STATUS.rejected,
  vote_rejected: RESCUE_REVIEW_STATUS.rejected,
})

const FUNDING_ALIASES: Readonly<Record<string, FundingKnownStatus>> = Object.freeze({
  funding_pending: RESCUE_FUNDING_STATUS.pending,
  pending: RESCUE_FUNDING_STATUS.pending,
  unpaid: RESCUE_FUNDING_STATUS.pending,
  funding_failed: RESCUE_FUNDING_STATUS.failed,
  failed: RESCUE_FUNDING_STATUS.failed,
  funding_paid: RESCUE_FUNDING_STATUS.paid,
  paid: RESCUE_FUNDING_STATUS.paid,
})

const LEGACY_FUNDING_KEYS = new Set([
  'unpaid',
  'paid',
  'funding_pending',
  'funding_failed',
  'funding_paid',
])

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim()
}

function own(object: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key)
}

function distinct<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values))
}

function freezeError(
  axis: AxisName,
  code: string,
  fields: readonly string[],
  message: string,
): RescueStateError {
  return Object.freeze({ axis, code, fields: Object.freeze(fields.slice()), message })
}

function axisResult<T extends string>(
  status: T | typeof UNKNOWN_STATE,
  source: string | null,
  known: boolean,
  supplied: boolean,
): AxisResult<T> {
  return Object.freeze({ status, source, known, supplied })
}

function readCandidates(source: JsonRecord, paths: readonly string[]): Candidate[] {
  const values = []
  for (const path of paths) {
    const parts = path.split('.')
    let current: unknown = source
    for (const part of parts) {
      if (!isRecord(current) || !own(current, part)) {
        current = undefined
        break
      }
      current = current[part]
    }
    if (current !== undefined && current !== null && text(current) !== '') {
      values.push({ field: path, value: text(current) })
    }
  }
  return values
}

function resolveAxis<T extends string>(
  source: JsonRecord,
  config: AxisConfig<T>,
): AxisResolution<T> {
  const candidates = readCandidates(source, config.paths)
  if (!candidates.length) {
    return { result: axisResult<T>(UNKNOWN_STATE, null, false, false), errors: [] }
  }

  const canonical = []
  const invalid = []
  for (const candidate of candidates) {
    const normalized = config.aliases[candidate.value]
    if (!normalized || !config.values.has(normalized)) {
      invalid.push(candidate)
      continue
    }
    canonical.push({ ...candidate, value: normalized })
  }

  if (invalid.length) {
    return {
      result: axisResult<T>(UNKNOWN_STATE, null, false, true),
      errors: [
        freezeError(
          config.axis,
          'UNKNOWN_STATUS',
          invalid.map((item) => item.field),
          config.axis + ' 状态不在合同枚举内',
        ),
      ],
    }
  }

  const statuses = distinct(canonical.map((item) => item.value))
  if (statuses.length !== 1) {
    return {
      result: axisResult<T>(UNKNOWN_STATE, null, false, true),
      errors: [
        freezeError(
          config.axis,
          'CONFLICTING_STATUS',
          canonical.map((item) => item.field),
          config.axis + ' 状态字段冲突，拒绝自动修复',
        ),
      ],
    }
  }

  return {
    result: axisResult(statuses[0], canonical.map((item) => item.field).join(','), true, true),
    errors: [],
  }
}

function crossAxisErrors(
  application: AxisView<ApplicationStatus>,
  review: AxisView<ReviewStatus>,
  funding: FundingView,
): RescueStateError[] {
  const errors = []
  if (
    funding.status === RESCUE_FUNDING_STATUS.paid &&
    application.status !== RESCUE_APPLICATION_STATUS.approved
  ) {
    errors.push(
      freezeError(
        'funding',
        'FUNDING_BEFORE_APPLICATION_APPROVAL',
        ['applicationStatus', 'fundingStatus'],
        '平台审核未通过或未完成时不能宣称已打款',
      ),
    )
  }
  if (
    funding.status === RESCUE_FUNDING_STATUS.paid &&
    review.status !== RESCUE_REVIEW_STATUS.approved
  ) {
    errors.push(
      freezeError(
        'funding',
        'FUNDING_BEFORE_REVIEW_APPROVAL',
        ['reviewStatus', 'fundingStatus'],
        '评审未通过或缺少评审结果时不能宣称已打款',
      ),
    )
  }
  if (
    funding.status !== RESCUE_FUNDING_STATUS.unknown &&
    review.status === RESCUE_REVIEW_STATUS.rejected
  ) {
    errors.push(
      freezeError(
        'review',
        'FUNDING_AFTER_REVIEW_REJECTION',
        ['reviewStatus', 'fundingStatus'],
        '评审否决与资金结果冲突',
      ),
    )
  }
  return errors
}

function freezeProjection(projection: RescueStateProjection): RescueStateProjection {
  const frozen = {
    ...projection,
    application: Object.freeze(projection.application),
    review: Object.freeze(projection.review),
    vote: Object.freeze(projection.vote),
    funding: Object.freeze(projection.funding),
    capabilities: Object.freeze(projection.capabilities),
    errors: Object.freeze(projection.errors),
  }
  return Object.freeze(frozen)
}

function isReviewKnownStatus(value: string): value is ReviewKnownStatus {
  return (
    value === RESCUE_REVIEW_STATUS.pending ||
    value === RESCUE_REVIEW_STATUS.approved ||
    value === RESCUE_REVIEW_STATUS.rejected
  )
}

export function normalizeRescueState(record: unknown = {}): RescueStateProjection {
  const source = isRecord(record) ? record : {}
  const application = resolveAxis<ApplicationStatus>(source, {
    axis: 'application',
    paths: ['applicationStatus', 'application.status'],
    aliases: APPLICATION_ALIASES,
    values: APPLICATION_VALUES,
  })
  const review = resolveAxis<ReviewStatus>(source, {
    axis: 'review',
    paths: ['reviewStatus', 'review.status', 'voteStatus', 'vote.status'],
    aliases: REVIEW_ALIASES,
    values: REVIEW_VALUES,
  })
  const funding = resolveAxis<FundingStatus>(source, {
    axis: 'funding',
    paths: ['fundingStatus', 'funding.status', 'fundingOutcome'],
    aliases: FUNDING_ALIASES,
    values: FUNDING_VALUES,
  })

  // Existing rescueStorage records use status as a mixed compatibility
  // field. Read its unambiguous values into their own axis only when the new
  // axis has no explicit value; never use it to infer applicationStatus.
  const legacyStatus = text(source.status)
  const legacyReview: ReviewKnownStatus | '' = isReviewKnownStatus(legacyStatus) ? legacyStatus : ''
  // In rescueStorage, pending and rejected are review values while
  // unpaid and paid are funding values. Do not let the generic funding
  // alias for pending reinterpret the former review state.
  const legacyFunding: FundingKnownStatus | '' = LEGACY_FUNDING_KEYS.has(legacyStatus)
    ? FUNDING_ALIASES[legacyStatus]
    : ''
  const errors: RescueStateError[] = [...application.errors, ...review.errors, ...funding.errors]

  let reviewResult: AxisResult<ReviewStatus> = review.result
  if (!reviewResult.supplied && legacyReview)
    reviewResult = axisResult(legacyReview, 'status', true, true)
  else if (reviewResult.supplied && legacyReview && reviewResult.status !== legacyReview) {
    errors.push(
      freezeError(
        'review',
        'CONFLICTING_STATUS',
        ['reviewStatus', 'status'],
        'review 状态与兼容 status 字段冲突，拒绝自动修复',
      ),
    )
    reviewResult = axisResult(RESCUE_REVIEW_STATUS.unknown, null, false, true)
  }

  let fundingResult: AxisResult<FundingStatus> = funding.result
  if (!fundingResult.supplied && legacyFunding)
    fundingResult = axisResult(legacyFunding, 'status', true, true)
  else if (fundingResult.supplied && legacyFunding && fundingResult.status !== legacyFunding) {
    errors.push(
      freezeError(
        'funding',
        'CONFLICTING_STATUS',
        ['fundingStatus', 'status'],
        'funding 状态与兼容 status 字段冲突，拒绝自动修复',
      ),
    )
    fundingResult = axisResult(RESCUE_FUNDING_STATUS.unknown, null, false, true)
  }

  const applicationView: AxisView<ApplicationStatus> = {
    status: application.result.status,
    known: application.result.known,
    source: application.result.source,
  }
  const reviewView: AxisView<ReviewStatus> = {
    status: reviewResult.status,
    known: reviewResult.known,
    source: reviewResult.source,
  }
  const fundingView: FundingView = {
    status: fundingResult.status,
    known: fundingResult.known,
    source: fundingResult.source,
    paid: null,
    displayStatus: fundingResult.status,
  }
  const axisErrors = crossAxisErrors(applicationView, reviewView, fundingView)
  errors.push(...axisErrors)
  if (fundingView.status === RESCUE_FUNDING_STATUS.paid && errors.length) {
    fundingView.paid = false
    fundingView.displayStatus = RESCUE_FUNDING_STATUS.unknown
  } else {
    fundingView.paid =
      fundingView.status === RESCUE_FUNDING_STATUS.paid ? true : fundingView.known ? false : null
  }
  const validity: StateValidity = errors.length
    ? 'invalid'
    : [applicationView, reviewView, fundingView].some((axis) => !axis.known)
      ? 'unknown'
      : 'valid'

  return freezeProjection({
    validity,
    applicationStatus: applicationView.status,
    reviewStatus: reviewView.status,
    voteStatus: reviewView.status,
    fundingStatus: fundingView.status,
    application: applicationView,
    review: reviewView,
    vote: { ...reviewView },
    funding: fundingView,
    capabilities: {
      canWriteFunding: false,
      canTransitionFunding: false,
    },
    errors,
  })
}

/**
 * Parse a JSON/object state payload and return a fail-closed result. This is
 * deliberately a parser only; it never reads or writes application storage.
 */
export function parseRescueState(input: unknown = {}): RescueStateParseResult {
  let value = input
  if (typeof input === 'string') {
    try {
      value = JSON.parse(input)
    } catch {
      return Object.freeze({
        ok: false,
        code: 'INVALID_JSON',
        state: normalizeRescueState(null),
        error: '救助状态数据不是合法 JSON',
      })
    }
  }
  if (!isRecord(value)) {
    return Object.freeze({
      ok: false,
      code: 'INVALID_RECORD',
      state: normalizeRescueState(null),
      error: '救助状态数据不是对象',
    })
  }
  const state = normalizeRescueState(value)
  return Object.freeze({
    ok: state.validity !== 'invalid',
    code: state.validity === 'valid' ? 'OK' : 'STATE_UNKNOWN',
    state,
    error: state.errors[0]?.message || '',
  })
}

export function readRescueStateProjection(record: unknown = {}): RescueStateProjection {
  return normalizeRescueState(record)
}

// Explicit aliases make the read-only boundary easy to discover without
// creating a second implementation or a second storage adapter.
export const normalizeRescueStateProjection = normalizeRescueState
export const readRescueState = readRescueStateProjection
