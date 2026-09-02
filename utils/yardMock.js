const YARD_STATUS_DEFINITIONS = [
  { key: 'pending', label: '待云养' },
  { key: 'cloud', label: '已云养' },
  { key: 'adopted', label: '已领养' },
  { key: 'missing', label: '失踪' },
  { key: 'dead', label: '死亡' }
]

const yardPet = (id, name, avatar, species, breed, state, extra = {}) => ({
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
  statusLabel: extra.statusLabel || ({
    pending: '待领养',
    cloud: '已云养',
    adopted: '已领养',
    missing: '失踪',
    dead: '死亡'
  }[state] || '待领养'),
  gallery: extra.gallery || [avatar],
  stateTimeLabel: extra.stateTimeLabel || '',
  stateTime: extra.stateTime || ''
})

const cat = '/static/figma/yard-cats/cat-avatar.png'
const dog = '/static/figma/pets/pet-dog.png'
const catGallery = [
  cat,
  '/static/figma/adoption-flow/pet-orange.png',
  '/static/figma/pets/pet-black-white.png'
]
const dogGallery = [
  dog,
  '/static/figma/pets/adoption-dog.png',
  '/static/figma/adoption-flow/pet-hero.png'
]

const YARD_PETS = [
  yardPet('roster-cat-1', '小毛球', cat, 'cat', '加菲猫', 'pending', { gallery: catGallery }),
  yardPet('roster-cat-2', '小毛球', cat, 'cat', '加菲猫', 'cloud', { gallery: catGallery }),
  yardPet('roster-cat-3', '小毛球', cat, 'cat', '奶牛猫', 'cloud', { gallery: catGallery }),
  yardPet('roster-cat-4', '花春晓', cat, 'cat', '英短', 'adopted', { gallery: catGallery, stateTimeLabel: '领养时间', stateTime: '2026-06-12' }),
  yardPet('roster-cat-5', '小灰灰', cat, 'cat', '中华田园猫', 'missing', { gallery: catGallery, stateTimeLabel: '失踪时间', stateTime: '2026-06-18' }),
  yardPet('roster-cat-6', '年糕糕', cat, 'cat', '中华田园猫', 'dead', { gallery: catGallery, stateTimeLabel: '死亡时间', stateTime: '2026-06-20' }),
  yardPet('roster-cat-7', '团团儿', cat, 'cat', '英短', 'adopted', { gallery: catGallery, stateTimeLabel: '领养时间', stateTime: '2026-05-23' }),
  yardPet('roster-cat-8', '奶糖儿', cat, 'cat', '奶牛猫', 'adopted', { gallery: catGallery, stateTimeLabel: '领养时间', stateTime: '2026-04-09' }),
  yardPet('roster-cat-9', '橘子儿', cat, 'cat', '中华田园猫', 'missing', { gallery: catGallery, stateTimeLabel: '失踪时间', stateTime: '2026-06-25' }),
  yardPet('roster-cat-10', '豆包儿', cat, 'cat', '中华田园猫', 'missing', { gallery: catGallery, stateTimeLabel: '失踪时间', stateTime: '2026-06-27' }),
  yardPet('roster-cat-11', '小虎子', cat, 'cat', '英短', 'dead', { gallery: catGallery, stateTimeLabel: '死亡时间', stateTime: '2026-05-14' }),
  yardPet('roster-cat-12', '花生儿', cat, 'cat', '奶牛猫', 'dead', { gallery: catGallery, stateTimeLabel: '死亡时间', stateTime: '2026-05-29' }),
  yardPet('roster-dog-1', '呗呗儿', dog, 'dog', '金毛', 'pending', { gallery: dogGallery }),
  yardPet('roster-dog-2', '旺财儿', dog, 'dog', '柴犬', 'cloud', { gallery: dogGallery }),
  yardPet('roster-dog-3', '小黑子', dog, 'dog', '柴犬', 'dead', { gallery: dogGallery, stateTimeLabel: '死亡时间', stateTime: '2026-06-28' })
]

/**
 * 小院投喂订单与云养中动物的一对多关系真源。
 * 订单选择会根据 petIds 自动带出动物，动物选择也会反向带出对应订单。
 */
