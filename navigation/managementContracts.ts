/**
 * Pure, read-only management capability contract.
 *
 * This module is the policy seam for account profile, yard management, and
 * animal detail/editor boundaries.  It has no Vue, uni-app, page, route,
 * storage, mock, or network dependency.  A caller supplies records that it
 * already read and a trusted actor provider.  The record IDs and relations
 * are authoritative; query/navigation fields are locator hints only.
 *
 * This contract does not define a state machine and it never writes.  A
 * domain adapter must inject the legal state lists for its current records,
 * then perform its own fresh read and mutation check before any write.
 */

import { ACTOR_ROLES, resolveTrustedActor, type ActorRole } from './actorCapabilities.ts'

type JsonRecord = Record<string, unknown>
type ResourceType = 'profile' | 'yard' | 'animal'
type Visibility = 'public' | 'private'
type ManagementCapability =
  | 'profile.readPublic'
  | 'profile.readPrivate'
  | 'profile.edit'
  | 'yard.readPublic'
  | 'yard.management.readPrivate'
  | 'yard.edit'
  | 'animal.readPublic'
  | 'animal.management.readPrivate'
  | 'animal.edit'

interface TrustedActor {
  id: string
  roles: readonly ActorRole[]
}

interface ObjectState {
  state: string
  valid: boolean
  reason: string
  label?: string
}

interface ProfileRecord {
  type: 'profile'
  userId: string
  state: ObjectState
  visibility: Visibility
}

interface YardRecord {
  type: 'yard'
  yardId: string
  ownerIds: readonly string[]
  yardOwnerIds: readonly string[]
  state: ObjectState
  visibility: Visibility
}

interface AnimalRecord {
  type: 'animal'
  animalId: string
  yardId: string
  managerIds: readonly string[]
  cloudParentIds: readonly string[]
  yardOwnerIds: readonly string[]
  state: ObjectState
  visibility: Visibility
}

interface ResourcePolicy {
  readStates: readonly string[] | null
  manageStates: readonly string[] | null
  editStates: readonly string[] | null
  ownerRoles?: readonly ActorRole[]
  yardOwnerRoles?: readonly ActorRole[]
  managerRoles?: readonly ActorRole[]
}

interface ManagementPolicy {
  profile: ResourcePolicy | null
  yard: ResourcePolicy | null
  animal: ResourcePolicy | null
}

interface QueryLocators {
  [key: string]: string | undefined
  userId?: string
  yardId?: string
  animalId?: string
}

interface ManagementSource {
  records: {
    profile: ProfileRecord | null
    yard: YardRecord | null
    animal: AnimalRecord | null
  }
  locator: QueryLocators
  query: JsonRecord
}

interface Decision {
  [key: string]: string | boolean | undefined
}

interface CapabilityResult {
  actor: TrustedActor | null
  locator: QueryLocators
  records: JsonRecord
  capabilities: Readonly<Record<string, boolean>>
  reasons: Readonly<Record<string, string>>
  permissions: JsonRecord
  readOnly: true
  canWrite: false
  cancelled: boolean
  error: { code: string; message?: string } | null
}

interface ManagementEvaluatorOptions {
  actorProvider?: () => unknown
  policy?: unknown
}

function freezeList<T extends string>(...values: T[]): readonly T[] {
  return Object.freeze(values)
}

