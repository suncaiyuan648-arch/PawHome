/**
 * Pure actor and capability contract.
 *
 * This file is deliberately independent from Vue, uni-app, pages, packages,
 * storage, and mock data.  A caller supplies a session/actor provider and a
 * record that was read from its own domain.  Query parameters are accepted by
 * the public helpers only as an ignored navigation context: they can locate a
 * record in a caller, but they can never create an actor, role, relationship,
 * state, or outcome here.
 *
 * The contract is intentionally policy driven.  A domain must name the roles
 * and legal states that it has actually approved before a capability can be
 * granted.  Missing policy, missing state, unknown state, stale ownership,
 * and an empty session all deny by default.  This keeps this module useful as
 * a seam before product rules for resubmission, multi-reviewer handling, or
 * other write flows have been approved.
 */

type JsonRecord = Record<string, unknown>
export type ActorRole = 'applicant' | 'owner' | 'reviewer' | 'cloud_parent' | 'yard_owner' | 'animal_manager'
export type Capability =
  | 'adoption.application.readPrivate'
  | 'adoption.application.write'
  | 'reward.claim.readPrivate'
  | 'reward.claim'
  | 'rescue.review.readPrivate'
  | 'rescue.review.write'
  | 'yard.management.readPrivate'
  | 'yard.management'
  | 'animal.edit.readPrivate'
  | 'animal.edit'
type CapabilityCategory = 'adoptionApplication' | 'rewardClaim' | 'rescueReview' | 'yardManagement' | 'animalEdit'
type CapabilityAccess = 'read' | 'write'

interface TrustedActor {
  id: string
  roles: readonly ActorRole[]
}

interface CapabilityDefinition {
  category: CapabilityCategory
  access: CapabilityAccess
}

interface CapabilityRule {
  roles: readonly ActorRole[]
  states: readonly string[]
  stateFields: readonly string[]
}

interface CategoryPolicy {
  read: CapabilityRule | null
  write: CapabilityRule | null
}

type CapabilityPolicy = Readonly<Record<CapabilityCategory, CategoryPolicy>>

interface ObjectState {
  state: string
  valid: boolean
  reason: string
}

interface CapabilityDecision {
  allowed: boolean
  reason: string
  role?: ActorRole
  state?: string
}

interface CapabilityEvaluation {
  actor: TrustedActor | null
  capabilities: Readonly<Record<string, boolean>>
  reasons: Readonly<Record<string, string>>
  error: Readonly<{ code: string; message?: string }> | null
}

export interface Authorization {
  capability: Capability
  actorId: string
  role?: ActorRole
  state?: string
}

interface EvaluatorOptions {
  actorProvider?: () => unknown
  policy?: unknown
}

function freezeList<T extends string>(...values: T[]): readonly T[] {
  return Object.freeze(values)
}

function includesValue<T extends string>(values: readonly T[], value: string): value is T {
  return values.some((candidate) => candidate === value)
}

const SAFE_ACTOR_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const ACTOR_ROLES: readonly ActorRole[] = freezeList<ActorRole>(
  'applicant',
  'owner',
  'reviewer',
  'cloud_parent',
  'yard_owner',
  'animal_manager',
)

const CAPABILITIES: Readonly<{
  ADOPTION_APPLICATION_READ_PRIVATE: 'adoption.application.readPrivate'
  ADOPTION_APPLICATION_WRITE: 'adoption.application.write'
  REWARD_CLAIM_READ_PRIVATE: 'reward.claim.readPrivate'
  REWARD_CLAIM: 'reward.claim'
  RESCUE_REVIEW_READ_PRIVATE: 'rescue.review.readPrivate'
  RESCUE_REVIEW_WRITE: 'rescue.review.write'
  YARD_MANAGEMENT_READ_PRIVATE: 'yard.management.readPrivate'
  YARD_MANAGEMENT: 'yard.management'
  ANIMAL_EDIT_READ_PRIVATE: 'animal.edit.readPrivate'
  ANIMAL_EDIT: 'animal.edit'
}> = Object.freeze({
  ADOPTION_APPLICATION_READ_PRIVATE: 'adoption.application.readPrivate',
  ADOPTION_APPLICATION_WRITE: 'adoption.application.write',
  REWARD_CLAIM_READ_PRIVATE: 'reward.claim.readPrivate',
  REWARD_CLAIM: 'reward.claim',
  RESCUE_REVIEW_READ_PRIVATE: 'rescue.review.readPrivate',
  RESCUE_REVIEW_WRITE: 'rescue.review.write',
  YARD_MANAGEMENT_READ_PRIVATE: 'yard.management.readPrivate',
  YARD_MANAGEMENT: 'yard.management',
  ANIMAL_EDIT_READ_PRIVATE: 'animal.edit.readPrivate',
  ANIMAL_EDIT: 'animal.edit',
})

