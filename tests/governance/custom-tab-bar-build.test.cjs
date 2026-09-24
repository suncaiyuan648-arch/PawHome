'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { test } = require('node:test')
const { compileCustomTabBar } = require('../../scripts/compile-custom-tab-bar.cjs')

const projectRoot = path.resolve(__dirname, '..', '..')
const sourcePath = path.join(projectRoot, 'custom-tab-bar', 'index.ts')

test('custom tab bar TypeScript emits a WeChat-loadable index.js runtime entry', async () => {
  const outputRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'pawhome-custom-tab-bar-'))
  const tabBarRoot = path.join(outputRoot, 'custom-tab-bar')
  const utilityRoot = path.join(outputRoot, 'utils')
  await fsp.mkdir(tabBarRoot, { recursive: true })
  await fsp.mkdir(utilityRoot, { recursive: true })
  await fsp.copyFile(sourcePath, path.join(tabBarRoot, 'index.ts'))
  await fsp.writeFile(
    path.join(utilityRoot, 'messageUnread.js'),
    'exports.getTotalMessageUnreadCount = () => 6\n',
  )
  await fsp.writeFile(
    path.join(utilityRoot, 'pawEventMetadata.js'),
    'exports.readPawEventDatasetValue = (event, key) => event.dataset[key]\n',
  )

  const previousComponent = globalThis.Component
  const previousWx = globalThis.wx
  let componentOptions
  const switchTabCalls = []
  globalThis.Component = (options) => {
    componentOptions = options
  }
  globalThis.wx = { switchTab: (options) => switchTabCalls.push(options) }

  try {
    assert.equal(compileCustomTabBar(outputRoot), true)
    const outputPath = path.join(tabBarRoot, 'index.js')
    assert.equal(fs.existsSync(outputPath), true)
    const output = fs.readFileSync(outputPath, 'utf8')
    assert.match(output, /require\(["']\.\.\/utils\/messageUnread["']\)/)
    assert.match(output, /require\(["']\.\.\/utils\/pawEventMetadata["']\)/)
    assert.doesNotMatch(output, /\.ts["']/)

    delete require.cache[require.resolve(outputPath)]
    require(outputPath)
    assert.equal(componentOptions.data.unreadCount, 6)
    componentOptions.methods.onTabTap.call({ data: { selected: 0 } }, { dataset: { index: 2 } })
    assert.deepEqual(switchTabCalls, [{ url: '/pages/message/index' }])
  } finally {
    delete require.cache[require.resolve(path.join(tabBarRoot, 'index.js'))]
    if (previousComponent === undefined) delete globalThis.Component
    else globalThis.Component = previousComponent
    if (previousWx === undefined) delete globalThis.wx
    else globalThis.wx = previousWx
    await fsp.rm(outputRoot, { recursive: true, force: true })
  }
})
