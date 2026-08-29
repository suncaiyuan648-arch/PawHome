#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const BASELINE_PATH = path.join(ROOT, 'config', 'native-ui-legacy-baseline.json')
const SCAN_ROOTS = ['pages', 'components', 'utils']
const NATIVE_LAYOUT_OWNER = 'utils/navLayout.js'
const EXTENSIONS = new Set(['.vue', '.js', '.cjs', '.mjs', '.ts', '.tsx', '.css', '.scss', '.less'])
const STRICT = process.argv.includes('--strict')
const WRITE_BASELINE = process.argv.includes('--write-baseline')

const rules = [
  {
    id: 'fake-status-bar',
    re: /(?:h5[-_ ]?status[-_ ]?bar|iphone[-_ ]?status[-_ ]?bar|status[-_ ]?bar[-_ ]?white|fake[-_ ]?status[-_ ]?bar)/i,
    message: 'Do not render iOS/Android status bar. It is native system chrome.'
  },
  {
    id: 'fake-home-indicator',
    re: /(?:home[-_ ]?indicator|iphone[-_ ]?home[-_ ]?bar|ios[-_ ]?home[-_ ]?bar)/i,
    message: 'Do not render the iOS Home Indicator. The OS owns it.'
  },
  {
    id: 'fake-system-drag-bar',
    re: /(?:system[-_ ]?(?:drag|gesture)[-_ ]?bar|bottom[-_ ]?(?:drag|gesture)[-_ ]?bar|gesture[-_ ]?handle|底部(?:系统)?拖动条|底部手势条)/i,
    message: 'Do not render the native bottom gesture/drag bar. The OS owns it.'
  },
  {
    id: 'fake-wechat-capsule',
    re: /(?:wechat|weixin|mini[-_ ]?program|wx)[-_ ]?(?:native[-_ ]?)?(?:capsule|menu[-_ ]?button)|(?:capsule[-_ ]?(?:dots?|circle|button))/i,
    message: 'Do not draw the WeChat top-right capsule. Reserve native geometry only.'
  },
  {
    id: 'fake-dynamic-island-notch',
    re: /(?:dynamic[-_ ]?island|iphone[-_ ]?notch|fake[-_ ]?notch)/i,
    message: 'Do not render notch/Dynamic Island system chrome.'
  },
  {
    id: 'fake-capsule-glyph',
    re: /(?:•••|●●●|···).{0,24}(?:◎|◉|⊙)/,
    message: 'Looks like a manually drawn WeChat capsule glyph (dots + circle).'
  },
  {
    id: 'figma-native-chrome-asset',
    re: /(?:\/static\/[^"'\s]*(?:status[-_ ]?bar|home[-_ ]?indicator|wechat[-_ ]?capsule|mini[-_ ]?program[-_ ]?button|notch)[^"'\s]*)/i,
    message: 'Figma/device chrome assets must not be referenced by application source.'
  }
]

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (EXTENSIONS.has(path.extname(entry.name))) out.push(full)
  }
  return out
}

function lineNumber(text, index) {
  return text.slice(0, index).split('\n').length
}

function addFinding(findings, file, text, index, rule, sample) {
  findings.push({
    file,
    line: lineNumber(text, index),
    rule,
    message: rule.message,
    sample: String(sample).slice(0, 120)
  })
}

