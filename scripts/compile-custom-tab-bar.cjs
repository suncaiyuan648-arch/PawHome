const fs = require('fs')
const path = require('path')
const ts = require('typescript')

function compileCustomTabBar(outputRoot) {
  const sourcePath = path.join(outputRoot, 'custom-tab-bar', 'index.ts')
  const outputPath = path.join(outputRoot, 'custom-tab-bar', 'index.js')
  if (!fs.existsSync(sourcePath)) return false

  const source = fs.readFileSync(sourcePath, 'utf8')
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2017,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
    fileName: sourcePath,
    reportDiagnostics: true,
  })
  const errors = (result.diagnostics || []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  )
  if (errors.length) {
    const detail = errors
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
      .join('\n')
    throw new Error(`[PawHome] Failed to compile custom tab bar TypeScript:\n${detail}`)
  }

  fs.writeFileSync(outputPath, result.outputText)
  return true
}

if (require.main === module) {
  const outputRoot = path.resolve(
    process.argv[2] || path.join(__dirname, '..', 'unpackage', 'dist', 'build', 'mp-weixin'),
  )
  if (!compileCustomTabBar(outputRoot)) {
    throw new Error(`[PawHome] Missing custom tab bar TypeScript output in ${outputRoot}`)
  }
}

module.exports = { compileCustomTabBar }
