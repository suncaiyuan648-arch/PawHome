'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const test = require('node:test')

const repoRoot = path.resolve(__dirname, '..', '..')
const { checkPageRoutes } = require(path.join(repoRoot, 'scripts/lib/page-route-checker.cjs'))
const { scanUnknownIconNames } = require(path.join(repoRoot, 'scripts/check-paw-icons.cjs'))

function fixture() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pawhome-governance-'))
}

function write(root, relative, content = '') {
  const file = path.join(root, relative)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

function baseFixture(options = {}) {
  const root = fixture()
  const tabRoutes = [
    'pages/index/index',
    'pages/selfRun/index',
    'pages/message/index',
    'pages/me/index'
  ]
  for (const route of tabRoutes) write(root, `${route}.vue`, '<template><view /></template>')
  const extra = options.extra || 'pages/messageDetail/index'
  if (extra) write(root, `${extra}.vue`, '<template><view /></template>')
  const config = {
    pages: tabRoutes.concat(extra ? [extra] : []).map(path => ({ path })),
    subPackages: [],
    tabBar: { list: tabRoutes.map(pagePath => ({ pagePath })) }
  }
  write(root, 'pages.json', `{
    // JSON5 comments are part of the supported uni-app config.
    "pages": ${JSON.stringify(config.pages)},
    "subPackages": ${JSON.stringify(config.subPackages)},
    "tabBar": ${JSON.stringify(config.tabBar)}
  }`)
  if (options.qa !== false) write(root, 'docs/design/figma-map.yaml', 'pages:\n  home:\n    route: "/pages/index/index"\n')
  return root
}

function codes(result) {
  return result.issues.map(issue => issue.code)
}

test('two subpackage spellings cannot silently define different compiler routes', () => {
  const root = baseFixture()
  const config = require('json5').parse(fs.readFileSync(path.join(root, 'pages.json'), 'utf8'))
  config.subpackages = []
  write(root, 'pages.json', JSON.stringify(config))
  assert.ok(codes(checkPageRoutes({ root })).includes('ambiguous-subpackages-config'))
})

test('icon usage checks both bound quote styles and App.vue', () => {
  const root = fixture()
  write(root, 'App.vue', `<template><paw-icon :name='"unknown/double"' /><PawIcon v-bind:name="'unknown/single'" /></template>`)
  const unknown = scanUnknownIconNames({ root, knownNames: [] })
  assert.equal(unknown.length, 2)
  assert.ok(unknown.some(item => item.includes('unknown/double')))
  assert.ok(unknown.some(item => item.includes('unknown/single')))
})

test('route checker accepts commented JSON5 and a clean packages pages subtree', () => {
  const root = baseFixture()
  write(root, 'packages/rescue/pages/apply/index.vue', '<template><view /></template>')
  const config = JSON.parse(fs.readFileSync(path.join(root, 'pages.json'), 'utf8').replace(/\/\/.*$/gm, ''))
  config.subPackages = [{ root: 'packages/rescue', pages: [{ path: 'pages/apply/index' }] }]
  write(root, 'pages.json', `{
    // keep comments to exercise JSON5 parsing
    "pages": ${JSON.stringify(config.pages)},
    "subPackages": ${JSON.stringify(config.subPackages)},
    "tabBar": ${JSON.stringify(config.tabBar)}
  }`)
  write(root, 'packages/rescue/components/NotAPage.vue', '<template><view /></template>')
  write(root, 'pages/legacy/components/NotAPage.vue', '<template><view /></template>')
  const result = checkPageRoutes({ root })
  assert.deepEqual(result.issues, [])
  assert.equal(result.actual.some(item => item.route.endsWith('/components/NotAPage')), false)
})

test('route checker rejects duplicate routes, nested roots, missing files, and unregistered pages', () => {
  const root = baseFixture()
  write(root, 'pages/orphan.vue', '<template><view /></template>')
  write(root, 'packages/a/pages/index.vue', '<template><view /></template>')
  write(root, 'packages/b/pages/index.vue', '<template><view /></template>')
  const config = JSON.parse(fs.readFileSync(path.join(root, 'pages.json'), 'utf8').replace(/\/\/.*$/gm, ''))
  config.pages.push({ path: 'pages/index/index' })
  config.pages.push({ path: 'pages/missing/index' })
  config.subPackages = [
    { root: 'packages/a', pages: [{ path: 'pages/index' }] },
    { root: 'packages/a/detail', pages: [{ path: 'pages/index' }] }
  ]
  write(root, 'pages.json', JSON.stringify(config))
  const result = checkPageRoutes({ root })
  assert.ok(codes(result).includes('duplicate-route'))
  assert.ok(codes(result).includes('nested-package-root'))
  assert.ok(codes(result).includes('missing-page-file'))
  assert.ok(codes(result).includes('unregistered-page-file'))
})

test('route checker requires all four tabs in the main package and validates active QA routes', () => {
  const root = baseFixture()
  const config = JSON.parse(fs.readFileSync(path.join(root, 'pages.json'), 'utf8').replace(/\/\/.*$/gm, ''))
  config.pages = config.pages.filter(page => page.path !== 'pages/message/index')
  config.subPackages = [{ root: 'packages/notification', pages: [{ path: 'pages/message/index' }] }]
  write(root, 'packages/notification/pages/message/index.vue', '<template><view /></template>')
  write(root, 'pages.json', JSON.stringify(config))
  write(root, 'docs/design/figma-map.yaml', 'pages:\n  home:\n    route: "/pages/index/index"\n  missing:\n    route: "/pages/does-not-exist/index"\n')
  const result = checkPageRoutes({ root })
  assert.ok(codes(result).includes('tab-not-registered'))
  assert.ok(codes(result).includes('qa-route-not-registered'))
})

test('route checker supports uni-app subpackages spelling and rejects malformed paths/main-package nesting', () => {
  const root = baseFixture()
  write(root, 'packages/rescue/pages/apply/index.vue', '<template><view /></template>')
  const config = JSON.parse(fs.readFileSync(path.join(root, 'pages.json'), 'utf8').replace(/\/\/.*$/gm, ''))
  config.pages.push({ path: 'packages/rescue/pages/main' })
  config.subPackages = undefined
  config.subpackages = [{ root: 'packages/rescue', pages: [{ path: 'pages/apply/index' }] }]
  config.pages.push({ path: 'pages/bad//path' }, { path: 'pages/bad?query=1' })
  write(root, 'pages.json', JSON.stringify(config))
  const result = checkPageRoutes({ root })
  assert.ok(codes(result).includes('main-page-under-subpackage-root'))
  assert.ok(codes(result).includes('invalid-route-path'))

  const clean = baseFixture()
  write(clean, 'packages/rescue/pages/apply/index.vue', '<template><view /></template>')
  const cleanConfig = JSON.parse(fs.readFileSync(path.join(clean, 'pages.json'), 'utf8').replace(/\/\/.*$/gm, ''))
  cleanConfig.subPackages = undefined
  cleanConfig.subpackages = [{ root: 'packages/rescue', pages: [{ path: 'pages/apply/index' }] }]
  write(clean, 'pages.json', JSON.stringify(cleanConfig))
  assert.deepEqual(checkPageRoutes({ root: clean }).issues, [])
})

test('QA route extraction accepts unquoted YAML scalars and reports malformed YAML route values', () => {
  const root = baseFixture()
  write(root, 'docs/design/figma-map.yaml', [
    'pages:',
    '  home: &home {route: /pages/index/index}',
    '  home_alias: *home',
    'planned:',
    '  - route: /pages/does-not-exist/index',
    'unresolved:',
    '  - route: /pages/also-not-built/index'
  ].join('\n'))
  assert.deepEqual(checkPageRoutes({ root }).issues, [])
  write(root, 'docs/design-audit/figma-state-matrix.md', '`/pages/does-not-exist/index`')
  assert.deepEqual(checkPageRoutes({ root }).issues, [])
  assert.ok(checkPageRoutes({ root, qaFiles: ['docs/design-audit/figma-state-matrix.md'], requireQaFiles: true }).issues.length)
  write(root, 'docs/design/figma-map.yaml', 'pages: [not: valid\n')
  assert.ok(codes(checkPageRoutes({ root })).includes('invalid-qa-matrix'))
})

test('planning documents do not become active QA routes', () => {
  const root = baseFixture({ qa: false })
  write(root, 'docs/architecture-audit/05-plan.md', '`/packages/planned/pages/not-yet-built`')
  write(root, '.artifacts/architecture-governance/figma-state-matrix.json', JSON.stringify({
    active: [{ route: '/pages/index/index' }],
    planned: [{ route: '/packages/planned/pages/not-yet-built' }]
  }))
  const result = checkPageRoutes({ root })
  assert.deepEqual(result.issues, [])
})

function runGuard(script, root) {
  try {
    execFileSync(process.execPath, [path.join(repoRoot, 'scripts', script)], {
      cwd: repoRoot,
      env: { ...process.env, PAWHOME_PROJECT_ROOT: root },
      stdio: 'pipe'
    })
    return { passed: true, output: '' }
  } catch (error) {
    return { passed: false, output: `${error.stdout || ''}${error.stderr || ''}` }
  }
}

test('native and typography guards scan package components and tolerate missing roots', () => {
  const root = fixture()
  const cleanNative = runGuard('check-native-ui-reimplementation.cjs', root)
  const cleanTypography = runGuard('check-typography.cjs', root)
  assert.equal(cleanNative.passed, true)
  assert.equal(cleanTypography.passed, true)

  write(root, 'packages/rescue/components/FakeNative.vue', '<template><view class="fake-status-bar" /></template>')
  write(root, 'packages/rescue/components/BadType.vue', '<template><view /></template>\n<style>.x { font-weight: 600; }</style>')
  const native = runGuard('check-native-ui-reimplementation.cjs', root)
  const typography = runGuard('check-typography.cjs', root)
  assert.equal(native.passed, false)
  assert.match(native.output, /fake-status-bar/)
  assert.equal(typography.passed, false)
  assert.match(typography.output, /BadType\.vue/)
})

test('icon guard identifies unknown literal icons in package pages without touching the repository', () => {
  const root = fixture()
  write(root, 'packages/rescue/pages/detail/index.vue', '<template><PawIcon name="rescue/unknown" /><paw-icon icon="rescue/unknown-kebab" /><PawIconButton :name="\'rescue/bound\'" /><paw-icon-button v-bind:icon="\'rescue/bound-kebab\'" /></template>')
  assert.deepEqual(scanUnknownIconNames({ root, knownNames: ['navigation/close'] }).length, 4)
  const failedGate = runGuard('check-paw-icon-usage.cjs', root)
  assert.equal(failedGate.passed, false)
  assert.match(failedGate.output, /unknown PawIcon name/)
  write(root, 'packages/rescue/pages/detail/index.vue', '<template><PawIcon name="navigation/close" /><paw-icon icon="navigation/close" /><PawIconButton :name="\'navigation/close\'" /><paw-icon-button v-bind:icon="\'navigation/close\'" /></template>')
  assert.deepEqual(scanUnknownIconNames({ root, knownNames: ['navigation/close'] }), [])
  assert.equal(runGuard('check-paw-icon-usage.cjs', root).passed, true)
})