function includesValue<T extends string>(values: readonly T[], value: string): value is T {
  return values.some((candidate) => candidate === value)
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

const MANAGEMENT_RESOURCE_TYPES: readonly ResourceType[] = freezeList<ResourceType>('profile', 'yard', 'animal')

const MANAGEMENT_CAPABILITIES: Readonly<{
  PROFILE_READ_PUBLIC: 'profile.readPublic'
  PROFILE_READ_PRIVATE: 'profile.readPrivate'
  PROFILE_EDIT: 'profile.edit'
  YARD_READ_PUBLIC: 'yard.readPublic'
  YARD_MANAGEMENT_READ_PRIVATE: 'yard.management.readPrivate'
  YARD_EDIT: 'yard.edit'
  ANIMAL_READ_PUBLIC: 'animal.readPublic'
  ANIMAL_MANAGEMENT_READ_PRIVATE: 'animal.management.readPrivate'
  ANIMAL_EDIT: 'animal.edit'
}> = Object.freeze({
  PROFILE_READ_PUBLIC: 'profile.readPublic',
  PROFILE_READ_PRIVATE: 'profile.readPrivate',
  PROFILE_EDIT: 'profile.edit',
  YARD_READ_PUBLIC: 'yard.readPublic',
  YARD_MANAGEMENT_READ_PRIVATE: 'yard.management.readPrivate',
  YARD_EDIT: 'yard.edit',
  ANIMAL_READ_PUBLIC: 'animal.readPublic',
  ANIMAL_MANAGEMENT_READ_PRIVATE: 'animal.management.readPrivate',
  ANIMAL_EDIT: 'animal.edit',
})

// Friendly aliases keep caller vocabulary readable while preserving one
// stable value for each capability.
const MANAGEMENT_CAPABILITY_NAMES = Object.freeze({
  ...MANAGEMENT_CAPABILITIES,
  PROFILE_READ: MANAGEMENT_CAPABILITIES.PROFILE_READ_PUBLIC,
  YARD_PUBLIC_READ: MANAGEMENT_CAPABILITIES.YARD_READ_PUBLIC,
  YARD_MANAGEMENT: MANAGEMENT_CAPABILITIES.YARD_MANAGEMENT_READ_PRIVATE,
  ANIMAL_PUBLIC_READ: MANAGEMENT_CAPABILITIES.ANIMAL_READ_PUBLIC,
  ANIMAL_MANAGEMENT: MANAGEMENT_CAPABILITIES.ANIMAL_MANAGEMENT_READ_PRIVATE,
})

const CAPABILITY_LIST: readonly ManagementCapability[] = freezeList<ManagementCapability>(
  MANAGEMENT_CAPABILITIES.PROFILE_READ_PUBLIC,
  MANAGEMENT_CAPABILITIES.PROFILE_READ_PRIVATE,
  MANAGEMENT_CAPABILITIES.PROFILE_EDIT,
  MANAGEMENT_CAPABILITIES.YARD_READ_PUBLIC,
  MANAGEMENT_CAPABILITIES.YARD_MANAGEMENT_READ_PRIVATE,
  MANAGEMENT_CAPABILITIES.YARD_EDIT,
  MANAGEMENT_CAPABILITIES.ANIMAL_READ_PUBLIC,
  MANAGEMENT_CAPABILITIES.ANIMAL_MANAGEMENT_READ_PRIVATE,
  MANAGEMENT_CAPABILITIES.ANIMAL_EDIT,
)

const CAPABILITY_DEFINITIONS: Readonly<Record<ManagementCapability, { resource: ResourceType; action: string }>> = Object.freeze({
  [MANAGEMENT_CAPABILITIES.PROFILE_READ_PUBLIC]: Object.freeze({ resource: 'profile', action: 'readPublic' }),
  [MANAGEMENT_CAPABILITIES.PROFILE_READ_PRIVATE]: Object.freeze({ resource: 'profile', action: 'readPrivate' }),
  [MANAGEMENT_CAPABILITIES.PROFILE_EDIT]: Object.freeze({ resource: 'profile', action: 'edit' }),
  [MANAGEMENT_CAPABILITIES.YARD_READ_PUBLIC]: Object.freeze({ resource: 'yard', action: 'readPublic' }),
  [MANAGEMENT_CAPABILITIES.YARD_MANAGEMENT_READ_PRIVATE]: Object.freeze({ resource: 'yard', action: 'managementRead' }),
  [MANAGEMENT_CAPABILITIES.YARD_EDIT]: Object.freeze({ resource: 'yard', action: 'edit' }),
  [MANAGEMENT_CAPABILITIES.ANIMAL_READ_PUBLIC]: Object.freeze({ resource: 'animal', action: 'readPublic' }),
  [MANAGEMENT_CAPABILITIES.ANIMAL_MANAGEMENT_READ_PRIVATE]: Object.freeze({ resource: 'animal', action: 'managementRead' }),
  [MANAGEMENT_CAPABILITIES.ANIMAL_EDIT]: Object.freeze({ resource: 'animal', action: 'edit' }),
})

const TOP_LEVEL_KEYS = new Set([
  'actorProvider', 'profile', 'yard', 'animal', 'object', 'resourceType',
  'userId', 'yardId', 'animalId', 'query', 'policy', 'intent', 'cancelled',
])
const QUERY_KEYS = new Set(['userId', 'yardId', 'animalId', 'managed', 'role', 'state'])

const PROFILE_KEYS = new Set(['userId', 'status', 'state', 'visibility', 'isPublic'])
const YARD_KEYS = new Set([
  'yardId', 'ownerId', 'ownerIds', 'ownerUserId', 'ownerUserIds',
  'yardOwnerId', 'yardOwnerIds', 'yardOwnerUserId', 'yardOwnerUserIds',
  'status', 'state', 'visibility', 'isPublic',
])
const ANIMAL_KEYS = new Set([
  'animalId', 'yardId', 'managerId', 'managerIds', 'animalManagerId', 'animalManagerIds',
  'cloudParentId', 'cloudParentIds', 'cloudParentUserId', 'cloudParentUserIds',
  'yardOwnerId', 'yardOwnerIds', 'yardOwnerUserId', 'yardOwnerUserIds',
  'status', 'state', 'visibility', 'isPublic',
])

class ManagementContractError extends Error {
  readonly code: string
  readonly details: JsonRecord

  constructor(code: string, message: string, details: JsonRecord = {}) {
    super(message)
    this.name = 'ManagementContractError'
    this.code = code
    this.details = details
  }
}

function fail(code: string, message: string, details: JsonRecord = {}): never {
  throw new ManagementContractError(code, message, details)
}

function own(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function isPlainRecord(value: unknown): value is JsonRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  if (prototype === Object.prototype || prototype === null) return true
  // A native WeChat object may cross a JS realm boundary.  Accept the
  // ordinary cross-realm Object while continuing to reject class instances.
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
  let id = ''
  if (typeof value === 'string') {
    // IDs are wire identifiers.  Unlike the legacy actor provider (whose
    // public contract trims actor IDs), an object or locator ID containing
    // padding is malformed and must not alias a different record.
    if (value !== value.trim()) fail('INVALID_ID', `${label} must not contain surrounding whitespace`, { label })
    id = value
  }
  else if (typeof value === 'number' && Number.isSafeInteger(value)) id = String(value)
  else if (value !== undefined && value !== null) fail('INVALID_ID', `${label} must be an opaque ID`, { label })
  if (!id) {
    if (required) fail('MISSING_ID', `${label} is required`, { label })
    return ''
  }
  if (!SAFE_ID.test(id) || URL_MARKERS.test(id)) fail('INVALID_ID', `${label} must be an opaque ID`, { label })
  return id
}

function normalizeIdList(value: unknown, label: string): string[] {
  const values = Array.isArray(value) ? value : [value]
  // An empty plural relation is an explicit absence of that relation.  It is
  // still compared with every alias below, so `managerIds: []` plus
  // `managerId: "manager-a"` fails instead of silently adding an ID.
  if (!values.length) return []
  const ids: string[] = []
  for (const item of values) {
    const id = normalizeId(item, label, { required: true })
    if (!ids.includes(id)) ids.push(id)
  }
  return ids
}

function relationIds(record: JsonRecord, fields: readonly string[], label: string): string[] {
  let expected = null
  for (const field of fields) {
    if (!own(record, field)) continue
    const current = normalizeIdList(record[field], `${label}.${field}`)
    const currentSet = new Set(current)
    if (expected === null) {
      expected = currentSet
      continue
    }
    // The fields passed here are aliases, not additive relationship buckets.
    // A legacy record may carry the same ID in both singular and plural
    // spellings, but two different sets are ambiguous and fail closed.
    if (expected.size !== currentSet.size || [...expected].some(id => !currentSet.has(id))) {
      fail('CONFLICTING_RELATION', `${label} relation aliases disagree`, { label, field })
    }
  }
  return expected ? [...expected] : []
}

function relationMatches(actorId: string, relation: readonly string[]): boolean {
  return relation.includes(actorId)
}

function readState(record: JsonRecord, label: string): ObjectState {
  const values: string[] = []
  for (const field of ['status', 'state']) {
    if (!own(record, field)) continue
    if (typeof record[field] !== 'string' || !record[field].trim()) {
      return { state: '', valid: false, reason: 'INVALID_STATE' }
    }
    const value = record[field].trim()
    if (!values.includes(value)) values.push(value)
  }
  if (values.length > 1) return { state: '', valid: false, reason: 'CONFLICTING_STATE' }
  if (!values.length) return { state: '', valid: false, reason: 'MISSING_STATE' }
  return { state: values[0], valid: true, reason: '', label }
}

function normalizeVisibility(record: JsonRecord, label: string): Visibility {
  let visibility: Visibility = 'public'
  if (own(record, 'visibility')) {
    if (typeof record.visibility !== 'string' || !includesValue(['public', 'private'], record.visibility)) {
      fail('INVALID_VISIBILITY', `${label}.visibility is invalid`, { label })
    }
    visibility = record.visibility
  }
  if (own(record, 'isPublic')) {
    if (typeof record.isPublic !== 'boolean') fail('INVALID_VISIBILITY', `${label}.isPublic must be boolean`, { label })
    const fromBoolean = record.isPublic ? 'public' : 'private'
    if (own(record, 'visibility') && visibility !== fromBoolean) {
      fail('CONFLICTING_VISIBILITY', `${label} visibility fields disagree`, { label })
    }
    visibility = fromBoolean
  }
  return visibility
}

function assertKnownFields(value: JsonRecord, allowed: ReadonlySet<string>, label: string): void {
  // Extra business fields are intentionally retained by adapters, but a
  // navigation-only hint must not masquerade as an object relation.  Known
  // authorization-looking fields are allowed and ignored below; symbols and
  // prototype keys were already rejected by assertRecord.
  for (const key of Object.keys(value)) {
    if (allowed.has(key)) continue
    if (['managed', 'role', 'query'].includes(key)) {
      fail('UNTRUSTED_AUTH_FIELD', `${label}.${key} is not an object authorization field`, { key })
    }
  }
}

function normalizeProfile(input: unknown): ProfileRecord {
  assertRecord(input, 'profile')
  assertKnownFields(input, PROFILE_KEYS, 'profile')
  const userId = normalizeId(input.userId, 'profile.userId', { required: true })
  return Object.freeze({
    type: 'profile',
    userId,
    state: readState(input, 'profile'),
    visibility: normalizeVisibility(input, 'profile'),
  })
}

function normalizeYard(input: unknown): YardRecord {
  assertRecord(input, 'yard')
  assertKnownFields(input, YARD_KEYS, 'yard')
  const yardId = normalizeId(input.yardId, 'yard.yardId', { required: true })
  const ownerIds = relationIds(input, ['ownerId', 'ownerIds', 'ownerUserId', 'ownerUserIds'], 'yard')
  const yardOwnerIds = relationIds(input, ['yardOwnerId', 'yardOwnerIds', 'yardOwnerUserId', 'yardOwnerUserIds'], 'yard')
  if (ownerIds.length > 1 || yardOwnerIds.length > 1) {
    fail('CONFLICTING_OWNER_RELATION', 'yard contains multiple conflicting owner IDs', { yardId })
  }
  return Object.freeze({
    type: 'yard',
    yardId,
    ownerIds: Object.freeze(ownerIds),
    yardOwnerIds: Object.freeze(yardOwnerIds),
    state: readState(input, 'yard'),
    visibility: normalizeVisibility(input, 'yard'),
  })
}

function normalizeAnimal(input: unknown): AnimalRecord {
  assertRecord(input, 'animal')
  assertKnownFields(input, ANIMAL_KEYS, 'animal')
  const animalId = normalizeId(input.animalId, 'animal.animalId', { required: true })
  const yardId = normalizeId(input.yardId, 'animal.yardId', { required: true })
  const managerIds = relationIds(input, ['managerId', 'managerIds', 'animalManagerId', 'animalManagerIds'], 'animal')
  const cloudParentIds = relationIds(input, ['cloudParentId', 'cloudParentIds', 'cloudParentUserId', 'cloudParentUserIds'], 'animal')
  const yardOwnerIds = relationIds(input, ['yardOwnerId', 'yardOwnerIds', 'yardOwnerUserId', 'yardOwnerUserIds'], 'animal')
  if (yardOwnerIds.length > 1) {
    fail('CONFLICTING_OWNER_RELATION', 'animal contains multiple conflicting yard-owner IDs', { animalId })
  }
  return Object.freeze({
    type: 'animal',
    animalId,
    yardId,
    managerIds: Object.freeze(managerIds),
    cloudParentIds: Object.freeze(cloudParentIds),
    yardOwnerIds: Object.freeze(yardOwnerIds),
    state: readState(input, 'animal'),
    visibility: normalizeVisibility(input, 'animal'),
  })
}

function normalizeQuery(query: unknown): JsonRecord {
  if (query === undefined || query === null) return Object.freeze({})
  assertRecord(query, 'query')
  for (const key of Object.keys(query)) {
    if (!QUERY_KEYS.has(key)) fail('UNKNOWN_QUERY_FIELD', `Unknown management query field: ${key}`, { key })
  }
  const normalized: JsonRecord = {}
  for (const key of ['userId', 'yardId', 'animalId']) {
    if (own(query, key)) normalized[key] = normalizeId(query[key], `query.${key}`, { required: true })
  }
  // managed, role, and state are explicitly accepted as display/navigation
  // hints only.  None is copied into a capability decision.
  return Object.freeze(normalized)
}

function normalizeLocator(source: JsonRecord, query: JsonRecord): QueryLocators {
  const locator: QueryLocators = {}
  for (const key of ['userId', 'yardId', 'animalId']) {
    const direct = own(source, key) ? normalizeId(source[key], key, { required: true }) : ''
    const hinted = own(query, key) ? normalizeId(query[key], `query.${key}`, { required: true }) : ''
    if (direct && hinted && direct !== hinted) fail('LOCATOR_CONFLICT', `${key} locator values disagree`, { key })
    if (direct || hinted) locator[key] = direct || hinted
  }
  return Object.freeze(locator)
}

function normalizeStateList(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value)) fail('INVALID_POLICY', `${label} must be an array of legal states`, { label })
  const states: string[] = []
  for (const state of value) {
   if (typeof state !== 'string' || !state.trim() || hasControlCharacter(state)) {
     fail('INVALID_POLICY', `${label} contains an invalid state`, { label })
   }
    const normalized = state.trim()
    if (!states.includes(normalized)) states.push(normalized)
  }
  return Object.freeze(states)
}

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0)
    if ((code >= 0 && code <= 0x1f) || code === 0x7f) return true
  }
  return false
}

