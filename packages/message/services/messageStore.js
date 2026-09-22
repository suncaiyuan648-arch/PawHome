/**
 * Persisted notification records and stable business deep links.
 *
 * The message package owns the notification list.  A message is only a
 * routing envelope: the target page must re-read the current business record
 * through the package-local production reader before rendering or exposing
 * any action.  Keeping that reader local avoids hoisting every navigation
 * policy module into the main package when this page is compiled.
 * This store is append-only.  There is deliberately no delete, read-state,
 * or business mutation API here.
 */

export const MESSAGE_STORAGE_KEY = 'PAWHOME_MESSAGES'
export const MESSAGE_CATEGORIES = Object.freeze([
	'interaction',
	'order',
	'service',
	'system',
	'activity',
	'pet',
])

const BUSINESS_TYPES = Object.freeze(['adoption', 'rescue', 'feeding', 'dynamic'])
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const ACTOR_ROLES = new Set(['applicant', 'owner', 'reviewer', 'cloud_parent', 'yard_owner', 'animal_manager'])
const MESSAGE_FIELDS = new Set([
	'messageId', 'eventKey', 'recipientId', 'category', 'title', 'preview', 'createdAt',
	'businessType', 'businessId', 'reviewItemId', 'legacyState', 'actorRole', 'outcome', 'deepLink',
])

function own(value, key) {
	return Object.prototype.hasOwnProperty.call(value, key)
}

function plain(value) {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
	const prototype = Object.getPrototypeOf(value)
	return prototype === Object.prototype || prototype === null
}

function rejectDangerous(value, label) {
	if (!plain(value)) throw Object.assign(new Error(`${label} must be a plain object`), { code: 'INVALID_RECORD' })
	for (const key of Object.keys(value)) {
		if (DANGEROUS_KEYS.has(key)) throw Object.assign(new Error(`${label} contains a prototype key`), { code: 'PROTOTYPE_KEY' })
	}
}

function freeze(value, seen = new WeakSet()) {
	if (value === null || typeof value !== 'object' || seen.has(value)) return value
	seen.add(value)
	for (const key of Reflect.ownKeys(value)) freeze(value[key], seen)
	return Object.freeze(value)
}

function fail(code, message, actor = null, data = null, extra = {}) {
	return freeze({ success: false, data, error: { code, message }, actor, readOnly: true, canWrite: false, ...extra })
}

function id(value, label, { allowEmpty = false } = {}) {
	if (allowEmpty && (value === undefined || value === null || value === '')) return ''
	if (typeof value !== 'string' || !value || value !== value.trim() || !SAFE_ID.test(value) || URL_MARKERS.test(value)) {
		throw Object.assign(new Error(`${label} must be an opaque ID`), { code: value ? 'INVALID_ID' : 'MISSING_ID' })
	}
	return value
}

function actorOf(provider) {
	let value
	try { value = typeof provider === 'function' ? provider() : null } catch (error) { return { actor: null, error: { code: 'ACTOR_PROVIDER_FAILED' } } }
	const source = value && plain(value) && own(value, 'actor') ? value.actor : value
	if (!source || !plain(source)) return { actor: null, error: { code: 'NO_ACTOR' } }
	const actorId = source.id || source.actorId
	const roles = Array.isArray(source.roles) ? source.roles : source.role === undefined ? [] : [source.role]
	if (typeof actorId !== 'string' || !SAFE_ID.test(actorId) || URL_MARKERS.test(actorId)
		|| roles.some(role => typeof role !== 'string' || !ACTOR_ROLES.has(role))) {
		return { actor: null, error: { code: 'INVALID_ACTOR' } }
	}
	return { actor: freeze({ id: actorId, roles: [...new Set(roles)] }), error: null }
}

