import {
	addRescueProof,
	getRescueById,
	hasRescueProofByUser,
	type RescueProof,
	type RescueRecord,
} from '@/utils/rescueStorage.ts'
import { SELF_PAW_ID } from '@/utils/profileNav.ts'

type JsonRecord = Record<string, unknown>

export interface ProofInput {
	readonly name: string
	readonly relation: string
	readonly note: string
	readonly idNo: string
	readonly agreementChecked: boolean
}

interface ProofValidationFailure {
	readonly ok: false
	readonly code: string
	readonly message: string
}

interface ProofValidationSuccess {
	readonly ok: true
	readonly code: ''
	readonly message: ''
	readonly value: ProofInput
}

type ProofValidationResult = ProofValidationFailure | ProofValidationSuccess

interface ProofFlowFailure {
	readonly ok: false
	readonly duplicate: false
	readonly reason: string
	readonly message: string
	readonly record: RescueRecord | null
}

interface ProofFlowSuccess {
	readonly ok: true
	readonly duplicate: boolean
	readonly reason: string
	readonly message: string
	readonly record: RescueRecord
}

type ProofFlowResult = ProofFlowFailure | ProofFlowSuccess

interface ProofContextSuccess {
	readonly ok: true
	readonly duplicate: false
	readonly reason: ''
	readonly message: ''
	readonly record: RescueRecord
}

type ProofContextResult = ProofContextSuccess | ProofFlowFailure

export interface SubmitRescueProofOptions {
	readonly actorId?: string
}

export interface NormalizedRescueProof extends RescueProof {
	readonly id: string
	readonly name: string
	readonly relationship: string
	readonly avatar: string
	readonly level: number
	readonly story: string
	readonly meta: string
	readonly likes: number
	readonly liked: boolean
}

const ID_CARD_PATTERN = /^\d{17}[\dXx]$/

function isRecord(value: unknown): value is JsonRecord {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function valueOf(value: unknown): string {
	return value === undefined || value === null ? '' : String(value).trim()
}

function failure(reason: string, message: string, record: RescueRecord | null = null): ProofFlowFailure {
	return { ok: false, duplicate: false, reason, message, record }
}

/**
 * The rescue proof flow uses the existing PAWHOME_RESCUES record and proofList.
 * This adapter intentionally does not create another storage key or a parallel
 * adoption evidence record.
 */
export function readRescueProofContext(rescueId: string): ProofContextResult {
	const id = valueOf(rescueId)
	if (!id) return failure('missing-id', '缺少救助单 ID')
	const record = getRescueById(id)
	return record
		? { ok: true, duplicate: false, reason: '', message: '', record }
		: failure('not-found', '找不到这条救助记录')
}

export function normalizeProofInput(input: unknown = {}): ProofInput {
	const source = isRecord(input) ? input : {}
	return {
		name: valueOf(source.name),
		relation: valueOf(source.relation),
		note: valueOf(source.note),
		idNo: valueOf(source.idNo),
		agreementChecked: source.agreementChecked === true,
	}
}

export function validateProofInput(input: unknown = {}): ProofValidationResult {
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
export function submitRescueProof(
	rescueId: string,
	input: ProofInput,
	options: SubmitRescueProofOptions = {},
): ProofFlowResult {
	const id = valueOf(rescueId)
	const source = options
	const actorId = valueOf(source.actorId || SELF_PAW_ID)
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
		rescueId: id,
	})
	if (!updated) return failure('write-failed', '证实信息提交失败', context.record)
	return { ok: true, duplicate: false, reason: 'created', message: '证实信息已提交', record: updated }
}

export function normalizedProofList(record: RescueRecord | null | undefined): NormalizedRescueProof[] {
	if (!record || !Array.isArray(record.proofList)) return []
	const recordId = valueOf(record.id || record.rescueId)
	return record.proofList.map((source, index) => ({
		...source,
		id: valueOf(source.id) || `${recordId}-proof-${index + 1}`,
		name: valueOf(source.name) || '匿名用户',
		relationship: valueOf(source.relationship) || '证实人',
		avatar: valueOf(source.avatar) || '/static/figma/home/yard-avatar.png',
		level: Number(source.level) || 1,
		story: valueOf(source.story || source.text) || '已提交证实信息。',
		meta: valueOf(source.meta || source.createdAt) || '刚刚',
		likes: Number(source.likes) || 0,
		liked: source.liked === true,
	}))
}

export function proofCount(record: RescueRecord | null | undefined): number {
	if (!record) return 0
	const value = record.evidenceCount
	return Number.isFinite(value) ? value : normalizedProofList(record).length
}

export { ID_CARD_PATTERN }
