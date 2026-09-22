/**
 * Package-local runtime for account.tasks.
 *
 * The cross-domain task contracts remain in `navigation/` for governance and
 * non-UI consumers.  A WeChat subpackage must not pull those root modules (or
 * the complete adoption/rescue storage adapters) into the main package just
 * because the task page is registered.  This small binding therefore reads
 * the two persisted task sources it owns and emits the same canonical shape.
 * It is deliberately read-only and fail-closed; feeding/dynamic use their
 * persisted keys when present and keep an explicit diagnostic when absent.
 */

const ADOPTION_KEY = 'PAWHOME_ADOPTIONS'
const RESCUE_KEY = 'PAWHOME_RESCUES'
const FEEDING_KEY = 'PAWHOME_FEEDING_ORDERS'
const DYNAMIC_KEY = 'PAWHOME_DYNAMIC_RECORDS'
const DOMAINS = Object.freeze(['adoption', 'rescue', 'feeding', 'dynamic'])
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const REVIEW_ROLES = Object.freeze(['owner', 'cloud_parent', 'reviewer'])

const ADOPTION_STAGES = Object.freeze({
  cloud_pending: ['apply', 'pending'], pending: ['apply', 'pending'],
  pickup: ['confirm', 'pending'], owner_confirm: ['confirm', 'in_progress'],
  owner_confirm_pending: ['confirm', 'in_progress'], jury_confirm: ['confirm', 'in_progress'],
  jury_confirm_pending: ['confirm', 'in_progress'], adoption_confirmed: ['claim_reward', 'pending'],
  reward: ['claim_reward', 'pending'], reward_done: ['claim_reward', 'completed'],
  rejected: ['apply', 'failed'], cloud_rejected: ['apply', 'failed'], abandoned: ['apply', 'cancelled'],
})
const RESCUE_STAGES = Object.freeze({
  platform_pending: ['apply', 'pending'], platform_approved: ['fund', 'pending'], platform_rejected: ['apply', 'failed'],
})

function frozen(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value
  seen.add(value)
  for (const key of Reflect.ownKeys(value)) frozen(value[key], seen)
  return Object.freeze(value)
}

function diagnostic(domain, index, code) {
  return { domain, index: Number.isSafeInteger(index) ? index : -1, code: code || 'READER_FAILED' }
}

function actorFromSession() {
  let raw
  try { raw = typeof uni !== 'undefined' && uni && typeof uni.getStorageSync === 'function' ? uni.getStorageSync('PAWHOME_ACTOR_SESSION') : null } catch (error) { raw = null }
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) && raw.actor ? raw.actor : raw
  if (!source || typeof source !== 'object' || Array.isArray(source)) return { actor: null, error: { code: 'NO_ACTOR' } }
  const id = typeof source.id === 'string' ? source.id : typeof source.actorId === 'string' ? source.actorId : ''
  const roles = Array.isArray(source.roles) ? source.roles.filter(role => typeof role === 'string') : null
  if (!id || id !== id.trim() || !SAFE_ID.test(id) || URL_MARKERS.test(id) || !roles) return { actor: null, error: { code: 'INVALID_ACTOR' } }
  return { actor: frozen({ id, roles: roles.slice() }), error: null }
}

function readArray(key) {
  let raw
  try { raw = uni.getStorageSync(key) } catch (error) { return { value: [], error: 'STORAGE_READ_FAILED' } }
  if (raw === undefined || raw === null || raw === '') return { value: [], error: null }
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(value) ? { value, error: null } : { value: [], error: 'INVALID_STORAGE' }
  } catch (error) { return { value: [], error: 'INVALID_STORAGE' }
  }
}

function opaque(value) {
  return typeof value === 'string' && value && value === value.trim() && SAFE_ID.test(value) && !URL_MARKERS.test(value)
}

function taskId(item) {
  const review = item.reviewItemId ? `|review:${item.reviewItemId}` : ''
  return `task:${item.businessType}:${item.businessId}:${item.actionType}:${item.actorId}${review}`
}

