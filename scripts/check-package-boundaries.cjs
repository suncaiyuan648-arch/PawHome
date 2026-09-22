#!/usr/bin/env node
'use strict'

const path = require('path')
const {
  DEFAULT_OUTPUT,
  DEFAULT_REPORT_DIR,
  PROJECT_ROOT,
  ensureReportOutsideOutput,
  loadManifest,
  packageRoots,
  parseArgs,
  resolveProjectPath,
  writeFailureReport,
  writeReport
} = require('./lib/package-audit-common.cjs')
const { auditProductionBoundaries, auditSourceBoundaries } = require('./lib/package-audit-boundaries.cjs')

function auditBoundaries(options = {}) {
  const output = options.output || DEFAULT_OUTPUT
  const source = options.source || PROJECT_ROOT
  const report = options.report || path.join(DEFAULT_REPORT_DIR, 'package-boundaries.json')
  ensureReportOutsideOutput(report, output)
  const { manifest } = loadManifest(output)
  const roots = packageRoots(manifest)
  const production = auditProductionBoundaries(output, roots)
  const sourceResult = options.source === false ? null : auditSourceBoundaries(source)
  const result = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    output,
    source: sourceResult ? source : null,
    packageRoots: roots,
    production,
    sourceAudit: sourceResult,
    pass: production.pass && (!sourceResult || sourceResult.pass)
  }
  writeReport(report, result)
  return { result, report }
}

function main() {
  let output = DEFAULT_OUTPUT
  let report = path.join(DEFAULT_REPORT_DIR, 'package-boundaries.json')
  try {
    const args = parseArgs(process.argv.slice(2), {
      aliases: { '--output': 'output', '--report': 'report', '--source': 'source' }
    })
    output = resolveProjectPath(args.output, DEFAULT_OUTPUT)
    report = resolveProjectPath(args.report, path.join(DEFAULT_REPORT_DIR, 'package-boundaries.json'))
    const source = args.source ? resolveProjectPath(args.source) : PROJECT_ROOT
    const { result, report: reportPath } = auditBoundaries({ output, report, source })
    console.log(`[Package boundaries] ${result.pass ? 'PASS' : 'FAIL'} production=${result.production.pass ? 'PASS' : 'FAIL'} source=${result.sourceAudit ? (result.sourceAudit.pass ? 'PASS' : 'FAIL') : 'SKIP'} report=${reportPath}`)
    for (const audit of [result.production, result.sourceAudit].filter(Boolean)) {
      for (const item of audit.missing) console.error(`[Package boundaries] missing ${item.source}:${item.line} -> ${item.path}`)
      for (const item of audit.crossPackage) console.error(`[Package boundaries] ${item.violation} ${item.source}:${item.line} -> ${item.path} (${item.from} -> ${item.to})`)
      for (const item of audit.unresolvedDynamic) console.error(`[Package boundaries] unresolved dynamic reference ${item.file}:${item.line}: ${item.expression}`)
      for (const item of audit.parseErrors) console.error(`[Package boundaries] parse error ${item.file}: ${item.error}`)
    }
    if (!result.pass) process.exitCode = 1
  } catch (error) {
    try { writeFailureReport(report, output, error) } catch (reportError) { console.error(`[Package boundaries] could not write failure report: ${reportError.message}`) }
    throw error
  }
}

if (require.main === module) {
  try { main() } catch (error) {
    console.error(`[Package boundaries] FAIL: ${error.message}`)
    process.exitCode = 1
  }
}

module.exports = { auditBoundaries }
