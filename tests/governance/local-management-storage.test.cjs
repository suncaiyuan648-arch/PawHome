'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { test, before, after } = require('node:test')

const ROOT = path.resolve(__dirname, '../..')
let tempRoot
let profileApi
let yardApi
let animalApi

function actor(id, roles = []) { return () => ({ actor: { id, roles } }) }
function memoryStorage() {
  const values = new Map()
  return {
    values,
    getStorageSync(key) { return values.get(key) },
    setStorageSync(key, value) { values.set(key, value) },
  }
}

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pawhome-local-management-'))
  await fs.writeFile(path.join(tempRoot, 'package.tson'), '{"type":"module"}\n')
  await fs.mkdir(path.join(tempRoot, 'navigation'), { recursive: true })
  for (const file of ['actorCapabilities.ts', 'managementContracts.ts']) {
    await fs.copyFile(path.join(ROOT, 'navigation', file), path.join(tempRoot, 'navigation', file))
  }
  for (const domain of ['account', 'yard', 'animal']) await fs.mkdir(path.join(tempRoot, 'packages', domain, 'services'), { recursive: true })
  await fs.copyFile(path.join(ROOT, 'packages/account/services/localProfileStorage.ts'), path.join(tempRoot, 'packages/account/services/localProfileStorage.ts'))
  await fs.copyFile(path.join(ROOT, 'packages/yard/services/localManagementStorage.ts'), path.join(tempRoot, 'packages/yard/services/localManagementStorage.ts'))
  await fs.copyFile(path.join(ROOT, 'packages/animal/services/localManagementStorage.ts'), path.join(tempRoot, 'packages/animal/services/localManagementStorage.ts'))
  profileApi = await import(`${pathToFileURL(path.join(tempRoot, 'packages/account/services/localProfileStorage.ts')).href}?profile=${Date.now()}`)
  yardApi = await import(`${pathToFileURL(path.join(tempRoot, 'packages/yard/services/localManagementStorage.ts')).href}?yard=${Date.now()}`)
  animalApi = await import(`${pathToFileURL(path.join(tempRoot, 'packages/animal/services/localManagementStorage.ts')).href}?animal=${Date.now()}`)
})

after(async () => { if (tempRoot) await fs.rm(tempRoot, { recursive: true, force: true }) })

test('profile local reader/writer is actor scoped and preserves identity', () => {
  const storage = memoryStorage()
  storage.setStorageSync(profileApi.PROFILE_STORAGE_KEY, JSON.stringify([{ userId: 'user-a', status: 'active', visibility: 'public', nickname: 'A', tags: [] }]))
  const own = profileApi.readLocalProfile('user-a', { actorProvider: actor('user-a'), storage })
  assert.equal(own.success, true)
  const updated = profileApi.updateLocalProfile('user-a', { nickname: 'B', bio: 'bio' }, { actorProvider: actor('user-a'), storage })
  assert.equal(updated.success, true)
  assert.equal(updated.data.record.userId, 'user-a')
  assert.equal(updated.data.record.nickname, 'B')
  const denied = profileApi.updateLocalProfile('user-a', { nickname: 'C' }, { actorProvider: actor('user-b'), storage })
  assert.equal(denied.success, false)
  assert.equal(denied.error.code, 'FORBIDDEN')
  assert.equal(profileApi.updateLocalProfile('user-a', { status: 'inactive' }, { actorProvider: actor('user-a'), storage }).error.code, 'FIELD_NOT_EDITABLE')
})

test('yard local reader/writer requires the current yard owner relation', () => {
  const storage = memoryStorage()
  storage.setStorageSync(yardApi.YARD_STORAGE_KEY, JSON.stringify([{ yardId: 'yard-a', yardOwnerId: 'owner-a', status: 'active', visibility: 'public', name: 'A' }]))
  assert.equal(yardApi.readLocalYard('yard-a', { actorProvider: actor('owner-a', ['yard_owner']), storage }).success, true)
  const updated = yardApi.updateLocalYard('yard-a', { name: 'B' }, { actorProvider: actor('owner-a', ['yard_owner']), storage })
  assert.equal(updated.success, true)
  assert.equal(updated.data.record.name, 'B')
  const denied = yardApi.readLocalYard('yard-a', { actorProvider: actor('owner-b', ['yard_owner']), storage })
  assert.equal(denied.success, false)
  assert.equal(denied.error.code, 'FORBIDDEN')
})

