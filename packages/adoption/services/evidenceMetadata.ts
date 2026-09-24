export type AdoptionEvidencePhotoIndex = 0 | 1

export interface AdoptionEvidenceProofComment {
  id: string
  name: string
  level: number
  avatar: string
  text: string
  meta: string
  likes: number
  liked: boolean
}

export interface AdoptionEvidencePhotoSlot {
  key: 'before' | 'after'
  label: string
  src: string
}

export interface AdoptionEvidenceSubmitPayload {
  photos: string[]
  story: string
}

export interface AdoptionEvidenceDraft {
  photos: [string, string]
  story: string
}

export interface AdoptionEvidencePageState {
  story: string
  selectedPhotos: [string, string]
  proofList: AdoptionEvidenceProofComment[]
  examples: string[]
}

export const ADOPTION_EVIDENCE_EXAMPLE_IMAGE =
  '/static/figma/certify/ca69b21b61516589aa506613e5d3c587881cb57d.png'

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown, fallback = ''): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return fallback
}

function photoPath(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function firstText(
  source: Record<string, unknown>,
  keys: readonly string[],
  fallback: string,
): string {
  for (const key of keys) {
    const value = source[key]
    if (value !== undefined && value !== null && String(value)) return text(value, fallback)
  }
  return fallback
}

export function createAdoptionEvidencePageState(): AdoptionEvidencePageState {
  return {
    story: '',
    selectedPhotos: ['', ''],
    proofList: [],
    examples: [ADOPTION_EVIDENCE_EXAMPLE_IMAGE, ADOPTION_EVIDENCE_EXAMPLE_IMAGE],
  }
}

export function readAdoptionEvidenceProofEntries(value: unknown): AdoptionEvidenceProofComment[] {
  if (!isRecord(value)) return []
  const source = Array.isArray(value.proofList)
    ? value.proofList
    : Array.isArray(value.evidenceList)
      ? value.evidenceList
      : []

  return source.map((entry, index) => normalizeAdoptionEvidenceProof(entry, index))
}

export function normalizeAdoptionEvidenceProof(
  value: unknown,
  index = 0,
): AdoptionEvidenceProofComment {
  const item = isRecord(value) ? value : {}
  const meta =
    firstText(item, ['meta'], '') ||
    [
      firstText(item, ['createdAtText', 'time', 'createdAt'], ''),
      firstText(item, ['city', 'location'], ''),
    ]
      .filter(Boolean)
      .join('　') ||
    '刚刚'
  const rawLikes = Number(item.likes ?? item.likeCount ?? 0)

  return {
    id: firstText(item, ['id', 'proofId'], `proof-${index + 1}`),
    name: firstText(item, ['name', 'nickname', 'userName'], '证实人'),
    level: Number(item.level) || 1,
    avatar: firstText(item, ['avatar', 'userAvatar', 'avatarUrl'], ADOPTION_EVIDENCE_EXAMPLE_IMAGE),
    text: firstText(item, ['text', 'content', 'note', 'story', 'confirmStory'], '已提交证实信息。'),
    meta,
    likes: Number.isFinite(rawLikes) ? rawLikes : 0,
    liked: item.liked === undefined ? true : Boolean(item.liked),
  }
}

export function normalizeAdoptionEvidencePhotos(value: unknown): [string, string] {
  if (!Array.isArray(value)) return ['', '']
  return [photoPath(value[0]), photoPath(value[1])]
}

export function readAdoptionEvidenceStory(value: unknown): string {
  return text(value)
}

export function readAdoptionEvidenceDraft(value: unknown): AdoptionEvidenceDraft {
  if (!isRecord(value)) return { photos: ['', ''], story: '' }
  return {
    photos: normalizeAdoptionEvidencePhotos(value.proofPhotos),
    story: readAdoptionEvidenceStory(value.confirmStory),
  }
}

export function readChosenEvidenceMediaPaths(value: unknown): string[] {
  if (!isRecord(value)) return []
  const files = value.tempFiles
  if (Array.isArray(files)) {
    return files
      .filter(isRecord)
      .map((file) => photoPath(file.tempFilePath))
      .filter(Boolean)
  }
  const paths = value.tempFilePaths
  return Array.isArray(paths) ? paths.map(photoPath).filter(Boolean) : []
}

export function updateAdoptionEvidencePhoto(
  photos: readonly string[],
  index: AdoptionEvidencePhotoIndex,
  value: string,
): [string, string] {
  const next: [string, string] = [photos[0] || '', photos[1] || '']
  next[index] = value
  return next
}
