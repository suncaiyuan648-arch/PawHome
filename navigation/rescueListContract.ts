/**
 * Pure, read-only contracts for the rescue.mine and rescue.review.list
 * read models.
 *
 * Callers inject already-read records (or a synchronous domain resolver).
 * This module has no runtime dependency on Vue, uni-app, pages, storage,
 * mocks, network, or write services.  A list is never an authorization token: every item is
 * checked against the freshly resolved actor and its authoritative relation
 * fields before it can enter the read model.
 */

import { resolveTrustedActor } from './actorCapabilities.ts'

type JsonRecord = Record<string, unknown>
type MineStatus = 'platform_pending' | 'platform_approved' | 'platform_rejected'
type ReviewStatus = 'pending' | 'approved' | 'rejected'
type RescueListType = 'mine' | 'review'
export type RescueListFilter = 'all' | MineStatus | 'pending' | 'processed' | ReviewStatus

interface TrustedActor {
  id: string
  roles: readonly string[]
}

interface ActorState {
  actor: TrustedActor | null
  reason: string
}

interface SkipEntry {
  index: number
  code: string
  key?: string
}

interface RescueListItem extends JsonRecord {
  rescueId: string
  status: string
  applicationStatus: string
  applicantId?: string
  reviewItemId?: string
  reviewerId?: string
}

interface SourceError {
  code: string
}

interface SourceResult {
  records: unknown[]
  error: SourceError | null
}

interface RescueListModel {
  actor: TrustedActor | null
  items: readonly RescueListItem[]
  pending: readonly RescueListItem[]
  processed: readonly RescueListItem[]
  canWrite: false
  diagnostics: Readonly<{
    scanned: number
    accepted: number
    skipped: readonly SkipEntry[]
    actorError: Readonly<{ code: string }> | null
  }>
}

interface ListArgs {
  actorProvider?: () => unknown
  records?: unknown[]
  resolver?: SourceResolver
  filter?: RescueListFilter
  query?: unknown
}

interface BuildListArgs {
  actorProvider?: () => unknown
  records?: unknown[]
  resolver?: SourceResolver
  type: RescueListType
  requiredRole: string
  filter?: RescueListFilter
}

interface ResolverContext {
  actor: TrustedActor
}

type SourceResolver = (context: Readonly<ResolverContext>) => unknown

function freezeList<T extends string>(...values: T[]): readonly T[] {
  return Object.freeze(values)
}

