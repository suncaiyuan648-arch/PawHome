/**
 * 评审团领域 mock 数据。
 *
 * 页面不应该分别拼装申请人、院主、宠物和证据数据；后续接入接口时，
 * 只需要把接口结果归一化为这里约定的字段形状即可。
 */

import { getPawHomeYardPetById, getPawHomeYardPets } from '@/utils/yardMock.js'

export const JURY_VOTE_VALUES = Object.freeze({
	real: 'real',
	fake: 'fake'
})

export const JURY_WORKFLOW_STATUS = Object.freeze({
	open: 'open',
	closed: 'closed'
})

export const JURY_ITEM_STATUS = Object.freeze({
	pending: 'pending',
	voted: 'voted',
	closed: 'closed'
})

/**
 * 默认不启用次数拦截。需要演示拦截场景时，由 juryStorage 显式打开。
 */
export const JURY_MOCK_DEFAULTS = Object.freeze({
	voteLimitEnabled: false,
	dailyVoteLimit: 3,
	usedVotesToday: 0,
	pendingCount: 86,
	finishedCount: 9896
})

const DEFAULT_AVATAR = '/static/figma/jury-db5da0781d7667c3490af5cfa74dd2fc7cf1ac01.png'
const DEFAULT_PET_AVATAR = '/static/home-feed-1.png'
const DEFAULT_EVIDENCE_IMAGE = '/static/figma/jury-e81f2c2074a7772e8fbca3d3828b3a751f5cb5bb.png'

const APPLY_TEXT =
	'我第一次去的时候小猫一直躲着我，去了几次都没有逮到。后来我买了一个网，趁着小猫睡着的时候一个网兜给盖上去了，终于把小猫猫带回家了。'

const APPLICANT_TEXT =
	'你好我是一个学生，家里面有地方可以养猫，我本人和家人都喜欢猫，也有养猫经验，相信我可以把猫照顾好。'

function deepFreeze(value) {
	if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
	Object.keys(value).forEach((key) => deepFreeze(value[key]))
	return Object.freeze(value)
}

function clone(value) {
	return JSON.parse(JSON.stringify(value))
}

function stringValue(value, fallback = '') {
	if (value === undefined || value === null) return fallback
	const result = String(value).trim()
	return result || fallback
}

function numberValue(value, fallback = 0) {
	const result = Number(value)
	return Number.isFinite(result) ? result : fallback
}

function integerValue(value, fallback = 0) {
	return Math.max(0, Math.round(numberValue(value, fallback)))
}

function normalizeVote(value) {
	const result = stringValue(value).toLowerCase()
	return result === JURY_VOTE_VALUES.real || result === JURY_VOTE_VALUES.fake ? result : ''
}

function normalizeWorkflowStatus(value) {
	const result = stringValue(value).toLowerCase()
	return ['closed', 'ended', 'finished', 'done'].includes(result)
		? JURY_WORKFLOW_STATUS.closed
		: JURY_WORKFLOW_STATUS.open
}

function normalizeIdentity(identity, fallback = {}) {
	const source = identity && typeof identity === 'object' ? identity : {}
	const id = stringValue(source.id || source.pawId || source.userId, fallback.id || '')
	return {
		...fallback,
		...source,
		id,
		pawId: stringValue(source.pawId || source.id || source.userId, fallback.pawId || id),
		name: stringValue(source.name || source.nickname, fallback.name || '逢猫用户'),
		nickname: stringValue(source.nickname || source.name, fallback.nickname || source.name || '逢猫用户'),
		avatar: stringValue(source.avatar, fallback.avatar || DEFAULT_AVATAR),
		level: integerValue(source.level, fallback.level || 1)
	}
}

function normalizePet(pet, index, itemId) {
	const source = pet && typeof pet === 'object' ? pet : { name: pet }
	const sourcePetCandidate = stringValue(source.yardPetId || source.sourcePetId || source.petId)
	const yardPet = sourcePetCandidate ? getPawHomeYardPetById(sourcePetCandidate) : null
	const sourcePetId = yardPet ? yardPet.id : stringValue(source.yardPetId || source.sourcePetId)
	const id = stringValue(source.id || source.petId || source.key, `${itemId}-pet-${index + 1}`)
	return {
		...source,
		id,
		petId: stringValue(source.petId, sourcePetId || id),
		sourcePetId,
		yardPetId: sourcePetId,
		name: stringValue(source.name, yardPet?.name || '猫咪'),
		avatar: stringValue(source.avatar, yardPet?.avatar || DEFAULT_PET_AVATAR),
		species: stringValue(source.species, yardPet?.species || 'cat'),
		status: stringValue(source.status, '待领养')
	}
}

