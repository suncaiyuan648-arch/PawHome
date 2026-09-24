import {
  projectAdoptionFields,
  type AdoptionApplicationSnapshot,
  type AdoptionProjectionCondition,
} from '../../../contracts/adoptionProjection.ts'
import type {
  AdoptionCloudParentPolicy,
  AdoptionReviewResolver,
} from '../../../contracts/adoptionCondition.ts'
import { adoptionStatus } from '../../../contracts/applicationParsing.ts'
/**
 * Read-only adoption application adapter.
 *
 * The application/progress pages are being migrated away from the old
 * `progress.ts` reader.  This boundary owns the one-record read from the
 * existing `PAWHOME_ADOPTIONS` repository and delegates actor/condition rules
 * to the canonical contracts.  It deliberately has no writer, transition,
 * payment, or page dependency.
 */
import { resolveTrustedActor } from '../../../navigation/actorCapabilities.ts'
import {
  createAdoptionTransitionContract,
  readAdoptionCondition,
} from '../../../navigation/adoptionConditionContract.ts'
import { ADOPTION_TRANSITIONS, getAdoptionRecords } from '../../../utils/adoptionStorage.ts'

type JsonRecord = Record<string, unknown>
type Actor = NonNullable<ReturnType<typeof resolveTrustedActor>>
type Perspective = 'applicant' | 'owner' | 'cloud_parent'
type Relations = { applicantId: string; ownerId: string; cloudParentIds: string[] }
type ConditionResult = ReturnType<typeof readAdoptionCondition>
type Reader = (id: string) => unknown
export type AdoptionApplicationResolver = (context: Readonly<{ applicationId: string }>) => unknown
export interface AdoptionApplicationReadOptions {
  readonly actorProvider?: () => unknown
  readonly perspective?: Perspective
  readonly cloudParentPolicy?: AdoptionCloudParentPolicy
  readonly policy?: AdoptionCloudParentPolicy
  readonly reviewResolver?: AdoptionReviewResolver
}
export interface AdoptionApplicationResolverOptions extends AdoptionApplicationReadOptions {
  readonly resolver: AdoptionApplicationResolver
}
type AdapterError = { code: string; message: string; [key: string]: unknown }
type AdapterReadResult = {
  success: boolean
  source: 'mock'
  data: AdoptionApplicationSnapshot | null
  error: AdapterError | null
  actor: Actor | null
  readOnly: true
  canWrite: false
}
type ThenableValue = {
  then: (...args: unknown[]) => unknown
  catch?: (handler: () => void) => unknown
}

const APPLICATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const CROSS_DOMAIN_PREFIXES = Object.freeze([
  'rescue',
  'feeding',
  'order',
  'dynamic',
  'yard',
  'animal',
])
const PERSPECTIVES: readonly Perspective[] = Object.freeze(['applicant', 'owner', 'cloud_parent'])
const APPLICANT_RELATIONS = Object.freeze(['applicantId', 'applicantUserId'])
const OWNER_RELATIONS = Object.freeze(['ownerId', 'ownerPawId', 'ownerUserId', 'yardOwnerId'])
const CLOUD_PARENT_SCALARS = Object.freeze(['cloudParentId', 'cloudParentPawId', 'cloudOwnerId'])
const CLOUD_PARENT_LIST = 'cloudParentIds'
const DEMO_ID_PATTERN = /^demo(?:[-_:]|$)/i
const TRANSITION_CONTRACT = createAdoptionTransitionContract(ADOPTION_TRANSITIONS)

export const ADOPTION_APPLICATION_PERSPECTIVES = PERSPECTIVES

function own(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function codeError(code: string, message: string, details: JsonRecord = {}): AdapterError {
  return { code, message, ...details }
}

function errorCode(error: unknown, fallback: string): string {
  if (error === null || (typeof error !== 'object' && typeof error !== 'function')) return fallback
  const code = Reflect.get(error, 'code')
  return typeof code === 'string' && code ? code : fallback
}

function errorMessage(error: unknown, fallback: string): string {
  if (error === null || (typeof error !== 'object' && typeof error !== 'function')) return fallback
  const message = Reflect.get(error, 'message')
  return typeof message === 'string' && message ? message : fallback
}

function isPerspective(value: unknown): value is Perspective {
  return typeof value === 'string' && PERSPECTIVES.some((candidate) => candidate === value)
}

function isResolver(value: unknown): value is AdoptionApplicationResolver {
  return typeof value === 'function'
}

function isThenable(value: unknown): value is ThenableValue {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof Reflect.get(value, 'then') === 'function'
  )
}