function collectFindings() {
  const findings = []
  const files = SCAN_ROOTS.flatMap((directory) => walk(path.join(ROOT, directory)))

  for (const file of files) {
    const rel = path.relative(ROOT, file).replaceAll(path.sep, '/')
    const text = fs.readFileSync(file, 'utf8')

    // navLayout.js is the approved geometry reader. Its comments/options may
    // mention platform-owned concepts, but it must still be checked for
    // unauthorized direct readers below.
    if (rel !== NATIVE_LAYOUT_OWNER) {
      for (const rule of rules) {
        const flags = rule.re.flags.includes('g') ? rule.re.flags : rule.re.flags + 'g'
        const re = new RegExp(rule.re.source, flags)
        for (const match of text.matchAll(re)) {
          addFinding(findings, rel, text, match.index || 0, rule, match[0])
        }
      }
    }

    if (rel !== NATIVE_LAYOUT_OWNER && /getMenuButtonBoundingClientRect\s*\(/.test(text)) {
      const index = text.search(/getMenuButtonBoundingClientRect\s*\(/)
      addFinding(
        findings,
        rel,
        text,
        index,
        {
          id: 'page-local-native-nav-layout',
          message: 'Native capsule geometry must be centralized in utils/navLayout.js and consumed by PawPageNav.'
        },
        'getMenuButtonBoundingClientRect(...)'
      )
    }

    if (/<PawPageNav\b/.test(text)) {
      const badInline = /:style\s*=\s*["'][^"']*top[^"']*statusBarHeight|top\s*:\s*\([^\n;]*statusBarHeight/gi
      for (const match of text.matchAll(badInline)) {
        addFinding(
          findings,
          rel,
          text,
          match.index || 0,
          {
            id: 'split-nav-centerline',
            message: 'Business nav content must be placed inside PawPageNav #content; do not position it from statusBarHeight.'
          },
          match[0]
        )
      }

      if (/#(?:right|default)\b|v-slot:(?:right|default)|slot=["']right["']/.test(text)) {
        const index = text.search(/#(?:right|default)\b|v-slot:(?:right|default)|slot=["']right["']/)
        addFinding(
          findings,
          rel,
          text,
          index,
          {
            id: 'native-capsule-slot',
            message: 'PawPageNav right/default slots must not be used to recreate the native WeChat operation bar.'
          },
          text.slice(index, index + 80)
        )
      }
    }
  }

  return { files, findings }
}

function aggregate(findings) {
  const counts = {}
  for (const finding of findings) {
    counts[finding.file] ||= {}
    counts[finding.file][finding.rule.id] = (counts[finding.file][finding.rule.id] || 0) + 1
  }
  return counts
}

function readBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return { version: 1, allowances: {} }
  const parsed = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'))
  return { version: parsed.version || 1, allowances: parsed.allowances || {} }
}

const { files, findings } = collectFindings()
const counts = aggregate(findings)

if (WRITE_BASELINE) {
  if (process.env.PAWHOME_ALLOW_NATIVE_UI_BASELINE_UPDATE !== '1') {
    console.error('[NATIVE_UI_GUARD] Refusing baseline rewrite.')
    console.error('Set PAWHOME_ALLOW_NATIVE_UI_BASELINE_UPDATE=1 only during an explicit native-UI debt migration task.')
    process.exit(2)
  }
  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true })
  fs.writeFileSync(BASELINE_PATH, JSON.stringify({
    version: 1,
    generatedFrom: 'legacy repository state; freeze only, do not expand during feature work',
    allowances: counts
  }, null, 2) + '\n')
  console.log(`[NATIVE_UI_GUARD] Baseline written: ${path.relative(ROOT, BASELINE_PATH)}`)
  process.exit(0)
}

const baseline = readBaseline()
const newFindings = []
let legacyCount = 0
const consumed = {}

for (const finding of findings) {
  const allowance = Number(baseline.allowances?.[finding.file]?.[finding.rule.id] || 0)
  const key = `${finding.file}::${finding.rule.id}`
  consumed[key] = (consumed[key] || 0) + 1

  if (!STRICT && consumed[key] <= allowance) {
    legacyCount += 1
    continue
  }
  newFindings.push(finding)
}

if (newFindings.length) {
  console.error(`\n[NATIVE_UI_GUARD] FAIL — ${newFindings.length} non-baselined violation(s)\n`)
  for (const finding of newFindings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.rule.id}]`)
    console.error(`  ${finding.rule.message}`)
    console.error(`  matched: ${finding.sample}`)
  }
  if (!STRICT) {
    console.error(`\nLegacy frozen violations ignored by baseline: ${legacyCount}`)
    console.error('Do not add allowlist entries or increase baseline counts during normal feature work.')
  }
  console.error('\nRule: StatusBar / WeChat capsule / Home Indicator / system drag bar are platform-owned, reference-only in Figma.')
  console.error('Rule: Back + avatar/name/badge must share one PawPageNav centerline.\n')
  process.exit(1)
}

if (STRICT) {
  console.log(`[NATIVE_UI_GUARD] STRICT PASS (${files.length} source files scanned)`)
} else {
  console.log(`[NATIVE_UI_GUARD] PASS (${files.length} source files scanned, ${legacyCount} legacy violation(s) frozen)`)
}
