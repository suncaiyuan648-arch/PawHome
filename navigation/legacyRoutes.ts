'use strict'

import {
  ROUTE_REGISTRY,
  buildRoute,
  parseRawQuery,
  splitUrl,
  isPlainRecord,
  assertId,
  assertString,
  RouteContractError,
  fail,
} from './routeContracts.ts'

type JsonRecord = Record<string, unknown>
type LegacyQuery = Record<string, string>
type RouteParams = Record<string, string>
type LegacyDomain = 'adoption' | 'rescue'
type PostDomain = 'dynamic' | 'feeding'
type PostOutcome = 'published' | 'feeding-completed' | 'feedback-published'

interface LegacyRouteObjectInput extends JsonRecord {
  path: string
  query?: string | JsonRecord
}

type LegacyRouteInput = string | LegacyRouteObjectInput

interface LegacyRouteOptions {
  reviewMetadataResolver?: (reviewItemId: string) => unknown
}

interface LegacyRouteResult {
  ok: true
  routeName: string
  path: string
  url: string
  params: Readonly<RouteParams>
  [key: string]: unknown
}

interface ResultDomain {
  domain?: PostDomain
  outcome?: PostOutcome
}

function includesValue<T extends string>(values: readonly T[], value: string): value is T {
  return values.some((candidate) => candidate === value)
}

function isLegacyDomain(value: string): value is LegacyDomain {
  return includesValue(ALLOWED_DOMAINS, value)
}

function isPostDomain(value: string): value is PostDomain {
  return value === 'dynamic' || value === 'feeding'
}

function isThenable(value: unknown): boolean {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    'then' in value &&
    typeof value.then === 'function'
  )
}

const LEGACY_PATHS = Object.freeze({
  feature: '/pages/feature/index',
  adoptionFlow: '/pages/meMore/adoptionFlow',
  myAssets: '/pages/meMore/myAssets',
  myCloudPets: '/pages/meMore/myCloudPets',
  adoptApply: '/pages/adoption/adoptApply',
  adoptApplySuccess: '/pages/adoption/adoptApplySuccess',
  rescueProofList: '/pages/meMore/rescueProofList',
  rescueProofForm: '/pages/meMore/rescueProofForm',
  juryDetail: '/pages/yard/juryDetail',
  postSuccess: '/pages/publishDynamic/postSuccess',
  postFeed: '/pages/publishDynamic/postFeed',
  messageDetail: '/pages/messageDetail/index',
  citySelect: '/pages/citySelect/index',
  search: '/pages/search/index',
  leaderboard: '/pages/leaderboard/index',
  profile: '/pages/user/profile',
  yardDetail: '/pages/commodityDetails/index',
  animalDetail: '/pages/adoption/petDetail',
  dynamicDetail: '/pages/dynamicDetail/index',
  dynamicDeepLink: '/pages/dynamicDetail/deepLink',
})

const CAPABILITY_KEYS: readonly string[] = Object.freeze(['managed', 'role', 'reviewerId'])
const DOMAIN_KEYS: readonly string[] = Object.freeze(['type', 'source', 'sourceType'])
const ALLOWED_DOMAINS: readonly LegacyDomain[] = Object.freeze(['adoption', 'rescue'])

function own(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function rejectDangerousObjectKeys(object: JsonRecord, label: string): void {
  for (const key of Object.keys(object)) {
    if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
      fail('PROTOTYPE_KEY', `${label} contains a prototype key`, { key })
    }
  }
}

function parseLegacyInput(input: unknown): { path: string; query: LegacyQuery } {
  if (typeof input === 'string') {
    const split = splitUrl(input, 'legacy URL')
    return { path: split.path, query: parseRawQuery(split.query) }
  }
  if (!isPlainRecord(input)) {
    fail('INVALID_LEGACY_INPUT', 'Legacy route input must be a URL string or { path, query }')
  }
  rejectDangerousObjectKeys(input, 'legacy input')
  if (typeof input.path !== 'string')
    fail('INVALID_LEGACY_INPUT', 'Legacy route input requires a string path')
  const split = splitUrl(input.path, 'legacy path')
  if (split.query && input.query !== undefined) {
    fail('CONFLICTING_QUERY', 'Legacy input cannot provide query in both path and query fields')
  }
  const path = split.path
  if (input.query === undefined) return { path, query: parseRawQuery(split.query) }
  if (typeof input.query === 'string') return { path, query: parseRawQuery(input.query) }
  if (!isPlainRecord(input.query))
    fail('INVALID_QUERY_VALUE', 'Legacy query must be a plain object or query string')
  rejectDangerousObjectKeys(input.query, 'legacy query')
  const query: LegacyQuery = Object.create(null)
  for (const key of Object.keys(input.query)) {
    assertString(key, 'legacy query key', { maxLength: 128 })
    const value = input.query[key]
    if (Array.isArray(value) || (value !== null && typeof value === 'object')) {
      fail('INVALID_QUERY_VALUE', `Legacy query parameter ${key} must be scalar`, { key })
    }
    const normalizedValue = assertString(value, `legacy query parameter ${key}`, {
      allowEmpty: true,
      maxLength: 4096,
    })
    if (own(query, key))
      fail('DUPLICATE_PARAMETER', `Query parameter "${key}" is repeated`, { key })
    query[key] = normalizedValue
  }
  return { path, query }
}

