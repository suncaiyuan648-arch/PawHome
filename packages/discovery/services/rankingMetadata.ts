export type LeaderboardTabKey = 'day_feed' | 'year_feed' | 'day_gain' | 'year_gain'

export interface LeaderboardItem {
  name: string
  lv: number
  weight: string
  city: string
  avatar?: string
  pawId?: string
  rank?: number
  rankLabel?: string
}

export interface LeaderboardRankRow extends LeaderboardItem {
  rank: number
}

export interface LeaderboardSelfRow extends LeaderboardItem {
  rankLabel: string
}

export interface LeaderboardBoard {
  topThree: [LeaderboardItem, LeaderboardItem, LeaderboardItem]
  rankList: LeaderboardRankRow[]
  selfRow: LeaderboardSelfRow
}

export interface LeaderboardTab {
  key: LeaderboardTabKey
  label: string
  width: number
}

export interface LeaderboardPageState extends LeaderboardBoard {
  activeTab: LeaderboardTabKey
  tabList: LeaderboardTab[]
}

const PODIUM_AVATAR_FALLBACK = '/static/figma/leaderboard/avatar-xiangzi-original.png'

const DEFAULT_TABS: readonly LeaderboardTab[] = [
  { key: 'day_feed', label: '日投粮榜', width: 60 },
  { key: 'year_feed', label: '年投粮榜', width: 60 },
  { key: 'day_gain', label: '连续云养榜', width: 75 },
  { key: 'year_gain', label: '累计云养榜', width: 75 },
]

