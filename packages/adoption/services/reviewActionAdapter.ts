/**
 * Local adoption-review read/write boundary.
 *
 * The review reader remains the canonical source of reviewer authority. This
 * adapter adds the deliberately small local mutation seam used by the page:
 * a trusted reviewer may make one terminal decision for the exact persisted
 * review item.  Demo records, query roles and applicant data never become
 * writable through this module.  The seam is local-only and can be replaced
 * by a server command without changing the page contract.
 */

import { getAdoptionRecords, updateAdoption } from '../../../utils/adoptionStorage.ts'
import { readAdoptionReviewDetail, createReviewSessionProvider } from './reviewAdapter.ts'

type JsonRecord = Record<string, unknown>
type ReviewOutcome = 'approved' | 'rejected'
type ReviewStatus = 'pending' | ReviewOutcome
type ApplicationStatus =
  | 'cloud_pending'
  | 'pending'
  | 'pickup'
  | 'jury_confirm_pending'
  | 'adoption_confirmed'
  | 'rejected'
type ReviewItem = NonNullable<ReturnType<typeof readAdoptionReviewDetail>['item']>
type ActionOptions = {
  actorProvider?: () => unknown
  applicationId?: string
  reviewItemId?: string
  outcome?: ReviewOutcome
  action?: ReviewOutcome
  status?: ReviewOutcome
  idempotencyKey?: string
  requestId?: string
  now?: string | number
  reason?: string
}
type PreviousAction = { id: string; outcome: ReviewOutcome }
type ReviewActionSuccess = {
  success: true
  duplicate: boolean
  wrote: boolean
  applicationId: string
  reviewItemId: string
  fromStatus: ReviewStatus
  toStatus: ReviewStatus | ReviewOutcome
  applicationStatus?: ApplicationStatus
  actorId: string
  idempotencyKey: string
  error?: null
}

const REVIEW_ACTIONS: readonly ReviewOutcome[] = Object.freeze(['approved', 'rejected'])
const REVIEW_OUTCOME_TRANSITIONS: readonly ReviewOutcome[] = Object.freeze(['approved', 'rejected'])
const NO_REVIEW_TRANSITIONS: readonly ReviewOutcome[] = Object.freeze([])
const REVIEW_TRANSITIONS: Readonly<Record<ReviewStatus, readonly ReviewOutcome[]>> = Object.freeze({
  pending: REVIEW_OUTCOME_TRANSITIONS,
  approved: NO_REVIEW_TRANSITIONS,
  rejected: NO_REVIEW_TRANSITIONS,
})
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const CROSS_DOMAIN_PREFIXES = Object.freeze([
  'rescue',
  'feeding',
  'order',
  'dynamic',
  'yard',
  'animal',
])

export class AdoptionReviewActionError extends Error {
  readonly code: string
  readonly details: JsonRecord

  constructor(code: string, message: string, details: JsonRecord = {}) {
    super(message)
    this.name = 'AdoptionReviewActionError'
    this.code = code
    this.details = details || {}
  }
}

