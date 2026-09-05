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

function createDemoRescue(index, status, statusText) {
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
			{ id: `${id}-pet-1`, name: `救助猫咪${index}`, avatar: '/static/figma/pets/pet-orange.png' },
			{ id: `${id}-pet-2`, name: `陪伴猫咪${index}`, avatar: '/static/figma/pets/pet-dog.png' },
		],
		evidenceCount: 22 + index,
		proofList: index === 1 ? [
			{ id: `${id}-proof-1`, name: '焦俊梅', avatar: '/static/figma/pets/pet-orange.png', story: '情况属实，希望大家投票为真实救助。', createdAt: '昨天 20:45' },
			{ id: `${id}-proof-2`, name: '张梦梦', avatar: '/static/figma/pets/pet-dog.png', story: '我去现场看过，情况属实。', createdAt: '昨天 20:46' },
		] : [],
		applicantName: ownerName,
		ownerAvatar: avatar,
		description,
		createdAt: `2026.02.${String(Math.max(10, 22 - Math.floor((index - 1) / 4))).padStart(2, '0')}`,
		views: 2956 + index * 17,
	}
}

const DEMO_RESCUES = RESCUE_REVIEW_STATUSES.reduce((records, definition) => {
	const startIndex = records.length + 1
	return records.concat(Array.from({ length: definition.count }, (_, offset) => (
		createDemoRescue(startIndex + offset, definition.status, definition.statusText)
	)))
}, [])

function normalizeId(value) {
	return value === undefined || value === null ? '' : String(value).trim()
}

function readJSON(key, fallback) {
	try {
		const raw = uni.getStorageSync(key)
		if (!raw) return fallback
		return typeof raw === 'string' ? JSON.parse(raw) : raw
	} catch (error) {
		return fallback
	}
}

function normalizeMedia(value) {
	if (!Array.isArray(value)) return []
	return value.map(normalizeId).filter(Boolean)
}

function normalizeAnimal(animal, index, rescueId) {
	if (!animal || typeof animal !== 'object') return null
	return {
		...animal,
		id: normalizeId(animal.id || animal.petId) || `${rescueId}-pet-${index}`,
		name: normalizeId(animal.name) || '猫咪',
		avatar: normalizeId(animal.avatar || animal.image) || DEFAULT_PET_AVATAR,
	}
}

function normalizeApplicant(value, record) {
	const source = value && typeof value === 'object' ? value : {}
	const name = normalizeId(source.name || record.applicantName) || '逢猫'
	return {
		...source,
		id: normalizeId(source.id || source.pawId || record.applicantId),
		name,
		avatar: normalizeId(source.avatar || record.ownerAvatar) || DEFAULT_APPLICANT_AVATAR,
	}
}

