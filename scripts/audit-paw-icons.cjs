const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const manifest = require('../config/paw-icons.cjs')

const ROOT = path.resolve(__dirname, '..')
const REGISTRY_FILE = path.join(ROOT, 'components/PawIcon/generated/icon-registry.js')
const REPORT_DIR = path.join(ROOT, '.artifacts/paw-icon-audit')
const REPORT_FILE = path.join(REPORT_DIR, 'icon-design-audit.json')
const MARKDOWN_FILE = path.join(REPORT_DIR, 'icon-design-audit.md')
const DESIGN_CANVAS = 24
const RASTER_SCALE = 8
const ALPHA_THRESHOLD = 8
const SIZES = [16, 17.5, 19, 20, 21, 23, 24, 25.5, 28, 31, 32, 37.5]
const SCALE_TOLERANCE_PX = 0.75
const CENTER_DRIFT_TOLERANCE_PX = 0.75
const NORMALIZED_BOUNDS_TOLERANCE = 0.02
const NORMALIZED_CENTER_TOLERANCE = 0.015
const CENTER_ADJUSTMENT_THRESHOLD = 0.5
const CLASSIFICATIONS = [
  'PASS',
  'SOURCE_FIX',
  'OPTICAL_ADJUSTMENT',
  'STROKE_FIX',
  'SMALL_SIZE_VARIANT_REQUIRED',
  'COLOR_ASSET_EXCEPTION'
]
const SCOPE_EXCLUSIONS = [
  {
    name: 'actions/comment-expand',
    sourcePath: 'static/figma/dynamic-detail/comment-expand.svg',
    reason: 'This source is a horizontal divider (23 × 0.3), not a square system icon; it is rendered by PawDivider so its layout height remains 0.3px.'
  }
]
const SOURCE_REMEDIATIONS = [
  { icon: 'actions/agreement-check', classification: 'OPTICAL_ADJUSTMENT', detail: 'translated the source artwork upward by 0.875 design units so its optical center is stable across sizes' },
  { icon: 'actions/composer-voice', classification: 'OPTICAL_ADJUSTMENT', detail: 'translated the source artwork left 0.688 and down 1.937 design units as one canonical source adjustment' },
  { icon: 'badges/crown-left', classification: 'OPTICAL_ADJUSTMENT', detail: 'translated the source artwork down 0.625 design units' },
  { icon: 'badges/crown-center', classification: 'OPTICAL_ADJUSTMENT', detail: 'translated the source artwork down 0.937 design units' },
  { icon: 'badges/crown-right', classification: 'OPTICAL_ADJUSTMENT', detail: 'translated the source artwork down 0.625 design units' },
  { icon: 'common/message-activity', classification: 'OPTICAL_ADJUSTMENT', detail: 'translated the source artwork down 0.875 design units' },
  { icon: 'actions/share', classification: 'SOURCE_FIX', detail: 'restored the missing clipPath rectangle so the SVG cannot erase its own artwork' },
  { icon: 'navigation/chevron-right', classification: 'SOURCE_FIX', detail: 'replaced the divergent local chevron export with the exact mapped Figma vector (node 62:42089), then normalized it to the 24-unit canvas' }
]
const ACCENT_COLOR_ASSETS = new Set(['actions/like-filled', 'actions/delete'])

function fail(message) {
  throw new Error(`[PawIcon audit] ${message}`)
}

function readViewBox(source, file) {
  const match = source.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)
  const values = match ? match[1].trim().split(/[\s,]+/).map(Number) : []
  if (values.length !== 4 || values.some(value => !Number.isFinite(value)) || values[2] <= 0 || values[3] <= 0) {
    fail(`invalid viewBox in ${file}`)
  }
  return { x: values[0], y: values[1], width: values[2], height: values[3] }
}

function readRegistry() {
  const source = fs.readFileSync(REGISTRY_FILE, 'utf8')
  const match = source.match(/Object\.freeze\(([\s\S]*)\)\s*$/)
  if (!match) fail('generated registry is invalid; run npm run icons:build')
  return JSON.parse(match[1])
}

