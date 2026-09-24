/**
 * Pure target-route contracts for the route-governance migration.
 *
 * This module deliberately has no Vue/uni-app/package imports.  The target
 * registry is a semantic contract; a route is considered usable by the
 * navigation wrapper only when the caller injects an active registration.
 */

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const SAFE_ROUTE_PATH = /^\/(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+$/
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

export type RouteNavigation = 'navigateTo' | 'switchTab'
export type QueryParams = Record<string, string>
export type SelectorKind = 'address' | 'region' | 'animal'

interface RouteFieldSpec {
  kind: 'id' | 'idList' | 'text' | 'enum'
  maxItems?: number
  maxLength?: number
  values?: readonly string[]
}

interface RouteDefinition {
  path: string
  params: Readonly<Record<string, RouteFieldSpec>>
  required: readonly string[]
  navigation: RouteNavigation
  tab: boolean
  fallbackOnly: boolean
}

export interface ParsedRoute {
  routeName: string
  path: string
  navigation: RouteNavigation
  params: Readonly<QueryParams>
}

export interface ActiveRouteEntry {
  path?: unknown
  [key: string]: unknown
}

export type ActiveRouteRegistry =
  | readonly (string | ActiveRouteEntry)[]
  | Map<string, unknown>
  | Record<string, unknown>

export interface RouteNavigatorApi {
  navigateTo?: (options: { url: string }) => unknown
  switchTab?: (options: { url: string }) => unknown
}

export interface NavigateRouteOptions {
  registeredRoutes?: ActiveRouteRegistry
  uniApi?: RouteNavigatorApi
}

interface SelectorContract {
  input: string
  output: string
  bridge: 'eventChannel'
  autoRedirect: false
}

export interface SelectorRequest {
  kind: SelectorKind
  requestId: string
  bridge: 'eventChannel'
  autoRedirect: false
}

export interface SelectorResponse {
  requestId: string
  bridge: 'eventChannel'
  autoRedirect: false
}

class RouteContractError extends Error {
  code: string
  details: Record<string, unknown>

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'RouteContractError'
    this.code = code
    this.details = details || {}
  }
}

function fail(code: string, message: string, details?: Record<string, unknown>): never {
  throw new RouteContractError(code, message, details)
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  if (proto === Object.prototype || proto === null) return true
  // WeChat's native onLoad options can cross a JS realm boundary in DevTools.
  // Its Object.prototype is not identical to ours, but still has a null
  // prototype and the ordinary Object tag. Class instances remain rejected.
  const constructorDescriptor = Object.getOwnPropertyDescriptor(proto, 'constructor')
  return Boolean(Object.getPrototypeOf(proto) === null
    && Object.prototype.toString.call(value) === '[object Object]'
    && constructorDescriptor
    && typeof constructorDescriptor.value === 'function'
    && constructorDescriptor.value.name === 'Object')
}

function assertPlainRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!isPlainRecord(value)) {
    fail('INVALID_QUERY_VALUE', `${label} must be a plain object`, { label })
  }
}

function assertSafeKey(key: string, label: string): void {
  if (DANGEROUS_KEYS.has(key)) {
    fail('PROTOTYPE_KEY', `${label} contains a prototype key`, { key })
  }
}

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0)
    if ((code >= 0 && code <= 0x1f) || code === 0x7f) return true
  }
  return false
}

function assertString(
  value: unknown,
  label: string,
  { allowEmpty = false, maxLength = 1024 }: { allowEmpty?: boolean; maxLength?: number } = {},
): string {
  if (typeof value !== 'string') {
    fail('INVALID_QUERY_VALUE', `${label} must be a string`, { label })
  }
  if (!allowEmpty && value.length === 0) {
    fail('MISSING_VALUE', `${label} must not be empty`, { label })
  }
  if (value.length > maxLength) {
    fail('VALUE_TOO_LONG', `${label} is too long`, { label, maxLength })
  }
  // encodeURIComponent throws for an unpaired surrogate.  Turn that runtime
  // error into a stable contract error instead.
  try {
    encodeURIComponent(value)
  } catch {
    fail('INVALID_UNICODE', `${label} contains invalid Unicode`, { label })
  }
  if (hasControlCharacter(value)) {
    fail('INVALID_VALUE', `${label} contains a control character`, { label })
  }
  return value
}

