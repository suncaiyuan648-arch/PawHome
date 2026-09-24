export const ACCOUNT_TASK_BUSINESS_TYPES = ['adoption', 'rescue', 'feeding', 'dynamic'] as const
export const ACCOUNT_TASK_ACTOR_ROLES = [
  'applicant',
  'owner',
  'cloud_parent',
  'reviewer',
  'verifier',
  'donor',
  'recipient',
  'feedback_author',
  'author',
  'commenter',
  'moderator',
] as const
export const ACCOUNT_TASK_ACTION_TYPES = [
  'apply',
  'confirm',
  'review',
  'supply_material',
  'claim_reward',
  'proof',
  'fund',
  'order',
  'fulfill',
  'complete',
  'feedback',
  'publish',
  'comment',
  'moderate',
] as const
export const ACCOUNT_TASK_STATUSES = [
  'pending',
  'in_progress',
  'processed',
  'completed',
  'failed',
  'cancelled',
  'expired',
] as const

export type AccountTaskBusinessType = (typeof ACCOUNT_TASK_BUSINESS_TYPES)[number]
export type AccountTaskActorRole = (typeof ACCOUNT_TASK_ACTOR_ROLES)[number]
export type AccountTaskActionType = (typeof ACCOUNT_TASK_ACTION_TYPES)[number]
export type AccountTaskStatus = (typeof ACCOUNT_TASK_STATUSES)[number]

export interface AccountTaskSummary {
  taskId: string
  businessType: AccountTaskBusinessType
  businessId: string
  actorId: string
  actorRole: AccountTaskActorRole
  actionType: AccountTaskActionType
  status: AccountTaskStatus
  reviewItemId?: string
}
