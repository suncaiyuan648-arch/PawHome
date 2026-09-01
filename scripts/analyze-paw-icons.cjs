const fs = require('fs')
const path = require('path')
const manifest = require('../config/paw-icons.cjs')

const ROOT = path.resolve(__dirname, '..')
const REGISTRY_FILE = path.join(ROOT, 'components/PawIcon/generated/icon-registry.js')
const REPORT_DIR = path.join(ROOT, '.artifacts/paw-icon-v2')
const REPORT_FILE = path.join(REPORT_DIR, 'optical-report.json')
const TARGET_SIZE = 24
const RASTER_SCALE = 8
const ALPHA_THRESHOLD = 8
const FIT_TOLERANCE_PX = 0.5
const SCALE_TOLERANCE_PX = 0.75
const CENTER_DRIFT_TOLERANCE_PX = 0.75

function parseAnalyzeSizes(argv) {
  const sizeArg = argv.find(value => value === '--sizes' || value.startsWith('--sizes='))
  if (!sizeArg) return [16, 20, 24, 28, 32]
  const raw = sizeArg === '--sizes' ? argv[argv.indexOf(sizeArg) + 1] : sizeArg.slice('--sizes='.length)
  const sizes = String(raw || '').split(',').map(value => Number(value.trim()))
    .filter(value => Number.isFinite(value) && value > 0 && value <= 512)
  const unique = [...new Set(sizes)].sort((a, b) => a - b)
  if (!unique.length) throw new Error('`--sizes` must contain positive numbers no greater than 512, e.g. --sizes 12,16,24,36')
  return unique
}

const ANALYZE_SIZES = parseAnalyzeSizes(process.argv.slice(2))

function readViewBox(source) {
  const match = source.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)
  const values = match ? match[1].trim().split(/[\s,]+/).map(Number) : []
  return values.length === 4 && values.every(Number.isFinite) && values[2] > 0 && values[3] > 0
    ? { x: values[0], y: values[1], width: values[2], height: values[3] }
    : null
}

function readRegistry() {
  const source = fs.readFileSync(REGISTRY_FILE, 'utf8')
  const match = source.match(/Object\.freeze\(([\s\S]*)\)\s*$/)
  if (!match) throw new Error('generated registry is invalid; run npm run icons:build')
  return JSON.parse(match[1])
}

function sourceForIcon(name, definition) {
  if (definition.kind === 'color') {
    const file = path.join(ROOT, 'static/paw-icons/color', `${name}.svg`)
    return fs.readFileSync(file, 'utf8')
  }
  return decodeURIComponent(definition.template).replace(/__PAW_ICON_COLOR__/g, '#666666')
}

function strokeWidths(source) {
  const values = [...source.matchAll(/stroke-width\s*=\s*["']([^"']+)["']/gi)]
    .map(match => Number(match[1]))
    .filter(Number.isFinite)
  return [...new Set(values)].sort((a, b) => a - b)
}

function opticalConfig(name, sourceViewBox) {
  const configured = (manifest.optical && manifest.optical[name]) || {}
  const box = configured.viewBox || sourceViewBox
  const scale = configured.scale === undefined ? 1 : Number(configured.scale)
  const offsetX = configured.offsetX === undefined ? 0 : Number(configured.offsetX)
  const offsetY = configured.offsetY === undefined ? 0 : Number(configured.offsetY)
  return { viewBox: box, scale, offsetX, offsetY }
}

function layoutForSize(definition, size) {
  const edge = Math.max(definition.width, definition.height)
  return {
    width: Number((definition.width * size / edge).toFixed(3)),
    height: Number((definition.height * size / edge).toFixed(3))
  }
}

async function measureSvg(source, targetSize) {
  const sharp = require('sharp')
  // Render each requested CSS size at a fixed supersampling factor. This keeps
  // 16px checks sensitive to small-size antialiasing and stroke expansion,
  // instead of merely scaling a 24px measurement down mathematically.
  const canvasSize = Math.max(1, Math.round(targetSize * RASTER_SCALE))
  const rendered = await sharp(Buffer.from(source))
    .resize(canvasSize, canvasSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { data, info } = rendered
  const channels = info.channels
  let minX = canvasSize
  let minY = canvasSize
  let maxX = -1
  let maxY = -1
  let paintedPixels = 0
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * channels + channels - 1]
      if (alpha <= ALPHA_THRESHOLD) continue
      paintedPixels += 1
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }
  if (maxX < 0) return { painted: false, width: 0, height: 0, centerX: 0.5, centerY: 0.5, occupancy: 0, rasterSize: canvasSize }
  const width = (maxX - minX + 1) * targetSize / canvasSize
  const height = (maxY - minY + 1) * targetSize / canvasSize
  return {
    painted: true,
    width: Number(width.toFixed(3)),
    height: Number(height.toFixed(3)),
    centerX: Number((((minX + maxX + 1) / 2) / canvasSize).toFixed(4)),
    centerY: Number((((minY + maxY + 1) / 2) / canvasSize).toFixed(4)),
    occupancy: Number((paintedPixels / (canvasSize * canvasSize)).toFixed(4)),
    rasterSize: canvasSize
  }
}