function makeTask(input) {
  if (!DOMAINS.includes(input.businessType) || !opaque(input.businessId) || !opaque(input.actorId)) return null
  if (!opaque(input.actionType) || !opaque(input.status) || !opaque(input.actorRole)) return null
  if (input.reviewItemId !== undefined && !opaque(input.reviewItemId)) return null
  return frozen({
    taskId: taskId(input), businessType: input.businessType, businessId: input.businessId,
    actorId: input.actorId, actorRole: input.actorRole, actionType: input.actionType,
    status: input.status, ...(input.reviewItemId ? { reviewItemId: input.reviewItemId } : {}),
  })
}

function relationValues(sources, fields) {
  const sets = []
  let malformed = false
  for (const source of sources) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) continue
    for (const field of fields) {
      if (!Object.prototype.hasOwnProperty.call(source, field)) continue
      const value = source[field]
      // Persisted records from the earlier mock sometimes carry an explicit
      // undefined/null compatibility alias.  It is absent for identity
      // purposes; a non-scalar value is malformed and must never authorize a
      // task through one of the other aliases.
      if (value === undefined || value === null || value === '') continue
      if (Array.isArray(value)) {
        if (!value.length) { malformed = true; continue }
        const current = []
        for (const item of value) {
          if (typeof item !== 'string' || !item.trim()) { malformed = true; continue }
          current.push(item.trim())
        }
        if (current.length) sets.push(Array.from(new Set(current)).sort())
        continue
      }
      if (typeof value !== 'string' || !value.trim()) {
        malformed = true
        continue
      }
      sets.push([value.trim()])
    }
  }
  const unique = Array.from(new Set(sets.flat()))
  const first = sets[0] ? JSON.stringify(sets[0]) : ''
  const conflict = sets.some(set => JSON.stringify(set) !== first)
  return { values: unique, value: unique.length === 1 ? unique[0] : '', conflict, malformed }
}

function scalarRelation(record, fields, nestedFields = []) {
  const top = relationValues([record], fields)
  const nested = record && record.applicant && typeof record.applicant === 'object' && !Array.isArray(record.applicant)
    ? relationValues([record.applicant], nestedFields)
    : { values: [], value: '', conflict: false, malformed: false }
  const values = Array.from(new Set([...top.values, ...nested.values]))
  return {
    values,
    value: values.length === 1 ? values[0] : '',
    conflict: top.conflict || nested.conflict || values.length > 1,
    malformed: top.malformed || nested.malformed,
  }
}

function actorOwns(record, actorId) {
  const relation = scalarRelation(record, ['applicantId', 'applicantUserId', 'userId'], ['id', 'pawId'])
  if (relation.conflict || relation.malformed) return { owned: false, invalid: true }
  return { owned: relation.value === actorId, invalid: false }
}

function actorCanReviewRole(actor, role) {
  if (role === 'owner') return actor.roles.includes('owner') || actor.roles.includes('yard_owner')
  return actor.roles.includes(role)
}

function validNestedReview(record) {
  if (!Object.prototype.hasOwnProperty.call(record, 'review')) return { review: null, invalid: false }
  const value = record.review
  if (value === undefined || value === null) return { review: null, invalid: false }
  if (typeof value !== 'object' || Array.isArray(value)) return { review: null, invalid: true }
  return { review: value, invalid: false }
}