function fail(code: string, message: string, details: JsonRecord = {}): never {
  throw new AdoptionReviewActionError(code, message, details)
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

function opaqueId(
  value: unknown,
  label: string,
  { required = true }: { required?: boolean } = {},
): string {
  const result = text(value)
  if (!result) {
    if (!required) return ''
    fail('MISSING_ID', `${label} is required`)
  }
  if (result !== value || !SAFE_ID.test(result)) fail('INVALID_ID', `${label} must be an opaque ID`)
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

function actionKey(value: unknown): string {
  const key = opaqueId(value, 'idempotencyKey')
  if (key.length > 128) fail('VALUE_TOO_LONG', 'idempotencyKey is too long')
  return key
}

function isReviewOutcome(value: string): value is ReviewOutcome {
  return REVIEW_ACTIONS.some((candidate) => candidate === value)
}

function actionOutcome(value: unknown): ReviewOutcome {
  const outcome = text(value)
  if (!isReviewOutcome(outcome))
    fail('INVALID_REVIEW_ACTION', 'Review action must approve or reject')
  return outcome
}

function freeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (!value || typeof value !== 'object' || seen.has(value)) return value
  seen.add(value)
  Object.keys(value).forEach((key) => freeze(Reflect.get(value, key), seen))
  return Object.freeze(value)
}

function idempotencyFor(record: JsonRecord): PreviousAction | null {
  const reviewValue: unknown = record.review
  const review = isRecord(reviewValue) ? reviewValue : null
  const actionValue: unknown = review ? review.lastAction : null
  const action = isRecord(actionValue) ? actionValue : null
  if (!action) return null
  const id = text(action.idempotencyKey || action.actionId)
  const outcome = text(action.outcome || action.status)
  return id && isReviewOutcome(outcome) ? { id, outcome } : null
}

function relationIds(record: JsonRecord, names: readonly string[]): string[] {
  const values: string[] = []
  const reviewValue: unknown = record.review
  const review = isRecord(reviewValue) ? reviewValue : null
  const sources: Array<JsonRecord | null> = [record, review]
  for (const source of sources) {
    if (!source) continue
    for (const name of names) {
      if (!own(source, name) || source[name] === undefined || source[name] === null) continue
      const raw = Array.isArray(source[name]) ? source[name] : [source[name]]
      values.push(...raw.map((value) => opaqueId(value, `${name} relation`)))
    }
  }
  return Array.from(new Set(values))
}

function nextStatus(
  item: ReviewItem,
  record: JsonRecord,
  outcome: ReviewOutcome,
  actorId: string,
): ApplicationStatus {
  if (outcome === 'rejected') return 'rejected'
  if (item.phase === 'cloud_parent') {
    const parentIds = relationIds(record, [
      'cloudParentIds',
      'cloudParentId',
      'cloudParentPawId',
      'cloudOwnerId',
    ])
    const approvals = relationIds(record, ['cloudParentApprovals'])
    const nextApprovals = Array.from(new Set([...approvals, actorId]))
    // The canonical reader only exposes an unambiguous single-parent review
    // without an explicit product policy. Preserve cloud_pending for any
    // multi-parent record rather than silently choosing a policy here.
    if (parentIds.length > 1)
      fail(
        'CLOUD_PARENT_POLICY_REQUIRED',
        'Multiple cloud parents require an explicit approval policy',
      )
    return parentIds.length === 1 && nextApprovals.includes(parentIds[0])
      ? 'pending'
      : 'cloud_pending'
  }
  if (item.phase === 'owner') return 'pickup'
  if (item.phase === 'owner_confirmation') return 'jury_confirm_pending'
  if (item.phase === 'jury') return 'adoption_confirmed'
  fail('INVALID_REVIEW_PHASE', 'Review phase cannot be advanced')
}

function failureStageFor(item: ReviewItem): string {
  return item.phase === 'cloud_parent'
    ? 'cloud_parent'
    : item.phase === 'owner_confirmation'
      ? 'owner_confirm'
      : item.phase === 'jury'
        ? 'jury'
        : 'owner_review'
}

function readCurrentRecord(applicationId: string, reviewItemId: string): JsonRecord {
  const record: JsonRecord | undefined = getAdoptionRecords({ includeDemo: false }).find(
    (candidate) => {
      if (!isRecord(candidate)) return false
      const candidateApplicationId = text(
        candidate.applicationId || candidate.id || candidate.recordId,
      )
      const review = isRecord(candidate.review) ? candidate.review : null
      const candidateReviewItemId = text(review && (review.reviewItemId || candidate.reviewItemId))
      return candidateApplicationId === applicationId && candidateReviewItemId === reviewItemId
    },
  )
  if (!record) fail('NOT_FOUND', '领养审核记录不存在')
  const review = isRecord(record.review) ? record.review : null
  const actualApplicationId = text(record.applicationId || record.id || record.recordId)
  const actualReviewItemId = text(review && (review.reviewItemId || record.reviewItemId))
  if (actualApplicationId !== applicationId || actualReviewItemId !== reviewItemId)
    fail('NOT_FOUND', '领养审核项不存在')
  return record
}

export function applyAdoptionReviewAction(options: ActionOptions = {}): ReviewActionSuccess {
  if (!isRecord(options)) fail('INVALID_INPUT', 'Review action input must be an object')
  const actorProvider = options.actorProvider || createReviewSessionProvider()
  const applicationId = opaqueId(options.applicationId, 'applicationId')
  const reviewItemId = opaqueId(options.reviewItemId, 'reviewItemId')
  const outcome = actionOutcome(options.outcome || options.action || options.status)
  const idempotencyKey = actionKey(options.idempotencyKey || options.requestId)

  const access = readAdoptionReviewDetail({
    actorProvider,
    applicationId,
    reviewItemId,
    perspective: 'reviewer',
  })
  if (!access.canRead || !access.item)
    fail(access.reason || 'FORBIDDEN', '当前账号无权处理该审核项')
  const item = access.item
  const actorId = access.actor ? access.actor.id : fail('FORBIDDEN', '当前账号无权处理该审核项')
  const record = readCurrentRecord(applicationId, reviewItemId)
  const previous = idempotencyFor(record)
  if (previous && previous.id === idempotencyKey) {
    if (previous.outcome !== outcome) fail('IDEMPOTENCY_CONFLICT', '同一幂等键不能对应不同审核决定')
    return freeze({
      success: true,
      duplicate: true,
      wrote: false,
      applicationId,
      reviewItemId,
      fromStatus: item.reviewStatus,
      toStatus: item.reviewStatus,
      actorId,
      idempotencyKey,
    })
  }
  if (!(REVIEW_TRANSITIONS[item.reviewStatus] || []).includes(outcome))
    fail('INVALID_TRANSITION', '只有待审核项可以处理')

  const nextApplicationStatus = nextStatus(item, record, outcome, actorId)
  const at = options.now === undefined ? new Date().toISOString() : text(options.now)
  if (!at) fail('INVALID_TIMESTAMP', '审核时间不能为空')
  const currentReview = isRecord(record.review) ? record.review : {}
  const nextReview = {
    ...currentReview,
    status: outcome,
    lastAction: { idempotencyKey, outcome, actorId, at },
  }
  const patch = {
    review: nextReview,
    status: nextApplicationStatus,
    ...(item.phase === 'cloud_parent' && outcome === 'approved'
      ? {
          cloudParentApprovals: Array.from(
            new Set([...relationIds(record, ['cloudParentApprovals']), actorId]),
          ),
        }
      : {}),
    ...(outcome === 'rejected'
      ? { failureStage: failureStageFor(item), rejectNote: text(options.reason) || '审核未通过' }
      : {}),
  }
  const recordId = typeof record.id === 'string' && record.id ? record.id : applicationId
  const updated = updateAdoption(recordId, patch)
  if (!updated) fail('STORAGE_WRITE_FAILED', '审核状态保存失败')
  return freeze({
    success: true,
    duplicate: false,
    wrote: true,
    applicationId,
    reviewItemId,
    fromStatus: item.reviewStatus,
    toStatus: outcome,
    applicationStatus: nextApplicationStatus,
    actorId,
    idempotencyKey,
  })
}

export const transitionAdoptionReview = applyAdoptionReviewAction
export const REVIEW_ACTION_VALUES = REVIEW_ACTIONS