function deepLinkFor(input) {
	const target = input.reviewItemId
		// Review actions are produced for the applicant recipient.  The review
		// item remains on the persisted message envelope for idempotency and
		// auditing, but the applicant must land on their own progress reader;
		// reviewer-only pages would expose an unusable or unauthorized target.
		? ({ adoption: '/packages/adoption/pages/progress/index', rescue: '/packages/rescue/pages/progress/index' })[input.businessType]
		: ({ adoption: '/packages/adoption/pages/progress/index', rescue: '/packages/rescue/pages/detail/index', feeding: '/packages/feeding/pages/order/detail/index', dynamic: '/packages/dynamic/pages/deep-link/index' })[input.businessType]
	if (!target) throw Object.assign(new Error('message deep-link target is unsupported'), { code: 'INVALID_BUSINESS_TYPE' })
	const params = {
		[({ adoption: 'applicationId', rescue: 'rescueId', feeding: 'orderId', dynamic: 'dynamicId' })[input.businessType]]: input.businessId,
	}
	const query = Object.keys(params).sort().map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&')
	const routeName = ({ adoption: 'adoption.progress', rescue: input.reviewItemId ? 'rescue.progress' : 'rescue.detail', feeding: 'feeding.order.detail', dynamic: 'dynamic.detail' })[input.businessType]
	return Object.freeze({ source: 'message', businessType: input.businessType, businessId: input.businessId, ...(input.businessType === 'rescue' && input.reviewItemId ? { targetKind: 'progress' } : {}), routeName, url: `${target}?${query}` })
}

function messageInput(value, { requireRecipient = true } = {}) {
	rejectDangerous(value, 'message')
	for (const key of Object.keys(value)) {
		if (!MESSAGE_FIELDS.has(key)) throw Object.assign(new Error(`Unknown message field: ${key}`), { code: 'UNKNOWN_FIELD' })
	}
	const messageId = id(value.messageId, 'messageId')
	const recipientId = requireRecipient ? id(value.recipientId, 'recipientId') : id(value.recipientId, 'recipientId', { allowEmpty: true })
	const category = value.category
	if (!MESSAGE_CATEGORIES.includes(category)) throw Object.assign(new Error('message category is unsupported'), { code: 'INVALID_CATEGORY' })
	if (typeof value.title !== 'string' || !value.title.trim() || value.title.length > 120) throw Object.assign(new Error('message title is invalid'), { code: 'INVALID_TITLE' })
	if (typeof value.preview !== 'string' || value.preview.length > 240) throw Object.assign(new Error('message preview is invalid'), { code: 'INVALID_PREVIEW' })
	if (typeof value.createdAt !== 'string' || !value.createdAt.trim() || value.createdAt.length > 64) throw Object.assign(new Error('message createdAt is invalid'), { code: 'INVALID_TIMESTAMP' })
	if (value.eventKey !== undefined) id(value.eventKey, 'eventKey')
	if (!BUSINESS_TYPES.includes(value.businessType)) throw Object.assign(new Error('message businessType is required'), { code: 'MISSING_BUSINESS_TYPE' })
	const businessId = id(value.businessId, 'businessId')
	const reviewItemId = value.reviewItemId === undefined ? '' : id(value.reviewItemId, 'reviewItemId')
	const deepLink = deepLinkFor({ businessType: value.businessType, businessId, ...(reviewItemId ? { reviewItemId } : {}) })
	return freeze({
		messageId,
		...(value.eventKey === undefined ? {} : { eventKey: value.eventKey }),
		...(recipientId ? { recipientId } : {}),
		category,
		title: value.title.trim(),
		preview: value.preview,
		createdAt: value.createdAt.trim(),
		businessType: value.businessType,
		businessId,
		...(reviewItemId ? { reviewItemId } : {}),
		deepLink,
	})
}

function readRaw() {
	if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') return { rows: [], present: false, error: null }
	let raw
	try { raw = uni.getStorageSync(MESSAGE_STORAGE_KEY) } catch (error) { return { rows: [], present: true, error: 'STORAGE_READ_FAILED' } }
	if (raw === undefined || raw === null || raw === '') return { rows: [], present: false, error: null }
	try {
		const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
		if (!Array.isArray(parsed)) return { rows: [], present: true, error: 'INVALID_STORAGE' }
		return { rows: parsed, present: true, error: null }
	} catch (error) {
		return { rows: [], present: true, error: 'INVALID_STORAGE' }
	}
}

function writeRaw(rows) {
	if (typeof uni === 'undefined' || !uni || typeof uni.setStorageSync !== 'function') {
		throw Object.assign(new Error('message storage writer is unavailable'), { code: 'WRITER_MISSING' })
	}
	try { uni.setStorageSync(MESSAGE_STORAGE_KEY, JSON.stringify(rows)) } catch (error) {
		throw Object.assign(new Error('message storage write was not acknowledged'), { code: 'STORAGE_WRITE_FAILED' })
	}
}

