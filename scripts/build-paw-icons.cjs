const fs = require('fs')
const path = require('path')
const manifest = require('../config/paw-icons.cjs')
const { DESIGN_CANVAS, normalizeAndFitSvg, readViewBox } = require('./paw-icon-normalize.cjs')

const ROOT = path.resolve(__dirname, '..')
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

function readSource(relativePath) {
  const absolutePath = path.join(ROOT, relativePath)
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

async function build() {
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
    const normalized = await normalizeAndFitSvg(source, sourceViewBox, optical)
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

build().catch(error => {
  console.error(error.stack || error.message)
  process.exitCode = 1
})