function assertKnown(query: LegacyQuery, allowed: readonly string[], path: string): void {
  const allowedSet = new Set([...allowed, ...CAPABILITY_KEYS])
  for (const key of Object.keys(query)) {
    if (!allowedSet.has(key)) {
      fail('UNKNOWN_PARAMETER', `Unknown legacy parameter "${key}" for ${path}`, { path, key })
    }
  }
}

function readIgnoredCapabilities(query: LegacyQuery): Readonly<Record<string, string>> | undefined {
  const ignored: Record<string, string> = Object.create(null)
  for (const key of CAPABILITY_KEYS) {
    if (own(query, key)) {
      assertString(query[key], `legacy parameter ${key}`, { allowEmpty: false, maxLength: 128 })
      ignored[key] = query[key]
    }
  }
  return Object.keys(ignored).length ? Object.freeze({ ...ignored }) : undefined
}

function assertNonEmptyLegacy(value: unknown, label: string): string {
  return assertString(value, label, { allowEmpty: false, maxLength: 4096 })
}

interface AliasOptions {
  label?: string
  id?: boolean
  required?: boolean
}

function readAlias(
  query: LegacyQuery,
  names: readonly string[],
  options: AliasOptions & { required: true },
): string
function readAlias(
  query: LegacyQuery,
  names: readonly string[],
  options?: AliasOptions,
): string | undefined
function readAlias(
  query: LegacyQuery,
  names: readonly string[],
  { label, id = true, required = false }: AliasOptions = {},
): string | undefined {
  const found: Array<{ name: string; value: string }> = []
  for (const name of names) {
    if (!own(query, name)) continue
    const value = assertNonEmptyLegacy(query[name], `legacy parameter ${name}`)
    found.push({ name, value })
  }
  if (!found.length) {
    if (required)
      fail('MISSING_ID', `${label || names[0]} is required`, { label: label || names[0] })
    return undefined
  }
  const first = found[0].value
  if (found.some((item) => item.value !== first)) {
    fail('CONFLICTING_ALIAS', `Aliases for ${label || names[0]} disagree`, {
      names: found.map((item) => item.name),
    })
  }
  return id ? assertId(first, label || names[0]) : first
}

interface DomainOptions {
  allow?: readonly LegacyDomain[]
  path: string
}

function readDomain(
  query: LegacyQuery,
  { allow = ALLOWED_DOMAINS, path }: DomainOptions,
): LegacyDomain | undefined {
  const values: Array<{ key: string; value: LegacyDomain }> = []
  for (const key of DOMAIN_KEYS) {
    if (!own(query, key)) continue
    const value = assertNonEmptyLegacy(query[key], `legacy parameter ${key}`)
    if (!includesValue(allow, value)) {
      fail('INVALID_ENUM', `legacy parameter ${key} has unsupported business type`, {
        key,
        value,
        allow,
      })
    }
    values.push({ key, value })
  }
  if (values.some((item) => item.value !== values[0].value)) {
    fail('CONFLICTING_DOMAIN', `type/source/sourceType conflict for ${path}`, { values })
  }
  return values.length ? values[0].value : undefined
}

function readTarget(
  routeName: string,
  params: RouteParams,
  metadata: JsonRecord = {},
): LegacyRouteResult {
  const url = buildRoute(routeName, params)
  const definition = ROUTE_REGISTRY[routeName]
  return Object.freeze({
    ok: true,
    routeName,
    path: definition.path,
    url,
    params: Object.freeze({ ...params }),
    ...(metadata || {}),
  })
}

function withLegacyMeta(
  result: LegacyRouteResult,
  legacyPath: string,
  query: LegacyQuery,
  extra: JsonRecord = {},
): LegacyRouteResult {
  const ignoredCapabilities = readIgnoredCapabilities(query)
  return Object.freeze({
    ...result,
    legacyPath,
    ...(ignoredCapabilities ? { ignoredCapabilities } : {}),
    ...(extra || {}),
  })
}

