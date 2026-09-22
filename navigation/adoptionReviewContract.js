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

import { resolveTrustedActor } from './actorCapabilities.js'
import { evaluateCloudParentCondition } from './adoptionConditionContract.js'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

// This is the lifecycle vocabulary in utils/adoptionStorage.js.  It is not a
// second state machine; transitions remain owned by ADOPTION_TRANSITIONS.
export const ADOPTION_APPLICATION_STATUSES = Object.freeze([
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
])

export const ADOPTION_REVIEW_PHASES = Object.freeze([
  'cloud_parent',
  'owner',
  'owner_confirmation',
  'jury',
])

export const ADOPTION_REVIEW_STATUSES = Object.freeze(['pending', 'approved', 'rejected'])

export const ADOPTION_REVIEW_STATUS_BUCKETS = Object.freeze({
  pending: 'pending',
  approved: 'processed',
  rejected: 'processed',
})

export const ADOPTION_REVIEW_LIST_FILTERS = Object.freeze(['all', 'pending', 'processed', 'approved', 'rejected'])

const REVIEW_ROLES = Object.freeze(['owner', 'cloud_parent', 'reviewer'])
const ACTOR_REVIEW_ROLES = Object.freeze(['applicant', 'owner', 'yard_owner', 'cloud_parent', 'reviewer'])

const PHASE_ROLE = Object.freeze({
  cloud_parent: 'cloud_parent',
  owner: 'owner',
  owner_confirmation: 'owner',
  jury: 'reviewer',
})

const PHASE_APPLICATION_STATES = Object.freeze({
  cloud_parent: Object.freeze({
    pending: Object.freeze(['cloud_pending']),
    approved: Object.freeze(['pending']),
    // `cloud_rejected` is a legacy terminal spelling retained by
    // adoptionStorage; it still belongs to the cloud-parent rejection axis.
    rejected: Object.freeze(['rejected', 'cloud_rejected']),
  }),
  owner: Object.freeze({
    pending: Object.freeze(['pending']),
    approved: Object.freeze(['pickup']),
    rejected: Object.freeze(['rejected']),
  }),
  owner_confirmation: Object.freeze({
    pending: Object.freeze(['owner_confirm', 'owner_confirm_pending']),
    // Owner confirmation hands the application to jury review.  It may not
    // claim adoption_confirmed directly.
    approved: Object.freeze(['jury_confirm', 'jury_confirm_pending']),
    rejected: Object.freeze(['rejected']),
  }),
  jury: Object.freeze({
    pending: Object.freeze(['jury_confirm', 'jury_confirm_pending']),
    approved: Object.freeze(['adoption_confirmed', 'reward', 'reward_done']),
    rejected: Object.freeze(['rejected']),
  }),
})

const REJECTED_FAILURE_STAGES = Object.freeze({
  cloud_parent: Object.freeze(['cloud_parent']),
  owner: Object.freeze(['owner_review']),
  owner_confirmation: Object.freeze(['owner_confirm']),
  jury: Object.freeze(['jury', 'jury_review', 'jury_confirm', 'reviewer']),
})

const CROSS_DOMAIN_PREFIXES = Object.freeze([
  'rescue',
  'feeding',
  'order',
  'dynamic',
  'yard',
  'animal',
])

export class AdoptionReviewContractError extends Error {
  constructor(code, message, details) {
    super(message)
    this.name = 'AdoptionReviewContractError'
    this.code = code
    this.details = details || {}
  }
}

function fail(code, message, details) {
  throw new AdoptionReviewContractError(code, message, details)
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
  if (Object.getOwnPropertySymbols(value).length) {
    fail('UNKNOWN_FIELD', `${label} cannot contain symbol fields`)
  }
}

function assertRecord(value, label) {
  if (!isPlainRecord(value)) fail('INVALID_RECORD', `${label} must be a plain object`, { label })
  rejectDangerousKeys(value, label)
}

function opaqueId(value, label, { required = true } = {}) {
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
    if (lower === prefix || lower.startsWith(`${prefix}-`) || lower.startsWith(`${prefix}_`) || lower.startsWith(`${prefix}:`)) {
      fail('CROSS_DOMAIN_ID', `${label} looks like a ${prefix} domain ID`, { label, prefix })
    }
  }
  return id
}