function reviewerRelation(record) {
  const review = record.review && typeof record.review === 'object' && !Array.isArray(record.review) ? record.review : null
  const sources = [record, review].filter(Boolean)
  const reviewer = relationValues(sources, ['reviewerId', 'reviewerIds'])
  const owner = relationValues(sources, ['ownerId', 'ownerPawId', 'ownerUserId'])
  const cloud = relationValues(sources, ['cloudParentId', 'cloudParentPawId', 'cloudOwnerId', 'cloudParentIds'])
  const role = typeof (review && review.reviewerRole || record.reviewerRole) === 'string'
    ? String(review && review.reviewerRole || record.reviewerRole).trim()
    : ''
  if (reviewer.malformed || owner.malformed || cloud.malformed || reviewer.conflict || owner.conflict || cloud.conflict) {
    return { role: '', ids: [], invalid: true }
  }
  const normalizedRole = ['owner', 'cloud_parent', 'reviewer'].includes(role) ? role : 'reviewer'
  const roleRelation = normalizedRole === 'owner' ? owner : normalizedRole === 'cloud_parent' ? cloud : reviewer
  // When both the generic reviewer relation and a role-specific relation are
  // present, they must describe the same review actor set.  Do not let a
  // matching alias in one field win over a conflicting alias in another.
  if (reviewer.values.length && roleRelation.values.length
    && JSON.stringify(reviewer.values.slice().sort()) !== JSON.stringify(roleRelation.values.slice().sort())) {
    return { role: '', ids: [], invalid: true }
  }
  const ids = roleRelation.values.length ? roleRelation.values : reviewer.values
  return { role: normalizedRole, ids, invalid: false }
}

function hasConflictingAliases(record, groups) {
  return groups.some(group => {
    const sources = group && !Array.isArray(group) && Array.isArray(group.sources) ? group.sources : [record]
    const fields = group && !Array.isArray(group) && Array.isArray(group.fields) ? group.fields : group
    const relation = relationValues(sources, fields)
    return relation.conflict || relation.malformed
  })
}

function rejectConflictingRecord(record, domain, index, diagnostics, groups) {
  if (!hasConflictingAliases(record, groups)) return false
  diagnostics.push(diagnostic(domain, index, 'CONFLICTING_RECORD'))
  return true
}

function adoptionTasks(records, actor, diagnostics) {
  if (!actor.roles.includes('applicant') && !REVIEW_ROLES.some(role => actorCanReviewRole(actor, role))) return []
  const items = []
  records.forEach((record, index) => {
    if (!record || typeof record !== 'object' || Array.isArray(record)) { diagnostics.push(diagnostic('adoption', index, 'INVALID_RECORD')); return }
    const nested = validNestedReview(record)
    if (nested.invalid) { diagnostics.push(diagnostic('adoption', index, 'INVALID_REVIEW')); return }
    const review = nested.review
    if (rejectConflictingRecord(record, 'adoption', index, diagnostics, [
      ['id', 'recordId', 'applicationId'],
      ['status', 'applicationStatus'],
      { sources: [record], fields: ['applicantId', 'applicantUserId', 'userId'] },
      { sources: [record, review], fields: ['reviewItemId'] },
      { sources: [record, review], fields: ['reviewerId', 'reviewerIds'] },
      { sources: [record, review], fields: ['ownerId', 'ownerPawId', 'ownerUserId'] },
      { sources: [record, review], fields: ['cloudParentId', 'cloudParentPawId', 'cloudOwnerId', 'cloudParentIds'] },
    ])) return
    const id = typeof (record.applicationId || record.id) === 'string' ? (record.applicationId || record.id) : ''
    if (!opaque(id) || /^demo(?:[-_:]|$)/i.test(id)) { diagnostics.push(diagnostic('adoption', index, 'INVALID_ID')); return }
    const ownership = actorOwns(record, actor.id)
    if (ownership.invalid) { diagnostics.push(diagnostic('adoption', index, 'CONFLICTING_RECORD')); return }
    if (actor.roles.includes('applicant') && ownership.owned) {
      const stage = ADOPTION_STAGES[record.status]
      if (stage) { const item = makeTask({ businessType: 'adoption', businessId: id, actorId: actor.id, actorRole: 'applicant', actionType: stage[0], status: stage[1] }); if (item) items.push(item) }
      else diagnostics.push(diagnostic('adoption', index, 'UNKNOWN_APPLICATION_STATUS'))
    }
    const reviewer = reviewerRelation(record)
    const reviewerRole = reviewer.invalid || !review ? '' : reviewer.ids.includes(actor.id) ? reviewer.role : ''
    if (review && reviewer.invalid) { diagnostics.push(diagnostic('adoption', index, 'CONFLICTING_REVIEWER_RELATION')); return }
    if (review && reviewerRole && actorCanReviewRole(actor, reviewerRole)) {
      const reviewId = typeof (review.reviewItemId || record.reviewItemId) === 'string' ? (review.reviewItemId || record.reviewItemId) : ''
      const status = review.status === 'pending' ? 'pending' : ['approved', 'rejected', 'processed'].includes(review.status) ? 'processed' : ''
      const item = status && opaque(reviewId) ? makeTask({ businessType: 'adoption', businessId: id, actorId: actor.id, actorRole: reviewerRole, actionType: 'review', status, reviewItemId: reviewId }) : null
      if (item) items.push(item)
      else diagnostics.push(diagnostic('adoption', index, 'INVALID_REVIEW'))
    }
  })
  return items
}

