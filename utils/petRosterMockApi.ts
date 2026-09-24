/**
 * 宠物列表接口的本地 mock 边界。
 *
 * 页面只依赖 getPetRoster 的请求参数和返回形状，后续接入真实后端时，
 * 可以只替换这个文件，不需要改动列表组件的筛选、搜索和展示逻辑。
 */
import { getPawHomeYardMock, type YardMock, type YardPet, type YardPetState, type YardStatusDefinition } from './yardMock.ts'
import { SELF_PAW_ID } from './profileNav.ts'

export const PET_ROSTER_API_MODE = 'mock'

export type PetRosterVariant = 'mine' | 'yard' | 'status' | 'owned'
export type PetRosterSpecies = 'all' | 'cat' | 'dog'

export interface PetRosterParams {
  variant?: PetRosterVariant
  userPawId?: string
  yardId?: string
  species?: PetRosterSpecies
  keyword?: string
  managed?: boolean
}

export interface PetRosterCardOwner {
  pawId?: string
  name: string
  avatar: string
  level?: number
}

export const PET_ROSTER_PENDING_OWNER_MOCK: Pick<PetRosterCardOwner, 'name'> = {
  name: '虚位以待'
}

export const PET_ROSTER_ASSIGNED_OWNER_MOCK: Pick<PetRosterCardOwner, 'name' | 'level'> = {
  name: '姜栋',
  level: 1
}

export interface PetRosterYardInfo {
  id: string
  name: string
  avatar: string
}

export interface PetRosterYardGroup {
  yard: PetRosterYardInfo
  pets: YardPet[]
}

export interface PetRosterFilterCounts {
  all: number
  cat: number
  dog: number
}

export interface PetRosterStatusGroup extends YardStatusDefinition {
  pets: YardPet[]
}

export interface PetRosterData {
  variant: PetRosterVariant
  scope: { userPawId: string } | { yardId: string }
  items: YardPet[]
  filterCounts: PetRosterFilterCounts
  yardOwner: YardMock['owner']
  statusDefinitions: YardStatusDefinition[]
  statusGroups: PetRosterStatusGroup[]
  yardGroups: PetRosterYardGroup[]
}

export interface PetRosterSuccess {
  success: true
  source: typeof PET_ROSTER_API_MODE
  data: PetRosterData
  error: null
}

export interface PetRosterFailure {
  success: false
  source: typeof PET_ROSTER_API_MODE
  data: null
  error: { code: string; message: string }
}

export type PetRosterResult = PetRosterSuccess | PetRosterFailure

const DEFAULT_USER_PAW_ID = SELF_PAW_ID
const DEFAULT_YARD_ID = '1'

const MINE_YARD_IDS_BY_USER: Record<string, string[]> = {
  [DEFAULT_USER_PAW_ID]: ['1', '2']
}

function normalizeId(value: unknown, fallback = ''): string {
  return value === undefined || value === null || value === '' ? fallback : String(value).trim()
}

function normalizeVariant(value: unknown): PetRosterVariant {
  const variant = String(value || 'yard').trim().toLowerCase()
  return ['mine', 'yard', 'status', 'owned'].includes(variant) ? variant as PetRosterVariant : 'yard'
}

function normalizeSpecies(value: unknown): PetRosterSpecies {
  const species = String(value || 'all').trim().toLowerCase()
  return ['all', 'cat', 'dog'].includes(species) ? species as PetRosterSpecies : 'all'
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item)) : []
}

function readLocalRows(key: string): Record<string, unknown>[] {
  if (typeof uni === 'undefined' || !uni || typeof uni.getStorageSync !== 'function') return []
  try {
    const raw = uni.getStorageSync(key)
    if (!raw) return []
    const rows = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(rows) ? rows.filter(isRecord) : []
  } catch {
    return []
  }
}

function storedState(record: Record<string, unknown>): YardPetState {
  const label = String(record.statusLabel || record.state || record.status || '').trim()
  const state = ({ '待领养': 'pending', '已云养': 'cloud', '已领养': 'adopted', '失踪': 'missing', '死亡': 'dead' } as Record<string, YardPetState>)[label]
  return state || (['pending', 'cloud', 'adopted', 'missing', 'dead'].includes(label) ? label as YardPetState : 'pending')
}