function resolveFeature(query: LegacyQuery, path: string): LegacyRouteResult {
  assertKnown(query, ['mode', 'rescueId', 'id', 'animalId', 'petId', 'yardId'], path)
  if (!own(query, 'mode')) fail('MISSING_MODE', 'feature/index requires an explicit mode')
  const mode = assertNonEmptyLegacy(query.mode, 'mode')
  if (mode === 'rescue-detail') {
    const rescueId = readAlias(query, ['rescueId', 'id'], { label: 'rescueId', required: true })
    return readTarget('rescue.detail', { rescueId }, { readOnly: true })
  }
  if (mode === 'invite') return readTarget('account.invite', {}, { readOnly: true })
  if (mode === 'album') {
    const animalId = readAlias(query, ['animalId', 'petId'], { label: 'animalId', required: true })
    const yardId = readAlias(query, ['yardId'], { label: 'yardId' })
    const params: RouteParams = { animalId }
    if (yardId) params.yardId = yardId
    return readTarget('animal.album', params, { readOnly: true })
  }
  fail('UNKNOWN_FEATURE_MODE', `Unsupported feature mode: ${mode}`, { mode })
}

function resolveAdoptionFlow(query: LegacyQuery, path: string): LegacyRouteResult {
  assertKnown(
    query,
    [
      ...DOMAIN_KEYS,
      'state',
      'frame',
      'id',
      'recordId',
      'applicationId',
      'rescueId',
      'notice',
      'popup',
      'openContact',
    ],
    path,
  )
  let domain = readDomain(query, { path })
  const state = own(query, 'state') ? assertNonEmptyLegacy(query.state, 'state') : undefined
  const frame = own(query, 'frame') ? assertNonEmptyLegacy(query.frame, 'frame') : undefined
  if (own(query, 'popup') && query.popup !== 'contact')
    fail('INVALID_ENUM', 'adoptionFlow popup only supports contact')
  const applicationId = readAlias(query, ['applicationId'], { label: 'applicationId' })
  const rescueId = readAlias(query, ['rescueId'], { label: 'rescueId' })
  const genericId = readAlias(query, ['id', 'recordId'], { label: 'recordId' })
  if (applicationId && rescueId)
    fail('CONFLICTING_ID', 'adoptionFlow cannot carry applicationId and rescueId together')
  if (applicationId && genericId && applicationId !== genericId)
    fail('CONFLICTING_ID', 'applicationId and generic recordId disagree')
  if (rescueId && genericId && rescueId !== genericId)
    fail('CONFLICTING_ID', 'rescueId and generic recordId disagree')
  if (domain === 'adoption' && rescueId)
    fail('CONFLICTING_DOMAIN', 'adoptionFlow adoption conflicts with rescueId')
  if (domain === 'rescue' && applicationId)
    fail('CONFLICTING_DOMAIN', 'adoptionFlow rescue conflicts with applicationId')
  if (state === 'long') {
    if (domain === 'adoption')
      fail('CONFLICTING_DOMAIN', 'state=long is rescue-only and conflicts with adoption')
    domain = 'rescue'
  }
  if (!domain) domain = rescueId ? 'rescue' : 'adoption'
  const selectedId = domain === 'rescue' ? rescueId || genericId : applicationId || genericId
  if (!selectedId)
    fail(
      'MISSING_ID',
      `${domain === 'rescue' ? 'rescueId' : 'applicationId'} is required for adoptionFlow`,
    )
  if (domain === 'rescue' && applicationId)
    fail('CONFLICTING_ID', 'rescue adoptionFlow cannot use applicationId')
  if (domain === 'adoption' && rescueId)
    fail('CONFLICTING_ID', 'adoption adoptionFlow cannot use rescueId')
  if (frame === '48' || frame === '49') {
    if (domain !== 'adoption')
      fail('CONFLICTING_FRAME', 'frame 48/49 is an adoption-only read-only view')
    const view = frame === '48' ? 'adoption-info' : 'application'
    return withLegacyMeta(
      readTarget('adoption.progress', { applicationId: selectedId, view }, { readOnly: true }),
      path,
      query,
      { legacyFrame: frame },
    )
  }
  if (domain === 'rescue') {
    return withLegacyMeta(
      readTarget('rescue.progress', { rescueId: selectedId }, { readOnly: true }),
      path,
      query,
      frame ? { legacyFrame: frame, readOnly: true } : undefined,
    )
  }
  return withLegacyMeta(
    readTarget('adoption.progress', { applicationId: selectedId }, { readOnly: true }),
    path,
    query,
    frame ? { legacyFrame: frame, readOnly: true } : undefined,
  )
}

