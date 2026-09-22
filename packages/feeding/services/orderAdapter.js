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
import { resolveTrustedActor } from '../../../navigation/actorCapabilities.js'
import {
  ADOPTION_GIFT,
  NORMAL_FEED,
  getOrderAccess,
  normalizeOrderRecord,
  normalizeVisibilityEntry,
  visibilityKey,
} from '../../../navigation/orderContracts.js'
import { readRewardOrders } from '../../../utils/rewardOrderStorage.js'
import { getFeedingOrders } from './orderMockApi.js'

const SOURCE_VALUES = Object.freeze(['all', 'reward', 'feeding'])
const PERSPECTIVE_VALUES = Object.freeze(['mine', 'yard'])
const FEEDING_STATUS_BY_STATE = Object.freeze({
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
const CROSS_DOMAIN_APPLICATION_PREFIXES = Object.freeze([
  'rescue',
  'feeding',
  'order',
  'dynamic',
  'yard',
  'animal',
])
const CROSS_DOMAIN_ORDER_PREFIXES = Object.freeze([
  'application',
  'adoption',
  'rescue',
  'dynamic',
  'animal',
])
function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function firstValue(source, keys) {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null && source[key] !== '') return source[key]
  }
  return undefined
}

function actorBinding(source) {
  const values = ['userId', 'userPawId', 'applicantId', 'applicantUserId']
    .map(key => source && source[key])
    .filter(value => value !== undefined && value !== null && value !== '')
    .map(value => String(value).trim())
  const unique = [...new Set(values)]
  if (unique.length > 1) throw Object.assign(new Error('reward order actor aliases disagree'), { code: 'ACTOR_ASSOCIATION_CONFLICT' })
  return unique[0]
}

function text(value) {
  return value === undefined || value === null ? '' : String(value).trim()
}