function rescueTasks(records, actor, diagnostics) {
  const items = []
  records.forEach((record, index) => {
    if (!record || typeof record !== 'object' || Array.isArray(record)) { diagnostics.push(diagnostic('rescue', index, 'INVALID_RECORD')); return }
    const nested = validNestedReview(record)
    if (nested.invalid) { diagnostics.push(diagnostic('rescue', index, 'INVALID_REVIEW')); return }
    const review = nested.review
    if (rejectConflictingRecord(record, 'rescue', index, diagnostics, [
      ['id', 'rescueId'],
      { sources: [record], fields: ['applicantId', 'applicantUserId', 'userId'] },
      { sources: [record, review], fields: ['reviewItemId'] },
      { sources: [record, review], fields: ['reviewerId', 'reviewerIds'] },
    ])) return
    const id = typeof (record.rescueId || record.id) === 'string' ? (record.rescueId || record.id) : ''
    if (!opaque(id) || /^demo(?:[-_:]|$)/i.test(id)) { diagnostics.push(diagnostic('rescue', index, 'INVALID_ID')); return }
    const ownership = actorOwns(record, actor.id)
    if (ownership.invalid) { diagnostics.push(diagnostic('rescue', index, 'CONFLICTING_RECORD')); return }
    const isApplicant = actor.roles.includes('applicant') && ownership.owned
    const stage = RESCUE_STAGES[record.applicationStatus]
    if (isApplicant && stage) {
      const item = makeTask({ businessType: 'rescue', businessId: id, actorId: actor.id, actorRole: 'applicant', actionType: stage[0], status: stage[1] })
      if (item) items.push(item)
    } else if (isApplicant && !stage) diagnostics.push(diagnostic('rescue', index, 'UNKNOWN_APPLICATION_STATUS'))
    const relation = reviewerRelation(record)
    if (relation.invalid) { diagnostics.push(diagnostic('rescue', index, 'CONFLICTING_REVIEWER_RELATION')); return }
    if (actor.roles.includes('reviewer') && relation.ids.includes(actor.id)) {
      const reviewId = typeof (record.reviewItemId || (review && review.reviewItemId)) === 'string' ? (record.reviewItemId || review.reviewItemId) : ''
      const reviewStatus = rescueReviewStatus(record, review)
      const status = reviewStatus === 'pending' ? 'pending' : ['approved', 'rejected', 'processed'].includes(reviewStatus) ? 'processed' : ''
      const item = status && opaque(reviewId) ? makeTask({ businessType: 'rescue', businessId: id, actorId: actor.id, actorRole: 'reviewer', actionType: 'review', status, reviewItemId: reviewId }) : null
      if (item) items.push(item)
    }
  })
  return items
}

function rescueReviewStatus(record, review) {
  const values = []
  let malformed = false
  const add = (source, field) => {
    if (!source || !Object.prototype.hasOwnProperty.call(source, field)) return
    const value = source[field]
    // Explicit undefined is the compatibility shape written by older local
    // rescue fixtures.  Other empty/non-scalar values are not an alias and
    // must not allow a different status field to authorize a task.
    if (value === undefined) return
    if (typeof value !== 'string' || !value.trim()) { malformed = true; return }
    values.push(value.trim())
  }
  add(record, 'reviewStatus')
  add(record, 'voteStatus')
  add(review, 'status')
  add(review, 'reviewStatus')
  add(review, 'voteStatus')
  if (Object.prototype.hasOwnProperty.call(record, 'status') && record.status !== undefined) {
    const value = typeof record.status === 'string' ? record.status.trim() : ''
    if (['pending', 'approved', 'rejected'].includes(value)) values.push(value)
    else if (!['unpaid', 'paid', 'funding_pending', 'funding_failed', 'funding_paid'].includes(value)) malformed = true
  }
  const unique = Array.from(new Set(values))
  if (malformed || unique.length > 1) return ''
  return unique[0] || ''
}

