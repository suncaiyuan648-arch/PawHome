const sharp = require('sharp')

const DESIGN_CANVAS = 24
const DESIGN_CENTER = DESIGN_CANVAS / 2
// Keep one canonical design unit of breathing room on every side of the
// longest painted edge. This becomes a proportional margin at every runtime
// size, instead of a per-size CSS adjustment.
const LIVE_AREA_MAX_EDGE = 22
const RASTER_SIZE = 288
const ALPHA_THRESHOLD = 8

function formatNumber(value) {
  return Number(value.toFixed(6)).toString()
}

function readViewBox(source, relativePath = 'SVG') {
  const match = source.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)
  const values = match ? match[1].trim().split(/[\s,]+/).map(Number) : []
  if (values.length !== 4 || values.some(value => !Number.isFinite(value)) || values[2] <= 0 || values[3] <= 0) {
    throw new Error(`[PawIcon] source must have a valid positive viewBox: ${relativePath}`)
  }
  return { x: values[0], y: values[1], width: values[2], height: values[3] }
}

function rootParts(source) {
  const normalized = source.replace(/\r\n?/g, '\n')
  const root = normalized.match(/^(\s*<svg\b[^>]*>)([\s\S]*?)(<\/svg>\s*)$/i)
  if (!root) throw new Error('[PawIcon] source must contain a complete <svg> element')
  return root
}

function normalizeSvg(source, sourceViewBox, optical = {}) {
  const [, originalOpening, content, closing] = rootParts(source)
  const scale = DESIGN_CANVAS / Math.max(sourceViewBox.width, sourceViewBox.height)
  const translateX = (DESIGN_CANVAS - sourceViewBox.width * scale) / 2 - sourceViewBox.x * scale
  const translateY = (DESIGN_CANVAS - sourceViewBox.height * scale) / 2 - sourceViewBox.y * scale
  const sourceMatrix = `matrix(${formatNumber(scale)} 0 0 ${formatNumber(scale)} ${formatNumber(translateX)} ${formatNumber(translateY)})`
  const opticalScale = optical.scale === undefined ? 1 : Number(optical.scale)
  const offsetX = optical.offsetX === undefined ? 0 : Number(optical.offsetX)
  const offsetY = optical.offsetY === undefined ? 0 : Number(optical.offsetY)
  const hasOpticalCorrection = opticalScale !== 1 || offsetX !== 0 || offsetY !== 0
  const opticalTransform = `translate(${formatNumber(DESIGN_CENTER + offsetX)} ${formatNumber(DESIGN_CENTER + offsetY)}) scale(${formatNumber(opticalScale)}) translate(${formatNumber(-DESIGN_CENTER)} ${formatNumber(-DESIGN_CENTER)})`
  const opening = originalOpening
    .replace(/(\bviewBox\s*=\s*["'])[^"']+(["'])/i, (_, prefix, suffix) => `${prefix}0 0 ${DESIGN_CANVAS} ${DESIGN_CANVAS}${suffix}`)
    // Only normalize root SVG attributes. Nested frame/clip dimensions are
    // part of the Figma glyph and must remain intact.
    .replace(/\s(width|height|style|overflow|preserveAspectRatio)\s*=\s*["'][^"']*["']/gi, '')
  const sourceContent = scale === 1 && translateX === 0 && translateY === 0
    ? content
    : `<g transform="${sourceMatrix}">${content}</g>`
  const opticalContent = hasOpticalCorrection
    ? `<g transform="${opticalTransform}">${sourceContent}</g>`
    : sourceContent
  return `${opening}${opticalContent}${closing}`
}

function wrapContent(source, transform) {
  const [, opening, content, closing] = rootParts(source)
  return `${opening}<g transform="${transform}">${content}</g>${closing}`
}

async function measurePaintedBounds(source) {
  // sharp does not need to understand currentColor for geometry, but using a
  // concrete color also keeps the raster result consistent across versions.
  const renderSource = source.replace(/currentColor/gi, '#666666')
  const { data, info } = await sharp(Buffer.from(renderSource))
    .resize(RASTER_SIZE, RASTER_SIZE, {
      fit: 'fill',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  let minX = RASTER_SIZE
  let minY = RASTER_SIZE
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + info.channels - 1]
      if (alpha <= ALPHA_THRESHOLD) continue
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }
  if (maxX < 0) return null
  return {
    left: minX / (RASTER_SIZE / DESIGN_CANVAS),
    top: minY / (RASTER_SIZE / DESIGN_CANVAS),
    right: (maxX + 1) / (RASTER_SIZE / DESIGN_CANVAS),
    bottom: (maxY + 1) / (RASTER_SIZE / DESIGN_CANVAS)
  }
}

async function fitSvgToLiveArea(source) {
  const painted = await measurePaintedBounds(source)
  if (!painted) return source
  const width = painted.right - painted.left
  const height = painted.bottom - painted.top
  const maxEdge = Math.max(width, height)
  if (!Number.isFinite(maxEdge) || maxEdge <= 0) return source
  const scale = LIVE_AREA_MAX_EDGE / maxEdge
  const centerX = (painted.left + painted.right) / 2
  const centerY = (painted.top + painted.bottom) / 2
  const translateX = DESIGN_CENTER - centerX * scale
  const translateY = DESIGN_CENTER - centerY * scale
  const fitTransform = `matrix(${formatNumber(scale)} 0 0 ${formatNumber(scale)} ${formatNumber(translateX)} ${formatNumber(translateY)})`
  return wrapContent(source, fitTransform)
}

async function normalizeAndFitSvg(source, sourceViewBox, optical) {
  const normalized = normalizeSvg(source, sourceViewBox, optical)
  return fitSvgToLiveArea(normalized)
}

module.exports = {
  ALPHA_THRESHOLD,
  DESIGN_CANVAS,
  DESIGN_CENTER,
  LIVE_AREA_MAX_EDGE,
  formatNumber,
  fitSvgToLiveArea,
  measurePaintedBounds,
  normalizeAndFitSvg,
  normalizeSvg,
  readViewBox
}