function normalizeAliasedStateLists(input: JsonRecord, fields: readonly string[], resource: ResourceType): readonly string[] | null {
  const supplied = fields.filter(field => own(input, field))
  if (!supplied.length) return null
  const values = supplied.map(field => {
    const value = input[field]
    if (value === undefined || value === null) return null
    return normalizeStateList(value, `${resource}.${field}`)
  })
  const signatures = values.map(value => value === null ? '' : [...value].sort().join('\u0000'))
  if (new Set(signatures).size > 1) {
    fail('CONFLICTING_POLICY_FIELD', `${resource} policy aliases disagree`, { fields: supplied })
  }
  return values[0]
}

function normalizeRoleList(value: unknown, label: string, fallback: readonly ActorRole[]): readonly ActorRole[] {
  if (value === undefined) return Object.freeze(fallback.slice())
  if (!Array.isArray(value) || !value.length) fail('INVALID_POLICY', `${label} must be a non-empty role list`, { label })
  const roles: ActorRole[] = []
  for (const role of value) {
    if (typeof role !== 'string' || !includesValue(ACTOR_ROLES, role)) fail('INVALID_POLICY', `${label} contains an unknown actor role`, { label, role })
    if (!roles.includes(role)) roles.push(role)
  }
  return Object.freeze(roles)
}

