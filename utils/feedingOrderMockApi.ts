import { SELF_PAW_ID } from '@/utils/profileNav.ts'
import type {
	FeedingOrderDetailPerspective,
	FeedingOrderDetailPerspectiveInput,
	FeedingOrderSort,
	FeedingOrderVariant,
	FeedingOrderVariantInput,
} from './feedingOrderContracts.ts'

type FeedingVariant = FeedingOrderVariant
type FeedingPerspective = FeedingOrderDetailPerspective

export interface FeedingOrderDetailOptions {
	type?: FeedingOrderDetailPerspectiveInput
	userPawId?: string
	yardOwnerId?: string
	yardId?: string
	orderId?: string
}

export interface FeedingOrderItem {
	id: string
	stateKey: string
	userPawId?: string
	pawId?: string
	yardOwnerId?: string
	yardId?: string
	name?: string
	userName?: string
	userAvatar?: string
	avatar?: string
	yardName?: string
	yardAvatar?: string
	petId?: string
	petName?: string
	petAvatar?: string
	petStatus?: string
	petContinuousDays?: number
	petDescription?: string
	petTags?: string[]
	cloudSpec?: string
	cloudDaysText?: string
	remainingCloudDaysText?: string
	statusText?: string
	statusTone?: string
	statusBadge?: number
	feedbackTag?: string
	feedbackTone?: string
	progressText?: string
	orderCopy?: string
	topText?: string
	orderState?: string
	orderTone?: string
	amountText?: string
	feedingLine?: string
	feedbackCountText?: string
	time?: string
	nextFeedbackAt?: string
	deliveryStatusText?: string
	deliveryStatusTone?: string
	deliveryCopy?: string
	level?: number
	statusRank?: number
	createdAt?: number
	petIds?: string[]
	kg?: number
	countdown?: string
	timedOut?: boolean
}

interface FeedingOrderSortOption {
	key: string
	label: string
}

export interface FeedingOrdersOptions {
  variant?: FeedingOrderVariantInput
  userPawId?: string
  yardOwnerId?: string
  yardId?: string
  keyword?: string
  sort?: FeedingOrderSort
}

interface FeedingOrderListData {
	variant: FeedingVariant
	userPawId: string
	yardOwnerId: string
	yardId: string
	keyword: string
	sort: string
	items: FeedingOrderItem[]
	total: number
}

interface FeedingTimelineItem {
	day: string
	month: string
	indexText: string
	catIcons: string[]
	text: string
	imgs: string[]
}

interface FeedingLogisticsItem {
	text: string
	time: string
}

interface FeedingOrderDetailData {
	perspective: FeedingPerspective
	orderId: string
	userPawId: string
	yardOwnerId: string
	yardId: string
	yardName: string
	yardTag: string
	userName: string
	userAvatar: string
	avatar: string
	ownerPawId: string
	feedAmountLine: string
	time: string
	orderNo: string
	headerStatusText: string
	headerStatusTone: string
	statusText: string
	statusTone: string
	statusCopy: string
	nextFeedbackAt: string
	petId: string
	petName: string
	petAvatar: string
	petStatus: string
	petContinuousDays: number
	petDescription: string
	petTags: string[]
	cloudDaysText: string
	remainingCloudDaysText: string
	deliveryStatusText: string
	deliveryStatusTone: string
	deliveryCopy: string
	ownerLevel: number
	feedbackProgress: string
	waitingCopy: string
	timeline: FeedingTimelineItem[]
	logistics: FeedingLogisticsItem[]
}

export const FEEDING_ORDER_API_MODE = 'mock'

export const FEEDING_ORDER_SORT_OPTIONS: readonly FeedingOrderSortOption[] = [
  { key: 'smart', label: '智能排序' },
  { key: 'newest', label: '最新投粮' },
  { key: 'status', label: '按状态' }
]

