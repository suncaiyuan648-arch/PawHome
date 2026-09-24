/**
 * Pure feedback-task and evidence contract.
 *
 * This module is a read-model seam for the feeding and social domains.  It
 * has no Vue, uni-app, page, package, storage, or network dependency.  A
 * domain adapter supplies the trusted actor, the already-resolved order and
 * animal records, and an explicit policy version.  This contract never
 * performs a write and never treats a dynamic route/query value as proof of
 * ownership or permission.
 *
 * The policy is deliberately required.  Required/maximum counts, the
 * feedback window, and whether deleted/withdrawn evidence remains counted
 * are product rules and cannot be inferred from a page or a fixture.
 */

type JsonRecord = Record<string, unknown>
type FeedbackNow = string | number
type FeedbackActorProvider = () => unknown
export type FeedbackKind = 'dynamic' | 'feeding_evidence'
export type FeedbackBusinessIdentityInput =
  | {
      kind: 'dynamic'
      dynamicId: string
      actorId: string
      policyVersion: string
      attemptKey: string
    }
  | {
      kind: 'feeding_evidence'
      orderId: string
      animalId: string
      yardId: string
      actorId: string
      policyVersion: string
      attemptKey: string
    }
export type FeedbackRequestIdentityInput = FeedbackBusinessIdentityInput & { requestId: string }
export type EvidenceState =
  'pending' | 'active' | 'corrected' | 'deleted' | 'withdrawn' | 'rejected'
export type FeedbackTaskStatus = 'scheduled' | 'pending' | 'completed' | 'excess' | 'overdue'
type CountRule = 'count' | 'exclude'

interface TrustedActor {
  id: string
}

interface TimestampValue {
  milliseconds: number
  value: string
}

export interface FeedbackPolicy {
  version: string
  evidenceKinds: readonly FeedbackKind[]
  requiredCount: number
  maximumCount: number
  startsAt: string | null
  expiresAt: string | null
  countRules: Readonly<Record<EvidenceState, CountRule>>
  lastFeedbackStates: readonly EvidenceState[]
}

interface FeedbackIdentity {
  actorId: string
  policyVersion: string
  attemptKey: string | null
  dynamicId?: string
}

interface Association {
  orderId: string
  animalId: string
  yardId: string
}

interface NormalizedEvidence extends JsonRecord {
  evidenceId: string
  dynamicId: string | null
  kind: FeedbackKind
  actorId: string
  policyVersion: string
  attemptKey: string
  requestId: string
  requestKey: string
  businessKey: string
  state: EvidenceState
  createdAt: string
  _createdAt: number
  orderId?: string
  animalId?: string
  yardId?: string
}

export interface FeedbackTaskSummary extends JsonRecord {
  taskId: string
  kind: FeedbackKind
  dynamicId?: string
  orderId?: string
  animalId?: string
  yardId?: string
  actorId: string
  policyVersion: string
  requiredCount: number
  maximumCount: number
  completedCount: number
  status: FeedbackTaskStatus
  limitExceeded: boolean
  nextFeedbackAt: string | null
  lastFeedbackAt: string | null
  expiresAt: string | null
  isOverdue: boolean
  evidenceCount: number
}

export interface FeedbackTaskAccess {
  canRead: boolean
  canWriteOrder: false
  canWriteAnimal: false
  canDeleteEvidence: false
  canCorrectEvidence: false
  reason: string
}

interface TimestampOptions {
  required?: boolean
}

interface IdentityOptions {
  evidence?: boolean
  requireAttempt?: boolean
}

interface DedupeOptions {
  policy?: FeedbackPolicy
  now?: FeedbackNow
}

interface TaskSummaryOptions {
  policy?: FeedbackPolicy
  now?: FeedbackNow
  actorProvider?: FeedbackActorProvider
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

export const FEEDBACK_KINDS: Readonly<{
  DYNAMIC: 'dynamic'
  FEEDING_EVIDENCE: 'feeding_evidence'
}> = Object.freeze({
  DYNAMIC: 'dynamic',
  FEEDING_EVIDENCE: 'feeding_evidence',
})

export const FEEDBACK_KIND_VALUES: readonly FeedbackKind[] = Object.freeze([
  FEEDBACK_KINDS.DYNAMIC,
  FEEDBACK_KINDS.FEEDING_EVIDENCE,
])

export const EVIDENCE_STATES: readonly EvidenceState[] = Object.freeze([
  'pending',
  'active',
  'corrected',
  'deleted',
  'withdrawn',
  'rejected',
])

export const FEEDBACK_TASK_STATUSES: readonly FeedbackTaskStatus[] = Object.freeze([
  'scheduled',
  'pending',
  'completed',
  'excess',
  'overdue',
])

export class FeedbackContractError extends Error {
  readonly code: string
  readonly details: JsonRecord

