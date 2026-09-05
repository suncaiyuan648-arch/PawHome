const fs = require('fs')
const path = require('path')
const {
  ROOT,
  iconEntries,
  iconMetadata,
  manifest,
  sourceAbsolutePath,
  sourceRelativePath
} = require('./paw-icon-manifest.cjs')
const {
  DESIGN_CANVAS,
  OPTICAL_SLOTS,
  isExplicitFrameSlot,
  normalizeAndFitSvg,
  readViewBox
} = require('./paw-icon-normalize.cjs')

const REGISTRY_FILE = path.join(ROOT, 'components/PawIcon/generated/icon-registry.js')
const NAMES_FILE = path.join(ROOT, 'components/PawIcon/generated/icon-names.js')
const COLOR_ROOT = path.join(ROOT, 'static/paw-icons/color')
const CATEGORIES = new Set(['navigation', 'actions', 'status', 'common', 'badges', 'brand'])

function fail(message) {
  throw new Error(`[PawIcon] ${message}`)
}

function validateName(name) {
  const parts = name.split('/')
  if (parts.length !== 2 || !CATEGORIES.has(parts[0]) || !parts[1].match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)) {
    fail(`invalid icon name "${name}"; use category/kebab-case`)
  }
}

function readSource(absolutePath, relativePath) {
  if (!fs.existsSync(absolutePath)) fail(`source not found: ${relativePath}`)
  const source = fs.readFileSync(absolutePath, 'utf8')
  if (!/<svg\b/i.test(source) || !/viewBox\s*=\s*["'][^"']+["']/i.test(source)) {
    fail(`source must be SVG with a viewBox: ${relativePath}`)
  }
  return source
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

function readV3Metadata(name, sourceViewBox, relativePath) {
  const metadata = iconMetadata(name, sourceViewBox)
  const explicitFrameSlot = isExplicitFrameSlot(metadata.slot, metadata.sourceFrame.width, metadata.sourceFrame.height)
  if (!metadata.recommendedSlot && !explicitFrameSlot) {
    fail(`${name} has a source frame larger than 25px (${metadata.sourceFrame.width}×${metadata.sourceFrame.height}); REVIEW_REQUIRED: ${relativePath}`)
  }
  if (!metadata.slot || (!OPTICAL_SLOTS.includes(Number(metadata.slot)) && !explicitFrameSlot)) {
    fail(`${name} must resolve to one of the optical slots ${OPTICAL_SLOTS.join(', ')}: ${relativePath}`)
  }
  if (Math.abs(metadata.sourceFrame.width - sourceViewBox.width) > 0.01 || Math.abs(metadata.sourceFrame.height - sourceViewBox.height) > 0.01) {
    fail(`${name}.sourceFrame must match the exported source viewBox (${sourceViewBox.width}×${sourceViewBox.height}): ${relativePath}`)
  }
  if (metadata.sourceBounds && (
    !Number.isFinite(Number(metadata.sourceBounds.width)) || Number(metadata.sourceBounds.width) <= 0 ||
    !Number.isFinite(Number(metadata.sourceBounds.height)) || Number(metadata.sourceBounds.height) <= 0
  )) {
    fail(`${name}.sourceBounds must contain positive width and height: ${relativePath}`)
  }
  const configured = (manifest.meta && manifest.meta[name]) || {}
  if (configured.family && !(manifest.families && manifest.families[configured.family])) {
    fail(`${name} references an unknown icon family "${configured.family}"`)
  }
  return metadata
}

async function build() {
  const all = {}
  const entries = iconEntries()
  for (const { name, kind, configuredPath } of entries) {
    validateName(name)
    if (all[name]) fail(`duplicate icon name "${name}"`)
    const sourcePath = sourceRelativePath(name, configuredPath)
    const source = readSource(sourceAbsolutePath(name, configuredPath), sourcePath)
    const sourceViewBox = readViewBox(source, sourcePath)
    const metadata = readV3Metadata(name, sourceViewBox, sourcePath)
    const optical = readOpticalMetadata(name, sourcePath)
    const normalized = await normalizeAndFitSvg(source, sourceViewBox, optical, metadata.slot)
    if (kind === 'mono') {
      if (!/currentColor/i.test(source)) fail(`mono icon must use currentColor: ${sourcePath}`)
      const template = encodeURIComponent(normalized.replace(/currentColor/g, '__PAW_ICON_COLOR__'))
      all[name] = {
        kind: 'mono',
        width: DESIGN_CANVAS,
        height: DESIGN_CANVAS,
        ...metadata,
        template
      }
      continue
    }
    const target = path.join(COLOR_ROOT, `${name}.svg`)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, normalized)
    all[name] = {
      kind: 'color',
      width: DESIGN_CANVAS,
      height: DESIGN_CANVAS,
      ...metadata,
      src: `/static/paw-icons/color/${name}.svg`
    }
  }

  const names = Object.keys(all).sort()
  fs.mkdirSync(path.dirname(REGISTRY_FILE), { recursive: true })
  fs.writeFileSync(REGISTRY_FILE, `// AUTO-GENERATED FILE. Run \`npm run icons:build\` after changing config/paw-icons.cjs.\nexport const PAW_ICON_REGISTRY = Object.freeze(${JSON.stringify(all, null, 2)})\n`)
  fs.writeFileSync(NAMES_FILE, `// AUTO-GENERATED FILE. Run \`npm run icons:build\` after changing config/paw-icons.cjs.\nexport const PAW_ICON_NAMES = Object.freeze(${JSON.stringify(names, null, 2)})\n`)
  console.log(`[PawIcon] generated ${names.length} icons: source frames → slots ${OPTICAL_SLOTS.join('/')} → ${DESIGN_CANVAS}×${DESIGN_CANVAS} canonical SVG`)
}

build().catch(error => {
  console.error(error.stack || error.message)
  process.exitCode = 1
})
