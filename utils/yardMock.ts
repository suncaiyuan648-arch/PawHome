import type { AnnouncementMetadata } from './announcementMetadata'
import type { AvatarStackProfile } from './avatarStackMetadata'

export type YardPetState = 'pending' | 'cloud' | 'adopted' | 'missing' | 'dead'

export interface YardStatusDefinition {
  key: YardPetState
  label: string
}

export interface YardPetExtras {
  status?: string
  tags?: string[]
  cardTags?: string[]
  desc?: string
  foodJin?: number
  adoptionValue?: number
  statusLabel?: string
  gallery?: string[]
  stateTimeLabel?: string
  stateTime?: string
  [key: string]: unknown
}

export interface YardPet {
  id: string
  name: string
  avatar: string
  species: 'cat' | 'dog'
  speciesLabel: string
  breed: string
  state: YardPetState
  status: string
  tags: string[]
  cardTags: string[]
  desc: string
  foodJin: number
  adoptionValue: number
  statusLabel: string
  gallery: string[]
  stateTimeLabel: string
  stateTime: string
  feedingOrderIds?: string[]
  [key: string]: unknown
}

export interface YardFeedingOrder {
  id: string
  orderType: string
  status: string
  yardId: string
  petIds: string[]
  pawId: string
  userName: string
  userAvatar: string
  level: number
  kg: number
  time: string
  countdown: string
  timedOut: boolean
  feedbackTag: string
  [key: string]: unknown
}

export interface YardOwner {
  pawId: string
  name: string
  avatar: string
}

export interface YardCommentAuthor {
  pawId?: string
  name: string
  avatar: string
  level?: number
  owner?: boolean
  [key: string]: unknown
}

export interface YardCommentReplyTarget {
  name: string
  level?: number
}

export interface YardComment extends Record<string, unknown> {
  id: string
  author: YardCommentAuthor
  copy: string
  meta: string
  likes: number
  liked?: boolean
  replyTo?: YardCommentReplyTarget
  children?: YardComment[]
}

export interface YardGalleryItem {
  id: number
  src: string
  title: string
}

export type YardAnnouncementItem = AnnouncementMetadata

export interface YardRankScrollItem {
  id: string | number
  pawId?: string
  text: string
  level?: number
  avatar?: string
  rankTitle?: string
}

export type YardRankScrollInput =
  string | (Omit<YardRankScrollItem, 'id'> & { id?: string | number })

export interface YardRankItem extends YardRankScrollItem {
  id: string
  pawId: string
  level: number
  avatar: string
  rankTitle: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function optionalRankLevel(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value)))
    return Number(value)
  return undefined
}

export function isYardRankScrollItem(value: unknown): value is YardRankScrollItem {
  if (!isRecord(value)) return false
  return (
    (typeof value.id === 'string' || typeof value.id === 'number') &&
    typeof value.text === 'string' &&
    (value.pawId === undefined || typeof value.pawId === 'string') &&
    (value.level === undefined ||
      (typeof value.level === 'number' && Number.isFinite(value.level))) &&
    (value.avatar === undefined || typeof value.avatar === 'string') &&
    (value.rankTitle === undefined || typeof value.rankTitle === 'string')
  )
}

export function isYardRankItem(value: unknown): value is YardRankItem {
  return (
    isYardRankScrollItem(value) &&
    typeof value.pawId === 'string' &&
    typeof value.level === 'number' &&
    typeof value.avatar === 'string' &&
    typeof value.rankTitle === 'string'
  )
}

/** Normalize legacy rank labels and yard rank records for the scrolling strip. */
export function normalizeYardRankScrollItems(items: readonly unknown[]): YardRankScrollItem[] {
  return items.flatMap((value, index) => {
    if (typeof value === 'string') return [{ id: index, text: value }]
    if (!isRecord(value)) return []

    const text =
      typeof value.text === 'string'
        ? value.text
        : typeof value.text === 'number' && Number.isFinite(value.text)
          ? String(value.text)
          : ''
    const id =
      typeof value.id === 'string' || (typeof value.id === 'number' && Number.isFinite(value.id))
        ? value.id
        : index
    const level = optionalRankLevel(value.level)
    return [
      {
        id,
        text,
        ...(typeof value.pawId === 'string' ? { pawId: value.pawId } : {}),
        ...(level !== undefined ? { level } : {}),
        ...(typeof value.avatar === 'string' ? { avatar: value.avatar } : {}),
        ...(typeof value.rankTitle === 'string' ? { rankTitle: value.rankTitle } : {}),
      },
    ]
  })
}