  constructor(code: string, message: string, details: JsonRecord = {}) {
    super(message)
    this.name = 'FeedbackContractError'
    this.code = code
    this.details = details
  }
}

function fail(code: string, message: string, details: JsonRecord = {}): never {
  throw new FeedbackContractError(code, message, details)
}

function own(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function isPlainRecord(value: unknown): value is JsonRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  if (prototype === Object.prototype || prototype === null) return true
  // WeChat native objects can cross a JS realm boundary.  Accept an ordinary
  // cross-realm Object but continue to reject class instances.
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'constructor')
  return (
    Object.getPrototypeOf(prototype) === null &&
    Object.prototype.toString.call(value) === '[object Object]' &&
    descriptor !== undefined &&
    typeof descriptor.value === 'function' &&
    descriptor.value.name === 'Object'
  )
}

function rejectDangerousKeys(value: JsonRecord, label: string): void {
  for (const key of Object.getOwnPropertyNames(value)) {
    if (DANGEROUS_KEYS.has(key)) fail('PROTOTYPE_KEY', `${label} contains a prototype key`, { key })
  }
  if (Object.getOwnPropertySymbols(value).length) {
    fail('UNKNOWN_FIELD', `${label} cannot contain symbol fields`)
  }
}

function assertRecord(value: unknown, label: string): asserts value is JsonRecord {
  if (!isPlainRecord(value)) fail('INVALID_RECORD', `${label} must be a plain object`, { label })
  rejectDangerousKeys(value, label)
}

function assertAllowedFields(value: JsonRecord, allowed: ReadonlySet<string>, label: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail('UNKNOWN_FIELD', `Unknown ${label} field: ${key}`, { key })
  }
}

function assertId(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    fail('MISSING_ID', `${label} is required`, { label })
  }
  if (value !== value.trim() || !SAFE_ID.test(value) || URL_MARKERS.test(value)) {
    fail('INVALID_ID', `${label} must be an opaque ID`, { label })
  }
  return value
}

function assertVersion(value: unknown, label = 'policyVersion'): string {
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim()) {
    fail('MISSING_POLICY_VERSION', `${label} is required`, { label })
  }
  if (!SAFE_ID.test(value) || URL_MARKERS.test(value)) {
    fail('INVALID_POLICY_VERSION', `${label} must be an opaque version`, { label })
  }
  return value
}

function assertEnum<T extends string>(value: unknown, label: string, allowed: readonly T[]): T {
  if (typeof value !== 'string' || !includesValue(allowed, value)) {
    fail('INVALID_ENUM', `${label} is not supported`, { label, allowed })
  }
  return value
}

function includesValue<T extends string>(values: readonly T[], value: string): value is T {
  return values.some((candidate) => candidate === value)
}

function errorCode(error: unknown, fallback: string): string {
  if (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
  )
    return error.code
  return fallback
}

function resolveTrustedActor(actorProvider: unknown): TrustedActor {
  if (typeof actorProvider !== 'function')
    fail('ACTOR_PROVIDER_REQUIRED', 'A trusted actorProvider function is required')
  let provided: unknown
  try {
    provided = actorProvider()
  } catch {
    fail('ACTOR_PROVIDER_FAILED', 'The trusted actorProvider failed')
  }
  if (!isPlainRecord(provided))
    fail('ACTOR_PROVIDER_FAILED', 'The trusted actorProvider must return an actor/session record')
  const actor = own(provided, 'actor') ? provided.actor : provided
  assertRecord(actor, 'trusted actor')
  const actorId = assertId(own(actor, 'id') ? actor.id : actor.actorId, 'trusted actor.id')
  return Object.freeze({ id: actorId })
}

