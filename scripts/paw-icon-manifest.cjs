const path = require('path')
const manifest = require('../config/paw-icons.cjs')
const { recommendedSlotForFrame } = require('./paw-icon-normalize.cjs')

const ROOT = path.resolve(__dirname, '..')
const SOURCE_ROOT = manifest.sourceRoot || 'assets/paw-icons/source'

function iconEntries() {
  return [
    ...Object.entries(manifest.mono || {}).map(([name, configuredPath]) => ({ name, kind: 'mono', configuredPath })),
    ...Object.entries(manifest.color || {}).map(([name, configuredPath]) => ({ name, kind: 'color', configuredPath }))
  ]
}

function sourceRelativePath(name) {
  return path.join(SOURCE_ROOT, `${name}.svg`)
}

function sourceAbsolutePath(name) {
  return path.join(ROOT, sourceRelativePath(name))
}

function sourceFrameFor(name, sourceViewBox) {
  const configured = (manifest.meta && manifest.meta[name]) || {}
  return {
    width: configured.sourceFrame && configured.sourceFrame.width !== undefined
      ? Number(configured.sourceFrame.width)
      : Number(sourceViewBox.width),
    height: configured.sourceFrame && configured.sourceFrame.height !== undefined
      ? Number(configured.sourceFrame.height)
      : Number(sourceViewBox.height)
  }
}

function iconMetadata(name, sourceViewBox) {
  const configured = (manifest.meta && manifest.meta[name]) || {}
  const family = configured.family || null
  const familyConfig = family && manifest.families ? manifest.families[family] : null
  const sourceFrame = sourceFrameFor(name, sourceViewBox)
  const recommendedSlot = recommendedSlotForFrame(sourceFrame.width, sourceFrame.height)
  const finalSlot = configured.slot || (familyConfig && familyConfig.slot) || recommendedSlot
  return {
    sourceFrame,
    sourceBounds: configured.sourceBounds || null,
    recommendedSlot,
    slot: finalSlot,
    family,
    figmaNodeId: configured.figmaNodeId || null,
    sourceLabel: configured.sourceLabel || null
  }
}

module.exports = {
  ROOT,
  SOURCE_ROOT,
  iconEntries,
  iconMetadata,
  manifest,
  sourceAbsolutePath,
  sourceRelativePath
}
