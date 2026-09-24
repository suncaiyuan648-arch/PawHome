import type { AdoptionApplicationSnapshot } from '../../../contracts/adoptionProjection.ts'
import type { AdoptionCloudParentPolicy } from '../../../contracts/adoptionCondition.ts'
import type { AdoptionRecord } from '../../../contracts/applications.ts'
import {
  ADOPTION_STATUS_META,
  canTransitionAdoption,
  transitionAdoption,
} from '@/utils/adoptionStorage.ts'
import { readAdoptionApplication } from './applicationAdapter.ts'

type ActorProvider = () => unknown
export interface AdoptionProgressStatusSource {
  status: string
}
export type AdoptionProgressOptions = {
  actorProvider?: ActorProvider
  perspective?: 'applicant' | 'owner' | 'cloud_parent'
  cloudParentPolicy?: AdoptionCloudParentPolicy
}
type ProgressOptions = AdoptionProgressOptions
type ProgressData = AdoptionApplicationSnapshot | AdoptionRecord
type ProgressError = { code: string; message: string }
type ProgressReadResult = {
  success: boolean
  data: ProgressData | null
  error: ProgressError | null
}
type ProgressMeta = { step: number; percent: string }
export type AdoptionProgressStatusPresentation = {
  status: string
  label: string
  tone: string
  progress: ProgressMeta | null
  isRejected: boolean
  isTerminal: boolean
  canConfirm: boolean
  canClaimReward: boolean
}

export const ADOPTION_PROGRESS_VIEWS: readonly string[] = Object.freeze([
  'adoption-info',
  'application',
])

const STATUS_COPY: Readonly<Record<string, string>> = Object.freeze({
  cloud_pending: '等待云家长审核中……',
  cloud_rejected: '云家长拒绝了领养申请',
  pending: '等待院主审核中……',
  rejected: '已拒绝领养申请',
  pickup: '院主已同意，待你前往领养',
  owner_confirm: '你已提交领养确认，等待院主确认',
  owner_confirm_pending: '你已提交领养确认，等待院主确认',
  jury_confirm: '院主确认成功，待评审团确认',
  jury_confirm_pending: '院主确认成功，待评审团确认',
  adoption_confirmed: '领养确认成功',
  reward: '恭喜您！获得领养礼物！',
  reward_done: '奖励已领取',
  abandoned: '已放弃领养',
})

const PROGRESS_STATUSES: Readonly<Record<string, ProgressMeta>> = Object.freeze({
  owner_confirm: { step: 2, percent: '33%' },
  owner_confirm_pending: { step: 2, percent: '33%' },
  jury_confirm: { step: 3, percent: '66%' },
  jury_confirm_pending: { step: 3, percent: '66%' },
  adoption_confirmed: { step: 4, percent: '100%' },
  reward: { step: 4, percent: '100%' },
  reward_done: { step: 4, percent: '100%' },
})

function normalizeId(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim()
}

function failed(code: string, message: string): ProgressReadResult {
  return { success: false, data: null, error: { code, message } }
}

/**
 * The progress page is applicant-private.  The provider is deliberately
 * resolved at call time so a session switch cannot reuse a previous actor.
 */
export function createAdoptionSessionProvider(): ActorProvider {
  return (): unknown => {
    if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') return null
    try {
      return uni.getStorageSync('PAWHOME_ACTOR_SESSION') || null
    } catch {
      return null
    }
  }
}

function progressOptions(options: ProgressOptions | ActorProvider): ProgressOptions {
  if (typeof options === 'function') return { actorProvider: options }
  return options && typeof options === 'object' ? options : {}
}

/**
 * Read one applicant-owned adoption record.  Demo records are deliberately
 * excluded: a missing or stale deep link must render an empty state rather
 * than another applicant's application.
 */
export function readAdoptionProgress(
  applicationId: string,
  options: ProgressOptions | ActorProvider = {},
): ProgressReadResult {
  const id = normalizeId(applicationId)
  if (!id) return failed('MISSING_ID', '缺少领养单 ID')

  const source = progressOptions(options)
  const result = readAdoptionApplication(id, {
    actorProvider: source.actorProvider || createAdoptionSessionProvider(),
    perspective: source.perspective || 'applicant',
    ...(source.cloudParentPolicy === undefined
      ? {}
      : { cloudParentPolicy: source.cloudParentPolicy }),
  })
  return result
}

export function normalizeProgressView(view: unknown): string {
  const value = normalizeId(view)
  return ADOPTION_PROGRESS_VIEWS.includes(value) ? value : ''
}

export function statusPresentation(
  record: AdoptionProgressStatusSource | null | undefined,
): AdoptionProgressStatusPresentation {
  const status = normalizeId(record?.status)
  const meta = ADOPTION_STATUS_META[status] || { text: '领养申请处理中', tone: 'grey', dot: false }
  const progress = PROGRESS_STATUSES[status] || null
  return {
    status,
    label: STATUS_COPY[status] || meta.text,
    tone: meta.tone,
    progress,
    isRejected: status === 'rejected' || status === 'cloud_rejected',
    isTerminal:
      status === 'rejected' ||
      status === 'cloud_rejected' ||
      status === 'abandoned' ||
      status === 'reward_done',
    canConfirm: status === 'pickup',
    canClaimReward: status === 'adoption_confirmed' || status === 'reward',
  }
}

/**
 * The reward entry is a legal state transition, kept behind this single
 * domain adapter so the page never writes adoption storage directly.
 */
export function beginReward(
  applicationId: string,
  options: ProgressOptions | ActorProvider = {},
): ProgressReadResult {
  const id = normalizeId(applicationId)
  if (!id) return failed('MISSING_ID', '缺少领养单 ID')

  const source = progressOptions(options)
  const current = readAdoptionProgress(id, {
    ...source,
    perspective: 'applicant',
  })
  if (!current.success) return current
  if (
    !current.data ||
    !('perspective' in current.data) ||
    current.data.perspective !== 'applicant'
  ) {
    return failed('FORBIDDEN', '当前账号不是这条领养申请的申请人')
  }
  if (current.data.status === 'reward') return current
  if (
    current.data.status !== 'adoption_confirmed' ||
    !canTransitionAdoption(current.data.status, 'reward')
  ) {
    return failed('INVALID_STAGE', '当前领养单尚未达到奖励领取阶段')
  }

  try {
    const record = transitionAdoption(id, 'reward', { rewardStartedAt: Date.now() })
    return record
      ? { success: true, data: record, error: null }
      : failed('INVALID_TRANSITION', '领养单状态无法进入奖励阶段')
  } catch {
    return failed('STORAGE_WRITE_FAILED', '领养申请更新失败')
  }
}
