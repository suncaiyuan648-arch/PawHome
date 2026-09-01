const fs = require('fs')
const path = require('path')
const manifest = require('../config/paw-icons.cjs')

const ROOT = path.resolve(__dirname, '..')
const REGISTRY_FILE = path.join(ROOT, 'components/PawIcon/generated/icon-registry.js')
const METRICS_FILE = path.join(ROOT, 'components/PawIcon/generated/icon-metrics.js')
const REPORT_DIR = path.join(ROOT, '.artifacts/paw-icon-v2')
const REPORT_FILE = path.join(REPORT_DIR, 'optical-report.json')
const DESIGN_CANVAS = 24
const DESIGN_CENTER = DESIGN_CANVAS / 2
const TARGET_SIZE = DESIGN_CANVAS
const RASTER_SCALE = 12
const ALPHA_THRESHOLD = 8
const RATIO_WARNING_THRESHOLD = 0.02
const RATIO_ERROR_THRESHOLD = 0.03
const CENTER_WARNING_THRESHOLD = 0.015
const CENTER_ERROR_THRESHOLD = 0.03
const PADDING_WARNING_THRESHOLD = 0.02
const PADDING_ERROR_THRESHOLD = 0.03
const DEFAULT_SIZES = [16, 17.5, 19, 20, 21, 23, 24, 25.5, 28, 31, 32, 37.5]
const COMPARISON_SIZES = [16, 20, 24, 28, 32, 37.5]
const TRANSFORM_CASES = [
  [0, false, false], [45, false, false], [90, false, false], [135, false, false], [180, false, false], [270, false, false],
  [0, true, false], [0, false, true], [0, true, true]
]

function round(value, digits = 4) {
  return Number(value.toFixed(digits))
}

function parseAnalyzeSizes(argv) {
  const sizeArg = argv.find(value => value === '--sizes' || value.startsWith('--sizes='))
  if (!sizeArg) return DEFAULT_SIZES
  const raw = sizeArg === '--sizes' ? argv[argv.indexOf(sizeArg) + 1] : sizeArg.slice('--sizes='.length)
  const sizes = String(raw || '').split(',').map(value => Number(value.trim()))
    .filter(value => Number.isFinite(value) && value > 0 && value <= 512)
  const unique = [...new Set(sizes)].sort((a, b) => a - b)
  if (!unique.length) throw new Error('`--sizes` must contain positive numbers no greater than 512, e.g. --sizes 16,17.5,24,37.5')
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

function isCanonicalViewBox(viewBox) {
  return Boolean(viewBox) && viewBox.x === 0 && viewBox.y === 0 && viewBox.width === DESIGN_CANVAS && viewBox.height === DESIGN_CANVAS
}

function readRegistry() {
  const source = fs.readFileSync(REGISTRY_FILE, 'utf8')
  const match = source.match(/Object\.freeze\(([\s\S]*)\)\s*$/)
  if (!match) throw new Error('generated registry is invalid; run npm run icons:build')
  return JSON.parse(match[1])
}

function sourceForIcon(name, definition) {
  if (definition.kind === 'color') {
    return fs.readFileSync(path.join(ROOT, 'static/paw-icons/color', `${name}.svg`), 'utf8')
  }
  return decodeURIComponent(definition.template).replace(/__PAW_ICON_COLOR__/g, '#666666')
}

function strokeWidths(source) {
  return [...new Set([...source.matchAll(/\bstroke-width\s*=\s*["']([^"']+)["']/gi)]
    .map(match => Number(match[1]))
    .filter(Number.isFinite))].sort((a, b) => a - b)
}

function opticalConfig(name) {
  const configured = (manifest.optical && manifest.optical[name]) || {}
  return {
    coordinateSpace: '24-unit-design',
    scale: configured.scale === undefined ? 1 : Number(configured.scale),
    offsetX: configured.offsetX === undefined ? 0 : Number(configured.offsetX),
    offsetY: configured.offsetY === undefined ? 0 : Number(configured.offsetY)
  }
}

function layoutForSize(size) {
  return { width: size, height: size, ratioWidth: 1, ratioHeight: 1 }
}

function measureSvg(source, targetSize) {
  const sharp = require('sharp')
  // Raster pixels are integer by definition; the CSS size remains the exact
  // decimal supplied by the caller and is only used as the conversion scale.
  const canvasSize = Math.max(128, Math.ceil(targetSize * RASTER_SCALE))
  return sharp(Buffer.from(source))
    .resize(canvasSize, canvasSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
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
      if (maxX < 0) {
        return {
          painted: false,
          width: 0,
          height: 0,
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          centerX: 0.5,
          centerY: 0.5,
          occupancy: 0,
          touchesCanvasEdge: false,
          rasterSize: canvasSize
        }
      }
      const left = minX * targetSize / canvasSize
      const top = minY * targetSize / canvasSize
      const right = (maxX + 1) * targetSize / canvasSize
      const bottom = (maxY + 1) * targetSize / canvasSize
      return {
        painted: true,
        width: round(right - left, 4),
        height: round(bottom - top, 4),
        left: round(left, 4),
        top: round(top, 4),
        right: round(right, 4),
        bottom: round(bottom, 4),
        centerX: round((left + right) / 2 / targetSize, 5),
        centerY: round((top + bottom) / 2 / targetSize, 5),
        occupancy: round(paintedPixels / (canvasSize * canvasSize), 6),
        touchesCanvasEdge: minX === 0 || minY === 0 || maxX === canvasSize - 1 || maxY === canvasSize - 1,
        rasterSize: canvasSize
      }
    })
}