function assertId(value: unknown, label: string): string {
  const text = assertString(value, label, { maxLength: 128 })
  if (!SAFE_ID.test(text)) {
    fail('INVALID_ID', `${label} must match the restricted ID format`, { label })
  }
  return text
}

function assertEnum(value: unknown, label: string, values: readonly string[]): string {
  const text = assertString(value, label, { maxLength: 128 })
  if (!values.includes(text)) {
    fail('INVALID_ENUM', `${label} must be one of: ${values.join(', ')}`, { label, values })
  }
  return text
}

function assertIdList(value: unknown, label: string, options?: Pick<RouteFieldSpec, 'maxItems'>): string {
  const text = assertString(value, label, { maxLength: 6 * 129 })
  const items = text.split(',')
  if (!items.length || items.length > ((options && options.maxItems) || 6) || items.some((item) => !SAFE_ID.test(item))) {
    fail('INVALID_ID_LIST', `${label} must be a comma-separated list of at most ${(options && options.maxItems) || 6} IDs`, { label })
  }
  if (new Set(items).size !== items.length) fail('DUPLICATE_ID', `${label} must not repeat an ID`, { label })
  return text
}

function assertText(value: unknown, label: string, options?: Pick<RouteFieldSpec, 'maxLength'>): string {
  return assertString(value, label, { maxLength: (options && options.maxLength) || 512 })
}

function field(kind: RouteFieldSpec['kind'], options: Record<string, unknown> = {}): RouteFieldSpec {
  return Object.freeze({ kind, ...(options || {}) })
}

const F = Object.freeze({
  id: (): RouteFieldSpec => field('id'),
  idList: (options?: Pick<RouteFieldSpec, 'maxItems'>): RouteFieldSpec => field('idList', { maxItems: 6, ...(options || {}) }),
  text: (options?: Pick<RouteFieldSpec, 'maxLength'>): RouteFieldSpec => field('text', options),
  enum: (values: readonly string[]): RouteFieldSpec => field('enum', { values: Object.freeze(values.slice()) }),
})

function route(
  path: string,
  params: Record<string, RouteFieldSpec> = {},
  options?: { required?: readonly string[]; navigation?: RouteNavigation; tab?: boolean; fallbackOnly?: boolean },
): RouteDefinition {
  if (!SAFE_ROUTE_PATH.test(path)) {
    throw new Error(`Invalid target path: ${path}`)
  }
  return Object.freeze({
    path,
    params: Object.freeze({ ...(params || {}) }),
    required: Object.freeze((options && options.required ? options.required : []).slice()),
    navigation: (options && options.navigation) || 'navigateTo',
    tab: Boolean(options && options.tab),
    fallbackOnly: Boolean(options && options.fallbackOnly),
  })
}

/**
 * Semantic target paths from the route migration matrix (06).  Four tabs keep
 * their existing paths.  animal-picker is represented only as a fallback
 * contract and is intentionally not active by default.
 */
