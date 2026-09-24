/**
 * Per-user order visibility persistence.
 *
 * Hiding an order is a user preference, not an order mutation: the row is
 * scoped by `{ userId, orderId }`, does not alter the order or its fulfillment
 * record, and never grants access to another actor. This module is local to
 * the feeding package so a future order page can consume it without pulling a
 * new root dependency into the main package.
 */

type JsonRecord = Record<string, unknown>

interface TrustedActor {
  readonly id: string
}

interface VisibilityRow {
  readonly userId: string
  readonly orderId: string
  readonly hidden: boolean
}

export interface OrderVisibilityOptions {
  readonly actorProvider?: () => unknown
  readonly orderId?: string
}

interface VisibilityOptions extends JsonRecord {
  readonly actorProvider?: unknown
  readonly orderId?: unknown
}

interface ActorResolution {
  readonly actor: TrustedActor | null
  readonly error: unknown | null
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
  readonly readOnly: false
  readonly canWrite: true
  readonly idempotent?: boolean
}

type FeedbackResult<T> = FeedbackSuccess<T> | FeedbackFailure<T>

interface VisibilityList {
  readonly items: readonly VisibilityRow[]
  readonly total: number
}

export const ORDER_VISIBILITY_STORAGE_KEY = 'PAWHOME_ORDER_VISIBILITY'
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const CROSS_DOMAIN = ['application', 'adoption', 'rescue', 'dynamic', 'animal', 'yard']

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isProvider(value: unknown): value is () => unknown {
  return typeof value === 'function'
}

function frozen<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value
  seen.add(value)
  for (const key of Reflect.ownKeys(value)) frozen(Reflect.get(value, key), seen)
  return Object.freeze(value)
}

function failure<T = never>(
  code: string,
  message: string,
  actor: TrustedActor | null = null,
  data: T | null = null,
): FeedbackFailure<T> {
  return frozen({
    success: false,
    data,
    error: { code, message },
    actor,
    readOnly: true,
    canWrite: false,
  })
}

function success<T>(
  data: T,
  actor: TrustedActor,
  extra: Readonly<{ idempotent?: boolean }> = {},
): FeedbackSuccess<T> {
  return frozen({
    success: true,
    data,
    error: null,
    actor,
    readOnly: false,
    canWrite: true,
    ...extra,
  })
}

function codedError(code: string, message: string): Error & { code: string } {
  return Object.assign(new Error(message), { code })
}

function errorCode(error: unknown, fallback: string): string {
  return isRecord(error) && typeof error.code === 'string' && error.code ? error.code : fallback
}

function id(value: unknown, label: string): string {
  if (
    typeof value !== 'string' ||
    value !== value.trim() ||
    !SAFE_ID.test(value) ||
    URL_MARKERS.test(value)
  ) {
    throw codedError(value ? 'INVALID_ID' : 'MISSING_ID', `${label} is invalid`)
  }
  const lower = value.toLowerCase()
  if (
    CROSS_DOMAIN.some(
      (prefix) =>
        lower === prefix ||
        lower.startsWith(`${prefix}-`) ||
        lower.startsWith(`${prefix}_`) ||
        lower.startsWith(`${prefix}:`),
    )
  ) {
    throw codedError('CROSS_DOMAIN_ID', `${label} belongs to another domain`)
  }
  return value
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
    return {
      actor: frozen({ id: id(String(candidate.id || candidate.actorId || ''), 'actor.id') }),
      error: null,
    }
  } catch (error) {
    return { actor: null, error }
  }
}

function normalizeEntry(value: unknown): VisibilityRow {
  if (!isRecord(value)) throw codedError('INVALID_VISIBILITY', 'visibility row is invalid')
  const userId = id(String(value.userId || ''), 'visibility.userId')
  const orderId = id(String(value.orderId || ''), 'visibility.orderId')
  if (typeof value.hidden !== 'boolean')
    throw codedError('INVALID_VISIBILITY', 'visibility.hidden must be boolean')
  return { userId, orderId, hidden: value.hidden }
}

function hasErrorCode(error: unknown): boolean {
  return isRecord(error) && typeof error.code === 'string' && Boolean(error.code)
}

