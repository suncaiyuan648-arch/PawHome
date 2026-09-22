/**
 * Pure deep-link contracts for messages, task summaries, and auth
 * continuation.
 *
 * A deep link carries a business type and stable IDs only.  The caller owns
 * storage and navigation; this module validates the target, re-reads through
 * an injected resolver, and returns a read model.  It never reads or writes
 * storage, navigates, submits, or treats an old status/role as authorization.
 */

import {
  buildRoute,
  parseRoute,
} from './routeContracts.js'
import { resolveTrustedActor } from './actorCapabilities.js'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const CROSS_DOMAIN_PREFIXES = Object.freeze([
  'adoption',
  'rescue',
  'feeding',
  'order',
  'dynamic',
  'yard',
  'animal',
])
const DOMAIN_PREFIX_ALIASES = Object.freeze({
  adoption: Object.freeze(['adoption', 'application']),
  rescue: Object.freeze(['rescue']),
  feeding: Object.freeze(['feeding', 'order']),
  dynamic: Object.freeze(['dynamic']),
})

export const DEEPLINK_SOURCES = Object.freeze(['message', 'task', 'route'])
export const DEEPLINK_BUSINESS_TYPES = Object.freeze(['adoption', 'rescue', 'feeding', 'dynamic'])

// These are the only detail targets that may be reached from a message/task
// envelope.  A route name is a checked semantic name, never a caller supplied
// arbitrary path.  Review targets require both the domain business ID and the
// review item ID in the envelope; the review item is never derived locally.
export const DEEPLINK_TARGETS = Object.freeze({
  adoption: Object.freeze({
    detail: Object.freeze({ routeName: 'adoption.progress', businessIdParam: 'applicationId' }),
    review: Object.freeze({ routeName: 'adoption.jury.detail', businessIdParam: null, reviewItemParam: 'reviewItemId', businessTypeParam: 'businessType' }),
  }),
  rescue: Object.freeze({
    detail: Object.freeze({ routeName: 'rescue.detail', businessIdParam: 'rescueId' }),
    progress: Object.freeze({ routeName: 'rescue.progress', businessIdParam: 'rescueId' }),
    review: Object.freeze({ routeName: 'rescue.review.detail', businessIdParam: null, reviewItemParam: 'reviewItemId', businessTypeParam: 'businessType' }),
  }),
  feeding: Object.freeze({
    detail: Object.freeze({ routeName: 'feeding.order.detail', businessIdParam: 'orderId' }),
  }),
  dynamic: Object.freeze({
    detail: Object.freeze({ routeName: 'dynamic.detail', businessIdParam: 'dynamicId' }),
  }),
})

const ID_FIELDS = Object.freeze({
  adoption: Object.freeze(['applicationId', 'businessId']),
  rescue: Object.freeze(['rescueId', 'businessId']),
  feeding: Object.freeze(['orderId', 'businessId']),
  dynamic: Object.freeze(['dynamicId', 'businessId']),
})

export class DeepLinkContractError extends Error {
  constructor(code, message, details) {
    super(message)
    this.name = 'DeepLinkContractError'
    this.code = code
    this.details = details || {}
  }
}

function fail(code, message, details) {
  throw new DeepLinkContractError(code, message, details)
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

function assertRecord(value, label) {
  if (!isPlainRecord(value)) fail('INVALID_RECORD', `${label} must be a plain object`, { label })
  for (const key of Object.getOwnPropertyNames(value)) {
    if (DANGEROUS_KEYS.has(key)) fail('PROTOTYPE_KEY', `${label} contains a prototype key`, { key })
  }
  if (Object.getOwnPropertySymbols(value).length) fail('UNKNOWN_FIELD', `${label} cannot contain symbols`)
}

function assertAllowedFields(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail('UNKNOWN_FIELD', `Unknown ${label} field: ${key}`, { key })
  }
}

function opaqueId(value, label, { rejectDomainPrefix = true, domain = '' } = {}) {
  if (typeof value !== 'string' || value.length === 0) fail('MISSING_ID', `${label} is required`, { label })
  if (value !== value.trim() || !SAFE_ID.test(value) || URL_MARKERS.test(value)) {
    fail('INVALID_ID', `${label} must be an opaque ID`, { label })
  }
  if (rejectDomainPrefix) {
    const lower = value.toLowerCase()
    const allowed = DOMAIN_PREFIX_ALIASES[domain] || (domain ? [domain] : [])
    const prefix = CROSS_DOMAIN_PREFIXES.find(candidate => !allowed.includes(candidate) && (
      lower === candidate
      || lower.startsWith(`${candidate}-`)
      || lower.startsWith(`${candidate}_`)
      || lower.startsWith(`${candidate}:`)
    ))
    if (prefix) fail('CROSS_DOMAIN_ID', `${label} looks like a ${prefix} domain ID`, { label, prefix })
  }
  return value
}

