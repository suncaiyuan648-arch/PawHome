/**
 * Package-local, read-only reader for the applicant's rescue list.
 *
 * The governance contract remains available from `services/domainReads` for
 * adapters and tests.  The page binding intentionally stays local so merely
 * registering the rescue subpackage cannot hoist the cross-domain contract
 * and actor policy into the 1.5 MiB main package.
 */

import { getRescueRecords } from '../../../utils/rescueStorage.js'

const STATUS_VALUES = Object.freeze(['platform_pending', 'platform_approved', 'platform_rejected'])
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const EMPTY = Object.freeze([])

function id(value) {
  return typeof value === 'string' && value === value.trim() && ID_PATTERN.test(value) && !URL_MARKERS.test(value)
    ? value
    : ''
}

function actorOf(provider) {
  if (typeof provider !== 'function') return { actor: null, error: 'ACTOR_PROVIDER_REQUIRED' }
  let supplied
  try { supplied = provider() } catch (error) { return { actor: null, error: 'ACTOR_PROVIDER_FAILED' } }
  const actor = supplied && typeof supplied === 'object' && !Array.isArray(supplied) && supplied.actor
    ? supplied.actor
    : supplied
  if (!actor || typeof actor !== 'object' || Array.isArray(actor)) return { actor: null, error: 'NO_ACTOR' }
  const actorId = id(actor.id || actor.actorId)
  const roles = Array.isArray(actor.roles) ? actor.roles : actor.role ? [actor.role] : []
  if (!actorId || !roles.includes('applicant')) return { actor: null, error: actorId ? 'ACTOR_ROLE_REQUIRED' : 'INVALID_ACTOR' }
  return { actor: Object.freeze({ id: actorId, roles: Object.freeze(roles.filter(value => typeof value === 'string')) }), error: null }
}

function sameAlias(record, fields, label) {
  const values = []
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(record, field)) continue
    const value = id(record[field])
    if (!value) return { value: '', error: `INVALID_${label}` }
    values.push(value)
  }
  if (values.some(value => value !== values[0])) return { value: '', error: `CONFLICTING_${label}` }
  return { value: values[0] || '', error: null }
}

function applicantIds(record) {
  const values = []
  for (const value of [record.applicantId, record.applicantUserId, record.userId]) {
    const normalized = id(value)
    if (value !== undefined && value !== null && !normalized) return { values: [], error: 'INVALID_APPLICANT_ID' }
    if (normalized && !values.includes(normalized)) values.push(normalized)
  }
  const applicant = record.applicant
  if (applicant && typeof applicant === 'object' && !Array.isArray(applicant)) {
    for (const value of [applicant.id, applicant.pawId]) {
      const normalized = id(value)
      if (value !== undefined && value !== null && !normalized) return { values: [], error: 'INVALID_APPLICANT_ID' }
      if (normalized && !values.includes(normalized)) values.push(normalized)
    }
  }
  return { values, error: null }
}

function project(record, actorId) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return { item: null, error: 'INVALID_RECORD' }
  const rescue = sameAlias(record, ['rescueId', 'id'], 'RESCUE_ID')
  if (rescue.error || !rescue.value || /^demo(?:[-_:]|$)/i.test(rescue.value)) return { item: null, error: rescue.error || 'INVALID_RESCUE_ID' }
  const applicants = applicantIds(record)
  if (applicants.error) return { item: null, error: applicants.error }
  if (!applicants.values.includes(actorId)) return { item: null, error: null }
  const status = sameAlias(record, ['applicationStatus'], 'APPLICATION_STATUS')
  if (status.error || !STATUS_VALUES.includes(status.value)) return { item: null, error: status.error || 'INVALID_MINE_STATUS' }
  return {
    item: Object.freeze({
      rescueId: rescue.value,
      applicationStatus: status.value,
      status: status.value,
      ...(typeof record.summary === 'string' ? { summary: record.summary } : {}),
      ...(typeof record.description === 'string' ? { description: record.description } : {}),
      ...(record.createdAt !== undefined && (typeof record.createdAt === 'string' || typeof record.createdAt === 'number') ? { createdAt: record.createdAt } : {}),
    }),
    error: null,
  }
}

export function readRescueMinePage({ actorProvider, filter = 'all' } = {}) {
  if (!['all', ...STATUS_VALUES].includes(filter)) throw Object.assign(new Error('unsupported rescue mine status filter'), { code: 'INVALID_STATUS_FILTER' })
  const { actor, error: actorError } = actorOf(actorProvider)
  if (!actor) return Object.freeze({ actor: null, items: EMPTY, pending: EMPTY, processed: EMPTY, readOnly: true, canWrite: false, diagnostics: Object.freeze({ scanned: 0, accepted: 0, skipped: EMPTY, actorError: Object.freeze({ code: actorError }) }) })
  let records
  try { records = getRescueRecords({ includeDemo: false }) } catch (error) { records = [] }
  if (!Array.isArray(records)) records = []
  const skipped = []
  const items = []
  records.forEach((record, index) => {
    const result = project(record, actor.id)
    if (result.error) skipped.push(Object.freeze({ index, code: result.error }))
    if (result.item && (filter === 'all' || result.item.applicationStatus === filter)) items.push(result.item)
  })
  const frozenItems = Object.freeze(items)
  return Object.freeze({
    actor,
    items: frozenItems,
    pending: Object.freeze(frozenItems.filter(item => item.applicationStatus === 'platform_pending')),
    processed: Object.freeze(frozenItems.filter(item => item.applicationStatus !== 'platform_pending')),
    readOnly: true,
    canWrite: false,
    diagnostics: Object.freeze({ scanned: records.length, accepted: frozenItems.length, skipped: Object.freeze(skipped), actorError: null }),
  })
}
