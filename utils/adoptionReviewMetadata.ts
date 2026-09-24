import type {
  getAdoptionReviewDetail,
  getAdoptionReviewList,
} from '../navigation/adoptionReviewContract.ts'
import type { AdoptionRecord } from './adoptionStorage.ts'
import {
  createAdoptionReviewFallbackPetMocks,
  type AdoptionPetMetadata,
} from './adoptionMockData.ts'

type JsonRecord = Record<string, unknown>

export type AdoptionReviewDetailAccess = ReturnType<typeof getAdoptionReviewDetail>
export type AdoptionReviewSourceItem = ReturnType<typeof getAdoptionReviewList>['items'][number]
export type AdoptionReviewTab = 'pending' | 'reviewed'
export type AdoptionReviewReviewerRole = 'all' | 'owner' | 'cloud_parent' | 'reviewer'
export type AdoptionReviewActionMode = 'cloudReview' | 'ownerReview' | 'ownerConfirm'
export type AdoptionReviewResultVariant = '81' | '82' | '83'

export interface AdoptionReviewApplicantMetadata {
  id?: string
  pawId?: string
}

export interface AdoptionReviewRejectorMetadata {
  name: string
  avatar: string
  level: number
  role: string
}

export interface AdoptionReviewRecordMetadata {
  id: string
  recordId: string
  applicationId: string
  status: string
  failureStage: string
  cloudParentPawId: string
  cloudParentId: string
  cloudOwnerId: string
  cloudParentIds: string[]
  cloudParentApprovals: string[]
  ownerPawId: string
  yardId: string
  yardName: string
  ownerName: string
  yardTag: string
  ownerAvatar: string
  location: string
  ownerNick: string
  ownerMessage: string
  applicantId: string
  applicantUserId: string
  applicant: AdoptionReviewApplicantMetadata | null
  applicantName: string
  applicantAvatar: string
  applicantLevel: number
  applyText: string
  mediaPaths: string[]
  proofPhotos: string[]
  proofDate: string
  confirmStory: string
  pets: AdoptionPetMetadata[]
  rejectNote: string
  rejector: AdoptionReviewRejectorMetadata
}

export type AdoptionReviewStatusTone = 'danger' | 'success' | 'neutral'

export interface AdoptionReviewQueueCardMetadata {
  id: string
  recordId: string
  applicationId: string
  reviewItemId: string
  reviewerRole?: 'owner' | 'cloud_parent' | 'reviewer'
  reviewerId?: string
  statusText: string
  statusTone: AdoptionReviewStatusTone
  detailMode: AdoptionReviewActionMode
  applicant: {
    name: string
    avatar: string
    level: number
  }
  pets: AdoptionPetMetadata[]
  cloudApproval: {
    required: number
    approved: number
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function numeric(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value)))
    return Number(value)
  return fallback
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
}

function applicantMetadata(value: unknown): AdoptionReviewApplicantMetadata | null {
  if (!isRecord(value)) return null
  const id = text(value.id)
  const pawId = text(value.pawId)
  if (!id && !pawId) return null
  return { ...(id ? { id } : {}), ...(pawId ? { pawId } : {}) }
}

function petMetadata(value: unknown): AdoptionPetMetadata | null {
  if (!isRecord(value)) return null
  const id = text(value.id, text(value.petId))
  const name = text(value.name)
  const avatar = text(value.avatar)
  if (!id || !name || !avatar) return null
  return { ...value, id, name, avatar }
}

function petsMetadata(value: unknown): AdoptionPetMetadata[] {
  if (!Array.isArray(value)) return []
  return value.map(petMetadata).filter((pet): pet is AdoptionPetMetadata => pet !== null)
}