function enumValue(value, label, values) {
  if (typeof value !== 'string' || !values.includes(value)) {
    fail('INVALID_ENUM', `${label} is not supported`, { label, values })
  }
  return value
}

function targetFor(type, hasReview, targetKind = '') {
  const intent = hasReview ? 'review' : targetKind === 'progress' ? 'progress' : 'detail'
  const target = DEEPLINK_TARGETS[type] && DEEPLINK_TARGETS[type][intent]
  if (!target) fail('CROSS_DOMAIN_FIELD', `reviewItemId is not valid for ${type}`, { type })
  if (targetKind && targetKind !== 'progress') fail('INVALID_ENUM', 'targetKind is not supported', { targetKind })
  if (targetKind === 'progress' && type !== 'rescue') fail('CROSS_DOMAIN_FIELD', 'progress target is only valid for rescue', { type })
  return target
}

function targetByRoute(routeName) {
  for (const type of DEEPLINK_BUSINESS_TYPES) {
    for (const intent of Object.keys(DEEPLINK_TARGETS[type])) {
      const target = DEEPLINK_TARGETS[type][intent]
      if (target.routeName === routeName) return { type, intent, target }
    }
  }
  fail('UNKNOWN_DEEPLINK_TARGET', `Route is not an approved deep-link target: ${routeName}`, { routeName })
}

function normalizedEnvelope(input, { sourceDefault = 'route' } = {}) {
  assertRecord(input, 'deep-link envelope')
  assertAllowedFields(input, new Set([
    'source',
    'businessType',
    'businessId',
    'reviewItemId',
    'targetKind',
    'routeName',
    'url',
    'taskId',
    'legacyState',
    'actorRole',
    'outcome',
  ]), 'deep-link envelope')

  const source = input.source === undefined ? sourceDefault : enumValue(input.source, 'source', DEEPLINK_SOURCES)
  const businessType = enumValue(input.businessType, 'businessType', DEEPLINK_BUSINESS_TYPES)
  const businessId = input.businessId === undefined || input.businessId === null
    ? ''
    : opaqueId(input.businessId, 'businessId', { domain: businessType })
  const reviewItemId = input.reviewItemId === undefined ? '' : opaqueId(input.reviewItemId, 'reviewItemId', { domain: businessType })
  const targetKind = input.targetKind === undefined ? '' : enumValue(input.targetKind, 'targetKind', ['progress'])
  if (!businessId && !reviewItemId) fail('MISSING_ID', 'businessId or reviewItemId is required')
  if (targetKind && reviewItemId) fail('CROSS_DOMAIN_FIELD', 'progress target cannot carry reviewItemId')
  const target = targetFor(businessType, Boolean(reviewItemId), targetKind)

  if (input.routeName !== undefined) {
    enumValue(input.routeName, 'routeName', Object.values(DEEPLINK_TARGETS).flatMap(group => Object.values(group).map(item => item.routeName)))
    if (input.routeName !== target.routeName) fail('TARGET_MISMATCH', 'routeName does not match businessType and reviewItemId', { expected: target.routeName })
  }
  if (input.url !== undefined) {
    if (typeof input.url !== 'string') fail('INVALID_URL', 'url must be a string')
    const parsed = parseRoute(input.url)
    if (parsed.routeName !== target.routeName) fail('TARGET_MISMATCH', 'url does not match the deep-link target')
    if (target.businessIdParam && parsed.params[target.businessIdParam] !== businessId) {
      fail('BUSINESS_ID_MISMATCH', 'url business ID does not match envelope')
    }
    if (target.reviewItemParam && parsed.params[target.reviewItemParam] !== reviewItemId) {
      fail('REVIEW_ITEM_ID_MISMATCH', 'url reviewItemId does not match envelope')
    }
    if (target.businessTypeParam && parsed.params[target.businessTypeParam] !== businessType) {
      fail('BUSINESS_TYPE_MISMATCH', 'url businessType does not match envelope')
    }
  }
  if (input.taskId !== undefined) opaqueId(input.taskId, 'taskId', { rejectDomainPrefix: false })

  // legacyState, actorRole, and outcome are historical/presentation hints.
  // They are intentionally validated only as ignored scalar text, if present;
  // none is copied into the canonical target or consulted for authorization.
  for (const key of ['legacyState', 'actorRole', 'outcome']) {
    if (input[key] !== undefined && (typeof input[key] !== 'string' || input[key].length > 128)) {
      fail('INVALID_CONTEXT', `${key} must be a short scalar hint`, { key })
    }
  }

  return Object.freeze({
    source,
    businessType,
    ...(businessId ? { businessId } : {}),
    ...(reviewItemId ? { reviewItemId } : {}),
    ...(targetKind ? { targetKind } : {}),
    ...(input.taskId === undefined ? {} : { taskId: input.taskId }),
    routeName: target.routeName,
    url: buildRoute(target.routeName, {
      ...(target.businessIdParam && businessId ? { [target.businessIdParam]: businessId } : {}),
      ...(target.reviewItemParam ? { [target.reviewItemParam]: reviewItemId } : {}),
      ...(target.businessTypeParam ? { [target.businessTypeParam]: businessType } : {}),
    }),
  })
}