function assertAdoptionDomain(record, review) {
  const domains = []
  for (const [field, source] of [['applicationType', record], ['businessType', record]]) {
    if (own(source, field)) domains.push({ field, value: source[field] })
  }
  if (review) {
    for (const [field, source] of [['applicationType', review], ['businessType', review]]) {
      if (own(source, field)) domains.push({ field: `review.${field}`, value: source[field] })
    }
  }
  if (!domains.length) fail('MISSING_DOMAIN', 'Adoption review record needs applicationType or businessType')
  if (domains.some(item => item.value !== 'adoption')) {
    fail('CROSS_DOMAIN_RECORD', 'Adoption review record has a non-adoption domain', { domains })
  }
}

function aliasId(record, review, names, label, required = true) {
  const values = []
  for (const [source, prefix] of [[record, 'record'], [review, 'review']]) {
    if (!source) continue
    for (const name of names) {
      if (!own(source, name)) continue
      values.push(opaqueId(source[name], `${prefix}.${name}`, { required }))
    }
  }
  const unique = [...new Set(values)]
  if (unique.length > 1) fail(`CONFLICTING_${label.toUpperCase()}`, `${label} aliases disagree`, { values: unique })
  if (!unique.length && required) fail(`MISSING_${label.toUpperCase()}`, `${label} is required`)
  return unique[0] || ''
}

function idList(record, review, names, label) {
  const values = []
  const sourceSets = []
  for (const [source, prefix] of [[record, 'record'], [review, 'review']]) {
    if (!source) continue
    for (const name of names) {
      if (!own(source, name)) continue
      if (!Array.isArray(source[name])) fail('INVALID_RELATION', `${prefix}.${name} must be an array`, { label })
      const current = source[name].map(item => opaqueId(item, `${prefix}.${name}`))
      sourceSets.push(current)
      values.push(...current)
    }
  }
  const canonicalSets = sourceSets.map(items => [...new Set(items)].sort().join('\u0000'))
  if (new Set(canonicalSets).size > 1) fail(`CONFLICTING_${label.toUpperCase()}`, `${label} list aliases disagree`, { sets: canonicalSets })
  return [...new Set(values)]
}

function relationIds(record, arrayNames, scalarNames, label) {
  const list = idList(record, null, arrayNames, label)
  const scalarValues = []
  for (const name of scalarNames) {
    if (own(record, name)) scalarValues.push(opaqueId(record[name], `record.${name}`))
  }
  if (new Set(scalarValues).size > 1) {
    fail(`CONFLICTING_${label.toUpperCase()}`, `${label} aliases disagree`, { values: scalarValues })
  }
  if (scalarValues.some(id => list.length > 0 && !list.includes(id))) {
    fail(`CONFLICTING_${label.toUpperCase()}`, `${label} aliases disagree`, { values: [...new Set([...list, ...scalarValues])] })
  }
  return [...new Set([...list, ...scalarValues])]
}

function actorRelation(record, review, role, actorId) {
  if (role === 'applicant') {
    return relationIds(record, ['applicantIds'], ['applicantId', 'applicantUserId'], 'applicant').includes(actorId)
  }
  if (role === 'owner') {
    return relationIds(record, ['ownerIds'], ['ownerId', 'ownerPawId', 'ownerUserId', 'yardOwnerId'], 'owner').includes(actorId)
  }
  if (role === 'cloud_parent') {
    return relationIds(record, ['cloudParentIds'], ['cloudParentId', 'cloudParentPawId', 'cloudOwnerId'], 'cloud_parent').includes(actorId)
  }
  if (role === 'reviewer') {
    return reviewerRelationIds(record, review).includes(actorId)
  }
  return false
}

