const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const mode = process.argv[2] === 'dev' ? 'dev' : 'build'
const projectRoot = path.resolve(__dirname, '..')
const outputRoot = path.join(projectRoot, 'unpackage', 'dist', mode, 'mp-weixin')
const uniCli = require.resolve('@dcloudio/vite-plugin-uni/bin/uni.js')

function syncStatic() {
  const source = path.join(projectRoot, 'static')
  const target = path.join(outputRoot, 'static')
  fs.mkdirSync(target, { recursive: true })
  fs.cpSync(source, target, { recursive: true, force: true })
}

if (mode === 'dev') syncStatic()

const args = mode === 'build'
  ? [uniCli, 'build', '-p', 'mp-weixin']
  : [uniCli, '-p', 'mp-weixin']

const result = spawnSync(process.execPath, args, {
  cwd: projectRoot,
  env: { ...process.env, UNI_INPUT_DIR: projectRoot, UNI_OUTPUT_DIR: outputRoot },
  stdio: 'inherit',
})

if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status || 1)
if (mode === 'build') syncStatic()
