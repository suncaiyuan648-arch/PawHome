import { buildRoute } from '@/navigation/routeContracts.ts'
import { decodeWeixinLoadOptions } from '@/navigation/weixinLoadOptions.ts'
import {
  createAdoptionSessionProvider,
  type AdoptionProgressStatusPresentation,
} from './progress.ts'

export type AdoptionProgressViewMode = 'progress' | 'adoption-info' | 'application'

export interface AdoptionProgressPetView {
  id: string
  name: string
  avatar: string
}

export interface AdoptionProgressRecordView {
  status: string
  applicantName: string
  pets: AdoptionProgressPetView[]
  mediaPaths: string[]
  proofPhotos: string[]
  applyText: string
  yardName: string
  ownerName: string
  location: string
  locationAddress: string
  address: string
  distance: string
  ownerNick: string
  ownerMessage: string
  ownerAvatar: string
  yardTag: string
  confirmStory: string
  rejectNote: string
}

export interface AdoptionProgressPrimaryAction {
  key: 'confirm-adoption' | 'claim-reward'
  label: string
  qa: string
}

export interface AdoptionProgressPageState {
  applicationId: string
  view: AdoptionProgressViewMode
  record: AdoptionProgressRecordView | null
  loadError: string
  loading: boolean
  actorProvider: () => unknown
}

export type AdoptionProgressRouteResult =
  | { ok: true; applicationId: string; view: AdoptionProgressViewMode }
  | { ok: false; message: string }

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : []
}

function normalizePet(value: unknown, index: number): AdoptionProgressPetView | null {
  if (!isRecord(value)) return null
  const id = text(value.id ?? value.petId) || `pet-${index + 1}`
  return {
    id,
    name: text(value.name ?? value.petName) || '猫咪',
    avatar: text(value.avatar ?? value.avatarUrl ?? value.thumbUrl),
  }
}

export function normalizeAdoptionProgressRecord(value: unknown): AdoptionProgressRecordView | null {
  if (!isRecord(value)) return null
  const pets = Array.isArray(value.pets)
    ? value.pets.map(normalizePet).filter((pet): pet is AdoptionProgressPetView => pet !== null)
    : []
  return {
    status: text(value.status),
    applicantName: text(value.applicantName ?? value.userName),
    pets,
    mediaPaths: stringList(value.mediaPaths ?? value.photos),
    proofPhotos: stringList(value.proofPhotos),
    applyText: text(value.applyText ?? value.reason),
    yardName: text(value.yardName),
    ownerName: text(value.ownerName),
    location: text(value.location ?? value.yardLocation),
    locationAddress: text(value.locationAddress),
    address: text(value.address),
    distance: text(value.distance),
    ownerNick: text(value.ownerNick),
    ownerMessage: text(value.ownerMessage),
    ownerAvatar: text(value.ownerAvatar),
    yardTag: text(value.yardTag),
    confirmStory: text(value.confirmStory),
    rejectNote: text(value.rejectNote),
  }
}

export function createAdoptionProgressPageState(): AdoptionProgressPageState {
  return {
    applicationId: '',
    view: 'progress',
    record: null,
    loadError: '',
    loading: false,
    actorProvider: createAdoptionSessionProvider(),
  }
}

export function resolveAdoptionProgressRoute(options: unknown): AdoptionProgressRouteResult {
  try {
    let params: unknown = options
    // #ifdef MP-WEIXIN
    params = decodeWeixinLoadOptions(options)
    // #endif
    buildRoute('adoption.progress', params)
    if (!isRecord(params)) return { ok: false, message: '领养申请链接无效' }
    const applicationId = text(params.applicationId).trim()
    if (!applicationId) return { ok: false, message: '缺少领养申请 ID' }
    const view =
      params.view === 'adoption-info' || params.view === 'application' ? params.view : 'progress'
    return { ok: true, applicationId, view }
  } catch (error: unknown) {
    const code = isRecord(error) ? error.code : undefined
    return {
      ok: false,
      message: code === 'MISSING_PARAMETER' ? '缺少领养申请 ID' : '领养申请链接无效',
    }
  }
}

export function createAdoptionProgressPrimaryAction(
  presentation: AdoptionProgressStatusPresentation,
  view: AdoptionProgressViewMode,
): AdoptionProgressPrimaryAction | null {
  if (view !== 'progress') return null
  if (presentation.canConfirm) {
    return { key: 'confirm-adoption', label: '确认领养领猫粮', qa: 'qa-adoption-progress-confirm' }
  }
  if (presentation.canClaimReward) {
    return { key: 'claim-reward', label: '开始申请猫粮', qa: 'qa-adoption-progress-claim-reward' }
  }
  return null
}

export function isAdoptionProgressPrimaryAction(
  value: unknown,
): value is AdoptionProgressPrimaryAction {
  return (
    isRecord(value) &&
    (value.key === 'confirm-adoption' || value.key === 'claim-reward') &&
    typeof value.label === 'string' &&
    typeof value.qa === 'string'
  )
}