function normalizeResourcePolicy(input: unknown, resource: ResourceType): ResourcePolicy | null {
  if (input === undefined || input === null) return null
  assertRecord(input, `${resource} policy`)
  const allowed = new Set(['readStates', 'readableStates', 'manageStates', 'manageableStates', 'managementStates', 'editStates', 'editableStates'])
  if (resource === 'yard') {
    allowed.add('ownerRoles')
    allowed.add('yardOwnerRoles')
  }
  if (resource === 'animal') {
    allowed.add('yardOwnerRoles')
    allowed.add('managerRoles')
  }
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) fail('UNKNOWN_POLICY_FIELD', `Unknown ${resource} policy field: ${key}`, { resource, key })
  }
  const normalized: ResourcePolicy = {
    readStates: normalizeAliasedStateLists(input, ['readStates', 'readableStates'], resource),
    manageStates: normalizeAliasedStateLists(input, ['manageStates', 'manageableStates', 'managementStates'], resource),
    editStates: normalizeAliasedStateLists(input, ['editStates', 'editableStates'], resource),
  }
  if (resource === 'yard') {
    normalized.ownerRoles = normalizeRoleList(input.ownerRoles, `${resource}.ownerRoles`, ['yard_owner'])
    normalized.yardOwnerRoles = normalizeRoleList(input.yardOwnerRoles, `${resource}.yardOwnerRoles`, ['yard_owner'])
  }
  if (resource === 'animal') {
    normalized.yardOwnerRoles = normalizeRoleList(input.yardOwnerRoles, `${resource}.yardOwnerRoles`, ['yard_owner'])
    normalized.managerRoles = normalizeRoleList(input.managerRoles, `${resource}.managerRoles`, ['animal_manager'])
  }
  return Object.freeze(normalized)
}

