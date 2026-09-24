'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const sourcePath = path.join(ROOT, 'services/domainReads/rescue/stateContract.ts')
let tempRoot
let contract

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-rescue-state-contract-'))
  await fs.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
  const target = path.join(tempRoot, 'stateContract.ts')
  await fs.copyFile(sourcePath, target)
  contract = await import(`${pathToFileURL(target).href}?test=${Date.now()}-${Math.random()}`)
})

after(async () => {
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

test('state contract is pure and does not depend on Vue, uni, pages, or storage', async () => {
  const source = await fs.readFile(sourcePath, 'utf8')
  assert.doesNotMatch(source, /(?:from\s+['"]|require\s*\(|uni\.|PAWHOME_RESCUES|@\/)/)
  assert.doesNotMatch(
    source,
    /(?:setStorageSync|getStorageSync|removeStorageSync|transitionRescue)/,
  )
  assert.equal(typeof contract.normalizeRescueState, 'function')
  assert.equal(typeof contract.parseRescueState, 'function')
  assert.equal(typeof contract.readRescueStateProjection, 'function')

  globalThis.uni = new Proxy(
    {},
    {
      get() {
        throw new Error('state contract must not touch uni')
      },
    },
  )
  assert.doesNotThrow(() =>
    contract.readRescueStateProjection({ applicationStatus: 'platform_pending' }),
  )
})

test('platform approval without funding evidence stays unknown and never becomes paid', () => {
  const projection = contract.readRescueStateProjection({ applicationStatus: 'platform_approved' })
  assert.equal(projection.applicationStatus, 'platform_approved')
  assert.equal(projection.fundingStatus, 'unknown')
  assert.equal(projection.funding.known, false)
  assert.equal(projection.funding.paid, null)
  assert.equal(projection.validity, 'unknown')
  assert.notEqual(projection.fundingStatus, 'funding_paid')
})

test('funding failure is a readable funding result on its own axis', () => {
  const projection = contract.readRescueStateProjection({
    applicationStatus: 'platform_approved',
    reviewStatus: 'approved',
    fundingStatus: 'funding_failed',
  })
  assert.equal(projection.validity, 'valid')
  assert.equal(projection.applicationStatus, 'platform_approved')
  assert.equal(projection.reviewStatus, 'approved')
  assert.equal(projection.fundingStatus, 'funding_failed')
  assert.equal(projection.funding.paid, false)
})

test('only explicit funding_paid is presented as paid', () => {
  const paid = contract.readRescueStateProjection({
    applicationStatus: 'platform_approved',
    review: { status: 'approved' },
    funding: { status: 'funding_paid' },
  })
  assert.equal(paid.fundingStatus, 'funding_paid')
  assert.equal(paid.funding.paid, true)
  assert.equal(paid.validity, 'valid')

  const inferred = contract.readRescueStateProjection({
    applicationStatus: 'platform_approved',
    reviewStatus: 'approved',
  })
  assert.equal(inferred.fundingStatus, 'unknown')
  assert.notEqual(inferred.funding.paid, true)
})

test('missing and unknown statuses fail closed without filling from another axis', () => {
  const missing = contract.readRescueStateProjection({})
  assert.equal(missing.applicationStatus, 'unknown')
  assert.equal(missing.reviewStatus, 'unknown')
  assert.equal(missing.fundingStatus, 'unknown')
  assert.equal(missing.validity, 'unknown')

  const unknown = contract.readRescueStateProjection({
    applicationStatus: 'platform_future',
    reviewStatus: 'review_future',
    fundingStatus: 'funding_future',
  })
  assert.equal(unknown.validity, 'invalid')
  assert.equal(unknown.applicationStatus, 'unknown')
  assert.equal(unknown.reviewStatus, 'unknown')
  assert.equal(unknown.fundingStatus, 'unknown')
  assert.deepEqual(
    unknown.errors.map((error) => error.code),
    ['UNKNOWN_STATUS', 'UNKNOWN_STATUS', 'UNKNOWN_STATUS'],
  )
})

test('application and funding conflicts remain invalid instead of being repaired', () => {
  const rejectedPaid = contract.readRescueStateProjection({
    applicationStatus: 'platform_rejected',
    fundingStatus: 'funding_paid',
  })
  assert.equal(rejectedPaid.validity, 'invalid')
  assert.equal(rejectedPaid.applicationStatus, 'platform_rejected')
  assert.equal(rejectedPaid.fundingStatus, 'funding_paid')
  assert.equal(rejectedPaid.funding.paid, false)
  assert.equal(rejectedPaid.funding.displayStatus, 'unknown')
  assert.ok(
    rejectedPaid.errors.some((error) => error.code === 'FUNDING_BEFORE_APPLICATION_APPROVAL'),
  )

  const conflictingFields = contract.readRescueStateProjection({
    applicationStatus: 'platform_approved',
    fundingStatus: 'funding_paid',
    funding: { status: 'funding_failed' },
  })
  assert.equal(conflictingFields.validity, 'invalid')
  assert.equal(conflictingFields.fundingStatus, 'unknown')
  assert.equal(conflictingFields.funding.paid, null)
  assert.ok(conflictingFields.errors.some((error) => error.code === 'CONFLICTING_STATUS'))
})

test('review and funding status are independent, including legacy rescueStorage fields', () => {
  const legacyPending = contract.readRescueStateProjection({
    applicationStatus: 'platform_pending',
    status: 'pending',
  })
  assert.equal(legacyPending.reviewStatus, 'pending')
  assert.equal(legacyPending.fundingStatus, 'unknown')
  assert.equal(legacyPending.applicationStatus, 'platform_pending')

  const legacyPaid = contract.readRescueStateProjection({
    applicationStatus: 'platform_approved',
    status: 'paid',
  })
  assert.equal(legacyPaid.fundingStatus, 'funding_paid')
  assert.equal(legacyPaid.reviewStatus, 'unknown')
  assert.equal(legacyPaid.applicationStatus, 'platform_approved')
  assert.equal(legacyPaid.funding.paid, false)
  assert.equal(legacyPaid.funding.displayStatus, 'unknown')
  assert.equal(legacyPaid.validity, 'invalid')

  const explicitAndLegacyConflict = contract.readRescueStateProjection({
    applicationStatus: 'platform_approved',
    fundingStatus: 'funding_failed',
    status: 'paid',
  })
  assert.equal(explicitAndLegacyConflict.validity, 'invalid')
  assert.equal(explicitAndLegacyConflict.fundingStatus, 'unknown')
})

test('query, role, and outcome are presentation inputs only and cannot alter projection', () => {
  const record = {
    applicationStatus: 'platform_approved',
    reviewStatus: 'approved',
    fundingStatus: 'funding_failed',
    query: { role: 'admin', outcome: 'paid' },
  }
  const base = contract.readRescueStateProjection(record)
  for (const input of [
    { ...record, query: { role: 'applicant', outcome: 'paid' } },
    { ...record, role: 'admin', outcome: 'funding_paid' },
    { ...record, role: 'reviewer', outcome: 'approved' },
  ]) {
    assert.deepEqual(contract.readRescueStateProjection(input), base)
  }
  assert.equal(base.capabilities.canWriteFunding, false)
  assert.equal(base.capabilities.canTransitionFunding, false)
  assert.equal('writeFunding' in contract, false)
  assert.equal('transitionFunding' in contract, false)
})

test('parseRescueState reports malformed input without synthesizing a successful state', () => {
  const valid = contract.parseRescueState(
    JSON.stringify({
      applicationStatus: 'platform_approved',
      reviewStatus: 'approved',
      fundingStatus: 'funding_paid',
    }),
  )
  assert.equal(valid.ok, true)
  assert.equal(valid.code, 'OK')
  assert.equal(valid.state.fundingStatus, 'funding_paid')

  const malformedJson = contract.parseRescueState('{')
  assert.equal(malformedJson.ok, false)
  assert.equal(malformedJson.code, 'INVALID_JSON')
  assert.equal(malformedJson.state.fundingStatus, 'unknown')
  assert.notEqual(malformedJson.state.funding.paid, true)

  const malformedRecord = contract.parseRescueState([])
  assert.equal(malformedRecord.ok, false)
  assert.equal(malformedRecord.code, 'INVALID_RECORD')
})
