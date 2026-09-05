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
const { DESIGN_CANVAS, OPTICAL_SLOTS, isExplicitFrameSlot, readViewBox } = require('./paw-icon-normalize.cjs')

const component = fs.readFileSync(path.join(ROOT, 'components/PawIcon/PawIcon.vue'), 'utf8')
const utils = fs.readFileSync(path.join(ROOT, 'components/PawIcon/PawIcon.utils.js'), 'utf8')
const registrySource = fs.readFileSync(path.join(ROOT, 'components/PawIcon/generated/icon-registry.js'), 'utf8')
const metricsFile = path.join(ROOT, 'components/PawIcon/generated/icon-metrics.js')

function fail(message) {
  throw new Error(`[PawIcon size chain] ${message}`)
}

function parseGenerated(source, label) {
  const match = source.match(/Object\.freeze\(([\s\S]*)\)\s*$/)
  if (!match) fail(`${label} is invalid`)
  try {
    return JSON.parse(match[1])
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`)
  }
}

const registry = parseGenerated(registrySource, 'generated registry')
const entries = Object.entries(registry)
const manifestNames = iconEntries().map(entry => entry.name).sort()

if (!utils.includes('export const PAW_ICON_MAX_SIZE = 96')) fail('MAX_ICON_SIZE must be explicit and equal to 96')
if (!utils.includes('export const PAW_ICON_MIN_RECOMMENDED_SIZE = 8')) fail('recommended minimum must be explicit and equal to 8')
if (/Math\.(?:round|floor)\s*\([^)]*size|parseInt\s*\([^)]*size/.test(utils)) fail('size must not be pixel-snapped with round/floor/parseInt')
if (!component.includes("width: `${this.resolvedSize}px`") || !component.includes("height: `${this.resolvedSize}px`")) {
  fail('runtime root and image must use the exact resolved CSS size on both axes')
}
if (component.includes('resolvedDimensions') || component.includes('baseDimensions')) fail('runtime must not derive layout from per-asset dimensions')
if (!component.includes('virtualHost: true')) fail('WeChat component host must be virtualized so font line-height cannot expand the icon box')
if (/imageStyle\(\)[\s\S]*?position:\s*['"]absolute['"]/.test(component)) fail('image must stay in the root flex flow')
if (!/\.paw-icon\s*\{[\s\S]*?line-height:\s*0;/.test(component)) fail('PawIcon root must explicitly neutralize inline line-height')
if (!/mode="aspectFit"/.test(component)) fail('PawIcon image must use proportional aspectFit rendering')
if (!component.includes('resolvePawIconSize(this.size)')) fail('runtime size resolution must be token/number based only')
if (JSON.stringify(Object.keys(registry).sort()) !== JSON.stringify(manifestNames)) fail('generated registry names are stale')

for (const [name, definition] of entries) {
  if (definition.width !== DESIGN_CANVAS || definition.height !== DESIGN_CANVAS) fail(`${name} registry dimensions are not 24 × 24`)
  const explicitFrameSlot = isExplicitFrameSlot(definition.slot, definition.sourceFrame.width, definition.sourceFrame.height)
  if (!OPTICAL_SLOTS.includes(Number(definition.slot)) && !explicitFrameSlot) fail(`${name} has an invalid final slot: ${definition.slot}`)
  if (!definition.sourceFrame || !Number.isFinite(Number(definition.sourceFrame.width)) || !Number.isFinite(Number(definition.sourceFrame.height))) {
    fail(`${name} is missing sourceFrame metadata`)
  }
  const sourceMaxEdge = Math.max(Number(definition.sourceFrame.width), Number(definition.sourceFrame.height))
  if (definition.recommendedSlot === null) {
    if (!explicitFrameSlot || sourceMaxEdge <= 25) fail(`${name} is missing recommendedSlot metadata`)
  } else if (!OPTICAL_SLOTS.includes(Number(definition.recommendedSlot))) {
    fail(`${name} has an invalid recommendedSlot metadata value`)
  }
}

if (!fs.existsSync(metricsFile)) fail('generated audit metrics are missing; run npm run icons:analyze')
const metrics = parseGenerated(fs.readFileSync(metricsFile, 'utf8'), 'generated audit metrics')
if (JSON.stringify(Object.keys(metrics).sort()) !== JSON.stringify(Object.keys(registry).sort())) fail('generated audit metrics are stale; run npm run icons:analyze')

for (const entry of iconEntries()) {
  const sourcePath = sourceRelativePath(entry.name, entry.configuredPath)
  const source = fs.readFileSync(sourceAbsolutePath(entry.name, entry.configuredPath), 'utf8')
  const sourceViewBox = readViewBox(source, sourcePath)
  const metadata = iconMetadata(entry.name, sourceViewBox)
  const definition = registry[entry.name]
  for (const key of ['sourceFrame', 'sourceBounds', 'recommendedSlot', 'slot', 'family', 'figmaNodeId']) {
    if (JSON.stringify(definition[key] ?? null) !== JSON.stringify(metadata[key] ?? null)) fail(`${entry.name} generated ${key} metadata is stale`)
  }
  if (definition.kind === 'color') {
    const generated = fs.readFileSync(path.join(ROOT, 'static/paw-icons/color', `${entry.name}.svg`), 'utf8')
    const generatedViewBox = readViewBox(generated, entry.name)
    if (generatedViewBox.x !== 0 || generatedViewBox.y !== 0 || generatedViewBox.width !== DESIGN_CANVAS || generatedViewBox.height !== DESIGN_CANVAS) {
      fail(`${entry.name} generated SVG is not a 24 × 24 canonical asset`)
    }
  }
}

console.log(`[PawIcon] size chain passed: ${entries.length} icons use source-frame slots ${OPTICAL_SLOTS.join('/')} and a 24-unit canonical runtime canvas`)
