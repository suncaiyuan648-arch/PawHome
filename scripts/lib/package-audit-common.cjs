'use strict'

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const JSON5 = require('json5')

const PROJECT_ROOT = path.resolve(process.env.PAWHOME_PROJECT_ROOT || path.resolve(__dirname, '..', '..'))
const DEFAULT_OUTPUT = path.join(PROJECT_ROOT, 'unpackage', 'dist', 'build', 'mp-weixin')
const DEFAULT_REPORT_DIR = path.join(PROJECT_ROOT, '.artifacts', 'package-audit')
const DEFAULT_BUDGETS = path.join(PROJECT_ROOT, 'config', 'package-budgets.json')
const SOURCE_EXTENSIONS = new Set(['.js', '.wxml', '.wxss', '.json', '.wxs', '.css'])
const CODE_EXTENSIONS = new Set(['.js', '.wxs', '.json', '.wxml', '.wxss', '.css'])
const ASSET_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp', '.ico',
  '.mp3', '.wav', '.m4a', '.aac', '.mp4', '.mov', '.webm', '.woff', '.woff2',
  '.ttf', '.otf', '.eot'
])
const COMPONENT_EXTENSIONS = ['.js', '.json', '.wxml', '.wxss', '.wxs']

function normalizePath(value) {
  return String(value).split(path.sep).join('/').replace(/^\.\//, '')
}

function relPath(root, file) {
  return normalizePath(path.relative(root, file))
}

function resolveProjectPath(value, fallback) {
  if (!value) return fallback
  return path.isAbsolute(value) ? path.resolve(value) : path.resolve(PROJECT_ROOT, value)
}

function walkFiles(directory, shouldVisit = () => true) {
  if (!fs.existsSync(directory)) return []
  const stat = fs.statSync(directory)
  if (stat.isFile()) return [directory]
  const files = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    if (!shouldVisit(target)) continue
    if (entry.isDirectory()) files.push(...walkFiles(target, shouldVisit))
    else files.push(target)
  }
  return files
}

function readJson(file) {
  return JSON5.parse(fs.readFileSync(file, 'utf8'))
}

function loadManifest(output) {
  const file = path.join(output, 'app.json')
  if (!fs.existsSync(file)) throw new Error(`processed output is missing app.json: ${file}`)
  let manifest
  try {
    manifest = readJson(file)
  } catch (error) {
    throw new Error(`cannot parse processed app.json: ${error.message}`)
  }
  return { file, manifest }
}

