/**
 * 领养审核列表 mock 接口。
 * 真实接口接入时只替换这里，页面继续依赖相同的返回结构。
 */
import { getAdoptionRecords } from './adoptionStorage.js'

export const ADOPTION_REVIEW_TABS = Object.freeze({
	pending: 'pending',
	reviewed: 'reviewed'
})

export const ADOPTION_REVIEW_STATUS_META = Object.freeze({
	cloudPending: { label: '待云家长审批', tab: 'pending', tone: 'neutral', role: 'cloud_parent', detailMode: 'cloudReview' },
	ownerPending: { label: '待院主审批', tab: 'pending', tone: 'neutral', role: 'owner', detailMode: 'ownerReview' },
	ownerConfirmPending: { label: '待院主确认', tab: 'pending', tone: 'neutral', role: 'owner', detailMode: 'ownerConfirm' },
	cloudApproved: { label: '云家长已同意', tab: 'reviewed', tone: 'success', role: 'cloud_parent', detailMode: 'cloudAgreeDone' },
	ownerApproved: { label: '院主已同意', tab: 'reviewed', tone: 'success', role: 'owner', detailMode: 'ownerPending' },
	ownerConfirmed: { label: '院主已确认', tab: 'reviewed', tone: 'success', role: 'owner', detailMode: 'ownerConfirmed' },
	cloudRejected: { label: '云家长已拒绝', tab: 'reviewed', tone: 'danger', role: 'cloud_parent', detailMode: 'cloudRejectDone' },
	ownerRejected: { label: '院主已拒绝', tab: 'reviewed', tone: 'danger', role: 'owner', detailMode: 'rejectDone' },
	ownerConfirmRejected: { label: '院主已驳回', tab: 'reviewed', tone: 'danger', role: 'owner', detailMode: 'ownerConfirmRejected' }
})

/**
 * 列表展示态也走 mock 接口，不让页面根据审批单当前状态自行拼卡片。
 * 同一个审批单可以有多次审批记录；getAdoptionReviewList 会按审批单合并，
 * 只保留一张卡片并累积 reviewHistory。
 */
const REVIEW_CONFIG = Object.freeze([
	...createReviewConfigs('review-v2-cloud-pending', 2, 'cloudPending'),
	...createReviewConfigs('review-v2-owner-pending', 2, 'ownerPending'),
	...createReviewConfigs('review-v2-owner-confirm-pending', 2, 'ownerConfirmPending'),
	...createReviewConfigs('review-v2-cloud-approved', 2, 'cloudApproved'),
	...createReviewConfigs('review-v2-owner-approved', 2, 'ownerApproved'),
	...createReviewConfigs('review-v2-owner-confirmed', 2, 'ownerConfirmed'),
	...createReviewConfigs('review-v2-cloud-rejected', 2, 'cloudRejected'),
	...createReviewConfigs('review-v2-owner-rejected', 2, 'ownerRejected'),
	...createReviewConfigs('review-v2-owner-confirm-rejected', 2, 'ownerConfirmRejected')
])

function createReviewConfigs(prefix, count, statusKey) {
	const meta = ADOPTION_REVIEW_STATUS_META[statusKey]
	if (!meta) return []
	return Array.from({ length: count }, (_, index) => ({
		recordId: `${prefix}-${index + 1}`,
		role: meta.role,
		reviewerId: meta.role === 'cloud_parent' ? '2876598765' : 'yard_card_owner',
		tab: meta.tab,
		detailMode: meta.detailMode,
		statusKey,
		statusText: meta.label,
		statusTone: meta.tone,
		sequence: statusKey === 'ownerConfirmed' ? 2 : 1
	}))
}

function normalizeId(value) {
	return value === undefined || value === null ? '' : String(value).trim()
}

function isCloudParentRole(role) {
	return ['cloud_parent', 'cloud-parent', 'cloud'].includes(normalizeId(role).toLowerCase())
}

function isReviewRecordInConfiguredState(record, config) {
	if (!record || !config) return false
	const status = normalizeId(record.status)
	const stage = normalizeId(record.failureStage)
	const reviewerApproved = Array.isArray(record.cloudParentApprovals)
		&& record.cloudParentApprovals.includes(config.reviewerId)

	if (config.tab === ADOPTION_REVIEW_TABS.pending) {
		if (config.detailMode === 'cloudReview') return status === 'cloud_pending' && !reviewerApproved
		if (config.detailMode === 'ownerReview') return status === 'pending'
		if (config.detailMode === 'ownerConfirm') return ['owner_confirm', 'owner_confirm_pending'].includes(status)
		return false
	}

	if (config.detailMode === 'cloudRejectDone') return status === 'rejected' && stage === 'cloud_parent'
	if (config.detailMode === 'cloudAgreeDone') {
		return (status === 'pending' && (record.approvedBy === 'cloud_parent' || reviewerApproved))
			|| (status === 'cloud_pending' && reviewerApproved)
	}
	if (config.detailMode === 'rejectDone') return status === 'rejected' && stage === 'owner_review'
	if (config.detailMode === 'ownerPending') return status === 'pickup'
	if (config.detailMode === 'ownerConfirmed') return ['jury_confirm', 'jury_confirm_pending'].includes(status)
	if (config.detailMode === 'ownerConfirmRejected') return status === 'rejected' && stage === 'owner_confirm'
	return true
}

