export type ProfileTabKey = 'review' | 'dynamic' | 'joined' | 'yard' | 'adopt' | 'donate'
export type ProfileActionKey = 'edit' | 'report' | 'share' | 'block' | 'remark'
export type ProfileActionTone = 'danger'

export interface ProfileStats {
  follow: number
  fans: number
  likes: number
  donate: number
}

export interface ProfilePageTab {
  key: ProfileTabKey
  label: string
  count?: number
}

export interface ProfileActionItem {
  key: ProfileActionKey
  label: string
  tone?: ProfileActionTone
}

export interface ProfileFeedItem {
  cover: string
  title: string
  distance: string
  district: string
  userAvatar: string
  userName: string
  likes: number
  liked: boolean
}

export interface ProfileAdoptCat {
  name: string
  img: string
}

export interface ProfileAdoptRow {
  userName: string
  userAvatar: string
  status: string
  cats: ProfileAdoptCat[]
}

export interface ProfileJoinedGalleryItem {
  img: string
  caption: string
}

interface ProfileJoinedRowBase {
  userAvatar: string
  userName: string
  verified: boolean
  distance: string
  district: string
  desc: string
  gallery: ProfileJoinedGalleryItem[]
}

export interface ProfileJoinedBadgeRow extends ProfileJoinedRowBase {
  variant: 'badges'
  badges: string[]
}

export interface ProfileJoinedOrganizationRow extends ProfileJoinedRowBase {
  variant: 'org'
  orgName: string
}

export type ProfileJoinedRow = ProfileJoinedBadgeRow | ProfileJoinedOrganizationRow

export interface ProfileDonateBadge {
  kind: 'feedback' | 'complete'
  text: string
  notify: number | null
}

export interface ProfileDonateRow {
  userName: string
  userAvatar: string
  actionText: string
  timeStr: string
  topBadge: ProfileDonateBadge
  progressText: string
}

export interface ProfileTimelineItem {
  day: string
  month: string
  action: string
  copy?: string
  images?: string[]
  wide?: string
}

export interface ProfileReviewItem {
  id: number
  name: string
  avatar: string
  copy: string
  time: string
  region: string
  likes: number
}

export interface ProfilePublicRecord {
  userId?: string
  name?: string
  nickname?: string
  avatar?: string
  bio?: string
  tags?: string[]
  verified?: boolean
  level?: number
  stats?: Partial<ProfileStats>
}

export interface ProfileRouteOptions {
  userId: string
  pawId: string
  nickname: string
  avatar: string
  state: string
}

export interface ProfilePageMockMetadata {
  heroBgSrc: string
  lastActiveText: string
  verified: boolean
  profileTags: string[]
  bio: string
  stats: ProfileStats
  donateSummary: {
    totalJin: string
    totalTimes: string
  }
  moreActionItems: ProfileActionItem[]
  profileTimelineMode: boolean
  profileTimeline: ProfileTimelineItem[]
  activeTab: ProfileTabKey
  profileTabs: ProfilePageTab[]
  reviewList: ProfileReviewItem[]
  feedList: ProfileFeedItem[]
  adoptList: ProfileAdoptRow[]
  donateList: ProfileDonateRow[]
  joinedList: ProfileJoinedRow[]
  yardList: ProfileJoinedRow[]
}

export interface ProfilePageState extends ProfilePageMockMetadata {
  pawId: string
  queryNickname: string
  queryAvatar: string
  profileRecord: ProfilePublicRecord | null
  showMoreActionSheet: boolean
  showDonateSummaryPopup: boolean
  followed: boolean
  showUnfollowConfirm: boolean
  profileReady: boolean
}

const DEFAULT_PROFILE_STATS: Readonly<ProfileStats> = {
  follow: 2,
  fans: 185,
  likes: 185,
  donate: 13,
}

const DEFAULT_ADOPT_ROWS: readonly ProfileAdoptRow[] = [
  {
    userName: '平安是福',
    userAvatar: '/static/user.png',
    status: '等待院主审核',
    cats: Array.from({ length: 5 }, () => ({ name: '小灰灰', img: '/static/avatarlog.png' })),
  },
  {
    userName: '平安是福',
    userAvatar: '/static/user.png',
    status: '等待院主审核',
    cats: Array.from({ length: 5 }, () => ({ name: '小灰灰', img: '/static/avatarlog.png' })),
  },
]