function resolveAdoptApply(query: LegacyQuery, path: string): LegacyRouteResult {
  assertKnown(query, [...DOMAIN_KEYS, 'state', 'yardId', 'animalId', 'petId', 'animalIds'], path)
  let domain = readDomain(query, { path })
  const state = own(query, 'state') ? assertNonEmptyLegacy(query.state, 'state') : undefined
  if (state === 'long') {
    if (domain === 'adoption')
      fail('CONFLICTING_DOMAIN', 'state=long is rescue-only and conflicts with adoption')
    domain = 'rescue'
  }
  if (!domain) domain = 'adoption'
  if (domain === 'rescue') {
    if (
      own(query, 'yardId') ||
      own(query, 'animalId') ||
      own(query, 'petId') ||
      own(query, 'animalIds')
    ) {
      fail('CONFLICTING_DOMAIN', 'rescue apply cannot carry adoption animal or yard context')
    }
    return readTarget('rescue.apply', {}, { readOnly: false })
  }
  const yardId = readAlias(query, ['yardId'], { label: 'yardId', required: true })
  const animalId = readAlias(query, ['animalId', 'petId'], { label: 'animalId' })
  const animalIds = own(query, 'animalIds')
    ? assertNonEmptyLegacy(query.animalIds, 'animalIds')
    : undefined
  if (animalId && animalIds && animalIds !== animalId)
    fail('CONFLICTING_ID', 'animalId and animalIds disagree')
  const params: RouteParams = { yardId }
  if (animalIds) params.animalIds = animalIds
  else if (animalId) params.animalIds = animalId
  return readTarget('adoption.apply', params, { readOnly: false })
}

function resolveAdoptApplySuccess(query: LegacyQuery, path: string): LegacyRouteResult {
  assertKnown(
    query,
    [...DOMAIN_KEYS, 'id', 'recordId', 'applicationId', 'rescueId', 'outcome'],
    path,
  )
  let domain = readDomain(query, { path })
  const applicationId = readAlias(query, ['applicationId'], { label: 'applicationId' })
  const rescueId = readAlias(query, ['rescueId'], { label: 'rescueId' })
  const genericId = readAlias(query, ['id', 'recordId'], { label: 'recordId' })
  if (applicationId && rescueId)
    fail('CONFLICTING_ID', 'adoptApplySuccess cannot carry applicationId and rescueId together')
  if (applicationId && genericId && applicationId !== genericId)
    fail('CONFLICTING_ID', 'applicationId and generic recordId disagree')
  if (rescueId && genericId && rescueId !== genericId)
    fail('CONFLICTING_ID', 'rescueId and generic recordId disagree')
  if (domain === 'adoption' && rescueId)
    fail('CONFLICTING_DOMAIN', 'adoption result conflicts with rescueId')
  if (domain === 'rescue' && applicationId)
    fail('CONFLICTING_DOMAIN', 'rescue result conflicts with applicationId')
  if (!domain) domain = rescueId ? 'rescue' : 'adoption'
  const outcome = own(query, 'outcome')
    ? assertNonEmptyLegacy(query.outcome, 'outcome')
    : 'application-submitted'
  if (outcome !== 'application-submitted')
    fail('INVALID_ENUM', 'Legacy application result only supports application-submitted')
  const id = domain === 'rescue' ? rescueId || genericId : applicationId || genericId
  if (!id)
    fail(
      'MISSING_ID',
      `${domain === 'rescue' ? 'rescueId' : 'applicationId'} is required for adoptApplySuccess`,
    )
  if (domain === 'rescue')
    return readTarget('rescue.result', { rescueId: id, outcome }, { readOnly: true })
  return readTarget('adoption.result', { applicationId: id, outcome }, { readOnly: true })
}

function resolveRescueProof(
  query: LegacyQuery,
  path: string,
  routeName: string,
): LegacyRouteResult {
  assertKnown(query, [...DOMAIN_KEYS, 'rescueId', 'id', 'recordId'], path)
  const domain = readDomain(query, { path })
  if (domain !== 'rescue') {
    fail('CONFLICTING_DOMAIN', `${path} only accepts the rescue domain`)
  }
  const rescueId = readAlias(query, ['rescueId', 'id', 'recordId'], {
    label: 'rescueId',
    required: true,
  })
  return readTarget(
    routeName,
    { rescueId },
    { readOnly: routeName === 'rescue.proof.list' ? true : false },
  )
}

