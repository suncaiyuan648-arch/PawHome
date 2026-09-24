// Shared by the main tab page and account feature pages; keep it outside subpackage roots.
import { getMemberLevelTitle } from '@/utils/memberLevel.ts'

export type MePageMode = 'default' | 'drawer' | 'profile-upload'
export type MeReviewType = 'rescue' | 'adoption'
export type MeMenuItem =
  | '我的宠物'
  | '我的云养宠物'
  | '我的任务'
  | '我的小院'
  | '小院宠物'
  | '投喂订单'
  | '领养审核'
  | '红包卡券'
  | '我的收藏'
  | '历史浏览'
  | '我的投喂订单'
  | '我入驻的小院'
  | '我申请的领养'
  | '领养评审'
  | '我参与过的评审'
  | '入驻宠托师'
  | '设置'
  | '领养额度'
  | '我的勋章'
  | '救助基金池'
  | '邀请入驻'

export interface MeMembershipMetadata {
  level: number
  title: string
  remainingExp: number
}

export interface MeOrderEntryMetadata {
  label: string
  iconName: string
  badge: number
}

export interface MeReviewCardMetadata {
  title: string
  question: string
  reviewType: MeReviewType
  realPercent: number
  fakePercent: number
}

export interface MePageState {
  pageState: MePageMode
  avatarSheetVisible: boolean
  profileAvatar: string
  membership: MeMembershipMetadata
  authChecked: boolean
  reviewText: string
  orderEntries: MeOrderEntryMetadata[]
  reviewCards: MeReviewCardMetadata[]
  drawerOpen: boolean
  drawerAnim: boolean
  drawerEnterTimer: ReturnType<typeof setTimeout> | null
  drawerCloseTimer: ReturnType<typeof setTimeout> | null
  menuSections: MeMenuItem[][]
}

const ORDER_ENTRIES: readonly MeOrderEntryMetadata[] = Object.freeze([
  { label: '全部', iconName: 'actions/order-all', badge: 0 },
  { label: '待付款', iconName: 'actions/order-pay', badge: 7 },
  { label: '待发货', iconName: 'actions/order-ship', badge: 7 },
  { label: '待收货', iconName: 'actions/order-receive', badge: 7 },
  { label: '待评价', iconName: 'actions/order-review', badge: 7 },
])

const REVIEW_CARDS: readonly MeReviewCardMetadata[] = Object.freeze([
  {
    title: '求助评审',
    question: 'Ta的求助是真的吗？',
    reviewType: 'rescue',
    realPercent: 92,
    fakePercent: 8,
  },
  {
    title: '领养评审',
    question: 'Ta的领养是真的吗？',
    reviewType: 'adoption',
    realPercent: 92,
    fakePercent: 8,
  },
])

const MENU_SECTIONS: readonly (readonly MeMenuItem[])[] = Object.freeze([
  ['我的宠物', '我的云养宠物', '我的任务'],
  ['我的小院', '小院宠物', '投喂订单', '领养审核'],
  ['红包卡券', '我的收藏', '历史浏览'],
  ['我的投喂订单', '我入驻的小院', '我申请的领养'],
  ['领养评审', '我参与过的评审'],
  ['入驻宠托师'],
])

export function normalizeMePageMode(value: unknown): MePageMode {
  return value === 'drawer' || value === 'profile-upload' ? value : 'default'
}

export function createMePageState(): MePageState {
  return {
    pageState: 'default',
    avatarSheetVisible: false,
    profileAvatar: '/static/figma/me-avatar.png',
    membership: { level: 8, title: getMemberLevelTitle(8), remainingExp: 6376 },
    authChecked: false,
    reviewText:
      '今天不做课间操了，开一个紧急例会，就在昨天，发生了一件骇人听闻的学生袭击老师事件，主犯夏洛...',
    orderEntries: ORDER_ENTRIES.map((entry) => ({ ...entry })),
    reviewCards: REVIEW_CARDS.map((card) => ({ ...card })),
    drawerOpen: false,
    drawerAnim: false,
    drawerEnterTimer: null,
    drawerCloseTimer: null,
    menuSections: MENU_SECTIONS.map((section) => [...section]),
  }
}

export function firstTempImagePath(value: unknown): string {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return ''
  const paths = 'tempFilePaths' in value ? value.tempFilePaths : undefined
  return Array.isArray(paths) && typeof paths[0] === 'string' ? paths[0] : ''
}
