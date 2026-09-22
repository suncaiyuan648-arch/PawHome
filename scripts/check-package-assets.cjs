#!/usr/bin/env node
'use strict'

const path = require('path')
const {
  DEFAULT_OUTPUT,
  DEFAULT_REPORT_DIR,
  ensureReportOutsideOutput,
  loadManifest,
  packageRoots,
  parseArgs,
  resolveProjectPath,
  writeFailureReport,
  writeReport
} = require('./lib/package-audit-common.cjs')
const { auditAssets } = require('./lib/package-audit-assets.cjs')

function auditPackageAssets(options = {}) {
  const output = options.output || DEFAULT_OUTPUT
  const report = options.report || path.join(DEFAULT_REPORT_DIR, 'package-assets.json')
  ensureReportOutsideOutput(report, output)
  const { manifest } = loadManifest(output)
  const roots = packageRoots(manifest)
  const audit = auditAssets({ output, roots })
  const result = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    output,
    packageRoots: roots,
    ...audit,
    pass: audit.pass
  }
  writeReport(report, result)
  return { result, report }
}

function main() {
  const defaultReport = path.join(DEFAULT_REPORT_DIR, 'package-assets.json')
  let output = DEFAULT_OUTPUT
  let report = defaultReport
  try {
    const args = parseArgs(process.argv.slice(2), {
      aliases: { '--output': 'output', '--report': 'report' }
    })
    output = resolveProjectPath(args.output, DEFAULT_OUTPUT)
    report = resolveProjectPath(args.report, defaultReport)
    const { result, report: reportPath } = auditPackageAssets({ output, report })
    console.log(`[Package assets] ${result.pass ? 'PASS' : 'FAIL'} files=${result.filesScanned} references=${result.references.length} report=${reportPath}`)
    for (const item of result.missing) console.error(`[Package assets] missing ${item.source}:${item.line} ${item.kind} -> ${item.path}`)
    for (const item of result.crossPackage) console.error(`[Package assets] ${item.violation} ${item.source}:${item.line} -> ${item.path} (${item.from} -> ${item.to})`)
    for (const item of result.unknownDynamic) console.error(`[Package assets] unresolved dynamic reference ${item.file}:${item.line}: ${item.expression}`)
    for (const item of result.parseErrors) console.error(`[Package assets] parse error ${item.file}: ${item.error}`)
    if (!result.pass) process.exitCode = 1
  } catch (error) {
    try { writeFailureReport(report, output, error) } catch (reportError) { console.error(`[Package assets] could not write failure report: ${reportError.message}`) }
    throw error
  }
}

if (require.main === module) {
  try { main() } catch (error) {
    console.error(`[Package assets] FAIL: ${error.message}`)
    process.exitCode = 1
  }
}

module.exports = { auditPackageAssets }
