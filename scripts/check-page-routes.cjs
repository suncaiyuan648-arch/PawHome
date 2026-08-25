const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const pages = JSON.parse(fs.readFileSync(path.join(root, 'pages.json'), 'utf8'))
const registered = new Set()

for (const page of pages.pages || []) registered.add('/' + page.path)
for (const pack of pages.subPackages || []) {
  for (const page of pack.pages || []) registered.add('/' + pack.root + '/' + page.path)
}

const errors = []
for (const route of registered) {
  const file = path.join(root, route.slice(1) + '.vue')
  if (!fs.existsSync(file)) errors.push(`缺少页面文件: ${route} -> ${file}`)
}

const matrixFile = path.resolve(root, '..', 'docs', 'design-audit', 'figma-state-matrix.md')
if (fs.existsSync(matrixFile)) {
  const markdown = fs.readFileSync(matrixFile, 'utf8')
  const urls = [...markdown.matchAll(/`(\/pages\/[^`?]+)(?:\?[^`]*)?`/g)].map(match => match[1])
  for (const route of new Set(urls)) {
    if (!registered.has(route)) errors.push(`Figma 矩阵路由未注册: ${route}`)
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log(`route check passed: ${registered.size} registered pages; all Figma matrix routes are registered`)
