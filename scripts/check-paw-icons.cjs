const fs = require('fs')
const path = require('path')
const manifest = require('../config/paw-icons.cjs')
const { DESIGN_CANVAS, normalizeAndFitSvg, readViewBox } = require('./paw-icon-normalize.cjs')

const ROOT = path.resolve(__dirname, '..')
const REGISTRY_FILE = path.join(ROOT, 'components/PawIcon/generated/icon-registry.js')
const NAMES_FILE = path.join(ROOT, 'components/PawIcon/generated/icon-names.js')
const COLOR_ROOT = path.join(ROOT, 'static/paw-icons/color')
const BUSINESS_ROOTS = ['pages', 'components', 'custom-tab-bar', 'app.vue']
const CATEGORIES = new Set(['navigation', 'actions', 'status', 'common', 'badges', 'brand'])

function fail(message) {
  throw new Error(`[PawIcon] ${message}`)
}

function walk(entry, files = []) {
  if (!fs.existsSync(entry)) return files
  const stat = fs.statSync(entry)
  if (stat.isFile()) return files.concat(entry)
  for (const child of fs.readdirSync(entry)) walk(path.join(entry, child), files)
  return files
}

function readSource(relativePath) {
  const absolutePath = path.join(ROOT, relativePath)
  if (!fs.existsSync(absolutePath)) fail(`source not found: ${relativePath}`)
  return fs.readFileSync(absolutePath, 'utf8')
}

function isCanonicalViewBox(viewBox) {
  return viewBox.x === 0 && viewBox.y === 0 && viewBox.width === DESIGN_CANVAS && viewBox.height === DESIGN_CANVAS
}

function hasRootExportAttributes(source) {
  const opening = (source.match(/<svg\b[^>]*>/i) || [''])[0]
  return ['width', 'height', 'preserveAspectRatio', 'overflow', 'style']
    .some(attribute => new RegExp(`(?:^|\\s)${attribute}\\s*=`, 'i').test(opening))
}

function readOpticalMetadata(name, relativePath) {
  const configured = (manifest.optical && manifest.optical[name]) || {}
  const scale = configured.scale === undefined ? 1 : Number(configured.scale)
  const offsetX = configured.offsetX === undefined ? 0 : Number(configured.offsetX)
  const offsetY = configured.offsetY === undefined ? 0 : Number(configured.offsetY)
  if (!Number.isFinite(scale) || scale < 0.92 || scale > 1.08) fail(`optical.scale out of range: ${name}`)
  if (!Number.isFinite(offsetX) || Math.abs(offsetX) > 2 || !Number.isFinite(offsetY) || Math.abs(offsetY) > 2) {
    fail(`optical offset out of range in 24-unit design space: ${name} (${relativePath})`)
  }
  if (Object.prototype.hasOwnProperty.call(configured, 'viewBox')) {
    fail(`optical.viewBox is no longer supported; use 24-unit scale/offset metadata: ${name}`)
  }
  return { scale, offsetX, offsetY }
}

function attributeValues(source, attribute) {
  return [...source.matchAll(new RegExp(`${attribute}\\s*=\\s*["']([^"']+)["']`, 'gi'))]
    .map(match => match[1])
}

