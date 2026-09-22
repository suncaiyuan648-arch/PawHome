/**
 * Local rescue-review read/write boundary.
 *
 * This adapter intentionally has no navigation or domain-storage imports. It
 * binds the already agreed PAWHOME_RESCUES storage shape only at this
 * subpackage boundary, and accepts reader/writer injections for governance and
 * future server integration. Review writes are limited to the review axis;
 * funding and payment state are never accepted as an action.
 */

const RESCUE_STORAGE_KEY = 'PAWHOME_RESCUES'
const ACTOR_SESSION_STORAGE_KEY = 'PAWHOME_ACTOR_SESSION'
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const REVIEW_STATUSES = Object.freeze(['pending', 'approved', 'rejected'])
const REVIEW_ACTIONS = Object.freeze(['approved', 'rejected'])
const REVIEW_TRANSITIONS = Object.freeze({
  pending: Object.freeze(['approved', 'rejected']),
  approved: Object.freeze([]),
  rejected: Object.freeze([]),
})
const FUNDING_ACTIONS = new Set(['paid', 'unpaid', 'funding_pending', 'funding_failed', 'funding_paid'])
const CROSS_DOMAIN_PREFIXES = Object.freeze(['adoption', 'feeding', 'order', 'dynamic', 'yard', 'animal'])

export class RescueReviewActionError extends Error {
  constructor(code, message, details) {
    super(message)
    this.name = 'RescueReviewActionError'
    this.code = code
    this.details = details || {}
  }
}

function fail(code, message, details) {
  throw new RescueReviewActionError(code, message, details)
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

function id(value, label, { required = false } = {}) {
  const result = text(value)
  if (!result) {
    if (required) fail('MISSING_ID', `${label} is required`)
    return ''
  }
  if (!SAFE_ID.test(result)) fail('INVALID_ID', `${label} must be an opaque ID`)
  const lower = result.toLowerCase()
  if (CROSS_DOMAIN_PREFIXES.some(prefix => lower === prefix || lower.startsWith(`${prefix}-`) || lower.startsWith(`${prefix}_`) || lower.startsWith(`${prefix}:`))) {
    fail('CROSS_DOMAIN_ID', `${label} belongs to another domain`)
  }
  return result
}

function freeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value
  seen.add(value)
  Object.keys(value).forEach(key => freeze(value[key], seen))
  return Object.freeze(value)
}

function safeError(error, fallback) {
  return error && typeof error.code === 'string' && error.code ? error.code : fallback
}

function emptyList(code) {
  const items = Object.freeze([])
  return Object.freeze({
    actor: null,
    items,
    pending: items,
    processed: items,
    canWrite: false,
    readOnly: true,
    diagnostics: Object.freeze({ scanned: 0, accepted: 0, skipped: items, actorError: Object.freeze({ code }) }),
  })
}

