/**
 * Pure deep-link contracts for messages, task summaries, and auth
 * continuation.
 *
 * A deep link carries a business type and stable IDs only.  The caller owns
 * storage and navigation; this module validates the target, re-reads through
 * an injected resolver, and returns a read model.  It never reads or writes
 * storage, navigates, submits, or treats an old status/role as authorization.
 */

import { buildRoute, parseRoute } from './routeContracts.ts'
import { resolveTrustedActor } from './actorCapabilities.ts'

type JsonRecord = Record<string, unknown>
export type DeepLinkSource = 'message' | 'task' | 'route'
export type DeepLinkBusinessType = 'adoption' | 'rescue' | 'feeding' | 'dynamic'
type BusinessType = DeepLinkBusinessType
type TargetKind = '' | 'progress'

interface DeepLinkTargetSpec {
  routeName: string
  businessIdParam: string | null
  reviewItemParam?: string
  businessTypeParam?: string
}

type DeepLinkTargetRegistry = Readonly<
  Record<BusinessType, Readonly<Record<string, DeepLinkTargetSpec>>>
>

export interface DeepLinkActor {
  id: string
  roles: readonly string[]
}

type TrustedActor = DeepLinkActor

interface ErrorInfo {
  code: string
  [key: string]: unknown
}

export interface DeepLinkEnvelope {
  source: DeepLinkSource
  businessType: BusinessType
  businessId?: string
  reviewItemId?: string
  targetKind?: 'progress'
  taskId?: string
  routeName: string
  url: string
}

export interface DeepLinkInput {
  source?: DeepLinkSource
  businessType: DeepLinkBusinessType
  businessId?: string | null
  reviewItemId?: string
  targetKind?: 'progress'
  taskId?: string
  routeName?: string
  url?: string
  legacyState?: string
  actorRole?: string
  outcome?: string
}

export interface DeepLinkAuthorizationContext {
  actor: DeepLinkActor | null
  target: DeepLinkEnvelope
  record: Readonly<Record<string, unknown>>
}

interface ResolverContext {
  actor: TrustedActor | null
  businessType: BusinessType
  businessId?: string
  reviewItemId?: string
}

type DeepLinkResolver = (context: Readonly<ResolverContext>) => unknown
export type DeepLinkAuthorizer = (context: Readonly<DeepLinkAuthorizationContext>) => unknown
type AuthBridge = (context: Readonly<{ target: DeepLinkEnvelope }>) => unknown

interface DeepLinkResolveOptions {
  actorProvider?: () => unknown
  resolver?: DeepLinkResolver
  readRecord?: DeepLinkResolver
  authorize?: DeepLinkAuthorizer
}

interface AuthRestoreOptions {
  authenticated?: boolean
  bridge?: AuthBridge
}

export interface DeepLinkResolution {
  status: 'empty' | 'ready'
  code: string
  actor: TrustedActor | null
  target: DeepLinkEnvelope
  record: JsonRecord | null
  canWrite: false
}

interface AuthRestoreResult {
  status: 'auth_required' | 'ready' | 'bridge_failed'
  code: string
  target: DeepLinkEnvelope
  canSubmit: false
}

interface ThenableWithCatch {
  then: (...args: unknown[]) => unknown
  catch?: (...args: unknown[]) => unknown
}

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
const DOMAIN_PREFIX_ALIASES: Readonly<Record<BusinessType, readonly string[]>> = Object.freeze({
  adoption: Object.freeze(['adoption', 'application']),
  rescue: Object.freeze(['rescue']),
  feeding: Object.freeze(['feeding', 'order']),
  dynamic: Object.freeze(['dynamic']),
})

export const DEEPLINK_SOURCES: readonly DeepLinkSource[] = Object.freeze([
  'message',
  'task',
  'route',
])
export const DEEPLINK_BUSINESS_TYPES: readonly BusinessType[] = Object.freeze([
  'adoption',
  'rescue',
  'feeding',
  'dynamic',
])