function sourceForIcon(name, definition) {
  if (definition.kind === 'color') {
    return fs.readFileSync(path.join(ROOT, 'static/paw-icons/color', `${name}.svg`), 'utf8')
  }
  return decodeURIComponent(definition.template).replace(/__PAW_ICON_COLOR__/g, '#666666')
}

function rootOpening(source) {
  return (source.match(/<svg\b[^>]*>/i) || [''])[0]
}

function rootAttribute(source, attribute) {
  const escaped = attribute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = rootOpening(source).match(new RegExp(`(?:^|\\s)${escaped}\\s*=\\s*["']([^"']+)["']`, 'i'))
  return match ? match[1] : null
}

function prepareForRaster(source, viewBox) {
  const width = Math.max(1, Math.round(viewBox.width * RASTER_SCALE))
  const height = Math.max(1, Math.round(viewBox.height * RASTER_SCALE))
  return source.replace(/<svg\b[^>]*>/i, opening => {
    const cleaned = opening.replace(/\s(width|height)\s*=\s*["'][^"']*["']/gi, '')
    return cleaned.replace(/>$/, ` width="${width}" height="${height}">`)
  })
}

async function measureSvg(source, viewBox) {
  const width = Math.max(1, Math.round(viewBox.width * RASTER_SCALE))
  const height = Math.max(1, Math.round(viewBox.height * RASTER_SCALE))
  const rendered = await sharp(Buffer.from(prepareForRaster(source, viewBox)))
    .resize(width, height, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { data, info } = rendered
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  let paintedPixels = 0
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + info.channels - 1]
      if (alpha <= ALPHA_THRESHOLD) continue
      paintedPixels += 1
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }
  if (maxX < 0) return { painted: false, width: 0, height: 0, x: 0, y: 0, cx: 0, cy: 0, occupancy: 0 }
  const x = minX / RASTER_SCALE + viewBox.x
  const y = minY / RASTER_SCALE + viewBox.y
  const paintedWidth = (maxX - minX + 1) / RASTER_SCALE
  const paintedHeight = (maxY - minY + 1) / RASTER_SCALE
  return {
    painted: true,
    x: Number(x.toFixed(3)),
    y: Number(y.toFixed(3)),
    width: Number(paintedWidth.toFixed(3)),
    height: Number(paintedHeight.toFixed(3)),
    cx: Number((x + paintedWidth / 2).toFixed(3)),
    cy: Number((y + paintedHeight / 2).toFixed(3)),
    occupancy: Number((paintedPixels / (width * height)).toFixed(4))
  }
}

function measureAtRuntimeSize(source, size) {
  const canvas = Math.max(128, Math.ceil(size * RASTER_SCALE))
  return sharp(Buffer.from(source))
    .resize(canvas, canvas, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      let minX = canvas
      let minY = canvas
      let maxX = -1
      let maxY = -1
      for (let y = 0; y < canvas; y += 1) {
        for (let x = 0; x < canvas; x += 1) {
          const alpha = data[(y * canvas + x) * info.channels + info.channels - 1]
          if (alpha <= ALPHA_THRESHOLD) continue
          minX = Math.min(minX, x)
          minY = Math.min(minY, y)
          maxX = Math.max(maxX, x)
          maxY = Math.max(maxY, y)
        }
      }
      if (maxX < 0) return { painted: false, width: 0, height: 0, cx: size / 2, cy: size / 2 }
      const width = (maxX - minX + 1) * size / canvas
      const height = (maxY - minY + 1) * size / canvas
      return {
        painted: true,
        width: Number(width.toFixed(3)),
        height: Number(height.toFixed(3)),
        cx: Number((((minX + maxX + 1) / 2) * size / canvas).toFixed(3)),
        cy: Number((((minY + maxY + 1) / 2) * size / canvas).toFixed(3))
      }
    })
}

function strokeWidths(source) {
  return [...new Set([...source.matchAll(/\bstroke-width\s*=\s*["']([^"']+)["']/gi)]
    .map(match => Number(match[1]))
    .filter(Number.isFinite))].sort((a, b) => a - b)
}

