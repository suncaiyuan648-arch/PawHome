export type AnimalRosterEntryKind = 'owned' | 'sponsored'

export interface AnimalRosterEntryPageState {
  userId: string
  ready: boolean
  message: string
}

const EMPTY_MESSAGES: Readonly<Record<AnimalRosterEntryKind, string>> = Object.freeze({
  owned: '缺少用户 ID，无法读取我的宠物',
  sponsored: '缺少用户 ID，无法读取云养宠物',
})

const SAFE_USER_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function createAnimalRosterEntryPageState(
  kind: AnimalRosterEntryKind,
): AnimalRosterEntryPageState {
  return { userId: '', ready: false, message: EMPTY_MESSAGES[kind] }
}

export function normalizeAnimalRosterEntryUserId(options: unknown): string {
  if (!isRecord(options)) return ''
  const value = options.userId
  if (!value || (typeof value !== 'string' && typeof value !== 'number')) return ''
  const userId = String(value).trim()
  return SAFE_USER_ID.test(userId) ? userId : ''
}
