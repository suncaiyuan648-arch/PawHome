const fs = require('fs')
const path = require('path')
const {
  ROOT,
  iconEntries,
  iconMetadata,
  manifest,
  sourceAbsolutePath,
  sourceRelativePath
} = require('../paw-icon-manifest.cjs')
const { OPTICAL_SLOTS, readViewBox } = require('../paw-icon-normalize.cjs')

const reportDirectory = path.join(ROOT, '.artifacts/paw-icon-v3')
const reportFile = path.join(reportDirectory, 'source-audit.json')

function fail(message) {
  throw new Error(`[PawIcon scan] ${message}`)
}

function walk(directory, files = []) {
  if (!fs.existsSync(directory)) return files
  const stat = fs.statSync(directory)
  if (stat.isFile()) return files.concat(directory)
  return fs.readdirSync(directory).reduce((result, name) => walk(path.join(directory, name), result), files)
}

const entries = iconEntries()
const names = entries.map(entry => entry.name)
const report = {
  version: 3,
  sourceRoot: manifest.sourceRoot,
  opticalSlots: OPTICAL_SLOTS,
  slotResolution: 'icon override → family slot → source-frame recommendation',
  icons: [],
  reviewRequired: [],
  warnings: []
}

const sourceRoot = path.join(ROOT, manifest.sourceRoot)
const expectedSources = new Set(entries.map(entry => path.resolve(sourceAbsolutePath(entry.name, entry.configuredPath))))
const orphanSources = walk(sourceRoot)
  .filter(file => path.extname(file).toLowerCase() === '.svg')
  .filter(file => !expectedSources.has(path.resolve(file)))
if (orphanSources.length) {
  fail(`sourceRoot contains unregistered SVGs: ${orphanSources.map(file => path.relative(ROOT, file)).join(', ')}`)
}

for (const entry of entries) {
  const sourcePath = sourceRelativePath(entry.name, entry.configuredPath)
  const absolutePath = sourceAbsolutePath(entry.name, entry.configuredPath)
  if (!fs.existsSync(absolutePath)) fail(`source not found: ${sourcePath}`)
  const source = fs.readFileSync(absolutePath, 'utf8')
  const viewBox = readViewBox(source, sourcePath)
  const metadata = iconMetadata(entry.name, viewBox)
  const configured = (manifest.meta && manifest.meta[entry.name]) || {}
  const familyConfig = configured.family && manifest.families ? manifest.families[configured.family] : null
  if (configured.slot !== undefined && familyConfig && Number(configured.slot) !== Number(familyConfig.slot)) {
    fail(`${entry.name} has a family slot conflict: icon=${configured.slot}, family=${configured.family}:${familyConfig.slot}`)
  }
  const maxEdge = Math.max(metadata.sourceFrame.width, metadata.sourceFrame.height)
  const row = {
    name: entry.name,
    kind: entry.kind,
    sourcePath,
    sourceViewBox: viewBox,
    sourceFrame: metadata.sourceFrame,
    sourceBounds: metadata.sourceBounds,
    recommendedSlot: metadata.recommendedSlot,
    finalSlot: metadata.slot,
    family: metadata.family,
    figmaNodeId: metadata.figmaNodeId,
    sourceLabel: metadata.sourceLabel,
    reviewRequired: maxEdge > 25
  }
  report.icons.push(row)
  if (row.reviewRequired) report.reviewRequired.push(row)
  if (maxEdge < 9) {
    report.warnings.push({
      name: row.name,
      code: 'SOURCE_LT_9',
      detail: `source frame max edge is ${maxEdge}px; verify this is an icon frame rather than a decorative fragment`
    })
  }
  if (!metadata.recommendedSlot) continue
  if (!OPTICAL_SLOTS.includes(Number(metadata.slot))) fail(`${entry.name} resolves to an invalid slot: ${metadata.slot}`)
  if (Math.abs(metadata.sourceFrame.width - viewBox.width) > 0.01 || Math.abs(metadata.sourceFrame.height - viewBox.height) > 0.01) {
    fail(`${entry.name}.sourceFrame must match the source SVG viewBox: ${sourcePath}`)
  }
}

if (new Set(names).size !== names.length) fail('duplicate icon names in manifest')
fs.mkdirSync(reportDirectory, { recursive: true })
fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`)

if (report.reviewRequired.length) {
  console.warn(`[PawIcon scan] REVIEW_REQUIRED: ${report.reviewRequired.map(item => item.name).join(', ')}`)
}
if (report.warnings.length) {
  console.warn(`[PawIcon scan] warnings=${report.warnings.length}: ${report.warnings.map(item => item.name).join(', ')}`)
}
console.log(`[PawIcon scan] scanned ${report.icons.length} source frames; review=${report.reviewRequired.length}; warnings=${report.warnings.length}; report=${path.relative(ROOT, reportFile)}`)
