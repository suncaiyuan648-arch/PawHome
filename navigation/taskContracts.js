'use strict'

/**
 * Pure, read-only task-summary contract.
 *
 * This module intentionally has no Vue, uni-app, page, package, storage, or
 * service imports.  A task summary identifies a piece of work for one actor;
 * it is a read model and never grants the actor the ability to mutate the
 * business record.  The actionType is the task phase used by the identity
 * function, so refreshing the same source task does not create a new task.
 */

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const URL_MARKERS = /[/?#%]|:\/\//

const TASK_BUSINESS_TYPES = Object.freeze(['adoption', 'rescue', 'feeding', 'dynamic'])

// Roles describe the source presentation only.  They are deliberately
// domain-scoped so a rescue reviewer cannot be smuggled into an adoption task
// by changing a query or message field.
const TASK_ACTOR_ROLES = Object.freeze({
  adoption: Object.freeze(['applicant', 'owner', 'cloud_parent', 'reviewer']),
  rescue: Object.freeze(['applicant', 'owner', 'reviewer', 'verifier']),
  feeding: Object.freeze(['donor', 'owner', 'recipient', 'feedback_author']),
  dynamic: Object.freeze(['author', 'commenter', 'moderator']),
})

// actionType is both the display action and the task's phase.  Adding a new
// action requires a contract update instead of silently accepting arbitrary
// strings from a deep link.
const TASK_ACTION_TYPES = Object.freeze({
  adoption: Object.freeze(['apply', 'confirm', 'review', 'supply_material', 'claim_reward']),
  rescue: Object.freeze(['apply', 'proof', 'review', 'fund']),
  feeding: Object.freeze(['order', 'fulfill', 'complete', 'feedback']),
  dynamic: Object.freeze(['publish', 'comment', 'moderate', 'feedback']),
})

// A status is presentation metadata.  It does not participate in taskId and
// it is not consulted by any write capability contract.
const TASK_STATUSES = Object.freeze([
  'pending',
  'in_progress',
  'processed',
  'completed',
  'failed',
  'cancelled',
  'expired',
])

const TASK_STATUS_BUCKETS = Object.freeze({
  pending: 'pending',
  in_progress: 'pending',
  processed: 'processed',
  completed: 'processed',
  failed: 'processed',
  cancelled: 'processed',
  expired: 'processed',
})

// These prefixes catch the common accidental cross-domain handoff while
// leaving existing opaque IDs (which are not required to carry a prefix)
// valid.  Domain ownership still comes from the trusted data resolver.
const DOMAIN_ID_PREFIXES = Object.freeze({
  adoption: Object.freeze(['rescue', 'feeding', 'order', 'dynamic']),
  rescue: Object.freeze(['adoption', 'feeding', 'order', 'dynamic']),
  feeding: Object.freeze(['adoption', 'rescue', 'dynamic']),
  dynamic: Object.freeze(['adoption', 'rescue', 'feeding', 'order']),
})

class TaskContractError extends Error {
  constructor(code, message, details) {
    super(message)
    this.name = 'TaskContractError'
    this.code = code
    this.details = details || {}
  }
}

function fail(code, message, details) {
  throw new TaskContractError(code, message, details)
}

function isPlainRecord(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  if (proto === Object.prototype || proto === null) return true
  // A WeChat object can originate in a different JS realm.  Accept the
  // ordinary cross-realm Object while still rejecting class instances.
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'constructor')
  return Object.getPrototypeOf(proto) === null
    && Object.prototype.toString.call(value) === '[object Object]'
    && descriptor
    && typeof descriptor.value === 'function'
    && descriptor.value.name === 'Object'
}

function rejectDangerousKeys(value, label) {
  for (const key of Object.getOwnPropertyNames(value)) {
    if (DANGEROUS_KEYS.has(key)) fail('PROTOTYPE_KEY', `${label} contains a prototype key`, { key })
  }
  if (Object.getOwnPropertySymbols(value).length) {
    fail('UNKNOWN_FIELD', `${label} cannot contain symbol fields`)
  }
}

function assertInput(value) {
  if (!isPlainRecord(value)) fail('INVALID_TASK', 'Task summary input must be a plain object')
  rejectDangerousKeys(value, 'task summary')
}

