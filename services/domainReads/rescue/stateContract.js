/**
 * Read-only contract for the three independent rescue state axes.
 *
 * This module deliberately has no Vue, uni-app, page, or storage dependency.
 * It consumes a rescue record (including the legacy rescueStorage shape) and
 * returns a defensive projection. It does not perform state transitions or
 * grant any funding capability.
 */

export const UNKNOWN_STATE = 'unknown'

export const RESCUE_APPLICATION_STATUS = Object.freeze({
	pending: 'platform_pending',
	approved: 'platform_approved',
	rejected: 'platform_rejected',
	unknown: UNKNOWN_STATE,
})

export const RESCUE_REVIEW_STATUS = Object.freeze({
	pending: 'pending',
	approved: 'approved',
	rejected: 'rejected',
	unknown: UNKNOWN_STATE,
})

export const RESCUE_FUNDING_STATUS = Object.freeze({
	pending: 'funding_pending',
	failed: 'funding_failed',
	paid: 'funding_paid',
	unknown: UNKNOWN_STATE,
})

/**
 * The field dictionary is intentionally explicit. `status` is a legacy
 * multiplexed field and is only read through the compatibility rules below;
 * it never becomes the application axis and is never rewritten.
 */
export const RESCUE_STATE_FIELD_DICTIONARY = Object.freeze({
	applicationStatus: Object.freeze({
		axis: 'application',
		canonical: 'applicationStatus',
		values: Object.freeze(['platform_pending', 'platform_approved', 'platform_rejected']),
		sources: Object.freeze(['applicationStatus', 'application.status']),
	}),
	reviewStatus: Object.freeze({
		axis: 'review',
		canonical: 'review.status',
		values: Object.freeze(['pending', 'approved', 'rejected']),
		sources: Object.freeze(['reviewStatus', 'review.status', 'voteStatus', 'vote.status', 'status[pending|rejected]']),
	}),
	fundingStatus: Object.freeze({
		axis: 'funding',
		canonical: 'funding.status',
		values: Object.freeze(['funding_pending', 'funding_failed', 'funding_paid']),
		sources: Object.freeze(['fundingStatus', 'funding.status', 'fundingOutcome', 'status[unpaid|paid]']),
	}),
})

const APPLICATION_VALUES = new Set(Object.values(RESCUE_APPLICATION_STATUS).filter(value => value !== UNKNOWN_STATE))
const REVIEW_VALUES = new Set(Object.values(RESCUE_REVIEW_STATUS).filter(value => value !== UNKNOWN_STATE))
const FUNDING_VALUES = new Set(Object.values(RESCUE_FUNDING_STATUS).filter(value => value !== UNKNOWN_STATE))

const APPLICATION_ALIASES = Object.freeze({
	platform_pending: 'platform_pending',
	platform_approved: 'platform_approved',
	platform_rejected: 'platform_rejected',
})

const REVIEW_ALIASES = Object.freeze({
	pending: 'pending',
	review_pending: 'pending',
	vote_pending: 'pending',
	approved: 'approved',
	review_approved: 'approved',
	vote_approved: 'approved',
	rejected: 'rejected',
	review_rejected: 'rejected',
	vote_rejected: 'rejected',
})

const FUNDING_ALIASES = Object.freeze({
	funding_pending: 'funding_pending',
	pending: 'funding_pending',
	unpaid: 'funding_pending',
	funding_failed: 'funding_failed',
	failed: 'funding_failed',
	funding_paid: 'funding_paid',
	paid: 'funding_paid',
})

