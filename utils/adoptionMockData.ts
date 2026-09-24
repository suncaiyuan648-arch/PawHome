/** Shared adoption-pet metadata for fixtures, persisted picks, and UI boundaries. */
import type { AdoptionPetMetadata } from '../contracts/adoptionPet.ts'
export type { AdoptionPetMetadata } from '../contracts/adoptionPet.ts'

export type AdoptionPetMockMetadata = AdoptionPetMetadata

export interface AdoptionPetMockOption extends AdoptionPetMetadata {
  price: number
  disabled: boolean
}

/** Legacy picker callers may pass selected indexes instead of pet records. */
export type AdoptionPetSelection = AdoptionPetMetadata | number

export interface AdoptionPickPayload {
  pets: AdoptionPetMetadata[]
  selectedPetIds: string[]
  selectedIndices: number[]
  yardName: string
  ownerName: string
  ownerAvatar: string
  yardId: string
  ownerPawId: string
}

export const ADOPTION_APPLICATION_PET_MOCKS: readonly AdoptionPetMockMetadata[] = Object.freeze([
  { id: 'pet-orange', name: '奥利奥', avatar: '/static/figma/adoption-flow/pet-orange.png' },
  { id: 'pet-dog', name: '呗呗', avatar: '/static/figma/adoption-flow/apply-dog.png' },
])

export const ADOPTION_REVIEW_FALLBACK_PETS: readonly AdoptionPetMetadata[] = Object.freeze([
  {
    id: 'adoption-review-fallback-pet',
    name: '奥利奥',
    avatar: '/static/figma/adoption-flow/pet-orange.png',
  },
])

export const ADOPTION_PICK_PET_MOCKS: readonly AdoptionPetMockOption[] = Object.freeze([
  {
    id: 'pet-orange',
    name: '奥利奥',
    avatar: '/static/figma/adoption-flow/pet-orange.png',
    price: 20,
    disabled: false,
  },
  {
    id: 'pet-dog',
    name: '呗呗',
    avatar: '/static/figma/adoption-flow/apply-dog.png',
    price: 20,
    disabled: false,
  },
  {
    id: 'pet-black-white',
    name: '小黑白',
    avatar: '/static/figma/pets/pet-black-white.png',
    price: 15,
    disabled: true,
  },
  {
    id: 'pet-available-later-1',
    name: '小橘',
    avatar: '/static/figma/pets/pet-orange.png',
    price: 15,
    disabled: true,
  },
  {
    id: 'pet-available-later-2',
    name: '小花',
    avatar: '/static/figma/pets/pet-dog.png',
    price: 15,
    disabled: true,
  },
  {
    id: 'pet-available-later-3',
    name: '小白',
    avatar: '/static/home-feed-1.png',
    price: 15,
    disabled: true,
  },
  {
    id: 'pet-available-later-4',
    name: '小虎',
    avatar: '/static/home-feed-1.png',
    price: 15,
    disabled: true,
  },
])

export function createAdoptionApplicationPetMocks(): AdoptionPetMockMetadata[] {
  return ADOPTION_APPLICATION_PET_MOCKS.map((pet) => ({ ...pet }))
}

export function createAdoptionReviewFallbackPetMocks(): AdoptionPetMetadata[] {
  return ADOPTION_REVIEW_FALLBACK_PETS.map((pet) => ({ ...pet }))
}
