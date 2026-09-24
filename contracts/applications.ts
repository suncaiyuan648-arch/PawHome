import type { AddressRecord } from './address.ts'
import type { AdoptionPetMetadata } from './adoptionPet.ts'

/** Milliseconds since epoch, or a non-empty legacy date/display string. */
export type StoredTimestamp = number | string
export type AdoptionStatus = 'unknown' | 'cloud_pending' | 'cloud_rejected' | 'pending' | 'rejected' | 'pickup' | 'owner_confirm' | 'owner_confirm_pending' | 'jury_confirm' | 'jury_confirm_pending' | 'adoption_confirmed' | 'reward' | 'reward_done' | 'abandoned'
export type RescueStatus = 'unknown' | 'approved' | 'funding_pending' | 'funding_failed' | 'funding_paid' | 'pending' | 'unpaid' | 'paid' | 'rejected'
export type RescueApplicationStatus = 'unknown' | 'platform_pending' | 'platform_approved' | 'platform_rejected'

export type AdoptionPet = AdoptionPetMetadata

export type AdoptionReapproval = {
	available: boolean
	count: number
	lastAt: StoredTimestamp | null
}

export type AdoptionRejector = {
	name: string
	avatar: string
	level: number
	role: string
}

export type AdoptionRecord = {
	rewardAddress?: AddressRecord
	applicantAvatar?: string
	applicantLevel?: number
	applicantPawId?: string
	reviewHistory?: string[]
	reviewItemId?: string
	review?: {
		reviewItemId?: string
		status?: 'pending' | 'approved' | 'rejected' | 'processed'
		lastAction?: { idempotencyKey: string; outcome: 'approved' | 'rejected'; actorId: string; at: string }
	}

	applicationId?: string
	applicantId?: string
	applicantUserId?: string
	userId?: string
	ownerId?: string
	ownerUserId?: string
	yardOwnerId?: string
	applyText?: string
	location?: string
	locationAddress?: string
	address?: string
	distance?: string
	updatedAt?: StoredTimestamp | null
	rejectedAt?: StoredTimestamp | null
	yardId?: string
	createdAt?: StoredTimestamp | null
	applicant?: { id?: string; pawId?: string; userId?: string; name?: string; avatar?: string }
	proofPhotos?: string[]
	confirmStory?: string
	proofDate?: string
	ownerNick?: string
	ownerMessage?: string
	rejectNote?: string
	failureStage?: string
	approvedAt?: StoredTimestamp | null
	approvedBy?: string
	proofSubmittedAt?: StoredTimestamp | null
	rewardStartedAt?: StoredTimestamp | null
	rewardClaimedAt?: StoredTimestamp | null
	rewardOrderSubmittedAt?: StoredTimestamp | null
	rewardOrderId?: string
	reviewerId?: string

	id: string
	recordId: string
	applicationType: 'adoption'
	status: AdoptionStatus
	cloudParentRequired: boolean
	cloudParentPawId: string
	cloudParentIds: string[]
	cloudParentApprovals: string[]
	reapproval: AdoptionReapproval
	pets: AdoptionPet[]
	mediaPaths: string[]
	yardName: string
	ownerName: string
	yardTag: string
	ownerAvatar: string
	ownerPawId: string
	applicantName: string
	rejector: AdoptionRejector
}

export interface AdoptionCard extends AdoptionRecord {
	statusText: string
	statusTone: string
	statusDot: boolean
}

export type AdoptionReadOptions = {
	includeDemo?: boolean
}

export type AdoptionPick = {
	pets?: AdoptionPet[]
	yardName?: string
	ownerName?: string
	ownerAvatar?: string
	yardId?: string
	ownerPawId?: string
}

export type RescueAnimal = {
	id: string
	yardPetId: string
	name: string
	avatar: string
}

export type RescueApplicant = {
	pawId?: string
	level?: number
	id: string
	name: string
	avatar: string
}

export type RescueReceiver = {
	name: string
	account: string
}

export type RescueApplicantInfoRow = {
	label: string
	value: string
}

export type RescueProof = {
	pawId?: string
	userId?: string
	author?: { pawId?: string }

	id: string
	name: string
	relationship: string
	avatar: string
	media: string[]
	level: number
	story: string
	text: string
	meta: string
	createdAt: string
	likes: number
	liked?: boolean
}