const ROUTE_REGISTRY: Readonly<Record<string, RouteDefinition>> = Object.freeze({
  'tab.home': route('/pages/index/index', {}, { navigation: 'switchTab', tab: true }),
  'tab.selfRun': route('/pages/selfRun/index', {}, { navigation: 'switchTab', tab: true }),
  'tab.message': route('/pages/message/index', {}, { navigation: 'switchTab', tab: true }),
  'tab.me': route('/pages/me/index', {}, { navigation: 'switchTab', tab: true }),

  'account.settings': route('/packages/account/pages/settings/index'),
  'account.tasks': route('/packages/account/pages/tasks/index'),
  'account.history': route('/packages/account/pages/history/index', {
    entityType: F.enum(['dynamic', 'yard', 'user']),
  }),
  'account.level': route('/packages/account/pages/level/index'),
  'account.level.rules': route('/packages/account/pages/level/rules/index'),
  'account.annualReport': route('/packages/account/pages/annual-report/index'),
  'account.helpedAnimals': route('/packages/account/pages/helped-animals/index'),
  'account.profile': route('/packages/account/pages/profile/index', { userId: F.id() }, { required: ['userId'] }),
  'account.profile.edit': route('/packages/account/pages/profile/editor/index', { userId: F.id() }, { required: ['userId'] }),
  'account.relations': route('/packages/account/pages/relations/index', {
    userId: F.id(),
    tab: F.enum(['following', 'followers']),
  }),
  'account.invite': route('/packages/account/pages/invite/index'),
  'account.medals': route('/packages/account/pages/medals/index'),
  'account.medals.map': route('/packages/account/pages/medals/map/index'),
  'account.medals.achievement': route('/packages/account/pages/medals/achievement/index'),

  'address.list': route('/packages/address/pages/list/index', {
    kind: F.enum(['shipping', 'service']),
    intent: F.enum(['manage', 'select']),
    addressId: F.id(),
    requestId: F.id(),
  }),
  'address.editor': route('/packages/address/pages/editor/index', {
    kind: F.enum(['shipping', 'service']),
    addressId: F.id(),
    requestId: F.id(),
  }),
  'address.regionPicker': route('/packages/address/pages/region-picker/index', {
    requestId: F.id(),
  }),

  'adoption.mine': route('/packages/adoption/pages/mine/index'),
  'adoption.apply': route('/packages/adoption/pages/apply/index', {
    yardId: F.id(),
    animalIds: F.idList(),
  }, { required: ['yardId'] }),
  'adoption.result': route('/packages/adoption/pages/result/index', {
    applicationId: F.id(),
    outcome: F.enum([
      'reward-claimed',
      'review-approved',
      'adoption-confirmed-by-owner',
      'review-rejected',
      'confirmation-submitted',
      'application-submitted',
    ]),
    orderId: F.id(),
    nextMode: F.enum([
      'cloudAgreeWaiting', 'cloudAgreeDone', 'ownerPending', 'ownerConfirmed',
      'ownerConfirmRejected', 'confirmAgree', 'confirmReject', 'rejectDone', 'success',
    ]),
    reviewerRole: F.enum(['owner', 'cloud_parent']),
    reviewerId: F.id(),
  }, { required: ['applicationId', 'outcome'] }),
  'adoption.progress': route('/packages/adoption/pages/progress/index', {
    applicationId: F.id(),
    view: F.enum(['adoption-info', 'application']),
  }, { required: ['applicationId'] }),
  'adoption.confirmation': route('/packages/adoption/pages/confirmation/index', {
    applicationId: F.id(),
  }, { required: ['applicationId'] }),
  'adoption.support': route('/packages/adoption/pages/support/index'),
  'adoption.quota': route('/packages/adoption/pages/quota/index'),
  'adoption.quota.detail': route('/packages/adoption/pages/quota/detail/index', {
    quotaId: F.id(),
  }, { required: ['quotaId'] }),
  'adoption.review.list': route('/packages/adoption/pages/review/list/index'),
  'adoption.review.detail': route('/packages/adoption/pages/review/detail/index', {
    applicationId: F.id(),
    reviewItemId: F.id(),
    view: F.enum(['info', 'application']),
    mode: F.enum([
      'cloudReview', 'cloudAgreeWaiting', 'cloudAgreeDone', 'cloudRejectDone',
      'ownerReview', 'ownerPending', 'ownerConfirm', 'ownerConfirmed',
      'ownerConfirmRejected', 'confirmAgree', 'confirmReject', 'rejectDone', 'success',
    ]),
    reviewerRole: F.enum(['owner', 'cloud_parent']),
    reviewerId: F.id(),
  }, { required: ['applicationId'] }),
  'adoption.jury.detail': route('/packages/adoption/pages/jury/detail/index', {
    reviewItemId: F.id(),
    businessType: F.enum(['adoption']),
  }, { required: ['reviewItemId', 'businessType'] }),
  'adoption.reward.claim': route('/packages/adoption/pages/reward/claim/index', {
    applicationId: F.id(),
    addressId: F.id(),
  }, { required: ['applicationId'] }),
  // This route is a contract for an independently invoked selector only; it
  // is not active in the target registry used by default.
  'adoption.animal-picker': route('/packages/adoption/pages/animal-picker/index', {
    requestId: F.id(),
    yardId: F.id(),
  }, { required: ['requestId', 'yardId'], fallbackOnly: true }),

  'rescue.apply': route('/packages/rescue/pages/apply/index'),
  'rescue.result': route('/packages/rescue/pages/result/index', {
    rescueId: F.id(),
    outcome: F.enum(['application-submitted']),
  }, { required: ['rescueId', 'outcome'] }),
  'rescue.progress': route('/packages/rescue/pages/progress/index', {
    rescueId: F.id(),
  }, { required: ['rescueId'] }),
  'rescue.fund': route('/packages/rescue/pages/fund/index'),
  'rescue.detail': route('/packages/rescue/pages/detail/index', {
    rescueId: F.id(),
  }, { required: ['rescueId'] }),
  'rescue.mine': route('/packages/rescue/pages/mine/index'),
  'rescue.proof.list': route('/packages/rescue/pages/proof/list/index', {
    rescueId: F.id(),
  }, { required: ['rescueId'] }),
  'rescue.proof.create': route('/packages/rescue/pages/proof/create/index', {
    rescueId: F.id(),
  }, { required: ['rescueId'] }),
  'rescue.review.detail': route('/packages/rescue/pages/review/detail/index', {
    reviewItemId: F.id(),
    businessType: F.enum(['rescue']),
  }, { required: ['reviewItemId', 'businessType'] }),
  'rescue.review.list': route('/packages/rescue/pages/review/list/index'),

  'animal.detail': route('/packages/animal/pages/detail/index', {
    animalId: F.id(),
    yardId: F.id(),
  }, { required: ['animalId'] }),
  'animal.editor': route('/packages/animal/pages/editor/index', {
    animalId: F.id(),
    yardId: F.id(),
    species: F.enum(['cat', 'dog']),
  }, { required: ['yardId'] }),
  'animal.breedPicker': route('/packages/animal/pages/breed-picker/index', {
    species: F.enum(['cat', 'dog']),
    requestId: F.id(),
  }),
  'animal.mine': route('/packages/animal/pages/mine/index', { userId: F.id() }, { required: ['userId'] }),
  'animal.sponsored': route('/packages/animal/pages/sponsored/index', {
    userId: F.id(),
    animalId: F.id(),
  }, { required: ['userId'] }),
  'animal.album': route('/packages/animal/pages/album/index', {
    animalId: F.id(),
    yardId: F.id(),
  }, { required: ['animalId'] }),

  'yard.detail': route('/packages/yard/pages/detail/index', { yardId: F.id() }, { required: ['yardId'] }),
  'yard.editor': route('/packages/yard/pages/editor/index', { yardId: F.id() }, { required: ['yardId'] }),
  'yard.animals': route('/packages/yard/pages/animals/index', {
    yardId: F.id(),
    view: F.enum(['roster', 'status', 'long-list']),
  }, { required: ['yardId'] }),
  'yard.manage.animals': route('/packages/yard/pages/manage/animals/index', { yardId: F.id() }, { required: ['yardId'] }),
  'yard.onboarding': route('/packages/yard/pages/onboarding/index'),
  'yard.create': route('/packages/yard/pages/create/index', { requestId: F.id() }),
  'yard.certification': route('/packages/yard/pages/certification/index', { yardId: F.id() }, { required: ['yardId'] }),

  'jury.queue': route('/packages/jury/pages/queue/index', {
    businessType: F.enum(['adoption', 'rescue']),
  }),

  'feeding.mine': route('/packages/feeding/pages/mine/index', { userId: F.id() }),
  'feeding.yardOrders': route('/packages/feeding/pages/yard-orders/index', { yardId: F.id() }),
  'feeding.order.detail': route('/packages/feeding/pages/order/detail/index', {
    orderId: F.id(),
    perspective: F.enum(['donor', 'yard-manager']),
  }, { required: ['orderId'] }),
  'feeding.result': route('/packages/feeding/pages/result/index', {
    orderId: F.id(),
    dynamicId: F.id(),
    outcome: F.enum(['feedback-published', 'feeding-completed']),
  }, { required: ['orderId', 'outcome'] }),

  'dynamic.detail': route('/packages/dynamic/pages/deep-link/index', { dynamicId: F.id() }, { required: ['dynamicId'] }),
  'dynamic.editor': route('/packages/dynamic/pages/editor/index', {
    yardId: F.id(),
    animalId: F.id(),
    orderId: F.id(),
    scene: F.enum(['post', 'feeding-feedback']),
    state: F.enum(['alternate', 'select-order', 'feeding']),
  }),
  'dynamic.result': route('/packages/dynamic/pages/result/index', {
    dynamicId: F.id(),
    outcome: F.enum(['published']),
  }, { required: ['dynamicId', 'outcome'] }),

  'discovery.cityPicker': route('/packages/discovery/pages/city-picker/index', { requestId: F.id(), current: F.text({ maxLength: 64 }) }),
  'discovery.search': route('/packages/discovery/pages/search/index', {
    q: F.text({ maxLength: 200 }),
    scope: F.enum(['dynamic', 'yard', 'user']),
    state: F.enum(['dynamic', 'yard', 'user', 'empty', 'idle_delete', 'deleting']),
    popup: F.enum(['delete']),
  }),
  'discovery.ranking': route('/packages/discovery/pages/ranking/index'),
  'message.list': route('/packages/message/pages/list/index', {
    category: F.enum(['service', 'interaction', 'activity', 'order', 'system', 'pet']),
    messageId: F.id(),
  }),

  'auth.realName': route('/packages/auth/pages/real-name/index'),
  'auth.verificationResult': route('/packages/auth/pages/verification-result/index', {
    outcome: F.enum(['success', 'failure']),
  }, { required: ['outcome'] }),
  'auth.login': route('/packages/auth/pages/login/index', { requestId: F.id() }),
  'auth.phoneBind': route('/packages/auth/pages/phone-bind/index', { requestId: F.id() }),
  'auth.smsVerify': route('/packages/auth/pages/sms-verify/index', { requestId: F.id() }),
})

