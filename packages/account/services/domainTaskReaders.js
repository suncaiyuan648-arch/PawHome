/**
 * Bind the account task surface to shared canonical domain read adapters.
 *
 * This module is intentionally a thin source composition layer.  It does not
 * read route/query values, translate arbitrary record aliases, infer an actor,
 * or perform writes.  Adoption and rescue use their existing read-only
 * adapters through the shared domainReads layer, never another subpackage;
 * feeding and dynamic use the same explicit persisted keys as the account
 * page runtime.  They remain read-only and accept only the frozen actor
 * context supplied by taskAdapter.
 */
import { createTaskSummary } from '../../../navigation/taskContracts.js'
import { readAdoptionApplication } from '../../../services/domainReads/adoption/applicationAdapter.js'
import { readAdoptionReviewList } from '../../../services/domainReads/adoption/reviewAdapter.js'
import { readRescueMine, readRescueReviewList } from '../../../services/domainReads/rescue/lists.js'
import { readRescueStateById } from '../../../services/domainReads/rescue/stateAdapter.js'
import { getAdoptionRecords } from '../../../utils/adoptionStorage.js'

const ADOPTION_APPLICANT_STAGE = Object.freeze({
	cloud_pending: Object.freeze({ actionType: 'apply', status: 'pending' }),
	pending: Object.freeze({ actionType: 'apply', status: 'pending' }),
	pickup: Object.freeze({ actionType: 'confirm', status: 'pending' }),
	owner_confirm: Object.freeze({ actionType: 'confirm', status: 'in_progress' }),
	owner_confirm_pending: Object.freeze({ actionType: 'confirm', status: 'in_progress' }),
	jury_confirm: Object.freeze({ actionType: 'confirm', status: 'in_progress' }),
	jury_confirm_pending: Object.freeze({ actionType: 'confirm', status: 'in_progress' }),
	adoption_confirmed: Object.freeze({ actionType: 'claim_reward', status: 'pending' }),
	reward: Object.freeze({ actionType: 'claim_reward', status: 'pending' }),
	reward_done: Object.freeze({ actionType: 'claim_reward', status: 'completed' }),
	rejected: Object.freeze({ actionType: 'apply', status: 'failed' }),
	cloud_rejected: Object.freeze({ actionType: 'apply', status: 'failed' }),
	abandoned: Object.freeze({ actionType: 'apply', status: 'cancelled' }),
})

const RESCUE_APPLICANT_STAGE = Object.freeze({
	platform_pending: Object.freeze({ actionType: 'apply', status: 'pending' }),
	platform_approved: Object.freeze({ actionType: 'fund', status: 'pending' }),
	platform_rejected: Object.freeze({ actionType: 'apply', status: 'failed' }),
})

const REVIEW_TASK_STATUS = Object.freeze({
	pending: 'pending',
	approved: 'processed',
	rejected: 'processed',
})

const REVIEW_ROLES = Object.freeze(new Set(['owner', 'cloud_parent', 'reviewer']))
const MISSING_DOMAIN_CODES = Object.freeze({
	feeding: 'READER_MISSING',
	dynamic: 'READER_MISSING',
})

const FEEDING_KEY = 'PAWHOME_FEEDING_ORDERS'
const DYNAMIC_KEY = 'PAWHOME_DYNAMIC_RECORDS'

function own(value, key) {
	return Object.prototype.hasOwnProperty.call(value, key)
}

function isPlainRecord(value) {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
	const prototype = Object.getPrototypeOf(value)
	return prototype === Object.prototype || prototype === null
}

function codeError(code, message) {
	const error = new Error(message)
	error.code = code
	return error
}

function freeze(value, seen = new WeakSet()) {
	if (value === null || typeof value !== 'object' || seen.has(value)) return value
	seen.add(value)
	for (const key of Reflect.ownKeys(value)) freeze(value[key], seen)
	return Object.freeze(value)
}

function assertReaderContext(context) {
	if (!isPlainRecord(context) || !Object.isFrozen(context)) throw codeError('INVALID_READER_CONTEXT', 'task reader context must be frozen')
	const keys = Object.keys(context)
	if (keys.length !== 1 || keys[0] !== 'actor') throw codeError('INVALID_READER_CONTEXT', 'task reader context only accepts actor')
	const actor = context.actor
	if (!isPlainRecord(actor) || !Object.isFrozen(actor) || typeof actor.id !== 'string' || !Array.isArray(actor.roles)) {
		throw codeError('INVALID_READER_CONTEXT', 'task reader context needs a trusted actor')
	}
	return actor
}

function diagnostic(domain, index, code) {
	return { domain, index: Number.isSafeInteger(index) ? index : -1, code: code || 'READER_FAILED' }
}

