/**
 * Read-only order adapter for the feeding domain.
 *
 * The order contract remains the single normalization/capability boundary.
 * This adapter only binds the existing reward storage and the existing
 * read-only feeding mock reader.  It never writes, accepts caller-supplied
 * records, or treats route/query fields as identity or authorization.
 *
 * Feeding's legacy read model exposes `stateKey` rather than `status`; the
 * small compatibility map below is deliberately explicit and fail-closed for
 * unknown states.  It is a migration seam, not a new persistence schema.
 */
import { resolveTrustedActor } from '../../../navigation/actorCapabilities.ts'
import {
  ADOPTION_GIFT,
  NORMAL_FEED,
  getOrderAccess,
  normalizeOrderRecord,
  normalizeVisibilityEntry,
} from '../../../navigation/orderContracts.ts'
import { readRewardOrders } from '../../../utils/rewardOrderStorage.ts'
import { getFeedingOrders, type GetFeedingOrdersOptions } from './orderMockApi.ts'

type NormalizedOrder = ReturnType<typeof normalizeOrderRecord>
type VisibilityEntry = ReturnType<typeof normalizeVisibilityEntry>
type OrderAccess = ReturnType<typeof getOrderAccess>
type TrustedActor = NonNullable<ReturnType<typeof resolveTrustedActor>>

type OrderSource = 'all' | 'reward' | 'feeding'
type OrderPerspective = 'mine' | 'yard'

export interface OrderReadOptions {
  actorProvider?: () => unknown
  source?: OrderSource
  perspective?: OrderPerspective
  yardId?: string
  hiddenEntries?: readonly unknown[]
}

interface RuntimeOrderReadOptions {
  actorProvider?: unknown
  source?: unknown
  perspective?: unknown
  yardId?: unknown
  hiddenEntries?: unknown
}

interface Diagnostic {
  source: 'reward' | 'feeding'
  index: number
  code: string
}

interface OrderCandidate {
  order: NormalizedOrder | null
  diagnostic: Diagnostic | null
}

interface VisibleOrder {
  order: NormalizedOrder
  access: OrderAccess
}

export interface OrderListData {
  items: readonly VisibleOrder[]
  total: number
  diagnostics: readonly Diagnostic[]
  perspective?: OrderPerspective
  sourceFilter?: OrderSource
}

export interface OrderDetailData extends VisibleOrder {
  diagnostics: readonly Diagnostic[]
}

interface OrderSuccess<T> {
  success: true
  source: 'mock'
  data: T
  error: null
  actor: TrustedActor
  readOnly: true
  canWrite: false
}

interface OrderFailure<T = null> {
  success: false
  source: 'mock'
  data: T | null
  error: Readonly<{ code: string; message: string }>
  actor: TrustedActor | null
  readOnly: true
  canWrite: false
}

export type OrderResult<T> = OrderSuccess<T> | OrderFailure<T>

interface ActorResolution {
  actor: TrustedActor | null
  error: unknown | null
}

type ValidationResult<T> = { success: true; value: T } | { success: false; error: [string, string] }

const SOURCE_VALUES: readonly OrderSource[] = Object.freeze(['all', 'reward', 'feeding'])
const PERSPECTIVE_VALUES: readonly OrderPerspective[] = Object.freeze(['mine', 'yard'])
const FEEDING_STATUS_BY_STATE: Readonly<Record<string, NormalizedOrder['status']>> = Object.freeze({
  'waiting-logistics': 'shipping',
  'waiting-cloud-effective': 'shipping',
  'cloud-active-timeout': 'delivered',
  'cloud-active-feedback': 'delivered',
  completed: 'completed',
})

// IDs are opaque at the adapter boundary, but a route from another business
// domain must still fail before storage is scanned.  The canonical order
// contract performs the same check while normalizing records; keeping the
// lookup guard here avoids turning a forged cross-domain ID into a generic
// NOT_FOUND result and documents which namespace each entry point accepts.
const CROSS_DOMAIN_APPLICATION_PREFIXES: readonly string[] = Object.freeze([
  'rescue',
  'feeding',
  'order',
  'dynamic',
  'yard',
  'animal',
])
const CROSS_DOMAIN_ORDER_PREFIXES: readonly string[] = Object.freeze([
  'application',
  'adoption',
  'rescue',
  'dynamic',
  'animal',
])
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function firstValue(source: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null && source[key] !== '') return source[key]
  }
  return undefined
}

