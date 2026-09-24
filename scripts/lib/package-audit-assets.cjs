'use strict'

const fs = require('fs')
const path = require('path')
const {
  ASSET_EXTENSIONS,
  CODE_EXTENSIONS,
  candidateFiles,
  isRemoteOrData,
  packageForRelative,
  relPath,
  resolveAssetTarget,
  stripQueryHash,
  walkFiles,
} = require('./package-audit-common.cjs')

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length
}

function addReference(references, file, source, index, raw, kind) {
  const value = String(raw || '').trim()
  if (!value || isRemoteOrData(value)) return
  references.push({ file, path: value, kind, line: lineNumber(source, index) })
}

function extractStaticReferences(source, file) {
  const references = []
  const unknownDynamic = []
  const staticPattern =
    /(?:^|["'`(=:\s])((?:\/[^"'`\s]*\/)?static\/[^"'`\s)};,]+|\/static\/[^"'`\s)};,]+)/g
  for (const match of source.matchAll(staticPattern)) {
    const raw = stripQueryHash(match[1]).replace(/[),;]+$/, '')
    if (raw.includes('${') || raw.includes('`')) continue
    if (raw.endsWith('/')) {
      unknownDynamic.push({
        file,
        line: lineNumber(source, match.index || 0),
        expression: match[1],
      })
      continue
    }
    addReference(references, file, source, match.index || 0, raw, 'static')
  }
  const dynamicPatterns = [
    /(?:\/[^"'`\s]*\/)?static\/[^"'`\s]*\$\{[^}]*\}/g,
    /(?:\/static\/|static\/)["'`]?(?:\s*\+|\$\{)/g,
    /["'`]\/static\/["'`]\s*\+/g,
  ]
  for (const pattern of dynamicPatterns) {
    for (const match of source.matchAll(pattern)) {
      const line = lineNumber(source, match.index || 0)
      const duplicate = unknownDynamic.some(
        (item) =>
          item.file === file &&
          item.line === line &&
          (item.expression.includes(match[0]) || match[0].includes(item.expression)),
      )
      if (!duplicate) unknownDynamic.push({ file, line, expression: match[0] })
    }
  }
  return { references, unknownDynamic }
}

function extractStyleReferences(source, file) {
  const references = []
  for (const match of source.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)) {
    addReference(references, file, source, match.index || 0, match[2], 'style-url')
  }
  for (const match of source.matchAll(/@import\s*(?:url\(\s*)?(['"]?)([^'";)\s]+)\1/gi)) {
    addReference(references, file, source, match.index || 0, match[2], 'style-import')
  }
  return references
}

function extractMediaReferences(source, file) {
  const references = []
  for (const match of source.matchAll(
    /<(?:image|audio|video)\b[^>]*?\b(?:src|poster)\s*=\s*(['"])([^'"]+)\1/gi,
  )) {
    if (!match[2].includes('{{'))
      addReference(references, file, source, match.index || 0, match[2], 'template-media')
  }
  return references
}

function extractRequireReferences(source, file) {
  const references = []
  const pattern = /(?:require\s*\(\s*|import\s*\(\s*|(?:from|import)\s*)(['"])([^'"]+)\1/g
  for (const match of source.matchAll(pattern)) {
    const raw = match[2]
    const clean = stripQueryHash(raw)
    if (
      clean.includes('/static/') ||
      clean.startsWith('static/') ||
      ASSET_EXTENSIONS.has(path.extname(clean).toLowerCase())
    ) {
      addReference(references, file, source, match.index || 0, raw, 'module-asset')
    }
  }
  return references
}

function extractUsingComponents(source, file) {
  if (path.extname(file).toLowerCase() !== '.json') return { references: [], errors: [] }
  let value
  try {
    value = JSON.parse(source)
  } catch (error) {
    return { references: [], errors: [{ file, error: `invalid JSON: ${error.message}` }] }
  }
  const references = []
  const visit = (node) => {
    if (!node || typeof node !== 'object') return
    if (node.usingComponents && typeof node.usingComponents === 'object') {
      for (const [name, target] of Object.entries(node.usingComponents)) {
        if (typeof target === 'string' && !isRemoteOrData(target)) {
          addReference(references, file, source, 0, target, 'usingComponents')
          references[references.length - 1].component = name
        }
      }
    }
    for (const child of Object.values(node)) visit(child)
  }
  visit(value)
  return { references, errors: [] }
}

function ownerVisibility(referencingPackage, targetPackage) {
  if (targetPackage === referencingPackage || targetPackage === 'main') return null
  if (referencingPackage === 'main') return 'main-to-subpackage'
  return 'cross-subpackage'
}

function inspectReference(reference, output, roots) {
  const target = resolveAssetTarget(
    reference.file,
    reference.path,
    output,
    reference.kind === 'usingComponents'
      ? 'usingComponents'
      : reference.kind === 'style-import'
        ? 'style-import'
        : 'asset',
  )
  if (!target) return { reference, skipped: true }
  const candidates = candidateFiles(
    target,
    reference.kind === 'usingComponents'
      ? 'usingComponents'
      : reference.kind === 'style-import'
        ? 'style-import'
        : 'asset',
  )
  if (!candidates.length) return { reference, target: relPath(output, target), missing: true }
  const targetFile = candidates[0]
  const targetRelative = relPath(output, targetFile)
  const refRelative = relPath(output, reference.file)
  const referencingPackage = packageForRelative(refRelative, roots)
  const targetPackage = packageForRelative(targetRelative, roots)
  const outsideOutput = targetRelative === '..' || targetRelative.startsWith('../')
  return {
    reference,
    target: targetRelative,
    referencingPackage,
    targetPackage,
    violation: outsideOutput
      ? 'outside-output'
      : ownerVisibility(referencingPackage, targetPackage),
  }
}

function auditAssets(options) {
  const { output, roots } = options
  const files = walkFiles(output).filter((file) =>
    CODE_EXTENSIONS.has(path.extname(file).toLowerCase()),
  )
  const references = []
  const unknownDynamic = []
  const parseErrors = []
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8')
    const staticResult = extractStaticReferences(source, file)
    references.push(...staticResult.references)
    unknownDynamic.push(...staticResult.unknownDynamic)
    if (['.wxss', '.css'].includes(path.extname(file).toLowerCase()))
      references.push(...extractStyleReferences(source, file))
    if (['.js', '.wxs'].includes(path.extname(file).toLowerCase()))
      references.push(...extractRequireReferences(source, file))
    if (path.extname(file).toLowerCase() === '.wxml')
      references.push(...extractMediaReferences(source, file))
    const components = extractUsingComponents(source, file)
    references.push(...components.references)
    parseErrors.push(...components.errors)
  }
  const resolved = references
    .map((reference) => inspectReference(reference, output, roots))
    .filter((item) => !item.skipped)
  const missing = resolved.filter((item) => item.missing)
  const crossPackage = resolved.filter((item) => item.violation)
  return {
    filesScanned: files.length,
    references: resolved.map((item) => ({
      source: relPath(output, item.reference.file),
      line: item.reference.line,
      kind: item.reference.kind,
      path: item.reference.path,
      target: item.target || null,
      referencingPackage: item.referencingPackage || null,
      targetPackage: item.targetPackage || null,
      violation: item.violation || null,
    })),
    missing: missing.map((item) => ({
      source: relPath(output, item.reference.file),
      line: item.reference.line,
      kind: item.reference.kind,
      path: item.reference.path,
      target: item.target,
    })),
    crossPackage: crossPackage.map((item) => ({
      source: relPath(output, item.reference.file),
      line: item.reference.line,
      path: item.reference.path,
      target: item.target,
      from: item.referencingPackage,
      to: item.targetPackage,
      violation: item.violation,
    })),
    unknownDynamic: unknownDynamic
      .map((item) => ({
        file: relPath(output, item.file),
        line: item.line,
        expression: item.expression,
      }))
      .filter(
        (item, index, list) =>
          list.findIndex(
            (other) =>
              other.file === item.file &&
              other.line === item.line &&
              other.expression === item.expression,
          ) === index,
      ),
    parseErrors,
    pass:
      missing.length === 0 &&
      crossPackage.length === 0 &&
      unknownDynamic.length === 0 &&
      parseErrors.length === 0,
  }
}

module.exports = {
  auditAssets,
  extractRequireReferences,
  extractStaticReferences,
  extractStyleReferences,
  extractUsingComponents,
  ownerVisibility,
}
