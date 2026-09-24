/**
 * Pure read contract for the adoption review queue and review detail.
 *
 * The adapter supplies already read adoption records (or a resolver).  This
 * module deliberately has no Vue, uni-app, page, storage, mock, network, or
 * write dependency.  Application lifecycle (`status`) and review decision
 * (`review.status`) are separate axes.  A navigation query can select an
 * item to look up, but it cannot provide an actor, role, relationship, or
 * state.
 */

import { resolveTrustedActor } from './actorCapabilities.ts'
import { evaluateCloudParentCondition } from './adoptionConditionContract.ts'

type JsonRecord = Record<string, unknown>
type ApplicationStatus =
  | 'cloud_pending'
  | 'cloud_rejected'
  | 'pending'
  | 'rejected'
  | 'pickup'
  | 'owner_confirm'
  | 'owner_confirm_pending'
  | 'jury_confirm'
  | 'jury_confirm_pending'
  | 'adoption_confirmed'
  | 'reward'
  | 'reward_done'
  | 'abandoned'
type ReviewPhase = 'cloud_parent' | 'owner' | 'owner_confirmation' | 'jury'
type ReviewStatus = 'pending' | 'approved' | 'rejected'
type ReviewRole = 'owner' | 'cloud_parent' | 'reviewer'
type ReviewBucket = 'pending' | 'processed'
type ReviewFilter = 'all' | ReviewBucket | ReviewStatus

interface TrustedActor {
  id: string
  roles: readonly string[]
}

interface ErrorInfo {
  code: string
  [key: string]: unknown
}

interface CloudParentReview {
  id: string
  state: string
}

interface CloudParentCondition {
  count: number
  required: boolean
  decision: string
  canProceed: boolean
  decisionRequired: boolean
  reason: string
  reviews: readonly CloudParentReview[]
  selection?: string
}

interface ReviewItem extends JsonRecord {
  applicationId: string
  reviewItemId: string
  applicationType: 'adoption'
  phase: ReviewPhase
  reviewStatus: ReviewStatus
  bucket: ReviewBucket
  applicationStatus: ApplicationStatus
  reviewerRole?: ReviewRole
  reviewerId?: string
  applicantId?: string
  ownerId?: string
  cloudParentIds: readonly string[]
  cloudParent: CloudParentCondition
  perspective?: 'applicant'
  readOnly: true
  canWrite: false
}

interface ReviewListModel {
  actor: TrustedActor | null
  items: readonly ReviewItem[]
  pending: readonly ReviewItem[]
  processed: readonly ReviewItem[]
  canWrite: false
  readOnly: true
  diagnostics: {
    scanned: number
    accepted: number
    skipped: readonly JsonRecord[]
    actorError: ErrorInfo | null
  }
}

interface ReviewDetailResult {
  actor: TrustedActor | null
  item: ReviewItem | null
  canRead: boolean
  canWrite: false
  readOnly: true
  reason: string
  diagnostics: { actorError: ErrorInfo | null }
}

interface ReviewRecordOptions {
  expectedApplicationId?: string
  expectedReviewItemId?: string
  cloudParentPolicy?: unknown
}

interface ReviewListArgs {
  actorProvider?: () => unknown
  records?: unknown[]
  resolver?: SourceResolver
  filter?: ReviewFilter
  query?: unknown
  cloudParentPolicy?: unknown
}

interface ReviewDetailArgs {
  actorProvider?: () => unknown
  record?: unknown
  resolver?: SourceResolver
  applicationId?: unknown
  reviewItemId?: unknown
  perspective?: unknown
  query?: unknown
  cloudParentPolicy?: unknown
}

interface ActorState {
  actor: TrustedActor | null
  error: ErrorInfo | null
}

interface SourceResult {
  records: unknown[]
  error: ErrorInfo | null
}

interface ResolverContext {
  actor: TrustedActor
  applicationId?: string
  reviewItemId?: string
}

type SourceResolver = (context: Readonly<ResolverContext>) => unknown