function actorBinding(source: Record<string, unknown>): string | undefined {
  const values = ['userId', 'userPawId', 'applicantId', 'applicantUserId']
    .map(key => source && source[key])
    .filter(value => value !== undefined && value !== null && value !== '')
    .map(value => String(value).trim())
  const unique = [...new Set(values)]
  if (unique.length > 1) throw Object.assign(new Error('reward order actor aliases disagree'), { code: 'ACTOR_ASSOCIATION_CONFLICT' })
  return unique[0]
}

function text(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim()
}

function failure<T = null>(code: string, message: string, data: T | null = null, actor: TrustedActor | null = null): OrderFailure<T> {
  return Object.freeze({
    success: false,
    source: 'mock',
    data,
    error: Object.freeze({ code, message }),
    actor,
    readOnly: true,
    canWrite: false,
  })
}

function success<T>(data: T, actor: TrustedActor): OrderSuccess<T> {
  return Object.freeze({
    success: true,
    source: 'mock',
    data,
    error: null,
    actor,
    readOnly: true,
    canWrite: false,
  })
}

function emptyListData(diagnostics: readonly Diagnostic[] = []): OrderListData {
  const items: readonly VisibleOrder[] = Object.freeze([])
  return Object.freeze({
    items,
    total: 0,
    diagnostics: Object.freeze(diagnostics.slice()),
  })
}

function readErrorCode(error: unknown, fallback = 'ORDER_READ_FAILED'): string {
  return isRecord(error) && typeof error.code === 'string' && error.code ? error.code : fallback
}

function resolveActor(actorProvider: unknown): ActorResolution {
  try {
    const actor = resolveTrustedActor(actorProvider)
    return { actor, error: null }
  } catch (error) {
    return { actor: null, error }
  }
}

function normalizePerspective(value: unknown): unknown {
  return value === undefined || value === null || value === '' ? 'mine' : value
}

function normalizeSource(value: unknown): unknown {
  return value === undefined || value === null || value === '' ? 'all' : value
}

function normalizeOptions(options: unknown): RuntimeOrderReadOptions {
  return isRecord(options) ? options : {}
}

function normalizeHiddenEntries(value: unknown): VisibilityEntry[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw Object.assign(new Error('visibility entries must be an array'), { code: 'INVALID_VISIBILITY' })
  const entries: unknown[] = value
  return entries.map(normalizeVisibilityEntry)
}

/** Convert one persisted legacy reward record without copying address/private extras. */
function adaptRewardRecord(raw: unknown): NormalizedOrder {
  if (!isRecord(raw)) throw Object.assign(new Error('reward order must be an object'), { code: 'INVALID_ORDER_RECORD' })
  const explicitType = firstValue(raw, ['orderType', 'type'])
  if (explicitType !== undefined && explicitType !== ADOPTION_GIFT) {
    throw Object.assign(new Error('reward storage contains a non-gift order'), { code: 'ORDER_TYPE_MISMATCH' })
  }
  const applicationId = firstValue(raw, ['applicationId', 'recordId'])
  const userId = actorBinding(raw)
  const yardOwnerId = firstValue(raw, ['yardOwnerId', 'ownerPawId'])
  const animalId = firstValue(raw, ['animalId', 'petId'])
  const input: Record<string, unknown> = {
    orderId: firstValue(raw, ['orderId', 'id']),
    orderType: ADOPTION_GIFT,
    applicationId,
    ...(raw.recordId === undefined ? {} : { recordId: raw.recordId }),
    userId,
    ...(yardOwnerId === undefined ? {} : { yardOwnerId }),
    ...(raw.yardId === undefined ? {} : { yardId: raw.yardId }),
    ...(animalId === undefined ? {} : { animalId }),
    status: raw.status,
  }
  for (const key of ['deliveryStatus', 'deliveryProgress', 'amount', 'currency', 'createdAt', 'updatedAt']) {
    if (raw[key] !== undefined) input[key] = raw[key]
  }
  return normalizeOrderRecord(input)
}