function readRaw(): VisibilityRow[] {
  let raw: unknown
  try {
    raw = uni.getStorageSync(ORDER_VISIBILITY_STORAGE_KEY)
  } catch {
    throw codedError('STORAGE_READ_FAILED', 'visibility storage read failed')
  }
  if (raw === undefined || raw === null || raw === '') return []
  try {
    const value: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(value))
      throw codedError('INVALID_VISIBILITY_STORAGE', 'visibility storage must be an array')
    const rows = value.map(normalizeEntry)
    const keys = new Set<string>()
    for (const row of rows) {
      const key = `${row.userId}\u0000${row.orderId}`
      if (keys.has(key)) throw codedError('DUPLICATE_VISIBILITY', 'visibility row is duplicated')
      keys.add(key)
    }
    return rows
  } catch (error) {
    if (hasErrorCode(error)) throw error
    throw codedError('INVALID_VISIBILITY_STORAGE', 'visibility storage is not valid JSON')
  }
}

function writeRaw(rows: readonly VisibilityRow[]): void {
  try {
    uni.setStorageSync(ORDER_VISIBILITY_STORAGE_KEY, JSON.stringify(rows))
  } catch {
    throw codedError('STORAGE_WRITE_FAILED', 'visibility write was not acknowledged')
  }
}

function optionsOf(value: unknown): VisibilityOptions {
  return isRecord(value) ? value : {}
}

/** Read the current actor's order visibility preferences. */
export function readOrderVisibility(
  options: OrderVisibilityOptions = {},
): FeedbackResult<VisibilityList> {
  const source = optionsOf(options)
  const resolved = actorOf(source.actorProvider)
  const actor = resolved.actor
  if (resolved.error || !actor)
    return failure(errorCode(resolved.error, 'NO_ACTOR'), 'trusted actor is unavailable')
  let target = ''
  try {
    if (source.orderId !== undefined) target = id(String(source.orderId), 'orderId')
  } catch (error) {
    return failure(errorCode(error, 'INVALID_ID'), 'order ID is invalid', actor)
  }
  try {
    const items = readRaw().filter(
      (row) => row.userId === actor.id && (!target || row.orderId === target),
    )
    return success({ items, total: items.length }, actor)
  } catch (error) {
    return failure(
      errorCode(error, 'VISIBILITY_READ_FAILED'),
      'order visibility read failed closed',
      actor,
    )
  }
}

/** Persist one user-scoped hide/unhide preference; retries are idempotent. */
export function setOrderHidden(
  orderId: string,
  hidden: boolean,
  options: OrderVisibilityOptions = {},
): FeedbackResult<{
  readonly userId: string
  readonly orderId: string
  readonly hidden: boolean
}> {
  const source = optionsOf(options)
  const resolved = actorOf(source.actorProvider)
  const actor = resolved.actor
  if (resolved.error || !actor)
    return failure(errorCode(resolved.error, 'NO_ACTOR'), 'trusted actor is unavailable')
  if (typeof hidden !== 'boolean')
    return failure('INVALID_VISIBILITY', 'hidden must be boolean', actor)
  let target: string
  try {
    target = id(String(orderId || ''), 'orderId')
  } catch (error) {
    return failure(errorCode(error, 'INVALID_ID'), 'order ID is invalid', actor)
  }
  let rows: VisibilityRow[]
  try {
    rows = readRaw()
  } catch (error) {
    return failure(
      errorCode(error, 'VISIBILITY_READ_FAILED'),
      'order visibility read failed closed',
      actor,
    )
  }
  const next = rows.filter((row) => !(row.userId === actor.id && row.orderId === target))
  next.push({ userId: actor.id, orderId: target, hidden })
  try {
    writeRaw(next)
  } catch (error) {
    return failure(
      errorCode(error, 'STORAGE_WRITE_FAILED'),
      'order visibility write was not acknowledged',
      actor,
    )
  }
  return success({ userId: actor.id, orderId: target, hidden }, actor, {
    idempotent: rows.some(
      (row) => row.userId === actor.id && row.orderId === target && row.hidden === hidden,
    ),
  })
}

export const readVisibility = readOrderVisibility
export const hideOrderForUser = (orderId: string, options: OrderVisibilityOptions = {}) =>
  setOrderHidden(orderId, true, options)
export const unhideOrderForUser = (orderId: string, options: OrderVisibilityOptions = {}) =>
  setOrderHidden(orderId, false, options)
