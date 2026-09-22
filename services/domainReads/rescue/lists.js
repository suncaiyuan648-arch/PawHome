import {
	readRescueMine as readRescueMineContract,
	readRescueReviewList as readRescueReviewListContract
} from '../../../navigation/rescueListContract.js'
import { getRescueRecords } from '../../../utils/rescueStorage.js'

/**
 * Read-only rescue list adapter backed by the existing PAWHOME_RESCUES key.
 *
 * The list contract owns actor and record validation.  This module only binds
 * that contract to the real rescue storage reader: demo records are always
 * excluded, callers cannot inject records/resolvers, and no write API is
 * exposed here.
 */

const REAL_RESCUE_READ_OPTIONS = Object.freeze({ includeDemo: false })
const REVIEW_STATUS_VALUES = Object.freeze(['pending', 'approved', 'rejected'])

function optionsOf(options) {
	return options && typeof options === 'object' && !Array.isArray(options) ? options : {}
}

function readCurrentRescueRecords(context) {
	// The contract resolves the actor before invoking this resolver.  Keeping
	// the context intentionally unused prevents storage from treating a query
	// field or a displayed role as an authorization source.
	void context
	return getRescueRecords(REAL_RESCUE_READ_OPTIONS)
}

function explicitReviewStatuses(record) {
	const values = []
	const sources = [
		[record, 'reviewStatus'],
		[record, 'voteStatus'],
		[record && record.review, 'status'],
		[record && record.review, 'reviewStatus'],
		[record && record.review, 'voteStatus'],
	]
	for (const [source, field] of sources) {
		if (!source || !Object.prototype.hasOwnProperty.call(source, field) || source[field] === undefined) continue
		const value = String(source[field]).trim()
		if (!values.includes(value)) values.push(value)
	}
	return values
}

function adaptReviewRecord(record) {
	if (!record || typeof record !== 'object' || Array.isArray(record) || !Object.prototype.hasOwnProperty.call(record, 'status')) return record
	const legacyStatus = record.status === undefined || record.status === null ? '' : String(record.status).trim()
	const explicit = explicitReviewStatuses(record)
	// rescueStorage keeps a legacy status field on every normalized record. If
	// an explicit review alias repeats that same value, remove only the
	// redundant compatibility alias; disagreement remains in the record so the
	// canonical contract rejects it instead of repairing a conflict.
	if (explicit.length === 1 && explicit[0] === legacyStatus && REVIEW_STATUS_VALUES.includes(legacyStatus)) {
		const copy = { ...record }
		delete copy.status
		return copy
	}
	return record
}

function readCurrentReviewRecords(context) {
	const records = readCurrentRescueRecords(context)
	return Array.isArray(records) ? records.map(adaptReviewRecord) : records
}

function readOnlyModel(model) {
	return Object.freeze({
		...model,
		readOnly: true,
		canWrite: false,
	})
}

function failedReadModel(error) {
	const items = Object.freeze([])
	return Object.freeze({
		actor: null,
		items,
		pending: items,
		processed: items,
		readOnly: true,
		canWrite: false,
		diagnostics: Object.freeze({
			scanned: 0,
			accepted: 0,
			skipped: items,
			actorError: Object.freeze({ code: error && error.code ? error.code : 'RESCUE_LIST_READ_FAILED' }),
		}),
	})
}

function safelyRead(read) {
	try {
		return readOnlyModel(read())
	} catch (error) {
		// A malformed filter or an unexpected contract boundary error must not
		// become a partial list or an implicit authorization result.
		return failedReadModel(error)
	}
}

/** Read the current actor's own rescue applications from real storage. */
export function readRescueMine(options = {}) {
	const source = optionsOf(options)
	return safelyRead(() => readRescueMineContract({
		actorProvider: source.actorProvider,
		filter: source.filter,
		resolver: readCurrentRescueRecords,
	}))
}

/** Read rescue review tasks explicitly assigned to the current reviewer. */
export function readRescueReviewList(options = {}) {
	const source = optionsOf(options)
	return safelyRead(() => readRescueReviewListContract({
		actorProvider: source.actorProvider,
		filter: source.filter,
		resolver: readCurrentReviewRecords,
	}))
}

export const getRescueMine = readRescueMine
export const getRescueReviewList = readRescueReviewList