function normalizeTimestamp(
  value: unknown,
  label: string,
  { required = false }: TimestampOptions = {},
): TimestampValue | null {
  if (value === undefined || value === null || value === '') {
    if (required) fail('MISSING_TIMESTAMP', `${label} is required`, { label })
    return null
  }
  let milliseconds: number
  if (typeof value === 'number' && Number.isSafeInteger(value)) {
    milliseconds = value
  } else if (typeof value === 'string' && value.trim()) {
    try {
      milliseconds = Date.parse(value)
    } catch {
      fail('INVALID_TIMESTAMP', `${label} is not a valid timestamp`, { label })
    }
  } else {
    fail('INVALID_TIMESTAMP', `${label} must be an epoch millisecond or ISO timestamp`, { label })
  }
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    fail('INVALID_TIMESTAMP', `${label} is not a valid timestamp`, { label })
  }
  try {
    return Object.freeze({ milliseconds, value: new Date(milliseconds).toISOString() })
  } catch {
    fail('INVALID_TIMESTAMP', `${label} is outside the supported timestamp range`, { label })
  }
}

function timestampValue(
  value: unknown,
  label: string,
  options: TimestampOptions = {},
): TimestampValue | null {
  return normalizeTimestamp(value, label, options)
}

function normalizePolicy(policy: unknown): FeedbackPolicy {
  if (!isPlainRecord(policy)) fail('POLICY_REQUIRED', 'An explicit feedback policy is required')
  assertRecord(policy, 'feedback policy')
  assertAllowedFields(
    policy,
    new Set([
      'version',
      'evidenceKinds',
      'requiredCount',
      'maximumCount',
      'startsAt',
      'expiresAt',
      'countRules',
      'lastFeedbackStates',
    ]),
    'feedback policy',
  )
  const version = assertVersion(policy.version, 'policy.version')
  if (!Array.isArray(policy.evidenceKinds) || policy.evidenceKinds.length === 0) {
    fail(
      'POLICY_KINDS_REQUIRED',
      'policy.evidenceKinds must explicitly allow at least one feedback kind',
    )
  }
  const evidenceKinds: FeedbackKind[] = []
  for (const kind of policy.evidenceKinds) {
    const normalized = assertEnum(kind, 'policy.evidenceKinds[]', FEEDBACK_KIND_VALUES)
    if (!evidenceKinds.includes(normalized)) evidenceKinds.push(normalized)
  }
  if (
    typeof policy.requiredCount !== 'number' ||
    !Number.isSafeInteger(policy.requiredCount) ||
    policy.requiredCount < 0
  ) {
    fail('INVALID_POLICY_COUNT', 'policy.requiredCount must be a non-negative safe integer')
  }
  if (
    typeof policy.maximumCount !== 'number' ||
    !Number.isSafeInteger(policy.maximumCount) ||
    policy.maximumCount < policy.requiredCount
  ) {
    fail('INVALID_POLICY_COUNT', 'policy.maximumCount must be a safe integer >= requiredCount')
  }
  const startsAt = timestampValue(policy.startsAt, 'policy.startsAt')
  const expiresAt = timestampValue(policy.expiresAt, 'policy.expiresAt')
  if (startsAt && expiresAt && expiresAt.milliseconds <= startsAt.milliseconds) {
    fail('INVALID_POLICY_WINDOW', 'policy.expiresAt must be after policy.startsAt')
  }
  if (!isPlainRecord(policy.countRules))
    fail('COUNT_RULES_REQUIRED', 'policy.countRules must explicitly define every evidence state')
  assertRecord(policy.countRules, 'policy.countRules')
  for (const key of Object.keys(policy.countRules)) {
    if (!includesValue(EVIDENCE_STATES, key))
      fail('UNKNOWN_COUNT_STATE', `Unknown count rule state: ${key}`)
  }
  const countRules: Record<EvidenceState, CountRule> = {
    pending: 'exclude',
    active: 'exclude',
    corrected: 'exclude',
    deleted: 'exclude',
    withdrawn: 'exclude',
    rejected: 'exclude',
  }
  for (const state of EVIDENCE_STATES) {
    if (!own(policy.countRules, state))
      fail('COUNT_RULE_REQUIRED', `policy.countRules.${state} is required`, { state })
    const rule = policy.countRules[state]
    if (rule !== 'count' && rule !== 'exclude') {
      fail('INVALID_COUNT_RULE', `policy.countRules.${state} must be count or exclude`, { state })
    }
    countRules[state] = rule
  }
  if (!Array.isArray(policy.lastFeedbackStates)) {
    fail('LAST_FEEDBACK_RULE_REQUIRED', 'policy.lastFeedbackStates must be explicitly supplied')
  }
  const lastFeedbackStates: EvidenceState[] = []
  for (const state of policy.lastFeedbackStates) {
    const normalized = assertEnum(state, 'policy.lastFeedbackStates[]', EVIDENCE_STATES)
    if (!lastFeedbackStates.includes(normalized)) lastFeedbackStates.push(normalized)
  }
  return Object.freeze({
    version,
    evidenceKinds: Object.freeze(evidenceKinds),
    requiredCount: policy.requiredCount,
    maximumCount: policy.maximumCount,
    startsAt: startsAt ? startsAt.value : null,
    expiresAt: expiresAt ? expiresAt.value : null,
    countRules: Object.freeze(countRules),
    lastFeedbackStates: Object.freeze(lastFeedbackStates),
  })
}

