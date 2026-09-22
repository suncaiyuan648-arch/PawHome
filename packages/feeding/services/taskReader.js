/**
 * Persistent feeding task reader for the account-task bridge.
 *
 * It consumes only the explicit `PAWHOME_FEEDING_ORDERS` array and a trusted
 * actor.  No fixture fallback, query role, or status override is accepted.
 */
const STORAGE_KEY = 'PAWHOME_FEEDING_ORDERS'
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//

function frozen(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value
  seen.add(value); for (const key of Reflect.ownKeys(value)) frozen(value[key], seen); return Object.freeze(value)
}
function fail(code) { return frozen({ success: false, data: { items: [] }, error: { code }, readOnly: true, canWrite: false }) }
function id(value) { return typeof value === 'string' && value && value === value.trim() && SAFE_ID.test(value) && !URL_MARKERS.test(value) }
function actorOf(provider) {
  let value
  try { value = typeof provider === 'function' ? provider() : null } catch (error) { return null }
  const actor = value && value.actor ? value.actor : value
  return actor && typeof actor.id === 'string' && id(actor.id) && Array.isArray(actor.roles) ? frozen({ id: actor.id, roles: actor.roles.slice() }) : null
}
function read() {
  let raw
  try { raw = uni.getStorageSync(STORAGE_KEY) } catch (error) { return { rows: [], error: 'STORAGE_READ_FAILED', present: true } }
  if (raw === undefined || raw === null || raw === '') return { rows: [], error: null, present: false }
  try { const value = typeof raw === 'string' ? JSON.parse(raw) : raw; return Array.isArray(value) ? { rows: value, error: null, present: true } : { rows: [], error: 'INVALID_STORAGE', present: true } } catch (error) { return { rows: [], error: 'INVALID_STORAGE', present: true } }
}

export function readFeedingTaskSummaries({ actorProvider } = {}) {
  const actor = actorOf(actorProvider)
  if (!actor) return fail('NO_ACTOR')
  const source = read()
  if (source.error) return fail(source.error)
  if (!source.present) return frozen({ success: false, data: { items: [] }, error: { code: 'READER_MISSING' }, readOnly: true, canWrite: false })
  const items = []
  for (const row of source.rows) {
    if (!row || typeof row !== 'object') continue
    const orderId = row.orderId || row.id
    if (!id(orderId)) continue
    const donor = [row.userId, row.userPawId, row.donorId].includes(actor.id)
    const manager = (actor.roles.includes('yard_owner') || actor.roles.includes('owner') || actor.roles.includes('fulfillment_manager'))
      && [row.yardOwnerId, row.ownerPawId].includes(actor.id)
    if (!donor && !manager) continue
    const state = row.feedbackStatus || row.status || row.stateKey
    const status = ['completed', 'fulfilled', 'processed', 'done'].includes(state) ? 'completed' : ['active', 'in_progress', 'shipping', 'delivered'].includes(state) ? 'in_progress' : 'pending'
    items.push({ taskId: `task:feeding:${orderId}:${manager ? 'fulfill' : 'feedback'}:${actor.id}`, businessType: 'feeding', businessId: orderId, actorId: actor.id, actorRole: manager ? 'owner' : 'applicant', actionType: manager ? 'fulfill' : 'feedback', status })
  }
  return frozen({ success: true, data: { items, total: items.length }, error: null, readOnly: true, canWrite: false })
}

export const readTasks = readFeedingTaskSummaries