function strokeAudit(name, definition, source) {
  const widths = strokeWidths(source)
  const linecaps = [...new Set([...source.matchAll(/\bstroke-linecap\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]))]
  const linejoins = [...new Set([...source.matchAll(/\bstroke-linejoin\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]))]
  let family = null
  let expected = null
  if (definition.kind === 'mono' && name === 'navigation/back') {
    family = 'mono-outline'
    expected = { widths: [2], linecaps: ['round'], linejoins: ['round'] }
  } else if (/^actions\/(?:yard-feed|yard-audit|order-(?:all|pay|ship|receive|review))$/.test(name)) {
    family = 'actions-line-outline'
    expected = { widths: [1.4], linecaps: ['round'], linejoins: ['round'] }
  } else if (widths.length) {
    family = 'independent-filled-or-asset-stroke'
  }
  const same = (actual, target) => JSON.stringify(actual) === JSON.stringify(target)
  const mismatch = Boolean(expected) && (!same(widths, expected.widths) || !same(linecaps, expected.linecaps) || !same(linejoins, expected.linejoins))
  return {
    family,
    widths,
    linecaps,
    linejoins,
    mismatch,
    mismatchDetail: mismatch ? `expected ${JSON.stringify(expected)}, received ${JSON.stringify({ widths, linecaps, linejoins })}` : ''
  }
}

function paintColors(source) {
  const values = [...source.matchAll(/\b(?:fill|stroke)\s*=\s*["']([^"']+)["']/gi)]
    .map(match => match[1].trim())
    .filter(value => value && value !== 'none' && value !== 'currentColor' && !value.startsWith('url('))
  return [...new Set(values)]
}

