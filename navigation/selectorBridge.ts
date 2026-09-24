/**
 * In-memory selector return bridge.
 *
 * This is a local contract seam for a caller that opened a selector and later
 * receives a result. It deliberately has no uni-app, storage, eventChannel,
 * page, or fixture dependency. The `bridge: 'eventChannel'` field mirrors the
 * route contract as a handoff marker; this module does not create or forward
 * a cross-page eventChannel.
 */

type SelectorKind = 'address' | 'region' | 'animal'
type SelectorRecord = { readonly [key: string]: SelectorContextValue }
type SelectorContextValue =
  string | number | boolean | null | readonly SelectorContextValue[] | SelectorRecord

interface SelectorRequest {
  kind: SelectorKind
  requestId: string
  callerId: string
  expiresAt: number
  bridge: 'eventChannel'
  autoRedirect: false
}

interface AddressResult {
  kind: 'address'
  requestId: string
  addressId: string
}

interface RegionResult {
  kind: 'region'
  requestId: string
  parts: readonly string[]
}

interface AnimalResult {
  kind: 'animal'
  requestId: string
  animalIds: readonly string[]
}

type SelectorResult = AddressResult | RegionResult | AnimalResult
type SelectorPayload = SelectorResult | CancelPayload

interface CancelPayload {
  kind: SelectorKind
  requestId: string
  reason: string
}

interface RequestEnvelope {
  kind: SelectorKind
  requestId: string
  result: unknown
}

type SelectorCallback = (payload: SelectorPayload, context: SelectorContextValue) => unknown
type Clock = () => number
type IdFactory = (kind: SelectorKind, currentTime: number, sequence: number) => string

interface RequestEntry {
  kind: SelectorKind
  requestId: string
  callerId: string
  context: SelectorContextValue
  expiresAt: number
  onConfirm?: SelectorCallback
  onCancel?: SelectorCallback
}

interface SelectorBridgeOptions {
  now?: unknown
  idFactory?: unknown
  defaultTtlMs?: unknown
}

export interface SelectorBridge {
  createRequest: (input: unknown) => SelectorRequest
  confirm: (input: unknown) => SelectorResult
  cancel: (input: unknown) => CancelPayload
  cancelCaller: (callerId: unknown, reason?: unknown) => readonly CancelPayload[]
  cleanupExpired: () => readonly CancelPayload[]
  pendingCount: () => number
  hasPending: (kind: unknown, requestId: unknown) => boolean
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const SELECTOR_KINDS: readonly SelectorKind[] = Object.freeze(['address', 'region', 'animal'])
const DEFAULT_SELECTOR_TTL_MS = 5 * 60 * 1000
const MAX_SELECTOR_TTL_MS = 24 * 60 * 60 * 1000
let bridgeInstanceSequence = 0

export class SelectorBridgeError extends Error {
  readonly code: string
  readonly details: Record<string, unknown>
  cause?: unknown

  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'SelectorBridgeError'
    this.code = code
    this.details = details
  }
}

function fail(code: string, message: string, details?: Record<string, unknown>): never {
  throw new SelectorBridgeError(code, message, details)
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!isObjectRecord(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function assertPlainRecord(
  value: unknown,
  label: string,
): asserts value is Record<string, unknown> {
  if (!isPlainRecord(value)) fail('INVALID_REQUEST', `${label} must be a plain object`, { label })
}

function assertSafeKey(key: string, label: string): void {
  if (DANGEROUS_KEYS.has(key)) fail('PROTOTYPE_KEY', `${label} contains a prototype key`, { key })
}

function assertId(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value || value.length > 128 || !SAFE_ID.test(value)) {
    fail('INVALID_ID', `${label} must be a restricted non-empty ID`, { label })
  }
  return value
}

function includesValue<T extends string>(values: readonly T[], value: string): value is T {
  return values.some((candidate) => candidate === value)
}

function assertKind(value: unknown): SelectorKind {
  if (typeof value !== 'string' || !includesValue(SELECTOR_KINDS, value)) {
    fail('UNKNOWN_SELECTOR', `Unknown selector kind: ${String(value)}`, { kind: value })
  }
  return value
}

function assertNoUnknownKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
): void {
  for (const key of Object.keys(value)) {
    assertSafeKey(key, label)
    if (!allowed.includes(key))
      fail('UNKNOWN_PARAMETER', `${label} contains an unsupported field: ${key}`, { key })
  }
}

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0)
    if ((code >= 0 && code <= 0x1f) || code === 0x7f) return true
  }
  return false
}