function feedingTasks(records, actor, diagnostics) {
  const items = []
  records.forEach((record, index) => {
    if (!record || typeof record !== 'object' || Array.isArray(record)) { diagnostics.push(diagnostic('feeding', index, 'INVALID_RECORD')); return }
    if (rejectConflictingRecord(record, 'feeding', index, diagnostics, [['id', 'orderId'], ['userId', 'userPawId', 'donorId'], ['yardOwnerId', 'ownerPawId'], ['animalId', 'petId']])) return
    const id = typeof (record.orderId || record.id) === 'string' ? (record.orderId || record.id) : ''
    if (!opaque(id) || /^demo(?:[-_:]|$)/i.test(id)) { diagnostics.push(diagnostic('feeding', index, 'INVALID_ID')); return }
    const donorRelation = relationValues([record], ['userId', 'userPawId', 'donorId'])
    const managerRelation = relationValues([record], ['yardOwnerId', 'ownerPawId'])
    if (donorRelation.malformed || managerRelation.malformed) { diagnostics.push(diagnostic('feeding', index, 'CONFLICTING_RECORD')); return }
    const isDonor = actor.roles.includes('applicant') && donorRelation.values.length === 1 && donorRelation.values[0] === actor.id
    const isManager = (actor.roles.includes('yard_owner') || actor.roles.includes('owner') || actor.roles.includes('fulfillment_manager'))
      && managerRelation.values.length === 1 && managerRelation.values[0] === actor.id
    if (!isDonor && !isManager) return
    const actorRole = isManager ? 'owner' : 'applicant'
    const status = record.feedbackStatus || record.status || record.stateKey
    const normalized = ['completed', 'fulfilled', 'processed', 'done'].includes(status) ? 'completed'
      : ['active', 'in_progress', 'shipping', 'delivered'].includes(status) ? 'in_progress' : 'pending'
    const item = makeTask({ businessType: 'feeding', businessId: id, actorId: actor.id, actorRole, actionType: isManager ? 'fulfill' : 'feedback', status: normalized })
    if (item) items.push(item)
  })
  return items
}

function dynamicTasks(records, actor, diagnostics) {
  const items = []
  records.forEach((record, index) => {
    if (!record || typeof record !== 'object' || Array.isArray(record)) { diagnostics.push(diagnostic('dynamic', index, 'INVALID_RECORD')); return }
    if (rejectConflictingRecord(record, 'dynamic', index, diagnostics, [['id', 'dynamicId'], ['authorId', 'userId', 'userPawId', 'ownerId'], ['status', 'state']])) return
    const id = typeof (record.dynamicId || record.id) === 'string' ? (record.dynamicId || record.id) : ''
    if (!opaque(id) || /^demo(?:[-_:]|$)/i.test(id)) { diagnostics.push(diagnostic('dynamic', index, 'INVALID_ID')); return }
    const authorRelation = relationValues([record], ['authorId', 'userId', 'userPawId', 'ownerId'])
    if (authorRelation.malformed) { diagnostics.push(diagnostic('dynamic', index, 'CONFLICTING_RECORD')); return }
    const owner = authorRelation.values.length === 1 && authorRelation.values[0] === actor.id
    if (!owner) return
    const status = record.status || record.state
    const normalized = ['published', 'completed', 'processed', 'deleted'].includes(status) ? 'completed'
      : ['draft', 'pending', 'review'].includes(status) ? 'pending' : 'in_progress'
    const item = makeTask({ businessType: 'dynamic', businessId: id, actorId: actor.id, actorRole: 'author', actionType: 'publish', status: normalized })
    if (item) items.push(item)
  })
  return items
}

