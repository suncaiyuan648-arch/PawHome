/**
 * Read-only adapter for the adoption review queue and review detail.
 *
 * `adoptionReviewContract.js` owns the adoption review capability boundary.
 * This module only binds that contract to the existing PAWHOME_ADOPTIONS
 * reader.  Persisted records are the only source here; demo records, route
 * query fields, displayed roles, and caller supplied records/resolvers are
 * never allowed to become reviewer authority.
 */
import {
	getAdoptionReviewList as readReviewListContract,
	getAdoptionReviewDetail as readReviewDetailContract,
} from '../../../navigation/adoptionReviewContract.js'
import { getAdoptionRecords } from '../../../utils/adoptionStorage.js'

const REVIEWER_ROLES = Object.freeze(['owner', 'cloud_parent', 'reviewer'])
const REAL_ADOPTION_READ_OPTIONS = Object.freeze({ includeDemo: false })
const ACTOR_SESSION_STORAGE_KEY = 'PAWHOME_ACTOR_SESSION'

function isRecord(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function optionsOf(value) {
	return isRecord(value) ? value : {}
}

function own(value, key) {
	return Object.prototype.hasOwnProperty.call(value, key)
}

function errorCode(error, fallback) {
	return error && typeof error.code === 'string' && error.code ? error.code : fallback
}

function frozenEmptyList(code) {
	const empty = Object.freeze([])
	return Object.freeze({
		actor: null,
		items: empty,
		pending: empty,
		processed: empty,
		canWrite: false,
		readOnly: true,
		diagnostics: Object.freeze({
			scanned: 0,
			accepted: 0,
			skipped: empty,
			actorError: Object.freeze({ code }),
		}),
	})
}

function frozenEmptyDetail(code) {
	return Object.freeze({
		actor: null,
		item: null,
		canRead: false,
		canWrite: false,
		readOnly: true,
		reason: code,
		diagnostics: Object.freeze({ actorError: Object.freeze({ code }) }),
	})
}

function reviewerRoleOf(value) {
	if (value === undefined || value === null || value === '') return ''
	return typeof value === 'string' ? value.trim() : value
}

function assertReviewerRole(role) {
	if (role && !REVIEWER_ROLES.includes(role)) {
		throw Object.assign(new Error('reviewer perspective is unsupported'), { code: 'INVALID_REVIEWER_ROLE' })
	}
	return role
}

/** Resolve the current reviewer session afresh for every page read/action. */
export function createReviewSessionProvider() {
	return () => {
		if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') return null
		try { return uni.getStorageSync(ACTOR_SESSION_STORAGE_KEY) || null } catch (error) { return null }
	}
}

function readStoredRecords() {
	// adoptionStorage deliberately owns normalization and the PAWHOME_ADOPTIONS
	// key.  Its includeDemo:false mode is mandatory for reviewer production data.
	return getAdoptionRecords(REAL_ADOPTION_READ_OPTIONS).map((record) => {
		// The legacy storage normalizer materializes empty compatibility aliases
		// (`ownerPawId`/`cloudParentPawId`) on every record.  An empty alias is
		// absence, not an actor relation; remove only those generated empties so
		// the canonical contract can validate the real relation fields.  Any
		// non-empty alias remains visible and conflicting aliases still fail closed.
		if (!isRecord(record)) return record
		const copy = { ...record }
		for (const field of ['ownerPawId', 'cloudParentPawId']) {
			if (copy[field] === '') delete copy[field]
		}
		return copy
	})
}

function filterByReviewerRole(records, reviewerRole) {
	if (!reviewerRole) return records
	return records.filter((record) => (
		record && isRecord(record.review) && record.review.reviewerRole === reviewerRole
	))
}

function idAliasMatches(record, field, expected) {
	const review = record && isRecord(record.review) ? record.review : null
	const values = []
	for (const source of [record, review]) {
		if (!source || !own(source, field)) continue
		values.push(source[field])
	}
	return values.some((value) => value === expected)
}

function findStoredReview(context, reviewerRole) {
	const records = filterByReviewerRole(readStoredRecords(), reviewerRole)
	const applicationId = context.applicationId
	const reviewItemId = context.reviewItemId
	const matches = records.filter((record) => {
		// A detail lookup is anchored to the nested review item and, when
		// supplied, the exact application alias.  Application-only legacy links
		// are accepted only when they resolve to one and only one review item;
		// there is no first/last/demo fallback and no lookup by applicant or
		// displayed role.
		if (reviewItemId && !idAliasMatches(record && record.review, 'reviewItemId', reviewItemId)) return false
		return !applicationId || idAliasMatches(record, 'applicationId', applicationId)
	})
	return matches.length === 1 ? matches[0] : null
}

function reviewList(options) {
	const source = optionsOf(options)
	const reviewerRole = reviewerRoleOf(source.reviewerRole)
	try {
		assertReviewerRole(reviewerRole)
		return readReviewListContract({
			actorProvider: source.actorProvider,
			filter: source.filter,
			resolver: () => filterByReviewerRole(readStoredRecords(), reviewerRole),
		})
	} catch (error) {
		return frozenEmptyList(errorCode(error, 'ADOPTION_REVIEW_READ_FAILED'))
	}
}

function reviewDetail(options) {
	const source = optionsOf(options)
	const reviewerRole = reviewerRoleOf(source.reviewerRole)
	try {
		assertReviewerRole(reviewerRole)
		let reviewItemId = source.reviewItemId
		if (!reviewItemId && source.applicationId) {
			const candidate = findStoredReview({ applicationId: source.applicationId }, reviewerRole)
			const nestedReview = candidate && isRecord(candidate.review) ? candidate.review : null
			reviewItemId = nestedReview && nestedReview.reviewItemId || candidate && candidate.reviewItemId || ''
		}
		return readReviewDetailContract({
			actorProvider: source.actorProvider,
			applicationId: source.applicationId,
			reviewItemId,
			// This adapter is exclusively the reviewer surface.  A caller cannot
			// switch it into the applicant private-detail branch via query data.
			perspective: 'reviewer',
			resolver: (context) => findStoredReview(context, reviewerRole),
		})
	} catch (error) {
		return frozenEmptyDetail(errorCode(error, 'ADOPTION_REVIEW_READ_FAILED'))
	}
}

export function readAdoptionReviewList(options = {}) {
	return reviewList(options)
}

export function readAdoptionReviewDetail(options = {}) {
	return reviewDetail(options)
}

export const getAdoptionReviewList = readAdoptionReviewList
export const getAdoptionReviewDetail = readAdoptionReviewDetail