function resolveJuryDetail(
  query: LegacyQuery,
  path: string,
  options: LegacyRouteOptions,
): LegacyRouteResult {
  assertKnown(
    query,
    [...DOMAIN_KEYS, 'businessType', 'reviewType', 'juryType', 'reviewItemId', 'itemId', 'id'],
    path,
  )
  const resolver = options && options.reviewMetadataResolver
  if (typeof resolver !== 'function') {
    fail('MISSING_METADATA_RESOLVER', 'juryDetail requires an injected real task metadata resolver')
  }
  const reviewItemId = readAlias(query, ['reviewItemId', 'itemId', 'id'], {
    label: 'reviewItemId',
    required: true,
  })
  const queryDomainValues: Array<{ key: string; value: LegacyDomain }> = []
  for (const key of ['businessType', 'reviewType', 'juryType', ...DOMAIN_KEYS]) {
    if (!own(query, key)) continue
    const value = assertNonEmptyLegacy(query[key], `legacy parameter ${key}`)
    if (!isLegacyDomain(value)) fail('INVALID_ENUM', `Invalid jury business type: ${value}`)
    queryDomainValues.push({ key, value })
  }
  if (queryDomainValues.some((item) => item.value !== queryDomainValues[0].value)) {
    fail('CONFLICTING_DOMAIN', 'juryDetail type/source/sourceType/businessType conflict')
  }
  const metadata = resolver(reviewItemId)
  if (!isPlainRecord(metadata) || isThenable(metadata)) {
    fail(
      'INVALID_REVIEW_METADATA',
      'reviewMetadataResolver must synchronously return a task metadata record',
    )
  }
  const metadataDomains: unknown[] = ['businessType', 'reviewType', 'juryType', 'type']
    .filter((key) => own(metadata, key))
    .map((key) => metadata[key])
  const actualDomainValue = metadataDomains[0]
  if (
    typeof actualDomainValue !== 'string' ||
    !isLegacyDomain(actualDomainValue) ||
    metadataDomains.some((value) => value !== actualDomainValue)
  ) {
    fail('INVALID_REVIEW_METADATA', 'Task metadata must declare businessType adoption or rescue')
  }
  const actualDomain: LegacyDomain = actualDomainValue
  const metadataIds = ['reviewItemId', 'id']
    .filter((key) => own(metadata, key))
    .map((key) => metadata[key])
  if (!metadataIds.length || metadataIds.some((id) => id !== reviewItemId)) {
    fail('INVALID_REVIEW_METADATA', 'Task metadata must identify exactly the requested review item')
  }
  if (queryDomainValues.length && queryDomainValues[0].value !== actualDomain) {
    fail('CONFLICTING_DOMAIN', 'juryDetail query type does not match real task metadata')
  }
  const target = actualDomain === 'rescue' ? 'rescue.review.detail' : 'adoption.jury.detail'
  return withLegacyMeta(
    readTarget(target, { reviewItemId, businessType: actualDomain }, { readOnly: false }),
    path,
    query,
    { resolvedBusinessType: actualDomain },
  )
}

function readResultDomain(query: LegacyQuery): ResultDomain {
  const values: Array<{ key: string; value: PostDomain }> = []
  for (const key of [...DOMAIN_KEYS, 'mode', 'state']) {
    if (!own(query, key)) continue
    const value = assertNonEmptyLegacy(query[key], `legacy parameter ${key}`)
    const normalized = (key === 'mode' || key === 'state') && value === 'post' ? 'dynamic' : value
    if (typeof normalized !== 'string' || !isPostDomain(normalized)) {
      fail('INVALID_ENUM', `Invalid postSuccess business type: ${value}`, { key, value })
    }
    values.push({ key, value: normalized })
  }
  if (own(query, 'scene')) {
    const scene = assertNonEmptyLegacy(query.scene, 'scene')
    let value: PostDomain
    if (scene === 'feeding-feedback') value = 'feeding'
    else if (scene === 'dynamic' || scene === 'post') value = 'dynamic'
    else fail('INVALID_ENUM', `Invalid postSuccess scene: ${scene}`)
    values.push({ key: 'scene', value })
  }
  if (values.some((item) => item.value !== values[0].value)) {
    fail('CONFLICTING_DOMAIN', 'postSuccess type/source/sourceType/mode/scene conflict')
  }
  const domain = values.length ? values[0].value : undefined
  const outcomes = values.map((item) =>
    item.key === 'scene'
      ? item.value === 'feeding'
        ? 'feedback-published'
        : 'published'
      : item.value === 'feeding'
        ? 'feeding-completed'
        : 'published',
  )
  if (outcomes.some((outcome) => outcome !== outcomes[0])) {
    fail(
      'CONFLICTING_RESULT_INTENT',
      'postSuccess result intent conflicts between state/type/mode and scene',
    )
  }
  return { domain, outcome: outcomes[0] }
}

