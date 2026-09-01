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

function readOpticalViewBox(name, sourceViewBox, relativePath) {
  const configured = (manifest.optical && manifest.optical[name]) || {}
  const configuredBox = configured.viewBox || sourceViewBox
  const values = [configuredBox.x, configuredBox.y, configuredBox.width, configuredBox.height].map(Number)
  if (values.some(value => !Number.isFinite(value)) || values[2] <= 0 || values[3] <= 0) {
    fail(`optical.viewBox must have finite positive dimensions: ${name} (${relativePath})`)
  }
  if (
    values[0] < sourceViewBox.x ||
    values[1] < sourceViewBox.y ||
    values[0] + values[2] > sourceViewBox.x + sourceViewBox.width ||
    values[1] + values[3] > sourceViewBox.y + sourceViewBox.height
  ) {
    fail(`optical.viewBox must be inside the source viewBox: ${name} (${relativePath})`)
  }

  const scale = configured.scale === undefined ? 1 : Number(configured.scale)
  const offsetX = configured.offsetX === undefined ? 0 : Number(configured.offsetX)
  const offsetY = configured.offsetY === undefined ? 0 : Number(configured.offsetY)
  if (!Number.isFinite(scale) || scale < 0.92 || scale > 1.08) {
    fail(`optical.scale must be between 0.92 and 1.08: ${name}`)
  }
  if (!Number.isFinite(offsetX) || Math.abs(offsetX) > 1 || !Number.isFinite(offsetY) || Math.abs(offsetY) > 1) {
    fail(`optical offsets must be within ±1: ${name}`)
  }

  const width = values[2] * scale
  const height = values[3] * scale
  const x = values[0] + (values[2] - width) / 2 + offsetX
  const y = values[1] + (values[3] - height) / 2 + offsetY
  if (
    x < sourceViewBox.x ||
    y < sourceViewBox.y ||
    x + width > sourceViewBox.x + sourceViewBox.width ||
    y + height > sourceViewBox.y + sourceViewBox.height
  ) {
    fail(`optical correction moves the baked viewBox outside the source viewBox: ${name}`)
  }
  return { x, y, width, height, scale, offsetX, offsetY }
}

function formatNumber(value) {
  return Number(value.toFixed(6)).toString()
}

function normalizeSvg(source, sourceViewBox, opticalViewBox) {
  const normalized = source.replace(/\r\n?/g, '\n')
  const root = normalized.match(/^(\s*<svg\b[^>]*>)([\s\S]*?)(<\/svg>\s*)$/i)
  if (!root) fail('source must contain a complete <svg> element')

  // Figma exports use 12/16/32/60-unit frames interchangeably. Preserve the
  // exported artwork, but map its audited frame to the canonical runtime
  // coordinate system. A matrix keeps the conversion deterministic for SVG
  // consumers and avoids runtime size-specific compensation.
  const edge = Math.max(opticalViewBox.width, opticalViewBox.height)
  const scale = DESIGN_CANVAS / edge
  const translateX = (DESIGN_CANVAS - opticalViewBox.width * scale) / 2 - opticalViewBox.x * scale
  const translateY = (DESIGN_CANVAS - opticalViewBox.height * scale) / 2 - opticalViewBox.y * scale
  const matrix = `matrix(${formatNumber(scale)} 0 0 ${formatNumber(scale)} ${formatNumber(translateX)} ${formatNumber(translateY)})`
  const opening = root[1]
    .replace(/(\bviewBox\s*=\s*["'])[^"']+(["'])/i, (_, prefix, suffix) => `${prefix}0 0 ${DESIGN_CANVAS} ${DESIGN_CANVAS}${suffix}`)
    // Only normalize root SVG attributes. Nested rect/clipPath/frame
    // width/height attributes are part of the Figma glyph and must remain.
    .replace(/\s(width|height|style|overflow|preserveAspectRatio)\s*=\s*["'][^"']*["']/gi, '')
  const isIdentity = scale === 1 && translateX === 0 && translateY === 0
  return isIdentity ? `${opening}${root[2]}${root[3]}` : `${opening}<g transform="${matrix}">${root[2]}</g>${root[3]}`
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
    const opticalViewBox = readOpticalViewBox(name, sourceViewBox, sourcePath)
    const normalized = normalizeSvg(source, sourceViewBox, opticalViewBox)
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
