const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const JSON5 = require('json5')
const sharp = require('sharp')

const projectRoot = path.resolve(__dirname, '..')
const sourceStaticRoot = path.join(projectRoot, 'static')
const outputRoot = path.resolve(process.argv[2] || path.join(projectRoot, 'unpackage', 'dist', 'build', 'mp-weixin'))
const outputStaticRoot = path.join(outputRoot, 'static')
const reportDirectory = path.join(projectRoot, '.artifacts', 'architecture-governance')
const reportPath = path.join(reportDirectory, 'package-assets.json')

const MAX_ASSET_BYTES = 200 * 1024
const MAX_PACKAGE_BYTES = 2048 * 1024
const RECOMMENDED_PACKAGE_BYTES = 1536 * 1024
const RASTER_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg'])
const TEXT_EXTENSIONS = new Set(['.js', '.json', '.wxml', '.wxss', '.wxs', '.css'])
// Mono icons are inlined into the registry; color icons are runtime image assets.
const PAW_ICON_BUILD_ONLY_PREFIX = 'paw-icons/mono/'
const DEV_PACKAGE_ROOT = 'pages/dev'
const PACKAGE_ROUTE_FILE_EXTENSIONS = ['', '.vue', '.js', '.ts']

function normalizePath(value) {
  return value.split(path.sep).join('/')
}

function relativeToRoot(file) {
  return normalizePath(path.relative(projectRoot, file))
}

function relativeTo(file, root) {
  return normalizePath(path.relative(root, file))
}

function fail(message) {
  throw new Error(`[PawHome] ${message}`)
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return []
  const files = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...walkFiles(file))
    else files.push(file)
  }
  return files
}

function resolveImport(fromFile, specifier) {
  let base
  if (specifier.startsWith('@/')) base = path.join(projectRoot, specifier.slice(2))
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(fromFile), specifier)
  else return null

  for (const extension of PACKAGE_ROUTE_FILE_EXTENSIONS) {
    const candidate = `${base}${extension}`
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate
  }
  for (const candidate of [path.join(base, 'index.js'), path.join(base, 'index.vue')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate
  }
  return null
}

function loadPackageRoutes() {
  const pagesJson = JSON5.parse(fs.readFileSync(path.join(projectRoot, 'pages.json'), 'utf8'))
  const routes = new Map()
  for (const page of pagesJson.pages || []) routes.set(page.path, 'main')
  for (const subPackage of pagesJson.subPackages || pagesJson.subpackages || []) {
    for (const page of subPackage.pages || []) {
      routes.set(`${subPackage.root}/${page.path}`, subPackage.root)
    }
  }
  return routes
}

function loadOutputPackageRoots() {
  const appConfigPath = path.join(outputRoot, 'app.json')
  if (!fs.existsSync(appConfigPath)) return []
  const appConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'))
  const subPackages = Array.isArray(appConfig.subPackages)
    ? appConfig.subPackages
    : Array.isArray(appConfig.subpackages)
      ? appConfig.subpackages
      : []
  return [...new Set(subPackages
    .map((item) => item && item.root)
    .filter((root) => typeof root === 'string' && root && root !== DEV_PACKAGE_ROOT))]
}

function sourcePackageStaticAssets(packageRoots) {
  const assets = new Map()
  for (const packageRoot of packageRoots) {
    const staticRoot = path.join(projectRoot, packageRoot, 'static')
    const files = new Map()
    for (const file of walkFiles(staticRoot)) {
      files.set(relativeTo(file, staticRoot), file)
    }
    if (files.size) assets.set(packageRoot, files)
  }
  return assets
}