function frozen<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value
  seen.add(value)
  for (const key of Object.keys(value)) frozen(Reflect.get(value, key), seen)
  return Object.freeze(value)
}

function failure(
  code: string,
  message: string,
  actor: Actor | null = null,
  details: JsonRecord = {},
): AdapterReadResult {
  return frozen({
    success: false,
    source: 'mock',
    data: null,
    error: { code, message, ...details },
    actor,
    readOnly: true,
    canWrite: false,
  })
}

function success(data: AdoptionApplicationSnapshot, actor: Actor): AdapterReadResult {
  return frozen({
    success: true,
    source: 'mock',
    data,
    error: null,
    actor,
    readOnly: true,
    canWrite: false,
  })
}

function crossDomainId(id: string): string {
  const lower = id.toLowerCase()
  return (
    CROSS_DOMAIN_PREFIXES.find(
      (prefix) =>
        lower === prefix ||
        lower.startsWith(`${prefix}-`) ||
        lower.startsWith(`${prefix}_`) ||
        lower.startsWith(`${prefix}:`),
    ) || ''
  )
}

function validateApplicationId(value: unknown): string {
  if (typeof value !== 'string' || !value) throw codeError('MISSING_ID', '缺少领养申请 ID')
  if (value !== value.trim()) throw codeError('INVALID_ID', '领养申请 ID 不得包含首尾空白')
  if (!APPLICATION_ID_PATTERN.test(value) || URL_MARKERS.test(value))
    throw codeError('INVALID_ID', '领养申请 ID 格式不合法')
  const prefix = crossDomainId(value)
  if (prefix)
    throw codeError('CROSS_DOMAIN_ID', `领养申请 ID 不属于 adoption 域: ${prefix}`, { prefix })
  if (DEMO_ID_PATTERN.test(value)) throw codeError('NOT_FOUND', '找不到这条领养申请')
  return value
}

function validateRelationId(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value)
    throw codeError('INVALID_RELATION', `${label} 必须是非空 actor ID`)
  if (value !== value.trim() || !APPLICATION_ID_PATTERN.test(value) || URL_MARKERS.test(value)) {
    throw codeError('INVALID_RELATION', `${label} 关系 ID 格式不合法`)
  }
  return value
}

function scalarRelation(record: JsonRecord, fields: readonly string[], label: string): string {
  const values: string[] = []
  for (const field of fields) {
    if (
      !own(record, field) ||
      record[field] === undefined ||
      record[field] === null ||
      record[field] === ''
    )
      continue
    values.push(validateRelationId(record[field], `record.${field}`))
  }
  const unique = [...new Set(values)]
  if (unique.length > 1)
    throw codeError('CONFLICTING_RELATION', `${label} 关系别名不一致`, { label, values: unique })
  return unique[0] || ''
}

function cloudParentRelations(record: JsonRecord): string[] {
  let list: string[] = []
  if (own(record, CLOUD_PARENT_LIST)) {
    if (!Array.isArray(record[CLOUD_PARENT_LIST]))
      throw codeError('INVALID_RELATION', 'record.cloudParentIds 必须是数组')
    list = record[CLOUD_PARENT_LIST].map((value) =>
      validateRelationId(value, 'record.cloudParentIds'),
    )
    list = [...new Set(list)]
  }
  const scalars: string[] = []
  for (const field of CLOUD_PARENT_SCALARS) {
    if (
      !own(record, field) ||
      record[field] === undefined ||
      record[field] === null ||
      record[field] === ''
    )
      continue
    scalars.push(validateRelationId(record[field], `record.${field}`))
  }
  const uniqueScalars = [...new Set(scalars)]
  if (uniqueScalars.length > 1)
    throw codeError('CONFLICTING_RELATION', 'cloud-parent 关系别名不一致', {
      values: uniqueScalars,
    })
  if (uniqueScalars[0] && list.length && !list.includes(uniqueScalars[0])) {
    throw codeError('CONFLICTING_RELATION', 'cloud-parent 单值与列表关系不一致')
  }
  if (!list.length && uniqueScalars[0]) list = [uniqueScalars[0]]
  return list
}