function normalizeEvidence(evidence, index, itemId) {
	const source = evidence && typeof evidence === 'object' ? evidence : { src: evidence }
	const id = stringValue(source.id || source.evidenceId, `${itemId}-evidence-${index + 1}`)
	const src = stringValue(source.src || source.url || source.path, DEFAULT_EVIDENCE_IMAGE)
	return {
		...source,
		id,
		evidenceId: stringValue(source.evidenceId, id),
		type: stringValue(source.type, 'image'),
		src,
		url: stringValue(source.url, src),
		date: stringValue(source.date || source.createdAt, '2026.01.03'),
		label: stringValue(source.label || source.title, index === 0 ? '来到逢猫' : '有家啦')
	}
}

function normalizeVoteStats(stats = {}) {
	const source = stats && typeof stats === 'object' ? stats : {}
	const realCount = integerValue(source.realCount ?? source.realVotes ?? source.real, 0)
	const fakeCount = integerValue(source.fakeCount ?? source.fakeVotes ?? source.fake, 0)
	const suppliedTotal = integerValue(source.total ?? source.totalCount, 0)
	const total = Math.max(realCount + fakeCount, suppliedTotal)
	const realPercent = total ? Math.round((realCount / total) * 100) : 0
	const fakePercent = total ? 100 - realPercent : 0
	return {
		...source,
		realCount,
		fakeCount,
		total,
		realPercent,
		fakePercent,
		real: realPercent,
		fake: fakePercent
	}
}

function normalizeReward(reward = {}, itemId = 'jury') {
	const source = reward && typeof reward === 'object' ? reward : {}
	return {
		...source,
		id: stringValue(source.id || source.rewardId, `${itemId}-reward`),
		label: stringValue(source.label, '获得5斤猫粮'),
		amount: numberValue(source.amount, 5),
		unit: stringValue(source.unit, '斤')
	}
}

/**
 * 把投票后的本地状态投影到 item 上。
 * workflowStatus 表示评审任务本身是否结束，status 表示当前用户可见的列表状态。
 */
export function normalizeJuryItem(item, localVote = '') {
	if (!item || typeof item !== 'object') return null
	const source = item
	const id = stringValue(source.id || source.itemId || source.reviewId)
	if (!id) return null

	const applicant = normalizeIdentity(source.applicant || {
		id: source.applicantId,
		name: source.applicantName,
		avatar: source.applicantAvatar
	}, { id: `${id}-applicant`, name: '逢猫', avatar: DEFAULT_AVATAR, level: 1 })
	const owner = normalizeIdentity(source.owner || source.yardOwner || {
		id: source.ownerId || source.ownerPawId,
		name: source.ownerName,
		avatar: source.ownerAvatar
	}, { id: `${id}-owner`, name: '我就是要喂猫', avatar: '/static/figma/home/yard-avatar.png', level: 1 })
	const petsSource = Array.isArray(source.pets) ? source.pets : source.pet ? [source.pet] : []
	const pets = petsSource.map((pet, index) => normalizePet(pet, index, id))
	const evidenceSource = Array.isArray(source.evidence)
		? source.evidence
		: Array.isArray(source.evidenceList)
			? source.evidenceList
			: Array.isArray(source.mediaPaths)
				? source.mediaPaths
				: []
	const evidence = evidenceSource.map((entry, index) => normalizeEvidence(entry, index, id))
	const detailEvidenceSource = Array.isArray(source.detailEvidence) ? source.detailEvidence : evidence
	const detailEvidence = detailEvidenceSource.map((entry, index) => normalizeEvidence(entry, index, `${id}-detail`))
	const applicationSource = source.application && typeof source.application === 'object' ? source.application : {}
	const applicationId = stringValue(
		applicationSource.id || applicationSource.applicationId || source.applicationId || source.recordId,
		`${id}-application`
	)
	const vote = normalizeVote(localVote || source.vote || source.selectedVote)
	const workflowStatus = normalizeWorkflowStatus(source.workflowStatus || source.lifecycleStatus || source.sourceStatus || source.status)
	const status = workflowStatus === JURY_WORKFLOW_STATUS.closed
		? JURY_ITEM_STATUS.closed
		: vote
			? JURY_ITEM_STATUS.voted
			: JURY_ITEM_STATUS.pending
	const voteStats = normalizeVoteStats(source.voteStats || source.votes)
	const yardId = stringValue(source.yardId || source.owner?.yardId, '1')
	const yardName = stringValue(source.yardName || source.owner?.yardName, '我就是要喂猫')

	return {
		...source,
		id,
		itemId: id,
		reviewId: id,
		reviewType: ['rescue', 'adoption'].includes(stringValue(source.reviewType || source.juryType))
			? stringValue(source.reviewType || source.juryType)
			: 'adoption',
		applicationId,
		recordId: stringValue(source.recordId, applicationId),
		workflowStatus,
		status,
		vote,
		selectedVote: vote,
		hasVoted: Boolean(vote),
		applicant,
		applicantId: applicant.id,
		applicantName: applicant.name,
		applicantAvatar: applicant.avatar,
		owner,
		ownerId: owner.id,
		ownerPawId: owner.pawId,
		ownerName: owner.name,
		ownerAvatar: owner.avatar,
		yard: {
			id: yardId,
			name: yardName,
			ownerId: owner.id,
			ownerName: owner.name,
			avatar: stringValue(source.yard?.avatar, owner.avatar),
			location: stringValue(source.location || source.yard?.location, '合肥市希望流浪动物基地')
		},
		yardId,
		yardName,
		pets,
		pet: pets[0] || null,
		evidence,
		detailEvidence,
		application: {
			...applicationSource,
			id: applicationId,
			text: stringValue(applicationSource.text || applicationSource.applyText || source.applyText, APPLICANT_TEXT),
			media: Array.isArray(applicationSource.media)
				? applicationSource.media.map((entry, index) => normalizeEvidence(entry, index, `${id}-application`))
				: []
		},
		applyText: stringValue(source.applyText || applicationSource.text, APPLICANT_TEXT),
		voteStats,
		voteStatistics: voteStats,
		reward: normalizeReward(source.reward, id)
	}
}

