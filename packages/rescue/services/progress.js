/**
 * Read-only rescue applicant progress seam.
 *
 * The page needs the persisted record's display fields, while the status
 * shown to the applicant must come from the canonical three-axis state
 * contract.  This service reads one exact record (with demos disabled), feeds
 * that same snapshot through the canonical state contract, and exposes the
 * projection without adding a writer or trusting route fields as state.
 */
import { normalizeRescueState } from '../../../services/domainReads/rescue/stateContract.js'
import { getRescueById } from '../../../utils/rescueStorage.js'

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const ANONYMOUS_IDS = new Set(['anonymous', 'anon', 'guest', 'unknown', '匿名', '匿名用户'])

function failure(code, message, actor = null) {
	return Object.freeze({
		success: false,
		data: null,
		error: Object.freeze({ code, message }),
		readOnly: true,
		canWrite: false,
		...(actor ? { actor } : {}),
	})
}

function cloneAndFreeze(value, seen = new WeakMap()) {
	if (value === null || typeof value !== 'object') return value
	if (seen.has(value)) return seen.get(value)
	const output = Array.isArray(value) ? [] : {}
	seen.set(value, output)
	for (const key of Object.keys(value)) output[key] = cloneAndFreeze(value[key], seen)
	return Object.freeze(output)
}

function errorCode(error, fallback) {
	return error && typeof error.code === 'string' && error.code ? error.code : fallback
}

function normalizeId(value) {
	return value === undefined || value === null ? '' : String(value).trim()
}


function actorFrom(provider) {
	if (typeof provider !== 'function') {
		if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') return { id: '', provided: false }
		let session
		try { session = uni.getStorageSync('PAWHOME_ACTOR_SESSION') } catch (error) { return { id: '', provided: true } }
		if (session === undefined || session === null || session === '') return { id: '', provided: false }
		provider = () => session
	}
	let raw
	try { raw = provider() } catch (error) { return { id: '', provided: true } }
	const actor = raw && typeof raw === 'object' && raw.actor ? raw.actor : raw
	const id = actor && typeof actor === 'object' ? normalizeId(actor.id || actor.actorId) : ''
	return { id: ID_PATTERN.test(id) && !URL_MARKERS.test(id) && !ANONYMOUS_IDS.has(id.toLowerCase()) ? id : '', provided: true }
}

function applicantIds(record) {
	const values = []
	for (const value of [record && record.applicantId, record && record.applicantUserId, record && record.userId,
		record && record.applicant && record.applicant.id, record && record.applicant && record.applicant.pawId]) {
		if (value === undefined || value === null || value === '') continue
		const id = normalizeId(value)
		if (!ID_PATTERN.test(id) || URL_MARKERS.test(id) || ANONYMOUS_IDS.has(id.toLowerCase())) return { values: [], error: 'INVALID_APPLICANT_RELATION' }
		if (!values.includes(id)) values.push(id)
	}
	if (values.length > 1) return { values: [], error: 'CONFLICTING_APPLICANT_RELATION' }
	return { values, error: null }
}

function validateId(rescueId) {
	if (typeof rescueId !== 'string') return failure('INVALID_ID', '救助单 ID 格式不合法')
	if (rescueId !== rescueId.trim()) {
		return failure('INVALID_ID', '救助单 ID 格式不合法')
	}
	const id = normalizeId(rescueId)
	if (!id) return failure('MISSING_ID', '缺少救助单 ID')
	if (!ID_PATTERN.test(id) || /[/?#%]|:\/\//.test(id)) {
		return failure('INVALID_ID', '救助单 ID 格式不合法')
	}
	return id
}

/** Read one persisted rescue record and its canonical state projection. */
export function readRescueProgress(rescueId, { actorProvider } = {}) {
	const validId = validateId(rescueId)
	if (typeof validId !== 'string') return validId
	let snapshot
	try {
		snapshot = getRescueById(validId, { includeDemo: false })
	} catch (error) {
		return failure(errorCode(error, 'STORAGE_READ_FAILED'), '救助申请读取失败')
	}
	if (!snapshot) return failure('NOT_FOUND', '找不到这条救助申请')
	const owners = applicantIds(snapshot)
	const actor = actorFrom(actorProvider)
	if (owners.error) return failure(owners.error, '救助申请缺少有效申请人关系', actor.id ? { id: actor.id } : null)
	if (owners.values.length && actor.provided && !actor.id) return failure('NO_ACTOR', '请先登录后查看救助进度')
	if (owners.values.length && actor.id !== owners.values[0]) return failure('FORBIDDEN', '当前账号无权查看这条救助申请', actor.id ? { id: actor.id } : null)
	if (actor.provided && !owners.values.length) return failure('MISSING_APPLICANT_RELATION', '救助申请缺少申请人关系', actor.id ? { id: actor.id } : null)

	let projection
	try {
		projection = normalizeRescueState(snapshot)
	} catch (error) {
		return failure('STATE_READ_FAILED', '救助状态读取失败')
	}
	const strict = actor.provided
	const safeAnimals = Array.isArray(snapshot.animals) ? snapshot.animals.map(animal => ({
		id: animal.id,
		name: animal.name,
		avatar: animal.avatar,
		yardPetId: animal.yardPetId,
	})) : []
	const safeRecord = strict ? {
		id: snapshot.id,
		rescueId: snapshot.rescueId || snapshot.id,
		applicationType: 'rescue',
		status: snapshot.status,
		statusText: snapshot.statusText,
		applicationStatus: snapshot.applicationStatus,
		reviewStatus: snapshot.reviewStatus || (snapshot.review && snapshot.review.status),
		fundingStatus: snapshot.fundingStatus || (snapshot.funding && snapshot.funding.status),
		ownerName: snapshot.ownerName,
		ownerAvatar: snapshot.ownerAvatar,
		ownerLevel: snapshot.ownerLevel,
		createdAt: snapshot.createdAt,
		createdLabel: snapshot.createdLabel,
		helpType: snapshot.helpType,
		amount: snapshot.amount,
		views: snapshot.views,
		description: snapshot.description,
		detail: snapshot.detail,
		summary: snapshot.summary,
		media: Array.isArray(snapshot.media) ? snapshot.media.slice(0, 6) : [],
		mediaPaths: Array.isArray(snapshot.mediaPaths) ? snapshot.mediaPaths.slice(0, 6) : [],
		animals: safeAnimals,
		receiver: snapshot.receiver && typeof snapshot.receiver === 'object' ? { name: snapshot.receiver.name || '' } : undefined,
	} : snapshot
	const data = {
		...safeRecord,
		// The component's application status is now supplied by the canonical
		// application axis.  The other axes remain available to future views.
		applicationStatus: projection.applicationStatus,
		rescueState: projection,
	}
	return Object.freeze({
		success: true,
		data: cloneAndFreeze(data),
		error: null,
		readOnly: true,
		canWrite: false,
		...(actor.id ? { actor: { id: actor.id } } : {}),
	})
}

export const readRescueApplicantProgress = readRescueProgress