function measureTransformedSvg(source, targetSize, rotate, flipX, flipY) {
  const sharp = require('sharp')
  const root = source.match(/^(\s*<svg\b[^>]*>)([\s\S]*?)(<\/svg>\s*)$/i)
  if (!root) return Promise.resolve(null)
  const flipScale = `scale(${flipX ? -1 : 1} ${flipY ? -1 : 1})`
  const transform = `translate(${DESIGN_CENTER} ${DESIGN_CENTER}) rotate(${rotate}) ${flipScale} translate(${-DESIGN_CENTER} ${-DESIGN_CENTER})`
  const opening = root[1].replace(/(\bviewBox\s*=\s*["'])[^"']+(["'])/i, '$1-12 -12 48 48$2')
  const transformed = `${opening}<g transform="${transform}">${root[2]}</g>${root[3]}`
  // Use an expanded 48-unit inspection canvas. Rendering directly into the
  // 24-unit canvas would hide the very overflow this audit must detect.
  const canvasSize = Math.max(256, Math.ceil(targetSize * RASTER_SCALE * 2))
  return sharp(Buffer.from(transformed))
    .resize(canvasSize, canvasSize, { fit: 'fill', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      let minX = canvasSize
      let minY = canvasSize
      let maxX = -1
      let maxY = -1
      for (let y = 0; y < info.height; y += 1) {
        for (let x = 0; x < info.width; x += 1) {
          const alpha = data[(y * info.width + x) * info.channels + info.channels - 1]
          if (alpha <= ALPHA_THRESHOLD) continue
          minX = Math.min(minX, x)
          minY = Math.min(minY, y)
          maxX = Math.max(maxX, x)
          maxY = Math.max(maxY, y)
        }
      }
      if (maxX < 0) return { painted: false, bounds: null, clipped: false, rasterSize: canvasSize }
      const left = minX * 48 / canvasSize - 12
      const top = minY * 48 / canvasSize - 12
      const right = (maxX + 1) * 48 / canvasSize - 12
      const bottom = (maxY + 1) * 48 / canvasSize - 12
      return {
        painted: true,
        bounds: { minX: round(left, 4), maxX: round(right, 4), minY: round(top, 4), maxY: round(bottom, 4) },
        clipped: left < -0.01 || top < -0.01 || right > DESIGN_CANVAS + 0.01 || bottom > DESIGN_CANVAS + 0.01,
        rasterSize: canvasSize
      }
    })
}