function readStoredPets(yardId: string): YardPet[] {
  return readLocalRows('PAWHOME_ANIMAL_RECORDS')
    .filter(record => record && String(record.yardId || '') === String(yardId || ''))
    .map(record => {
      const state = storedState(record)
      const statusLabel = String(record.statusLabel || ({ pending: '待领养', cloud: '已云养', adopted: '已领养', missing: '失踪', dead: '死亡' }[state]) || '')
      const avatar = String(record.avatar || '/static/figma/yard-cats/cat-avatar.png')
      const species = record.species === 'dog' || record.kind === 'dog' ? 'dog' : 'cat'
      const tags = Array.isArray(record.tags)
        ? stringArray(record.tags)
        : [String(record.breed || (species === 'dog' ? '狗狗' : '猫咪')), String(record.gender || '')].filter(Boolean)
      return {
        id: String(record.animalId || record.id || ''),
        name: String(record.name || '未命名动物'),
        avatar,
        species,
        speciesLabel: String(record.speciesLabel || (species === 'dog' ? '狗狗' : '猫咪')),
        breed: String(record.breed || ''),
        state,
        status: String(record.status || 'active'),
        statusLabel,
        tags: tags.filter(Boolean),
        cardTags: Array.isArray(record.cardTags) ? stringArray(record.cardTags) : tags.filter(Boolean),
        desc: String(record.desc || record.description || ''),
        foodJin: Number(record.foodJin || 0),
        adoptionValue: Number(record.petValue ?? record.value ?? record.adoptionValue ?? 0),
        gallery: Array.isArray(record.gallery) && record.gallery.length ? stringArray(record.gallery) : [avatar],
        stateTimeLabel: String(record.stateTimeLabel || ''),
        stateTime: String(record.stateTime || ''),
        yardId: String(record.yardId || yardId),
      } as YardPet
    })
}

function matchesKeyword(pet: YardPet, keyword: string): boolean {
  const normalizedKeyword = String(keyword || '').trim().toLowerCase()
  if (!normalizedKeyword) return true
  return [pet.name, pet.breed, pet.speciesLabel, pet.desc, ...(pet.tags || []), ...(pet.cardTags || [])]
    .some(value => String(value || '').toLowerCase().includes(normalizedKeyword))
}

function getSourcePets({
  variant,
  userPawId,
  yardId,
  yard,
  managed,
}: { variant: PetRosterVariant; userPawId: string; yardId: string; yard: YardMock; managed: boolean }): YardPet[] {
  if (variant === 'mine') {
    return getMineYardGroups({ userPawId, yard }).flatMap(group => group.pets)
  }

  // owned 是旧的“我的宠物”入口，为保持现有页面可用，继续使用当前小院 mock 数据；
  // 云养列表和小院列表分别由 mine/yard/status 的 scope 参数隔离。
  if (variant === 'yard' || variant === 'status' || variant === 'owned') {
    const stored = readStoredPets(yardId)
    if (stored.length) return stored
    return managed ? [] : (String(yard.id) === String(yardId) ? yard.pets : [])
  }

  return []
}

function createMinePet(sourcePet: YardPet, id: string, name: string, avatar: string, yard: PetRosterYardInfo): YardPet {
  return {
    ...sourcePet,
    id,
    name,
    avatar,
    yardId: yard.id,
    yardName: yard.name,
    yardAvatar: yard.avatar
  }
}

