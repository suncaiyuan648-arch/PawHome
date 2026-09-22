'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { test } = require('node:test')

const {
  inventoryOutput,
  packageRoots,
  packageTotals,
  ensureReportOutsideOutput
} = require('../../scripts/lib/package-audit-common.cjs')
const { auditSize } = require('../../scripts/check-package-size.cjs')
const { auditAssets } = require('../../scripts/lib/package-audit-assets.cjs')
const {
  auditProductionBoundaries,
  auditSourceBoundaries
} = require('../../scripts/lib/package-audit-boundaries.cjs')

function tempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

function removeDir(directory) {
  fs.rmSync(directory, { recursive: true, force: true })
}

function writeFile(root, relative, content = '') {
  const file = path.join(root, relative)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
  return file
}

function createOutput(root, subPackages = ['pkg/a', 'pkg/b']) {
  writeFile(root, 'app.json', JSON.stringify({ subPackages: subPackages.map(rootPath => ({ root: rootPath, pages: [] })) }))
}

function budgetsFor(totals, overrides = {}) {
  const maxPackage = Math.max(...Object.values(totals))
  const total = Object.values(totals).reduce((sum, value) => sum + value, 0)
  return {
    limits: {
      hardPackageBytes: maxPackage,
      migrationMainMaxBytes: totals.main,
      mainTargetBytes: totals.main,
      totalTargetBytes: total,
      ...overrides
    },
    domainBudgetsKiB: {}
  }
}