// Both names are exported because callers tend to use either term when
// referring to a stable enum.  The values remain the only wire contract.
const CAPABILITY_NAMES = CAPABILITIES

const CAPABILITY_DEFINITIONS: Readonly<Record<Capability, CapabilityDefinition>> = Object.freeze({
  [CAPABILITIES.ADOPTION_APPLICATION_READ_PRIVATE]: Object.freeze({
    category: 'adoptionApplication',
    access: 'read',
  }),
  [CAPABILITIES.ADOPTION_APPLICATION_WRITE]: Object.freeze({
    category: 'adoptionApplication',
    access: 'write',
  }),
  [CAPABILITIES.REWARD_CLAIM_READ_PRIVATE]: Object.freeze({
    category: 'rewardClaim',
    access: 'read',
  }),
  [CAPABILITIES.REWARD_CLAIM]: Object.freeze({
    category: 'rewardClaim',
    access: 'write',
  }),
  [CAPABILITIES.RESCUE_REVIEW_READ_PRIVATE]: Object.freeze({
    category: 'rescueReview',
    access: 'read',
  }),
  [CAPABILITIES.RESCUE_REVIEW_WRITE]: Object.freeze({
    category: 'rescueReview',
    access: 'write',
  }),
  [CAPABILITIES.YARD_MANAGEMENT_READ_PRIVATE]: Object.freeze({
    category: 'yardManagement',
    access: 'read',
  }),
  [CAPABILITIES.YARD_MANAGEMENT]: Object.freeze({
    category: 'yardManagement',
    access: 'write',
  }),
  [CAPABILITIES.ANIMAL_EDIT_READ_PRIVATE]: Object.freeze({
    category: 'animalEdit',
    access: 'read',
  }),
  [CAPABILITIES.ANIMAL_EDIT]: Object.freeze({
    category: 'animalEdit',
    access: 'write',
  }),
})

const CAPABILITY_LIST: readonly Capability[] = freezeList<Capability>(
  CAPABILITIES.ADOPTION_APPLICATION_READ_PRIVATE,
  CAPABILITIES.ADOPTION_APPLICATION_WRITE,
  CAPABILITIES.REWARD_CLAIM_READ_PRIVATE,
  CAPABILITIES.REWARD_CLAIM,
  CAPABILITIES.RESCUE_REVIEW_READ_PRIVATE,
  CAPABILITIES.RESCUE_REVIEW_WRITE,
  CAPABILITIES.YARD_MANAGEMENT_READ_PRIVATE,
  CAPABILITIES.YARD_MANAGEMENT,
  CAPABILITIES.ANIMAL_EDIT_READ_PRIVATE,
  CAPABILITIES.ANIMAL_EDIT,
)
const CATEGORY_LIST: readonly CapabilityCategory[] = freezeList<CapabilityCategory>(
  'adoptionApplication',
  'rewardClaim',
  'rescueReview',
  'yardManagement',
  'animalEdit',
)

const STATE_FIELDS: Readonly<Record<CapabilityCategory, readonly string[]>> = Object.freeze({
  adoptionApplication: Object.freeze(['status', 'applicationStatus']),
  rewardClaim: Object.freeze(['status', 'applicationStatus']),
  // `applicationStatus` belongs to the rescue application axis and is never
  // read by a rescue review capability.  A policy must explicitly choose
  // `status`, `reviewStatus`, or both when the domain truly has that contract.
  rescueReview: Object.freeze(['reviewStatus', 'status']),
  yardManagement: Object.freeze(['status', 'state']),
  animalEdit: Object.freeze(['status', 'state']),
})

const ROLE_RELATION_FIELDS: Readonly<Record<ActorRole, readonly string[]>> = Object.freeze({
  applicant: Object.freeze(['applicantId', 'applicantUserId']),
  owner: Object.freeze(['ownerId', 'yardOwnerId', 'ownerUserId']),
  reviewer: Object.freeze(['reviewerId', 'reviewerIds']),
  cloud_parent: Object.freeze(['cloudParentId', 'cloudParentIds']),
  yard_owner: Object.freeze(['yardOwnerId', 'ownerId', 'ownerUserId']),
  animal_manager: Object.freeze(['managerId', 'managerIds', 'animalManagerId', 'animalManagerIds']),
})

