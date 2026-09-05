const DESIGN_CANVAS = 24
const DESIGN_CENTER = DESIGN_CANVAS / 2
const OPTICAL_SLOTS = Object.freeze([12, 16, 20, 24, 28])

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

function recommendedSlotForFrame(width, height) {
  const maxEdge = Math.max(Number(width), Number(height))
  if (!Number.isFinite(maxEdge) || maxEdge <= 0) return null
  if (maxEdge <= 10) return 12
  if (maxEdge <= 14) return 16
  if (maxEdge <= 18) return 20
  if (maxEdge <= 22) return 24
  if (maxEdge <= 25) return 28
  return null
}

function isExplicitFrameSlot(slot, width, height) {
  const numericSlot = Number(slot)
  const maxEdge = Math.max(Number(width), Number(height))
  return maxEdge > 25 && Number.isFinite(numericSlot) && numericSlot >= maxEdge - 0.01 && numericSlot <= 96
}

function rootParts(source) {
  const normalized = source.replace(/\r\n?/g, '\n')
  const root = normalized.match(/^(\s*<svg\b[^>]*>)([\s\S]*?)(<\/svg>\s*)$/i)
  if (!root) throw new Error('[PawIcon] source must contain a complete <svg> element')
  return root
}

function stripFigmaExportChrome(source) {
  // Figma's SVG export keeps the selected node's ancestor backgrounds and
  // clip-path rectangles. They are part of the exported frame preview, not
  // part of the icon artwork, and would otherwise become opaque pixels in
  // the generated runtime asset. The icon library contains no rect-based
  // glyphs, so removing these export-only rectangles is safe and keeps the
  // source frame's coordinates intact.
  return source
    .replace(/<clipPath\b[^>]*>[\s\S]*?<\/clipPath>/gi, '')
    .replace(/\sclip-path\s*=\s*["'][^"']*["']/gi, '')
    .replace(/<filter\b[^>]*>[\s\S]*?<\/filter>/gi, '')
    .replace(/\sfilter\s*=\s*["'][^"']*["']/gi, '')
    .replace(/<rect\b[^>]*\/?>(?:<\/rect>)?/gi, '')
}

function normalizeSvg(source, sourceViewBox, optical = {}, slot = DESIGN_CANVAS) {
  const [, originalOpening, content, closing] = rootParts(source)
  const scale = DESIGN_CANVAS / Number(slot)
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
  const cleanedContent = stripFigmaExportChrome(content)
  const sourceContent = scale === 1 && translateX === 0 && translateY === 0
    ? cleanedContent
    : `<g transform="${sourceMatrix}">${cleanedContent}</g>`
  const opticalContent = hasOpticalCorrection
    ? `<g transform="${opticalTransform}">${sourceContent}</g>`
    : sourceContent
  return `${opening}${opticalContent}${closing}`
}

async function normalizeAndFitSvg(source, sourceViewBox, optical, slot) {
  // Kept as a compatibility name for the existing build scripts. V3 must not
  // fit against painted bounds: the exported Figma frame is the optical
  // coordinate system, and its complete frame is mapped to the selected slot.
  return normalizeSvg(source, sourceViewBox, optical, slot)
}

module.exports = {
  DESIGN_CANVAS,
  DESIGN_CENTER,
  OPTICAL_SLOTS,
  formatNumber,
  normalizeAndFitSvg,
  normalizeSvg,
  readViewBox,
  isExplicitFrameSlot,
  recommendedSlotForFrame,
  stripFigmaExportChrome
}