function scoped(row, actorId) {
	return row && typeof row === 'object' && row.recipientId === actorId
}

function persistedRows(key) {
	if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') return { present: false, rows: [] }
	let raw
	try { raw = uni.getStorageSync(key) } catch (error) { return { present: true, rows: [], error: 'STORAGE_READ_FAILED' } }
	if (raw === undefined || raw === null || raw === '') return { present: false, rows: [] }
	try {
		const value = typeof raw === 'string' ? JSON.parse(raw) : raw
		return Array.isArray(value) ? { present: true, rows: value } : { present: true, rows: [], error: 'INVALID_STORAGE' }
	} catch (error) { return { present: true, rows: [], error: 'INVALID_STORAGE' } }
}

function currentRecord(type, businessId, actor, readers) {
	const injected = readers && readers[type]
	if (injected !== undefined && typeof injected !== 'function') return { error: 'INVALID_READER' }
	if (typeof injected === 'function') {
		try {
			const result = injected(Object.freeze({ businessType: type, businessId, actor }))
			if (result && typeof result.then === 'function') return { error: 'ASYNC_READER_UNSUPPORTED' }
			return result ? { record: result } : { error: 'NOT_FOUND' }
		} catch (error) { return { error: error && error.code || 'READER_FAILED' } }
	}
	const sourceKeys = ({ adoption: ['PAWHOME_ADOPTIONS', ['applicationId', 'id']], rescue: ['PAWHOME_RESCUES', ['rescueId', 'id']], feeding: ['PAWHOME_REWARD_ORDERS', ['orderId', 'id']], dynamic: ['PAWHOME_DYNAMIC_RECORDS', ['dynamicId', 'id']] })[type]
	if (!sourceKeys) return { error: 'INVALID_BUSINESS_TYPE' }
	const keys = type === 'feeding' ? ['PAWHOME_REWARD_ORDERS', 'PAWHOME_FEEDING_ORDERS'] : [sourceKeys[0]]
	for (const key of keys) {
		const loaded = persistedRows(key)
		if (loaded.error) return { error: loaded.error }
		if (!loaded.present) continue
		const found = loaded.rows.find(item => item && typeof item === 'object' && sourceKeys[1].some(field => item[field] === businessId))
		if (found) {
			const identity = ({ adoption: 'applicationId', rescue: 'rescueId', feeding: 'orderId', dynamic: 'dynamicId' })[type]
			return { record: Object.freeze({ ...found, [identity]: found[identity] || found.id || businessId }) }
		}
	}
	return { error: 'READER_MISSING' }
}

function scalarIds(values) {
	return values.filter(value => typeof value === 'string' && value.trim()).map(value => value.trim())
}

function applicantIds(record) {
	const nested = record && plain(record.applicant) ? [record.applicant.id, record.applicant.pawId] : []
	return scalarIds([record && record.applicantId, record && record.applicantUserId, record && record.userId, ...nested])
}

function reviewItemIds(record) {
	const review = record && plain(record.review) ? [record.review.reviewItemId] : []
	return scalarIds([record && record.reviewItemId, ...review])
}

function genericActorIds(record) {
	const nested = record && plain(record.applicant) ? [record.applicant.id, record.applicant.pawId] : []
	return scalarIds([record && record.applicantId, record && record.applicantUserId, record && record.userId,
		record && record.userPawId, record && record.donorId, record && record.ownerId,
		record && record.ownerPawId, record && record.yardOwnerId, record && record.authorId, ...nested])
}

function recordAllowsMessage(item, record, actorId) {
	if (item.reviewItemId) {
		const reviewIds = reviewItemIds(record)
		const applicant = applicantIds(record)
		return reviewIds.length > 0 && new Set(reviewIds).size === 1
			&& reviewIds[0] === item.reviewItemId
			&& applicant.length > 0 && new Set(applicant).size === 1 && applicant[0] === actorId
	}
	return genericActorIds(record).includes(actorId) || item.category === 'system' || item.category === 'activity'
}

function resolveCurrentMessage(item, actor, readers, authorize) {
	const loaded = currentRecord(item.businessType, item.businessId, actor, readers)
	if (loaded.error) return { status: 'empty', code: loaded.error, actor, target: item.deepLink, record: null }
	const target = item.deepLink
	const allowed = typeof authorize === 'function'
		? (() => { try { return authorize(Object.freeze({ actor, target, record: loaded.record })) === true } catch (error) { return false } })()
		: recordAllowsMessage(item, loaded.record, actor.id)
	if (!allowed) return { status: 'empty', code: 'FORBIDDEN', actor, target, record: null }
	return { status: 'ready', code: 'OK', actor, target, record: loaded.record }
}

