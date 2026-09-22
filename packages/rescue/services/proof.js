import {
  addRescueProof,
  getRescueById,
  hasRescueProofByUser
} from '@/utils/rescueStorage.js'
import { SELF_PAW_ID } from '@/utils/profileNav.js'

const ID_CARD_PATTERN = /^\d{17}[\dXx]$/

function valueOf(value) {
  return value === undefined || value === null ? '' : String(value).trim()
}

function failure(reason, message, record = null) {
  return { ok: false, duplicate: false, reason, message, record }
}

/**
 * The rescue proof flow uses the existing PAWHOME_RESCUES record and proofList.
 * This adapter intentionally does not create another storage key or a parallel
 * adoption evidence record.
 */
export function readRescueProofContext(rescueId) {
  const id = valueOf(rescueId)
  if (!id) return failure('missing-id', '缺少救助单 ID')
  const record = getRescueById(id)
  return record
    ? { ok: true, duplicate: false, reason: '', message: '', record }
    : failure('not-found', '找不到这条救助记录')
}

export function normalizeProofInput(input = {}) {
  const source = input && typeof input === 'object' ? input : {}
  return {
    name: valueOf(source.name),
    relation: valueOf(source.relation),
    note: valueOf(source.note),
    idNo: valueOf(source.idNo),
    agreementChecked: source.agreementChecked === true
  }
}

export function validateProofInput(input = {}) {
  const proof = normalizeProofInput(input)
  if (!proof.name || !proof.relation || !proof.note || !proof.idNo) {
    return { ok: false, code: 'MISSING_FIELD', message: '请完整填写证实信息' }
  }
  if (proof.name.length > 30 || proof.relation.length > 30) {
    return { ok: false, code: 'VALUE_TOO_LONG', message: '姓名或关系填写过长' }
  }
  if (proof.note.length > 200) {
    return { ok: false, code: 'VALUE_TOO_LONG', message: '证实说明不能超过 200 字' }
  }
  if (!ID_CARD_PATTERN.test(proof.idNo)) {
    return { ok: false, code: 'INVALID_ID_CARD', message: '请填写正确的身份证号' }
  }
  if (!proof.agreementChecked) {
    return { ok: false, code: 'AGREEMENT_REQUIRED', message: '请先同意相关协议' }
  }
  return { ok: true, code: '', message: '', value: proof }
}

/**
 * Submit at most one proof for the current actor and rescue record. A repeated
 * submit resolves to the existing record and performs no write, which makes a
 * double tap or a resumed form idempotent in the local mock flow.
 */
export function submitRescueProof(rescueId, input, options = {}) {
  const id = valueOf(rescueId)
  const actorId = valueOf(options.actorId || SELF_PAW_ID)
  const context = readRescueProofContext(id)
  if (!context.ok) return context
  if (!actorId) return failure('missing-actor', '当前用户无法提交证实', context.record)

  if (hasRescueProofByUser(context.record, actorId)) {
    return { ok: true, duplicate: true, reason: 'duplicate', message: '你已经证实过这条救助', record: context.record }
  }

  const validation = validateProofInput(input)
  if (!validation.ok) return failure(validation.code, validation.message, context.record)

  const proof = validation.value
  const updated = addRescueProof(id, {
    id: `${id}-proof-${actorId}`,
    name: proof.name,
    relationship: proof.relation,
    note: proof.note,
    story: proof.note,
    idLast4: proof.idNo.slice(-4),
    createdAt: Date.now(),
    pawId: actorId,
    source: 'rescue',
    rescueId: id
  })
  if (!updated) return failure('write-failed', '证实信息提交失败', context.record)
  return { ok: true, duplicate: false, reason: 'created', message: '证实信息已提交', record: updated }
}

export function normalizedProofList(record) {
  if (!record || !Array.isArray(record.proofList)) return []
  return record.proofList.map((item, index) => ({
    ...item,
    id: valueOf(item && item.id) || `${record.id || record.rescueId}-proof-${index + 1}`,
    name: valueOf(item && (item.name || item.userName)) || '匿名用户',
    relationship: valueOf(item && (item.relationship || item.relation)) || '证实人',
    avatar: valueOf(item && (item.avatar || item.userAvatar)) || '/static/figma/home/yard-avatar.png',
    story: valueOf(item && (item.story || item.note || item.text || item.content)) || '已提交证实信息。',
    meta: valueOf(item && (item.meta || item.createdAtText || item.createdAt)) || '刚刚',
    likes: Number(item && (item.likes ?? item.likeCount)) || 0,
    liked: Boolean(item && item.liked)
  }))
}

export function proofCount(record) {
  const value = Number(record && record.evidenceCount)
  return Number.isFinite(value) ? value : normalizedProofList(record).length
}

export { ID_CARD_PATTERN }