const PATH_TO_ROUTE: Readonly<Record<string, string>> = Object.freeze(Object.keys(ROUTE_REGISTRY).reduce<Record<string, string>>((result, name) => {
  const path = ROUTE_REGISTRY[name].path
  if (result[path]) throw new Error(`Duplicate target route path: ${path}`)
  result[path] = name
  return result
}, Object.create(null) as Record<string, string>))

const ROUTE_NAMES: Readonly<Record<string, string>> = Object.freeze(Object.keys(ROUTE_REGISTRY).reduce<Record<string, string>>((result, name) => {
  const key = name.replace(/[^A-Za-z0-9]+(.)/g, (_, char) => char.toUpperCase())
  result[key] = name
  return result
}, {}))

function validateField(value: unknown, fieldSpec: RouteFieldSpec, label: string): string {
  if (fieldSpec.kind === 'id') return assertId(value, label)
  if (fieldSpec.kind === 'idList') return assertIdList(value, label, fieldSpec)
  if (fieldSpec.kind === 'enum') return assertEnum(value, label, fieldSpec.values || [])
  return assertText(value, label, fieldSpec)
}

function validateParams(routeName: string, params: unknown): QueryParams {
  assertPlainRecord(params, 'params')
  const definition = ROUTE_REGISTRY[routeName]
  if (!definition) fail('UNKNOWN_ROUTE', `Unknown target route: ${routeName}`, { routeName })

  for (const key of definition.required) {
    if (!Object.prototype.hasOwnProperty.call(params, key)) {
      fail('MISSING_PARAMETER', `${key} is required for ${routeName}`, { routeName, key })
    }
  }

  for (const key of Object.keys(params)) {
    assertSafeKey(key, 'params')
    if (!Object.prototype.hasOwnProperty.call(definition.params, key)) {
      fail('UNKNOWN_PARAMETER', `Unknown parameter "${key}" for ${routeName}`, { routeName, key })
    }
    if (params[key] === undefined) {
      fail('INVALID_QUERY_VALUE', `${key} must not be undefined`, { key })
    }
    validateField(params[key], definition.params[key], key)
  }
  if (routeName === 'address.list' && params.intent === 'select' && !Object.prototype.hasOwnProperty.call(params, 'requestId')) {
    fail('MISSING_PARAMETER', 'requestId is required when address.list intent is select', { routeName, key: 'requestId' })
  }
  if (routeName === 'dynamic.editor' && params.scene === 'feeding-feedback' && !Object.prototype.hasOwnProperty.call(params, 'orderId')) {
    fail('MISSING_PARAMETER', 'orderId is required for feeding-feedback dynamic.editor', { routeName, key: 'orderId' })
  }
  return Object.keys(params).reduce<Record<string, string>>((result, key) => {
    result[key] = String(params[key])
    return result
  }, Object.create(null) as Record<string, string>)
}