interface ThenableWithCatch {
  then: (...args: unknown[]) => unknown
  catch?: (...args: unknown[]) => unknown
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

// This is the lifecycle vocabulary in utils/adoptionStorage.ts.  It is not a
// second state machine; transitions remain owned by ADOPTION_TRANSITIONS.
export const ADOPTION_APPLICATION_STATUSES: readonly ApplicationStatus[] =
  freezeList<ApplicationStatus>(
    'cloud_pending',
    'cloud_rejected',
    'pending',
    'rejected',
    'pickup',
    'owner_confirm',
    'owner_confirm_pending',
    'jury_confirm',
    'jury_confirm_pending',
    'adoption_confirmed',
    'reward',
    'reward_done',
    'abandoned',
  )

export const ADOPTION_REVIEW_PHASES: readonly ReviewPhase[] = freezeList<ReviewPhase>(
  'cloud_parent',
  'owner',
  'owner_confirmation',
  'jury',
)

export const ADOPTION_REVIEW_STATUSES: readonly ReviewStatus[] = freezeList<ReviewStatus>(
  'pending',
  'approved',
  'rejected',
)

export const ADOPTION_REVIEW_STATUS_BUCKETS: Readonly<Record<ReviewStatus, ReviewBucket>> =
  Object.freeze({
    pending: 'pending',
    approved: 'processed',
    rejected: 'processed',
  })

export const ADOPTION_REVIEW_LIST_FILTERS: readonly ReviewFilter[] = freezeList<ReviewFilter>(
  'all',
  'pending',
  'processed',
  'approved',
  'rejected',
)

const REVIEW_ROLES: readonly ReviewRole[] = freezeList<ReviewRole>(
  'owner',
  'cloud_parent',
  'reviewer',
)
const ACTOR_REVIEW_ROLES: readonly string[] = freezeList(
  'applicant',
  'owner',
  'yard_owner',
  'cloud_parent',
  'reviewer',
)

const PHASE_ROLE: Readonly<Record<ReviewPhase, ReviewRole>> = Object.freeze({
  cloud_parent: 'cloud_parent',
  owner: 'owner',
  owner_confirmation: 'owner',
  jury: 'reviewer',
})

const PHASE_APPLICATION_STATES: Readonly<
  Record<ReviewPhase, Readonly<Record<ReviewStatus, readonly ApplicationStatus[]>>>
> = Object.freeze({
  cloud_parent: Object.freeze({
    pending: freezeList<ApplicationStatus>('cloud_pending'),
    approved: freezeList<ApplicationStatus>('pending'),
    // `cloud_rejected` is a legacy terminal spelling retained by
    // adoptionStorage; it still belongs to the cloud-parent rejection axis.
    rejected: freezeList<ApplicationStatus>('rejected', 'cloud_rejected'),
  }),
  owner: Object.freeze({
    pending: freezeList<ApplicationStatus>('pending'),
    approved: freezeList<ApplicationStatus>('pickup'),
    rejected: freezeList<ApplicationStatus>('rejected'),
  }),
  owner_confirmation: Object.freeze({
    pending: freezeList<ApplicationStatus>('owner_confirm', 'owner_confirm_pending'),
    // Owner confirmation hands the application to jury review.  It may not
    // claim adoption_confirmed directly.
    approved: freezeList<ApplicationStatus>('jury_confirm', 'jury_confirm_pending'),
    rejected: freezeList<ApplicationStatus>('rejected'),
  }),
  jury: Object.freeze({
    pending: freezeList<ApplicationStatus>('jury_confirm', 'jury_confirm_pending'),
    approved: freezeList<ApplicationStatus>('adoption_confirmed', 'reward', 'reward_done'),
    rejected: freezeList<ApplicationStatus>('rejected'),
  }),
})

const REJECTED_FAILURE_STAGES: Readonly<Record<ReviewPhase, readonly string[]>> = Object.freeze({
  cloud_parent: Object.freeze(['cloud_parent']),
  owner: Object.freeze(['owner_review']),
  owner_confirmation: Object.freeze(['owner_confirm']),
  jury: Object.freeze(['jury', 'jury_review', 'jury_confirm', 'reviewer']),
})

const CROSS_DOMAIN_PREFIXES: readonly string[] = Object.freeze([
  'rescue',
  'feeding',
  'order',
  'dynamic',
  'yard',
  'animal',
])

export class AdoptionReviewContractError extends Error {
  readonly code: string
  readonly details: JsonRecord

