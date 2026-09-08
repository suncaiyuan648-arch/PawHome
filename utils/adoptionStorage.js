const KEY = 'PAWHOME_ADOPTIONS'
const PICK_KEY = 'PAWHOME_ADOPTION_PICK'
const LAST_ID = 'PAWHOME_LAST_ADOPTION_ID'

const DEFAULT_PET_IMG = '/static/home-feed-1.png'
const DEFAULT_OWNER_IMG = '/static/figma/home/yard-avatar.png'

export const ADOPTION_STATUS_META = Object.freeze({
	cloud_pending: { text: '等待云家长审核', tone: 'red', dot: true },
	cloud_rejected: { text: '云家长拒绝领养申请', tone: 'red', dot: true },
	pending: { text: '等待院主审核', tone: 'red', dot: true },
	rejected: { text: '申请拒绝', tone: 'red', dot: true },
	pickup: { text: '待你前去领养', tone: 'green', dot: true },
	owner_confirm: { text: '待院主确认', tone: 'green', dot: true },
	owner_confirm_pending: { text: '待院主确认', tone: 'green', dot: true },
	jury_confirm: { text: '待评审团确认', tone: 'green', dot: true },
	jury_confirm_pending: { text: '待评审团确认', tone: 'green', dot: true },
	adoption_confirmed: { text: '领养确认成功', tone: 'green', dot: true },
	reward: { text: '获得奖励待领取', tone: 'green', dot: true },
	reward_done: { text: '奖励已领取', tone: 'grey', dot: false },
	abandoned: { text: '已放弃领养', tone: 'grey', dot: false }
})

/**
 * 用户侧领养申请状态机。
 *
 * 审批失败统一进入 rejected 终态，不再自动推进到下一个审批节点。
 * reapproval 字段为后续重新审批预留，但当前 mock 不开放重新审批入口。
 */
export const ADOPTION_TRANSITIONS = Object.freeze({
	cloud_pending: Object.freeze(['pending', 'rejected', 'abandoned']),
	cloud_rejected: Object.freeze([]),
	pending: Object.freeze(['pickup', 'rejected', 'abandoned']),
	pickup: Object.freeze(['owner_confirm_pending', 'owner_confirm', 'abandoned', 'rejected']),
	owner_confirm: Object.freeze(['jury_confirm_pending', 'jury_confirm', 'rejected', 'abandoned']),
	owner_confirm_pending: Object.freeze(['jury_confirm_pending', 'rejected', 'abandoned']),
	jury_confirm: Object.freeze(['adoption_confirmed', 'rejected', 'abandoned']),
	jury_confirm_pending: Object.freeze(['adoption_confirmed', 'rejected', 'abandoned']),
	adoption_confirmed: Object.freeze(['reward', 'abandoned']),
	reward: Object.freeze(['reward_done', 'abandoned']),
	reward_done: Object.freeze([]),
	rejected: Object.freeze([]),
	abandoned: Object.freeze([])
})

export const ADOPTION_REAPPROVAL_ENABLED = false

const DEMO_APPLY_TEXT =
	'你好我是一个学生虽然我是一个学生但是我家里面有地方可以养猫我本人喜欢养猫我的家人也喜欢养猫，还有我小时候有养猫的经验，相信我可以把猫养好，我的家人都支持我养猫，会给我经济支持。'

const DEMO_CONFIRM_STORY =
	'我第一次去的时候小猫一直躲着我，去了几次都没有逮到。后来我买了一个网，趁着小猫睡着的时候一个网兜给盖上去了，终于把小猫猫带回家了。'

const DEMO_PROOF_PHOTO = '/static/figma/adoption-flow/e81f2c2074a7772e8fbca3d3828b3a751f5cb5bb.png'

