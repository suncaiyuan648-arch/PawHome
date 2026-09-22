/**
 * Pure, read-only task aggregation contract.
 *
 * Domain resolvers are injected by the caller.  They receive only a freshly
 * resolved trusted actor and must return task-summary candidates for their
 * own domain.  This module never reads storage, accepts query parameters,
 * builds URLs, or exposes a task write operation.  A resolver failure or a
 * malformed candidate is explicitly skipped and recorded in diagnostics;
 * the remaining domains can still be rendered safely.
 */

import { resolveTrustedActor } from './actorCapabilities.js'
import {
  TASK_BUSINESS_TYPES,
  normalizeTaskSummary,
  isTaskProcessed,
  getTaskAccess,
} from './taskContracts.js'

const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

class TaskReadModelError extends Error {
  constructor(code, message, details) {
    super(message)
    this.name = 'TaskReadModelError'
    this.code = code
    this.details = details || {}
  }
}

function fail(code, message, details) {
  throw new TaskReadModelError(code, message, details)
}

function isPlainRecord(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  if (prototype === Object.prototype || prototype === null) return true
  const constructorDescriptor = Object.getOwnPropertyDescriptor(prototype, 'constructor')
  return Object.getPrototypeOf(prototype) === null
    && Object.prototype.toString.call(value) === '[object Object]'
    && constructorDescriptor
    && typeof constructorDescriptor.value === 'function'
    && constructorDescriptor.value.name === 'Object'
}

function rejectDangerousKeys(value, label) {
  for (const key of Object.getOwnPropertyNames(value)) {
    if (DANGEROUS_KEYS.has(key)) fail('PROTOTYPE_KEY', `${label} contains a prototype key`, { key })
  }
  if (Object.getOwnPropertySymbols(value).length) {
    fail('UNKNOWN_FIELD', `${label} cannot contain symbol fields`)
  }
}

function assertResolvers(resolvers) {
  if (!isPlainRecord(resolvers)) {
    fail('RESOLVERS_REQUIRED', 'Task domain resolvers must be a plain object')
  }
  rejectDangerousKeys(resolvers, 'task resolvers')
  for (const domain of TASK_BUSINESS_TYPES) {
    if (resolvers[domain] !== undefined && typeof resolvers[domain] !== 'function') {
      fail('INVALID_RESOLVER', `${domain} resolver must be a function`, { domain })
    }
  }
  for (const key of Object.keys(resolvers)) {
    if (!TASK_BUSINESS_TYPES.includes(key)) {
      fail('UNKNOWN_RESOLVER_DOMAIN', `Unknown task resolver domain: ${key}`, { domain: key })
    }
  }
  return Object.freeze({ ...resolvers })
}

function emptyBucket() {
  return Object.freeze([])
}

function frozenSkip(domain, index, code) {
  return Object.freeze({ domain, index, code })
}

function frozenDiagnostics({ scanned = 0, accepted = 0, skipped = [], actorError = null } = {}) {
  return Object.freeze({
    scanned,
    accepted,
    skipped: Object.freeze(skipped.slice()),
    actorError: actorError ? Object.freeze({ code: actorError.code || 'ACTOR_CONTRACT_FAILED' }) : null,
  })
}

function emptyReadModel({ actor = null, diagnostics } = {}) {
  const all = emptyBucket()
  return Object.freeze({
    actor,
    all,
    pending: all,
    processed: all,
    diagnostics: diagnostics || frozenDiagnostics(),
  })
}

function immutableIdentity(summary) {
  return [
    summary.businessType,
    summary.businessId,
    summary.actorId,
    summary.actionType,
    summary.reviewItemId === undefined ? '' : summary.reviewItemId,
  ].join('\u0000')
}

/**
 * Strictly de-duplicate a normalized resolver result.  taskId deliberately
 * ignores actorRole and status, so role labels cannot split a task and a
 * refresh cannot duplicate it.  reviewItemId is part of the business落点;
 * conflicting values for one task are discarded fail-closed.
 */
