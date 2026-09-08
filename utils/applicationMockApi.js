/**
 * 用户侧审批单 mock API。
 *
 * 生产后端尚未提供接口合同，因此页面只依赖这一层的统一返回形状：
 * { success, data, error }. 后续接入 request/cloud API 时替换本文件即可，
 * 不需要让页面重新实现领养/救助状态机。
 */
import {
	ADOPTION_REAPPROVAL_ENABLED,
	addAdoption,
	getAdoptionById,
	getAdoptionRecords,
	reopenAdoption,
	transitionAdoption,
	updateAdoption
} from './adoptionStorage.js'
import {
	createRescue,
	getRescueById,
	getRescueRecords,
	transitionRescueApplication,
	updateRescue
} from './rescueStorage.js'

export const APPLICATION_TYPE = Object.freeze({ adoption: 'adoption', rescue: 'rescue' })
export const MOCK_API_MODE = 'mock'
const REWARD_ORDER_KEY = 'PAWHOME_REWARD_ORDERS'

/**
 * 仅供本地超级测试员切换页面演示状态，不代表真实审批接口。
 * 失败态仍然落到 rejected 终态，保持与正式状态机相同的展示语义。
 */
export const ADOPTION_TEST_STATES = Object.freeze({
	cloudPending: 'cloud_pending',
	cloudRejected: 'cloud_rejected',
	ownerPending: 'owner_pending',
	ownerRejected: 'owner_rejected',
	ownerApproved: 'owner_approved'
})

function normalizeType(type) {
	return String(type || '').toLowerCase() === APPLICATION_TYPE.rescue
		? APPLICATION_TYPE.rescue
		: APPLICATION_TYPE.adoption
}

function normalizeId(value) {
	return value === undefined || value === null ? '' : String(value).trim()
}

function ok(data, extra = {}) {
	return { success: true, source: MOCK_API_MODE, data, error: null, ...extra }
}

function fail(code, message, data = null) {
	return { success: false, source: MOCK_API_MODE, data, error: { code, message } }
}

function readRewardOrders() {
	try {
		const raw = uni.getStorageSync(REWARD_ORDER_KEY)
		const value = typeof raw === 'string' ? JSON.parse(raw) : raw
		return Array.isArray(value) ? value : []
	} catch (error) {
		return []
	}
}

function writeRewardOrders(orders) {
	try { uni.setStorageSync(REWARD_ORDER_KEY, JSON.stringify(orders)) } catch (error) { /* mock storage is best effort */ }
}

