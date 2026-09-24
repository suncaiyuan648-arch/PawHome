#!/usr/bin/env node

/*
 * Build the repository Figma state index.
 *
 * The YAML map is the only source for exact Figma node IDs and state names.
 * pages.json is used only to validate that a mapped runtime route is registered
 * in this checkout. This script deliberately does not read screenshot metrics,
 * exported CSVs, or an adjacent checkout.
 */

const fs = require('fs')
const path = require('path')
const JSON5 = require('json5')
const YAML = require('yaml')

const repoRoot = path.resolve(__dirname, '..')
const mapPath = path.join(repoRoot, 'docs', 'design', 'figma-map.yaml')
const pagesPath = path.join(repoRoot, 'pages.json')
const reportDir = path.join(repoRoot, '.artifacts', 'architecture-governance')
const markdownPath = path.join(reportDir, 'figma-state-matrix.md')
const jsonPath = path.join(reportDir, 'figma-state-matrix.json')

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function routeFromPageEntry(root, pagePath) {
  const normalizedRoot = String(root || '').replace(/^\/+|\/+$/g, '')
  const normalizedPage = String(pagePath || '').replace(/^\/+/, '')
  return `/${[normalizedRoot, normalizedPage].filter(Boolean).join('/')}`
}

function readRegisteredRoutes(pagesConfig) {
  const routes = new Set()
  const add = (root, item) => {
    if (!item || typeof item.path !== 'string') return
    routes.add(routeFromPageEntry(root, item.path))
  }
  for (const item of Array.isArray(pagesConfig.pages) ? pagesConfig.pages : []) add('', item)
  const subPackages = Array.isArray(pagesConfig.subPackages)
    ? pagesConfig.subPackages
    : Array.isArray(pagesConfig.subpackages)
      ? pagesConfig.subpackages
      : []
  for (const pack of subPackages) {
    if (!pack || typeof pack !== 'object') continue
    for (const item of Array.isArray(pack.pages) ? pack.pages : []) add(pack.root, item)
  }
  return routes
}