function cloneAndFreeze(
  value: unknown,
  label: string,
  seen = new Set<object>(),
): SelectorContextValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number') {
    if (!Number.isFinite(value))
      fail('INVALID_CONTEXT', `${label} contains a non-finite number`, { label })
    return value
  }
  if (typeof value !== 'object')
    fail('INVALID_CONTEXT', `${label} contains an unsupported value`, { label })
  if (seen.has(value)) fail('INVALID_CONTEXT', `${label} must not contain cycles`, { label })
  seen.add(value)
  let copy: SelectorContextValue
  if (Array.isArray(value)) {
    copy = value.map((item, index) => cloneAndFreeze(item, `${label}[${index}]`, seen))
  } else {
    if (!isPlainRecord(value))
      fail('INVALID_CONTEXT', `${label} must contain plain objects`, { label })
    const record: Record<string, SelectorContextValue> = {}
    for (const key of Object.keys(value)) {
      assertSafeKey(key, label)
      record[key] = cloneAndFreeze(value[key], `${label}.${key}`, seen)
    }
    copy = record
  }
  seen.delete(value)
  Object.freeze(copy)
  return copy
}

function assertClock(now: Clock): number {
  const value = now()
  if (!Number.isFinite(value)) fail('INVALID_CLOCK', 'now() must return a finite number')
  return value
}

function assertRequestEnvelope(input: unknown, label: string): RequestEnvelope {
  assertPlainRecord(input, label)
  assertNoUnknownKeys(input, ['kind', 'requestId', 'result'], label)
  return {
    kind: assertKind(input.kind),
    requestId: assertId(input.requestId, 'requestId'),
    result: input.result,
  }
}

function assertResult(kind: SelectorKind, result: unknown, requestId: string): SelectorResult {
  assertPlainRecord(result, 'selector result')
  for (const key of Object.keys(result)) assertSafeKey(key, 'selector result')
  if (kind === 'address') {
    assertNoUnknownKeys(result, ['addressId'], 'selector result')
    if (Object.keys(result).length !== 1)
      fail('MISSING_RESULT', 'address result requires addressId')
    return Object.freeze({ kind, requestId, addressId: assertId(result.addressId, 'addressId') })
  }
  if (kind === 'region') {
    assertNoUnknownKeys(result, ['parts'], 'selector result')
    if (!Array.isArray(result.parts) || result.parts.length < 1 || result.parts.length > 4) {
      fail('INVALID_RESULT', 'region result parts must contain one to four names')
    }
    const parts = result.parts.map((part: unknown, index: number) => {
      if (typeof part !== 'string' || !part || part.trim() !== part || part.length > 64) {
        fail('INVALID_REGION_PART', `parts[${index}] must be a short non-empty name`)
      }
      if (hasControlCharacter(part))
        fail('INVALID_REGION_PART', `parts[${index}] contains a control character`)
      try {
        encodeURIComponent(part)
      } catch {
        fail('INVALID_UNICODE', `parts[${index}] contains invalid Unicode`)
      }
      return part
    })
    return Object.freeze({ kind, requestId, parts: Object.freeze(parts.slice()) })
  }
  assertNoUnknownKeys(result, ['animalIds'], 'selector result')
  if (
    !Array.isArray(result.animalIds) ||
    result.animalIds.length < 1 ||
    result.animalIds.length > 6
  ) {
    fail('INVALID_RESULT', 'animalIds must contain one to six IDs')
  }
  const animalIds = result.animalIds.map((animalId: unknown, index: number) =>
    assertId(animalId, `animalIds[${index}]`),
  )
  if (new Set(animalIds).size !== animalIds.length) fail('DUPLICATE_ID', 'animalIds must be unique')
  return Object.freeze({ kind, requestId, animalIds: Object.freeze(animalIds.slice()) })
}

function assertReason(reason: unknown): string {
  if (reason === undefined) return 'cancelled'
  if (typeof reason !== 'string' || !reason || reason.length > 64 || hasControlCharacter(reason)) {
    fail('INVALID_REASON', 'cancel reason must be a short non-empty string')
  }
  return reason
}

function isCallback(value: unknown): value is SelectorCallback {
  return typeof value === 'function'
}

function callbackFailure(error: unknown, phase: string): SelectorBridgeError {
  const failure = new SelectorBridgeError('CALLBACK_FAILED', `${phase} callback failed`)
  failure.cause = error
  return failure
}

function asyncCallbackFailure(result: unknown, phase: string): SelectorBridgeError {
  const failure = new SelectorBridgeError(
    'ASYNC_CALLBACK_UNSUPPORTED',
    `${phase} callback must complete synchronously`,
  )
  failure.cause = result
  return failure
}

