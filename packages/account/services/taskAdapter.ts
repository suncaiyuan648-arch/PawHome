/**
 * Cross-domain, read-only task adapter for the account task surface.
 *
 * This module is deliberately a binding seam.  It does not import storage,
 * fixture data, page code, route code, or a domain's write service.  A domain
 * reader must already have read its own safe source and return canonical task
 * summaries with explicit `businessType`, `businessId`, `actorId`,
 * `actorRole`, `actionType`, `status`, and (where applicable) `reviewItemId`.
 * Aliases such as `id`, `recordId`, `role`, and `state` are not mapped here.
 * This keeps the stable business identity at the domain boundary instead of
 * allowing a cross-domain account adapter to guess it.
 *
 * Readers receive only `{ actor }`, where actor is resolved afresh from the
 * trusted actor provider for every read.  Query, route, status, and displayed
 * role values are intentionally not forwarded.  taskReadModel owns summary
 * validation, actor matching, de-duplication, conflict handling, and async
 * resolver rejection; this adapter adds the account read-only envelope and
 * reader/source diagnostics.
 */

import { resolveTrustedActor } from '../../../navigation/actorCapabilities.ts'
import { TASK_BUSINESS_TYPES, type TaskBusinessType, type TaskSummary } from '../../../navigation/taskContracts.ts'
import { readTaskSummaries } from '../../../navigation/taskReadModel.ts'

type JsonRecord = Record<string, unknown>
export type TaskActor = { id: string; roles: readonly string[] }
export type TaskReaderContext = Readonly<{ actor: TaskActor }>
export type TaskReader = (context: TaskReaderContext) => unknown
export type TaskReaders = Partial<Record<TaskBusinessType, TaskReader>>
type TaskResolverMap = Partial<Record<TaskBusinessType, TaskReader>>
type TaskDiagnosticDomain = TaskBusinessType | 'adapter'

interface TaskSkip {
  domain: TaskDiagnosticDomain
  index: number
  code: string
}

interface TaskDiagnostics {
  scanned: number
  accepted: number
  skipped: readonly TaskSkip[]
  actorError: { code: string } | null
}

export interface TaskReadModel {
  actor: TaskActor | null
  all: readonly TaskSummary[]
  pending: readonly TaskSummary[]
  processed: readonly TaskSummary[]
  diagnostics: TaskDiagnostics
  readOnly: true
  canWrite: false
}

export interface TaskAdapterOptions {
	readonly actorProvider?: () => unknown
	readonly readers?: TaskReaders
}

const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const TASK_DOMAINS = Object.freeze([...TASK_BUSINESS_TYPES])

class TaskAdapterError extends Error {
  readonly code: string
  readonly details: JsonRecord

  constructor(code: string, message: string, details: JsonRecord = {}) {
    super(message)
    this.name = 'TaskAdapterError'
    this.code = code
    this.details = details
  }
}

function fail(code: string, message: string, details: JsonRecord = {}): never {
  throw new TaskAdapterError(code, message, details)
}

function isPlainRecord(value: unknown): value is JsonRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  if (prototype === Object.prototype || prototype === null) return true
  const constructorDescriptor = Object.getOwnPropertyDescriptor(prototype, 'constructor')
  return Object.getPrototypeOf(prototype) === null
    && Object.prototype.toString.call(value) === '[object Object]'
    && constructorDescriptor !== undefined
    && typeof constructorDescriptor.value === 'function'
    && constructorDescriptor.value.name === 'Object'
}

function rejectDangerousKeys(value: object, label: string): void {
  for (const key of Object.getOwnPropertyNames(value)) {
    if (DANGEROUS_KEYS.has(key)) fail('PROTOTYPE_KEY', `${label} contains a prototype key`, { key })
  }
  if (Object.getOwnPropertySymbols(value).length) {
    fail('UNKNOWN_FIELD', `${label} cannot contain symbol fields`)
  }
}

function own(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function isThenable(value: unknown): boolean {
  return value !== null
    && (typeof value === 'object' || typeof value === 'function')
    && typeof Reflect.get(value, 'then') === 'function'
}

function diagnostic(domain: TaskDiagnosticDomain, index: number, code: unknown): TaskSkip {
  return Object.freeze({
    domain,
    index: Number.isSafeInteger(index) ? index : -1,
    code: typeof code === 'string' && code ? code : 'READER_FAILED',
  })
}

function diagnosticCode(value: unknown, fallback: string): string {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) return fallback
  const code = Reflect.get(value, 'code')
  return typeof code === 'string' && code ? code : fallback
}