function resolvePostSuccess(query: LegacyQuery, path: string): LegacyRouteResult {
  assertKnown(
    query,
    [...DOMAIN_KEYS, 'mode', 'state', 'scene', 'dynamicId', 'orderId', 'id', 'recordId'],
    path,
  )
  const { domain, outcome: inferredOutcome } = readResultDomain(query)
  const orderId = readAlias(query, ['orderId'], { label: 'orderId' })
  const dynamicId = readAlias(query, ['dynamicId', 'id', 'recordId'], { label: 'dynamicId' })
  if (domain === 'feeding' || (!domain && orderId)) {
    if (!domain)
      fail('MISSING_DOMAIN', 'orderId requires explicit type=feeding or scene=feeding-feedback')
    if (!orderId) fail('MISSING_ID', 'feeding postSuccess requires orderId')
    if (dynamicId && inferredOutcome !== 'feedback-published')
      fail('CONFLICTING_DOMAIN', 'feeding completion cannot carry dynamicId')
    const params: RouteParams = { orderId, outcome: inferredOutcome || 'feeding-completed' }
    if (dynamicId) params.dynamicId = dynamicId
    return readTarget('feeding.result', params, { readOnly: true })
  }
  if (orderId) fail('CONFLICTING_DOMAIN', 'dynamic postSuccess cannot carry orderId')
  if (!dynamicId) fail('MISSING_ID', 'dynamic postSuccess requires dynamicId')
  return readTarget(
    'dynamic.result',
    { dynamicId, outcome: inferredOutcome || 'published' },
    { readOnly: true },
  )
}

function resolveMessageDetail(query: LegacyQuery, path: string): LegacyRouteResult {
  assertKnown(query, ['type', 'category', 'messageId'], path)
  const aliases = Object.create(null)
  const rawType = own(query, 'type') ? assertNonEmptyLegacy(query.type, 'type') : undefined
  const rawCategory = own(query, 'category')
    ? assertNonEmptyLegacy(query.category, 'category')
    : undefined
  for (const value of [rawType, rawCategory]) {
    if (value === undefined) continue
    const normalized = {
      shopping: 'order',
      service: 'service',
      interaction: 'interaction',
      activity: 'activity',
      order: 'order',
      system: 'system',
      pet: 'pet',
    }[value]
    if (!normalized) fail('INVALID_ENUM', `Unsupported message detail type: ${value}`)
    aliases[value] = normalized
  }
  if (rawType && rawCategory && aliases[rawType] !== aliases[rawCategory]) {
    fail('CONFLICTING_ALIAS', 'type and category disagree for message detail', {
      names: ['type', 'category'],
    })
  }
  const category =
    (rawType && aliases[rawType]) || (rawCategory && aliases[rawCategory]) || 'service'
  const messageId = readAlias(query, ['messageId'], { label: 'messageId' })
  return readTarget('message.list', messageId ? { category, messageId } : { category }, {
    readOnly: true,
  })
}

function resolveProfile(query: LegacyQuery, path: string): LegacyRouteResult {
  assertKnown(query, ['userId', 'pawId', 'userPawId', 'id'], path)
  const userId = readAlias(query, ['userId', 'pawId', 'userPawId', 'id'], {
    label: 'userId',
    required: true,
  })
  return readTarget('account.profile', { userId }, { readOnly: true })
}

function resolveYardDetail(query: LegacyQuery, path: string): LegacyRouteResult {
  assertKnown(query, ['yardId', 'id'], path)
  const yardId = readAlias(query, ['yardId', 'id'], { label: 'yardId', required: true })
  return readTarget('yard.detail', { yardId }, { readOnly: true })
}

function resolveAnimalDetail(query: LegacyQuery, path: string): LegacyRouteResult {
  assertKnown(query, ['animalId', 'petId', 'id', 'yardId'], path)
  const animalId = readAlias(query, ['animalId', 'petId', 'id'], {
    label: 'animalId',
    required: true,
  })
  const yardId = readAlias(query, ['yardId'], { label: 'yardId' })
  const params: RouteParams = { animalId }
  if (yardId) params.yardId = yardId
  return readTarget('animal.detail', params, { readOnly: true })
}

function resolveDynamicDetail(query: LegacyQuery, path: string): LegacyRouteResult {
  assertKnown(query, ['dynamicId', 'postId', 'id'], path)
  const dynamicId = readAlias(query, ['dynamicId', 'postId', 'id'], {
    label: 'dynamicId',
    required: true,
  })
  return readTarget('dynamic.detail', { dynamicId }, { readOnly: true })
}

function resolveCityPicker(query: LegacyQuery, path: string): LegacyRouteResult {
  assertKnown(query, ['current', 'requestId'], path)
  const current = own(query, 'current') ? assertNonEmptyLegacy(query.current, 'current') : undefined
  const requestId = readAlias(query, ['requestId'], { label: 'requestId' })
  const params: RouteParams = {}
  if (current) params.current = current
  if (requestId) params.requestId = requestId
  return readTarget('discovery.cityPicker', params, { readOnly: true })
}

