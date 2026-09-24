export type AnimalAlbumCategory = 'image' | 'feeding' | 'daily'
export type AnimalAlbumFilterKey = 'all' | 'favorite' | 'image' | 'video' | 'feeding' | 'daily'
export type AnimalAlbumSort = 'default' | 'pinned'
export type AnimalAlbumMenuActionKey = 'pin' | 'favorite' | 'hide' | 'delete'

export interface AnimalAlbumItem {
  id: string
  src: string
  kind: 'image' | 'video'
  categories: AnimalAlbumCategory[]
  pinned: boolean
  favorite: boolean
  hidden?: boolean
}

export interface AnimalAlbumFilterOption {
  key: AnimalAlbumFilterKey
  label: string
}

export interface AnimalAlbumMenuAction {
  key: AnimalAlbumMenuActionKey
  label: string
  iconName: string
}

export interface AnimalAlbumPageState {
  animalId: string
  yardId: string
  albumPetName: string
  invalid: boolean
  canManage: boolean
  albumFilter: AnimalAlbumFilterKey
  albumSort: AnimalAlbumSort
  albumMenuVisible: boolean
  albumMenuPosition: { left: number; top: number }
  selectedAlbumId: string
  albumItems: AnimalAlbumItem[]
}

const ALBUM_ITEMS: readonly AnimalAlbumItem[] = [
  {
    id: 'album-01',
    src: '/static/figma/feature/album-original-01.jpeg',
    kind: 'image',
    categories: ['image', 'daily'],
    pinned: true,
    favorite: true,
  },
  {
    id: 'album-02',
    src: '/static/figma/feature/album-original-02.jpeg',
    kind: 'image',
    categories: ['image', 'daily'],
    pinned: true,
    favorite: false,
  },
  {
    id: 'album-03',
    src: '/static/figma/feature/album-original-03.png',
    kind: 'image',
    categories: ['image', 'feeding'],
    pinned: true,
    favorite: true,
  },
  {
    id: 'album-04',
    src: '/static/figma/feature/album-original-04.jpeg',
    kind: 'image',
    categories: ['image', 'daily'],
    pinned: true,
    favorite: false,
  },
  {
    id: 'album-05',
    src: '/static/figma/feature/album-original-05.jpeg',
    kind: 'image',
    categories: ['image', 'feeding'],
    pinned: false,
    favorite: false,
  },
  {
    id: 'album-06',
    src: '/static/figma/feature/album-original-06.jpeg',
    kind: 'image',
    categories: ['image', 'daily'],
    pinned: false,
    favorite: true,
  },
  {
    id: 'album-07',
    src: '/static/figma/feature/album-original-07.png',
    kind: 'image',
    categories: ['image', 'feeding'],
    pinned: false,
    favorite: false,
  },
  {
    id: 'album-08',
    src: '/static/figma/feature/album-original-08.jpeg',
    kind: 'image',
    categories: ['image', 'daily'],
    pinned: false,
    favorite: false,
    hidden: true,
  },
  {
    id: 'album-09',
    src: '/static/figma/feature/album-original-09.jpeg',
    kind: 'image',
    categories: ['image', 'feeding'],
    pinned: false,
    favorite: true,
  },
  {
    id: 'album-10',
    src: '/static/figma/feature/album-original-10.jpeg',
    kind: 'image',
    categories: ['image', 'daily'],
    pinned: false,
    favorite: false,
  },
  {
    id: 'album-11',
    src: '/static/figma/feature/album-original-11.jpeg',
    kind: 'image',
    categories: ['image', 'feeding'],
    pinned: false,
    favorite: false,
  },
  {
    id: 'album-12',
    src: '/static/figma/feature/album-original-12.jpeg',
    kind: 'image',
    categories: ['image', 'daily'],
    pinned: false,
    favorite: false,
  },
  {
    id: 'album-13',
    src: '/static/figma/feature/album-original-13.jpeg',
    kind: 'image',
    categories: ['image', 'feeding'],
    pinned: false,
    favorite: true,
  },
  {
    id: 'album-14',
    src: '/static/figma/feature/album-original-14.jpeg',
    kind: 'image',
    categories: ['image', 'daily'],
    pinned: false,
    favorite: false,
  },
]

const ALBUM_FILTERS: readonly Readonly<AnimalAlbumFilterOption>[] = Object.freeze([
  Object.freeze({ key: 'all', label: '全部' }),
  Object.freeze({ key: 'favorite', label: '收藏' }),
  Object.freeze({ key: 'image', label: '图片' }),
  Object.freeze({ key: 'video', label: '视频' }),
  Object.freeze({ key: 'feeding', label: '投喂' }),
  Object.freeze({ key: 'daily', label: '日常' }),
])

const ALBUM_MENU_ACTIONS: readonly Readonly<AnimalAlbumMenuAction>[] = Object.freeze([
  Object.freeze({ key: 'pin', label: '置顶/取消置顶', iconName: 'actions/pin' }),
  Object.freeze({ key: 'favorite', label: '收藏/取消收藏', iconName: 'actions/heart' }),
  Object.freeze({ key: 'hide', label: '隐藏/取消隐藏', iconName: 'actions/eye-off' }),
  Object.freeze({ key: 'delete', label: '删除', iconName: 'actions/delete' }),
])

export function createAnimalAlbumItems(): AnimalAlbumItem[] {
  return ALBUM_ITEMS.map((item) => ({ ...item, categories: [...item.categories] }))
}

export function createAnimalAlbumFilters(): AnimalAlbumFilterOption[] {
  return ALBUM_FILTERS.map((filter) => ({ ...filter }))
}

export function createAnimalAlbumMenuActions(): AnimalAlbumMenuAction[] {
  return ALBUM_MENU_ACTIONS.map((action) => ({ ...action }))
}