function validateQuery(query, context) {
  const errors = []
  if (query === undefined) return errors
  if (!isPlainObject(query)) {
    return [{ code: 'invalid-query', message: `${context}: query must be a plain object` }]
  }
  for (const [key, value] of Object.entries(query)) {
    if (!key || /[&#=?]/.test(key)) {
      errors.push({ code: 'invalid-query', message: `${context}: query key is invalid: ${key}` })
    }
    const validScalar = value === null || ['string', 'number', 'boolean'].includes(typeof value)
    if (!validScalar || (typeof value === 'number' && !Number.isFinite(value))) {
      errors.push({
        code: 'invalid-query',
        message: `${context}: query value for ${key} must be a scalar`,
      })
    }
  }
  return errors
}

function buildTargetUrl(route, query) {
  const params = Object.entries(query || {})
  if (!params.length) return route
  return `${route}?${params.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value === null ? '' : String(value))}`).join('&')}`
}

function validateRoute(route, registeredRoutes, context) {
  const errors = []
  if (typeof route !== 'string' || !route) {
    errors.push({ code: 'missing-route', message: `${context}: route is required` })
    return errors
  }
  if (!route.startsWith('/'))
    errors.push({ code: 'invalid-route', message: `${context}: route must start with /` })
  if (
    route.includes('?') ||
    route.includes('#') ||
    route.includes('//') ||
    route.includes('..') ||
    route.includes('\\')
  ) {
    errors.push({
      code: 'invalid-route',
      message: `${context}: route must be a path without query/hash: ${route}`,
    })
  }
  if (!/^\/(?:pages|packages)\/[A-Za-z0-9._~!$'()*+,;=:@%/-]+$/.test(route)) {
    errors.push({
      code: 'invalid-route',
      message: `${context}: route is outside pages/packages namespaces: ${route}`,
    })
  } else if (!registeredRoutes.has(route)) {
    errors.push({
      code: 'invalid-route',
      message: `${context}: route is not registered by pages.json: ${route}`,
    })
  }
  return errors
}

function validateSource(source, context) {
  const errors = []
  if (typeof source !== 'string' || !source) {
    errors.push({ code: 'missing-source', message: `${context}: source is required` })
    return errors
  }
  if (
    source.startsWith('/') ||
    source.includes('..') ||
    source.includes('\\') ||
    !source.endsWith('.vue')
  ) {
    errors.push({
      code: 'invalid-source',
      message: `${context}: source must be a repository-relative .vue path: ${source}`,
    })
    return errors
  }
  const absoluteSource = path.resolve(repoRoot, source)
  if (absoluteSource !== path.join(repoRoot, source) || !fs.existsSync(absoluteSource)) {
    errors.push({
      code: 'invalid-source',
      message: `${context}: source file does not exist: ${source}`,
    })
  }
  return errors
}

function validateRouteSourcePair(route, source, context) {
  if (typeof route !== 'string' || typeof source !== 'string') return []
  if (
    !/^\/(?:pages|packages)\/[A-Za-z0-9._~!$'()*+,;=:@%/-]+$/.test(route) ||
    route.includes('..') ||
    route.includes('\\')
  )
    return []
  const expectedSource = `${route.slice(1)}.vue`
  if (source !== expectedSource) {
    return [
      {
        code: 'source-route-mismatch',
        message: `${context}: source must match the registered route path (${expectedSource}), got ${source}`,
      },
    ]
  }
  return []
}

function makeEntry(pageKey, page, stateKey, state, registeredRoutes, figma = {}, migration = null) {
  const context = `pages.${pageKey}.states.${stateKey}`
  const pageObject = isPlainObject(page) ? page : {}
  const stateObject = isPlainObject(state) ? state : {}
  const route = hasOwn(stateObject, 'route') ? stateObject.route : pageObject.route
  const source = hasOwn(stateObject, 'source') ? stateObject.source : pageObject.source
  const query = hasOwn(stateObject, 'query') ? stateObject.query : {}
  const runtime = hasOwn(stateObject, 'runtime') ? stateObject.runtime : null
  const nodeId = stateObject.node_id
  const fileKey = stateObject.file_key || figma.file_key || null
  const designStatus = stateObject.mapping_status || 'not-checked'
  const errors = []

  if (!isPlainObject(state)) {
    errors.push({ code: 'invalid-state', message: `${context}: state must be a plain object` })
  }
  if (typeof nodeId !== 'string' || !/^\d+:\d+$/.test(nodeId)) {
    errors.push({
      code: 'missing-node',
      message: `${context}: node_id must be an exact Figma node ID in <page>:<node> form`,
    })
  }
  errors.push(...validateRoute(route, registeredRoutes, context))
  errors.push(...validateSource(source, context))
  errors.push(...validateRouteSourcePair(route, source, context))
  errors.push(...validateQuery(query, context))
  if (runtime !== null && !isPlainObject(runtime)) {
    errors.push({ code: 'invalid-runtime', message: `${context}: runtime must be a plain object` })
  }
  if (migration && stateObject.legacy_node_id) {
    const reference = migration.entries.find(
      (item) => item.old_node_id === stateObject.legacy_node_id,
    )
    const retained = reference && reference.status === 'retained-legacy'
    if (
      !reference ||
      nodeId !== (retained ? reference.old_node_id : reference.new_node_id) ||
      fileKey !== (retained ? migration.old_file_key : migration.new_file_key) ||
      designStatus !== (retained ? 'retained-legacy' : 'verified-metadata')
    ) {
      errors.push({
        code: 'figma-provenance-mismatch',
        message: `${context}: file_key/node_id/mapping_status disagree with the reviewed migration manifest`,
      })
    }
  }

  const status = errors.length ? errors[0].code : 'mapped'
  return {
    pageKey,
    pageName: typeof pageObject.name === 'string' ? pageObject.name : pageKey,
    stateKey,
    name: typeof stateObject.name === 'string' ? stateObject.name : stateKey,
    nodeId: typeof nodeId === 'string' ? nodeId : null,
    fileKey,
    figmaUrl:
      fileKey && typeof nodeId === 'string'
        ? `https://www.figma.com/design/${encodeURIComponent(fileKey)}?node-id=${nodeId.replace(':', '-')}`
        : null,
    designStatus,
    designNote: stateObject.mapping_note || 'Live design correspondence has not been recorded.',
    route: typeof route === 'string' ? route : null,
    source: typeof source === 'string' ? source : null,
    query: isPlainObject(query) ? query : null,
    targetUrl:
      typeof route === 'string' && isPlainObject(query) ? buildTargetUrl(route, query) : null,
    routeOrigin: hasOwn(stateObject, 'route') ? 'state' : 'page',
    sourceOrigin: hasOwn(stateObject, 'source') ? 'state' : 'page',
    runtimeStatus:
      isPlainObject(runtime) && typeof runtime.status === 'string' ? runtime.status : 'not-checked',
    runtimeReason:
      isPlainObject(runtime) && typeof runtime.reason === 'string'
        ? runtime.reason
        : 'Route/source mapping only; runtime state was not executed.',
    status,
    errors,
  }
}

