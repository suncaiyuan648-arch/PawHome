'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
let tempRoot
let api

function actor(id = 'author-a', roles = []) {
	return () => ({ actor: { id, roles } })
}

function record(overrides = {}) {
	return { dynamicId: 'dynamic-a', commentId: 'comment-a', authorId: 'author-a', text: 'current', ...overrides }
}

before(async () => {
	tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-social-contract-'))
	await fs.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
	await fs.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
	await fs.copyFile(path.join(ROOT, 'navigation/actorCapabilities.js'), path.join(tempRoot, 'navigation/actorCapabilities.js'))
	await fs.copyFile(path.join(ROOT, 'navigation/socialMutationContracts.js'), path.join(tempRoot, 'navigation/socialMutationContracts.js'))
	api = await import(`${pathToFileURL(path.join(tempRoot, 'navigation/socialMutationContracts.js')).href}?test=${Date.now()}`)
})

after(async () => {
	if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

test('authorized author intent remains explicitly unavailable and exposes no writer', () => {
	const result = api.evaluateSocialMutation({ intent: 'delete', dynamicId: 'dynamic-a', commentId: 'comment-a', record: record(), actorProvider: actor() })
	assert.equal(result.status, 'empty')
	assert.equal(result.code, 'SOCIAL_MUTATION_UNAVAILABLE')
	assert.equal(result.canWrite, false)
	assert.equal(result.readOnly, true)
	assert.equal(Object.isFrozen(result), true)
	assert.equal(Object.keys(api).some(key => /write|save|delete|update|remove/i.test(key)), false)
})

test('non-author, forged role, and query fields cannot authorize deletion or correction', () => {
	const other = api.evaluateSocialMutation({ intent: 'correct', dynamicId: 'dynamic-a', commentId: 'comment-a', record: record(), actorProvider: actor('other-a', ['yard_owner', 'reviewer']) })
	assert.equal(other.code, 'FORBIDDEN')
	const forged = api.evaluateSocialMutation({ intent: 'delete', dynamicId: 'dynamic-a', commentId: 'comment-a', record: record({ authorId: 'author-a' }), actorProvider: actor('other-a') })
	assert.equal(forged.code, 'FORBIDDEN')
	assert.equal(api.evaluateSocialMutation({ intent: 'delete', dynamicId: 'dynamic-a', commentId: 'comment-a', record: record(), actorProvider: actor(), role: 'owner' }).code, 'UNKNOWN_FIELD')
})

test('missing actor, mismatched target, malformed IDs, and unsupported intents fail closed', () => {
	assert.equal(api.evaluateSocialMutation({ intent: 'delete', dynamicId: 'dynamic-a', commentId: 'comment-a', record: record() }).code, 'ACTOR_PROVIDER_REQUIRED')
	assert.equal(api.evaluateSocialMutation({ intent: 'delete', dynamicId: 'dynamic-a', commentId: 'comment-b', record: record(), actorProvider: actor() }).code, 'OBJECT_MISMATCH')
	assert.equal(api.evaluateSocialMutation({ intent: 'delete', dynamicId: 'dynamic/a', commentId: 'comment-a', record: record(), actorProvider: actor() }).code, 'INVALID_ID')
	assert.equal(api.evaluateSocialMutation({ intent: 'restore', dynamicId: 'dynamic-a', commentId: 'comment-a', record: record(), actorProvider: actor() }).code, 'INVALID_INTENT')
})