  constructor(code: string, message: string, details: JsonRecord = {}) {
    super(message)
    this.name = 'AdoptionReviewContractError'
    this.code = code
    this.details = details
  }
}

function fail(code: string, message: string, details: JsonRecord = {}): never {
  throw new AdoptionReviewContractError(code, message, details)
}

function errorCode(error: unknown, fallback: string): string {
  if (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code
  }
  return fallback
}

function own(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function isPlainRecord(value: unknown): value is JsonRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  if (prototype === Object.prototype || prototype === null) return true
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

function opaqueId(
  value: unknown,
  label: string,
  { required = true }: { required?: boolean } = {},
): string {
  if (typeof value !== 'string' || !value.trim()) {
    if (!required) return ''
    fail('MISSING_ID', `${label} is required`, { label })
  }
  const id = value.trim()
  const lower = id.toLowerCase()
  if (value !== id || !SAFE_ID.test(id) || URL_MARKERS.test(id)) {
    fail('INVALID_ID', `${label} must be an opaque ID`, { label })
  }
  for (const prefix of CROSS_DOMAIN_PREFIXES) {
    if (
      lower === prefix ||
      lower.startsWith(`${prefix}-`) ||
      lower.startsWith(`${prefix}_`) ||
      lower.startsWith(`${prefix}:`)
    ) {
      fail('CROSS_DOMAIN_ID', `${label} looks like a ${prefix} domain ID`, { label, prefix })
    }
  }
  return id
}

function assertAdoptionDomain(record: JsonRecord, review: JsonRecord | null): void {
  const domains: Array<{ field: string; value: unknown }> = []
  for (const field of ['applicationType', 'businessType']) {
    if (own(record, field)) domains.push({ field, value: record[field] })
  }
  if (review) {
    for (const field of ['applicationType', 'businessType']) {
      if (own(review, field)) domains.push({ field: `review.${field}`, value: review[field] })
    }
  }
  if (!domains.length)
    fail('MISSING_DOMAIN', 'Adoption review record needs applicationType or businessType')
  if (domains.some((item) => item.value !== 'adoption')) {
    fail('CROSS_DOMAIN_RECORD', 'Adoption review record has a non-adoption domain', { domains })
  }
}

function aliasId(
  record: JsonRecord,
  review: JsonRecord | null,
  names: readonly string[],
  label: string,
  required = true,
): string {
  const values: string[] = []
  const sources: Array<{ source: JsonRecord | null; prefix: string }> = [
    { source: record, prefix: 'record' },
    { source: review, prefix: 'review' },
  ]
  for (const { source, prefix } of sources) {
    if (!source) continue
    for (const name of names) {
      if (!own(source, name)) continue
      values.push(opaqueId(source[name], `${prefix}.${name}`, { required }))
    }
  }
  const unique = [...new Set(values)]
  if (unique.length > 1)
    fail(`CONFLICTING_${label.toUpperCase()}`, `${label} aliases disagree`, { values: unique })
  if (!unique.length && required) fail(`MISSING_${label.toUpperCase()}`, `${label} is required`)
  return unique[0] || ''
}

function idList(
  record: JsonRecord,
  review: JsonRecord | null,
  names: readonly string[],
  label: string,
): string[] {
  const values: string[] = []
  const sourceSets: string[][] = []
  const sources: Array<{ source: JsonRecord | null; prefix: string }> = [
    { source: record, prefix: 'record' },
    { source: review, prefix: 'review' },
  ]
  for (const { source, prefix } of sources) {
    if (!source) continue
    for (const name of names) {
      if (!own(source, name)) continue
      if (!Array.isArray(source[name]))
        fail('INVALID_RELATION', `${prefix}.${name} must be an array`, { label })
      const current: string[] = []
      for (const item of source[name]) current.push(opaqueId(item, `${prefix}.${name}`))
      sourceSets.push(current)
      values.push(...current)
    }
  }
  const canonicalSets = sourceSets.map((items) => [...new Set(items)].sort().join('\u0000'))
  if (new Set(canonicalSets).size > 1)
    fail(`CONFLICTING_${label.toUpperCase()}`, `${label} list aliases disagree`, {
      sets: canonicalSets,
    })
  return [...new Set(values)]
}

function relationIds(
  record: JsonRecord,
  arrayNames: readonly string[],
  scalarNames: readonly string[],
  label: string,
): string[] {
  const list = idList(record, null, arrayNames, label)
  const scalarValues = []
  for (const name of scalarNames) {
    if (own(record, name)) scalarValues.push(opaqueId(record[name], `record.${name}`))
  }
  if (new Set(scalarValues).size > 1) {
    fail(`CONFLICTING_${label.toUpperCase()}`, `${label} aliases disagree`, {
      values: scalarValues,
    })
  }
  if (scalarValues.some((id) => list.length > 0 && !list.includes(id))) {
    fail(`CONFLICTING_${label.toUpperCase()}`, `${label} aliases disagree`, {
      values: [...new Set([...list, ...scalarValues])],
    })
  }
  return [...new Set([...list, ...scalarValues])]
}

function actorRelation(
  record: JsonRecord,
  review: JsonRecord | null,
  role: ReviewRole | 'applicant',
  actorId: string,
): boolean {
  if (role === 'applicant') {
    return relationIds(
      record,
      ['applicantIds'],
      ['applicantId', 'applicantUserId'],
      'applicant',
    ).includes(actorId)
  }
  if (role === 'owner') {
    return relationIds(
      record,
      ['ownerIds'],
      ['ownerId', 'ownerPawId', 'ownerUserId', 'yardOwnerId'],
      'owner',
    ).includes(actorId)
  }
  if (role === 'cloud_parent') {
    return relationIds(
      record,
      ['cloudParentIds'],
      ['cloudParentId', 'cloudParentPawId', 'cloudOwnerId'],
      'cloud_parent',
    ).includes(actorId)
  }
  if (role === 'reviewer') {
    return reviewerRelationIds(record, review).includes(actorId)
  }
  return false
}

function reviewerRelationIds(record: JsonRecord, review: JsonRecord | null): string[] {
  const sets: string[][] = []
  const sources: Array<{ source: JsonRecord | null; prefix: string }> = [
    { source: record, prefix: 'record' },
    { source: review, prefix: 'review' },
  ]
  for (const { source, prefix } of sources) {
    if (!source) continue
    if (
      own(source, 'reviewerId') &&
      source.reviewerId !== undefined &&
      source.reviewerId !== null
    ) {
      sets.push([opaqueId(source.reviewerId, `${prefix}.reviewerId`)].sort())
    }
    if (
      own(source, 'reviewerIds') &&
      source.reviewerIds !== undefined &&
      source.reviewerIds !== null
    ) {
      if (!Array.isArray(source.reviewerIds))
        fail('INVALID_RELATION', `${prefix}.reviewerIds must be an array`)
      sets.push(
        [...new Set(source.reviewerIds.map((id) => opaqueId(id, `${prefix}.reviewerIds`)))].sort(),
      )
    }
  }
  if (!sets.length) return []
  const expected = sets[0].join('\u0000')
  if (sets.some((set) => set.join('\u0000') !== expected)) {
    fail('CONFLICTING_REVIEWER_ID', 'reviewerId and reviewerIds aliases disagree', { sets })
  }
  return sets[0].slice()
}

function normalizeReviewStatus(record: JsonRecord, review: JsonRecord): ReviewStatus {
  const values: string[] = []
  const sources: Array<{ source: JsonRecord; field: string }> = [
    { source: review, field: 'status' },
    { source: review, field: 'reviewStatus' },
    { source: record, field: 'reviewStatus' },
  ]
  for (const { source, field } of sources) {
    if (!source || !own(source, field)) continue
    if (typeof source[field] !== 'string' || !source[field].trim())
      fail('INVALID_REVIEW_STATUS', 'Review status must be a non-empty string')
    values.push(source[field].trim())
  }
  const unique = [...new Set(values)]
  if (unique.length > 1)
    fail('CONFLICTING_REVIEW_STATUS', 'Review status aliases disagree', { values: unique })
  const status = unique[0] || ''
  if (!includesValue(ADOPTION_REVIEW_STATUSES, status)) {
    fail(
      status ? 'INVALID_REVIEW_STATUS' : 'MISSING_REVIEW_STATUS',
      'Review status is not in the whitelist',
      { status },
    )
  }
  return status
}

function normalizeApplicationStatus(record: JsonRecord): ApplicationStatus {
  const values: string[] = []
  for (const field of ['status', 'applicationStatus']) {
    if (!own(record, field)) continue
    if (typeof record[field] !== 'string' || !record[field].trim()) {
      fail('INVALID_APPLICATION_STATUS', `record.${field} must be a non-empty string`)
    }
    values.push(record[field].trim())
  }
  const unique = [...new Set(values)]
  if (unique.length > 1) {
    fail('CONFLICTING_APPLICATION_STATUS', 'Application status aliases disagree', {
      values: unique,
    })
  }
  const status = unique[0] || ''
  if (!status) fail('MISSING_APPLICATION_STATUS', 'Application status is required')
  if (!includesValue(ADOPTION_APPLICATION_STATUSES, status)) {
    fail('INVALID_APPLICATION_STATUS', 'Application status is not in the adoption whitelist', {
      status,
    })
  }
  return status
}

function normalizePhase(review: JsonRecord): ReviewPhase {
  if (
    !own(review, 'phase') ||
    typeof review.phase !== 'string' ||
    !includesValue(ADOPTION_REVIEW_PHASES, review.phase)
  ) {
    fail('INVALID_REVIEW_PHASE', 'Review phase must be explicit', { phase: review.phase })
  }
  return review.phase
}

function actorCanReviewRole(actor: TrustedActor, reviewerRole: ReviewRole): boolean {
  if (reviewerRole === 'owner')
    return actor.roles.includes('owner') || actor.roles.includes('yard_owner')
  return actor.roles.includes(reviewerRole)
}

function assertStageConsistency(
  phase: ReviewPhase,
  reviewStatus: ReviewStatus,
  applicationStatus: ApplicationStatus,
  record: JsonRecord,
): void {
  const allowed = PHASE_APPLICATION_STATES[phase][reviewStatus] || []
  if (!allowed.includes(applicationStatus)) {
    fail('INCONSISTENT_REVIEW_STAGE', 'Review status and application stage disagree', {
      phase,
      reviewStatus,
      applicationStatus,
    })
  }
  if (reviewStatus === 'rejected') {
    const failureStage = typeof record.failureStage === 'string' ? record.failureStage.trim() : ''
    const accepted = REJECTED_FAILURE_STAGES[phase] || []
    if (!accepted.includes(failureStage)) {
      fail('REJECTED_STAGE_REQUIRED', 'A rejected review needs its explicit failure stage', {
        phase,
        failureStage,
      })
    }
  }
}

function scalarMeta(record: JsonRecord): JsonRecord {
  const result: JsonRecord = {}
  for (const field of [
    'summary',
    'description',
    'yardId',
    'yardName',
    'animalId',
    'createdAt',
    'updatedAt',
  ]) {
    if (!own(record, field) || record[field] === null || record[field] === undefined) continue
    const value = record[field]
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      fail('INVALID_METADATA', `record.${field} must be a scalar`, { field })
    }
    if (typeof value === 'number' && !Number.isFinite(value))
      fail('INVALID_METADATA', `record.${field} must be finite`, { field })
    result[field] = value
  }
  return result
}

function freezeSnapshot<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value
  seen.add(value)
  if (Array.isArray(value)) {
    for (const item of value) freezeSnapshot(item, seen)
  } else if (isPlainRecord(value)) {
    for (const key of Object.keys(value)) freezeSnapshot(value[key], seen)
  }
  Object.freeze(value)
  return value
}

