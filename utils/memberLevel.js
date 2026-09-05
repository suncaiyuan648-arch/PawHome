export const MEMBER_LEVEL_TITLES = Object.freeze({
  1: '爱心萌新',
  2: '投喂练习生',
  3: '街区投喂员',
  4: '社区投喂达人',
  5: '城区投喂先锋',
  6: '城市投喂能手',
  7: '城市关爱大使',
  8: '城市投喂首席官'
})

export function getMemberLevelTitle(level, fallbackLevel = 8) {
  const normalizedLevel = Math.max(1, Math.floor(Number(level) || 1))
  return MEMBER_LEVEL_TITLES[normalizedLevel] || MEMBER_LEVEL_TITLES[fallbackLevel] || ''
}
