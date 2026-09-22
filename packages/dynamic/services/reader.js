/**
 * Dynamic detail read boundary.
 *
 * The detail page, its message bridge, and its task entry all resolve the
 * current record from `PAWHOME_DYNAMIC_RECORDS`.  A route/query value only
 * identifies a record; it never supplies the author, yard, body, media, or
 * comments.  Missing, malformed, or inaccessible records fail closed.
 */

const STORAGE_KEY = 'PAWHOME_DYNAMIC_RECORDS'
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const URL_MARKERS = /[/?#%]|:\/\//
const ANONYMOUS_IDS = new Set(['anonymous', 'anon', 'guest', 'unknown', '匿名', '匿名用户'])

function validId(value) {
  return typeof value === 'string'
    && value === value.trim()
    && SAFE_ID.test(value)
    && !URL_MARKERS.test(value)
}

function actorId(actor) {
  if (!actor || typeof actor !== 'object' || Array.isArray(actor)) return ''
  const value = actor.id || actor.actorId
  return validId(value) && !ANONYMOUS_IDS.has(String(value).toLowerCase()) ? value : ''
}

function readRows() {
  let raw
  try {
    raw = typeof uni !== 'undefined' && uni && typeof uni.getStorageSync === 'function'
      ? uni.getStorageSync(STORAGE_KEY)
      : undefined
  } catch (error) {
    return { code: 'STORAGE_READ_FAILED', rows: [] }
  }
  if (raw === undefined || raw === null || raw === '') return { code: 'READER_MISSING', rows: [] }
  try {
    const rows = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(rows) ? { code: null, rows } : { code: 'INVALID_STORAGE', rows: [] }
  } catch (error) {
    return { code: 'INVALID_STORAGE', rows: [] }
  }
}

function owns(record, id) {
	if (!id) return false
	return [record.authorId, record.userId, record.userPawId, record.ownerId].includes(id)
		|| Boolean(record.author && typeof record.author === 'object' && [record.author.id, record.author.pawId]
			.some(value => value && !ANONYMOUS_IDS.has(String(value).toLowerCase()) && value === id))
}

function canRead(record, actor, { allowPublic = true, requireActor = true } = {}) {
  const id = actorId(actor)
  if (owns(record, id)) return true
  const allowed = Array.isArray(record.readerIds) ? record.readerIds : record.allowedActorIds
  if (id && Array.isArray(allowed) && allowed.includes(id)) return true
  if (!allowPublic || record.visibility === 'private' || record.access === 'private' || record.public === false) return false
  return !requireActor || Boolean(id) || record.visibility === 'public' || record.public === true
}

/**
 * Read one current dynamic record.  `requireActor` is false only for the
 * public detail page; private records still require a matching actor.
 */
export function readDynamicRecord(dynamicId, { actor = null, requireActor = true, allowPublic = true } = {}) {
  if (!validId(dynamicId)) return { code: 'INVALID_ID', record: null }
  const source = readRows()
  if (source.code) return { code: source.code, record: null }
  const record = source.rows.find(item => item && typeof item === 'object'
    && (item.dynamicId === dynamicId || item.id === dynamicId))
  if (!record) return { code: 'NOT_FOUND', record: null }
  if (requireActor && !actorId(actor)) return { code: 'AUTH_REQUIRED', record: null }
  if (!canRead(record, actor, { allowPublic, requireActor })) return { code: 'FORBIDDEN', record: null }
  return { code: 'OK', record: Object.freeze({ ...record, dynamicId: record.dynamicId || record.id || dynamicId }) }
}

export function normalizeDynamicRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null
  const author = record.author && typeof record.author === 'object' ? record.author : {}
  const yard = record.yard && typeof record.yard === 'object' ? record.yard : {}
  const mediaSource = Array.isArray(record.mediaItems) ? record.mediaItems
    : Array.isArray(record.media) ? record.media
      : Array.isArray(record.mediaPaths) ? record.mediaPaths : []
  const mediaItems = mediaSource.map(item => typeof item === 'string' ? item : item && (item.url || item.src || item.path)).filter(Boolean)
  const comments = Array.isArray(record.comments) ? record.comments : []
  const yardId = String(record.yardId || yard.id || '')
  const yardValue = Object.freeze({
    ...yard,
    id: yard.id || yardId,
    name: yard.name || record.yardName || '',
    avatar: yard.avatar || record.yardAvatar || '',
    owner: yard.owner || (record.yardOwnerId ? { pawId: record.yardOwnerId } : undefined),
    pets: Array.isArray(yard.pets) ? yard.pets : [],
    announcementItems: Array.isArray(yard.announcementItems) ? yard.announcementItems : [],
    feeders: Array.isArray(yard.feeders) ? yard.feeders : [],
    rankItems: Array.isArray(yard.rankItems) ? yard.rankItems : [],
  })
  return Object.freeze({
    dynamicId: record.dynamicId || record.id,
    yardId,
    yard: yardValue,
    author: Object.freeze({
      ...author,
      name: author.name || record.authorName || '',
      avatar: author.avatar || record.authorAvatar || '',
    }),
    currentUser: Object.freeze({ avatar: record.currentUserAvatar || '' }),
    mediaItems,
    comments,
    copy: String(record.copy || record.body || record.content || record.text || ''),
    meta: String(record.meta || record.createdLabel || [record.createdAt, record.location].filter(Boolean).join('  ')),
    feedingSource: String(record.feedingSource || record.sourceText || ''),
    feedSummary: String(record.feedSummary || ''),
    likes: Number.isFinite(Number(record.likeCount || record.likes)) ? Number(record.likeCount || record.likes) : 0,
    liked: record.liked === true,
    commentsTotal: Number.isFinite(Number(record.commentsTotal || record.commentCount))
      ? Number(record.commentsTotal || record.commentCount)
      : comments.length,
    announcementItems: yardValue.announcementItems,
    feeders: yardValue.feeders,
    rankItems: yardValue.rankItems,
  })
}

export { STORAGE_KEY }
