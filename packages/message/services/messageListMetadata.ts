import { MESSAGE_CATEGORIES, readMessages, type MessageCategory } from './messageStore.ts'

export type NotificationMessageItem = Extract<
  ReturnType<typeof readMessages>,
  { success: true }
>['data']['items'][number]

type NotificationReadFailure = Extract<ReturnType<typeof readMessages>, { success: false }>

export type NotificationMessageOpenInput = Pick<NotificationMessageItem, 'messageId'> &
  Partial<Pick<NotificationMessageItem, 'category' | 'deepLink'>>

export interface NotificationCategoryTab {
  key: MessageCategory
  label: string
}

export interface NotificationListPageState {
  category: MessageCategory
  tabs: NotificationCategoryTab[]
  items: readonly NotificationMessageItem[]
  actorError: NotificationReadFailure['error'] | null
  diagnostics: string
  actorProvider: () => unknown
}

export interface NotificationRouteOptions {
  category?: MessageCategory
  messageId?: string
}

const CATEGORY_LABELS: Readonly<Record<MessageCategory, string>> = Object.freeze({
  interaction: '互动',
  order: '订单',
  service: '服务',
  system: '系统',
  activity: '活动',
  pet: '宠物',
})

function isMessageCategory(value: unknown): value is MessageCategory {
  return typeof value === 'string' && MESSAGE_CATEGORIES.some((category) => category === value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function routeString(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

export function createNotificationListPageMetadata(
  actorProvider: () => unknown,
): NotificationListPageState {
  const categories = MESSAGE_CATEGORIES.filter(isMessageCategory)
  return {
    category: 'order',
    tabs: categories.map((key) => ({ key, label: CATEGORY_LABELS[key] })),
    items: [],
    actorError: null,
    diagnostics: '',
    actorProvider,
  }
}

export function normalizeNotificationRouteOptions(input: unknown): NotificationRouteOptions {
  if (!isRecord(input)) return {}

  const category = routeString(input.category)
  const messageId = routeString(input.messageId)
  return {
    ...(isMessageCategory(category) ? { category } : {}),
    ...(messageId ? { messageId } : {}),
  }
}