function captureSourceDiagnostics(domain: TaskBusinessType, result: unknown, sourceDiagnostics: TaskSkip[]): void {
  if (!isPlainRecord(result)) return

  if (isPlainRecord(result.error) && result.success === false) {
    sourceDiagnostics.push(diagnostic(domain, -1, diagnosticCode(result.error, 'SOURCE_READ_FAILED')))
  }

  const diagnostics = result.diagnostics
  if (!isPlainRecord(diagnostics)) return

  if (isPlainRecord(diagnostics.actorError)) {
    sourceDiagnostics.push(diagnostic(domain, -1, diagnosticCode(diagnostics.actorError, 'SOURCE_ACTOR_FAILED')))
  }
  if (!Array.isArray(diagnostics.skipped)) return
  for (const item of diagnostics.skipped) {
    if (!isPlainRecord(item)) continue
    sourceDiagnostics.push(diagnostic(
      domain,
      typeof item.index === 'number' && Number.isSafeInteger(item.index) ? item.index : -1,
      diagnosticCode(item, 'SOURCE_ITEM_SKIPPED'),
    ))
  }
}

function extractReaderItems(domain: TaskBusinessType, result: unknown, sourceDiagnostics: TaskSkip[]): unknown {
  // Let taskReadModel classify promises as ASYNC_RESOLVER_UNSUPPORTED.  The
  // rejection handler there also prevents a rejected injected promise from
  // becoming an unhandled rejection.
  if (isThenable(result)) return result
  if (Array.isArray(result)) return result
  if (!isPlainRecord(result)) fail('INVALID_READER_RESULT', `${domain} reader must return task summaries`)

  rejectDangerousKeys(result, `${domain} reader result`)
  captureSourceDiagnostics(domain, result, sourceDiagnostics)

  // A bound domain adapter is required to be read-only when it exposes these
  // envelope fields.  A bare canonical array is also accepted for low-level
  // readers that have already completed their persistence checks.
  if (own(result, 'readOnly') && result.readOnly !== true) {
    fail('UNSAFE_READER_RESULT', `${domain} reader is not read-only`)
  }
  if (own(result, 'canWrite') && result.canWrite !== false) {
    fail('UNSAFE_READER_RESULT', `${domain} reader exposes write capability`)
  }

  if (own(result, 'success') && result.success === false) return []

  let container = result
  if (own(result, 'data')) {
    if (!isPlainRecord(result.data)) fail('INVALID_READER_RESULT', `${domain} reader data must be an object`)
    rejectDangerousKeys(result.data, `${domain} reader data`)
    container = result.data
  }

  if (!own(container, 'items') || !Array.isArray(container.items)) {
    fail('INVALID_READER_RESULT', `${domain} reader must expose an items array`)
  }
  return container.items
}

function assertReaderConfig(readers: unknown): Readonly<TaskReaders> {
  if (readers === undefined) return Object.freeze({})
  if (!isPlainRecord(readers)) fail('READERS_REQUIRED', 'Task readers must be a plain object')
  rejectDangerousKeys(readers, 'task readers')
  for (const key of Object.keys(readers)) {
    if (!TASK_DOMAINS.some((domain) => domain === key)) {
      fail('UNKNOWN_READER_DOMAIN', `Unknown task reader domain: ${key}`, { domain: key })
    }
  }
  return Object.freeze({ ...readers })
}

function emptyDiagnostics({ skipped = [], actorError = null }: { skipped?: readonly TaskSkip[]; actorError?: unknown } = {}): TaskDiagnostics {
  return Object.freeze({
    scanned: 0,
    accepted: 0,
    skipped: Object.freeze(skipped.slice()),
    actorError: actorError ? Object.freeze({ code: diagnosticCode(actorError, 'ACTOR_CONTRACT_FAILED') }) : null,
  })
}

function emptyModel({ actor = null, skipped = [], actorError = null }: { actor?: TaskActor | null; skipped?: readonly TaskSkip[]; actorError?: unknown } = {}): TaskReadModel {
  const items = Object.freeze([])
  return Object.freeze({
    actor,
    all: items,
    pending: items,
    processed: items,
    diagnostics: emptyDiagnostics({ skipped, actorError }),
    readOnly: true,
    canWrite: false,
  })
}

function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value
  seen.add(value)
  for (const key of Reflect.ownKeys(value)) deepFreeze(Reflect.get(value, key), seen)
  return Object.freeze(value)
}

/**
 * Build taskReadModel resolvers from already-safe, domain-owned readers.
 * Missing readers are kept out of taskReadModel and reported by the account
 * adapter.  That makes missing persistence evidence an explicit empty state,
 * rather than an invented demo or first-item fallback.
 */
function buildResolvers(readers: Readonly<TaskReaders>, sourceDiagnostics: TaskSkip[]): Readonly<TaskResolverMap> {
  const resolvers: TaskResolverMap = {}
  for (const domain of TASK_DOMAINS) {
    const reader = readers[domain]
    if (reader === undefined) {
      sourceDiagnostics.push(diagnostic(domain, -1, 'READER_MISSING'))
      continue
    }
    if (typeof reader !== 'function') {
      sourceDiagnostics.push(diagnostic(domain, -1, 'INVALID_READER'))
      continue
    }

    resolvers[domain] = ({ actor }: TaskReaderContext) => {
      // This is intentionally the entire reader input.  In particular, the
      // adapter never forwards query, actorRole, status, route, or URL data.
      const context = Object.freeze({ actor })
      let result: unknown
      try {
        result = reader(context)
      } catch (error) {
        // Throwing preserves taskReadModel's per-domain fail-closed skip and
        // its error code normalization without exposing the reader error.
        throw Object.assign(new Error('task reader failed'), {
          code: diagnosticCode(error, 'READER_FAILED'),
        })
      }
      return extractReaderItems(domain, result, sourceDiagnostics)
    }
  }
  return Object.freeze(resolvers)
}