function assertString(value, label, { maxLength = 128 } = {}) {
  if (typeof value !== 'string' || value.length === 0) {
    fail('MISSING_VALUE', `${label} must be a non-empty string`, { label })
  }
  if (value.length > maxLength) fail('VALUE_TOO_LONG', `${label} is too long`, { label, maxLength })
  if (/\s/.test(value) || /[\u0000-\u001f\u007f]/.test(value)) {
    fail('INVALID_VALUE', `${label} contains whitespace or control characters`, { label })
  }
  try {
    encodeURIComponent(value)
  } catch (error) {
    fail('INVALID_UNICODE', `${label} contains invalid Unicode`, { label })
  }
  return value
}

function assertId(value, label) {
  assertString(value, label)
  if (!SAFE_ID.test(value) || URL_MARKERS.test(value)) {
    fail('INVALID_ID', `${label} must be an opaque ID, not a URL or path`, { label })
  }
  return value
}

function assertEnum(value, label, allowed) {
  assertString(value, label)
  if (!allowed.includes(value)) {
    fail('INVALID_ENUM', `${label} is not supported`, { label, allowed })
  }
  return value
}

function assertAllowedFields(input) {
  const allowed = new Set(['taskId', 'businessType', 'businessId', 'actorId', 'actorRole', 'actionType', 'status', 'reviewItemId'])
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) fail('UNKNOWN_FIELD', `Unknown task summary field: ${key}`, { key })
  }
}

function assertDomainIdDoesNotLookCrossDomain(businessType, businessId, label) {
  const lower = businessId.toLowerCase()
  for (const prefix of DOMAIN_ID_PREFIXES[businessType]) {
    if (lower === prefix || lower.startsWith(`${prefix}-`) || lower.startsWith(`${prefix}_`) || lower.startsWith(`${prefix}:`)) {
      fail('CROSS_DOMAIN_ID', `${label} looks like a ${prefix} domain ID`, { businessType, businessId, prefix })
    }
  }
}

function assertReviewItemDomain(businessType, reviewItemId) {
  // A review item is meaningful only for the adoption/rescue review domains.
  // Feeding and dynamic tasks must use their own businessId and actionType.
  if (reviewItemId !== undefined && !['adoption', 'rescue'].includes(businessType)) {
    fail('CROSS_DOMAIN_FIELD', 'reviewItemId is only valid for adoption or rescue tasks', { businessType })
  }
}

function identityPart(value) {
  return `${value.length}:${value}`
}

/**
 * Return the deterministic identity for object + phase + processing actor.
 * actorRole and status are intentionally absent: neither presentation field
 * may split, merge, or authorize a task.
 */
function taskIdFor(input) {
  if (!isPlainRecord(input)) fail('INVALID_TASK', 'Task identity input must be a plain object')
  rejectDangerousKeys(input, 'task identity')
  const { businessType, businessId, actorId, actionType } = input
  const type = assertEnum(businessType, 'businessType', TASK_BUSINESS_TYPES)
  const objectId = assertId(businessId, 'businessId')
  const actor = assertId(actorId, 'actorId')
  const phase = assertEnum(actionType, 'actionType', TASK_ACTION_TYPES[type])
  assertDomainIdDoesNotLookCrossDomain(type, objectId, 'businessId')
  return `task:${[type, objectId, phase, actor].map(identityPart).join('|')}`
}

/**
 * Normalize and freeze one task read model.  It is safe to render or route
 * from the result, but no write function is exposed by this module.
 */
