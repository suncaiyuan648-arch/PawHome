'use strict'

const fs = require('fs')
const path = require('path')
const JSON5 = require('json5')
const YAML = require('yaml')

const TAB_ROUTES = [
  '/pages/index/index',
  '/pages/selfRun/index',
  '/pages/message/index',
  '/pages/me/index'
]

const DEFAULT_QA_FILES = [
  'docs/design/figma-map.yaml',
  '.artifacts/architecture-governance/figma-state-matrix.json',
  '.artifacts/architecture-governance/figma-state-matrix.md'
]

function projectRoot(explicitRoot) {
  return path.resolve(explicitRoot || process.env.PAWHOME_PROJECT_ROOT || path.resolve(__dirname, '..', '..'))
}

function readJson5(file) {
  return JSON5.parse(fs.readFileSync(file, 'utf8'))
}

function normalizeRoute(value) {
  if (typeof value !== 'string') return null
  const raw = value.trim()
  if (!raw || raw.includes('\\') || /[?#]/.test(raw)) return null
  const clean = raw.replace(/^\/+/, '')
  const segments = clean.split('/')
  if (!clean || segments.some(segment => !segment || segment === '.' || segment === '..')) return null
  return `/${clean}`
}

function routeFile(root, route) {
  return path.join(root, `${route.slice(1)}.vue`)
}

function addIssue(issues, code, message, detail) {
  issues.push({ code, message, detail })
}

function validatePathField(value, label, issues) {
  if (typeof value !== 'string' || !value.trim()) {
    addIssue(issues, 'invalid-route-path', `${label} must be a non-empty relative path`, value)
    return null
  }
  const trimmed = value.trim()
  const segments = trimmed.split('/')
  if (
    trimmed.startsWith('/') ||
    trimmed.endsWith('/') ||
    trimmed.includes('\\') ||
    /[?#]/.test(trimmed) ||
    segments.some(segment => !segment || segment === '.' || segment === '..')
  ) {
    addIssue(issues, 'invalid-route-path', `${label} must be relative and must not contain parent traversal`, value)
    return null
  }
  return normalizeRoute(value)
}

function registeredRoutes(config, issues) {
  const routes = []
  const roots = []
  const addRoute = (route, source) => {
    if (!route) return
    const previous = routes.find(item => item.route === route)
    if (previous) {
      addIssue(issues, 'duplicate-route', `duplicate registered route: ${route}`, `${previous.source}; ${source}`)
      return
    }
    routes.push({ route, source })
  }

  if (!config || !Array.isArray(config.pages)) {
    addIssue(issues, 'invalid-pages-config', 'pages.json must contain a pages array')
  } else {
    config.pages.forEach((page, index) => {
      const pagePath = validatePathField(page && page.path, `pages[${index}].path`, issues)
      addRoute(pagePath, `pages[${index}]`)
    })
  }

  const packageLists = []
  if (config && config.subPackages !== undefined && config.subpackages !== undefined) {
    addIssue(issues, 'ambiguous-subpackages-config', 'use only one of subPackages or subpackages; the compiler does not merge both arrays')
  }
  for (const key of ['subPackages', 'subpackages']) {
    if (config && config[key] !== undefined && !Array.isArray(config[key])) {
      addIssue(issues, 'invalid-subpackages-config', `pages.json ${key} must be an array`)
    } else if (config && Array.isArray(config[key])) {
      packageLists.push({ key, entries: config[key] })
    }
  }

  for (const { key, entries } of packageLists) for (const [packageIndex, pack] of entries.entries()) {
    const packageLabel = `${key}[${packageIndex}]`
    const root = validatePathField(pack && pack.root, `${packageLabel}.root`, issues)
    if (root) {
      if (roots.includes(root)) addIssue(issues, 'duplicate-package-root', `duplicate sub-package root: ${root}`, packageLabel)
      roots.push(root)
      for (const other of roots.slice(0, -1)) {
        if (root.startsWith(`${other}/`) || other.startsWith(`${root}/`)) {
          addIssue(issues, 'nested-package-root', `nested sub-package roots are not allowed: ${other} and ${root}`)
        }
      }
    }
    if (!Array.isArray(pack && pack.pages)) {
      addIssue(issues, 'invalid-subpackage-pages', `${packageLabel}.pages must be an array`)
      continue
    }
    for (const [pageIndex, page] of pack.pages.entries()) {
      const pagePath = validatePathField(page && page.path, `${packageLabel}.pages[${pageIndex}].path`, issues)
      if (root && pagePath) addRoute(`${root}${pagePath}`, `${packageLabel}.pages[${pageIndex}]`)
    }
  }

  for (const mainPage of routes.filter(item => item.source.startsWith('pages['))) {
    for (const root of roots) {
      if (mainPage.route === root || mainPage.route.startsWith(`${root}/`)) {
        addIssue(issues, 'main-page-under-subpackage-root', `main package page is inside a sub-package root: ${mainPage.route}`, root)
      }
    }
  }

  const tabList = config && config.tabBar && config.tabBar.list
  if (!Array.isArray(tabList)) {
    addIssue(issues, 'invalid-tabbar-list', 'pages.json tabBar.list must be an array containing the four Tab routes')
  } else {
    const tabRoutes = []
    for (const [index, item] of tabList.entries()) {
      const tabRoute = validatePathField(item && item.pagePath, `tabBar.list[${index}].pagePath`, issues)
      if (tabRoute) tabRoutes.push(tabRoute)
      const registeredTab = routes.find(route => route.route === tabRoute)
      if (tabRoute && !registeredTab) addIssue(issues, 'tab-not-registered', `tabBar.list route is not registered: ${tabRoute}`)
      else if (registeredTab && !registeredTab.source.startsWith('pages[')) addIssue(issues, 'tab-not-main-package', `tabBar.list route must be in the main package: ${tabRoute}`, registeredTab.source)
    }
    if (tabRoutes.length !== TAB_ROUTES.length) {
      addIssue(issues, 'tabbar-count', `tabBar.list must contain exactly ${TAB_ROUTES.length} entries`, `${tabRoutes.length}`)
    }
    const expected = new Set(TAB_ROUTES)
    for (const route of TAB_ROUTES) if (!tabRoutes.includes(route)) addIssue(issues, 'tabbar-contract', `tabBar.list is missing the required four-Tab route: ${route}`)
    for (const route of tabRoutes) if (!expected.has(route)) addIssue(issues, 'tabbar-contract', `tabBar.list contains an unapproved Tab route: ${route}`)
  }

  return { routes, roots }
}

function walk(dir, predicate, output = []) {
  if (!fs.existsSync(dir)) return output
  const stat = fs.statSync(dir)
  if (stat.isFile()) {
    if (!predicate || predicate(dir)) output.push(dir)
    return output
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(target, predicate, output)
    else if (!predicate || predicate(target)) output.push(target)
  }
  return output
}

function discoverSourcePages(root) {
  const files = []
  const pagesRoot = path.join(root, 'pages')
  // `components` is a reserved private-composition directory in legacy packages.
  walk(pagesRoot, file => path.extname(file) === '.vue'
    && !path.relative(pagesRoot, file).split(path.sep).includes('components'), files)
  const packagesRoot = path.join(root, 'packages')
  walk(packagesRoot, file => {
    if (path.extname(file) !== '.vue') return false
    const relative = path.relative(packagesRoot, file).split(path.sep)
    // packages may contain components, fixtures and services. Only a literal
    // `pages` subtree is a page source; package-level components are excluded.
    return relative.includes('pages') && !relative.includes('components')
  }, files)
  return files.map(file => ({
    file,
    route: `/${path.relative(root, file).replaceAll(path.sep, '/').replace(/\.vue$/, '')}`
  })).sort((left, right) => left.route.localeCompare(right.route))
}

function extractQaRoutes(text, file) {
  const routes = []
  const seen = new Set()
  const add = value => {
    const route = normalizeRoute(value)
    if (route && !seen.has(route)) {
      seen.add(route)
      routes.push({ route, file })
    }
  }

  if (/\.yaml$/.test(file)) {
    let value
    try {
      value = YAML.parse(text)
    } catch (error) {
      routes.push({ error: `invalid QA matrix YAML: ${error.message}`, file })
      return routes
    }
    const visit = (node, parentKey = '', inactiveParent = false) => {
      if (!node || typeof node !== 'object') return
      const status = String(node.status || node.state || node.lifecycle || '').toLowerCase()
      const inactive = inactiveParent || node.active === false || /^(?:planned|unresolved|pending|not[-_ ]implemented)$/.test(status) || /(?:planned|unresolved|pending)/i.test(parentKey)
      if (Object.prototype.hasOwnProperty.call(node, 'route')) {
        if (!inactive && typeof node.route !== 'string') {
          routes.push({ error: `active QA matrix route must be a string: ${String(node.route)}`, file })
        } else if (!inactive) {
          add(node.route)
        }
      }
      for (const [key, child] of Object.entries(node)) visit(child, key, inactive)
    }
    visit(value)
  } else if (/\.json$/.test(file)) {
    try {
      const value = JSON.parse(text)
      const visit = (node, parentKey = '', inactiveParent = false) => {
        if (!node || typeof node !== 'object') return
        const status = String(node.status || node.state || node.lifecycle || '').toLowerCase()
        const inactive = inactiveParent || node.active === false || /^(?:planned|unresolved|pending|not[-_ ]implemented)$/.test(status) || /(?:planned|unresolved|pending)/i.test(parentKey)
        if (typeof node.route === 'string' && !inactive) add(node.route)
        for (const [key, child] of Object.entries(node)) visit(child, key, inactive)
      }
      visit(value)
    } catch (error) {
      routes.push({ error: `invalid QA matrix JSON: ${error.message}`, file })
    }
  } else {
    for (const match of text.matchAll(/`(\/(?:[^`?\s]+))(?:(?:\?)[^`]*)?`/g)) add(match[1])
  }
  return routes
}

function qaRoutes(root, qaFiles = DEFAULT_QA_FILES, required = false) {
  const files = []
  const routes = []
  for (const relative of qaFiles) {
    const file = path.join(root, relative)
    if (!fs.existsSync(file)) {
      if (required) routes.push({ error: `QA matrix file was not found: ${relative}`, file: relative })
      continue
    }
    files.push(relative)
    routes.push(...extractQaRoutes(fs.readFileSync(file, 'utf8'), relative))
  }
  return { files, routes }
}

function checkPageRoutes(options = {}) {
  const root = projectRoot(options.root)
  const issues = []
  const pagesPath = path.join(root, 'pages.json')
  if (!fs.existsSync(pagesPath)) {
    addIssue(issues, 'missing-pages-config', 'pages.json was not found', pagesPath)
    return { root, issues, registered: [], actual: [], qa: { files: [], routes: [] } }
  }

  let config
  try {
    config = readJson5(pagesPath)
  } catch (error) {
    addIssue(issues, 'invalid-pages-config', `cannot parse pages.json as JSON5: ${error.message}`, pagesPath)
    return { root, issues, registered: [], actual: [], qa: { files: [], routes: [] } }
  }

  const { routes: registered, roots } = registeredRoutes(config, issues)
  const registeredSet = new Set(registered.map(item => item.route))
  const actual = discoverSourcePages(root)
  const actualSet = new Set(actual.map(item => item.route))

  for (const item of registered) {
    const file = routeFile(root, item.route)
    if (!fs.existsSync(file)) addIssue(issues, 'missing-page-file', `registered route has no page file: ${item.route}`, file)
  }
  for (const item of actual) {
    if (!registeredSet.has(item.route)) addIssue(issues, 'unregistered-page-file', `page file is not registered: ${item.route}`, path.relative(root, item.file))
  }

  for (const route of TAB_ROUTES) {
    const entry = registered.find(item => item.route === route)
    if (!entry) addIssue(issues, 'tab-not-registered', `required four-Tab route is missing from pages.json: ${route}`)
    else if (!entry.source.startsWith('pages[')) addIssue(issues, 'tab-not-main-package', `four-Tab route must be in the main pages array: ${route}`, entry.source)
  }

  const qa = qaRoutes(root, options.qaFiles || DEFAULT_QA_FILES, Boolean(options.requireQaFiles))
  for (const item of qa.routes) {
    if (item.error) addIssue(issues, 'invalid-qa-matrix', item.error, item.file)
    else if (!registeredSet.has(item.route)) addIssue(issues, 'qa-route-not-registered', `active QA matrix route is not registered: ${item.route}`, item.file)
  }

  return { root, issues, registered, actual, roots, qa, actualSet }
}

function formatResult(result) {
  if (!result.issues.length) {
    const qaLabel = result.qa.files.length ? result.qa.files.join(', ') : 'none present'
    return `route check passed: ${result.registered.length} registered pages; ${result.actual.length} source pages; active QA routes checked from ${qaLabel}`
  }
  return result.issues.map(issue => `[${issue.code}] ${issue.message}${issue.detail ? ` (${issue.detail})` : ''}`).join('\n')
}

module.exports = {
  DEFAULT_QA_FILES,
  TAB_ROUTES,
  checkPageRoutes,
  discoverSourcePages,
  extractQaRoutes,
  formatResult,
  normalizeRoute,
  projectRoot,
  readJson5,
  registeredRoutes,
  routeFile,
  walk
}