const DEFAULT_YARD_ID = '1'
const DEFAULT_USER_PAW_ID = SELF_PAW_ID
const FEED_AVATAR = '/static/figma/feeding/my-feed-avatar.png'
const YARD_AVATAR = '/static/figma/feeding/yard-feed-avatar.png'
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export function formatFeedbackTimeout(nextFeedbackAt: string | number | Date, now: number | Date = Date.now()): string {
  const nextTime = nextFeedbackAt instanceof Date
    ? nextFeedbackAt.getTime()
    : typeof nextFeedbackAt === 'string' || typeof nextFeedbackAt === 'number'
      ? new Date(nextFeedbackAt).getTime()
      : Number.NaN
  const nowTime = now instanceof Date ? now.getTime() : now
  if (!Number.isFinite(nextTime) || !Number.isFinite(nowTime) || nextTime > nowTime) return ''

  const elapsedHours = Math.floor((nowTime - nextTime) / HOUR_MS)
  if (elapsedHours <= 48) return `${Math.max(1, elapsedHours)}小时`
  return `${Math.max(3, Math.floor((nowTime - nextTime) / DAY_MS))}天`
}

const MINE_ORDERS: FeedingOrderItem[] = [
  {
    id: 'f1', stateKey: 'cloud-active-timeout', userPawId: DEFAULT_USER_PAW_ID, pawId: 'my-feed-f1', yardId: DEFAULT_YARD_ID,
    yardName: '平安是福', yardAvatar: FEED_AVATAR, name: '平安是福', level: 1,
    petId: 'roster-cat-2', petName: '小毛毛球', petAvatar: '/static/figma/feeding/2aa0d5e4a47ba5a30dfbda447d2b0e0acab9c94f.png',
    petStatus: '已云养', petContinuousDays: 25, petDescription: '流浪的时候经常去小卖店偷吃火腿肠被打导致有点怕人',
    petTags: ['极度饥饿', '非常亲人', '男娃', '已绝育'], cloudSpec: '云养30天/投粮4斤', cloudDaysText: '云养30天/投粮4斤', remainingCloudDaysText: '3/3天',
    deliveryStatusText: '待领养生效', deliveryStatusTone: 'orange', deliveryCopy: '物资运输中，等待小院签收后正式生效…',
    amountText: '投粮4斤', time: '2026-2-5 13:23:56', statusText: '云养中', statusTone: 'red',
    statusBadge: 0, feedbackTag: '已反馈2/5次', feedbackTone: 'progress', progressText: '您已超时6天未反馈，请尽快反馈！',
    orderCopy: '反馈已超时6天，我们会尽快通知小院反馈',
    nextFeedbackAt: new Date(Date.now() - (6 * DAY_MS + 3 * HOUR_MS)).toISOString(), statusRank: 4, createdAt: 5
  },
  {
    id: 'f2', stateKey: 'cloud-active-feedback', userPawId: DEFAULT_USER_PAW_ID, pawId: 'my-feed-f2', yardId: DEFAULT_YARD_ID,
    yardName: '平安是福', yardAvatar: FEED_AVATAR, name: '平安是福', level: 1,
    petId: 'roster-cat-3', petName: '小黑', petAvatar: '/static/figma/pets/pet-black-white.png', petStatus: '已云养',
    cloudSpec: '云养30天/投粮4斤', amountText: '投粮4斤', time: '2026-2-5 13:23:56', statusText: '云养中', statusTone: 'blue',
    statusBadge: 0, feedbackTag: '已反馈2/5次', feedbackTone: 'progress', progressText: '今天已经反馈了，辛苦了！',
    orderCopy: '今天已经反馈了，辛苦了！', statusRank: 3, createdAt: 4
  },
  {
    id: 'f3', stateKey: 'waiting-logistics', userPawId: DEFAULT_USER_PAW_ID, pawId: 'my-feed-f3', yardId: DEFAULT_YARD_ID,
    yardName: '平安是福', yardAvatar: FEED_AVATAR, name: '平安是福', level: 1,
    petId: 'roster-cat-1', petName: '小毛球', petAvatar: '/static/figma/yard-cats/cat-avatar.png', petStatus: '待领养生效',
    cloudSpec: '云养30天/投粮4斤', amountText: '投粮4斤', time: '2026-2-5 13:23:56', statusText: '待物流签收', statusTone: 'orange',
    statusBadge: 0, feedbackTag: '待签收', feedbackTone: 'pending', progressText: '物资运输中，等待小院签收后正式生效…',
    orderCopy: '物资运输中，等待小院签收后正式生效…', statusRank: 2, createdAt: 3
  },
  {
    id: 'f4', stateKey: 'waiting-cloud-effective', userPawId: DEFAULT_USER_PAW_ID, pawId: 'my-feed-f4', yardId: DEFAULT_YARD_ID,
    yardName: '平安是福', yardAvatar: FEED_AVATAR, name: '平安是福', level: 1,
    petId: 'roster-cat-1', petName: '小毛球', petAvatar: '/static/figma/yard-cats/cat-avatar.png', petStatus: '待云养',
    cloudSpec: '云养30天/投粮4斤', amountText: '投粮4斤', time: '2026-2-5 13:23:56', statusText: '待云养生效', statusTone: 'orange',
    statusBadge: 0, feedbackTag: '待开始', feedbackTone: 'pending', progressText: '等待其他订单云养时间结束后开始',
    orderCopy: '等待其他订单云养时间结束后开始', statusRank: 1, createdAt: 2
  },
  {
    id: 'f5', stateKey: 'completed', userPawId: DEFAULT_USER_PAW_ID, pawId: 'my-feed-f5', yardId: DEFAULT_YARD_ID,
    yardName: '平安是福', yardAvatar: FEED_AVATAR, name: '平安是福', level: 1,
    petId: 'roster-cat-2', petName: '小毛毛球', petAvatar: '/static/figma/feeding/2aa0d5e4a47ba5a30dfbda447d2b0e0acab9c94f.png', petStatus: '已云养',
    cloudSpec: '云养30天/投粮4斤', amountText: '投粮4斤', time: '2026-2-5 13:23:56', statusText: '已完成', statusTone: 'green',
    statusBadge: 0, feedbackTag: '已完成', feedbackTone: 'done', progressText: '反馈次数全部完成',
    orderCopy: '反馈次数全部完成', statusRank: 5, createdAt: 1
  }
]

