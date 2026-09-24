'use strict'

/**
 * Pure, read-only task-summary contract.
 *
 * This module intentionally has no Vue, uni-app, page, package, storage, or
 * service imports. A task summary identifies a piece of work for one actor;
 * it is a read model and never grants the actor the ability to mutate the
 * business record. The actionType is the task phase used by the identity
 * function, so refreshing the same source task does not create a new task.
 */

type JsonRecord = Record<string, unknown>

export type TaskBusinessType = 'adoption' | 'rescue' | 'feeding' | 'dynamic'
export type TaskActorRole =
  | 'applicant'
  | 'owner'
  | 'cloud_parent'
  | 'reviewer'
  | 'verifier'
  | 'donor'
  | 'recipient'
  | 'feedback_author'
  | 'author'
  | 'commenter'
  | 'moderator'
export type TaskActionType =
  | 'apply'
  | 'confirm'
  | 'review'
  | 'supply_material'
  | 'claim_reward'
  | 'proof'
  | 'fund'
  | 'order'
  | 'fulfill'
  | 'complete'
  | 'feedback'
  | 'publish'
  | 'comment'
  | 'moderate'
export type TaskStatus =
  'pending' | 'in_progress' | 'processed' | 'completed' | 'failed' | 'cancelled' | 'expired'
export type TaskStatusBucket = 'pending' | 'processed'

export interface TaskSummary {
  taskId: string
  businessType: TaskBusinessType
  businessId: string
  actorId: string
  actorRole: TaskActorRole
  actionType: TaskActionType
  status: TaskStatus
  reviewItemId?: string
}

export interface TaskState {
  status: TaskStatus
  bucket: TaskStatusBucket
  processed: boolean
}