function collectModulePackages(routes) {
  const modulePackages = new Map()

  function visit(file, packageName) {
    if (!file) return
    if (!modulePackages.has(file)) modulePackages.set(file, new Set())
    const packages = modulePackages.get(file)
    if (packages.has(packageName)) return
    packages.add(packageName)

    const source = fs.readFileSync(file, 'utf8')
    const importPattern = /\b(?:from\s*|import\s*(?:\(\s*)?|require\s*\(\s*)(["'`])([^"'`]+)\1/g
    let match
    while ((match = importPattern.exec(source))) {
      visit(resolveImport(file, match[2]), packageName)
    }
  }

  for (const [route, packageName] of routes) {
    if (packageName === DEV_PACKAGE_ROOT) continue
    const pageFile = path.join(projectRoot, `${route}.vue`)
    if (fs.existsSync(pageFile)) visit(pageFile, packageName)
  }
  for (const seed of ['App.vue', 'main.ts', 'custom-tab-bar/index.ts']) {
    const seedFile = path.join(projectRoot, seed)
    if (fs.existsSync(seedFile)) visit(seedFile, 'main')
  }
  return modulePackages
}

function extractStaticReferences(source, inferDirectoryConstants = false) {
  const references = []
  function addToken(type, token) {
    token = token.split('?')[0].split('#')[0].replace(/[;,]+$/, '')
    if (!token || token.includes('..')) return
    if (token.includes('${')) {
      const prefix = token.slice(0, token.indexOf('${'))
      if (prefix) references.push({ type: 'prefix', value: prefix })
    } else if (token.endsWith('/')) {
      references.push({ type: 'prefix', value: token })
    } else {
      references.push({ type, value: token })
    }
  }

  // Match only a root-relative /static path. The boundary before the slash
  // prevents remote URLs and already package-prefixed paths from being
  // mistaken for root assets.
  const absolutePattern = /(?<![A-Za-z0-9_.:/-])\/static\/([^"'`\s<>)}\\]+)/g
  let match
  while ((match = absolutePattern.exec(source))) addToken('exact', match[1])

  // Also accept the uni-app relative form static/foo, while excluding the
  // middle of /packages/<root>/static/foo and similar absolute paths.
  const relativePattern = /(?<![A-Za-z0-9_/:])static\/([^"'`\s<>)}\\]+)/g
  while ((match = relativePattern.exec(source))) addToken('exact', match[1])

  // Keep explicit package paths visible to validation, but never route them
  // through the root-static assignment/rewrite rules.
  const packagePattern = /(?:^|["'`()=\s])((?:\/)?(?:[A-Za-z0-9_.-]+\/)+static\/)([^"'`\s<>)}\\]+)/g
  while ((match = packagePattern.exec(source))) addToken('explicit', `${match[1]}${match[2]}`)

  // A page may define a static directory once and use it through template
  // interpolation or string concatenation. Treat that directory as a prefix
  // so every runtime-selected asset in the directory is packaged together.
  if (inferDirectoryConstants) {
    const constantPattern = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(['"`])\/static\/([^'"`]*?)\2/g
    let constantMatch
    while ((constantMatch = constantPattern.exec(source))) {
      const [, name, , value] = constantMatch
      if (!value.endsWith('/')) continue
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const usagePattern = new RegExp(`(?:\\$\\{\\s*${escapedName}\\s*\\}|\\b${escapedName}\\s*\\+|\\+\\s*${escapedName}\\b)`)
      if (usagePattern.test(source)) references.push({ type: 'prefix', value })
    }
  }
  return references
}

function collectStaticReferences(modulePackages) {
  const exact = new Map()
  const prefixes = []
  for (const [file, packages] of modulePackages) {
    const references = extractStaticReferences(fs.readFileSync(file, 'utf8'), true)
    for (const reference of references) {
      const target = reference.type === 'prefix' ? prefixes : exact
      if (reference.type !== 'prefix') {
        if (!target.has(reference.value)) target.set(reference.value, [])
        target.get(reference.value).push({ file, packages })
      } else if (!target.some((item) => item.value === reference.value && item.file === file)) {
        target.push({ ...reference, file, packages })
      }
    }
  }
  return { exact, prefixes }
}

function restoreRelocatedRootReferences(sourceAssets, packageStaticAssets, roots) {
  // Normalize our own prior relocation before recomputing ownership. Private
  // source package files keep their explicit URLs and never pass this seam.
  const rootAssets = new Set(sourceAssets)
  for (const file of walkFiles(outputRoot)) {
    if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) continue
    let source = fs.readFileSync(file, 'utf8')
    for (const owner of roots) {
      const prefix = `/${owner}/static/`
      const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = new RegExp(`(?<![A-Za-z0-9_.:\\/-])${escaped}([^"'\\x60\\s<>)}?\\\\#]+)`, 'g')
      source = source.replace(pattern, (whole, relative) => {
        const privateFiles = packageStaticAssets.get(owner)
        const isOwnRelocation = rootAssets.has(relative) && !privateFiles?.has(relative)
        const isOwnPrefix = relative.endsWith('/')
          && sourceAssets.some(asset => asset.startsWith(relative))
          && ![...(privateFiles?.keys() || [])].some(asset => asset.startsWith(relative))
        return isOwnRelocation || isOwnPrefix ? `/static/${relative}` : whole
      })
    }
    fs.writeFileSync(file, source)
  }
}

function collectGeneratedStaticReferences(references, sourceAssets, packageStaticAssets, outputPackageRoots) {
  let added = 0
  const generatedFiles = walkFiles(outputRoot).filter((file) => {
    const extension = path.extname(file).toLowerCase()
    return TEXT_EXTENSIONS.has(extension) && !file.startsWith(`${outputStaticRoot}${path.sep}`)
  })
  for (const file of generatedFiles) {
    const relative = normalizePath(path.relative(outputRoot, file))
    const packageName = outputPackageRoots.find((root) => relative === root || relative.startsWith(`${root}/`)) || 'main'
    for (const reference of extractStaticReferences(fs.readFileSync(file, 'utf8'))) {
      if (reference.type === 'prefix') continue
      if (!references.exact.has(reference.value)) references.exact.set(reference.value, [])
      references.exact.get(reference.value).push({
        file,
        packages: new Set([packageName]),
        generatedOutput: true
      })
      const normalized = reference.value.replace(/^\/+/, '')
      const staticMarker = normalized.indexOf('/static/')
      if (staticMarker > 0) {
        const packageRoot = normalized.slice(0, staticMarker)
        const relativeAsset = normalized.slice(staticMarker + '/static/'.length)
        // A generated package-prefixed reference may be a root asset that
        // was prefixed during an earlier run. Reconnect it to the source root
        // so cleanup remains idempotent. Source package static wins when the
        // same path exists there.
        if (outputPackageRoots.includes(packageRoot)
          && sourceAssets.includes(relativeAsset)
          && !packageStaticAssets.get(packageRoot)?.has(relativeAsset)) {
          if (!references.exact.has(relativeAsset)) references.exact.set(relativeAsset, [])
          references.exact.get(relativeAsset).push({
            file,
            packages: new Set([packageName]),
            generatedOutput: true
          })
        }
      }
      added += 1
    }
  }
  return added
}

function originalDuplicatePath(relative) {
  return relative.replace(/ \d+(?=\.[^.]+$)/, '')
}

function isDuplicateAsset(relative) {
  if (!/ \d+\.[^.]+$/.test(relative)) return false
  const original = path.join(sourceStaticRoot, originalDuplicatePath(relative))
  return fs.existsSync(original) && fs.statSync(original).isFile()
}

function isConservativeMainModule(file, packageRoots) {
  const relative = relativeToRoot(file)
  if (relative === 'App.vue' || relative === 'main.ts' || relative === 'custom-tab-bar/index.ts') return true
  return !packageRoots.some((root) => relative === root || relative.startsWith(`${root}/`))
}

function referenceOwners(relative, references, packageRoots) {
  const matching = []
  const exact = references.exact.get(relative)
  if (exact) matching.push(...exact)
  for (const prefix of references.prefixes) {
    if (relative.startsWith(prefix.value)) matching.push(prefix)
  }

  const packages = new Set()
  let rootRequired = false
  for (const reference of matching) {
    // Generated files live below the temporary output directory. Their
    // package owner was resolved from the final app.json above, so applying
    // the source-tree fallback here would incorrectly route every subpackage
    // reference to main.
    if (!reference.generatedOutput && isConservativeMainModule(reference.file, packageRoots)) rootRequired = true
    for (const packageName of reference.packages) packages.add(packageName)
  }
  if (rootRequired || packages.has('main')) return ['main']
  return [...packages].filter((packageName) => packageName !== DEV_PACKAGE_ROOT).sort()
}

function packageNameForReference(file, modulePackages, fallbackPackages = []) {
  const packages = modulePackages.get(file) || new Set(fallbackPackages)
  if (!packages || !packages.size) return 'main'
  return [...packages].find((packageName) => packageName !== 'main') || 'main'
}

function referenceMatchesPackageAsset(referenceValue, packageName, packageStaticAssets) {
  const relative = referenceValue.replace(/^\/+/, '')
  if (relative.startsWith(`${packageName}/static/`)) {
    return packageStaticAssets.get(packageName)?.has(relative.slice(`${packageName}/static/`.length)) || false
  }
  return packageStaticAssets.get(packageName)?.has(relative) || false
}

function generatedOutputAssetExists(referenceValue) {
  const relative = referenceValue.replace(/^\/+/, '')
  const staticMarker = relative.indexOf('/static/')
  if (staticMarker > 0) {
    return fs.existsSync(path.join(outputRoot, relative))
  }
  return fs.existsSync(path.join(outputRoot, 'static', relative))
}

function collectUnknownStaticReferences(references, modulePackages, sourceAssets, packageStaticAssets) {
  const rootAssets = new Set(sourceAssets)
  const unknown = []
  for (const [value, usages] of references.exact) {
    for (const usage of usages) {
      const modulePackage = packageNameForReference(usage.file, modulePackages, usage.packages)
      const normalized = value.replace(/^\/+/, '')
      const staticMarker = normalized.indexOf('/static/')
      const explicitPackage = staticMarker > 0 ? normalized.slice(0, staticMarker) : null
      if (explicitPackage && explicitPackage !== modulePackage) {
        unknown.push({
          code: 'cross-package-static-reference',
          type: 'explicit',
          value,
          file: relativeToRoot(usage.file),
          packages: [...usage.packages].sort(),
          reason: `static asset belongs to ${explicitPackage}, but the referencing module belongs to ${modulePackage}`
        })
        continue
      }
      const knownRoot = rootAssets.has(normalized)
      const knownPackage = referenceMatchesPackageAsset(value, modulePackage, packageStaticAssets)
      const knownExplicitPackage = explicitPackage
        ? referenceMatchesPackageAsset(value, explicitPackage, packageStaticAssets)
        : false
      const knownGeneratedOutput = usage.generatedOutput && generatedOutputAssetExists(value)
      if (!knownRoot && !knownPackage && !knownExplicitPackage && !knownGeneratedOutput) {
        unknown.push({
          type: 'exact',
          value,
          file: relativeToRoot(usage.file),
          packages: [...usage.packages].sort(),
          reason: 'static reference does not resolve to a source root or package static asset'
        })
      }
    }
  }
  for (const prefix of references.prefixes) {
    const matched = sourceAssets.some((asset) => asset.startsWith(prefix.value))
      || [...packageStaticAssets.values()].some((files) => [...files.keys()].some((asset) => asset.startsWith(prefix.value)))
    if (!matched) {
      unknown.push({
        type: 'prefix',
        value: prefix.value,
        file: relativeToRoot(prefix.file),
        packages: [...prefix.packages].sort(),
        reason: 'dynamic static prefix has no matching source asset'
      })
    }
  }
  return unknown
}

async function optimizeRaster(file) {
  const originalBytes = fs.statSync(file).size
  const extension = path.extname(file).toLowerCase()
  // 350px covers the current mobile content width while keeping the upload
  // package below the DevTools quality threshold after code is included.
  // Re-encode every referenced raster (not only files above 200K), otherwise many
  // just-under-limit originals can still push the main package over 2MB.
  // The widest rendered image slot is about 350px, but 320px is sufficient
  // for the mobile package and leaves headroom for DevTools' package-size
  // accounting. Keep the source aspect ratio and never enlarge small assets.
  const dimensions = [320, 300, 280, 240]
  const qualities = [36, 32, 40]
  let best = null

  for (const dimension of dimensions) {
    for (const quality of qualities) {
      const image = sharp(file).resize({
        width: dimension,
        height: dimension,
        fit: 'inside',
        withoutEnlargement: true,
      })
      const buffer = extension === '.png'
        ? await image.png({ palette: true, quality, compressionLevel: 9, effort: 10 }).toBuffer()
        : await image.jpeg({ quality, mozjpeg: true }).toBuffer()
      if (buffer.length < originalBytes && (!best || buffer.length < best.length)) best = buffer
      if (buffer.length <= MAX_ASSET_BYTES) {
        if (buffer.length < originalBytes) return { buffer, bytes: buffer.length, optimized: true }
        return { buffer: null, bytes: originalBytes, optimized: false }
      }
    }
  }

  if (!best) return { buffer: null, bytes: originalBytes, optimized: false }
  if (best.length > MAX_ASSET_BYTES) {
    console.warn(`[PawHome] image remains above 200K after optimization: ${relativeToRoot(file)} (${best.length} bytes)`)
  }
  return { buffer: best, bytes: best.length, optimized: true }
}

function packageDirectory(packageName) {
  return packageName === 'main' ? outputRoot : path.join(outputRoot, packageName)
}

function outputStaticFile(packageName, relative) {
  return path.join(packageDirectory(packageName), 'static', relative)
}

function cleanKnownAssetCopies(allSourceAssets, retainedSourceAssets, assignments, packageRoots, packageStaticAssets) {
  const retained = new Set(retainedSourceAssets)
  for (const relative of allSourceAssets) {
    const isRetained = retained.has(relative)
    const owners = new Set(assignments.get(relative) || [])
    const mainDestination = outputStaticFile('main', relative)
    if (!isRetained || !owners.has('main')) fs.rmSync(mainDestination, { force: true })
    for (const packageName of packageRoots) {
      if (packageStaticAssets.get(packageName)?.has(relative)) continue
      if (!isRetained || !owners.has(packageName)) fs.rmSync(outputStaticFile(packageName, relative), { force: true })
    }
  }
}

function copyPackageStaticAssets(packageStaticAssets, reportAssets, outputPackageRoots = null) {
  let copied = 0
  let bytes = 0
  for (const [packageName, files] of packageStaticAssets) {
    if (outputPackageRoots && !outputPackageRoots.includes(packageName)) continue
    for (const [relative, sourceFile] of files) {
      const destination = outputStaticFile(packageName, relative)
      fs.mkdirSync(path.dirname(destination), { recursive: true })
      fs.copyFileSync(sourceFile, destination)
      const size = fs.statSync(destination).size
      copied += 1
      bytes += size
      reportAssets.push({
        scope: 'package-static',
        source: relativeToRoot(sourceFile),
        relative,
        owners: [packageName],
        destinations: [`${packageName}/static/${relative}`],
        reason: 'source package static is preserved and copied in place'
      })
    }
  }
  return { copied, bytes }
}

function addAssignment(assignments, relative, packages) {
  if (!packages.length) return
  assignments.set(relative, packages)
}

function expandPrefixAssignments(assignments, references, allAssets, packageStaticAssets) {
  for (const prefix of references.prefixes) {
    const packageNames = new Set()
    for (const packageName of prefix.packages) {
      if (packageName !== 'main'
        && packageName !== DEV_PACKAGE_ROOT
        && !packageStaticAssets.get(packageName)?.has(prefix.value)) {
        packageNames.add(packageName)
      }
    }
    if (!packageNames.size) continue

    for (const relative of allAssets.filter(asset => asset.startsWith(prefix.value))) {
      const owners = assignments.get(relative)
      if (!owners || owners.includes('main')) continue
      const packageOwners = [...packageNames]
        .filter((packageName) => !packageStaticAssets.get(packageName)?.has(relative))
      assignments.set(relative, [...new Set([...owners, ...packageOwners])].sort())
    }
  }
}

function buildAssetAliases(allAssets, references) {
  const assetsByHash = new Map()
  for (const relative of allAssets) {
    // Computed filenames cannot be rewritten by a literal alias replacement.
    if (references.prefixes.some(prefix => relative.startsWith(prefix.value))) continue
    const hash = sha256(path.join(sourceStaticRoot, relative))
    if (!assetsByHash.has(hash)) assetsByHash.set(hash, [])
    assetsByHash.get(hash).push(relative)
  }

  const aliases = new Map()
  for (const assets of assetsByHash.values()) {
    if (assets.length < 2) continue
    const canonical = assets[0]
    for (const duplicate of assets.slice(1)) aliases.set(duplicate, canonical)
  }
  return aliases
}

function deduplicateAssignments(assignments, aliases) {
  let deduplicated = 0
  for (const [duplicate, canonical] of aliases) {
    const duplicateOwners = assignments.get(duplicate)
    if (!duplicateOwners) continue
    const canonicalOwners = assignments.get(canonical) || []
    const owners = [...new Set([...canonicalOwners, ...duplicateOwners])].sort()
    assignments.set(canonical, owners.includes('main') ? ['main'] : owners)
    assignments.delete(duplicate)
    deduplicated += 1
  }
  return deduplicated
}

function replaceRootStaticReference(source, relative, replacement) {
  const needle = `/static/${relative}`
  let offset = 0
  let result = ''
  while (offset < source.length) {
    const index = source.indexOf(needle, offset)
    if (index < 0) {
      result += source.slice(offset)
      break
    }
    const previous = index > 0 ? source[index - 1] : ''
    const next = source[index + needle.length] || ''
    const leftBoundary = !previous || !/[A-Za-z0-9_.:/-]/.test(previous)
    const rightBoundary = relative.endsWith('/')
      || !next
      || /[?#[\]}'"`),;\s]/.test(next)
    const isRootReference = leftBoundary && rightBoundary
    result += source.slice(offset, index)
    result += isRootReference ? replacement : needle
    offset = index + needle.length
  }
  return result
}

function rewriteAssetAliases(packageRoot, aliases) {
  if (!aliases.size) return
  for (const file of walkFiles(packageRoot)) {
    if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) continue
    let source = fs.readFileSync(file, 'utf8')
    for (const [duplicate, canonical] of aliases) {
      source = replaceRootStaticReference(source, duplicate, `/static/${canonical}`)
    }
    fs.writeFileSync(file, source)
  }
}

function buildPrefixRules(assignments, references, packageName, allAssets) {
  const rules = []
  for (const prefix of references.prefixes) {
    const matches = allAssets.filter(relative => relative.startsWith(prefix.value))
    if (!matches.length) continue
    if (matches.every(relative => {
      const owners = assignments.get(relative) || []
      return owners.includes(packageName)
    })) {
      rules.push(prefix.value)
    }
  }
  return rules
}

function packageStaticReferenceRules(packageName, references, packageStaticFiles, rootAssets) {
  if (!packageStaticFiles || !packageStaticFiles.size) return []
  const rules = []
  for (const reference of [...references.exact.keys(), ...references.prefixes.map((item) => item.value)]) {
    const relative = reference.replace(/^\/+/, '')
    // When the same relative name exists at the root, /static/foo is a root
    // absolute URL. Keep that meaning; only package-only names are rewritten
    // to the package's private static directory.
    if (rootAssets.includes(relative)) continue
    if (packageStaticFiles.has(relative) || [...packageStaticFiles.keys()].some((asset) => asset.startsWith(relative))) rules.push(relative)
  }
  return [...new Set(rules)]
}

function rewritePackageReferences(packageName, assignments, references, allAssets, packageStaticFiles) {
  if (packageName === 'main') return
  const packageRoot = packageDirectory(packageName)
  const exactRules = allAssets
    .filter(relative => {
      const owners = assignments.get(relative) || []
      return owners.includes(packageName)
    })
    .map(relative => relative)
  const prefixRules = buildPrefixRules(assignments, references, packageName, allAssets)
  const localRules = packageStaticReferenceRules(packageName, references, packageStaticFiles, allAssets)
  const rules = [...new Set([...prefixRules, ...exactRules, ...localRules])].sort((a, b) => b.length - a.length)

  for (const file of walkFiles(packageRoot)) {
    if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) continue
    let source = fs.readFileSync(file, 'utf8')
    for (const relative of rules) {
      source = replaceRootStaticReference(source, relative, `/${packageName}/static/${relative}`)
    }
    fs.writeFileSync(file, source)
  }
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function formatSize(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`
}

function writeAssetReport(report) {
  fs.mkdirSync(reportDirectory, { recursive: true })
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}

function writeFailureReport(error) {
  writeAssetReport({
    schemaVersion: 1,
    status: 'error',
    outputRoot: normalizePath(path.relative(projectRoot, outputRoot)),
    errors: [{
      code: 'pipeline-failure',
      message: error.message || String(error)
    }]
  })
}

function sumPackage(packageName, packageRoots) {
  const packageRoot = packageDirectory(packageName)
  let total = 0
  for (const file of walkFiles(packageRoot)) {
    const relative = normalizePath(path.relative(outputRoot, file))
    if (packageName === 'main' && packageRoots.some(root => relative === root || relative.startsWith(`${root}/`))) continue
    total += fs.statSync(file).size
  }
  return total
}

function removeDevelopmentArtifacts() {
  const devPackageRoot = path.join(outputRoot, DEV_PACKAGE_ROOT)
  fs.rmSync(devPackageRoot, { recursive: true, force: true })
  fs.rmSync(path.join(outputRoot, 'components/PawIcon/generated/icon-metrics.js'), { force: true })

  const appConfigPath = path.join(outputRoot, 'app.json')
  if (!fs.existsSync(appConfigPath)) return
  const appConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'))
  if (Array.isArray(appConfig.subPackages)) {
    appConfig.subPackages = appConfig.subPackages.filter(item => item.root !== DEV_PACKAGE_ROOT)
  } else if (Array.isArray(appConfig.subpackages)) {
    appConfig.subpackages = appConfig.subpackages.filter(item => item.root !== DEV_PACKAGE_ROOT)
  }
  fs.writeFileSync(appConfigPath, `${JSON.stringify(appConfig, null, 2)}\n`)
}

function removeBuildOnlyOutputAssets() {
  for (const file of walkFiles(outputRoot)) {
    const relative = normalizePath(path.relative(outputRoot, file))
    if (relative.startsWith(`static/${PAW_ICON_BUILD_ONLY_PREFIX}`)
      || relative.includes(`/static/${PAW_ICON_BUILD_ONLY_PREFIX}`)) {
      fs.rmSync(file, { force: true })
    }
  }
}

async function main() {
  if (!fs.existsSync(outputRoot)) fail(`编译目录不存在：${outputRoot}`)
  if (!fs.existsSync(sourceStaticRoot)) fail(`静态资源目录不存在：${sourceStaticRoot}`)

  const routes = loadPackageRoutes()
  const configuredPackageRoots = [...new Set([...routes.values()]
    .filter((packageName) => packageName !== 'main'))]
  const sourcePackageRoots = [...new Set([...routes.values()]
    .filter((packageName) => packageName !== 'main' && packageName !== DEV_PACKAGE_ROOT))]
  const modulePackages = collectModulePackages(routes)
  const references = collectStaticReferences(modulePackages)
  const allSourceAssets = walkFiles(sourceStaticRoot)
    .map(file => normalizePath(path.relative(sourceStaticRoot, file)))
  const sourceAssets = allSourceAssets
    .filter(relative => !relative.startsWith(PAW_ICON_BUILD_ONLY_PREFIX))
    .filter(relative => !isDuplicateAsset(relative))
  const packageStaticAssets = sourcePackageStaticAssets(sourcePackageRoots)
  const outputPackageRoots = loadOutputPackageRoots()
  // Remove dev-only output before scanning generated files so audit-only assets
  // cannot become production owners.
  removeDevelopmentArtifacts()
  removeBuildOnlyOutputAssets()
  restoreRelocatedRootReferences(sourceAssets, packageStaticAssets, outputPackageRoots)
  const generatedStaticReferences = collectGeneratedStaticReferences(
    references,
    sourceAssets,
    packageStaticAssets,
    outputPackageRoots
  )
  const reportAssets = []
  const errors = []

  // A package-local static file shadows the same relative name at runtime.
  // A root absolute URL must keep its root meaning, so retain the root copy
  // in main and flag differing bytes instead of silently swapping in the
  // package-local file.
  const rootPackageCollisions = new Set()
  for (const relative of sourceAssets) {
    for (const [packageName, files] of packageStaticAssets) {
      const packageFile = files.get(relative)
      if (!packageFile) continue
      rootPackageCollisions.add(relative)
      if (sha256(path.join(sourceStaticRoot, relative)) !== sha256(packageFile)) {
        errors.push({
          code: 'root-package-static-collision',
          relative,
          packageName,
          reason: 'root and package static assets share a path with different bytes; root absolute URL remains rooted'
        })
      }
    }
  }

  const assignments = new Map()
  const assetAliases = buildAssetAliases(sourceAssets, references)
  let omitted = 0
  for (const relative of sourceAssets) {
    const owners = rootPackageCollisions.has(relative)
      ? ['main']
      : referenceOwners(relative, references, configuredPackageRoots)
    if (!owners.length) {
      omitted += 1
      continue
    }
    addAssignment(assignments, relative, owners)
  }
  expandPrefixAssignments(assignments, references, sourceAssets, packageStaticAssets)
  const deduplicated = deduplicateAssignments(assignments, assetAliases)

  const validOwners = new Set(['main', ...outputPackageRoots])
  for (const owners of assignments.values()) {
    for (const owner of owners) {
      if (!validOwners.has(owner)) {
        errors.push({ code: 'owner-not-in-output-app', owner, reason: 'asset owner is not registered in final app.json subPackages' })
      }
    }
  }
  for (const packageName of sourcePackageRoots) {
    if (!outputPackageRoots.includes(packageName) && packageStaticAssets.has(packageName)) {
      errors.push({ code: 'source-package-not-in-output-app', packageName, reason: 'source package static exists but final app.json has no matching root' })
    }
  }

  // Remove only known copies that the source map says are no longer owned by a
  // package. Unknown output assets are deliberately retained and reported by
  // reference validation instead of being deleted to fake a smaller package.
  cleanKnownAssetCopies(allSourceAssets, sourceAssets, assignments, outputPackageRoots, packageStaticAssets)
  fs.mkdirSync(outputStaticRoot, { recursive: true })

  let copied = 0
  let optimized = 0
  let copiedBytes = 0
  const contentCache = new Map()
  for (const [relative, owners] of assignments) {
    const sourceFile = path.join(sourceStaticRoot, relative)
    const extension = path.extname(relative).toLowerCase()
    let optimizedAsset = null
    if (RASTER_EXTENSIONS.has(extension)) optimizedAsset = await optimizeRaster(sourceFile)
    const destinations = []
    for (const packageName of owners.filter((owner) => validOwners.has(owner))) {
      const destination = path.join(packageDirectory(packageName), 'static', relative)
      fs.mkdirSync(path.dirname(destination), { recursive: true })
      if (optimizedAsset && optimizedAsset.buffer) {
        fs.writeFileSync(destination, optimizedAsset.buffer)
        if (packageName === owners[0]) optimized += 1
        copiedBytes += optimizedAsset.bytes
      } else {
        const hash = sha256(sourceFile)
        if (contentCache.has(hash)) fs.copyFileSync(contentCache.get(hash), destination)
        else {
          fs.copyFileSync(sourceFile, destination)
          contentCache.set(hash, destination)
        }
        copiedBytes += fs.statSync(destination).size
      }
      copied += 1
      destinations.push(`${packageName === 'main' ? '' : `${packageName}/`}static/${relative}`)
    }
    reportAssets.push({
      scope: 'root-static',
      source: `static/${relative}`,
      relative,
      owners: owners.filter((owner) => validOwners.has(owner)),
      destinations,
      reason: references.exact.has(relative) || references.prefixes.some((prefix) => relative.startsWith(prefix.value))
        ? 'source root static referenced by package dependency owner'
        : 'source root static retained by assignment'
    })
  }

  const packageStaticCopy = copyPackageStaticAssets(packageStaticAssets, reportAssets, outputPackageRoots)

  // Identical source assets may be referenced under different semantic paths.
  // Keep one canonical copy in the package, then rewrite generated references
  // before subpackage routing prefixes are applied.
  rewriteAssetAliases(outputRoot, assetAliases)

  const packageRoots = outputPackageRoots
  for (const packageName of packageRoots) {
    rewritePackageReferences(packageName, assignments, references, sourceAssets, packageStaticAssets.get(packageName))
  }

  const unknownReferences = collectUnknownStaticReferences(references, modulePackages, sourceAssets, packageStaticAssets)
  errors.push(...unknownReferences.map((reference) => ({
    code: reference.code || 'unknown-static-reference',
    ...reference
  })))

  const mainBytes = sumPackage('main', packageRoots)
  const packageSizes = Object.fromEntries(packageRoots.map(packageName => [packageName, sumPackage(packageName, packageRoots)]))
  const report = {
    schemaVersion: 1,
    status: errors.length ? 'error' : 'ok',
    outputRoot: normalizePath(path.relative(projectRoot, outputRoot)),
    source: {
      pagesJson: 'pages.json',
      rootStatic: 'static',
      sourcePackageRoots,
      outputPackageRoots
    },
    summary: {
      copied,
      packageStaticCopied: packageStaticCopy.copied,
      optimized,
      deduplicated,
      generatedReferences: generatedStaticReferences,
      omitted,
      staticBytes: copiedBytes + packageStaticCopy.bytes,
      unknownReferences: unknownReferences.length,
      mainBytes,
      packageSizes
    },
    assets: reportAssets,
    unknownReferences,
    errors
  }
  writeAssetReport(report)

  console.log(`[PawHome] prepared upload package: copied=${copied}, packageStatic=${packageStaticCopy.copied}, optimized=${optimized}, deduplicated=${deduplicated}, generatedRefs=${generatedStaticReferences}, omitted=${omitted}, staticBytes=${formatSize(copiedBytes + packageStaticCopy.bytes)}`)
  console.log(`[PawHome] main package=${formatSize(mainBytes)} (hard limit ${formatSize(MAX_PACKAGE_BYTES)})`)
  for (const [packageName, bytes] of Object.entries(packageSizes)) {
    console.log(`[PawHome] ${packageName}=${formatSize(bytes)} (hard limit ${formatSize(MAX_PACKAGE_BYTES)})`)
  }
  if (mainBytes > RECOMMENDED_PACKAGE_BYTES) console.warn(`[PawHome] main package exceeds the 1.5MB quality recommendation`)
  for (const [packageName, bytes] of Object.entries(packageSizes)) {
    if (bytes > RECOMMENDED_PACKAGE_BYTES) console.warn(`[PawHome] ${packageName} exceeds the 1.5MB quality recommendation`)
  }
  if (mainBytes > MAX_PACKAGE_BYTES || Object.values(packageSizes).some(bytes => bytes > MAX_PACKAGE_BYTES)) {
    process.exitCode = 1
    console.error('[PawHome] package remains over the WeChat 2MB package limit')
  }
  if (errors.length) {
    process.exitCode = 1
    console.error(`[PawHome] package asset pipeline found ${errors.length} error(s); see ${normalizePath(path.relative(projectRoot, reportPath))}`)
  }
}

main().catch(error => {
  try {
    writeFailureReport(error)
  } catch (reportError) {
    console.error(reportError.stack || reportError.message)
  }
  console.error(error.stack || error.message)
  process.exitCode = 1
})
