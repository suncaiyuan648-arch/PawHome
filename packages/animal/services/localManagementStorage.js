/** Local/mock animal reader and writer for the management editor. */
import { resolveTrustedActor } from '../../../navigation/actorCapabilities.js'
import { evaluateManagementCapabilities } from '../../../navigation/managementContracts.js'

export const ANIMAL_STORAGE_KEY = 'PAWHOME_ANIMAL_RECORDS'
export const YARD_STORAGE_KEY = 'PAWHOME_YARD_RECORDS'
const EDITABLE_FIELDS = Object.freeze([
	'species', 'name', 'avatar', 'breed', 'tags', 'description', 'desc', 'status', 'state',
	'petValue', 'value', 'gender', 'neuter', 'vaccine', 'personality', 'birthday', 'birthValue'
])
const POLICY = Object.freeze({
	 yard: Object.freeze({ readStates: ['active'], manageStates: ['active'], editStates: ['active'], ownerRoles: ['yard_owner'], yardOwnerRoles: ['yard_owner'] }),
	 animal: Object.freeze({ readStates: ['active'], manageStates: ['active'], editStates: ['active'], yardOwnerRoles: ['yard_owner'], managerRoles: ['animal_manager'] }),
})
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const STATUS_LABELS = new Set(['待领养', '已领养', '失踪', '死亡'])

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

function readRows(storage, key) {
	const target = storageOf(storage)
	if (!target) throw Object.assign(new Error('animal storage is unavailable'), { code: 'STORAGE_UNAVAILABLE' })
	let raw
	try { raw = target.getStorageSync(key) } catch (error) { throw Object.assign(new Error('animal storage read failed'), { code: 'STORAGE_READ_FAILED' }) }
	if (raw === undefined || raw === null || raw === '') return []
	let rows
	try { rows = typeof raw === 'string' ? JSON.parse(raw) : raw } catch (error) { throw Object.assign(new Error('animal storage is invalid'), { code: 'INVALID_STORAGE' }) }
	if (!Array.isArray(rows)) throw Object.assign(new Error('animal storage must be an array'), { code: 'INVALID_STORAGE' })
	return rows
}

function idOf(value) { return typeof value === 'string' && value === value.trim() && SAFE_ID.test(value) ? value : '' }
function copy(value) { return JSON.parse(JSON.stringify(value)) }
function failure(code, message, actor = null) { return result(false, null, { code, message }, { actor }) }
function normalizeStatus(value, fallback = 'active') {
	const text = typeof value === 'string' ? value.trim() : ''
	return STATUS_LABELS.has(text) ? 'active' : (text || fallback)
}

function normalizeSpecies(patch = {}) {
	if (patch.species === 'dog' || patch.kind === 'dog') return 'dog'
	if (patch.species === 'cat' || patch.kind === 'cat') return 'cat'
	const breed = typeof patch.breed === 'string' ? patch.breed : ''
	return /金毛|柴犬|拉布拉多|边牧|萨摩耶|哈士奇|贵宾|泰迪|柯基|牧羊犬|雪纳瑞|比熊|狗/.test(breed) ? 'dog' : 'cat'
}

function isPublicRecord(record) {
	if (!record || typeof record !== 'object') return false
	if (record.visibility === 'private' || record.isPublic === false) return false
	const state = record.status || record.state
	return !state || state === 'active' || state === 'published' || state === '待领养' || state === '已领养'
}

/** Public read used by detail/roster pages; it never evaluates management access. */
export function readPublicAnimal(animalId, { yardId, storage } = {}) {
	const id = idOf(animalId)
	if (!id) return failure('INVALID_ID', 'animalId is invalid')
	const requestedYardId = yardId === undefined || yardId === '' ? '' : idOf(yardId)
	if (yardId !== undefined && !requestedYardId) return failure('INVALID_ID', 'yardId is invalid')
	let rows
	try { rows = readRows(storage, ANIMAL_STORAGE_KEY) } catch (error) { return failure(error.code || 'ANIMAL_READ_FAILED', 'animal read failed closed') }
	const record = rows.find(item => item && typeof item === 'object' && item.animalId === id)
	if (!record) return failure('READER_MISSING', 'animal record is unavailable')
	if (requestedYardId && record.yardId !== requestedYardId) return failure('CROSS_YARD_RELATION', 'animal does not belong to yardId')
	if (!isPublicRecord(record)) return failure('FORBIDDEN', 'animal is not public')
	return result(true, { record: copy(record), access: { canRead: true, canEdit: false } }, null, { source: 'local', readOnly: true, canWrite: false })
}