const RAW_JURY_ITEMS = [
	{
		id: 'jury-item-001',
		reviewType: 'rescue',
		applicationId: 'jury-application-001',
		recordId: 'demo-jury-confirm',
		workflowStatus: 'open',
		createdAt: '2026-02-22T09:18:00+08:00',
		applicant: { id: 'jury-applicant-001', pawId: 'jury-applicant-001', name: '逢猫', avatar: DEFAULT_AVATAR, level: 1 },
		summary: '今天不做课间操了，开一个紧急例会，就在昨天，发生了一件骇人听闻的学生袭击老师事件',
		applyText: APPLY_TEXT,
		owner: {
			id: 'jury-owner-001',
			pawId: 'yard-card-owner',
			name: '我就是要喂猫',
			avatar: '/static/figma/home/yard-avatar.png',
			level: 1,
			yardId: '1',
			yardName: '我就是要喂猫'
		},
		yard: { id: '1', name: '我就是要喂猫', location: '合肥市希望流浪动物基地' },
		pets: [
			{ id: 'jury-pet-001', yardPetId: 'roster-cat-1', name: '奥利奥', avatar: '/static/figma/pets/pet-orange.png', species: 'cat' },
			{ id: 'jury-pet-002', yardPetId: 'roster-dog-1', name: '呗呗', avatar: '/static/figma/pets/pet-dog.png', species: 'dog' }
		],
		evidence: [
			{ id: 'jury-evidence-001-a', src: '/static/figma/jury-d0a23847642d582320e26f7499c0a5c51acf5a86.jpg', date: '2026.01.03', label: '来到逢猫' },
			{ id: 'jury-evidence-001-b', src: '/static/figma/jury-e81f2c2074a7772e8fbca3d3828b3a751f5cb5bb.png', date: '2026.01.03', label: '有家啦' }
		],
		detailEvidence: [
			{ id: 'jury-detail-evidence-001-a', src: '/static/figma/jury-e81f2c2074a7772e8fbca3d3828b3a751f5cb5bb.png', date: '2026.01.03', label: '来到逢猫' },
			{ id: 'jury-detail-evidence-001-b', src: '/static/figma/jury-e81f2c2074a7772e8fbca3d3828b3a751f5cb5bb.png', date: '2026.01.03', label: '有家啦' }
		],
		application: {
			id: 'jury-application-001',
			text: APPLICANT_TEXT,
			media: [
				{ id: 'jury-application-media-001', src: '/static/figma/feature/04a93fa17267335f49e6e818f8caa78dd3afc80b.png' },
				{ id: 'jury-application-media-002', src: '/static/figma/jury-applicant-room.png' }
			]
		},
		voteStats: { realCount: 92, fakeCount: 8 },
		reward: { id: 'jury-reward-001', label: '获得5斤猫粮', amount: 5, unit: '斤' }
	},
	{
		id: 'jury-item-002',
		reviewType: 'adoption',
		applicationId: 'jury-application-002',
		recordId: 'demo-jury-confirm-002',
		workflowStatus: 'open',
		createdAt: '2026-02-22T10:06:00+08:00',
		applicant: { id: 'jury-applicant-002', pawId: 'jury-applicant-002', name: '逢猫', avatar: DEFAULT_AVATAR, level: 1 },
		summary: '今天不做课间操了，开一个紧急例会，就在昨天，发生了一件骇人听闻的学生袭击老师事件',
		applyText: APPLY_TEXT,
		owner: {
			id: 'jury-owner-001',
			pawId: 'yard-card-owner',
			name: '我就是要喂猫',
			avatar: '/static/figma/home/yard-avatar.png',
			level: 1,
			yardId: '1',
			yardName: '我就是要喂猫'
		},
		yard: { id: '1', name: '我就是要喂猫', location: '合肥市希望流浪动物基地' },
		pets: [{ id: 'jury-pet-003', yardPetId: 'roster-cat-2', name: '小毛球', avatar: '/static/figma/yard-cats/cat-avatar.png', species: 'cat' }],
		evidence: [
			{ id: 'jury-evidence-002-a', src: '/static/figma/jury-d0a23847642d582320e26f7499c0a5c51acf5a86.jpg', date: '2026.01.12', label: '来到逢猫' },
			{ id: 'jury-evidence-002-b', src: '/static/figma/jury-e81f2c2074a7772e8fbca3d3828b3a751f5cb5bb.png', date: '2026.01.20', label: '有家啦' }
		],
		detailEvidence: [
			{ id: 'jury-detail-evidence-002-a', src: '/static/figma/jury-e81f2c2074a7772e8fbca3d3828b3a751f5cb5bb.png', date: '2026.01.03', label: '来到逢猫' },
			{ id: 'jury-detail-evidence-002-b', src: '/static/figma/jury-e81f2c2074a7772e8fbca3d3828b3a751f5cb5bb.png', date: '2026.01.03', label: '有家啦' }
		],
		application: {
			id: 'jury-application-002',
			text: '我有稳定的居住环境和照顾宠物的经验，已经和家人沟通好，希望给小猫一个长期稳定的家。',
			media: [{ id: 'jury-application-media-003', src: '/static/figma/jury-applicant-room.png' }]
		},
		voteStats: { realCount: 68, fakeCount: 32 },
		reward: { id: 'jury-reward-002', label: '获得3斤猫粮', amount: 3, unit: '斤' }
	},
	{
		id: 'jury-item-003',
		reviewType: 'adoption',
		applicationId: 'jury-application-003',
		recordId: 'demo-jury-confirm-003',
		workflowStatus: 'closed',
		createdAt: '2026-02-22T10:06:00+08:00',
		applicant: { id: 'jury-applicant-003', pawId: 'jury-applicant-003', name: '逢猫', avatar: DEFAULT_AVATAR, level: 1 },
		owner: {
			id: 'jury-owner-001',
			pawId: 'yard-card-owner',
			name: '我就是要喂猫',
			avatar: '/static/figma/home/yard-avatar.png',
			level: 1,
			yardId: '1',
			yardName: '我就是要喂猫'
		},
		yard: { id: '1', name: '我就是要喂猫', location: '合肥市希望流浪动物基地' },
		pets: [{ id: 'jury-pet-004', yardPetId: 'roster-cat-3', name: '花春晓', avatar: '/static/figma/pets/pet-orange.png', species: 'cat' }],
		evidence: [
			{ id: 'jury-evidence-003-a', src: '/static/figma/jury-d0a23847642d582320e26f7499c0a5c51acf5a86.jpg', date: '2026.01.08', label: '领养记录' },
			{ id: 'jury-evidence-003-b', src: '/static/figma/jury-e81f2c2074a7772e8fbca3d3828b3a751f5cb5bb.png', date: '2026.01.08', label: '回访记录' }
		],
		application: { id: 'jury-application-003', text: '已完成线下领养，相关材料和回访记录均已提交。', media: [] },
		voteStats: { realCount: 50, fakeCount: 50 },
		reward: { id: 'jury-reward-003', label: '获得5斤猫粮', amount: 5, unit: '斤' }
	}
]

