/**
 * Pure adoption-condition contract.
 *
 * This is a policy seam for the adoption flow.  It deliberately has no Vue,
 * uni-app, page, package, storage, mock, or network dependency.  The caller
 * injects the transition boundary (the real adapter must pass
 * ADOPTION_TRANSITIONS/canTransitionAdoption) and, when the existing record
 * shape is insufficient, a cloud-parent review resolver.
 *
 * The contract reads a trusted actor and the already-loaded application.  It
 * never treats query, role, managed, or state values from navigation as
 * authentication, ownership, or current status.  It exposes no write path.
 */

type JsonRecord = Record<string, unknown>
type AdoptionTransitionMap = Readonly<Record<string, readonly string[]>>
type ActorProvider = () => unknown
type CloudParentSelection = 'any' | 'all' | 'specific'
type Perspective = 'applicant' | 'cloud_parent' | 'owner'
type ActorRole = 'applicant' | 'cloud_parent' | 'owner' | 'yard_owner'
type SpecificSelection = 'any' | 'all' | ''
type ConditionDecision = 'unknown' | 'approved' | 'rejected' | 'pending' | 'skip' | 'decision_required' | 'bypass_terminal'
type PolicyGroup = 'pendingStates' | 'approvedStates' | 'rejectedStates'

interface TrustedActor {
  id: string
  roles: readonly ActorRole[]
}

interface ActorResolution {
  actor: TrustedActor | null
  reason: string
}

interface ReviewEntry {
  id: string
  state: string
}

interface NormalizedPolicy {
  selection: CloudParentSelection
  legalStates: readonly string[]
  pendingStates: readonly string[]
  approvedStates: readonly string[]
  rejectedStates: readonly string[]
  specificIds: readonly string[]
  specificSelection: SpecificSelection
}

interface ReviewResult {
  entries: ReviewEntry[]
  reason: string
}

interface CloudParentCondition {
  count: number
  required: boolean
  decision: ConditionDecision
  canProceed: boolean
  decisionRequired: boolean
  reason: string
  reviews: readonly ReviewEntry[]
  selection?: CloudParentSelection
}

interface PerspectiveResolution {
  allowed: boolean
  reason: string
  actor: TrustedActor | null
  perspectives: readonly Perspective[]
  perspective?: Perspective
}

interface AdoptionPerspectiveResolution {
  actor: TrustedActor | null
  perspectives: readonly Perspective[]
  reason: string
}

interface ResolvePerspectivesArgs {
  record?: unknown
  actorProvider?: ActorProvider
}

interface TransitionContract {
  canTransition: (currentStatus: string, nextStatus: string) => boolean
  allowedNext: (currentStatus: string) => readonly string[]
}

interface ReadAdoptionConditionArgs {
  record?: unknown
  actorProvider?: ActorProvider
  perspective?: unknown
  policy?: unknown
  reviewResolver?: ReviewResolver
  query?: unknown
}

interface AdoptionConditionReadResult {
  canRead: boolean
  canWrite: false
  readOnly: true
  reason?: string
  actor: TrustedActor | null
  perspectives: readonly Perspective[]
  perspective?: Perspective
  currentStatus?: string
  cloudParent?: CloudParentCondition
  ignoredNavigation?: readonly string[]
}

interface AdoptionTransitionArgs {
  record?: unknown
  targetStatus?: unknown
  transitions?: AdoptionTransitionMap
  policy?: unknown
  reviewResolver?: ReviewResolver
}

function freezeList<T extends string>(...values: T[]): readonly T[] {
  return Object.freeze(values)
}