export interface TaskAccess {
  canRead: boolean
  canWrite: false
  reason: string
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const URL_MARKERS = /[/?#%]|:\/\//

function freezeList<T extends string>(...values: T[]): readonly T[] {
  return Object.freeze(values)
}

const TASK_BUSINESS_TYPES: readonly TaskBusinessType[] = Object.freeze([
  'adoption',
  'rescue',
  'feeding',
  'dynamic',
])

// Roles describe the source presentation only. They are deliberately
// domain-scoped so a rescue reviewer cannot be smuggled into an adoption task
// by changing a query or message field.
const TASK_ACTOR_ROLES: Readonly<Record<TaskBusinessType, readonly TaskActorRole[]>> =
  Object.freeze({
    adoption: freezeList<TaskActorRole>('applicant', 'owner', 'cloud_parent', 'reviewer'),
    rescue: freezeList<TaskActorRole>('applicant', 'owner', 'reviewer', 'verifier'),
    feeding: freezeList<TaskActorRole>('donor', 'owner', 'recipient', 'feedback_author'),
    dynamic: freezeList<TaskActorRole>('author', 'commenter', 'moderator'),
  })

// actionType is both the display action and the task's phase. Adding a new
// action requires a contract update instead of silently accepting arbitrary
// strings from a deep link.
const TASK_ACTION_TYPES: Readonly<Record<TaskBusinessType, readonly TaskActionType[]>> =
  Object.freeze({
    adoption: freezeList<TaskActionType>(
      'apply',
      'confirm',
      'review',
      'supply_material',
      'claim_reward',
    ),
    rescue: freezeList<TaskActionType>('apply', 'proof', 'review', 'fund'),
    feeding: freezeList<TaskActionType>('order', 'fulfill', 'complete', 'feedback'),
    dynamic: freezeList<TaskActionType>('publish', 'comment', 'moderate', 'feedback'),
  })

// A status is presentation metadata. It does not participate in taskId and
// it is not consulted by any write capability contract.
const TASK_STATUSES: readonly TaskStatus[] = Object.freeze([
  'pending',
  'in_progress',
  'processed',
  'completed',
  'failed',
  'cancelled',
  'expired',
])

const TASK_STATUS_BUCKETS: Readonly<Record<TaskStatus, TaskStatusBucket>> = Object.freeze({
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
// valid. Domain ownership still comes from the trusted data resolver.
const DOMAIN_ID_PREFIXES: Readonly<Record<TaskBusinessType, readonly string[]>> = Object.freeze({
  adoption: Object.freeze(['rescue', 'feeding', 'order', 'dynamic']),
  rescue: Object.freeze(['adoption', 'feeding', 'order', 'dynamic']),
  feeding: Object.freeze(['adoption', 'rescue', 'dynamic']),
  dynamic: Object.freeze(['adoption', 'rescue', 'feeding', 'order']),
})

class TaskContractError extends Error {
  readonly code: string
  readonly details: JsonRecord

  constructor(code: string, message: string, details: JsonRecord = {}) {
    super(message)
    this.name = 'TaskContractError'
    this.code = code
    this.details = details
  }
}

function fail(code: string, message: string, details?: JsonRecord): never {
  throw new TaskContractError(code, message, details)
}

function isObjectRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isPlainRecord(value: unknown): value is JsonRecord {
  if (!isObjectRecord(value)) return false
  const proto = Object.getPrototypeOf(value)
  if (proto === Object.prototype || proto === null) return true
  // A WeChat object can originate in a different JS realm. Accept the
  // ordinary cross-realm Object while still rejecting class instances.
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'constructor')
  return (
    Object.getPrototypeOf(proto) === null &&
    Object.prototype.toString.call(value) === '[object Object]' &&
    descriptor !== undefined &&
    typeof descriptor.value === 'function' &&
    descriptor.value.name === 'Object'
  )
}

function rejectDangerousKeys(value: object, label: string): void {
  for (const key of Object.getOwnPropertyNames(value)) {
    if (DANGEROUS_KEYS.has(key)) fail('PROTOTYPE_KEY', `${label} contains a prototype key`, { key })
  }
  if (Object.getOwnPropertySymbols(value).length) {
    fail('UNKNOWN_FIELD', `${label} cannot contain symbol fields`)
  }
}

function assertInput(value: unknown): asserts value is JsonRecord {
  if (!isPlainRecord(value)) fail('INVALID_TASK', 'Task summary input must be a plain object')
  rejectDangerousKeys(value, 'task summary')
}

interface StringOptions {
  maxLength?: number
}

function assertString(
  value: unknown,
  label: string,
  { maxLength = 128 }: StringOptions = {},
): string {
  if (typeof value !== 'string' || value.length === 0) {
    fail('MISSING_VALUE', `${label} must be a non-empty string`, { label })
  }
  if (value.length > maxLength) fail('VALUE_TOO_LONG', `${label} is too long`, { label, maxLength })
  if (/\s/.test(value) || hasControlCharacter(value)) {
    fail('INVALID_VALUE', `${label} contains whitespace or control characters`, { label })
  }
  try {
    encodeURIComponent(value)
  } catch {
    fail('INVALID_UNICODE', `${label} contains invalid Unicode`, { label })
  }
  return value
}

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0)
    if ((code >= 0 && code <= 0x1f) || code === 0x7f) return true
  }
  return false
}

function assertId(value: unknown, label: string): string {
  const normalized = assertString(value, label)
  if (!SAFE_ID.test(normalized) || URL_MARKERS.test(normalized)) {
    fail('INVALID_ID', `${label} must be an opaque ID, not a URL or path`, { label })
  }
  return normalized
}

function includesValue<T extends string>(values: readonly T[], value: string): value is T {
  return values.some((candidate) => candidate === value)
}

function assertEnum<T extends string>(value: unknown, label: string, allowed: readonly T[]): T {
  const normalized = assertString(value, label)
  if (!includesValue(allowed, normalized)) {
    fail('INVALID_ENUM', `${label} is not supported`, { label, allowed })
  }
  return normalized
}

function assertAllowedFields(input: JsonRecord): void {
  const allowed = new Set([
    'taskId',
    'businessType',
    'businessId',
    'actorId',
    'actorRole',
    'actionType',
    'status',
    'reviewItemId',
  ])
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) fail('UNKNOWN_FIELD', `Unknown task summary field: ${key}`, { key })
  }
}

