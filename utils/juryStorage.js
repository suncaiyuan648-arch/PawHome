import {
	JURY_ITEM_STATUS,
	JURY_MOCK_DEFAULTS,
	JURY_VOTE_VALUES,
	cloneJuryValue,
	getJuryMockConfig,
	getJuryMockItems,
	normalizeJuryVote
} from './juryMock.js'

/** 与现有 juryDetail 的 key 保持兼容：值仍然是 itemId -> real/fake。 */
export const JURY_STORAGE_KEYS = Object.freeze({
	votes: 'PAWHOME_JURY_VOTES',
	voteLimitMock: 'PAWHOME_JURY_VOTE_LIMIT_MOCK'
})

export const JURY_VOTE_FAILURE_REASONS = Object.freeze({
	invalidItem: 'invalid-item',
	invalidVote: 'invalid-vote',
	closedItem: 'closed-item',
	alreadyVoted: 'already-voted',
	voteLimit: 'vote-limit'
})

const memoryStorage = new Map()

function hasUniStorage() {
	return typeof uni !== 'undefined' && uni && typeof uni.getStorageSync === 'function'
}

function storageRead(key) {
	try {
		if (hasUniStorage()) return uni.getStorageSync(key)
		return memoryStorage.has(key) ? memoryStorage.get(key) : null
	} catch (error) {
		return null
	}
}

function storageWrite(key, value) {
	try {
		if (hasUniStorage() && typeof uni.setStorageSync === 'function') uni.setStorageSync(key, value)
		else memoryStorage.set(key, value)
	} catch (error) {
		// 与 adoptionStorage 保持一致：mock storage 失败时不让页面崩溃。
	}
}

function storageRemove(key) {
	try {
		if (hasUniStorage() && typeof uni.removeStorageSync === 'function') uni.removeStorageSync(key)
		else memoryStorage.delete(key)
	} catch (error) {
		// Best effort in non-WeChat test environments.
	}
}

function parseJSON(raw, fallback) {
	try {
		if (!raw) return fallback
		return typeof raw === 'string' ? JSON.parse(raw) : raw
	} catch (error) {
		return fallback
	}
}

function normalizeId(value) {
	return value === undefined || value === null ? '' : String(value).trim()
}

function normalizeVoteMap(value) {
	const source = parseJSON(value, {})
	if (!source || typeof source !== 'object' || Array.isArray(source)) return {}
	const result = {}
	Object.keys(source).forEach((itemId) => {
		const vote = normalizeJuryVote(source[itemId])
		const id = normalizeId(itemId)
		if (id && vote) result[id] = vote
	})
	return result
}

function writeVoteMap(votes) {
	const normalized = normalizeVoteMap(votes)
	storageWrite(JURY_STORAGE_KEYS.votes, JSON.stringify(normalized))
	return cloneJuryValue(normalized)
}

function normalizeLimitConfig(value) {
	const source = parseJSON(value, {})
	return getJuryMockConfig(source && typeof source === 'object' ? source : {})
}

function readStoredLimitConfig() {
	return normalizeLimitConfig(storageRead(JURY_STORAGE_KEYS.voteLimitMock))
}

function resolveLimitConfig(options = {}) {
	const source = options && typeof options === 'object' ? options : {}
	const stored = readStoredLimitConfig()
	const hasEnforceOverride = Object.prototype.hasOwnProperty.call(source, 'enforceLimit')
	const hasEnabledOverride = Object.prototype.hasOwnProperty.call(source, 'voteLimitEnabled')
	const enabled = hasEnforceOverride
		? source.enforceLimit === true
		: hasEnabledOverride
			? source.voteLimitEnabled === true
			: stored.voteLimitEnabled === true
	return getJuryMockConfig({
		...stored,
		...source,
		voteLimitEnabled: enabled,
		dailyVoteLimit: source.dailyVoteLimit ?? stored.dailyVoteLimit,
		usedVotesToday: source.usedVotesToday ?? stored.usedVotesToday
	})
}

/** 读取全部本地投票，key 为稳定 jury itemId，value 为 real/fake。 */
export function readJuryVotes() {
	return normalizeVoteMap(storageRead(JURY_STORAGE_KEYS.votes))
}

/** 单条读取；未投票统一返回空字符串，方便页面直接绑定。 */
export function getJuryVote(itemId) {
	const id = normalizeId(itemId)
	return id ? readJuryVotes()[id] || '' : ''
}

/** 批量覆盖写入，主要用于 mock 初始化/测试恢复。 */
export function writeJuryVotes(votes = {}) {
	return writeVoteMap(votes)
}

/**
 * 查询可控的次数拦截状态。
 * 默认 enabled=false，因此不会阻断正常投票；传 enforceLimit:true 或显式保存 enabled 配置才会启用。
 */
export function getJuryVoteLimitState(options = {}) {
	const config = resolveLimitConfig(options)
	const blocked = config.voteLimitEnabled && config.dailyVoteLimit >= 0 && config.usedVotesToday >= config.dailyVoteLimit
	return {
		...config,
		blocked,
		remaining: config.voteLimitEnabled && config.dailyVoteLimit >= 0
			? Math.max(0, config.dailyVoteLimit - config.usedVotesToday)
			: null
	}
}

/** 显式配置投票次数 mock；传 null/false 可清除并恢复默认不拦截。 */
export function setJuryVoteLimitMock(config = {}) {
	if (config === null || config === false) {
		clearJuryVoteLimitMock()
		return getJuryVoteLimitState()
	}
	const next = getJuryMockConfig(config)
	storageWrite(JURY_STORAGE_KEYS.voteLimitMock, JSON.stringify(next))
	return cloneJuryValue(next)
}

export function getJuryVoteLimitMock() {
	return readStoredLimitConfig()
}