/**
 * Validate and build a stable app-relative target.  `legacyState`, role, and
 * outcome never affect the target, so an old message still reaches the
 * current detail after the resolver re-reads its state.
 */
export function createDeepLink(input) {
  return normalizedEnvelope(input, { sourceDefault: 'message' })
}

export const buildDeepLink = createDeepLink
export const createMessageDeepLink = createDeepLink
export const createTaskDeepLink = input => createDeepLink({ ...input, source: 'task' })

/** Parse only an approved app-relative detail route. */
export function parseDeepLink(url) {
  const parsed = parseRoute(url)
  const match = targetByRoute(parsed.routeName)
  const target = match.target
  const businessId = target.businessIdParam ? parsed.params[target.businessIdParam] : undefined
  const reviewItemId = target.reviewItemParam ? parsed.params[target.reviewItemParam] : undefined
  return normalizedEnvelope({
    source: 'route',
    businessType: match.type,
    ...(businessId === undefined ? {} : { businessId }),
    ...(reviewItemId === undefined ? {} : { reviewItemId }),
    ...(match.intent === 'progress' ? { targetKind: 'progress' } : {}),
    routeName: parsed.routeName,
    url,
  })
}

function cloneFreeze(value, label, seen = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail('INVALID_RECORD', `${label} contains a non-finite number`)
    return value
  }
  if (value === undefined) return undefined
  if (typeof value !== 'object') fail('INVALID_RECORD', `${label} contains an unsupported value`)
  if (seen.has(value)) fail('INVALID_RECORD', `${label} contains a cycle`)
  seen.add(value)
  let copy
  if (Array.isArray(value)) {
    copy = value.map((item, index) => cloneFreeze(item, `${label}[${index}]`, seen))
  } else {
    assertRecord(value, label)
    copy = {}
    for (const key of Object.keys(value)) copy[key] = cloneFreeze(value[key], `${label}.${key}`, seen)
  }
  seen.delete(value)
  return Object.freeze(copy)
}

function identityAliases(type, record, target) {
  for (const field of ['businessType', 'applicationType']) {
    if (own(record, field) && record[field] !== undefined && record[field] !== null && record[field] !== type) {
      fail('CROSS_DOMAIN_RECORD', `Resolver returned a ${record[field]} record for ${type}`)
    }
  }
  const values = []
  for (const field of ID_FIELDS[type]) {
    if (own(record, field) && record[field] !== undefined && record[field] !== null) {
      values.push({ field, id: opaqueId(record[field], `record.${field}`, { domain: type }) })
    }
  }
  if (!values.length) fail('RECORD_ID_MISSING', 'Resolver returned a record without its requested business ID')
  if (new Set(values.map(item => item.id)).size > 1) fail('CONFLICTING_ID', 'Resolver returned conflicting business ID aliases')
  if (target.businessId && values[0].id !== target.businessId) fail('BUSINESS_ID_MISMATCH', 'Resolver returned another business record')
  if (target.reviewItemParam) {
    if (!own(record, 'reviewItemId')) fail('REVIEW_ITEM_ID_MISSING', 'Resolver returned no requested reviewItemId')
    if (opaqueId(record.reviewItemId, 'record.reviewItemId', { domain: type }) !== target.reviewItemId) {
      fail('REVIEW_ITEM_ID_MISMATCH', 'Resolver returned another review item')
    }
  }
}

function callResolver(resolver, context) {
  if (typeof resolver !== 'function') return { record: null, error: { code: 'RESOLVER_REQUIRED' } }
  let result
  try {
    result = resolver(Object.freeze(context))
  } catch (error) {
    return { record: null, error: { code: error && error.code ? error.code : 'RESOLVER_FAILED' } }
  }
  if (result && typeof result.then === 'function') {
    if (typeof result.catch === 'function') result.catch(() => {})
    return { record: null, error: { code: 'ASYNC_RESOLVER_UNSUPPORTED' } }
  }
  if (result === null || result === undefined) return { record: null, error: { code: 'NOT_FOUND' } }
  return { record: result, error: null }
}

