'use strict'

const fs = require('fs')
const path = require('path')
const JSON5 = require('json5')
const {
  CODE_EXTENSIONS,
  packageForRelative,
  packageRoots,
  relPath,
  walkFiles,
} = require('./package-audit-common.cjs')

const SOURCE_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.vue',
  '.wxs',
  '.wxml',
  '.wxss',
  '.css',
  '.json',
])

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length
}

function isExternalSpecifier(value) {
  return /^(?:https?:|data:|blob:|wx:|plugin:|cloud:|#|\/\/)/i.test(value.trim())
}

function extractModuleImports(source, file) {
  const edges = []
  const dynamic = []
  const declarations = /\b(?:import|export)\s+(?:[^;\n]*?\sfrom\s*)?(['"])([^'"]+)\1/g
  for (const match of source.matchAll(declarations)) {
    edges.push({ file, path: match[2], kind: 'module', line: lineNumber(source, match.index || 0) })
  }
  for (const match of source.matchAll(/\b(?:require|import)\s*\(\s*([^)]*)\)/g)) {
    const literal = match[1].trim().match(/^(['"`])([^'"`]*?)\1$/)
    if (literal && !literal[2].includes('${')) {
      edges.push({
        file,
        path: literal[2],
        kind: 'module',
        line: lineNumber(source, match.index || 0),
      })
    } else {
      dynamic.push({ file, line: lineNumber(source, match.index || 0), expression: match[0] })
    }
  }
  return { edges, dynamic }
}

function extractTemplateReferences(source, file) {
  const edges = []
  for (const match of source.matchAll(
    /<(?:import|include)\b[^>]*?\bsrc\s*=\s*(['"])([^'"]+)\1/gi,
  )) {
    edges.push({
      file,
      path: match[2],
      kind: 'template',
      line: lineNumber(source, match.index || 0),
    })
  }
  for (const match of source.matchAll(/<wxs\b[^>]*?\bsrc\s*=\s*(['"])([^'"]+)\1/gi)) {
    edges.push({ file, path: match[2], kind: 'wxs', line: lineNumber(source, match.index || 0) })
  }
  return edges
}

function extractStyleImports(source, file) {
  const edges = []
  for (const match of source.matchAll(/@import\s*(?:url\(\s*)?(['"]?)([^'";)\s]+)\1/gi)) {
    edges.push({ file, path: match[2], kind: 'style', line: lineNumber(source, match.index || 0) })
  }
  return edges
}

function extractUsingComponentEdges(source, file, allowJson5 = false) {
  if (path.extname(file).toLowerCase() !== '.json') return { edges: [], errors: [] }
  let value
  try {
    value = allowJson5 ? JSON5.parse(source) : JSON.parse(source)
  } catch (error) {
    return { edges: [], errors: [{ file, error: `invalid JSON: ${error.message}` }] }
  }
  const edges = []
  const visit = (node) => {
    if (!node || typeof node !== 'object') return
    if (node.usingComponents && typeof node.usingComponents === 'object') {
      for (const [name, target] of Object.entries(node.usingComponents)) {
        if (typeof target === 'string' && !isExternalSpecifier(target)) {
          edges.push({ file, path: target, kind: 'usingComponents', component: name, line: 1 })
        }
      }
    }
    for (const child of Object.values(node)) visit(child)
  }
  visit(value)
  return { edges, errors: [] }
}

function suffixCandidates(kind, sourceMode = false) {
  if (kind === 'style') return ['', '.wxss', '.css']
  if (kind === 'template') return ['', '.wxml']
  if (kind === 'wxs') return ['', '.wxs', '.js']
  if (kind === 'usingComponents') {
    return sourceMode
      ? ['', '.js', '.json', '.wxml', '.wxss', '.wxs', '.vue']
      : ['', '.js', '.json', '.wxml', '.wxss', '.wxs']
  }
  return sourceMode
    ? ['', '.js', '.json', '.wxs', '.wxml', '.wxss', '.vue', '.ts', '.tsx', '.jsx', '.css']
    : ['', '.js', '.json', '.wxs', '.wxml', '.wxss']
}

function resolveModuleTarget(fromFile, specifier, root, kind, sourceMode = false) {
  const value = String(specifier).split(/[?#]/, 1)[0].trim()
  if (!value || isExternalSpecifier(value)) return null
  let base
  if (value.startsWith('@/')) base = path.join(root, value.slice(2))
  else if (value.startsWith('/')) base = path.join(root, value.slice(1))
  else if (value.startsWith('./') || value.startsWith('../'))
    base = path.resolve(path.dirname(fromFile), value)
  else if (kind !== 'module' || (!sourceMode && /\.(js|json|wxs)$/.test(value)))
    base = path.resolve(path.dirname(fromFile), value)
  else if (sourceMode && (value.startsWith('pages/') || value.startsWith('packages/')))
    base = path.join(root, value)
  else return null
  for (const suffix of suffixCandidates(kind, sourceMode)) {
    const target = `${base}${suffix}`
    if (fs.existsSync(target) && fs.statSync(target).isFile()) return target
  }
  if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
    for (const suffix of suffixCandidates(kind, sourceMode)) {
      const target = path.join(base, `index${suffix}`)
      if (fs.existsSync(target) && fs.statSync(target).isFile()) return target
    }
  }
  return { missing: true, base }
}

function packageViolation(from, to) {
  if (!to || from === to || to === 'main') return null
  if (from === 'main') return 'main-to-subpackage'
  return 'cross-subpackage'
}

function resolveEdges(edges, root, roots, sourceMode = false, packageOf = null) {
  const missing = []
  const crossPackage = []
  const references = []
  for (const edge of edges) {
    const resolved = resolveModuleTarget(edge.file, edge.path, root, edge.kind, sourceMode)
    if (!resolved) continue
    const sourcePath = relPath(root, edge.file)
    const from = packageOf ? packageOf(sourcePath) : packageForRelative(sourcePath, roots)
    if (resolved.missing) {
      const item = {
        source: sourcePath,
        line: edge.line,
        kind: edge.kind,
        path: edge.path,
        target: relPath(root, resolved.base),
        from,
      }
      missing.push(item)
      references.push({ ...item, to: null, violation: 'missing' })
      continue
    }
    const targetPath = relPath(root, resolved)
    if (targetPath === '..' || targetPath.startsWith('../')) {
      const item = {
        source: sourcePath,
        line: edge.line,
        kind: edge.kind,
        path: edge.path,
        target: targetPath,
        from,
        to: null,
        violation: 'outside-output',
      }
      references.push(item)
      crossPackage.push(item)
      continue
    }
    const to = packageOf ? packageOf(targetPath) : packageForRelative(targetPath, roots)
    const violation = packageViolation(from, to)
    const item = {
      source: sourcePath,
      line: edge.line,
      kind: edge.kind,
      path: edge.path,
      target: targetPath,
      from,
      to,
      violation,
    }
    references.push(item)
    if (violation) crossPackage.push(item)
  }
  return { references, missing, crossPackage }
}

function productionFileEdges(file, sourceMode = false) {
  const source = fs.readFileSync(file, 'utf8')
  const ext = path.extname(file).toLowerCase()
  const moduleResult = (sourceMode
    ? ['.js', '.jsx', '.ts', '.tsx', '.vue', '.wxs']
    : ['.js', '.wxs']
  ).includes(ext)
    ? extractModuleImports(source, file)
    : { edges: [], dynamic: [] }
  const styleEdges = ['.wxss', '.css'].includes(ext) ? extractStyleImports(source, file) : []
  const templateEdges = ['.wxml'].includes(ext) ? extractTemplateReferences(source, file) : []
  const components = extractUsingComponentEdges(source, file, sourceMode)
  return {
    edges: [...moduleResult.edges, ...styleEdges, ...templateEdges, ...components.edges],
    dynamic: moduleResult.dynamic,
    errors: components.errors,
  }
}

function auditProductionBoundaries(output, roots) {
  const files = walkFiles(output).filter((file) =>
    CODE_EXTENSIONS.has(path.extname(file).toLowerCase()),
  )
  const edges = []
  const unresolvedDynamic = []
  const parseErrors = []
  for (const file of files) {
    const result = productionFileEdges(file)
    edges.push(...result.edges)
    unresolvedDynamic.push(
      ...result.dynamic.map((item) => ({
        file: relPath(output, item.file),
        line: item.line,
        expression: item.expression,
      })),
    )
    parseErrors.push(
      ...result.errors.map((item) => ({ file: relPath(output, item.file), error: item.error })),
    )
  }
  const resolved = resolveEdges(edges, output, roots)
  return {
    mode: 'production',
    filesScanned: files.length,
    references: resolved.references,
    missing: resolved.missing,
    crossPackage: resolved.crossPackage,
    unresolvedDynamic,
    parseErrors,
    pass:
      resolved.missing.length === 0 &&
      resolved.crossPackage.length === 0 &&
      unresolvedDynamic.length === 0 &&
      parseErrors.length === 0,
  }
}

function loadSourceRoots(sourceRoot) {
  const pagesFile = path.join(sourceRoot, 'pages.json')
  if (!fs.existsSync(pagesFile)) return []
  let config
  try {
    config = JSON5.parse(fs.readFileSync(pagesFile, 'utf8'))
  } catch (error) {
    throw new Error(`cannot parse source pages.json: ${error.message}`)
  }
  const roots = []
  for (const entry of config.subPackages || config.subpackages || []) {
    if (entry && typeof entry.root === 'string' && entry.root.trim())
      roots.push(entry.root.replace(/^\/+|\/+$/g, '').replace(/\\/g, '/'))
  }
  return roots.sort((a, b) => b.length - a.length)
}

function sourcePackageForFile(relative, subRoots) {
  const value = relative.replace(/\\/g, '/').replace(/^\/+/, '')
  if (value === 'packages' || value.startsWith('packages/')) {
    const segment = value.split('/')[1]
    return segment ? `packages/${segment}` : 'main'
  }
  const root = subRoots.find((item) => value === item || value.startsWith(`${item}/`))
  return root || 'main'
}

function auditSourceBoundaries(sourceRoot) {
  const subRoots = loadSourceRoots(sourceRoot)
  const omittedRoots = new Set(['node_modules', 'uni_modules', 'unpackage', '.git', '.artifacts'])
  const files = walkFiles(
    sourceRoot,
    (file) => !omittedRoots.has(relPath(sourceRoot, file).split('/')[0]),
  ).filter((file) => {
    const relative = relPath(sourceRoot, file)
    if (
      relative.startsWith('node_modules/') ||
      relative.startsWith('uni_modules/') ||
      relative.startsWith('unpackage/') ||
      relative.startsWith('.git/') ||
      relative.startsWith('.artifacts/')
    )
      return false
    return SOURCE_EXTENSIONS.has(path.extname(file).toLowerCase())
  })
  const edges = []
  const unresolvedDynamic = []
  const parseErrors = []
  for (const file of files) {
    const result = productionFileEdges(file, true)
    edges.push(...result.edges)
    unresolvedDynamic.push(
      ...result.dynamic.map((item) => ({
        file: relPath(sourceRoot, item.file),
        line: item.line,
        expression: item.expression,
      })),
    )
    parseErrors.push(
      ...result.errors.map((item) => ({ file: relPath(sourceRoot, item.file), error: item.error })),
    )
  }
  const packageOf = (relative) => sourcePackageForFile(relative, subRoots)
  const resolved = resolveEdges(edges, sourceRoot, [], true, packageOf)
  return {
    mode: 'source',
    root: sourceRoot,
    filesScanned: files.length,
    subRoots,
    references: resolved.references,
    missing: resolved.missing,
    crossPackage: resolved.crossPackage,
    unresolvedDynamic,
    parseErrors,
    pass:
      resolved.missing.length === 0 &&
      resolved.crossPackage.length === 0 &&
      unresolvedDynamic.length === 0 &&
      parseErrors.length === 0,
  }
}

module.exports = {
  auditProductionBoundaries,
  auditSourceBoundaries,
  extractModuleImports,
  extractStyleImports,
  extractTemplateReferences,
  extractUsingComponentEdges,
  loadSourceRoots,
  packageViolation,
  resolveModuleTarget,
  sourcePackageForFile,
}