function normalizePolicy(policy: unknown): ManagementPolicy | null {
  if (policy === undefined || policy === null) return null
  assertRecord(policy, 'management policy')
  for (const key of Object.keys(policy)) {
    if (!includesValue(MANAGEMENT_RESOURCE_TYPES, key)) fail('UNKNOWN_POLICY_FIELD', `Unknown management policy resource: ${key}`, { key })
  }
  return Object.freeze({
    profile: normalizeResourcePolicy(policy.profile, 'profile'),
    yard: normalizeResourcePolicy(policy.yard, 'yard'),
    animal: normalizeResourcePolicy(policy.animal, 'animal'),
  })
}

function stateAllowed(record: { state: ObjectState }, states: readonly string[] | null | undefined, label: string): Decision {
  if (!states) return { allowed: false, reason: 'POLICY_MISSING' }
  if (!record.state.valid) return { allowed: false, reason: record.state.reason }
  if (!states.includes(record.state.state)) return { allowed: false, reason: 'STATE_NOT_ALLOWED' }
  return { allowed: true, reason: '', state: record.state.state, label }
}

function profileDecisions(record: ProfileRecord, actor: TrustedActor | null, policy: ResourcePolicy | null): Decision {
  const denied: Decision = { readPublic: 'POLICY_MISSING', readPrivate: 'POLICY_MISSING', edit: 'POLICY_MISSING' }
  if (!policy) return denied
  const read = stateAllowed(record, policy.readStates, 'profile')
  const edit = stateAllowed(record, policy.editStates, 'profile')
  const publicRead = read.allowed && record.visibility === 'public'
  const ownProfile = Boolean(actor && actor.id === record.userId)
  return {
    readPublic: publicRead ? '' : (read.allowed ? 'PRIVATE_VISIBILITY' : read.reason),
    readPrivate: ownProfile && read.allowed ? '' : (ownProfile ? read.reason : 'ACTOR_NOT_PROFILE_OWNER'),
    edit: ownProfile && edit.allowed ? '' : (ownProfile ? edit.reason : 'ACTOR_NOT_PROFILE_OWNER'),
  }
}

