import {
  normalizeAnnouncementItems,
  type AnnouncementInput,
} from '../../../utils/announcementMetadata.ts'
import type { AdoptionPetMetadata } from '@/utils/adoptionMockData.ts'
import type { AvatarStackItem } from '@/utils/avatarStackMetadata.ts'
import type { WechatNavLayout } from '@/utils/navLayout.ts'
import type { YardPetState, YardRankItem } from '@/utils/yardMock.ts'

export type DynamicDetailRecordStatus = 'loading' | 'ready' | 'error'
export type DynamicDetailFooterActionKey = 'share' | 'yard' | 'adopt'

export interface DynamicDetailAuthor {
  pawId?: string
  name: string
  avatar: string
}

export interface DynamicDetailCommentAuthor extends DynamicDetailAuthor {
  level?: number
  owner?: boolean
  tag?: string
}

export interface DynamicDetailReplyTarget {
  name: string
  level?: number
}

export interface DynamicDetailComment {
  id: string
  author: DynamicDetailCommentAuthor
  copy: string
  text?: string
  meta: string
  likes: number
  liked: boolean
  kind?: string
  duration?: number
  voiceBars?: number[]
  owner?: boolean
  authorTag?: string
  replyTo?: DynamicDetailReplyTarget
  children: DynamicDetailComment[]
}

export type DynamicDetailFeeder = AvatarStackItem

export interface DynamicDetailPet extends AdoptionPetMetadata {
  state?: YardPetState
}

export interface DynamicDetailYardOwner {
  pawId: string
}

export interface DynamicDetailGalleryItem {
  src: string
  title?: string
}

export interface DynamicDetailYard extends Record<string, unknown> {
  id: string
  name: string
  avatar: string
  owner: DynamicDetailYardOwner | null
  verified: boolean
  location: string
  distance: string
  tags: string[]
  description: string
  gallery: DynamicDetailGalleryItem[]
  pets: DynamicDetailPet[]
}

export interface DynamicDetailFooterAction {
  key: DynamicDetailFooterActionKey
  label: string
  iconName: string
  qa?: string
}

export interface DynamicDetailPrimaryAction {
  key: 'feed'
  label: string
  iconName: string
  iconSize: number
  size: 'md'
}

export interface DynamicDetailRoute {
  yardId: string
  dynamicId: string
  commentsEmpty: boolean
}

export interface DynamicDetailPageState {
  yardId: string
  dynamicId: string
  navLayout: WechatNavLayout
  recordStatus: DynamicDetailRecordStatus
  recordError: string
  commentsEmpty: boolean
  commentsEmptyForced: boolean
  liked: boolean
  likes: number
  replySheetVisible: boolean
  replySheetTarget: DynamicDetailComment | null
  shareSheetVisible: boolean
  adoptPickSheetVisible: boolean
  feedPopupVisible: boolean
  mediaItems: string[]
  announcementItems: AnnouncementInput[]
  author: DynamicDetailAuthor
  currentUser: { avatar: string }
  feeders: DynamicDetailFeeder[]
  rankItems: YardRankItem[]
  comments: DynamicDetailComment[]
  postCopy: string
  postMeta: string
  feedingSourceText: string
  feedSummary: string
  commentTotal: string
  yard: DynamicDetailYard
}

export interface DynamicDetailRecordModel {
  yardId: string
  yard: DynamicDetailYard
  mediaItems: string[]
  announcementItems: AnnouncementInput[]
  author: DynamicDetailAuthor
  currentUser: { avatar: string }
  feeders: DynamicDetailFeeder[]
  rankItems: YardRankItem[]
  comments: DynamicDetailComment[]
  copy: string
  meta: string
  feedingSource: string
  feedSummary: string
  likes: number
  liked: boolean
  commentsTotal: number
}

const EMPTY_YARD: DynamicDetailYard = {
  id: '',
  name: '',
  avatar: '',
  owner: null,
  verified: true,
  location: '',
  distance: '',
  tags: [],
  description: '',
  gallery: [],
  pets: [],
}

export function createDynamicDetailPageState(navLayout: WechatNavLayout): DynamicDetailPageState {
  return {
    yardId: '',
    dynamicId: '',
    navLayout,
    recordStatus: 'loading',
    recordError: '',
    commentsEmpty: false,
    commentsEmptyForced: false,
    liked: false,
    likes: 0,
    replySheetVisible: false,
    replySheetTarget: null,
    shareSheetVisible: false,
    adoptPickSheetVisible: false,
    feedPopupVisible: false,
    mediaItems: [],
    announcementItems: [],
    author: { name: '', avatar: '' },
    currentUser: { avatar: '' },
    feeders: [],
    rankItems: [],
    comments: [],
    postCopy: '',
    postMeta: '',
    feedingSourceText: '',
    feedSummary: '',
    commentTotal: '共 0 条评论',
    yard: { ...EMPTY_YARD, tags: [], gallery: [], pets: [] },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function finiteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value)))
    return Number(value)
  return undefined
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function readRouteText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

