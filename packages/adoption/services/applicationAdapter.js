/**
 * Package-local adoption application reader.
 *
 * The shared domain reader remains the canonical contract for cross-domain
 * governance. This package copy keeps the applicant progress route inside
 * its own subpackage so WeChat does not lift the reader and its pure
 * capability contracts into the main package.
 */
/**
 * Read-only adoption application adapter.
 *
 * The application/progress pages are being migrated away from the old
 * `progress.js` reader.  This boundary owns the one-record read from the
 * existing `PAWHOME_ADOPTIONS` repository and delegates actor/condition rules
 * to the canonical contracts.  It deliberately has no writer, transition,
 * payment, or page dependency.
 */
import { resolveTrustedActor } from './actorCapabilities.js'
import {
	createAdoptionTransitionContract,
	readAdoptionCondition,
} from './adoptionConditionContract.js'
import { getAdoptionRecords } from '../../../utils/adoptionStorage.js'

const APPLICATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const CROSS_DOMAIN_PREFIXES = Object.freeze([
	'rescue',
	'feeding',
	'order',
	'dynamic',
	'yard',
	'animal',
])
const PERSPECTIVES = Object.freeze(['applicant', 'owner', 'cloud_parent'])
const APPLICANT_RELATIONS = Object.freeze(['applicantId', 'applicantUserId'])
const OWNER_RELATIONS = Object.freeze(['ownerId', 'ownerPawId', 'ownerUserId', 'yardOwnerId'])
const CLOUD_PARENT_SCALARS = Object.freeze(['cloudParentId', 'cloudParentPawId', 'cloudOwnerId'])
const CLOUD_PARENT_LIST = 'cloudParentIds'
const PUBLIC_RECORD_FIELDS = Object.freeze([
	'id', 'recordId', 'applicationId', 'applicationType', 'status', 'applicationStatus',
	'yardId', 'yardName', 'yardTag', 'ownerName', 'ownerAvatar', 'summary',
	'createdAt', 'updatedAt',
])
const APPLICANT_PRIVATE_FIELDS = Object.freeze([
	'applicantId', 'applicantUserId', 'applicantName', 'applicantAvatar', 'applicantLevel',
	'applyText', 'description', 'mediaPaths', 'location', 'locationAddress', 'distance',
	'ownerNick', 'ownerMessage', 'rejectNote', 'rejectedAt', 'failureStage',
	'confirmStory', 'proofDate', 'proofPhotos', 'reapproval',
])
const PUBLIC_PET_FIELDS = Object.freeze(['id', 'petId', 'name', 'avatar'])
const DEMO_ID_PATTERN = /^demo(?:[-_:]|$)/i
const PACKAGE_ADOPTION_TRANSITIONS = Object.freeze({
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
	abandoned: Object.freeze([]),
})

const TRANSITION_CONTRACT = createAdoptionTransitionContract(PACKAGE_ADOPTION_TRANSITIONS)

export const ADOPTION_APPLICATION_PERSPECTIVES = PERSPECTIVES

function own(value, key) {
	return Object.prototype.hasOwnProperty.call(value, key)
}

