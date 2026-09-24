'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

test('yard certification fixtures and state values use isolated typed metadata', async () => {
  const metadata = await import(
    `${pathToFileURL(path.join(ROOT, 'packages/yard/services/yardCertificationMetadata.ts')).href}?test=${Date.now()}`
  )
  const first = metadata.createYardCertificationMetadata()
  assert.deepEqual(first.form, {
    orgName: '小坏蛋',
    orgAddress: '湖南省长沙市中意一路鼎丰前程国际',
  })
  assert.equal(first.certPhotos.length, 3)
  first.form.orgName = 'local edit'
  first.certPhotos[0] = 'local image'
  assert.equal(metadata.createYardCertificationMetadata().form.orgName, '小坏蛋')
  assert.notEqual(metadata.createYardCertificationMetadata().certPhotos[0], 'local image')
  assert.equal(metadata.normalizeYardCertificationState(98), 98)
  assert.equal(metadata.normalizeYardCertificationState('99'), 99)
  assert.equal(metadata.normalizeYardCertificationState('malformed'), 97)
  assert.equal(metadata.normalizeYardCertificationState(100), 97)
})

test('yard onboarding fixtures are clone-safe and yard pages consume explicit state contracts', async () => {
  const onboarding = await import(
    `${pathToFileURL(path.join(ROOT, 'packages/yard/services/yardOnboardingMetadata.ts')).href}?test=${Date.now()}`
  )
  const first = onboarding.createYardOnboardingMetadata()
  assert.equal(first.dutiesRules.length, 5)
  assert.equal(first.forbiddenRules.length, 3)
  assert.equal(first.forbiddenRules[0][1].danger, true)
  first.dutiesRules[0].lead = 'local edit'
  first.forbiddenRules[0][1].text = 'local edit'
  const second = onboarding.createYardOnboardingMetadata()
  assert.equal(second.dutiesRules[0].lead, '完善小院信息：')
  assert.equal(second.forbiddenRules[0][1].text, '骗取猫粮、牟取不正当利益')

  const paths = [
    'packages/yard/pages/certification/index.vue',
    'packages/yard/pages/editor/index.vue',
    'packages/yard/pages/onboarding/index.vue',
  ]
  const sources = await Promise.all(paths.map((file) => fs.readFile(path.join(ROOT, file), 'utf8')))
  for (const source of sources) assert.doesNotMatch(source, /\bany\b/)
  assert.match(sources[0], /data\(\): YardCertificationPageState/)
  assert.match(sources[0], /normalizeYardCertificationState\(route\.state\)/)
  assert.match(sources[1], /data\(\): YardEditorPageState/)
  assert.match(sources[1], /onInput\(field: YardEditorField, event: PawEvent\)/)
  assert.match(sources[2], /data\(\): CatGuidePageState/)
  assert.match(sources[2], /createYardOnboardingMetadata\(\)/)
})