// These are the only detail targets that may be reached from a message/task
// envelope.  A route name is a checked semantic name, never a caller supplied
// arbitrary path.  Review targets require both the domain business ID and the
// review item ID in the envelope; the review item is never derived locally.
export const DEEPLINK_TARGETS: DeepLinkTargetRegistry = Object.freeze({
  adoption: Object.freeze({
    detail: Object.freeze({ routeName: 'adoption.progress', businessIdParam: 'applicationId' }),
    review: Object.freeze({
      routeName: 'adoption.jury.detail',
      businessIdParam: null,
      reviewItemParam: 'reviewItemId',
      businessTypeParam: 'businessType',
    }),
  }),
  rescue: Object.freeze({
    detail: Object.freeze({ routeName: 'rescue.detail', businessIdParam: 'rescueId' }),
    progress: Object.freeze({ routeName: 'rescue.progress', businessIdParam: 'rescueId' }),
    review: Object.freeze({
      routeName: 'rescue.review.detail',
      businessIdParam: null,
      reviewItemParam: 'reviewItemId',
      businessTypeParam: 'businessType',
    }),
  }),
  feeding: Object.freeze({
    detail: Object.freeze({ routeName: 'feeding.order.detail', businessIdParam: 'orderId' }),
  }),
  dynamic: Object.freeze({
    detail: Object.freeze({ routeName: 'dynamic.detail', businessIdParam: 'dynamicId' }),
  }),
})

const ID_FIELDS: Readonly<Record<BusinessType, readonly string[]>> = Object.freeze({
  adoption: Object.freeze(['applicationId', 'businessId']),
  rescue: Object.freeze(['rescueId', 'businessId']),
  feeding: Object.freeze(['orderId', 'businessId']),
  dynamic: Object.freeze(['dynamicId', 'businessId']),
})

export class DeepLinkContractError extends Error {
  readonly code: string
  readonly details: JsonRecord

  constructor(code: string, message: string, details: JsonRecord = {}) {
    super(message)
    this.name = 'DeepLinkContractError'
    this.code = code
    this.details = details
  }
}

function fail(code: string, message: string, details: JsonRecord = {}): never {
  throw new DeepLinkContractError(code, message, details)
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

function assertRecord(value: unknown, label: string): asserts value is JsonRecord {
  if (!isPlainRecord(value)) fail('INVALID_RECORD', `${label} must be a plain object`, { label })
  for (const key of Object.getOwnPropertyNames(value)) {
    if (DANGEROUS_KEYS.has(key)) fail('PROTOTYPE_KEY', `${label} contains a prototype key`, { key })
  }
  if (Object.getOwnPropertySymbols(value).length)
    fail('UNKNOWN_FIELD', `${label} cannot contain symbols`)
}

function assertAllowedFields(value: JsonRecord, allowed: ReadonlySet<string>, label: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail('UNKNOWN_FIELD', `Unknown ${label} field: ${key}`, { key })
  }
}

function opaqueId(
  value: unknown,
  label: string,
  {
    rejectDomainPrefix = true,
    domain = '',
  }: { rejectDomainPrefix?: boolean; domain?: BusinessType | '' } = {},
): string {
  if (typeof value !== 'string' || value.length === 0)
    fail('MISSING_ID', `${label} is required`, { label })
  if (value !== value.trim() || !SAFE_ID.test(value) || URL_MARKERS.test(value)) {
    fail('INVALID_ID', `${label} must be an opaque ID`, { label })
  }
  if (rejectDomainPrefix) {
    const lower = value.toLowerCase()
    const allowed: readonly string[] = domain === '' ? [] : DOMAIN_PREFIX_ALIASES[domain]
    const prefix = CROSS_DOMAIN_PREFIXES.find(
      (candidate) =>
        !allowed.includes(candidate) &&
        (lower === candidate ||
          lower.startsWith(`${candidate}-`) ||
          lower.startsWith(`${candidate}_`) ||
          lower.startsWith(`${candidate}:`)),
    )
    if (prefix)
      fail('CROSS_DOMAIN_ID', `${label} looks like a ${prefix} domain ID`, { label, prefix })
  }
  return value
}

function enumValue<T extends string>(value: unknown, label: string, values: readonly T[]): T {
  if (typeof value !== 'string' || !includesValue(values, value)) {
    fail('INVALID_ENUM', `${label} is not supported`, { label, values })
  }
  return value
}

function includesValue<T extends string>(values: readonly T[], value: string): value is T {
  return values.some((candidate) => candidate === value)
}

function errorCode(error: unknown, fallback: string): string {
  if (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
  )
    return error.code
  return fallback
}

function isThenable(value: unknown): value is ThenableWithCatch {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return false
  return 'then' in value && typeof value.then === 'function'
}

