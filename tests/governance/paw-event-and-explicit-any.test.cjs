'use strict'

const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')
const ts = require('typescript')
const { parse } = require('@vue/compiler-sfc')

const ROOT = path.resolve(__dirname, '../..')

test('Paw event readers safely normalize mini-program input, numeric detail, and dataset values', async () => {
	const metadata = await import(`${pathToFileURL(path.join(ROOT, 'utils/pawEventMetadata.ts')).href}?test=${Date.now()}`)
	assert.equal(metadata.readPawEventValue({ detail: { value: '小院名称' } }), '小院名称')
	assert.equal(metadata.readPawEventValue({ detail: { value: 42 } }), '')
	assert.equal(metadata.readPawEventValue({ detail: 2 }), '')
	assert.equal(metadata.readPawEventNumber({ detail: { current: 3 } }, 'current'), 3)
	assert.equal(metadata.readPawEventNumber({ detail: { value: '4' } }, 'value'), 4)
	assert.equal(metadata.readPawEventNumber({ detail: { value: 'not-a-number' } }, 'value'), 0)
	assert.equal(metadata.readPawEventDatasetValue({ currentTarget: { dataset: { index: '2' } } }, 'index'), '2')
	assert.equal(metadata.readPawEventDatasetValue({ currentTarget: null }, 'index'), undefined)
})

test('production TS/Vue sources contain no explicit any type nodes or broad any reactive states', () => {
	const files = execFileSync('rg', [
		'--files', '-g', '*.ts', '-g', '*.tsx', '-g', '*.vue',
		'-g', '!tests/**', '-g', '!docs/**', '-g', '!uni_modules/**', '-g', '!node_modules/**', '-g', '!.artifacts/**',
	], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
	const findings = []

	for (const file of files) {
		const source = fs.readFileSync(path.join(ROOT, file), 'utf8')
		const scripts = []
		if (file.endsWith('.vue')) {
			const { descriptor } = parse(source, { filename: file })
			if (descriptor.script) scripts.push(descriptor.script.content)
			if (descriptor.scriptSetup) scripts.push(descriptor.scriptSetup.content)
		} else {
			scripts.push(source)
		}

		for (const script of scripts) {
			const sourceFile = ts.createSourceFile(file, script, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
			const visit = node => {
				if (node.kind === ts.SyntaxKind.AnyKeyword) findings.push(file)
				ts.forEachChild(node, visit)
			}
			visit(sourceFile)
		}
	}

	assert.deepEqual(findings, [])
})
