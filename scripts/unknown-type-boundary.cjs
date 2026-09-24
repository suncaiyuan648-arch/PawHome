'use strict'

const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const { parse } = require('@vue/compiler-sfc')

const ROOT = path.resolve(__dirname, '..')
const BASELINE_PATH = path.join(ROOT, 'tests/governance/unknown-type-sites-baseline.json')

function collectUnknownTypeSites() {
  const files = execFileSync(
    'rg',
    [
      '--files',
      '-g',
      '*.ts',
      '-g',
      '*.tsx',
      '-g',
      '*.vue',
      '-g',
      '!tests/**',
      '-g',
      '!docs/**',
      '-g',
      '!uni_modules/**',
      '-g',
      '!node_modules/**',
      '-g',
      '!.artifacts/**',
    ],
    { cwd: ROOT, encoding: 'utf8' },
  )
    .trim()
    .split('\n')
    .filter(Boolean)
  const sites = {}

  for (const file of files) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8')
    const scripts = []
    if (file.endsWith('.vue')) {
      const { descriptor } = parse(source, { filename: file })
      if (descriptor.script) scripts.push(descriptor.script.content)
      if (descriptor.scriptSetup) scripts.push(descriptor.scriptSetup.content)
    } else {
      scripts.push(source)
    }

    for (const script of scripts) {
      const lines = script.split(/\r?\n/)
      const sourceFile = ts.createSourceFile(
        file,
        script,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
      )
      const visit = (node) => {
        if (node.kind === ts.SyntaxKind.UnknownKeyword) {
          const lineNumber = sourceFile.getLineAndCharacterOfPosition(
            node.getStart(sourceFile),
          ).line
          const signature = (lines[lineNumber] || '').trim().replace(/\s+/g, ' ')
          sites[file] ||= {}
          sites[file][signature] = (sites[file][signature] || 0) + 1
        }
        ts.forEachChild(node, visit)
      }
      visit(sourceFile)
    }
  }

  return Object.fromEntries(
    Object.entries(sites)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([file, signatures]) => [
        file,
        Object.fromEntries(
          Object.entries(signatures).sort(([left], [right]) => left.localeCompare(right)),
        ),
      ]),
  )
}

function writeBaseline() {
  const baseline = {
    formatVersion: 1,
    description:
      'Audited production unknown type sites, keyed by file and normalized source line. New sites require review before updating this baseline.',
    sites: collectUnknownTypeSites(),
  }
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`)
  return baseline
}

if (require.main === module) {
  if (process.argv[2] !== '--write-baseline') {
    console.error('Usage: node scripts/unknown-type-boundary.cjs --write-baseline')
    process.exitCode = 2
  } else {
    const baseline = writeBaseline()
    const count = Object.values(baseline.sites).reduce(
      (total, fileSites) =>
        total + Object.values(fileSites).reduce((sum, siteCount) => sum + siteCount, 0),
      0,
    )
    console.log(
      `Recorded ${count} audited unknown type nodes across ${Object.keys(baseline.sites).length} production files.`,
    )
  }
}

module.exports = { BASELINE_PATH, collectUnknownTypeSites }