function readParentYard(yardId, storage) {
	try { return readRows(storage, YARD_STORAGE_KEY).find(item => item && item.yardId === yardId) || null } catch (error) { return null }
}

function authorize(animalId, yardId, record, yard, actor) {
	const access = evaluateManagementCapabilities({
		actorProvider: () => ({ actor }),
		animal: record,
		yard: yard || undefined,
		animalId,
		yardId,
		policy: POLICY,
	})
	if (!access.capabilities['animal.edit']) return { access, error: access.reasons['animal.edit'] || 'FORBIDDEN' }
	return { access, error: null }
}

function authorizeYard(yardId, yard, actor) {
	const access = evaluateManagementCapabilities({
		actorProvider: () => ({ actor }),
		yard,
		yardId,
		policy: POLICY,
	})
	if (!access.capabilities['yard.edit']) return { access, error: access.reasons['yard.edit'] || 'FORBIDDEN' }
	return { access, error: null }
}

export function readLocalAnimal(animalId, { yardId, actorProvider, storage } = {}) {
	const id = idOf(animalId)
	if (!id) return failure('INVALID_ID', 'animalId is invalid')
	const requestedYardId = yardId === undefined || yardId === '' ? '' : idOf(yardId)
	if (yardId !== undefined && !requestedYardId) return failure('INVALID_ID', 'yardId is invalid')
	const resolved = actorOf(actorProvider)
	if (resolved.error || !resolved.actor) return failure(resolved.error && resolved.error.code || 'NO_ACTOR', 'trusted actor is unavailable')
	let rows
	try { rows = readRows(storage, ANIMAL_STORAGE_KEY) } catch (error) { return failure(error.code || 'ANIMAL_READ_FAILED', 'animal read failed closed', resolved.actor) }
	const record = rows.find(item => item && typeof item === 'object' && item.animalId === id)
	if (!record) return failure('READER_MISSING', 'animal record is unavailable', resolved.actor)
	if (requestedYardId && record.yardId !== requestedYardId) return failure('CROSS_YARD_RELATION', 'animal does not belong to yardId', resolved.actor)
	const parent = readParentYard(record.yardId, storage)
	const auth = authorize(id, record.yardId, record, parent, resolved.actor)
	if (auth.error) return failure('FORBIDDEN', 'animal edit is not allowed', resolved.actor)
	return result(true, { record: copy(record), access: { canRead: true, canEdit: true }, capabilities: auth.access.capabilities }, null, { actor: resolved.actor, source: 'local', readOnly: true, canWrite: false })
}

export function updateLocalAnimal(animalId, patch, { yardId, actorProvider, storage, now = new Date().toISOString() } = {}) {
	if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return failure('INVALID_PATCH', 'animal patch is invalid')
	if (Object.prototype.hasOwnProperty.call(patch, 'species') && !['cat', 'dog'].includes(patch.species)) return failure('INVALID_SPECIES', 'species must be cat or dog')
	const keys = Object.keys(patch)
	if (!keys.length) return failure('EMPTY_PATCH', 'animal patch is empty')
	if (keys.some(key => !EDITABLE_FIELDS.includes(key))) return failure('FIELD_NOT_EDITABLE', 'animal field is not editable')
	const current = readLocalAnimal(animalId, { yardId, actorProvider, storage })
	if (!current.success) return current
	const target = storageOf(storage)
	let rows
	try { rows = readRows(target, ANIMAL_STORAGE_KEY) } catch (error) { return failure(error.code || 'ANIMAL_READ_FAILED', 'animal read failed closed', current.actor) }
	const index = rows.findIndex(item => item && item.animalId === animalId)
	if (index < 0) return failure('READER_MISSING', 'animal record is unavailable', current.actor)
	const next = {
		...rows[index],
		...copy(patch),
		species: patch.species || rows[index].species || 'cat',
		animalId,
		yardId: rows[index].yardId,
		updatedAt: now,
	}
	if (patch.status || patch.state) {
		next.statusLabel = patch.status || patch.state
		next.status = normalizeStatus(patch.status || patch.state, rows[index].status || 'active')
	}
	try { target.setStorageSync(ANIMAL_STORAGE_KEY, JSON.stringify(rows.map((item, itemIndex) => itemIndex === index ? next : item))) } catch (error) { return failure('STORAGE_WRITE_FAILED', 'animal update was not acknowledged', current.actor) }
	return result(true, { record: copy(next), access: { canRead: true, canEdit: true } }, null, { actor: current.actor, source: 'local', wrote: true, readOnly: false, canWrite: true })
}

