/**
 * Presentation mapping for account.tasks.
 *
 * This module deliberately does not build URLs or infer a destination from a
 * task's status. The task summary remains the only stable business identity;
 * a destination is supplied later by an active, domain-owned route resolver.
 */

import {
  ACCOUNT_TASK_ACTION_TYPES,
  ACCOUNT_TASK_ACTOR_ROLES,
  ACCOUNT_TASK_BUSINESS_TYPES,
  ACCOUNT_TASK_STATUSES,
  type AccountTaskActionType,
  type AccountTaskActorRole,
  type AccountTaskBusinessType,
  type AccountTaskStatus,
  type AccountTaskSummary,
} from './accountTaskContracts.ts'

export interface TaskCardModel extends AccountTaskSummary {
  businessLabel: string
  actionLabel: string
  statusLabel: string
}

interface TaskDetailConfig {
  routeName: string
  businessIdParam: string
}

interface TaskDetailTarget {
  routeName: string
  businessIdParam?: string | null
  params: Readonly<Record<string, string>>
}

const BUSINESS_LABELS: Readonly<Record<string, string>> = Object.freeze({
  adoption: '领养',
  rescue: '救助',
  feeding: '投喂',
  dynamic: '动态',
})

const ACTION_LABELS: Readonly<Record<string, string>> = Object.freeze({
  apply: '申请处理',
  confirm: '确认信息',
  review: '审核处理',
  supply_material: '补充资料',
  claim_reward: '领取权益',
  proof: '提交证实',
  fund: '救助资金',
  order: '订单处理',
  fulfill: '履约处理',
  complete: '完成订单',
  feedback: '提交反馈',
  publish: '发布动态',
  comment: '处理评论',
  moderate: '内容审核',
})

const STATUS_LABELS: Readonly<Record<string, string>> = Object.freeze({
  pending: '待处理',
  in_progress: '进行中',
  processed: '已处理',
  completed: '已完成',
  failed: '未通过',
  cancelled: '已取消',
  expired: '已失效',
})

const TASK_DETAIL_TARGETS: Readonly<Record<string, Readonly<Record<string, TaskDetailConfig>>>> =
  Object.freeze({
    adoption: Object.freeze({
      apply: Object.freeze({ routeName: 'adoption.progress', businessIdParam: 'applicationId' }),
      confirm: Object.freeze({ routeName: 'adoption.progress', businessIdParam: 'applicationId' }),
      claim_reward: Object.freeze({
        routeName: 'adoption.progress',
        businessIdParam: 'applicationId',
      }),
    }),
    rescue: Object.freeze({
      apply: Object.freeze({ routeName: 'rescue.progress', businessIdParam: 'rescueId' }),
      fund: Object.freeze({ routeName: 'rescue.progress', businessIdParam: 'rescueId' }),
    }),
    feeding: Object.freeze({
      feedback: Object.freeze({ routeName: 'feeding.order.detail', businessIdParam: 'orderId' }),
      fulfill: Object.freeze({ routeName: 'feeding.order.detail', businessIdParam: 'orderId' }),
      order: Object.freeze({ routeName: 'feeding.order.detail', businessIdParam: 'orderId' }),
      complete: Object.freeze({ routeName: 'feeding.order.detail', businessIdParam: 'orderId' }),
    }),
    dynamic: Object.freeze({
      publish: Object.freeze({ routeName: 'dynamic.detail', businessIdParam: 'dynamicId' }),
      comment: Object.freeze({ routeName: 'dynamic.detail', businessIdParam: 'dynamicId' }),
      moderate: Object.freeze({ routeName: 'dynamic.detail', businessIdParam: 'dynamicId' }),
    }),
  })

const REVIEW_ROLES: Readonly<Record<'adoption' | 'rescue', readonly AccountTaskActorRole[]>> =
  Object.freeze({
    adoption: Object.freeze(['owner', 'cloud_parent', 'reviewer'] as const),
    rescue: Object.freeze(['reviewer'] as const),
  })

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function includesValue<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && values.some((candidate) => candidate === value)
}

function label<T extends string>(
  map: Readonly<Record<T, string>>,
  value: T,
  fallback: string,
): string {
  return map[value] || fallback
}

function isTaskSummary(value: unknown): value is AccountTaskSummary {
  return (
    isRecord(value) &&
    typeof value.taskId === 'string' &&
    Boolean(value.taskId.trim()) &&
    includesValue(ACCOUNT_TASK_BUSINESS_TYPES, value.businessType) &&
    typeof value.businessId === 'string' &&
    Boolean(value.businessId.trim()) &&
    typeof value.actorId === 'string' &&
    Boolean(value.actorId.trim()) &&
    includesValue(ACCOUNT_TASK_ACTOR_ROLES, value.actorRole) &&
    includesValue(ACCOUNT_TASK_ACTION_TYPES, value.actionType) &&
    includesValue(ACCOUNT_TASK_STATUSES, value.status) &&
    (value.reviewItemId === undefined || typeof value.reviewItemId === 'string')
  )
}

