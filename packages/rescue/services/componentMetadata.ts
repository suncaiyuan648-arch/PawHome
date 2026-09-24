import { RESCUE_APPLICATION_STATUS_META } from '../../../utils/rescueStorage.ts'
import type { RescueAnimal, RescueRecord, RescueReceiver } from '../../../utils/rescueStorage.ts'
import type { RescueStateProjection } from '../../../services/domainReads/rescue/stateContract.ts'
import { buildRoute } from '../../../navigation/routeContracts.ts'
import { decodeWeixinLoadOptions } from '../../../navigation/weixinLoadOptions.ts'

export type RescueLoadState =
  'idle' | 'loading' | 'ready' | 'missing-id' | 'invalid-params' | 'not-found'

export type RescueRecordRouteName =
  'rescue.detail' | 'rescue.proof.list' | 'rescue.proof.create' | 'rescue.progress'

export interface RescueRecordPageState {
  rescueId: string
  record: RescueRecord | null
  loadState: RescueLoadState
}

export interface RescueProgressRecordSnapshot extends Record<string, unknown> {
  id: string
  rescueId: string
  applicationType: 'rescue'
  applicationStatus?: string
  ownerAvatar?: string
  ownerName?: string
  ownerLevel?: number
  createdLabel?: string
  helpType?: string
  amount?: number
  views?: number
  description?: string
  detail?: string
  mediaPaths?: string[]
  receiver?: Pick<RescueReceiver, 'name'>
  animals?: RescueAnimal[]
}

export interface RescueApplicantProgressRecord extends RescueProgressRecordSnapshot {
  applicationStatus: string
  rescueState: RescueStateProjection
}

export interface RescueProgressPageState {
  rescueId: string
  record: RescueApplicantProgressRecord | null
  loadState: RescueLoadState
}

export type RescueRouteResolution =
  { ok: true; rescueId: string } | { ok: false; loadState: 'missing-id' | 'invalid-params' }

export interface RescueFundListState {
  rescueItems: RescueRecord[]
  activeStatus: string
}

export interface RescueProofFormState {
  name: string
  relation: string
  note: string
  idNo: string
  agreementChecked: boolean
  submitting: boolean
}

export interface RescueApplicationStatusPresentation {
  text: string
  tone: string
}

export interface RescueProofSubmissionPayload {
  duplicate: boolean
  record: RescueRecord
}

export interface RescueResultPageState {
  rescueId: string
}

export type RescueDetailNavigationTarget =
  | { routeName: 'rescue.proof.list' | 'rescue.proof.create'; params: { rescueId: string } }
  | { routeName: 'rescue.review.detail'; params: { reviewItemId: string; businessType: 'rescue' } }

export function createRescueFundListState(): RescueFundListState {
  return { rescueItems: [], activeStatus: 'pending' }
}

export function createRescueRecordPageState(): RescueRecordPageState {
  return { rescueId: '', record: null, loadState: 'idle' }
}

export function createRescueProgressPageState(): RescueProgressPageState {
  return { rescueId: '', record: null, loadState: 'idle' }
}

export function createRescueResultPageState(): RescueResultPageState {
  return { rescueId: '' }
}

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function resolveRescueRecordRoute(
  options: unknown,
  routeName: RescueRecordRouteName,
): RescueRouteResolution {
  if (!isUnknownRecord(options) || !options.rescueId) return { ok: false, loadState: 'missing-id' }
  if (typeof options.rescueId !== 'string') return { ok: false, loadState: 'invalid-params' }
  try {
    buildRoute(routeName, options)
    return { ok: true, rescueId: options.rescueId }
  } catch {
    return { ok: false, loadState: 'invalid-params' }
  }
}

export function resolveRescueRecordLoadRoute(
  options: unknown,
  routeName: RescueRecordRouteName,
): RescueRouteResolution {
  let params: unknown = options
  try {
    // #ifdef MP-WEIXIN
    params = decodeWeixinLoadOptions(options)
    // #endif
  } catch {
    return { ok: false, loadState: 'invalid-params' }
  }
  return resolveRescueRecordRoute(params, routeName)
}

export function rescueResultIdFromOptions(options: unknown): string {
  if (!isUnknownRecord(options)) return ''
  try {
    return String(options.rescueId || '').trim()
  } catch {
    return ''
  }
}

export function createRescueProofFormState(): RescueProofFormState {
  return {
    name: '',
    relation: '',
    note: '',
    idNo: '',
    agreementChecked: false,
    submitting: false,
  }
}

export function getRescueApplicationStatusPresentation(
  status: string | undefined,
): RescueApplicationStatusPresentation | null {
  if (
    typeof status !== 'string' ||
    !Object.prototype.hasOwnProperty.call(RESCUE_APPLICATION_STATUS_META, status)
  ) {
    return null
  }
  const metadata = RESCUE_APPLICATION_STATUS_META[status]
  return metadata ? { text: metadata.text, tone: metadata.tone } : null
}
