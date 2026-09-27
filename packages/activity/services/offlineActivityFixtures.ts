export type OfflineActivityState = 'ongoing' | 'ended'

export interface OfflineActivitySummary {
  activityId: string
  title: string
  state: OfflineActivityState
  stateLabel: string
  startText: string
  locationText: string
  organizerText: string
  participantCount: number
  cover: string
  organizerAvatar: string
  participantAvatars: string[]
}

export interface OfflineActivityComment {
  id: string
  author: string
  avatar: string
  level: number | string
  body: string
  meta: string
  likes: number
}

export interface OfflineActivityDetail extends OfflineActivitySummary {
  detailTitle: string
  tags: string[]
  detailLocation: string
  organizerName: string
  organizerAvatarLarge: string
  organizerEvents: string
  organizerType: string
  description: string[]
  comments: OfflineActivityComment[]
}

const COVER = '/static/figma/offline-activity/event-cover.webp'
const PARTICIPANTS = [
  '/static/figma/offline-activity/participant-1.png',
  '/static/figma/offline-activity/participant-2.png',
  '/static/figma/offline-activity/participant-3.png',
]

export const DEFAULT_OFFLINE_ACTIVITY_ID = 'zz-adoption-day-2026'

const ONGOING_ACTIVITIES: OfflineActivitySummary[] = [
  {
    activityId: DEFAULT_OFFLINE_ACTIVITY_ID,
    title: '郑州领养日活动',
    state: 'ongoing',
    stateLabel: '报名中',
    startText: '09.12 周六  08:00  ‒  09.13 周日 19:00',
    locationText: '郑州 金安区 信万广场',
    organizerText: '项子涵186..',
    participantCount: 3,
    cover: COVER,
    organizerAvatar: '/static/figma/offline-activity/organizer-list.png',
    participantAvatars: PARTICIPANTS,
  },
  {
    activityId: 'zz-adoption-day-2026-2',
    title: '郑州领养日活动',
    state: 'ongoing',
    stateLabel: '报名中',
    startText: '09.12 周六  08:00  ‒  09.13 周日 19:00',
    locationText: '郑州 金安区 信万广场',
    organizerText: '项子涵186..',
    participantCount: 3,
    cover: COVER,
    organizerAvatar: '/static/figma/offline-activity/organizer-list.png',
    participantAvatars: PARTICIPANTS,
  },
  {
    activityId: 'zz-adoption-day-2026-3',
    title: '郑州领养日活动',
    state: 'ongoing',
    stateLabel: '报名中',
    startText: '09.12 周六  08:00  ‒  09.13 周日 19:00',
    locationText: '郑州 金安区 信万广场',
    organizerText: '项子涵186..',
    participantCount: 3,
    cover: COVER,
    organizerAvatar: '/static/figma/offline-activity/organizer-list.png',
    participantAvatars: PARTICIPANTS,
  },
]

const ENDED_ACTIVITIES: OfflineActivitySummary[] = [
  {
    activityId: 'zz-adoption-day-2026-past',
    title: '郑州领养日活动',
    state: 'ended',
    stateLabel: '已结束',
    startText: '08.30 周日  09:00  ‒  08.30 周日 18:00',
    locationText: '郑州 金安区 信万广场',
    organizerText: '项子涵186..',
    participantCount: 28,
    cover: COVER,
    organizerAvatar: '/static/figma/offline-activity/organizer-list.png',
    participantAvatars: PARTICIPANTS,
  },
]

const DETAIL_COMMENTS: OfflineActivityComment[] = [
  {
    id: 'comment-1',
    author: '姜栋',
    avatar: '/static/figma/offline-activity/comment-author.png',
    level: 1,
    body: '给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞',
    meta: '昨天 20:45  江西',
    likes: 32,
  },
  {
    id: 'comment-2',
    author: '姜栋',
    avatar: '/static/figma/offline-activity/comment-author.png',
    level: 1,
    body: '给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞',
    meta: '昨天 20:45  江西',
    likes: 32,
  },
]

export function getOfflineActivitySummaries(state: OfflineActivityState): OfflineActivitySummary[] {
  return state === 'ongoing' ? ONGOING_ACTIVITIES : ENDED_ACTIVITIES
}

export function getOfflineActivityDetail(activityId: string): OfflineActivityDetail | undefined {
  const summary = [...ONGOING_ACTIVITIES, ...ENDED_ACTIVITIES].find(
    (item) => item.activityId === activityId,
  )
  if (!summary) return undefined
  return {
    ...summary,
    detailTitle: '郑州信万广场领养活动',
    tags: ['新手友好', '接受学生'],
    detailLocation: '郑州·金安区信万广场',
    organizerName: 'DOU',
    organizerAvatarLarge: '/static/figma/offline-activity/organizer-detail.png',
    organizerEvents: '发起过5次活动',
    organizerType: '个人发起',
    description: ['夏末秋初，别让状态跟着天气一起降温', '速来添加'],
    comments: DETAIL_COMMENTS,
  }
}
