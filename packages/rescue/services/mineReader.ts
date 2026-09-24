/**
 * Package-local, read-only reader for the applicant's rescue list.
 *
 * The governance contract remains available from services/domainReads for
 * adapters and tests. The page binding intentionally stays local so merely
 * registering the rescue subpackage cannot hoist the cross-domain contract
 * and actor policy into the 1.5 MiB main package.
 */
import { getRescueRecords } from '../../../utils/rescueStorage.ts'

type JsonRecord = Readonly<Record<string, unknown>>
export type MineStatus = 'platform_pending' | 'platform_approved' | 'platform_rejected'
export type MineFilter = 'all' | MineStatus
type ActorProvider = () => unknown

interface Actor {
  readonly id: string
  readonly roles: readonly string[]
}

interface ActorResult {
  readonly actor: Actor | null
  readonly error: string | null
}

export interface MineItem {
  readonly rescueId: string
  readonly applicationStatus: MineStatus
  readonly status: MineStatus
  readonly summary?: string
  readonly description?: string
  readonly createdAt?: string | number
}

interface SkipEntry {
  readonly index: number
  readonly code: string
}

interface MineDiagnostics {
  readonly scanned: number
  readonly accepted: number
  readonly skipped: readonly SkipEntry[]
  readonly actorError: Readonly<{ code: string }> | null
}

export interface MineReadModel {
  readonly actor: Actor | null
  readonly items: readonly MineItem[]
  readonly pending: readonly MineItem[]
  readonly processed: readonly MineItem[]
  readonly readOnly: true
  readonly canWrite: false
  readonly diagnostics: MineDiagnostics
}

export interface MineReadOptions {
  readonly actorProvider?: ActorProvider
  readonly filter?: MineFilter
}

interface AliasResult {
  readonly value: string
  readonly error: string | null
}

interface ApplicantIdsResult {
  readonly values: readonly string[]
  readonly error: string | null
}

interface ProjectResult {
  readonly item: MineItem | null
  readonly error: string | null
}

const STATUS_VALUES: readonly MineStatus[] = Object.freeze([
  'platform_pending',
  'platform_approved',
  'platform_rejected',
])
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const EMPTY_ITEMS: readonly MineItem[] = Object.freeze([])
const EMPTY_SKIPPED: readonly SkipEntry[] = Object.freeze([])

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isActorProvider(value: unknown): value is ActorProvider {
  return typeof value === 'function'
}

function isMineStatus(value: string): value is MineStatus {
  return STATUS_VALUES.some((candidate) => candidate === value)
}

function isMineFilter(value: unknown): value is MineFilter {
  return value === 'all' || (typeof value === 'string' && isMineStatus(value))
}

function id(value: unknown): string {
  return typeof value === 'string'
    && value === value.trim()
    && ID_PATTERN.test(value)
    && !URL_MARKERS.test(value)
    ? value
    : ''
}

function actorOf(provider: unknown): ActorResult {
  if (!isActorProvider(provider)) return { actor: null, error: 'ACTOR_PROVIDER_REQUIRED' }

  let supplied: unknown
  try {
    supplied = provider()
  } catch {
    return { actor: null, error: 'ACTOR_PROVIDER_FAILED' }
  }

  const actorValue = isRecord(supplied) && supplied.actor ? supplied.actor : supplied
  if (!isRecord(actorValue)) return { actor: null, error: 'NO_ACTOR' }

  const actorId = id(actorValue.id || actorValue.actorId)
  const suppliedRoles = Array.isArray(actorValue.roles)
    ? actorValue.roles
    : actorValue.role
      ? [actorValue.role]
      : []
  if (!actorId || !suppliedRoles.includes('applicant')) {
    return { actor: null, error: actorId ? 'ACTOR_ROLE_REQUIRED' : 'INVALID_ACTOR' }
  }

  const roles = suppliedRoles.filter((value): value is string => typeof value === 'string')
  return {
    actor: Object.freeze({ id: actorId, roles: Object.freeze(roles) }),
    error: null,
  }
}

function sameAlias(record: JsonRecord, fields: readonly string[], label: string): AliasResult {
  const values: string[] = []
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(record, field)) continue
    const value = id(record[field])
    if (!value) return { value: '', error: `INVALID_${label}` }
    values.push(value)
  }
  if (values.some((value) => value !== values[0])) {
    return { value: '', error: `CONFLICTING_${label}` }
  }
  return { value: values[0] || '', error: null }
}