function normalizeRoot(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty relative path`)
  const raw = value.trim()
  if (raw.startsWith('/') || raw.startsWith('\\') || raw.includes('\\')) {
    throw new Error(`${label} must be a relative path without a leading slash or backslash: ${value}`)
  }
  const root = normalizePath(raw).replace(/\/+$/g, '')
  const rawSegments = raw.split('/')
  const segments = root.split('/')
  if (!root || root.startsWith('../') || rawSegments.some(segment => !segment || segment === '.' || segment === '..') || segments.some(segment => !segment || segment === '.' || segment === '..')) {
    throw new Error(`${label} is not a safe relative path: ${value}`)
  }
  return root
}

function packageRoots(manifest) {
  if (manifest.subPackages !== undefined && manifest.subpackages !== undefined) {
    throw new Error('processed app.json must not define both subPackages and subpackages')
  }
  const entries = manifest.subPackages || manifest.subpackages || []
  if (!Array.isArray(entries)) throw new Error('processed app.json subPackages must be an array')
  const roots = [{ name: 'main', root: '' }]
  for (const [index, entry] of entries.entries()) {
    const root = normalizeRoot(entry && entry.root, `subPackages[${index}].root`)
    if (roots.some(item => item.root === root)) throw new Error(`duplicate processed sub-package root: ${root}`)
    for (const existing of roots.slice(1)) {
      if (root.startsWith(`${existing.root}/`) || existing.root.startsWith(`${root}/`)) {
        throw new Error(`nested processed sub-package roots are not allowed: ${existing.root} and ${root}`)
      }
    }
    roots.push({ name: root, root })
  }
  return roots
}

function packageForRelative(relative, roots) {
  const file = normalizePath(relative).replace(/^\/+/, '')
  const candidates = roots.filter(item => item.root && (file === item.root || file.startsWith(`${item.root}/`)))
  if (!candidates.length) return 'main'
  candidates.sort((left, right) => right.root.length - left.root.length)
  return candidates[0].name
}

function inventoryOutput(output, roots) {
  return walkFiles(output)
    .map(file => {
      const relative = relPath(output, file)
      return {
        file,
        path: relative,
        bytes: fs.statSync(file).size,
        package: packageForRelative(relative, roots),
        hash: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
      }
    })
    .sort((left, right) => left.path.localeCompare(right.path))
}

function packageTotals(files, roots) {
  const totals = Object.fromEntries(roots.map(item => [item.name, 0]))
  for (const file of files) totals[file.package] = (totals[file.package] || 0) + file.bytes
  return totals
}

function duplicateGroups(files) {
  const groups = new Map()
  for (const file of files) {
    if (!groups.has(file.hash)) groups.set(file.hash, [])
    groups.get(file.hash).push(file)
  }
  return [...groups.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([hash, entries]) => ({
      hash,
      bytes: entries[0].bytes,
      files: entries.map(entry => entry.path).sort()
    }))
    .sort((left, right) => right.bytes - left.bytes || left.hash.localeCompare(right.hash))
}

function ensureReportOutsideOutput(report, output) {
  const reportPath = path.resolve(report)
  const outputPath = path.resolve(output)
  if (reportPath === outputPath || reportPath.startsWith(`${outputPath}${path.sep}`)) {
    throw new Error(`report must be outside processed output: ${reportPath}`)
  }
}

function writeReport(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function writeFailureReport(file, output, error, extra = {}) {
  ensureReportOutsideOutput(file, output)
  writeReport(file, {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    output,
    ...extra,
    errors: [error instanceof Error ? error.message : String(error)],
    pass: false
  })
}

function readBudgets(file = DEFAULT_BUDGETS) {
  if (!fs.existsSync(file)) throw new Error(`package budget config is missing: ${file}`)
  return readJson(file)
}

function bytesToKiB(bytes) {
  return Number((bytes / 1024).toFixed(1))
}

function isRemoteOrData(value) {
  return /^(?:\/\/|https?:|data:|blob:|wxfile:|cloud:|plugin:|#)/i.test(value.trim())
}

function stripQueryHash(value) {
  return value.split(/[?#]/, 1)[0]
}

function parseArgs(argv, options = {}) {
  const args = { final: false }
  const aliases = options.aliases || {}
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === '--final') {
      args.final = true
      continue
    }
    const key = Object.keys(aliases).find(name => token === name || token.startsWith(`${name}=`))
    if (!key) throw new Error(`unknown argument: ${token}`)
    const value = token.includes('=') ? token.slice(token.indexOf('=') + 1) : argv[++index]
    if (!value) throw new Error(`${token} requires a value`)
    args[aliases[key]] = value
  }
  return args
}

function resolveAssetTarget(fromFile, ref, output, kind = 'asset') {
  const raw = stripQueryHash(String(ref).trim())
  if (!raw || isRemoteOrData(raw)) return null
  let target
  if (raw.startsWith('/')) target = path.join(output, raw.slice(1))
  else if (raw.startsWith('static/') && kind === 'asset') target = path.join(output, raw)
  else target = path.resolve(path.dirname(fromFile), raw)
  return path.resolve(target)
}

function candidateFiles(target, kind) {
  if (fs.existsSync(target) && fs.statSync(target).isFile()) return [target]
  if (kind === 'usingComponents') return COMPONENT_EXTENSIONS.map(ext => `${target}${ext}`).filter(file => fs.existsSync(file))
  if (kind === 'style-import') return ['.wxss', '.css'].map(ext => `${target}${ext}`).filter(file => fs.existsSync(file))
  return []
}

module.exports = {
  ASSET_EXTENSIONS,
  CODE_EXTENSIONS,
  DEFAULT_BUDGETS,
  DEFAULT_OUTPUT,
  DEFAULT_REPORT_DIR,
  PROJECT_ROOT,
  SOURCE_EXTENSIONS,
  bytesToKiB,
  candidateFiles,
  duplicateGroups,
  ensureReportOutsideOutput,
  inventoryOutput,
  isRemoteOrData,
  loadManifest,
  normalizePath,
  packageForRelative,
  packageRoots,
  packageTotals,
  parseArgs,
  readBudgets,
  readJson,
  relPath,
  resolveAssetTarget,
  resolveProjectPath,
  stripQueryHash,
  walkFiles,
  writeFailureReport,
  writeReport
}