function readCloudParent(record: JsonRecord, cloudParentPolicy: unknown): CloudParentCondition {
  try {
    const condition = evaluateCloudParentCondition({ record, policy: cloudParentPolicy })
    return condition
  } catch (error) {
    fail(errorCode(error, 'INVALID_CLOUD_PARENT_CONDITION'), 'Cloud-parent condition is invalid')
  }
}

function normalizeReviewRecord(
  record: unknown,
  actor: TrustedActor,
  {
    expectedApplicationId = '',
    expectedReviewItemId = '',
    cloudParentPolicy,
  }: ReviewRecordOptions = {},
): ReviewItem {
  assertRecord(record, 'adoption review record')
  const review = own(record, 'review') ? record.review : null
  if (!review || !isPlainRecord(review))
    fail('MISSING_REVIEW_OBJECT', 'Review metadata must be an object')
  rejectDangerousKeys(review, 'review metadata')
  assertAdoptionDomain(record, review)
  const applicationId = aliasId(record, review, ['applicationId'], 'application_id')
  const reviewItemId = aliasId(record, review, ['reviewItemId'], 'review_item_id')
  if (expectedApplicationId && applicationId !== expectedApplicationId)
    fail('APPLICATION_ID_MISMATCH', 'Resolved application does not match requested applicationId')
  if (expectedReviewItemId && reviewItemId !== expectedReviewItemId)
    fail('REVIEW_ITEM_ID_MISMATCH', 'Resolved review item does not match requested reviewItemId')

  const applicationStatus = normalizeApplicationStatus(record)
  const phase = normalizePhase(review)
  const reviewerRole = own(review, 'reviewerRole') ? review.reviewerRole : ''
  if (typeof reviewerRole !== 'string' || !includesValue(REVIEW_ROLES, reviewerRole))
    fail('INVALID_REVIEW_ROLE', 'Review role must be owner, cloud_parent, or reviewer', {
      reviewerRole,
    })
  if (PHASE_ROLE[phase] !== reviewerRole)
    fail('REVIEW_ROLE_PHASE_MISMATCH', 'Review role does not match review phase', {
      phase,
      reviewerRole,
    })
  const reviewStatus = normalizeReviewStatus(record, review)
  assertStageConsistency(phase, reviewStatus, applicationStatus, record)

  const reviewerIds = reviewerRelationIds(record, review)
  if (reviewerIds.length === 0)
    fail('MISSING_REVIEWER_ID', 'Review metadata needs reviewerId or reviewerIds')
  const reviewerId = reviewerIds.length === 1 ? reviewerIds[0] : ''
  if (!reviewerId && reviewerRole !== 'reviewer')
    fail('MISSING_REVIEWER_ID', 'Owner and cloud-parent reviews need reviewerId')
  if (!actorCanReviewRole(actor, reviewerRole)) {
    fail('ACTOR_ROLE_REQUIRED', 'Trusted actor cannot perform this review perspective', {
      reviewerRole,
    })
  }
  if (!reviewerIds.includes(actor.id) || !actorRelation(record, review, reviewerRole, actor.id)) {
    fail('ACTOR_MISMATCH', 'Review item does not belong to the trusted reviewer')
  }

  const applicantId = aliasId(
    record,
    null,
    ['applicantId', 'applicantUserId'],
    'applicant_id',
    false,
  )
  const ownerId = aliasId(
    record,
    null,
    ['ownerId', 'ownerPawId', 'ownerUserId', 'yardOwnerId'],
    'owner_id',
    false,
  )
  const uniqueCloudParentIds = relationIds(
    record,
    ['cloudParentIds'],
    ['cloudParentId', 'cloudParentPawId', 'cloudOwnerId'],
    'cloud_parent',
  )
  const cloudParent = freezeSnapshot(readCloudParent(record, cloudParentPolicy))
  const result: ReviewItem = {
    applicationId,
    reviewItemId,
    applicationType: 'adoption',
    phase,
    reviewerRole,
    reviewerId: actor.id,
    reviewStatus,
    bucket: ADOPTION_REVIEW_STATUS_BUCKETS[reviewStatus],
    applicationStatus,
    applicantId,
    ownerId,
    cloudParentIds: Object.freeze(uniqueCloudParentIds),
    cloudParent,
    readOnly: true,
    canWrite: false,
    ...scalarMeta(record),
  }
  return Object.freeze(result)
}