const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

class ActorCapabilityError extends Error {
  readonly code: string
  readonly details: JsonRecord

  constructor(code: string, message: string, details: JsonRecord = {}) {
    super(message)
    this.name = 'ActorCapabilityError'
    this.code = code
    this.details = details
  }
}

function fail(code: string, message: string, details: JsonRecord = {}): never {
  throw new ActorCapabilityError(code, message, details)
}

function own(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function isPlainRecord(value: unknown): value is JsonRecord {
  if (value === null || typeof value !== 'object') return false
  const prototype = Object.getPrototypeOf(value)
  if (prototype === Object.prototype || prototype === null) return true
  // A native WeChat object may cross a JS realm boundary.  Accept only the
  // ordinary Object shape; class instances remain rejected.
  const constructorDescriptor = Object.getOwnPropertyDescriptor(prototype, 'constructor')
  return Object.getPrototypeOf(prototype) === null
    && Object.prototype.toString.call(value) === '[object Object]'
    && constructorDescriptor !== undefined
    && typeof constructorDescriptor.value === 'function'
    && constructorDescriptor.value.name === 'Object'
}

function assertPlainRecord(value: unknown, label: string): asserts value is JsonRecord {
  if (!isPlainRecord(value)) fail('INVALID_RECORD', `${label} must be a plain object`, { label })
}

function rejectDangerousKeys(value: JsonRecord, label: string): void {
  for (const key of Object.keys(value)) {
    if (DANGEROUS_KEYS.has(key)) fail('PROTOTYPE_KEY', `${label} contains a prototype key`, { label, key })
  }
}

function normalizeId(value: unknown, label: string, { required = false }: { required?: boolean } = {}): string {
  let normalized = ''
  if (typeof value === 'string') normalized = value.trim()
  else if (typeof value === 'number' && Number.isSafeInteger(value)) normalized = String(value)
  else if (value !== undefined && value !== null) {
    if (required) fail('INVALID_ID', `${label} must be a restricted actor ID`, { label })
    return ''
  }
  if (!normalized) {
    if (required) fail('MISSING_ACTOR', `${label} is required`, { label })
    return ''
  }
  if (!SAFE_ACTOR_ID.test(normalized)) fail('INVALID_ID', `${label} must be a restricted ID`, { label })
  return normalized
}

function normalizeRoles(value: unknown): readonly ActorRole[] {
  const values = value === undefined || value === null
    ? []
    : Array.isArray(value) ? value : [value]
  const roles: ActorRole[] = []
  for (const role of values) {
    if (typeof role !== 'string' || !includesValue(ACTOR_ROLES, role)) {
      fail('UNKNOWN_ACTOR_ROLE', `Unknown trusted actor role: ${String(role)}`, { role })
    }
    if (!roles.includes(role)) roles.push(role)
  }
  return Object.freeze(roles)
}

/**
 * Resolve one trusted actor from the injected provider.  The provider may
 * return a session `{ actor: { id, roles } }` or the actor object itself.  It
 * must never receive query parameters and its result is read afresh on every
 * authorization attempt, so session switching cannot retain stale identity.
 */
function resolveTrustedActor(actorProvider: unknown): TrustedActor | null {
  if (typeof actorProvider !== 'function') {
    fail('ACTOR_PROVIDER_REQUIRED', 'A trusted session/actor provider is required')
  }

  let provided: unknown
  try {
    provided = actorProvider()
  } catch {
    fail('ACTOR_PROVIDER_FAILED', 'The trusted actor provider failed')
  }
  if (provided === undefined || provided === null) return null
  assertPlainRecord(provided, 'actor provider result')
  rejectDangerousKeys(provided, 'actor provider result')

  const candidate = own(provided, 'actor') ? provided.actor : provided
  if (candidate === undefined || candidate === null) return null
  assertPlainRecord(candidate, 'trusted actor')
  rejectDangerousKeys(candidate, 'trusted actor')

  const actorId = normalizeId(
    own(candidate, 'id') ? candidate.id : candidate.actorId,
    'trusted actor id',
    { required: true }
  )
  const roles = normalizeRoles(own(candidate, 'roles') ? candidate.roles : candidate.role)
  return Object.freeze({ id: actorId, roles })
}

function normalizeIdList(value: unknown, label: string): string[] {
  const values = Array.isArray(value) ? value : [value]
  const result: string[] = []
  for (const item of values) {
    const id = normalizeId(item, label)
    if (!id) fail('INVALID_OBJECT_RELATION', `${label} contains an invalid ID`, { label })
    if (id && !result.includes(id)) result.push(id)
  }
  return result
}

function matchesRelation(actorId: string, object: JsonRecord, role: ActorRole): boolean {
  const fields = ROLE_RELATION_FIELDS[role] || []
  for (const field of fields) {
    if (!own(object, field)) continue
    const values = normalizeIdList(object[field], `object.${field}`)
    if (values.includes(actorId)) return true
  }
  return false
}

function readObjectState(object: JsonRecord, stateFields: readonly string[]): ObjectState {
  const fields = stateFields || []
  const values: string[] = []
  for (const field of fields) {
    if (!own(object, field)) continue
    const value = object[field]
    if (typeof value !== 'string' || !value.trim()) return { state: '', valid: false, reason: 'INVALID_STATE' }
    const state = value.trim()
    if (!values.includes(state)) values.push(state)
  }
  if (values.length > 1) return { state: '', valid: false, reason: 'CONFLICTING_STATE' }
  return { state: values[0] || '', valid: true, reason: values.length ? '' : 'MISSING_STATE' }
}

function normalizeRule(rule: unknown, label: string, category: CapabilityCategory): CapabilityRule | null {
  if (rule === undefined || rule === null) return null
  assertPlainRecord(rule, label)
  rejectDangerousKeys(rule, label)
  const roles = rule.roles === undefined ? [] : normalizeRoles(rule.roles)
  const rawStateFields = own(rule, 'stateFields') ? rule.stateFields : rule.stateField
  if (rawStateFields === undefined) {
    fail('INVALID_POLICY', `${label}.stateFields is required`, { label })
  }
  const stateFields: unknown[] = Array.isArray(rawStateFields) ? rawStateFields.slice() : [rawStateFields]
  if (!stateFields.length || stateFields.some(field => typeof field !== 'string' || !STATE_FIELDS[category].includes(field))) {
    fail('INVALID_POLICY', `${label}.stateFields contains an invalid field`, { label, category })
  }
  const states: unknown[] = rule.states === undefined
    ? []
    : Array.isArray(rule.states) ? rule.states.slice() : [rule.states]
  for (const state of states) {
    if (typeof state !== 'string' || !state.trim()) fail('INVALID_POLICY', `${label}.states contains an invalid state`, { label })
  }
  const uniqueStates: string[] = []
  for (const state of states) {
    if (typeof state === 'string' && !uniqueStates.includes(state.trim())) uniqueStates.push(state.trim())
  }
  return Object.freeze({
    roles,
    states: Object.freeze(uniqueStates),
    stateFields: Object.freeze(stateFields.filter((field): field is string => typeof field === 'string')),
  })
}

function emptyCategoryPolicy(): CategoryPolicy {
  return { read: null, write: null }
}

function normalizePolicy(policy: unknown = {}): CapabilityPolicy {
  assertPlainRecord(policy, 'policy')
  rejectDangerousKeys(policy, 'policy')
  const normalized: Record<CapabilityCategory, CategoryPolicy> = {
    adoptionApplication: emptyCategoryPolicy(),
    rewardClaim: emptyCategoryPolicy(),
    rescueReview: emptyCategoryPolicy(),
    yardManagement: emptyCategoryPolicy(),
    animalEdit: emptyCategoryPolicy(),
  }
  for (const category of CATEGORY_LIST) {
    const categoryPolicy = own(policy, category) ? policy[category] : null
    if (categoryPolicy === undefined || categoryPolicy === null) {
      normalized[category] = Object.freeze({ read: null, write: null })
      continue
    }
    assertPlainRecord(categoryPolicy, `${category} policy`)
    rejectDangerousKeys(categoryPolicy, `${category} policy`)
    normalized[category] = Object.freeze({
      read: normalizeRule(categoryPolicy.read, `${category}.read`, category),
      write: normalizeRule(categoryPolicy.write, `${category}.write`, category),
    })
  }
  return Object.freeze(normalized)
}

function allDenied(reason: string, details: JsonRecord = {}): { capabilities: Record<string, boolean>; reasons: Record<string, string>; details: JsonRecord } {
  const capabilities: Record<string, boolean> = Object.create(null)
  const reasons: Record<string, string> = Object.create(null)
  for (const capability of CAPABILITY_LIST) {
    capabilities[capability] = false
    reasons[capability] = reason
  }
  return { capabilities, reasons, details }
}

function evaluateOne(capability: Capability, actor: TrustedActor | null, object: unknown, policy: CapabilityPolicy): CapabilityDecision {
  const definition = CAPABILITY_DEFINITIONS[capability]
  if (!definition) return { allowed: false, reason: 'UNKNOWN_CAPABILITY' }
  if (!actor) return { allowed: false, reason: 'NO_ACTOR' }
  if (!isPlainRecord(object)) return { allowed: false, reason: 'INVALID_OBJECT' }

  const rule = policy[definition.category] && policy[definition.category][definition.access]
  if (!rule || !rule.roles.length || !rule.states.length) {
    return { allowed: false, reason: 'POLICY_MISSING' }
  }

  const state = readObjectState(object, rule.stateFields)
  if (!state.valid || !state.state) return { allowed: false, reason: state.reason }
  if (!rule.states.includes(state.state)) return { allowed: false, reason: 'STATE_NOT_ALLOWED' }

  const role = actor.roles.find(candidate => rule.roles.includes(candidate))
  if (!role) return { allowed: false, reason: 'ROLE_NOT_ALLOWED' }
  if (!matchesRelation(actor.id, object, role)) {
    return { allowed: false, reason: 'OBJECT_RELATION_DENIED' }
  }
  return { allowed: true, reason: '', role, state: state.state }
}

function errorCode(error: unknown, fallback: string): string {
  if (error !== null && typeof error === 'object' && 'code' in error && typeof error.code === 'string') return error.code
  return fallback
}

function errorMessage(error: unknown, fallback: string): string {
  if (error !== null && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return fallback
}

function isCapability(value: unknown): value is Capability {
  return typeof value === 'string' && includesValue(CAPABILITY_LIST, value)
}

function safeEvaluate(context: unknown = {}): CapabilityEvaluation {
  const source = isPlainRecord(context) ? context : {}
  let actor: TrustedActor | null
  let policy: CapabilityPolicy
  try {
    actor = resolveTrustedActor(source.actorProvider)
    policy = normalizePolicy(source.policy || {})
  } catch (error) {
    const code = errorCode(error, 'INVALID_ACTOR')
    return Object.freeze({
      actor: null,
      capabilities: Object.freeze(allDenied(code).capabilities),
      reasons: Object.freeze(allDenied(code).reasons),
      error: Object.freeze({ code: errorCode(error, 'ACTOR_CONTRACT_FAILED'), message: errorMessage(error, 'Actor capability evaluation failed') }),
    })
  }

  const result = allDenied('DENIED')
  for (const capability of CAPABILITY_LIST) {
    let item
    try {
      item = evaluateOne(capability, actor, source.object, policy)
    } catch (error) {
      // `canCapability` is the non-throwing query API.  Malformed object
      // relationships are still a denial; callers that need the reason use
      // `assertCapability` and receive the stable contract error.
      item = { allowed: false, reason: errorCode(error, 'INVALID_OBJECT') }
    }
    result.capabilities[capability] = item.allowed
    result.reasons[capability] = item.reason
  }
  return Object.freeze({
    actor: actor ? Object.freeze({ id: actor.id, roles: actor.roles }) : null,
    capabilities: Object.freeze(result.capabilities),
    reasons: Object.freeze(result.reasons),
    error: null,
  })
}

function evaluateCapabilities(context: unknown = {}): CapabilityEvaluation {
  return safeEvaluate(context)
}

function canCapability(capability: unknown, context: unknown = {}): boolean {
  if (!isCapability(capability)) return false
  return evaluateCapabilities(context).capabilities[capability] === true
}

function assertCapability(capability: unknown, context: unknown = {}): Authorization {
  if (!isCapability(capability)) {
    fail('UNKNOWN_CAPABILITY', `Unknown capability: ${String(capability)}`, { capability })
  }
  const source = isPlainRecord(context) ? context : {}
  const actor = resolveTrustedActor(source.actorProvider)
  const policy = normalizePolicy(source.policy || {})
  const object = source.object
  const result = evaluateOne(capability, actor, object, policy)
  if (!result.allowed || !actor) {
    fail('CAPABILITY_DENIED', `Capability denied: ${capability}`, {
      capability,
      reason: result.reason,
    })
  }
  return Object.freeze({
    capability,
    actorId: actor.id,
    role: result.role,
    state: result.state,
  })
}

function assertPrivateRead(capability: unknown, context: unknown = {}): Authorization {
  if (!isCapability(capability)) {
    fail('PRIVATE_READ_CAPABILITY_REQUIRED', 'A private read capability is required', { capability })
  }
  const definition = CAPABILITY_DEFINITIONS[capability]
  if (!definition || definition.access !== 'read') {
    fail('PRIVATE_READ_CAPABILITY_REQUIRED', 'A private read capability is required', { capability })
  }
  return assertCapability(capability, context)
}

function resolveCurrentObject(context: unknown = {}): unknown {
  const source = isPlainRecord(context) ? context : {}
  if (typeof source.readObject !== 'function') return source.object
  try {
    return source.readObject()
  } catch {
    fail('OBJECT_READ_FAILED', 'The current object could not be read')
  }
}

export type CapabilityContext<T> = EvaluatorOptions & (
  | { object: T; readObject?: () => T }
  | { object?: T; readObject: () => T }
)
export type CapabilityCallback<T, R> = (object: T, authorization: Authorization) => R

function isCapabilityCallback(value: unknown): value is CapabilityCallback<unknown, unknown> {
  return typeof value === 'function'
}

/**
 * Run a private reader only after the current object and actor have been
 * checked.  The reader is never called on a denied or stale request.
 */
function readPrivate<T, R>(capability: Capability, context: CapabilityContext<T>, reader: CapabilityCallback<NoInfer<T>, R>): R
function readPrivate(capability: unknown, context: unknown = {}, reader: unknown): unknown {
  if (!isCapabilityCallback(reader)) fail('READER_REQUIRED', 'A private reader function is required')
  const object = resolveCurrentObject(context)
  const source = isPlainRecord(context) ? context : {}
  const authorization = assertPrivateRead(capability, { ...source, object })
  return reader(object, authorization)
}

/**
 * Run a domain write adapter only after a fresh object read and capability
 * check.  This module performs no write itself; a denied request cannot reach
 * the injected writer, which makes zero-write testing explicit.
 */
function writeWithCapability<T, R>(capability: Capability, context: CapabilityContext<T>, writer: CapabilityCallback<NoInfer<T>, R>): R
function writeWithCapability(capability: unknown, context: unknown = {}, writer: unknown): unknown {
  if (!isCapabilityCallback(writer)) fail('WRITER_REQUIRED', 'A capability writer function is required')
  const object = resolveCurrentObject(context)
  const source = isPlainRecord(context) ? context : {}
  const authorization = assertCapability(capability, { ...source, object })
  return writer(object, authorization)
}

function createCapabilityEvaluator({ actorProvider, policy = {} }: EvaluatorOptions = {}) {
  const fixedPolicy = normalizePolicy(policy)
  return Object.freeze({
    getActor: () => resolveTrustedActor(actorProvider),
    evaluate: (object: unknown) => evaluateCapabilities({ actorProvider, policy: fixedPolicy, object }),
    can: (capability: unknown, object: unknown) => canCapability(capability, { actorProvider, policy: fixedPolicy, object }),
    assert: (capability: unknown, object: unknown) => assertCapability(capability, { actorProvider, policy: fixedPolicy, object }),
    readPrivate: <T, R>(capability: Capability, object: T, reader: CapabilityCallback<NoInfer<T>, R>) => readPrivate(capability, { actorProvider, policy: fixedPolicy, object }, reader),
    write: <T, R>(capability: Capability, object: T, writer: CapabilityCallback<NoInfer<T>, R>) => writeWithCapability(capability, { actorProvider, policy: fixedPolicy, object }, writer),
  })
}

export {
  SAFE_ACTOR_ID,
  ACTOR_ROLES,
  CAPABILITIES,
  CAPABILITY_NAMES,
  CAPABILITY_LIST,
  CAPABILITY_DEFINITIONS,
  ActorCapabilityError,
  resolveTrustedActor,
  normalizePolicy,
  evaluateCapabilities,
  canCapability,
  assertCapability,
  assertPrivateRead,
  readPrivate,
  writeWithCapability,
  createCapabilityEvaluator,
}