const DEFAULT_JOINED_ROWS: readonly ProfileJoinedRow[] = [
  {
    userAvatar: '/static/avatar.png',
    userName: '我就是要喂猫',
    verified: true,
    distance: '3.2km',
    district: '金水区',
    variant: 'badges',
    badges: ['6只猫咪', '已成立2个月', '入驻4人'],
    desc: '春去秋来二十年的救助流浪猫时间匆匆而去，在此希望每个...',
    gallery: [],
  },
  {
    userAvatar: '/static/avatar.png',
    userName: '我就是要喂猫',
    verified: true,
    distance: '3.2km',
    district: '金水区',
    variant: 'org',
    orgName: '合肥市希望流浪动物基地',
    desc: '春去秋来二十年的救助流浪猫时间匆匆而去，在此希望每个...',
    gallery: [],
  },
]

const DEFAULT_DONATE_ROWS: readonly ProfileDonateRow[] = [
  {
    userName: '平安是福',
    userAvatar: '/static/avatarlog.png',
    actionText: '投粮4斤',
    timeStr: '2026-2-5 13:23:56',
    topBadge: { kind: 'feedback', text: '已反馈', notify: 3 },
    progressText: '已反馈3/5次',
  },
  {
    userName: '平安是福',
    userAvatar: '/static/avatarlog.png',
    actionText: '投粮4斤',
    timeStr: '2026-2-5 13:23:56',
    topBadge: { kind: 'feedback', text: '已反馈', notify: 4 },
    progressText: '已反馈2/5次',
  },
  {
    userName: '平安是福',
    userAvatar: '/static/avatarlog.png',
    actionText: '投粮4斤',
    timeStr: '2026-2-5 13:23:56',
    topBadge: { kind: 'complete', text: '全部完成', notify: null },
    progressText: '已反馈5/5次',
  },
]

const DEFAULT_PROFILE_TIMELINE: readonly ProfileTimelineItem[] = [
  {
    day: '23',
    month: '',
    action: '云养了一只宠物30天',
    copy: '流浪的时候经常去小卖店偷吃火腿肠被打骂',
    images: [
      '/static/figma/profile/timeline-1.png',
      '/static/figma/profile/timeline-2.png',
      '/static/figma/profile/timeline-3.png',
    ],
  },
  {
    day: '14',
    month: '5月',
    action: '申请领养了一只宠物',
    copy: '流浪的时候经常去小卖店偷吃火腿肠被打骂',
  },
  {
    day: '27',
    month: '4月',
    action: '发起了一次求助',
    copy: '流浪的时候经常去小卖店偷吃火腿肠被打骂',
  },
  {
    day: '21',
    month: '4月',
    action: '第一次来到逢猫',
    wide: '/static/figma/profile/timeline-wide.png',
  },
]

const DEFAULT_REVIEW_LIST: readonly ProfileReviewItem[] = [
  {
    id: 1,
    name: '姜栋',
    avatar: '/static/figma/feature/04a93fa17267335f49e6e818f8caa78dd3afc80b.png',
    copy: '给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞',
    time: '昨天 20:45',
    region: '江西',
    likes: 32,
  },
]

const DEFAULT_PROFILE_TABS: readonly ProfilePageTab[] = [{ key: 'review', label: '评价' }]

const DEFAULT_MORE_ACTIONS: readonly ProfileActionItem[] = [
  { key: 'report', label: '举报', tone: 'danger' },
  { key: 'share', label: '分享' },
  { key: 'block', label: '拉黑' },
  { key: 'remark', label: '备注' },
]

function cloneJoinedGallery(): ProfileJoinedGalleryItem[] {
  return [
    { img: '/static/home-feed-1.png', caption: '开饭了开饭了开饭' },
    { img: '/static/home-feed-2.png', caption: '开饭了开饭了开饭' },
    { img: '/static/home-feed-1.png', caption: '开饭了开饭了开饭' },
    { img: '/static/home-feed-2.png', caption: '开饭了开饭了开饭' },
  ]
}

function cloneJoinedRows(): ProfileJoinedRow[] {
  return DEFAULT_JOINED_ROWS.map((row) => ({
    ...row,
    gallery: cloneJoinedGallery(),
    ...(row.variant === 'badges' ? { badges: [...row.badges] } : {}),
  }))
}

