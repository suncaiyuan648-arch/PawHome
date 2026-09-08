/**
 * 宠物列表接口的本地 mock 边界。
 *
 * 页面只依赖 getPetRoster 的请求参数和返回形状，后续接入真实后端时，
 * 可以只替换这个文件，不需要改动列表组件的筛选、搜索和展示逻辑。
 */
import { getPawHomeYardMock } from './yardMock.js'
import { SELF_PAW_ID } from './profileNav.js'

export const PET_ROSTER_API_MODE = 'mock'

const DEFAULT_USER_PAW_ID = SELF_PAW_ID
const DEFAULT_YARD_ID = '1'

const MINE_YARD_IDS_BY_USER = {
  [DEFAULT_USER_PAW_ID]: ['1', '2']
}

function normalizeId(value, fallback = '') {
  return value === undefined || value === null || value === '' ? fallback : String(value).trim()
}

function normalizeVariant(value) {
  const variant = String(value || 'yard').trim().toLowerCase()
  return ['mine', 'yard', 'status', 'owned'].includes(variant) ? variant : 'yard'
}

function normalizeSpecies(value) {
  const species = String(value || 'all').trim().toLowerCase()
  return ['all', 'cat', 'dog'].includes(species) ? species : 'all'
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function matchesKeyword(pet, keyword) {
  const normalizedKeyword = String(keyword || '').trim().toLowerCase()
  if (!normalizedKeyword) return true
  return [pet.name, pet.breed, pet.speciesLabel, pet.desc, ...(pet.tags || []), ...(pet.cardTags || [])]
    .some(value => String(value || '').toLowerCase().includes(normalizedKeyword))
}

function getSourcePets({ variant, userPawId, yardId, yard }) {
  if (variant === 'mine') {
    return getMineYardGroups({ userPawId, yard }).flatMap(group => group.pets)
  }

  // owned 是旧的“我的宠物”入口，为保持现有页面可用，继续使用当前小院 mock 数据；
  // 云养列表和小院列表分别由 mine/yard/status 的 scope 参数隔离。
  if (variant === 'yard' || variant === 'status' || variant === 'owned') {
    return String(yard.id) === String(yardId) ? yard.pets : []
  }

  return []
}

function createMinePet(sourcePet, id, name, avatar, yard) {
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

function getMineYardGroups({ userPawId, yard }) {
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

function getFilterCounts({ variant, sourcePets }) {
  // 设计稿中的“我的云养”数量是用户维度的接口统计值，分组卡片只展示代表性 mock 数据。
  if (variant === 'mine') return sourcePets.length ? { all: 23, cat: 22, dog: 1 } : { all: 0, cat: 0, dog: 0 }
  return {
    all: sourcePets.length,
    cat: sourcePets.filter(pet => pet.species === 'cat').length,
    dog: sourcePets.filter(pet => pet.species === 'dog').length
  }
}

function filterPets(sourcePets, species, keyword) {
  return sourcePets.filter(pet => {
    const matchesSpecies = species === 'all' || pet.species === species
    return matchesSpecies && matchesKeyword(pet, keyword)
  })
}

function buildStatusGroups(pets, statusDefinitions) {
  return statusDefinitions
    .map(group => ({
      ...group,
      pets: pets.filter(pet => pet.state === group.key)
    }))
    .filter(group => group.pets.length)
}

function success(data) {
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
export function getPetRoster(params = {}) {
  const variant = normalizeVariant(params.variant)
  const userPawId = normalizeId(params.userPawId, DEFAULT_USER_PAW_ID)
  const yardId = normalizeId(params.yardId, DEFAULT_YARD_ID)
  const species = normalizeSpecies(params.species)
  const keyword = String(params.keyword || '').trim()
  const yard = getPawHomeYardMock()
  const sourcePets = getSourcePets({ variant, userPawId, yardId, yard })
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