export interface YardFeeder extends AvatarStackProfile {
  id: number
}

export interface YardStats extends Record<string, string | number> {
  foodJin: number
  foodCount: number
  helpedAdoptionCount: number
  feedbackTime: string
  feedSummary: string
  likes: string
  members: number
  shares: number
}

export type YardDetailState = 'dynamic' | 'dynamic-empty' | 'feeding' | 'dynamic-expanded'

export interface YardMock extends Record<string, unknown> {
  id: string
  name: string
  avatar: string
  verified: boolean
  owner: YardOwner
  location: string
  district: string
  distance: string
  tags: string[]
  description: string
  intro: string
  foodJin: number
  gallery: YardGalleryItem[]
  stats: YardStats
  announcementItems: YardAnnouncementItem[]
  rankItems: YardRankItem[]
  feeders: YardFeeder[]
  postFeeders: YardFeeder[]
  comments: YardComment[]
  statusDefinitions: YardStatusDefinition[]
  pets: YardPet[]
  feedingOrders: YardFeedingOrder[]
  [key: string]: unknown
}

const YARD_STATUS_DEFINITIONS: YardStatusDefinition[] = [
  { key: 'pending', label: '待云养' },
  { key: 'cloud', label: '已云养' },
  { key: 'adopted', label: '已领养' },
  { key: 'missing', label: '失踪' },
  { key: 'dead', label: '死亡' },
]

const yardPet = (
  id: string,
  name: string,
  avatar: string,
  species: 'cat' | 'dog',
  breed: string,
  state: YardPetState,
  extra: YardPetExtras = {},
): YardPet => ({
  id,
  name,
  avatar,
  species,
  speciesLabel: species === 'dog' ? '狗狗' : '猫咪',
  breed,
  state,
  status: extra.status || '已绝育',
  tags: extra.tags || [breed, '男生', '已绝育', '2岁3个月'],
  cardTags: extra.cardTags || ['极度饥饿', '非常亲人', '男生', '已绝育'],
  desc: extra.desc || '流浪的时候经常去小麦店偷吃火腿肠被打导致有点怕人',
  foodJin: extra.foodJin != null ? extra.foodJin : 32,
  adoptionValue: extra.adoptionValue != null ? extra.adoptionValue : 15,
  statusLabel:
    extra.statusLabel ||
    {
      pending: '待领养',
      cloud: '已云养',
      adopted: '已领养',
      missing: '失踪',
      dead: '死亡',
    }[state] ||
    '待领养',
  gallery: extra.gallery || [avatar],
  stateTimeLabel: extra.stateTimeLabel || '',
  stateTime: extra.stateTime || '',
})

const cat = '/static/figma/yard-cats/cat-avatar.png'
const dog = '/static/figma/pets/pet-dog.png'
const catGallery = [
  cat,
  '/static/figma/adoption-flow/pet-orange.png',
  '/static/figma/pets/pet-black-white.png',
]
const dogGallery = [
  dog,
  '/static/figma/pets/adoption-dog.png',
  '/static/figma/adoption-flow/pet-hero.png',
]