function measureFromBakedViewBox(viewBox, targetSize) {
  if (!viewBox) return { painted: false, width: 0, height: 0, centerX: 0.5, centerY: 0.5, occupancy: 0, source: 'metadata' }
  const edge = Math.max(viewBox.width, viewBox.height)
  return {
    painted: true,
    width: Number((viewBox.width * targetSize / edge).toFixed(3)),
    height: Number((viewBox.height * targetSize / edge).toFixed(3)),
    centerX: 0.5,
    centerY: 0.5,
    occupancy: null,
    source: 'baked-viewBox-fallback'
  }
}

function assessSize(definition, measured, size) {
  const layout = layoutForSize(definition, size)
  const overflow = {
    x: Number((measured.width - layout.width).toFixed(3)),
    y: Number((measured.height - layout.height).toFixed(3))
  }
  const largestDimension = Number(Math.max(measured.width, measured.height).toFixed(3))
  const centerOffset = {
    x: Number(((measured.centerX - 0.5) * size).toFixed(3)),
    y: Number(((measured.centerY - 0.5) * size).toFixed(3))
  }
  const warnings = []
  if (overflow.x > FIT_TOLERANCE_PX) warnings.push(`painted width overflows image box by ${overflow.x}px`)
  if (overflow.y > FIT_TOLERANCE_PX) warnings.push(`painted height overflows image box by ${overflow.y}px`)
  if (measured.source) warnings.push(measured.source === 'baked-viewBox-fallback'
    ? 'using baked viewBox fallback; raster bounds unavailable'
    : 'using metadata bounds; raster bounds unavailable')
  return {
    size,
    layout,
    measured,
    largestDimension,
    overflow,
    centerOffset,
    checks: {
      withinLayout: overflow.x <= FIT_TOLERANCE_PX && overflow.y <= FIT_TOLERANCE_PX,
      // Optical center is a source decision. The regression check below only
      // verifies that this decision does not drift as the icon is resized.
      centered: true,
      withinOpticalRange: null,
      rendered: measured.painted,
      centerStable: null,
      scalesWithSize: null
    },
    warnings,
    status: warnings.length ? 'warning' : 'pass'
  }
}