const DEMO_ADOPTIONS = [
	{
		id: 'demo-pending',
		status: 'pending',
		ownerName: '我就是要喂猫',
		yardName: '我就是要喂猫',
		yardId: '1',
		yardTag: '小院',
		ownerPawId: 'yard_card_owner',
		ownerAvatar: '/static/figma/home/yard-avatar.png',
		applyText: DEMO_APPLY_TEXT,
		mediaPaths: ['/static/figma/activity-hefei.jpg', '/static/figma/activity-changsha.jpg'],
		pets: [
			{ id: 'demo-pending-orange', name: '奥利奥', avatar: '/static/figma/pets/pet-orange.png' },
			{ id: 'demo-pending-dog', name: '呗呗', avatar: '/static/figma/pets/pet-dog.png' }
		],
		applicantName: '逢猫'
	},
	{
		id: 'demo-rejected',
		status: 'rejected',
		ownerName: '我就是要喂猫',
		yardName: '我就是要喂猫',
		yardId: '1',
		yardTag: '小院',
		ownerPawId: 'yard_card_owner',
		ownerAvatar: '/static/figma/home/yard-avatar.png',
		applyText: DEMO_APPLY_TEXT,
		mediaPaths: ['/static/figma/activity-hefei.jpg'],
		pets: [
			{ id: 'demo-rejected-orange', name: '奥利奥', avatar: '/static/figma/pets/pet-orange.png' },
			{ id: 'demo-rejected-black-white', name: '呗呗', avatar: '/static/figma/pets/pet-black-white.png' }
		],
		applicantName: '逢猫',
		rejectNote: '当前名额已满，建议您关注其他小院。'
	},
	{
		id: 'demo-cloud-pending',
		status: 'cloud_pending',
		cloudParentRequired: true,
		cloudParentPawId: '2876598765',
		cloudParentIds: ['2876598765', 'cloud-parent-2'],
		ownerName: '我就是要喂猫',
		yardName: '我就是要喂猫',
		yardId: '1',
		yardTag: '小院',
		ownerPawId: 'yard_card_owner',
		ownerAvatar: '/static/figma/home/yard-avatar.png',
		applicantName: '逢猫',
		applicantAvatar: '/static/figma/home/feed-avatar.png',
		applicantLevel: 1,
		applyText: DEMO_APPLY_TEXT,
		mediaPaths: ['/static/figma/activity-hefei.jpg', '/static/figma/activity-changsha.jpg'],
		pets: [
			{ id: 'demo-cloud-pending-orange', name: '奥利奥', avatar: '/static/figma/pets/pet-orange.png', cloudParentPawId: '2876598765', cloudReviewStatus: 'pending' },
			{ id: 'demo-cloud-pending-dog', name: '呗呗', avatar: '/static/figma/pets/pet-dog.png', cloudParentPawId: 'cloud-parent-2', cloudReviewStatus: 'pending' }
		]
	},
	{
		id: 'demo-cloud-pending-2',
		status: 'cloud_pending',
		cloudParentRequired: true,
		cloudParentPawId: '2876598765',
		cloudParentIds: ['2876598765', 'cloud-parent-2'],
		ownerName: '我就是要喂猫',
		yardName: '我就是要喂猫',
		yardId: '1',
		yardTag: '小院',
		ownerPawId: 'yard_card_owner',
		ownerAvatar: '/static/figma/home/yard-avatar.png',
		applicantName: '小橘',
		applicantAvatar: '/static/figma/home/feed-avatar.png',
		applicantLevel: 2,
		applyText: DEMO_APPLY_TEXT,
		mediaPaths: ['/static/figma/activity-hefei.jpg', '/static/figma/activity-changsha.jpg'],
		pets: [
			{ id: 'demo-cloud-pending-2-orange', name: '团子', avatar: '/static/figma/pets/pet-orange.png', cloudParentPawId: '2876598765', cloudReviewStatus: 'pending' },
			{ id: 'demo-cloud-pending-2-dog', name: '豆包', avatar: '/static/figma/pets/pet-dog.png', cloudParentPawId: 'cloud-parent-2', cloudReviewStatus: 'pending' }
		]
	},
	{
		id: 'demo-cloud-pending-3',
		status: 'cloud_pending',
		cloudParentRequired: true,
		cloudParentPawId: '2876598765',
		cloudParentIds: ['2876598765', 'cloud-parent-2'],
		ownerName: '我就是要喂猫',
		yardName: '我就是要喂猫',
		yardId: '1',
		yardTag: '小院',
		ownerPawId: 'yard_card_owner',
		ownerAvatar: '/static/figma/home/yard-avatar.png',
		applicantName: '阿福',
		applicantAvatar: '/static/figma/home/feed-avatar.png',
		applicantLevel: 3,
		applyText: DEMO_APPLY_TEXT,
		mediaPaths: ['/static/figma/activity-changsha.jpg', '/static/figma/activity-hefei.jpg'],
		pets: [
			{ id: 'demo-cloud-pending-3-orange', name: '奶糖', avatar: '/static/figma/pets/pet-orange.png', cloudParentPawId: '2876598765', cloudReviewStatus: 'pending' },
			{ id: 'demo-cloud-pending-3-dog', name: '芝麻', avatar: '/static/figma/pets/pet-dog.png', cloudParentPawId: 'cloud-parent-2', cloudReviewStatus: 'pending' }
		]
	},
	{
		id: 'demo-pickup',
		status: 'pickup',
		ownerName: '我就是要喂猫',
		yardName: '我就是要喂猫',
		yardId: '1',
		yardTag: '小院',
		ownerPawId: 'yard_card_owner',
		ownerAvatar: '/static/figma/home/yard-avatar.png',
		applyText: DEMO_APPLY_TEXT,
		mediaPaths: ['/static/figma/activity-hefei.jpg', '/static/figma/activity-changsha.jpg'],
		pets: [
			{ id: 'demo-pickup-orange', name: '奥利奥', avatar: '/static/figma/pets/pet-orange.png' },
			{ id: 'demo-pickup-dog', name: '呗呗', avatar: '/static/figma/pets/pet-dog.png' }
		],
		applicantName: '逢猫',
		location: '鼎丰前城小区',
		locationAddress: '湖南省长沙市雨花区中意一路167号鼎丰前城',
		distance: '7.2km',
		ownerNick: '芝',
		ownerMessage:
			'你好，我是「我就是要喂猫」小院的院主，看到了你的领养申请。希望你能照顾好小猫在新家。小猫喜欢待在车库和地下室，领养后可以联系我，我给你指路。最好带笼子和网，小猫怕陌生人靠近会跑开。'
	},
	{
		id: 'demo-owner-confirm',
		status: 'owner_confirm',
		ownerName: '我就是要喂猫',
		yardName: '我就是要喂猫',
		yardId: '1',
		yardTag: '小院',
		ownerPawId: 'yard_card_owner',
		ownerAvatar: '/static/figma/home/yard-avatar.png',
		applyText: DEMO_APPLY_TEXT,
		mediaPaths: ['/static/figma/activity-hefei.jpg', '/static/figma/activity-changsha.jpg'],
		pets: [
			{ id: 'demo-owner-confirm-orange', name: '奥利奥', avatar: '/static/figma/pets/pet-orange.png' },
			{ id: 'demo-owner-confirm-dog', name: '呗呗', avatar: '/static/figma/pets/pet-dog.png' }
		],
		applicantName: '逢猫',
		confirmStory: DEMO_CONFIRM_STORY,
		proofDate: '2026.01.03',
		proofPhotos: [DEMO_PROOF_PHOTO, DEMO_PROOF_PHOTO]
	},
	{
		id: 'demo-jury-confirm',
		status: 'jury_confirm',
		ownerName: '我就是要喂猫',
		yardName: '我就是要喂猫',
		yardId: '1',
		yardTag: '小院',
		ownerPawId: 'yard_card_owner',
		ownerAvatar: '/static/figma/home/yard-avatar.png',
		applyText: DEMO_APPLY_TEXT,
		mediaPaths: ['/static/figma/activity-hefei.jpg', '/static/figma/activity-changsha.jpg'],
		pets: [
			{ id: 'demo-jury-confirm-orange', name: '奥利奥', avatar: '/static/figma/pets/pet-orange.png' },
			{ id: 'demo-jury-confirm-dog', name: '呗呗', avatar: '/static/figma/pets/pet-dog.png' }
		],
		applicantName: '逢猫',
		confirmStory: DEMO_CONFIRM_STORY
	},
	{
		id: 'demo-reward',
		status: 'reward',
		ownerName: '我就是要喂猫',
		yardName: '我就是要喂猫',
		yardId: '1',
		yardTag: '小院',
		ownerPawId: 'yard_card_owner',
		ownerAvatar: '/static/figma/home/yard-avatar.png',
		applyText: DEMO_APPLY_TEXT,
		mediaPaths: ['/static/figma/activity-hefei.jpg', '/static/figma/activity-changsha.jpg'],
		pets: [
			{ id: 'demo-reward-orange', name: '奥利奥', avatar: '/static/figma/pets/pet-orange.png' },
			{ id: 'demo-reward-dog', name: '呗呗', avatar: '/static/figma/pets/pet-dog.png' }
		],
		applicantName: '逢猫',
		confirmStory: DEMO_CONFIRM_STORY
	}
]