/** Create a managed animal record in local storage after a fresh yard check. */
export function createLocalAnimal(yardId, patch = {}, { actorProvider, storage, now = new Date().toISOString() } = {}) {
	const requestedYardId = idOf(yardId)
	if (!requestedYardId) return failure('INVALID_ID', 'yardId is invalid')
	if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return failure('INVALID_PATCH', 'animal patch is invalid')
	if (Object.prototype.hasOwnProperty.call(patch, 'species') && !['cat', 'dog'].includes(patch.species)) return failure('INVALID_SPECIES', 'species must be cat or dog')
	const keys = Object.keys(patch)
	if (keys.some(key => !EDITABLE_FIELDS.includes(key))) return failure('FIELD_NOT_EDITABLE', 'animal field is not editable')
	if (patch.species !== undefined && !['cat', 'dog'].includes(patch.species)) return failure('INVALID_SPECIES', 'species must be cat or dog')
	if (!String(patch.name || '').trim()) return failure('INVALID_NAME', 'animal name is required')
	if (!String(patch.breed || '').trim()) return failure('INVALID_BREED', 'animal breed is required')
	const resolved = actorOf(actorProvider)
	if (resolved.error || !resolved.actor) return failure(resolved.error && resolved.error.code || 'NO_ACTOR', 'trusted actor is unavailable')
	const yard = readParentYard(requestedYardId, storage)
	if (!yard) return failure('YARD_MISSING', 'yard record is unavailable', resolved.actor)
	const yardAuth = authorizeYard(requestedYardId, yard, resolved.actor)
	if (yardAuth.error) return failure('FORBIDDEN', 'animal create is not allowed', resolved.actor)
	const target = storageOf(storage)
	let rows
	try { rows = readRows(target, ANIMAL_STORAGE_KEY) } catch (error) { return failure(error.code || 'ANIMAL_READ_FAILED', 'animal read failed closed', resolved.actor) }
	const animalId = `animal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
	const statusLabel = patch.status || patch.state || '待领养'
	const next = {
		...copy(patch),
		species: normalizeSpecies(patch),
		animalId,
		yardId: requestedYardId,
		yardOwnerId: yard.yardOwnerId || yard.ownerId || yard.ownerUserId || undefined,
		status: normalizeStatus(statusLabel),
		statusLabel,
		visibility: patch.visibility || 'public',
		createdAt: now,
		updatedAt: now,
	}
	try { target.setStorageSync(ANIMAL_STORAGE_KEY, JSON.stringify(rows.concat(next))) } catch (error) { return failure('STORAGE_WRITE_FAILED', 'animal create was not acknowledged', resolved.actor) }
	return result(true, { record: copy(next), access: { canRead: true, canEdit: true }, capabilities: yardAuth.access.capabilities }, null, { actor: resolved.actor, source: 'local', wrote: true, readOnly: false, canWrite: true })
}

export function canCreateLocalAnimal(yardId, { actorProvider, storage } = {}) {
	const requestedYardId = idOf(yardId)
	if (!requestedYardId) return failure('INVALID_ID', 'yardId is invalid')
	const resolved = actorOf(actorProvider)
	if (resolved.error || !resolved.actor) return failure(resolved.error && resolved.error.code || 'NO_ACTOR', 'trusted actor is unavailable')
	const yard = readParentYard(requestedYardId, storage)
	if (!yard) return failure('YARD_MISSING', 'yard record is unavailable', resolved.actor)
	const auth = authorizeYard(requestedYardId, yard, resolved.actor)
	if (auth.error) return failure('FORBIDDEN', 'animal create is not allowed', resolved.actor)
	return result(true, { yard: copy(yard), access: { canRead: true, canEdit: true }, capabilities: auth.access.capabilities }, null, { actor: resolved.actor, source: 'local', readOnly: true, canWrite: false })
}

export { EDITABLE_FIELDS }