function normalizeApplicantDetail(
  record: unknown,
  actor: TrustedActor,
  {
    expectedApplicationId = '',
    expectedReviewItemId = '',
    cloudParentPolicy,
  }: ReviewRecordOptions = {},
): ReviewItem {
  assertRecord(record, 'adoption review record')
  const review = own(record, 'review') ? record.review : null
  if (!review || !isPlainRecord(review))
    fail('MISSING_REVIEW_OBJECT', 'Review metadata must be an object')
  rejectDangerousKeys(review, 'review metadata')
  assertAdoptionDomain(record, review)
  const applicationId = aliasId(record, review, ['applicationId'], 'application_id')
  const reviewItemId = aliasId(record, review, ['reviewItemId'], 'review_item_id')
  if (expectedApplicationId && applicationId !== expectedApplicationId)
    fail('APPLICATION_ID_MISMATCH', 'Resolved application does not match requested applicationId')
  if (expectedReviewItemId && reviewItemId !== expectedReviewItemId)
    fail('REVIEW_ITEM_ID_MISMATCH', 'Resolved review item does not match requested reviewItemId')
  const applicationStatus = normalizeApplicationStatus(record)
  const phase = normalizePhase(review)
  const reviewStatus = normalizeReviewStatus(record, review)
  assertStageConsistency(phase, reviewStatus, applicationStatus, record)
  if (!actor.roles.includes('applicant') || !actorRelation(record, review, 'applicant', actor.id))
    fail('ACTOR_MISMATCH', 'Applicant detail is limited to the trusted applicant')
  const applicantId = aliasId(record, null, ['applicantId', 'applicantUserId'], 'applicant_id')
  const cloudParentIds = relationIds(
    record,
    ['cloudParentIds'],
    ['cloudParentId', 'cloudParentPawId', 'cloudOwnerId'],
    'cloud_parent',
  )
  const result: ReviewItem = {
    applicationId,
    reviewItemId,
    applicationType: 'adoption',
    perspective: 'applicant',
    phase,
    reviewStatus,
    bucket: ADOPTION_REVIEW_STATUS_BUCKETS[reviewStatus],
    applicationStatus,
    applicantId,
    cloudParentIds: Object.freeze(cloudParentIds),
    cloudParent: freezeSnapshot(readCloudParent(record, cloudParentPolicy)),
    readOnly: true,
    canWrite: false,
    ...scalarMeta(record),
  }
  return Object.freeze(result)
}