export const normalizeFeedbackPolicy = normalizePolicy

function normalizeIdentityFields(
  input: JsonRecord,
  kind: FeedbackKind,
  { evidence = true, requireAttempt = true }: IdentityOptions = {},
): FeedbackIdentity {
  const actorId = assertId(input.actorId, 'actorId')
  const policyVersion = assertVersion(input.policyVersion)
  const attemptKey = requireAttempt ? assertId(input.attemptKey, 'attemptKey') : null
  const dynamicId =
    input.dynamicId === undefined ? undefined : assertId(input.dynamicId, 'dynamicId')
  if (kind === FEEDBACK_KINDS.DYNAMIC) {
    if (!dynamicId) fail('MISSING_DYNAMIC_ID', 'ordinary dynamic feedback requires dynamicId')
    if (
      own(input, 'order') ||
      own(input, 'animal') ||
      own(input, 'orderId') ||
      own(input, 'animalId') ||
      own(input, 'yardId')
    ) {
      fail('CROSS_DOMAIN_FIELD', 'ordinary dynamic feedback cannot carry order/animal associations')
    }
  } else if (kind === FEEDBACK_KINDS.FEEDING_EVIDENCE) {
    if (evidence && !dynamicId)
      fail('MISSING_DYNAMIC_ID', 'feeding evidence must point to its dynamic evidence carrier')
    if (!evidence) return { actorId, policyVersion, attemptKey, dynamicId }
    if (!input.order || !input.animal)
      fail('MISSING_ASSOCIATION', 'feeding evidence requires resolved order and animal records')
  } else {
    fail('INVALID_ENUM', 'feedback kind is not supported', { kind })
  }
  return { actorId, policyVersion, attemptKey, dynamicId }
}

function normalizeOrderAndAnimal(orderInput: unknown, animalInput: unknown): Association {
  assertRecord(orderInput, 'feedback order')
  assertAllowedFields(orderInput, new Set(['orderId', 'animalId', 'yardId']), 'feedback order')
  assertRecord(animalInput, 'feedback animal')
  assertAllowedFields(animalInput, new Set(['animalId', 'yardId']), 'feedback animal')
  const orderId = assertId(orderInput.orderId, 'order.orderId')
  const orderAnimalId = assertId(orderInput.animalId, 'order.animalId')
  const orderYardId = assertId(orderInput.yardId, 'order.yardId')
  const animalId = assertId(animalInput.animalId, 'animal.animalId')
  const animalYardId = assertId(animalInput.yardId, 'animal.yardId')
  if (orderAnimalId !== animalId)
    fail('ASSOCIATION_CONFLICT', 'order and animal identify different animals')
  if (orderYardId !== animalYardId)
    fail('CROSS_YARD_ASSOCIATION', 'order and animal belong to different yards')
  return Object.freeze({ orderId, animalId, yardId: orderYardId })
}

function identityPart(value: string): string {
  return `${value.length}:${value}`
}

/**
 * The business key identifies one legal feedback attempt.  requestId is
 * intentionally absent: transport retries with a new requestId must still
 * resolve to the same attempt.  A new attemptKey is the only way to count a
 * different feedback event.
 */
