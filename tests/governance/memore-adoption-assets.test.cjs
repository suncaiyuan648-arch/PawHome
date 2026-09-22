'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
test('retired meMore adoption-flow sources and assets are absent', () => {
	for (const relative of [
		'pages/meMore/components/PawAdoptionFlowFigma.vue',
		'pages/meMore/components/PawAdoptionProofForm.vue',
		'pages/meMore/static/figma/adoption-flow/06034d7f1be7897c6f56e74b047d3499044297a1.webp',
		'pages/meMore/static/figma/adoption-flow/07acee523d24ba7ebaf21ec60dee542f1e3fdcd4.webp',
		'pages/meMore/static/figma/adoption-flow/e435a06f02d1fc46102464a34d8d58adf66e97bb.webp',
	]) {
		assert.equal(fs.existsSync(path.join(ROOT, relative)), false, `${relative} must be removed with the migrated page`)
	}
	assert.equal(fs.existsSync(path.join(ROOT, 'pages/yard/components/overlay/PawSelectionSheet.vue')), false)
})