function adaptFeedingRecord(raw: unknown): NormalizedOrder {
  if (!isRecord(raw)) throw Object.assign(new Error('feeding order must be an object'), { code: 'INVALID_ORDER_RECORD' })
  const status = text(raw.status) || FEEDING_STATUS_BY_STATE[text(raw.stateKey)]
  if (!status) throw Object.assign(new Error('feeding order has no supported status'), { code: 'MISSING_ORDER_STATUS' })
  return normalizeOrderRecord({
    orderId: firstValue(raw, ['orderId', 'id']),
    orderType: NORMAL_FEED,
    userId: firstValue(raw, ['userId', 'userPawId']),
    yardOwnerId: firstValue(raw, ['yardOwnerId', 'ownerPawId']),
    yardId: raw.yardId,
    animalId: firstValue(raw, ['animalId', 'petId']),
    status,
    ...(raw.deliveryStatus === undefined ? {} : { deliveryStatus: raw.deliveryStatus }),
    ...(raw.deliveryProgress === undefined ? {} : { deliveryProgress: raw.deliveryProgress }),
    ...(raw.amount === undefined ? {} : { amount: raw.amount }),
    ...(raw.currency === undefined ? {} : { currency: raw.currency }),
    ...(raw.createdAt === undefined ? {} : { createdAt: raw.createdAt }),
    ...(raw.updatedAt === undefined ? {} : { updatedAt: raw.updatedAt }),
  })
}

function accessFor(order: NormalizedOrder, actor: TrustedActor, hiddenEntries: readonly VisibilityEntry[]): OrderAccess {
  return getOrderAccess(order, actor, { hiddenEntries })
}

function visibleItem(order: NormalizedOrder, actor: TrustedActor, hiddenEntries: readonly VisibilityEntry[]): VisibleOrder | null {
  const access = accessFor(order, actor, hiddenEntries)
  if (!access.canRead) return null
  return Object.freeze({ order, access })
}

function readRewardCandidates(): OrderCandidate[] {
  return readRewardOrders().map((raw, index) => {
    try {
      return { order: adaptRewardRecord(raw), diagnostic: null }
    } catch (error) {
      return { order: null, diagnostic: Object.freeze({ source: 'reward', index, code: readErrorCode(error, 'INVALID_ORDER_RECORD') }) }
    }
  })
}

async function readFeedingCandidates(actor: TrustedActor, perspective: OrderPerspective, yardId: string): Promise<{ candidates: OrderCandidate[]; diagnostics: Diagnostic[] }> {
  const request: GetFeedingOrdersOptions = perspective === 'yard'
    ? { variant: 'yard', yardOwnerId: actor.id, yardId }
    : { variant: 'mine', userPawId: actor.id }
  let result: unknown
  try {
    result = await getFeedingOrders(request)
  } catch {
    return { candidates: [], diagnostics: [Object.freeze({ source: 'feeding', index: -1, code: 'FEEDING_READ_FAILED' })] }
  }
  if (!isRecord(result) || result.success !== true || !isRecord(result.data) || !Array.isArray(result.data.items)) {
    return { candidates: [], diagnostics: [Object.freeze({ source: 'feeding', index: -1, code: 'FEEDING_READ_FAILED' })] }
  }
  const rawItems: unknown[] = result.data.items
  const candidates: OrderCandidate[] = []
  const diagnostics: Diagnostic[] = []
  rawItems.forEach((raw, index) => {
    try {
      candidates.push({ order: adaptFeedingRecord(raw), diagnostic: null })
    } catch (error) {
      diagnostics.push(Object.freeze({ source: 'feeding', index, code: readErrorCode(error, 'INVALID_ORDER_RECORD') }))
    }
  })
  return { candidates, diagnostics }
}

function filterBySource(candidates: OrderCandidate[], source: OrderSource): OrderCandidate[] {
  if (source === 'all') return candidates
  const orderType = source === 'reward' ? ADOPTION_GIFT : NORMAL_FEED
  return candidates.filter((candidate) => candidate.order && candidate.order.orderType === orderType)
}

function findByOrderId(candidates: OrderCandidate[], orderId: string): OrderCandidate | null {
  return candidates.find((candidate) => candidate.order && candidate.order.orderId === orderId) || null
}