function validateRelations(record: unknown): Relations {
  if (!isRecord(record)) throw codeError('INVALID_RECORD', '领养申请记录格式不合法')
  const applicantId = scalarRelation(record, APPLICANT_RELATIONS, 'applicant')
  const ownerId = scalarRelation(record, OWNER_RELATIONS, 'owner')
  const cloudParentIds = cloudParentRelations(record)
  return { applicantId, ownerId, cloudParentIds }
}

function normalizeStatus(record: JsonRecord): string {
  const values: string[] = []
  for (const field of ['status', 'applicationStatus']) {
    if (!own(record, field)) continue
    if (typeof record[field] !== 'string' || !record[field])
      throw codeError('INVALID_STATUS', `record.${field} 必须是非空状态`)
    if (record[field] !== record[field].trim())
      throw codeError('INVALID_STATUS', `record.${field} 不得包含首尾空白`)
    values.push(record[field])
  }
  const unique = [...new Set(values)]
  if (unique.length > 1) throw codeError('CONFLICTING_STATUS', 'status 与 applicationStatus 不一致')
  const status = unique[0] || ''
  if (!status || !own(ADOPTION_TRANSITIONS, status))
    throw codeError('INVALID_STATUS', '领养申请状态不在 canonical 状态机内')
  // Exercise the injected canonical transition boundary.  The adapter never
  // performs a transition; this only confirms that the state is represented.
  TRANSITION_CONTRACT.allowedNext(status)
  return status
}

function canonicalApplicationId(record: JsonRecord): string {
  const values: string[] = []
  for (const field of ['id', 'recordId', 'applicationId']) {
    if (
      !own(record, field) ||
      record[field] === undefined ||
      record[field] === null ||
      record[field] === ''
    )
      continue
    if (
      typeof record[field] !== 'string' ||
      record[field] !== record[field].trim() ||
      !APPLICATION_ID_PATTERN.test(record[field]) ||
      URL_MARKERS.test(record[field])
    ) {
      throw codeError('INVALID_RECORD_ID', `record.${field} 不是合法的领养申请 ID`)
    }
    if (crossDomainId(record[field]))
      throw codeError('CROSS_DOMAIN_RECORD', '领养申请记录含跨域 ID')
    values.push(record[field])
  }
  const unique = [...new Set(values)]
  if (unique.length > 1) throw codeError('CONFLICTING_APPLICATION_ID', '领养申请 ID 别名不一致')
  return unique[0] || ''
}

function findExactRecord(id: string, records: readonly unknown[]): JsonRecord | null {
  if (!Array.isArray(records)) throw codeError('STORAGE_READ_FAILED', '领养申请读取结果格式不合法')
  const matches = records.filter((record) => {
    if (!isRecord(record)) return false
    const canonical = canonicalApplicationId(record)
    return canonical === id
  })
  if (matches.length > 1) throw codeError('AMBIGUOUS_APPLICATION', '领养申请 ID 对应多条记录')
  return matches[0] || null
}

function readStoredRecord(id: string): JsonRecord | null {
  // This is the only production storage read.  The explicit option disables
  // demo fallback in adoptionStorage and prevents stale demo deep links from
  // becoming real private data.
  return findExactRecord(id, getAdoptionRecords({ includeDemo: false }))
}

function resolveActor(actorProvider: unknown): { actor: Actor | null; error: AdapterError | null } {
  try {
    const actor = resolveTrustedActor(actorProvider)
    return actor
      ? { actor, error: null }
      : { actor: null, error: codeError('NO_ACTOR', 'trusted actor 不可用') }
  } catch (error) {
    const code =
      error !== null && (typeof error === 'object' || typeof error === 'function')
        ? Reflect.get(error, 'code')
        : undefined
    return {
      actor: null,
      error: codeError(typeof code === 'string' ? code : 'INVALID_ACTOR', 'trusted actor 不可用'),
    }
  }
}

