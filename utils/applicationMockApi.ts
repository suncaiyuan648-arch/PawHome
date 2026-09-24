/**
 * 用户侧审批单 mock API。
 *
 * 生产后端尚未提供接口合同，因此页面只依赖这一层的统一返回形状：
 * { success, data, error }. 后续接入 request/cloud API 时替换本文件即可，
 * 不需要让页面重新实现领养/救助状态机。
 */
import {
  ADOPTION_REAPPROVAL_ENABLED,
  addAdoptionFromUnknown as addAdoption,
  getAdoptionById,
  getAdoptionRecords,
  reopenAdoptionFromUnknown as reopenAdoption,
  transitionAdoptionFromUnknown as transitionAdoption,
  updateAdoptionFromUnknown as updateAdoption,
} from './adoptionStorage.ts'
import {
  createRescueFromUnknown as createRescue,
  getRescueById,
  getRescueRecords,
  transitionRescueApplicationFromUnknown as transitionRescueApplication,
  updateRescueFromUnknown as updateRescue,
} from './rescueStorage.ts'
import {
  findRewardOrderByApplicationId,
  findRewardOrderById,
  readRewardOrders,
  writeRewardOrders,
} from './rewardOrderStorage.ts'
import type { RewardOrderRecord } from './rewardOrderStorage.ts'

type JsonRecord = Record<string, unknown>
import type {
  ApplicationType,
  ApplicationRecord,
  ApplicationRecords,
  ApplicationInputs,
  ApplicationPatches,
  AdoptionRecord,
  RescueRecord,
  AdoptionStatus,
  RescueApplicationStatus,
  AdoptionEvidenceInput,
  ApiResult,
  ApiSuccess,
  ApiFailure,
} from '../contracts/applications.ts'
import type { AddressRecord } from './addressMock.ts'

interface Actor {
  id: string
  roles: string[]
}

export interface ActorOptions {
  actorProvider?: () => unknown
  requireActor?: boolean
  includeDemo?: boolean
}

interface ActorResolution {
  actor: Actor | null
  error: ApiFailure | null
}

interface Authorization {
  actor: Actor | null
  error?: ApiFailure
}

export const APPLICATION_TYPE = Object.freeze({ adoption: 'adoption', rescue: 'rescue' })
export const MOCK_API_MODE = 'mock'

const ACTOR_SESSION_STORAGE_KEY = 'PAWHOME_ACTOR_SESSION'
const SAFE_ACTOR_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const ACTOR_ROLES = new Set([
  'applicant',
  'owner',
  'reviewer',
  'cloud_parent',
  'yard_owner',
  'animal_manager',
])

function defaultActorProvider(): unknown {
  if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') return null
  try {
    return uni.getStorageSync(ACTOR_SESSION_STORAGE_KEY) || null
  } catch {
    return null
  }
}

