const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const sourceDirs = ['pages', 'components', 'styles']
const extensions = new Set(['.vue', '.scss', '.css', '.js'])
const violations = []

function visit(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) visit(target)
    else if (extensions.has(path.extname(entry.name))) {
      const content = fs.readFileSync(target, 'utf8')
      const re = /font-weight\s*:\s*600\b/g
      let match
      while ((match = re.exec(content))) {
        const line = content.slice(0, match.index).split('\n').length
        violations.push(`${path.relative(root, target)}:${line}`)
      }
    }
  }
}

for (const dir of sourceDirs) visit(path.join(root, dir))

if (violations.length) {
  console.error('Typography check failed: use the 400 / 500 / 700 tokens instead of font-weight:600.')
  console.error(violations.join('\n'))
  process.exitCode = 1
} else {
  console.log('Typography check passed: no font-weight:600 in pages/components/styles.')
}