function policyFromOptions(
  options: AdoptionApplicationReadOptions,
): AdoptionCloudParentPolicy | undefined {
  const hasCanonical = own(options, 'cloudParentPolicy')
  const hasAlias = own(options, 'policy')
  if (
    hasCanonical &&
    hasAlias &&
    JSON.stringify(options.cloudParentPolicy) !== JSON.stringify(options.policy)
  ) {
    throw codeError('CONFLICTING_POLICY', 'cloud-parent policy 别名不一致')
  }
  return hasCanonical ? options.cloudParentPolicy : hasAlias ? options.policy : undefined
}

function publicCondition(
  condition: ConditionResult | null,
  perspective: Perspective | undefined,
  actorId: string,
): AdoptionProjectionCondition | null {
  const source = condition && condition.cloudParent
  if (!source) return null
  const result: AdoptionProjectionCondition = {
    count: source.count,
    required: source.required,
    decision: source.decision,
    canProceed: source.canProceed,
    decisionRequired: source.decisionRequired,
    reason: source.reason,
    reviews: [],
  }
  if (source.selection) result.selection = source.selection
  if (perspective === 'applicant') {
    result.reviews = Array.isArray(source.reviews)
      ? source.reviews.map((review) => ({ ...review }))
      : []
  } else if (perspective === 'cloud_parent') {
    result.reviews = Array.isArray(source.reviews)
      ? source.reviews
          .filter((review) => review && review.id === actorId)
          .map((review) => ({ ...review }))
      : []
  } else {
    result.reviews = []
  }
  return result
}

function projectRecord(
  record: JsonRecord,
  id: string,
  status: string,
  perspective: Perspective,
  condition: ConditionResult,
  actorId: string,
): AdoptionApplicationSnapshot {
  const state = adoptionStatus(status)
  if (!state) throw codeError('INVALID_STATUS', '领养申请状态不合法')
  return {
    ...projectAdoptionFields(record, perspective === 'applicant'),
    applicationId: id,
    id,
    recordId: id,
    applicationType: 'adoption',
    status: state,
    perspective,
    condition: publicCondition(condition, perspective, actorId),
  }
}

function normalizeOptions(options: unknown): AdoptionApplicationReadOptions {
  return isRecord(options) ? (options as AdoptionApplicationReadOptions) : {}
}