function toReviewCard(record, config) {
	if (!record || !config) return null
	const pets = Array.isArray(record.pets) ? record.pets : []
	const cloudPets = pets.filter((pet) => pet.cloudParentPawId)
	const cloudApprovedCount = cloudPets.filter((pet) => pet.cloudReviewStatus === 'approved').length
	return {
		id: record.id,
		recordId: record.recordId || record.id,
		reviewId: config.reviewId || `${record.id}-${config.role}-${config.tab}`,
		reviewerRole: config.role,
		reviewerId: config.reviewerId,
		reviewTab: config.tab,
		detailMode: config.detailMode || '',
		sequence: Number(config.sequence) || 0,
		statusText: config.statusText || ADOPTION_REVIEW_STATUS_META[config.statusKey]?.label || (config.tab === ADOPTION_REVIEW_TABS.pending
			? (config.role === 'cloud_parent' ? '待云家长审批' : '待院主审批')
			: (config.result || '已审核')),
		statusTone: config.statusTone || ADOPTION_REVIEW_STATUS_META[config.statusKey]?.tone || (config.tab === ADOPTION_REVIEW_TABS.pending ? 'neutral' : 'neutral'),
		applicant: {
			name: record.applicantName || '逢猫',
			avatar: record.applicantAvatar || '/static/figma/home/feed-avatar.png',
			level: record.applicantLevel || 1,
			pawId: record.applicantPawId || ''
		},
		pets,
		cloudApproval: {
			required: cloudPets.length,
			approved: cloudApprovedCount,
			waiting: config.role === 'cloud_parent' && config.tab === ADOPTION_REVIEW_TABS.pending
		},
		reviewHistory: Array.isArray(config.reviewHistory)
			? [...config.reviewHistory]
			: Array.isArray(record.reviewHistory) ? [...record.reviewHistory] : [],
		yardId: record.yardId || '',
		yardName: record.yardName || record.ownerName || '小院'
	}
}

function mergeReviewCards(items) {
	const merged = new Map()
	items.forEach((item) => {
		const key = `${item.recordId}-${item.reviewerRole}-${item.reviewTab}`
		const existing = merged.get(key)
		if (!existing) {
			merged.set(key, { ...item, reviewHistory: [...(item.reviewHistory || []), item.statusText] })
			return
		}

		const history = Array.from(new Set([
			...(existing.reviewHistory || []),
			...(item.reviewHistory || []),
			item.statusText
		]))
		const shouldUseLatest = Number(item.sequence || 0) >= Number(existing.sequence || 0)
		merged.set(key, {
			...existing,
			...(shouldUseLatest ? item : {}),
			reviewHistory: history
		})
	})
	return Array.from(merged.values())
}

export function getAdoptionReviewList(options = {}) {
	const tab = options.tab === ADOPTION_REVIEW_TABS.reviewed ? ADOPTION_REVIEW_TABS.reviewed : ADOPTION_REVIEW_TABS.pending
	const role = normalizeId(options.reviewerRole || options.role).toLowerCase()
	const reviewerId = normalizeId(options.reviewerId || options.userId)
	const records = getAdoptionRecords()
	const recordMap = new Map(records.map((record) => [record.id, record]))

	const cards = REVIEW_CONFIG
		.filter((config) => config.tab === tab)
		.filter((config) => !role || role === 'all' || (isCloudParentRole(role) ? config.role === 'cloud_parent' : config.role === 'owner'))
		.filter((config) => !reviewerId || config.reviewerId === reviewerId)
		.filter((config) => isReviewRecordInConfiguredState(recordMap.get(config.recordId), config))
		.map((config) => toReviewCard(recordMap.get(config.recordId), config))
		.filter(Boolean)
	return mergeReviewCards(cards)
}

export function getAdoptionReviewById(id, options = {}) {
	const recordId = normalizeId(id)
	return getAdoptionReviewList({ ...options, tab: options.tab || ADOPTION_REVIEW_TABS.pending })
		.find((item) => item.recordId === recordId || item.id === recordId) || null
}