export function clearJuryVoteLimitMock() {
	storageRemove(JURY_STORAGE_KEYS.voteLimitMock)
	return getJuryMockConfig()
}

/**
 * 写入一条投票。
 * 返回统一结果对象，调用方可以根据 ok/reason 展示结果或次数提示；默认不启用次数拦截。
 */
export function writeJuryVote(itemId, vote, options = {}) {
	const opts = options && typeof options === 'object' ? options : {}
	const id = normalizeId(itemId)
	const value = normalizeJuryVote(vote)
	const currentVotes = readJuryVotes()
	if (!id) return { ok: false, itemId: '', vote: '', reason: JURY_VOTE_FAILURE_REASONS.invalidItem, votes: currentVotes }
	if (!value) return { ok: false, itemId: id, vote: '', reason: JURY_VOTE_FAILURE_REASONS.invalidVote, votes: currentVotes }
	const item = getJuryMockItems().find((entry) => entry.id === id)
	if (!item) return { ok: false, itemId: id, vote: '', reason: JURY_VOTE_FAILURE_REASONS.invalidItem, votes: currentVotes }
	if (item.status === JURY_ITEM_STATUS.closed) {
		return { ok: false, itemId: id, vote: '', reason: JURY_VOTE_FAILURE_REASONS.closedItem, votes: currentVotes }
	}

	const current = currentVotes[id] || ''
	if (current && opts.overwrite !== true) {
		return { ok: false, itemId: id, vote: current, reason: JURY_VOTE_FAILURE_REASONS.alreadyVoted, votes: currentVotes }
	}

	const limit = getJuryVoteLimitState(opts)
	if (limit.blocked) {
		return {
			ok: false,
			itemId: id,
			vote: '',
			reason: JURY_VOTE_FAILURE_REASONS.voteLimit,
			votes: currentVotes,
			limit
		}
	}

	const nextVotes = { ...currentVotes, [id]: value }
	const savedVotes = writeVoteMap(nextVotes)
	if (limit.voteLimitEnabled) {
		const nextLimit = getJuryMockConfig({ ...limit, usedVotesToday: limit.usedVotesToday + 1 })
		storageWrite(JURY_STORAGE_KEYS.voteLimitMock, JSON.stringify(nextLimit))
	}
	return { ok: true, itemId: id, vote: value, votes: savedVotes, limit: getJuryVoteLimitState() }
}

// 语义别名：页面或后续接口适配层可以使用 save，而不改变底层 key。
export const saveJuryVote = writeJuryVote

/** 清除指定 item 的投票，返回清除后的完整投票 map。 */
export function clearJuryVote(itemId) {
	const id = normalizeId(itemId)
	const votes = readJuryVotes()
	if (id) delete votes[id]
	return Object.keys(votes).length ? writeVoteMap(votes) : clearJuryVotes()
}

/** 清除全部本地投票；不会清除次数 mock 配置。 */
export function clearJuryVotes() {
	storageRemove(JURY_STORAGE_KEYS.votes)
	return {}
}

/** 读取由本地投票投影后的统一评审项列表。 */
export function getJuryItems(options = {}) {
	const source = options && typeof options === 'object' ? options : {}
	const items = getJuryMockItems({ votes: readJuryVotes() })
	const statuses = source.status === undefined || source.status === null ? null : statusesFrom(source.status)
	const reviewType = normalizeReviewType(source.reviewType || source.type || source.juryType)
	return items.filter((item) => {
		if (reviewType && item.reviewType !== reviewType) return false
		if (source.includeClosed === false && item.status === JURY_ITEM_STATUS.closed) return false
		if (source.includePending === false && item.status === JURY_ITEM_STATUS.pending) return false
		if (source.includeVoted === false && item.status === JURY_ITEM_STATUS.voted) return false
		return !statuses || statuses.includes(item.status)
	})
}

function normalizeReviewType(value) {
	const result = normalizeId(value).toLowerCase()
	return result === 'rescue' || result === 'adoption' ? result : ''
}

function statusesFrom(value) {
	return Array.isArray(value) ? value : [value]
}

export function getJuryItemsByStatus(status) {
	return getJuryItems({ status })
}

export function getPendingJuryItems(options = {}) {
	return getJuryItems({ ...options, status: JURY_ITEM_STATUS.pending })
}

export function getVotedJuryItems(options = {}) {
	return getJuryItems({ ...options, status: JURY_ITEM_STATUS.voted })
}

export function getJuryItemById(itemId, options = {}) {
	const id = normalizeId(itemId)
	if (!id) return null
	return getJuryItems(options).find((item) => item.id === id) || null
}

/**
 * 按当前列表顺序取下一条。可传 items 使用页面当前筛选后的列表，避免跨筛选条件跳转。
 */
export function getNextJuryItem(currentItemId, options = {}) {
	const id = normalizeId(currentItemId)
	const source = options && typeof options === 'object' ? options : {}
	const list = Array.isArray(source.items)
		? source.items
		: getJuryItems({ includeClosed: source.includeClosed === undefined ? false : source.includeClosed, ...source })
	const index = list.findIndex((item) => item && normalizeId(item.id || item.itemId) === id)
	return index >= 0 && index + 1 < list.length ? cloneJuryValue(list[index + 1]) : null
}

export function getNextJuryItemId(currentItemId, options = {}) {
	const next = getNextJuryItem(currentItemId, options)
	return next ? normalizeId(next.id || next.itemId) : ''
}

/** 仅清理评审团本地状态，便于开发/静态测试恢复默认链路。 */
export function clearJuryStorage() {
	clearJuryVotes()
	clearJuryVoteLimitMock()
	return { votes: {}, voteLimit: getJuryMockConfig(JURY_MOCK_DEFAULTS) }
}

export { JURY_VOTE_VALUES }
