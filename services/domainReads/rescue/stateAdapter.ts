/**
 * Read-only rescue state adapter.
 *
 * stateContract is storage agnostic. This seam binds it to the existing
 * PAWHOME_RESCUES repository without introducing another key or allowing a
 * query parameter to manufacture a status. The default is a persisted record
 * lookup with demos disabled; callers that explicitly render a public
 * demonstration may opt into the existing demo fallback.
 */
import { getRescueById } from '../../../utils/rescueStorage.ts'
import { normalizeRescueState } from './stateContract.ts'

type JsonRecord = Readonly<Record<string, unknown>>
type ResolverContext = Readonly<{ rescueId: string; includeDemo: boolean }>
export type RescueStateResolver = (context: ResolverContext) => unknown
export interface RescueStateReadOptions {
  readonly includeDemo?: boolean
}
export interface RescueStateResolverOptions extends RescueStateReadOptions {
  readonly resolver: RescueStateResolver
}

interface RescueStateError {
  readonly code: string
  readonly message: string
}

interface RescueStateFailure {
  readonly success: false
  readonly source: 'mock'
  readonly data: null
  readonly error: RescueStateError
  readonly readOnly: true
  readonly canWrite: false
}

interface RescueStateSuccess {
  readonly success: true
  readonly source: 'mock'
  readonly data: {
    readonly rescueId: string
    readonly state: RescueStateProjection
  }
  readonly error: null
  readonly readOnly: true
  readonly canWrite: false
}

type RescueStateResult = RescueStateFailure | RescueStateSuccess
type RescueStateProjection = ReturnType<typeof normalizeRescueState>

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isResolver(value: unknown): value is RescueStateResolver {
  return typeof value === 'function'
}

function isThenable(value: unknown): boolean {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof Reflect.get(value, 'then') === 'function'
  )
}

function normalizeId(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim()
}

function hasOuterWhitespace(value: unknown): boolean {
  return typeof value === 'string' && value !== value.trim()
}

function resultFailure(code: string, message: string): RescueStateFailure {
  return Object.freeze({
    success: false,
    source: 'mock',
    data: null,
    error: Object.freeze({ code, message }),
    readOnly: true,
    canWrite: false,
  })
}

function resultSuccess(rescueId: string, state: RescueStateProjection): RescueStateSuccess {
  return Object.freeze({
    success: true,
    source: 'mock',
    data: Object.freeze({ rescueId, state }),
    error: null,
    readOnly: true,
    canWrite: false,
  })
}

function readStateFromRecord(rescueId: string, record: unknown): RescueStateResult {
  if (!record) return resultFailure('NOT_FOUND', '找不到这条救助记录')
  try {
    return resultSuccess(rescueId, normalizeRescueState(record))
  } catch {
    return resultFailure('STATE_READ_FAILED', '救助状态读取失败')
  }
}

/**
 * Read one rescue state by its explicit rescueId. options is a migration seam
 * only: it may choose the repository's documented demo fallback, but it never
 * changes actor, status, or capability semantics.
 */
export function readRescueStateById(
  rescueId: string,
  options: RescueStateReadOptions = {},
): RescueStateResult {
  if (hasOuterWhitespace(rescueId)) return resultFailure('INVALID_ID', '救助单 ID 格式不合法')
  const id = normalizeId(rescueId)
  if (!id) return resultFailure('MISSING_ID', '缺少救助单 ID')
  if (!ID_PATTERN.test(id) || URL_MARKERS.test(id)) {
    return resultFailure('INVALID_ID', '救助单 ID 格式不合法')
  }
  const source: JsonRecord = isRecord(options) ? options : {}
  const includeDemo = source.includeDemo === true
  try {
    const record = getRescueById(id, { includeDemo })
    return readStateFromRecord(id, record)
  } catch {
    return resultFailure('STORAGE_READ_FAILED', '救助状态读取失败')
  }
}

/**
 * Injected resolver variant used by tests and future request/cloud adapters.
 * A resolver is synchronous by contract; a Promise is rejected so callers do
 * not accidentally treat an unfinished read as authoritative state.
 */
export function readRescueStateWithResolver(
  rescueId: string,
  options: RescueStateResolverOptions,
): RescueStateResult {
  if (hasOuterWhitespace(rescueId)) return resultFailure('INVALID_ID', '救助单 ID 格式不合法')
  const id = normalizeId(rescueId)
  if (!id) return resultFailure('MISSING_ID', '缺少救助单 ID')
  if (!ID_PATTERN.test(id) || URL_MARKERS.test(id)) {
    return resultFailure('INVALID_ID', '救助单 ID 格式不合法')
  }
  const source: JsonRecord = isRecord(options) ? options : {}
  const resolver = source.resolver
  if (!isResolver(resolver)) return resultFailure('RESOLVER_REQUIRED', '救助状态读取器不可用')
  let record: unknown
  try {
    record = resolver(Object.freeze({ rescueId: id, includeDemo: source.includeDemo === true }))
  } catch {
    return resultFailure('STORAGE_READ_FAILED', '救助状态读取失败')
  }
  if (isThenable(record)) {
    return resultFailure('ASYNC_RESOLVER_UNSUPPORTED', '救助状态读取器必须同步返回')
  }
  return readStateFromRecord(id, record)
}