function resolveSearch(query: LegacyQuery, path: string): LegacyRouteResult {
  assertKnown(query, ['state', 'popup', 'q', 'scope'], path)
  const params: RouteParams = {}
  if (own(query, 'q')) {
    const q = assertString(query.q, 'q', { allowEmpty: true, maxLength: 200 })
    // The canonical contract treats an omitted query as the idle search state;
    // do not manufacture an invalid `q=` value when an old link carried an
    // empty keyword.
    if (q) params.q = q
  }
  if (own(query, 'scope')) {
    const scope = assertNonEmptyLegacy(query.scope, 'scope')
    if (!['dynamic', 'yard', 'user'].includes(scope))
      fail('INVALID_ENUM', `Unsupported search scope: ${scope}`)
    params.scope = scope
  }
  if (own(query, 'state')) {
    const state = assertNonEmptyLegacy(query.state, 'state')
    if (!['dynamic', 'yard', 'user', 'empty', 'idle_delete', 'deleting'].includes(state))
      fail('INVALID_ENUM', `Unsupported search state: ${state}`)
    params.state = state
  }
  if (own(query, 'popup')) {
    if (query.popup !== 'delete') fail('INVALID_ENUM', 'search popup only supports delete')
    params.popup = 'delete'
  }
  return readTarget('discovery.search', params, { readOnly: true })
}

function resolveDynamicEditor(query: LegacyQuery, path: string): LegacyRouteResult {
  assertKnown(query, ['state', 'scene', 'type', 'yardId', 'animalId', 'orderId'], path)
  const params: RouteParams = {}
  const yardId = readAlias(query, ['yardId'], { label: 'yardId' })
  const animalId = readAlias(query, ['animalId'], { label: 'animalId' })
  const orderId = readAlias(query, ['orderId'], { label: 'orderId' })
  if (yardId) params.yardId = yardId
  if (animalId) params.animalId = animalId
  if (orderId) params.orderId = orderId
  if (own(query, 'state')) {
    const state = assertNonEmptyLegacy(query.state, 'state')
    if (!['alternate', 'select-order', 'feeding'].includes(state))
      fail('INVALID_ENUM', `Unsupported postFeed state: ${state}`)
    params.state = state
  }
  const scene = own(query, 'scene')
    ? assertNonEmptyLegacy(query.scene, 'scene')
    : query.type === 'yard-owner'
      ? 'feeding-feedback'
      : undefined
  if (scene !== undefined) {
    if (!['post', 'feeding-feedback'].includes(scene))
      fail('INVALID_ENUM', `Unsupported postFeed scene: ${scene}`)
    params.scene = scene
  }
  return readTarget('dynamic.editor', params, { readOnly: false })
}

function resolveMyAssets(query: LegacyQuery, path: string): LegacyRouteResult {
  assertKnown(
    query,
    ['mode', 'state', 'yardId', 'yardName', 'yardAvatar', 'ownerPawId', 'first', 'userId'],
    path,
  )
  const mode = own(query, 'mode') ? assertNonEmptyLegacy(query.mode, 'mode') : 'pets'
  const state = own(query, 'state') ? assertNonEmptyLegacy(query.state, 'state') : undefined
  const first = own(query, 'first') ? assertNonEmptyLegacy(query.first, 'first') : undefined
  if (first !== undefined && !['1', 'true', '0', 'false'].includes(first.toLowerCase())) {
    fail('INVALID_ENUM', 'myAssets first must be true/false or 1/0')
  }
  const firstMedal = first !== undefined && ['1', 'true'].includes(first.toLowerCase())
  if (mode === 'medals' && firstMedal) {
    if (state) fail('UNKNOWN_PARAMETER', 'myAssets medals first view does not accept state')
    return readTarget('account.medals.achievement', {}, { readOnly: true })
  }
  if (mode === 'medals') {
    if (state) fail('UNKNOWN_PARAMETER', 'myAssets medals does not accept state')
    return readTarget('account.medals', {}, { readOnly: true })
  }
  if (mode === 'map') {
    if (state) fail('UNKNOWN_PARAMETER', 'myAssets map does not accept state')
    return readTarget('account.medals.map', {}, { readOnly: true })
  }
  if (mode === 'new') {
    if (state) fail('UNKNOWN_PARAMETER', 'myAssets new does not accept state')
    return readTarget('account.medals.achievement', {}, { readOnly: true })
  }
  if (mode !== 'pets') fail('INVALID_ENUM', `Unsupported myAssets mode: ${mode}`)
  if (state === 'owned') {
    const userId = readAlias(query, ['userId'], { label: 'userId', required: true })
    return readTarget('animal.mine', { userId }, { readOnly: true })
  }
  if (state) fail('INVALID_ENUM', `Unsupported myAssets state: ${state}`)
  const yardId = readAlias(query, ['yardId'], { label: 'yardId', required: true })
  return readTarget('yard.animals', { yardId }, { readOnly: true })
}