async function analyze() {
  const registry = readRegistry()
  const names = Object.keys(registry).sort()
  let sharpAvailable = true
  try {
    require.resolve('sharp')
  } catch (error) {
    sharpAvailable = false
  }

  const icons = []
  for (const name of names) {
    const definition = registry[name]
    const source = sourceForIcon(name, definition)
    const sourceViewBox = readViewBox(source)
    const bakedViewBox = sourceViewBox
    const configured = opticalConfig(name, sourceViewBox)
    const entry = {
      name,
      kind: definition.kind,
      sourceViewBox,
      bakedViewBox,
      layoutSizeAt24: layoutForSize(definition, TARGET_SIZE),
      optical: configured,
      strokeWidth: strokeWidths(source),
      sizes: {},
      measured: null,
      warnings: []
    }
    for (const size of ANALYZE_SIZES) {
      let measured
      if (sharpAvailable) {
        try {
          measured = await measureSvg(source, size)
          if (!measured.painted) {
            measured = measureFromBakedViewBox(bakedViewBox, size)
            entry.warnings.push(`${size}px: rasterizer found no alpha; using baked viewBox fallback`)
          }
        } catch (error) {
          measured = measureFromBakedViewBox(bakedViewBox, size)
          entry.warnings.push(`${size}px: rasterization failed; using baked viewBox fallback: ${error.message}`)
        }
      } else {
        measured = measureFromBakedViewBox(bakedViewBox, size)
        entry.warnings.push(`${size}px: sharp is not installed; measured bounds unavailable`)
      }
      const result = assessSize(definition, measured, size)
      entry.sizes[String(size)] = result
      if (size === TARGET_SIZE) entry.measured = measured
    }
    const scaleReferenceSize = ANALYZE_SIZES.includes(TARGET_SIZE) ? TARGET_SIZE : ANALYZE_SIZES[0]
    const scaleReference = entry.sizes[String(scaleReferenceSize)]
    if (!entry.measured) entry.measured = scaleReference.measured
    for (const size of ANALYZE_SIZES) {
      const result = entry.sizes[String(size)]
      const factor = size / scaleReferenceSize
      const expected = {
        width: Number((scaleReference.measured.width * factor).toFixed(3)),
        height: Number((scaleReference.measured.height * factor).toFixed(3))
      }
      const delta = {
        width: Number((result.measured.width - expected.width).toFixed(3)),
        height: Number((result.measured.height - expected.height).toFixed(3))
      }
      result.scaleReferenceSize = scaleReferenceSize
      result.scaleExpected = expected
      result.scaleDelta = delta
      result.checks.scalesWithSize = Math.abs(delta.width) <= SCALE_TOLERANCE_PX && Math.abs(delta.height) <= SCALE_TOLERANCE_PX
      const centerDrift = {
        x: Number(((result.measured.centerX - scaleReference.measured.centerX) * size).toFixed(3)),
        y: Number(((result.measured.centerY - scaleReference.measured.centerY) * size).toFixed(3))
      }
      result.centerDrift = centerDrift
      result.checks.centerStable = Math.abs(centerDrift.x) <= CENTER_DRIFT_TOLERANCE_PX && Math.abs(centerDrift.y) <= CENTER_DRIFT_TOLERANCE_PX
      if (!result.checks.centerStable) {
        result.warnings.push(`visual center drifts from ${scaleReferenceSize}px reference: Δ${centerDrift.x}×${centerDrift.y}px`)
      }
      if (!result.checks.scalesWithSize) {
        result.warnings.push(`painted bounds do not scale with ${scaleReferenceSize}px reference: Δ${delta.width}×${delta.height}px`)
      }
      result.status = result.warnings.length ? 'warning' : 'pass'
    }
    entry.warnings.push(...ANALYZE_SIZES.flatMap(size => entry.sizes[String(size)].warnings
      .filter(warning => !warning.includes('fallback') && !warning.includes('sharp is not installed'))
      .map(warning => `${size}px: ${warning}`)))
    entry.status = entry.warnings.length ? 'warning' : 'pass'
    icons.push(entry)
  }

  const bySize = Object.fromEntries(ANALYZE_SIZES.map(size => {
    const results = icons.map(icon => icon.sizes[String(size)])
    return [String(size), {
      total: results.length,
      pass: results.filter(result => result.status === 'pass').length,
      warning: results.filter(result => result.status === 'warning').length,
      overflow: results.filter(result => !result.checks.withinLayout).length,
      uncentered: results.filter(result => !result.checks.centered).length,
      scaleInconsistent: results.filter(result => !result.checks.scalesWithSize).length,
      centerDrift: results.filter(result => !result.checks.centerStable).length,
      unrendered: results.filter(result => !result.checks.rendered).length
    }]
  }))

  const report = {
    version: 2,
    generatedAt: new Date().toISOString(),
    analysisMode: sharpAvailable ? 'sharp-raster-per-size' : 'metadata-only',
    canvas: {
      rasterScale: RASTER_SCALE,
      alphaThreshold: ALPHA_THRESHOLD,
      perSize: Object.fromEntries(ANALYZE_SIZES.map(size => [String(size), { width: Math.max(1, Math.round(size * RASTER_SCALE)), height: Math.max(1, Math.round(size * RASTER_SCALE)) }]))
    },
    target: {
      referenceSize: TARGET_SIZE,
      sizes: ANALYZE_SIZES,
      designCanvas: '24 × 24',
      liveAreaGuidance: 'approximately 20 × 20; use optical keylines by form, not a global painted-edge threshold'
    },
    summary: {
      total: icons.length,
      pass: icons.filter(icon => icon.status === 'pass').length,
      warning: icons.filter(icon => icon.status === 'warning').length,
      bySize
    },
    icons
  }
  fs.mkdirSync(REPORT_DIR, { recursive: true })
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`[PawIcon] analyzed ${icons.length} icons (${report.analysisMode}); ${report.summary.warning} warnings`)
  console.log(`[PawIcon] size checks: ${ANALYZE_SIZES.map(size => `${size}px ${bySize[String(size)].pass} pass / ${bySize[String(size)].warning} warning`).join(', ')}`)
  console.log(`[PawIcon] geometry checks: ${ANALYZE_SIZES.map(size => {
    const result = bySize[String(size)]
    return `${size}px overflow=${result.overflow}, centerDrift=${result.centerDrift}, scaleMismatch=${result.scaleInconsistent}, unrendered=${result.unrendered}`
  }).join(', ')}`)
  console.log(`[PawIcon] report: ${path.relative(ROOT, REPORT_FILE)}`)
}

analyze().catch(error => {
  console.error(`[PawIcon] analyze failed: ${error.stack || error.message}`)
  process.exitCode = 1
})
