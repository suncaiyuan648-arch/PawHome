/**
 * Local, fail-closed storage bridge for auth continuations.
 *
 * A continuation is a validated deep-link target plus (for a notification)
 * the stable message ID that must be re-read after login.  It never stores a
 * callback, arbitrary URL, role, status, or business action.  Login may only
 * restore the target; the destination page still re-reads the current record
 * and the current actor before rendering or allowing a write.
 */

import { createDeepLink, restoreAfterAuth } from './deeplinkContracts.js'

export const AUTH_CONTINUATION_STORAGE_KEY = 'PAWHOME_AUTH_CONTINUATION'
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const CATEGORIES = Object.freeze(['interaction', 'order', 'service', 'system', 'activity', 'pet'])
const MAX_AGE_MS = 30 * 60 * 1000

function freeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value
  seen.add(value)
  for (const key of Reflect.ownKeys(value)) freeze(value[key], seen)
  return Object.freeze(value)
}

function error(code, message) {
  return Object.freeze({ success: false, data: null, error: { code, message } })
}

function storageOf(storage) {
  if (storage && typeof storage === 'object') return storage
  if (typeof uni !== 'undefined' && uni) return uni
  return null
}

function validId(value, label) {
  if (typeof value !== 'string' || !value || value !== value.trim() || !SAFE_ID.test(value) || /[/?#%]|:\/\//.test(value)) {
    throw Object.assign(new Error(`${label} is invalid`), { code: 'INVALID_ID' })
  }
  return value
}

function normalizeInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('continuation must be an object'), { code: 'INVALID_CONTINUATION' })
  }
  const keys = Object.keys(input)
  if (keys.some(key => !['target', 'messageId', 'category'].includes(key))) {
    throw Object.assign(new Error('continuation contains an unknown field'), { code: 'UNKNOWN_FIELD' })
  }
  if (!input.target || typeof input.target !== 'object' || Array.isArray(input.target)) {
    throw Object.assign(new Error('continuation target is required'), { code: 'TARGET_REQUIRED' })
  }
  const target = createDeepLink(input.target)
  const messageId = input.messageId === undefined ? '' : validId(input.messageId, 'messageId')
  const category = input.category === undefined ? '' : String(input.category)
  if (category && !CATEGORIES.includes(category)) {
    throw Object.assign(new Error('continuation category is invalid'), { code: 'INVALID_CATEGORY' })
  }
  if (target.source === 'message' && !messageId) {
    throw Object.assign(new Error('message continuation requires messageId'), { code: 'MESSAGE_ID_REQUIRED' })
  }
  return freeze({ target, ...(messageId ? { messageId } : {}), ...(category ? { category } : {}) })
}

function readRaw(storage) {
  if (!storage || typeof storage.getStorageSync !== 'function') return { present: false, value: null }
  let raw
  try { raw = storage.getStorageSync(AUTH_CONTINUATION_STORAGE_KEY) } catch (cause) {
    return { present: true, error: 'STORAGE_READ_FAILED', value: null }
  }
  if (raw === undefined || raw === null || raw === '') return { present: false, value: null }
  try {
    return { present: true, value: typeof raw === 'string' ? JSON.parse(raw) : raw }
  } catch (cause) {
    return { present: true, error: 'INVALID_STORAGE', value: null }
  }
}

function persist(storage, value) {
  if (!storage || typeof storage.setStorageSync !== 'function') return error('WRITER_MISSING', 'continuation storage writer is unavailable')
  try {
    storage.setStorageSync(AUTH_CONTINUATION_STORAGE_KEY, JSON.stringify(value))
    return null
  } catch (cause) {
    return error('STORAGE_WRITE_FAILED', 'continuation storage write failed')
  }
}

export function saveAuthContinuation(input, options = {}) {
  let continuation
  try {
    continuation = normalizeInput(input)
  } catch (cause) {
    return error(cause.code || 'INVALID_CONTINUATION', cause.message || 'continuation is invalid')
  }
  const stored = {
    version: 1,
    createdAt: Date.now(),
    ...continuation,
  }
  const failure = persist(storageOf(options.storage), stored)
  if (failure) return failure
  return freeze({ success: true, data: continuation, error: null })
}

export function readAuthContinuation(options = {}) {
  const loaded = readRaw(storageOf(options.storage))
  if (loaded.error) return error(loaded.error, 'continuation storage could not be read')
  if (!loaded.present) return freeze({ success: true, data: null, error: null })
  const value = loaded.value
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1) {
      throw Object.assign(new Error('continuation envelope is invalid'), { code: 'INVALID_CONTINUATION' })
    }
    if (!Number.isSafeInteger(value.createdAt) || Date.now() - value.createdAt < 0 || Date.now() - value.createdAt > MAX_AGE_MS) {
      throw Object.assign(new Error('continuation has expired'), { code: 'CONTINUATION_EXPIRED' })
    }
    const continuation = normalizeInput({ target: value.target, messageId: value.messageId, category: value.category })
    return freeze({ success: true, data: continuation, error: null })
  } catch (cause) {
    return error(cause.code || 'INVALID_CONTINUATION', cause.message || 'continuation is invalid')
  }
}

export function clearAuthContinuation(options = {}) {
  const storage = storageOf(options.storage)
  if (!storage) return error('WRITER_MISSING', 'continuation storage is unavailable')
  try {
    if (typeof storage.removeStorageSync === 'function') storage.removeStorageSync(AUTH_CONTINUATION_STORAGE_KEY)
    else if (typeof storage.setStorageSync === 'function') storage.setStorageSync(AUTH_CONTINUATION_STORAGE_KEY, '')
    else return error('WRITER_MISSING', 'continuation storage writer is unavailable')
    return freeze({ success: true, data: null, error: null })
  } catch (cause) {
    return error('STORAGE_WRITE_FAILED', 'continuation storage clear failed')
  }
}

/**
 * Validate auth state and return the target.  No navigation or business
 * action is performed here.  A caller may inject a bridge only for a read
 * check; restoreAfterAuth guarantees `canSubmit:false` in every outcome.
 */
export function restoreStoredAuthContinuation(options = {}) {
  const loaded = readAuthContinuation(options)
  if (!loaded.success) return freeze({ status: 'empty', code: loaded.error.code, continuation: null, target: null, canSubmit: false })
  if (!loaded.data) return freeze({ status: 'empty', code: 'NO_CONTINUATION', continuation: null, target: null, canSubmit: false })
  const restored = restoreAfterAuth(loaded.data.target, {
    authenticated: options.authenticated === true,
    ...(options.bridge === undefined ? {} : { bridge: options.bridge }),
  })
  return freeze({ ...restored, continuation: loaded.data })
}