function envelope(items, skipped = []) {
	return freeze({
		success: true,
		data: { items: Array.isArray(items) ? items : [] },
		error: null,
		readOnly: true,
		canWrite: false,
		diagnostics: { scanned: Array.isArray(items) ? items.length : 0, accepted: Array.isArray(items) ? items.length : 0, skipped },
	})
}

function failedEnvelope(code) {
	return freeze({
		success: false,
		data: { items: [] },
		error: { code },
		readOnly: true,
		canWrite: false,
	})
}

function actorProvider(actor) {
	return () => ({ actor })
}

function task(input) {
	try {
		return createTaskSummary(input)
	} catch (error) {
		throw codeError(error && error.code ? error.code : 'INVALID_TASK', 'domain task summary is invalid')
	}
}

function adoptionApplicantReader(context) {
	const actor = assertReaderContext(context)
	if (!actor.roles.includes('applicant')) return envelope([])
	let records
	try {
		records = getAdoptionRecords({ includeDemo: false })
	} catch (error) {
		return failedEnvelope(error && error.code ? error.code : 'ADOPTION_READER_FAILED')
	}
	if (!Array.isArray(records)) return failedEnvelope('INVALID_READER_RESULT')
	const items = []
	const skipped = []
	records.forEach((record, index) => {
		if (!isPlainRecord(record) || typeof record.id !== 'string' || !record.id) {
			skipped.push(diagnostic('adoption', index, 'MISSING_ID'))
			return
		}
		const read = readAdoptionApplication(record.id, {
			actorProvider: actorProvider(actor),
			perspective: 'applicant',
		})
		if (!read || read.success !== true || !read.data) {
			const code = read && read.error && read.error.code
			// A non-owned record is an empty result, not a task diagnostic.  This
			// prevents the account surface from becoming an existence oracle.
			if (!['FORBIDDEN', 'NOT_FOUND'].includes(code)) skipped.push(diagnostic('adoption', index, code || 'ADOPTION_READER_FAILED'))
			return
		}
		const stage = ADOPTION_APPLICANT_STAGE[read.data.status]
		if (!stage) {
			skipped.push(diagnostic('adoption', index, 'UNKNOWN_APPLICATION_STATUS'))
			return
		}
		try {
			items.push(task({
				businessType: 'adoption',
				businessId: read.data.applicationId,
				actorId: actor.id,
				actorRole: 'applicant',
				actionType: stage.actionType,
				status: stage.status,
			}))
		} catch (error) {
			skipped.push(diagnostic('adoption', index, error.code || 'INVALID_TASK'))
		}
	})
	return envelope(items, skipped)
}

function adoptionReviewReader(context) {
	const actor = assertReaderContext(context)
	if (!actor.roles.some(role => REVIEW_ROLES.has(role))) return envelope([])
	let result
	try {
		result = readAdoptionReviewList({ actorProvider: actorProvider(actor) })
	} catch (error) {
		return failedEnvelope(error && error.code ? error.code : 'ADOPTION_REVIEW_READER_FAILED')
	}
	if (!result || !Array.isArray(result.items)) return failedEnvelope('INVALID_READER_RESULT')
	const items = []
	const skipped = []
	result.items.forEach((item, index) => {
		const status = item && REVIEW_TASK_STATUS[item.reviewStatus]
		if (!status) {
			skipped.push(diagnostic('adoption', index, 'UNKNOWN_REVIEW_STATUS'))
			return
		}
		try {
			items.push(task({
				businessType: 'adoption',
				businessId: item.applicationId,
				actorId: actor.id,
				actorRole: item.reviewerRole,
				actionType: 'review',
				status,
				reviewItemId: item.reviewItemId,
			}))
		} catch (error) {
			skipped.push(diagnostic('adoption', index, error.code || 'INVALID_TASK'))
		}
	})
	if (result.diagnostics && Array.isArray(result.diagnostics.skipped)) {
		for (const item of result.diagnostics.skipped) {
			if (item && typeof item.code === 'string') skipped.push(diagnostic('adoption', item.index, item.code))
		}
	}
	return envelope(items, skipped)
}

function adoptionReader(context) {
	const actor = assertReaderContext(context)
	const applicant = adoptionApplicantReader(context)
	const reviewer = adoptionReviewReader(context)
	const items = [...(applicant.data && applicant.data.items || []), ...(reviewer.data && reviewer.data.items || [])]
	const skipped = [
		...(applicant.diagnostics && applicant.diagnostics.skipped || []),
		...(reviewer.diagnostics && reviewer.diagnostics.skipped || []),
	]
	void actor
	return envelope(items, skipped)
}