function sourceFlags(source, viewBox) {
  const opening = rootOpening(source)
  const rootExportAttributes = ['width', 'height', 'preserveAspectRatio', 'overflow', 'style']
    .filter(attribute => rootAttribute(source, attribute) !== null)
  const emptyClipOrMask = /<(clipPath|mask)\b[^>]*>\s*<\/\1>/i.test(source)
  const hasFilter = /<filter\b/i.test(source)
  const hasGradient = /<(?:linear|radial)Gradient\b/i.test(source)
  const hasTransform = /\btransform\s*=\s*["']/i.test(source)
  return {
    canonicalViewBox: viewBox.x === 0 && viewBox.y === 0 && viewBox.width === DESIGN_CANVAS && viewBox.height === DESIGN_CANVAS,
    rootExportAttributes,
    emptyClipOrMask,
    hasFilter,
    hasGradient,
    hasTransform,
    sourceNeedsNormalization: !(viewBox.x === 0 && viewBox.y === 0 && viewBox.width === DESIGN_CANVAS && viewBox.height === DESIGN_CANVAS) || rootExportAttributes.length > 0 || emptyClipOrMask,
    rootOpeningLength: opening.length
  }
}

function paddingFor(bounds, viewBox) {
  if (!bounds.painted) return null
  return {
    left: Number((bounds.x - viewBox.x).toFixed(3)),
    right: Number((viewBox.x + viewBox.width - bounds.x - bounds.width).toFixed(3)),
    top: Number((bounds.y - viewBox.y).toFixed(3)),
    bottom: Number((viewBox.y + viewBox.height - bounds.y - bounds.height).toFixed(3))
  }
}

function opticalOffset(bounds, viewBox) {
  if (!bounds.painted) return { x: null, y: null }
  const edge = Math.max(viewBox.width, viewBox.height)
  return {
    x: Number(((bounds.cx - (viewBox.x + viewBox.width / 2)) * DESIGN_CANVAS / edge).toFixed(3)),
    y: Number(((bounds.cy - (viewBox.y + viewBox.height / 2)) * DESIGN_CANVAS / edge).toFixed(3))
  }
}

function transformedBounds(bounds, rotate, flipX, flipY) {
  const points = [
    [bounds.x, bounds.y],
    [bounds.x + bounds.width, bounds.y],
    [bounds.x, bounds.y + bounds.height],
    [bounds.x + bounds.width, bounds.y + bounds.height]
  ].map(([x, y]) => {
    let px = flipX ? DESIGN_CANVAS - x : x
    let py = flipY ? DESIGN_CANVAS - y : y
    const radians = rotate * Math.PI / 180
    const dx = px - DESIGN_CANVAS / 2
    const dy = py - DESIGN_CANVAS / 2
    return [
      DESIGN_CANVAS / 2 + dx * Math.cos(radians) - dy * Math.sin(radians),
      DESIGN_CANVAS / 2 + dx * Math.sin(radians) + dy * Math.cos(radians)
    ]
  })
  return {
    minX: Math.min(...points.map(point => point[0])),
    maxX: Math.max(...points.map(point => point[0])),
    minY: Math.min(...points.map(point => point[1])),
    maxY: Math.max(...points.map(point => point[1]))
  }
}

function classify({ source, generated, rawBounds, canonicalBounds, runtime, transformSafety, definition }) {
  const findings = []
  if (source.sourceNeedsNormalization) {
    findings.push({ code: 'SOURCE_CANVAS', detail: 'raw export is not a clean 24 × 24 source canvas' })
  }
  if (source.emptyClipOrMask) {
    findings.push({ code: 'EMPTY_CLIP_OR_MASK', detail: 'empty clipPath/mask can erase the artwork' })
  }
  if (!generated.painted || !canonicalBounds.painted) {
    findings.push({ code: 'NO_RENDERED_ARTWORK', detail: 'generated source has no rasterized artwork' })
  }
  const offset = opticalOffset(canonicalBounds, { x: 0, y: 0, width: DESIGN_CANVAS, height: DESIGN_CANVAS })
  if (offset.x !== null && (Math.abs(offset.x) > CENTER_ADJUSTMENT_THRESHOLD || Math.abs(offset.y) > CENTER_ADJUSTMENT_THRESHOLD)) {
    findings.push({ code: 'OPTICAL_CENTER', detail: `canonical artwork center offset ${offset.x} × ${offset.y}px at 24px` })
  }
  if (runtime.some(result => !result.painted || !result.scalesWithSize || !result.centerStable)) {
    findings.push({ code: 'CONTINUOUS_SCALE', detail: 'painted bounds or optical center drift beyond regression tolerance' })
  }
  if (!transformSafety.safe) {
    findings.push({ code: 'TRANSFORM_BOUNDS', detail: 'rotate/flip bounds leave the canonical canvas' })
  }
  if (source.hasStrokeMismatch) {
    findings.push({ code: 'STROKE_SYSTEM', detail: source.strokeMismatchDetail })
  }
  if (definition.kind === 'color' && (source.paintColors.length > 1 || source.hasGradient || source.colorCategory)) {
    findings.push({ code: 'COLOR_ASSET', detail: 'fixed-color or multi-layer artwork is intentionally not currentColor mono' })
  }

  let classification = 'PASS'
  if (findings.some(finding => ['EMPTY_CLIP_OR_MASK', 'NO_RENDERED_ARTWORK', 'SOURCE_CANVAS', 'TRANSFORM_BOUNDS'].includes(finding.code))) {
    classification = 'SOURCE_FIX'
  } else if (findings.some(finding => finding.code === 'STROKE_SYSTEM')) {
    classification = 'STROKE_FIX'
  } else if (findings.some(finding => finding.code === 'OPTICAL_CENTER')) {
    classification = 'OPTICAL_ADJUSTMENT'
  } else if (findings.some(finding => finding.code === 'CONTINUOUS_SCALE')) {
    classification = 'SMALL_SIZE_VARIANT_REQUIRED'
  } else if (findings.some(finding => finding.code === 'COLOR_ASSET')) {
    classification = 'COLOR_ASSET_EXCEPTION'
  }
  return { classification, findings }
}

function markdownReport(report) {
  const lines = [
    '# PawIcon Icon Design Audit',
    '',
    `- Generated: ${report.generatedAt}`,
    `- Icons: ${report.summary.total}`,
    `- Sizes: ${report.target.sizes.join(', ')}px`,
    '- Coordinate system: 24 × 24 canonical SVG canvas',
    '',
    '## Summary',
    '',
    ...CLASSIFICATIONS.map(classification => `- ${classification}: ${report.summary.byClassification[classification] || 0}`),
    '',
    '## Stroke systems',
    '',
    ...Object.entries(report.strokeFamilies).map(([name, family]) => `- \`${name}\`: ${family.members.length} members; stroke-width ${family.widths.join(', ') || '—'}; linecap ${family.linecaps.join(', ') || '—'}; linejoin ${family.linejoins.join(', ') || '—'}; ${family.mismatch ? 'STROKE_FIX' : 'consistent'}`),
    '',
    '## Source remediations',
    '',
    ...report.remediations.map(item => `- \`${item.icon}\` — ${item.classification}: ${item.detail}.`),
    '',
    '## Scope exclusions',
    '',
    ...report.scope.exclusions.map(item => `- \`${item.name}\` — ${item.reason} Source: \`${item.sourcePath}\`.`),
    '',
    '## Per-icon result',
    '',
    '| Icon | Classification | Source viewBox | Artwork bounds | Raw padding L/R/T/B | Optical offset @24 | Findings |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...report.icons.map(icon => {
      const vb = icon.sourceViewBox
      const b = icon.rawArtworkBounds
      const padding = icon.rawArtworkPadding
      const offset = icon.canonicalArtwork && icon.canonicalArtwork.opticalOffset
      const finding = icon.findings.map(item => `${item.code}: ${item.detail}`).join('<br>') || '—'
      return `| \`${icon.name}\` | ${icon.classification} | ${vb.width}×${vb.height} | ${b && b.painted ? `${b.width}×${b.height} @ ${b.x},${b.y}` : 'none'} | ${padding ? `${padding.left}/${padding.right}/${padding.top}/${padding.bottom}` : '—'} | ${offset ? `${offset.x}×${offset.y}px` : '—'} | ${finding} |`
    }),
    '',
    '## Interpretation',
    '',
    '- `SOURCE_FIX` is used for raw Figma frame metadata, non-canonical viewBoxes, empty clipping definitions, or unrendered source. The generated runtime asset is normalized to 24 × 24; this is not a page-level scale or translate workaround.',
    '- `OPTICAL_ADJUSTMENT` means the canonical artwork center needs a single source-level correction that scales with the 24-unit canvas.',
    '- `STROKE_FIX` is reserved for a true family-level stroke mismatch, not for unrelated filled/color artwork.',
    '- `COLOR_ASSET_EXCEPTION` means the icon intentionally uses fixed or multiple colors; it still receives canonical coordinate normalization.',
    '- Continuous-scale result: all requested sizes must keep painted bounds proportional and centers stable; see the JSON `geometry` summary for the aggregate result.',
    '- Scope exclusion: `actions/comment-expand` is a divider asset, not an icon. It is intentionally outside PawIcon and is rendered by `PawDivider`.',
    '- The audit does not fail an icon merely because its optical keyline is not a universal 20 × 20 box; keyline decisions are form-dependent.'
  ]
  return `${lines.join('\n')}\n`
}

