const fs = require('fs')
const path = require('path')

const root = path.resolve(process.env.PAWHOME_PROJECT_ROOT || path.resolve(__dirname, '..'))
const sourceRoots = ['pages', 'packages']
const legacyCustomNavPages = new Set([
  'pages/adoption/adoptApply.vue',
  'pages/adoption/adoptApplySuccess.vue',
  'pages/adoption/petDetail.vue',
  'pages/index/index.vue',
  'pages/me/index.vue',
  'pages/meMore/annualReport.vue',
  'pages/meMore/browsingHistory.vue',
  'pages/meMore/helpedAnimals.vue',
  'pages/meMore/level.vue',
  'pages/meMore/levelRules.vue',
  'pages/meMore/myAdoption.vue',
  'pages/meMore/myFeedings.vue',
  'packages/account/pages/settings/index.vue',
  'pages/meMore/yardFeedOrders.vue',
  'pages/message/index.vue',
  'pages/user/followFans.vue',
  'pages/user/profile.vue',
])

const violations = []
const customNavPattern = /(?:nav-(?:wrap|row|back|title)|custom-navigation|status-bar)/
const identityLiteralPattern = />\s*(?:院主|已实名)\s*</
const levelLiteralPattern = />\s*Lv(?:\d+|\s*\{\{)/

function lineAt(content, index) {
  return content.slice(0, index).split('\n').length
}

function visit(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) visit(target)
    else if (entry.name.endsWith('.vue')) inspect(target)
  }
}

function inspect(file) {
  const relative = path.relative(root, file)
  const content = fs.readFileSync(file, 'utf8')
  const usesSharedNav = /<PawPageNav\b/.test(content)
  const customNav = customNavPattern.exec(content)

  if (customNav && !usesSharedNav && !legacyCustomNavPages.has(relative)) {
    violations.push(`${relative}:${lineAt(content, customNav.index)} new pages must use PawPageNav`)
  }

  const identityLiteral = identityLiteralPattern.exec(content)
  if (identityLiteral) {
    violations.push(`${relative}:${lineAt(content, identityLiteral.index)} use PawOwnerBadge or PawVerifiedBadge`)
  }

  const levelLiteral = levelLiteralPattern.exec(content)
  if (levelLiteral) {
    violations.push(`${relative}:${lineAt(content, levelLiteral.index)} use LevelCapsule`)
  }
}

for (const sourceRoot of sourceRoots) visit(path.join(root, sourceRoot))

if (violations.length) {
  console.error('UI governance check failed:')
  console.error(violations.join('\n'))
  process.exitCode = 1
} else {
  console.log(`UI governance check passed: pages/ and packages/ scanned; no new custom navigation or handwritten identity badges; ${legacyCustomNavPages.size} legacy navigation pages remain allowlisted.`)
}
