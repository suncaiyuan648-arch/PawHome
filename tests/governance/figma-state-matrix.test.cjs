const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const test = require('node:test')

const repoRoot = path.resolve(__dirname, '../..')
const scriptSource = path.join(repoRoot, 'scripts', 'build-figma-state-matrix.cjs')
const dependencyRoot = path.dirname(path.dirname(require.resolve('yaml')))

test('keeps reviewed file/node pairs and legacy design exceptions separate from route PASS', () => {
  const fixture = writeFixture({
    pages: '{ pages: [{ path: "pages/home/index" }] }',
    sources: ['pages/home/index.vue'],
    map: `schema_version: 1
figma:
  file_key: newFile
  migration_manifest: docs/design/migration.json
pages:
  home:
    route: /pages/home/index
    source: pages/home/index.vue
    states:
      current:
        node_id: '83:1'
        file_key: newFile
        legacy_node_id: '62:1'
        mapping_status: verified-metadata
      legacy:
        node_id: '62:2'
        file_key: oldFile
        legacy_node_id: '62:2'
        mapping_status: retained-legacy
    component_nodes:
      sample:
        node_id: '83:3'
        file_key: newFile
`,
  })
  fs.writeFileSync(
    path.join(fixture.root, 'docs/design/migration.json'),
    JSON.stringify({
      old_file_key: 'oldFile',
      new_file_key: 'newFile',
      entries: [
        { old_node_id: '62:1', new_node_id: '83:1', status: 'mapped' },
        { old_node_id: '62:2', new_node_id: null, status: 'retained-legacy' },
      ],
    }),
  )
  const result = runFixture(fixture)
  assert.equal(result.status, 0, result.stderr)
  const report = readReport(fixture)
  assert.deepEqual(report.designCounts, { verifiedMetadata: 1, retainedLegacy: 1, notChecked: 0 })
  assert.equal(report.entries[1].status, 'mapped')
  assert.equal(report.entries[1].figmaUrl, 'https://www.figma.com/design/oldFile?node-id=62-2')
  assert.equal(report.scope.excludedComponentNodes[0].nodeId, '83:3')
  const mapFile = path.join(fixture.root, 'docs/design/figma-map.yaml')
  fs.writeFileSync(
    mapFile,
    fs.readFileSync(mapFile, 'utf8').replace('file_key: oldFile', 'file_key: newFile'),
  )
  assert.equal(runFixture(fixture).status, 1)
  assert.ok(readReport(fixture).errors.some((error) => error.code === 'figma-provenance-mismatch'))
})

function writeFixture({ map, pages, sources = [] }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pawhome-figma-matrix-'))
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true })
  fs.mkdirSync(path.join(root, 'docs', 'design'), { recursive: true })
  fs.copyFileSync(scriptSource, path.join(root, 'scripts', 'build-figma-state-matrix.cjs'))
  fs.writeFileSync(path.join(root, 'docs', 'design', 'figma-map.yaml'), map)
  fs.writeFileSync(path.join(root, 'pages.json'), pages)
  for (const source of sources) {
    const target = path.join(root, source)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, '<template><view /></template>\n')
  }
  const caller = path.join(root, 'outside-cwd')
  fs.mkdirSync(caller)
  return { root, caller, script: path.join(root, 'scripts', 'build-figma-state-matrix.cjs') }
}

function runFixture(fixture) {
  return spawnSync(process.execPath, [fixture.script], {
    cwd: fixture.caller,
    encoding: 'utf8',
    env: { ...process.env, NODE_PATH: dependencyRoot },
  })
}

function readReport(fixture) {
  return JSON.parse(
    fs.readFileSync(
      path.join(fixture.root, '.artifacts', 'architecture-governance', 'figma-state-matrix.json'),
      'utf8',
    ),
  )
}

