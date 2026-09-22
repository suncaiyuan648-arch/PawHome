/** Local/mock yard reader and writer for the management editor. */
import { resolveTrustedActor } from '../../../navigation/actorCapabilities.js'
import { evaluateManagementCapabilities } from '../../../navigation/managementContracts.js'

export const YARD_STORAGE_KEY = 'PAWHOME_YARD_RECORDS'
const EDITABLE_FIELDS = Object.freeze(['name', 'avatar', 'description', 'intro', 'location', 'district', 'tags', 'gallery'])
const POLICY = Object.freeze({
	yard: Object.freeze({ readStates: ['active'], manageStates: ['active'], editStates: ['active'], ownerRoles: ['yard_owner'], yardOwnerRoles: ['yard_owner'] }),
})
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/

function result(success, data, error, extra = {}) {
	return Object.freeze({ success, data: data || null, error: error || null, readOnly: !success || extra.wrote !== true, canWrite: extra.wrote === true, ...extra })
}

function actorOf(actorProvider) {
	try {
		const actor = resolveTrustedActor(actorProvider)
		return actor ? { actor, error: null } : { actor: null, error: { code: 'NO_ACTOR' } }
	} catch (error) { return { actor: null, error } }
}

function storageOf(storage) {
	if (storage && typeof storage.getStorageSync === 'function' && typeof storage.setStorageSync === 'function') return storage
	if (typeof uni !== 'undefined' && uni && typeof uni.getStorageSync === 'function' && typeof uni.setStorageSync === 'function') return uni
	return null
}

function readRows(storage) {
	const target = storageOf(storage)
	if (!target) throw Object.assign(new Error('yard storage is unavailable'), { code: 'STORAGE_UNAVAILABLE' })
	let raw
	try { raw = target.getStorageSync(YARD_STORAGE_KEY) } catch (error) { throw Object.assign(new Error('yard storage read failed'), { code: 'STORAGE_READ_FAILED' }) }
	if (raw === undefined || raw === null || raw === '') return []
	let rows
	try { rows = typeof raw === 'string' ? JSON.parse(raw) : raw } catch (error) { throw Object.assign(new Error('yard storage is invalid'), { code: 'INVALID_STORAGE' }) }
	if (!Array.isArray(rows)) throw Object.assign(new Error('yard storage must be an array'), { code: 'INVALID_STORAGE' })
	return rows
}

function idOf(value) { return typeof value === 'string' && value === value.trim() && SAFE_ID.test(value) ? value : '' }
function copy(value) { return JSON.parse(JSON.stringify(value)) }
function failure(code, message, actor = null) { return result(false, null, { code, message }, { actor }) }

function isPublicRecord(record) {
	if (!record || typeof record !== 'object') return false
	if (record.visibility === 'private' || record.isPublic === false) return false
	const state = record.status || record.state
	return !state || state === 'active' || state === 'published'
}

/** Public read used by detail pages; query values never create or authorize a record. */
export function readPublicYard(yardId, { storage } = {}) {
	const id = idOf(yardId)
	if (!id) return failure('INVALID_ID', 'yardId is invalid')
	let rows
	try { rows = readRows(storage) } catch (error) { return failure(error.code || 'YARD_READ_FAILED', 'yard read failed closed') }
	const record = rows.find(item => item && typeof item === 'object' && item.yardId === id)
	if (!record) return failure('READER_MISSING', 'yard record is unavailable')
	if (!isPublicRecord(record)) return failure('FORBIDDEN', 'yard is not public')
	return result(true, { record: copy(record), access: { canRead: true, canEdit: false } }, null, { source: 'local', readOnly: true, canWrite: false })
}

function readAuthorized(id, record, actor) {
	const access = evaluateManagementCapabilities({ actorProvider: () => ({ actor }), yard: record, yardId: id, policy: POLICY })
	if (!access.capabilities['yard.edit']) return { access, error: access.reasons['yard.edit'] || 'FORBIDDEN' }
	return { access, error: null }
}

export function readLocalYard(yardId, { actorProvider, storage } = {}) {
	const id = idOf(yardId)
	if (!id) return failure('INVALID_ID', 'yardId is invalid')
	const resolved = actorOf(actorProvider)
	if (resolved.error || !resolved.actor) return failure(resolved.error && resolved.error.code || 'NO_ACTOR', 'trusted actor is unavailable')
	let rows
	try { rows = readRows(storage) } catch (error) { return failure(error.code || 'YARD_READ_FAILED', 'yard read failed closed', resolved.actor) }
	const record = rows.find(item => item && typeof item === 'object' && item.yardId === id)
	if (!record) return failure('READER_MISSING', 'yard record is unavailable', resolved.actor)
	const auth = readAuthorized(id, record, resolved.actor)
	if (auth.error) return failure('FORBIDDEN', 'yard edit is not allowed', resolved.actor)
	return result(true, { record: copy(record), access: { canRead: true, canEdit: true }, capabilities: auth.access.capabilities }, null, { actor: resolved.actor, source: 'local', readOnly: true, canWrite: false })
}

export function updateLocalYard(yardId, patch, { actorProvider, storage, now = new Date().toISOString() } = {}) {
	if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return failure('INVALID_PATCH', 'yard patch is invalid')
	const keys = Object.keys(patch)
	if (!keys.length) return failure('EMPTY_PATCH', 'yard patch is empty')
	if (keys.some(key => !EDITABLE_FIELDS.includes(key))) return failure('FIELD_NOT_EDITABLE', 'yard field is not editable')
	const current = readLocalYard(yardId, { actorProvider, storage })
	if (!current.success) return current
	const target = storageOf(storage)
	let rows
	try { rows = readRows(target) } catch (error) { return failure(error.code || 'YARD_READ_FAILED', 'yard read failed closed', current.actor) }
	const index = rows.findIndex(item => item && item.yardId === yardId)
	if (index < 0) return failure('READER_MISSING', 'yard record is unavailable', current.actor)
	const next = { ...rows[index], ...copy(patch), yardId, updatedAt: now }
	try { target.setStorageSync(YARD_STORAGE_KEY, JSON.stringify(rows.map((item, itemIndex) => itemIndex === index ? next : item))) } catch (error) { return failure('STORAGE_WRITE_FAILED', 'yard update was not acknowledged', current.actor) }
	return result(true, { record: copy(next), access: { canRead: true, canEdit: true } }, null, { actor: current.actor, source: 'local', wrote: true, readOnly: false, canWrite: true })
}

export { EDITABLE_FIELDS }
