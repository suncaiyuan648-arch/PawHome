import { PAW_ICON_DEFAULT_SIZE, PAW_ICON_SIZE } from './PawIcon.tokens.js'

const monoUriCache = new Map()
const PAW_ICON_FLIPS = new Set(['none', 'horizontal', 'vertical', 'both'])

export function resolvePawIconSize(size) {
  if (typeof size === 'number' && Number.isFinite(size) && size > 0) return size
  if (typeof size === 'string') {
    if (PAW_ICON_SIZE[size]) return PAW_ICON_SIZE[size]
    const numeric = Number(size.trim())
    if (Number.isFinite(numeric) && numeric > 0) return numeric
  }
  return PAW_ICON_SIZE[PAW_ICON_DEFAULT_SIZE]
}

function roundPx(value) {
  return Math.round(value * 1000) / 1000
}

/**
 * PawIcon.size is the CSS edge of the canonical 24×24 design canvas.
 * Optical normalization happens in the icon build, never in page CSS or
 * per-size runtime branches.
 */
export function resolvePawIconDimensions(size, definition) {
  const target = resolvePawIconSize(size)
  const sourceWidth = Number(definition && definition.width)
  const sourceHeight = Number(definition && definition.height)
  if (!Number.isFinite(sourceWidth) || sourceWidth <= 0 || !Number.isFinite(sourceHeight) || sourceHeight <= 0) {
    return { width: target, height: target }
  }

  const scale = target / Math.max(sourceWidth, sourceHeight)
  return {
    width: roundPx(sourceWidth * scale),
    height: roundPx(sourceHeight * scale)
  }
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