export function feedbackBusinessKey(input: FeedbackBusinessIdentityInput): string {
  assertRecord(input, 'feedback identity')
  assertAllowedFields(
    input,
    new Set([
      'kind',
      'dynamicId',
      'orderId',
      'animalId',
      'yardId',
      'actorId',
      'policyVersion',
      'attemptKey',
    ]),
    'feedback identity',
  )
  const kind = assertEnum(input.kind, 'kind', FEEDBACK_KIND_VALUES)
  if (kind === FEEDBACK_KINDS.FEEDING_EVIDENCE && own(input, 'dynamicId')) {
    fail(
      'CROSS_DOMAIN_FIELD',
      'feeding business keys must use order/animal identity, not a dynamicId',
    )
  }
  const identity = normalizeIdentityFields(input, kind, { evidence: false })
  const values: string[] = [kind]
  if (input.kind === FEEDBACK_KINDS.DYNAMIC) {
    if (!identity.dynamicId)
      fail('MISSING_DYNAMIC_ID', 'ordinary dynamic feedback requires dynamicId')
    values.push(identity.dynamicId)
  } else
    values.push(
      assertId(input.orderId, 'orderId'),
      assertId(input.animalId, 'animalId'),
      assertId(input.yardId, 'yardId'),
    )
  if (!identity.attemptKey) fail('MISSING_ID', 'attemptKey is required')
  values.push(identity.actorId, identity.policyVersion, identity.attemptKey)
  return `feedback:${values.map(identityPart).join('|')}`
}

export function feedbackRequestKey(input: FeedbackRequestIdentityInput): string {
  assertRecord(input, 'feedback request identity')
  assertAllowedFields(
    input,
    new Set([
      'kind',
      'dynamicId',
      'orderId',
      'animalId',
      'yardId',
      'actorId',
      'policyVersion',
      'attemptKey',
      'requestId',
    ]),
    'feedback request identity',
  )
  const requestId = assertId(input.requestId, 'requestId')
  const businessInput: FeedbackBusinessIdentityInput =
    input.kind === 'dynamic'
      ? {
          kind: input.kind,
          dynamicId: input.dynamicId,
          actorId: input.actorId,
          policyVersion: input.policyVersion,
          attemptKey: input.attemptKey,
        }
      : {
          kind: input.kind,
          orderId: input.orderId,
          animalId: input.animalId,
          yardId: input.yardId,
          actorId: input.actorId,
          policyVersion: input.policyVersion,
          attemptKey: input.attemptKey,
        }
  return `${feedbackBusinessKey(businessInput)}|request:${identityPart(requestId)}`
}