function getMineYardGroups({ userPawId, yard }: { userPawId: string; yard: YardMock }): PetRosterYardGroup[] {
  const yardIds = MINE_YARD_IDS_BY_USER[userPawId] || []
  if (!yardIds.length) return []

  const cat = yard.pets.find(pet => pet.species === 'cat') || yard.pets[0]
  const dog = yard.pets.find(pet => pet.species === 'dog') || yard.pets[0]
  const blackWhiteCat = '/static/figma/pets/pet-black-white.png'
  const orangeCat = '/static/figma/pets/pet-orange.png'
  const dogAvatar = '/static/figma/pets/pet-dog.png'
  const groupDefinitions = [
    {
      id: '1',
      name: '我就是要喂猫',
      avatar: yard.avatar,
      petNames: ['奥利奥', '煤球', '呗呗', '呗呗', '呗呗'],
      petAvatars: [orangeCat, blackWhiteCat, dogAvatar, dogAvatar, dogAvatar]
    },
    {
      id: '2',
      name: '朝阳小区',
      avatar: '/static/figma/yard-pet-exact.png',
      petNames: ['奥利奥', '煤球', '呗呗', '呗呗', '呗呗'],
      petAvatars: [orangeCat, blackWhiteCat, dogAvatar, dogAvatar, dogAvatar]
    }
  ]

  return groupDefinitions
    .filter(group => yardIds.includes(group.id))
    .map(group => {
      const yardInfo = { id: group.id, name: group.name, avatar: group.avatar }
      const pets = group.petNames.map((name, index) => {
        const sourcePet = index === 1 ? cat : (index > 1 ? dog : cat)
        return createMinePet(sourcePet, `mine-${group.id}-${index + 1}`, name, group.petAvatars[index], yardInfo)
      })
      return { yard: yardInfo, pets }
    })
}

function getFilterCounts({ variant, sourcePets }: { variant: PetRosterVariant; sourcePets: YardPet[] }): PetRosterFilterCounts {
  // 设计稿中的“我的云养”数量是用户维度的接口统计值，分组卡片只展示代表性 mock 数据。
  if (variant === 'mine') return sourcePets.length ? { all: 23, cat: 22, dog: 1 } : { all: 0, cat: 0, dog: 0 }
  return {
    all: sourcePets.length,
    cat: sourcePets.filter(pet => pet.species === 'cat').length,
    dog: sourcePets.filter(pet => pet.species === 'dog').length
  }
}

function filterPets(sourcePets: YardPet[], species: PetRosterSpecies, keyword: string): YardPet[] {
  return sourcePets.filter(pet => {
    const matchesSpecies = species === 'all' || pet.species === species
    return matchesSpecies && matchesKeyword(pet, keyword)
  })
}

function buildStatusGroups(pets: YardPet[], statusDefinitions: YardStatusDefinition[]): PetRosterStatusGroup[] {
  return statusDefinitions
    .map(group => ({
      ...group,
      pets: pets.filter(pet => pet.state === group.key)
    }))
    .filter(group => group.pets.length)
}

function success(data: PetRosterData): PetRosterSuccess {
  return { success: true, source: PET_ROSTER_API_MODE, data, error: null }
}

/**
 * @param {Object} params
 * @param {'mine'|'yard'|'status'|'owned'} params.variant 列表业务类型
 * @param {string} params.userPawId 我的逢猫号，variant=mine 时必传
 * @param {string} params.yardId 小院 ID，variant=yard/status 时必传
 * @param {'all'|'cat'|'dog'} params.species 服务端筛选条件
 * @param {string} params.keyword 服务端搜索关键词
 */
export function getPetRoster(params: PetRosterParams = {}): Promise<PetRosterResult> {
  const variant = normalizeVariant(params.variant)
  const userPawId = normalizeId(params.userPawId, DEFAULT_USER_PAW_ID)
  const yardId = normalizeId(params.yardId, DEFAULT_YARD_ID)
  const species = normalizeSpecies(params.species)
  const keyword = String(params.keyword || '').trim()
  const managed = params.managed === true
  const yard = getPawHomeYardMock()
  const sourcePets = getSourcePets({ variant, userPawId, yardId, yard, managed })
  const items = filterPets(sourcePets, species, keyword)
  const yardGroups = variant === 'mine'
    ? getMineYardGroups({ userPawId, yard })
      .map(group => ({ ...group, pets: filterPets(group.pets, species, keyword) }))
      .filter(group => group.pets.length)
    : []
  const data = {
    variant,
    scope: variant === 'mine' ? { userPawId } : { yardId },
    items: clone(items),
    filterCounts: getFilterCounts({ variant, sourcePets }),
    yardOwner: clone(yard.owner),
    statusDefinitions: clone(yard.statusDefinitions),
    statusGroups: clone(buildStatusGroups(items, yard.statusDefinitions)),
    yardGroups: clone(yardGroups)
  }

  return Promise.resolve(success(data))
}
