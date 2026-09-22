'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')

const packageRoot = path.resolve(__dirname, '..')

function loadPureValidation() {
  const source = fs.readFileSync(path.join(packageRoot, 'services/proof.js'), 'utf8')
    .replace(/^import[\s\S]*?from ['"][^'"]+['"]\n/gm, '')
    .replace(/^export /gm, '')
  return new Function(`${source}\nreturn { normalizeProofInput, validateProofInput }`)()
}

test('proof validation accepts repeatable local fixture input and rejects incomplete or invalid IDs', () => {
  const { validateProofInput } = loadPureValidation()
  const valid = validateProofInput({
    name: '证实人',
    relation: '同学',
    note: '我了解这次救助情况。',
    idNo: '11010119900307001X',
    agreementChecked: true
  })
  assert.equal(valid.ok, true)
  assert.equal(validateProofInput({ ...valid.value, idNo: 'not-an-id' }).code, 'INVALID_ID_CARD')
  assert.equal(validateProofInput({ ...valid.value, agreementChecked: false }).code, 'AGREEMENT_REQUIRED')
  assert.equal(validateProofInput({ ...valid.value, note: '' }).code, 'MISSING_FIELD')
})

test('proof submission adapter is idempotent by actor and keeps rescue storage as the only write boundary', () => {
  const source = fs.readFileSync(path.join(packageRoot, 'services/proof.js'), 'utf8')
  assert.match(source, /hasRescueProofByUser\(context\.record, actorId\)/)
  assert.match(source, /duplicate: true/)
  assert.match(source, /addRescueProof\(id, /)
  assert.doesNotMatch(source, /PAWHOME_ADOPTIONS|setStorageSync|RESCUE_PROOF/)
})

for (const [relative, routeName] of [
  ['pages/fund/index.vue', 'rescue.detail'],
  ['pages/detail/index.vue', 'rescue.detail'],
  ['pages/proof/list/index.vue', 'rescue.proof.list'],
  ['pages/proof/create/index.vue', 'rescue.proof.create']
]) {
  test(`${relative} accepts only the explicit rescueId route contract`, () => {
    const source = fs.readFileSync(path.join(packageRoot, relative), 'utf8')
    if (relative !== 'pages/fund/index.vue') {
      assert.match(source, /params\.rescueId/)
      assert.match(source, new RegExp(`buildRoute\\(['"]${routeName}['"]`))
      assert.doesNotMatch(source, /options\.(?:id|recordId)/)
      assert.doesNotMatch(source, /includeDemo:\s*false/) // public rescue/proof pages read explicit IDs, including local fixtures
      assert.doesNotMatch(source, /sourceType|adoptionStorage|applicationMockApi|source=adoption/)
    }
  })
}