function includesValue<T extends string>(values: readonly T[], value: string): value is T {
  return values.some((candidate) => candidate === value)
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const CLOUD_PARENT_SELECTIONS = freezeList<CloudParentSelection>('any', 'all', 'specific')
const PERSPECTIVES = freezeList<Perspective>('applicant', 'cloud_parent', 'owner')
const ACTOR_ROLES = freezeList<ActorRole>('applicant', 'cloud_parent', 'owner', 'yard_owner')
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

export const ADOPTION_PERSPECTIVES = PERSPECTIVES
export const ADOPTION_CLOUD_PARENT_SELECTIONS = CLOUD_PARENT_SELECTIONS

export class AdoptionConditionContractError extends Error {
  readonly code: string
  readonly details: JsonRecord

  constructor(code: string, message: string, details: JsonRecord = {}) {
    super(message)
    this.name = 'AdoptionConditionContractError'
    this.code = code
    this.details = details
  }
}

function fail(code: string, message: string, details: JsonRecord = {}): never {
  throw new AdoptionConditionContractError(code, message, details)
}

function own(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function isPlainRecord(value: unknown): value is JsonRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  if (prototype === Object.prototype || prototype === null) return true
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'constructor')
  return Object.getPrototypeOf(prototype) === null
    && Object.prototype.toString.call(value) === '[object Object]'
    && descriptor !== undefined
    && typeof descriptor.value === 'function'
    && descriptor.value.name === 'Object'
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

function normalizeId(value: unknown, label: string, { required = false }: { required?: boolean } = {}): string {
  const id = typeof value === 'string' ? value.trim() : (Number.isSafeInteger(value) ? String(value) : '')
  if (!id) {
    if (required) fail('MISSING_ID', `${label} is required`, { label })
    return ''
  }
  if (!SAFE_ID.test(id) || /[/?#%]|:\/\//.test(id)) {
    fail('INVALID_ID', `${label} must be an opaque ID`, { label })
  }
  return id
}

function normalizeIdList(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) fail('INVALID_ID_LIST', `${label} must be an array`, { label })
  const result: string[] = []
  for (const item of value) {
    const id = normalizeId(item, label, { required: true })
    if (!result.includes(id)) result.push(id)
  }
  return result
}

function isActorProvider(value: unknown): value is () => unknown {
  return typeof value === 'function'
}

function errorCode(error: unknown, fallback: string): string {
  if (error !== null && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code
  }
  return fallback
}

function normalizeActor(actorProvider: unknown): ActorResolution {
  if (!isActorProvider(actorProvider)) return { actor: null, reason: 'ACTOR_PROVIDER_REQUIRED' }
  let value
  try {
    value = actorProvider()
  } catch {
    return { actor: null, reason: 'ACTOR_PROVIDER_FAILED' }
  }
  try {
    if (value === null || value === undefined) return { actor: null, reason: 'NO_ACTOR' }
    if (!isPlainRecord(value)) return { actor: null, reason: 'INVALID_ACTOR' }
    rejectDangerousKeys(value, 'actor provider result')
    const candidate = own(value, 'actor') ? value.actor : value
    if (!isPlainRecord(candidate)) return { actor: null, reason: 'INVALID_ACTOR' }
    rejectDangerousKeys(candidate, 'trusted actor')
    const id = normalizeId(own(candidate, 'id') ? candidate.id : candidate.actorId, 'trusted actor id', { required: true })
    const rawRoles = own(candidate, 'roles') ? candidate.roles : candidate.role
    const roles = rawRoles === undefined ? [] : (Array.isArray(rawRoles) ? rawRoles : [rawRoles])
    const uniqueRoles: ActorRole[] = []
    for (const role of roles) {
      if (typeof role !== 'string' || !includesValue(ACTOR_ROLES, role)) return { actor: null, reason: 'UNKNOWN_ACTOR_ROLE' }
      if (!uniqueRoles.includes(role)) uniqueRoles.push(role)
    }
    return { actor: Object.freeze({ id, roles: Object.freeze(uniqueRoles) }), reason: '' }
  } catch (error) {
    return { actor: null, reason: errorCode(error, 'INVALID_ACTOR') }
  }
}

function relationContains(record: JsonRecord, fields: readonly string[], actorId: string): boolean {
  for (const field of fields) {
    if (!own(record, field)) continue
    const value = record[field]
    const list = Array.isArray(value) ? value : [value]
    for (const item of list) {
      if (normalizeId(item, `record.${field}`) === actorId) return true
    }
  }
  return false
}

/**
 * Resolve a perspective from trusted session identity and record relations.
 * The optional perspective is a display selection only; it cannot grant a
 * relation that the record does not contain.  Query is intentionally absent.
 */
export function resolveAdoptionPerspectives({ record, actorProvider }: ResolvePerspectivesArgs = {}): AdoptionPerspectiveResolution {
  assertRecord(record, 'adoption record')
  const resolved = normalizeActor(actorProvider)
  if (!resolved.actor) return Object.freeze({ actor: null, perspectives: Object.freeze([]), reason: resolved.reason })

  const actor = resolved.actor
  const perspectives: Perspective[] = []
  try {
    // Only an explicit applicant relation can grant the private applicant
    // view.  Generic identity fields are deliberately ignored.
    if (actor.roles.includes('applicant') && relationContains(record, ['applicantId', 'applicantUserId'], actor.id)) {
      perspectives.push('applicant')
    }
    if (actor.roles.includes('cloud_parent') && relationContains(record, ['cloudParentIds', 'cloudParentPawId', 'cloudParentId'], actor.id)) {
      perspectives.push('cloud_parent')
    }
    if ((actor.roles.includes('owner') || actor.roles.includes('yard_owner'))
      && relationContains(record, ['ownerId', 'ownerPawId', 'ownerUserId', 'yardOwnerId'], actor.id)) {
      perspectives.push('owner')
    }
  } catch (error) {
    return Object.freeze({ actor, perspectives: Object.freeze([]), reason: errorCode(error, 'INVALID_RELATION') })
  }
  return Object.freeze({ actor, perspectives: Object.freeze(perspectives), reason: perspectives.length ? '' : 'ACTOR_NOT_RELATED' })
}

function assertStatus(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) fail('INVALID_STATE', `${label} must be a non-empty state`, { label })
  return value.trim()
}