function applicantIds(record: JsonRecord): ApplicantIdsResult {
  const values: string[] = []
  for (const value of [record.applicantId, record.applicantUserId, record.userId]) {
    const normalized = id(value)
    if (value !== undefined && value !== null && !normalized) {
      return { values: [], error: 'INVALID_APPLICANT_ID' }
    }
    if (normalized && !values.includes(normalized)) values.push(normalized)
  }

  const applicant = record.applicant
  if (isRecord(applicant)) {
    for (const value of [applicant.id, applicant.pawId]) {
      const normalized = id(value)
      if (value !== undefined && value !== null && !normalized) {
        return { values: [], error: 'INVALID_APPLICANT_ID' }
      }
      if (normalized && !values.includes(normalized)) values.push(normalized)
    }
  }
  return { values, error: null }
}

function project(record: unknown, actorId: string): ProjectResult {
  if (!isRecord(record)) return { item: null, error: 'INVALID_RECORD' }

  const rescue = sameAlias(record, ['rescueId', 'id'], 'RESCUE_ID')
  if (rescue.error || !rescue.value || /^demo(?:[-_:]|$)/i.test(rescue.value)) {
    return { item: null, error: rescue.error || 'INVALID_RESCUE_ID' }
  }

  const applicants = applicantIds(record)
  if (applicants.error) return { item: null, error: applicants.error }
  if (!applicants.values.includes(actorId)) return { item: null, error: null }

  const status = sameAlias(record, ['applicationStatus'], 'APPLICATION_STATUS')
  if (status.error || !isMineStatus(status.value)) {
    return { item: null, error: status.error || 'INVALID_MINE_STATUS' }
  }

  return {
    item: Object.freeze({
      rescueId: rescue.value,
      applicationStatus: status.value,
      status: status.value,
      ...(typeof record.summary === 'string' ? { summary: record.summary } : {}),
      ...(typeof record.description === 'string' ? { description: record.description } : {}),
      ...(record.createdAt !== undefined
        && (typeof record.createdAt === 'string' || typeof record.createdAt === 'number')
        ? { createdAt: record.createdAt }
        : {}),
    }),
    error: null,
  }
}

export function readRescueMinePage(options: MineReadOptions = {}): MineReadModel {
  const { actorProvider, filter = 'all' } = options
  if (!isMineFilter(filter)) {
    const error = new Error('unsupported rescue mine status filter')
    Object.assign(error, { code: 'INVALID_STATUS_FILTER' })
    throw error
  }

  const { actor, error: actorError } = actorOf(actorProvider)
  if (!actor) {
    return Object.freeze({
      actor: null,
      items: EMPTY_ITEMS,
      pending: EMPTY_ITEMS,
      processed: EMPTY_ITEMS,
      readOnly: true,
      canWrite: false,
      diagnostics: Object.freeze({
        scanned: 0,
        accepted: 0,
        skipped: EMPTY_SKIPPED,
        actorError: Object.freeze({ code: actorError || 'ACTOR_PROVIDER_REQUIRED' }),
      }),
    })
  }

  let records: unknown[]
  try {
    records = getRescueRecords({ includeDemo: false })
  } catch {
    records = []
  }

  const skipped: SkipEntry[] = []
  const items: MineItem[] = []
  records.forEach((record, index) => {
    const result = project(record, actor.id)
    if (result.error) skipped.push(Object.freeze({ index, code: result.error }))
    if (result.item && (filter === 'all' || result.item.applicationStatus === filter)) {
      items.push(result.item)
    }
  })

  const frozenItems: readonly MineItem[] = Object.freeze(items)
  return Object.freeze({
    actor,
    items: frozenItems,
    pending: Object.freeze(frozenItems.filter((item) => item.applicationStatus === 'platform_pending')),
    processed: Object.freeze(frozenItems.filter((item) => item.applicationStatus !== 'platform_pending')),
    readOnly: true,
    canWrite: false,
    diagnostics: Object.freeze({
      scanned: records.length,
      accepted: frozenItems.length,
      skipped: Object.freeze(skipped),
      actorError: null,
    }),
  })
}