function buildReport() {
  const map = YAML.parse(readText(mapPath))
  const pagesConfig = JSON5.parse(readText(pagesPath))
  if (!isPlainObject(map) || !isPlainObject(map.pages)) {
    throw new Error('figma-map.yaml must contain a pages object')
  }
  if (!isPlainObject(pagesConfig)) throw new Error('pages.json must contain an object')

  const registeredRoutes = readRegisteredRoutes(pagesConfig)
  const figma = isPlainObject(map.figma) ? map.figma : {}
  let migration = null
  if (figma.migration_manifest) {
    const manifestPath = figma.migration_manifest
    if (
      typeof manifestPath !== 'string' ||
      path.isAbsolute(manifestPath) ||
      manifestPath.split(/[\\/]/).includes('..')
    ) {
      throw new Error('migration_manifest must be a repository-relative path')
    }
    migration = JSON.parse(readText(path.join(repoRoot, manifestPath)))
    if (!Array.isArray(migration.entries) || migration.new_file_key !== figma.file_key)
      throw new Error('Invalid Figma migration manifest')
  }
  const entries = []
  const componentNodes = []
  for (const [pageKey, page] of Object.entries(map.pages)) {
    if (!isPlainObject(page)) {
      entries.push(makeEntry(pageKey, page, '<page>', page, registeredRoutes, figma, migration))
      continue
    }
    if (isPlainObject(page.component_nodes)) {
      for (const [key, reference] of Object.entries(page.component_nodes)) {
        componentNodes.push({
          pageKey,
          key,
          nodeId: isPlainObject(reference) ? reference.node_id || null : reference,
          fileKey: isPlainObject(reference)
            ? reference.file_key || figma.file_key || null
            : figma.file_key || null,
          reference,
        })
      }
    }
    if (!isPlainObject(page.states)) {
      entries.push(
        makeEntry(pageKey, page, '<states>', page.states, registeredRoutes, figma, migration),
      )
      continue
    }
    for (const [stateKey, state] of Object.entries(page.states)) {
      entries.push(makeEntry(pageKey, page, stateKey, state, registeredRoutes, figma, migration))
    }
  }

  const unresolvedDesignStates = isPlainObject(map.unresolved_design_states)
    ? Object.entries(map.unresolved_design_states).map(([key, state]) => ({
        stateKey: key,
        name: isPlainObject(state) && typeof state.name === 'string' ? state.name : key,
        nodeId: isPlainObject(state) && typeof state.node_id === 'string' ? state.node_id : null,
        status: 'unresolved',
        reason: 'listed outside pages.states; route/source intentionally not assigned',
      }))
    : []

  const errors = entries.flatMap((entry) =>
    entry.errors.map((error) => ({
      pageKey: entry.pageKey,
      stateKey: entry.stateKey,
      ...error,
    })),
  )
  const counts = {
    formalPages: Object.keys(map.pages).length,
    formalStates: entries.length,
    mapped: entries.filter((entry) => entry.status === 'mapped').length,
    invalid: entries.filter((entry) => entry.status !== 'mapped').length,
    unresolvedDesignStates: unresolvedDesignStates.length,
    componentNodes: componentNodes.length,
    registeredRoutes: registeredRoutes.size,
  }

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sourceOfTruth: {
      map: path.relative(repoRoot, mapPath),
      pages: path.relative(repoRoot, pagesPath),
      exactNodeSource: path.relative(repoRoot, mapPath),
    },
    scope: {
      description:
        'Only entries under pages.*.states are included. This is a route/node mapping report, not a visual verification report.',
      excludedUnresolvedDesignStates: unresolvedDesignStates,
      excludedComponentNodes: componentNodes,
    },
    counts,
    designCounts: {
      verifiedMetadata: entries.filter((entry) => entry.designStatus === 'verified-metadata')
        .length,
      retainedLegacy: entries.filter((entry) => entry.designStatus === 'retained-legacy').length,
      notChecked: entries.filter(
        (entry) => !['verified-metadata', 'retained-legacy'].includes(entry.designStatus),
      ).length,
    },
    errors,
    entries,
  }
}

function markdownEscape(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')
}