function normalizedBounds(measured, size) {
  if (!measured.painted) {
    return {
      widthRatio: 0,
      heightRatio: 0,
      paintedWidthRatio: 0,
      paintedHeightRatio: 0,
      leftRatio: 0,
      topRatio: 0,
      rightRatio: 0,
      bottomRatio: 0,
      centerXRatio: 0.5,
      centerYRatio: 0.5,
      paintedCenterXRatio: 0.5,
      paintedCenterYRatio: 0.5,
      centerOffsetXRatio: 0,
      centerOffsetYRatio: 0
    }
  }
  const widthRatio = round(measured.width / size, 6)
  const heightRatio = round(measured.height / size, 6)
  return {
    widthRatio,
    heightRatio,
    paintedWidthRatio: widthRatio,
    paintedHeightRatio: heightRatio,
    leftRatio: round(measured.left / size, 6),
    topRatio: round(measured.top / size, 6),
    rightRatio: round(measured.right / size, 6),
    bottomRatio: round(measured.bottom / size, 6),
    centerXRatio: round(measured.centerX, 6),
    centerYRatio: round(measured.centerY, 6),
    paintedCenterXRatio: round(measured.centerX, 6),
    paintedCenterYRatio: round(measured.centerY, 6),
    centerOffsetXRatio: round(measured.centerX - 0.5, 6),
    centerOffsetYRatio: round(measured.centerY - 0.5, 6)
  }
}

function relativeDeviation(actual, expected) {
  if (expected === 0) return actual === 0 ? 0 : 1
  return Math.abs(actual - expected) / Math.abs(expected)
}

function percentage(value) {
  return round(value * 100, 3)
}

function severityFor(value, warningThreshold, errorThreshold) {
  if (value > errorThreshold) return 'error'
  if (value > warningThreshold) return 'warning'
  return null
}

function addFinding(result, type, severity, message) {
  if (!severity) return
  result.anomalies.push({ type, severity, message })
}

function assessSize(measured, size) {
  const layout = layoutForSize(size)
  const normalized = normalizedBounds(measured, size)
  return {
    size,
    layout,
    measured,
    normalizedBounds: normalized,
    overflow: {
      left: round(Math.max(0, -measured.left), 4),
      top: round(Math.max(0, -measured.top), 4),
      right: round(Math.max(0, measured.right - size), 4),
      bottom: round(Math.max(0, measured.bottom - size), 4)
    },
    anomalies: [],
    checks: {
      rendered: measured.painted,
      withinLayout: true,
      centered: true,
      normalizedStable: true,
      centerStable: true,
      strokeStable: true,
      noPaddingExpansion: true,
      noAbruptChange: true
    },
    status: 'pass'
  }
}

function transformBounds(bounds, rotate, flipX, flipY) {
  const points = [
    [bounds.leftRatio * DESIGN_CANVAS, bounds.topRatio * DESIGN_CANVAS],
    [bounds.rightRatio * DESIGN_CANVAS, bounds.topRatio * DESIGN_CANVAS],
    [bounds.leftRatio * DESIGN_CANVAS, bounds.bottomRatio * DESIGN_CANVAS],
    [bounds.rightRatio * DESIGN_CANVAS, bounds.bottomRatio * DESIGN_CANVAS]
  ].map(([x, y]) => {
    const px = flipX ? DESIGN_CANVAS - x : x
    const py = flipY ? DESIGN_CANVAS - y : y
    const radians = rotate * Math.PI / 180
    const dx = px - DESIGN_CENTER
    const dy = py - DESIGN_CENTER
    return [
      DESIGN_CENTER + dx * Math.cos(radians) - dy * Math.sin(radians),
      DESIGN_CENTER + dx * Math.sin(radians) + dy * Math.cos(radians)
    ]
  })
  return {
    minX: round(Math.min(...points.map(point => point[0])), 4),
    maxX: round(Math.max(...points.map(point => point[0])), 4),
    minY: round(Math.min(...points.map(point => point[1])), 4),
    maxY: round(Math.max(...points.map(point => point[1])), 4)
  }
}