function yardOwnerMatches(record: YardRecord, actor: TrustedActor | null, policy: ResourcePolicy | null): { matched: boolean; role: ActorRole | ''; reason: string } {
  if (!actor || !policy) return { matched: false, role: '', reason: 'POLICY_MISSING' }
  for (const role of actor.roles) {
    const allowed = role === 'yard_owner'
      ? policy.yardOwnerRoles?.includes(role) === true
      : policy.ownerRoles?.includes(role) === true
    if (!allowed) continue
    const ids = role === 'yard_owner' ? record.yardOwnerIds : record.ownerIds
    if (relationMatches(actor.id, ids)) return { matched: true, role, reason: '' }
  }
  return { matched: false, role: '', reason: 'YARD_OWNER_RELATION_REQUIRED' }
}

function yardDecisions(record: YardRecord, actor: TrustedActor | null, policy: ResourcePolicy | null): Decision {
  if (!policy) return { readPublic: 'POLICY_MISSING', managementRead: 'POLICY_MISSING', edit: 'POLICY_MISSING' }
  const read = stateAllowed(record, policy.readStates, 'yard')
  const manage = stateAllowed(record, policy.manageStates, 'yard')
  const edit = stateAllowed(record, policy.editStates, 'yard')
  const owner = yardOwnerMatches(record, actor, policy)
  return {
    readPublic: read.allowed && record.visibility === 'public' ? '' : (read.allowed ? 'PRIVATE_VISIBILITY' : read.reason),
    managementRead: owner.matched && manage.allowed ? '' : (owner.matched ? manage.reason : owner.reason),
    edit: owner.matched && edit.allowed ? '' : (owner.matched ? edit.reason : owner.reason),
  }
}

function yardContextMatches(animal: AnimalRecord, yard: YardRecord | null): boolean {
  return !yard || animal.yardId === yard.yardId
}

function animalYardOwnerMatches(record: AnimalRecord, yard: YardRecord | null, actor: TrustedActor | null, policy: ResourcePolicy | null): { matched: boolean; reason: string } {
  if (!actor || !policy) return { matched: false, reason: 'POLICY_MISSING' }
  if (!yardContextMatches(record, yard)) return { matched: false, reason: 'CROSS_YARD_RELATION' }

  // An explicit child owner relation takes precedence.  A parent yard owner
  // may be used only when the animal record has not supplied a child owner.
  if (record.yardOwnerIds.length) {
    const matched = (policy.yardOwnerRoles || []).some(role => actor.roles.includes(role))
      && relationMatches(actor.id, record.yardOwnerIds)
    if (!matched) return { matched: false, reason: 'YARD_OWNER_RELATION_REQUIRED' }
    if (yard) {
      const parentOwner = yardOwnerMatches(yard, actor, { ...policy, ownerRoles: policy.yardOwnerRoles || [] })
      if (!parentOwner.matched) return { matched: false, reason: 'CROSS_YARD_RELATION' }
    }
    return { matched: true, reason: '' }
  }

  if (!yard) return { matched: false, reason: 'YARD_CONTEXT_REQUIRED' }
  const parentOwner = yardOwnerMatches(yard, actor, { ...policy, ownerRoles: policy.yardOwnerRoles || [] })
  return parentOwner.matched
    ? { matched: true, reason: '' }
    : { matched: false, reason: 'YARD_OWNER_RELATION_REQUIRED' }
}

function animalManagerMatches(record: AnimalRecord, actor: TrustedActor | null, policy: ResourcePolicy | null): { matched: boolean; reason: string } {
  if (!actor || !policy) return { matched: false, reason: 'POLICY_MISSING' }
  const matched = (policy.managerRoles || []).some(role => actor.roles.includes(role))
    && relationMatches(actor.id, record.managerIds)
  return matched
    ? { matched: true, reason: '' }
    : { matched: false, reason: 'ANIMAL_MANAGER_RELATION_REQUIRED' }
}

function animalDecisions(record: AnimalRecord, yard: YardRecord | null, actor: TrustedActor | null, policy: ResourcePolicy | null): Decision {
  if (!policy) return { readPublic: 'POLICY_MISSING', managementRead: 'POLICY_MISSING', edit: 'POLICY_MISSING' }
  const read = stateAllowed(record, policy.readStates, 'animal')
  const manage = stateAllowed(record, policy.manageStates, 'animal')
  const edit = stateAllowed(record, policy.editStates, 'animal')
  const yardOwner = animalYardOwnerMatches(record, yard, actor, policy)
  const manager = animalManagerMatches(record, actor, policy)
  const canManage = yardOwner.matched || manager.matched
  const relationshipReason = yardOwner.reason === 'CROSS_YARD_RELATION'
    ? yardOwner.reason
    : canManage ? '' : (manager.reason || yardOwner.reason)
  return {
    readPublic: read.allowed && record.visibility === 'public' ? '' : (read.allowed ? 'PRIVATE_VISIBILITY' : read.reason),
    managementRead: canManage && manage.allowed ? '' : (canManage ? manage.reason : relationshipReason),
    edit: canManage && edit.allowed ? '' : (canManage ? edit.reason : relationshipReason),
  }
}