function targetFor(
  type: BusinessType,
  hasReview: boolean,
  targetKind: TargetKind = '',
): DeepLinkTargetSpec {
  const intent = hasReview ? 'review' : targetKind === 'progress' ? 'progress' : 'detail'
  const target = DEEPLINK_TARGETS[type] && DEEPLINK_TARGETS[type][intent]
  if (!target) fail('CROSS_DOMAIN_FIELD', `reviewItemId is not valid for ${type}`, { type })
  if (targetKind && targetKind !== 'progress')
    fail('INVALID_ENUM', 'targetKind is not supported', { targetKind })
  if (targetKind === 'progress' && type !== 'rescue')
    fail('CROSS_DOMAIN_FIELD', 'progress target is only valid for rescue', { type })
  return target
}

function targetByRoute(routeName: string): {
  type: BusinessType
  intent: string
  target: DeepLinkTargetSpec
} {
  for (const type of DEEPLINK_BUSINESS_TYPES) {
    for (const intent of Object.keys(DEEPLINK_TARGETS[type])) {
      const target = DEEPLINK_TARGETS[type][intent]
      if (target.routeName === routeName) return { type, intent, target }
    }
  }
  fail('UNKNOWN_DEEPLINK_TARGET', `Route is not an approved deep-link target: ${routeName}`, {
    routeName,
  })
}

function normalizedEnvelope(
  input: unknown,
  { sourceDefault = 'route' }: { sourceDefault?: DeepLinkSource } = {},
): DeepLinkEnvelope {
  assertRecord(input, 'deep-link envelope')
  assertAllowedFields(
    input,
    new Set([
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
    ]),
    'deep-link envelope',
  )

  const source =
    input.source === undefined ? sourceDefault : enumValue(input.source, 'source', DEEPLINK_SOURCES)
  const businessType = enumValue(input.businessType, 'businessType', DEEPLINK_BUSINESS_TYPES)
  const businessId =
    input.businessId === undefined || input.businessId === null
      ? ''
      : opaqueId(input.businessId, 'businessId', { domain: businessType })
  const reviewItemId =
    input.reviewItemId === undefined
      ? ''
      : opaqueId(input.reviewItemId, 'reviewItemId', { domain: businessType })
  const targetKind: TargetKind =
    input.targetKind === undefined ? '' : enumValue(input.targetKind, 'targetKind', ['progress'])
  if (!businessId && !reviewItemId) fail('MISSING_ID', 'businessId or reviewItemId is required')
  if (targetKind && reviewItemId)
    fail('CROSS_DOMAIN_FIELD', 'progress target cannot carry reviewItemId')
  const target = targetFor(businessType, Boolean(reviewItemId), targetKind)

  if (input.routeName !== undefined) {
    const routeNames = Object.values(DEEPLINK_TARGETS).flatMap((group) =>
      Object.values(group).map((item) => item.routeName),
    )
    enumValue(input.routeName, 'routeName', routeNames)
    if (input.routeName !== target.routeName)
      fail('TARGET_MISMATCH', 'routeName does not match businessType and reviewItemId', {
        expected: target.routeName,
      })
  }
  if (input.url !== undefined) {
    if (typeof input.url !== 'string') fail('INVALID_URL', 'url must be a string')
    const parsed = parseRoute(input.url)
    if (parsed.routeName !== target.routeName)
      fail('TARGET_MISMATCH', 'url does not match the deep-link target')
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

  const taskId =
    input.taskId === undefined
      ? undefined
      : opaqueId(input.taskId, 'taskId', { rejectDomainPrefix: false })
  const envelope: DeepLinkEnvelope = {
    source,
    businessType,
    ...(businessId ? { businessId } : {}),
    ...(reviewItemId ? { reviewItemId } : {}),
    ...(targetKind ? { targetKind } : {}),
    ...(taskId === undefined ? {} : { taskId }),
    routeName: target.routeName,
    url: buildRoute(target.routeName, {
      ...(target.businessIdParam && businessId ? { [target.businessIdParam]: businessId } : {}),
      ...(target.reviewItemParam ? { [target.reviewItemParam]: reviewItemId } : {}),
      ...(target.businessTypeParam ? { [target.businessTypeParam]: businessType } : {}),
    }),
  }
  return Object.freeze(envelope)
}

/**
 * Validate and build a stable app-relative target.  `legacyState`, role, and
 * outcome never affect the target, so an old message still reaches the
 * current detail after the resolver re-reads its state.
 */
export function createDeepLink(input: DeepLinkInput): DeepLinkEnvelope {
  return normalizedEnvelope(input, { sourceDefault: 'message' })
}

/** Validate untyped route/storage input before it crosses into a typed target. */
export function parseDeepLinkInput(input: unknown): DeepLinkEnvelope {
  return normalizedEnvelope(input, { sourceDefault: 'message' })
}

export const buildDeepLink = createDeepLink
export const createMessageDeepLink = createDeepLink
export function createTaskDeepLink(input: DeepLinkInput): DeepLinkEnvelope {
  assertRecord(input, 'task deep-link envelope')
  return createDeepLink({ ...input, source: 'task' })
}

/** Parse only an approved app-relative detail route. */
export function parseDeepLink(url: string): DeepLinkEnvelope {
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

function cloneFreeze(value: unknown, label: string, seen = new Set<object>()): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail('INVALID_RECORD', `${label} contains a non-finite number`)
    return value
  }
  if (value === undefined) return undefined
  if (typeof value !== 'object') fail('INVALID_RECORD', `${label} contains an unsupported value`)
  if (seen.has(value)) fail('INVALID_RECORD', `${label} contains a cycle`)
  seen.add(value)
  let copy: unknown
  if (Array.isArray(value)) {
    copy = value.map((item, index) => cloneFreeze(item, `${label}[${index}]`, seen))
  } else {
    assertRecord(value, label)
    const record: JsonRecord = {}
    copy = record
    for (const key of Object.keys(value))
      record[key] = cloneFreeze(value[key], `${label}.${key}`, seen)
  }
  seen.delete(value)
  return Object.freeze(copy)
}

