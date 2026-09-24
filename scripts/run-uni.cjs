const { spawn, spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const mode = process.argv[2] === 'dev' ? 'dev' : 'build'
const projectRoot = path.resolve(__dirname, '..')
const outputRoot = path.join(projectRoot, 'unpackage', 'dist', mode, 'mp-weixin')
const uniCli = require.resolve('@dcloudio/vite-plugin-uni/bin/uni.js')
const preparePackageScript = path.join(__dirname, 'prepare-mp-weixin-package.cjs')
const { compileCustomTabBar } = require('./compile-custom-tab-bar.cjs')

function cleanOutput() {
  fs.rmSync(outputRoot, { recursive: true, force: true })
  fs.mkdirSync(outputRoot, { recursive: true })
}

function syncStatic() {
  const source = path.join(projectRoot, 'static')
  const target = path.join(outputRoot, 'static')
  fs.mkdirSync(target, { recursive: true })
  fs.cpSync(source, target, { recursive: true, force: true })
}

function preparePackage() {
  const result = spawnSync(process.execPath, [preparePackageScript, outputRoot], {
    cwd: projectRoot,
    env: { ...process.env },
    stdio: 'inherit',
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status || 1)
}

cleanOutput()
if (mode === 'dev') syncStatic()

const args = mode === 'build' ? [uniCli, 'build', '-p', 'mp-weixin'] : [uniCli, '-p', 'mp-weixin']

const childOptions = {
  cwd: projectRoot,
  env: { ...process.env, UNI_INPUT_DIR: projectRoot, UNI_OUTPUT_DIR: outputRoot },
  stdio: 'inherit',
}

if (mode === 'build') {
  const result = spawnSync(process.execPath, args, childOptions)
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status || 1)
  if (!compileCustomTabBar(outputRoot)) {
    throw new Error(`[PawHome] Missing custom tab bar TypeScript output in ${outputRoot}`)
  }
  syncStatic()
  preparePackage()
} else {
  // uni-app copies the native WeChat tab-bar source without compiling it.
  // Keep its required index.js in sync while the dev server rewrites index.ts.
  const child = spawn(process.execPath, args, childOptions)
  const tabBarSource = path.join(outputRoot, 'custom-tab-bar', 'index.ts')
  let lastSource = ''
  let compileError = null

  const syncCustomTabBar = () => {
    if (!fs.existsSync(tabBarSource)) return
    const source = fs.readFileSync(tabBarSource, 'utf8')
    if (source === lastSource) return
    try {
      compileCustomTabBar(outputRoot)
      lastSource = source
      compileError = null
    } catch (error) {
      if (!compileError || compileError.message !== error.message) {
        console.error(error)
        compileError = error
      }
    }
  }

  const poll = setInterval(syncCustomTabBar, 300)
  poll.unref()

  const forwardSignal = (signal) => child.kill(signal)
  const onSigint = () => forwardSignal('SIGINT')
  const onSigterm = () => forwardSignal('SIGTERM')
  process.once('SIGINT', onSigint)
  process.once('SIGTERM', onSigterm)

  child.on('error', (error) => {
    clearInterval(poll)
    console.error(error)
    process.exitCode = 1
  })
  child.on('exit', (code, signal) => {
    clearInterval(poll)
    process.off('SIGINT', onSigint)
    process.off('SIGTERM', onSigterm)
    process.exitCode = signal ? (signal === 'SIGINT' ? 130 : 1) : code || 0
  })
}
