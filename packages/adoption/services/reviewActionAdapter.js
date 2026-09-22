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

import { getAdoptionRecords, updateAdoption } from '../../../utils/adoptionStorage.js'
import { readAdoptionReviewDetail, createReviewSessionProvider } from './reviewAdapter.js'

const REVIEW_ACTIONS = Object.freeze(['approved', 'rejected'])
const REVIEW_TRANSITIONS = Object.freeze({
  pending: Object.freeze(['approved', 'rejected']),
  approved: Object.freeze([]),
  rejected: Object.freeze([]),
})
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const CROSS_DOMAIN_PREFIXES = Object.freeze(['rescue', 'feeding', 'order', 'dynamic', 'yard', 'animal'])

export class AdoptionReviewActionError extends Error {
  constructor(code, message, details) {
    super(message)
    this.name = 'AdoptionReviewActionError'
    this.code = code
    this.details = details || {}
  }
}

function fail(code, message, details) {
  throw new AdoptionReviewActionError(code, message, details)
}

function own(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function text(value) {
  return value === undefined || value === null ? '' : String(value).trim()
}

function opaqueId(value, label, { required = true } = {}) {
  const result = text(value)
  if (!result) {
    if (!required) return ''
    fail('MISSING_ID', `${label} is required`)
  }
  if (result !== value || !SAFE_ID.test(result)) fail('INVALID_ID', `${label} must be an opaque ID`)
  const lower = result.toLowerCase()
  if (CROSS_DOMAIN_PREFIXES.some(prefix => lower === prefix || lower.startsWith(`${prefix}-`) || lower.startsWith(`${prefix}_`) || lower.startsWith(`${prefix}:`))) {
    fail('CROSS_DOMAIN_ID', `${label} belongs to another domain`)
  }
  return result
}

function actionKey(value) {
  const key = opaqueId(value, 'idempotencyKey')
  if (key.length > 128) fail('VALUE_TOO_LONG', 'idempotencyKey is too long')
  return key
}

function actionOutcome(value) {
  const outcome = text(value)
  if (!REVIEW_ACTIONS.includes(outcome)) fail('INVALID_REVIEW_ACTION', 'Review action must approve or reject')
  return outcome
}

function freeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value
  seen.add(value)
  Object.keys(value).forEach(key => freeze(value[key], seen))
  return Object.freeze(value)
}

function idempotencyFor(record) {
  const review = isRecord(record && record.review) ? record.review : null
  const action = review && isRecord(review.lastAction) ? review.lastAction : null
  if (!action) return null
  const id = text(action.idempotencyKey || action.actionId)
  const outcome = text(action.outcome || action.status)
  return id && REVIEW_ACTIONS.includes(outcome) ? { id, outcome } : null
}

function relationIds(record, names) {
  const values = []
  const review = isRecord(record && record.review) ? record.review : null
  for (const source of [record, review]) {
    if (!source) continue
    for (const name of names) {
      if (!own(source, name) || source[name] === undefined || source[name] === null) continue
      const raw = Array.isArray(source[name]) ? source[name] : [source[name]]
      values.push(...raw.map(value => opaqueId(value, `${name} relation`)))
    }
  }
  return Array.from(new Set(values))
}

function nextStatus(item, record, outcome, actorId) {
  if (outcome === 'rejected') return 'rejected'
  if (item.phase === 'cloud_parent') {
    const parentIds = relationIds(record, ['cloudParentIds', 'cloudParentId', 'cloudParentPawId', 'cloudOwnerId'])
    const approvals = relationIds(record, ['cloudParentApprovals'])
    const nextApprovals = Array.from(new Set([...approvals, actorId]))
    // The canonical reader only exposes an unambiguous single-parent review
    // without an explicit product policy. Preserve cloud_pending for any
    // multi-parent record rather than silently choosing a policy here.
    if (parentIds.length > 1) fail('CLOUD_PARENT_POLICY_REQUIRED', 'Multiple cloud parents require an explicit approval policy')
    return parentIds.length === 1 && nextApprovals.includes(parentIds[0]) ? 'pending' : 'cloud_pending'
  }
  if (item.phase === 'owner') return 'pickup'
  if (item.phase === 'owner_confirmation') return 'jury_confirm_pending'
  if (item.phase === 'jury') return 'adoption_confirmed'
  fail('INVALID_REVIEW_PHASE', 'Review phase cannot be advanced')
}

function failureStageFor(item) {
  return item.phase === 'cloud_parent'
    ? 'cloud_parent'
    : item.phase === 'owner_confirmation'
      ? 'owner_confirm'
      : item.phase === 'jury'
        ? 'jury'
        : 'owner_review'
}

function readCurrentRecord(applicationId, reviewItemId) {
  const record = getAdoptionRecords({ includeDemo: false }).find(candidate => {
    if (!isRecord(candidate)) return false
    const candidateApplicationId = text(candidate.applicationId || candidate.id || candidate.recordId)
    const review = isRecord(candidate.review) ? candidate.review : null
    const candidateReviewItemId = text(review && (review.reviewItemId || candidate.reviewItemId))
    return candidateApplicationId === applicationId && candidateReviewItemId === reviewItemId
  })
  if (!record) fail('NOT_FOUND', '领养审核记录不存在')
  const review = isRecord(record.review) ? record.review : null
  const actualApplicationId = text(record.applicationId || record.id || record.recordId)
  const actualReviewItemId = text(review && (review.reviewItemId || record.reviewItemId))
  if (actualApplicationId !== applicationId || actualReviewItemId !== reviewItemId) fail('NOT_FOUND', '领养审核项不存在')
  return record
}

export function applyAdoptionReviewAction(options = {}) {
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
  if (!access.canRead || !access.item) fail(access.reason || 'FORBIDDEN', '当前账号无权处理该审核项')
  const item = access.item
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
      actorId: access.actor && access.actor.id,
      idempotencyKey,
    })
  }
  if (!(REVIEW_TRANSITIONS[item.reviewStatus] || []).includes(outcome)) fail('INVALID_TRANSITION', '只有待审核项可以处理')

  const actorId = access.actor && access.actor.id
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
      ? { cloudParentApprovals: Array.from(new Set([...relationIds(record, ['cloudParentApprovals']), actorId])) }
      : {}),
    ...(outcome === 'rejected' ? { failureStage: failureStageFor(item), rejectNote: text(options.reason) || '审核未通过' } : {}),
  }
  const updated = updateAdoption(record.id || applicationId, patch)
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
