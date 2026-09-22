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

import { resolveTrustedActor } from './actorCapabilities.js'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const CROSS_DOMAIN_PREFIXES = Object.freeze(['adoption', 'feeding', 'order', 'dynamic', 'yard'])

export const RESCUE_MINE_STATUSES = Object.freeze([
  'platform_pending',
  'platform_approved',
  'platform_rejected',
])

export const RESCUE_REVIEW_STATUSES = Object.freeze([
  'pending',
  'approved',
  'rejected',
])

export const RESCUE_LIST_FILTERS = Object.freeze({
  mine: Object.freeze(['all', ...RESCUE_MINE_STATUSES]),
  review: Object.freeze(['all', 'pending', 'processed', ...RESCUE_REVIEW_STATUSES]),
})

export class RescueListContractError extends Error {
  constructor(code, message, details) {
    super(message)
    this.name = 'RescueListContractError'
    this.code = code
    this.details = details || {}
  }
}

function fail(code, message, details) {
  throw new RescueListContractError(code, message, details)
}

function own(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function isPlainRecord(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  if (prototype === Object.prototype || prototype === null) return true
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'constructor')
  return Object.getPrototypeOf(prototype) === null
    && Object.prototype.toString.call(value) === '[object Object]'
    && descriptor
    && typeof descriptor.value === 'function'
    && descriptor.value.name === 'Object'
}

function rejectDangerousKeys(value, label) {
  for (const key of Object.getOwnPropertyNames(value)) {
    if (DANGEROUS_KEYS.has(key)) fail('PROTOTYPE_KEY', `${label} contains a prototype key`, { key })
  }
  if (Object.getOwnPropertySymbols(value).length) fail('UNKNOWN_FIELD', `${label} cannot contain symbol fields`)
}

function assertRecord(value, label) {
  if (!isPlainRecord(value)) fail('INVALID_RECORD', `${label} must be a plain object`, { label })
  rejectDangerousKeys(value, label)
}

function normalizeId(value, label, { required = false } = {}) {
  let id = ''
  if (typeof value === 'string') id = value.trim()
  else if (typeof value === 'number' && Number.isSafeInteger(value)) id = String(value)
  if (!id) {
    if (required) fail('MISSING_ID', `${label} is required`, { label })
    return ''
  }
  if (!SAFE_ID.test(id) || URL_MARKERS.test(id)) fail('INVALID_ID', `${label} must be an opaque ID`, { label })
  return id
}

function rejectCrossDomainId(id, label) {
  const lower = id.toLowerCase()
  for (const prefix of CROSS_DOMAIN_PREFIXES.concat('animal')) {
    if (lower === prefix || lower.startsWith(`${prefix}-`) || lower.startsWith(`${prefix}_`) || lower.startsWith(`${prefix}:`)) {
      fail('CROSS_DOMAIN_ID', `${label} looks like a ${prefix} domain ID`, { label, id, prefix })
    }
  }
}

function assertRescueDomain(record) {
  const values = []
  for (const field of ['applicationType', 'businessType']) {
    if (!own(record, field)) continue
    const value = normalizeId(record[field], `record.${field}`)
    if (!value) fail('MISSING_DOMAIN', 'A rescue record must declare its business domain', { field })
    values.push({ field, value })
  }
  if (!values.length) fail('MISSING_DOMAIN', 'A rescue record must declare its business domain')
  if (values.some(item => item.value !== 'rescue')) {
    fail('CROSS_DOMAIN_RECORD', 'A rescue list record must belong to the rescue domain', { values })
  }
  if (values.length > 1 && values[0].value !== values[1].value) {
    fail('CONFLICTING_DOMAIN', 'Rescue domain aliases disagree', { values })
  }
  if (own(record, 'review') && record.review !== null && record.review !== undefined) {
    if (!isPlainRecord(record.review)) fail('INVALID_REVIEW', 'record.review must be a plain object')
    for (const field of ['applicationType', 'businessType']) {
      if (!own(record.review, field)) continue
      const value = normalizeId(record.review[field], `record.review.${field}`)
      if (value !== 'rescue') fail('CROSS_DOMAIN_RECORD', 'Nested review metadata must belong to rescue', { field, value })
    }
  }
}

