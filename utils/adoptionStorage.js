const KEY = 'PAWHOME_ADOPTIONS'
const PICK_KEY = 'PAWHOME_ADOPTION_PICK'
const LAST_ID = 'PAWHOME_LAST_ADOPTION_ID'

const DEFAULT_PET_IMG = '/static/home-feed-1.png'
const DEFAULT_OWNER_IMG = '/static/figma/home/yard-avatar.png'

export const ADOPTION_STATUS_META = Object.freeze({
	pending: { text: '等待院主审核', tone: 'red', dot: true },
	rejected: { text: '申请拒绝', tone: 'red', dot: true },
	pickup: { text: '待你前去领养', tone: 'green', dot: true },
	owner_confirm: { text: '待院主确认', tone: 'green', dot: true },
	jury_confirm: { text: '待评审团确认', tone: 'green', dot: true },
	reward: { text: '获得奖励待领取', tone: 'green', dot: true },
	reward_done: { text: '奖励已领取', tone: 'grey', dot: false },
	abandoned: { text: '已放弃领养', tone: 'grey', dot: false }
})

/** 领养状态只允许沿业务流程前进；同状态更新用于补充证实照片、地址等字段。 */
export const ADOPTION_TRANSITIONS = Object.freeze({
	pending: Object.freeze(['pickup', 'rejected', 'abandoned']),
	pickup: Object.freeze(['owner_confirm', 'abandoned']),
	owner_confirm: Object.freeze(['jury_confirm', 'rejected', 'abandoned']),
	jury_confirm: Object.freeze(['reward', 'rejected', 'abandoned']),
	reward: Object.freeze(['reward_done', 'abandoned']),
	reward_done: Object.freeze([]),
	rejected: Object.freeze([]),
	abandoned: Object.freeze([])
})

const DEMO_APPLY_TEXT =
	'你好我是一个学生虽然我是一个学生但是我家里面有地方可以养猫我本人喜欢养猫我的家人也喜欢养猫，还有我小时候有养猫的经验，相信我可以把猫养好，我的家人都支持我养猫，会给我经济支持。'

const DEMO_CONFIRM_STORY =
	'我第一次去的时候小猫一直躲着我，去了几次都没有逮到。后来我买了一个网，趁着小猫睡着的时候一个网兜给盖上去了，终于把小猫猫带回家了。'

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
		confirmStory: DEMO_CONFIRM_STORY
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
		status: normalizeId(record.status) || 'pending',
		pets: sourcePets.map(normalizePet).filter(Boolean),
		mediaPaths: Array.isArray(record.mediaPaths) ? [...record.mediaPaths] : [],
		yardName: normalizeId(record.yardName || record.ownerName) || '小院',
		ownerName: normalizeId(record.ownerName || record.yardName) || '院主',
		yardTag: normalizeId(record.yardTag) || '小院',
		ownerAvatar: normalizeId(record.ownerAvatar) || DEFAULT_OWNER_IMG,
		ownerPawId: normalizeId(record.ownerPawId),
		applicantName: normalizeId(record.applicantName) || '逢猫'
	}
}

export function getAdoptions() {
	const raw = readJSON(KEY, [])
	if (!Array.isArray(raw)) return []
	return raw.map(normalizeAdoptionRecord).filter(Boolean)
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
		return true
	}

	const demo = getDemoAdoptions().find((item) => item.id === recordId)
	if (!demo) return false
	const localCopy = normalizeAdoptionRecord({ ...demo, ...(patch || {}), id: recordId })
	if (!localCopy) return false
	saved.unshift(localCopy)
	saveAdoptions(saved)
	return true
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
	return updateAdoption(record.id, { ...patch, status: nextStatus }) ? getAdoptionById(record.id) : null
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
	return DEMO_ADOPTIONS.map(normalizeAdoptionRecord).filter(Boolean)
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
