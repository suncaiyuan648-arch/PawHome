const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const test = require('node:test')

const repoRoot = path.resolve(__dirname, '../..')
const scriptSource = path.join(repoRoot, 'scripts', 'prepare-mp-weixin-package.cjs')
const dependencyRoot = path.dirname(path.dirname(path.dirname(require.resolve('sharp'))))

function put(root, relative, content = '') {
  const target = path.join(root, relative)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content)
}

function createFixture({ unknown = false, collision = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pawhome-package-assets-'))
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true })
  fs.copyFileSync(scriptSource, path.join(root, 'scripts/prepare-mp-weixin-package.cjs'))
  fs.symlinkSync(dependencyRoot, path.join(root, 'node_modules'), 'dir')

  const pages = {
    pages: [{ path: 'pages/index/index' }],
    subPackages: [
      { root: 'packages/rescue', pages: [{ path: 'pages/index' }] },
      { root: 'packages/adoption', pages: [{ path: 'pages/index' }] },
      { root: 'pages/example', pages: [{ path: 'pages/index' }] },
      { root: 'pages/dev', pages: [{ path: 'paw-icon-lab' }] },
    ],
  }
  put(root, 'pages.json', `// JSON5 route fixture\n${JSON.stringify(pages, null, 2)}\n`)

  put(root, 'pages/index/index.vue', '<template><view /></template>')
  const rescueTemplate = [
    '<script setup>',
    "import RescueCard from '../components/RescueCard.vue'",
    "import { image } from '../utils/assets.js'",
    "import '../utils/side-effect.js'",
    "const sideEffect = require ('../utils/side-effect.js')",
    '</script>',
    '<template><RescueCard /><image src="/static/private.svg" /><image src="/static/shared.svg" /></template>',
  ]
  if (unknown) {
    rescueTemplate.push('<image src="/static/missing-source.svg" />')
    rescueTemplate.push('<image src="/packages/adoption/static/private.svg" />')
  }
  put(root, 'packages/rescue/pages/index.vue', rescueTemplate.join('\n'))
  put(
    root,
    'packages/adoption/pages/index.vue',
    '<template><image src="/static/dup-b.svg" /></template>',
  )
  put(
    root,
    'pages/example/pages/index.vue',
    '<template><image src="/static/example.svg" /></template>',
  )
  put(root, 'pages/dev/paw-icon-lab.vue', '<template><view /></template>')

  put(
    root,
    'packages/rescue/components/RescueCard.vue',
    '<template><image src="/static/private.svg" /></template>',
  )
  put(
    root,
    'packages/rescue/utils/assets.js',
    `const ASSET_ROOT = '/static/dyn/';\nexport const image = ASSET_ROOT + 'item.svg'\n`,
  )
  put(
    root,
    'packages/rescue/utils/side-effect.js',
    `const side = '/static/side.svg'\nexport default side\n`,
  )

  put(root, 'static/main.svg', 'main')
  put(root, 'static/main-alias.svg', 'main')
  if (collision) put(root, 'static/private.svg', 'root-private')
  put(root, 'static/shared.svg', 'shared')
  put(root, 'static/dup-a.svg', 'same-content')
  put(root, 'static/dup-b.svg', 'same-content')
  put(root, 'static/dup-b.svg.bak', 'suffix-content')
  put(root, 'static/example.svg', 'example')
  put(root, 'static/unused.svg', 'unused')
  put(root, 'packages/rescue/static/private.svg', 'private-source')
  put(root, 'packages/rescue/static/dyn/item.svg', 'dynamic-private')
  put(root, 'packages/rescue/static/css.svg', 'css-private')
  put(root, 'packages/rescue/static/side.svg', 'side-private')
  put(root, 'pages/example/static/private.svg', 'example-private-source')
  put(root, 'pages/dev/static/dev.svg', 'dev-only')

  const app = {
    pages: ['pages/index/index'],
    subPackages: pages.subPackages.map((item) => ({
      root: item.root,
      pages: item.pages.map((page) => `${item.root}/${page.path}`),
    })),
  }
  const output = path.join(root, 'out')
  put(output, 'app.json', JSON.stringify(app, null, 2))
  put(
    output,
    'pages/index/index.js',
    `const main = '/static/main.svg'; const shared = '/static/shared.svg'; const remote = 'https://cdn.example/static/unknown-remote.svg';`,
  )
  put(
    output,
    'pages/index/index.wxss',
    `.main { background: url('/static/main.svg?cache=1#hash'); }`,
  )
  put(
    output,
    'packages/rescue/pages/index.js',
    [
      `const privateImage = '/static/private.svg';`,
      `const mainAlias = '/static/main-alias.svg';`,
      `const explicitPrivateImage = '/packages/rescue/static/private.svg';`,
      `const shared = '/static/shared.svg';`,
      `const dynamic = '/static/dyn/item.svg';`,
      `const side = '/static/side.svg';`,
      unknown ? `const missing = '/static/missing.svg';` : '',
    ].join('\n'),
  )
  put(
    output,
    'packages/rescue/pages/index.wxss',
    `.card { background: url("/static/css.svg?x=1#hash"); }`,
  )
  put(
    output,
    'packages/adoption/pages/index.js',
    `const duplicate = '/static/dup-b.svg'; const suffix = '/static/dup-b.svg.bak'; const shared = '/static/shared.svg';`,
  )
  put(output, 'pages/example/pages/index.js', `const privateImage = '/static/private.svg';`)
  put(output, 'pages/dev/paw-icon-lab.js', `const dev = '/static/dev.svg';`)
  // The pipeline must retain unknown pre-existing output assets rather than
  // deleting them to make the package appear smaller.
  put(output, 'static/unknown-output.svg', 'unknown-output')
  put(output, 'static/paw-icons/mono/stale.svg', 'stale-build-only')
  put(output, 'packages/adoption/static/paw-icons/mono/stale.svg', 'stale-build-only')
  put(output, 'packages/rescue/static/private.svg', 'private-source')
  put(output, 'pages/example/static/private.svg', 'example-private-source')

  return { root, output, script: path.join(root, 'scripts/prepare-mp-weixin-package.cjs') }
}