/**
 * 补充可重复的未完成评审数据，分别提供 8 条救助评审和 8 条领养评审。
 * 前两条保留为基础演示记录，额外记录从对应模板派生，所有业务关联 ID 均唯一。
 */
function createPendingJuryItem(index, reviewType, template) {
	const sequence = String(index).padStart(2, '0')
	const id = `jury-${reviewType}-${sequence}`
	const applicationId = `${id}-application`
	const applicantId = `${id}-applicant`
	const isRescue = reviewType === 'rescue'
	const applicantName = isRescue ? `救助申请人${index}` : `领养申请人${index}`
	const summary = isRescue
		? '这是一条待评审的救助申请，请核实救助情况和相关材料。'
		: '这是一条待评审的领养申请，请核实申请人的领养意愿和照护条件。'
	const applyText = isRescue
		? '申请人提交了救助说明和现场材料，邀请评审团核实本次救助是否真实。'
		: '申请人提交了领养申请和家庭情况，邀请评审团核实是否为真实领养。'
	const evidence = (template.evidence || []).map((entry, evidenceIndex) => ({
		...entry,
		id: `${id}-evidence-${evidenceIndex + 1}`
	}))
	const detailEvidence = (template.detailEvidence || evidence).map((entry, evidenceIndex) => ({
		...entry,
		id: `${id}-detail-evidence-${evidenceIndex + 1}`
	}))
	const applicationMedia = ((template.application && template.application.media) || []).map((entry, mediaIndex) => ({
		...entry,
		id: `${id}-application-media-${mediaIndex + 1}`
	}))
	const yardPets = getPawHomeYardPets().filter((pet) => pet.species === 'cat')
	const sourcePet = yardPets[(index - 1) % yardPets.length] || template.pets?.[0] || null

	return {
		id,
		reviewType,
		applicationId,
		recordId: `${id}-record`,
		workflowStatus: 'open',
		createdAt: `2026-02-${String(22 + index).padStart(2, '0')}T09:00:00+08:00`,
		applicant: {
			...template.applicant,
			id: applicantId,
			pawId: applicantId,
			name: applicantName,
			nickname: applicantName
		},
		summary,
		applyText,
		owner: { ...template.owner },
		yard: { ...template.yard },
		pets: [{
			id: `${id}-pet-01`,
			petId: sourcePet?.id || '',
			sourcePetId: sourcePet?.id || '',
			yardPetId: sourcePet?.id || '',
			name: sourcePet?.name || (isRescue ? `待救助猫咪${index}` : `待领养猫咪${index}`),
			avatar: sourcePet?.avatar || template.pets?.[0]?.avatar || DEFAULT_PET_AVATAR,
			species: sourcePet?.species || template.pets?.[0]?.species || 'cat'
		}],
		evidence,
		detailEvidence,
		application: {
			id: applicationId,
			text: applyText,
			media: applicationMedia
		},
		voteStats: { realCount: 92, fakeCount: 8 },
		reward: { id: `${id}-reward`, label: '获得5斤猫粮', amount: 5, unit: '斤' }
	}
}

