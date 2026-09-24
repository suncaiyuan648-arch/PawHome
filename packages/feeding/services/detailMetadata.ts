import type { FeedingOrderDetail, FeedingTimelineEntry } from './orderMockApi.ts'

export interface FeedingDetailFigmaState {
  avatarImgs: string[]
  photoImgs: string[]
}

export interface FeedingTimelineRow extends Pick<FeedingTimelineEntry, 'day' | 'month' | 'indexText'>,
  Partial<Omit<FeedingTimelineEntry, 'day' | 'month' | 'indexText'>> {}

export interface FeedingCloudPetSummary {
  id: string
  name: string
  avatar: string
  status: string
  continuousDays: number
  description: string
  tags: string[]
}

export interface FeedingCloudOrderSummary {
  cloudDays: string
  time: string
  remainingDays: string
  orderNo: string
  statusText: string
  statusTone: string
  statusCopy: string
}

export interface FeedingFeedbackAction {
  key: 'feedback'
  label: string
  qa: string
  size: 'md'
  shape: 'pill'
}

const DETAIL_IMAGES: readonly string[] = Object.freeze([
  '/static/figma/feeding/2aa0d5e4a47ba5a30dfbda447d2b0e0acab9c94f.png',
  '/static/figma/feeding/663a44c6cdee9de9df233539fac35f7f3f908376.png',
  '/static/figma/feeding/f575bdfc31f25882d8cc6f35223e98ec2b1c1bf2.png',
  '/static/figma/feeding/2e4db61734b5d15cca204e0947d81a871ea9a8b6.png',
  '/static/figma/feeding/d81342748c84fc1068ceb0af9525bc465f5517e8.png',
  '/static/figma/feeding/badf7f54fe66571722f8b3aa5742e6abbb479c44.png',
  '/static/figma/feeding/409928f32c3a7f2126933ffbfe038b58d6dd26cc.png',
  '/static/figma/feeding/1472957ded35cdc32a413c0d8aeffd67d583a54a.png',
])

const FALLBACK_TIMELINE_DAYS: readonly string[] = Object.freeze(['23', '22', '21'])

const EMPTY_ORDER_DETAIL: FeedingOrderDetail = Object.freeze({
  perspective: 'cloud-parent',
  orderId: '',
  userPawId: '',
  yardOwnerId: '',
  yardId: '',
  yardName: '',
  yardTag: '',
  userName: '',
  userAvatar: '',
  avatar: '',
  ownerPawId: '',
  feedAmountLine: '',
  time: '',
  orderNo: '',
  headerStatusText: '',
  headerStatusTone: '',
  statusText: '',
  statusTone: '',
  statusCopy: '',
  nextFeedbackAt: '',
  petId: '',
  petName: '',
  petAvatar: '',
  petStatus: '',
  petContinuousDays: 0,
  petDescription: '',
  petTags: [],
  cloudDaysText: '',
  remainingCloudDaysText: '',
  deliveryStatusText: '',
  deliveryStatusTone: '',
  deliveryCopy: '',
  ownerLevel: 0,
  feedbackProgress: '',
  waitingCopy: '',
  timeline: [],
  logistics: [],
})

export function createFeedingDetailFigmaState(): FeedingDetailFigmaState {
  return {
    avatarImgs: DETAIL_IMAGES.slice(0, 4),
    photoImgs: DETAIL_IMAGES.slice(4, 7),
  }
}

export function createFeedingTimelineFallback(): FeedingTimelineRow[] {
  return FALLBACK_TIMELINE_DAYS.map((day, index) => ({
    day,
    month: '6月',
    indexText: `${3 - index}/5`,
  }))
}

export function createEmptyFeedingOrderDetail(): FeedingOrderDetail {
  return {
    ...EMPTY_ORDER_DETAIL,
    petTags: [],
    timeline: [],
    logistics: [],
  }
}