const TAB_BOARDS: Record<LeaderboardTabKey, LeaderboardBoard> = {
  day_feed: {
    topThree: [
      { name: '项子涵', lv: 1, weight: '499', city: '长沙', avatar: PODIUM_AVATAR_FALLBACK },
      { name: '项子涵大王', lv: 1, weight: '499', city: '长沙', avatar: PODIUM_AVATAR_FALLBACK },
      { name: '平头大王', lv: 1, weight: '499', city: '长沙', avatar: PODIUM_AVATAR_FALLBACK },
    ],
    rankList: [
      {
        rank: 4,
        name: '项子涵186..',
        lv: 1,
        weight: '49319',
        city: '长沙',
        avatar: '/static/figma/feature/bf6cfd188d6671b8e283e5e5563ece9da7dc2ef8.jpg',
      },
      {
        rank: 5,
        name: '项子涵',
        lv: 1,
        weight: '499',
        city: '长沙',
        avatar: '/static/figma/feature/e1f65d79bfde8d6fc9cf263e86080d08f13770fc.jpg',
      },
      {
        rank: 6,
        name: '项子',
        lv: 1,
        weight: '499',
        city: '长沙',
        avatar: '/static/figma/feature/92204562aae4aec0c460d32bdc61d58f52e24268.jpg',
      },
      {
        rank: 7,
        name: '花开富贵',
        lv: 1,
        weight: '499',
        city: '长沙',
        avatar: '/static/figma/feature/66fd0f7323c88fa771f5da9f675372febcc335ba.jpg',
      },
      {
        rank: 8,
        name: '平安是福',
        lv: 1,
        weight: '499',
        city: '长沙',
        avatar: '/static/figma/feature/24a1e03cab61f32251063e6be98887860b879349.jpg',
      },
      {
        rank: 9,
        name: '晴朗',
        lv: 1,
        weight: '499',
        city: '长沙',
        avatar: '/static/figma/feature/7266b7871b03ce7a570811a13cbbd71e61491f75.jpg',
      },
      {
        rank: 10,
        name: '项子涵186..',
        lv: 1,
        weight: '499',
        city: '长沙',
        avatar: '/static/figma/feature/bf6cfd188d6671b8e283e5e5563ece9da7dc2ef8.jpg',
      },
    ],
    selfRow: { name: '逢猫', lv: 1, rankLabel: '未上榜', weight: '5796', city: '长沙' },
  },
  year_feed: {
    topThree: [
      { name: '晨光小院', lv: 8, weight: '58240', city: '杭州' },
      { name: '北风投喂站', lv: 6, weight: '49812', city: '北京' },
      { name: '南岸猫猫屋', lv: 7, weight: '45106', city: '重庆' },
    ],
    rankList: [
      { rank: 4, name: '岁岁平安喵', lv: 5, weight: '428880', city: '成都' },
      { rank: 5, name: '江海CatHouse', lv: 4, weight: '401256', city: '青岛' },
      { rank: 6, name: '云端投喂计划', lv: 6, weight: '389440', city: '广州' },
      { rank: 7, name: '老街喂猫团', lv: 3, weight: '356102', city: '西安' },
      { rank: 8, name: '小城故事多', lv: 5, weight: '312980', city: '昆明' },
      { rank: 9, name: '午后阳光院', lv: 4, weight: '298556', city: '厦门' },
      { rank: 10, name: '城北暖心窝', lv: 2, weight: '265340', city: '天津' },
      { rank: 11, name: '枫叶小院', lv: 5, weight: '241888', city: '大连' },
      { rank: 12, name: '巷口喵喵亭', lv: 3, weight: '220060', city: '苏州' },
    ],
    selfRow: { name: '逢猫', lv: 1, rankLabel: '第128名', weight: '182340', city: '长沙' },
  },
  day_gain: {
    topThree: [
      { name: '小院掌柜老李', lv: 4, weight: '168', city: '武汉' },
      { name: '猫咪驿站阿珍', lv: 3, weight: '142', city: '郑州' },
      { name: '东门投喂点', lv: 2, weight: '126', city: '合肥' },
    ],
    rankList: [
      { rank: 4, name: '邻里喵食堂', lv: 2, weight: '119', city: '南昌' },
      { rank: 5, name: '城西小院', lv: 3, weight: '105', city: '石家庄' },
      { rank: 6, name: '暖冬小院', lv: 1, weight: '98', city: '太原' },
      { rank: 7, name: '梧桐树下', lv: 4, weight: '92', city: '南宁' },
      { rank: 8, name: '狸花分部', lv: 2, weight: '86', city: '贵阳' },
      { rank: 9, name: '善意小院', lv: 1, weight: '79', city: '海口' },
      { rank: 10, name: '小鱼干补给站', lv: 3, weight: '71', city: '兰州' },
      { rank: 11, name: '巷尾橘座', lv: 2, weight: '64', city: '银川' },
      { rank: 12, name: '口袋猫粮库', lv: 1, weight: '58', city: '西宁' },
    ],
    selfRow: { name: '逢猫', lv: 1, rankLabel: '第56名', weight: '206', city: '长沙' },
  },
  year_gain: {
    topThree: [
      { name: '星辰小院', lv: 9, weight: '8960', city: '上海' },
      { name: '流浪港湾', lv: 7, weight: '7420', city: '深圳' },
      { name: '四季如春院', lv: 8, weight: '6812', city: '昆明' },
    ],
    rankList: [
      { rank: 4, name: '和风喵喵屋', lv: 6, weight: '6244', city: '无锡' },
      { rank: 5, name: '青石巷小院', lv: 5, weight: '5890', city: '洛阳' },
      { rank: 6, name: '椰林投喂站', lv: 4, weight: '5518', city: '三亚' },
      { rank: 7, name: '暖阳补给台', lv: 6, weight: '5102', city: '哈尔滨' },
      { rank: 8, name: '银杏小院', lv: 3, weight: '4788', city: '长春' },
      { rank: 9, name: '烟火气小院', lv: 5, weight: '4396', city: '沈阳' },
      { rank: 10, name: '江边小猫亭', lv: 4, weight: '4022', city: '福州' },
      { rank: 11, name: '竹篱小院', lv: 2, weight: '3688', city: '温州' },
      { rank: 12, name: '归巢小院', lv: 5, weight: '3310', city: '宁波' },
    ],
    selfRow: { name: '逢猫', lv: 1, rankLabel: '第402名', weight: '28960', city: '长沙' },
  },
}

function cloneBoard(board: LeaderboardBoard): LeaderboardBoard {
  return {
    topThree: [
      { ...board.topThree[0], avatar: board.topThree[0].avatar || PODIUM_AVATAR_FALLBACK },
      { ...board.topThree[1], avatar: board.topThree[1].avatar || PODIUM_AVATAR_FALLBACK },
      { ...board.topThree[2], avatar: board.topThree[2].avatar || PODIUM_AVATAR_FALLBACK },
    ],
    rankList: board.rankList.map((row) => ({ ...row })),
    selfRow: { ...board.selfRow },
  }
}

export function createLeaderboardBoard(key: LeaderboardTabKey): LeaderboardBoard {
  return cloneBoard(TAB_BOARDS[key])
}

export function createLeaderboardPageMetadata(): LeaderboardPageState {
  return {
    activeTab: 'day_feed',
    tabList: DEFAULT_TABS.map((tab) => ({ ...tab })),
    ...createLeaderboardBoard('day_feed'),
  }
}
