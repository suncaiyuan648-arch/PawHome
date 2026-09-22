const { checkPageRoutes, formatResult } = require('./lib/page-route-checker.cjs')

function explicitQaFiles(argv) {
  const files = []
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--qa') {
      if (!argv[index + 1]) throw new Error('--qa requires a matrix file path')
      files.push(argv[++index])
    } else if (argv[index].startsWith('--qa=')) {
      files.push(argv[index].slice('--qa='.length))
    }
  }
  return files
}

let result
try {
  const qaFiles = explicitQaFiles(process.argv.slice(2))
  result = checkPageRoutes(qaFiles.length ? { qaFiles, requireQaFiles: true } : {})
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
  result = { issues: [{ code: 'invalid-cli', message: error.message }] }
}
if (result.issues.length) {
  console.error(formatResult(result))
  process.exitCode = 1
} else {
  console.log(formatResult(result))
}

module.exports = { checkPageRoutes, formatResult }