function normalizeActor(value: unknown): TrustedActor | null {
  if (value === null || !isPlainRecord(value)) return null
  if (typeof value.id !== 'string' || !Array.isArray(value.roles)) return null
  const roles: string[] = []
  for (const role of value.roles) {
    if (typeof role !== 'string') return null
    if (!roles.includes(role)) roles.push(role)
  }
  return Object.freeze({ id: value.id, roles: Object.freeze(roles) })
}

function actorState(actorProvider: unknown, roleRequired?: string): ActorState {
  try {
    const actor = normalizeActor(resolveTrustedActor(actorProvider))
    if (!actor) return { actor: null, error: { code: 'NO_ACTOR' } }
    if (!actor.roles.some((role) => includesValue(ACTOR_REVIEW_ROLES, role)))
      return { actor: null, error: { code: 'ACTOR_ROLE_REQUIRED' } }
    if (roleRequired && !actor.roles.includes(roleRequired))
      return { actor: null, error: { code: 'ACTOR_ROLE_REQUIRED' } }
    return { actor, error: null }
  } catch (error) {
    return { actor: null, error: { code: errorCode(error, 'INVALID_ACTOR') } }
  }
}

function emptyList(
  actor: TrustedActor | null,
  error: ErrorInfo | null,
  scanned = 0,
): ReviewListModel {
  return freezeSnapshot({
    actor,
    items: Object.freeze([]),
    pending: Object.freeze([]),
    processed: Object.freeze([]),
    canWrite: false,
    readOnly: true,
    diagnostics: { scanned, accepted: 0, skipped: [], actorError: error || null },
  })
}