const YARD_ORDERS: FeedingOrderItem[] = [
  {
    id: 'yard-order-1', stateKey: 'cloud-active-timeout', userPawId: 'yard-user-f1', pawId: 'yard-user-f1', yardOwnerId: 'yard-owner-1', yardId: DEFAULT_YARD_ID,
    yardName: '小院投粮', yardAvatar: YARD_AVATAR, name: '平安是福', level: 1,
    petName: '小白', cloudSpec: '云养30天/投粮4斤', feedingLine: '【小白】云养30天/投粮4斤', amountText: '【小白】云养30天/投粮4斤', time: '2026-2-5 13:23:56',
    topText: '已反馈2/5次', feedbackTag: '已反馈2/5次', feedbackTone: 'progress', orderState: '云养中', orderTone: 'red',
    orderCopy: '您已超时6天未反馈，请尽快反馈！', statusRank: 4, createdAt: 5,
    petIds: ['roster-cat-2'], kg: 4, userName: '平安是福', userAvatar: YARD_AVATAR,
    countdown: '3天23:34:45后超时', timedOut: false
  },
  {
    id: 'yard-order-2', stateKey: 'cloud-active-feedback', userPawId: 'yard-user-f2', pawId: 'yard-user-f2', yardOwnerId: 'yard-owner-1', yardId: DEFAULT_YARD_ID,
    yardName: '小院投粮', yardAvatar: YARD_AVATAR, name: '平安是福', level: 1,
    petName: '小黑', cloudSpec: '云养30天/投粮4斤', feedingLine: '【小黑】云养30天/投粮4斤', amountText: '【小黑】云养30天/投粮4斤', time: '2026-2-5 13:23:56',
    topText: '已反馈2/5次', feedbackTag: '已反馈2/5次', feedbackTone: 'progress', orderState: '云养中', orderTone: 'blue',
    orderCopy: '今天已经反馈了，辛苦了！', statusRank: 3, createdAt: 4,
    petIds: ['roster-cat-3'], kg: 4, userName: '平安是福', userAvatar: YARD_AVATAR,
    countdown: '', timedOut: true
  },
  {
    id: 'yard-order-3', stateKey: 'completed', userPawId: 'yard-user-f3', pawId: 'yard-user-f3', yardOwnerId: 'yard-owner-1', yardId: DEFAULT_YARD_ID,
    yardName: '小院投粮', yardAvatar: YARD_AVATAR, name: '平安是福', level: 1,
    petName: '包子脸', cloudSpec: '云养30天/投粮4斤', feedingLine: '【包子脸】云养30天/投粮4斤', amountText: '【包子脸】云养30天/投粮4斤', time: '2026-2-5 13:23:56',
    topText: '已完成', feedbackTag: '已完成', feedbackTone: 'done', orderState: '已完成', orderTone: 'green',
    orderCopy: '反馈次数全部完成', statusRank: 5, createdAt: 3,
    petIds: ['roster-dog-2'], kg: 4, userName: '平安是福', userAvatar: YARD_AVATAR,
    countdown: '', timedOut: false
  },
  {
    id: 'yard-order-4', stateKey: 'waiting-logistics', userPawId: 'yard-user-f4', pawId: 'yard-user-f4', yardOwnerId: 'yard-owner-1', yardId: DEFAULT_YARD_ID,
    yardName: '小院投粮', yardAvatar: YARD_AVATAR, name: '平安是福', level: 1,
    petName: '黑猪', cloudSpec: '云养30天/投粮4斤', feedingLine: '【黑猪】云养30天/投粮4斤', amountText: '【黑猪】云养30天/投粮4斤', time: '2026-2-5 13:23:56',
    topText: '待签收', feedbackTag: '待签收', feedbackTone: 'pending', orderState: '待物流签收', orderTone: 'orange',
    orderCopy: '物资运输中，等待小院签收后正式生效…', statusRank: 0, createdAt: 2,
    petIds: ['roster-cat-1'], kg: 4, userName: '平安是福', userAvatar: YARD_AVATAR,
    countdown: '', timedOut: false
  },
  {
    id: 'yard-order-5', stateKey: 'waiting-cloud-effective', userPawId: 'yard-user-f5', pawId: 'yard-user-f5', yardOwnerId: 'yard-owner-1', yardId: DEFAULT_YARD_ID,
    yardName: '小院投粮', yardAvatar: YARD_AVATAR, name: '平安是福', level: 1,
    petName: '黑猪', cloudSpec: '云养30天/投粮4斤', feedingLine: '【黑猪】云养30天/投粮4斤', amountText: '【黑猪】云养30天/投粮4斤', time: '2026-2-5 13:23:56',
    topText: '待开始', feedbackTag: '待开始', feedbackTone: 'pending', orderState: '待云养生效', orderTone: 'orange',
    orderCopy: '等待其他订单云养时间结束后开始', statusRank: 0, createdAt: 1,
    petIds: ['roster-cat-1'], kg: 4, userName: '平安是福', userAvatar: YARD_AVATAR,
    countdown: '', timedOut: false
  }
]