const YARD_PETS: YardPet[] = [
  yardPet('roster-cat-1', '小毛球', cat, 'cat', '加菲猫', 'pending', {
    gallery: catGallery,
    adoptionValue: 20,
  }),
  yardPet('roster-cat-2', '小毛球', cat, 'cat', '加菲猫', 'cloud', {
    gallery: catGallery,
    adoptionValue: 20,
  }),
  yardPet('roster-cat-3', '小毛球', cat, 'cat', '奶牛猫', 'cloud', { gallery: catGallery }),
  yardPet('roster-cat-4', '花春晓', cat, 'cat', '英短', 'adopted', {
    gallery: catGallery,
    stateTimeLabel: '领养时间',
    stateTime: '2026-06-12',
  }),
  yardPet('roster-cat-5', '小灰灰', cat, 'cat', '中华田园猫', 'missing', {
    gallery: catGallery,
    stateTimeLabel: '失踪时间',
    stateTime: '2026-06-18',
  }),
  yardPet('roster-cat-6', '年糕糕', cat, 'cat', '中华田园猫', 'dead', {
    gallery: catGallery,
    stateTimeLabel: '死亡时间',
    stateTime: '2026-06-20',
  }),
  yardPet('roster-cat-7', '团团儿', cat, 'cat', '英短', 'adopted', {
    gallery: catGallery,
    stateTimeLabel: '领养时间',
    stateTime: '2026-05-23',
  }),
  yardPet('roster-cat-8', '奶糖儿', cat, 'cat', '奶牛猫', 'adopted', {
    gallery: catGallery,
    stateTimeLabel: '领养时间',
    stateTime: '2026-04-09',
  }),
  yardPet('roster-cat-9', '橘子儿', cat, 'cat', '中华田园猫', 'missing', {
    gallery: catGallery,
    stateTimeLabel: '失踪时间',
    stateTime: '2026-06-25',
  }),
  yardPet('roster-cat-10', '豆包儿', cat, 'cat', '中华田园猫', 'missing', {
    gallery: catGallery,
    stateTimeLabel: '失踪时间',
    stateTime: '2026-06-27',
  }),
  yardPet('roster-cat-11', '小虎子', cat, 'cat', '英短', 'dead', {
    gallery: catGallery,
    stateTimeLabel: '死亡时间',
    stateTime: '2026-05-14',
  }),
  yardPet('roster-cat-12', '花生儿', cat, 'cat', '奶牛猫', 'dead', {
    gallery: catGallery,
    stateTimeLabel: '死亡时间',
    stateTime: '2026-05-29',
  }),
  yardPet('roster-dog-1', '呗呗儿', dog, 'dog', '金毛', 'pending', { gallery: dogGallery }),
  yardPet('roster-dog-2', '旺财儿', dog, 'dog', '柴犬', 'cloud', { gallery: dogGallery }),
  yardPet('roster-dog-3', '小黑子', dog, 'dog', '柴犬', 'dead', {
    gallery: dogGallery,
    stateTimeLabel: '死亡时间',
    stateTime: '2026-06-28',
  }),
]

/**
 * 小院投喂订单与云养中动物的一对多关系真源。
 * 订单选择会根据 petIds 自动带出动物，动物选择也会反向带出对应订单。
 */
const YARD_FEEDING_ORDERS: YardFeedingOrder[] = [
  {
    id: 'yard-order-1',
    orderType: 'normal_feed',
    status: 'delivered',
    yardId: '1',
    petIds: ['roster-cat-2'],
    pawId: 'order-user-paf',
    userName: '平安是福',
    userAvatar: '/static/figma/publish/order-avatar.png',
    level: 1,
    kg: 4,
    time: '2026-2-5 13:23:56',
    countdown: '3天23:34:45后超时',
    timedOut: false,
    feedbackTag: '已反馈2/5次',
  },
  {
    id: 'yard-order-2',
    orderType: 'normal_feed',
    status: 'delivered',
    yardId: '1',
    petIds: ['roster-cat-3'],
    pawId: 'order-user-axtf',
    userName: '爱心投喂',
    userAvatar: '/static/figma/publish/order-avatar.png',
    level: 2,
    kg: 2,
    time: '2026-2-1 10:00:00',
    countdown: '5天12:00:00后超时',
    timedOut: false,
    feedbackTag: '已反馈0/3次',
  },
  {
    id: 'yard-order-3',
    orderType: 'normal_feed',
    status: 'delivered',
    yardId: '1',
    petIds: ['roster-dog-2'],
    pawId: 'order-user-hkfg',
    userName: '花开富贵',
    userAvatar: '/static/figma/publish/order-avatar.png',
    level: 1,
    kg: 3,
    time: '2026-2-3 09:18:00',
    countdown: '1天06:15:00后超时',
    timedOut: false,
    feedbackTag: '已反馈1/5次',
  },
]

const YARD_PETS_WITH_FEEDING = YARD_PETS.map((pet) => ({
  ...pet,
  feedingOrderIds: YARD_FEEDING_ORDERS.filter((order) =>
    order.petIds.some((petId) => String(petId) === String(pet.id)),
  ).map((order) => order.id),
}))