/**
 * Freeze the supplied transition map without defining a second adoption
 * state machine.  The real adapter should pass ADOPTION_TRANSITIONS; tests
 * and other adapters may pass an equivalent injected boundary.
 */
export function createAdoptionTransitionContract(transitions: AdoptionTransitionMap): TransitionContract {
  assertRecord(transitions, 'adoption transitions')
  const snapshot = new Map<string, readonly string[]>()
  for (const state of Object.keys(transitions)) {
    const nextStates = transitions[state]
    if (!Array.isArray(nextStates)) {
      fail('INVALID_TRANSITIONS', 'Each transition entry must be an array of state names', { state })
    }
    const normalizedStates: string[] = []
    for (const item of nextStates) {
      if (typeof item !== 'string' || !item.trim()) {
        fail('INVALID_TRANSITIONS', 'Each transition entry must be an array of state names', { state })
      }
      normalizedStates.push(item)
    }
    snapshot.set(state, Object.freeze(normalizedStates))
  }
  return Object.freeze({
    canTransition(currentStatus: unknown, nextStatus: unknown): boolean {
      if (typeof currentStatus !== 'string' || typeof nextStatus !== 'string') return false
      return snapshot.get(currentStatus)?.includes(nextStatus) === true
    },
    allowedNext(currentStatus: unknown): readonly string[] {
      const states = typeof currentStatus === 'string' ? snapshot.get(currentStatus) || [] : []
      return Object.freeze(states.slice())
    },
  })
}