function normalizeVariant(value: unknown): FeedingVariant {
  return value === 'yard' || value === 'owner' ? 'yard' : 'mine'
}

function normalizeText(value: unknown): string {
  return String(value === null || value === undefined ? '' : value).trim().toLowerCase()
}

function matches(item: FeedingOrderItem, keyword: string): boolean {
  const text = normalizeText(keyword)
  if (!text) return true
  return [item.name, item.userName, item.yardName, item.petName, item.cloudSpec, item.amountText, item.orderState, item.orderCopy]
    .some(value => normalizeText(value).includes(text))
}

function sortItems(items: FeedingOrderItem[], sort: string): FeedingOrderItem[] {
  const next = items.slice()
  if (sort === 'newest') return next.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
  if (sort === 'status') return next.sort((a, b) => Number(b.statusRank || 0) - Number(a.statusRank || 0))
  return next.sort((a, b) => Number(b.statusRank || 0) - Number(a.statusRank || 0) || Number(b.createdAt || 0) - Number(a.createdAt || 0))
}

export function getFeedingOrders({
  variant = 'mine',
  userPawId = DEFAULT_USER_PAW_ID,
  yardOwnerId = '',
  yardId = DEFAULT_YARD_ID,
  keyword = '',
  sort = 'smart'
}: FeedingOrdersOptions = {}): Promise<{ success: true; source: string; data: FeedingOrderListData; error: null }> {
  const normalizedVariant = normalizeVariant(variant)
  const normalizedUserPawId = String(userPawId || DEFAULT_USER_PAW_ID)
  const normalizedYardOwnerId = String(yardOwnerId || '')
  const normalizedYardId = String(yardId || DEFAULT_YARD_ID)
  const source = normalizedVariant === 'yard' ? YARD_ORDERS : MINE_ORDERS
  const scoped = source.filter(item => normalizedVariant === 'yard'
    ? String(item.yardId) === normalizedYardId && (!normalizedYardOwnerId || String(item.yardOwnerId || '') === normalizedYardOwnerId)
    : String(item.userPawId) === normalizedUserPawId)
  const filtered = scoped.filter(item => matches(item, keyword))
  const normalizedSort = typeof sort === 'string' ? sort : 'smart'
  const items = sortItems(filtered, FEEDING_ORDER_SORT_OPTIONS.some(option => option.key === normalizedSort) ? normalizedSort : 'smart')
    .map(item => ({
      ...item,
      userName: item.userName || item.name || '投粮人',
      userAvatar: item.userAvatar || item.avatar || item.yardAvatar || FEED_AVATAR,
      petName: item.petName || '小毛球',
      petAvatar: item.petAvatar || '/static/figma/yard-cats/cat-avatar.png',
      petStatus: item.petStatus || (item.stateKey === 'waiting-cloud-effective' ? '待云养' : '已云养'),
      cloudSpec: item.cloudSpec || (item.amountText && item.amountText.replace(/^【[^】]+】\s*/, '')) || '云养30天/投粮4斤',
      feedingLine: item.feedingLine || item.amountText || `【${item.petName || '小毛球'}】云养30天/投粮4斤`,
      feedbackCountText: item.feedbackCountText || item.topText || item.feedbackTag || item.statusText || '待反馈'
    }))

  return Promise.resolve({
    success: true,
    source: FEEDING_ORDER_API_MODE,
    data: { variant: normalizedVariant, userPawId: normalizedUserPawId, yardOwnerId: normalizedYardOwnerId, yardId: normalizedYardId, keyword, sort, items, total: items.length },
    error: null
  })
}