function encodeQueryValue(value: string): string {
  try {
    return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
  } catch {
    fail('INVALID_UNICODE', 'Query value cannot be encoded')
  }
}

function buildRoute(routeName: string, params?: unknown): string {
  const definition = ROUTE_REGISTRY[routeName]
  if (!definition) fail('UNKNOWN_ROUTE', `Unknown target route: ${routeName}`, { routeName })
  const normalized = validateParams(routeName, params === undefined ? {} : params)
  const keys = Object.keys(normalized).sort()
  const query = keys.map((key) => `${encodeQueryValue(key)}=${encodeQueryValue(normalized[key])}`).join('&')
  const url = query ? `${definition.path}?${query}` : definition.path
  if (definition.tab && query) {
    fail('TAB_QUERY_FORBIDDEN', `${routeName} is a tab route and cannot carry query parameters`, { routeName })
  }
  return url
}

function decodeQueryPart(raw: unknown, label: string): string {
  const text = assertString(raw, label, { allowEmpty: true, maxLength: 4096 })
  try {
    return decodeURIComponent(text.replace(/\+/g, ' '))
  } catch {
    fail('MALFORMED_ENCODING', `${label} contains malformed percent encoding`, { label })
  }
}

function parseRawQuery(rawQuery: string): QueryParams {
  if (rawQuery === '') return Object.create(null)
  const result = Object.create(null)
  for (const segment of rawQuery.split('&')) {
    if (!segment) fail('MALFORMED_QUERY', 'Query contains an empty segment')
    const separator = segment.indexOf('=')
    if (separator < 1) fail('MALFORMED_QUERY', 'Each query parameter must have a non-empty name and "="')
    const key = decodeQueryPart(segment.slice(0, separator), 'query key')
    assertSafeKey(key, 'query')
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      fail('DUPLICATE_PARAMETER', `Query parameter "${key}" is repeated`, { key })
    }
    result[key] = decodeQueryPart(segment.slice(separator + 1), `query parameter ${key}`)
  }
  return result
}