const YARD_FEEDING_ORDERS = [
  {
    id: 'yard-order-1',
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
    feedbackTag: '已反馈2/5次'
  },
  {
    id: 'yard-order-2',
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
    feedbackTag: '已反馈0/3次'
  },
  {
    id: 'yard-order-3',
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
    feedbackTag: '已反馈1/5次'
  }
]

const YARD_PETS_WITH_FEEDING = YARD_PETS.map((pet) => ({
  ...pet,
  feedingOrderIds: YARD_FEEDING_ORDERS
    .filter((order) => order.petIds.some((petId) => String(petId) === String(pet.id)))
    .map((order) => order.id)
}))

const YARD_MOCK = {
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
  intro: '小院专注救助周边流浪动物，定时投喂、绝育与领养对接。欢迎常来看看毛孩子们，您的每一次投喂都是一份善意。',
  foodJin: 32,
  gallery: [1, 2, 3, 4].map(id => ({ id, src: '/static/figma/search/yard-gallery-exact.png', title: '开饭了开饭了' })),
  stats: {
    foodJin: 32,
    foodCount: 999,
    helpedAdoptionCount: 13,
    feedbackTime: '3天2小时',
    feedSummary: '13人已投喂32斤猫粮',
    likes: '1.2w',
    members: 280,
    shares: 78
  },
  announcementItems: [
    { id: 'yard-feeding-1', text: '广东汕头的花开富贵老师对我就是要喂猫投粮4斤，积善缘，得福报~' }
  ],
  rankItems: [
    '张三', '平安是福', '花开富贵', '花开春晓', '小灰灰', '爱心小院', '晴朗',
    '夜猫子联盟', '岁岁平安喵', '暖阳补给台', '小鱼干补给站', '巷口喵喵亭', '归巢小院'
  ].map((text, index) => ({
    id: `yard-rank-${index + 1}`,
    pawId: `yard-rank-user-${index + 1}`,
    text,
    level: index === 7 ? 2 : 1,
    avatar: index % 2 ? '/static/figma/yard-detail/owner.png' : '/static/figma/yard-pet-exact.png',
    rankTitle: `小院投喂第${index + 1}名`
  })),
  feeders: [1, 2, 3, 4, 5].map(id => ({ id, avatar: `/static/figma/dynamic-detail/source-${id}.png` })),
  postFeeders: [1, 2, 3, 4].map(id => ({ id, avatar: '/static/figma/yard-pet-exact.png' })),
  comments: [
    { id: 'yard-c-1', author: { name: '姜栋', avatar: '/static/avatarlog.png', level: 1, owner: true }, copy: '给我点赞给我点赞给我点赞给我点赞给我点赞', meta: '昨天 20:45　江西', likes: 32, children: [{ id: 'yard-c-1-r-1', author: { name: '花开春晓', avatar: '/static/avatarlog.png', level: 1 }, replyTo: { name: '姜栋', level: 1 }, copy: '一起为小院里的猫咪加油呀', meta: '昨天 20:46　江西', likes: 8 }] },
    { id: 'yard-c-2', author: { name: '花开春晓', avatar: '/static/avatarlog.png', level: 1 }, copy: '谢谢大家的温柔投喂', meta: '昨天 19:12　江西', likes: 8 },
    { id: 'yard-c-3', author: { name: '姜栋', avatar: '/static/avatarlog.png', level: 1, owner: true }, copy: '回复花开春晓：一起照顾小猫咪', meta: '昨天 18:42　江西', likes: 4 },
    { id: 'yard-c-4', author: { name: '平安是福', avatar: '/static/avatarlog.png', level: 2 }, copy: '小院的猫咪都很可爱', meta: '昨天 17:30　长沙', likes: 2 }
  ],
  statusDefinitions: YARD_STATUS_DEFINITIONS,
  pets: YARD_PETS_WITH_FEEDING,
  feedingOrders: YARD_FEEDING_ORDERS
}

export function getPawHomeYardMock() {
  return JSON.parse(JSON.stringify(YARD_MOCK))
}

export function getPawHomeYardPets() {
  return getPawHomeYardMock().pets
}

export function getPawHomeYardFeedingOrders() {
  return getPawHomeYardMock().feedingOrders
}

export function getPawHomeYardPetById(id) {
  const value = String(id || '')
  return getPawHomeYardPets().find(pet => String(pet.id) === value) || null
}