async function audit() {
  const registry = readRegistry()
  const names = Object.keys(registry).sort()
  const entries = []
  for (const name of names) {
    const definition = registry[name]
    const rawPath = (manifest.mono || {})[name] || (manifest.color || {})[name]
    const rawSource = fs.readFileSync(path.join(ROOT, rawPath), 'utf8')
    const generatedSource = sourceForIcon(name, definition)
    const sourceViewBox = readViewBox(rawSource, rawPath)
    const generatedViewBox = readViewBox(generatedSource, name)
    const rawBounds = await measureSvg(rawSource, sourceViewBox)
    const canonicalBounds = await measureSvg(generatedSource, generatedViewBox)
    const runtime = []
    const reference = await measureAtRuntimeSize(generatedSource, DESIGN_CANVAS)
    for (const size of SIZES) {
      const measured = await measureAtRuntimeSize(generatedSource, size)
      const expectedWidth = reference.width * size / DESIGN_CANVAS
      const expectedHeight = reference.height * size / DESIGN_CANVAS
      const normalizedBounds = {
        widthRatio: Number((measured.width / size).toFixed(6)),
        heightRatio: Number((measured.height / size).toFixed(6)),
        centerXRatio: Number((measured.cx / size).toFixed(6)),
        centerYRatio: Number((measured.cy / size).toFixed(6))
      }
      const referenceNormalized = {
        widthRatio: reference.width / DESIGN_CANVAS,
        heightRatio: reference.height / DESIGN_CANVAS,
        centerXRatio: reference.cx / DESIGN_CANVAS,
        centerYRatio: reference.cy / DESIGN_CANVAS
      }
      const normalizedBoundsDeviation = Math.max(
        Math.abs(normalizedBounds.widthRatio - referenceNormalized.widthRatio) / Math.max(referenceNormalized.widthRatio, 0.0001),
        Math.abs(normalizedBounds.heightRatio - referenceNormalized.heightRatio) / Math.max(referenceNormalized.heightRatio, 0.0001)
      )
      const normalizedCenterDeviation = Math.max(
        Math.abs(normalizedBounds.centerXRatio - referenceNormalized.centerXRatio),
        Math.abs(normalizedBounds.centerYRatio - referenceNormalized.centerYRatio)
      )
      const scaleDelta = {
        width: Number((measured.width - expectedWidth).toFixed(3)),
        height: Number((measured.height - expectedHeight).toFixed(3))
      }
      const centerDrift = {
        x: Number(((measured.cx / size - reference.cx / DESIGN_CANVAS) * size).toFixed(3)),
        y: Number(((measured.cy / size - reference.cy / DESIGN_CANVAS) * size).toFixed(3))
      }
      runtime.push({
        size,
        painted: measured.painted,
        measured,
        normalizedBounds,
        normalizedBoundsDeviation: Number((normalizedBoundsDeviation * 100).toFixed(3)),
        normalizedCenterDeviation: Number((normalizedCenterDeviation * 100).toFixed(3)),
        scaleDelta,
        centerDrift,
        scalesWithSize: measured.painted && normalizedBoundsDeviation <= NORMALIZED_BOUNDS_TOLERANCE,
        centerStable: measured.painted && normalizedCenterDeviation <= NORMALIZED_CENTER_TOLERANCE
      })
    }
    const source = sourceFlags(rawSource, sourceViewBox)
    source.paintColors = paintColors(rawSource)
    source.hasGradient = source.hasGradient || /url\(#[^)]*gradient/i.test(rawSource)
    source.colorCategory = definition.kind === 'color' && (/^(?:common|status|badges|brand)\//.test(name) || ACCENT_COLOR_ASSETS.has(name))
    source.stroke = strokeAudit(name, definition, rawSource)
    source.strokeWidths = source.stroke.widths
    source.hasStrokeMismatch = source.stroke.mismatch
    source.strokeMismatchDetail = source.stroke.mismatchDetail
    const transformCases = [
      [0, false, false], [45, false, false], [90, false, false], [135, false, false], [180, false, false], [270, false, false],
      [0, true, false], [0, false, true], [0, true, true]
    ]
    const transformBounds = transformCases.map(([rotate, flipX, flipY]) => ({
      rotate,
      flipX,
      flipY,
      bounds: canonicalBounds.painted ? transformedBounds(canonicalBounds, rotate, flipX, flipY) : null
    }))
    const transformSafety = {
      safe: transformBounds.every(result => result.bounds && result.bounds.minX >= -0.01 && result.bounds.maxX <= DESIGN_CANVAS + 0.01 && result.bounds.minY >= -0.01 && result.bounds.maxY <= DESIGN_CANVAS + 0.01),
      cases: transformBounds
    }
    const classification = classify({
      source,
      generated: canonicalBounds,
      rawBounds,
      canonicalBounds,
      runtime,
      transformSafety,
      definition
    })
    entries.push({
      name,
      kind: definition.kind,
      sourcePath: rawPath,
      classification: classification.classification,
      findings: classification.findings,
      sourceViewBox,
      generatedViewBox,
      source,
      rawArtworkBounds: rawBounds,
      rawArtworkPadding: paddingFor(rawBounds, sourceViewBox),
      canonicalArtwork: {
        bounds: canonicalBounds,
        opticalOffset: opticalOffset(canonicalBounds, generatedViewBox)
      },
      strokeWidths: source.strokeWidths,
      stroke: source.stroke,
      runtime,
      transformSafety
    })
  }
  const byClassification = Object.fromEntries(CLASSIFICATIONS.map(classification => [classification, entries.filter(icon => icon.classification === classification).length]))
  const strokeFamilies = {}
  for (const icon of entries) {
    if (!icon.stroke.family) continue
    const family = strokeFamilies[icon.stroke.family] || {
      members: [],
      widths: new Set(),
      linecaps: new Set(),
      linejoins: new Set(),
      mismatch: false
    }
    family.members.push(icon.name)
    icon.stroke.widths.forEach(value => family.widths.add(value))
    icon.stroke.linecaps.forEach(value => family.linecaps.add(value))
    icon.stroke.linejoins.forEach(value => family.linejoins.add(value))
    family.mismatch = family.mismatch || icon.stroke.mismatch
    strokeFamilies[icon.stroke.family] = family
  }
  const serializableStrokeFamilies = Object.fromEntries(Object.entries(strokeFamilies).map(([name, family]) => [name, {
    members: family.members,
    widths: [...family.widths].sort((a, b) => a - b),
    linecaps: [...family.linecaps].sort(),
    linejoins: [...family.linejoins].sort(),
    mismatch: family.mismatch
  }]))
  const geometry = {
    scaleMismatch: entries.filter(icon => icon.runtime.some(result => !result.scalesWithSize)).length,
    centerDrift: entries.filter(icon => icon.runtime.some(result => !result.centerStable)).length,
    unrendered: entries.filter(icon => icon.runtime.some(result => !result.painted)).length,
    transformUnsafe: entries.filter(icon => !icon.transformSafety.safe).length
  }
  const report = {
    version: 1,
    generatedAt: new Date().toISOString(),
    target: {
      designCanvas: { width: DESIGN_CANVAS, height: DESIGN_CANVAS },
      sizes: SIZES,
      scaleTolerancePx: SCALE_TOLERANCE_PX,
      centerDriftTolerancePx: CENTER_DRIFT_TOLERANCE_PX,
      normalizedBoundsTolerance: '2%',
      normalizedCenterTolerance: '1.5%',
      transformCases: '0/45/90/135/180/270° plus horizontal/vertical/both flip',
      liveAreaGuidance: 'approximately 20 × 20; optical keyline is form-dependent'
    },
    scope: { exclusions: SCOPE_EXCLUSIONS },
    remediations: SOURCE_REMEDIATIONS,
    summary: { total: entries.length, byClassification },
    geometry,
    strokeFamilies: serializableStrokeFamilies,
    icons: entries
  }
  fs.mkdirSync(REPORT_DIR, { recursive: true })
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`)
  fs.writeFileSync(MARKDOWN_FILE, markdownReport(report))
  console.log(`[PawIcon audit] audited ${entries.length} icons on a ${DESIGN_CANVAS}×${DESIGN_CANVAS} canvas`)
  console.log(`[PawIcon audit] ${CLASSIFICATIONS.map(classification => `${classification}=${byClassification[classification]}`).join(' ')}`)
  console.log(`[PawIcon audit] report: ${path.relative(ROOT, REPORT_FILE)}`)
  console.log(`[PawIcon audit] markdown: ${path.relative(ROOT, MARKDOWN_FILE)}`)
}

audit().catch(error => {
  console.error(`[PawIcon audit] failed: ${error.stack || error.message}`)
  process.exitCode = 1
})