test('size audit assigns every output file once, keeps ghost roots in main, hashes duplicates, and reports multibyte files', () => {
  const root = tempDir('pawhome-b2-size-')
  try {
    createOutput(root)
    writeFile(root, 'main.js', 'main')
    writeFile(root, '多字节文件.txt', '猫')
    writeFile(root, 'ghost/old.js', 'legacy')
    writeFile(root, 'pkg/a/a.js', 'same-content')
    writeFile(root, 'pkg/b/b.js', 'same-content')
    const roots = packageRoots(JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')))
    const files = inventoryOutput(root, roots)
    const totals = packageTotals(files, roots)
    assert.equal(files.filter(file => file.path === 'pkg/a/a.js').length, 1)
    assert.equal(files.find(file => file.path === 'ghost/old.js').package, 'main')
    assert.equal(files.find(file => file.path === '多字节文件.txt').bytes, Buffer.byteLength('猫'))
    const report = path.join(root, '..', `${path.basename(root)}-size-report.json`)
    const { result } = auditSize({ output: root, report, budgets: budgetsFor(totals) })
    assert.equal(result.pass, true)
    assert.equal(result.total.bytes, Object.values(totals).reduce((sum, value) => sum + value, 0))
    assert.ok(result.duplicateContent.some(group => group.files.includes('pkg/a/a.js') && group.files.includes('pkg/b/b.js')))
    assert.equal(fs.existsSync(path.join(root, 'size-report.json')), false)
  } finally {
    removeDir(root)
  }
})

test('size audit enforces exact byte thresholds, final main target, report boundary, baseline delta, and root shape', () => {
  const root = tempDir('pawhome-b2-threshold-')
  try {
    createOutput(root, ['pkg/a'])
    writeFile(root, 'main.js', '0123456789')
    writeFile(root, 'pkg/a/a.js', 'abc')
    const roots = packageRoots(JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')))
    const totals = packageTotals(inventoryOutput(root, roots), roots)
    const report = path.join(root, '..', `${path.basename(root)}-report.json`)
    assert.equal(auditSize({ output: root, report, budgets: budgetsFor(totals) }).result.pass, true)
    assert.equal(auditSize({ output: root, report, budgets: budgetsFor(totals, { migrationMainMaxBytes: totals.main - 1 }) }).result.pass, false)
    assert.equal(auditSize({ output: root, report, budgets: budgetsFor(totals, { hardPackageBytes: totals['pkg/a'] - 1 }) }).result.pass, false)
    assert.equal(auditSize({ output: root, report, final: true, budgets: budgetsFor(totals, { mainTargetBytes: totals.main - 1 }) }).result.pass, false)
    const baseline = path.join(root, '..', `${path.basename(root)}-baseline.json`)
    fs.writeFileSync(baseline, JSON.stringify({ packages: { main: totals.main - 2 } }))
    const withBaseline = auditSize({ output: root, report, baseline, budgets: budgetsFor(totals) }).result
    assert.equal(withBaseline.baseline.packages.main.deltaBytes, 2)
    assert.throws(() => ensureReportOutsideOutput(path.join(root, 'nested', 'report.json'), root), /outside processed output/)
    assert.throws(() => packageRoots({ subPackages: [{ root: '/pkg/a', pages: [] }] }), /relative path/)
    assert.throws(() => packageRoots({ subPackages: [{ root: 'pkg/a', pages: [] }, { root: 'pkg/a', pages: [] }] }), /duplicate/)
    assert.throws(() => packageRoots({ subPackages: [{ root: 'pkg/a', pages: [] }, { root: 'pkg/a/sub', pages: [] }] }), /nested/)
    assert.throws(() => packageRoots({ subPackages: [{ root: 'pkg\\a', pages: [] }] }), /backslash/)
  } finally {
    removeDir(root)
  }
})

function cleanAssetFixture(root) {
  createOutput(root)
  writeFile(root, 'main.js', 'const a="/static/main.png?cache=1"; const remote="https://example.test/a.png"; const data="data:image/png;base64,AA=="; require("./main.png#hash")')
  writeFile(root, 'static/main.png', 'png')
  writeFile(root, 'main.png', 'png')
  writeFile(root, 'main.wxss', '@import "./theme"; .a{background:url(main.png?x=1)}')
  writeFile(root, 'theme.wxss', '.theme{}')
  writeFile(root, 'main.json', JSON.stringify({ usingComponents: { local: './main-comp' } }))
  writeFile(root, 'main-comp.js', 'module.exports = {}')
  writeFile(root, 'pkg/a/a.js', 'require("./a.png?x=1")')
  writeFile(root, 'pkg/a/a.png', 'a')
  writeFile(root, 'pkg/a/a.wxss', '@import "./a-theme"; .a{background:url(./a.png#x)}')
  writeFile(root, 'pkg/a/a-theme.wxss', '.a{}')
  writeFile(root, 'pkg/a/a.json', JSON.stringify({ usingComponents: { main: '../../main-comp' } }))
  writeFile(root, 'pkg/a/a.wxml', '<import src="../../main.wxml"/><include src="./a-inc.wxml"/><wxs src="./a.wxs"/>')
  writeFile(root, 'main.wxml', '<view/>')
  writeFile(root, 'pkg/a/a-inc.wxml', '<view/>')
  writeFile(root, 'pkg/a/a.wxs', 'module.exports = {}')
}

test('asset audit resolves query/hash, CSS, template-adjacent local files and component suffixes while allowing remote/data and sub-to-main', () => {
  const root = tempDir('pawhome-b2-assets-clean-')
  try {
    cleanAssetFixture(root)
    const roots = packageRoots(JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')))
    const result = auditAssets({ output: root, roots })
    assert.equal(result.pass, true, JSON.stringify(result, null, 2))
    assert.equal(result.missing.length, 0)
    assert.equal(result.crossPackage.length, 0)
  } finally {
    removeDir(root)
  }
})

test('asset audit fails missing files, main-to-sub and sibling private references, plus unknown dynamic assets', () => {
  const root = tempDir('pawhome-b2-assets-fail-')
  try {
    cleanAssetFixture(root)
    writeFile(root, 'main.wxss', '.a{background:url(./missing.png)} .b{background:url(./pkg/a/a.png)}')
    writeFile(root, 'pkg/a/a.js', 'require("../b/b.png")')
    writeFile(root, 'pkg/b/b.png', 'b')
    writeFile(root, 'pkg/a/a.wxss', '.a{background:url(../b/b.png)}')
    writeFile(root, 'pkg/a/a.json', JSON.stringify({ usingComponents: { sibling: '../b/bcomp' } }))
    writeFile(root, 'pkg/b/bcomp.js', 'module.exports = {}')
    writeFile(root, 'pkg/a/dynamic.js', 'const file = name; const src = "/static/" + file')
    const roots = packageRoots(JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')))
    const result = auditAssets({ output: root, roots })
    assert.equal(result.pass, false)
    assert.ok(result.missing.some(item => item.path.includes('missing.png')))
    assert.ok(result.crossPackage.some(item => item.violation === 'main-to-subpackage'))
    assert.ok(result.crossPackage.some(item => item.violation === 'cross-subpackage'))
    assert.ok(result.unknownDynamic.some(item => item.file === 'pkg/a/dynamic.js'))
  } finally {
    removeDir(root)
  }
})

function boundaryFixture(root) {
  createOutput(root)
  writeFile(root, 'main-lib.js', 'module.exports = 1')
  writeFile(root, 'main.wxml', '<view/>')
  writeFile(root, 'main.wxss', '.main{}')
  writeFile(root, 'main.js', 'module.exports = require("./main-lib")')
  writeFile(root, 'pkg/a/a.js', 'require("../../main-lib")')
  writeFile(root, 'pkg/a/a.json', JSON.stringify({ usingComponents: { main: '../../main-comp' } }))
  writeFile(root, 'main-comp.js', 'module.exports = {}')
  writeFile(root, 'pkg/a/a.wxml', '<import src="../../main.wxml"/>')
  writeFile(root, 'pkg/a/a.wxss', '@import "../../main.wxss";')
}

test('production boundary audit follows output roots for code, templates and styles and treats dynamic imports as unresolved', () => {
  const root = tempDir('pawhome-b2-boundary-')
  try {
    boundaryFixture(root)
    const roots = packageRoots(JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')))
    let result = auditProductionBoundaries(root, roots)
    assert.equal(result.pass, true, JSON.stringify(result, null, 2))
    writeFile(root, 'main.js', 'require("./pkg/a/a.js")')
    writeFile(root, 'pkg/a/missing.js', 'require(maybe)')
    writeFile(root, 'pkg/a/a.wxml', '<include src="./missing.wxml"/>')
    result = auditProductionBoundaries(root, roots)
    assert.equal(result.pass, false)
    assert.ok(result.crossPackage.some(item => item.violation === 'main-to-subpackage'))
    assert.ok(result.missing.some(item => item.path.includes('missing.wxml')))
    assert.ok(result.unresolvedDynamic.some(item => item.file === 'pkg/a/missing.js'))
  } finally {
    removeDir(root)
  }
})

test('source boundary audit recognizes pages and packages roots, accepts JSON5 pages config and blocks private imports', () => {
  const root = tempDir('pawhome-b2-source-')
  try {
    writeFile(root, 'pages.json', "{ // JSON5 fixture\n pages: [{ path: 'pages/index/index' }],\n subPackages: [{ root: 'pages/sub', pages: [{ path: 'index' }] }]\n}")
    writeFile(root, 'shared.js', 'module.exports = 1')
    writeFile(root, 'pages/index/index.js', "require( '../../shared.js')")
    writeFile(root, 'pages/sub/index.js', "require('../../shared.js')")
    writeFile(root, 'packages/a/index.js', "require( '../../shared.js')")
    writeFile(root, 'packages/b/index.js', 'module.exports = 1')
    let result = auditSourceBoundaries(root)
    assert.equal(result.pass, true, JSON.stringify(result, null, 2))
    writeFile(root, 'pages/index/index.js', "import a from 'packages/a'\nexport default a")
    writeFile(root, 'packages/a/index.js', "require('packages/b')")
    writeFile(root, 'pages/sub/dynamic.js', 'import( maybe )')
    result = auditSourceBoundaries(root)
    assert.equal(result.pass, false)
    assert.ok(result.crossPackage.some(item => item.violation === 'main-to-subpackage'))
    assert.ok(result.crossPackage.some(item => item.violation === 'cross-subpackage'))
    assert.ok(result.unresolvedDynamic.some(item => item.file === 'pages/sub/dynamic.js'))
  } finally {
    removeDir(root)
  }
})

test('computed module arguments fail closed; bare template/style paths and output escapes are checked', () => {
  const { extractModuleImports } = require('../../scripts/lib/package-audit-boundaries.cjs')
  const imports = extractModuleImports("require( './ok.js' ); import(`./ok.js`); require('./' + name); import(`./${name}.js`)", '/main.js')
  assert.equal(imports.edges.length, 2)
  assert.equal(imports.dynamic.length, 2)
  const root = tempDir('pawhome-b2-relative-')
  try {
    createOutput(root)
    writeFile(root, 'pages/home/index.wxml', '<include src="missing.wxml"/><wxs src="missing.wxs"/><image src="photo.png"/>')
    writeFile(root, 'pages/home/index.wxss', '@import "missing.wxss";')
    const roots = packageRoots(JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')))
    const edges = auditProductionBoundaries(root, roots)
    assert.equal(edges.missing.length, 3)
    const assets = auditAssets({ output: root, roots })
    assert.ok(assets.missing.some(item => item.path === 'photo.png'))
    const outsideName = `${path.basename(root)}-outside.js`
    writeFile(root, 'escape.js', `require('../${outsideName}')`)
    writeFile(path.dirname(root), outsideName, 'module.exports = {}')
    assert.ok(auditProductionBoundaries(root, roots).crossPackage.some(item => item.violation === 'outside-output'))
    fs.unlinkSync(path.join(path.dirname(root), outsideName))
  } finally { removeDir(root) }
})

test('configured final phase cannot silently retain migration allowance', () => {
  const root = tempDir('pawhome-b2-phase-')
  try {
    createOutput(root)
    const roots = packageRoots(JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')))
    const totals = packageTotals(inventoryOutput(root, roots), roots)
    const budgets = budgetsFor(totals, { mainTargetBytes: totals.main - 1 })
    budgets.phase = 'final'
    const report = path.join(path.dirname(root), `${path.basename(root)}-report.json`)
    const { result } = auditSize({ output: root, report, budgets })
    assert.equal(result.phase, 'final')
    assert.equal(result.pass, false)
    fs.unlinkSync(report)
    for (const badRoot of ['/packages/a', './packages/a', 'packages/a/../b', 'packages\\a']) {
      assert.throws(() => packageRoots({ subPackages: [{ root: badRoot }] }))
    }
  } finally { removeDir(root) }
})

test('CLI parse failures overwrite old success reports', () => {
  const { spawnSync } = require('node:child_process')
  const root = tempDir('pawhome-b2-failure-report-')
  try {
    createOutput(root)
    const report = path.join(root, '..', `${path.basename(root)}-failure.json`)
    for (const script of ['check-package-size.cjs', 'check-package-assets.cjs', 'check-package-boundaries.cjs']) {
      fs.writeFileSync(report, JSON.stringify({ pass: true }))
      writeFile(root, 'app.json', '{ broken')
      const result = spawnSync(process.execPath, [path.resolve(__dirname, '../../scripts', script), '--output', root, '--report', report], { encoding: 'utf8' })
      assert.notEqual(result.status, 0)
      assert.equal(JSON.parse(fs.readFileSync(report, 'utf8')).pass, false, script)
    }
    fs.unlinkSync(report)
  } finally { removeDir(root) }
})