function normalizeIdList(value, label) {
  if (!Array.isArray(value)) fail('INVALID_ID_LIST', `${label} must be an array`, { label })
  const result = []
  for (const item of value) {
    const id = normalizeId(item, label, { required: true })
    if (!result.includes(id)) result.push(id)
  }
  return result
}

function resolveActor(actorProvider, requiredRole) {
  try {
    const actor = resolveTrustedActor(actorProvider)
    if (!actor) return { actor: null, reason: 'NO_ACTOR' }
    if (!actor.roles.includes(requiredRole)) return { actor: null, reason: 'ACTOR_ROLE_REQUIRED' }
    return { actor, reason: '' }
  } catch (error) {
    return { actor: null, reason: error && error.code ? error.code : 'ACTOR_CONTRACT_FAILED' }
  }
}

function diagnostics({ scanned = 0, accepted = 0, skipped = [], actorError = null } = {}) {
  return Object.freeze({
    scanned,
    accepted,
    skipped: Object.freeze(skipped.map(item => Object.freeze({ ...item }))),
    actorError: actorError ? Object.freeze({ code: actorError.code || actorError.reason || 'ACTOR_CONTRACT_FAILED' }) : null,
  })
}

function emptyModel(actor, actorError) {
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

function extractConsistentId(record, fields, label) {
  const values = []
  for (const field of fields) {
    if (!own(record, field)) continue
    const value = normalizeId(record[field], `record.${field}`)
    if (value && !values.includes(value)) values.push(value)
  }
  if (values.length > 1) fail('CONFLICTING_ID', `${label} aliases disagree`, { label, values })
  return values[0] || ''
}

function rescueIdFor(record) {
  const rescueId = extractConsistentId(record, ['rescueId', 'id'], 'rescueId')
  if (!rescueId) fail('MISSING_RESCUE_ID', 'A rescue record must identify rescueId')
  rejectCrossDomainId(rescueId, 'rescueId')
  return rescueId
}

function applicantIdFor(record) {
  const candidates = []
  for (const field of ['applicantId', 'applicantUserId']) {
    if (own(record, field)) {
      const value = normalizeId(record[field], `record.${field}`)
      if (value && !candidates.includes(value)) candidates.push(value)
    }
  }
  if (own(record, 'applicant') && record.applicant !== null && record.applicant !== undefined) {
    if (!isPlainRecord(record.applicant)) fail('INVALID_APPLICANT', 'record.applicant must be a plain object')
    rejectDangerousKeys(record.applicant, 'record.applicant')
    for (const field of ['id', 'pawId']) {
      if (!own(record.applicant, field)) continue
      const value = normalizeId(record.applicant[field], `record.applicant.${field}`)
      if (value && !candidates.includes(value)) candidates.push(value)
    }
  }
  if (candidates.length > 1) fail('CONFLICTING_APPLICANT_ID', 'Applicant relation aliases disagree', { candidates })
  return candidates[0] || ''
}

function isMine(record, actorId) {
  const applicantId = applicantIdFor(record)
  return Boolean(applicantId && applicantId === actorId)
}

function scalarStates(record, fields, label) {
  const values = []
  for (const field of fields) {
    if (!own(record, field)) continue
    const value = normalizeId(record[field], `record.${field}`)
    if (value && !values.includes(value)) values.push(value)
  }
  if (values.length > 1) fail('CONFLICTING_STATUS', `${label} aliases disagree`, { label, values })
  return values[0] || ''
}

function mineStatusFor(record) {
  const status = scalarStates(record, ['applicationStatus'], 'applicationStatus')
  if (!RESCUE_MINE_STATUSES.includes(status)) fail(status ? 'INVALID_MINE_STATUS' : 'MISSING_MINE_STATUS', 'Mine rescue status is not in the whitelist', { status })
  return status
}

function reviewObjectFor(record) {
  if (!own(record, 'review')) return null
  if (!isPlainRecord(record.review)) fail('INVALID_REVIEW', 'record.review must be a plain object')
  rejectDangerousKeys(record.review, 'record.review')
  return record.review
}

function reviewItemFor(record, review) {
  const top = own(record, 'reviewItemId') ? normalizeId(record.reviewItemId, 'record.reviewItemId') : ''
  const nested = review && own(review, 'reviewItemId') ? normalizeId(review.reviewItemId, 'record.review.reviewItemId') : ''
  if (top && nested && top !== nested) fail('CONFLICTING_REVIEW_ITEM_ID', 'reviewItemId aliases disagree')
  const id = top || nested
  if (!id) fail('MISSING_REVIEW_ITEM_ID', 'A rescue review item must identify reviewItemId')
  rejectCrossDomainId(id, 'reviewItemId')
  return id
}

function reviewRescueIdFor(review, rescueId) {
  if (!review || !own(review, 'rescueId')) return
  const nested = normalizeId(review.rescueId, 'record.review.rescueId', { required: true })
  if (nested !== rescueId) fail('CONFLICTING_RESCUE_ID', 'Review item rescueId disagrees with the record rescueId')
}

function reviewerIdsFor(record, review) {
  const sourcesFound = []
  const sources = [
    [record, 'reviewerId', 'record.reviewerId'],
    [record, 'reviewerIds', 'record.reviewerIds'],
    [review, 'reviewerId', 'record.review.reviewerId'],
    [review, 'reviewerIds', 'record.review.reviewerIds'],
  ]
  for (const [source, field, label] of sources) {
    if (!source || !own(source, field)) continue
    const list = field.endsWith('Ids') ? normalizeIdList(source[field], label) : [normalizeId(source[field], label, { required: true })]
    sourcesFound.push({ label, ids: Array.from(new Set(list)).sort() })
  }
  if (!sourcesFound.length) fail('MISSING_REVIEWER_RELATION', 'A review item must identify its reviewer')
  const first = JSON.stringify(sourcesFound[0].ids)
  if (sourcesFound.some(source => JSON.stringify(source.ids) !== first)) {
    fail('CONFLICTING_REVIEWER_RELATION', 'Reviewer relation aliases disagree', { sources: sourcesFound.map(source => source.label) })
  }
  return sourcesFound[0].ids
}

function reviewStatusFor(record, review) {
  const values = []
  const sources = [
    [record, 'reviewStatus', 'record.reviewStatus'],
    [record, 'voteStatus', 'record.voteStatus'],
    [review, 'status', 'record.review.status'],
    [review, 'reviewStatus', 'record.review.reviewStatus'],
    [review, 'voteStatus', 'record.review.voteStatus'],
  ]
  for (const [source, field, label] of sources) {
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
    const status = record.status === undefined
      ? ''
      : normalizeId(record.status, 'record.status', { required: true })
    const fundingOnlyStatuses = ['unpaid', 'paid', 'funding_pending', 'funding_failed', 'funding_paid']
    if (RESCUE_REVIEW_STATUSES.includes(status) && !values.includes(status)) values.push(status)
    else if (status && !fundingOnlyStatuses.includes(status)) {
      fail('INVALID_REVIEW_STATUS', 'Review status is not in the whitelist', { status })
    }
  }
  if (values.length > 1) fail('CONFLICTING_STATUS', 'Review status aliases disagree', { values })
  const status = values[0] || ''
  if (!RESCUE_REVIEW_STATUSES.includes(status)) fail(status ? 'INVALID_REVIEW_STATUS' : 'MISSING_REVIEW_STATUS', 'Review status is not in the whitelist', { status })
  return status
}

function applicationStatusFor(record) {
  const status = own(record, 'applicationStatus') ? normalizeId(record.applicationStatus, 'record.applicationStatus') : ''
  if (!status) return ''
  if (!RESCUE_MINE_STATUSES.includes(status)) fail('INVALID_MINE_STATUS', 'Application status is not in the whitelist', { status })
  return status
}

function safeMeta(record) {
  const result = {}
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

function normalizeMineRecord(record, actorId) {
  assertRecord(record, 'rescue record')
  assertRescueDomain(record)
  const rescueId = rescueIdFor(record)
  if (!isMine(record, actorId)) fail('ACTOR_MISMATCH', 'Rescue record does not belong to the trusted applicant')
  const applicationStatus = mineStatusFor(record)
  return Object.freeze({
    rescueId,
    status: applicationStatus,
    applicationStatus,
    applicantId: applicantIdFor(record),
    ...safeMeta(record),
  })
}

function normalizeReviewRecord(record, actorId) {
  assertRecord(record, 'rescue review record')
  assertRescueDomain(record)
  const rescueId = rescueIdFor(record)
  const review = reviewObjectFor(record)
  const reviewItemId = reviewItemFor(record, review)
  reviewRescueIdFor(review, rescueId)
  const reviewerIds = reviewerIdsFor(record, review)
  if (!reviewerIds.includes(actorId)) fail('ACTOR_MISMATCH', 'Review item does not belong to the trusted reviewer')
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

function acceptFilter(filter, type) {
  const value = filter === undefined || filter === null ? 'all' : filter
  if (!RESCUE_LIST_FILTERS[type].includes(value)) {
    fail('INVALID_STATUS_FILTER', `Unsupported ${type} rescue list status filter`, { filter: value })
  }
  return value
}

function filterItems(items, filter, type) {
  if (filter === 'all') return items
  if (type === 'mine') return items.filter(item => item.applicationStatus === filter)
  if (filter === 'processed') return items.filter(item => item.status !== 'pending')
  if (filter === 'pending') return items.filter(item => item.status === 'pending')
  return items.filter(item => item.status === filter)
}

function duplicateKey(item, type) {
  return type === 'mine' ? item.rescueId : `${item.rescueId}\u0000${item.reviewItemId}`
}

function equalStable(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch (error) {
    return false
  }
}

function dedupe(items, type, skipped) {
  const byKey = new Map()
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

function resolveSource({ records, resolver, actor, label }) {
  if (resolver !== undefined) {
    if (typeof resolver !== 'function') fail('INVALID_RESOLVER', `${label} resolver must be a function`)
    let result
    try {
      result = resolver(Object.freeze({ actor }))
    } catch (error) {
      return { records: [], error: { code: error && error.code ? error.code : 'RESOLVER_FAILED' } }
    }
    if (result && typeof result.then === 'function') {
      if (typeof result.catch === 'function') result.catch(() => {})
      return { records: [], error: { code: 'ASYNC_RESOLVER_UNSUPPORTED' } }
    }
    if (!Array.isArray(result)) return { records: [], error: { code: 'INVALID_RESOLVER_RESULT' } }
    return { records: result, error: null }
  }
  if (!Array.isArray(records)) fail('RECORDS_REQUIRED', `${label} records must be an array`)
  return { records, error: null }
}

function buildList({ actorProvider, records, resolver, type, requiredRole, filter }) {
  const actorState = resolveActor(actorProvider, requiredRole)
  if (!actorState.actor) return emptyModel(null, actorState)
  const selectedFilter = acceptFilter(filter, type)
  const source = resolveSource({ records, resolver, actor: actorState.actor, label: `${type} rescue list` })
  if (source.error) return emptyModel(actorState.actor, source.error)
  const skipped = []
  const normalized = []
  for (let index = 0; index < source.records.length; index += 1) {
    try {
      const item = type === 'mine'
        ? normalizeMineRecord(source.records[index], actorState.actor.id)
        : normalizeReviewRecord(source.records[index], actorState.actor.id)
      normalized.push(item)
    } catch (error) {
      skipped.push({ index, code: error.code || 'INVALID_RECORD' })
    }
  }
  const unique = dedupe(normalized, type, skipped)
  const items = Object.freeze(filterItems(unique, selectedFilter, type).slice())
  const pending = type === 'mine'
    ? Object.freeze(items.filter(item => item.applicationStatus === 'platform_pending'))
    : Object.freeze(items.filter(item => item.status === 'pending'))
  const processed = type === 'mine'
    ? Object.freeze(items.filter(item => item.applicationStatus !== 'platform_pending'))
    : Object.freeze(items.filter(item => item.status !== 'pending'))
  return Object.freeze({
    actor: actorState.actor,
    items,
    pending,
    processed,
    canWrite: false,
    diagnostics: diagnostics({ scanned: source.records.length, accepted: items.length, skipped }),
  })
}

export function readRescueMine({ actorProvider, records, resolver, filter, query } = {}) {
  // `query` is accepted solely for a migration caller's compatibility.  It
  // is never read for identity, ownership, status, or access decisions.
  void query
  return buildList({ actorProvider, records, resolver, type: 'mine', requiredRole: 'applicant', filter })
}

export function readRescueReviewList({ actorProvider, records, resolver, filter, query } = {}) {
  void query
  return buildList({ actorProvider, records, resolver, type: 'review', requiredRole: 'reviewer', filter })
}

export const getRescueMine = readRescueMine
export const getRescueReviewList = readRescueReviewList