function normalizeReceiver(value, record) {
	if (value && typeof value === 'object') {
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

function normalizeProof(proof, index, rescueId) {
	if (!proof || typeof proof !== 'object') return null
	const text = normalizeId(proof.text || proof.story || proof.confirmStory || proof.content)
	const createdAt = normalizeId(proof.createdAt || proof.meta || proof.createdAtText) || '刚刚'
	return {
		...proof,
		id: normalizeId(proof.id) || `${rescueId}-proof-${index}`,
		name: normalizeId(proof.name || proof.userName) || '匿名用户',
		avatar: normalizeId(proof.avatar || proof.userAvatar) || DEFAULT_APPLICANT_AVATAR,
		media: normalizeMedia(proof.media || proof.mediaPaths || proof.proofPhotos),
		level: Number(proof.level) || 1,
		story: text,
		text,
		meta: normalizeId(proof.meta) || createdAt,
		createdAt,
		likes: Number(proof.likes ?? proof.likeCount ?? 0) || 0,
	}
}

export function normalizeRescueRecord(record) {
	if (!record || typeof record !== 'object') return null
	const id = normalizeId(record.id || record.rescueId)
	if (!id) return null
	const applicant = normalizeApplicant(record.applicant, record)
	const animals = (Array.isArray(record.animals) ? record.animals : record.pets || [])
		.map((animal, index) => normalizeAnimal(animal, index, id)).filter(Boolean)
	const proofList = (Array.isArray(record.proofList) ? record.proofList : [])
		.map((proof, index) => normalizeProof(proof, index, id)).filter(Boolean)
	const amount = Number(record.amount)
	const status = normalizeId(record.status) || 'pending'
	const statusText = normalizeId(record.statusText) || (status === 'paid' ? '打款成功' : '待投票')
	const ownerName = normalizeId(record.ownerName || applicant.name) || '逢猫'
	const ownerAvatar = normalizeId(record.ownerAvatar || applicant.avatar) || DEFAULT_APPLICANT_AVATAR
	const ownerLevel = Number(record.ownerLevel || applicant.level) || 1
	const mediaPaths = normalizeMedia(
		Array.isArray(record.mediaPaths) && record.mediaPaths.length ? record.mediaPaths : record.media
	)
	const summary = normalizeId(record.summary || record.description || record.applyText)
	const detail = normalizeId(record.detail || record.description || record.applyText || summary)
	const createdAt = record.createdAt || Date.now()
	const applicantRows = Array.isArray(record.applicantRows) && record.applicantRows.length
		? record.applicantRows
		: [
			{ label: '求助人姓名', value: `${applicant.name}　已实名` },
			{ label: '求助人年龄', value: normalizeId(record.applicantAge) || '23' },
			{ label: '求助人身份', value: normalizeId(record.applicantIdentity) || '学生' },
			{ label: '求助所在地', value: normalizeId(record.location) || '安徽省合肥市蜀山区海恒社区' },
		]
	return {
		...record,
		id,
		rescueId: id,
		status,
		statusText,
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
		applicantRows,
	}
}

function getSavedRescues() {
	const raw = readJSON(KEY, [])
	return Array.isArray(raw) ? raw.map(normalizeRescueRecord).filter(Boolean) : []
}

function saveRescues(list) {
	const normalized = Array.isArray(list) ? list.map(normalizeRescueRecord).filter(Boolean) : []
	uni.setStorageSync(KEY, JSON.stringify(normalized))
	return normalized
}

function createRescueId() {
	return `rescue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** Returns local records first and stable demo records as a fallback for a fresh/cleared simulator. */
export function getRescueRecords(options = {}) {
	const includeDemo = options !== false && options.includeDemo !== false
	const byId = new Map()
	getSavedRescues().forEach((record) => byId.set(record.id, record))
	if (includeDemo) {
		DEMO_RESCUES.map(normalizeRescueRecord).filter(Boolean).forEach((record) => {
			if (!byId.has(record.id)) byId.set(record.id, record)
		})
	}
	return Array.from(byId.values())
}

export function getRescueById(id, options = {}) {
	const rescueId = normalizeId(id)
	if (!rescueId) return null
	return getRescueRecords(options).find((record) => record.id === rescueId || record.rescueId === rescueId) || null
}

/**
 * Local permission seam for rescue management actions. The demo has no
 * authenticated backend actor, so callers must pass the current actor id and
 * optional trusted role names explicitly. Browsing and submitting proof do
 * not use this helper; only future owner/moderator mutations should use it.
 */
export function canManageRescue(idOrRecord, actorId, roles = []) {
	const record = idOrRecord && typeof idOrRecord === 'object'
		? normalizeRescueRecord(idOrRecord)
		: getRescueById(idOrRecord)
	const actor = normalizeId(actorId)
	const roleList = (Array.isArray(roles) ? roles : [roles]).map(normalizeId)
	if (!record || !actor) return false
	return roleList.includes('admin') || roleList.includes('moderator')
		|| actor === normalizeId(record.ownerPawId)
		|| actor === normalizeId(record.applicant && record.applicant.id)
}

/** The review-level figures are shared by every rescue-review view. Record data
 * drives the review cards; it must not create a second page-local mock source. */
export function getRescueReviewSummary(records = getRescueRecords()) {
	const list = Array.isArray(records) ? records : []
	const count = (status) => list.filter((record) => record.status === status).length
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
export function createRescue(input = {}) {
	const source = input && typeof input === 'object' ? input : {}
	const id = normalizeId(source.id || source.rescueId) || createRescueId()
	const record = normalizeRescueRecord({
		...source,
		id,
		rescueId: id,
		status: source.status || 'pending',
		statusText: source.statusText || '待投票',
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

/** Appends one independent proof submission and keeps evidenceCount in sync. */
export function addRescueProof(id, submission = {}) {
	const rescueId = normalizeId(id)
	if (!rescueId) return null
	const current = getRescueById(rescueId)
	if (!current) return null
	const proof = normalizeProof({ ...submission, id: submission.id || `${rescueId}-proof-${Date.now()}` }, current.proofList.length, rescueId)
	if (!proof) return null
	const nextRecord = {
		...current,
		proofList: current.proofList.concat(proof),
		evidenceCount: Math.max(Number(current.evidenceCount) || 0, current.proofList.length) + 1,
	}
	const saved = getSavedRescues().filter((item) => item.id !== rescueId)
	saved.unshift(normalizeRescueRecord(nextRecord))
	saveRescues(saved)
	return getRescueById(rescueId, { includeDemo: false })
}
