/**
 * Per-user order visibility persistence.
 *
 * Hiding an order is a user preference, not an order mutation: the row is
 * scoped by `{ userId, orderId }`, does not alter the order or its fulfillment
 * record, and never grants access to another actor.  This module is local to
 * the feeding package so a future order page can consume it without pulling a
 * new root dependency into the main package.
 */

export const ORDER_VISIBILITY_STORAGE_KEY = 'PAWHOME_ORDER_VISIBILITY'
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const CROSS_DOMAIN = ['application', 'adoption', 'rescue', 'dynamic', 'animal', 'yard']

function frozen(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value
  seen.add(value)
  for (const key of Reflect.ownKeys(value)) frozen(value[key], seen)
  return Object.freeze(value)
}

function failure(code, message, actor = null, data = null) {
  return frozen({ success: false, data, error: { code, message }, actor, readOnly: true, canWrite: false })
}

function success(data, actor, extra = {}) {
  return frozen({ success: true, data, error: null, actor, readOnly: false, canWrite: true, ...extra })
}

function id(value, label) {
  if (typeof value !== 'string' || value !== value.trim() || !SAFE_ID.test(value) || URL_MARKERS.test(value)) {
    const error = new Error(`${label} is invalid`); error.code = value ? 'INVALID_ID' : 'MISSING_ID'; throw error
  }
  const lower = value.toLowerCase()
  if (CROSS_DOMAIN.some(prefix => lower === prefix || lower.startsWith(`${prefix}-`) || lower.startsWith(`${prefix}_`) || lower.startsWith(`${prefix}:`))) {
    const error = new Error(`${label} belongs to another domain`); error.code = 'CROSS_DOMAIN_ID'; throw error
  }
  return value
}

function actorOf(provider) {
  let value
  try { value = typeof provider === 'function' ? provider() : null } catch (error) { return { actor: null, error: { code: 'ACTOR_PROVIDER_FAILED' } } }
  const actor = value && typeof value === 'object' && value.actor ? value.actor : value
  if (!actor || typeof actor !== 'object' || Array.isArray(actor)) return { actor: null, error: { code: 'NO_ACTOR' } }
  try { return { actor: frozen({ id: id(String(actor.id || actor.actorId || ''), 'actor.id') }), error: null } } catch (error) { return { actor: null, error } }
}

function normalizeEntry(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) { const e = new Error('visibility row is invalid'); e.code = 'INVALID_VISIBILITY'; throw e }
  const userId = id(String(value.userId || ''), 'visibility.userId')
  const orderId = id(String(value.orderId || ''), 'visibility.orderId')
  if (typeof value.hidden !== 'boolean') { const e = new Error('visibility.hidden must be boolean'); e.code = 'INVALID_VISIBILITY'; throw e }
  return { userId, orderId, hidden: value.hidden }
}

function readRaw() {
  let raw
  try { raw = uni.getStorageSync(ORDER_VISIBILITY_STORAGE_KEY) } catch (error) { const e = new Error('visibility storage read failed'); e.code = 'STORAGE_READ_FAILED'; throw e }
  if (raw === undefined || raw === null || raw === '') return []
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(value)) { const e = new Error('visibility storage must be an array'); e.code = 'INVALID_VISIBILITY_STORAGE'; throw e }
    const rows = value.map(normalizeEntry)
    const keys = new Set()
    for (const row of rows) {
      const key = `${row.userId}\u0000${row.orderId}`
      if (keys.has(key)) { const e = new Error('visibility row is duplicated'); e.code = 'DUPLICATE_VISIBILITY'; throw e }
      keys.add(key)
    }
    return rows
  } catch (error) {
    if (error && error.code) throw error
    const e = new Error('visibility storage is not valid JSON'); e.code = 'INVALID_VISIBILITY_STORAGE'; throw e
  }
}

function writeRaw(rows) {
  try { uni.setStorageSync(ORDER_VISIBILITY_STORAGE_KEY, JSON.stringify(rows)) } catch (error) { const e = new Error('visibility write was not acknowledged'); e.code = 'STORAGE_WRITE_FAILED'; throw e }
}

export function readOrderVisibility({ actorProvider, orderId } = {}) {
  const resolved = actorOf(actorProvider)
  if (resolved.error || !resolved.actor) return failure(resolved.error.code, 'trusted actor is unavailable')
  let target = ''
  try { if (orderId !== undefined) target = id(String(orderId), 'orderId') } catch (error) { return failure(error.code || 'INVALID_ID', 'order ID is invalid', resolved.actor) }
  try {
    const items = readRaw().filter(row => row.userId === resolved.actor.id && (!target || row.orderId === target))
    return success({ items, total: items.length }, resolved.actor)
  } catch (error) { return failure(error.code || 'VISIBILITY_READ_FAILED', 'order visibility read failed closed', resolved.actor) }
}

/** Persist one user-scoped hide/unhide preference; retries are idempotent. */
export function setOrderHidden(orderId, hidden, { actorProvider } = {}) {
  const resolved = actorOf(actorProvider)
  if (resolved.error || !resolved.actor) return failure(resolved.error.code, 'trusted actor is unavailable')
  if (typeof hidden !== 'boolean') return failure('INVALID_VISIBILITY', 'hidden must be boolean', resolved.actor)
  let target
  try { target = id(String(orderId || ''), 'orderId') } catch (error) { return failure(error.code || 'INVALID_ID', 'order ID is invalid', resolved.actor) }
  let rows
  try { rows = readRaw() } catch (error) { return failure(error.code || 'VISIBILITY_READ_FAILED', 'order visibility read failed closed', resolved.actor) }
  const next = rows.filter(row => !(row.userId === resolved.actor.id && row.orderId === target))
  next.push({ userId: resolved.actor.id, orderId: target, hidden })
  try { writeRaw(next) } catch (error) { return failure(error.code || 'STORAGE_WRITE_FAILED', 'order visibility write was not acknowledged', resolved.actor) }
  return success({ userId: resolved.actor.id, orderId: target, hidden }, resolved.actor, { idempotent: rows.some(row => row.userId === resolved.actor.id && row.orderId === target && row.hidden === hidden) })
}

export const readVisibility = readOrderVisibility
export const hideOrderForUser = (orderId, options = {}) => setOrderHidden(orderId, true, options)
export const unhideOrderForUser = (orderId, options = {}) => setOrderHidden(orderId, false, options)