function resolveTrustedActor(options: ActorOptions = {}): ActorResolution {
  const provider =
    options && typeof options.actorProvider === 'function'
      ? options.actorProvider
      : defaultActorProvider
  let provided
  try {
    provided = provider()
  } catch {
    return { actor: null, error: fail('ACTOR_PROVIDER_FAILED', '当前登录会话不可用') }
  }
  const providedRecord = recordOf(provided)
  const source = isRecord(providedRecord.actor) ? providedRecord.actor : providedRecord
  if (!isRecord(source)) {
    return { actor: null, error: fail('NO_ACTOR', '请先登录后再操作') }
  }
  const id = source.id || source.actorId
  const roles = Array.isArray(source.roles)
    ? source.roles
    : source.role === undefined
      ? []
      : [source.role]
  if (
    typeof id !== 'string' ||
    !SAFE_ACTOR_ID.test(id) ||
    /[/?#%]|:\/\//.test(id) ||
    roles.some((role) => typeof role !== 'string' || !ACTOR_ROLES.has(role))
  ) {
    return { actor: null, error: fail('INVALID_ACTOR', '登录身份格式无效') }
  }
  return {
    actor: {
      id,
      roles: [...new Set(roles.filter((role): role is string => typeof role === 'string'))],
    },
    error: null,
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function recordOf(value: unknown): JsonRecord {
  return isRecord(value) ? value : {}
}

function isErrorWithCode(value: unknown): value is { code: string; message: string } {
  return isRecord(value) && typeof value.code === 'string' && typeof value.message === 'string'
}

function applicantRelation(record: JsonRecord): string[] | null {
  const values: string[] = []
  const collect = (source: JsonRecord | undefined, fields: string[]): boolean => {
    for (const field of fields) {
      if (!source || !Object.prototype.hasOwnProperty.call(source, field)) continue
      const value = source[field]
      if (typeof value !== 'string' || !SAFE_ACTOR_ID.test(value) || /[/?#%]|:\/\//.test(value))
        return false
      values.push(value)
    }
    return true
  }
  if (!collect(record, ['applicantId', 'applicantUserId', 'userId'])) return null
  if (record.applicant !== undefined && record.applicant !== null) {
    if (!isRecord(record.applicant) || !collect(record.applicant, ['id', 'pawId', 'userId']))
      return null
  }
  return [...new Set(values)]
}

function actorFailure(
  resolved: ActorResolution,
  fallback = '当前账号无权操作这条领养申请',
): ApiFailure {
  return resolved && resolved.error ? resolved.error : fail('FORBIDDEN', fallback)
}

/** Applicant aliases must identify exactly one trusted applicant. */
function authorizeApplicant(record: JsonRecord, options: ActorOptions = {}): Authorization {
  const resolved = resolveTrustedActor(options)
  if (resolved.error || !resolved.actor) return { actor: null, error: actorFailure(resolved) }
  const actor = resolved.actor
  const relations = applicantRelation(record)
  if (!relations || relations.length > 1)
    return { actor: null, error: fail('INVALID_APPLICANT', '申请人归属无效或冲突') }
  if (!relations.length)
    return { actor: null, error: fail('MISSING_APPLICANT', '领养申请缺少申请人归属') }
  if (!actor.roles.includes('applicant'))
    return { actor: null, error: fail('ACTOR_ROLE_REQUIRED', '当前账号没有申请人权限') }
  if (relations[0] !== actor.id)
    return { actor: null, error: fail('FORBIDDEN', '当前账号不是这条领养申请的申请人') }
  return { actor }
}

/**
 * 仅供本地超级测试员切换页面演示状态，不代表真实审批接口。
 * 失败态仍然落到 rejected 终态，保持与正式状态机相同的展示语义。
 */
export const ADOPTION_TEST_STATES: Readonly<Record<string, string>> = Object.freeze({
  cloudPending: 'cloud_pending',
  cloudRejected: 'cloud_rejected',
  ownerPending: 'owner_pending',
  ownerRejected: 'owner_rejected',
  ownerApproved: 'owner_approved',
})

function normalizeType(type: unknown): ApplicationType | '' {
  const value = String(type ?? '')
    .trim()
    .toLowerCase()
  return value === APPLICATION_TYPE.adoption || value === APPLICATION_TYPE.rescue ? value : ''
}

function normalizeId(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim()
}

function ok<T>(data: T, extra: JsonRecord = {}): ApiSuccess<T> {
  return { success: true, source: MOCK_API_MODE, data, error: null, ...extra }
}

function fail(code: string, message: string, data: null = null): ApiFailure {
  return { success: false, source: MOCK_API_MODE, data, error: { code, message } }
}

function invalidType(): ApiFailure {
  return fail('INVALID_TYPE', 'type must be adoption or rescue')
}

const REWARD_CLAIMABLE_STATUSES = Object.freeze(['adoption_confirmed', 'reward', 'reward_done'])

function readOrdersOrFail():
  { orders: RewardOrderRecord[]; error?: undefined } | { orders?: undefined; error: ApiFailure } {
  try {
    return { orders: readRewardOrders() }
  } catch (error) {
    const dataErrorCodes = new Set([
      'INVALID_ORDER_STORAGE',
      'INVALID_ORDER_RECORD',
      'DUPLICATE_ORDER_ID',
      'AMBIGUOUS_APPLICATION_ORDER',
    ])
    if (isErrorWithCode(error) && dataErrorCodes.has(error.code)) {
      return { error: fail(error.code, error.message) }
    }
    return { error: fail('STORAGE_READ_FAILED', '奖励订单读取失败') }
  }
}

/** 本地 mock 订单边界；后端订单接口接入后只替换这里。 */
export function createRewardOrder(
  recordId: string,
  address: Partial<AddressRecord> = {},
  options: ActorOptions = {},
): ApiResult<RewardOrderRecord> {
  const applicationId = normalizeId(recordId)
  if (!applicationId) return fail('MISSING_ID', '缺少领养单 ID')
  const addressRecord = recordOf(address)
  if (!normalizeId(addressRecord.id)) return fail('MISSING_ADDRESS', '缺少收货地址')

  let application
  try {
    // Reward orders may only attach to a saved adoption application.  Demo
    // records must never become writable orders by being selected as fallback.
    application = getAdoptionById(applicationId, { includeDemo: false })
  } catch {
    return fail('STORAGE_READ_FAILED', '领养单读取失败')
  }
  if (!application) return fail('APPLICATION_NOT_FOUND', '领养单不存在')
  const authorization = authorizeApplicant(application, options)
  if (authorization.error) return authorization.error
  if (!REWARD_CLAIMABLE_STATUSES.includes(normalizeId(application.status))) {
    return fail('INVALID_STAGE', '当前领养单尚未达到奖励领取阶段')
  }

  const readResult = readOrdersOrFail()
  if (readResult.error) return readResult.error
  const orders = readResult.orders
  const existing = findRewardOrderByApplicationId(applicationId, orders)
  if (existing) return ok(existing)
  if (application.status === 'reward_done') {
    return fail('REWARD_ORDER_MISSING', '奖励已领取但未找到关联订单')
  }

  const order = {
    id: `reward-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    applicationId,
    recordId: applicationId,
    status: 'submitted',
    deliveryStatus: 'shipping',
    deliveryProgress: '0/3',
    address: { ...addressRecord },
    ...(authorization.actor ? { userId: authorization.actor.id } : {}),
    createdAt: Date.now(),
  }
  try {
    writeRewardOrders([order, ...orders])
  } catch {
    return fail('STORAGE_WRITE_FAILED', '奖励订单保存失败')
  }
  return ok(order)
}

export function getRewardOrderById(
  orderId: string,
  options: ActorOptions = {},
): ApiResult<RewardOrderRecord> {
  const id = normalizeId(orderId)
  if (!id) return fail('MISSING_ORDER_ID', '缺少订单 ID')
  const readResult = readOrdersOrFail()
  if (readResult.error) return readResult.error
  const order = findRewardOrderById(id, readResult.orders)
  if (!order) return fail('NOT_FOUND', '订单不存在')
  let application
  try {
    application = getAdoptionById(normalizeId(order.applicationId), { includeDemo: false })
  } catch {
    return fail('STORAGE_READ_FAILED', '领养单读取失败')
  }
  if (!application) return fail('APPLICATION_NOT_FOUND', '订单关联的领养申请不存在')
  const authorization = authorizeApplicant(application, options)
  if (authorization.error) return authorization.error
  if (order.userId && authorization.actor && normalizeId(order.userId) !== authorization.actor.id) {
    return fail('FORBIDDEN', '当前账号无权读取该奖励订单')
  }
  if (order.userId && !authorization.actor) return fail('NO_ACTOR', '请先登录后再查看奖励订单')
  return ok(order)
}

export function createApplication<T extends ApplicationType>(
  type: T,
  payload?: ApplicationInputs[NoInfer<T>],
  options?: ActorOptions,
): ApiResult<ApplicationRecords[T]>
export function createApplication(
  type: unknown,
  payload: unknown = {},
  options: ActorOptions = {},
): ApiResult<ApplicationRecord> {
  const applicationType = normalizeType(type)
  if (!applicationType) return invalidType()
  const payloadRecord = recordOf(payload)
  let nextPayload: JsonRecord = payloadRecord
  const actorBound =
    applicationType === APPLICATION_TYPE.adoption ||
    typeof options.actorProvider === 'function' ||
    Boolean(defaultActorProvider())
  if (actorBound) {
    const resolved = resolveTrustedActor(options)
    if (resolved.error || !resolved.actor)
      return resolved.error || fail('NO_ACTOR', '请先登录后再操作')
    const actor = resolved.actor
    if (!actor.roles.includes('applicant'))
      return fail('ACTOR_ROLE_REQUIRED', '当前账号没有申请人权限')
    const suppliedApplicant = applicantRelation(payloadRecord)
    if (!suppliedApplicant || suppliedApplicant.some((id) => id !== actor.id)) {
      return fail('ACTOR_MISMATCH', '申请人归属必须绑定当前登录账号')
    }
    nextPayload = {
      ...payloadRecord,
      applicantId: actor.id,
      applicantUserId: actor.id,
      userId: actor.id,
      applicant: isRecord(payloadRecord.applicant)
        ? { ...payloadRecord.applicant, id: actor.id }
        : applicationType === APPLICATION_TYPE.rescue
          ? { id: actor.id }
          : payloadRecord.applicant,
    }
  }
  let record
  try {
    record =
      applicationType === APPLICATION_TYPE.rescue
        ? createRescue({ ...nextPayload, applicationType })
        : addAdoption({ ...nextPayload, applicationType })
  } catch {
    return fail('STORAGE_WRITE_FAILED', '审批单保存失败')
  }
  return record ? ok(record) : fail('CREATE_FAILED', '审批单创建失败')
}

export function getApplication<T extends ApplicationType>(
  type: T,
  id: string,
  options?: ActorOptions,
): ApiResult<ApplicationRecords[T]>
export function getApplication(
  type: unknown,
  id: unknown,
  options: ActorOptions = {},
): ApiResult<ApplicationRecord> {
  const applicationType = normalizeType(type)
  if (!applicationType) return invalidType()
  const applicationId = normalizeId(id)
  if (!applicationId) return fail('MISSING_ID', '缺少审批单 ID')
  let record
  try {
    record =
      applicationType === APPLICATION_TYPE.rescue
        ? getRescueById(applicationId, options)
        : getAdoptionById(
            applicationId,
            typeof options.actorProvider === 'function' || options.requireActor === true
              ? { ...options, includeDemo: false }
              : options,
          )
  } catch {
    return fail('STORAGE_READ_FAILED', '审批单读取失败')
  }
  if (!record) return fail('NOT_FOUND', '审批单不存在')
  if (
    applicationType === APPLICATION_TYPE.adoption &&
    (typeof options.actorProvider === 'function' || options.requireActor === true)
  ) {
    const authorization = authorizeApplicant(record, options)
    if (authorization.error) return authorization.error
  }
  return ok(record)
}

export function getApplicationStatus<T extends ApplicationType>(
  type: T,
  id: string,
  options?: ActorOptions,
): ApiResult<{
  id: string
  type: T
  status: T extends 'adoption' ? AdoptionStatus : RescueApplicationStatus
  record: ApplicationRecords[T]
}>
export function getApplicationStatus(
  type: unknown,
  id: unknown,
  options: ActorOptions = {},
): ApiResult<{
  id: string
  type: ApplicationType
  status: AdoptionStatus | RescueApplicationStatus
  record: ApplicationRecord
}> {
  const applicationType = normalizeType(type)
  if (!applicationType) return invalidType()
  const result = getApplication(applicationType, normalizeId(id), options)
  if (!result.success) return result
  const status =
    result.data.applicationType === APPLICATION_TYPE.rescue
      ? result.data.applicationStatus
      : result.data.status
  return ok({
    id: result.data.id,
    type: applicationType,
    status,
    record: result.data,
  })
}

export function updateApplication<T extends ApplicationType>(
  type: T,
  id: string,
  patch?: ApplicationPatches[NoInfer<T>],
): ApiResult<ApplicationRecords[T]>
export function updateApplication(
  type: unknown,
  id: unknown,
  patch: unknown = {},
): ApiResult<ApplicationRecord> {
  const applicationType = normalizeType(type)
  if (!applicationType) return invalidType()
  const applicationId = normalizeId(id)
  if (!applicationId) return fail('MISSING_ID', '缺少审批单 ID')
  let record
  try {
    record =
      applicationType === APPLICATION_TYPE.rescue
        ? updateRescue(applicationId, patch)
        : updateAdoption(applicationId, patch)
  } catch {
    return fail('STORAGE_WRITE_FAILED', '审批单保存失败')
  }
  return record ? ok(record) : fail('UPDATE_FAILED', '审批单更新失败')
}

export function advanceApplication<T extends ApplicationType>(
  type: T,
  id: string,
  nextStatus: T extends 'adoption'
    ? Exclude<AdoptionStatus, 'unknown'>
    : Exclude<RescueApplicationStatus, 'unknown'>,
  patch?: ApplicationPatches[NoInfer<T>],
  options?: ActorOptions,
): ApiResult<ApplicationRecords[T]>
export function advanceApplication(
  type: unknown,
  id: unknown,
  nextStatus: unknown,
  patch: unknown = {},
  options: ActorOptions = {},
): ApiResult<ApplicationRecord> {
  const applicationType = normalizeType(type)
  if (!applicationType) return invalidType()
  const applicationId = normalizeId(id)
  if (!applicationId) return fail('MISSING_ID', '缺少审批单 ID')
  try {
    if (
      applicationType === APPLICATION_TYPE.adoption &&
      options &&
      (typeof options.actorProvider === 'function' || options.requireActor === true)
    ) {
      const current = getAdoptionById(applicationId, { includeDemo: false })
      if (!current) return fail('NOT_FOUND', '领养单不存在')
      const authorization = authorizeApplicant(current, options)
      if (authorization.error) return authorization.error
    }
    if (applicationType === APPLICATION_TYPE.adoption && normalizeId(nextStatus) === 'pending') {
      const current = getAdoptionById(applicationId)
      const requiredCloudParents =
        current && Array.isArray(current.cloudParentIds)
          ? current.cloudParentIds.map(normalizeId).filter(Boolean)
          : []
      if (current && current.status === 'cloud_pending' && requiredCloudParents.length > 1) {
        const patchRecord = recordOf(patch)
        const reviewerId = normalizeId(patchRecord.reviewerId || patchRecord.cloudParentPawId)
        const approvals = Array.from(
          new Set([
            ...(Array.isArray(current.cloudParentApprovals) ? current.cloudParentApprovals : []),
            ...(reviewerId ? [reviewerId] : []),
          ]),
        )
        const nextStatusValue = requiredCloudParents.every((parentId) =>
          approvals.includes(parentId),
        )
          ? 'pending'
          : 'cloud_pending'
        const updated = updateAdoption(applicationId, {
          ...patchRecord,
          cloudParentApprovals: approvals,
          status: nextStatusValue,
        })
        return updated ? ok(updated) : fail('UPDATE_FAILED', '审核状态更新失败')
      }
    }
    const record =
      applicationType === APPLICATION_TYPE.rescue
        ? transitionRescueApplication(applicationId, nextStatus, patch)
        : transitionAdoption(applicationId, nextStatus, patch)
    return record ? ok(record) : fail('INVALID_TRANSITION', '当前状态不能执行该操作')
  } catch {
    return fail('STORAGE_WRITE_FAILED', '审批单状态保存失败')
  }
}

/**
 * 超级测试员状态切换：允许在本地 mock 中直接切换到指定演示节点，
 * 不绕过正式页面操作，也不改变生产状态机的合法转换规则。
 */
export function setAdoptionTestState(id: string, testState: string): ApiResult<AdoptionRecord> {
  const state = normalizeId(testState)
  const statePatches: Record<string, ApplicationPatches['adoption']> = {
    [ADOPTION_TEST_STATES.cloudPending]: {
      status: 'cloud_pending',
      cloudParentRequired: true,
      rejectNote: '',
      failureStage: '',
      rejectedAt: null,
    },
    [ADOPTION_TEST_STATES.cloudRejected]: {
      status: 'rejected',
      cloudParentRequired: true,
      failureStage: 'cloud_parent',
      rejectNote: '云家长拒绝了本次领养申请，流程已结束。',
      rejectedAt: Date.now(),
    },
    [ADOPTION_TEST_STATES.ownerPending]: {
      status: 'pending',
      cloudParentRequired: false,
      rejectNote: '',
      failureStage: '',
      rejectedAt: null,
    },
    [ADOPTION_TEST_STATES.ownerRejected]: {
      status: 'rejected',
      cloudParentRequired: false,
      failureStage: 'owner_review',
      rejectNote: '院主拒绝了本次领养申请，流程已结束。',
      rejectedAt: Date.now(),
    },
    [ADOPTION_TEST_STATES.ownerApproved]: {
      status: 'pickup',
      cloudParentRequired: false,
      rejectNote: '',
      failureStage: '',
      rejectedAt: null,
      approvedAt: Date.now(),
      approvedBy: 'owner',
    },
  }
  const statePatch = statePatches[state]
  if (!statePatch) return fail('UNKNOWN_TEST_STATE', '未知的超级测试员状态')
  return updateApplication('adoption', id, statePatch)
}

export function submitAdoptionEvidence(
  id: string,
  payload: AdoptionEvidenceInput = {},
  options: ActorOptions = {},
): ApiResult<AdoptionRecord> {
  const current = getAdoptionById(normalizeId(id), { includeDemo: false })
  if (!current) return fail('NOT_FOUND', '领养单不存在')
  const authorization = authorizeApplicant(current, options)
  if (authorization.error) return authorization.error
  const evidencePayload = payload
  return advanceApplication(
    'adoption',
    id,
    'owner_confirm_pending',
    {
      proofPhotos: Array.isArray(evidencePayload.photos) ? evidencePayload.photos.slice(0, 2) : [],
      confirmStory: String(evidencePayload.story || '').trim(),
      proofSubmittedAt: Date.now(),
    },
    options,
  )
}

export function approveRescueApplication(
  id: string,
  patch: ApplicationPatches['rescue'] = {},
): ApiResult<RescueRecord> {
  return advanceApplication('rescue', id, 'platform_approved', patch)
}

export function rejectRescueApplication(
  id: string,
  patch: ApplicationPatches['rescue'] = {},
): ApiResult<RescueRecord> {
  return advanceApplication('rescue', id, 'platform_rejected', {
    ...recordOf(patch),
    rejectedAt: Date.now(),
  })
}

/**
 * 重新审批扩展口。当前按产品约定关闭，不会把任意失败单偷偷推进回流程。
 */
export function reopenApplication<T extends ApplicationType>(
  type: T,
  id: string,
  patch?: ApplicationPatches[NoInfer<T>],
): ApiResult<ApplicationRecords[T]>
export function reopenApplication(
  type: unknown,
  id: unknown,
  patch: unknown = {},
): ApiResult<ApplicationRecord> {
  const applicationType = normalizeType(type)
  if (!applicationType) return invalidType()
  if (applicationType !== APPLICATION_TYPE.adoption || !ADOPTION_REAPPROVAL_ENABLED) {
    return fail('REAPPROVAL_NOT_ENABLED', '重新审批能力暂未开放')
  }
  let record
  try {
    record = reopenAdoption(id, patch)
  } catch {
    return fail('STORAGE_WRITE_FAILED', '审批单保存失败')
  }
  return record ? ok(record) : fail('REAPPROVAL_NOT_ALLOWED', '当前审批单不支持重新审批')
}

export function listApplications<T extends ApplicationType>(
  type: T,
  options?: ActorOptions,
): ApiResult<ApplicationRecords[T][]>
export function listApplications(
  type: unknown,
  options: ActorOptions = {},
): ApiResult<ApplicationRecord[]> {
  const applicationType = normalizeType(type)
  if (!applicationType) return invalidType()
  let records
  try {
    records =
      applicationType === APPLICATION_TYPE.rescue
        ? getRescueRecords(options)
        : getAdoptionRecords(options)
  } catch {
    return fail('STORAGE_READ_FAILED', '审批单列表读取失败')
  }
  return ok(records)
}