test('animal local reader/writer enforces yard relation and manager capability', () => {
  const storage = memoryStorage()
  storage.setStorageSync(animalApi.ANIMAL_STORAGE_KEY, JSON.stringify([{ animalId: 'animal-a', yardId: 'yard-a', managerIds: ['manager-a'], yardOwnerId: 'owner-a', status: 'active', visibility: 'public', name: 'Cat' }]))
  const manager = animalApi.readLocalAnimal('animal-a', { yardId: 'yard-a', actorProvider: actor('manager-a', ['animal_manager']), storage })
  assert.equal(manager.success, true)
  const updated = animalApi.updateLocalAnimal('animal-a', { name: 'Cat 2' }, { yardId: 'yard-a', actorProvider: actor('manager-a', ['animal_manager']), storage })
  assert.equal(updated.success, true)
  assert.equal(updated.data.record.name, 'Cat 2')
  const crossYard = animalApi.readLocalAnimal('animal-a', { yardId: 'yard-b', actorProvider: actor('manager-a', ['animal_manager']), storage })
  assert.equal(crossYard.success, false)
  assert.equal(crossYard.error.code, 'CROSS_YARD_RELATION')
  const denied = animalApi.updateLocalAnimal('animal-a', { name: 'Nope' }, { yardId: 'yard-a', actorProvider: actor('cloud-a', ['cloud_parent']), storage })
  assert.equal(denied.success, false)
  assert.equal(denied.error.code, 'FORBIDDEN')
})

test('public projections and managed animal creation use persisted relationships', () => {
  const storage = memoryStorage()
  storage.setStorageSync(profileApi.PROFILE_STORAGE_KEY, JSON.stringify([{ userId: 'user-a', status: 'active', visibility: 'public', nickname: 'Persisted' }]))
  storage.setStorageSync(yardApi.YARD_STORAGE_KEY, JSON.stringify([{ yardId: 'yard-a', yardOwnerId: 'owner-a', status: 'active', visibility: 'public', name: 'Persisted Yard' }]))
  storage.setStorageSync(animalApi.ANIMAL_STORAGE_KEY, JSON.stringify([]))
  assert.equal(profileApi.readPublicProfile('user-a', { storage }).data.record.nickname, 'Persisted')
  assert.equal(yardApi.readPublicYard('yard-a', { storage }).data.record.name, 'Persisted Yard')
  const created = animalApi.createLocalAnimal('yard-a', { name: 'New Cat', breed: '英短', status: '待领养', petValue: 20, gender: '女生' }, { actorProvider: actor('owner-a', ['yard_owner']), storage })
  assert.equal(created.success, true)
  assert.equal(created.data.record.status, 'active')
  assert.equal(created.data.record.statusLabel, '待领养')
  const publicAnimal = animalApi.readPublicAnimal(created.data.record.animalId, { yardId: 'yard-a', storage })
  assert.equal(publicAnimal.success, true)
  const edited = animalApi.updateLocalAnimal(created.data.record.animalId, { petValue: 30, gender: '男生', status: '已领养' }, { yardId: 'yard-a', actorProvider: actor('owner-a', ['yard_owner']), storage })
  assert.equal(edited.success, true)
  assert.equal(edited.data.record.petValue, 30)
  assert.equal(edited.data.record.statusLabel, '已领养')
})

test('animal detail keeps visual state separate from management capability', async () => {
  const detail = await fs.readFile(path.join(ROOT, 'packages/animal/pages/detail/index.vue'), 'utf8')
  const figma = await fs.readFile(path.join(ROOT, 'packages/animal/pages/detail/components/PawPetDetailFigma.vue'), 'utf8')
  assert.match(detail, /readLocalAnimal/)
  assert.match(detail, /this\.managedPet = Boolean\(managed && managed\.success\)/)
  assert.doesNotMatch(detail, /query\s*&&\s*query\.managed/)
  assert.match(figma, /return this\.managed === true/)
  assert.doesNotMatch(figma, /this\.managed \|\| this\.variant === 36/)
})
