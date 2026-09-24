/**
 * Persistent feeding task reader for the account-task bridge.
 *
 * It consumes only the explicit `PAWHOME_FEEDING_ORDERS` array and a trusted
 * actor. No fixture fallback, query role, or status override is accepted.
 */

type JsonRecord = Record<string, unknown>
type FeedingTaskStatus = 'completed' | 'in_progress' | 'pending'
type FeedingTaskRole = 'owner' | 'applicant'
type FeedingTaskAction = 'fulfill' | 'feedback'

interface TaskActor {
  readonly id: string
  readonly roles: readonly string[]
}

export interface FeedingTaskReadOptions {
  readonly actorProvider: () => unknown
}

interface FeedingTaskSummary {
  readonly taskId: string
  readonly businessType: 'feeding'
  readonly businessId: string
  readonly actorId: string
  readonly actorRole: FeedingTaskRole
  readonly actionType: FeedingTaskAction
  readonly status: FeedingTaskStatus
}

interface TaskListData {
  readonly items: readonly FeedingTaskSummary[]
  readonly total: number
}

interface TaskReadSuccess {
  readonly success: true
  readonly data: TaskListData
  readonly error: null
  readonly readOnly: true
  readonly canWrite: false
}

interface TaskReadFailure {
  readonly success: false
  readonly data: EmptyTaskListData
  readonly error: { readonly code: string }
  readonly readOnly: true
  readonly canWrite: false
}

interface EmptyTaskListData {
  readonly items: readonly []
}

interface StoredRows {
  readonly rows: readonly unknown[]
  readonly error: string | null
  readonly present: boolean
}

const STORAGE_KEY = 'PAWHOME_FEEDING_ORDERS'
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const COMPLETED_STATES = ['completed', 'fulfilled', 'processed', 'done'] as const
const ACTIVE_STATES = ['active', 'in_progress', 'shipping', 'delivered'] as const

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

function emptyTaskData(): EmptyTaskListData {
  return { items: [] }
}

function fail(code: string): TaskReadFailure {
  return frozen({
    success: false,
    data: emptyTaskData(),
    error: { code },
    readOnly: true,
    canWrite: false,
  })
}

function id(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value === value.trim() &&
    SAFE_ID.test(value) &&
    !URL_MARKERS.test(value)
  )
}

function actorOf(provider: unknown): TaskActor | null {
  let value: unknown
  try {
    value = isProvider(provider) ? provider() : null
  } catch {
    return null
  }
  const candidate = isRecord(value) && value.actor ? value.actor : value
  if (
    !isRecord(candidate) ||
    !id(candidate.id) ||
    !Array.isArray(candidate.roles) ||
    candidate.roles.some((role) => typeof role !== 'string')
  )
    return null
  return frozen({ id: candidate.id, roles: candidate.roles.slice() as string[] })
}

function read(): StoredRows {
  let raw: unknown
  try {
    raw = uni.getStorageSync(STORAGE_KEY)
  } catch {
    return { rows: [], error: 'STORAGE_READ_FAILED', present: true }
  }
  if (raw === undefined || raw === null || raw === '')
    return { rows: [], error: null, present: false }
  try {
    const value: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(value)
      ? { rows: value, error: null, present: true }
      : { rows: [], error: 'INVALID_STORAGE', present: true }
  } catch {
    return { rows: [], error: 'INVALID_STORAGE', present: true }
  }
}

function statusOf(value: unknown): FeedingTaskStatus {
  if (COMPLETED_STATES.some((state) => state === value)) return 'completed'
  if (ACTIVE_STATES.some((state) => state === value)) return 'in_progress'
  return 'pending'
}

/** Read task summaries from saved feeding orders for the current actor. */
export function readFeedingTaskSummaries(
  options: FeedingTaskReadOptions,
): TaskReadSuccess | TaskReadFailure {
  const actor = actorOf(options.actorProvider)
  if (!actor) return fail('NO_ACTOR')
  const source = read()
  if (source.error) return fail(source.error)
  if (!source.present) return fail('READER_MISSING')
  const items: FeedingTaskSummary[] = []
  for (const value of source.rows) {
    if (!isRecord(value)) continue
    const orderId = value.orderId || value.id
    if (!id(orderId)) continue
    const donor = [value.userId, value.userPawId, value.donorId].includes(actor.id)
    const manager =
      (actor.roles.includes('yard_owner') ||
        actor.roles.includes('owner') ||
        actor.roles.includes('fulfillment_manager')) &&
      [value.yardOwnerId, value.ownerPawId].includes(actor.id)
    if (!donor && !manager) continue
    const state = value.feedbackStatus || value.status || value.stateKey
    items.push({
      taskId: `task:feeding:${orderId}:${manager ? 'fulfill' : 'feedback'}:${actor.id}`,
      businessType: 'feeding',
      businessId: orderId,
      actorId: actor.id,
      actorRole: manager ? 'owner' : 'applicant',
      actionType: manager ? 'fulfill' : 'feedback',
      status: statusOf(state),
    })
  }
  return frozen({
    success: true,
    data: { items, total: items.length },
    error: null,
    readOnly: true,
    canWrite: false,
  })
}

export const readTasks = readFeedingTaskSummaries
