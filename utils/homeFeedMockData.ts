import type { AnnouncementMetadata } from './announcementMetadata'

export type HomeFeedTabKey = 'dynamic' | 'yard' | 'joined'
export type HomeYardCardVariant = 'badges' | 'org'

export interface HomeFeedTemplateMetadata {
  cover: string
  distance: string
  district: string
  title: string
  liked: boolean
  likes: number
}

export interface HomeFeedCardMetadata extends HomeFeedTemplateMetadata {
  id: string
  userName?: string
  userAvatar?: string
}

export type HomeAnnouncementMockMetadata = AnnouncementMetadata

export interface HomeFeedTabMetadata {
  key: HomeFeedTabKey
  label: string
}

export interface HomeYardCardMetadata {
  id: number
  variant: HomeYardCardVariant
}

const HOME_FEED_TEMPLATES: readonly HomeFeedTemplateMetadata[] = Object.freeze([
  {
    cover: '/static/figma/home/dynamic-left.png',
    distance: '3.2km',
    district: '金水区',
    title: '小猫吃的好开心',
    liked: false,
    likes: 37,
  },
  {
    cover: '/static/figma/home/dynamic-right.png',
    distance: '2.6km',
    district: '天河区',
    title: '小猫吃得好开心啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊',
    liked: true,
    likes: 32,
  },
  {
    cover: '/static/figma/home/dynamic-left.png',
    distance: '1.8km',
    district: '越秀区',
    title: '今天也有认真吃饭的小猫咪',
    liked: false,
    likes: 24,
  },
  {
    cover: '/static/figma/home/dynamic-right.png',
    distance: '4.1km',
    district: '海珠区',
    title: '投喂完成，猫猫们已经排队开饭啦',
    liked: false,
    likes: 18,
  },
])

export const HOME_ANNOUNCEMENT_MOCKS: readonly HomeAnnouncementMockMetadata[] = Object.freeze([
  {
    id: 'feeding-demo-1',
    feedingWeightJin: 40,
    text: '广东汕头的花开富贵老师对小院我就是要喂猫投粮40斤，积善缘，得福报~',
  },
  {
    id: 'feeding-demo-2',
    feedingWeightJin: 4,
    text: '广州天河的橘子汽水为幸福小院投粮4斤，愿每只流浪猫都能吃饱~',
  },
  {
    id: 'feeding-demo-3',
    feedingWeightJin: 0.4,
    text: '深圳南山的猫咪守护者为阳光小院投粮0.4斤，谢谢你的温柔投喂！',
  },
  { id: 'feeding-demo-4', text: '佛山禅城的小鱼干老师为喵星人之家投粮200克，爱心已送达~' },
  { id: 'feeding-demo-5', text: '东莞松山湖的春风十里为流浪猫驿站投粮800克，今日猫粮已加满！' },
  { id: 'feeding-demo-6', text: '珠海香洲的海边散步为暖暖小院投粮350克，让毛孩子不再挨饿~' },
  { id: 'feeding-demo-7', text: '惠州惠城的星空旅人为猫猫补给站投粮600克，感谢这份爱心！' },
  { id: 'feeding-demo-8', text: '中山石岐的团团圆圆为有猫小院投粮250克，愿善意一直传递~' },
  { id: 'feeding-demo-9', text: '江门蓬江的元气满满为街角猫屋投粮450克，猫咪们正在开心用餐~' },
  { id: 'feeding-demo-10', text: '肇庆端州的晚风为希望小院投粮700克，你的每次投喂都很有意义~' },
])

export const HOME_FEED_TAB_MOCKS: readonly HomeFeedTabMetadata[] = Object.freeze([
  { key: 'dynamic', label: '动态' },
  { key: 'yard', label: '小院' },
  { key: 'joined', label: '我加入的' },
])

export const HOME_YARD_CARD_MOCKS: readonly HomeYardCardMetadata[] = Object.freeze([
  { id: 1, variant: 'badges' },
  { id: 2, variant: 'org' },
])

export function createHomeFeedMockCards(total = 50): HomeFeedCardMetadata[] {
  return Array.from({ length: total }, (_, index) => {
    const template = HOME_FEED_TEMPLATES[index % HOME_FEED_TEMPLATES.length]
    return {
      ...template,
      id: `mock-feed-${index + 1}`,
      title: `${template.title} · ${index + 1}`,
      likes: template.likes + (index % 9),
    }
  })
}

export function createHomeAnnouncementMocks(): HomeAnnouncementMockMetadata[] {
  return HOME_ANNOUNCEMENT_MOCKS.map((item) => ({ ...item }))
}

export function createHomeFeedTabMocks(): HomeFeedTabMetadata[] {
  return HOME_FEED_TAB_MOCKS.map((tab) => ({ ...tab }))
}

export function createHomeYardCardMocks(): HomeYardCardMetadata[] {
  return HOME_YARD_CARD_MOCKS.map((yard) => ({ ...yard }))
}
