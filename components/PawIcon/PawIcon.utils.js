import { PAW_ICON_DEFAULT_SIZE, PAW_ICON_SIZE } from './PawIcon.tokens.js'

const monoUriCache = new Map()
const PAW_ICON_FLIPS = new Set(['none', 'horizontal', 'vertical', 'both'])
export const PAW_ICON_MIN_RECOMMENDED_SIZE = 8
export const PAW_ICON_MAX_SIZE = 96
const warnedSizes = new Set()

function warnSizeBoundary(size, reason) {
  if (typeof process === 'undefined' || !process.env || process.env.NODE_ENV !== 'development') return
  const key = `${reason}:${size}`
  if (warnedSizes.has(key)) return
  warnedSizes.add(key)
  // eslint-disable-next-line no-console
  console.warn(`[PawIcon] size ${size}px ${reason}; recommended range is ${PAW_ICON_MIN_RECOMMENDED_SIZE}–${PAW_ICON_MAX_SIZE}px`)
}

export function resolvePawIconSize(size) {
  let numeric = null
  if (typeof size === 'number' && Number.isFinite(size)) numeric = size
  if (typeof size === 'string') {
    if (PAW_ICON_SIZE[size]) return PAW_ICON_SIZE[size]
    const parsed = Number(size.trim())
    if (Number.isFinite(parsed)) numeric = parsed
  }

  if (Number.isFinite(numeric) && numeric > 0) {
    if (numeric > PAW_ICON_MAX_SIZE) {
      warnSizeBoundary(numeric, `exceeds the maximum and will be clamped to ${PAW_ICON_MAX_SIZE}`)
      return PAW_ICON_MAX_SIZE
    }
    if (numeric < PAW_ICON_MIN_RECOMMENDED_SIZE) warnSizeBoundary(numeric, 'is below the recommended minimum')
    // Keep decimals intact. Browser/WeChat performs final DPR rasterization.
    return numeric
  }
  return PAW_ICON_SIZE[PAW_ICON_DEFAULT_SIZE]
}

function roundPx(value) {
  return Math.round(value * 1000) / 1000
}

/**
 * PawIcon.size is the CSS edge of the canonical 24×24 design canvas.
 * Optical normalization happens in the icon build, never in page CSS or
 * per-size runtime branches. Every icon therefore owns a square layout box;
 * the artwork's natural proportions live inside the canonical SVG viewBox.
 */
export function resolvePawIconDimensions(size, definition) {
  const target = resolvePawIconSize(size)
  return { width: target, height: target, designWidth: 24, designHeight: 24 }
}

export function normalizePawIconRotate(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  const normalized = ((numeric % 360) + 360) % 360
  return roundPx(normalized)
}

export function resolvePawIconTransform(rotate, flip) {
  const normalizedRotate = normalizePawIconRotate(rotate)
  const normalizedFlip = PAW_ICON_FLIPS.has(flip) ? flip : 'none'
  const transforms = []

  // CSS applies the rightmost transform first, so this emits flip before
  // rotate as required by the public PawIcon transform contract.
  if (normalizedRotate) transforms.push(`rotate(${normalizedRotate}deg)`)
  if (normalizedFlip === 'horizontal' || normalizedFlip === 'both') transforms.push('scaleX(-1)')
  if (normalizedFlip === 'vertical' || normalizedFlip === 'both') transforms.push('scaleY(-1)')

  return {
    transform: transforms.length ? transforms.join(' ') : 'none',
    transformOrigin: 'center center'
  }
}

export function resolveMonoIconUri(template, color) {
  if (!template) return ''
  const cacheKey = `${template}\u0000${color}`
  if (!monoUriCache.has(cacheKey)) {
    monoUriCache.set(cacheKey, `data:image/svg+xml;charset=utf-8,${template.replace(/__PAW_ICON_COLOR__/g, encodeURIComponent(color))}`)
  }
  return monoUriCache.get(cacheKey)
}

export function warnColorOverride(name) {
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn(`[PawIcon] color is ignored for color icon "${name}"; use the Figma asset color.`)
  }
}

export function warnUnknownIcon(name) {
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn(`[PawIcon] Unknown icon: ${name}`)
  }
}