interface IdentityTarget {
  businessId?: string
  reviewItemId?: string
  businessIdParam: string | null
  reviewItemParam?: string
}

function identityAliases(type: BusinessType, record: JsonRecord, target: IdentityTarget): void {
  for (const field of ['businessType', 'applicationType']) {
    if (
      own(record, field) &&
      record[field] !== undefined &&
      record[field] !== null &&
      record[field] !== type
    ) {
      fail('CROSS_DOMAIN_RECORD', `Resolver returned a ${record[field]} record for ${type}`)
    }
  }
  const values = []
  for (const field of ID_FIELDS[type]) {
    if (own(record, field) && record[field] !== undefined && record[field] !== null) {
      values.push({ field, id: opaqueId(record[field], `record.${field}`, { domain: type }) })
    }
  }
  if (!values.length)
    fail('RECORD_ID_MISSING', 'Resolver returned a record without its requested business ID')
  if (new Set(values.map((item) => item.id)).size > 1)
    fail('CONFLICTING_ID', 'Resolver returned conflicting business ID aliases')
  if (target.businessId && values[0].id !== target.businessId)
    fail('BUSINESS_ID_MISMATCH', 'Resolver returned another business record')
  if (target.reviewItemParam) {
    if (!own(record, 'reviewItemId'))
      fail('REVIEW_ITEM_ID_MISSING', 'Resolver returned no requested reviewItemId')
    if (
      opaqueId(record.reviewItemId, 'record.reviewItemId', { domain: type }) !== target.reviewItemId
    ) {
      fail('REVIEW_ITEM_ID_MISMATCH', 'Resolver returned another review item')
    }
  }
}

function isDeepLinkResolver(value: unknown): value is DeepLinkResolver {
  return typeof value === 'function'
}

function callResolver(
  resolver: unknown,
  context: ResolverContext,
): { record: unknown; error: ErrorInfo | null } {
  if (!isDeepLinkResolver(resolver)) return { record: null, error: { code: 'RESOLVER_REQUIRED' } }
  let result: unknown
  try {
    result = resolver(Object.freeze(context))
  } catch (error) {
    return { record: null, error: { code: errorCode(error, 'RESOLVER_FAILED') } }
  }
  if (isThenable(result)) {
    if (typeof result.catch === 'function') result.catch(() => undefined)
    return { record: null, error: { code: 'ASYNC_RESOLVER_UNSUPPORTED' } }
  }
  if (result === null || result === undefined) return { record: null, error: { code: 'NOT_FOUND' } }
  return { record: result, error: null }
}