function isRecord(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function text(value) {
	return value === undefined || value === null ? '' : String(value)
}

function codeError(code, message, details = {}) {
	const error = new Error(message)
	error.code = code
	error.details = details
	return error
}

function frozen(value, seen = new WeakSet()) {
	if (value === null || typeof value !== 'object' || seen.has(value)) return value
	seen.add(value)
	for (const key of Object.keys(value)) frozen(value[key], seen)
	return Object.freeze(value)
}

function failure(code, message, actor = null, details = {}) {
	return frozen({
		success: false,
		source: 'mock',
		data: null,
		error: { code, message, ...details },
		actor,
		readOnly: true,
		canWrite: false,
	})
}

function success(data, actor) {
	return frozen({
		success: true,
		source: 'mock',
		data,
		error: null,
		actor,
		readOnly: true,
		canWrite: false,
	})
}

function crossDomainId(id) {
	const lower = id.toLowerCase()
	return CROSS_DOMAIN_PREFIXES.find(prefix => (
		lower === prefix || lower.startsWith(`${prefix}-`) || lower.startsWith(`${prefix}_`) || lower.startsWith(`${prefix}:`)
	)) || ''
}

function validateApplicationId(value) {
	if (typeof value !== 'string' || !value) throw codeError('MISSING_ID', '缺少领养申请 ID')
	if (value !== value.trim()) throw codeError('INVALID_ID', '领养申请 ID 不得包含首尾空白')
	if (!APPLICATION_ID_PATTERN.test(value) || URL_MARKERS.test(value)) throw codeError('INVALID_ID', '领养申请 ID 格式不合法')
	const prefix = crossDomainId(value)
	if (prefix) throw codeError('CROSS_DOMAIN_ID', `领养申请 ID 不属于 adoption 域: ${prefix}`, { prefix })
	if (DEMO_ID_PATTERN.test(value)) throw codeError('NOT_FOUND', '找不到这条领养申请')
	return value
}

function validateRelationId(value, label) {
	if (typeof value !== 'string' || !value) throw codeError('INVALID_RELATION', `${label} 必须是非空 actor ID`)
	if (value !== value.trim() || !APPLICATION_ID_PATTERN.test(value) || URL_MARKERS.test(value)) {
		throw codeError('INVALID_RELATION', `${label} 关系 ID 格式不合法`)
	}
	return value
}

function scalarRelation(record, fields, label) {
	const values = []
	for (const field of fields) {
		if (!own(record, field) || record[field] === undefined || record[field] === null || record[field] === '') continue
		values.push(validateRelationId(record[field], `record.${field}`))
	}
	const unique = [...new Set(values)]
	if (unique.length > 1) throw codeError('CONFLICTING_RELATION', `${label} 关系别名不一致`, { label, values: unique })
	return unique[0] || ''
}

function cloudParentRelations(record) {
	let list = []
	if (own(record, CLOUD_PARENT_LIST)) {
		if (!Array.isArray(record[CLOUD_PARENT_LIST])) throw codeError('INVALID_RELATION', 'record.cloudParentIds 必须是数组')
		list = record[CLOUD_PARENT_LIST].map(value => validateRelationId(value, 'record.cloudParentIds'))
		list = [...new Set(list)]
	}
	const scalars = []
	for (const field of CLOUD_PARENT_SCALARS) {
		if (!own(record, field) || record[field] === undefined || record[field] === null || record[field] === '') continue
		scalars.push(validateRelationId(record[field], `record.${field}`))
	}
	const uniqueScalars = [...new Set(scalars)]
	if (uniqueScalars.length > 1) throw codeError('CONFLICTING_RELATION', 'cloud-parent 关系别名不一致', { values: uniqueScalars })
	if (uniqueScalars[0] && list.length && !list.includes(uniqueScalars[0])) {
		throw codeError('CONFLICTING_RELATION', 'cloud-parent 单值与列表关系不一致')
	}
	if (!list.length && uniqueScalars[0]) list = [uniqueScalars[0]]
	return list
}

function validateRelations(record) {
	if (!isRecord(record)) throw codeError('INVALID_RECORD', '领养申请记录格式不合法')
	const applicantId = scalarRelation(record, APPLICANT_RELATIONS, 'applicant')
	const ownerId = scalarRelation(record, OWNER_RELATIONS, 'owner')
	const cloudParentIds = cloudParentRelations(record)
	return { applicantId, ownerId, cloudParentIds }
}

function normalizeStatus(record) {
	const values = []
	for (const field of ['status', 'applicationStatus']) {
		if (!own(record, field)) continue
		if (typeof record[field] !== 'string' || !record[field]) throw codeError('INVALID_STATUS', `record.${field} 必须是非空状态`)
		if (record[field] !== record[field].trim()) throw codeError('INVALID_STATUS', `record.${field} 不得包含首尾空白`)
		values.push(record[field])
	}
	const unique = [...new Set(values)]
	if (unique.length > 1) throw codeError('CONFLICTING_STATUS', 'status 与 applicationStatus 不一致')
	const status = unique[0] || ''
	if (!status || !own(PACKAGE_ADOPTION_TRANSITIONS, status)) throw codeError('INVALID_STATUS', '领养申请状态不在 canonical 状态机内')
	// Exercise the injected canonical transition boundary.  The adapter never
	// performs a transition; this only confirms that the state is represented.
	TRANSITION_CONTRACT.allowedNext(status)
	return status
}

function canonicalApplicationId(record) {
	const values = []
	for (const field of ['id', 'recordId', 'applicationId']) {
		if (!own(record, field) || record[field] === undefined || record[field] === null || record[field] === '') continue
		if (typeof record[field] !== 'string' || record[field] !== record[field].trim() || !APPLICATION_ID_PATTERN.test(record[field]) || URL_MARKERS.test(record[field])) {
			throw codeError('INVALID_RECORD_ID', `record.${field} 不是合法的领养申请 ID`)
		}
		if (crossDomainId(record[field])) throw codeError('CROSS_DOMAIN_RECORD', '领养申请记录含跨域 ID')
		values.push(record[field])
	}
	const unique = [...new Set(values)]
	if (unique.length > 1) throw codeError('CONFLICTING_APPLICATION_ID', '领养申请 ID 别名不一致')
	return unique[0] || ''
}

function findExactRecord(id, records) {
	if (!Array.isArray(records)) throw codeError('STORAGE_READ_FAILED', '领养申请读取结果格式不合法')
	const matches = records.filter(record => {
		if (!isRecord(record)) return false
		const canonical = canonicalApplicationId(record)
		return canonical === id
	})
	if (matches.length > 1) throw codeError('AMBIGUOUS_APPLICATION', '领养申请 ID 对应多条记录')
	return matches[0] || null
}

function readStoredRecord(id) {
	// This is the only production storage read.  The explicit option disables
	// demo fallback in adoptionStorage and prevents stale demo deep links from
	// becoming real private data.
	return findExactRecord(id, getAdoptionRecords({ includeDemo: false }))
}

function resolveActor(actorProvider) {
	try {
		const actor = resolveTrustedActor(actorProvider)
		return actor ? { actor, error: null } : { actor: null, error: codeError('NO_ACTOR', 'trusted actor 不可用') }
	} catch (error) {
		return { actor: null, error: codeError(error && error.code ? error.code : 'INVALID_ACTOR', 'trusted actor 不可用') }
	}
}

function policyFromOptions(options) {
	const hasCanonical = own(options, 'cloudParentPolicy')
	const hasAlias = own(options, 'policy')
	if (hasCanonical && hasAlias && JSON.stringify(options.cloudParentPolicy) !== JSON.stringify(options.policy)) {
		throw codeError('CONFLICTING_POLICY', 'cloud-parent policy 别名不一致')
	}
	return hasCanonical ? options.cloudParentPolicy : hasAlias ? options.policy : undefined
}

function clonePet(pet) {
	if (!isRecord(pet)) throw codeError('INVALID_RECORD', '领养申请宠物信息格式不合法')
	const output = {}
	for (const field of PUBLIC_PET_FIELDS) {
		if (own(pet, field) && (typeof pet[field] === 'string' || typeof pet[field] === 'number')) output[field] = pet[field]
	}
	return output
}

function copyFields(record, fields, output) {
	for (const field of fields) {
		if (!own(record, field)) continue
		const value = record[field]
		if (value === undefined || value === null) continue
		if (Array.isArray(value)) output[field] = value.map(item => isRecord(item) ? { ...item } : item)
		else if (isRecord(value)) output[field] = { ...value }
		else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') output[field] = value
		else throw codeError('INVALID_RECORD', `record.${field} 格式不合法`)
	}
}

function publicCondition(condition, perspective, actorId) {
	const source = condition && condition.cloudParent
	if (!source || typeof source !== 'object') return null
	const result = {
		count: source.count,
		required: source.required,
		decision: source.decision,
		canProceed: source.canProceed,
		decisionRequired: source.decisionRequired,
		reason: source.reason,

	}
	if (source.selection) result.selection = source.selection
	if (perspective === 'applicant') {
		result.reviews = Array.isArray(source.reviews) ? source.reviews.map(review => ({ ...review })) : []
	} else if (perspective === 'cloud_parent') {
		result.reviews = Array.isArray(source.reviews)
			? source.reviews.filter(review => review && review.id === actorId).map(review => ({ ...review }))
			: []
	} else {
		result.reviews = []
	}
	return result
}

function projectRecord(record, id, status, perspective, condition, actorId) {
	const data = {
		applicationId: id,
		id,
		recordId: id,
		applicationType: 'adoption',
		status,
		perspective,
		condition: publicCondition(condition, perspective, actorId),
	}
	copyFields(record, PUBLIC_RECORD_FIELDS, data)
	data.applicationId = id
	data.id = id
	data.recordId = id
	data.applicationType = 'adoption'
	data.status = status
	if (Array.isArray(record.pets)) data.pets = record.pets.map(clonePet)
	if (perspective === 'applicant') copyFields(record, APPLICANT_PRIVATE_FIELDS, data)
	return data
}

function normalizeOptions(options) {
	return isRecord(options) ? options : {}
}

function readApplication(applicationId, options, reader, { allowReviewResolver = false } = {}) {
	let id
	try {
		id = validateApplicationId(applicationId)
	} catch (error) {
		return failure(error.code || 'INVALID_ID', error.message)
	}

	const source = normalizeOptions(options)
	const actorState = resolveActor(source.actorProvider)
	if (actorState.error) return failure(actorState.error.code, actorState.error.message)
	const actor = actorState.actor

	let record
	try {
		record = reader(id)
	} catch (error) {
		return failure(error && error.code ? error.code : 'STORAGE_READ_FAILED', '领养申请读取失败', actor)
	}
	if (!record) return failure('NOT_FOUND', '找不到这条领养申请', actor)

	let relations
	let status
	try {
		relations = validateRelations(record)
		status = normalizeStatus(record)
	} catch (error) {
		return failure(error.code || 'INVALID_RECORD', '领养申请记录校验失败', actor)
	}

	const requestedPerspective = source.perspective
	if (requestedPerspective !== undefined && !PERSPECTIVES.includes(requestedPerspective)) {
		return failure('INVALID_PERSPECTIVE', '领养申请视角不受支持', actor)
	}

	const conditionInput = {
		record,
		actorProvider: () => actor,
		...(requestedPerspective === undefined ? {} : { perspective: requestedPerspective }),
	}
	try {
		conditionInput.policy = policyFromOptions(source)
		// A page/query caller must not inject authoritative review states.  Only
		// the explicit resolver seam below may supply a controlled review reader.
		if (allowReviewResolver && source.reviewResolver !== undefined) conditionInput.reviewResolver = source.reviewResolver
	} catch (error) {
		return failure(error.code || 'INVALID_POLICY', '领养条件策略不合法', actor)
	}

	let condition
	try {
		condition = readAdoptionCondition(conditionInput)
	} catch (error) {
		return failure(error.code || 'CONDITION_READ_FAILED', '领养条件读取失败', actor)
	}
	if (!condition.canRead) return failure('FORBIDDEN', '当前 actor 无权读取这条领养申请', actor, { reason: condition.reason })

	// A pending or rejected condition is safe to display.  An unresolved
	// multi-parent policy is different: do not turn missing/invalid policy into
	// an implicit all/any decision or expose a success result.
	if (condition.cloudParent && condition.cloudParent.decisionRequired) {
		return failure(condition.cloudParent.reason || 'CLOUD_PARENT_POLICY_REQUIRED', '多云家长条件尚未有明确策略', actor)
	}
	const perspective = condition.perspective
	if ((perspective === 'owner' || perspective === 'cloud_parent') && requestedPerspective === undefined) {
		return failure('PERSPECTIVE_REQUIRED', '院主或云家长读取必须显式声明视角', actor)
	}
	// The canonical condition contract already proves the actor relation.  The
	// local relation result is kept only as a defensive check against any future
	// contract change and is never derived from query/role/managed fields.
	const related = perspective === 'applicant'
		? relations.applicantId === actor.id
		: perspective === 'owner'
			? relations.ownerId === actor.id
			: relations.cloudParentIds.includes(actor.id)
	if (!related) return failure('FORBIDDEN', '当前 actor 不属于这条领养申请', actor)

	return success(frozen(projectRecord(record, id, status, perspective, condition, actor.id)), actor)
}

/** Read one current, persisted adoption application for a trusted actor. */
export function readAdoptionApplication(applicationId, options = {}) {
	return readApplication(applicationId, options, readStoredRecord)
}

/** Alias used by page migrations that still call their item an application. */
export const readAdoptionApplicationById = readAdoptionApplication

/**
 * Test/future transport seam.  Production callers must use
 * readAdoptionApplication so the repository remains PAWHOME_ADOPTIONS-only.
 * The resolver receives only the validated ID and must synchronously return a
 * single record; promises are rejected before they can become authoritative.
 */
export function readAdoptionApplicationWithResolver(applicationId, options = {}) {
	const source = normalizeOptions(options)
	if (typeof source.resolver !== 'function') return failure('RESOLVER_REQUIRED', '领养申请读取器不可用')
	return readApplication(applicationId, source, id => {
		let record
		try {
			record = source.resolver(Object.freeze({ applicationId: id }))
		} catch (error) {
			throw codeError('STORAGE_READ_FAILED', '领养申请读取器失败')
		}
		if (record && typeof record.then === 'function') {
			if (typeof record.catch === 'function') record.catch(() => {})
			throw codeError('ASYNC_RESOLVER_UNSUPPORTED', '领养申请读取器必须同步返回')
		}
		return record
	}, { allowReviewResolver: true })
}

export const readAdoptionProgress = readAdoptionApplication
