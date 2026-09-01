const fs = require('fs')
const path = require('path')
const manifest = require('../config/paw-icons.cjs')

const ROOT = path.resolve(__dirname, '..')
const REGISTRY_FILE = path.join(ROOT, 'components/PawIcon/generated/icon-registry.js')
const NAMES_FILE = path.join(ROOT, 'components/PawIcon/generated/icon-names.js')
const COLOR_ROOT = path.join(ROOT, 'static/paw-icons/color')
const CATEGORIES = new Set(['navigation', 'actions', 'status', 'common', 'badges', 'brand'])
const DESIGN_CANVAS = 24

function fail(message) {
  throw new Error(`[PawIcon] ${message}`)
}

function validateName(name) {
  const parts = name.split('/')
  if (parts.length !== 2 || !CATEGORIES.has(parts[0]) || !parts[1].match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)) {
    fail(`invalid icon name "${name}"; use category/kebab-case`)
  }
}

function readSource(relativePath) {
  const absolutePath = path.join(ROOT, relativePath)
  if (!fs.existsSync(absolutePath)) fail(`source not found: ${relativePath}`)
  const source = fs.readFileSync(absolutePath, 'utf8')
  if (!/<svg\b/i.test(source) || !/viewBox\s*=\s*["'][^"']+["']/i.test(source)) {
    fail(`source must be SVG with a viewBox: ${relativePath}`)
  }
  return source
}

function readViewBox(source, relativePath) {
  const match = source.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)
  const values = match ? match[1].trim().split(/[\s,]+/).map(Number) : []
  if (values.length !== 4 || values.some(value => !Number.isFinite(value)) || values[2] <= 0 || values[3] <= 0) {
    fail(`source must have a valid positive viewBox: ${relativePath}`)
  }
  return { x: values[0], y: values[1], width: values[2], height: values[3] }
}

function readOpticalMetadata(name, relativePath) {
  const configured = (manifest.optical && manifest.optical[name]) || {}
  const scale = configured.scale === undefined ? 1 : Number(configured.scale)
  const offsetX = configured.offsetX === undefined ? 0 : Number(configured.offsetX)
  const offsetY = configured.offsetY === undefined ? 0 : Number(configured.offsetY)
  if (!Number.isFinite(scale) || scale < 0.92 || scale > 1.08) {
    fail(`optical.scale must be between 0.92 and 1.08: ${name}`)
  }
  if (!Number.isFinite(offsetX) || Math.abs(offsetX) > 2 || !Number.isFinite(offsetY) || Math.abs(offsetY) > 2) {
    fail(`optical offsets must be within ±2 canonical design units: ${name} (${relativePath})`)
  }
  if (Object.prototype.hasOwnProperty.call(configured, 'viewBox')) {
    fail(`optical.viewBox is source-space metadata; use scale/offsetX/offsetY in 24-unit design space: ${name} (${relativePath})`)
  }
  return { scale, offsetX, offsetY }
}

function formatNumber(value) {
  return Number(value.toFixed(6)).toString()
}

function normalizeSvg(source, sourceViewBox, optical) {
  const normalized = source.replace(/\r\n?/g, '\n')
  const root = normalized.match(/^(\s*<svg\b[^>]*>)([\s\S]*?)(<\/svg>\s*)$/i)
  if (!root) fail('source must contain a complete <svg> element')

  // Map the complete source frame into the one canonical 24 × 24 design
  // space. A single uniform scale preserves wide/tall artwork proportions;
  // the unused axis is intentional live-area padding, not a runtime size.
  const edge = Math.max(sourceViewBox.width, sourceViewBox.height)
  const scale = DESIGN_CANVAS / edge
  const translateX = (DESIGN_CANVAS - sourceViewBox.width * scale) / 2 - sourceViewBox.x * scale
  const translateY = (DESIGN_CANVAS - sourceViewBox.height * scale) / 2 - sourceViewBox.y * scale
  const sourceMatrix = `matrix(${formatNumber(scale)} 0 0 ${formatNumber(scale)} ${formatNumber(translateX)} ${formatNumber(translateY)})`
  const hasOpticalCorrection = optical.scale !== 1 || optical.offsetX !== 0 || optical.offsetY !== 0
  const opticalTransform = `translate(${formatNumber(DESIGN_CANVAS / 2 + optical.offsetX)} ${formatNumber(DESIGN_CANVAS / 2 + optical.offsetY)}) scale(${formatNumber(optical.scale)}) translate(${formatNumber(-DESIGN_CANVAS / 2)} ${formatNumber(-DESIGN_CANVAS / 2)})`
  const opening = root[1]
    .replace(/(\bviewBox\s*=\s*["'])[^"']+(["'])/i, (_, prefix, suffix) => `${prefix}0 0 ${DESIGN_CANVAS} ${DESIGN_CANVAS}${suffix}`)
    // Only normalize root SVG attributes. Nested rect/clipPath/frame
    // width/height attributes are part of the Figma glyph and must remain.
    .replace(/\s(width|height|style|overflow|preserveAspectRatio)\s*=\s*["'][^"']*["']/gi, '')
  const sourceContent = scale === 1 && translateX === 0 && translateY === 0
    ? root[2]
    : `<g transform="${sourceMatrix}">${root[2]}</g>`
  return hasOpticalCorrection
    ? `${opening}<g transform="${opticalTransform}">${sourceContent}</g>${root[3]}`
    : `${opening}${sourceContent}${root[3]}`
}

function build() {
  const all = {}
  const entries = [
    ...Object.entries(manifest.mono || {}).map(([name, source]) => [name, 'mono', source]),
    ...Object.entries(manifest.color || {}).map(([name, source]) => [name, 'color', source])
  ]
  for (const [name, kind, sourcePath] of entries) {
    validateName(name)
    if (all[name]) fail(`duplicate icon name "${name}"`)
    const source = readSource(sourcePath)
    const sourceViewBox = readViewBox(source, sourcePath)
    const optical = readOpticalMetadata(name, sourcePath)
    const normalized = normalizeSvg(source, sourceViewBox, optical)
    if (kind === 'mono') {
      if (!/currentColor/i.test(source)) fail(`mono icon must use currentColor: ${sourcePath}`)
      const template = encodeURIComponent(normalized.replace(/currentColor/g, '__PAW_ICON_COLOR__'))
      all[name] = { kind: 'mono', width: DESIGN_CANVAS, height: DESIGN_CANVAS, template }
      continue
    }
    const target = path.join(COLOR_ROOT, `${name}.svg`)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, normalized)
    all[name] = {
      kind: 'color',
      width: DESIGN_CANVAS,
      height: DESIGN_CANVAS,
      src: `/static/paw-icons/color/${name}.svg`
    }
  }

  const names = Object.keys(all).sort()
  fs.mkdirSync(path.dirname(REGISTRY_FILE), { recursive: true })
  fs.writeFileSync(REGISTRY_FILE, `// AUTO-GENERATED FILE. Run \`npm run icons:build\` after changing config/paw-icons.cjs.\nexport const PAW_ICON_REGISTRY = Object.freeze(${JSON.stringify(all, null, 2)})\n`)
  fs.writeFileSync(NAMES_FILE, `// AUTO-GENERATED FILE. Run \`npm run icons:build\` after changing config/paw-icons.cjs.\nexport const PAW_ICON_NAMES = Object.freeze(${JSON.stringify(names, null, 2)})\n`)
  console.log(`[PawIcon] generated ${names.length} icons on a ${DESIGN_CANVAS}×${DESIGN_CANVAS} design canvas`)
}

build()