/** Read current actor's notification envelopes. */
export function readMessages({ actorProvider, category } = {}) {
	const resolved = actorOf(actorProvider)
	if (resolved.error || !resolved.actor) return fail(resolved.error && resolved.error.code || 'NO_ACTOR', 'trusted actor is unavailable')
	if (category !== undefined && !MESSAGE_CATEGORIES.includes(category)) return fail('INVALID_CATEGORY', 'message category is unsupported', resolved.actor)
	const raw = readRaw()
	if (raw.error) return fail(raw.error, 'message storage could not be read', resolved.actor)
	const items = []
	const skipped = []
	for (const [index, value] of raw.rows.entries()) {
		try {
			const normalized = messageInput(value)
			if (normalized.category !== category && category !== undefined) continue
			if (scoped(normalized, resolved.actor.id)) items.push(normalized)
		} catch (error) {
			skipped.push({ index, code: error.code || 'INVALID_MESSAGE' })
		}
	}
	items.sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
	return freeze({
		success: true,
		data: { items, total: items.length },
		error: null,
		actor: resolved.actor,
		readOnly: true,
		canWrite: false,
		diagnostics: { scanned: raw.rows.length, accepted: items.length, skipped },
	})
}

export function readMessageById(messageId, { actorProvider } = {}) {
	let target
	try { target = id(messageId, 'messageId') } catch (error) { return fail(error.code, 'message ID is invalid') }
	const result = readMessages({ actorProvider })
	if (!result.success) return result
	const item = result.data.items.find(value => value.messageId === target)
	return item
		? freeze({ ...result, data: { item }, readOnly: true, canWrite: false })
		: fail('NOT_FOUND', 'message was not found', result.actor)
}

/**
 * Append one message only after a domain producer explicitly authorizes it.
 * `authorize` receives the frozen canonical envelope and must return true.
 * The same messageId/eventKey is idempotent; no replacement or deletion is
 * performed on a retry.
 */
export function appendMessage(message, { authorize } = {}) {
	let normalized
	try { normalized = messageInput(message) } catch (error) { return fail(error.code || 'INVALID_MESSAGE', error.message || 'message is invalid') }
	if (typeof authorize !== 'function') return fail('WRITER_MISSING', 'message producer authorization is unavailable')
	let approved = false
	try { approved = authorize(normalized) === true } catch (error) { return fail('AUTHORIZATION_FAILED', 'message producer authorization failed') }
	if (!approved) return fail('FORBIDDEN', 'message producer authorization was denied')
	const raw = readRaw()
	if (raw.error) return fail(raw.error, 'message storage could not be read')
	const existing = raw.rows.map((row, index) => {
		try { return { row: messageInput(row), index } } catch (error) { return null }
	}).filter(Boolean)
	const duplicate = existing.find(({ row }) => row.messageId === normalized.messageId
		|| (normalized.eventKey && row.eventKey === normalized.eventKey))
	if (duplicate) return freeze({ success: true, data: { item: duplicate.row }, error: null, readOnly: false, canWrite: true, idempotent: true, wrote: false })
	try { writeRaw([...raw.rows, normalized]) } catch (error) { return fail(error.code || 'STORAGE_WRITE_FAILED', error.message || 'message write failed') }
	return freeze({ success: true, data: { item: normalized }, error: null, readOnly: false, canWrite: true, idempotent: false, wrote: true })
}

function actionTargetMatches(action, businessType, businessId, reviewItemId) {
	if (!plain(action) || !BUSINESS_TYPES.includes(businessType)) return false
	if (own(action, 'businessType') && action.businessType !== undefined && action.businessType !== businessType) return false
	const idFields = ({
		adoption: ['applicationId'],
		rescue: ['rescueId'],
		feeding: ['orderId'],
		dynamic: ['dynamicId'],
	})[businessType]
	const targetIds = []
	for (const field of [...idFields, 'businessId']) {
		if (!own(action, field) || action[field] === undefined) continue
		if (typeof action[field] !== 'string' || !action[field].trim()) return false
		targetIds.push(action[field].trim())
	}
	if (targetIds.length && (new Set(targetIds).size !== 1 || targetIds[0] !== businessId)) return false
	if (own(action, 'reviewItemId') && action.reviewItemId !== undefined) {
		if (typeof action.reviewItemId !== 'string' || !action.reviewItemId.trim()) return false
		if (!reviewItemId || action.reviewItemId.trim() !== reviewItemId) return false
	}
	return true
}

