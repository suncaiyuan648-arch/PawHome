const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const JSON5 = require('json5')
const sharp = require('sharp')

const projectRoot = path.resolve(__dirname, '..')
const sourceStaticRoot = path.join(projectRoot, 'static')
const outputRoot = path.resolve(process.argv[2] || path.join(projectRoot, 'unpackage', 'dist', 'build', 'mp-weixin'))
const outputStaticRoot = path.join(outputRoot, 'static')

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

function collectModulePackages(routes) {
  const modulePackages = new Map()

  function visit(file, packageName) {
    if (!file) return
    if (!modulePackages.has(file)) modulePackages.set(file, new Set())
    const packages = modulePackages.get(file)
    if (packages.has(packageName)) return
    packages.add(packageName)

    const source = fs.readFileSync(file, 'utf8')
    const importPattern = /(?:from\s+|import\s*\(|require\s*\()(["'`])([^"'`]+)\1/g
    let match
    while ((match = importPattern.exec(source))) {
      visit(resolveImport(file, match[2]), packageName)
    }
  }

  for (const [route, packageName] of routes) {
    const pageFile = path.join(projectRoot, `${route}.vue`)
    if (fs.existsSync(pageFile)) visit(pageFile, packageName)
  }
  for (const seed of ['App.vue', 'main.js', 'custom-tab-bar/index.js']) {
    const seedFile = path.join(projectRoot, seed)
    if (fs.existsSync(seedFile)) visit(seedFile, 'main')
  }
  return modulePackages
}

function extractStaticReferences(source, inferDirectoryConstants = false) {
  const references = []
  const pattern = /(?:\/static\/|(?<![A-Za-z0-9_])static\/)([^"'`\s)}\\]+)/g
  let match
  while ((match = pattern.exec(source))) {
    let token = match[1].split('?')[0].split('#')[0].replace(/[;,]+$/, '')
    if (!token || token.includes('..')) continue
    if (token.includes('${')) {
      const prefix = token.slice(0, token.indexOf('${'))
      if (prefix) references.push({ type: 'prefix', value: prefix })
    } else {
      references.push({ type: 'exact', value: token })
    }
  }

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
    const inferDirectoryConstants = relativeToRoot(file).startsWith('pages/')
    const references = extractStaticReferences(fs.readFileSync(file, 'utf8'), inferDirectoryConstants)
    for (const reference of references) {
      const target = reference.type === 'exact' ? exact : prefixes
      if (reference.type === 'exact') {
        if (!target.has(reference.value)) target.set(reference.value, [])
        target.get(reference.value).push({ file, packages })
      } else {
        target.push({ ...reference, file, packages })
      }
    }
  }
  return { exact, prefixes }
}

function isRootModule(file) {
  const relative = relativeToRoot(file)
  return relative === 'App.vue' || !relative.startsWith('pages/')
}

function originalDuplicatePath(relative) {
  return relative.replace(/ \d+(?=\.[^.]+$)/, '')
}

function isDuplicateAsset(relative) {
  if (!/ \d+\.[^.]+$/.test(relative)) return false
  const original = path.join(sourceStaticRoot, originalDuplicatePath(relative))
  return fs.existsSync(original) && fs.statSync(original).isFile()
}

function referenceOwners(relative, references) {
  const matching = []
  const exact = references.exact.get(relative)
  if (exact) matching.push(...exact)
  for (const prefix of references.prefixes) {
    if (relative.startsWith(prefix.value)) matching.push(prefix)
  }

  const packages = new Set()
  let rootRequired = false
  for (const reference of matching) {
    if (isRootModule(reference.file)) rootRequired = true
    for (const packageName of reference.packages) packages.add(packageName)
  }
  if (rootRequired || packages.has('main')) return ['main']
  return [...packages].sort()
}

async function optimizeRaster(file) {
  const originalBytes = fs.statSync(file).size
  const extension = path.extname(file).toLowerCase()
  // 350px covers the current mobile content width while keeping the upload
  // package below the DevTools quality threshold after code is included.
  // Re-encode every referenced raster (not only files above 200K), otherwise many
  // just-under-limit originals can still push the main package over 2MB.
  const dimensions = [350, 320, 280, 240]
  const qualities = [40, 36, 32]
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

function addAssignment(assignments, relative, packages) {
  if (!packages.length) return
  assignments.set(relative, packages)
}

function expandPrefixAssignments(assignments, references, allAssets) {
  for (const prefix of references.prefixes) {
    const packageNames = new Set()
    for (const packageName of prefix.packages) {
      if (packageName !== 'main' && packageName !== DEV_PACKAGE_ROOT) packageNames.add(packageName)
    }
    if (!packageNames.size) continue

    for (const relative of allAssets.filter(asset => asset.startsWith(prefix.value))) {
      const owners = assignments.get(relative)
      if (!owners) continue
      assignments.set(relative, [...new Set([...owners, ...packageNames])].sort())
    }
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

function rewritePackageReferences(packageName, assignments, references, allAssets) {
  if (packageName === 'main') return
  const packageRoot = packageDirectory(packageName)
  const exactRules = allAssets
    .filter(relative => {
      const owners = assignments.get(relative) || []
      return owners.includes(packageName)
    })
    .map(relative => relative)
  const prefixRules = buildPrefixRules(assignments, references, packageName, allAssets)
  const rules = [...new Set([...prefixRules, ...exactRules])].sort((a, b) => b.length - a.length)

  for (const file of walkFiles(packageRoot)) {
    if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) continue
    let source = fs.readFileSync(file, 'utf8')
    for (const relative of rules) {
      source = source.split(`/static/${relative}`).join(`/${packageName}/static/${relative}`)
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
  appConfig.subPackages = (appConfig.subPackages || []).filter(item => item.root !== DEV_PACKAGE_ROOT)
  fs.writeFileSync(appConfigPath, `${JSON.stringify(appConfig, null, 2)}\n`)
}

async function main() {
  if (!fs.existsSync(outputRoot)) fail(`编译目录不存在：${outputRoot}`)
  if (!fs.existsSync(sourceStaticRoot)) fail(`静态资源目录不存在：${sourceStaticRoot}`)

  const routes = loadPackageRoutes()
  const modulePackages = collectModulePackages(routes)
  const references = collectStaticReferences(modulePackages)
  const sourceAssets = walkFiles(sourceStaticRoot)
    .map(file => normalizePath(path.relative(sourceStaticRoot, file)))
    .filter(relative => !relative.startsWith(PAW_ICON_BUILD_ONLY_PREFIX))
    .filter(relative => !isDuplicateAsset(relative))

  const assignments = new Map()
  let omitted = 0
  for (const relative of sourceAssets) {
    const owners = referenceOwners(relative, references)
    if (!owners.length) {
      omitted += 1
      continue
    }
    addAssignment(assignments, relative, owners)
  }
  expandPrefixAssignments(assignments, references, sourceAssets)

  fs.rmSync(outputStaticRoot, { recursive: true, force: true })
  for (const packageName of new Set([...assignments.values()].flat())) {
    fs.rmSync(path.join(packageDirectory(packageName), 'static'), { recursive: true, force: true })
  }

  let copied = 0
  let optimized = 0
  let copiedBytes = 0
  const contentCache = new Map()
  for (const [relative, owners] of assignments) {
    const sourceFile = path.join(sourceStaticRoot, relative)
    const extension = path.extname(relative).toLowerCase()
    let optimizedAsset = null
    if (RASTER_EXTENSIONS.has(extension)) optimizedAsset = await optimizeRaster(sourceFile)
    for (const packageName of owners) {
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
    }
  }

  // PawIcon Lab remains available in dev builds, but must not ship in the
  // production upload package or pull its audit-only metrics into the main package.
  removeDevelopmentArtifacts()

  const packageRoots = [...new Set([...routes.values()].filter(packageName => packageName !== 'main' && packageName !== DEV_PACKAGE_ROOT))]
  for (const packageName of packageRoots) rewritePackageReferences(packageName, assignments, references, sourceAssets)

  const mainBytes = sumPackage('main', packageRoots)
  const packageSizes = Object.fromEntries(packageRoots.map(packageName => [packageName, sumPackage(packageName, packageRoots)]))
  console.log(`[PawHome] prepared upload package: copied=${copied}, optimized=${optimized}, omitted=${omitted}, staticBytes=${formatSize(copiedBytes)}`)
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
}

main().catch(error => {
  console.error(error.stack || error.message)
  process.exitCode = 1
})