function freezeDeep<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value
  seen.add(value)
  if (Array.isArray(value)) {
    for (const item of value) freezeDeep(item, seen)
  } else if (isPlainRecord(value)) {
    for (const key of Object.keys(value)) freezeDeep(value[key], seen)
  }
  Object.freeze(value)
  return value
}

interface CapabilityResultArgs {
  actor: TrustedActor | null
  records: Partial<ManagementSource['records']>
  locator: QueryLocators
  decisions: Partial<Record<ResourceType, Decision | null>>
  error?: unknown
  cancelled?: boolean
}

function capabilityResult({ actor, records, locator, decisions, error = null, cancelled = false }: CapabilityResultArgs): CapabilityResult {
  const capabilities: Record<string, boolean> = Object.create(null)
  const reasons: Record<string, string> = Object.create(null)
  for (const capability of CAPABILITY_LIST) {
    const definition = CAPABILITY_DEFINITIONS[capability]
    const decision = decisions[definition.resource]
    let reason = 'MISSING_OBJECT'
    const candidateReason = decision ? decision[definition.action] : undefined
    if (typeof candidateReason === 'string') {
      reason = candidateReason
    }
    capabilities[capability] = reason === ''
    reasons[capability] = reason
  }
  return freezeDeep({
    actor: actor ? { id: actor.id, roles: actor.roles.slice() } : null,
    locator: { ...locator },
    records: {
      profile: records.profile ? { userId: records.profile.userId } : null,
      yard: records.yard ? { yardId: records.yard.yardId } : null,
      animal: records.animal ? { animalId: records.animal.animalId, yardId: records.animal.yardId } : null,
    },
    capabilities,
    reasons,
    permissions: {
      profile: { readPublic: capabilities[MANAGEMENT_CAPABILITIES.PROFILE_READ_PUBLIC], readPrivate: capabilities[MANAGEMENT_CAPABILITIES.PROFILE_READ_PRIVATE], edit: capabilities[MANAGEMENT_CAPABILITIES.PROFILE_EDIT] },
      yard: { readPublic: capabilities[MANAGEMENT_CAPABILITIES.YARD_READ_PUBLIC], managementRead: capabilities[MANAGEMENT_CAPABILITIES.YARD_MANAGEMENT_READ_PRIVATE], edit: capabilities[MANAGEMENT_CAPABILITIES.YARD_EDIT] },
      animal: { readPublic: capabilities[MANAGEMENT_CAPABILITIES.ANIMAL_READ_PUBLIC], managementRead: capabilities[MANAGEMENT_CAPABILITIES.ANIMAL_MANAGEMENT_READ_PRIVATE], edit: capabilities[MANAGEMENT_CAPABILITIES.ANIMAL_EDIT] },
    },
    readOnly: true,
    canWrite: false,
    cancelled,
    error: error ? { code: errorCode(error, 'MANAGEMENT_CONTRACT_FAILED'), message: errorMessage(error, 'Management capability evaluation failed') } : null,
  })
}

function errorCode(error: unknown, fallback: string): string {
  if (error !== null && typeof error === 'object' && 'code' in error && typeof error.code === 'string') return error.code
  return fallback
}