function finiteStat(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function normalizeProfileStats(value: unknown, fallback: ProfileStats): ProfileStats {
  const source = isRecord(value) ? value : {}
  return {
    follow: finiteStat(source.follow) ?? fallback.follow,
    fans: finiteStat(source.fans) ?? fallback.fans,
    likes: finiteStat(source.likes) ?? fallback.likes,
    donate: finiteStat(source.donate) ?? fallback.donate,
  }
}

function normalizeProfileStatsPatch(value: unknown): Partial<ProfileStats> | undefined {
  if (!isRecord(value)) return undefined
  const normalized: Partial<ProfileStats> = {}
  for (const key of ['follow', 'fans', 'likes', 'donate'] as const) {
    const stat = finiteStat(value[key])
    if (stat !== undefined) normalized[key] = stat
  }
  return normalized
}

export function normalizePublicProfileRecord(value: unknown): ProfilePublicRecord | null {
  if (!isRecord(value)) return null
  const result: ProfilePublicRecord = {}
  for (const key of ['userId', 'name', 'nickname', 'avatar', 'bio'] as const) {
    if (typeof value[key] === 'string') result[key] = value[key]
  }
  if (Array.isArray(value.tags))
    result.tags = value.tags.filter((tag): tag is string => typeof tag === 'string')
  if (typeof value.verified === 'boolean') result.verified = value.verified
  if (typeof value.level === 'number' && Number.isFinite(value.level)) result.level = value.level
  const stats = normalizeProfileStatsPatch(value.stats)
  if (stats) result.stats = stats
  return Object.keys(result).length ? result : null
}

function decodeRouteValue(value: unknown): string {
  const raw =
    typeof value === 'string'
      ? value
      : typeof value === 'number' && Number.isFinite(value)
        ? String(value)
        : ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export function normalizeProfileRouteOptions(value: unknown): ProfileRouteOptions {
  const source = isRecord(value) ? value : {}
  return {
    userId: decodeRouteValue(source.userId),
    pawId: decodeRouteValue(source.pawId),
    nickname: decodeRouteValue(source.nickname),
    avatar: decodeRouteValue(source.avatar),
    state: decodeRouteValue(source.state),
  }
}

export function resolveProfileActionKey(value: unknown): ProfileActionKey | null {
  const candidate = isRecord(value) ? value.key : value
  return candidate === 'edit' ||
    candidate === 'report' ||
    candidate === 'share' ||
    candidate === 'block' ||
    candidate === 'remark'
    ? candidate
    : null
}

export function createProfileFeedMocks(nickname: string, avatar: string): ProfileFeedItem[] {
  const userAvatar = avatar || '/static/user.png'
  return [
    {
      cover: '/static/home-feed-1.png',
      title: '小猫吃的好开心',
      distance: '3.2km',
      district: '金水区',
      userAvatar,
      userName: nickname,
      likes: 37,
      liked: false,
    },
    {
      cover: '/static/home-feed-2.png',
      title: '小猫吃的好开心呃呃呃呃呃呃',
      distance: '3.2km',
      district: '金水区',
      userAvatar,
      userName: nickname,
      likes: 32,
      liked: true,
    },
    {
      cover: '/static/home-feed-1.png',
      title: '今天多喂了一点粮',
      distance: '5.0km',
      district: '中原区',
      userAvatar,
      userName: nickname,
      likes: 24,
      liked: false,
    },
    {
      cover: '/static/home-feed-2.png',
      title: '猫咪排队吃饭中',
      distance: '2.1km',
      district: '管城区',
      userAvatar,
      userName: nickname,
      likes: 41,
      liked: true,
    },
  ]
}

export function createProfilePageMockMetadata(): ProfilePageMockMetadata {
  return {
    heroBgSrc: '/static/figma/feature/2ecb240e40e2e1063b6880669cd2ed5a63626710.jpg',
    lastActiveText: '1小时前来过',
    verified: true,
    profileTags: ['男生', '安徽'],
    bio: '建国路猫小院　开店的那些事',
    stats: { ...DEFAULT_PROFILE_STATS },
    donateSummary: { totalJin: '879', totalTimes: '456' },
    moreActionItems: DEFAULT_MORE_ACTIONS.map((item) => ({ ...item })),
    profileTimelineMode: false,
    profileTimeline: DEFAULT_PROFILE_TIMELINE.map((item) => ({
      ...item,
      ...(item.images ? { images: [...item.images] } : {}),
    })),
    activeTab: 'review',
    profileTabs: DEFAULT_PROFILE_TABS.map((tab) => ({ ...tab })),
    reviewList: DEFAULT_REVIEW_LIST.map((review) => ({ ...review })),
    feedList: [],
    adoptList: DEFAULT_ADOPT_ROWS.map((row) => ({
      ...row,
      cats: row.cats.map((cat) => ({ ...cat })),
    })),
    donateList: DEFAULT_DONATE_ROWS.map((row) => ({ ...row, topBadge: { ...row.topBadge } })),
    joinedList: cloneJoinedRows(),
    yardList: cloneJoinedRows(),
  }
}
