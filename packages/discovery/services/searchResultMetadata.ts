import type { HomeFeedTemplateMetadata } from '@/utils/homeFeedMockData.ts'
import { createSearchTabs, type SearchTab } from './searchPageMetadata.ts'

export interface SearchDynamicResult extends HomeFeedTemplateMetadata {
  embeddedLocation: boolean
  avatar: string
  name: string
  pawId: string
}

export interface SearchGalleryItem {
  img: string
  caption: string
}

interface SearchYardBase {
  yardId: string
  avatar: string
  name: string
  verified: boolean
  distance: string
  desc: string
  gallery: SearchGalleryItem[]
}

export interface SearchBadgeYard extends SearchYardBase {
  variant: 'badges'
  badges: string[]
}

export interface SearchOrganizationYard extends SearchYardBase {
  variant: 'org'
  orgName: string
}

export type SearchYardResult = SearchBadgeYard | SearchOrganizationYard

export interface SearchUserResult {
  avatar: string
  name: string
  fans: number
  pawLabel: string
  pawId: string
}

export interface SearchDynamicColumnEntry {
  item: SearchDynamicResult
  index: number
}

export type SearchDynamicColumns = [SearchDynamicColumnEntry[], SearchDynamicColumnEntry[]]

export interface SearchResultTabsState {
  tabs: SearchTab[]
  dynamicList: SearchDynamicResult[]
  yardList: SearchYardResult[]
  userList: SearchUserResult[]
}

const SEARCH_DYNAMIC_MOCKS: readonly SearchDynamicResult[] = [
  {
    cover: '/static/figma/search/dynamic-left-1.png',
    embeddedLocation: true,
    title: '小猫吃的好开心',
    avatar: '/static/figma/home/feed-avatar.png',
    name: '朝阳小区猫猫队',
    pawId: 'search-feed-1',
    likes: 37,
    liked: false,
    distance: '3.2km',
    district: '金水区',
  },
  {
    cover: '/static/figma/search/dynamic-right-1.png',
    embeddedLocation: true,
    title: '小猫吃的好开心呢呢呢呢呢呢呢啊啊啊啊啊啊啊啊啊啊',
    avatar: '/static/figma/home/feed-avatar.png',
    name: '朝阳小区猫猫队',
    pawId: 'search-feed-2',
    likes: 32,
    liked: true,
    distance: '3.2km',
    district: '金水区',
  },
  {
    cover: '/static/figma/search/dynamic-left-2.png',
    embeddedLocation: true,
    title: '小猫吃的好开心',
    avatar: '/static/figma/home/feed-avatar.png',
    name: '朝阳小区猫猫队',
    pawId: 'search-feed-3',
    likes: 37,
    liked: false,
    distance: '3.2km',
    district: '金水区',
  },
  {
    cover: '/static/figma/search/dynamic-right-2.png',
    embeddedLocation: true,
    title: '小猫吃的好开心',
    avatar: '/static/figma/home/feed-avatar.png',
    name: '朝阳小区猫猫队',
    pawId: 'search-feed-4',
    likes: 37,
    liked: false,
    distance: '3.2km',
    district: '金水区',
  },
]

const SEARCH_GALLERY_MOCKS: readonly SearchGalleryItem[] = [
  { img: '/static/figma/search/yard-gallery-exact.png', caption: '开饭了开饭了开饭' },
  { img: '/static/figma/search/yard-gallery-exact.png', caption: '开饭了开饭了开饭' },
  { img: '/static/figma/search/yard-gallery-exact.png', caption: '开饭了开饭了开饭' },
  { img: '/static/figma/search/yard-gallery-exact.png', caption: '开饭了开饭了开饭' },
]

const SEARCH_YARD_MOCKS: readonly SearchYardResult[] = [
  {
    yardId: '1',
    avatar: '/static/figma/search/yard-avatar-exact.png',
    name: '我就是要喂猫',
    verified: true,
    variant: 'badges',
    badges: ['剩6只/共32只', '已成立2个月', '入驻4人'],
    distance: '3.2km 金水区',
    desc: '春去秋来二十年的救助流浪猫时间匆匆而去，在此希望每个毛孩子都被温柔相待。',
    gallery: [...SEARCH_GALLERY_MOCKS],
  },
  {
    yardId: '2',
    avatar: '/static/figma/search/yard-avatar-exact.png',
    name: '我就是要喂猫',
    verified: true,
    variant: 'org',
    orgName: '合肥市希望流浪动物基地',
    distance: '3.2km 金水区',
    desc: '春去秋来二十年的救助流浪猫时间匆匆而去，在此希望每个毛孩子都被温柔相待。',
    gallery: [...SEARCH_GALLERY_MOCKS],
  },
]

function cloneSearchYard(yard: SearchYardResult): SearchYardResult {
  const gallery = yard.gallery.map((item) => ({ ...item }))
  return yard.variant === 'badges'
    ? { ...yard, badges: [...yard.badges], gallery }
    : { ...yard, gallery }
}

export function createSearchResultTabsMetadata(): SearchResultTabsState {
  return {
    tabs: createSearchTabs(),
    dynamicList: SEARCH_DYNAMIC_MOCKS.map((item) => ({ ...item })),
    yardList: SEARCH_YARD_MOCKS.map(cloneSearchYard),
    userList: Array.from({ length: 5 }, (_, index) => ({
      avatar: '/static/figma/search-user-avatar.png',
      name: 'Q',
      fans: 315,
      pawLabel: index === 0 ? '小红书号：' : '逢猫号：',
      pawId: index === 0 ? '' : '23456789',
    })),
  }
}

export function splitSearchDynamicColumns(
  items: readonly SearchDynamicResult[],
): SearchDynamicColumns {
  const indexedItems = items.map((item, index) => ({ item, index }))
  return [
    indexedItems.filter((entry) => entry.index % 2 === 0),
    indexedItems.filter((entry) => entry.index % 2 === 1),
  ]
}