function normalizeEvidenceRecord(input: unknown, policy: FeedbackPolicy): NormalizedEvidence {
  if (!isPlainRecord(input)) fail('INVALID_EVIDENCE', 'feedback evidence must be a plain object')
  assertRecord(input, 'feedback evidence')
  assertAllowedFields(
    input,
    new Set([
      'evidenceId',
      'dynamicId',
      'kind',
      'actorId',
      'policyVersion',
      'attemptKey',
      'requestId',
      'state',
      'createdAt',
      'order',
      'animal',
      'mutationIntent',
    ]),
    'feedback evidence',
  )
  const kind = assertEnum(input.kind, 'kind', FEEDBACK_KIND_VALUES)
  const normalizedPolicy = normalizePolicy(policy)
  if (!includesValue(normalizedPolicy.evidenceKinds, kind)) {
    fail('POLICY_KIND_NOT_ALLOWED', `policy ${normalizedPolicy.version} does not allow ${kind}`)
  }
  if (own(input, 'mutationIntent')) {
    fail(
      'MUTATION_INTENT_NOT_SUPPORTED',
      'evidence deletion, withdrawal, and correction are not write operations of this contract',
    )
  }
  const evidenceId = assertId(input.evidenceId, 'evidenceId')
  const identity = normalizeIdentityFields(input, kind)
  if (!identity.attemptKey) fail('MISSING_ID', 'attemptKey is required')
  const attemptKey = identity.attemptKey
  if (identity.policyVersion !== normalizedPolicy.version) {
    fail('POLICY_VERSION_MISMATCH', 'evidence policyVersion does not match the injected policy')
  }
  const requestId = assertId(input.requestId, 'requestId')
  const state = assertEnum(input.state, 'state', EVIDENCE_STATES)
  const createdAt = timestampValue(input.createdAt, 'createdAt', { required: true })
  if (!createdAt) fail('MISSING_TIMESTAMP', 'createdAt is required')
  let association: Association | null = null
  if (kind === FEEDBACK_KINDS.FEEDING_EVIDENCE) {
    association = normalizeOrderAndAnimal(input.order, input.animal)
  } else {
    if (input.order || input.animal)
      fail('CROSS_DOMAIN_FIELD', 'ordinary dynamic evidence cannot carry order/animal records')
  }
  if (!association && kind === FEEDBACK_KINDS.FEEDING_EVIDENCE)
    fail('MISSING_ASSOCIATION', 'feeding evidence requires resolved order and animal records')
  let businessInput: FeedbackBusinessIdentityInput
  if (kind === FEEDBACK_KINDS.DYNAMIC) {
    if (!identity.dynamicId)
      fail('MISSING_DYNAMIC_ID', 'ordinary dynamic feedback requires dynamicId')
    businessInput = {
      kind,
      dynamicId: identity.dynamicId,
      actorId: identity.actorId,
      policyVersion: identity.policyVersion,
      attemptKey,
    }
  } else {
    if (!association)
      fail('MISSING_ASSOCIATION', 'feeding evidence requires resolved order and animal records')
    businessInput = {
      kind,
      orderId: association.orderId,
      animalId: association.animalId,
      yardId: association.yardId,
      actorId: identity.actorId,
      policyVersion: identity.policyVersion,
      attemptKey,
    }
  }
  const businessKey = feedbackBusinessKey(businessInput)
  const normalized: NormalizedEvidence = {
    evidenceId,
    dynamicId: identity.dynamicId || null,
    kind,
    actorId: identity.actorId,
    policyVersion: identity.policyVersion,
    attemptKey,
    requestId,
    requestKey: feedbackRequestKey({ ...businessInput, requestId }),
    businessKey,
    state,
    createdAt: createdAt.value,
    _createdAt: createdAt.milliseconds,
    ...(association || {}),
  }
  return Object.freeze(normalized)
}

export const normalizeFeedbackEvidence = normalizeEvidenceRecord

function pickLatestDuplicate(
  previous: NormalizedEvidence,
  current: NormalizedEvidence,
): NormalizedEvidence {
  if (previous._createdAt > current._createdAt) return previous
  if (current._createdAt > previous._createdAt) return current
  if (previous.state !== current.state) {
    fail(
      'CONFLICTING_EVIDENCE',
      'duplicate feedback attempt has conflicting states at the same timestamp',
      {
        businessKey: current.businessKey,
      },
    )
  }
  return previous
}

function isEvidenceWithinWindow(
  item: NormalizedEvidence,
  policy: FeedbackPolicy,
  nowMilliseconds: number,
): boolean {
  if (item._createdAt > nowMilliseconds) return false
  if (policy.startsAt !== null && item._createdAt < Date.parse(policy.startsAt)) return false
  if (policy.expiresAt !== null && item._createdAt > Date.parse(policy.expiresAt)) return false
  return true
}

/**
 * Dedupe evidence by business attempt, then count it through the injected
 * policy.  A request retry with a different requestId is one attempt; a new
 * attemptKey is a separate legal feedback.  Reusing one requestId across
 * different attempts is rejected as a replay/collision.
 */
export function dedupeFeedbackEvidence(
  evidence: unknown,
  { policy, now }: DedupeOptions = {},
): readonly NormalizedEvidence[] {
  const normalizedPolicy = normalizePolicy(policy)
  if (!Array.isArray(evidence)) fail('INVALID_EVIDENCE_LIST', 'feedback evidence must be an array')
  const current = now === undefined ? null : timestampValue(now, 'now', { required: true })
  const byBusinessKey = new Map<string, NormalizedEvidence>()
  const requestToBusiness = new Map<string, string>()
  const idToBusiness = new Map<string, string>()
  for (const item of evidence) {
    const normalized = normalizeEvidenceRecord(item, normalizedPolicy)
    const previousRequest = requestToBusiness.get(normalized.requestId)
    if (previousRequest && previousRequest !== normalized.businessKey) {
      fail('REQUEST_KEY_REUSE', 'requestId cannot be reused for a different feedback attempt')
    }
    requestToBusiness.set(normalized.requestId, normalized.businessKey)
    const previousId = idToBusiness.get(normalized.evidenceId)
    if (previousId && previousId !== normalized.businessKey) {
      fail('DUPLICATE_EVIDENCE_ID', 'evidenceId cannot identify different feedback attempts')
    }
    idToBusiness.set(normalized.evidenceId, normalized.businessKey)
    if (current && !isEvidenceWithinWindow(normalized, normalizedPolicy, current.milliseconds))
      continue
    const previous = byBusinessKey.get(normalized.businessKey)
    byBusinessKey.set(
      normalized.businessKey,
      previous ? pickLatestDuplicate(previous, normalized) : normalized,
    )
  }
  return Object.freeze(Array.from(byBusinessKey.values()))
}