function dedupeReadTasks(items, skipped) {
  const byTaskId = new Map()
  const identityByTaskId = new Map()
  const conflicted = new Set()

  for (const item of items) {
    if (conflicted.has(item.taskId)) continue
    const previous = byTaskId.get(item.taskId)
    if (!previous) {
      byTaskId.set(item.taskId, item)
      identityByTaskId.set(item.taskId, immutableIdentity(item))
      continue
    }

    if (identityByTaskId.get(item.taskId) !== immutableIdentity(item)) {
      byTaskId.delete(item.taskId)
      identityByTaskId.delete(item.taskId)
      conflicted.add(item.taskId)
      skipped.push(frozenSkip(item.businessType, -1, 'DUPLICATE_CONFLICT'))
      continue
    }

    // A processed refresh wins over pending, while a duplicate with the same
    // state keeps the first resolver's role label.  The label is display
    // metadata and does not affect access or capability.
    if (!isTaskProcessed(previous) && isTaskProcessed(item)) {
      byTaskId.set(item.taskId, item)
    }
  }

  return Array.from(byTaskId.values())
}

function partition(items) {
  const pending = []
  const processed = []
  for (const item of items) {
    if (isTaskProcessed(item)) processed.push(item)
    else pending.push(item)
  }
  return {
    all: Object.freeze(items.slice()),
    pending: Object.freeze(pending),
    processed: Object.freeze(processed),
  }
}

function readTaskSummaries({ actorProvider, resolvers = {} } = {}) {
  if (typeof actorProvider !== 'function') {
    fail('ACTOR_PROVIDER_REQUIRED', 'A trusted actor provider is required')
  }
  const sourceResolvers = assertResolvers(resolvers)

  let actor
  try {
    actor = resolveTrustedActor(actorProvider)
  } catch (error) {
    return emptyReadModel({
      diagnostics: frozenDiagnostics({ actorError: error }),
    })
  }
  if (!actor) {
    return emptyReadModel({
      diagnostics: frozenDiagnostics({ actorError: { code: 'NO_ACTOR' } }),
    })
  }

  const candidates = []
  const skipped = []
  let scanned = 0

  for (const domain of TASK_BUSINESS_TYPES) {
    const resolver = sourceResolvers[domain]
    if (resolver === undefined) continue

    // This is the complete resolver input.  In particular, there is no
    // query, route, status override, actorRole override, or URL context.
    const context = Object.freeze({ actor })
    let result
    try {
      result = resolver(context)
      if (result && typeof result.then === 'function') {
        // The contract is synchronous.  Prevent an injected rejected Promise
        // from becoming an unhandled rejection before it is skipped.
        if (typeof result.catch === 'function') result.catch(() => {})
        skipped.push(frozenSkip(domain, -1, 'ASYNC_RESOLVER_UNSUPPORTED'))
        continue
      }
    } catch (error) {
      skipped.push(frozenSkip(domain, -1, error && error.code ? error.code : 'RESOLVER_FAILED'))
      continue
    }

    if (!Array.isArray(result)) {
      skipped.push(frozenSkip(domain, -1, 'INVALID_RESOLVER_RESULT'))
      continue
    }

    for (let index = 0; index < result.length; index += 1) {
      scanned += 1
      const candidate = result[index]
      try {
        if (!isPlainRecord(candidate)) fail('INVALID_TASK', 'Task candidate must be a plain object')
        rejectDangerousKeys(candidate, 'task candidate')
        const summary = normalizeTaskSummary(candidate)
        // Each resolver is a domain boundary.  A candidate from another
        // domain cannot be re-labelled by a caller or a query parameter.
        if (summary.businessType !== domain) {
          fail('CROSS_DOMAIN_TASK', 'Resolver returned another business domain', { domain })
        }
        // actorId is the only access identity.  actorRole and status are
        // metadata and can never turn an untrusted actor into a reader.
        if (!getTaskAccess(summary, actor).canRead) {
          fail('ACTOR_MISMATCH', 'Task candidate belongs to another actor')
        }
        candidates.push(summary)
      } catch (error) {
        skipped.push(frozenSkip(domain, index, error && error.code ? error.code : 'INVALID_TASK'))
      }
    }
  }

  const unique = dedupeReadTasks(candidates, skipped)
  const buckets = partition(unique)
  return Object.freeze({
    actor,
    all: buckets.all,
    pending: buckets.pending,
    processed: buckets.processed,
    diagnostics: frozenDiagnostics({
      scanned,
      accepted: unique.length,
      skipped,
    }),
  })
}

function createTaskReadModel({ actorProvider, resolvers = {} } = {}) {
  const sourceResolvers = assertResolvers(resolvers)
  return Object.freeze({
    read: () => readTaskSummaries({ actorProvider, resolvers: sourceResolvers }),
    aggregate: () => readTaskSummaries({ actorProvider, resolvers: sourceResolvers }),
    canWrite: () => false,
  })
}

export {
  TaskReadModelError,
  readTaskSummaries,
  createTaskReadModel,
}