function rescueMineReader(context) {
	const actor = assertReaderContext(context)
	if (!actor.roles.includes('applicant')) return envelope([])
	let source
	try {
		source = readRescueMine({ actorProvider: actorProvider(actor) })
	} catch (error) {
		return failedEnvelope(error && error.code ? error.code : 'RESCUE_READER_FAILED')
	}
	if (!source || !Array.isArray(source.items)) return failedEnvelope('INVALID_READER_RESULT')
	const items = []
	const skipped = []
	source.items.forEach((item, index) => {
		if (!item || typeof item.rescueId !== 'string' || !item.rescueId) {
			skipped.push(diagnostic('rescue', index, 'MISSING_RESCUE_ID'))
			return
		}
		const state = readRescueStateById(item.rescueId, { includeDemo: false })
		if (!state || state.success !== true || !state.data || !state.data.state) {
			skipped.push(diagnostic('rescue', index, state && state.error && state.error.code || 'RESCUE_STATE_READ_FAILED'))
			return
		}
		const projection = state.data.state
		if (projection.validity === 'invalid') {
			skipped.push(diagnostic('rescue', index, 'INVALID_RESCUE_STATE'))
			return
		}
		const stage = RESCUE_APPLICANT_STAGE[projection.applicationStatus]
		if (!stage) {
			skipped.push(diagnostic('rescue', index, 'UNKNOWN_APPLICATION_STATUS'))
			return
		}
		try {
			items.push(task({
				businessType: 'rescue',
				businessId: item.rescueId,
				actorId: actor.id,
				actorRole: 'applicant',
				actionType: stage.actionType,
				status: stage.status,
			}))
		} catch (error) {
			skipped.push(diagnostic('rescue', index, error.code || 'INVALID_TASK'))
		}
	})
	return envelope(items, skipped)
}

function rescueReviewReader(context) {
	const actor = assertReaderContext(context)
	if (!actor.roles.includes('reviewer')) return envelope([])
	let source
	try {
		source = readRescueReviewList({ actorProvider: actorProvider(actor) })
	} catch (error) {
		return failedEnvelope(error && error.code ? error.code : 'RESCUE_REVIEW_READER_FAILED')
	}
	if (!source || !Array.isArray(source.items)) return failedEnvelope('INVALID_READER_RESULT')
	const items = []
	const skipped = []
	source.items.forEach((item, index) => {
		const status = item && REVIEW_TASK_STATUS[item.status]
		if (!status) {
			skipped.push(diagnostic('rescue', index, 'UNKNOWN_REVIEW_STATUS'))
			return
		}
		try {
			items.push(task({
				businessType: 'rescue',
				businessId: item.rescueId,
				actorId: actor.id,
				actorRole: 'reviewer',
				actionType: 'review',
				status,
				reviewItemId: item.reviewItemId,
			}))
		} catch (error) {
			skipped.push(diagnostic('rescue', index, error.code || 'INVALID_TASK'))
		}
	})
	if (source.diagnostics && Array.isArray(source.diagnostics.skipped)) {
		for (const item of source.diagnostics.skipped) {
			if (item && typeof item.code === 'string') skipped.push(diagnostic('rescue', item.index, item.code))
		}
	}
	return envelope(items, skipped)
}

function rescueReader(context) {
	assertReaderContext(context)
	const mine = rescueMineReader(context)
	const review = rescueReviewReader(context)
	return envelope(
		[...(mine.data && mine.data.items || []), ...(review.data && review.data.items || [])],
		[...(mine.diagnostics && mine.diagnostics.skipped || []), ...(review.diagnostics && review.diagnostics.skipped || [])],
	)
}

function readPersistedRows(key, domain) {
	if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') {
		return { rows: [], error: 'READER_MISSING' }
	}
	let raw
	try { raw = uni.getStorageSync(key) } catch (error) { return { rows: [], error: 'STORAGE_READ_FAILED' } }
	if (raw === undefined || raw === null || raw === '') return { rows: [], error: 'READER_MISSING' }
	try {
		const rows = typeof raw === 'string' ? JSON.parse(raw) : raw
		return Array.isArray(rows) ? { rows, error: null } : { rows: [], error: 'INVALID_STORAGE' }
	} catch (error) {
		return { rows: [], error: 'INVALID_STORAGE' }
	}
}

function opaqueId(value) {
	return typeof value === 'string' && value === value.trim() && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value) && !/[/?#%]|:\/\//.test(value)
}

function hasAliasConflict(record, fields) {
	const values = fields
		.filter(field => own(record, field))
		.map(field => record[field])
		.filter(value => typeof value === 'string' && value.trim())
		.map(value => value.trim())
	return values.length > 1 && new Set(values).size > 1
}

