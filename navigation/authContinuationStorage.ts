/**
 * Local, fail-closed storage bridge for auth continuations.
 *
 * A continuation is a validated deep-link target plus (for a notification)
 * the stable message ID that must be re-read after login.  It never stores a
 * callback, arbitrary URL, role, status, or business action.  Login may only
 * restore the target; the destination page still re-reads the current record
 * and the current actor before rendering or allowing a write.
 */

import { parseDeepLinkInput, restoreAfterAuth } from './deeplinkContracts.ts'
import type { DeepLinkEnvelope, DeepLinkInput } from './deeplinkContracts.ts'

export const AUTH_CONTINUATION_STORAGE_KEY = 'PAWHOME_AUTH_CONTINUATION'
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const CATEGORIES = Object.freeze(['interaction', 'order', 'service', 'system', 'activity', 'pet'] as const)
const MAX_AGE_MS = 30 * 60 * 1000

export type AuthContinuationCategory = typeof CATEGORIES[number]

export type AuthContinuationTarget = DeepLinkEnvelope

export interface AuthContinuation {
	target: AuthContinuationTarget
	messageId?: string
	category?: AuthContinuationCategory
}

export interface AuthContinuationInput {
	target: DeepLinkInput | AuthContinuationTarget
	messageId?: string
	category?: AuthContinuationCategory
}

interface StorageLike {
  getStorageSync?: (key: string) => unknown
  setStorageSync?: (key: string, value: string) => void
  removeStorageSync?: (key: string) => void
}

interface AuthContinuationOptions {
  storage?: StorageLike
  authenticated?: boolean
  bridge?: (input: { target: AuthContinuationTarget }) => unknown
}

interface SuccessResult<T> {
  success: true
  data: T
  error: null
}

interface FailureResult {
  success: false
  data: null
  error: { code: string; message: string }
}

type OperationResult<T> = SuccessResult<T> | FailureResult

interface RawStorageResult {
  present: boolean
  value: unknown
  error?: string
}

interface StoredContinuationEnvelope {
  version: 1
  createdAt: number
  target: unknown
  messageId?: unknown
  category?: unknown
}

type RestoreStatus = 'empty' | 'auth_required' | 'ready' | 'bridge_failed'