function latestFeedbackAt(
  evidence: readonly NormalizedEvidence[],
  policy: FeedbackPolicy,
): string | null {
  let latest: NormalizedEvidence | null = null
  for (const item of evidence) {
    if (!policy.lastFeedbackStates.includes(item.state)) continue
    if (!latest || item._createdAt > latest._createdAt) latest = item
  }
  return latest ? latest.createdAt : null
}

/**
 * Build the read model used by a task/list adapter.  All counts and temporal
 * status are derived from the injected policy and caller-supplied `now`.
 */
export function summarizeFeedbackTask(
  input: unknown,
  { policy, now, actorProvider }: TaskSummaryOptions = {},
): FeedbackTaskSummary {
  if (!isPlainRecord(input)) fail('INVALID_TASK', 'feedback task must be a plain object')
  assertRecord(input, 'feedback task')
  assertAllowedFields(
    input,
    new Set([
      'taskId',
      'kind',
      'dynamicId',
      'actorId',
      'policyVersion',
      'attemptKey',
      'order',
      'animal',
      'evidence',
      'nextFeedbackAt',
    ]),
    'feedback task',
  )
  const normalizedPolicy = normalizePolicy(policy)
  const current = timestampValue(now, 'now', { required: true })
  if (!current) fail('MISSING_TIMESTAMP', 'now is required')
  const policyStart = normalizedPolicy.startsAt ? Date.parse(normalizedPolicy.startsAt) : null
  const policyEnd = normalizedPolicy.expiresAt ? Date.parse(normalizedPolicy.expiresAt) : null
  const kind = assertEnum(input.kind, 'kind', FEEDBACK_KIND_VALUES)
  if (!includesValue(normalizedPolicy.evidenceKinds, kind))
    fail('POLICY_KIND_NOT_ALLOWED', `policy ${normalizedPolicy.version} does not allow ${kind}`)
  const trustedActor = resolveTrustedActor(actorProvider)
  const identity = normalizeIdentityFields(input, kind, { evidence: false, requireAttempt: false })
  if (identity.policyVersion !== normalizedPolicy.version)
    fail('POLICY_VERSION_MISMATCH', 'task policyVersion does not match the injected policy')
  if (trustedActor.id !== identity.actorId)
    fail('ACTOR_MISMATCH', 'task actorId must match the trusted actorProvider')
  if (!Array.isArray(input.evidence))
    fail('INVALID_EVIDENCE_LIST', 'feedback task evidence must be an array')
  const association =
    kind === FEEDBACK_KINDS.FEEDING_EVIDENCE
      ? normalizeOrderAndAnimal(input.order, input.animal)
      : null
  if (kind === FEEDBACK_KINDS.FEEDING_EVIDENCE && !association)
    fail('MISSING_ASSOCIATION', 'feeding evidence requires resolved order and animal records')
  const evidence = dedupeFeedbackEvidence(input.evidence, {
    policy: normalizedPolicy,
    now: current.value,
  })
  const filtered = evidence.filter((item) => {
    if (
      item.kind !== kind ||
      item.actorId !== identity.actorId ||
      item.policyVersion !== normalizedPolicy.version
    ) {
      fail(
        'TASK_EVIDENCE_CONFLICT',
        'task evidence does not belong to the task actor, kind, or policy version',
      )
    }
    if (kind === FEEDBACK_KINDS.DYNAMIC && item.dynamicId !== identity.dynamicId)
      fail('TASK_EVIDENCE_CONFLICT', 'dynamic evidence belongs to another dynamic')
    if (kind === FEEDBACK_KINDS.FEEDING_EVIDENCE) {
      if (
        !association ||
        item.orderId !== association.orderId ||
        item.animalId !== association.animalId ||
        item.yardId !== association.yardId
      ) {
        fail('TASK_EVIDENCE_CONFLICT', 'feeding evidence belongs to another order, animal, or yard')
      }
    }
    return normalizedPolicy.countRules[item.state] === 'count'
  })
  const completedCount = filtered.length
  let status: FeedbackTaskStatus
  if (policyStart !== null && current.milliseconds < policyStart) status = 'scheduled'
  else if (completedCount < normalizedPolicy.requiredCount) {
    status = policyEnd !== null && current.milliseconds > policyEnd ? 'overdue' : 'pending'
  } else if (completedCount === normalizedPolicy.requiredCount) status = 'completed'
  else status = 'excess'
  const dynamicId = kind === FEEDBACK_KINDS.DYNAMIC ? identity.dynamicId : undefined
  const taskValues: string[] = [kind]
  if (kind === FEEDBACK_KINDS.DYNAMIC) {
    if (!dynamicId) fail('MISSING_DYNAMIC_ID', 'ordinary dynamic feedback requires dynamicId')
    taskValues.push(dynamicId)
  } else {
    if (!association)
      fail('MISSING_ASSOCIATION', 'feeding evidence requires resolved order and animal records')
    taskValues.push(association.orderId, association.animalId, association.yardId)
  }
  taskValues.push(identity.actorId, normalizedPolicy.version)
  const taskId = `feedback-task:${taskValues.map(identityPart).join('|')}`
  if (input.taskId !== undefined && input.taskId !== taskId)
    fail('TASK_ID_MISMATCH', 'taskId does not match the feedback object and actor')
  const nextAt = timestampValue(input.nextFeedbackAt, 'nextFeedbackAt')
  const summary: FeedbackTaskSummary = {
    taskId,
    kind,
    ...(dynamicId === undefined ? {} : { dynamicId }),
    ...(association || {}),
    actorId: identity.actorId,
    policyVersion: normalizedPolicy.version,
    requiredCount: normalizedPolicy.requiredCount,
    maximumCount: normalizedPolicy.maximumCount,
    completedCount,
    status,
    limitExceeded: completedCount > normalizedPolicy.maximumCount,
    nextFeedbackAt: nextAt ? nextAt.value : null,
    lastFeedbackAt: latestFeedbackAt(evidence, normalizedPolicy),
    expiresAt: normalizedPolicy.expiresAt,
    isOverdue: status === 'overdue',
    evidenceCount: evidence.length,
  }
  return Object.freeze(summary)
}

