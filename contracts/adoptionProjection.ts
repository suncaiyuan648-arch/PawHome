import type { AdoptionStatus, AdoptionReapproval, StoredTimestamp } from './applications.ts'
import { definedFields, mediaPaths, timestamp } from './applicationParsing.ts'

export type AdoptionProjectionCondition = {
  count: number; required: boolean
  decision: 'unknown' | 'approved' | 'rejected' | 'pending' | 'skip' | 'decision_required' | 'bypass_terminal'
  canProceed: boolean; decisionRequired: boolean; reason: string
  selection?: 'any' | 'all' | 'specific'
  reviews: readonly { id: string; state: string }[]
}
export type AdoptionApplicationSnapshot = {
  id: string; recordId: string; applicationId: string; applicationType: 'adoption'
  status: AdoptionStatus
  perspective: 'applicant' | 'owner' | 'cloud_parent'
  condition: AdoptionProjectionCondition | null
  pets?: Array<{ id?: string | number; petId?: string | number; name?: string | number; avatar?: string | number }>
  applicantLevel?: number
  mediaPaths?: string[]; proofPhotos?: string[]
  createdAt?: StoredTimestamp | null; updatedAt?: StoredTimestamp | null; rejectedAt?: StoredTimestamp | null
  reapproval?: AdoptionReapproval
  applicationStatus?: string
  yardId?: string
  yardName?: string
  yardTag?: string
  ownerName?: string
  ownerAvatar?: string
  summary?: string
  applicantId?: string
  applicantUserId?: string
  applicantName?: string
  applicantAvatar?: string
  applyText?: string
  description?: string
  location?: string
  locationAddress?: string
  distance?: string
  ownerNick?: string
  ownerMessage?: string
  rejectNote?: string
  failureStage?: string
  confirmStory?: string
  proofDate?: string
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value : typeof value === 'number' && Number.isFinite(value) ? String(value) : undefined
}
function scalar(value: unknown): string | number | undefined {
  return typeof value === 'string' || typeof value === 'number' ? value : undefined
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** Project only after authorization. Keep applicant fields out of other perspectives. */
export function projectAdoptionFields(record: Record<string, unknown>, applicant: boolean) {
  const publicFields = definedFields({
    applicationStatus: text(record.applicationStatus),
    yardId: text(record.yardId),
    yardName: text(record.yardName),
    yardTag: text(record.yardTag),
    ownerName: text(record.ownerName),
    ownerAvatar: text(record.ownerAvatar),
    summary: text(record.summary),
    createdAt: record.createdAt === undefined ? undefined : timestamp(record.createdAt),
    updatedAt: record.updatedAt === undefined ? undefined : timestamp(record.updatedAt),
    pets: Array.isArray(record.pets) ? record.pets.filter(isRecord).map(pet => definedFields({
      id: scalar(pet.id), petId: scalar(pet.petId), name: scalar(pet.name), avatar: scalar(pet.avatar),
    })) : undefined,
  })
  if (!applicant) return publicFields
  const reapproval = isRecord(record.reapproval) ? record.reapproval : null
  return definedFields({
    ...publicFields,
    applicantId: text(record.applicantId),
    applicantUserId: text(record.applicantUserId),
    applicantName: text(record.applicantName),
    applicantAvatar: text(record.applicantAvatar),
    applyText: text(record.applyText),
    description: text(record.description),
    location: text(record.location),
    locationAddress: text(record.locationAddress),
    distance: text(record.distance),
    ownerNick: text(record.ownerNick),
    ownerMessage: text(record.ownerMessage),
    rejectNote: text(record.rejectNote),
    failureStage: text(record.failureStage),
    confirmStory: text(record.confirmStory),
    proofDate: text(record.proofDate),
    applicantLevel: typeof record.applicantLevel === 'number' ? record.applicantLevel : undefined,
    mediaPaths: record.mediaPaths === undefined ? undefined : mediaPaths(record.mediaPaths),
    proofPhotos: record.proofPhotos === undefined ? undefined : mediaPaths(record.proofPhotos),
    rejectedAt: record.rejectedAt === undefined ? undefined : timestamp(record.rejectedAt),
    reapproval: reapproval ? {
      available: reapproval.available === true,
      count: typeof reapproval.count === 'number' ? reapproval.count : 0,
      lastAt: timestamp(reapproval.lastAt),
    } : undefined,
  })
}