function withReadOnlyEnvelope(
  model: ReturnType<typeof readTaskSummaries>,
  sourceDiagnostics: TaskSkip[],
): TaskReadModel {
  if (!model || typeof model !== 'object') return emptyModel({ skipped: sourceDiagnostics })
  if (model.diagnostics && model.diagnostics.actorError) {
    // Trusted actor failure means no reader was called; adding missing-reader
    // diagnostics would misrepresent the reason for the empty result.
    return deepFreeze({
      actor: model.actor || null,
      all: Object.freeze([]),
      pending: Object.freeze([]),
      processed: Object.freeze([]),
      diagnostics: model.diagnostics,
      readOnly: true,
      canWrite: false,
    })
  }

  const existing = model.diagnostics || emptyDiagnostics()
  const skipped = [
    ...(Array.isArray(existing.skipped) ? existing.skipped : []),
    ...sourceDiagnostics,
  ]
  return deepFreeze({
    actor: model.actor || null,
    all: Array.isArray(model.all) ? model.all : [],
    pending: Array.isArray(model.pending) ? model.pending : [],
    processed: Array.isArray(model.processed) ? model.processed : [],
    diagnostics: {
      scanned: Number.isSafeInteger(existing.scanned) ? existing.scanned : 0,
      accepted: Number.isSafeInteger(existing.accepted) ? existing.accepted : 0,
      skipped,
      actorError: existing.actorError || null,
    },
    readOnly: true,
    canWrite: false,
  })
}

function failedRead(error: unknown): TaskReadModel {
  const code = diagnosticCode(error, 'TASK_ADAPTER_FAILED')
  if (code === 'ACTOR_PROVIDER_REQUIRED'
    || code === 'ACTOR_PROVIDER_FAILED'
    || code === 'INVALID_RECORD'
    || code === 'MISSING_ACTOR'
    || code === 'INVALID_ID'
    || code === 'UNKNOWN_ACTOR_ROLE') {
    return emptyModel({ actorError: { code } })
  }
  return emptyModel({ skipped: [diagnostic('adapter', -1, code)] })
}

/**
 * Read all task summaries visible to the current actor.
 *
 * `readers` values may return either a canonical summary array or a read-only
 * list envelope with `items`.  A `{ success:false, error }` envelope becomes
 * an empty domain with a source diagnostic.  No domain record aliases are
 * translated here, so a missing safe persistent association cannot silently
 * become a task.
 */
export function readAccountTasks(options: TaskAdapterOptions = {}): TaskReadModel {
  if (!isPlainRecord(options)) return failedRead({ code: 'INVALID_OPTIONS' })

  let readers
  try {
    readers = assertReaderConfig(options.readers)
  } catch (error) {
    return failedRead(error)
  }

  const sourceDiagnostics: TaskSkip[] = []
  let resolvers: Readonly<TaskResolverMap>
  try {
    resolvers = buildResolvers(readers, sourceDiagnostics)
    // Resolve the original provider through the actor contract once per
    // adapter read, then let taskReadModel validate the normalized actor.  The
    // one-shot wrapper preserves a single fresh session snapshot even if the
    // underlying provider has side effects.
    const actorProvider = options.actorProvider
    let resolved = false
    let trustedActor: TaskActor | null = null
    const oneShotActorProvider = () => {
      if (!resolved) {
        trustedActor = resolveTrustedActor(actorProvider)
        resolved = true
      }
      return trustedActor
    }
    const model = readTaskSummaries({ actorProvider: oneShotActorProvider, resolvers })
    return withReadOnlyEnvelope(model, sourceDiagnostics)
  } catch (error) {
    return failedRead(error)
  }
}

/** Alias used by account callers that name the surface as a task list. */
export const readTaskList = readAccountTasks
export const readTasks = readAccountTasks

/**
 * Construct a stable, read-only account task model.  The provider and reader
 * functions stay injected; each read resolves the current actor and source
 * snapshots again.  There is intentionally no submit, mutate, or write API.
 */
export function createTaskAdapter(options: TaskAdapterOptions = {}) {
  const { actorProvider, readers = {} } = options
  const read = () => readAccountTasks({ actorProvider, readers })
  return Object.freeze({
    read,
    aggregate: read,
    canWrite: () => false,
  })
}

export const createAccountTaskAdapter = createTaskAdapter

export {
  TaskAdapterError,
  TASK_DOMAINS,
}
