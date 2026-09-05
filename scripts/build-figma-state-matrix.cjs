const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..', '..')
const seedPath = path.join(repoRoot, 'docs', 'figma-export', 'parsed', 'route-mapping-seed.csv')
const pagesPath = path.join(repoRoot, 'PawHome', 'pages.json')
const outputPath = path.join(repoRoot, 'docs', 'design-audit', 'figma-state-matrix.md')

function parseCsvLine(line) {
  const cells = []
  const re = /("(?:[^"]|"")*"|[^,]*)(?:,|$)/g
  let match
  while ((match = re.exec(line)) && cells.length < 11) {
    let value = match[1] || ''
    if (value.startsWith('"')) value = value.slice(1, -1).replace(/""/g, '"')
    cells.push(value)
    if (match.index + match[0].length >= line.length) break
  }
  return cells
}

const rows = fs.readFileSync(seedPath, 'utf8').trim().split(/\r?\n/).slice(1).map((line, index) => {
  const cells = parseCsvLine(line)
  return { index: index + 1, nodeId: cells[0], name: cells[1], width: Number(cells[3]), height: Number(cells[4]) }
})

const pages = JSON.parse(fs.readFileSync(pagesPath, 'utf8'))
const routeSet = new Set(pages.pages.map(item => '/' + item.path))
for (const pack of pages.subPackages || []) {
  for (const item of pack.pages || []) routeSet.add('/' + pack.root + '/' + item.path)
}

const metricsPath = path.join(repoRoot, 'docs', 'design-audit', 'visual-audit-metrics.json')
const visualMetrics = fs.existsSync(metricsPath) ? JSON.parse(fs.readFileSync(metricsPath, 'utf8')) : []
const metricByIndex = new Map(visualMetrics.map(item => [item.index, item]))
const verified = new Set(visualMetrics.filter(item => item.passed).map(item => item.index))