export const createFeedbackTaskSummary = summarizeFeedbackTask

function deniedTaskAccess(reason: string): FeedbackTaskAccess {
  return Object.freeze({
    canRead: false,
    canWriteOrder: false,
    canWriteAnimal: false,
    canDeleteEvidence: false,
    canCorrectEvidence: false,
    reason,
  })
}

export function getFeedbackTaskAccess(
  task: Pick<FeedbackTaskSummary, 'actorId'>,
  { actorProvider }: { actorProvider?: FeedbackActorProvider } = {},
): FeedbackTaskAccess {
  if (!isPlainRecord(task) || typeof task.actorId !== 'string')
    return deniedTaskAccess('INVALID_TASK')
  let trustedActor: TrustedActor
  try {
    trustedActor = resolveTrustedActor(actorProvider)
  } catch (error) {
    return deniedTaskAccess(errorCode(error, 'ACTOR_PROVIDER_FAILED'))
  }
  const canRead = trustedActor.id === task.actorId
  return Object.freeze({
    canRead,
    canWriteOrder: false,
    canWriteAnimal: false,
    canDeleteEvidence: false,
    canCorrectEvidence: false,
    reason: canRead ? 'actor-match' : 'actor-mismatch',
  })
}

export function canReadFeedbackTask(
  task: Pick<FeedbackTaskSummary, 'actorId'>,
  options: { actorProvider?: FeedbackActorProvider } = {},
): boolean {
  return getFeedbackTaskAccess(task, options).canRead
}