const GENERATED_JURY_ITEMS = [
	...Array.from({ length: 7 }, (_, index) => createPendingJuryItem(index + 1, 'rescue', RAW_JURY_ITEMS[0])),
	...Array.from({ length: 7 }, (_, index) => createPendingJuryItem(index + 1, 'adoption', RAW_JURY_ITEMS[1]))
]

export const JURY_MOCK_ITEMS = deepFreeze([...RAW_JURY_ITEMS, ...GENERATED_JURY_ITEMS]
	.map((item) => normalizeJuryItem(item)))

export function getJuryMockItems(options = {}) {
	const votes = options && options.votes && typeof options.votes === 'object' ? options.votes : {}
	return JURY_MOCK_ITEMS.map((item) => normalizeJuryItem(item, votes[item.id]))
}

export function getJuryMockItemById(id, options = {}) {
	const itemId = stringValue(id)
	if (!itemId) return null
	return getJuryMockItems(options).find((item) => item.id === itemId) || null
}

export function getJuryMockConfig(overrides = {}) {
	const source = overrides && typeof overrides === 'object' ? overrides : {}
	return {
		...JURY_MOCK_DEFAULTS,
		...source,
		voteLimitEnabled: source.voteLimitEnabled === true,
		dailyVoteLimit: integerValue(source.dailyVoteLimit, JURY_MOCK_DEFAULTS.dailyVoteLimit),
		usedVotesToday: integerValue(source.usedVotesToday, JURY_MOCK_DEFAULTS.usedVotesToday),
		pendingCount: integerValue(source.pendingCount, JURY_MOCK_DEFAULTS.pendingCount),
		finishedCount: integerValue(source.finishedCount, JURY_MOCK_DEFAULTS.finishedCount)
	}
}

export function normalizeJuryVote(value) {
	return normalizeVote(value)
}

export function cloneJuryValue(value) {
	return clone(value)
}
