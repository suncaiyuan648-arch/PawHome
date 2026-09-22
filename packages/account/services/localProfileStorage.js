/** Local/mock profile reader and writer for the profile editor page. */
import { resolveTrustedActor } from '../../../navigation/actorCapabilities.js'
import { evaluateManagementCapabilities } from '../../../navigation/managementContracts.js'

export const PROFILE_STORAGE_KEY = 'PAWHOME_PROFILE_RECORDS'
const EDITABLE_FIELDS = Object.freeze(['name', 'nickname', 'avatar', 'bio', 'tags'])
const POLICY = Object.freeze({ profile: Object.freeze({ readStates: ['active'], editStates: ['active'] }) })
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/

function result(success, data, error, extra = {}) {
	return Object.freeze({ success, data: data || null, error: error || null, readOnly: !success || extra.wrote !== true, canWrite: extra.wrote === true, ...extra })
}

function actorOf(actorProvider) {
	try {
		const actor = resolveTrustedActor(actorProvider)
		return actor ? { actor, error: null } : { actor: null, error: { code: 'NO_ACTOR' } }
	} catch (error) {
		return { actor: null, error }
	}
}

function storageOf(storage) {
	if (storage && typeof storage.getStorageSync === 'function' && typeof storage.setStorageSync === 'function') return storage
	if (typeof uni !== 'undefined' && uni && typeof uni.getStorageSync === 'function' && typeof uni.setStorageSync === 'function') return uni
	return null
}

function readRows(storage) {
	const target = storageOf(storage)
	if (!target) throw Object.assign(new Error('profile storage is unavailable'), { code: 'STORAGE_UNAVAILABLE' })
	let raw
	try { raw = target.getStorageSync(PROFILE_STORAGE_KEY) } catch (error) { throw Object.assign(new Error('profile storage read failed'), { code: 'STORAGE_READ_FAILED' }) }
	if (raw === undefined || raw === null || raw === '') return []
	let rows
	try { rows = typeof raw === 'string' ? JSON.parse(raw) : raw } catch (error) { throw Object.assign(new Error('profile storage is invalid'), { code: 'INVALID_STORAGE' }) }
	if (!Array.isArray(rows)) throw Object.assign(new Error('profile storage must be an array'), { code: 'INVALID_STORAGE' })
	return rows
}

function idOf(value) {
	if (typeof value !== 'string' || value !== value.trim() || !SAFE_ID.test(value)) return ''
	return value
}

function copy(value) {
	return JSON.parse(JSON.stringify(value))
}

function failure(code, message, actor = null) { return result(false, null, { code, message }, { actor }) }

function isPublicRecord(record) {
	if (!record || typeof record !== 'object') return false
	if (record.visibility === 'private' || record.isPublic === false) return false
	const state = record.status || record.state
	return !state || state === 'active' || state === 'published'
}

/** Read the public projection without accepting a query supplied identity. */
export function readPublicProfile(userId, { storage } = {}) {
	const id = idOf(userId)
	if (!id) return failure('INVALID_ID', 'profile userId is invalid')
	let rows
	try { rows = readRows(storage) } catch (error) { return failure(error.code || 'PROFILE_READ_FAILED', 'profile read failed closed') }
	const record = rows.find(item => item && typeof item === 'object' && item.userId === id)
	if (!record) return failure('READER_MISSING', 'profile record is unavailable')
	if (!isPublicRecord(record)) return failure('FORBIDDEN', 'profile is not public')
	return result(true, { record: copy(record), access: { canRead: true, canEdit: false } }, null, { source: 'local', readOnly: true, canWrite: false })
}

function authorize(userId, record, actor) {
	const access = evaluateManagementCapabilities({
		actorProvider: () => ({ actor }),
		profile: record,
		policy: POLICY,
		userId,
	})
	if (!access.capabilities['profile.edit']) return { access, error: access.reasons['profile.edit'] || 'FORBIDDEN' }
	return { access, error: null }
}

export function readLocalProfile(userId, { actorProvider, storage } = {}) {
	const id = idOf(userId)
	if (!id) return failure('INVALID_ID', 'profile userId is invalid')
	const resolved = actorOf(actorProvider)
	if (resolved.error || !resolved.actor) return failure(resolved.error && resolved.error.code || 'NO_ACTOR', 'trusted actor is unavailable')
	let rows
	try { rows = readRows(storage) } catch (error) { return failure(error.code || 'PROFILE_READ_FAILED', 'profile read failed closed', resolved.actor) }
	const record = rows.find(item => item && typeof item === 'object' && item.userId === id)
	if (!record) return failure('READER_MISSING', 'profile record is unavailable', resolved.actor)
	const auth = authorize(id, record, resolved.actor)
	if (auth.error) return failure('FORBIDDEN', 'profile edit is not allowed', resolved.actor)
	return result(true, { record: copy(record), access: { canRead: true, canEdit: true }, capabilities: auth.access.capabilities }, null, { actor: resolved.actor, readOnly: true, canWrite: false, source: 'local' })
}

export function updateLocalProfile(userId, patch, { actorProvider, storage, now = new Date().toISOString() } = {}) {
	if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return failure('INVALID_PATCH', 'profile patch is invalid')
	const keys = Object.keys(patch)
	if (!keys.length) return failure('EMPTY_PATCH', 'profile patch is empty')
	if (keys.some(key => !EDITABLE_FIELDS.includes(key))) return failure('FIELD_NOT_EDITABLE', 'profile field is not editable')
	const current = readLocalProfile(userId, { actorProvider, storage })
	if (!current.success) return current
	const target = storageOf(storage)
	let rows
	try { rows = readRows(target) } catch (error) { return failure(error.code || 'PROFILE_READ_FAILED', 'profile read failed closed', current.actor) }
	const index = rows.findIndex(item => item && item.userId === userId)
	if (index < 0) return failure('READER_MISSING', 'profile record is unavailable', current.actor)
	const next = { ...rows[index], ...copy(patch), userId, updatedAt: now }
	try { target.setStorageSync(PROFILE_STORAGE_KEY, JSON.stringify(rows.map((item, itemIndex) => itemIndex === index ? next : item))) } catch (error) { return failure('STORAGE_WRITE_FAILED', 'profile update was not acknowledged', current.actor) }
	return result(true, { record: copy(next), access: { canRead: true, canEdit: true } }, null, { actor: current.actor, source: 'local', wrote: true, readOnly: false, canWrite: true })
}

export { EDITABLE_FIELDS }