/** 本地 mock 订单边界；后端订单接口接入后只替换这里。 */
export function createRewardOrder(recordId, address = {}) {
	const applicationId = normalizeId(recordId)
	if (!applicationId) return fail('MISSING_ID', '缺少领养单 ID')
	if (!address || !address.id) return fail('MISSING_ADDRESS', '缺少收货地址')
	const orders = readRewardOrders()
	const existing = orders.find(item => item.recordId === applicationId && item.status === 'submitted')
	if (existing) return ok(existing)
	const order = {
		id: `reward-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		recordId: applicationId,
		status: 'submitted',
		deliveryStatus: 'shipping',
		deliveryProgress: '0/3',
		address: { ...address },
		createdAt: Date.now()
	}
	orders.unshift(order)
	writeRewardOrders(orders)
	return ok(order)
}

export function getRewardOrderById(orderId) {
	const id = normalizeId(orderId)
	if (!id) return fail('MISSING_ORDER_ID', '缺少订单 ID')
	const order = readRewardOrders().find(item => item.id === id)
	return order ? ok(order) : fail('NOT_FOUND', '订单不存在')
}

export function createApplication(type, payload = {}) {
	const applicationType = normalizeType(type)
	const record = applicationType === APPLICATION_TYPE.rescue
		? createRescue({ ...payload, applicationType })
		: addAdoption({ ...payload, applicationType })
	return record ? ok(record) : fail('CREATE_FAILED', '审批单创建失败')
}

export function getApplication(type, id, options = {}) {
	const applicationType = normalizeType(type)
	const applicationId = normalizeId(id)
	if (!applicationId) return fail('MISSING_ID', '缺少审批单 ID')
	const record = applicationType === APPLICATION_TYPE.rescue
		? getRescueById(applicationId, options)
		: getAdoptionById(applicationId, options)
	return record ? ok({ ...record, applicationType }) : fail('NOT_FOUND', '审批单不存在')
}

export function getApplicationStatus(type, id, options = {}) {
	const result = getApplication(type, id, options)
	if (!result.success) return result
	const status = normalizeType(type) === APPLICATION_TYPE.rescue
		? result.data.applicationStatus
		: result.data.status
	return ok({
		id: result.data.id,
		type: normalizeType(type),
		status,
		record: result.data
	})
}

export function updateApplication(type, id, patch = {}) {
	const applicationType = normalizeType(type)
	const applicationId = normalizeId(id)
	if (!applicationId) return fail('MISSING_ID', '缺少审批单 ID')
	const record = applicationType === APPLICATION_TYPE.rescue
		? updateRescue(applicationId, patch)
		: updateAdoption(applicationId, patch)
	return record ? ok({ ...record, applicationType }) : fail('UPDATE_FAILED', '审批单更新失败')
}

export function advanceApplication(type, id, nextStatus, patch = {}) {
	const applicationType = normalizeType(type)
	const applicationId = normalizeId(id)
	if (!applicationId) return fail('MISSING_ID', '缺少审批单 ID')
	if (applicationType === APPLICATION_TYPE.adoption && normalizeId(nextStatus) === 'pending') {
		const current = getAdoptionById(applicationId)
		const requiredCloudParents = current && Array.isArray(current.cloudParentIds)
			? current.cloudParentIds.map(normalizeId).filter(Boolean)
			: []
		if (current && current.status === 'cloud_pending' && requiredCloudParents.length > 1) {
			const reviewerId = normalizeId(patch.reviewerId || patch.cloudParentPawId)
			const approvals = Array.from(new Set([
				...(Array.isArray(current.cloudParentApprovals) ? current.cloudParentApprovals : []),
				...(reviewerId ? [reviewerId] : [])
			]))
			const nextStatusValue = requiredCloudParents.every((parentId) => approvals.includes(parentId))
				? 'pending'
				: 'cloud_pending'
			const updated = updateAdoption(applicationId, {
				...patch,
				cloudParentApprovals: approvals,
				status: nextStatusValue
			})
			return updated ? ok({ ...updated, applicationType }) : fail('UPDATE_FAILED', '审核状态更新失败')
		}
	}
	const record = applicationType === APPLICATION_TYPE.rescue
		? transitionRescueApplication(applicationId, nextStatus, patch)
		: transitionAdoption(applicationId, nextStatus, patch)
	return record ? ok({ ...record, applicationType }) : fail('INVALID_TRANSITION', '当前状态不能执行该操作')
}

/**
 * 超级测试员状态切换：允许在本地 mock 中直接切换到指定演示节点，
 * 不绕过正式页面操作，也不改变生产状态机的合法转换规则。
 */
export function setAdoptionTestState(id, testState) {
	const state = normalizeId(testState)
	const statePatch = {
		[ADOPTION_TEST_STATES.cloudPending]: {
			status: 'cloud_pending',
			cloudParentRequired: true,
			rejectNote: '',
			failureStage: '',
			rejectedAt: null
		},
		[ADOPTION_TEST_STATES.cloudRejected]: {
			status: 'rejected',
			cloudParentRequired: true,
			failureStage: 'cloud_parent',
			rejectNote: '云家长拒绝了本次领养申请，流程已结束。',
			rejectedAt: Date.now()
		},
		[ADOPTION_TEST_STATES.ownerPending]: {
			status: 'pending',
			cloudParentRequired: false,
			rejectNote: '',
			failureStage: '',
			rejectedAt: null
		},
		[ADOPTION_TEST_STATES.ownerRejected]: {
			status: 'rejected',
			cloudParentRequired: false,
			failureStage: 'owner_review',
			rejectNote: '院主拒绝了本次领养申请，流程已结束。',
			rejectedAt: Date.now()
		},
		[ADOPTION_TEST_STATES.ownerApproved]: {
			status: 'pickup',
			cloudParentRequired: false,
			rejectNote: '',
			failureStage: '',
			rejectedAt: null,
			approvedAt: Date.now(),
			approvedBy: 'owner'
		}
	}[state]
	if (!statePatch) return fail('UNKNOWN_TEST_STATE', '未知的超级测试员状态')
	return updateApplication('adoption', id, statePatch)
}

export function submitAdoptionEvidence(id, payload = {}) {
	return advanceApplication('adoption', id, 'owner_confirm_pending', {
		proofPhotos: Array.isArray(payload.photos) ? payload.photos.slice(0, 2) : [],
		confirmStory: String(payload.story || '').trim(),
		proofSubmittedAt: Date.now()
	})
}

export function approveRescueApplication(id, patch = {}) {
	return advanceApplication('rescue', id, 'platform_approved', patch)
}

export function rejectRescueApplication(id, patch = {}) {
	return advanceApplication('rescue', id, 'platform_rejected', {
		...patch,
		rejectedAt: Date.now()
	})
}

/**
 * 重新审批扩展口。当前按产品约定关闭，不会把任意失败单偷偷推进回流程。
 */
export function reopenApplication(type, id, patch = {}) {
	if (normalizeType(type) !== APPLICATION_TYPE.adoption || !ADOPTION_REAPPROVAL_ENABLED) {
		return fail('REAPPROVAL_NOT_ENABLED', '重新审批能力暂未开放')
	}
	const record = reopenAdoption(id, patch)
	return record ? ok(record) : fail('REAPPROVAL_NOT_ALLOWED', '当前审批单不支持重新审批')
}

export function listApplications(type, options = {}) {
	const applicationType = normalizeType(type)
	const records = applicationType === APPLICATION_TYPE.rescue
		? getRescueRecords(options)
		: getAdoptionRecords(options)
	return ok(records.map((record) => ({ ...record, applicationType })))
}