function normalizePolicy(policy: unknown): NormalizedPolicy | null {
  if (policy === undefined || policy === null) return null
  assertRecord(policy, 'cloud-parent policy')
  const allowed = new Set(['selection', 'legalStates', 'pendingStates', 'approvedStates', 'rejectedStates', 'specificIds', 'specificSelection'])
  for (const key of Object.keys(policy)) {
    if (!allowed.has(key)) fail('UNKNOWN_POLICY_FIELD', `Unknown cloud-parent policy field: ${key}`, { key })
  }
  const selectionValue = policy.selection
  if (typeof selectionValue !== 'string' || !includesValue(CLOUD_PARENT_SELECTIONS, selectionValue)) {
    fail('POLICY_SELECTION_REQUIRED', 'Cloud-parent policy must explicitly select any, all, or specific', { selection: selectionValue })
  }
  const legalStates = normalizeIdList(policy.legalStates, 'policy.legalStates')
  const selection = selectionValue
  const groups: Record<PolicyGroup, string[]> = {
    pendingStates: [],
    approvedStates: [],
    rejectedStates: [],
  }
  const groupNames: readonly PolicyGroup[] = ['pendingStates', 'approvedStates', 'rejectedStates']
  for (const name of groupNames) {
    groups[name] = normalizeIdList(policy[name], `policy.${name}`)
    if (groups[name].some(state => !legalStates.includes(state))) {
      fail('POLICY_STATE_NOT_LEGAL', `${name} contains a state outside legalStates`, { name })
    }
  }
  const grouped = [...groups.pendingStates, ...groups.approvedStates, ...groups.rejectedStates]
  if (new Set(grouped).size !== grouped.length || new Set(grouped).size !== legalStates.length) {
    fail('POLICY_STATE_MAPPING_REQUIRED', 'Every legal cloud-parent state must map to exactly one outcome', { legalStates })
  }
  let specificIds: string[] = []
  let specificSelection: SpecificSelection = ''
  if (selection === 'specific') {
    specificIds = normalizeIdList(policy.specificIds, 'policy.specificIds')
    if (!specificIds.length) fail('POLICY_SPECIFIC_IDS_REQUIRED', 'specific selection requires specificIds')
    if (policy.specificSelection !== 'any' && policy.specificSelection !== 'all') {
      fail('POLICY_SPECIFIC_SELECTION_REQUIRED', 'specific selection must explicitly choose any or all', { specificSelection: policy.specificSelection })
    }
    specificSelection = policy.specificSelection
  } else if (own(policy, 'specificIds') || own(policy, 'specificSelection')) {
    fail('POLICY_SPECIFIC_FIELDS_FORBIDDEN', 'specificIds are valid only for specific selection')
  }
  return Object.freeze({
    selection,
    legalStates: Object.freeze(legalStates),
    pendingStates: Object.freeze(groups.pendingStates),
    approvedStates: Object.freeze(groups.approvedStates),
    rejectedStates: Object.freeze(groups.rejectedStates),
    specificIds: Object.freeze(specificIds),
    specificSelection,
  })
}

function cloudParentIds(record: JsonRecord): string[] {
  const hasIds = own(record, 'cloudParentIds')
  const hasSingle = own(record, 'cloudParentPawId') || own(record, 'cloudParentId')
  const ids = hasIds ? normalizeIdList(record.cloudParentIds, 'record.cloudParentIds') : []
  const single = hasSingle
    ? normalizeId(record.cloudParentPawId ?? record.cloudParentId, 'record.cloudParentPawId')
    : ''
  if (single && ids.length && !ids.includes(single)) {
    fail('CONFLICTING_CLOUD_PARENT_IDS', 'Single and list cloud-parent IDs disagree')
  }
  if (single && !ids.includes(single)) ids.push(single)
  return ids
}

function legacyReviewEntries(record: JsonRecord, ids: readonly string[]): ReviewEntry[] {
  const approvals = own(record, 'cloudParentApprovals')
    ? normalizeIdList(record.cloudParentApprovals, 'record.cloudParentApprovals')
    : []
  const rejections = own(record, 'cloudParentRejections')
    ? normalizeIdList(record.cloudParentRejections, 'record.cloudParentRejections')
    : []
  if (approvals.some(id => !ids.includes(id)) || rejections.some(id => !ids.includes(id))) {
    fail('REVIEW_ID_OUTSIDE_APPLICATION', 'Cloud-parent review IDs must belong to the application')
  }
  if (approvals.some(id => rejections.includes(id))) {
    fail('CONFLICTING_REVIEW_DECISIONS', 'A cloud parent cannot be both approved and rejected')
  }
  return ids.map(id => ({ id, state: approvals.includes(id) ? 'approved' : rejections.includes(id) ? 'rejected' : 'pending' }))
}

type ReviewResolver = (input: Readonly<{ record: Readonly<JsonRecord> }>) => unknown

function isReviewResolver(value: unknown): value is ReviewResolver {
  return typeof value === 'function'
}