// 领养审核列表专用 mock 数据。它们和正式审批单使用同一字段形状，
// 由 adoptionReviewMockApi 统一转换为院主/云家长审核卡片。
const REVIEW_DEMO_PETS = Object.freeze([
	{ key: 'orange', name: '奥利奥', avatar: '/static/figma/pets/pet-orange.png' },
	{ key: 'dog', name: '呗呗', avatar: '/static/figma/pets/pet-dog.png' }
])

function createReviewDemoAdoption(id, status, overrides = {}) {
	const { pets, ...rest } = overrides
	return {
		id,
		status,
		ownerName: '我就是要喂猫',
		yardName: '我就是要喂猫',
		yardId: '1',
		yardTag: '小院',
		ownerPawId: 'yard_card_owner',
		ownerAvatar: '/static/figma/home/yard-avatar.png',
		applicantName: '逢猫',
		applicantAvatar: '/static/figma/home/feed-avatar.png',
		applicantLevel: 1,
		applyText: DEMO_APPLY_TEXT,
		mediaPaths: ['/static/figma/activity-hefei.jpg', '/static/figma/activity-changsha.jpg'],
		pets: (pets || REVIEW_DEMO_PETS).map((pet, index) => ({
			...pet,
			id: `${id}-${pet.key || index}`
		})),
		...rest
	}
}

