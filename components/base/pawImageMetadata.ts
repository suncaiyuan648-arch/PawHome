export const PAW_IMAGE_DISPLAY_MODES = ['square', 'fixed', 'original'] as const

export type PawImageDisplayMode = (typeof PAW_IMAGE_DISPLAY_MODES)[number]

export interface PawImageSourceObject {
  readonly src?: unknown
  readonly url?: unknown
  readonly path?: unknown
  readonly image?: unknown
}

export type PawImagePreviewSource = string | PawImageSourceObject

export interface PawImagePreviewPayload {
  readonly current: string
  readonly currentIndex: number
  readonly urls: string[]
}

export interface PawImageEvent {
  readonly type: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export type PawImageCssSize = string | number | null | undefined

export function asPawImageCssSize(value: PawImageCssSize): string {
  if (value === undefined || value === null || value === '') return ''
  return typeof value === 'number' ? `${value}px` : String(value)
}

export function normalizePawImageUrl(value: unknown): string {
  if (typeof value !== 'string') return ''
  const url = value.trim()
  return /^(?:\/|https?:\/\/|wxfile:\/\/|cloud:\/\/)/i.test(url) ? url : ''
}

export function readPawImageSourceUrl(value: PawImagePreviewSource | null | undefined): string {
  if (typeof value === 'string') return normalizePawImageUrl(value)
  if (!isRecord(value)) return ''
  return normalizePawImageUrl(value.src || value.url || value.path || value.image)
}

export function isPackagedPawImageUrl(url: string): boolean {
  return /^\/static\//i.test(url)
}

export function readCompressedPawImageUrl(
  value: Pick<UniNamespace.CompressImageSuccessResult, 'tempFilePath'> | null | undefined,
): string {
  if (!isRecord(value)) return ''
  return normalizePawImageUrl(value.tempFilePath)
}

export function normalizePawImageDisplayMode(value: string): PawImageDisplayMode {
  return PAW_IMAGE_DISPLAY_MODES.find((mode) => mode === value) || 'square'
}

export function isPawImagePreviewPayload(value: unknown): value is PawImagePreviewPayload {
  return (
    isRecord(value) &&
    typeof value.current === 'string' &&
    typeof value.currentIndex === 'number' &&
    Number.isFinite(value.currentIndex) &&
    Array.isArray(value.urls) &&
    value.urls.every((url) => typeof url === 'string')
  )
}

export function isPawImageEvent(value: unknown): value is PawImageEvent {
  return isRecord(value) && typeof value.type === 'string'
}