function hasHardcodedColor(source) {
  return /(?:fill|stroke)\s*=\s*["'](?:#|rgb\(|rgba\(|hsl\(|hsla\()/i.test(source)
}

function checkManifest() {
  const monoNames = Object.keys(manifest.mono || {})
  const colorNames = Object.keys(manifest.color || {})
  const names = [...monoNames, ...colorNames]
  if (new Set(names).size !== names.length) fail('manifest contains duplicate names')
  for (const name of names) {
    const [category, icon] = name.split('/')
    if (!CATEGORIES.has(category) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(icon)) fail(`invalid manifest name: ${name}`)
  }
  for (const name of Object.keys(manifest.optical || {})) {
    if (!names.includes(name)) fail(`optical metadata has no manifest icon: ${name}`)
    const metadata = manifest.optical[name]
    if (metadata.sizeAxis) fail(`sizeAxis is no longer supported; use max-edge size semantics: ${name}`)
  }
}

function parseRegistry() {
  if (!fs.existsSync(REGISTRY_FILE)) fail('generated registry is missing; run npm run icons:build')
  const registry = fs.readFileSync(REGISTRY_FILE, 'utf8')
  const registryMatch = registry.match(/Object\.freeze\(([\s\S]*)\)\s*$/)
  if (!registryMatch) fail('generated registry has an invalid format; run npm run icons:build')
  try {
    return JSON.parse(registryMatch[1])
  } catch (error) {
    fail(`generated registry is not valid JSON: ${error.message}`)
  }
}

async function checkGenerated() {
  const definitions = parseRegistry()
  const expected = [...Object.keys(manifest.mono || {}), ...Object.keys(manifest.color || {})].sort()
  const generatedNames = fs.existsSync(NAMES_FILE) ? fs.readFileSync(NAMES_FILE, 'utf8') : ''
  if (!generatedNames.includes(JSON.stringify(expected, null, 2))) fail('generated icon names are stale; run npm run icons:build')

  for (const name of expected) {
    if (!definitions[name]) fail(`generated registry is missing ${name}`)
    const sourcePath = (manifest.mono || {})[name] || (manifest.color || {})[name]
    const source = readSource(sourcePath)
    const sourceViewBox = readViewBox(source, sourcePath)
    if (!isCanonicalViewBox(sourceViewBox)) {
      fail(`source must use the canonical 24 × 24 viewBox: ${sourcePath}`)
    }
    if (hasRootExportAttributes(source)) {
      fail(`source contains export-only root dimensions or overflow attributes: ${sourcePath}`)
    }
    if (/vector-effect\s*=\s*["']non-scaling-stroke/i.test(source)) {
      fail(`source must not use vector-effect="non-scaling-stroke": ${sourcePath}`)
    }
    if (/<(clipPath|mask)\b[^>]*>\s*<\/\1>/i.test(source)) {
      fail(`source contains an empty clipPath/mask: ${sourcePath}`)
    }
    const optical = readOpticalMetadata(name, sourcePath)
    const expectedNormalized = await normalizeAndFitSvg(source, sourceViewBox, optical)
    const definition = definitions[name]
    if (definition.width !== DESIGN_CANVAS || definition.height !== DESIGN_CANVAS) {
      fail(`generated registry dimensions are stale for ${name}; run npm run icons:build`)
    }
    if (definition.kind === 'color') {
      const target = path.join(COLOR_ROOT, `${name}.svg`)
      if (!fs.existsSync(target)) fail(`generated color asset is missing: ${name}`)
      const generatedSource = fs.readFileSync(target, 'utf8')
      if (generatedSource !== expectedNormalized) {
        fail(`generated color asset is stale for ${name}; run npm run icons:build`)
      }
      if (/\bcurrentColor\b/i.test(generatedSource)) fail(`color icon must not use currentColor: ${name}`)
      if (JSON.stringify(readViewBox(generatedSource, name)) !== JSON.stringify({ x: 0, y: 0, width: DESIGN_CANVAS, height: DESIGN_CANVAS })) {
        fail(`generated color asset viewBox is stale for ${name}`)
      }
      if (JSON.stringify(attributeValues(source, 'stroke-width')) !== JSON.stringify(attributeValues(generatedSource, 'stroke-width'))) {
        fail(`generated color asset changed stroke-width: ${name}`)
      }
    } else if (definition.kind === 'mono') {
      if (!/\bcurrentColor\b/i.test(source)) fail(`mono icon must use currentColor: ${sourcePath}`)
      if (hasHardcodedColor(source)) fail(`mono icon must not contain a hardcoded fill/stroke color: ${sourcePath}`)
      const expectedTemplate = encodeURIComponent(expectedNormalized.replace(/currentColor/g, '__PAW_ICON_COLOR__'))
      if (definition.template !== expectedTemplate) fail(`generated mono asset is stale for ${name}; run npm run icons:build`)
    } else {
      fail(`generated registry has unknown kind for ${name}`)
    }
  }
}

function checkDirectRefs() {
  const sourceFiles = BUSINESS_ROOTS.flatMap(entry => walk(path.join(ROOT, entry)))
  const direct = /(?:src|iconSrc|iconImage|image|bubble|icon|backIcon)\s*[:=]\s*["'`]([^"'`]*\.svg)["'`]/g
  const manifestSources = new Set([...Object.values(manifest.mono || {}), ...Object.values(manifest.color || {})])
  for (const file of sourceFiles) {
    if (file.includes(`${path.sep}PawIcon${path.sep}`) || file.endsWith('PawIconButton.vue')) continue
    const source = fs.readFileSync(file, 'utf8')
    let match
    while ((match = direct.exec(source))) {
      if (manifestSources.has(match[1])) fail(`business code still references registered SVG directly: ${path.relative(ROOT, file)} -> ${match[1]}`)
    }
    direct.lastIndex = 0
  }
}

async function check() {
  checkManifest()
  await checkGenerated()
  checkDirectRefs()
  console.log('[PawIcon] check passed: names, viewBoxes, currentColor, max-edge live area, baked assets, and direct refs')
}

check().catch(error => {
  console.error(error.stack || error.message)
  process.exitCode = 1
})