function resolveMyCloudPets(query: LegacyQuery, path: string): LegacyRouteResult {
  assertKnown(query, ['userPawId', 'pawId', 'userId'], path)
  const userId = readAlias(query, ['userId', 'userPawId', 'pawId'], {
    label: 'userId',
    required: true,
  })
  return readTarget('animal.sponsored', { userId }, { readOnly: true })
}

/**
 * Resolve only the explicitly governed cross-domain legacy hotspots.  Unknown
 * legacy pages are rejected instead of being presented as if all 63 rows had
 * migrated.
 */
function resolveLegacyRoute(
  input: LegacyRouteInput,
  options: LegacyRouteOptions = {},
): LegacyRouteResult {
  const { path, query } = parseLegacyInput(input)
  let result
  switch (path) {
    case LEGACY_PATHS.messageDetail:
      result = withLegacyMeta(resolveMessageDetail(query, path), path, query)
      break
    case LEGACY_PATHS.profile:
      result = withLegacyMeta(resolveProfile(query, path), path, query)
      break
    case LEGACY_PATHS.yardDetail:
      result = withLegacyMeta(resolveYardDetail(query, path), path, query)
      break
    case LEGACY_PATHS.animalDetail:
      result = withLegacyMeta(resolveAnimalDetail(query, path), path, query)
      break
    case LEGACY_PATHS.dynamicDetail:
    case LEGACY_PATHS.dynamicDeepLink:
      result = withLegacyMeta(resolveDynamicDetail(query, path), path, query)
      break
    case LEGACY_PATHS.citySelect:
      result = withLegacyMeta(resolveCityPicker(query, path), path, query)
      break
    case LEGACY_PATHS.search:
      result = withLegacyMeta(resolveSearch(query, path), path, query)
      break
    case LEGACY_PATHS.leaderboard:
      assertKnown(query, [], path)
      result = withLegacyMeta(readTarget('discovery.ranking', {}, { readOnly: true }), path, query)
      break
    case LEGACY_PATHS.postFeed:
      result = withLegacyMeta(resolveDynamicEditor(query, path), path, query)
      break
    case LEGACY_PATHS.feature:
      result = withLegacyMeta(resolveFeature(query, path), path, query)
      break
    case LEGACY_PATHS.adoptionFlow:
      result = resolveAdoptionFlow(query, path)
      break
    case LEGACY_PATHS.myAssets:
      result = withLegacyMeta(resolveMyAssets(query, path), path, query)
      break
    case LEGACY_PATHS.myCloudPets:
      result = withLegacyMeta(resolveMyCloudPets(query, path), path, query)
      break
    case LEGACY_PATHS.adoptApply:
      result = withLegacyMeta(resolveAdoptApply(query, path), path, query)
      break
    case LEGACY_PATHS.adoptApplySuccess:
      result = withLegacyMeta(resolveAdoptApplySuccess(query, path), path, query)
      break
    case LEGACY_PATHS.rescueProofList:
      result = withLegacyMeta(resolveRescueProof(query, path, 'rescue.proof.list'), path, query)
      break
    case LEGACY_PATHS.rescueProofForm:
      result = withLegacyMeta(resolveRescueProof(query, path, 'rescue.proof.create'), path, query)
      break
    case LEGACY_PATHS.juryDetail:
      result = resolveJuryDetail(query, path, options || {})
      break
    case LEGACY_PATHS.postSuccess:
      result = withLegacyMeta(resolvePostSuccess(query, path), path, query)
      break
    default:
      fail('UNSUPPORTED_LEGACY_ROUTE', `Legacy route is not covered by C0-A3: ${path}`, { path })
  }
  return result
}

function tryResolveLegacyRoute(
  input: LegacyRouteInput,
  options: LegacyRouteOptions = {},
):
  | LegacyRouteResult
  | Readonly<{
      ok: false
      error: { code: string; message: string; details: Record<string, unknown> }
    }> {
  try {
    return resolveLegacyRoute(input, options)
  } catch (error) {
    if (error instanceof RouteContractError)
      return Object.freeze({
        ok: false,
        error: { code: error.code, message: error.message, details: error.details },
      })
    throw error
  }
}

export { LEGACY_PATHS, resolveLegacyRoute, tryResolveLegacyRoute }