function reviewEntries(record: JsonRecord, ids: readonly string[], reviewResolver: unknown, legalStates: readonly string[] | null = null): ReviewResult {
  let entries: unknown[]
  if (reviewResolver !== undefined) {
    if (!isReviewResolver(reviewResolver)) fail('INVALID_REVIEW_RESOLVER', 'reviewResolver must be a function')
    try {
      const resolved = reviewResolver(Object.freeze({ record: Object.freeze({ ...record }) }))
      if (!Array.isArray(resolved)) return { entries: [], reason: 'INVALID_REVIEW_RESULT' }
      entries = resolved
    } catch {
      return { entries: [], reason: 'REVIEW_RESOLVER_FAILED' }
    }
    if (!Array.isArray(entries)) return { entries: [], reason: 'INVALID_REVIEW_RESULT' }
  } else {
    try {
      entries = legacyReviewEntries(record, ids)
    } catch (error) {
      return { entries: [], reason: errorCode(error, 'INVALID_REVIEW_RECORD') }
    }
  }
  const byId = new Map<string, ReviewEntry>()
  for (const entry of entries) {
    if (!isPlainRecord(entry)) return { entries: [], reason: 'INVALID_REVIEW_ENTRY' }
    try {
      const id = normalizeId(entry.id ?? entry.cloudParentId, 'review.id', { required: true })
      if (!ids.includes(id) || byId.has(id)) return { entries: [], reason: 'REVIEW_ID_OUTSIDE_APPLICATION' }
      const state = assertStatus(entry.state ?? entry.status, 'review.state')
      if (legalStates && !legalStates.includes(state)) {
        return { entries: [], reason: 'REVIEW_STATE_NOT_LEGAL' }
      }
      byId.set(id, { id, state })
    } catch (error) {
      return { entries: [], reason: errorCode(error, 'INVALID_REVIEW_ENTRY') }
    }
  }
  if (byId.size !== ids.length) return { entries: [], reason: 'REVIEW_STATE_MISSING' }
  const orderedEntries: ReviewEntry[] = []
  for (const id of ids) {
    const entry = byId.get(id)
    if (!entry) return { entries: [], reason: 'REVIEW_STATE_MISSING' }
    orderedEntries.push(entry)
  }
  return { entries: orderedEntries, reason: '' }
}

function outcomeFor(entries: readonly ReviewEntry[], policy: NormalizedPolicy, selectedIds: readonly string[]): { decision: ConditionDecision; reason: string } {
  const selected = entries.filter(entry => selectedIds.includes(entry.id))
  if (!selected.length) return { decision: 'unknown', reason: 'NO_SELECTED_CLOUD_PARENTS' }
  const approved = selected.filter(entry => policy.approvedStates.includes(entry.state)).length
  const rejected = selected.filter(entry => policy.rejectedStates.includes(entry.state)).length
  const pending = selected.filter(entry => policy.pendingStates.includes(entry.state)).length
  if (approved + rejected + pending !== selected.length) return { decision: 'unknown', reason: 'UNKNOWN_REVIEW_STATE' }
  const selection = policy.selection === 'specific' ? policy.specificSelection : policy.selection
  if (selection === 'all') {
    if (rejected) return { decision: 'rejected', reason: 'CLOUD_PARENT_REJECTED' }
    if (approved === selected.length) return { decision: 'approved', reason: 'ALL_CLOUD_PARENTS_APPROVED' }
    return { decision: 'pending', reason: 'CLOUD_PARENT_REVIEW_PENDING' }
  }
  if (approved) return { decision: 'approved', reason: 'CLOUD_PARENT_APPROVED' }
  if (rejected === selected.length) return { decision: 'rejected', reason: 'ALL_SELECTED_CLOUD_PARENTS_REJECTED' }
  return { decision: 'pending', reason: 'CLOUD_PARENT_REVIEW_PENDING' }
}

/**
 * Evaluate only the cloud-parent condition.  Multiple parents have no
 * default any/all interpretation: the product policy is mandatory.
 */
interface EvaluateCloudParentArgs {
  record?: unknown
  policy?: unknown
  reviewResolver?: unknown
}