/** Typed command payload accepted when appending a rescue proof to a record. */
export interface RescueProofSubmission {
	readonly id?: string
	readonly name?: string
	readonly relationship?: string
	readonly avatar?: string
	readonly media?: readonly string[]
	readonly level?: number
	readonly story?: string
	readonly text?: string
	readonly meta?: string
	readonly createdAt?: StoredTimestamp
	readonly likes?: number
	readonly pawId?: string
	readonly userId?: string
	readonly author?: { readonly pawId?: string }
	readonly note?: string
	readonly idLast4?: string
	readonly source?: string
	readonly rescueId?: string
}

export type RescueRecord = {
	reviewItemId?: string
	reviewerAuthorized?: boolean
	review?: { reviewItemId?: string }

	applicationId?: string
	applicantId?: string
	applicantUserId?: string
	userId?: string
	ownerId?: string
	ownerUserId?: string
	yardOwnerId?: string
	applyText?: string
	location?: string
	locationAddress?: string
	address?: string
	distance?: string
	updatedAt?: StoredTimestamp | null
	rejectedAt?: StoredTimestamp | null

	id: string
	rescueId: string
	applicationType: 'rescue'
	status: RescueStatus
	statusText: string
	applicationStatus: RescueApplicationStatus
	applicationStatusText: string
	statusTone: string
	applicant: RescueApplicant
	applicantName: string
	amount: number
	receiver: RescueReceiver
	media: string[]
	mediaPaths: string[]
	animals: RescueAnimal[]
	evidenceCount: number
	proofList: RescueProof[]
	evidenceList: RescueProof[]
	description: string
	summary: string
	detail: string
	helpType: string
	views: number
	createdAt: StoredTimestamp
	createdLabel: string
	ownerName: string
	ownerAvatar: string
	ownerPawId: string
	ownerLevel: number
	yardId: string
	yardName: string
	yardAvatar: string
	applicantRows: RescueApplicantInfoRow[]
}

export interface RescueProofMock extends Partial<RescueProof> {
	id: string
	name: string
	relationship: string
	avatar: string
	story: string
	createdAt: string
}

export interface RescueRecordMock extends Omit<Partial<RescueRecord>, 'proofList'> {
	id: string
	status: RescueStatus
	statusText: string
	applicant: RescueApplicant
	amount: number
	receiver: RescueReceiver
	media: string[]
	animals: RescueAnimal[]
	yardId: string
	yardName: string
	yardAvatar: string
	evidenceCount: number
	proofList: RescueProofMock[]
	applicantName: string
	ownerAvatar: string
	description: string
	createdAt: string
	views: number
}

export type RescueReadOptions = {
	includeDemo?: boolean
}

export type RescueReviewSummary = {
	name: string
	balance: string
	note: string
	stats: Array<{ value: string; label: string }>
	statusStats: Array<{ status: RescueStatus; value: number; label: string; tone: string }>
}


export type ApplicationType = 'adoption' | 'rescue'
export type ApplicationRecords = { adoption: AdoptionRecord; rescue: RescueRecord }
export type ApplicationRecord = ApplicationRecords[ApplicationType]
export type AdoptionApplicationInput = Omit<Partial<AdoptionRecord>, 'status'> & { status?: Exclude<AdoptionStatus, 'unknown'> }
export type RescueApplicationInput = Omit<Partial<RescueRecord>, 'animals' | 'status' | 'applicationStatus'> & { status?: Exclude<RescueStatus, 'unknown'>; applicationStatus?: Exclude<RescueApplicationStatus, 'unknown'> } & { animals?: Array<Omit<RescueAnimal, 'yardPetId'> & { yardPetId?: string }> }
export type ApplicationInputs = { adoption: AdoptionApplicationInput; rescue: RescueApplicationInput }
export type ApplicationPatch = Partial<AdoptionRecord> | Partial<RescueRecord>
export type ApiError = { code: string; message: string }
export interface ApiSuccess<T> { success: true; source: 'mock'; data: T; error: null }
export type ApiFailure = { success: false; source: 'mock'; data: null; error: ApiError }
export type ApiResult<T> = ApiSuccess<T> | ApiFailure
export type AdoptionEvidenceInput = { photos?: string[]; story?: string }

export interface ApplicationPatches { adoption: AdoptionApplicationInput; rescue: Omit<RescueApplicationInput, 'animals'> & { animals?: RescueAnimal[] } }