function normalizeTaskSummary(input) {
  assertInput(input)
  assertAllowedFields(input)

  const businessType = assertEnum(input.businessType, 'businessType', TASK_BUSINESS_TYPES)
  const businessId = assertId(input.businessId, 'businessId')
  const actorId = assertId(input.actorId, 'actorId')
  const actorRole = assertEnum(input.actorRole, 'actorRole', TASK_ACTOR_ROLES[businessType])
  const actionType = assertEnum(input.actionType, 'actionType', TASK_ACTION_TYPES[businessType])
  const status = assertEnum(input.status, 'status', TASK_STATUSES)
  assertDomainIdDoesNotLookCrossDomain(businessType, businessId, 'businessId')
  assertReviewItemDomain(businessType, input.reviewItemId)

  let reviewItemId
  if (input.reviewItemId !== undefined) {
    reviewItemId = assertId(input.reviewItemId, 'reviewItemId')
    assertDomainIdDoesNotLookCrossDomain(businessType, reviewItemId, 'reviewItemId')
  }

  const taskId = taskIdFor({ businessType, businessId, actorId, actionType })
  if (input.taskId !== undefined) {
    assertString(input.taskId, 'taskId', { maxLength: 1024 })
    if (input.taskId !== taskId) fail('TASK_ID_MISMATCH', 'taskId does not match its object, phase, and actor', { expected: taskId })
  }

  const summary = {
    taskId,
    businessType,
    businessId,
    actorId,
    actorRole,
    actionType,
    status,
    ...(reviewItemId === undefined ? {} : { reviewItemId }),
  }
  return Object.freeze(summary)
}

const createTaskSummary = normalizeTaskSummary

function isTaskProcessed(summary) {
  return TASK_STATUS_BUCKETS[normalizeTaskSummary(summary).status] === 'processed'
}

function getTaskState(summary) {
  const normalized = normalizeTaskSummary(summary)
  return Object.freeze({
    status: normalized.status,
    bucket: TASK_STATUS_BUCKETS[normalized.status],
    processed: TASK_STATUS_BUCKETS[normalized.status] === 'processed',
  })
}

/**
 * Access is actor identity based.  actorRole and status are ignored for
 * access and can never create write capability.  A malformed candidate is a
 * denied read rather than an exception at a list boundary.
 */
function getTaskAccess(summary, actor) {
  let normalized
  try {
    normalized = normalizeTaskSummary(summary)
  } catch (error) {
    return Object.freeze({ canRead: false, canWrite: false, reason: error.code || 'INVALID_TASK' })
  }
  // G-ACTOR's trusted session shape is { id, roles }.  actorId is accepted as
  // a narrow test/adapter spelling; role/roles are intentionally ignored.
  const actorId = isPlainRecord(actor)
    ? (typeof actor.id === 'string' ? actor.id : (typeof actor.actorId === 'string' ? actor.actorId : ''))
    : ''
  const canRead = actorId === normalized.actorId
  return Object.freeze({
    canRead,
    canWrite: false,
    reason: canRead ? 'actor-match' : 'actor-mismatch',
  })
}

function canReadTaskSummary(summary, actor) {
  return getTaskAccess(summary, actor).canRead
}

// There is deliberately no task mutation API.  This explicit predicate makes
// the boundary easy for callers and tests to assert without implying that a
// task role/status grants a business capability.
function canWriteTaskSummary() {
  return false
}

/**
 * De-duplicate refreshes by taskId.  A processed state wins over an older
 * pending state for the same identity, ensuring the item stays readable in
 * the processed list without changing its business落点.
 */
function dedupeTaskSummaries(items) {
  if (!Array.isArray(items)) fail('INVALID_TASK_LIST', 'Task summaries must be an array')
  const byId = new Map()
  for (const item of items) {
    const normalized = normalizeTaskSummary(item)
    const previous = byId.get(normalized.taskId)
    if (!previous) {
      byId.set(normalized.taskId, normalized)
      continue
    }
    const previousProcessed = isTaskProcessed(previous)
    const currentProcessed = isTaskProcessed(normalized)
    if (!previousProcessed || currentProcessed) byId.set(normalized.taskId, normalized)
  }
  return Object.freeze(Array.from(byId.values()))
}

export {
  TASK_BUSINESS_TYPES,
  TASK_ACTOR_ROLES,
  TASK_ACTION_TYPES,
  TASK_STATUSES,
  TASK_STATUS_BUCKETS,
  TaskContractError,
  taskIdFor,
  normalizeTaskSummary,
  createTaskSummary,
  getTaskState,
  isTaskProcessed,
  getTaskAccess,
  canReadTaskSummary,
  canWriteTaskSummary,
  dedupeTaskSummaries,
}
