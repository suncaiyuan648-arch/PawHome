'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
const METADATA_PATH = path.join(ROOT, 'packages/discovery/services/cityPickerMetadata.ts')

test('city-picker metadata preserves directory fixtures and returns isolated page state', async () => {
  const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
  const first = metadata.createCityPickerPageMetadata()
  const second = metadata.createCityPickerPageMetadata()
  const groups = metadata.createCityGroups()

  assert.equal(first.currentCity, '郑州市')
  assert.equal(first.selectedIndex, 'A')
  assert.equal(first.hotCities.length, 12)
  assert.deepEqual(
    groups.map((group) => group.letter),
    [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'J',
      'K',
      'L',
      'M',
      'N',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'W',
      'X',
      'Y',
      'Z',
    ],
  )
  assert.equal(groups[0].cities.length, 9)
  assert.deepEqual(groups[0].cities, Array(9).fill('阿坝'))

  first.hotCities[0] = 'page-local'
  groups[1].cities[0] = 'page-local'
  assert.equal(second.hotCities[0], '北京')
  assert.equal(metadata.createCityGroups()[1].cities[0], '北京')
})

test('city-picker filtering and side index retain expected letter grouping', async () => {
  const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
  assert.deepEqual(metadata.filterCityGroups('  '), metadata.createCityGroups())
  assert.deepEqual(metadata.filterCityGroups('京'), [
    { letter: 'B', cities: ['北京'] },
    { letter: 'N', cities: ['南京'] },
  ])
  assert.deepEqual(metadata.filterCityGroups('不存在'), [])
  assert.deepEqual(metadata.createCityPickerIndexLabels().slice(0, 4), ['热门', 'A', 'B', 'C'])
})

test('city-picker route input safely decodes a current city and falls back for invalid input', async () => {
  const metadata = await import(`${pathToFileURL(METADATA_PATH).href}?test=${Date.now()}`)
  assert.equal(
    metadata.normalizeCityPickerRoute({ current: '%E6%9D%AD%E5%B7%9E%E5%B8%82' }),
    '杭州市',
  )
  assert.equal(metadata.normalizeCityPickerRoute({ current: '%E0%A4%A' }), '%E0%A4%A')
  assert.equal(metadata.normalizeCityPickerRoute({ current: 12 }), '12')
  assert.equal(metadata.normalizeCityPickerRoute({ current: 0 }), '郑州市')
  assert.equal(metadata.normalizeCityPickerRoute(null), '郑州市')
})

test('city-picker page consumes typed metadata without explicit any annotations', async () => {
  const page = await fs.readFile(
    path.join(ROOT, 'packages/discovery/pages/city-picker/index.vue'),
    'utf8',
  )
  const metadata = await fs.readFile(METADATA_PATH, 'utf8')
  assert.doesNotMatch(page, /\bany\b/)
  assert.doesNotMatch(page, /Record<string,\s*any>/)
  assert.match(page, /data\(\):\s*CityPickerPageState/)
  assert.match(page, /onLoad\(query:\s*unknown/)
  assert.match(page, /filterCityGroups\(this\.keyword\)/)
  assert.doesNotMatch(metadata, /\bany\b/)
})