test('uses the in-repository map and JSON5 pages from an unrelated cwd', () => {
  const fixture = writeFixture({
    pages: `{
      // JSON5 comments must be accepted.
      "pages": [{ "path": "pages/home/index" }],
      "subpackages": [{ "root": "packages/rescue/pages", "pages": [{ "path": "apply/index" }] }]
    }`,
    map: `schema_version: 1
pages:
  home:
    name: "Home"
    route: "/pages/home/index"
    source: "pages/home/index.vue"
    states:
      inherited:
        name: "Inherited"
        node_id: "1:2"
      overridden:
        name: "Override"
        node_id: "1:3"
        route: "/packages/rescue/pages/apply/index"
        source: "packages/rescue/pages/apply/index.vue"
        query:
          label: "中文值"
        runtime:
          status: "fixture-required"
          reason: "temporary fixture for runtime reachability"
    component_nodes:
      icon: "9:9"
unresolved_design_states:
  future:
    name: "Future state"
    node_id: "8:8"
`,
    sources: ['pages/home/index.vue', 'packages/rescue/pages/apply/index.vue'],
  })
  const result = runFixture(fixture)
  assert.equal(result.status, 0, result.stderr)
  const report = readReport(fixture)
  assert.deepEqual(report.counts, {
    formalPages: 1,
    formalStates: 2,
    mapped: 2,
    invalid: 0,
    unresolvedDesignStates: 1,
    componentNodes: 1,
    registeredRoutes: 2,
  })
  const inherited = report.entries.find((entry) => entry.stateKey === 'inherited')
  const overridden = report.entries.find((entry) => entry.stateKey === 'overridden')
  assert.equal(inherited.routeOrigin, 'page')
  assert.equal(inherited.sourceOrigin, 'page')
  assert.equal(inherited.targetUrl, '/pages/home/index')
  assert.equal(overridden.routeOrigin, 'state')
  assert.equal(overridden.sourceOrigin, 'state')
  assert.equal(
    overridden.targetUrl,
    '/packages/rescue/pages/apply/index?label=%E4%B8%AD%E6%96%87%E5%80%BC',
  )
  assert.equal(inherited.runtimeStatus, 'not-checked')
  assert.equal(overridden.runtimeStatus, 'fixture-required')
  assert.equal(overridden.runtimeReason, 'temporary fixture for runtime reachability')
  assert.equal(report.scope.excludedUnresolvedDesignStates[0].status, 'unresolved')
  const markdown = fs.readFileSync(
    path.join(fixture.root, '.artifacts', 'architecture-governance', 'figma-state-matrix.md'),
    'utf8',
  )
  assert.match(markdown, /unresolved/i)
  assert.doesNotMatch(markdown, /PASS/i)
  assert.doesNotMatch(JSON.stringify(report), /route-mapping-seed|visual-audit|PawHome/)
})

test('reports missing nodes and invalid route/source/query with a failing exit code', () => {
  const fixture = writeFixture({
    pages: `{
      /* The route registry is deliberately small. */
      pages: [{ path: "pages/home/index" }]
    }`,
    map: `pages:
  home:
    name: "Home"
    route: "/pages/home/index"
    source: "pages/home/index.vue"
    states:
      missing_node:
        name: "Missing node"
      bad_route:
        name: "Bad route"
        node_id: "1:2"
        route: "/packages/rescue/pages/apply/index"
      bad_source:
        name: "Bad source"
        node_id: "1:3"
        source: "pages/missing.vue"
      mismatch_source:
        name: "Mismatched source"
        node_id: "1:5"
        source: "pages/other.vue"
      bad_query:
        name: "Bad query"
        node_id: "1:4"
        query: ["array is invalid"]
      bad_query_key:
        name: "Bad query key"
        node_id: "1:6"
        query:
          "bad&key": "value"
`,
    sources: ['pages/home/index.vue', 'pages/other.vue'],
  })
  const result = runFixture(fixture)
  assert.notEqual(result.status, 0)
  const report = readReport(fixture)
  assert.equal(report.counts.invalid, 6)
  const statuses = Object.fromEntries(report.entries.map((entry) => [entry.stateKey, entry.status]))
  assert.equal(statuses.missing_node, 'missing-node')
  assert.equal(statuses.bad_route, 'invalid-route')
  assert.equal(statuses.bad_source, 'invalid-source')
  assert.equal(statuses.mismatch_source, 'source-route-mismatch')
  assert.equal(statuses.bad_query, 'invalid-query')
  assert.equal(statuses.bad_query_key, 'invalid-query')
  assert.ok(
    report.errors.some((error) => error.code === 'invalid-route' && /packages/.test(error.message)),
  )
  assert.doesNotMatch(JSON.stringify(report), /PASS/i)
})

test('overwrites an old success report when a later YAML parse fails', () => {
  const fixture = writeFixture({
    pages: '{ pages: [{ path: "pages/home/index" }] }',
    map: `pages:
  home:
    route: "/pages/home/index"
    source: "pages/home/index.vue"
    states:
      default:
        node_id: "1:2"
`,
    sources: ['pages/home/index.vue'],
  })
  const first = runFixture(fixture)
  assert.equal(first.status, 0, first.stderr)
  assert.equal(readReport(fixture).counts.mapped, 1)

  fs.writeFileSync(path.join(fixture.root, 'docs', 'design', 'figma-map.yaml'), 'pages: [\n')
  const second = runFixture(fixture)
  assert.notEqual(second.status, 0)
  assert.match(second.stderr, /figma-state-matrix:/)
  const failure = readReport(fixture)
  assert.equal(failure.status, 'error')
  assert.deepEqual(failure.entries, [])
  assert.equal(failure.errors[0].code, 'input-error')
  assert.equal(failure.counts.mapped, 0)
  const markdown = fs.readFileSync(
    path.join(fixture.root, '.artifacts', 'architecture-governance', 'figma-state-matrix.md'),
    'utf8',
  )
  assert.match(markdown, /运行状态：error/)
})