const CLOUD_PARENT_REVIEW_FIELDS = Object.freeze({
	cloudParentRequired: true,
	cloudParentPawId: '2876598765',
	cloudParentIds: ['2876598765'],
	cloudParentName: '姜栋',
	cloudParentAvatar: '/static/avatarlog.png',
	cloudParentLevel: 1
})

function reviewPets(names = ['奥利奥', '呗呗']) {
	const avatars = [
		'/static/figma/pets/pet-orange.png',
		'/static/figma/pets/pet-dog.png'
	]
	return names.map((name, index) => ({
		key: `${name}-${index}`,
		name,
		avatar: avatars[index % avatars.length]
	}))
}

const REVIEW_MOCK_CASES = [
	{
		prefix: 'review-v2-cloud-pending',
		status: 'cloud_pending',
		applicants: [['小橘', 2, ['奥利奥', '呗呗']], ['阿福', 3, ['奶糖', '芝麻']]],
		patch: CLOUD_PARENT_REVIEW_FIELDS
	},
	{
		prefix: 'review-v2-owner-pending',
		status: 'pending',
		applicants: [['林小满', 2, ['花卷', '煤球']], ['陈一', 1, ['奶盖']]],
		patch: {}
	},
	{
		prefix: 'review-v2-owner-confirm-pending',
		status: 'owner_confirm_pending',
		applicants: [['小鱼', 2, ['团子', '豆包']], ['阿布', 3, ['年糕']]],
		patch: {
			confirmStory: DEMO_CONFIRM_STORY,
			proofDate: '2026.01.03',
			proofPhotos: [DEMO_PROOF_PHOTO, DEMO_PROOF_PHOTO]
		}
	},
	{
		prefix: 'review-v2-cloud-approved',
		status: 'pending',
		applicants: [['逢猫', 1, ['奥利奥', '呗呗']], ['小七', 2, ['花生']]],
		patch: {
			...CLOUD_PARENT_REVIEW_FIELDS,
			cloudParentApprovals: ['2876598765'],
			approvedBy: 'cloud_parent',
			cloudParentApprovedAt: Date.now() - 86400000
		}
	},
	{
		prefix: 'review-v2-owner-approved',
		status: 'pickup',
		applicants: [['逢猫', 1, ['奥利奥', '呗呗']], ['小满', 2, ['团子']]],
		patch: {
			approvedBy: 'owner',
			approvedAt: Date.now() - 86400000,
			location: '鼎丰前城小区',
			locationAddress: '湖南省长沙市雨花区中意一路167号鼎丰前城',
			distance: '7.2km',
			ownerNick: '芝',
			ownerMessage: '院主已同意申请，请申请人前往小院完成领养。'
		}
	},
	{
		prefix: 'review-v2-owner-confirmed',
		status: 'jury_confirm_pending',
		applicants: [['逢猫', 1, ['奥利奥', '呗呗']], ['小鹿', 2, ['年糕', '煤球']]],
		patch: {
			confirmStory: DEMO_CONFIRM_STORY,
			proofDate: '2026.01.03',
			proofPhotos: [DEMO_PROOF_PHOTO, DEMO_PROOF_PHOTO],
			approvedBy: 'owner',
			approvedAt: Date.now() - 172800000,
			ownerConfirmedAt: Date.now() - 86400000,
			reviewHistory: ['院主已同意', '院主已确认']
		}
	},
	{
		prefix: 'review-v2-cloud-rejected',
		status: 'rejected',
		applicants: [['小黑', 1, ['煤球']], ['小白', 2, ['奶糖', '年糕']]],
		patch: {
			...CLOUD_PARENT_REVIEW_FIELDS,
			failureStage: 'cloud_parent',
			rejectNote: '云家长拒绝了本次领养申请，流程已结束。',
			rejectorName: '姜栋',
			rejectorAvatar: '/static/avatarlog.png',
			rejectorLevel: 1,
			rejectorRole: '云家长'
		}
	},
	{
		prefix: 'review-v2-owner-rejected',
		status: 'rejected',
		applicants: [['林小满', 2, ['花卷', '煤球']], ['陈一', 1, ['奶盖']]],
		patch: {
			failureStage: 'owner_review',
			rejectNote: '院主拒绝了本次领养申请，流程已结束。',
			rejectorName: '芝',
			rejectorRole: '院主'
		}
	},
	{
		prefix: 'review-v2-owner-confirm-rejected',
		status: 'rejected',
		applicants: [['小鱼', 2, ['团子', '豆包']], ['阿布', 3, ['年糕']]],
		patch: {
			failureStage: 'owner_confirm',
			rejectNote: '驳回后领养信息申请人不再可见。',
			confirmStory: DEMO_CONFIRM_STORY,
			proofDate: '2026.01.03',
			proofPhotos: [DEMO_PROOF_PHOTO, DEMO_PROOF_PHOTO],
			proofSubmittedAt: Date.now() - 86400000,
			rejectorName: '芝',
			rejectorRole: '院主'
		}
	}
]