export function evaluateCloudParentCondition({ record, policy, reviewResolver }: EvaluateCloudParentArgs = {}): CloudParentCondition {
  assertRecord(record, 'adoption record')
  const ids = cloudParentIds(record)
  if (own(record, 'cloudParentRequired')) {
    const required = record.cloudParentRequired
    if (typeof required !== 'boolean') {
      return Object.freeze({ count: ids.length, required: true, decision: 'decision_required', canProceed: false, decisionRequired: true, reason: 'INVALID_CLOUD_PARENT_REQUIREMENT', reviews: Object.freeze([]) })
    }
    if (required !== (ids.length > 0)) {
      return Object.freeze({ count: ids.length, required, decision: 'decision_required', canProceed: false, decisionRequired: true, reason: 'CLOUD_PARENT_REQUIREMENT_CONFLICT', reviews: Object.freeze([]) })
    }
  }
  if (ids.length === 0) {
    return Object.freeze({ count: 0, required: false, decision: 'skip', canProceed: true, decisionRequired: false, reason: 'NO_CLOUD_PARENT', reviews: Object.freeze([]) })
  }

  const normalizedPolicy = normalizePolicy(policy)
  if (ids.length > 1 && !normalizedPolicy) {
    return Object.freeze({ count: ids.length, required: true, decision: 'decision_required', canProceed: false, decisionRequired: true, reason: 'MULTI_CLOUD_PARENT_POLICY_REQUIRED', reviews: Object.freeze([]) })
  }

  const review = reviewEntries(record, ids, reviewResolver, normalizedPolicy && normalizedPolicy.legalStates)
  if (review.reason) {
    return Object.freeze({ count: ids.length, required: true, decision: 'decision_required', canProceed: false, decisionRequired: true, reason: review.reason, reviews: Object.freeze([]) })
  }

  // A single parent is a required review.  Without an explicit product
  // policy, only the existing approval list can prove approval; a resolver is
  // required for any richer status model.
  if (ids.length === 1 && normalizedPolicy === null) {
    const approved = review.entries[0].state === 'approved'
    if (!['approved', 'pending', 'rejected'].includes(review.entries[0].state)) {
      return Object.freeze({ count: 1, required: true, decision: 'decision_required', canProceed: false, decisionRequired: true, reason: 'SINGLE_CLOUD_PARENT_POLICY_REQUIRED', reviews: Object.freeze(review.entries) })
    }
    const rejected = review.entries[0].state === 'rejected'
    return Object.freeze({ count: 1, required: true, decision: approved ? 'approved' : rejected ? 'rejected' : 'pending', canProceed: approved, decisionRequired: false, reason: approved ? 'CLOUD_PARENT_APPROVED' : rejected ? 'CLOUD_PARENT_REJECTED' : 'CLOUD_PARENT_REVIEW_PENDING', reviews: Object.freeze(review.entries) })
  }

  if (normalizedPolicy === null) {
    return Object.freeze({ count: ids.length, required: true, decision: 'decision_required', canProceed: false, decisionRequired: true, reason: 'POLICY_REQUIRED', reviews: Object.freeze(review.entries) })
  }
  const selectedIds = normalizedPolicy.selection === 'specific' ? normalizedPolicy.specificIds : ids
  if (selectedIds.some(id => !ids.includes(id))) {
    return Object.freeze({ count: ids.length, required: true, decision: 'decision_required', canProceed: false, decisionRequired: true, reason: 'POLICY_ID_OUTSIDE_APPLICATION', reviews: Object.freeze(review.entries) })
  }
  const outcome = outcomeFor(review.entries, normalizedPolicy, selectedIds)
  return Object.freeze({
    count: ids.length,
    required: true,
    decision: outcome.decision,
    canProceed: outcome.decision === 'approved',
    decisionRequired: outcome.decision === 'unknown',
    reason: outcome.reason,
    selection: normalizedPolicy.selection,
    reviews: Object.freeze(review.entries),
  })
}