function assertDomainIdDoesNotLookCrossDomain(
  businessType: TaskBusinessType,
  businessId: string,
  label: string,
): void {
  const lower = businessId.toLowerCase()
  for (const prefix of DOMAIN_ID_PREFIXES[businessType]) {
    if (
      lower === prefix ||
      lower.startsWith(`${prefix}-`) ||
      lower.startsWith(`${prefix}_`) ||
      lower.startsWith(`${prefix}:`)
    ) {
      fail('CROSS_DOMAIN_ID', `${label} looks like a ${prefix} domain ID`, {
        businessType,
        businessId,
        prefix,
      })
    }
  }
}

function assertReviewItemDomain(businessType: TaskBusinessType, reviewItemId: unknown): void {
  // A review item is meaningful only for the adoption/rescue review domains.
  // Feeding and dynamic tasks must use their own businessId and actionType.
  if (reviewItemId !== undefined && !['adoption', 'rescue'].includes(businessType)) {
    fail('CROSS_DOMAIN_FIELD', 'reviewItemId is only valid for adoption or rescue tasks', {
      businessType,
    })
  }
}

function identityPart(value: string): string {
  return `${value.length}:${value}`
}

/**
 * Return the deterministic identity for object + phase + processing actor.
 * actorRole and status are intentionally absent: neither presentation field
 * may split, merge, or authorize a task.
 */
function taskIdFor(input: unknown): string {
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

/** Normalize and freeze one task read model. */
function normalizeTaskSummary(input: unknown): TaskSummary {
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

  let reviewItemId: string | undefined
  if (input.reviewItemId !== undefined) {
    reviewItemId = assertId(input.reviewItemId, 'reviewItemId')
    assertDomainIdDoesNotLookCrossDomain(businessType, reviewItemId, 'reviewItemId')
  }

  const taskId = taskIdFor({ businessType, businessId, actorId, actionType })
  if (input.taskId !== undefined) {
    assertString(input.taskId, 'taskId', { maxLength: 1024 })
    if (input.taskId !== taskId)
      fail('TASK_ID_MISMATCH', 'taskId does not match its object, phase, and actor', {
        expected: taskId,
      })
  }

  const summary: TaskSummary = {
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

function isTaskProcessed(summary: unknown): boolean {
  return TASK_STATUS_BUCKETS[normalizeTaskSummary(summary).status] === 'processed'
}

function getTaskState(summary: unknown): TaskState {
  const normalized = normalizeTaskSummary(summary)
  return Object.freeze({
    status: normalized.status,
    bucket: TASK_STATUS_BUCKETS[normalized.status],
    processed: TASK_STATUS_BUCKETS[normalized.status] === 'processed',
  })
}

function errorCode(error: unknown): string {
  return isObjectRecord(error) && typeof error.code === 'string' ? error.code : 'INVALID_TASK'
}

/** Access is actor identity based; roles and status are presentation only. */
function getTaskAccess(summary: unknown, actor: unknown): TaskAccess {
  let normalized: TaskSummary
  try {
    normalized = normalizeTaskSummary(summary)
  } catch (error) {
    return Object.freeze({ canRead: false, canWrite: false, reason: errorCode(error) })
  }
  const actorId = isPlainRecord(actor)
    ? typeof actor.id === 'string'
      ? actor.id
      : typeof actor.actorId === 'string'
        ? actor.actorId
        : ''
    : ''
  const canRead = actorId === normalized.actorId
  return Object.freeze({
    canRead,
    canWrite: false,
    reason: canRead ? 'actor-match' : 'actor-mismatch',
  })
}

function canReadTaskSummary(summary: unknown, actor: unknown): boolean {
  return getTaskAccess(summary, actor).canRead
}

// There is deliberately no task mutation API.
function canWriteTaskSummary(): false {
  return false
}

/** De-duplicate refreshes by taskId; processed state wins over pending. */
function dedupeTaskSummaries(items: unknown): readonly TaskSummary[] {
  if (!Array.isArray(items)) fail('INVALID_TASK_LIST', 'Task summaries must be an array')
  const byId = new Map<string, TaskSummary>()
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