function target(index, name) {
  const exact = {
    1: ['/pages/index/index?state=dynamic', 'dynamic'], 2: ['/pages/index/index?state=dynamic-empty', 'dynamic-empty'],
    3: ['/pages/search/index?state=empty', 'empty'], 4: ['/pages/index/index?state=filter-sheet', 'filter-sheet'],
    5: ['/pages/yard/createCatYard?kind=cat', 'cat'], 6: ['/pages/yard/createCatYard?kind=dog', 'dog'],
    7: ['/pages/yard/createCatYard?kind=cat&state=recorded', 'recorded'],
    8: ['/pages/yard/yardCats?state=publish-entry', 'publish-entry'],
    9: ['/pages/yard/yardCats?state=long-list', 'long-list'], 10: ['/pages/meMore/helpedAnimals', 'default'],
    11: ['/pages/index/index?state=yard-tab', 'yard-tab'], 12: ['/pages/index/index?state=dynamic-scrolled', 'dynamic-scrolled'],
    13: ['/pages/yard/catGuide', 'default'], 18: ['/pages/dynamicDetail/index?yardId=1', 'comments'],
    19: ['/pages/dynamicDetail/index?yardId=1&state=comments-empty', 'comments-empty'], 20: ['/pages/citySelect/index', 'default'],
    28: ['/pages/index/index', 'publish-entry-sheet'], 32: ['/pages/meMore/yardFeedOrders?state=owner', 'owner'],
    33: ['/pages/user/profile?nickname=%E5%B0%A7%E5%B0%A7&state=dynamic-long', 'dynamic-long'], 34: ['/pages/user/profile?nickname=%E5%B0%A7%E5%B0%A7', 'review'],
    41: ['/pages/publishDynamic/postFeed', 'default'], 58: ['/pages/yard/juryDetail?id=jury-1', 'pending'],
    59: ['/pages/feature/index?mode=rescue-detail', 'default'], 60: ['/pages/yard/juryDetail?id=jury-1&state=voted', 'voted'],
    61: ['/pages/yard/juryPanel', 'default'], 62: ['/pages/yard/rescueReview', 'default'],
    71: ['/pages/leaderboard/index', 'default'], 72: ['/pages/auth/verifyResult?status=success', 'face'],
    73: ['/pages/feature/index?mode=invite', 'default'], 74: ['/pages/auth/realName', 'default'],
    75: ['/pages/publishDynamic/postFeedOrder', 'order-sheet'], 76: ['/pages/publishDynamic/postSuccess', 'default'],
    77: ['/pages/feature/index?mode=album', 'context-menu'], 78: ['/pages/yard/yardCertify?state=99', 'state-99'],
    79: ['/pages/meMore/annualReport', 'default'], 86: ['/pages/yard/yardCats?state=managed&returnHome=1', 'managed-after-create'],
    87: ['/pages/publishDynamic/postSuccess?state=feeding', 'feeding-success'], 88: ['/pages/adoption/pickCats', 'sheet'],
    93: ['/pages/yard/addKitten', 'cat'], 95: ['/pages/yard/addKitten?type=dog', 'dog'],
    96: ['/pages/yard/addKitten?state=more', 'cat-more'], 100: ['/pages/yard/addKitten?type=dog&state=more', 'dog-more'],
    101: ['/pages/auth/realName?popup=real-name', 'real-name-modal'], 102: ['/pages/auth/realName?popup=privacy', 'privacy-modal'],
    103: ['/pages/yard/adoptionAudit?mode=ownerReview&popup=agree', 'agree-modal'], 104: ['/pages/yard/adoptionAudit?mode=ownerConfirm&popup=agree', 'agree-modal'],
    105: ['/pages/yard/adoptionAudit?mode=ownerReview&popup=reject', 'reject-modal'], 106: ['/pages/yard/juryDetail?id=jury-1&popup=vote-real', 'vote-real-result'],
    107: ['/pages/yard/juryDetail?id=jury-1&popup=vote-fake', 'vote-fake-result'], 108: ['/pages/meMore/adoptionDetail?id=demo-pending&popup=contact', 'contact'],
    109: ['/pages/commodityDetails/index?id=1&state=reply-idle', 'reply-idle'], 110: ['/pages/commodityDetails/index?id=1&state=reply-input', 'reply-input'],
    111: ['/pages/commodityDetails/index?id=1&state=feed-popup', 'feed-popup'], 112: ['/pages/commodityDetails/index?id=1&popup=help-adopt', 'adoption-help'],
    113: ['/pages/commodityDetails/index?id=1&popup=feedback-stat', 'feedback-help'], 114: ['/pages/adoption/extras?mode=quota&popup=insufficient', 'insufficient-modal'],
    115: ['/pages/commodityDetails/index?id=1&popup=food-stat', 'food-received'], 116: ['/pages/meMore/feedingDetail?id=demo&popup=food-summary', 'food-summary'],
    117: ['/pages/search/index?popup=delete', 'delete-confirm'], 118: ['/pages/search/index?popup=delete', 'delete-confirm-alt'],
    119: ['/pages/yard/addKitten?popup=status', 'status-sheet'], 120: ['/pages/yard/addKitten?popup=value', 'value-sheet'],
    121: ['/pages/yard/addKitten?popup=gender', 'gender-sheet'], 122: ['/pages/yard/addKitten?popup=sterilization', 'sterilization-sheet'],
    123: ['/pages/yard/addKitten?popup=vaccine', 'vaccine-sheet'], 124: ['/pages/yard/addKitten?popup=personality', 'personality-sheet'],
    125: ['/pages/yard/createCatYard?popup=voice-permission', 'voice-permission-modal'], 126: ['/pages/yard/createCatYard?popup=voice-limit', 'voice-limit-modal'],
    127: ['/pages/adoption/petDetail?id=demo&popup=adopt-limit', 'adopt-limit-modal'], 128: ['/pages/yard/juryDetail?id=jury-1&popup=vote-limit', 'vote-limit-modal'],
    129: ['/pages/yard/breedPicker?popup=supplement', 'supplement-modal'], 130: ['/pages/yard/breedPicker?popup=supplement-input', 'supplement-input'],
    131: ['/pages/yard/breedPicker?popup=supplement-success', 'supplement-success'], 132: ['/pages/auth/verifyResult?status=fail', 'face-verify-fail'],
    149: ['/pages/meMore/settings', 'default'], 150: ['/pages/me/index', 'default'],
    151: ['/pages/me/index?state=drawer', 'more-sheet'], 152: ['/pages/meMore/myAdoption', 'list'],
    153: ['/pages/meMore/myAdoption?state=empty', 'empty'], 154: ['/pages/auth/login', 'default'],
    155: ['/pages/auth/bindPhone', 'default'], 156: ['/pages/auth/smsVerify', 'default'],
    157: ['/pages/me/index?state=profile-upload', 'logged-profile'], 158: ['/pages/message/index', 'default'],
    159: ['/pages/meMore/addShippingAddress?state=select', 'edit'], 160: ['/pages/messageDetail/index?type=service', 'default'],
    161: ['/pages/messageDetail/index?type=interaction', 'default'], 162: ['/pages/adoption/extras?mode=support', 'default'],
    163: ['/pages/messageDetail/index?type=activity', 'default'], 164: ['/pages/adoption/extras?mode=quota', 'default'],
    165: ['/pages/adoption/extras?mode=quota-detail', 'default'], 166: ['/pages/yard/yardCats?state=roster', 'yard'],
    167: ['/pages/meMore/myAssets?mode=pets&state=mine', 'mine-list'], 168: ['/pages/yard/yardCats?state=status', 'alternate'],
    169: ['/pages/meMore/myAssets?mode=pets', 'default'], 170: ['/pages/meMore/myAssets?mode=medals', 'default'],
    171: ['/pages/meMore/myAssets?mode=map', 'default'], 172: ['/pages/meMore/myAssets?mode=new', 'default']
  }
  if (exact[index]) return exact[index]
  if (index >= 14 && index <= 17) {
    const state = ['dynamic', 'dynamic-empty', 'feeding', 'dynamic-expanded'][index - 14]
    return [`/pages/commodityDetails/index?id=1&state=${state}`, state]
  }
  if (index >= 21 && index <= 22) return [`/pages/yard/breedPicker?kind=${index === 21 ? 'cat' : 'dog'}`, index === 21 ? 'cat' : 'dog']
  if (index >= 23 && index <= 27) {
    const state = ['dynamic', 'yard', 'user', 'idle', 'deleting'][index - 23]
    return [`/pages/search/index?state=${state}`, state]
  }
  if (index >= 29 && index <= 31) return [index === 31 ? '/pages/meMore/yardFeedOrders?state=31' : `/pages/meMore/myFeedings?state=${index}`, `state-${index}`]
  if (index >= 35 && index <= 37) return [`/pages/adoption/petDetail?id=demo&state=${index}`, `variant-${index}`]
  if (index >= 38 && index <= 40) {
    const state = ['dynamic', 'yard', 'empty'][index - 38]
    return [`/pages/meMore/browsingHistory?state=${state}`, state]
  }
  if (index >= 42 && index <= 43) return [`/pages/adoption/adoptApply?state=${index === 42 ? 'compact' : 'long'}`, index === 42 ? 'compact' : 'long']
  if (index >= 44 && index <= 57) return [`/pages/meMore/adoptionFlow?frame=${index}`, `flow-${index}`]
  if (index >= 63 && index <= 64) return [`/pages/meMore/level?variant=${index}`, `variant-${index}`]
  if (index === 65 || index === 66) return [`/pages/user/followFans?tab=${index === 65 ? 'fans' : 'follow'}`, 'default']
  if (index === 67) return ['/pages/meMore/levelRules', 'default']
  if (index === 68) return ['/pages/publishDynamic/postFeed?state=alternate', 'alternate']
  if (index === 69) return ['/pages/meMore/adoptionConfirm', 'confirm']
  if (index === 70) return ['/pages/meMore/adoptionProofList', 'proof-list']
  if (index >= 80 && index <= 85) return [`/pages/adoption/result?variant=${index}`, `result-${index}`]
  if (index === 89) return ['/pages/adoption/submitOrder?state=figma', 'order-address-sheet']
  if (index >= 90 && index <= 92) return [`/pages/meMore/feedingDetail${index}`, `variant-${index}`]
  if (index === 94) return ['/pages/yard/adoptionAudit?mode=proof', 'default']
  if (index >= 97 && index <= 99) return [`/pages/yard/yardCertify?state=${index}`, `state-${index}`]
  if (index >= 133 && index <= 136) return [index % 2 ? `/pages/meMore/addShippingAddress${index >= 135 ? '?state=typing' : ''}` : `/pages/meMore/addServiceAddress${index >= 135 ? '?state=typing' : ''}`, index >= 135 ? 'typing' : 'default']
  if (index === 137) return ['/pages/yard/createCatYard?popup=location', 'location-picker']
  if (index === 138) return ['/pages/meMore/shippingAddress', 'shipping']
  if (index === 139) return ['/pages/meMore/shippingAddress?kind=service', 'service']
  if (index === 140) return ['/pages/meMore/shippingAddress?state=pick', 'pick']
  if (index === 141) return ['/pages/meMore/shippingAddress?state=empty', 'empty']
  if (index === 142) return ['/pages/meMore/shippingAddress?state=manage', 'shipping-manage']
  if (index === 143) return ['/pages/meMore/shippingAddress?kind=service&state=manage', 'service-manage']
  if (index === 144) return ['/pages/meMore/regionSelector?state=province', 'province']
  if (index === 145) return ['/pages/meMore/regionSelector?state=back', 'back-to-province']
  if (index === 146) return ['/pages/meMore/regionSelector?state=street', 'street']
  if (index === 147) return ['/pages/meMore/regionSelector?state=city', 'city']
  if (index === 148) return ['/pages/meMore/shippingAddress?state=delete', 'delete-confirm']
  return ['', name]
}