function detailTimeline(item: FeedingOrderItem): FeedingTimelineItem[] {
  const avatar = item && (item.userAvatar || item.yardAvatar || FEED_AVATAR)
  const photos = ['/static/home-feed-1.png', '/static/home-feed-1.png', avatar]
  return [
    { day: '23', month: '6月', indexText: '3/5', catIcons: [avatar, avatar, avatar, avatar], text: item.orderCopy || '你家的猫咪被我照顾的很好，别担心', imgs: photos },
    { day: '22', month: '6月', indexText: '2/5', catIcons: [avatar, avatar, avatar, avatar], text: '今天又来投喂小猫了，感谢幸福人生的投粮，会继续用心反馈～', imgs: photos },
    { day: '21', month: '6月', indexText: '1/5', catIcons: [avatar, avatar, avatar, avatar], text: '今天又来投喂小猫了，感谢幸福人生的投粮，会继续用心反馈～', imgs: photos }
  ]
}

function detailLogistics(): FeedingLogisticsItem[] {
  return [
    { text: '已签收', time: '2026-2-21 17:37' },
    { text: '已发货', time: '2026-2-21 17:37' },
    { text: '仓库分拣打包中', time: '2026-2-21 17:37' },
    { text: '已下单', time: '2026-2-21 17:37' }
  ]
}

function normalizeDetailType(value: unknown): FeedingPerspective {
  return value === 'yard' || value === 'yard-owner' || value === 'owner' ? 'yard-owner' : 'cloud-parent'
}