function emptyResolution(
  target: DeepLinkEnvelope,
  code: string,
  actor: TrustedActor | null = null,
): DeepLinkResolution {
  return Object.freeze({ status: 'empty', code, actor, target, record: null, canWrite: false })
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

function isDeepLinkAuthorizer(value: unknown): value is DeepLinkAuthorizer {
  return typeof value === 'function'
}

function isExistingEnvelope(value: unknown): value is DeepLinkEnvelope {
  return (
    isPlainRecord(value) && typeof value.routeName === 'string' && typeof value.url === 'string'
  )
}

function isBridge(
  value: unknown,
): value is (context: Readonly<{ target: DeepLinkEnvelope }>) => unknown {
  return typeof value === 'function'
}

/**
 * Re-read current data for a link.  Resolver and authorize callbacks receive
 * stable IDs plus the trusted actor only.  Historical message state and route
 * query fields never reach them.  The function is read-only and synchronous.
 */
export function resolveDeepLink(
  input: DeepLinkInput | DeepLinkEnvelope,
  options: DeepLinkResolveOptions = {},
): DeepLinkResolution {
  const target = isExistingEnvelope(input) ? normalizedEnvelope(input) : createDeepLink(input)
  assertRecord(options, 'deep-link resolver options')
  assertAllowedFields(
    options,
    new Set(['actorProvider', 'resolver', 'readRecord', 'authorize']),
    'deep-link resolver options',
  )
  const resolver = options.resolver === undefined ? options.readRecord : options.resolver
  let actor: TrustedActor | null = null
  if (options.actorProvider !== undefined) {
    if (typeof options.actorProvider !== 'function')
      return emptyResolution(target, 'ACTOR_PROVIDER_REQUIRED')
    try {
      actor = normalizeActor(resolveTrustedActor(options.actorProvider))
    } catch (error) {
      return emptyResolution(target, errorCode(error, 'ACTOR_PROVIDER_FAILED'))
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
    const targetSpec = targetFor(
      target.businessType,
      target.reviewItemId !== undefined,
      target.targetKind,
    )
    identityAliases(target.businessType, response.record, { ...target, ...targetSpec })
    if (isDeepLinkAuthorizer(options.authorize)) {
      let allowed: unknown
      try {
        allowed = options.authorize(Object.freeze({ actor, target, record: response.record }))
      } catch {
        return emptyResolution(target, 'AUTHORIZATION_FAILED', actor)
      }
      if (allowed !== true) return emptyResolution(target, 'FORBIDDEN', actor)
    }
    const cloned = cloneFreeze(response.record, 'resolved deep-link record')
    if (!isPlainRecord(cloned)) return emptyResolution(target, 'INVALID_RECORD', actor)
    const record = cloned
    return Object.freeze({ status: 'ready', code: 'OK', actor, target, record, canWrite: false })
  } catch (error) {
    return emptyResolution(target, errorCode(error, 'INVALID_RECORD'), actor)
  }
}

export const resolveMessageDeepLink = resolveDeepLink
export const resolveTaskDeepLink = resolveDeepLink

/**
 * Restore a validated target after auth.  It may return a bridge result, but
 * has no submit callback and never replays the action that created the link.
 */
export function restoreAfterAuth(
  input: DeepLinkInput | DeepLinkEnvelope,
  options: AuthRestoreOptions = {},
): AuthRestoreResult {
  const target = isExistingEnvelope(input) ? normalizedEnvelope(input) : createDeepLink(input)
  assertRecord(options, 'auth restore options')
  assertAllowedFields(options, new Set(['authenticated', 'bridge']), 'auth restore options')
  if (options.authenticated !== true) {
    return Object.freeze({
      status: 'auth_required',
      code: 'AUTH_REQUIRED',
      target,
      canSubmit: false,
    })
  }
  if (options.bridge === undefined) {
    return Object.freeze({ status: 'ready', code: 'OK', target, canSubmit: false })
  }
  if (!isBridge(options.bridge)) {
    return Object.freeze({
      status: 'bridge_failed',
      code: 'BRIDGE_REQUIRED',
      target,
      canSubmit: false,
    })
  }
  let result: unknown
  try {
    result = options.bridge(Object.freeze({ target }))
  } catch {
    return Object.freeze({
      status: 'bridge_failed',
      code: 'BRIDGE_FAILED',
      target,
      canSubmit: false,
    })
  }
  if (isThenable(result)) {
    if (typeof result.catch === 'function') result.catch(() => undefined)
    return Object.freeze({
      status: 'bridge_failed',
      code: 'ASYNC_BRIDGE_UNSUPPORTED',
      target,
      canSubmit: false,
    })
  }
  if (result === false)
    return Object.freeze({
      status: 'bridge_failed',
      code: 'BRIDGE_REJECTED',
      target,
      canSubmit: false,
    })
  return Object.freeze({ status: 'ready', code: 'OK', target, canSubmit: false })
}

export const resumeAfterAuth = restoreAfterAuth