function readApplication(
  applicationId: string,
  options: AdoptionApplicationReadOptions,
  reader: Reader,
  { allowReviewResolver = false }: { allowReviewResolver?: boolean } = {},
): AdapterReadResult {
  let id: string
  try {
    id = validateApplicationId(applicationId)
  } catch (error) {
    return failure(errorCode(error, 'INVALID_ID'), errorMessage(error, '领养申请 ID 不合法'))
  }

  const source = normalizeOptions(options)
  const actorState = resolveActor(source.actorProvider)
  if (actorState.error) return failure(actorState.error.code, actorState.error.message)
  const actor = actorState.actor
  if (!actor) return failure('NO_ACTOR', 'trusted actor 不可用')

  let record: unknown
  try {
    record = reader(id)
  } catch (error) {
    return failure(errorCode(error, 'STORAGE_READ_FAILED'), '领养申请读取失败', actor)
  }
  if (!record) return failure('NOT_FOUND', '找不到这条领养申请', actor)
  if (!isRecord(record)) return failure('INVALID_RECORD', '领养申请记录格式不合法', actor)

  let relations: Relations
  let status: string
  try {
    relations = validateRelations(record)
    status = normalizeStatus(record)
  } catch (error) {
    return failure(errorCode(error, 'INVALID_RECORD'), '领养申请记录校验失败', actor)
  }

  const requestedPerspective = source.perspective
  if (requestedPerspective !== undefined && !isPerspective(requestedPerspective)) {
    return failure('INVALID_PERSPECTIVE', '领养申请视角不受支持', actor)
  }

  const conditionInput: JsonRecord = {
    record,
    actorProvider: () => actor,
    ...(requestedPerspective === undefined ? {} : { perspective: requestedPerspective }),
  }
  try {
    conditionInput.policy = policyFromOptions(source)
    // A page/query caller must not inject authoritative review states.  Only
    // the explicit resolver seam below may supply a controlled review reader.
    if (allowReviewResolver && source.reviewResolver !== undefined)
      conditionInput.reviewResolver = source.reviewResolver
  } catch (error) {
    return failure(errorCode(error, 'INVALID_POLICY'), '领养条件策略不合法', actor)
  }

  let condition: ConditionResult
  try {
    condition = readAdoptionCondition(conditionInput)
  } catch (error) {
    return failure(errorCode(error, 'CONDITION_READ_FAILED'), '领养条件读取失败', actor)
  }
  if (!condition.canRead)
    return failure('FORBIDDEN', '当前 actor 无权读取这条领养申请', actor, {
      reason: condition.reason,
    })

  // A pending or rejected condition is safe to display.  An unresolved
  // multi-parent policy is different: do not turn missing/invalid policy into
  // an implicit all/any decision or expose a success result.
  if (condition.cloudParent && condition.cloudParent.decisionRequired) {
    return failure(
      condition.cloudParent.reason || 'CLOUD_PARENT_POLICY_REQUIRED',
      '多云家长条件尚未有明确策略',
      actor,
    )
  }
  const perspective = condition.perspective
  if (!perspective) return failure('FORBIDDEN', '当前 actor 无权读取这条领养申请', actor)
  if (
    (perspective === 'owner' || perspective === 'cloud_parent') &&
    requestedPerspective === undefined
  ) {
    return failure('PERSPECTIVE_REQUIRED', '院主或云家长读取必须显式声明视角', actor)
  }
  // The canonical condition contract already proves the actor relation.  The
  // local relation result is kept only as a defensive check against any future
  // contract change and is never derived from query/role/managed fields.
  const related =
    perspective === 'applicant'
      ? relations.applicantId === actor.id
      : perspective === 'owner'
        ? relations.ownerId === actor.id
        : relations.cloudParentIds.includes(actor.id)
  if (!related) return failure('FORBIDDEN', '当前 actor 不属于这条领养申请', actor)

  return success(frozen(projectRecord(record, id, status, perspective, condition, actor.id)), actor)
}

/** Read one current, persisted adoption application for a trusted actor. */
export function readAdoptionApplication(
  applicationId: string,
  options: AdoptionApplicationReadOptions = {},
): AdapterReadResult {
  return readApplication(applicationId, options, readStoredRecord)
}

/** Alias used by page migrations that still call their item an application. */
export const readAdoptionApplicationById = readAdoptionApplication

/**
 * Test/future transport seam.  Production callers must use
 * readAdoptionApplication so the repository remains PAWHOME_ADOPTIONS-only.
 * The resolver receives only the validated ID and must synchronously return a
 * single record; promises are rejected before they can become authoritative.
 */
export function readAdoptionApplicationWithResolver(
  applicationId: string,
  options: AdoptionApplicationResolverOptions,
): AdapterReadResult {
  const source = normalizeOptions(options)
  const resolver = isRecord(options) ? options.resolver : undefined
  if (!isResolver(resolver)) return failure('RESOLVER_REQUIRED', '领养申请读取器不可用')
  return readApplication(
    applicationId,
    source,
    (id: string) => {
      let record: unknown
      try {
        record = resolver(Object.freeze({ applicationId: id }))
      } catch {
        throw codeError('STORAGE_READ_FAILED', '领养申请读取器失败')
      }
      if (isThenable(record)) {
        if (typeof record.catch === 'function') record.catch(() => undefined)
        throw codeError('ASYNC_RESOLVER_UNSUPPORTED', '领养申请读取器必须同步返回')
      }
      return record
    },
    { allowReviewResolver: true },
  )
}

export const readAdoptionProgress = readAdoptionApplication