function run(fixture) {
  return spawnSync(process.execPath, [fixture.script, fixture.output], {
    cwd: path.join(fixture.root, 'outside-cwd'),
    encoding: 'utf8',
    env: { ...process.env, NODE_PATH: dependencyRoot },
  })
}

function setupOutsideCwd(fixture) {
  fs.mkdirSync(path.join(fixture.root, 'outside-cwd'))
}

function report(fixture) {
  return JSON.parse(
    fs.readFileSync(
      path.join(fixture.root, '.artifacts/architecture-governance/package-assets.json'),
      'utf8',
    ),
  )
}

function snapshot(directory) {
  const files = []
  function visit(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name)
      if (entry.isDirectory()) visit(file)
      else
        files.push([
          path.relative(directory, file).split(path.sep).join('/'),
          fs.readFileSync(file),
        ])
    }
  }
  visit(directory)
  return files.sort((a, b) => a[0].localeCompare(b[0]))
}

test('assigns assets by dependency owner, preserves package static, rewrites only root references, and is idempotent', () => {
  const fixture = createFixture()
  setupOutsideCwd(fixture)
  const first = run(fixture)
  assert.equal(first.status, 0, first.stderr)
  assert.equal(report(fixture).status, 'ok')

  assert.equal(fs.existsSync(path.join(fixture.output, 'static/main-alias.svg')), true)
  assert.equal(
    fs.existsSync(path.join(fixture.output, 'packages/rescue/static/main-alias.svg')),
    false,
  )
  assert.equal(fs.existsSync(path.join(fixture.output, 'static/shared.svg')), true)
  assert.equal(fs.existsSync(path.join(fixture.output, 'static/private.svg')), false)
  assert.equal(fs.existsSync(path.join(fixture.output, 'packages/rescue/static/shared.svg')), false)
  assert.equal(fs.existsSync(path.join(fixture.output, 'packages/rescue/static/private.svg')), true)
  assert.equal(
    fs.readFileSync(path.join(fixture.output, 'packages/rescue/static/private.svg'), 'utf8'),
    'private-source',
  )
  assert.equal(fs.existsSync(path.join(fixture.output, 'pages/example/static/private.svg')), true)
  assert.equal(fs.existsSync(path.join(fixture.output, 'static/unknown-output.svg')), true)
  assert.equal(fs.existsSync(path.join(fixture.output, 'static/paw-icons/mono/stale.svg')), false)
  assert.equal(
    fs.existsSync(path.join(fixture.output, 'packages/adoption/static/paw-icons/mono/stale.svg')),
    false,
  )
  assert.equal(fs.existsSync(path.join(fixture.output, 'pages/dev')), false)
  assert.match(
    fs.readFileSync(path.join(fixture.output, 'pages/index/index.js'), 'utf8'),
    /https:\/\/cdn\.example\/static\/unknown-remote\.svg/,
  )

  const rescueJsPath = path.join(fixture.output, 'packages/rescue/pages/index.js')
  const rescueJs = fs.readFileSync(rescueJsPath, 'utf8')
  assert.equal((rescueJs.match(/\/packages\/rescue\/static\/private\.svg/g) || []).length, 2)
  assert.match(rescueJs, /\/packages\/rescue\/static\/dyn\/item\.svg/)
  assert.match(rescueJs, /\/packages\/rescue\/static\/side\.svg/)
  assert.doesNotMatch(rescueJs, /\/packages\/rescue\/packages\/rescue\/static/)
  assert.match(
    fs.readFileSync(path.join(fixture.output, 'packages/rescue/pages/index.wxss'), 'utf8'),
    /\/packages\/rescue\/static\/css\.svg\?x=1#hash/,
  )
  const adoptionJs = fs.readFileSync(
    path.join(fixture.output, 'packages/adoption/pages/index.js'),
    'utf8',
  )
  assert.match(adoptionJs, /\/packages\/adoption\/static\/dup-a\.svg'/)
  assert.match(adoptionJs, /\/static\/dup-b\.svg\.bak'/)

  const once = snapshot(fixture.output)
  const second = run(fixture)
  assert.equal(second.status, 0, second.stderr)
  assert.deepEqual(snapshot(fixture.output), once)
  assert.equal(report(fixture).summary.unknownReferences, 0)
})

test('reports unknown source static references, keeps unknown output assets, and still writes an ownership report', () => {
  const fixture = createFixture({ unknown: true })
  setupOutsideCwd(fixture)
  const result = run(fixture)
  assert.notEqual(result.status, 0)
  const matrix = report(fixture)
  assert.equal(matrix.status, 'error')
  assert.ok(matrix.unknownReferences.some((item) => item.value === 'missing.svg'))
  assert.ok(matrix.unknownReferences.some((item) => item.value === 'missing-source.svg'))
  assert.ok(matrix.errors.some((item) => item.code === 'cross-package-static-reference'))
  assert.ok(
    matrix.assets.some(
      (item) => item.source === 'static/shared.svg' && item.owners.includes('main'),
    ),
  )
  assert.equal(fs.existsSync(path.join(fixture.output, 'static/unknown-output.svg')), true)
})

test('supports a lowercase subpackages key and source package roots without treating them as main', () => {
  const fixture = createFixture()
  const pagesPath = path.join(fixture.root, 'pages.json')
  const pages = JSON.parse(fs.readFileSync(pagesPath, 'utf8').replace(/^\/\/.*\n/, ''))
  pages.subpackages = pages.subPackages
  delete pages.subPackages
  fs.writeFileSync(pagesPath, `// lowercase key\n${JSON.stringify(pages)}`)
  setupOutsideCwd(fixture)
  const result = run(fixture)
  assert.equal(result.status, 0, result.stderr)
  assert.ok(report(fixture).source.outputPackageRoots.includes('packages/rescue'))
  assert.equal(fs.existsSync(path.join(fixture.output, 'static/private.svg')), false)
})

test('overwrites a prior success report when input parsing fails', () => {
  const fixture = createFixture()
  setupOutsideCwd(fixture)
  const first = run(fixture)
  assert.equal(first.status, 0, first.stderr)
  assert.equal(report(fixture).status, 'ok')

  fs.writeFileSync(path.join(fixture.root, 'pages.json'), '{ pages: [')
  const second = run(fixture)
  assert.notEqual(second.status, 0)
  const failed = report(fixture)
  assert.equal(failed.status, 'error')
  assert.ok(failed.errors.some((item) => item.code === 'pipeline-failure'))
})

test('fails a root/package collision without changing root absolute URL semantics', () => {
  const fixture = createFixture({ collision: true })
  setupOutsideCwd(fixture)
  const result = run(fixture)
  assert.notEqual(result.status, 0)
  const matrix = report(fixture)
  assert.ok(matrix.errors.some((item) => item.code === 'root-package-static-collision'))
  assert.equal(
    fs.readFileSync(path.join(fixture.output, 'static/private.svg'), 'utf8'),
    'root-private',
  )
  assert.equal(
    fs.readFileSync(path.join(fixture.output, 'packages/rescue/static/private.svg'), 'utf8'),
    'private-source',
  )
  const rescueJs = fs.readFileSync(
    path.join(fixture.output, 'packages/rescue/pages/index.js'),
    'utf8',
  )
  assert.match(rescueJs, /const privateImage = '\/static\/private\.svg'/)
  assert.doesNotMatch(rescueJs, /const privateImage = '\/packages\/rescue\/static\/private\.svg'/)
})

test('computed filenames retain identical aliases and root prefixes do not duplicate shared assets', () => {
  const fixture = createFixture()
  setupOutsideCwd(fixture)
  put(fixture.root, 'static/computed/a.svg', 'same-computed')
  put(fixture.root, 'static/computed/b.svg', 'same-computed')
  put(
    fixture.root,
    'packages/rescue/utils/computed.js',
    'export const image = `/static/computed/${name}.svg`',
  )
  fs.appendFileSync(
    path.join(fixture.root, 'packages/rescue/pages/index.vue'),
    "\n<script>import '../utils/computed.js'</script>",
  )
  fs.appendFileSync(
    path.join(fixture.output, 'packages/rescue/pages/index.js'),
    "\nconst image = `/static/computed/${name}.svg`; const remote = 'https://cdn.example/static/dup-b.svg';",
  )
  put(fixture.root, 'pages/dev/paw-icon-lab.vue', '<text>/static/nonexistent.svg</text>')
  const first = run(fixture)
  assert.equal(first.status, 0, first.stderr)
  for (const name of ['a', 'b'])
    assert.equal(
      fs.existsSync(path.join(fixture.output, `packages/rescue/static/computed/${name}.svg`)),
      true,
    )
  const source = fs.readFileSync(
    path.join(fixture.output, 'packages/rescue/pages/index.js'),
    'utf8',
  )
  assert.ok(source.includes('/packages/rescue/static/computed/${name}.svg'))
  assert.ok(source.includes('https://cdn.example/static/dup-b.svg'))
  const once = snapshot(fixture.output)
  const second = run(fixture)
  assert.equal(second.status, 0, second.stderr)
  assert.deepEqual(snapshot(fixture.output), once)
})