function renderMarkdown(report) {
  const lines = [
    '# Figma 状态与现存源码路由矩阵',
    '',
    `生成时间：${report.generatedAt}`,
    '',
    report.status ? `运行状态：${report.status}` : '运行状态：ok',
    '',
    `来源：\`${report.sourceOfTruth.map}\`（精确 node_id 唯一来源）；运行时注册校验：\`${report.sourceOfTruth.pages}\`。`,
    '',
    '> 本报告只覆盖 `pages.*.states` 中已正式登记的状态，记录节点、现存路由、源码和 query 合同。它不读取外部 CSV/metrics，也不把节点存在或路由可达当作视觉验收结论。',
    '',
    `范围：${report.counts.formalPages} 个正式页面、${report.counts.formalStates} 个正式状态；mapped ${report.counts.mapped}，invalid ${report.counts.invalid}；另有 ${report.counts.unresolvedDesignStates} 个 unresolved 设计状态未映射，${report.counts.componentNodes} 个 component node 未作为页面状态。`,
    '',
    `设计对应：元数据已核对 ${report.designCounts?.verifiedMetadata || 0}；保留旧稿 ${report.designCounts?.retainedLegacy || 0}；未核对 ${report.designCounts?.notChecked || 0}。mapped 仅表示本地路由/来源有效，不代表新稿全部覆盖。`,
    '',
    '| 页面 | 状态 | Figma node | route | source | query | 映射状态 | 运行前置 | 设计对应 |',
    '|---|---|---|---|---|---|---|---|---|',
  ]
  for (const entry of report.entries) {
    const query = entry.query === null ? '—' : JSON.stringify(entry.query)
    const node = entry.figmaUrl
      ? `[${entry.nodeId}](${entry.figmaUrl})`
      : entry.nodeId
        ? `\`${entry.nodeId}\``
        : '—'
    lines.push(
      `| ${markdownEscape(entry.pageName)} | ${markdownEscape(entry.name)} (${markdownEscape(entry.stateKey)}) | ${node} | ${entry.targetUrl ? `\`${markdownEscape(entry.targetUrl)}\`` : '—'} | ${entry.source ? `\`${markdownEscape(entry.source)}\`` : '—'} | ${markdownEscape(query)} | ${entry.status} | ${markdownEscape(entry.runtimeStatus)}：${markdownEscape(entry.runtimeReason)} | ${markdownEscape(entry.designStatus)} |`,
    )
  }
  if (report.errors.length) {
    lines.push('', '## Invalid entries', '', '| 页面 | 状态 | code | 说明 |', '|---|---|---|---|')
    for (const error of report.errors)
      lines.push(
        `| ${markdownEscape(error.pageKey)} | ${markdownEscape(error.stateKey)} | ${error.code} | ${markdownEscape(error.message)} |`,
      )
  }
  if (report.scope.excludedUnresolvedDesignStates.length) {
    lines.push('', '## Unresolved design states', '', '| 状态 | node | 处理 |', '|---|---|---|')
    for (const state of report.scope.excludedUnresolvedDesignStates)
      lines.push(
        `| ${markdownEscape(state.name)} (${markdownEscape(state.stateKey)}) | ${state.nodeId ? `\`${state.nodeId}\`` : '—'} | ${markdownEscape(state.reason)} |`,
      )
  }
  lines.push('')
  return lines.join('\n')
}

function writeReport(report) {
  fs.mkdirSync(reportDir, { recursive: true })
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  fs.writeFileSync(markdownPath, renderMarkdown(report), 'utf8')
}

function writeFailureReport(error) {
  const message = error && error.message ? error.message : String(error)
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: 'error',
    sourceOfTruth: {
      map: path.relative(repoRoot, mapPath),
      pages: path.relative(repoRoot, pagesPath),
      exactNodeSource: path.relative(repoRoot, mapPath),
    },
    scope: {
      description: 'Input parsing failed; no formal state entries are available.',
      excludedUnresolvedDesignStates: [],
      excludedComponentNodes: [],
    },
    counts: {
      formalPages: 0,
      formalStates: 0,
      mapped: 0,
      invalid: 0,
      unresolvedDesignStates: 0,
      componentNodes: 0,
      registeredRoutes: 0,
    },
    errors: [{ code: 'input-error', message }],
    entries: [],
  }
  writeReport(report)
}

function main() {
  try {
    const report = buildReport()
    writeReport(report)
    if (report.errors.length) {
      console.error(
        `figma-state-matrix: wrote reports with ${report.errors.length} invalid mapping error(s)`,
      )
      process.exitCode = 1
      return
    }
    console.log(
      `figma-state-matrix: wrote ${path.relative(repoRoot, markdownPath)} and ${path.relative(repoRoot, jsonPath)} (${report.entries.length} formal states)`,
    )
  } catch (error) {
    try {
      writeFailureReport(error)
    } catch (writeError) {
      console.error(
        `figma-state-matrix: unable to write failure report: ${writeError && writeError.message ? writeError.message : writeError}`,
      )
    }
    console.error(`figma-state-matrix: ${error && error.message ? error.message : error}`)
    process.exitCode = 1
  }
}

if (require.main === module) main()

module.exports = {
  buildReport,
  renderMarkdown,
  readRegisteredRoutes,
  validateQuery,
}
