import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] || 'docs/figma-export')
const frameIds = new Set(process.argv.slice(3).map((id) => id.replace('-', ':')))
if (!frameIds.size) {
  console.error('Usage: node list-figma-frame-assets.mjs <figma-export> <frame-id> [...]')
  process.exit(1)
}

const nodes = JSON.parse(fs.readFileSync(path.join(root, 'parsed/nodes.json'), 'utf8'))
const usage = JSON.parse(fs.readFileSync(path.join(root, 'parsed/image-usage.json'), 'utf8'))
const parents = new Map(nodes.map((node) => [node.id, node.parentId]))
const nodeNames = new Map(nodes.map((node) => [node.id, node.name]))
const assetNames = new Map(
  fs.readdirSync(path.join(root, 'assets')).map((name) => [path.parse(name).name, name]),
)

function ownerFrame(nodeId) {
  let current = nodeId
  while (current) {
    if (frameIds.has(current)) return current
    current = parents.get(current)
  }
  return null
}

const rows = usage.flatMap((item) => {
  const frameId = ownerFrame(item.nodeId)
  if (!frameId) return []
  const asset = assetNames.get(item.hash) || assetNames.get(item.thumbnailHash) || ''
  return [{ frameId, nodeId: item.nodeId, nodeName: nodeNames.get(item.nodeId) || item.nodeName, imageName: item.imageName, hash: item.hash, asset }]
})

for (const frameId of frameIds) {
  console.log(`\n# ${frameId}`)
  const seen = new Set()
  for (const row of rows.filter((item) => item.frameId === frameId)) {
    const key = `${row.asset}|${row.nodeName}`
    if (seen.has(key)) continue
    seen.add(key)
    console.log(JSON.stringify(row))
  }
}