const YARD_MOCK: YardMock = {
  id: '1',
  name: '我就是要喂猫',
  avatar: '/static/figma/yard-cover-exact.png',
  verified: true,
  owner: { pawId: 'owner-1', name: '芝', avatar: '/static/figma/dynamic-detail/author.png' },
  location: '合肥市希望流浪动物基地',
  district: '金水区',
  distance: '3.2km',
  tags: ['剩余6/21只', '已成立2个月', '入驻4人'],
  description: '春去秋来二十年的救助流浪猫时间匆匆而去，在此希望每个毛孩子都被温柔相待。',
  intro:
    '小院专注救助周边流浪动物，定时投喂、绝育与领养对接。欢迎常来看看毛孩子们，您的每一次投喂都是一份善意。',
  foodJin: 32,
  gallery: [1, 2, 3, 4].map((id) => ({
    id,
    src: '/static/figma/search/yard-gallery-exact.png',
    title: '开饭了开饭了',
  })),
  stats: {
    foodJin: 32,
    foodCount: 999,
    helpedAdoptionCount: 13,
    feedbackTime: '3天2小时',
    feedSummary: '13人已投喂32斤猫粮',
    likes: '1.2w',
    members: 280,
    shares: 78,
  },
  announcementItems: [
    { id: 'yard-feeding-1', text: '广东汕头的花开富贵老师对我就是要喂猫投粮4斤，积善缘，得福报~' },
  ],
  rankItems: [
    '张三',
    '平安是福',
    '花开富贵',
    '花开春晓',
    '小灰灰',
    '爱心小院',
    '晴朗',
    '夜猫子联盟',
    '岁岁平安喵',
    '暖阳补给台',
    '小鱼干补给站',
    '巷口喵喵亭',
    '归巢小院',
  ].map((text, index) => ({
    id: `yard-rank-${index + 1}`,
    pawId: `yard-rank-user-${index + 1}`,
    text,
    level: index === 7 ? 2 : 1,
    avatar: index % 2 ? '/static/figma/yard-detail/owner.png' : '/static/figma/yard-pet-exact.png',
    rankTitle: `小院投喂第${index + 1}名`,
  })),
  feeders: [
    { id: 1, avatar: '/static/figma/dynamic-detail/source-1.png' },
    { id: 2, avatar: '/static/figma/dynamic-detail/source-2.png' },
    { id: 3, avatar: '/static/figma/dynamic-detail/source-3.png' },
    { id: 4, avatar: '/static/figma/dynamic-detail/source-4.png' },
    { id: 5, avatar: '/static/figma/dynamic-detail/source-5.png' },
  ],
  postFeeders: [1, 2, 3, 4].map((id) => ({ id, avatar: '/static/figma/yard-pet-exact.png' })),
  comments: [
    {
      id: 'yard-c-1',
      author: { name: '姜栋', avatar: '/static/avatarlog.png', level: 1, owner: true },
      copy: '给我点赞给我点赞给我点赞给我点赞给我点赞',
      meta: '昨天 20:45　江西',
      likes: 32,
      children: [
        {
          id: 'yard-c-1-r-1',
          author: { name: '花开春晓', avatar: '/static/avatarlog.png', level: 1 },
          replyTo: { name: '姜栋', level: 1 },
          copy: '一起为小院里的猫咪加油呀',
          meta: '昨天 20:46　江西',
          likes: 8,
        },
      ],
    },
    {
      id: 'yard-c-2',
      author: { name: '花开春晓', avatar: '/static/avatarlog.png', level: 1 },
      copy: '谢谢大家的温柔投喂',
      meta: '昨天 19:12　江西',
      likes: 8,
    },
    {
      id: 'yard-c-3',
      author: { name: '姜栋', avatar: '/static/avatarlog.png', level: 1, owner: true },
      copy: '回复花开春晓：一起照顾小猫咪',
      meta: '昨天 18:42　江西',
      likes: 4,
    },
    {
      id: 'yard-c-4',
      author: { name: '平安是福', avatar: '/static/avatarlog.png', level: 2 },
      copy: '小院的猫咪都很可爱',
      meta: '昨天 17:30　长沙',
      likes: 2,
    },
  ],
  statusDefinitions: YARD_STATUS_DEFINITIONS,
  pets: YARD_PETS_WITH_FEEDING,
  feedingOrders: YARD_FEEDING_ORDERS,
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function getPawHomeYardMock(): YardMock {
  return clone(YARD_MOCK)
}

export function getPawHomeYardPets(): YardPet[] {
  return getPawHomeYardMock().pets
}

export function getPawHomeYardFeedingOrders(): YardFeedingOrder[] {
  return getPawHomeYardMock().feedingOrders
}

export function getPawHomeYardPetById(id: string): YardPet | null {
  const value = id.trim()
  return getPawHomeYardPets().find((pet) => pet.id === value) || null
}
