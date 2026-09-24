import { definedFields, timestamp, mediaPaths, rescueStatus, rescueApplicationStatus } from '../contracts/applicationParsing.ts'
type JsonRecord = Record<string, unknown>

import type { RescueAnimal, RescueApplicant, RescueReceiver, RescueApplicantInfoRow, RescueProof, RescueProofSubmission, RescueRecord, RescueRecordMock, RescueReadOptions, RescueReviewSummary, RescueStatus, RescueApplicationInput, RescueApplicationStatus } from '../contracts/applications.ts'
export type { RescueAnimal, RescueApplicant, RescueReceiver, RescueApplicantInfoRow, RescueProof, RescueProofSubmission, RescueProofMock, RescueRecord, RescueRecordMock, RescueReadOptions, RescueReviewSummary } from '../contracts/applications.ts'

function isRecord(value: unknown): value is JsonRecord {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function recordOf(value: unknown): JsonRecord {
	return isRecord(value) ? value : {}
}

const KEY = 'PAWHOME_RESCUES'

const DEFAULT_APPLICANT_AVATAR = '/static/figma/home/yard-avatar.png'
const DEFAULT_PET_AVATAR = '/static/figma/pets/pet-orange.png'
const DEFAULT_RESCUE_MEDIA = '/static/figma/feature/d81342748c84fc1068ceb0af9525bc465f5517e8.png'

const RESCUE_REVIEW_STATUSES = [
	{ status: 'pending', statusText: '待投票', count: 8 },
	{ status: 'unpaid', statusText: '待打款', count: 2 },
	{ status: 'paid', statusText: '打款成功', count: 2 },
	{ status: 'rejected', statusText: '投票否决', count: 2 },
]

export const RESCUE_APPLICATION_STATUS_META: Readonly<Record<string, { text: string; tone: string }>> = Object.freeze({
	platform_pending: { text: '平台审核中', tone: 'pending' },
	platform_approved: { text: '平台审核成功', tone: 'success' },
	platform_rejected: { text: '平台审核未通过', tone: 'danger' }
})

export const RESCUE_APPLICATION_TRANSITIONS: Readonly<Record<string, readonly string[]>> = Object.freeze({
	platform_pending: Object.freeze(['platform_approved', 'platform_rejected']),
	platform_approved: Object.freeze([]),
	platform_rejected: Object.freeze([])
})

function createDemoRescue(index: number, status: RescueStatus, statusText: string): RescueRecordMock {
	const id = `rescue-demo-${String(index).padStart(3, '0')}`
	const ownerName = index <= 2 ? '我就是要喂猫' : `救助申请人${index}`
	const description = index === 1
		? '这只猫是我在学校门口看到的，后腿瘸了，走路不太顺畅，听我的同学说好像是被车压得。'
		: index === 2
			? '这只猫已经完成救助，感谢每一位关注和帮助流浪动物的朋友。'
			: `这是一条${statusText}的救助申请，相关救助材料已提交，请评审团核实本次救助。`
	const avatar = '/static/figma/jury-db5da0781d7667c3490af5cfa74dd2fc7cf1ac01.png'
	return {
		id,
		status,
		statusText,
		applicant: { id: `${id}-applicant`, name: ownerName, avatar },
		amount: 300,
		receiver: { name: ownerName, account: `13900000${String(index).padStart(3, '0')}` },
		media: [DEFAULT_RESCUE_MEDIA, DEFAULT_RESCUE_MEDIA, DEFAULT_RESCUE_MEDIA, DEFAULT_RESCUE_MEDIA],
		animals: [
			{ id: `${id}-pet-1`, yardPetId: 'roster-cat-1', name: `救助猫咪${index}`, avatar: '/static/figma/pets/pet-orange.png' },
			{ id: `${id}-pet-2`, yardPetId: 'roster-dog-1', name: `陪伴猫咪${index}`, avatar: '/static/figma/pets/pet-dog.png' },
		],
		yardId: '1',
		yardName: '我就是要喂猫',
		yardAvatar: '/static/figma/yard-cover-exact.png',
		evidenceCount: 22 + index,
		proofList: index === 1 ? [
			{ id: `${id}-proof-1`, name: '焦俊梅', relationship: '同学', avatar: '/static/figma/pets/pet-orange.png', story: '是真的，希望大家投票为真实救助。', createdAt: '昨天 20:45' },
			{ id: `${id}-proof-2`, name: '张梦梦', relationship: '老师', avatar: '/static/figma/pets/pet-dog.png', story: '我去现场看过，情况属实。', createdAt: '昨天 20:46' },
		] : [],
		applicantName: ownerName,
		ownerAvatar: avatar,
		description,
		createdAt: `2026.02.${String(Math.max(10, 22 - Math.floor((index - 1) / 4))).padStart(2, '0')}`,
		views: 2956 + index * 17,
	}
}

const DEMO_RESCUES: RescueRecordMock[] = RESCUE_REVIEW_STATUSES.reduce<RescueRecordMock[]>((records, definition) => {
	const startIndex = records.length + 1
	return records.concat(Array.from({ length: definition.count }, (_, offset) => (
		createDemoRescue(startIndex + offset, rescueStatus(definition.status) || 'pending', definition.statusText)
	)))
}, [])

function normalizeId(value: unknown): string {
	return value === undefined || value === null ? '' : String(value).trim()
}

function readJSON(key: string, fallback: unknown): unknown {
	try {
		const raw: unknown = uni.getStorageSync(key)
		if (!raw) return fallback
		if (typeof raw !== 'string') return raw
		const parsed: unknown = JSON.parse(raw)
		return parsed
	} catch {
		return fallback
	}
}

function normalizeMedia(value: unknown): string[] {
	if (!Array.isArray(value)) return []
	return mediaPaths(value)
}

function normalizeAnimal(animal: unknown, index: number, rescueId: string): RescueAnimal | null {
	if (!isRecord(animal)) return null
	return {
		...animal,
		id: normalizeId(animal.id || animal.petId) || `${rescueId}-pet-${index}`,
		yardPetId: normalizeId(animal.yardPetId || animal.petId || animal.petDetailId),
		name: normalizeId(animal.name) || '猫咪',
		avatar: normalizeId(animal.avatar || animal.image) || DEFAULT_PET_AVATAR,
	}
}

function normalizeApplicant(value: unknown, record: JsonRecord): RescueApplicant {
	const source = recordOf(value)
	const name = normalizeId(source.name || record.applicantName) || '逢猫'
	return {
		...source,
		id: normalizeId(source.id || source.pawId || record.applicantId),
		pawId: typeof source.pawId === 'string' ? source.pawId : undefined,
		name,
		avatar: normalizeId(source.avatar || record.ownerAvatar) || DEFAULT_APPLICANT_AVATAR,
		level: typeof source.level === 'number' ? source.level : undefined,
	}
}


function normalizeReceiver(value: unknown, record: JsonRecord): RescueReceiver {
	if (isRecord(value)) {
		return {
			...value,
			name: normalizeId(value.name) || '收款人',
			account: normalizeId(value.account || value.wechat) || '',
		}
	}
	return {
		name: normalizeId(value) || normalizeId(record.receiverName) || '收款人',
		account: normalizeId(record.receiverAccount),
	}
}

function normalizeProof(proof: unknown, index: number, rescueId: string): RescueProof | null {
	if (!isRecord(proof)) return null
	const text = normalizeId(proof.text || proof.story || proof.confirmStory || proof.content || proof.note)
	const createdAt = normalizeId(proof.createdAt || proof.meta || proof.createdAtText) || '刚刚'
	return {
		...proof,
		pawId: normalizeId(proof.pawId) || undefined,
		userId: normalizeId(proof.userId) || undefined,
		author: isRecord(proof.author) ? { pawId: normalizeId(proof.author.pawId) } : undefined,
		id: normalizeId(proof.id) || `${rescueId}-proof-${index}`,
		name: normalizeId(proof.name || proof.userName) || '匿名用户',
		relationship: normalizeId(proof.relationship || proof.relation || proof.role) || '证实人',
		avatar: normalizeId(proof.avatar || proof.userAvatar) || DEFAULT_APPLICANT_AVATAR,
		media: normalizeMedia(proof.media || proof.mediaPaths || proof.proofPhotos),
		level: Number(proof.level) || 1,
		story: text,
		text,
		meta: normalizeId(proof.meta) || createdAt,
		createdAt,
		likes: Number(proof.likes ?? proof.likeCount ?? 0) || 0,
		...(typeof proof.liked === 'boolean' ? { liked: proof.liked } : {}),
	}
}

export function normalizeRescueRecord(record: unknown): RescueRecord | null {
	if (!isRecord(record)) return null
	const id = normalizeId(record.id || record.rescueId)
	if (!id) return null
	const applicant = normalizeApplicant(record.applicant, record)
	const animalSource = Array.isArray(record.animals) ? record.animals : (Array.isArray(record.pets) ? record.pets : [])
	const animals = animalSource
		.map((animal, index) => normalizeAnimal(animal, index, id))
		.filter((animal): animal is RescueAnimal => animal !== null)
	const proofList = (Array.isArray(record.proofList) ? record.proofList : [])
		.map((proof, index) => normalizeProof(proof, index, id))
		.filter((proof): proof is RescueProof => proof !== null)
	const amount = Number(record.amount)
	const status = rescueStatus(record.status || 'pending') ?? 'unknown'
	const statusText = normalizeId(record.statusText) || (status === 'paid' ? '打款成功' : '待投票')
	const applicationStatus = rescueApplicationStatus(record.applicationStatus || (
		status === 'paid' ? 'platform_approved' : status === 'rejected' ? 'platform_rejected' : 'platform_pending'
	)) ?? 'unknown'
	const ownerName = normalizeId(record.ownerName || applicant.name) || '逢猫'
	const ownerAvatar = normalizeId(record.ownerAvatar || applicant.avatar) || DEFAULT_APPLICANT_AVATAR
	const ownerLevel = Number(record.ownerLevel || applicant.level) || 1
	const yard = recordOf(record.yard)
	const yardId = normalizeId(record.yardId || yard.id) || '1'
	const yardName = normalizeId(record.yardName || yard.name) || '我就是要喂猫'
	const yardAvatar = normalizeId(record.yardAvatar || yard.avatar) || '/static/figma/yard-cover-exact.png'
	const mediaPaths = normalizeMedia(
		Array.isArray(record.mediaPaths) && record.mediaPaths.length ? record.mediaPaths : record.media
	)
	const summary = normalizeId(record.summary || record.description || record.applyText)
	const detail = normalizeId(record.detail || record.description || record.applyText || summary)
	const createdAt = timestamp(record.createdAt) ?? Date.now()
	const applicantRows = Array.isArray(record.applicantRows) && record.applicantRows.length
		? record.applicantRows.filter(isRecord).map((row): RescueApplicantInfoRow => ({
			...row,
			label: normalizeId(row.label),
			value: normalizeId(row.value),
		}))
		: [
			{ label: '求助人姓名', value: `${applicant.name}\u3000已实名` },
			{ label: '求助人年龄', value: normalizeId(record.applicantAge) || '23' },
			{ label: '求助人身份', value: normalizeId(record.applicantIdentity) || '学生' },
			{ label: '求助所在地', value: normalizeId(record.location) || '安徽省合肥市蜀山区海恒社区' },
		]
	return definedFields<RescueRecord>({
		...record,
		reviewItemId: typeof record.reviewItemId === 'string' ? record.reviewItemId : undefined,
		review: isRecord(record.review) ? definedFields({ ...record.review, reviewItemId: typeof record.review.reviewItemId === 'string' ? record.review.reviewItemId : undefined }) : undefined,
		reviewerAuthorized: record.reviewerAuthorized === true,
		applicationId: typeof record.applicationId === 'string' ? record.applicationId : undefined,
		applicantId: typeof record.applicantId === 'string' ? record.applicantId : undefined,
		applicantUserId: typeof record.applicantUserId === 'string' ? record.applicantUserId : undefined,
		userId: typeof record.userId === 'string' ? record.userId : undefined,
		ownerId: typeof record.ownerId === 'string' ? record.ownerId : undefined,
		ownerUserId: typeof record.ownerUserId === 'string' ? record.ownerUserId : undefined,
		yardOwnerId: typeof record.yardOwnerId === 'string' ? record.yardOwnerId : undefined,
		applyText: typeof record.applyText === 'string' ? record.applyText : undefined,
		location: typeof record.location === 'string' ? record.location : undefined,
		locationAddress: typeof record.locationAddress === 'string' ? record.locationAddress : undefined,
		address: typeof record.address === 'string' ? record.address : undefined,
		distance: typeof record.distance === 'string' ? record.distance : undefined,
		updatedAt: timestamp(record.updatedAt),
		rejectedAt: timestamp(record.rejectedAt),
		id,
		rescueId: id,
		applicationType: 'rescue',
		status,
		statusText,
		applicationStatus,
		applicationStatusText: RESCUE_APPLICATION_STATUS_META[applicationStatus]?.text || '平台审核中',
		statusTone: normalizeId(record.statusTone) || (status === 'pending' ? 'success' : 'neutral'),
		applicant,
		applicantName: applicant.name,
		amount: Number.isFinite(amount) ? amount : 0,
		receiver: normalizeReceiver(record.receiver, record),
		media: mediaPaths,
		mediaPaths,
		animals,
		evidenceCount: Number.isFinite(Number(record.evidenceCount)) ? Number(record.evidenceCount) : proofList.length,
		proofList,
		evidenceList: proofList,
		description: summary,
		summary,
		detail,
		helpType: normalizeId(record.helpType) || '个人求助',
		views: Number.isFinite(Number(record.views)) ? Number(record.views) : 2956,
		createdAt,
		createdLabel: normalizeId(record.createdLabel) || (typeof createdAt === 'string' ? createdAt : '刚刚'),
		ownerName,
		ownerAvatar,
		ownerPawId: normalizeId(record.ownerPawId || applicant.id),
		ownerLevel,
		yardId,
		yardName,
		yardAvatar,
		applicantRows,
	})
}

function getSavedRescues(): RescueRecord[] {
	const raw: unknown = readJSON(KEY, [])
	return Array.isArray(raw)
		? raw.map(normalizeRescueRecord).filter((record): record is RescueRecord => record !== null)
		: []
}

function saveRescues(list: unknown): RescueRecord[] {
	const normalized = Array.isArray(list)
		? list.map(normalizeRescueRecord).filter((record): record is RescueRecord => record !== null)
		: []
	uni.setStorageSync(KEY, JSON.stringify(normalized))
	return normalized
}

function createRescueId() {
	return `rescue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** Returns local records first and stable demo records as a fallback for a fresh/cleared simulator. */
export function getRescueRecords(options: RescueReadOptions | false = {}): RescueRecord[] {
	const includeDemo = options !== false && options.includeDemo !== false
  const byId = new Map<string, RescueRecord>()
	getSavedRescues().forEach((record) => byId.set(record.id, record))
	if (includeDemo) {
			DEMO_RESCUES.map(normalizeRescueRecord)
				.filter((record): record is RescueRecord => record !== null)
				.forEach((record) => {
			if (!byId.has(record.id)) byId.set(record.id, record)
		})
	}
	return Array.from(byId.values())
}

export function getRescueById(id: string, options: RescueReadOptions | false = {}): RescueRecord | null {
	const rescueId = normalizeId(id)
	if (!rescueId) return null
	return getRescueRecords(options).find((record) => record.id === rescueId || record.rescueId === rescueId) || null
}

export function hasRescueProofByUser(idOrRecord: string | RescueRecord, pawId: string): boolean {
	const record = isRecord(idOrRecord)
		? normalizeRescueRecord(idOrRecord)
		: getRescueById(normalizeId(idOrRecord))
	const actorId = normalizeId(pawId)
	if (!record || !actorId) return false
	return record.proofList.some((proof) => normalizeId(proof.pawId || proof.userId || recordOf(proof.author).pawId) === actorId)
}

/**
 * Local permission seam for rescue management actions. The demo has no
 * authenticated backend actor, so callers must pass the current actor id and
 * optional trusted role names explicitly. Browsing and submitting proof do
 * not use this helper; only future owner/moderator mutations should use it.
 */
export type RescueManagementRole = 'admin' | 'moderator'

export function canManageRescue(
	idOrRecord: string | RescueRecord,
	actorId: string,
	roles: readonly RescueManagementRole[] = [],
): boolean {
	const record = isRecord(idOrRecord)
		? normalizeRescueRecord(idOrRecord)
		: getRescueById(normalizeId(idOrRecord))
	const actor = normalizeId(actorId)
	const roleList = (Array.isArray(roles) ? roles : [roles]).map(normalizeId)
	if (!record || !actor) return false
	return roleList.includes('admin') || roleList.includes('moderator')
		|| actor === normalizeId(record.ownerPawId)
		|| actor === normalizeId(record.applicant && record.applicant.id)
}

/** The review-level figures are shared by every rescue-review view. Record data
 * drives the review cards; it must not create a second page-local mock source. */
export function getRescueReviewSummary(records: readonly RescueRecord[] = getRescueRecords()): RescueReviewSummary {
	const list = Array.isArray(records)
		? records.map(normalizeRescueRecord).filter((record): record is RescueRecord => record !== null)
		: []
	const count = (status: string): number => list.filter((record) => record.status === status).length
	return {
		name: '逢猫流浪动物救助基金池',
		balance: '13.31',
		note: '基金池不对外开放募捐，由平台云投喂业务五成利润入池',
		stats: [
			{ value: '63.01', label: '今日入池(元)' },
			{ value: '300', label: '今日救助支出(元)' },
			{ value: '7423.32', label: '累计救助支出(元)' },
		],
		statusStats: [
			{ status: 'pending', value: count('pending'), label: '待投票', tone: 'success' },
			{ status: 'unpaid', value: count('unpaid'), label: '待打款', tone: 'neutral' },
			{ status: 'paid', value: count('paid'), label: '打款成功', tone: 'neutral' },
			{ status: 'rejected', value: count('rejected'), label: '投票否决', tone: 'neutral' },
		],
	}
}

/** Creates an independent rescue record. It never writes to adoptionStorage. */
export function createRescue(input?: RescueApplicationInput): RescueRecord | null {
	return createRescueFromUnknown(input ?? {})
}

/** Raw mock/API boundary; the record normalizer validates legacy and JS callers. */
export function createRescueFromUnknown(input: unknown): RescueRecord | null {
	const source = recordOf(input)
	const id = normalizeId(source.id || source.rescueId) || createRescueId()
	const record = normalizeRescueRecord({
		...source,
		id,
		rescueId: id,
		status: source.status || 'pending',
		statusText: source.statusText || '待投票',
		applicationStatus: source.applicationStatus || 'platform_pending',
		applicant: source.applicant || {
			id: source.applicantId,
			name: source.applicantName,
			avatar: source.applicantAvatar,
		},
		receiver: source.receiver || {
			name: source.receiverName,
			account: source.receiverAccount,
		},
		media: source.media || source.mediaPaths || [],
		animals: source.animals || source.pets || [],
		evidenceCount: source.evidenceCount || 0,
		proofList: source.proofList || [],
	})
	if (!record) return null
	const next = getSavedRescues().filter((item) => item.id !== record.id)
	next.unshift(record)
	saveRescues(next)
	return getRescueById(record.id, { includeDemo: false })
}

/** 更新真实救助申请；演示记录首次更新时复制为同 ID 的本地记录。 */
export function updateRescue(id: string, patch: Partial<RescueRecord> = {}): RescueRecord | null {
	return updateRescueFromUnknown(id, patch)
}

/** Raw mock/API boundary; persisted patch fields are normalized before writing. */
export function updateRescueFromUnknown(id: unknown, patch: unknown = {}): RescueRecord | null {
	const rescueId = normalizeId(id)
	if (!rescueId) return null
	const saved = getSavedRescues()
	const index = saved.findIndex((item) => item.id === rescueId)
	if (index >= 0) {
		const updated = normalizeRescueRecord({ ...saved[index], ...recordOf(patch), id: rescueId })
		if (!updated) return null
		saved[index] = updated
		saveRescues(saved)
		return getRescueById(rescueId, { includeDemo: false })
	}
	const demo = getRescueRecords().find((item) => item.id === rescueId)
	if (!demo) return null
	const localCopy = normalizeRescueRecord({ ...demo, ...recordOf(patch), id: rescueId })
	if (!localCopy) return null
	saved.unshift(localCopy)
	saveRescues(saved)
	return getRescueById(rescueId, { includeDemo: false })
}

export function canTransitionRescueApplication(fromStatus: RescueApplicationStatus, toStatus: RescueApplicationStatus): boolean {
	const from = normalizeId(fromStatus)
	const to = normalizeId(toStatus)
	return Boolean(from && to && (from === to || (RESCUE_APPLICATION_TRANSITIONS[from] || []).includes(to)))
}

export function transitionRescueApplication(
	id: string,
	toStatus: Exclude<RescueApplicationStatus, 'unknown'>,
	patch: Partial<RescueRecord> = {},
): RescueRecord | null {
	return transitionRescueApplicationFromUnknown(id, toStatus, patch)
}

/** Raw state-machine boundary for applicationMockApi's validated dynamic domain. */
export function transitionRescueApplicationFromUnknown(id: unknown, toStatus: unknown, patch: unknown = {}): RescueRecord | null {
	const record = getRescueById(normalizeId(id))
	const nextStatus = normalizeId(toStatus)
	const from = rescueApplicationStatus(record?.applicationStatus)
	const to = rescueApplicationStatus(nextStatus)
	if (!record || !from || !to || !canTransitionRescueApplication(from, to)) return null
	return updateRescueFromUnknown(record.id, {
		...recordOf(patch),
		applicationStatus: to,
		applicationStatusText: RESCUE_APPLICATION_STATUS_META[to]?.text || to
	})
}

/** Appends one independent proof submission and keeps evidenceCount in sync. */
export function addRescueProof(id: string, submission: RescueProofSubmission): RescueRecord | null {
	return addRescueProofFromUnknown(id, submission)
}

/** Raw persistence seam; the proof normalizer owns legacy field cleanup. */
export function addRescueProofFromUnknown(id: unknown, submission: unknown = {}): RescueRecord | null {
	const rescueId = normalizeId(id)
	if (!rescueId) return null
	const current = getRescueById(rescueId)
	if (!current) return null
	const source = recordOf(submission)
	const proof = normalizeProof({ ...source, id: source.id || `${rescueId}-proof-${Date.now()}` }, current.proofList.length, rescueId)
	if (!proof) return null
	const nextRecord = {
		...current,
		proofList: current.proofList.concat(proof),
		evidenceCount: Math.max(Number(current.evidenceCount) || 0, current.proofList.length) + 1,
	}
	const saved = getSavedRescues().filter((item) => item.id !== rescueId)
	const normalizedNext = normalizeRescueRecord(nextRecord)
	if (!normalizedNext) return null
	saved.unshift(normalizedNext)
	saveRescues(saved)
	return getRescueById(rescueId, { includeDemo: false })
}
