'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8')
}

test('wechat and phone login establish the trusted actor session contract', () => {
  for (const file of [
    'packages/auth/pages/login/index.vue',
    'packages/auth/pages/sms-verify/index.vue',
  ]) {
    const source = read(file)
    assert.match(
      source,
      /setStorageSync\('PAWHOME_ACTOR_SESSION',\s*\{\s*actor:\s*\{\s*id:\s*'local-user',\s*roles:\s*\[\s*'applicant'\s*,?\s*\]\s*,?\s*\}\s*,?\s*\}\)/,
    )
    assert.doesNotMatch(source, /PAWHOME_LOGGED_IN/)
  }
})

test('account entry checks the trusted session and logout clears it', () => {
  assert.match(read('pages/me/index.vue'), /getStorageSync\('PAWHOME_ACTOR_SESSION'\)/)
  const settings = read('packages/account/pages/settings/index.vue')
  assert.match(settings, /removeStorageSync\('PAWHOME_ACTOR_SESSION'\)/)
  assert.equal(fs.existsSync(path.join(ROOT, 'pages/meMore/settings.vue')), false)
  assert.match(
    read('pages.json'),
    /"root": "packages\/account"[\s\S]*"path": "pages\/settings\/index"/,
  )
  assert.doesNotMatch(read('pages/me/index.vue'), /\/pages\/meMore\/settings/)
})

test('auth C0 migration registers semantic package routes and removes legacy page sources', () => {
  const pages = read('pages.json')
  assert.match(
    pages,
    /"root": "packages\/auth"[\s\S]*"path": "pages\/login\/index"[\s\S]*"path": "pages\/phone-bind\/index"[\s\S]*"path": "pages\/sms-verify\/index"[\s\S]*"path": "pages\/real-name\/index"[\s\S]*"path": "pages\/verification-result\/index"/,
  )
  assert.doesNotMatch(pages, /pages\/auth/)
  for (const file of [
    'pages/auth/login.vue',
    'pages/auth/bindPhone.vue',
    'pages/auth/smsVerify.vue',
    'pages/auth/realName.vue',
    'pages/auth/verifyResult.vue',
  ])
    assert.equal(
      fs.existsSync(path.join(ROOT, file)),
      false,
      `${file} should be removed after migration`,
    )
})