function emptyResolution(target, code, actor = null) {
  return Object.freeze({ status: 'empty', code, actor, target, record: null, canWrite: false })
}

/**
 * Re-read current data for a link.  Resolver and authorize callbacks receive
 * stable IDs plus the trusted actor only.  Historical message state and route
 * query fields never reach them.  The function is read-only and synchronous.
 */
export function resolveDeepLink(input, options = {}) {
  const target = input && input.routeName && input.url
    ? normalizedEnvelope(input)
    : createDeepLink(input)
  assertRecord(options, 'deep-link resolver options')
  assertAllowedFields(options, new Set(['actorProvider', 'resolver', 'readRecord', 'authorize']), 'deep-link resolver options')
  const resolver = options.resolver === undefined ? options.readRecord : options.resolver
  let actor = null
  if (options.actorProvider !== undefined) {
    if (typeof options.actorProvider !== 'function') return emptyResolution(target, 'ACTOR_PROVIDER_REQUIRED')
    try {
      actor = resolveTrustedActor(options.actorProvider)
    } catch (error) {
      return emptyResolution(target, error.code || 'ACTOR_PROVIDER_FAILED')
    }
    if (!actor && target.source === 'task') return emptyResolution(target, 'AUTH_REQUIRED')
  }
  if (target.source === 'task' && !actor) return emptyResolution(target, 'AUTH_REQUIRED')

  const response = callResolver(resolver, {
    actor,
    businessType: target.businessType,
    ...(target.businessId ? { businessId: target.businessId } : {}),
    ...(target.reviewItemId === undefined ? {} : { reviewItemId: target.reviewItemId }),
  })
  if (response.error) return emptyResolution(target, response.error.code, actor)
  try {
    assertRecord(response.record, 'resolved deep-link record')
    const targetSpec = targetFor(target.businessType, target.reviewItemId !== undefined, target.targetKind)
    identityAliases(target.businessType, response.record, { ...target, ...targetSpec })
    if (typeof options.authorize === 'function') {
      let allowed
      try {
        allowed = options.authorize(Object.freeze({ actor, target, record: response.record }))
      } catch (error) {
        return emptyResolution(target, 'AUTHORIZATION_FAILED', actor)
      }
      if (allowed !== true) return emptyResolution(target, 'FORBIDDEN', actor)
    }
    const record = cloneFreeze(response.record, 'resolved deep-link record')
    return Object.freeze({ status: 'ready', code: 'OK', actor, target, record, canWrite: false })
  } catch (error) {
    return emptyResolution(target, error.code || 'INVALID_RECORD', actor)
  }
}

export const resolveMessageDeepLink = resolveDeepLink
export const resolveTaskDeepLink = resolveDeepLink

/**
 * Restore a validated target after auth.  It may return a bridge result, but
 * has no submit callback and never replays the action that created the link.
 */
export function restoreAfterAuth(input, options = {}) {
  const target = input && input.routeName && input.url
    ? normalizedEnvelope(input)
    : createDeepLink(input)
  assertRecord(options, 'auth restore options')
  assertAllowedFields(options, new Set(['authenticated', 'bridge']), 'auth restore options')
  if (options.authenticated !== true) {
    return Object.freeze({ status: 'auth_required', code: 'AUTH_REQUIRED', target, canSubmit: false })
  }
  if (options.bridge === undefined) {
    return Object.freeze({ status: 'ready', code: 'OK', target, canSubmit: false })
  }
  if (typeof options.bridge !== 'function') {
    return Object.freeze({ status: 'bridge_failed', code: 'BRIDGE_REQUIRED', target, canSubmit: false })
  }
  let result
  try {
    result = options.bridge(Object.freeze({ target }))
  } catch (error) {
    return Object.freeze({ status: 'bridge_failed', code: 'BRIDGE_FAILED', target, canSubmit: false })
  }
  if (result && typeof result.then === 'function') {
    if (typeof result.catch === 'function') result.catch(() => {})
    return Object.freeze({ status: 'bridge_failed', code: 'ASYNC_BRIDGE_UNSUPPORTED', target, canSubmit: false })
  }
  if (result === false) return Object.freeze({ status: 'bridge_failed', code: 'BRIDGE_REJECTED', target, canSubmit: false })
  return Object.freeze({ status: 'ready', code: 'OK', target, canSubmit: false })
}

export const resumeAfterAuth = restoreAfterAuth