export function normalizeDynamicDetailRoute(value: unknown): DynamicDetailRoute {
  const route = isRecord(value) ? value : {}
  return {
    yardId: readRouteText(route.yardId),
    dynamicId: readRouteText(route.dynamicId),
    commentsEmpty: route.state === 'comments-empty',
  }
}

function petState(value: unknown): value is YardPetState {
  return (
    value === 'pending' ||
    value === 'cloud' ||
    value === 'adopted' ||
    value === 'missing' ||
    value === 'dead'
  )
}

function normalizePet(value: unknown, index: number): DynamicDetailPet | null {
  if (!isRecord(value)) return null
  const rawId = value.id === undefined ? value.petId : value.id
  const id =
    optionalText(rawId) ||
    (typeof rawId === 'number' && Number.isFinite(rawId) ? String(rawId) : 'pet-' + index)
  const name = optionalText(value.name) || '猫咪'
  const avatar = optionalText(value.avatar) || '/static/home-feed-1.png'
  const state = petState(value.state) ? value.state : undefined
  const price =
    typeof value.price === 'string' || typeof value.price === 'number' ? value.price : undefined
  const adoptionValue =
    typeof value.adoptionValue === 'string' || typeof value.adoptionValue === 'number'
      ? value.adoptionValue
      : undefined
  return {
    id,
    name,
    avatar,
    ...(typeof value.petId === 'string' ? { petId: value.petId } : {}),
    ...(typeof value.key === 'string' ? { key: value.key } : {}),
    ...(state ? { state } : {}),
    ...(typeof value.disabled === 'boolean' ? { disabled: value.disabled } : {}),
    ...(price !== undefined ? { price } : {}),
    ...(adoptionValue !== undefined ? { adoptionValue } : {}),
  }
}

function normalizePets(value: unknown): DynamicDetailPet[] {
  return list(value).flatMap((pet, index) => {
    const normalized = normalizePet(pet, index)
    return normalized ? [normalized] : []
  })
}

function normalizeYardOwner(value: unknown): DynamicDetailYardOwner | null {
  if (!isRecord(value)) return null
  const pawId = optionalText(value.pawId) || optionalText(value.id)
  return pawId ? { pawId } : null
}

function normalizeGallery(value: unknown): DynamicDetailGalleryItem[] {
  return list(value).flatMap((item) => {
    if (typeof item === 'string' && item.trim()) return [{ src: item }]
    if (!isRecord(item)) return []
    const src = optionalText(item.src) || optionalText(item.url)
    if (!src) return []
    const title = optionalText(item.title)
    return [{ src, ...(title ? { title } : {}) }]
  })
}

function normalizeYard(value: unknown, yardId: string): DynamicDetailYard {
  const yard = isRecord(value) ? value : {}
  const owner = normalizeYardOwner(yard.owner)
  const gallery = normalizeGallery(yard.gallery || yard.thumbUrls)
  return {
    id: optionalText(yard.id) || yardId,
    name: text(yard.name),
    avatar: text(yard.avatar),
    owner,
    verified: yard.verified !== false,
    location: text(yard.location),
    distance: text(yard.distance),
    tags: stringList(yard.tags),
    description: text(yard.description),
    gallery,
    pets: normalizePets(yard.pets),
  }
}

function normalizeAuthor(
  value: unknown,
  fallback?: Record<string, unknown>,
): DynamicDetailCommentAuthor {
  const author = isRecord(value) ? value : fallback || {}
  const pawId = optionalText(author.pawId) || optionalText(author.id)
  const level = finiteNumber(author.level)
  return {
    ...(pawId ? { pawId } : {}),
    name: text(author.name),
    avatar: text(author.avatar),
    ...(level !== undefined ? { level } : {}),
    ...(typeof author.owner === 'boolean' ? { owner: author.owner } : {}),
    ...(optionalText(author.tag) ? { tag: optionalText(author.tag) } : {}),
  }
}

function normalizeReplyTarget(value: unknown): DynamicDetailReplyTarget | undefined {
  if (!isRecord(value)) return undefined
  const name = optionalText(value.name)
  if (!name) return undefined
  const level = finiteNumber(value.level)
  return { name, ...(level !== undefined ? { level } : {}) }
}