function emptyDetail(code) {
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

/** The only actor source used by the production pages in this subpackage. */
export function createReviewSessionProvider() {
  return () => {
    if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') return null
    try { return uni.getStorageSync(ACTOR_SESSION_STORAGE_KEY) || null } catch (error) { return null }
  }
}

/** Resolve a fresh, session-backed reviewer. Query parameters are not read. */
export function resolveTrustedReviewSession(actorProvider) {
  if (typeof actorProvider !== 'function') fail('ACTOR_PROVIDER_REQUIRED', 'A trusted session provider is required')
  let supplied
  try { supplied = actorProvider() } catch (error) { fail('ACTOR_PROVIDER_FAILED', 'The trusted session provider failed') }
  if (!isRecord(supplied)) fail('NO_SESSION', 'A trusted reviewer session is required')
  const sessionId = id(supplied.sessionId || supplied.id, 'sessionId', { required: true })
  const actor = isRecord(supplied.actor) ? supplied.actor : null
  if (!actor) fail('NO_ACTOR', 'The trusted session has no actor')
  const actorId = id(actor.id || actor.actorId, 'actorId', { required: true })
  const roles = Array.isArray(actor.roles) ? actor.roles.map(text).filter(Boolean) : [text(actor.role)].filter(Boolean)
  if (!roles.includes('reviewer')) fail('REVIEWER_ROLE_REQUIRED', 'The trusted actor is not a reviewer')
  return freeze({ sessionId, actorId, roles: Array.from(new Set(roles)) })
}

function relationIds(record) {
  const review = isRecord(record.review) ? record.review : null
  const values = []
  for (const [source, field] of [[record, 'reviewerId'], [record, 'reviewerIds'], [review, 'reviewerId'], [review, 'reviewerIds']]) {
    if (!source || !own(source, field) || source[field] === undefined) continue
    const raw = Array.isArray(source[field]) ? source[field] : [source[field]]
    if (!raw.length) fail('MISSING_REVIEWER_RELATION', 'Reviewer relation is empty')
    const current = raw.map(value => id(value, `reviewer relation ${field}`, { required: true }))
    const unique = Array.from(new Set(current)).sort()
    values.push(unique)
  }
  if (!values.length) fail('MISSING_REVIEWER_RELATION', 'A review item must identify its reviewer')
  const first = JSON.stringify(values[0])
  if (values.some(value => JSON.stringify(value) !== first)) fail('CONFLICTING_REVIEWER_RELATION', 'Reviewer relation aliases disagree')
  return values[0]
}

function reviewItemIdFor(record) {
  const review = isRecord(record.review) ? record.review : null
  const values = []
  for (const [source, field] of [[record, 'reviewItemId'], [review, 'reviewItemId']]) {
    if (source && own(source, field) && source[field] !== undefined) values.push(id(source[field], `review ${field}`, { required: true }))
  }
  if (!values.length) fail('MISSING_REVIEW_ITEM_ID', 'A review item must identify reviewItemId')
  if (new Set(values).size !== 1) fail('CONFLICTING_REVIEW_ITEM_ID', 'reviewItemId aliases disagree')
  return values[0]
}

function rescueIdFor(record) {
  const values = [own(record, 'rescueId') ? id(record.rescueId, 'rescueId', { required: true }) : '', own(record, 'id') ? id(record.id, 'record.id', { required: true }) : ''].filter(Boolean)
  if (!values.length) fail('MISSING_RESCUE_ID', 'A review item must identify rescueId')
  if (new Set(values).size !== 1) fail('CONFLICTING_RESCUE_ID', 'rescueId aliases disagree')
  return values[0]
}

function statusFor(record) {
  const review = isRecord(record.review) ? record.review : null
  const values = []
  const fields = [
    [record, 'reviewStatus'], [record, 'voteStatus'],
    [review, 'status'], [review, 'reviewStatus'], [review, 'voteStatus'],
  ]
  for (const [source, field] of fields) {
    if (!source || !own(source, field) || source[field] === undefined) continue
    const value = text(source[field])
    if (!REVIEW_STATUSES.includes(value)) fail('INVALID_REVIEW_STATUS', 'Review status is not in the whitelist')
    values.push(value)
  }
  // Existing rescue records use the legacy `status` field for review state.
  // Funding aliases are deliberately rejected instead of becoming a review.
  if (own(record, 'status') && record.status !== undefined) {
    const value = text(record.status)
    if (FUNDING_ACTIONS.has(value)) fail('FUNDING_STATE_NOT_REVIEW', 'Funding state cannot authorize a review action')
    if (!REVIEW_STATUSES.includes(value)) fail('INVALID_REVIEW_STATUS', 'Review status is not in the whitelist')
    values.push(value)
  }
  if (!values.length) fail('MISSING_REVIEW_STATUS', 'A review item must identify its review status')
  if (new Set(values).size !== 1) fail('CONFLICTING_REVIEW_STATUS', 'Review status aliases disagree')
  return values[0]
}

function reviewDescriptor(record, session) {
  if (!isRecord(record)) fail('INVALID_RECORD', 'Rescue review record must be an object')
  const reviewItemId = reviewItemIdFor(record)
  const rescueId = rescueIdFor(record)
  const reviewers = relationIds(record)
  if (!reviewers.includes(session.actorId)) fail('ACTOR_MISMATCH', 'Review item does not belong to the trusted reviewer')
  const status = statusFor(record)
  const metadata = {}
  for (const field of ['summary', 'description', 'detail', 'amount', 'createdAt', 'createdLabel', 'ownerName', 'ownerAvatar', 'applicationStatus', 'yardName']) {
    if (own(record, field) && (typeof record[field] === 'string' || typeof record[field] === 'number' || typeof record[field] === 'boolean')) metadata[field] = record[field]
  }
  const media = Array.isArray(record.mediaPaths) ? record.mediaPaths : Array.isArray(record.media) ? record.media : []
  if (media.length) metadata.media = media.filter(value => typeof value === 'string').slice(0, 6)
  return freeze({ rescueId, reviewItemId, status, reviewerId: session.actorId, ...metadata })
}

function readStorageRecords() {
  if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') return []
  try {
    const raw = uni.getStorageSync(RESCUE_STORAGE_KEY)
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(parsed) ? parsed.filter(isRecord) : []
  } catch (error) {
    return []
  }
}

function writeStorageRecords(records) {
  if (typeof uni === 'undefined' || !uni || typeof uni.setStorageSync !== 'function') fail('STORAGE_WRITE_UNAVAILABLE', 'Rescue review storage is unavailable')
  uni.setStorageSync(RESCUE_STORAGE_KEY, JSON.stringify(records))
}

function readRecords(options, context) {
  const reader = options && options.reader
  if (reader !== undefined && typeof reader !== 'function') fail('INVALID_READER', 'Review reader must be a function')
  const result = reader ? reader(Object.freeze({ actor: context })) : readStorageRecords()
  if (result && typeof result.then === 'function') fail('ASYNC_READER_UNSUPPORTED', 'Review reader must return synchronously')
  if (!Array.isArray(result)) fail('INVALID_READER_RESULT', 'Review reader must return an array')
  return result.filter(isRecord)
}

function findReviewRecord(records, expectedReviewItemId, expectedRescueId) {
  const reviewItemId = id(expectedReviewItemId, 'reviewItemId', { required: true })
  const rescueId = expectedRescueId ? id(expectedRescueId, 'rescueId') : ''
  return records.find(record => {
    try {
      if (reviewItemIdFor(record) !== reviewItemId) return false
      return !rescueId || rescueIdFor(record) === rescueId
    } catch (error) { return false }
  }) || null
}

function idempotencyFor(record) {
  const review = isRecord(record.review) ? record.review : null
  const action = review && isRecord(review.lastAction) ? review.lastAction : null
  if (!action) return null
  const actionId = text(action.idempotencyKey || action.actionId)
  const outcome = text(action.outcome || action.status)
  return actionId && REVIEW_ACTIONS.includes(outcome) ? { actionId, outcome } : null
}

function nextRecordFor(record, outcome, session, actionId, actionAt) {
  const next = { ...record }
  const existingReview = isRecord(record.review) ? { ...record.review } : {}
  const hadNestedReview = isRecord(record.review)
  const hadReviewStatus = own(record, 'reviewStatus')
  const hadVoteStatus = own(record, 'voteStatus')
  const legacyStatus = text(record.status)
  if (hadReviewStatus) next.reviewStatus = outcome
  if (hadVoteStatus) next.voteStatus = outcome
  if (hadNestedReview || (!hadReviewStatus && !hadVoteStatus && REVIEW_STATUSES.includes(legacyStatus))) {
    existingReview.status = outcome
    existingReview.lastAction = { idempotencyKey: actionId, outcome, actorId: session.actorId, sessionId: session.sessionId, at: actionAt }
    next.review = existingReview
  }
  if (!hadReviewStatus && !hadVoteStatus && REVIEW_STATUSES.includes(legacyStatus)) next.status = outcome
  if (!hadNestedReview && (hadReviewStatus || hadVoteStatus)) {
    next.review = { reviewItemId: reviewItemIdFor(record), status: outcome, lastAction: { idempotencyKey: actionId, outcome, actorId: session.actorId, sessionId: session.sessionId, at: actionAt } }
  }
  if (!next.review) next.review = { reviewItemId: reviewItemIdFor(record), status: outcome, lastAction: { idempotencyKey: actionId, outcome, actorId: session.actorId, sessionId: session.sessionId, at: actionAt } }
  return next
}

function writeReviewRecord(options, records, current, next, context) {
  if (options && options.writer !== undefined) {
    if (typeof options.writer !== 'function') fail('INVALID_WRITER', 'Review writer must be a function')
    const result = options.writer(Object.freeze({ records, current, next, ...context }))
    if (result && typeof result.then === 'function') fail('ASYNC_WRITER_UNSUPPORTED', 'Review writer must return synchronously')
    return result === undefined ? next : result
  }
  const currentId = rescueIdFor(current)
  const updated = records.map(item => {
    try { return rescueIdFor(item) === currentId ? next : item } catch (error) { return item }
  })
  writeStorageRecords(updated)
  return next
}

function actionOutcome(value) {
  const result = text(value)
  if (FUNDING_ACTIONS.has(result)) fail('PAYMENT_ACTION_FORBIDDEN', 'Funding and payment actions are outside rescue review')
  if (!REVIEW_ACTIONS.includes(result)) fail('INVALID_REVIEW_ACTION', 'Review action must approve or reject')
  return result
}

function actionKey(value) {
  const result = id(value, 'idempotencyKey', { required: true })
  if (result.length > 128) fail('VALUE_TOO_LONG', 'idempotencyKey is too long')
  return result
}

export function readRescueReviewList(options = {}) {
  const source = isRecord(options) ? options : {}
  let session
  try { session = resolveTrustedReviewSession(source.actorProvider) } catch (error) { return emptyList(safeError(error, 'REVIEW_READ_DENIED')) }
  let records
  try { records = readRecords(source, session) } catch (error) { return emptyList(safeError(error, 'REVIEW_READ_FAILED')) }
  const filter = source.filter === undefined ? 'pending' : text(source.filter)
  if (!['all', 'pending', 'processed', 'approved', 'rejected'].includes(filter)) return emptyList('INVALID_STATUS_FILTER')
  const skipped = []
  const items = []
  records.forEach((record, index) => {
    try {
      const item = reviewDescriptor(record, session)
      const visible = filter === 'all' || (filter === 'pending' && item.status === 'pending') || (filter === 'processed' && item.status !== 'pending') || item.status === filter
      if (visible) items.push(item)
    } catch (error) { skipped.push({ index, code: safeError(error, 'INVALID_RECORD') }) }
  })
  const pending = items.filter(item => item.status === 'pending')
  const processed = items.filter(item => item.status !== 'pending')
  return Object.freeze({ actor: Object.freeze({ id: session.actorId, roles: session.roles }), items: Object.freeze(items), pending: Object.freeze(pending), processed: Object.freeze(processed), canWrite: true, readOnly: false, diagnostics: Object.freeze({ scanned: records.length, accepted: items.length, skipped: Object.freeze(skipped), actorError: null }) })
}

export function readRescueReviewDetail(options = {}) {
  const source = isRecord(options) ? options : {}
  let session
  try { session = resolveTrustedReviewSession(source.actorProvider) } catch (error) { return emptyDetail(safeError(error, 'REVIEW_READ_DENIED')) }
  try {
    const records = readRecords(source, session)
    const record = findReviewRecord(records, source.reviewItemId, source.rescueId)
    if (!record) return emptyDetail('NOT_FOUND')
    const item = reviewDescriptor(record, session)
    return Object.freeze({ actor: Object.freeze({ id: session.actorId, roles: session.roles }), item, record: freeze(JSON.parse(JSON.stringify(record))), canRead: true, canWrite: item.status === 'pending', readOnly: false, reason: '' })
  } catch (error) { return emptyDetail(safeError(error, 'REVIEW_READ_FAILED')) }
}

export function applyRescueReviewAction(options = {}) {
  const source = isRecord(options) ? options : {}
  const session = resolveTrustedReviewSession(source.actorProvider)
  const outcome = actionOutcome(source.outcome || source.action || source.status)
  const actionId = actionKey(source.idempotencyKey || source.requestId)
  const records = readRecords(source, session)
  const current = findReviewRecord(records, source.reviewItemId, source.rescueId)
  if (!current) fail('NOT_FOUND', 'Review item was not found')
  const item = reviewDescriptor(current, session)
  const previousAction = idempotencyFor(current)
  if (previousAction && previousAction.actionId === actionId) {
    if (previousAction.outcome !== outcome) fail('IDEMPOTENCY_CONFLICT', 'Idempotency key was used for another outcome')
    return freeze({ success: true, duplicate: true, wrote: false, rescueId: item.rescueId, reviewItemId: item.reviewItemId, fromStatus: item.status, toStatus: item.status, actorId: session.actorId, idempotencyKey: actionId, fundingChanged: false })
  }
  const allowed = REVIEW_TRANSITIONS[item.status] || []
  if (!allowed.includes(outcome)) fail('INVALID_TRANSITION', 'Only pending reviews may be approved or rejected')
  const actionAt = source.now === undefined ? new Date().toISOString() : text(source.now)
  if (!actionAt) fail('INVALID_TIMESTAMP', 'Review action timestamp is required')
  const next = nextRecordFor(current, outcome, session, actionId, actionAt)
  writeReviewRecord(source, records, current, next, { actor: session, action: outcome, idempotencyKey: actionId })
  return freeze({ success: true, duplicate: false, wrote: true, rescueId: item.rescueId, reviewItemId: item.reviewItemId, fromStatus: item.status, toStatus: outcome, actorId: session.actorId, idempotencyKey: actionId, fundingChanged: false })
}

export const REVIEW_STATUS_VALUES = REVIEW_STATUSES
export const REVIEW_ACTION_VALUES = REVIEW_ACTIONS
export const RESCUE_REVIEW_TRANSITIONS = REVIEW_TRANSITIONS
export const getRescueReviewList = readRescueReviewList
export const getRescueReviewDetail = readRescueReviewDetail
export const transitionRescueReview = applyRescueReviewAction