function splitUrl(url: string, label = 'url'): { path: string; query: string } {
  assertString(url, label || 'url', { maxLength: 4096 })
  if (/[#\\]/.test(url) || /^(?:[A-Za-z][A-Za-z0-9+.-]*:|\/\/)/.test(url)) {
    fail('UNSAFE_URL', 'Only an app-relative path and query are accepted')
  }
  const question = url.indexOf('?')
  const path = question === -1 ? url : url.slice(0, question)
  const query = question === -1 ? '' : url.slice(question + 1)
  if (!path.startsWith('/') || path.includes('/../') || path.endsWith('/..') || path.includes('/./') || path.endsWith('/.') || /%(?:2e|2f|5c|25)/i.test(path)) {
    fail('UNSAFE_URL', 'Route path must be an absolute app-relative path without traversal')
  }
  return { path, query }
}

function parseRoute(url: string): ParsedRoute {
  const { path, query } = splitUrl(url, 'url')
  const routeName = PATH_TO_ROUTE[path]
  if (!routeName) fail('UNKNOWN_ROUTE_PATH', `Unknown target route path: ${path}`, { path })
  const params = parseRawQuery(query)
  const normalized = validateParams(routeName, params)
  if (ROUTE_REGISTRY[routeName].tab && query) {
    fail('TAB_QUERY_FORBIDDEN', `${routeName} is a tab route and cannot carry query parameters`, { routeName })
  }
  return Object.freeze({
    routeName,
    path,
    navigation: ROUTE_REGISTRY[routeName].navigation,
    params: Object.freeze({ ...normalized }),
  })
}

function normalizeRegisteredPath(value: unknown): string | null {
  if (typeof value !== 'string') return null
  return value.startsWith('/') ? value : `/${value}`
}

function registeredRouteMatches(routeName: string, registeredRoutes: unknown): boolean {
  if (registeredRoutes === undefined || registeredRoutes === null) return false
  const path = ROUTE_REGISTRY[routeName] && ROUTE_REGISTRY[routeName].path
  if (!path) return false
  if (Array.isArray(registeredRoutes)) {
    return registeredRoutes.some((entry) => {
      if (typeof entry === 'string') return normalizeRegisteredPath(entry) === path
      if (!isPlainRecord(entry)) return false
      return normalizeRegisteredPath(entry.path) === path
    })
  }
  if (registeredRoutes instanceof Map) {
    return registeredRoutes.has(routeName) && normalizeRegisteredPath(registeredRoutes.get(routeName)) === path
  }
  if (isPlainRecord(registeredRoutes)) {
    if (Object.prototype.hasOwnProperty.call(registeredRoutes, routeName)) {
      const value = registeredRoutes[routeName]
      return normalizeRegisteredPath(value) === path
    }
    if (Object.prototype.hasOwnProperty.call(registeredRoutes, path)) return registeredRoutes[path] !== false
  }
  return false
}

/**
 * Navigate only through an injected active registry.  No registry means
 * fail-closed, which prevents callers from silently invoking not-yet-registered
 * packages.  The uni-like API is injected to keep this function testable.
 */
function navigateRoute(routeName: string, params?: unknown, options?: NavigateRouteOptions): unknown {
  const settings = options || {}
  if (!Object.prototype.hasOwnProperty.call(settings, 'registeredRoutes')) {
    fail('NO_ACTIVE_REGISTRY', 'Navigation requires an injected active route registry')
  }
  const definition = ROUTE_REGISTRY[routeName]
  if (!definition) fail('UNKNOWN_ROUTE', `Unknown target route: ${routeName}`, { routeName })
  if (!registeredRouteMatches(routeName, settings.registeredRoutes)) {
    fail('ROUTE_NOT_ACTIVE', `${routeName} is not registered in the active route registry`, { routeName, path: definition.path })
  }
  const url = buildRoute(routeName, params === undefined ? {} : params)
  const api = settings.uniApi
  if (!api || typeof api !== 'object') fail('NAVIGATOR_MISSING_API', 'A uni-like API must be injected')
  if (definition.tab) {
    if (typeof api.switchTab !== 'function') fail('NAVIGATOR_MISSING_API', 'switchTab is required for tab routes')
    return api.switchTab({ url: definition.path })
  }
  if (typeof api.navigateTo !== 'function') fail('NAVIGATOR_MISSING_API', 'navigateTo is required for target routes')
  return api.navigateTo({ url })
}

const SELECTOR_CONTRACTS: Readonly<Record<SelectorKind, SelectorContract>> = Object.freeze({
  address: Object.freeze({ input: 'requestId', output: 'requestId', bridge: 'eventChannel', autoRedirect: false }),
  region: Object.freeze({ input: 'requestId', output: 'requestId', bridge: 'eventChannel', autoRedirect: false }),
  animal: Object.freeze({ input: 'requestId', output: 'requestId', bridge: 'eventChannel', autoRedirect: false }),
})

// Login/auth callers may continue only to these explicitly reviewed actions.
// A continuation is a route contract, never an arbitrary return URL and never
// an instruction to navigate or submit on its own.
const AUTH_CONTINUATION_ROUTES: readonly string[] = Object.freeze([
  'adoption.apply',
  'rescue.apply',
  'yard.create',
  'adoption.reward.claim',
])

function buildAuthContinuation(routeName: string, params?: unknown): { intent: string; routeName: string; url: string; params: Readonly<QueryParams> } {
  if (!AUTH_CONTINUATION_ROUTES.includes(routeName)) {
    fail('INVALID_CONTINUATION_TARGET', `Route is not an allowed auth continuation: ${routeName}`, { routeName })
  }
  const url = buildRoute(routeName, params === undefined ? {} : params)
  const parsed = parseRoute(url)
  return Object.freeze({ intent: routeName, routeName, url, params: parsed.params })
}

function parseAuthContinuation(url: string): { intent: string; routeName: string; path: string; navigation: RouteNavigation; params: Readonly<QueryParams> } {
  const parsed = parseRoute(url)
  if (!AUTH_CONTINUATION_ROUTES.includes(parsed.routeName)) {
    fail('INVALID_CONTINUATION_TARGET', `Route is not an allowed auth continuation: ${parsed.routeName}`, { routeName: parsed.routeName })
  }
  return Object.freeze({ intent: parsed.routeName, ...parsed })
}

function createSelectorRequest(kind: SelectorKind, requestId: unknown): SelectorRequest {
  const contract = SELECTOR_CONTRACTS[kind]
  if (!contract) fail('UNKNOWN_SELECTOR', `Unknown selector contract: ${kind}`, { kind })
  return Object.freeze({ kind, requestId: assertId(requestId, 'requestId'), bridge: contract.bridge, autoRedirect: false })
}

function validateSelectorResponse(kind: SelectorKind, response: unknown, expectedRequestId?: unknown): SelectorResponse {
  const contract = SELECTOR_CONTRACTS[kind]
  if (!contract) fail('UNKNOWN_SELECTOR', `Unknown selector contract: ${kind}`, { kind })
  assertPlainRecord(response, 'selector response')
  const keys = Object.keys(response)
  for (const key of keys) assertSafeKey(key, 'selector response')
  if (keys.some((key) => key !== 'requestId')) {
    fail('UNKNOWN_PARAMETER', 'Selector responses only carry requestId at this boundary')
  }
  const actual = assertId(response.requestId, 'requestId')
  if (expectedRequestId !== undefined && actual !== assertId(expectedRequestId, 'expectedRequestId')) {
    fail('REQUEST_ID_MISMATCH', 'Selector response requestId does not match its caller')
  }
  return Object.freeze({ requestId: actual, bridge: contract.bridge, autoRedirect: false })
}

export {
  RouteContractError,
  ROUTE_REGISTRY,
  ROUTE_NAMES,
  PATH_TO_ROUTE,
  SELECTOR_CONTRACTS,
  AUTH_CONTINUATION_ROUTES,
  buildRoute,
  parseRoute,
  navigateRoute,
  buildAuthContinuation,
  parseAuthContinuation,
  createSelectorRequest,
  validateSelectorResponse,
  // Kept internal to the legacy adapter, but exported for focused governance
  // tests and for callers that need strict percent/query handling.
  parseRawQuery,
  splitUrl,
  isPlainRecord,
  assertId,
  assertString,
  fail,
}