function reviewerRelationIds(record, review) {
  const sets = []
  for (const [source, prefix] of [[record, 'record'], [review, 'review']]) {
    if (!source) continue
    if (own(source, 'reviewerId') && source.reviewerId !== undefined && source.reviewerId !== null) {
      sets.push([opaqueId(source.reviewerId, `${prefix}.reviewerId`)].sort())
    }
    if (own(source, 'reviewerIds') && source.reviewerIds !== undefined && source.reviewerIds !== null) {
      if (!Array.isArray(source.reviewerIds)) fail('INVALID_RELATION', `${prefix}.reviewerIds must be an array`)
      sets.push([...new Set(source.reviewerIds.map(id => opaqueId(id, `${prefix}.reviewerIds`)))].sort())
    }
  }
  if (!sets.length) return []
  const expected = sets[0].join('\u0000')
  if (sets.some(set => set.join('\u0000') !== expected)) {
    fail('CONFLICTING_REVIEWER_ID', 'reviewerId and reviewerIds aliases disagree', { sets })
  }
  return sets[0].slice()
}

function normalizeReviewStatus(record, review) {
  const values = []
  for (const [source, field] of [[review, 'status'], [review, 'reviewStatus'], [record, 'reviewStatus']]) {
    if (!source || !own(source, field)) continue
    if (typeof source[field] !== 'string' || !source[field].trim()) fail('INVALID_REVIEW_STATUS', 'Review status must be a non-empty string')
    values.push(source[field].trim())
  }
  const unique = [...new Set(values)]
  if (unique.length > 1) fail('CONFLICTING_REVIEW_STATUS', 'Review status aliases disagree', { values: unique })
  const status = unique[0] || ''
  if (!ADOPTION_REVIEW_STATUSES.includes(status)) {
    fail(status ? 'INVALID_REVIEW_STATUS' : 'MISSING_REVIEW_STATUS', 'Review status is not in the whitelist', { status })
  }
  return status
}

function normalizeApplicationStatus(record) {
  const values = []
  for (const field of ['status', 'applicationStatus']) {
    if (!own(record, field)) continue
    if (typeof record[field] !== 'string' || !record[field].trim()) {
      fail('INVALID_APPLICATION_STATUS', `record.${field} must be a non-empty string`)
    }
    values.push(record[field].trim())
  }
  const unique = [...new Set(values)]
  if (unique.length > 1) {
    fail('CONFLICTING_APPLICATION_STATUS', 'Application status aliases disagree', { values: unique })
  }
  const status = unique[0] || ''
  if (!status) fail('MISSING_APPLICATION_STATUS', 'Application status is required')
  if (!ADOPTION_APPLICATION_STATUSES.includes(status)) {
    fail('INVALID_APPLICATION_STATUS', 'Application status is not in the adoption whitelist', { status })
  }
  return status
}

function normalizePhase(review) {
  if (!own(review, 'phase') || typeof review.phase !== 'string' || !ADOPTION_REVIEW_PHASES.includes(review.phase)) {
    fail('INVALID_REVIEW_PHASE', 'Review phase must be explicit', { phase: review.phase })
  }
  return review.phase
}

function actorCanReviewRole(actor, reviewerRole) {
  if (reviewerRole === 'owner') return actor.roles.includes('owner') || actor.roles.includes('yard_owner')
  return actor.roles.includes(reviewerRole)
}

function assertStageConsistency(phase, reviewStatus, applicationStatus, record) {
  const allowed = PHASE_APPLICATION_STATES[phase][reviewStatus] || []
  if (!allowed.includes(applicationStatus)) {
    fail('INCONSISTENT_REVIEW_STAGE', 'Review status and application stage disagree', { phase, reviewStatus, applicationStatus })
  }
  if (reviewStatus === 'rejected') {
    const failureStage = typeof record.failureStage === 'string' ? record.failureStage.trim() : ''
    const accepted = REJECTED_FAILURE_STAGES[phase] || []
    if (!accepted.includes(failureStage)) {
      fail('REJECTED_STAGE_REQUIRED', 'A rejected review needs its explicit failure stage', { phase, failureStage })
    }
  }
}

function scalarMeta(record) {
  const result = {}
  for (const field of ['summary', 'description', 'yardId', 'yardName', 'animalId', 'createdAt', 'updatedAt']) {
    if (!own(record, field) || record[field] === null || record[field] === undefined) continue
    const value = record[field]
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      fail('INVALID_METADATA', `record.${field} must be a scalar`, { field })
    }
    if (typeof value === 'number' && !Number.isFinite(value)) fail('INVALID_METADATA', `record.${field} must be finite`, { field })
    result[field] = value
  }
  return result
}

