'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const METADATA_PATH = path.join(ROOT, 'components/an-notice-bar/noticeMetadata.ts')

test('legacy notice bar state factory returns fresh typed defaults', async () => {
	const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?state=${Date.now()}`)
	const first = metadata.createAnNoticeBarState()
	const second = metadata.createAnNoticeBarState()

	assert.deepEqual(first, {
		number: 0,
		list: [],
		copyText: '',
		show: false,
		showSerialLocal: false,
	})
	first.list.push('local')
	assert.deepEqual(second.list, [])
})

test('legacy notice text splitting preserves pipe-delimited values', async () => {
	const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?split=${Date.now()}`)

	assert.deepEqual(metadata.splitAnNoticeText('first|second'), ['first', 'second'])
	assert.deepEqual(metadata.splitAnNoticeText(''), [''])
	assert.deepEqual(metadata.splitAnNoticeText('first||last'), ['first', '', 'last'])
})

test('legacy notice bar declares its more event and uses explicit state metadata', async () => {
	const component = await fs.readFile(path.join(ROOT, 'components/an-notice-bar/an-notice-bar.vue'), 'utf8')
	const metadata = await fs.readFile(METADATA_PATH, 'utf8')

	assert.doesNotMatch(component, /\bany\b/)
	assert.doesNotMatch(metadata, /\bany\b/)
	assert.match(component, /emits:\s*\{\s*more:\s*\(\) => true/s)
	assert.match(component, /data\(\): AnNoticeBarState/)
	assert.match(component, /splitAnNoticeText\(this\.text\)/)
})