export interface RestoredAuthContinuation {
  status: RestoreStatus
  code: string
  continuation: AuthContinuation | null
  target: AuthContinuationTarget | null
  canSubmit: false
  [key: string]: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isAuthContinuationTarget(value: unknown): value is AuthContinuationTarget {
  return isRecord(value)
    && typeof value.source === 'string'
    && typeof value.businessType === 'string'
    && typeof value.routeName === 'string'
    && typeof value.url === 'string'
}

function isAuthContinuationCategory(value: unknown): value is AuthContinuationCategory {
  return typeof value === 'string' && CATEGORIES.some(category => category === value)
}

function parseJson(value: string): unknown {
  return JSON.parse(value)
}

function freeze<T>(value: T, seen: WeakSet<object> = new WeakSet()): T {
  if (value === null || typeof value !== 'object') return value
  const objectValue: object = value
  if (seen.has(objectValue)) return value
  seen.add(objectValue)
  for (const key of Reflect.ownKeys(objectValue)) {
    const child: unknown = Reflect.get(objectValue, key)
    freeze(child, seen)
  }
  return Object.freeze(value)
}

function failure(code: string, message: string): FailureResult {
  return Object.freeze({ success: false, data: null, error: { code, message } })
}

function isStorageLike(value: unknown): value is StorageLike {
  return isRecord(value) && (
    typeof value.getStorageSync === 'function' ||
    typeof value.setStorageSync === 'function' ||
    typeof value.removeStorageSync === 'function'
  )
}

function storageOf(storage: unknown): StorageLike | null {
  if (isStorageLike(storage)) return storage
  if (typeof uni !== 'undefined' && isStorageLike(uni)) return uni
  return null
}

function errorCode(cause: unknown, fallback: string): string {
  return isRecord(cause) && typeof cause.code === 'string' ? cause.code : fallback
}

function errorMessage(cause: unknown, fallback: string): string {
  return isRecord(cause) && typeof cause.message === 'string' ? cause.message : fallback
}

function validId(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value || value !== value.trim() || !SAFE_ID.test(value) || /[/?#%]|:\/\//.test(value)) {
    throw Object.assign(new Error(`${label} is invalid`), { code: 'INVALID_ID' })
  }
  return value
}

function normalizeInput(input: unknown): AuthContinuation {
  if (!isRecord(input)) {
    throw Object.assign(new Error('continuation must be an object'), { code: 'INVALID_CONTINUATION' })
  }
  const keys = Object.keys(input)
  if (keys.some(key => !['target', 'messageId', 'category'].includes(key))) {
    throw Object.assign(new Error('continuation contains an unknown field'), { code: 'UNKNOWN_FIELD' })
  }
  if (!isRecord(input.target)) {
    throw Object.assign(new Error('continuation target is required'), { code: 'TARGET_REQUIRED' })
  }
  const target = parseDeepLinkInput(input.target)
  const messageId = input.messageId === undefined ? '' : validId(input.messageId, 'messageId')
  let category: AuthContinuationCategory | undefined
  if (input.category !== undefined) {
    const candidate = String(input.category)
    if (candidate) {
      if (!isAuthContinuationCategory(candidate)) {
        throw Object.assign(new Error('continuation category is invalid'), { code: 'INVALID_CATEGORY' })
      }
      category = candidate
    }
  }
  if (target.source === 'message' && !messageId) {
    throw Object.assign(new Error('message continuation requires messageId'), { code: 'MESSAGE_ID_REQUIRED' })
  }
  return freeze({
    target,
    ...(messageId ? { messageId } : {}),
    ...(category ? { category } : {}),
  })
}

function readRaw(storage: StorageLike | null): RawStorageResult {
  if (!storage || typeof storage.getStorageSync !== 'function') return { present: false, value: null }
  let raw: unknown
  try {
    raw = storage.getStorageSync(AUTH_CONTINUATION_STORAGE_KEY)
  } catch {
    return { present: true, error: 'STORAGE_READ_FAILED', value: null }
  }
  if (raw === undefined || raw === null || raw === '') return { present: false, value: null }
  try {
    return { present: true, value: typeof raw === 'string' ? parseJson(raw) : raw }
  } catch {
    return { present: true, error: 'INVALID_STORAGE', value: null }
  }
}

function persist(storage: StorageLike | null, value: StoredContinuationEnvelope): FailureResult | null {
  if (!storage || typeof storage.setStorageSync !== 'function') {
    return failure('WRITER_MISSING', 'continuation storage writer is unavailable')
  }
  try {
    storage.setStorageSync(AUTH_CONTINUATION_STORAGE_KEY, JSON.stringify(value))
    return null
  } catch {
    return failure('STORAGE_WRITE_FAILED', 'continuation storage write failed')
  }
}

export function saveAuthContinuation(input: AuthContinuationInput, options: AuthContinuationOptions = {}): OperationResult<AuthContinuation> {
  let continuation: AuthContinuation
  try {
    continuation = normalizeInput(input)
  } catch (cause) {
    return failure(errorCode(cause, 'INVALID_CONTINUATION'), errorMessage(cause, 'continuation is invalid'))
  }
  const stored: StoredContinuationEnvelope = {
    version: 1,
    createdAt: Date.now(),
    ...continuation,
  }
  const writeFailure = persist(storageOf(options.storage), stored)
  if (writeFailure) return writeFailure
  return freeze({ success: true, data: continuation, error: null })
}

export function readAuthContinuation(options: AuthContinuationOptions = {}): OperationResult<AuthContinuation | null> {
  const loaded = readRaw(storageOf(options.storage))
  if (loaded.error) return failure(loaded.error, 'continuation storage could not be read')
  if (!loaded.present) return freeze({ success: true, data: null, error: null })
  const value = loaded.value
  try {
    if (!isRecord(value) || value.version !== 1) {
      throw Object.assign(new Error('continuation envelope is invalid'), { code: 'INVALID_CONTINUATION' })
    }
    const createdAt = value.createdAt
    if (typeof createdAt !== 'number' || !Number.isSafeInteger(createdAt) || Date.now() - createdAt < 0 || Date.now() - createdAt > MAX_AGE_MS) {
      throw Object.assign(new Error('continuation has expired'), { code: 'CONTINUATION_EXPIRED' })
    }
    const continuation = normalizeInput({ target: value.target, messageId: value.messageId, category: value.category })
    return freeze({ success: true, data: continuation, error: null })
  } catch (cause) {
    return failure(errorCode(cause, 'INVALID_CONTINUATION'), errorMessage(cause, 'continuation is invalid'))
  }
}

export function clearAuthContinuation(options: AuthContinuationOptions = {}): OperationResult<null> {
  const storage = storageOf(options.storage)
  if (!storage) return failure('WRITER_MISSING', 'continuation storage is unavailable')
  try {
    if (typeof storage.removeStorageSync === 'function') storage.removeStorageSync(AUTH_CONTINUATION_STORAGE_KEY)
    else if (typeof storage.setStorageSync === 'function') storage.setStorageSync(AUTH_CONTINUATION_STORAGE_KEY, '')
    else return failure('WRITER_MISSING', 'continuation storage writer is unavailable')
    return freeze({ success: true, data: null, error: null })
  } catch {
    return failure('STORAGE_WRITE_FAILED', 'continuation storage clear failed')
  }
}

/**
 * Validate auth state and return the target.  No navigation or business
 * action is performed here.  A caller may inject a bridge only for a read
 * check; restoreAfterAuth guarantees `canSubmit:false` in every outcome.
 */
export function restoreStoredAuthContinuation(options: AuthContinuationOptions = {}): RestoredAuthContinuation {
  const loaded = readAuthContinuation(options)
  if (!loaded.success) return freeze({ status: 'empty', code: loaded.error.code, continuation: null, target: null, canSubmit: false })
  if (!loaded.data) return freeze({ status: 'empty', code: 'NO_CONTINUATION', continuation: null, target: null, canSubmit: false })
  const restored = restoreAfterAuth(loaded.data.target, {
    authenticated: options.authenticated === true,
    ...(options.bridge === undefined ? {} : { bridge: options.bridge }),
  })
  return freeze({
    ...restored,
    status: restored.status,
    code: restored.code,
    target: isAuthContinuationTarget(restored.target) ? restored.target : null,
    canSubmit: false,
    continuation: loaded.data,
  })
}