/** Narrow the persisted adoption record to the fields used by the review UI. */
export function normalizeAdoptionReviewRecord(value: unknown): AdoptionReviewRecordMetadata | null {
  if (!isRecord(value)) return null
  const id = text(value.applicationId, text(value.id, text(value.recordId)))
  if (!id) return null
  const rejector = isRecord(value.rejector) ? value.rejector : {}
  return {
    id: text(value.id, id),
    recordId: text(value.recordId, id),
    applicationId: text(value.applicationId, id),
    status: text(value.status, 'pending'),
    failureStage: text(value.failureStage),
    cloudParentPawId: text(value.cloudParentPawId),
    cloudParentId: text(value.cloudParentId),
    cloudOwnerId: text(value.cloudOwnerId),
    cloudParentIds: stringList(value.cloudParentIds),
    cloudParentApprovals: stringList(value.cloudParentApprovals),
    ownerPawId: text(value.ownerPawId),
    yardId: text(value.yardId, '1'),
    yardName: text(value.yardName, text(value.ownerName, '小院')),
    ownerName: text(value.ownerName, text(value.yardName, '院主')),
    yardTag: text(value.yardTag, '小院'),
    ownerAvatar: text(value.ownerAvatar, '/static/figma/home/yard-avatar.png'),
    location: text(value.location),
    ownerNick: text(value.ownerNick),
    ownerMessage: text(value.ownerMessage),
    applicantId: text(value.applicantId),
    applicantUserId: text(value.applicantUserId),
    applicant: applicantMetadata(value.applicant),
    applicantName: text(value.applicantName, '逢猫'),
    applicantAvatar: text(value.applicantAvatar, '/static/figma/home/feed-avatar.png'),
    applicantLevel: numeric(value.applicantLevel, 1),
    applyText: text(value.applyText),
    mediaPaths: stringList(value.mediaPaths),
    proofPhotos: stringList(value.proofPhotos),
    proofDate: text(value.proofDate),
    confirmStory: text(value.confirmStory),
    pets: petsMetadata(value.pets),
    rejectNote: text(value.rejectNote),
    rejector: {
      name: text(rejector.name, '院主'),
      avatar: text(rejector.avatar, '/static/figma/home/yard-avatar.png'),
      level: numeric(rejector.level, 1),
      role: text(rejector.role, '院主'),
    },
  }
}

/** Index persisted records by their canonical and compatibility identifiers. */
export function createAdoptionReviewRecordIndex(
  records: readonly AdoptionRecord[],
): ReadonlyMap<string, AdoptionReviewRecordMetadata> {
  const index = new Map<string, AdoptionReviewRecordMetadata>()
  for (const source of records) {
    const record = normalizeAdoptionReviewRecord(source)
    if (!record) continue
    for (const id of new Set([record.applicationId, record.id, record.recordId])) {
      if (id && !index.has(id)) index.set(id, record)
    }
  }
  return index
}

/** Convert an authorized review item and its persisted record into the shared card contract. */
export function createAdoptionReviewQueueCard(
  item: AdoptionReviewSourceItem,
  record: AdoptionReviewRecordMetadata | null,
): AdoptionReviewQueueCardMetadata {
  let statusText: string
  let statusTone: AdoptionReviewStatusTone
  if (item.reviewStatus === 'rejected') {
    statusText = '已拒绝'
    statusTone = 'danger'
  } else if (item.reviewStatus === 'approved') {
    statusText = '已通过'
    statusTone = 'success'
  } else {
    statusText =
      item.phase === 'cloud_parent'
        ? '待云家长审批'
        : item.phase === 'owner_confirmation'
          ? '待院主确认'
          : item.phase === 'jury'
            ? '待评审团确认'
            : '待院主审批'
    statusTone = 'neutral'
  }
  const pets = record?.pets ?? []
  return {
    id: item.applicationId,
    recordId: item.applicationId,
    applicationId: item.applicationId,
    reviewItemId: item.reviewItemId,
    reviewerRole: item.reviewerRole,
    reviewerId: item.reviewerId,
    statusText,
    statusTone,
    detailMode:
      item.phase === 'cloud_parent'
        ? 'cloudReview'
        : item.phase === 'owner_confirmation'
          ? 'ownerConfirm'
          : 'ownerReview',
    applicant: {
      name: record?.applicantName || item.applicantId || '申请人',
      avatar: record?.applicantAvatar || '/static/figma/home/feed-avatar.png',
      level: record?.applicantLevel || 1,
    },
    pets: pets.map((pet) => ({ ...pet })),
    cloudApproval: {
      required: record?.cloudParentIds.length ?? 0,
      approved: record?.cloudParentApprovals.length ?? 0,
    },
  }
}

export function createAdoptionReviewFallbackPets(): AdoptionPetMetadata[] {
  return createAdoptionReviewFallbackPetMocks()
}