function failure(code, message, data = null, actor = null) {
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

function success(data, actor) {
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

function emptyListData(diagnostics = []) {
  const items = Object.freeze([])
  return Object.freeze({
    items,
    total: 0,
    diagnostics: Object.freeze(diagnostics.slice()),
  })
}

function readErrorCode(error, fallback = 'ORDER_READ_FAILED') {
  return error && typeof error.code === 'string' && error.code ? error.code : fallback
}

function resolveActor(actorProvider) {
  try {
    const actor = resolveTrustedActor(actorProvider)
    return { actor, error: null }
  } catch (error) {
    return { actor: null, error }
  }
}

function normalizePerspective(value) {
  return value === undefined || value === null || value === '' ? 'mine' : value
}

function normalizeSource(value) {
  return value === undefined || value === null || value === '' ? 'all' : value
}

function normalizeOptions(options) {
  return isRecord(options) ? options : {}
}

function normalizeHiddenEntries(value) {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw Object.assign(new Error('visibility entries must be an array'), { code: 'INVALID_VISIBILITY' })
  return value.map(normalizeVisibilityEntry)
}

/** Convert one persisted legacy reward record without copying address/private extras. */
function adaptRewardRecord(raw) {
  if (!isRecord(raw)) throw Object.assign(new Error('reward order must be an object'), { code: 'INVALID_ORDER_RECORD' })
  const explicitType = firstValue(raw, ['orderType', 'type'])
  if (explicitType !== undefined && explicitType !== ADOPTION_GIFT) {
    throw Object.assign(new Error('reward storage contains a non-gift order'), { code: 'ORDER_TYPE_MISMATCH' })
  }
  const applicationId = firstValue(raw, ['applicationId', 'recordId'])
  const userId = actorBinding(raw)
  const yardOwnerId = firstValue(raw, ['yardOwnerId', 'ownerPawId'])
  const animalId = firstValue(raw, ['animalId', 'petId'])
  const input = {
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

function adaptFeedingRecord(raw) {
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

function accessFor(order, actor, hiddenEntries) {
  return getOrderAccess(order, actor, { hiddenEntries })
}

function visibleItem(order, actor, hiddenEntries) {
  const access = accessFor(order, actor, hiddenEntries)
  if (!access.canRead) return null
  return Object.freeze({ order, access })
}

function readRewardCandidates() {
  return readRewardOrders().map((raw, index) => {
    try {
      return { order: adaptRewardRecord(raw), diagnostic: null }
    } catch (error) {
      return { order: null, diagnostic: Object.freeze({ source: 'reward', index, code: readErrorCode(error, 'INVALID_ORDER_RECORD') }) }
    }
  })
}

async function readFeedingCandidates(actor, perspective, yardId) {
  const request = perspective === 'yard'
    ? { variant: 'yard', yardOwnerId: actor.id, yardId }
    : { variant: 'mine', userPawId: actor.id }
  let result
  try {
    result = await getFeedingOrders(request)
  } catch (error) {
    return { candidates: [], diagnostics: [Object.freeze({ source: 'feeding', index: -1, code: 'FEEDING_READ_FAILED' })] }
  }
  if (!result || result.success !== true || !result.data || !Array.isArray(result.data.items)) {
    return { candidates: [], diagnostics: [Object.freeze({ source: 'feeding', index: -1, code: 'FEEDING_READ_FAILED' })] }
  }
  const candidates = []
  const diagnostics = []
  result.data.items.forEach((raw, index) => {
    try {
      candidates.push({ order: adaptFeedingRecord(raw), diagnostic: null })
    } catch (error) {
      diagnostics.push(Object.freeze({ source: 'feeding', index, code: readErrorCode(error, 'INVALID_ORDER_RECORD') }))
    }
  })
  return { candidates, diagnostics }
}

function filterBySource(candidates, source) {
  if (source === 'all') return candidates
  const orderType = source === 'reward' ? ADOPTION_GIFT : NORMAL_FEED
  return candidates.filter((candidate) => candidate.order && candidate.order.orderType === orderType)
}

function findByOrderId(candidates, orderId) {
  return candidates.find((candidate) => candidate.order && candidate.order.orderId === orderId) || null
}

function validateReadOptions(options) {
  const source = normalizeSource(options.source)
  if (!SOURCE_VALUES.includes(source)) return { error: ['INVALID_SOURCE', 'order source is not supported'] }
  const perspective = normalizePerspective(options.perspective)
  if (!PERSPECTIVE_VALUES.includes(perspective)) return { error: ['INVALID_PERSPECTIVE', 'order perspective is not supported'] }
  if (options.yardId !== undefined && (typeof options.yardId !== 'string' && typeof options.yardId !== 'number')) {
    return { error: ['INVALID_YARD_ID', 'yardId must be an opaque ID'] }
  }
  return { source, perspective, yardId: text(options.yardId) }
}

function validateOpaqueId(value, label, crossDomainPrefixes = []) {
  const id = text(value)
  if (!id) return { error: ['MISSING_ID', `${label} is required`] }
  if (id !== value || /[/?#%]|:\/\//.test(id) || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id)) {
    return { error: ['INVALID_ID', `${label} must be an opaque ID`] }
  }
  const lower = id.toLowerCase()
  const prefix = crossDomainPrefixes.find((candidate) => lower === candidate
    || lower.startsWith(`${candidate}-`)
    || lower.startsWith(`${candidate}_`)
    || lower.startsWith(`${candidate}:`))
  if (prefix) return { error: ['CROSS_DOMAIN_ID', `${label} belongs to another business domain`] }
  return { id }
}

/**
 * Read all orders visible to the freshly resolved actor.
 *
 * `userPawId`, `yardOwnerId`, `role`, `managed`, and status query fields are
 * intentionally ignored.  The reader scopes feeding data from the trusted
 * actor and `getOrderAccess` checks each persisted order again.
 */
export async function readOrderList(options = {}) {
  const sourceOptions = normalizeOptions(options)
  const validated = validateReadOptions(sourceOptions)
  if (validated.error) return failure(validated.error[0], validated.error[1], emptyListData())

  const resolved = resolveActor(sourceOptions.actorProvider)
  if (resolved.error || !resolved.actor) {
    return failure(readErrorCode(resolved.error, 'NO_ACTOR'), 'trusted actor is unavailable', emptyListData(), null)
  }

  let hiddenEntries
  try {
    hiddenEntries = normalizeHiddenEntries(sourceOptions.hiddenEntries)
  } catch (error) {
    return failure(readErrorCode(error, 'INVALID_VISIBILITY'), 'visibility data is invalid', emptyListData(), resolved.actor)
  }

  const diagnostics = []
  let rewardCandidates = []
  if (validated.source === 'all' || validated.source === 'reward') {
    try {
      rewardCandidates = readRewardCandidates()
      diagnostics.push(...rewardCandidates.map((item) => item.diagnostic).filter(Boolean))
    } catch (error) {
      diagnostics.push(Object.freeze({ source: 'reward', index: -1, code: readErrorCode(error, 'REWARD_READ_FAILED') }))
    }
  }

  let feedingCandidates = []
  if (validated.source === 'all' || validated.source === 'feeding') {
    const feeding = await readFeedingCandidates(resolved.actor, validated.perspective, validated.yardId)
    feedingCandidates = feeding.candidates
    diagnostics.push(...feeding.diagnostics)
  }

  const items = []
  const seen = new Set()
  for (const candidate of filterBySource([...rewardCandidates, ...feedingCandidates], validated.source)) {
    if (!candidate.order || seen.has(candidate.order.orderId)) continue
    seen.add(candidate.order.orderId)
    const item = visibleItem(candidate.order, resolved.actor, hiddenEntries)
    if (item) items.push(item)
  }

  const data = Object.freeze({
    items: Object.freeze(items),
    total: items.length,
    diagnostics: Object.freeze(diagnostics),
    perspective: validated.perspective,
    sourceFilter: validated.source,
  })
  return success(data, resolved.actor)
}

/** Read one explicit orderId; it never falls back to a first/last/demo item. */
export async function readOrderById(orderId, options = {}) {
  const sourceOptions = normalizeOptions(options)
  const normalized = validateOpaqueId(orderId, 'orderId', CROSS_DOMAIN_ORDER_PREFIXES)
  if (normalized.error) {
    const code = normalized.error[0] === 'MISSING_ID'
      ? 'MISSING_ORDER_ID'
      : normalized.error[0] === 'CROSS_DOMAIN_ID' ? 'CROSS_DOMAIN_ID' : 'INVALID_ORDER_ID'
    return failure(code, normalized.error[1])
  }
  const id = normalized.id

  const validated = validateReadOptions(sourceOptions)
  if (validated.error) return failure(validated.error[0], validated.error[1])
  const resolved = resolveActor(sourceOptions.actorProvider)
  if (resolved.error || !resolved.actor) {
    return failure(readErrorCode(resolved.error, 'NO_ACTOR'), 'trusted actor is unavailable')
  }

  let hiddenEntries
  try {
    hiddenEntries = normalizeHiddenEntries(sourceOptions.hiddenEntries)
  } catch (error) {
    return failure(readErrorCode(error, 'INVALID_VISIBILITY'), 'visibility data is invalid', null, resolved.actor)
  }

  const diagnostics = []
  let rewardCandidates = []
  if (validated.source === 'all' || validated.source === 'reward') {
    try {
      rewardCandidates = readRewardCandidates()
      diagnostics.push(...rewardCandidates.map((item) => item.diagnostic).filter(Boolean))
    } catch (error) {
      diagnostics.push(Object.freeze({ source: 'reward', index: -1, code: readErrorCode(error, 'REWARD_READ_FAILED') }))
    }
  }
  let feedingCandidates = []
  if (validated.source === 'all' || validated.source === 'feeding') {
    const feeding = await readFeedingCandidates(resolved.actor, validated.perspective, validated.yardId)
    feedingCandidates = feeding.candidates
    diagnostics.push(...feeding.diagnostics)
  }

  const found = findByOrderId(filterBySource([...rewardCandidates, ...feedingCandidates], validated.source), id)
  if (!found || !found.order) return failure('NOT_FOUND', 'order was not found', null, resolved.actor)
  const item = visibleItem(found.order, resolved.actor, hiddenEntries)
  if (!item) return failure('FORBIDDEN', 'order is not visible to this actor', null, resolved.actor)
  return success(Object.freeze({ ...item, diagnostics: Object.freeze(diagnostics) }), resolved.actor)
}

/** Read one adoption gift by its stable application association. */
export async function readGiftOrderByApplicationId(applicationId, options = {}) {
  const normalized = validateOpaqueId(applicationId, 'applicationId', CROSS_DOMAIN_APPLICATION_PREFIXES)
  if (normalized.error) return failure(normalized.error[0], normalized.error[1])
  const result = await readOrderList({ ...normalizeOptions(options), source: 'reward' })
  if (!result.success) return result
  const item = result.data.items.find((candidate) => candidate.order.applicationId === normalized.id)
  if (!item) return failure('NOT_FOUND', 'gift order was not found', null, result.actor)
  return success(Object.freeze({ ...item, diagnostics: result.data.diagnostics }), result.actor)
}

export const readOrders = readOrderList
export const readOrderDetail = readOrderById