function readDomain(key, domain, diagnostics) {
  let raw
  try { raw = uni.getStorageSync(key) } catch (error) { diagnostics.push(diagnostic(domain, -1, 'STORAGE_READ_FAILED')); return { value: [], present: true } }
  if (raw === undefined || raw === null || raw === '') return { value: [], present: false }
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(value)) { diagnostics.push(diagnostic(domain, -1, 'INVALID_STORAGE')); return { value: [], present: true } }
    return { value, present: true }
  } catch (error) { diagnostics.push(diagnostic(domain, -1, 'INVALID_STORAGE')); return { value: [], present: true } }
}

function immutableTaskIdentity(item) {
  return [
    item.businessType,
    item.businessId,
    item.actorId,
    item.actionType,
    item.reviewItemId || '',
  ].join('\u0000')
}

function isProcessed(item) {
  return !['pending', 'in_progress'].includes(item.status)
}

/**
 * Refreshes must collapse identical task snapshots.  A different business
 * identity under one taskId is ambiguous, so discard that task entirely
 * instead of letting the first storage row win.
 */
function dedupeTasks(items, diagnostics) {
  const byTaskId = new Map()
  const identityByTaskId = new Map()
  const conflicted = new Set()
  for (const item of items) {
    if (conflicted.has(item.taskId)) continue
    const previous = byTaskId.get(item.taskId)
    if (!previous) {
      byTaskId.set(item.taskId, item)
      identityByTaskId.set(item.taskId, immutableTaskIdentity(item))
      continue
    }
    if (identityByTaskId.get(item.taskId) !== immutableTaskIdentity(item)) {
      byTaskId.delete(item.taskId)
      identityByTaskId.delete(item.taskId)
      conflicted.add(item.taskId)
      diagnostics.push(diagnostic(item.businessType, -1, 'DUPLICATE_CONFLICT'))
      continue
    }
    if (!isProcessed(previous) && isProcessed(item)) byTaskId.set(item.taskId, item)
  }
  return Array.from(byTaskId.values())
}

export function readAccountTasks() {
  const resolved = actorFromSession()
  if (!resolved.actor) return frozen({ actor: null, all: [], pending: [], processed: [], diagnostics: { scanned: 0, accepted: 0, skipped: [], actorError: resolved.error }, readOnly: true, canWrite: false })
  const diagnostics = []
  const adoption = readArray(ADOPTION_KEY)
  const rescue = readArray(RESCUE_KEY)
  if (adoption.error) diagnostics.push(diagnostic('adoption', -1, adoption.error))
  if (rescue.error) diagnostics.push(diagnostic('rescue', -1, rescue.error))
  const feeding = readDomain(FEEDING_KEY, 'feeding', diagnostics)
  const dynamic = readDomain(DYNAMIC_KEY, 'dynamic', diagnostics)
  if (!feeding.present) diagnostics.push(diagnostic('feeding', -1, 'READER_MISSING'))
  if (!dynamic.present) diagnostics.push(diagnostic('dynamic', -1, 'READER_MISSING'))
  const all = [
    ...adoptionTasks(adoption.value, resolved.actor, diagnostics),
    ...rescueTasks(rescue.value, resolved.actor, diagnostics),
    ...feedingTasks(feeding.value, resolved.actor, diagnostics),
    ...dynamicTasks(dynamic.value, resolved.actor, diagnostics),
  ]
  const deduped = dedupeTasks(all, diagnostics)
  const pending = deduped.filter(item => ['pending', 'in_progress'].includes(item.status))
  const processed = deduped.filter(item => !['pending', 'in_progress'].includes(item.status))
  return frozen({ actor: resolved.actor, all: deduped, pending, processed, diagnostics: { scanned: all.length, accepted: deduped.length, skipped: diagnostics, actorError: null }, readOnly: true, canWrite: false })
}

export const readTasks = readAccountTasks