const matrix = rows.map(row => {
  const [url, state] = target(row.index, row.name)
  const base = url.split('?')[0]
  const routeExists = base ? routeSet.has(base) : false
  const metric = metricByIndex.get(row.index)
  const qa = verified.has(row.index) ? `同尺寸复验通过（MAE ${metric.mae}）` : !routeExists ? '缺少路由映射' : metric && metric.sameSize ? `视觉待修正（MAE ${metric.mae}）` : '缺少同尺寸截图'
  return { ...row, url, state, routeExists, qa }
})

const counts = {
  passed: matrix.filter(item => item.qa.startsWith('同尺寸复验通过')).length,
  visualPending: matrix.filter(item => item.qa.startsWith('视觉待修正')).length,
  screenshotMissing: matrix.filter(item => item.qa === '缺少同尺寸截图').length,
  routeMissing: matrix.filter(item => item.qa === '缺少路由映射').length
}

const lines = [
  '# Figma 172 画板路由与状态矩阵',
  '',
  `生成时间：${new Date().toISOString()}`,
  '',
  `- 同尺寸复验通过（MAE ≤ 10）：${counts.passed}`,
  `- 已有同尺寸截图、视觉待修正：${counts.visualPending}`,
  `- 缺少同尺寸截图：${counts.screenshotMissing}`,
  `- 缺少路由映射：${counts.routeMissing}`,
  '',
  '> 本矩阵由同尺寸截图自动计算，不再手工勾选。MAE 是整张 RGB 平均绝对像素差；MAE ≤ 10 仅作为当前批次通过门槛，仍需保留并排图人工复核。',
  '',
  '| # | Figma 画板 | 节点 | 尺寸 | 目标 URL | 状态 | 当前证据 |',
  '|---:|---|---|---:|---|---|---|'
]

for (const item of matrix) {
  lines.push(`| ${String(item.index).padStart(3, '0')} | ${item.name.replace(/\|/g, '\\|')} | \`${item.nodeId}\` | ${item.width}×${item.height} | ${item.url ? `\`${item.url}\`` : '—'} | ${item.state} | ${item.qa} |`)
}

fs.writeFileSync(outputPath, lines.join('\n') + '\n', 'utf8')
console.log(`wrote ${outputPath}`)
