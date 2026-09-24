import type { YardPet, YardPetState } from './yardMock.ts'

export const PET_DETAIL_FIGMA_OWNER_AVATAR = '/static/figma/adoption-flow/pet-owner.png'

const PET_DETAIL_FIGMA_GALLERY = Object.freeze({
	active: [
		'/static/figma/adoption-flow/pet-orange.png',
		'/static/figma/pets/pet-black-white.png',
		'/static/figma/adoption-flow/pet-hero.png',
	],
	featured: [
		'/static/figma/adoption-flow/pet-hero.png',
		'/static/figma/adoption-flow/pet-orange.png',
		'/static/figma/pets/pet-black-white.png',
	],
})

const PET_DETAIL_FIGMA_TAGS = Object.freeze(['中华田园犬', '男生', '已绝育', '2岁3个月'])

export interface PetDetailGalleryImageMetadata {
	src?: string
	url?: string
}

export type PetDetailGalleryItemMetadata = string | PetDetailGalleryImageMetadata

/** Input shape for the pet detail view; runtime records may omit display-only fields. */
export type PetDetailMockMetadata = Partial<Pick<YardPet,
	'id' | 'name' | 'avatar' | 'species' | 'speciesLabel' | 'breed' | 'state' | 'status' |
	'tags' | 'cardTags' | 'desc' | 'foodJin' | 'adoptionValue' | 'statusLabel' |
	'stateTimeLabel' | 'stateTime' | 'feedingOrderIds'
>> & {
	gallery?: PetDetailGalleryItemMetadata[]
}

export interface PetDetailDisplayMetadata extends PetDetailMockMetadata {
	name: string
	statusLabel: string
	tags: string[]
	desc: string
}

export interface PetDetailStripItemMetadata {
	id: string
	avatar: string
}

export interface PetDetailFooterActionMetadata {
	key: string
	label: string
	image: string
	qa?: string
}

export interface PetDetailPrimaryActionMetadata {
	key: 'feed'
	label: string
	iconName: string
	iconSize: number
	size: 'md'
}

export type PetDetailManagementAction = 'edit' | 'manage-pet' | 'album' | 'delete'

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown, fallback = ''): string {
	return typeof value === 'string' && value.trim() ? value : fallback
}

function numeric(value: unknown): number {
	if (typeof value === 'number' && Number.isFinite(value)) return value
	if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
	return 0
}

function stringList(value: unknown): string[] {
	if (!Array.isArray(value)) return []
	return value.filter((item): item is string => typeof item === 'string')
}

function galleryUrls(value: unknown, fallback: string): string[] {
	if (!Array.isArray(value)) return [fallback]
	const urls = value
		.map(item => {
			if (typeof item === 'string') return item
			if (isRecord(item)) return text(item.src, text(item.url, ''))
			return ''
		})
		.filter((url): url is string => url.length > 0)
	return urls.length ? urls : [fallback]
}

function petState(value: unknown): value is YardPetState {
	return value === 'pending' || value === 'cloud' || value === 'adopted' || value === 'missing' || value === 'dead'
}

/** Normalize a persisted public record into the pet-detail domain model. */
export function normalizePetDetailRecord(value: unknown, fallbackAvatar: string): YardPet | null {
	if (!isRecord(value)) return null
	const id = text(value.animalId, text(value.id))
	if (!id) return null
	const breed = text(value.breed)
	const species = value.species === 'dog' || /犬|狗/.test(breed) ? 'dog' : 'cat'
	const avatar = text(value.avatar, fallbackAvatar)
	const state: YardPetState = petState(value.state) ? value.state : 'pending'
	const status = text(value.status, '待领养')
	return {
		...value,
		id,
		name: text(value.name, '未命名动物'),
		avatar,
		species,
		speciesLabel: text(value.speciesLabel, species === 'dog' ? '狗狗' : '猫咪'),
		breed: breed || (species === 'dog' ? '狗狗' : '猫咪'),
		state,
		status,
		tags: stringList(value.tags),
		cardTags: stringList(value.cardTags),
		desc: text(value.desc, text(value.description)),
		foodJin: numeric(value.foodJin),
		adoptionValue: numeric(value.adoptionValue),
		statusLabel: text(value.statusLabel, status),
		gallery: galleryUrls(value.gallery, avatar),
		stateTimeLabel: text(value.stateTimeLabel),
		stateTime: text(value.stateTime),
	}
}

/** Build isolated visual-state fixtures without mutating the yard source mock. */
export function createPetDetailFigmaVariantPets(pets: readonly YardPet[]): YardPet[] {
	return pets.map((pet, index) => ({
		...pet,
		avatar: index === 3
			? PET_DETAIL_FIGMA_GALLERY.featured[0]
			: PET_DETAIL_FIGMA_GALLERY.active[0],
		gallery: [...(index === 3 ? PET_DETAIL_FIGMA_GALLERY.featured : PET_DETAIL_FIGMA_GALLERY.active)],
		statusLabel: '已云养',
		tags: [...PET_DETAIL_FIGMA_TAGS],
	}))
}

export function createPetDetailFallbackMock(): PetDetailDisplayMetadata {
	return {
		name: '小黄',
		statusLabel: '已云养',
		tags: ['中华田园犬', '男生', '已绝育', '2岁3个月'],
		desc: '小黄是我见过最乖最帅最萌的小猫，饭量很大，希望可以多多投喂猫粮给它',
		avatar: '/static/figma/adoption-flow/pet-hero.png',
		gallery: ['/static/figma/adoption-flow/pet-hero.png'],
	}
}

const PET_DETAIL_STRIP_MOCKS: readonly PetDetailStripItemMetadata[] = Object.freeze(
	Array.from({ length: 8 }, (_, index) => Object.freeze({
		id: `pet-strip-${index + 1}`,
		avatar: '/static/figma/pet-detail/strip-orange.png',
	})),
)

export function createPetDetailStripMocks(): PetDetailStripItemMetadata[] {
	return PET_DETAIL_STRIP_MOCKS.map(item => ({ ...item }))
}