function normalizeComment(value: unknown, index: number, depth = 0): DynamicDetailComment | null {
  if (!isRecord(value)) return null
  const id = optionalText(value.id) || 'comment-' + index
  const nestedAuthor = isRecord(value.author) ? value.author : undefined
  const author = normalizeAuthor(nestedAuthor, value)
  const replyTo = normalizeReplyTarget(value.replyTo)
  const duration = finiteNumber(value.duration)
  const voiceBars = Array.isArray(value.voiceBars)
    ? value.voiceBars.flatMap((bar) => {
        const number = finiteNumber(bar)
        return number === undefined ? [] : [number]
      })
    : undefined
  const children =
    depth < 4
      ? list(value.children).flatMap((child, childIndex) => {
          const normalized = normalizeComment(child, childIndex, depth + 1)
          return normalized ? [normalized] : []
        })
      : []
  return {
    id,
    author,
    copy: text(value.copy),
    ...(optionalText(value.text) ? { text: optionalText(value.text) } : {}),
    meta: text(value.meta),
    likes: Math.max(0, finiteNumber(value.likes) || 0),
    liked: value.liked === true,
    ...(optionalText(value.kind) ? { kind: optionalText(value.kind) } : {}),
    ...(duration !== undefined ? { duration } : {}),
    ...(voiceBars ? { voiceBars } : {}),
    ...(typeof value.owner === 'boolean' ? { owner: value.owner } : {}),
    ...(optionalText(value.authorTag) ? { authorTag: optionalText(value.authorTag) } : {}),
    ...(replyTo ? { replyTo } : {}),
    children,
  }
}

function normalizeComments(value: unknown): DynamicDetailComment[] {
  return list(value).flatMap((comment, index) => {
    const normalized = normalizeComment(comment, index)
    return normalized ? [normalized] : []
  })
}

function normalizeFeeders(value: unknown): DynamicDetailFeeder[] {
  return list(value).flatMap<DynamicDetailFeeder>((feeder, index) => {
    if (typeof feeder === 'string' && feeder.trim()) return [feeder]
    if (!isRecord(feeder)) return []
    const avatar = optionalText(feeder.avatar)
    if (!avatar) return []
    const id = typeof feeder.id === 'string' || typeof feeder.id === 'number' ? feeder.id : index
    return [{ id, avatar }]
  })
}

function normalizeRankItems(value: unknown): YardRankItem[] {
  return list(value).flatMap((item, index) => {
    if (!isRecord(item)) return []
    const textValue = optionalText(item.text)
    const avatar = optionalText(item.avatar)
    if (!textValue || !avatar) return []
    const id = optionalText(item.id) || 'rank-' + index
    const pawId = optionalText(item.pawId) || id
    return [
      {
        id,
        pawId,
        text: textValue,
        level: finiteNumber(item.level) || 1,
        avatar,
        rankTitle: text(item.rankTitle),
      },
    ]
  })
}

function normalizeDetailAuthor(value: unknown): DynamicDetailAuthor {
  const author = normalizeAuthor(value)
  return {
    ...(author.pawId ? { pawId: author.pawId } : {}),
    name: author.name,
    avatar: author.avatar,
  }
}

export function normalizeDynamicDetailRecord(value: unknown): DynamicDetailRecordModel | null {
  if (!isRecord(value)) return null
  const yardId = text(value.yardId)
  const yard = normalizeYard(value.yard, yardId)
  const owner =
    yard.owner || normalizeYardOwner(value.yardOwnerId ? { pawId: value.yardOwnerId } : null)
  return {
    yardId: yardId || yard.id,
    yard: { ...yard, owner },
    mediaItems: list(value.mediaItems).filter((item): item is string => typeof item === 'string'),
    announcementItems: normalizeAnnouncementItems(value.announcementItems),
    author: normalizeDetailAuthor(value.author),
    currentUser: {
      avatar: text(isRecord(value.currentUser) ? value.currentUser.avatar : undefined),
    },
    feeders: normalizeFeeders(value.feeders),
    rankItems: normalizeRankItems(value.rankItems),
    comments: normalizeComments(value.comments),
    copy: text(value.copy),
    meta: text(value.meta),
    feedingSource: text(value.feedingSource),
    feedSummary: text(value.feedSummary),
    likes: Math.max(0, finiteNumber(value.likes) || 0),
    liked: value.liked === true,
    commentsTotal: Math.max(0, finiteNumber(value.commentsTotal) || 0),
  }
}