function sourceFlags(source, definition) {
  const opening = (source.match(/<svg\b[^>]*>/i) || [''])[0]
  const rootExportAttributes = ['width', 'height', 'preserveAspectRatio', 'overflow', 'style']
    .filter(attribute => new RegExp(`(?:^|\\s)${attribute}\\s*=`, 'i').test(opening))
  const widths = strokeWidths(source)
  return {
    canonicalViewBox: isCanonicalViewBox(readViewBox(source)),
    rootExportAttributes,
    hasNonScalingStroke: /vector-effect\s*=\s*["']non-scaling-stroke/i.test(source),
    strokeWidths: widths,
    strokeWidthRatios: widths.map(width => round(width / DESIGN_CANVAS, 6)),
    colorAssetException: definition.kind === 'color'
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
    const entry = {
      name,
      kind: definition.kind,
      sourceViewBox,
      bakedViewBox: sourceViewBox,
      layoutSizeAt24: layoutForSize(TARGET_SIZE),
      optical: opticalConfig(name),
      source: sourceFlags(source, definition),
      strokeWidth: strokeWidths(source),
      sizes: {},
      anomalies: [],
      warnings: [],
      status: 'pass'
    }

    for (const size of ANALYZE_SIZES) {
      let measured
      if (sharpAvailable) {
        try {
          measured = await measureSvg(source, size)
        } catch (error) {
          measured = {
            painted: false,
            width: 0,
            height: 0,
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            centerX: 0.5,
            centerY: 0.5,
            occupancy: 0,
            touchesCanvasEdge: false,
            rasterSize: null,
            source: 'rasterization-error'
          }
          entry.warnings.push(`${size}px: rasterization failed: ${error.message}`)
        }
      } else {
        measured = {
          painted: false,
          width: 0,
          height: 0,
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          centerX: 0.5,
          centerY: 0.5,
          occupancy: null,
          touchesCanvasEdge: false,
          rasterSize: null,
          source: 'sharp-not-installed'
        }
        entry.warnings.push(`${size}px: sharp is not installed; painted bounds unavailable`)
      }
      entry.sizes[String(size)] = assessSize(measured, size)
    }

    const scaleReferenceSize = ANALYZE_SIZES.includes(TARGET_SIZE) ? TARGET_SIZE : ANALYZE_SIZES[0]
    const scaleReference = entry.sizes[String(scaleReferenceSize)]
    for (const size of ANALYZE_SIZES) {
      const result = entry.sizes[String(size)]
      const referenceBounds = scaleReference.normalizedBounds
      const normalized = result.normalizedBounds
      const boundsDeviation = Math.max(
        relativeDeviation(normalized.widthRatio, referenceBounds.widthRatio),
        relativeDeviation(normalized.heightRatio, referenceBounds.heightRatio)
      )
      const centerDeviation = Math.max(
        Math.abs(normalized.centerXRatio - referenceBounds.centerXRatio),
        Math.abs(normalized.centerYRatio - referenceBounds.centerYRatio)
      )
      const paddingDeviation = Math.max(
        Math.abs(normalized.leftRatio - referenceBounds.leftRatio),
        Math.abs(normalized.topRatio - referenceBounds.topRatio),
        Math.abs(normalized.rightRatio - referenceBounds.rightRatio),
        Math.abs(normalized.bottomRatio - referenceBounds.bottomRatio)
      )
      const centeredDeviation = Math.max(
        Math.abs(normalized.centerOffsetXRatio),
        Math.abs(normalized.centerOffsetYRatio)
      )
      result.scaleReferenceSize = scaleReferenceSize
      result.audit = {
        normalizedBoundsDeviation: percentage(boundsDeviation),
        normalizedCenterDeviation: percentage(centerDeviation),
        normalizedPaddingDeviation: percentage(paddingDeviation),
        centerOffset: {
          x: round(normalized.centerOffsetXRatio * size, 4),
          y: round(normalized.centerOffsetYRatio * size, 4)
        },
        centerOffsetRatio: {
          x: normalized.centerOffsetXRatio,
          y: normalized.centerOffsetYRatio
        }
      }
      result.checks.withinLayout = Object.values(result.overflow).every(value => value <= 0.01)
      result.checks.centered = centeredDeviation <= CENTER_WARNING_THRESHOLD
      result.checks.normalizedStable = boundsDeviation <= RATIO_WARNING_THRESHOLD
      result.checks.centerStable = centerDeviation <= CENTER_WARNING_THRESHOLD
      result.checks.noPaddingExpansion = paddingDeviation <= PADDING_WARNING_THRESHOLD
      result.checks.strokeStable = !entry.source.hasNonScalingStroke
      if (!result.measured.painted) addFinding(result, 'unrendered', 'error', 'artwork produced no detectable alpha pixels')
      if (!result.checks.withinLayout) addFinding(result, 'clipping', 'error', 'painted bounds exceed the square PawIcon layout box')
      if (result.measured.touchesCanvasEdge) addFinding(result, 'edge-contact', 'warning', 'painted alpha touches the 24-unit canvas edge; verify live-area clipping')
      addFinding(result, 'normalized-bounds-deviation', severityFor(boundsDeviation, RATIO_WARNING_THRESHOLD, RATIO_ERROR_THRESHOLD), `normalized bounds deviate ${percentage(boundsDeviation)}% from ${scaleReferenceSize}px`)
      addFinding(result, 'center-drift', severityFor(centerDeviation, CENTER_WARNING_THRESHOLD, CENTER_ERROR_THRESHOLD), `normalized center deviates ${percentage(centerDeviation)}% from ${scaleReferenceSize}px`)
      addFinding(result, 'center-offset', severityFor(centeredDeviation, CENTER_WARNING_THRESHOLD, CENTER_ERROR_THRESHOLD), `artwork center offset is ${percentage(centeredDeviation)}% from the square box center`)
      addFinding(result, 'svg-padding-expansion', severityFor(paddingDeviation, PADDING_WARNING_THRESHOLD, PADDING_ERROR_THRESHOLD), `normalized padding changes ${percentage(paddingDeviation)}% across sizes`)
      if (entry.source.hasNonScalingStroke) addFinding(result, 'stroke-anomaly', 'error', 'vector-effect="non-scaling-stroke" prevents proportional stroke scaling')
      const previous = ANALYZE_SIZES[ANALYZE_SIZES.indexOf(size) - 1]
      if (previous !== undefined) {
        const previousBounds = entry.sizes[String(previous)].normalizedBounds
        const abruptChange = Math.max(
          relativeDeviation(normalized.widthRatio, previousBounds.widthRatio),
          relativeDeviation(normalized.heightRatio, previousBounds.heightRatio)
        )
        result.audit.abruptChangeFromPrevious = percentage(abruptChange)
        result.checks.noAbruptChange = abruptChange <= RATIO_ERROR_THRESHOLD
        addFinding(result, 'abrupt-size-change', severityFor(abruptChange, RATIO_WARNING_THRESHOLD, RATIO_ERROR_THRESHOLD), `normalized bounds jump ${percentage(abruptChange)}% from ${previous}px`)
      }
      result.status = result.anomalies.some(anomaly => anomaly.severity === 'error')
        ? 'error'
        : result.anomalies.length ? 'warning' : 'pass'
    }

    const referenceResult = entry.sizes[String(scaleReferenceSize)]
    const transformSourceBounds = referenceResult.normalizedBounds
    const transformResults = await Promise.all(TRANSFORM_CASES.map(async ([rotate, flipX, flipY]) => {
      const measured = sharpAvailable && referenceResult.measured.painted
        ? await measureTransformedSvg(source, scaleReferenceSize, rotate, flipX, flipY)
        : null
      return {
        rotate,
        flipX,
        flipY,
        bounds: measured ? measured.bounds : (transformSourceBounds && referenceResult.measured.painted
          ? transformBounds(transformSourceBounds, rotate, flipX, flipY)
          : null),
        clipped: measured ? measured.clipped : null,
        rasterSize: measured ? measured.rasterSize : null
      }
    }))
    const transformUnsafe = transformResults.some(result => result.clipped || (result.bounds && (
      result.bounds.minX < -0.01 || result.bounds.maxX > DESIGN_CANVAS + 0.01 ||
      result.bounds.minY < -0.01 || result.bounds.maxY > DESIGN_CANVAS + 0.01
    )))
    entry.transformSafety = {
      pivot: 'PawIcon box center (12,12), never painted bounds center',
      cases: transformResults,
      safe: !transformUnsafe
    }
    if (transformUnsafe) {
      entry.anomalies.push({ type: 'transform-clipping', severity: 'error', message: 'rotate 45°/135° or another transform leaves the canonical 24-unit canvas; fix source live area instead of expanding layout' })
    }
    if (entry.source.hasNonScalingStroke) {
      entry.anomalies.push({ type: 'stroke-anomaly', severity: 'error', message: 'source uses vector-effect="non-scaling-stroke"' })
    }
    if (definition.kind === 'color') {
      entry.anomalies.push({ type: 'color-asset-exception', severity: 'info', message: 'fixed-color asset; it still uses the same square 24-unit layout and transform contract' })
    }
    entry.anomalies.push(...ANALYZE_SIZES.flatMap(size => entry.sizes[String(size)].anomalies.map(anomaly => ({ ...anomaly, size }))))
    entry.warnings.push(...entry.anomalies
      .filter(anomaly => anomaly.severity !== 'info')
      .map(anomaly => `${anomaly.size ? `${anomaly.size}px: ` : ''}${anomaly.message}`))
    entry.status = entry.anomalies.some(anomaly => anomaly.severity === 'error')
      ? 'error'
      : entry.anomalies.some(anomaly => anomaly.severity === 'warning')
        ? 'warning'
        : 'pass'
    entry.measured = referenceResult.measured
    icons.push(entry)
  }

  const bySize = Object.fromEntries(ANALYZE_SIZES.map(size => {
    const results = icons.map(icon => icon.sizes[String(size)])
    return [String(size), {
      total: results.length,
      pass: results.filter(result => result.status === 'pass').length,
      warning: results.filter(result => result.status === 'warning').length,
      error: results.filter(result => result.status === 'error').length,
      overflow: results.filter(result => !result.checks.withinLayout).length,
      clipped: results.filter(result => result.anomalies.some(anomaly => anomaly.type === 'clipping')).length,
      edgeContact: results.filter(result => result.anomalies.some(anomaly => anomaly.type === 'edge-contact')).length,
      uncentered: results.filter(result => !result.checks.centered).length,
      scaleInconsistent: results.filter(result => !result.checks.normalizedStable).length,
      centerDrift: results.filter(result => !result.checks.centerStable).length,
      paddingExpansion: results.filter(result => !result.checks.noPaddingExpansion).length,
      strokeAnomaly: results.filter(result => !result.checks.strokeStable).length,
      abruptChange: results.filter(result => !result.checks.noAbruptChange).length,
      unrendered: results.filter(result => !result.checks.rendered).length
    }]
  }))
  const anomalyIcons = icons.filter(icon => icon.anomalies.some(anomaly => anomaly.severity !== 'info'))
    .map(icon => ({ name: icon.name, status: icon.status, anomalies: icon.anomalies }))

  const report = {
    version: 3,
    generatedAt: new Date().toISOString(),
    analysisMode: sharpAvailable ? 'sharp-raster-per-size' : 'metadata-only',
    canvas: {
      designUnits: DESIGN_CANVAS,
      rasterScale: RASTER_SCALE,
      alphaThreshold: ALPHA_THRESHOLD,
      perSize: Object.fromEntries(ANALYZE_SIZES.map(size => [String(size), { width: Math.max(1, Math.ceil(size * RASTER_SCALE)), height: Math.max(1, Math.ceil(size * RASTER_SCALE)) }]))
    },
    target: {
      referenceSize: TARGET_SIZE,
      sizes: ANALYZE_SIZES,
      comparisonSizes: COMPARISON_SIZES,
      designCanvas: '24 × 24',
      runtimeLayout: 'size × size CSS px; no rotation expansion',
      thresholds: {
        normalizedBoundsWarning: '2%',
        normalizedBoundsError: '3%',
        centerDeviationWarning: '1.5%',
        centerDeviationError: '3%',
        paddingExpansionWarning: '2%',
        paddingExpansionError: '3%'
      }
    },
    transformContract: {
      pivot: '12,12 design units / 50% 50% PawIcon box center',
      cases: TRANSFORM_CASES.map(([rotate, flipX, flipY]) => ({ rotate, flipX, flipY }))
    },
    summary: {
      total: icons.length,
      pass: icons.filter(icon => icon.status === 'pass').length,
      warning: icons.filter(icon => icon.status === 'warning').length,
      error: icons.filter(icon => icon.status === 'error').length,
      bySize,
      anomalyIcons: anomalyIcons.length
    },
    anomalies: anomalyIcons,
    icons
  }
  const metrics = Object.fromEntries(icons.map(icon => [icon.name, {
    kind: icon.kind,
    sizes: Object.fromEntries(ANALYZE_SIZES.map(size => {
      const result = icon.sizes[String(size)]
      return [String(size), result.normalizedBounds]
    }))
  }]))
  fs.mkdirSync(REPORT_DIR, { recursive: true })
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`)
  fs.writeFileSync(METRICS_FILE, `// AUTO-GENERATED FILE. Run \`npm run icons:analyze\` after changing an icon source.\nexport const PAW_ICON_AUDIT_METRICS = Object.freeze(${JSON.stringify(metrics, null, 2)})\n`)
  console.log(`[PawIcon] analyzed ${icons.length} icons (${report.analysisMode}); pass=${report.summary.pass}, warning=${report.summary.warning}, error=${report.summary.error}`)
  console.log(`[PawIcon] ratio audit: ${ANALYZE_SIZES.map(size => `${size}px ${bySize[String(size)].pass} pass / ${bySize[String(size)].warning} warning / ${bySize[String(size)].error} error`).join(', ')}`)
  console.log(`[PawIcon] geometry: ${ANALYZE_SIZES.map(size => {
    const result = bySize[String(size)]
    return `${size}px clipping=${result.clipped}, edgeContact=${result.edgeContact}, center=${result.uncentered}, scale=${result.scaleInconsistent}, padding=${result.paddingExpansion}, stroke=${result.strokeAnomaly}`
  }).join(', ')}`)
  console.log(`[PawIcon] transform unsafe: ${icons.filter(icon => !icon.transformSafety.safe).length}; anomaly list: ${path.relative(ROOT, REPORT_FILE)}`)
}

analyze().catch(error => {
  console.error(`[PawIcon] analyze failed: ${error.stack || error.message}`)
  process.exitCode = 1
})