const DEMO_REVIEW_ADOPTIONS = REVIEW_MOCK_CASES.flatMap((item) => item.applicants.map((applicant, index) => {
	const [applicantName, applicantLevel, petNames] = applicant
	return createReviewDemoAdoption(`${item.prefix}-${index + 1}`, item.status, {
		applicantName,
		applicantLevel,
		pets: reviewPets(petNames),
		...item.patch
	})
}))

function readJSON(key, fallback) {
	try {
		const raw = uni.getStorageSync(key)
		if (!raw) return fallback
		return typeof raw === 'string' ? JSON.parse(raw) : raw
	} catch (e) {
		return fallback
	}
}

function normalizeId(value) {
	return value === undefined || value === null ? '' : String(value).trim()
}

function normalizePet(pet, index) {
	if (!pet || typeof pet !== 'object') return null
	const id = normalizeId(pet.id || pet.petId || pet.key) || 'pet-' + index
	return {
		...pet,
		id,
		name: normalizeId(pet.name) || '猫咪',
		avatar: normalizeId(pet.avatar) || DEFAULT_PET_IMG,
		disabled: Boolean(pet.disabled)
	}
}

function normalizeRejector(record) {
	const failureStage = normalizeId(record.failureStage)
	const isCloudParent = failureStage === 'cloud_parent'
	const source = record.rejector && typeof record.rejector === 'object' ? record.rejector : {}
	return {
		...source,
		name: normalizeId(source.name || record.rejectorName || record.rejectedByName
			|| (isCloudParent ? record.cloudParentName : record.ownerName)) || (isCloudParent ? '姜栋' : '院主'),
		avatar: normalizeId(source.avatar || record.rejectorAvatar || record.rejectedByAvatar
			|| (isCloudParent ? record.cloudParentAvatar : record.ownerAvatar))
			|| (isCloudParent ? '/static/avatarlog.png' : DEFAULT_OWNER_IMG),
		level: Number(source.level || record.rejectorLevel || record.rejectedByLevel
			|| (isCloudParent ? record.cloudParentLevel : record.ownerLevel)) || 1,
		role: normalizeId(source.role || record.rejectorRole || record.rejectedByRole)
			|| (isCloudParent ? '云家长' : '院主')
	}
}