function feedingPersistentReader(context) {
	const actor = assertReaderContext(context)
	const source = readPersistedRows(FEEDING_KEY, 'feeding')
	if (source.error) return failedEnvelope(source.error)
	const items = []
	const skipped = []
	source.rows.forEach((record, index) => {
		if (!isPlainRecord(record)) { skipped.push(diagnostic('feeding', index, 'INVALID_RECORD')); return }
		if (hasAliasConflict(record, ['id', 'orderId']) || hasAliasConflict(record, ['userId', 'userPawId', 'donorId']) || hasAliasConflict(record, ['yardOwnerId', 'ownerPawId'])) {
			skipped.push(diagnostic('feeding', index, 'CONFLICTING_RECORD')); return
		}
		const id = typeof (record.orderId || record.id) === 'string' ? (record.orderId || record.id) : ''
		if (!opaqueId(id) || /^demo(?:[-_:]|$)/i.test(id)) { skipped.push(diagnostic('feeding', index, 'INVALID_ID')); return }
		const donor = [record.userId, record.userPawId, record.donorId].includes(actor.id)
		const owner = (actor.roles.includes('yard_owner') || actor.roles.includes('owner') || actor.roles.includes('fulfillment_manager'))
			&& [record.yardOwnerId, record.ownerPawId].includes(actor.id)
		if (!donor && !owner) return
		const status = record.feedbackStatus || record.status || record.stateKey
		const normalized = ['completed', 'fulfilled', 'processed', 'done'].includes(status) ? 'completed'
			: ['active', 'in_progress', 'shipping', 'delivered'].includes(status) ? 'in_progress' : 'pending'
		try {
			items.push(task({ businessType: 'feeding', businessId: id, actorId: actor.id, actorRole: owner ? 'owner' : 'donor', actionType: owner ? 'fulfill' : 'feedback', status: normalized }))
		} catch (error) { skipped.push(diagnostic('feeding', index, error.code || 'INVALID_TASK')) }
	})
	return envelope(items, skipped)
}

function dynamicPersistentReader(context) {
	const actor = assertReaderContext(context)
	const source = readPersistedRows(DYNAMIC_KEY, 'dynamic')
	if (source.error) return failedEnvelope(source.error)
	const items = []
	const skipped = []
	source.rows.forEach((record, index) => {
		if (!isPlainRecord(record)) { skipped.push(diagnostic('dynamic', index, 'INVALID_RECORD')); return }
		if (hasAliasConflict(record, ['id', 'dynamicId']) || hasAliasConflict(record, ['authorId', 'userId', 'userPawId', 'ownerId']) || hasAliasConflict(record, ['status', 'state'])) {
			skipped.push(diagnostic('dynamic', index, 'CONFLICTING_RECORD')); return
		}
		const id = typeof (record.dynamicId || record.id) === 'string' ? (record.dynamicId || record.id) : ''
		if (!opaqueId(id) || /^demo(?:[-_:]|$)/i.test(id)) { skipped.push(diagnostic('dynamic', index, 'INVALID_ID')); return }
		const owner = [record.authorId, record.userId, record.userPawId, record.ownerId].includes(actor.id)
		if (!owner) return
		const status = record.status || record.state
		const normalized = ['published', 'completed', 'processed', 'deleted'].includes(status) ? 'completed'
			: ['draft', 'pending', 'review'].includes(status) ? 'pending' : 'in_progress'
		try {
			items.push(task({ businessType: 'dynamic', businessId: id, actorId: actor.id, actorRole: 'author', actionType: 'publish', status: normalized }))
		} catch (error) { skipped.push(diagnostic('dynamic', index, error.code || 'INVALID_TASK')) }
	})
	return envelope(items, skipped)
}

function missingReader(domain) {
	return context => {
		assertReaderContext(context)
		return failedEnvelope(MISSING_DOMAIN_CODES[domain] || 'READER_MISSING')
	}
}

/**
 * Return the four account task readers.  The returned functions accept only
 * the frozen `{ actor }` context supplied by taskAdapter/taskReadModel.
 */
export function createDomainTaskReaders() {
	return Object.freeze({
		adoption: adoptionReader,
		rescue: rescueReader,
		feeding: feedingPersistentReader,
		dynamic: dynamicPersistentReader,
	})
}

export const getDomainTaskReaders = createDomainTaskReaders
export const buildDomainTaskReaders = createDomainTaskReaders

export {
	ADOPTION_APPLICANT_STAGE,
	RESCUE_APPLICANT_STAGE,
}