function isSourceResolver(value: unknown): value is SourceResolver {
  return typeof value === 'function'
}

function isThenable(value: unknown): value is ThenableWithCatch {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return false
  return 'then' in value && typeof value.then === 'function'
}

interface SourceRecordsArgs {
  records?: unknown[]
  resolver?: SourceResolver
  actor: TrustedActor
  label: string
}

function sourceRecords({ records, resolver, actor, label }: SourceRecordsArgs): SourceResult {
  if (resolver !== undefined) {
    if (!isSourceResolver(resolver))
      fail('INVALID_RESOLVER', `${label} resolver must be a function`)
    let value
    try {
      value = resolver(Object.freeze({ actor }))
    } catch (error) {
      return { records: [], error: { code: errorCode(error, 'RESOLVER_FAILED') } }
    }
    if (isThenable(value)) {
      if (typeof value.catch === 'function') value.catch(() => undefined)
      return { records: [], error: { code: 'ASYNC_RESOLVER_UNSUPPORTED' } }
    }
    if (!Array.isArray(value)) return { records: [], error: { code: 'INVALID_RESOLVER_RESULT' } }
    return { records: value, error: null }
  }
  if (!Array.isArray(records)) fail('RECORDS_REQUIRED', `${label} records must be an array`)
  return { records, error: null }
}

function listItems(
  records: readonly unknown[],
  actor: TrustedActor,
  cloudParentPolicy: unknown,
  skipped: JsonRecord[],
): ReviewItem[] {
  const normalized: ReviewItem[] = []
  records.forEach((record, index) => {
    try {
      normalized.push(normalizeReviewRecord(record, actor, { cloudParentPolicy }))
    } catch (error) {
      skipped.push({ index, code: errorCode(error, 'INVALID_RECORD') })
    }
  })
  const byId = new Map<string, ReviewItem>()
  const conflict = new Set<string>()
  for (const item of normalized) {
    if (conflict.has(item.reviewItemId)) continue
    const old = byId.get(item.reviewItemId)
    if (!old) {
      byId.set(item.reviewItemId, item)
    } else if (JSON.stringify(old) !== JSON.stringify(item)) {
      byId.delete(item.reviewItemId)
      conflict.add(item.reviewItemId)
      skipped.push({ index: -1, code: 'DUPLICATE_CONFLICT', reviewItemId: item.reviewItemId })
    }
  }
  return [...byId.values()]
}

function filterItems(items: readonly ReviewItem[], filter: ReviewFilter): ReviewItem[] {
  if (filter === 'all') return items.slice()
  if (filter === 'pending' || filter === 'processed')
    return items.filter((item) => item.bucket === filter)
  return items.filter((item) => item.reviewStatus === filter)
}

function normalizedFilter(filter: unknown): ReviewFilter {
  const value = filter === undefined || filter === null ? 'all' : filter
  if (typeof value !== 'string' || !includesValue(ADOPTION_REVIEW_LIST_FILTERS, value))
    fail('INVALID_STATUS_FILTER', 'Unsupported adoption review filter', { filter: value })
  return value
}