function isRecord(value) {
	return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function text(value) {
	return value === undefined || value === null ? '' : String(value).trim()
}

function own(object, key) {
	return Object.prototype.hasOwnProperty.call(object, key)
}

function distinct(values) {
	return Array.from(new Set(values))
}

function freezeError(axis, code, fields, message) {
	return Object.freeze({ axis, code, fields: Object.freeze(fields.slice()), message })
}

function axisResult(status, source, known, supplied) {
	return Object.freeze({ status, source, known, supplied })
}

function readCandidates(source, paths) {
	const values = []
	for (const path of paths) {
		const parts = path.split('.')
		let current = source
		for (const part of parts) {
			if (!isRecord(current) || !own(current, part)) {
				current = undefined
				break
			}
			current = current[part]
		}
		if (current !== undefined && current !== null && text(current) !== '') {
			values.push({ field: path, value: text(current) })
		}
	}
	return values
}

function resolveAxis(source, config) {
	const candidates = readCandidates(source, config.paths)
	if (!candidates.length) {
		return { result: axisResult(UNKNOWN_STATE, null, false, false), errors: [] }
	}

	const canonical = []
	const invalid = []
	for (const candidate of candidates) {
		const normalized = config.aliases[candidate.value]
		if (!normalized || !config.values.has(normalized)) {
			invalid.push(candidate)
			continue
		}
		canonical.push({ ...candidate, value: normalized })
	}

	if (invalid.length) {
		return {
			result: axisResult(UNKNOWN_STATE, null, false, true),
			errors: [freezeError(config.axis, 'UNKNOWN_STATUS', invalid.map(item => item.field), `${config.axis} 状态不在合同枚举内`)],
		}
	}

	const statuses = distinct(canonical.map(item => item.value))
	if (statuses.length !== 1) {
		return {
			result: axisResult(UNKNOWN_STATE, null, false, true),
			errors: [freezeError(config.axis, 'CONFLICTING_STATUS', canonical.map(item => item.field), `${config.axis} 状态字段冲突，拒绝自动修复`)],
		}
	}

	return {
		result: axisResult(statuses[0], canonical.map(item => item.field).join(','), true, true),
		errors: [],
	}
}

function crossAxisErrors(application, review, funding) {
	const errors = []
	if (funding.status === RESCUE_FUNDING_STATUS.paid && application.status !== RESCUE_APPLICATION_STATUS.approved) {
		errors.push(freezeError('funding', 'FUNDING_BEFORE_APPLICATION_APPROVAL', ['applicationStatus', 'fundingStatus'], '平台审核未通过或未完成时不能宣称已打款'))
	}
	if (funding.status === RESCUE_FUNDING_STATUS.paid && review.status !== RESCUE_REVIEW_STATUS.approved) {
		errors.push(freezeError('funding', 'FUNDING_BEFORE_REVIEW_APPROVAL', ['reviewStatus', 'fundingStatus'], '评审未通过或缺少评审结果时不能宣称已打款'))
	}
	if (funding.status !== RESCUE_FUNDING_STATUS.unknown && review.status === RESCUE_REVIEW_STATUS.rejected) {
		errors.push(freezeError('review', 'FUNDING_AFTER_REVIEW_REJECTION', ['reviewStatus', 'fundingStatus'], '评审否决与资金结果冲突'))
	}
	return errors
}

function freezeProjection(projection) {
	projection.application = Object.freeze(projection.application)
	projection.review = Object.freeze(projection.review)
	projection.vote = Object.freeze(projection.vote)
	projection.funding = Object.freeze(projection.funding)
	projection.capabilities = Object.freeze(projection.capabilities)
	projection.errors = Object.freeze(projection.errors)
	return Object.freeze(projection)
}

/**
 * Normalize a rescue record without filling an absent axis from another axis.
 * Missing values are `unknown`; malformed and contradictory values are also
 * exposed as `unknown` with `validity: invalid` and an error code.
 */
export function normalizeRescueState(record = {}) {
	const source = isRecord(record) ? record : {}
	const application = resolveAxis(source, {
		axis: 'application',
		paths: ['applicationStatus', 'application.status'],
		aliases: APPLICATION_ALIASES,
		values: APPLICATION_VALUES,
	})
	const review = resolveAxis(source, {
		axis: 'review',
		paths: ['reviewStatus', 'review.status', 'voteStatus', 'vote.status'],
		aliases: REVIEW_ALIASES,
		values: REVIEW_VALUES,
	})
	const funding = resolveAxis(source, {
		axis: 'funding',
		paths: ['fundingStatus', 'funding.status', 'fundingOutcome'],
		aliases: FUNDING_ALIASES,
		values: FUNDING_VALUES,
	})

	// Existing rescueStorage records use `status` as a mixed compatibility
	// field. Read its unambiguous values into their own axis only when the new
	// axis has no explicit value; never use it to infer applicationStatus.
	const legacyStatus = text(source.status)
	const legacyReview = ['pending', 'approved', 'rejected'].includes(legacyStatus) ? legacyStatus : ''
	// In rescueStorage, `pending` and `rejected` are review values while
	// `unpaid` and `paid` are funding values. Do not let the generic funding
	// alias for `pending` reinterpret the former review state.
	const legacyFunding = ['unpaid', 'paid', 'funding_pending', 'funding_failed', 'funding_paid'].includes(legacyStatus)
		? FUNDING_ALIASES[legacyStatus]
		: ''
	const errors = [...application.errors, ...review.errors, ...funding.errors]

	let reviewResult = review.result
	if (!reviewResult.supplied && legacyReview) reviewResult = axisResult(legacyReview, 'status', true, true)
	else if (reviewResult.supplied && legacyReview && reviewResult.status !== legacyReview) {
		errors.push(freezeError('review', 'CONFLICTING_STATUS', ['reviewStatus', 'status'], 'review 状态与兼容 status 字段冲突，拒绝自动修复'))
		reviewResult = axisResult(UNKNOWN_STATE, null, false, true)
	}

	let fundingResult = funding.result
	if (!fundingResult.supplied && legacyFunding) fundingResult = axisResult(legacyFunding, 'status', true, true)
	else if (fundingResult.supplied && legacyFunding && fundingResult.status !== legacyFunding) {
		errors.push(freezeError('funding', 'CONFLICTING_STATUS', ['fundingStatus', 'status'], 'funding 状态与兼容 status 字段冲突，拒绝自动修复'))
		fundingResult = axisResult(UNKNOWN_STATE, null, false, true)
	}

	const applicationView = {
		status: application.result.status,
		known: application.result.known,
		source: application.result.source,
	}
	const reviewView = {
		status: reviewResult.status,
		known: reviewResult.known,
		source: reviewResult.source,
	}
	const fundingView = {
		status: fundingResult.status,
		known: fundingResult.known,
		source: fundingResult.source,
		// `null` means “not known to be paid”, rather than evidence of failure
		// or a synthesized unpaid transition. A paid claim is displayable only
		// when the cross-axis contract has no contradiction.
		paid: null,
		displayStatus: fundingResult.status,
	}
	const axisErrors = crossAxisErrors(applicationView, reviewView, fundingView)
	errors.push(...axisErrors)
	if (fundingView.status === RESCUE_FUNDING_STATUS.paid && errors.length) {
		fundingView.paid = false
		fundingView.displayStatus = UNKNOWN_STATE
	} else {
		fundingView.paid = fundingView.status === RESCUE_FUNDING_STATUS.paid
			? true
			: fundingView.known
				? false
				: null
	}
	const validity = errors.length
		? 'invalid'
		: [applicationView, reviewView, fundingView].some(axis => !axis.known)
			? 'unknown'
			: 'valid'

	return freezeProjection({
		validity,
		applicationStatus: applicationView.status,
		reviewStatus: reviewView.status,
		voteStatus: reviewView.status,
		fundingStatus: fundingView.status,
		application: applicationView,
		review: reviewView,
		vote: { ...reviewView },
		funding: fundingView,
		capabilities: {
			canWriteFunding: false,
			canTransitionFunding: false,
		},
		errors,
	})
}

/**
 * Parse a JSON/object state payload and return a fail-closed result. This is
 * deliberately a parser only; it never reads or writes application storage.
 */
export function parseRescueState(input = {}) {
	let value = input
	if (typeof input === 'string') {
		try {
			value = JSON.parse(input)
		} catch (error) {
			return Object.freeze({
				ok: false,
				code: 'INVALID_JSON',
				state: normalizeRescueState(null),
				error: '救助状态数据不是合法 JSON',
			})
		}
	}
	if (!isRecord(value)) {
		return Object.freeze({
			ok: false,
			code: 'INVALID_RECORD',
			state: normalizeRescueState(null),
			error: '救助状态数据不是对象',
		})
	}
	const state = normalizeRescueState(value)
	return Object.freeze({
		ok: state.validity !== 'invalid',
		code: state.validity === 'valid' ? 'OK' : 'STATE_UNKNOWN',
		state,
		error: state.errors[0]?.message || '',
	})
}

export function readRescueStateProjection(record = {}) {
	return normalizeRescueState(record)
}

// Explicit aliases make the read-only boundary easy to discover without
// creating a second implementation or a second storage adapter.
export const normalizeRescueStateProjection = normalizeRescueState
export const readRescueState = readRescueStateProjection