/** 保持记录字段完整，同时给所有入口提供同一组稳定字段。 */
export function normalizeAdoptionRecord(record) {
	if (!record || typeof record !== 'object') return null
	const id = normalizeId(record.id || record.recordId)
	if (!id) return null
	const sourcePets = Array.isArray(record.pets) ? record.pets : []
	return {
		...record,
		id,
		recordId: normalizeId(record.recordId) || id,
		applicationType: 'adoption',
		status: normalizeId(record.status) || 'pending',
		cloudParentRequired: Boolean(record.cloudParentRequired),
		cloudParentPawId: normalizeId(record.cloudParentPawId || record.cloudParentId || record.cloudOwnerId),
		cloudParentIds: Array.isArray(record.cloudParentIds)
			? record.cloudParentIds.map(normalizeId).filter(Boolean)
			: [],
		cloudParentApprovals: Array.isArray(record.cloudParentApprovals)
			? record.cloudParentApprovals.map(normalizeId).filter(Boolean)
			: [],
		reapproval: {
			available: ADOPTION_REAPPROVAL_ENABLED,
			count: Number(record.reapproval && record.reapproval.count) || Number(record.reapprovalCount) || 0,
			lastAt: record.reapproval && record.reapproval.lastAt ? record.reapproval.lastAt : null
		},
		pets: sourcePets.map(normalizePet).filter(Boolean),
		mediaPaths: Array.isArray(record.mediaPaths) ? [...record.mediaPaths] : [],
		yardName: normalizeId(record.yardName || record.ownerName) || '小院',
		ownerName: normalizeId(record.ownerName || record.yardName) || '院主',
		yardTag: normalizeId(record.yardTag) || '小院',
		ownerAvatar: normalizeId(record.ownerAvatar) || DEFAULT_OWNER_IMG,
		ownerPawId: normalizeId(record.ownerPawId),
		applicantName: normalizeId(record.applicantName) || '逢猫',
		rejector: normalizeRejector(record)
	}
}

export function getAdoptions() {
	const raw = readJSON(KEY, [])
	if (!Array.isArray(raw)) return []
	// 旧版审核 mock 可能已经写入本地 storage；不让它覆盖新的 v2 审批样本。
	return raw
		.map(normalizeAdoptionRecord)
		.filter(Boolean)
		.filter((record) => !String(record.id || '').startsWith('demo-review-'))
}

export function saveAdoptions(list) {
	const normalized = Array.isArray(list) ? list.map(normalizeAdoptionRecord).filter(Boolean) : []
	uni.setStorageSync(KEY, JSON.stringify(normalized))
	return normalized
}

export function createAdoptionId() {
	return 'ad-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)
}

export function addAdoption(rec) {
	const next = normalizeAdoptionRecord({ ...(rec || {}), id: normalizeId(rec && rec.id) || createAdoptionId() })
	if (!next) return null
	const list = getAdoptions().filter((item) => item.id !== next.id)
	list.unshift(next)
	saveAdoptions(list)
	return next
}

/** 更新真实记录；演示记录首次更新时复制为同 ID 的本地记录，保证后续页面仍可查询。 */
export function updateAdoption(id, patch) {
	const recordId = normalizeId(id)
	if (!recordId) return false
	const saved = getAdoptions()
	const index = saved.findIndex((item) => item.id === recordId)
	if (index >= 0) {
		saved[index] = normalizeAdoptionRecord({ ...saved[index], ...(patch || {}), id: recordId })
		saveAdoptions(saved)
		return getAdoptionById(recordId, { includeDemo: false })
	}

	const demo = getDemoAdoptions().find((item) => item.id === recordId)
	if (!demo) return false
	const localCopy = normalizeAdoptionRecord({ ...demo, ...(patch || {}), id: recordId })
	if (!localCopy) return false
	saved.unshift(localCopy)
	saveAdoptions(saved)
	return getAdoptionById(recordId, { includeDemo: false })
}

