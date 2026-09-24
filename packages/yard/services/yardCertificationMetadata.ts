export type YardCertificationFigmaState = 97 | 98 | 99
export type YardCertificationPhotoIndex = 0 | 1 | 2
export type YardCertificationPhotoPaths = [string, string, string]

export interface YardCertificationForm {
  orgName: string
  orgAddress: string
}

export interface YardCertificationMetadata {
  form: YardCertificationForm
  certPhotos: YardCertificationPhotoPaths
}

const DEFAULT_CERTIFICATION_PHOTOS: YardCertificationPhotoPaths = [
  '/static/figma/certify/ca69b21b61516589aa506613e5d3c587881cb57d.png',
  '/static/figma/certify/286f32813e5e08a042caa281128bbd34461231c4.png',
  '/static/figma/certify/a89546330447ad2d777eba860fde4020fa211487.png'
]

const DEFAULT_CERTIFICATION_METADATA = Object.freeze({
  form: Object.freeze({
    orgName: '小坏蛋',
    orgAddress: '湖南省长沙市中意一路鼎丰前程国际'
  }),
  certPhotos: DEFAULT_CERTIFICATION_PHOTOS
})

export function createYardCertificationMetadata(): YardCertificationMetadata {
  return {
    form: { ...DEFAULT_CERTIFICATION_METADATA.form },
    certPhotos: [...DEFAULT_CERTIFICATION_METADATA.certPhotos]
  }
}

export function normalizeYardCertificationState(value: unknown): YardCertificationFigmaState {
  const state = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim()
      ? Number(value)
      : Number.NaN

  return state === 98 || state === 99 ? state : 97
}
