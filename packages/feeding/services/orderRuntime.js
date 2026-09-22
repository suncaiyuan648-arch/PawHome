/**
 * Package-local persisted order reader used by the order detail page.
 *
 * The full order contract remains in `orderAdapter.js` for governance and
 * future backend adapters.  This small reader keeps the registered feeding
 * page out of the main package: it reads only the two persisted order keys,
 * applies the current actor scope, and never creates a fixture or a write
 * capability.
 */

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const CROSS_DOMAIN = ['application', 'adoption', 'rescue', 'dynamic', 'animal', 'yard']

function freeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value
  seen.add(value)
  for (const key of Reflect.ownKeys(value)) freeze(value[key], seen)
  return Object.freeze(value)
}

function fail(code, message, actor = null) {
  return freeze({ success: false, data: null, error: { code, message }, actor, readOnly: true, canWrite: false })
}

function id(value, label) {
  const result = typeof value === 'string' ? value.trim() : value === undefined || value === null ? '' : String(value)
  if (!result || !SAFE_ID.test(result) || URL_MARKERS.test(result)) throw Object.assign(new Error(`${label} is invalid`), { code: 'INVALID_ID' })
  const lower = result.toLowerCase()
  if (CROSS_DOMAIN.some(prefix => lower === prefix || lower.startsWith(`${prefix}-`) || lower.startsWith(`${prefix}_`) || lower.startsWith(`${prefix}:`))) {
    throw Object.assign(new Error(`${label} belongs to another domain`), { code: 'CROSS_DOMAIN_ID' })
  }
  return result
}

function relatedId(value, label) {
  const result = typeof value === 'string' ? value.trim() : value === undefined || value === null ? '' : String(value)
  if (!result || !SAFE_ID.test(result) || URL_MARKERS.test(result)) throw Object.assign(new Error(`${label} is invalid`), { code: 'INVALID_ID' })
  return result
}

function actorOf(provider) {
  let value
  try { value = typeof provider === 'function' ? provider() : null } catch (error) { return { actor: null, error: { code: 'ACTOR_PROVIDER_FAILED' } } }
  const actor = value && typeof value === 'object' && value.actor ? value.actor : value
  if (!actor || typeof actor !== 'object' || Array.isArray(actor)) return { actor: null, error: { code: 'NO_ACTOR' } }
  try { return { actor: freeze({ id: id(actor.id || actor.actorId, 'actor.id') }), error: null } } catch (error) { return { actor: null, error } }
}

function rows(key) {
  let raw
  try { raw = uni.getStorageSync(key) } catch (error) { throw Object.assign(new Error('order storage read failed'), { code: 'STORAGE_READ_FAILED' }) }
  if (raw === undefined || raw === null || raw === '') return []
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(parsed)) throw new Error('order storage must be an array')
    return parsed.filter(item => item && typeof item === 'object' && !Array.isArray(item))
  } catch (error) { throw Object.assign(new Error('order storage is invalid'), { code: 'INVALID_ORDER_STORAGE' }) }
}

function scoped(record, actorId) {
  return [record.userId, record.userPawId, record.donorId, record.applicantId, record.yardOwnerId, record.ownerPawId].some(value => value === actorId)
}

function adoptionApplication(applicationId) {
  if (!applicationId) return null
  const records = rows('PAWHOME_ADOPTIONS')
  return records.find(record => record && [record.id, record.recordId, record.applicationId].some(value => String(value || '') === applicationId)) || null
}

function canReadReward(record, actorId) {
  const applicationId = String(record && (record.applicationId || record.recordId) || '')
  if (!applicationId) return false
  const directActors = [record.userId, record.userPawId, record.applicantId, record.applicantUserId]
    .map(value => String(value || '')).filter(Boolean)
  const application = adoptionApplication(applicationId)
  if (application) {
    const applicants = [application.applicantId, application.applicantUserId]
      .map(value => String(value || '')).filter(Boolean)
    if (!applicants.length || !applicants.every(value => value === actorId)) return false
  }
  // A legacy order can be read only when its persisted user binding agrees
  // with the trusted actor.  Once the application row exists, the application
  // relation above is authoritative as well.
  return directActors.length > 0 && directActors.every(value => value === actorId)
}

function statusOf(record) {
  const raw = String(record.status || record.stateKey || '').trim()
  return ({
    'waiting-logistics': 'shipping',
    'waiting-cloud-effective': 'shipping',
    'cloud-active-timeout': 'delivered',
    'cloud-active-feedback': 'delivered',
    done: 'completed',
    fulfilled: 'completed',
  })[raw] || raw || 'pending'
}

function orderOf(record, orderType) {
  const orderId = record.orderId || record.id
  if (!orderId) return null
  return freeze({
    orderId: id(orderId, 'orderId'),
    orderType,
    ...(record.applicationId ? { applicationId: relatedId(record.applicationId, 'applicationId') } : {}),
    ...(record.userId || record.userPawId ? { userId: String(record.userId || record.userPawId) } : {}),
    ...(record.yardId ? { yardId: relatedId(record.yardId, 'yardId') } : {}),
    ...(record.animalId || record.petId ? { animalId: relatedId(record.animalId || record.petId, 'animalId') } : {}),
    status: statusOf(record),
    ...(record.createdAt ? { createdAt: record.createdAt } : {}),
    ...(record.updatedAt ? { updatedAt: record.updatedAt } : {}),
  })
}

export async function readPersistedOrderDetail(orderId, { actorProvider, hiddenEntries = [] } = {}) {
  const resolved = actorOf(actorProvider)
  if (resolved.error || !resolved.actor) return fail(resolved.error.code, 'trusted actor is unavailable')
  let target
  try { target = id(orderId, 'orderId') } catch (error) { return fail(error.code, 'order ID is invalid', resolved.actor) }
  if (Array.isArray(hiddenEntries) && hiddenEntries.some(item => item && item.userId === resolved.actor.id && item.orderId === target && item.hidden === true)) {
    return fail('HIDDEN', 'order is hidden for this actor', resolved.actor)
  }
  try {
    const candidates = [
      ...rows('PAWHOME_REWARD_ORDERS').map(record => ({ record, orderType: 'adoption_gift' })),
      ...rows('PAWHOME_FEEDING_ORDERS').map(record => ({ record, orderType: 'normal_feed' })),
    ]
    const match = candidates.find(({ record }) => String(record.orderId || record.id || '') === target)
    if (!match) return fail('NOT_FOUND', 'order was not found', resolved.actor)
    const visible = match.orderType === 'adoption_gift'
      ? canReadReward(match.record, resolved.actor.id)
      : scoped(match.record, resolved.actor.id)
    if (!visible) return fail('NOT_FOUND', 'order was not found', resolved.actor)
    const order = orderOf(match.record, match.orderType)
    if (!order) return fail('INVALID_ORDER_RECORD', 'order record is invalid', resolved.actor)
    return freeze({ success: true, data: { order, access: { canRead: true, canWrite: false } }, error: null, actor: resolved.actor, readOnly: true, canWrite: false })
  } catch (error) { return fail(error.code || 'ORDER_READ_FAILED', 'order detail read failed closed', resolved.actor) }
}

export const readOrderDetail = readPersistedOrderDetail