/** Read the reviewer queue.  Applicant records never enter this queue. */
export function readAdoptionReviewList({
  actorProvider,
  records,
  resolver,
  filter,
  query,
  cloudParentPolicy,
}: ReviewListArgs = {}): ReviewListModel {
  void query
  const state = actorState(actorProvider)
  if (!state.actor) return emptyList(null, state.error)
  const actor = state.actor
  if (!actor.roles.some((role) => includesValue(REVIEW_ROLES, role) || role === 'yard_owner'))
    return emptyList(actor, { code: 'ACTOR_ROLE_REQUIRED' })
  const selected = normalizedFilter(filter)
  const source = sourceRecords({ records, resolver, actor, label: 'adoption review list' })
  if (source.error) return emptyList(actor, source.error, 0)
  const skipped: JsonRecord[] = []
  const all = listItems(source.records, actor, cloudParentPolicy, skipped)
  const items = Object.freeze(filterItems(all, selected).slice())
  const pending = Object.freeze(items.filter((item) => item.bucket === 'pending'))
  const processed = Object.freeze(items.filter((item) => item.bucket === 'processed'))
  return freezeSnapshot({
    actor,
    items,
    pending,
    processed,
    canWrite: false,
    readOnly: true,
    diagnostics: {
      scanned: source.records.length,
      accepted: items.length,
      skipped,
      actorError: null,
    },
  })
}

export const getAdoptionReviewList = readAdoptionReviewList

/** Read one review item, or an applicant's own review detail. */
export function readAdoptionReviewDetail({
  actorProvider,
  record,
  resolver,
  applicationId,
  reviewItemId,
  perspective,
  query,
  cloudParentPolicy,
}: ReviewDetailArgs = {}): ReviewDetailResult {
  void query
  const state = actorState(actorProvider)
  if (!state.actor) {
    const actorError = state.error || { code: 'INVALID_ACTOR' }
    return freezeSnapshot({
      actor: null,
      item: null,
      canRead: false,
      canWrite: false,
      readOnly: true,
      reason: actorError.code,
      diagnostics: { actorError },
    })
  }
  const actor = state.actor
  let expectedApplicationId: string
  let expectedReviewItemId: string
  try {
    expectedApplicationId =
      applicationId === undefined ? '' : opaqueId(applicationId, 'applicationId')
    expectedReviewItemId = opaqueId(reviewItemId, 'reviewItemId')
  } catch (error) {
    const code = errorCode(error, 'INVALID_ID')
    return freezeSnapshot({
      actor,
      item: null,
      canRead: false,
      canWrite: false,
      readOnly: true,
      reason: code,
      diagnostics: {
        actorError: {
          code,
          ...(error instanceof AdoptionReviewContractError ? error.details : {}),
        },
      },
    })
  }
  let source: unknown
  if (resolver !== undefined) {
    if (!isSourceResolver(resolver))
      fail('INVALID_RESOLVER', 'adoption review detail resolver must be a function')
    try {
      source = resolver(
        Object.freeze({
          actor,
          applicationId: expectedApplicationId,
          reviewItemId: expectedReviewItemId,
        }),
      )
    } catch (error) {
      const code = errorCode(error, 'RESOLVER_FAILED')
      return freezeSnapshot({
        actor,
        item: null,
        canRead: false,
        canWrite: false,
        readOnly: true,
        reason: code,
        diagnostics: { actorError: { code } },
      })
    }
    if (isThenable(source)) {
      if (typeof source.catch === 'function') source.catch(() => undefined)
      return freezeSnapshot({
        actor,
        item: null,
        canRead: false,
        canWrite: false,
        readOnly: true,
        reason: 'ASYNC_RESOLVER_UNSUPPORTED',
        diagnostics: { actorError: { code: 'ASYNC_RESOLVER_UNSUPPORTED' } },
      })
    }
  } else {
    source = record
  }
  if (!isPlainRecord(source))
    return freezeSnapshot({
      actor,
      item: null,
      canRead: false,
      canWrite: false,
      readOnly: true,
      reason: 'NOT_FOUND',
      diagnostics: { actorError: { code: 'NOT_FOUND' } },
    })
  try {
    const applicantRequested =
      perspective === 'applicant' ||
      (perspective === undefined &&
        actor.roles.includes('applicant') &&
        !actor.roles.some((role) => includesValue(REVIEW_ROLES, role)))
    const item = applicantRequested
      ? normalizeApplicantDetail(source, actor, {
          expectedApplicationId,
          expectedReviewItemId,
          cloudParentPolicy,
        })
      : normalizeReviewRecord(source, actor, {
          expectedApplicationId,
          expectedReviewItemId,
          cloudParentPolicy,
        })
    return freezeSnapshot({
      actor,
      item,
      canRead: true,
      canWrite: false,
      readOnly: true,
      reason: '',
      diagnostics: { actorError: null },
    })
  } catch (error) {
    const code = errorCode(error, 'INVALID_RECORD')
    return freezeSnapshot({
      actor,
      item: null,
      canRead: false,
      canWrite: false,
      readOnly: true,
      reason: code,
      diagnostics: { actorError: { code } },
    })
  }
}

export const getAdoptionReviewDetail = readAdoptionReviewDetail