function perspectiveResult(record: JsonRecord, actorProvider: ActorProvider | undefined, perspective: unknown): PerspectiveResolution {
  const resolved = resolveAdoptionPerspectives({ record, actorProvider })
  if (!perspective) {
    if (resolved.perspectives.length !== 1) {
      return { allowed: false, reason: resolved.perspectives.length ? 'PERSPECTIVE_REQUIRED' : resolved.reason, actor: resolved.actor, perspectives: resolved.perspectives }
    }
    perspective = resolved.perspectives[0]
  }
  if (typeof perspective !== 'string' || !includesValue(PERSPECTIVES, perspective)) return { allowed: false, reason: 'INVALID_PERSPECTIVE', actor: resolved.actor, perspectives: resolved.perspectives }
  if (!resolved.perspectives.includes(perspective)) return { allowed: false, reason: 'PERSPECTIVE_NOT_AUTHORIZED', actor: resolved.actor, perspectives: resolved.perspectives }
  return { allowed: true, reason: '', actor: resolved.actor, perspectives: resolved.perspectives, perspective }
}

/**
 * Read the current stage and condition for a verified perspective.  The
 * record is the only source of current status; query/state/managed values are
 * not accepted.  All results are read-only and contain no writer callback.
 */
export function readAdoptionCondition({ record, actorProvider, perspective, policy, reviewResolver, query }: ReadAdoptionConditionArgs = {}): AdoptionConditionReadResult {
  assertRecord(record, 'adoption record')
  const access = perspectiveResult(record, actorProvider, perspective)
  if (!access.allowed) {
    return Object.freeze({ canRead: false, canWrite: false, readOnly: true, reason: access.reason, actor: access.actor, perspectives: Object.freeze(access.perspectives || []) })
  }
  const condition = evaluateCloudParentCondition({ record, policy, reviewResolver })
  const currentStatus = own(record, 'status') && typeof record.status === 'string' ? record.status.trim() : ''
  return Object.freeze({
    canRead: true,
    canWrite: false,
    readOnly: true,
    actor: access.actor,
    perspective: access.perspective,
    perspectives: Object.freeze(access.perspectives),
    currentStatus: currentStatus || 'unknown',
    cloudParent: condition,
    ignoredNavigation: query === undefined ? Object.freeze([]) : Object.freeze(['query']),
  })
}

/**
 * Check a proposed state transition without performing it.  A transition is
 * legal only when it comes from the injected ADOPTION_TRANSITIONS boundary
 * and the cloud-parent condition is satisfied.  Thus an owner confirmation
 * cannot jump over a review state present in the real transition graph.
 */
export function canEnterAdoption({ record, targetStatus, transitions, policy, reviewResolver }: AdoptionTransitionArgs = {}) {
  assertRecord(record, 'adoption record')
  const currentStatus = assertStatus(record.status, 'record.status')
  const target = assertStatus(targetStatus, 'targetStatus')
  if (transitions === undefined || transitions === null) {
    fail('INVALID_TRANSITIONS', 'An injected ADOPTION_TRANSITIONS boundary is required')
  }
  const transition = createAdoptionTransitionContract(transitions)
  if (!transition.canTransition(currentStatus, target)) {
    return Object.freeze({ allowed: false, reason: 'INVALID_TRANSITION', cloudParent: null, currentStatus, targetStatus: target })
  }
  // Rejection/abandonment are legal terminal outcomes in the existing
  // transition graph and must remain available even while a required review
  // is pending.  The adapter still authorizes who may request them.
  const terminalTarget = ['rejected', 'cloud_rejected', 'abandoned'].includes(target)
  const cloudParent = terminalTarget
    ? Object.freeze({ count: 0, required: false, decision: 'bypass_terminal', canProceed: true, decisionRequired: false, reason: 'TERMINAL_TRANSITION', reviews: Object.freeze([]) })
    : evaluateCloudParentCondition({ record, policy, reviewResolver })
  if (!cloudParent.canProceed) {
    return Object.freeze({ allowed: false, reason: cloudParent.decisionRequired ? 'DECISION_REQUIRED' : 'CLOUD_PARENT_REVIEW_REQUIRED', cloudParent, currentStatus, targetStatus: target })
  }
  return Object.freeze({ allowed: true, reason: 'LEGAL_TRANSITION', cloudParent, currentStatus, targetStatus: target })
}

export function getAdoptionConditionAccess(args: ReadAdoptionConditionArgs = {}) {
  const result = readAdoptionCondition(args)
  return Object.freeze({
    canRead: result.canRead === true,
    canWrite: false,
    perspective: result.perspective || null,
    reason: result.reason || '',
  })
}