function isOrderSource(value: unknown): value is OrderSource {
  return SOURCE_VALUES.some((candidate) => candidate === value)
}

function isOrderPerspective(value: unknown): value is OrderPerspective {
  return PERSPECTIVE_VALUES.some((candidate) => candidate === value)
}

function validateReadOptions(options: RuntimeOrderReadOptions): ValidationResult<{ source: OrderSource; perspective: OrderPerspective; yardId: string }> {
  const source = normalizeSource(options.source)
  if (!isOrderSource(source)) return { success: false, error: ['INVALID_SOURCE', 'order source is not supported'] }
  const perspective = normalizePerspective(options.perspective)
  if (!isOrderPerspective(perspective)) return { success: false, error: ['INVALID_PERSPECTIVE', 'order perspective is not supported'] }
  if (options.yardId !== undefined && (typeof options.yardId !== 'string' && typeof options.yardId !== 'number')) {
    return { success: false, error: ['INVALID_YARD_ID', 'yardId must be an opaque ID'] }
  }
  return { success: true, value: { source, perspective, yardId: text(options.yardId) } }
}

function validateOpaqueId(value: unknown, label: string, crossDomainPrefixes: readonly string[] = []): ValidationResult<{ id: string }> {
  const id = text(value)
  if (!id) return { success: false, error: ['MISSING_ID', `${label} is required`] }
  if (id !== value || /[/?#%]|:\/\//.test(id) || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id)) {
    return { success: false, error: ['INVALID_ID', `${label} must be an opaque ID`] }
  }
  const lower = id.toLowerCase()
  const prefix = crossDomainPrefixes.find((candidate) => lower === candidate
    || lower.startsWith(`${candidate}-`)
    || lower.startsWith(`${candidate}_`)
    || lower.startsWith(`${candidate}:`))
  if (prefix) return { success: false, error: ['CROSS_DOMAIN_ID', `${label} belongs to another business domain`] }
  return { success: true, value: { id } }
}

/**
 * Read all orders visible to the freshly resolved actor.
 *
 * `userPawId`, `yardOwnerId`, `role`, `managed`, and status query fields are
 * intentionally ignored.  The reader scopes feeding data from the trusted
 * actor and `getOrderAccess` checks each persisted order again.
 */
export async function readOrderList(options: OrderReadOptions = {}): Promise<OrderResult<OrderListData>> {
  const sourceOptions = normalizeOptions(options)
  const validated = validateReadOptions(sourceOptions)
  if (!validated.success) return failure(validated.error[0], validated.error[1], emptyListData())
  const settings = validated.value

  const resolved = resolveActor(sourceOptions.actorProvider)
  if (resolved.error || !resolved.actor) {
    return failure(readErrorCode(resolved.error, 'NO_ACTOR'), 'trusted actor is unavailable', emptyListData(), null)
  }
  const actor = resolved.actor

  let hiddenEntries
  try {
    hiddenEntries = normalizeHiddenEntries(sourceOptions.hiddenEntries)
  } catch (error) {
    return failure(readErrorCode(error, 'INVALID_VISIBILITY'), 'visibility data is invalid', emptyListData(), actor)
  }

  const diagnostics: Diagnostic[] = []
  let rewardCandidates: OrderCandidate[] = []
  if (settings.source === 'all' || settings.source === 'reward') {
    try {
      rewardCandidates = readRewardCandidates()
      diagnostics.push(...rewardCandidates.flatMap((item) => item.diagnostic ? [item.diagnostic] : []))
    } catch (error) {
      diagnostics.push(Object.freeze({ source: 'reward', index: -1, code: readErrorCode(error, 'REWARD_READ_FAILED') }))
    }
  }

  let feedingCandidates: OrderCandidate[] = []
  if (settings.source === 'all' || settings.source === 'feeding') {
    const feeding = await readFeedingCandidates(actor, settings.perspective, settings.yardId)
    feedingCandidates = feeding.candidates
    diagnostics.push(...feeding.diagnostics)
  }

  const items: VisibleOrder[] = []
  const seen = new Set<string>()
  for (const candidate of filterBySource([...rewardCandidates, ...feedingCandidates], settings.source)) {
    if (!candidate.order || seen.has(candidate.order.orderId)) continue
    seen.add(candidate.order.orderId)
    const item = visibleItem(candidate.order, actor, hiddenEntries)
    if (item) items.push(item)
  }

  const data = Object.freeze({
    items: Object.freeze(items),
    total: items.length,
    diagnostics: Object.freeze(diagnostics),
    perspective: settings.perspective,
    sourceFilter: settings.source,
  })
  return success(data, actor)
}

/** Read one explicit orderId; it never falls back to a first/last/demo item. */
export async function readOrderById(orderId: string, options: OrderReadOptions = {}): Promise<OrderResult<OrderDetailData>> {
  const sourceOptions = normalizeOptions(options)
  const normalized = validateOpaqueId(orderId, 'orderId', CROSS_DOMAIN_ORDER_PREFIXES)
  if (!normalized.success) {
    const code = normalized.error[0] === 'MISSING_ID'
      ? 'MISSING_ORDER_ID'
      : normalized.error[0] === 'CROSS_DOMAIN_ID' ? 'CROSS_DOMAIN_ID' : 'INVALID_ORDER_ID'
    return failure(code, normalized.error[1])
  }
  const id = normalized.value.id

  const validated = validateReadOptions(sourceOptions)
  if (!validated.success) return failure(validated.error[0], validated.error[1])
  const settings = validated.value
  const resolved = resolveActor(sourceOptions.actorProvider)
  if (resolved.error || !resolved.actor) {
    return failure(readErrorCode(resolved.error, 'NO_ACTOR'), 'trusted actor is unavailable')
  }
  const actor = resolved.actor

  let hiddenEntries
  try {
    hiddenEntries = normalizeHiddenEntries(sourceOptions.hiddenEntries)
  } catch (error) {
    return failure(readErrorCode(error, 'INVALID_VISIBILITY'), 'visibility data is invalid', null, actor)
  }

  const diagnostics: Diagnostic[] = []
  let rewardCandidates: OrderCandidate[] = []
  if (settings.source === 'all' || settings.source === 'reward') {
    try {
      rewardCandidates = readRewardCandidates()
      diagnostics.push(...rewardCandidates.flatMap((item) => item.diagnostic ? [item.diagnostic] : []))
    } catch (error) {
      diagnostics.push(Object.freeze({ source: 'reward', index: -1, code: readErrorCode(error, 'REWARD_READ_FAILED') }))
    }
  }
  let feedingCandidates: OrderCandidate[] = []
  if (settings.source === 'all' || settings.source === 'feeding') {
    const feeding = await readFeedingCandidates(actor, settings.perspective, settings.yardId)
    feedingCandidates = feeding.candidates
    diagnostics.push(...feeding.diagnostics)
  }

  const found = findByOrderId(filterBySource([...rewardCandidates, ...feedingCandidates], settings.source), id)
  if (!found || !found.order) return failure('NOT_FOUND', 'order was not found', null, actor)
  const item = visibleItem(found.order, actor, hiddenEntries)
  if (!item) return failure('FORBIDDEN', 'order is not visible to this actor', null, actor)
  return success(Object.freeze({ ...item, diagnostics: Object.freeze(diagnostics) }), actor)
}

/** Read one adoption gift by its stable application association. */
export async function readGiftOrderByApplicationId(applicationId: string, options: OrderReadOptions = {}): Promise<OrderResult<OrderDetailData>> {
  const normalized = validateOpaqueId(applicationId, 'applicationId', CROSS_DOMAIN_APPLICATION_PREFIXES)
  if (!normalized.success) return failure(normalized.error[0], normalized.error[1])
  const result = await readOrderList({ ...options, source: 'reward' })
  if (!result.success) return failure(result.error.code, result.error.message, null, result.actor)
  const item = result.data.items.find((candidate) => candidate.order.applicationId === normalized.value.id)
  if (!item) return failure('NOT_FOUND', 'gift order was not found', null, result.actor)
  return success(Object.freeze({ ...item, diagnostics: result.data.diagnostics }), result.actor)
}

export const readOrders = readOrderList
export const readOrderDetail = readOrderById
