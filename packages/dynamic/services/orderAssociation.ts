/** Animal aliases describe the same set; singular aliases must agree and belong to it. */
type JsonRecord = Record<string, unknown>

interface AnimalAssociationResult {
	readonly values: string[]
	readonly error: 'INVALID_ANIMAL_RELATION' | null
}

const ANIMAL_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const ANIMAL_FIELDS = ['animalId', 'petId']
const ANIMAL_SET_FIELDS = ['animalIds', 'petIds']
const ORDER_TYPE_FIELDS = ['orderType', 'type']
const ORDER_STATE_FIELDS = ['status', 'stateKey', 'deliveryStatus']
const FEEDBACK_ELIGIBLE_STATES = [
	'delivered',
	'fulfilled',
	'completed',
	'cloud-active-timeout',
	'cloud-active-feedback',
] as const

function isRecord(value: unknown): value is JsonRecord {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isValidAnimalId(value: unknown): value is string {
	return typeof value === 'string' && ANIMAL_ID.test(value)
}

function invalidAssociation(): AnimalAssociationResult {
	return { values: [], error: 'INVALID_ANIMAL_RELATION' }
}

export function animalIdsOfOrder(input: JsonRecord = {}): AnimalAssociationResult {
	if (!isRecord(input)) return invalidAssociation()
	const singular: string[] = []
	const sets: string[][] = []
	for (const field of ANIMAL_FIELDS) {
		if (!Object.prototype.hasOwnProperty.call(input, field)) continue
		const value = input[field]
		if (!isValidAnimalId(value)) return invalidAssociation()
		singular.push(value)
	}
	for (const field of ANIMAL_SET_FIELDS) {
		if (!Object.prototype.hasOwnProperty.call(input, field)) continue
		const value = input[field]
		if (!Array.isArray(value) || !value.length || value.some(id => !isValidAnimalId(id))) return invalidAssociation()
		sets.push([...new Set(value)].sort())
	}
	if (new Set(singular).size > 1) return invalidAssociation()
	const firstSet = sets[0]
	if (firstSet && sets.some(ids => ids.join('|') !== firstSet.join('|'))) return invalidAssociation()
	if (firstSet && singular.some(id => !firstSet.includes(id))) return invalidAssociation()
	return { values: firstSet || [...new Set(singular)], error: null }
}

// The feeding store implies normal_feed for legacy rows without a type.
// Signed/delivered orders may accrue evidence up to their persisted policy limit.
export function isFeedbackEligible(input: JsonRecord = {}): boolean {
	if (!isRecord(input)) return false
	const types = ORDER_TYPE_FIELDS.filter(key => input[key] !== undefined).map(key => input[key])
	if (types.some(type => type !== 'normal_feed')) return false
	const states = ORDER_STATE_FIELDS.filter(key => input[key] !== undefined).map(key => input[key])
	return states.length > 0 && states.every(state => FEEDBACK_ELIGIBLE_STATES.some(eligibleState => eligibleState === state))
}