function freezeSnapshot(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value
  seen.add(value)
  for (const key of Object.keys(value)) freezeSnapshot(value[key], seen)
  return Object.freeze(value)
}

function readCloudParent(record, cloudParentPolicy) {
  try {
    return evaluateCloudParentCondition({ record, policy: cloudParentPolicy })
  } catch (error) {
    fail(error && error.code ? error.code : 'INVALID_CLOUD_PARENT_CONDITION', 'Cloud-parent condition is invalid')
  }
}

function normalizeReviewRecord(record, actor, { expectedApplicationId = '', expectedReviewItemId = '', cloudParentPolicy } = {}) {
  assertRecord(record, 'adoption review record')
  const review = own(record, 'review') ? record.review : null
  if (!review || !isPlainRecord(review)) fail('MISSING_REVIEW_OBJECT', 'Review metadata must be an object')
  rejectDangerousKeys(review, 'review metadata')
  assertAdoptionDomain(record, review)
  const applicationId = aliasId(record, review, ['applicationId'], 'application_id')
  const reviewItemId = aliasId(record, review, ['reviewItemId'], 'review_item_id')
  if (expectedApplicationId && applicationId !== expectedApplicationId) fail('APPLICATION_ID_MISMATCH', 'Resolved application does not match requested applicationId')
  if (expectedReviewItemId && reviewItemId !== expectedReviewItemId) fail('REVIEW_ITEM_ID_MISMATCH', 'Resolved review item does not match requested reviewItemId')

  const applicationStatus = normalizeApplicationStatus(record)
  const phase = normalizePhase(review)
  const reviewerRole = own(review, 'reviewerRole') ? review.reviewerRole : ''
  if (!REVIEW_ROLES.includes(reviewerRole)) fail('INVALID_REVIEW_ROLE', 'Review role must be owner, cloud_parent, or reviewer', { reviewerRole })
  if (PHASE_ROLE[phase] !== reviewerRole) fail('REVIEW_ROLE_PHASE_MISMATCH', 'Review role does not match review phase', { phase, reviewerRole })
  const reviewStatus = normalizeReviewStatus(record, review)
  assertStageConsistency(phase, reviewStatus, applicationStatus, record)

  const reviewerIds = reviewerRelationIds(record, review)
  if (reviewerIds.length === 0) fail('MISSING_REVIEWER_ID', 'Review metadata needs reviewerId or reviewerIds')
  const reviewerId = reviewerIds.length === 1 ? reviewerIds[0] : ''
  if (!reviewerId && reviewerRole !== 'reviewer') fail('MISSING_REVIEWER_ID', 'Owner and cloud-parent reviews need reviewerId')
  if (!actorCanReviewRole(actor, reviewerRole)) {
    fail('ACTOR_ROLE_REQUIRED', 'Trusted actor cannot perform this review perspective', { reviewerRole })
  }
  if (!reviewerIds.includes(actor.id) || !actorRelation(record, review, reviewerRole, actor.id)) {
    fail('ACTOR_MISMATCH', 'Review item does not belong to the trusted reviewer')
  }

  const applicantId = aliasId(record, null, ['applicantId', 'applicantUserId'], 'applicant_id', false)
  const ownerId = aliasId(record, null, ['ownerId', 'ownerPawId', 'ownerUserId', 'yardOwnerId'], 'owner_id', false)
  const uniqueCloudParentIds = relationIds(record, ['cloudParentIds'], ['cloudParentId', 'cloudParentPawId', 'cloudOwnerId'], 'cloud_parent')
  const cloudParent = freezeSnapshot(readCloudParent(record, cloudParentPolicy))
  const result = {
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

function normalizeApplicantDetail(record, actor, { expectedApplicationId = '', expectedReviewItemId = '', cloudParentPolicy } = {}) {
  assertRecord(record, 'adoption review record')
  const review = own(record, 'review') ? record.review : null
  if (!review || !isPlainRecord(review)) fail('MISSING_REVIEW_OBJECT', 'Review metadata must be an object')
  rejectDangerousKeys(review, 'review metadata')
  assertAdoptionDomain(record, review)
  const applicationId = aliasId(record, review, ['applicationId'], 'application_id')
  const reviewItemId = aliasId(record, review, ['reviewItemId'], 'review_item_id')
  if (expectedApplicationId && applicationId !== expectedApplicationId) fail('APPLICATION_ID_MISMATCH', 'Resolved application does not match requested applicationId')
  if (expectedReviewItemId && reviewItemId !== expectedReviewItemId) fail('REVIEW_ITEM_ID_MISMATCH', 'Resolved review item does not match requested reviewItemId')
  const applicationStatus = normalizeApplicationStatus(record)
  const phase = normalizePhase(review)
  const reviewStatus = normalizeReviewStatus(record, review)
  assertStageConsistency(phase, reviewStatus, applicationStatus, record)
  if (!actor.roles.includes('applicant') || !actorRelation(record, review, 'applicant', actor.id)) fail('ACTOR_MISMATCH', 'Applicant detail is limited to the trusted applicant')
  const applicantId = aliasId(record, null, ['applicantId', 'applicantUserId'], 'applicant_id')
  const cloudParentIds = relationIds(record, ['cloudParentIds'], ['cloudParentId', 'cloudParentPawId', 'cloudOwnerId'], 'cloud_parent')
  const result = {
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

function actorState(actorProvider, roleRequired) {
  try {
    const actor = resolveTrustedActor(actorProvider)
    if (!actor) return { actor: null, error: { code: 'NO_ACTOR' } }
    if (!actor.roles.some(role => ACTOR_REVIEW_ROLES.includes(role))) return { actor: null, error: { code: 'ACTOR_ROLE_REQUIRED' } }
    if (roleRequired && !actor.roles.includes(roleRequired)) return { actor: null, error: { code: 'ACTOR_ROLE_REQUIRED' } }
    return { actor, error: null }
  } catch (error) {
    return { actor: null, error: { code: error && error.code ? error.code : 'INVALID_ACTOR' } }
  }
}

function emptyList(actor, error, scanned = 0) {
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

function sourceRecords({ records, resolver, actor, label }) {
  if (resolver !== undefined) {
    if (typeof resolver !== 'function') fail('INVALID_RESOLVER', `${label} resolver must be a function`)
    let value
    try {
      value = resolver(Object.freeze({ actor }))
    } catch (error) {
      return { records: [], error: { code: error && error.code ? error.code : 'RESOLVER_FAILED' } }
    }
    if (value && typeof value.then === 'function') {
      if (typeof value.catch === 'function') value.catch(() => {})
      return { records: [], error: { code: 'ASYNC_RESOLVER_UNSUPPORTED' } }
    }
    if (!Array.isArray(value)) return { records: [], error: { code: 'INVALID_RESOLVER_RESULT' } }
    return { records: value, error: null }
  }
  if (!Array.isArray(records)) fail('RECORDS_REQUIRED', `${label} records must be an array`)
  return { records, error: null }
}

function listItems(records, actor, cloudParentPolicy, skipped) {
  const normalized = []
  records.forEach((record, index) => {
    try {
      normalized.push(normalizeReviewRecord(record, actor, { cloudParentPolicy }))
    } catch (error) {
      skipped.push({ index, code: error && error.code ? error.code : 'INVALID_RECORD' })
    }
  })
  const byId = new Map()
  const conflict = new Set()
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

function filterItems(items, filter) {
  if (filter === 'all') return items
  if (filter === 'pending' || filter === 'processed') return items.filter(item => item.bucket === filter)
  return items.filter(item => item.reviewStatus === filter)
}

function normalizedFilter(filter) {
  const value = filter === undefined || filter === null ? 'all' : filter
  if (!ADOPTION_REVIEW_LIST_FILTERS.includes(value)) fail('INVALID_STATUS_FILTER', 'Unsupported adoption review filter', { filter: value })
  return value
}

/** Read the reviewer queue.  Applicant records never enter this queue. */
export function readAdoptionReviewList({ actorProvider, records, resolver, filter, query, cloudParentPolicy } = {}) {
  void query
  const state = actorState(actorProvider)
  if (!state.actor) return emptyList(null, state.error)
  const actor = state.actor
  if (!actor.roles.some(role => REVIEW_ROLES.includes(role) || role === 'yard_owner')) return emptyList(actor, { code: 'ACTOR_ROLE_REQUIRED' })
  const selected = normalizedFilter(filter)
  const source = sourceRecords({ records, resolver, actor, label: 'adoption review list' })
  if (source.error) return emptyList(actor, source.error, 0)
  const skipped = []
  const all = listItems(source.records, actor, cloudParentPolicy, skipped)
  const items = Object.freeze(filterItems(all, selected).slice())
  const pending = Object.freeze(items.filter(item => item.bucket === 'pending'))
  const processed = Object.freeze(items.filter(item => item.bucket === 'processed'))
  return freezeSnapshot({
    actor,
    items,
    pending,
    processed,
    canWrite: false,
    readOnly: true,
    diagnostics: { scanned: source.records.length, accepted: items.length, skipped, actorError: null },
  })
}

export const getAdoptionReviewList = readAdoptionReviewList

/** Read one review item, or an applicant's own review detail. */
export function readAdoptionReviewDetail({ actorProvider, record, resolver, applicationId, reviewItemId, perspective, query, cloudParentPolicy } = {}) {
  void query
  const state = actorState(actorProvider)
  if (!state.actor) return freezeSnapshot({ actor: null, item: null, canRead: false, canWrite: false, readOnly: true, reason: state.error.code, diagnostics: { actorError: state.error } })
  const actor = state.actor
  let expectedApplicationId = ''
  let expectedReviewItemId = ''
  try {
    expectedApplicationId = applicationId === undefined ? '' : opaqueId(applicationId, 'applicationId')
    expectedReviewItemId = opaqueId(reviewItemId, 'reviewItemId')
  } catch (error) {
    const code = error && error.code ? error.code : 'INVALID_ID'
    return freezeSnapshot({
      actor,
      item: null,
      canRead: false,
      canWrite: false,
      readOnly: true,
      reason: code,
      diagnostics: { actorError: { code, ...(error && error.details ? error.details : {}) } },
    })
  }
  let source
  if (resolver !== undefined) {
    if (typeof resolver !== 'function') fail('INVALID_RESOLVER', 'adoption review detail resolver must be a function')
    try {
      source = resolver(Object.freeze({ actor, applicationId: expectedApplicationId, reviewItemId: expectedReviewItemId }))
    } catch (error) {
      return freezeSnapshot({ actor, item: null, canRead: false, canWrite: false, readOnly: true, reason: error && error.code ? error.code : 'RESOLVER_FAILED', diagnostics: { actorError: { code: error && error.code ? error.code : 'RESOLVER_FAILED' } } })
    }
    if (source && typeof source.then === 'function') {
      if (typeof source.catch === 'function') source.catch(() => {})
      return freezeSnapshot({ actor, item: null, canRead: false, canWrite: false, readOnly: true, reason: 'ASYNC_RESOLVER_UNSUPPORTED', diagnostics: { actorError: { code: 'ASYNC_RESOLVER_UNSUPPORTED' } } })
    }
  } else {
    source = record
  }
  if (!isPlainRecord(source)) return freezeSnapshot({ actor, item: null, canRead: false, canWrite: false, readOnly: true, reason: 'NOT_FOUND', diagnostics: { actorError: { code: 'NOT_FOUND' } } })
  try {
    const applicantRequested = perspective === 'applicant' || (perspective === undefined && actor.roles.includes('applicant') && !actor.roles.some(role => REVIEW_ROLES.includes(role)))
    const item = applicantRequested
      ? normalizeApplicantDetail(source, actor, { expectedApplicationId, expectedReviewItemId, cloudParentPolicy })
      : normalizeReviewRecord(source, actor, { expectedApplicationId, expectedReviewItemId, cloudParentPolicy })
    return freezeSnapshot({ actor, item, canRead: true, canWrite: false, readOnly: true, reason: '', diagnostics: { actorError: null } })
  } catch (error) {
    return freezeSnapshot({ actor, item: null, canRead: false, canWrite: false, readOnly: true, reason: error && error.code ? error.code : 'INVALID_RECORD', diagnostics: { actorError: { code: error && error.code ? error.code : 'INVALID_RECORD' } } })
  }
}

export const getAdoptionReviewDetail = readAdoptionReviewDetail