export function getFeedingOrderDetail({
  type = 'cloud-parent',
  userPawId = DEFAULT_USER_PAW_ID,
  yardOwnerId = 'yard-owner-1',
  yardId = DEFAULT_YARD_ID,
	orderId = ''
}: FeedingOrderDetailOptions = {}): Promise<{ success: true; source: string; data: FeedingOrderDetailData; error: null }> {
  const perspective = normalizeDetailType(type)
  const normalizedOrderId = String(orderId || '')
  const source = perspective === 'yard-owner' ? YARD_ORDERS : MINE_ORDERS
  const normalizedUserPawId = String(userPawId || DEFAULT_USER_PAW_ID)
  const normalizedYardOwnerId = String(yardOwnerId || '')
  const normalizedYardId = String(yardId || DEFAULT_YARD_ID)
  const scoped = source.filter(order => perspective === 'yard-owner'
    ? String(order.yardId) === normalizedYardId && (!normalizedYardOwnerId || String(order.yardOwnerId || '') === normalizedYardOwnerId)
    : String(order.userPawId) === normalizedUserPawId)
  const available = scoped.length ? scoped : source
  const item = available.find(order => String(order.id) === normalizedOrderId) || available[0] || MINE_ORDERS[0]
  const isYardOwner = perspective === 'yard-owner'
  const displayStatus = isYardOwner ? (item.orderState || '云养中') : (item.statusText || '已反馈')
  const progress = item.stateKey === 'completed'
    ? '已反馈5/5次'
    : (isYardOwner ? (item.feedbackTag || item.topText || '已反馈2/5次') : (item.feedbackTag || item.progressText || '已反馈3/5次'))
  const deliveryStatusText = item.deliveryStatusText || (item.stateKey === 'waiting-logistics' ? '待领养生效' : '领养生效中')
  const deliveryStatusTone = item.deliveryStatusTone || (item.stateKey === 'waiting-logistics' ? 'orange' : 'green')
  const deliveryCopy = item.deliveryCopy || (item.stateKey === 'waiting-logistics' ? '物资运输中，等待小院签收后正式生效…' : '云养中，小院已签收...')
  const data = {
    perspective,
    orderId: normalizedOrderId || item.id,
    userPawId: normalizedUserPawId,
    yardOwnerId: normalizedYardOwnerId || String(item.yardOwnerId || 'yard-owner-1'),
    yardId: normalizedYardId || String(item.yardId || DEFAULT_YARD_ID),
    yardName: isYardOwner ? '小院投粮' : (item.yardName || '平安是福'),
    yardTag: '小院',
    userName: item.userName || item.name || '平安是福',
    userAvatar: item.userAvatar || item.avatar || item.yardAvatar || FEED_AVATAR,
    avatar: item.userAvatar || item.avatar || item.yardAvatar || FEED_AVATAR,
    ownerPawId: item.pawId || item.userPawId || normalizedYardOwnerId,
    feedAmountLine: item.amountText || '投粮4斤',
    time: item.time || '2026-2-5 13:23:56',
    orderNo: `FEED-${normalizedOrderId || item.id}`,
    headerStatusText: displayStatus,
    headerStatusTone: isYardOwner && item.orderTone === 'red' ? 'red' : 'green',
    statusText: isYardOwner ? (item.orderState || '云养中') : (item.statusText || '已反馈'),
    statusTone: isYardOwner ? (item.orderTone || 'red') : (item.statusTone || 'blue'),
    statusCopy: item.orderCopy || item.progressText || '',
    nextFeedbackAt: item.nextFeedbackAt || '',
    petId: item.petId || 'roster-cat-2',
    petName: item.petName || '小毛毛球',
    petAvatar: item.petAvatar || '/static/figma/feeding/2aa0d5e4a47ba5a30dfbda447d2b0e0acab9c94f.png',
    petStatus: item.petStatus || '已云养',
    petContinuousDays: item.petContinuousDays || 25,
    petDescription: item.petDescription || '流浪的时候经常去小卖店偷吃火腿肠被打导致有点怕人',
    petTags: Array.isArray(item.petTags) && item.petTags.length ? item.petTags : ['极度饥饿', '非常亲人', '男娃', '已绝育'],
    cloudDaysText: item.cloudDaysText || '云养30天/投粮4斤',
    remainingCloudDaysText: item.remainingCloudDaysText || '3/3天',
    deliveryStatusText,
    deliveryStatusTone,
    deliveryCopy,
    ownerLevel: item.level || 1,
    feedbackProgress: /^已反馈/.test(progress)
      ? progress.replace(/^已反馈/, '').replace(/次$/, '')
      : (progress === '全部完成' ? '5/5' : '0/5'),
    waitingCopy: isYardOwner ? (item.orderCopy || '云家长还在等您今天的反馈，不要忘了哟！') : '',
    timeline: detailTimeline(item),
    logistics: detailLogistics()
  }
  return Promise.resolve({
    success: true,
    source: FEEDING_ORDER_API_MODE,
    data,
    error: null
  })
}