function createBridgeNonce(): string {
  bridgeInstanceSequence += 1
  const randomPart = Math.random().toString(36).slice(2, 10) || '0'
  return `s${bridgeInstanceSequence}-${randomPart}`
}

function isClock(value: unknown): value is Clock {
  return typeof value === 'function'
}

function isIdFactory(value: unknown): value is IdFactory {
  return typeof value === 'function'
}

/** Creates an isolated, memory-only request bridge. */
export function createSelectorBridge(options: SelectorBridgeOptions = {}): SelectorBridge {
  assertPlainRecord(options, 'bridge options')
  assertNoUnknownKeys(options, ['now', 'idFactory', 'defaultTtlMs'], 'bridge options')
  const nowValue = options.now === undefined ? () => Date.now() : options.now
  if (!isClock(nowValue)) fail('INVALID_CLOCK', 'now must be a function')
  const now = nowValue
  const bridgeNonce = createBridgeNonce()
  const idFactoryValue =
    options.idFactory === undefined
      ? (kind: SelectorKind, currentTime: number, sequence: number) =>
          `selector-${bridgeNonce}-${kind}-${currentTime}-${sequence}`
      : options.idFactory
  if (!isIdFactory(idFactoryValue)) fail('INVALID_ID_FACTORY', 'idFactory must be a function')
  const idFactory = idFactoryValue
  const defaultTtlMs =
    options.defaultTtlMs === undefined ? DEFAULT_SELECTOR_TTL_MS : options.defaultTtlMs
  if (
    typeof defaultTtlMs !== 'number' ||
    !Number.isInteger(defaultTtlMs) ||
    defaultTtlMs < 1 ||
    defaultTtlMs > MAX_SELECTOR_TTL_MS
  ) {
    fail('INVALID_TTL', 'defaultTtlMs must be a positive integer within one day')
  }

  const pending = new Map<string, RequestEntry>()
  const issuedRequestIds = new Set<string>()
  let sequence = 0

  function createRequest(input: unknown): SelectorRequest {
    assertPlainRecord(input, 'selector request')
    assertNoUnknownKeys(
      input,
      ['kind', 'callerId', 'context', 'ttlMs', 'onConfirm', 'onCancel'],
      'selector request',
    )
    const kind = assertKind(input.kind)
    const callerId = assertId(input.callerId, 'callerId')
    const context =
      input.context === undefined ? Object.freeze({}) : cloneAndFreeze(input.context, 'context')
    const ttlMs = input.ttlMs === undefined ? defaultTtlMs : input.ttlMs
    if (
      typeof ttlMs !== 'number' ||
      !Number.isInteger(ttlMs) ||
      ttlMs < 1 ||
      ttlMs > MAX_SELECTOR_TTL_MS
    ) {
      fail('INVALID_TTL', 'ttlMs must be a positive integer within one day')
    }
    if (input.onConfirm !== undefined && !isCallback(input.onConfirm)) {
      fail('INVALID_CALLBACK', 'onConfirm must be a function')
    }
    if (input.onCancel !== undefined && !isCallback(input.onCancel)) {
      fail('INVALID_CALLBACK', 'onCancel must be a function')
    }
    const onConfirm = input.onConfirm === undefined ? undefined : input.onConfirm
    const onCancel = input.onCancel === undefined ? undefined : input.onCancel
    const currentTime = assertClock(now)
    let requestId: string
    try {
      requestId = assertId(idFactory(kind, currentTime, ++sequence), 'requestId')
    } catch {
      fail('INVALID_ID_FACTORY', 'idFactory failed')
    }
    if (issuedRequestIds.has(requestId))
      fail('DUPLICATE_REQUEST_ID', `requestId was already issued: ${requestId}`)
    issuedRequestIds.add(requestId)
    const expiresAt = currentTime + ttlMs
    const entry: RequestEntry = {
      kind,
      requestId,
      callerId,
      context,
      expiresAt,
      onConfirm,
      onCancel,
    }
    pending.set(requestId, entry)
    return Object.freeze({
      kind,
      requestId,
      callerId,
      expiresAt,
      bridge: 'eventChannel',
      autoRedirect: false,
    })
  }

  function findEntry(kind: SelectorKind, requestId: string): RequestEntry {
    const entry = pending.get(requestId)
    if (!entry) fail('UNKNOWN_REQUEST', `Unknown selector request: ${requestId}`, { requestId })
    if (entry.kind !== kind) {
      fail('REQUEST_KIND_MISMATCH', 'selector kind does not match the pending request', {
        requestId,
        expectedKind: entry.kind,
        actualKind: kind,
      })
    }
    return entry
  }

  function invoke(
    entry: RequestEntry,
    callback: SelectorCallback | undefined,
    payload: SelectorPayload,
    phase: string,
  ): void {
    if (!callback) return
    let callbackResult: unknown
    try {
      callbackResult = callback(payload, entry.context)
    } catch (error) {
      throw callbackFailure(error, phase)
    }
    if (
      callbackResult &&
      (typeof callbackResult === 'object' || typeof callbackResult === 'function')
    ) {
      let then: unknown
      try {
        then = Object(callbackResult).then
      } catch (error) {
        throw callbackFailure(error, phase)
      }
      if (typeof then === 'function') {
        try {
          Promise.resolve(callbackResult).catch(() => {})
        } catch {
          /* ignore thenable cleanup failure */
        }
        throw asyncCallbackFailure(callbackResult, phase)
      }
    }
  }

  function consume<T extends SelectorPayload>(
    entry: RequestEntry,
    payload: T,
    callback: SelectorCallback | undefined,
    phase: string,
  ): T {
    pending.delete(entry.requestId)
    invoke(entry, callback, payload, phase)
    return payload
  }

  function expireDue(currentTime: number, notify = true): readonly CancelPayload[] {
    const expired = Array.from(pending.values()).filter((entry) => entry.expiresAt <= currentTime)
    expired.forEach((entry) => pending.delete(entry.requestId))
    const payloads = expired.map((entry) =>
      Object.freeze({ kind: entry.kind, requestId: entry.requestId, reason: 'expired' }),
    )
    if (notify) {
      let firstError: unknown
      expired.forEach((entry, index) => {
        try {
          invoke(entry, entry.onCancel, payloads[index], 'cancel')
        } catch (error) {
          if (!firstError) firstError = error
        }
      })
      if (firstError) throw firstError
    }
    return payloads
  }

  function confirm(input: unknown): SelectorResult {
    const envelope = assertRequestEnvelope(input, 'confirm request')
    const entry = findEntry(envelope.kind, envelope.requestId)
    const currentTime = assertClock(now)
    if (entry.expiresAt <= currentTime) {
      pending.delete(entry.requestId)
      const payload = Object.freeze({
        kind: entry.kind,
        requestId: entry.requestId,
        reason: 'expired',
      })
      invoke(entry, entry.onCancel, payload, 'cancel')
      fail('EXPIRED_REQUEST', 'selector request has expired', { requestId: entry.requestId })
    }
    const payload = assertResult(entry.kind, envelope.result, entry.requestId)
    return consume(entry, payload, entry.onConfirm, 'confirm')
  }

  function cancel(input: unknown): CancelPayload {
    assertPlainRecord(input, 'cancel request')
    assertNoUnknownKeys(input, ['kind', 'requestId', 'reason'], 'cancel request')
    const kind = assertKind(input.kind)
    const requestId = assertId(input.requestId, 'requestId')
    const entry = findEntry(kind, requestId)
    const payload = Object.freeze({
      kind: entry.kind,
      requestId: entry.requestId,
      reason: assertReason(input.reason),
    })
    return consume(entry, payload, entry.onCancel, 'cancel')
  }

  function cancelCaller(
    callerId: unknown,
    reason: unknown = 'caller-destroyed',
  ): readonly CancelPayload[] {
    const normalizedCallerId = assertId(callerId, 'callerId')
    const normalizedReason = assertReason(reason)
    const entries = Array.from(pending.values()).filter(
      (entry) => entry.callerId === normalizedCallerId,
    )
    entries.forEach((entry) => pending.delete(entry.requestId))
    const payloads = entries.map((entry) =>
      Object.freeze({ kind: entry.kind, requestId: entry.requestId, reason: normalizedReason }),
    )
    let firstError: unknown
    entries.forEach((entry, index) => {
      try {
        invoke(entry, entry.onCancel, payloads[index], 'cancel')
      } catch (error) {
        if (!firstError) firstError = error
      }
    })
    if (firstError) throw firstError
    return payloads
  }

  function cleanupExpired(): readonly CancelPayload[] {
    return expireDue(assertClock(now))
  }

  const bridge: SelectorBridge = {
    createRequest,
    confirm,
    cancel,
    cancelCaller,
    cleanupExpired,
    pendingCount: () => pending.size,
    hasPending: (kindValue, requestIdValue) => {
      const kind = assertKind(kindValue)
      const requestId = assertId(requestIdValue, 'requestId')
      return pending.has(requestId) && pending.get(requestId)?.kind === kind
    },
  }
  return Object.freeze(bridge)
}

// All production callers and selector pages must import this same instance.
// The factory is for isolated tests/scopes, not one independent bridge per page.
export const selectorBridge = createSelectorBridge()

export { DEFAULT_SELECTOR_TTL_MS, SELECTOR_KINDS }
