#!/usr/bin/env node
'use strict'

const path = require('path')
const {
  DEFAULT_BUDGETS,
  DEFAULT_OUTPUT,
  DEFAULT_REPORT_DIR,
  bytesToKiB,
  duplicateGroups,
  ensureReportOutsideOutput,
  inventoryOutput,
  loadManifest,
  packageRoots,
  packageTotals,
  parseArgs,
  readBudgets,
  readJson,
  resolveProjectPath,
  writeFailureReport,
  writeReport,
} = require('./lib/package-audit-common.cjs')

function budgetBytes(value, label) {
  const bytes = Number(value)
  if (!Number.isInteger(bytes) || bytes <= 0)
    throw new Error(`${label} must be a positive integer byte budget`)
  return bytes
}

function baselineTotals(file) {
  const value = readJson(file)
  const packages = value.packages || value.packageSizes || value.totals || value
  const result = {}
  for (const [name, entry] of Object.entries(packages || {})) {
    const bytes = typeof entry === 'number' ? entry : entry && (entry.bytes ?? entry.totalBytes)
    if (Number.isFinite(Number(bytes))) result[name] = Number(bytes)
  }
  return result
}

function auditSize(options = {}) {
  const output = options.output || DEFAULT_OUTPUT
  const report = options.report || path.join(DEFAULT_REPORT_DIR, 'package-size.json')
  ensureReportOutsideOutput(report, output)
  const budgets = options.budgets || readBudgets(options.budgetsFile || DEFAULT_BUDGETS)
  const { file: manifestFile, manifest } = loadManifest(output)
  const roots = packageRoots(manifest)
  const files = inventoryOutput(output, roots)
  const totals = packageTotals(files, roots)
  if (budgets.phase !== undefined && !['migration', 'final'].includes(budgets.phase))
    throw new Error('budget phase must be migration or final')
  const limits = budgets.limits || {}
  const hardPackageBytes = budgetBytes(limits.hardPackageBytes, 'limits.hardPackageBytes')
  const migrationMainMaxBytes = budgetBytes(
    limits.migrationMainMaxBytes,
    'limits.migrationMainMaxBytes',
  )
  const mainTargetBytes = budgetBytes(limits.mainTargetBytes, 'limits.mainTargetBytes')
  const totalTargetBytes = budgetBytes(limits.totalTargetBytes, 'limits.totalTargetBytes')
  const domainBudgets = budgets.domainBudgetsKiB || {}
  for (const [domain, value] of Object.entries(domainBudgets))
    budgetBytes(value, `domainBudgetsKiB.${domain}`)
  const final = Boolean(options.final || budgets.phase === 'final')
  const mainLimit = final ? mainTargetBytes : migrationMainMaxBytes
  const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0)
  const packageReports = {}
  const errors = []
  const warnings = []
  for (const root of roots) {
    const packageFiles = files.filter((file) => file.package === root.name)
    const bytes = totals[root.name] || 0
    const domain = root.name === 'main' ? null : root.root.split('/').at(-1)
    const domainBudget =
      domain && domainBudgets[domain] !== undefined ? Number(domainBudgets[domain]) * 1024 : null
    packageReports[root.name] = {
      root: root.root || null,
      bytes,
      KiB: bytesToKiB(bytes),
      fileCount: packageFiles.length,
      hardLimitBytes: hardPackageBytes,
      targetBytes: root.name === 'main' ? mainLimit : domainBudget,
      topFiles: packageFiles
        .slice()
        .sort((left, right) => right.bytes - left.bytes || left.path.localeCompare(right.path))
        .slice(0, 20)
        .map((file) => ({
          path: file.path,
          bytes: file.bytes,
          KiB: bytesToKiB(file.bytes),
          sha256: file.hash,
        })),
    }
    if (bytes > hardPackageBytes)
      errors.push(`${root.name} exceeds hard package limit: ${bytes} > ${hardPackageBytes}`)
    if (root.name === 'main' && bytes > mainLimit)
      errors.push(`main exceeds ${final ? 'final' : 'migration'} limit: ${bytes} > ${mainLimit}`)
    if (domainBudget !== null && bytes > domainBudget) {
      const message = `${root.name} exceeds configured ${domain} domain budget: ${bytes} > ${domainBudget}`
      if (final) errors.push(message)
      else warnings.push(message)
    }
  }
  if (totalBytes > totalTargetBytes)
    errors.push(`total output exceeds target: ${totalBytes} > ${totalTargetBytes}`)

  let baseline = null
  if (options.baseline) {
    const baselinePath = options.baseline
    const previous = baselineTotals(baselinePath)
    baseline = { file: baselinePath, packages: {} }
    for (const [name, bytes] of Object.entries(totals)) {
      const prior = previous[name]
      baseline.packages[name] = {
        currentBytes: bytes,
        baselineBytes: prior === undefined ? null : prior,
        deltaBytes: prior === undefined ? null : bytes - prior,
        deltaKiB: prior === undefined ? null : bytesToKiB(bytes - prior),
      }
    }
  }

  const result = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    output: output,
    manifest: manifestFile,
    phase: final ? 'final' : 'migration',
    limits: {
      hardPackageBytes,
      mainLimitBytes: mainLimit,
      mainTargetBytes,
      migrationMainMaxBytes,
      totalTargetBytes,
    },
    total: { bytes: totalBytes, KiB: bytesToKiB(totalBytes), fileCount: files.length },
    packages: packageReports,
    duplicateContent: duplicateGroups(files),
    baseline,
    errors,
    warnings,
    pass: errors.length === 0,
  }
  writeReport(report, result)
  return { result, report }
}

function main() {
  const defaultReport = path.join(DEFAULT_REPORT_DIR, 'package-size.json')
  let output = DEFAULT_OUTPUT
  let report = defaultReport
  try {
    const args = parseArgs(process.argv.slice(2), {
      aliases: { '--output': 'output', '--report': 'report', '--baseline': 'baseline' },
    })
    output = resolveProjectPath(args.output, DEFAULT_OUTPUT)
    report = resolveProjectPath(args.report, defaultReport)
    const baseline = args.baseline ? resolveProjectPath(args.baseline) : null
    const { result, report: reportPath } = auditSize({
      output,
      report,
      baseline,
      final: args.final,
    })
    console.log(
      `[Package size] ${result.pass ? 'PASS' : 'FAIL'} phase=${result.phase} main=${result.packages.main.KiB}KiB total=${result.total.KiB}KiB report=${reportPath}`,
    )
    for (const warning of result.warnings) console.warn(`[Package size] warning: ${warning}`)
    for (const error of result.errors) console.error(`[Package size] error: ${error}`)
    if (!result.pass) process.exitCode = 1
  } catch (error) {
    try {
      writeFailureReport(report, output, error, {
        phase: process.argv.includes('--final') ? 'final' : 'unknown',
      })
    } catch (reportError) {
      console.error(`[Package size] could not write failure report: ${reportError.message}`)
    }
    throw error
  }
}

if (require.main === module) {
  try {
    main()
  } catch (error) {
    console.error(`[Package size] FAIL: ${error.message}`)
    process.exitCode = 1
  }
}

module.exports = { auditSize, baselineTotals }