function errorMessage(error: unknown, fallback: string): string {
  if (error !== null && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return fallback
}

function denied(error: unknown, cancelled = false): CapabilityResult {
  return capabilityResult({ actor: null, records: {}, locator: {}, decisions: {}, error, cancelled })
}

function normalizeSource(context: unknown): ManagementSource {
  if (!isPlainRecord(context)) fail('INVALID_CONTEXT', 'management context must be a plain object')
  rejectDangerousKeys(context, 'management context')
  for (const key of Object.keys(context)) {
    if (!TOP_LEVEL_KEYS.has(key)) fail('UNKNOWN_FIELD', `Unknown management context field: ${key}`, { key })
  }
  const query = normalizeQuery(context.query)
  const objectType = context.resourceType
  if (own(context, 'resourceType') && (typeof objectType !== 'string' || !includesValue(MANAGEMENT_RESOURCE_TYPES, objectType))) {
    fail('INVALID_RESOURCE_TYPE', 'resourceType is not supported', { resourceType: objectType })
  }
  let profile: unknown = context.profile
  let yard: unknown = context.yard
  let animal: unknown = context.animal
  if (context.object !== undefined) {
    if (typeof objectType !== 'string' || !includesValue(MANAGEMENT_RESOURCE_TYPES, objectType)) fail('RESOURCE_TYPE_REQUIRED', 'resourceType is required with object')
    if (context[objectType] !== undefined) fail('DUPLICATE_OBJECT', `Both object and ${objectType} were supplied`, { objectType })
    if (objectType === 'profile') profile = context.object
    if (objectType === 'yard') yard = context.object
    if (objectType === 'animal') animal = context.object
  }
  const records = {
    profile: profile === undefined || profile === null ? null : normalizeProfile(profile),
    yard: yard === undefined || yard === null ? null : normalizeYard(yard),
    animal: animal === undefined || animal === null ? null : normalizeAnimal(animal),
  }
  const locator = normalizeLocator(context, query)
  if (locator.userId && records.profile && locator.userId !== records.profile.userId) fail('LOCATOR_MISMATCH', 'userId does not match profile.userId')
  if (locator.yardId && records.yard && locator.yardId !== records.yard.yardId) fail('LOCATOR_MISMATCH', 'yardId does not match yard.yardId')
  if (locator.animalId && records.animal && locator.animalId !== records.animal.animalId) fail('LOCATOR_MISMATCH', 'animalId does not match animal.animalId')
  if (records.yard && records.animal && records.yard.yardId !== records.animal.yardId) fail('CROSS_YARD_RELATION', 'animal.yardId does not match yard.yardId')
  return { records, locator, query }
}

/**
 * Evaluate public/private-read and edit capability flags from fresh inputs.
 * This function never invokes a writer and never mutates an input record.
 */
function evaluateManagementCapabilities(context: unknown = {}): CapabilityResult {
  let source: ManagementSource
  try {
    source = normalizeSource(context)
    const contextRecord = isPlainRecord(context) ? context : {}
    if (own(contextRecord, 'cancelled') && typeof contextRecord.cancelled !== 'boolean') {
      fail('INVALID_CANCELLED', 'cancelled must be boolean')
    }
    const actor = resolveTrustedActor(contextRecord.actorProvider)
    const policy = normalizePolicy(contextRecord.policy)
    const cancelled = contextRecord.cancelled === true || contextRecord.intent === 'cancel'
    if (cancelled) return capabilityResult({ actor, records: source.records, locator: source.locator, decisions: {}, cancelled: true })
    const decisions: Record<ResourceType, Decision | null> = {
      profile: source.records.profile ? profileDecisions(source.records.profile, actor, policy && policy.profile) : null,
      yard: source.records.yard ? yardDecisions(source.records.yard, actor, policy && policy.yard) : null,
      animal: source.records.animal ? animalDecisions(source.records.animal, source.records.yard, actor, policy && policy.animal) : null,
    }
    return capabilityResult({ actor, records: source.records, locator: source.locator, decisions })
  } catch (error) {
    const contextRecord = isPlainRecord(context) ? context : {}
    return denied(error, contextRecord.cancelled === true || contextRecord.intent === 'cancel')
  }
}

const readManagementCapabilities = evaluateManagementCapabilities
const resolveManagementAccess = evaluateManagementCapabilities
const getManagementCapabilities = evaluateManagementCapabilities

function isManagementCapability(value: unknown): value is ManagementCapability {
  return typeof value === 'string' && includesValue(CAPABILITY_LIST, value)
}

function canManagementCapability(capability: unknown, context: unknown = {}): boolean {
  if (!isManagementCapability(capability)) return false
  return evaluateManagementCapabilities(context).capabilities[capability] === true
}

function assertManagementCapability(capability: unknown, context: unknown = {}): JsonRecord {
  if (!isManagementCapability(capability)) fail('UNKNOWN_CAPABILITY', `Unknown management capability: ${String(capability)}`, { capability })
  const result = evaluateManagementCapabilities(context)
  if (!result.capabilities[capability]) {
    fail('CAPABILITY_DENIED', `Management capability denied: ${capability}`, {
      capability,
      reason: result.reasons[capability],
    })
  }
  const actorId = result.actor && result.actor.id
  return freezeDeep({ capability, actorId, readOnly: true, canWrite: false })
}

function createManagementEvaluator({ actorProvider, policy }: ManagementEvaluatorOptions = {}) {
  const fixedPolicy = normalizePolicy(policy)
  return Object.freeze({
    getActor: () => resolveTrustedActor(actorProvider),
    evaluate: (context: unknown = {}) => evaluateManagementCapabilities({ ...(isPlainRecord(context) ? context : {}), actorProvider, policy: fixedPolicy }),
    can: (capability: unknown, context: unknown = {}) => canManagementCapability(capability, { ...(isPlainRecord(context) ? context : {}), actorProvider, policy: fixedPolicy }),
    assert: (capability: unknown, context: unknown = {}) => assertManagementCapability(capability, { ...(isPlainRecord(context) ? context : {}), actorProvider, policy: fixedPolicy }),
  })
}

export {
  MANAGEMENT_RESOURCE_TYPES,
  MANAGEMENT_CAPABILITIES,
  MANAGEMENT_CAPABILITY_NAMES,
  CAPABILITY_LIST,
  CAPABILITY_DEFINITIONS,
  ManagementContractError,
  normalizePolicy,
  evaluateManagementCapabilities,
  readManagementCapabilities,
  resolveManagementAccess,
  getManagementCapabilities,
  canManagementCapability,
  assertManagementCapability,
  createManagementEvaluator,
}