function includesValue<T extends string>(values: readonly T[], value: string): value is T {
  return values.some((candidate) => candidate === value)
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const CROSS_DOMAIN_PREFIXES = Object.freeze(['adoption', 'feeding', 'order', 'dynamic', 'yard'])

export const RESCUE_MINE_STATUSES: readonly MineStatus[] = freezeList<MineStatus>(
  'platform_pending',
  'platform_approved',
  'platform_rejected',
)

export const RESCUE_REVIEW_STATUSES: readonly ReviewStatus[] = freezeList<ReviewStatus>(
  'pending',
  'approved',
  'rejected',
)

export const RESCUE_LIST_FILTERS: Readonly<Record<RescueListType, readonly RescueListFilter[]>> =
  Object.freeze({
    mine: freezeList<RescueListFilter>('all', ...RESCUE_MINE_STATUSES),
    review: freezeList<RescueListFilter>('all', 'pending', 'processed', ...RESCUE_REVIEW_STATUSES),
  })

export class RescueListContractError extends Error {
  readonly code: string
  readonly details: JsonRecord

  constructor(code: string, message: string, details: JsonRecord = {}) {
    super(message)
    this.name = 'RescueListContractError'
    this.code = code
    this.details = details
  }
}

function fail(code: string, message: string, details: JsonRecord = {}): never {
  throw new RescueListContractError(code, message, details)
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
  if (Object.getOwnPropertySymbols(value).length)
    fail('UNKNOWN_FIELD', `${label} cannot contain symbol fields`)
}

function assertRecord(value: unknown, label: string): asserts value is JsonRecord {
  if (!isPlainRecord(value)) fail('INVALID_RECORD', `${label} must be a plain object`, { label })
  rejectDangerousKeys(value, label)
}

function normalizeId(
  value: unknown,
  label: string,
  { required = false }: { required?: boolean } = {},
): string {
  let id = ''
  if (typeof value === 'string') id = value.trim()
  else if (typeof value === 'number' && Number.isSafeInteger(value)) id = String(value)
  if (!id) {
    if (required) fail('MISSING_ID', `${label} is required`, { label })
    return ''
  }
  if (!SAFE_ID.test(id) || URL_MARKERS.test(id))
    fail('INVALID_ID', `${label} must be an opaque ID`, { label })
  return id
}

function rejectCrossDomainId(id: string, label: string): void {
  const lower = id.toLowerCase()
  for (const prefix of CROSS_DOMAIN_PREFIXES.concat('animal')) {
    if (
      lower === prefix ||
      lower.startsWith(`${prefix}-`) ||
      lower.startsWith(`${prefix}_`) ||
      lower.startsWith(`${prefix}:`)
    ) {
      fail('CROSS_DOMAIN_ID', `${label} looks like a ${prefix} domain ID`, { label, id, prefix })
    }
  }
}

function assertRescueDomain(record: JsonRecord): void {
  const values: Array<{ field: string; value: string }> = []
  for (const field of ['applicationType', 'businessType']) {
    if (!own(record, field)) continue
    const value = normalizeId(record[field], `record.${field}`)
    if (!value)
      fail('MISSING_DOMAIN', 'A rescue record must declare its business domain', { field })
    values.push({ field, value })
  }
  if (!values.length) fail('MISSING_DOMAIN', 'A rescue record must declare its business domain')
  if (values.some((item) => item.value !== 'rescue')) {
    fail('CROSS_DOMAIN_RECORD', 'A rescue list record must belong to the rescue domain', { values })
  }
  if (values.length > 1 && values[0].value !== values[1].value) {
    fail('CONFLICTING_DOMAIN', 'Rescue domain aliases disagree', { values })
  }
  const nestedReview = record.review
  if (own(record, 'review') && nestedReview !== null && nestedReview !== undefined) {
    if (!isPlainRecord(nestedReview)) fail('INVALID_REVIEW', 'record.review must be a plain object')
    for (const field of ['applicationType', 'businessType']) {
      if (!own(nestedReview, field)) continue
      const value = normalizeId(nestedReview[field], `record.review.${field}`)
      if (value !== 'rescue')
        fail('CROSS_DOMAIN_RECORD', 'Nested review metadata must belong to rescue', {
          field,
          value,
        })
    }
  }
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

function errorCode(error: unknown, fallback: string): string {
  if (error !== null && typeof error === 'object') {
    if ('code' in error && typeof error.code === 'string') return error.code
    if ('reason' in error && typeof error.reason === 'string') return error.reason
  }
  return fallback
}

function resolveActor(actorProvider: unknown, requiredRole: string): ActorState {
  try {
    const resolved: unknown = resolveTrustedActor(actorProvider)
    if (resolved === null) return { actor: null, reason: 'NO_ACTOR' }
    if (
      !isPlainRecord(resolved) ||
      typeof resolved.id !== 'string' ||
      !Array.isArray(resolved.roles)
    ) {
      return { actor: null, reason: 'INVALID_ACTOR' }
    }
    const roles: string[] = []
    for (const role of resolved.roles) {
      if (typeof role !== 'string') return { actor: null, reason: 'INVALID_ACTOR' }
      if (!roles.includes(role)) roles.push(role)
    }
    const actor: TrustedActor = Object.freeze({ id: resolved.id, roles: Object.freeze(roles) })
    if (!actor.roles.includes(requiredRole)) return { actor: null, reason: 'ACTOR_ROLE_REQUIRED' }
    return { actor, reason: '' }
  } catch (error) {
    return { actor: null, reason: errorCode(error, 'ACTOR_CONTRACT_FAILED') }
  }
}

interface DiagnosticsArgs {
  scanned?: number
  accepted?: number
  skipped?: SkipEntry[]
  actorError?: unknown
}

function diagnostics({
  scanned = 0,
  accepted = 0,
  skipped = [],
  actorError = null,
}: DiagnosticsArgs = {}): RescueListModel['diagnostics'] {
  return Object.freeze({
    scanned,
    accepted,
    skipped: Object.freeze(skipped.map((item) => Object.freeze({ ...item }))),
    actorError: actorError
      ? Object.freeze({ code: errorCode(actorError, 'ACTOR_CONTRACT_FAILED') })
      : null,
  })
}

function emptyModel(actor: TrustedActor | null, actorError: unknown): RescueListModel {
  const items = Object.freeze([])
  return Object.freeze({
    actor: actor || null,
    items,
    pending: items,
    processed: items,
    canWrite: false,
    diagnostics: diagnostics({ actorError }),
  })
}

function extractConsistentId(record: JsonRecord, fields: readonly string[], label: string): string {
  const values: string[] = []
  for (const field of fields) {
    if (!own(record, field)) continue
    const value = normalizeId(record[field], `record.${field}`)
    if (value && !values.includes(value)) values.push(value)
  }
  if (values.length > 1) fail('CONFLICTING_ID', `${label} aliases disagree`, { label, values })
  return values[0] || ''
}

function rescueIdFor(record: JsonRecord): string {
  const rescueId = extractConsistentId(record, ['rescueId', 'id'], 'rescueId')
  if (!rescueId) fail('MISSING_RESCUE_ID', 'A rescue record must identify rescueId')
  rejectCrossDomainId(rescueId, 'rescueId')
  return rescueId
}

function applicantIdFor(record: JsonRecord): string {
  const candidates: string[] = []
  for (const field of ['applicantId', 'applicantUserId']) {
    if (own(record, field)) {
      const value = normalizeId(record[field], `record.${field}`)
      if (value && !candidates.includes(value)) candidates.push(value)
    }
  }
  const applicant = record.applicant
  if (own(record, 'applicant') && applicant !== null && applicant !== undefined) {
    if (!isPlainRecord(applicant))
      fail('INVALID_APPLICANT', 'record.applicant must be a plain object')
    rejectDangerousKeys(applicant, 'record.applicant')
    for (const field of ['id', 'pawId']) {
      if (!own(applicant, field)) continue
      const value = normalizeId(applicant[field], `record.applicant.${field}`)
      if (value && !candidates.includes(value)) candidates.push(value)
    }
  }
  if (candidates.length > 1)
    fail('CONFLICTING_APPLICANT_ID', 'Applicant relation aliases disagree', { candidates })
  return candidates[0] || ''
}

function isMine(record: JsonRecord, actorId: string): boolean {
  const applicantId = applicantIdFor(record)
  return Boolean(applicantId && applicantId === actorId)
}

function scalarStates(record: JsonRecord, fields: readonly string[], label: string): string {
  const values: string[] = []
  for (const field of fields) {
    if (!own(record, field)) continue
    const value = normalizeId(record[field], `record.${field}`)
    if (value && !values.includes(value)) values.push(value)
  }
  if (values.length > 1) fail('CONFLICTING_STATUS', `${label} aliases disagree`, { label, values })
  return values[0] || ''
}

function mineStatusFor(record: JsonRecord): MineStatus {
  const status = scalarStates(record, ['applicationStatus'], 'applicationStatus')
  if (!includesValue(RESCUE_MINE_STATUSES, status))
    fail(
      status ? 'INVALID_MINE_STATUS' : 'MISSING_MINE_STATUS',
      'Mine rescue status is not in the whitelist',
      { status },
    )
  return status
}

function reviewObjectFor(record: JsonRecord): JsonRecord | null {
  if (!own(record, 'review')) return null
  const review = record.review
  if (!isPlainRecord(review)) fail('INVALID_REVIEW', 'record.review must be a plain object')
  rejectDangerousKeys(review, 'record.review')
  return review
}

function reviewItemFor(record: JsonRecord, review: JsonRecord | null): string {
  const top = own(record, 'reviewItemId')
    ? normalizeId(record.reviewItemId, 'record.reviewItemId')
    : ''
  const nested =
    review && own(review, 'reviewItemId')
      ? normalizeId(review.reviewItemId, 'record.review.reviewItemId')
      : ''
  if (top && nested && top !== nested)
    fail('CONFLICTING_REVIEW_ITEM_ID', 'reviewItemId aliases disagree')
  const id = top || nested
  if (!id) fail('MISSING_REVIEW_ITEM_ID', 'A rescue review item must identify reviewItemId')
  rejectCrossDomainId(id, 'reviewItemId')
  return id
}

function reviewRescueIdFor(review: JsonRecord | null, rescueId: string): void {
  if (!review || !own(review, 'rescueId')) return
  const nested = normalizeId(review.rescueId, 'record.review.rescueId', { required: true })
  if (nested !== rescueId)
    fail('CONFLICTING_RESCUE_ID', 'Review item rescueId disagrees with the record rescueId')
}

function reviewerIdsFor(record: JsonRecord, review: JsonRecord | null): string[] {
  const sourcesFound: Array<{ label: string; ids: string[] }> = []
  const sources: Array<{ source: JsonRecord | null; field: string; label: string }> = [
    { source: record, field: 'reviewerId', label: 'record.reviewerId' },
    { source: record, field: 'reviewerIds', label: 'record.reviewerIds' },
    { source: review, field: 'reviewerId', label: 'record.review.reviewerId' },
    { source: review, field: 'reviewerIds', label: 'record.review.reviewerIds' },
  ]
  for (const { source, field, label } of sources) {
    if (!source || !own(source, field)) continue
    const list = field.endsWith('Ids')
      ? normalizeIdList(source[field], label)
      : [normalizeId(source[field], label, { required: true })]
    sourcesFound.push({ label, ids: Array.from(new Set(list)).sort() })
  }
  if (!sourcesFound.length)
    fail('MISSING_REVIEWER_RELATION', 'A review item must identify its reviewer')
  const first = JSON.stringify(sourcesFound[0].ids)
  if (sourcesFound.some((source) => JSON.stringify(source.ids) !== first)) {
    fail('CONFLICTING_REVIEWER_RELATION', 'Reviewer relation aliases disagree', {
      sources: sourcesFound.map((source) => source.label),
    })
  }
  return sourcesFound[0].ids
}

function reviewStatusFor(record: JsonRecord, review: JsonRecord | null): ReviewStatus {
  const values: string[] = []
  const sources: Array<{ source: JsonRecord | null; field: string; label: string }> = [
    { source: record, field: 'reviewStatus', label: 'record.reviewStatus' },
    { source: record, field: 'voteStatus', label: 'record.voteStatus' },
    { source: review, field: 'status', label: 'record.review.status' },
    { source: review, field: 'reviewStatus', label: 'record.review.reviewStatus' },
    { source: review, field: 'voteStatus', label: 'record.review.voteStatus' },
  ]
  for (const { source, field, label } of sources) {
    if (!source || !own(source, field)) continue
    // `undefined` is treated as an absent compatibility alias (the current
    // mock has a few records that carry it explicitly).  Null and other
    // present malformed values must fail closed instead of being ignored and
    // allowing a different alias to authorize the item.
    if (source[field] === undefined) continue
    const status = normalizeId(source[field], label, { required: true })
    if (status && !values.includes(status)) values.push(status)
  }
  // Legacy rescueStorage records use status for the review axis only for
  // review values. `unpaid` and `paid` belong to the funding axis in A05 and
  // must never turn a review item into an approved/processed review.
  if (own(record, 'status')) {
    const status =
      record.status === undefined
        ? ''
        : normalizeId(record.status, 'record.status', { required: true })
    const fundingOnlyStatuses = [
      'unpaid',
      'paid',
      'funding_pending',
      'funding_failed',
      'funding_paid',
    ]
    if (includesValue(RESCUE_REVIEW_STATUSES, status) && !values.includes(status))
      values.push(status)
    else if (status && !fundingOnlyStatuses.includes(status)) {
      fail('INVALID_REVIEW_STATUS', 'Review status is not in the whitelist', { status })
    }
  }
  if (values.length > 1) fail('CONFLICTING_STATUS', 'Review status aliases disagree', { values })
  const status = values[0] || ''
  if (!includesValue(RESCUE_REVIEW_STATUSES, status))
    fail(
      status ? 'INVALID_REVIEW_STATUS' : 'MISSING_REVIEW_STATUS',
      'Review status is not in the whitelist',
      { status },
    )
  return status
}

function applicationStatusFor(record: JsonRecord): MineStatus | '' {
  const status = own(record, 'applicationStatus')
    ? normalizeId(record.applicationStatus, 'record.applicationStatus')
    : ''
  if (!status) return ''
  if (!includesValue(RESCUE_MINE_STATUSES, status))
    fail('INVALID_MINE_STATUS', 'Application status is not in the whitelist', { status })
  return status
}

function safeMeta(record: JsonRecord): JsonRecord {
  const result: JsonRecord = {}
  for (const field of ['summary', 'description', 'createdAt', 'updatedAt', 'yardId', 'animalId']) {
    if (!own(record, field) || record[field] === null || record[field] === undefined) continue
    const value = record[field]
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      fail('INVALID_METADATA', `record.${field} must be a scalar read-only value`, { field })
    }
    if (typeof value === 'number' && !Number.isFinite(value)) {
      fail('INVALID_METADATA', `record.${field} must be a finite number`, { field })
    }
    result[field] = value
  }
  return result
}

function normalizeMineRecord(record: unknown, actorId: string): RescueListItem {
  assertRecord(record, 'rescue record')
  assertRescueDomain(record)
  const rescueId = rescueIdFor(record)
  if (!isMine(record, actorId))
    fail('ACTOR_MISMATCH', 'Rescue record does not belong to the trusted applicant')
  const applicationStatus = mineStatusFor(record)
  return Object.freeze({
    rescueId,
    status: applicationStatus,
    applicationStatus,
    applicantId: applicantIdFor(record),
    ...safeMeta(record),
  })
}

function normalizeReviewRecord(record: unknown, actorId: string): RescueListItem {
  assertRecord(record, 'rescue review record')
  assertRescueDomain(record)
  const rescueId = rescueIdFor(record)
  const review = reviewObjectFor(record)
  const reviewItemId = reviewItemFor(record, review)
  reviewRescueIdFor(review, rescueId)
  const reviewerIds = reviewerIdsFor(record, review)
  if (!reviewerIds.includes(actorId))
    fail('ACTOR_MISMATCH', 'Review item does not belong to the trusted reviewer')
  const status = reviewStatusFor(record, review)
  return Object.freeze({
    rescueId,
    reviewItemId,
    status,
    applicationStatus: applicationStatusFor(record),
    reviewerId: actorId,
    ...safeMeta(record),
  })
}

function acceptFilter(filter: unknown, type: RescueListType): RescueListFilter {
  const value = filter === undefined || filter === null ? 'all' : filter
  if (typeof value !== 'string' || !includesValue(RESCUE_LIST_FILTERS[type], value)) {
    fail('INVALID_STATUS_FILTER', `Unsupported ${type} rescue list status filter`, {
      filter: value,
    })
  }
  return value
}

function filterItems(
  items: readonly RescueListItem[],
  filter: RescueListFilter,
  type: RescueListType,
): RescueListItem[] {
  if (filter === 'all') return items.slice()
  if (type === 'mine') return items.filter((item) => item.applicationStatus === filter)
  if (filter === 'processed') return items.filter((item) => item.status !== 'pending')
  if (filter === 'pending') return items.filter((item) => item.status === 'pending')
  return items.filter((item) => item.status === filter)
}

function duplicateKey(item: RescueListItem, type: RescueListType): string {
  return type === 'mine' ? item.rescueId : `${item.rescueId}\u0000${item.reviewItemId}`
}

function equalStable(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

function dedupe(
  items: readonly RescueListItem[],
  type: RescueListType,
  skipped: SkipEntry[],
): RescueListItem[] {
  const byKey = new Map<string, RescueListItem>()
  const conflicted = new Set()
  for (const item of items) {
    const key = duplicateKey(item, type)
    if (conflicted.has(key)) continue
    const previous = byKey.get(key)
    if (!previous) {
      byKey.set(key, item)
      continue
    }
    if (!equalStable(previous, item)) {
      byKey.delete(key)
      conflicted.add(key)
      skipped.push({ index: -1, code: 'DUPLICATE_CONFLICT', key })
    }
  }
  return Array.from(byKey.values())
}

function isSourceResolver(value: unknown): value is SourceResolver {
  return typeof value === 'function'
}

interface ThenableWithCatch {
  then: (...args: unknown[]) => unknown
  catch?: (...args: unknown[]) => unknown
}

function isThenable(value: unknown): value is ThenableWithCatch {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return false
  if (!('then' in value) || typeof value.then !== 'function') return false
  return true
}

interface ResolveSourceArgs {
  records?: unknown[]
  resolver?: SourceResolver
  actor: TrustedActor
  label: string
}

function resolveSource({ records, resolver, actor, label }: ResolveSourceArgs): SourceResult {
  if (resolver !== undefined) {
    if (!isSourceResolver(resolver))
      fail('INVALID_RESOLVER', `${label} resolver must be a function`)
    let result
    try {
      result = resolver(Object.freeze({ actor }))
    } catch (error) {
      return { records: [], error: { code: errorCode(error, 'RESOLVER_FAILED') } }
    }
    if (isThenable(result)) {
      if (typeof result.catch === 'function') result.catch(() => undefined)
      return { records: [], error: { code: 'ASYNC_RESOLVER_UNSUPPORTED' } }
    }
    if (!Array.isArray(result)) return { records: [], error: { code: 'INVALID_RESOLVER_RESULT' } }
    return { records: result, error: null }
  }
  if (!Array.isArray(records)) fail('RECORDS_REQUIRED', `${label} records must be an array`)
  return { records, error: null }
}

function buildList({
  actorProvider,
  records,
  resolver,
  type,
  requiredRole,
  filter,
}: BuildListArgs): RescueListModel {
  const actorState = resolveActor(actorProvider, requiredRole)
  if (!actorState.actor) return emptyModel(null, actorState)
  const selectedFilter = acceptFilter(filter, type)
  const source = resolveSource({
    records,
    resolver,
    actor: actorState.actor,
    label: `${type} rescue list`,
  })
  if (source.error) return emptyModel(actorState.actor, source.error)
  const skipped: SkipEntry[] = []
  const normalized: RescueListItem[] = []
  for (let index = 0; index < source.records.length; index += 1) {
    try {
      const item =
        type === 'mine'
          ? normalizeMineRecord(source.records[index], actorState.actor.id)
          : normalizeReviewRecord(source.records[index], actorState.actor.id)
      normalized.push(item)
    } catch (error) {
      skipped.push({ index, code: errorCode(error, 'INVALID_RECORD') })
    }
  }
  const unique = dedupe(normalized, type, skipped)
  const items = Object.freeze(filterItems(unique, selectedFilter, type).slice())
  const pending =
    type === 'mine'
      ? Object.freeze(items.filter((item) => item.applicationStatus === 'platform_pending'))
      : Object.freeze(items.filter((item) => item.status === 'pending'))
  const processed =
    type === 'mine'
      ? Object.freeze(items.filter((item) => item.applicationStatus !== 'platform_pending'))
      : Object.freeze(items.filter((item) => item.status !== 'pending'))
  return Object.freeze({
    actor: actorState.actor,
    items,
    pending,
    processed,
    canWrite: false,
    diagnostics: diagnostics({ scanned: source.records.length, accepted: items.length, skipped }),
  })
}

export function readRescueMine({
  actorProvider,
  records,
  resolver,
  filter,
  query,
}: ListArgs = {}): RescueListModel {
  // `query` is accepted solely for a migration caller's compatibility.  It
  // is never read for identity, ownership, status, or access decisions.
  void query
  return buildList({
    actorProvider,
    records,
    resolver,
    type: 'mine',
    requiredRole: 'applicant',
    filter,
  })
}

export function readRescueReviewList({
  actorProvider,
  records,
  resolver,
  filter,
  query,
}: ListArgs = {}): RescueListModel {
  void query
  return buildList({
    actorProvider,
    records,
    resolver,
    type: 'review',
    requiredRole: 'reviewer',
    filter,
  })
}

export const getRescueMine = readRescueMine
export const getRescueReviewList = readRescueReviewList
