/**
 * Production binding for message/task deep links.
 *
 * `deeplinkContracts.js` remains the policy boundary.  This module only
 * connects that boundary to the persisted records that already exist in the
 * repository.  It never enables demo fallback, never writes, and never lets
 * a route/query value stand in for a trusted actor or a current record.
 *
 * Dynamic and normal feeding records are read from their persisted keys when
 * those keys are present.  A missing key still resolves to `READER_MISSING`
 * rather than a fixture or the first visible card.  Callers may provide a
 * reviewed production reader at construction time; the reader receives
 * stable IDs and the resolved actor only.
 */

import { resolveDeepLink } from './deeplinkContracts.js'
import { getAdoptionById } from '../utils/adoptionStorage.js'
import { getRescueById } from '../utils/rescueStorage.js'
import { findRewardOrderById } from '../utils/rewardOrderStorage.js'

const BUSINESS_TYPES = Object.freeze(['adoption', 'rescue', 'feeding', 'dynamic'])
const CONFIG_KEYS = new Set(['actorProvider', 'authorize', 'readers'])

function isPlainRecord(value) {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
	const prototype = Object.getPrototypeOf(value)
	return prototype === Object.prototype || prototype === null
}

function assertConfig(config) {
	if (!isPlainRecord(config)) throw new TypeError('production deep-link options must be a plain object')
	for (const key of Object.keys(config)) {
		if (!CONFIG_KEYS.has(key)) throw new TypeError(`Unknown production deep-link option: ${key}`)
	}
}

function missingReader() {
	const error = new Error('A persisted reader is not registered for this deep-link domain')
	error.code = 'READER_MISSING'
	throw error
}

function withIdentity(record, field, id) {
	if (!record || typeof record !== 'object' || Array.isArray(record)) return record
	// Legacy storage uses `id`; the deep-link contract requires a domain
	// identity alias so a reader cannot accidentally return a neighbouring
	// record.  This is a defensive projection, not a second storage record.
	return Object.freeze({ ...record, [field]: record[field] || record.id || id })
}

function persistedRows(key) {
	if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') return { present: false, rows: [] }
	let raw
	try { raw = uni.getStorageSync(key) } catch (error) { return { present: true, rows: [] } }
	if (raw === undefined || raw === null || raw === '') return { present: false, rows: [] }
	try {
		const value = typeof raw === 'string' ? JSON.parse(raw) : raw
		return Array.isArray(value) ? { present: true, rows: value } : { present: true, rows: [] }
	} catch (error) { return { present: true, rows: [] } }
}

function persistedById(keys, businessId, aliases, identityField) {
	for (const key of keys) {
		const source = persistedRows(key)
		if (!source.present) continue
		const record = source.rows.find(item => item && typeof item === 'object' && aliases.some(field => item[field] === businessId))
		if (record) return withIdentity(record, identityField, businessId)
	}
	missingReader()
}

const DEFAULT_READERS = Object.freeze({
	adoption: ({ businessId }) => withIdentity(
		getAdoptionById(businessId, { includeDemo: false }),
		'applicationId',
		businessId,
	),
	rescue: ({ businessId }) => getRescueById(businessId, { includeDemo: false }),
	feeding: ({ businessId }) => {
		const reward = findRewardOrderById(businessId)
		if (reward) return withIdentity(reward, 'orderId', businessId)
		return persistedById(['PAWHOME_FEEDING_ORDERS'], businessId, ['orderId', 'id'], 'orderId')
	},
	dynamic: ({ businessId }) => persistedById(['PAWHOME_DYNAMIC_RECORDS'], businessId, ['dynamicId', 'id'], 'dynamicId'),
})

function normalizeReaders(value) {
	if (value === undefined) return DEFAULT_READERS
	if (!isPlainRecord(value)) throw new TypeError('production deep-link readers must be a plain object')
	for (const key of Object.keys(value)) {
		if (!BUSINESS_TYPES.includes(key)) throw new TypeError(`Unknown deep-link reader domain: ${key}`)
		if (value[key] !== null && typeof value[key] !== 'function') {
			throw new TypeError(`${key} deep-link reader must be a function or null`)
		}
	}
	return Object.freeze({ ...DEFAULT_READERS, ...value })
}

function readerFor(readers, context) {
	const reader = readers[context.businessType]
	if (typeof reader !== 'function') return missingReader()
	return reader(Object.freeze({
		businessType: context.businessType,
		...(context.businessId === undefined ? {} : { businessId: context.businessId }),
		...(context.reviewItemId === undefined ? {} : { reviewItemId: context.reviewItemId }),
		actor: context.actor,
	}))
}

/** Create one stable resolver for the current production storage boundary. */
export function createProductionDeepLinkResolver(config = {}) {
	assertConfig(config)
	const readers = normalizeReaders(config.readers)
	const resolverOptions = Object.freeze({
		...(config.actorProvider === undefined ? {} : { actorProvider: config.actorProvider }),
		resolver: context => readerFor(readers, context),
		...(config.authorize === undefined ? {} : { authorize: config.authorize }),
	})
	const resolve = input => resolveDeepLink(input, resolverOptions)
	return Object.freeze({
		resolve,
		resolveMessage: resolve,
		resolveTask: resolve,
		readers,
	})
}

/** One-shot production entry point for message/task callers. */
export function resolveProductionDeepLink(input, config = {}) {
	return createProductionDeepLinkResolver(config).resolve(input)
}

export const resolveProductionMessageDeepLink = resolveProductionDeepLink
export const resolveProductionTaskDeepLink = resolveProductionDeepLink

export { BUSINESS_TYPES, DEFAULT_READERS }
