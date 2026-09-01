const fs = require('fs')
const path = require('path')
const manifest = require('../config/paw-icons.cjs')
const { DESIGN_CANVAS, LIVE_AREA_MAX_EDGE } = require('./paw-icon-normalize.cjs')

const ROOT = path.resolve(__dirname, '..')
const component = fs.readFileSync(path.join(ROOT, 'components/PawIcon/PawIcon.vue'), 'utf8')
const utils = fs.readFileSync(path.join(ROOT, 'components/PawIcon/PawIcon.utils.js'), 'utf8')
const registrySource = fs.readFileSync(path.join(ROOT, 'components/PawIcon/generated/icon-registry.js'), 'utf8')
const metricsFile = path.join(ROOT, 'components/PawIcon/generated/icon-metrics.js')
const registryMatch = registrySource.match(/Object\.freeze\(([\s\S]*)\)\s*$/)

function fail(message) {
  throw new Error(`[PawIcon size chain] ${message}`)
}

if (!registryMatch) fail('generated registry is invalid')
const registry = JSON.parse(registryMatch[1])
const entries = Object.entries(registry)

if (!utils.includes('export const PAW_ICON_MAX_SIZE = 96')) fail('MAX_ICON_SIZE must be explicit and equal to 96')
if (!utils.includes('export const PAW_ICON_MIN_RECOMMENDED_SIZE = 8')) fail('recommended minimum must be explicit and equal to 8')
if (/Math\.(?:round|floor)\s*\([^)]*size|parseInt\s*\([^)]*size/.test(utils)) fail('size must not be pixel-snapped with round/floor/parseInt')
if (!component.includes("width: `${this.resolvedSize}px`") || !component.includes("height: `${this.resolvedSize}px`")) {
  fail('runtime root must use the exact resolved CSS size on both axes')
}
if (component.includes('resolvedDimensions') || component.includes('baseDimensions')) fail('runtime must not derive layout from per-asset dimensions')
if (!component.includes("width: `${this.resolvedSize}px`") || !component.includes("height: `${this.resolvedSize}px`")) fail('image must use the square size contract')
if (!component.includes('virtualHost: true')) fail('WeChat component host must be virtualized so font line-height cannot expand the icon box')
if (/imageStyle\(\)[\s\S]*?position:\s*['"]absolute['"]/.test(component)) fail('image must stay in the root flex flow; absolute positioning can reintroduce host/layout drift')
if (!/\.paw-icon\s*\{[\s\S]*?line-height:\s*0;/.test(component)) fail('PawIcon root must explicitly neutralize inline line-height')

for (const [name, definition] of entries) {
  if (definition.width !== 24 || definition.height !== 24) fail(`${name} registry dimensions are not 24 × 24`)
}
if (!fs.existsSync(metricsFile)) fail('generated audit metrics are missing; run npm run icons:analyze')
const metricsSource = fs.readFileSync(metricsFile, 'utf8')
const metricsMatch = metricsSource.match(/Object\.freeze\(([\s\S]*)\)\s*$/)
if (!metricsMatch) fail('generated audit metrics are invalid; run npm run icons:analyze')
const metrics = JSON.parse(metricsMatch[1])
if (JSON.stringify(Object.keys(metrics).sort()) !== JSON.stringify(Object.keys(registry).sort())) {
  fail('generated audit metrics are stale; run npm run icons:analyze')
}
const expectedLiveAreaRatio = LIVE_AREA_MAX_EDGE / DESIGN_CANVAS
for (const [name, metadata] of Object.entries(metrics)) {
  for (const [size, measured] of Object.entries(metadata.sizes || {})) {
    const maxEdgeRatio = Math.max(Number(measured.paintedWidthRatio), Number(measured.paintedHeightRatio))
    if (!Number.isFinite(maxEdgeRatio) || Math.abs(maxEdgeRatio - expectedLiveAreaRatio) > 0.02 * expectedLiveAreaRatio) {
      fail(`${name} at ${size}px does not honor the ${LIVE_AREA_MAX_EDGE}-unit max-edge live-area contract`)
    }
    if (measured.leftRatio <= 0 || measured.topRatio <= 0 || measured.rightRatio >= 1 || measured.bottomRatio >= 1) {
      fail(`${name} at ${size}px touches the square layout edge; keep the normalized safety margin`)
    }
    if (Math.abs(Number(measured.centerXRatio) - 0.5) > 0.03 || Math.abs(Number(measured.centerYRatio) - 0.5) > 0.03) {
      fail(`${name} at ${size}px is not centered in the square layout box`)
    }
  }
}
for (const [name, metadata] of Object.entries(manifest.optical || {})) {
  if (Object.prototype.hasOwnProperty.call(metadata, 'viewBox')) fail(`${name} still has source-space optical.viewBox metadata`)
  for (const key of ['scale', 'offsetX', 'offsetY']) {
    if (metadata[key] !== undefined && !Number.isFinite(Number(metadata[key]))) fail(`${name}.${key} is not numeric`)
  }
}

console.log(`[PawIcon] size chain passed: ${entries.length} icons use exact square runtime layout and 24-unit design space`)
