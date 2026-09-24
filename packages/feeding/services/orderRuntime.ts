/**
 * Package-local persisted order reader used by the order detail page.
 *
 * The full order contract remains in `orderAdapter.ts` for governance and
 * future backend adapters. This small reader keeps the registered feeding
 * page out of the main package: it reads only the two persisted order keys,
 * applies the current actor scope, and never creates a fixture or a write
 * capability.
 */

type JsonRecord = Record<string, unknown>
type OrderType = 'adoption_gift' | 'normal_feed'

interface TrustedActor {
  readonly id: string
}

interface PersistedOrder {
  readonly orderId: string
  readonly orderType: OrderType
  readonly applicationId?: string
  readonly userId?: string
  readonly yardId?: string
  readonly animalId?: string
  readonly status: string
  readonly createdAt?: unknown
  readonly updatedAt?: unknown
}

interface OrderAccess {
  readonly canRead: true
  readonly canWrite: false
}

interface OrderDetailData {
  readonly order: PersistedOrder
  readonly access: OrderAccess
}

interface FeedbackError {
  readonly code: string
  readonly message: string
}

interface FeedbackFailure<T> {
  readonly success: false
  readonly data: T | null
  readonly error: FeedbackError
  readonly actor: TrustedActor | null
  readonly readOnly: true
  readonly canWrite: false
}

interface FeedbackSuccess<T> {
  readonly success: true
  readonly data: T
  readonly error: null
  readonly actor: TrustedActor
  readonly readOnly: true
  readonly canWrite: false
}

type FeedbackResult<T> = FeedbackSuccess<T> | FeedbackFailure<T>

interface ActorResolution {
  readonly actor: TrustedActor | null
  readonly error: unknown | null
}

export interface OrderVisibilityEntryInput {
  readonly userId: string
  readonly orderId: string
  readonly hidden: boolean
}

export interface PersistedOrderDetailReadOptions {
  readonly actorProvider: () => unknown
  readonly hiddenEntries?: readonly OrderVisibilityEntryInput[]
}

interface OrderCandidate {
  readonly record: JsonRecord
  readonly orderType: OrderType
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const CROSS_DOMAIN = ['application', 'adoption', 'rescue', 'dynamic', 'animal', 'yard']
const STATUS_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  'waiting-logistics': 'shipping',
  'waiting-cloud-effective': 'shipping',
  'cloud-active-timeout': 'delivered',
  'cloud-active-feedback': 'delivered',
  done: 'completed',
  fulfilled: 'completed',
})

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isProvider(value: unknown): value is () => unknown {
  return typeof value === 'function'
}

function freeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value
  seen.add(value)
  for (const key of Reflect.ownKeys(value)) freeze(Reflect.get(value, key), seen)
  return Object.freeze(value)
}

function fail<T = never>(
  code: string,
  message: string,
  actor: TrustedActor | null = null,
): FeedbackFailure<T> {
  return freeze({
    success: false,
    data: null,
    error: { code, message },
    actor,
    readOnly: true,
    canWrite: false,
  })
}

function errorCode(error: unknown, fallback: string): string {
  return isRecord(error) && typeof error.code === 'string' && error.code ? error.code : fallback
}

function id(value: unknown, label: string): string {
  const result =
    typeof value === 'string'
      ? value.trim()
      : value === undefined || value === null
        ? ''
        : String(value)
  if (!result || !SAFE_ID.test(result) || URL_MARKERS.test(result)) {
    throw Object.assign(new Error(`${label} is invalid`), { code: 'INVALID_ID' })
  }
  const lower = result.toLowerCase()
  if (
    CROSS_DOMAIN.some(
      (prefix) =>
        lower === prefix ||
        lower.startsWith(`${prefix}-`) ||
        lower.startsWith(`${prefix}_`) ||
        lower.startsWith(`${prefix}:`),
    )
  ) {
    throw Object.assign(new Error(`${label} belongs to another domain`), {
      code: 'CROSS_DOMAIN_ID',
    })
  }
  return result
}

function relatedId(value: unknown, label: string): string {
  const result =
    typeof value === 'string'
      ? value.trim()
      : value === undefined || value === null
        ? ''
        : String(value)
  if (!result || !SAFE_ID.test(result) || URL_MARKERS.test(result)) {
    throw Object.assign(new Error(`${label} is invalid`), { code: 'INVALID_ID' })
  }
  return result
}

function actorOf(provider: unknown): ActorResolution {
  let value: unknown
  try {
    value = isProvider(provider) ? provider() : null
  } catch {
    return { actor: null, error: { code: 'ACTOR_PROVIDER_FAILED' } }
  }
  const candidate = isRecord(value) && value.actor ? value.actor : value
  if (!isRecord(candidate)) return { actor: null, error: { code: 'NO_ACTOR' } }
  try {
    return { actor: freeze({ id: id(candidate.id || candidate.actorId, 'actor.id') }), error: null }
  } catch (error) {
    return { actor: null, error }
  }
}

