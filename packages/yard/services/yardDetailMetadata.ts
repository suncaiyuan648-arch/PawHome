import type {
  YardDetailState,
  YardGalleryItem,
  YardMock,
  YardPet,
  YardRankItem,
} from '@/utils/yardMock.ts'

export type YardDetailOverlayState = '' | 'reply-idle' | 'reply-input'
export type YardDetailHelpPopup = '' | 'help-adopt' | 'feedback-stat' | 'food-stat'

export interface YardDetailPageState {
  figmaState: YardDetailState
  overlayState: YardDetailOverlayState
  helpPopup: YardDetailHelpPopup
  adoptPickSheetVisible: boolean
  yardId: string
  routeReady: boolean
  yard: YardMock
}

export interface YardDetailRoute {
  yardId: string
  figmaState: YardDetailState
  overlayState: YardDetailOverlayState
  helpPopup: YardDetailHelpPopup
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function isYardDetailState(value: unknown): value is YardDetailState {
  return (
    value === 'dynamic' ||
    value === 'dynamic-empty' ||
    value === 'feeding' ||
    value === 'dynamic-expanded'
  )
}

function galleryItems(value: unknown, fallback: YardGalleryItem[]): YardGalleryItem[] {
  if (!Array.isArray(value)) return fallback
  return value.flatMap((item, index): YardGalleryItem[] => {
    if (typeof item === 'string') return [{ id: index, src: item, title: '' }]
    if (!isRecord(item)) return []
    const src =
      typeof item.src === 'string' ? item.src : typeof item.url === 'string' ? item.url : ''
    if (!src) return []
    return [
      {
        id: typeof item.id === 'number' ? item.id : index,
        src,
        title: typeof item.title === 'string' ? item.title : '',
      },
    ]
  })
}

export function resolveYardDetailRoute(value: unknown): YardDetailRoute | null {
  if (!isRecord(value)) return null
  const yardId =
    typeof value.yardId === 'string' || typeof value.yardId === 'number' ? String(value.yardId) : ''
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(yardId)) return null
  const rawState = value.state
  const overlayState: YardDetailOverlayState =
    rawState === 'reply-idle' || rawState === 'reply-input' ? rawState : ''
  const rawPopup = value.popup
  const helpPopup: YardDetailHelpPopup =
    rawPopup === 'help-adopt' || rawPopup === 'feedback-stat' || rawPopup === 'food-stat'
      ? rawPopup
      : ''
  return {
    yardId,
    figmaState: isYardDetailState(rawState) ? rawState : 'dynamic',
    overlayState,
    helpPopup,
  }
}

export function createYardDetailPageState(yard: YardMock): YardDetailPageState {
  return {
    figmaState: 'dynamic',
    overlayState: '',
    helpPopup: '',
    adoptPickSheetVisible: false,
    yardId: '',
    routeReady: false,
    yard,
  }
}

/** Merge only the editable public fields read from local storage. */
export function mergePublicYardDetail(current: YardMock, value: unknown, yardId: string): YardMock {
  if (!isRecord(value)) return { ...current, id: yardId }
  return {
    ...current,
    id: yardId,
    name: text(value.name, current.name),
    avatar: text(value.avatar, current.avatar),
    description: text(value.description, current.description),
    intro: text(value.intro, current.intro),
    location: text(value.location, current.location),
    district: text(value.district, current.district),
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === 'string')
      : current.tags,
    gallery: galleryItems(value.gallery, current.gallery),
  }
}

export function selectAdoptionPets(pets: readonly YardPet[]): YardPet[] {
  return pets.filter((pet) => pet.state === 'pending' || pet.state === 'cloud')
}

export function yardDetailRankUser(item: YardRankItem): {
  pawId: string
  nickname: string
  avatar: string
} {
  return { pawId: item.pawId || item.id, nickname: item.text, avatar: item.avatar }
}
