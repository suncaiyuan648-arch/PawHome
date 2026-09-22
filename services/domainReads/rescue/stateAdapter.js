/**
 * Read-only rescue state adapter.
 *
 * `stateContract.js` is deliberately storage agnostic.  This seam binds it to
 * the existing `PAWHOME_RESCUES` repository without introducing another key or
 * allowing a query parameter to manufacture a status.  The default is a
 * persisted record lookup (`includeDemo: false`); callers that explicitly
 * render a public demonstration may opt into the existing demo fallback.
 */
import { getRescueById } from '../../../utils/rescueStorage.js'
import { normalizeRescueState } from './stateContract.js'

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/

function normalizeId(value) {
	return value === undefined || value === null ? '' : String(value).trim()
}

function hasOuterWhitespace(value) {
	return typeof value === 'string' && value !== value.trim()
}

function resultFailure(code, message) {
	return Object.freeze({
		success: false,
		source: 'mock',
		data: null,
		error: Object.freeze({ code, message }),
		readOnly: true,
		canWrite: false
	})
}

function resultSuccess(rescueId, state) {
	return Object.freeze({
		success: true,
		source: 'mock',
		data: Object.freeze({ rescueId, state }),
		error: null,
		readOnly: true,
		canWrite: false
	})
}

function readStateFromRecord(rescueId, record) {
	if (!record) return resultFailure('NOT_FOUND', '找不到这条救助记录')
	let state
	try {
		state = normalizeRescueState(record)
	} catch (error) {
		return resultFailure('STATE_READ_FAILED', '救助状态读取失败')
	}
	return resultSuccess(rescueId, state)
}

/**
 * Read one rescue state by its explicit rescueId.  `options` is a migration
 * seam only: it may choose the repository's documented demo fallback, but it
 * never changes actor, status, or capability semantics.
 */
export function readRescueStateById(rescueId, options = {}) {
	if (hasOuterWhitespace(rescueId)) return resultFailure('INVALID_ID', '救助单 ID 格式不合法')
	const id = normalizeId(rescueId)
	if (!id) return resultFailure('MISSING_ID', '缺少救助单 ID')
	if (!ID_PATTERN.test(id) || /[/?#%]|:\/\//.test(id)) {
		return resultFailure('INVALID_ID', '救助单 ID 格式不合法')
	}
	const source = options && typeof options === 'object' ? options : {}
	const includeDemo = source.includeDemo === true
	try {
		const record = getRescueById(id, { includeDemo })
		return readStateFromRecord(id, record)
	} catch (error) {
		return resultFailure('STORAGE_READ_FAILED', '救助状态读取失败')
	}
}

/**
 * Injected resolver variant used by tests and future request/cloud adapters.
 * A resolver is synchronous by contract; a Promise is rejected so callers do
 * not accidentally treat an unfinished read as authoritative state.
 */
export function readRescueStateWithResolver(rescueId, options = {}) {
	if (hasOuterWhitespace(rescueId)) return resultFailure('INVALID_ID', '救助单 ID 格式不合法')
	const id = normalizeId(rescueId)
	if (!id) return resultFailure('MISSING_ID', '缺少救助单 ID')
	if (!ID_PATTERN.test(id) || /[/?#%]|:\/\//.test(id)) {
		return resultFailure('INVALID_ID', '救助单 ID 格式不合法')
	}
	const source = options && typeof options === 'object' ? options : {}
	const resolver = source.resolver
	if (typeof resolver !== 'function') return resultFailure('RESOLVER_REQUIRED', '救助状态读取器不可用')
	let record
	try {
		record = resolver(Object.freeze({ rescueId: id, includeDemo: source.includeDemo === true }))
	} catch (error) {
		return resultFailure('STORAGE_READ_FAILED', '救助状态读取失败')
	}
	if (record && typeof record.then === 'function') {
		return resultFailure('ASYNC_RESOLVER_UNSUPPORTED', '救助状态读取器必须同步返回')
	}
	return readStateFromRecord(id, record)
}
