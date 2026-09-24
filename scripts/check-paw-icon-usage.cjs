#!/usr/bin/env node
'use strict'

const path = require('path')
const { scanUnknownIconNames } = require('./check-paw-icons.cjs')

const root = path.resolve(process.env.PAWHOME_PROJECT_ROOT || path.resolve(__dirname, '..'))
const unknown = scanUnknownIconNames({ root })

if (unknown.length) {
  console.error('[PawIcon usage] FAIL')
  console.error(unknown.join('\n'))
  process.exitCode = 1
} else {
  console.log(
    '[PawIcon usage] PASS: static icon names in pages/components/packages/services/navigation are registered',
  )
}

module.exports = { scanUnknownIconNames }