/**
 * Domain action producer for the local-only integration boundary.  Callers
 * must provide the successful action result and an explicit authorization
 * predicate.  The current trusted actor is re-read here, so a stale page
 * cannot emit a notification after the account has switched.  This function
 * never performs the business action itself and remains idempotent through
 * `eventKey`/`messageId` in appendMessage.
 */
export function produceLocalActionNotification({
	action,
	recipientId,
	businessType,
	businessId,
	reviewItemId,
	category = 'system',
	title,
	preview = '',
	createdAt = new Date().toISOString(),
	eventKey,
	actorProvider,
	authorize,
} = {}) {
	if (!action || typeof action !== 'object' || action.success !== true || typeof action.actorId !== 'string' || !action.actorId) {
		return fail('ACTION_REQUIRED', 'a successful local action is required before producing a message')
	}
	if (typeof businessType !== 'string' || typeof businessId !== 'string' || !actionTargetMatches(action, businessType, businessId, reviewItemId)) {
		return fail('ACTION_TARGET_MISMATCH', 'the notification target does not match the successful action')
	}
	const resolved = actorOf(actorProvider)
	if (resolved.error || !resolved.actor) return fail(resolved.error && resolved.error.code || 'NO_ACTOR', 'trusted actor is unavailable', resolved.actor)
	if (resolved.actor.id !== action.actorId) return fail('ACTOR_MISMATCH', 'the notification producer actor is stale', resolved.actor)
	const actionEventKey = eventKey || action.idempotencyKey || action.actionId
	const messageId = `message-${actionEventKey || `${businessType}-${businessId}-${action.toStatus || 'updated'}`}`
	let normalized
	try {
		normalized = messageInput({
			messageId,
			eventKey: actionEventKey,
			recipientId,
			category,
			title,
			preview,
			createdAt,
			businessType,
			businessId,
			...(reviewItemId ? { reviewItemId } : {}),
		})
	} catch (error) {
		return fail(error.code || 'INVALID_MESSAGE', error.message || 'message is invalid', resolved.actor)
	}
	return appendMessage(normalized, {
		authorize: message => {
			if (message.recipientId === resolved.actor.id) return true
			try {
				return typeof authorize === 'function' && authorize(Object.freeze({ actor: resolved.actor, action, message })) === true
			} catch (error) {
				return false
			}
		},
	})
}

/** Resolve a message against the current actor and current business record. */
export function resolveMessageDestination(messageId, { actorProvider, readers, authorize } = {}) {
	const message = readMessageById(messageId, { actorProvider })
	if (!message.success) return message
	const item = message.data.item
	const resolved = resolveCurrentMessage(item, message.actor, readers, ({ actor, record }) => {
		if (item.recipientId !== actor.id) return false
		if (authorize) return authorize({ actor, target: item.deepLink, record })
			const publicDynamic = item.businessType === 'dynamic'
				&& record.visibility !== 'private'
				&& record.access !== 'private'
				&& record.public !== false
			return recordAllowsMessage(item, record, actor.id) || publicDynamic
		})
	return freeze({
		success: resolved.status === 'ready',
		status: resolved.status,
		data: { item, target: resolved.target, record: resolved.record },
		error: resolved.status === 'ready' ? null : { code: resolved.code },
		actor: resolved.actor || message.actor,
		readOnly: true,
		canWrite: false,
	})
}

/** Emit a resolved envelope over a WeChat eventChannel when available. */
export function emitMessageDeepLink(eventChannel, result) {
	if (!eventChannel || typeof eventChannel.emit !== 'function') return false
	if (!result || result.success !== true || !result.data || !result.data.target) return false
	try {
		eventChannel.emit('pawhome.message.deep-link', freeze({
			target: result.data.target,
			status: result.status,
			canWrite: false,
		}))
		return true
	} catch (error) {
		return false
	}
}

export const createMessageRecord = messageInput
export const listMessages = readMessages
export const appendProducedMessage = appendMessage
export const produceActionNotification = produceLocalActionNotification
