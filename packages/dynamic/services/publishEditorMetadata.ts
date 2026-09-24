import { getPawHomeYardMock, type YardFeedingOrder, type YardPet } from '../../../utils/yardMock.ts'

export interface PublishEditorPet extends Record<string, unknown> {
	id: string
	name: string
	avatar: string
	state: string
}

export interface PublishEditorOrder extends Record<string, unknown> {
	id: string
	orderType: string
	status: string
	yardId: string
	petIds: string[]
	pawId: string
	userName: string
	userAvatar: string
	avatar: string
	level: number
	kg: number
	time: string
	countdown: string
	timedOut: boolean
	feedbackTag: string
}

export interface PublishEditorAnimal extends PublishEditorPet {
	orderId: string
	level?: number
	kg?: number
	time?: string
	countdown?: string
	timedOut?: boolean
	feedbackTag?: string
}

export type PublishEditorPickedCat = Pick<PublishEditorPet, 'id' | 'name' | 'avatar'>

export interface PublishEditorMockMetadata {
	orders: PublishEditorOrder[]
	pets: PublishEditorPet[]
	animals: PublishEditorAnimal[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown, fallback = ''): string {
	if (typeof value === 'string') return value.trim() || fallback
	if (typeof value === 'number' && Number.isFinite(value)) return String(value)
	return fallback
}

function number(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function toEditorPet(pet: YardPet): PublishEditorPet {
	return { ...pet, id: pet.id, name: pet.name, avatar: pet.avatar, state: pet.state }
}

function toEditorOrder(order: YardFeedingOrder): PublishEditorOrder {
	return {
		...order,
		avatar: order.userAvatar,
	}
}

export function buildPublishEditorAnimals(
	pets: readonly PublishEditorPet[],
	orders: readonly PublishEditorOrder[],
): PublishEditorAnimal[] {
	return pets
		.filter(pet => pet.state === 'cloud')
		.map(pet => {
			const order = orders.find(item => item.petIds.some(petId => String(petId) === String(pet.id)))
			return {
				...pet,
				...(order || {}),
				id: pet.id,
				name: pet.name,
				avatar: pet.avatar,
				state: pet.state,
				orderId: order ? order.id : '',
			}
		})
}

export function createPublishEditorMocks(): PublishEditorMockMetadata {
	const yard = getPawHomeYardMock()
	const pets = yard.pets.map(toEditorPet)
	const orders = yard.feedingOrders.map(toEditorOrder)
	return { orders, pets, animals: buildPublishEditorAnimals(pets, orders) }
}

/** Narrow API/storage order rows into the editor's display and association contract. */
export function normalizePublishEditorOrder(value: unknown): PublishEditorOrder | null {
	if (!isRecord(value)) return null
	const singularIds: string[] = []
	for (const field of ['animalId', 'petId']) {
		if (!Object.prototype.hasOwnProperty.call(value, field)) continue
		const id = value[field]
		if (typeof id !== 'string' || !id.trim()) return null
		singularIds.push(id.trim())
	}
	if (new Set(singularIds).size > 1) return null

	const readIdSet = (field: 'animalIds' | 'petIds'): string[] | null => {
		if (!Object.prototype.hasOwnProperty.call(value, field)) return null
		const source = value[field]
		if (!Array.isArray(source) || source.length === 0) return null
		const ids = source.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
		if (ids.length !== source.length) return null
		return [...new Set(ids.map(id => id.trim()))].sort()
	}

	const animalIds = readIdSet('animalIds')
	const petIdsAlias = readIdSet('petIds')
	if (Object.prototype.hasOwnProperty.call(value, 'animalIds') && !animalIds) return null
	if (Object.prototype.hasOwnProperty.call(value, 'petIds') && !petIdsAlias) return null
	if (animalIds && petIdsAlias && animalIds.join('|') !== petIdsAlias.join('|')) return null
	const pluralIds = animalIds || petIdsAlias || []
	const petIds = [...new Set([...singularIds, ...pluralIds])]
	if (!petIds.length || singularIds.some(id => pluralIds.length > 0 && !pluralIds.includes(id))) return null

	const id = text(value.id, text(value.orderId))
	if (!id) return null
	const userAvatar = text(value.userAvatar, text(value.yardAvatar, text(value.avatar, '/static/figma/publish/order-avatar.png')))
	return {
		...value,
		id,
		orderType: text(value.orderType, text(value.type, 'normal_feed')),
		status: text(value.status, text(value.stateKey, 'delivered')),
		yardId: text(value.yardId),
		petIds,
		pawId: text(value.pawId, `order-${id}`),
		userName: text(value.userName, text(value.name, '平安是福')),
		userAvatar,
		avatar: text(value.avatar, userAvatar),
		level: number(value.level, 1),
		kg: number(value.kg, 4),
		time: text(value.time),
		countdown: text(value.countdown),
		timedOut: value.timedOut === true,
		feedbackTag: text(value.feedbackTag, text(value.topText, '待反馈')),
	}
}

/** Normalize persisted animal records without trusting their JSON shape. */
export function normalizePublishEditorPet(value: unknown): PublishEditorPet | null {
	if (!isRecord(value)) return null
	const id = text(value.animalId, text(value.id))
	if (!id) return null
	return {
		...value,
		id,
		name: text(value.name, '猫咪'),
		avatar: text(value.avatar, text(value.image, '/static/figma/yard-cats/cat-avatar.png')),
		state: text(value.state, 'cloud'),
	}
}

export function publishEditorPetBelongsToYard(value: unknown, yardId: string): boolean {
	if (!yardId || !isRecord(value)) return true
	return text(value.yardId) === yardId
}