export function canTransitionAdoption(fromStatus, toStatus) {
	const from = normalizeId(fromStatus)
	const to = normalizeId(toStatus)
	return Boolean(from && to && (from === to || (ADOPTION_TRANSITIONS[from] || []).includes(to)))
}

export function transitionAdoption(id, toStatus, patch = {}) {
	const record = getAdoptionById(id)
	const nextStatus = normalizeId(toStatus)
	if (!record || !canTransitionAdoption(record.status, nextStatus)) return null
	const nextPatch = { ...patch, status: nextStatus }
	if (nextStatus === 'rejected') {
		nextPatch.rejectedAt = nextPatch.rejectedAt || Date.now()
		nextPatch.failureStage = nextPatch.failureStage || record.status
		nextPatch.reapproval = {
			...(record.reapproval || {}),
			available: ADOPTION_REAPPROVAL_ENABLED,
			lastFailureStage: nextPatch.failureStage
		}
	}
	return updateAdoption(record.id, nextPatch)
}

export function canReopenAdoption(idOrRecord) {
	if (!ADOPTION_REAPPROVAL_ENABLED) return false
	const record = idOrRecord && typeof idOrRecord === 'object' ? idOrRecord : getAdoptionById(idOrRecord)
	return Boolean(record && record.status === 'rejected' && record.reapproval && record.reapproval.available)
}

/** 后续重新审批能力的扩展口；当前 mock 明确关闭，不改变现有终态。 */
export function reopenAdoption(id, patch = {}) {
	if (!canReopenAdoption(id)) return null
	const record = getAdoptionById(id)
	return updateAdoption(id, {
		...patch,
		status: record.cloudParentRequired ? 'cloud_pending' : 'pending',
		reapproval: { ...(record.reapproval || {}), count: (record.reapproval && record.reapproval.count || 0) + 1, lastAt: Date.now() }
	})
}

/** 读取已保存记录与演示记录，按真实 recordId 去重，保存记录优先。 */
export function getAdoptionRecords(options = {}) {
	const includeDemo = options !== false && options.includeDemo !== false
	const byId = new Map()
	getAdoptions().forEach((record) => byId.set(record.id, record))
	if (includeDemo) {
		getDemoAdoptions().forEach((record) => {
			if (!byId.has(record.id)) byId.set(record.id, record)
		})
	}
	return Array.from(byId.values())
}

export function getAdoptionById(id, options = {}) {
	const recordId = normalizeId(id)
	if (!recordId) return null
	return getAdoptionRecords(options).find((record) => record.id === recordId || record.recordId === recordId) || null
}

export function setAdoptionPick(payload) {
	uni.setStorageSync(PICK_KEY, JSON.stringify(payload || {}))
}

export function getAdoptionPick() {
	const value = readJSON(PICK_KEY, {})
	return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

export function clearAdoptionPick() {
	uni.removeStorageSync(PICK_KEY)
}

export function setLastAdoptionId(id) {
	const recordId = normalizeId(id)
	if (recordId) uni.setStorageSync(LAST_ID, recordId)
	else uni.removeStorageSync(LAST_ID)
}

export function getLastAdoptionId() {
	return normalizeId(uni.getStorageSync(LAST_ID))
}

/** 内置演示数据：与真实记录使用同一字段形状，并保留宠物、院主和申请媒体。 */
export function getDemoAdoptions() {
	return [...DEMO_ADOPTIONS, ...DEMO_REVIEW_ADOPTIONS].map(normalizeAdoptionRecord).filter(Boolean)
}

/** 领养列表卡片转换：不改写记录 ID，也不丢失申请内容、媒体或身份字段。 */
export function toAdoptionCard(record) {
	const normalized = normalizeAdoptionRecord(record)
	if (!normalized) return null
	const status = ADOPTION_STATUS_META[normalized.status] || { text: '处理中', tone: 'grey', dot: false }
	const pets = normalized.pets.length
		? normalized.pets.map((pet) => ({ ...pet, avatar: pet.avatar || DEFAULT_PET_IMG }))
		: [{ id: normalized.id + '-pet-0', name: '猫咪', avatar: DEFAULT_PET_IMG }]
	return {
		...normalized,
		id: normalized.id,
		recordId: normalized.recordId || normalized.id,
		statusText: status.text,
		statusTone: status.tone,
		statusDot: status.dot,
		pets
	}
}
