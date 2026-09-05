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

function readSource(absolutePath, relativePath) {
  if (!fs.existsSync(absolutePath)) fail(`source not found: ${relativePath}`)
  return fs.readFileSync(absolutePath, 'utf8')
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
  const entries = iconEntries()
  const monoNames = entries.filter(entry => entry.kind === 'mono').map(entry => entry.name)
  const colorNames = entries.filter(entry => entry.kind === 'color').map(entry => entry.name)
  const names = [...monoNames, ...colorNames]
  if (new Set(names).size !== names.length) fail('manifest contains duplicate names')
  for (const name of names) {
    const [category, icon] = name.split('/')
    if (!CATEGORIES.has(category) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(icon)) fail(`invalid manifest name: ${name}`)
    const configuredPath = (manifest.mono || {})[name] || (manifest.color || {})[name]
    if (configuredPath !== sourceRelativePath(name, configuredPath)) fail(`manifest must point ${name} to its canonical Figma source path`)
    const metadata = (manifest.meta && manifest.meta[name]) || {}
    if (!/^\d+:\d+$/.test(String(metadata.figmaNodeId || ''))) fail(`${name} is missing an exact Figma node ID`)
  }
  for (const name of Object.keys(manifest.optical || {})) {
    if (!names.includes(name)) fail(`optical metadata has no manifest icon: ${name}`)
    const metadata = manifest.optical[name]
    if (metadata.sizeAxis) fail(`sizeAxis is no longer supported; use max-edge size semantics: ${name}`)
  }
  for (const [family, config] of Object.entries(manifest.families || {})) {
    if (!OPTICAL_SLOTS.includes(Number(config.slot))) fail(`family ${family} has an invalid slot: ${config.slot}`)
  }
  for (const [name, metadata] of Object.entries(manifest.meta || {})) {
    if (!names.includes(name)) fail(`meta has no manifest icon: ${name}`)
    if (metadata.family && !(manifest.families && manifest.families[metadata.family])) fail(`meta references unknown family: ${name} -> ${metadata.family}`)
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
    const configuredPath = (manifest.mono || {})[name] || (manifest.color || {})[name]
    const sourcePath = sourceRelativePath(name, configuredPath)
    const source = readSource(sourceAbsolutePath(name, configuredPath), sourcePath)
    const sourceViewBox = readViewBox(source, sourcePath)
    const metadata = iconMetadata(name, sourceViewBox)
    const explicitFrameSlot = isExplicitFrameSlot(metadata.slot, metadata.sourceFrame.width, metadata.sourceFrame.height)
    if ((!metadata.recommendedSlot && !explicitFrameSlot) || (!OPTICAL_SLOTS.includes(Number(metadata.slot)) && !explicitFrameSlot)) {
      fail(`${name} must resolve to an optical slot; source frame is ${metadata.sourceFrame.width}×${metadata.sourceFrame.height}: ${sourcePath}`)
    }
    if (Math.abs(metadata.sourceFrame.width - sourceViewBox.width) > 0.01 || Math.abs(metadata.sourceFrame.height - sourceViewBox.height) > 0.01) {
      fail(`${name}.sourceFrame does not match the source viewBox: ${sourcePath}`)
    }
    if (metadata.sourceBounds && (
      !Number.isFinite(Number(metadata.sourceBounds.width)) || Number(metadata.sourceBounds.width) <= 0 ||
      !Number.isFinite(Number(metadata.sourceBounds.height)) || Number(metadata.sourceBounds.height) <= 0
    )) {
      fail(`${name}.sourceBounds must contain positive width and height: ${sourcePath}`)
    }
    if (/vector-effect\s*=\s*["']non-scaling-stroke/i.test(source)) {
      fail(`source must not use vector-effect="non-scaling-stroke": ${sourcePath}`)
    }
    if (/<(clipPath|mask)\b[^>]*>\s*<\/\1>/i.test(source)) {
      fail(`source contains an empty clipPath/mask: ${sourcePath}`)
    }
    const optical = readOpticalMetadata(name, sourcePath)
    const expectedNormalized = await normalizeAndFitSvg(source, sourceViewBox, optical, metadata.slot)
    const definition = definitions[name]
    if (definition.width !== DESIGN_CANVAS || definition.height !== DESIGN_CANVAS) {
      fail(`generated registry dimensions are stale for ${name}; run npm run icons:build`)
    }
    for (const key of ['sourceFrame', 'sourceBounds', 'recommendedSlot', 'slot', 'family', 'figmaNodeId']) {
      if (JSON.stringify(definition[key] ?? null) !== JSON.stringify(metadata[key] ?? null)) {
        fail(`generated metadata is stale for ${name}; run npm run icons:build`)
      }
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
  const manifestSources = new Set(iconEntries().flatMap(entry => [
    sourceRelativePath(entry.name, entry.configuredPath),
    entry.configuredPath
  ]))
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
  console.log('[PawIcon] check passed: source audit, optical slots, canonical assets, metadata, and direct refs')
}

check().catch(error => {
  console.error(error.stack || error.message)
  process.exitCode = 1
})