function rows(key: string): JsonRecord[] {
  let raw: unknown
  try {
    raw = uni.getStorageSync(key)
  } catch {
    throw Object.assign(new Error('order storage read failed'), { code: 'STORAGE_READ_FAILED' })
  }
  if (raw === undefined || raw === null || raw === '') return []
  try {
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(parsed)) throw new Error('order storage must be an array')
    return parsed.filter(isRecord)
  } catch {
    throw Object.assign(new Error('order storage is invalid'), { code: 'INVALID_ORDER_STORAGE' })
  }
}

function scoped(record: JsonRecord, actorId: string): boolean {
  return [
    record.userId,
    record.userPawId,
    record.donorId,
    record.applicantId,
    record.yardOwnerId,
    record.ownerPawId,
  ].some((value) => value === actorId)
}

function adoptionApplication(applicationId: string): JsonRecord | null {
  if (!applicationId) return null
  const records = rows('PAWHOME_ADOPTIONS')
  return (
    records.find((record) =>
      [record.id, record.recordId, record.applicationId].some(
        (value) => String(value || '') === applicationId,
      ),
    ) || null
  )
}

function canReadReward(record: JsonRecord, actorId: string): boolean {
  const applicationId = String(record.applicationId || record.recordId || '')
  if (!applicationId) return false
  const directActors = [record.userId, record.userPawId, record.applicantId, record.applicantUserId]
    .map((value) => String(value || ''))
    .filter(Boolean)
  const application = adoptionApplication(applicationId)
  if (application) {
    const applicants = [application.applicantId, application.applicantUserId]
      .map((value) => String(value || ''))
      .filter(Boolean)
    if (!applicants.length || !applicants.every((value) => value === actorId)) return false
  }
  // A legacy order can be read only when its persisted user binding agrees
  // with the trusted actor. Once the application row exists, that relation is
  // authoritative as well.
  return directActors.length > 0 && directActors.every((value) => value === actorId)
}

function statusOf(record: JsonRecord): string {
  const raw = String(record.status || record.stateKey || '').trim()
  return STATUS_ALIASES[raw] || raw || 'pending'
}

function orderOf(record: JsonRecord, orderType: OrderType): PersistedOrder | null {
  const rawOrderId = record.orderId || record.id
  if (!rawOrderId) return null
  return freeze({
    orderId: id(rawOrderId, 'orderId'),
    orderType,
    ...(record.applicationId
      ? { applicationId: relatedId(record.applicationId, 'applicationId') }
      : {}),
    ...(record.userId || record.userPawId
      ? { userId: String(record.userId || record.userPawId) }
      : {}),
    ...(record.yardId ? { yardId: relatedId(record.yardId, 'yardId') } : {}),
    ...(record.animalId || record.petId
      ? { animalId: relatedId(record.animalId || record.petId, 'animalId') }
      : {}),
    status: statusOf(record),
    ...(record.createdAt ? { createdAt: record.createdAt } : {}),
    ...(record.updatedAt ? { updatedAt: record.updatedAt } : {}),
  })
}

function candidatesFor(records: readonly JsonRecord[], orderType: OrderType): OrderCandidate[] {
  return records.map((record) => ({ record, orderType }))
}

function isHiddenEntry(value: unknown, actorId: string, orderId: string): boolean {
  return (
    isRecord(value) &&
    value.userId === actorId &&
    value.orderId === orderId &&
    value.hidden === true
  )
}

export async function readPersistedOrderDetail(
  orderId: string,
  options: PersistedOrderDetailReadOptions,
): Promise<FeedbackResult<OrderDetailData>> {
  const resolved = actorOf(options.actorProvider)
  const actor = resolved.actor
  if (resolved.error || !actor)
    return fail(errorCode(resolved.error, 'NO_ACTOR'), 'trusted actor is unavailable')
  let target: string
  try {
    target = id(orderId, 'orderId')
  } catch (error) {
    return fail(errorCode(error, 'INVALID_ID'), 'order ID is invalid', actor)
  }
  if (
    Array.isArray(options.hiddenEntries) &&
    options.hiddenEntries.some((item) => isHiddenEntry(item, actor.id, target))
  ) {
    return fail('HIDDEN', 'order is hidden for this actor', actor)
  }
  try {
    const candidates = [
      ...candidatesFor(rows('PAWHOME_REWARD_ORDERS'), 'adoption_gift'),
      ...candidatesFor(rows('PAWHOME_FEEDING_ORDERS'), 'normal_feed'),
    ]
    const match = candidates.find(
      ({ record }) => String(record.orderId || record.id || '') === target,
    )
    if (!match) return fail('NOT_FOUND', 'order was not found', resolved.actor)
    const visible =
      match.orderType === 'adoption_gift'
        ? canReadReward(match.record, actor.id)
        : scoped(match.record, actor.id)
    if (!visible) return fail('NOT_FOUND', 'order was not found', actor)
    const order = orderOf(match.record, match.orderType)
    if (!order) return fail('INVALID_ORDER_RECORD', 'order record is invalid', actor)
    return freeze({
      success: true,
      data: { order, access: { canRead: true, canWrite: false } },
      error: null,
      actor,
      readOnly: true,
      canWrite: false,
    })
  } catch (error) {
    return fail(errorCode(error, 'ORDER_READ_FAILED'), 'order detail read failed closed', actor)
  }
}

export const readOrderDetail = readPersistedOrderDetail
