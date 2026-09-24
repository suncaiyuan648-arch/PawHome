'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const { test } = require('node:test')
const {
  BASELINE_PATH,
  collectUnknownTypeSites,
} = require('../../scripts/unknown-type-boundary.cjs')

test('production unknown type sites stay within the reviewed boundary baseline', () => {
  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'))
  assert.equal(baseline.formatVersion, 1)
  const current = collectUnknownTypeSites()
  const additions = []

  for (const [file, signatures] of Object.entries(current)) {
    for (const [signature, count] of Object.entries(signatures)) {
      const allowed = baseline.sites[file]?.[signature] || 0
      if (count > allowed) additions.push(`${file}: ${signature} (+${count - allowed})`)
    }
  }

  assert.deepEqual(
    additions,
    [],
    [
      'New production unknown type nodes need an explicit boundary review before baseline update.',
      'After review, update with: node scripts/unknown-type-boundary.cjs --write-baseline',
    ].join('\n'),
  )
})
