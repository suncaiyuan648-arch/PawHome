'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after, beforeEach } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
let tempRoot
let picker
let association
const storage = new Map()

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-dynamic-order-picker-'))
  await fs.writeFile(path.join(tempRoot, 'package.json'), '{"type":"module"}\n')
  await fs.mkdir(path.join(tempRoot, 'packages/dynamic/services'), { recursive: true })
  await fs.mkdir(path.join(tempRoot, 'utils'), { recursive: true })
  await fs.copyFile(path.join(ROOT, 'utils/yardMock.ts'), path.join(tempRoot, 'utils/yardMock.ts'))
  const pickerSource = await fs.readFile(
    path.join(ROOT, 'packages/dynamic/services/orderPicker.ts'),
    'utf8',
  )
  await fs.writeFile(
    path.join(tempRoot, 'packages/dynamic/services/orderPicker.ts'),
    pickerSource.replace("'@/utils/yardMock.ts'", "'../../../utils/yardMock.ts'"),
  )
  await fs.copyFile(
    path.join(ROOT, 'packages/dynamic/services/orderAssociation.ts'),
    path.join(tempRoot, 'packages/dynamic/services/orderAssociation.ts'),
  )
  globalThis.uni = { getStorageSync: (key) => storage.get(key) }
  const pickerUrl = pathToFileURL(
    path.join(tempRoot, 'packages/dynamic/services/orderPicker.ts'),
  ).href
  const associationUrl = pathToFileURL(
    path.join(tempRoot, 'packages/dynamic/services/orderAssociation.ts'),
  ).href
  picker = await import(`${pickerUrl}?test=${Date.now()}`)
  association = await import(`${associationUrl}?test=${Date.now()}`)
})

beforeEach(() => storage.clear())

after(async () => {
  delete globalThis.uni
  if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true })
})

test('order picker uses the local yard fixture only when persisted orders are absent', async () => {
  const result = await picker.getFeedingOrders()
  assert.equal(result.success, true)
  assert.equal(result.source, 'publish-local')
  assert.equal(result.data.variant, 'yard')
  assert.equal(result.data.total, result.data.items.length)
  assert.ok(result.data.items.length > 0)
})

test('persisted picker results take precedence and are scoped by yard and feedback eligibility', async () => {
  storage.set(
    'PAWHOME_FEEDING_ORDERS',
    JSON.stringify([
      {
        orderId: 'order-picked',
        type: 'normal_feed',
        status: 'delivered',
        yardId: 'yard-a',
        yardOwnerId: 'owner-a',
        animalId: 'animal-a',
        animalIds: ['animal-a'],
      },
      {
        orderId: 'order-other-yard',
        type: 'normal_feed',
        status: 'delivered',
        yardId: 'yard-b',
        yardOwnerId: 'owner-a',
        animalId: 'animal-b',
      },
      {
        orderId: 'order-gift',
        type: 'adoption_gift',
        status: 'delivered',
        yardId: 'yard-a',
        yardOwnerId: 'owner-a',
        animalId: 'animal-c',
      },
    ]),
  )
  const result = await picker.getFeedingOrders({
    variant: 'yard',
    yardId: 'yard-a',
    yardOwnerId: 'owner-a',
  })
  assert.deepEqual(
    result.data.items.map((item) => item.id),
    ['order-picked'],
  )
  assert.deepEqual(result.data.items[0].petIds, ['animal-a'])
})

test('animal aliases must agree and eligibility rejects non-feeding orders', () => {
  assert.deepEqual(
    association.animalIdsOfOrder({ animalId: 'animal-a', petIds: ['animal-a', 'animal-b'] }),
    { values: ['animal-a', 'animal-b'], error: null },
  )
  assert.equal(
    association.animalIdsOfOrder({ animalId: 'animal-a', petIds: ['animal-b'] }).error,
    'INVALID_ANIMAL_RELATION',
  )
  assert.equal(association.isFeedbackEligible({ status: 'delivered' }), true)
  assert.equal(
    association.isFeedbackEligible({ type: 'adoption_gift', status: 'delivered' }),
    false,
  )
})