function reviewRolesFor(value: AccountTaskBusinessType): readonly AccountTaskActorRole[] {
  return value === 'adoption' || value === 'rescue' ? REVIEW_ROLES[value] : []
}

export function taskBusinessLabel(value: AccountTaskBusinessType): string {
  return label(BUSINESS_LABELS, value, '业务任务')
}

export function taskActionLabel(value: AccountTaskActionType): string {
  return label(ACTION_LABELS, value, '待处理事项')
}

export function taskStatusLabel(value: AccountTaskStatus): string {
  return label(STATUS_LABELS, value, '状态未知')
}

export function taskCardModel(task: AccountTaskSummary): Readonly<TaskCardModel> | null {
  if (!isTaskSummary(task)) return null
  return Object.freeze({
    taskId: task.taskId,
    businessType: task.businessType,
    businessId: task.businessId,
    actorId: task.actorId,
    actorRole: task.actorRole,
    actionType: task.actionType,
    status: task.status,
    reviewItemId: task.reviewItemId,
    businessLabel: taskBusinessLabel(task.businessType),
    actionLabel: taskActionLabel(task.actionType),
    statusLabel: taskStatusLabel(task.status),
  })
}

function isTaskCard(value: Readonly<TaskCardModel> | null): value is Readonly<TaskCardModel> {
  return value !== null
}

export function taskCards(
  items: readonly AccountTaskSummary[],
): readonly Readonly<TaskCardModel>[] {
  if (!Array.isArray(items)) return Object.freeze([])
  return Object.freeze(items.filter(isTaskSummary).map(taskCardModel).filter(isTaskCard))
}

/**
 * Return only a route target that has an actual registered page and a
 * contract-owned business ID or review-item/domain pair. Review tasks never
 * fall back to a business progress page. Adoption owner/cloud-parent reviews
 * land on the persisted application review page, while jury reviews use the
 * public jury page; rescue reviews use their rescue review page.
 */
export function taskDetailTarget(task: AccountTaskSummary): Readonly<TaskDetailTarget> | null {
  if (!isTaskSummary(task)) return null

  // Review tasks have no safe business-detail fallback. Their stable landing
  // identity is the review item plus its explicit domain. Owner/cloud-parent
  // adoption reviews also need the application ID because that page reads the
  // persisted application/review pair; jury and rescue review pages use the
  // review item plus domain. Applicant role labels are deliberately not
  // accepted as review authority.
  if (task.actionType === 'review') {
    const reviewItemId = typeof task.reviewItemId === 'string' ? task.reviewItemId : ''
    const allowedRoles = reviewRolesFor(task.businessType)
    const actorRoleIsValid =
      task.actorRole === undefined ||
      (typeof task.actorRole === 'string' && allowedRoles.includes(task.actorRole))
    if (!reviewItemId || !actorRoleIsValid) return null
    if (
      task.businessType === 'adoption' &&
      (task.actorRole === 'owner' || task.actorRole === 'cloud_parent')
    ) {
      if (typeof task.businessId !== 'string' || !task.businessId) return null
      return Object.freeze({
        routeName: 'adoption.review.detail',
        businessIdParam: 'applicationId',
        params: Object.freeze({ applicationId: task.businessId, reviewItemId }),
      })
    }
    const routeName =
      task.businessType === 'adoption'
        ? 'adoption.jury.detail'
        : task.businessType === 'rescue'
          ? 'rescue.review.detail'
          : ''
    if (!routeName) return null
    return Object.freeze({
      routeName,
      businessIdParam: null,
      params: Object.freeze({ reviewItemId, businessType: String(task.businessType) }),
    })
  }

  const domain = typeof task.businessType === 'string' ? task.businessType : ''
  const action = typeof task.actionType === 'string' ? task.actionType : ''
  const target = TASK_DETAIL_TARGETS[domain]?.[action]
  if (!target || typeof task.businessId !== 'string' || !task.businessId) return null
  return Object.freeze({
    ...target,
    params: Object.freeze({ [target.businessIdParam]: task.businessId }),
  })
}

/**
 * Task actions always return to this read-only aggregate after a successful
 * domain action. The target is kept separate from the detail route so the
 * stable review deep-link query remains exactly reviewItemId + businessType.
 */
export function taskAfterActionTarget(): Readonly<TaskDetailTarget> {
  return Object.freeze({ routeName: 'account.tasks', params: Object.freeze({}) })
}
