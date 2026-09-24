import {
  definedFields,
  timestamp,
  mediaPaths,
  adoptionStatus,
  rewardAddress,
} from '../contracts/applicationParsing.ts'
import type { AdoptionPickPayload } from './adoptionMockData.ts'

type JsonRecord = Record<string, unknown>

import type {
  AdoptionPet,
  AdoptionRejector,
  AdoptionRecord,
  AdoptionCard,
  AdoptionReadOptions,
  AdoptionPick,
  AdoptionApplicationInput,
  AdoptionStatus,
} from '../contracts/applications.ts'
export type {
  AdoptionPet,
  AdoptionReapproval,
  AdoptionRejector,
  AdoptionRecord,
  AdoptionCard,
  AdoptionReadOptions,
  AdoptionPick,
} from '../contracts/applications.ts'

interface AdoptionStatusMeta {
  text: string
  tone: string
  dot: boolean
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function recordOf(value: unknown): JsonRecord {
  return isRecord(value) ? value : {}
}

const KEY = 'PAWHOME_ADOPTIONS'
const PICK_KEY = 'PAWHOME_ADOPTION_PICK'
const LAST_ID = 'PAWHOME_LAST_ADOPTION_ID'

const DEFAULT_PET_IMG = '/static/home-feed-1.png'
const DEFAULT_OWNER_IMG = '/static/figma/home/yard-avatar.png'

export const ADOPTION_STATUS_META: Readonly<Record<string, AdoptionStatusMeta>> = Object.freeze({
  cloud_pending: { text: '等待云家长审核', tone: 'red', dot: true },
  cloud_rejected: { text: '云家长拒绝领养申请', tone: 'red', dot: true },
  pending: { text: '等待院主审核', tone: 'red', dot: true },
  rejected: { text: '申请拒绝', tone: 'red', dot: true },
  pickup: { text: '待你前去领养', tone: 'green', dot: true },
  owner_confirm: { text: '待院主确认', tone: 'green', dot: true },
  owner_confirm_pending: { text: '待院主确认', tone: 'green', dot: true },
  jury_confirm: { text: '待评审团确认', tone: 'green', dot: true },
  jury_confirm_pending: { text: '待评审团确认', tone: 'green', dot: true },
  adoption_confirmed: { text: '领养确认成功', tone: 'green', dot: true },
  reward: { text: '获得奖励待领取', tone: 'green', dot: true },
  reward_done: { text: '奖励已领取', tone: 'grey', dot: false },
  abandoned: { text: '已放弃领养', tone: 'grey', dot: false },
})

/**
 * 用户侧领养申请状态机。
 *
 * 审批失败统一进入 rejected 终态，不再自动推进到下一个审批节点。
 * reapproval 字段为后续重新审批预留，但当前 mock 不开放重新审批入口。
 */
export const ADOPTION_TRANSITIONS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  cloud_pending: Object.freeze(['pending', 'rejected', 'abandoned']),
  cloud_rejected: Object.freeze([]),
  pending: Object.freeze(['pickup', 'rejected', 'abandoned']),
  pickup: Object.freeze(['owner_confirm_pending', 'owner_confirm', 'abandoned', 'rejected']),
  owner_confirm: Object.freeze(['jury_confirm_pending', 'jury_confirm', 'rejected', 'abandoned']),
  owner_confirm_pending: Object.freeze(['jury_confirm_pending', 'rejected', 'abandoned']),
  jury_confirm: Object.freeze(['adoption_confirmed', 'rejected', 'abandoned']),
  jury_confirm_pending: Object.freeze(['adoption_confirmed', 'rejected', 'abandoned']),
  adoption_confirmed: Object.freeze(['reward', 'abandoned']),
  reward: Object.freeze(['reward_done', 'abandoned']),
  reward_done: Object.freeze([]),
  rejected: Object.freeze([]),
  abandoned: Object.freeze([]),
})

export const ADOPTION_REAPPROVAL_ENABLED = false

const DEMO_APPLY_TEXT =
  '你好我是一个学生虽然我是一个学生但是我家里面有地方可以养猫我本人喜欢养猫我的家人也喜欢养猫，还有我小时候有养猫的经验，相信我可以把猫养好，我的家人都支持我养猫，会给我经济支持。'

const DEMO_CONFIRM_STORY =
  '我第一次去的时候小猫一直躲着我，去了几次都没有逮到。后来我买了一个网，趁着小猫睡着的时候一个网兜给盖上去了，终于把小猫猫带回家了。'

const DEMO_PROOF_PHOTO = '/static/figma/adoption-flow/e81f2c2074a7772e8fbca3d3828b3a751f5cb5bb.png'

const DEMO_ADOPTIONS = [
  {
    id: 'demo-pending',
    status: 'pending',
    ownerName: '我就是要喂猫',
    yardName: '我就是要喂猫',
    yardId: '1',
    yardTag: '小院',
    ownerPawId: 'yard_card_owner',
    ownerAvatar: '/static/figma/home/yard-avatar.png',
    applyText: DEMO_APPLY_TEXT,
    mediaPaths: ['/static/figma/activity-hefei.jpg', '/static/figma/activity-changsha.jpg'],
    pets: [
      { id: 'demo-pending-orange', name: '奥利奥', avatar: '/static/figma/pets/pet-orange.png' },
      { id: 'demo-pending-dog', name: '呗呗', avatar: '/static/figma/pets/pet-dog.png' },
    ],
    applicantName: '逢猫',
  },
  {
    id: 'demo-rejected',
    status: 'rejected',
    ownerName: '我就是要喂猫',
    yardName: '我就是要喂猫',
    yardId: '1',
    yardTag: '小院',
    ownerPawId: 'yard_card_owner',
    ownerAvatar: '/static/figma/home/yard-avatar.png',
    applyText: DEMO_APPLY_TEXT,
    mediaPaths: ['/static/figma/activity-hefei.jpg'],
    pets: [
      { id: 'demo-rejected-orange', name: '奥利奥', avatar: '/static/figma/pets/pet-orange.png' },
      {
        id: 'demo-rejected-black-white',
        name: '呗呗',
        avatar: '/static/figma/pets/pet-black-white.png',
      },
    ],
    applicantName: '逢猫',
    rejectNote: '当前名额已满，建议您关注其他小院。',
  },
  {
    id: 'demo-cloud-pending',
    status: 'cloud_pending',
    cloudParentRequired: true,
    cloudParentPawId: '2876598765',
    cloudParentIds: ['2876598765', 'cloud-parent-2'],
    ownerName: '我就是要喂猫',
    yardName: '我就是要喂猫',
    yardId: '1',
    yardTag: '小院',
    ownerPawId: 'yard_card_owner',
    ownerAvatar: '/static/figma/home/yard-avatar.png',
    applicantName: '逢猫',
    applicantAvatar: '/static/figma/home/feed-avatar.png',
    applicantLevel: 1,
    applyText: DEMO_APPLY_TEXT,
    mediaPaths: ['/static/figma/activity-hefei.jpg', '/static/figma/activity-changsha.jpg'],
    pets: [
      {
        id: 'demo-cloud-pending-orange',
        name: '奥利奥',
        avatar: '/static/figma/pets/pet-orange.png',
        cloudParentPawId: '2876598765',
        cloudReviewStatus: 'pending',
      },
      {
        id: 'demo-cloud-pending-dog',
        name: '呗呗',
        avatar: '/static/figma/pets/pet-dog.png',
        cloudParentPawId: 'cloud-parent-2',
        cloudReviewStatus: 'pending',
      },
    ],
  },
  {
    id: 'demo-cloud-pending-2',
    status: 'cloud_pending',
    cloudParentRequired: true,
    cloudParentPawId: '2876598765',
    cloudParentIds: ['2876598765', 'cloud-parent-2'],
    ownerName: '我就是要喂猫',
    yardName: '我就是要喂猫',
    yardId: '1',
    yardTag: '小院',
    ownerPawId: 'yard_card_owner',
    ownerAvatar: '/static/figma/home/yard-avatar.png',
    applicantName: '小橘',
    applicantAvatar: '/static/figma/home/feed-avatar.png',
    applicantLevel: 2,
    applyText: DEMO_APPLY_TEXT,
    mediaPaths: ['/static/figma/activity-hefei.jpg', '/static/figma/activity-changsha.jpg'],
    pets: [
      {
        id: 'demo-cloud-pending-2-orange',
        name: '团子',
        avatar: '/static/figma/pets/pet-orange.png',
        cloudParentPawId: '2876598765',
        cloudReviewStatus: 'pending',
      },
      {
        id: 'demo-cloud-pending-2-dog',
        name: '豆包',
        avatar: '/static/figma/pets/pet-dog.png',
        cloudParentPawId: 'cloud-parent-2',
        cloudReviewStatus: 'pending',
      },
    ],
  },
  {
    id: 'demo-cloud-pending-3',
    status: 'cloud_pending',
    cloudParentRequired: true,
    cloudParentPawId: '2876598765',
    cloudParentIds: ['2876598765', 'cloud-parent-2'],
    ownerName: '我就是要喂猫',
    yardName: '我就是要喂猫',
    yardId: '1',
    yardTag: '小院',
    ownerPawId: 'yard_card_owner',
    ownerAvatar: '/static/figma/home/yard-avatar.png',
    applicantName: '阿福',
    applicantAvatar: '/static/figma/home/feed-avatar.png',
    applicantLevel: 3,
    applyText: DEMO_APPLY_TEXT,
    mediaPaths: ['/static/figma/activity-changsha.jpg', '/static/figma/activity-hefei.jpg'],
    pets: [
      {
        id: 'demo-cloud-pending-3-orange',
        name: '奶糖',
        avatar: '/static/figma/pets/pet-orange.png',
        cloudParentPawId: '2876598765',
        cloudReviewStatus: 'pending',
      },
      {
        id: 'demo-cloud-pending-3-dog',
        name: '芝麻',
        avatar: '/static/figma/pets/pet-dog.png',
        cloudParentPawId: 'cloud-parent-2',
        cloudReviewStatus: 'pending',
      },
    ],
  },
  {
    id: 'demo-pickup',
    status: 'pickup',
    ownerName: '我就是要喂猫',
    yardName: '我就是要喂猫',
    yardId: '1',
    yardTag: '小院',
    ownerPawId: 'yard_card_owner',
    ownerAvatar: '/static/figma/home/yard-avatar.png',
    applyText: DEMO_APPLY_TEXT,
    mediaPaths: ['/static/figma/activity-hefei.jpg', '/static/figma/activity-changsha.jpg'],
    pets: [
      { id: 'demo-pickup-orange', name: '奥利奥', avatar: '/static/figma/pets/pet-orange.png' },
      { id: 'demo-pickup-dog', name: '呗呗', avatar: '/static/figma/pets/pet-dog.png' },
    ],
    applicantName: '逢猫',
    location: '鼎丰前城小区',
    locationAddress: '湖南省长沙市雨花区中意一路167号鼎丰前城',
    distance: '7.2km',
    ownerNick: '芝',
    ownerMessage:
      '你好，我是「我就是要喂猫」小院的院主，看到了你的领养申请。希望你能照顾好小猫在新家。小猫喜欢待在车库和地下室，领养后可以联系我，我给你指路。最好带笼子和网，小猫怕陌生人靠近会跑开。',
  },
  {
    id: 'demo-owner-confirm',
    status: 'owner_confirm',
    ownerName: '我就是要喂猫',
    yardName: '我就是要喂猫',
    yardId: '1',
    yardTag: '小院',
    ownerPawId: 'yard_card_owner',
    ownerAvatar: '/static/figma/home/yard-avatar.png',
    applyText: DEMO_APPLY_TEXT,
    mediaPaths: ['/static/figma/activity-hefei.jpg', '/static/figma/activity-changsha.jpg'],
    pets: [
      {
        id: 'demo-owner-confirm-orange',
        name: '奥利奥',
        avatar: '/static/figma/pets/pet-orange.png',
      },
      { id: 'demo-owner-confirm-dog', name: '呗呗', avatar: '/static/figma/pets/pet-dog.png' },
    ],
    applicantName: '逢猫',
    confirmStory: DEMO_CONFIRM_STORY,
    proofDate: '2026.01.03',
    proofPhotos: [DEMO_PROOF_PHOTO, DEMO_PROOF_PHOTO],
  },
  {
    id: 'demo-jury-confirm',
    status: 'jury_confirm',
    ownerName: '我就是要喂猫',
    yardName: '我就是要喂猫',
    yardId: '1',
    yardTag: '小院',
    ownerPawId: 'yard_card_owner',
    ownerAvatar: '/static/figma/home/yard-avatar.png',
    applyText: DEMO_APPLY_TEXT,
    mediaPaths: ['/static/figma/activity-hefei.jpg', '/static/figma/activity-changsha.jpg'],
    pets: [
      {
        id: 'demo-jury-confirm-orange',
        name: '奥利奥',
        avatar: '/static/figma/pets/pet-orange.png',
      },
      { id: 'demo-jury-confirm-dog', name: '呗呗', avatar: '/static/figma/pets/pet-dog.png' },
    ],
    applicantName: '逢猫',
    confirmStory: DEMO_CONFIRM_STORY,
  },
  {
    id: 'demo-reward',
    status: 'reward',
    ownerName: '我就是要喂猫',
    yardName: '我就是要喂猫',
    yardId: '1',
    yardTag: '小院',
    ownerPawId: 'yard_card_owner',
    ownerAvatar: '/static/figma/home/yard-avatar.png',
    applyText: DEMO_APPLY_TEXT,
    mediaPaths: ['/static/figma/activity-hefei.jpg', '/static/figma/activity-changsha.jpg'],
    pets: [
      { id: 'demo-reward-orange', name: '奥利奥', avatar: '/static/figma/pets/pet-orange.png' },
      { id: 'demo-reward-dog', name: '呗呗', avatar: '/static/figma/pets/pet-dog.png' },
    ],
    applicantName: '逢猫',
    confirmStory: DEMO_CONFIRM_STORY,
  },
]

// 领养审核列表专用 mock 数据。它们和正式审批单使用同一字段形状，
// 由 adoptionReviewMockApi 统一转换为院主/云家长审核卡片。
const REVIEW_DEMO_PETS = Object.freeze([
  { key: 'orange', name: '奥利奥', avatar: '/static/figma/pets/pet-orange.png' },
  { key: 'dog', name: '呗呗', avatar: '/static/figma/pets/pet-dog.png' },
])

function createReviewDemoAdoption(
  id: string,
  status: string,
  overrides: JsonRecord = {},
): JsonRecord {
  const { pets, ...rest } = overrides
  const sourcePets = Array.isArray(pets) ? pets.filter(isRecord) : REVIEW_DEMO_PETS
  return {
    id,
    status,
    ownerName: '我就是要喂猫',
    yardName: '我就是要喂猫',
    yardId: '1',
    yardTag: '小院',
    ownerPawId: 'yard_card_owner',
    ownerAvatar: '/static/figma/home/yard-avatar.png',
    applicantName: '逢猫',
    applicantAvatar: '/static/figma/home/feed-avatar.png',
    applicantLevel: 1,
    applyText: DEMO_APPLY_TEXT,
    mediaPaths: ['/static/figma/activity-hefei.jpg', '/static/figma/activity-changsha.jpg'],
    pets: sourcePets.map((pet, index) => ({
      ...pet,
      id: `${id}-${String(pet.key || index)}`,
    })),
    ...rest,
  }
}

const CLOUD_PARENT_REVIEW_FIELDS = Object.freeze({
  cloudParentRequired: true,
  cloudParentPawId: '2876598765',
  cloudParentIds: ['2876598765'],
  cloudParentName: '姜栋',
  cloudParentAvatar: '/static/avatarlog.png',
  cloudParentLevel: 1,
})

function reviewPets(names: string[] = ['奥利奥', '呗呗']): JsonRecord[] {
  const avatars = ['/static/figma/pets/pet-orange.png', '/static/figma/pets/pet-dog.png']
  return names.map((name, index) => ({
    key: `${name}-${index}`,
    name,
    avatar: avatars[index % avatars.length],
  }))
}

type ReviewMockApplicant = readonly [string, number, string[]]

interface ReviewMockCase {
  prefix: string
  status: string
  applicants: ReviewMockApplicant[]
  patch: JsonRecord
}

const REVIEW_MOCK_CASES: ReviewMockCase[] = [
  {
    prefix: 'review-v2-cloud-pending',
    status: 'cloud_pending',
    applicants: [
      ['小橘', 2, ['奥利奥', '呗呗']],
      ['阿福', 3, ['奶糖', '芝麻']],
    ],
    patch: CLOUD_PARENT_REVIEW_FIELDS,
  },
  {
    prefix: 'review-v2-owner-pending',
    status: 'pending',
    applicants: [
      ['林小满', 2, ['花卷', '煤球']],
      ['陈一', 1, ['奶盖']],
    ],
    patch: {},
  },
  {
    prefix: 'review-v2-owner-confirm-pending',
    status: 'owner_confirm_pending',
    applicants: [
      ['小鱼', 2, ['团子', '豆包']],
      ['阿布', 3, ['年糕']],
    ],
    patch: {
      confirmStory: DEMO_CONFIRM_STORY,
      proofDate: '2026.01.03',
      proofPhotos: [DEMO_PROOF_PHOTO, DEMO_PROOF_PHOTO],
    },
  },
  {
    prefix: 'review-v2-cloud-approved',
    status: 'pending',
    applicants: [
      ['逢猫', 1, ['奥利奥', '呗呗']],
      ['小七', 2, ['花生']],
    ],
    patch: {
      ...CLOUD_PARENT_REVIEW_FIELDS,
      cloudParentApprovals: ['2876598765'],
      approvedBy: 'cloud_parent',
      cloudParentApprovedAt: Date.now() - 86400000,
    },
  },
  {
    prefix: 'review-v2-owner-approved',
    status: 'pickup',
    applicants: [
      ['逢猫', 1, ['奥利奥', '呗呗']],
      ['小满', 2, ['团子']],
    ],
    patch: {
      approvedBy: 'owner',
      approvedAt: Date.now() - 86400000,
      location: '鼎丰前城小区',
      locationAddress: '湖南省长沙市雨花区中意一路167号鼎丰前城',
      distance: '7.2km',
      ownerNick: '芝',
      ownerMessage: '院主已同意申请，请申请人前往小院完成领养。',
    },
  },
  {
    prefix: 'review-v2-owner-confirmed',
    status: 'jury_confirm_pending',
    applicants: [
      ['逢猫', 1, ['奥利奥', '呗呗']],
      ['小鹿', 2, ['年糕', '煤球']],
    ],
    patch: {
      confirmStory: DEMO_CONFIRM_STORY,
      proofDate: '2026.01.03',
      proofPhotos: [DEMO_PROOF_PHOTO, DEMO_PROOF_PHOTO],
      approvedBy: 'owner',
      approvedAt: Date.now() - 172800000,
      ownerConfirmedAt: Date.now() - 86400000,
      reviewHistory: ['院主已同意', '院主已确认'],
    },
  },
  {
    prefix: 'review-v2-cloud-rejected',
    status: 'rejected',
    applicants: [
      ['小黑', 1, ['煤球']],
      ['小白', 2, ['奶糖', '年糕']],
    ],
    patch: {
      ...CLOUD_PARENT_REVIEW_FIELDS,
      failureStage: 'cloud_parent',
      rejectNote: '云家长拒绝了本次领养申请，流程已结束。',
      rejectorName: '姜栋',
      rejectorAvatar: '/static/avatarlog.png',
      rejectorLevel: 1,
      rejectorRole: '云家长',
    },
  },
  {
    prefix: 'review-v2-owner-rejected',
    status: 'rejected',
    applicants: [
      ['林小满', 2, ['花卷', '煤球']],
      ['陈一', 1, ['奶盖']],
    ],
    patch: {
      failureStage: 'owner_review',
      rejectNote: '院主拒绝了本次领养申请，流程已结束。',
      rejectorName: '芝',
      rejectorRole: '院主',
    },
  },
  {
    prefix: 'review-v2-owner-confirm-rejected',
    status: 'rejected',
    applicants: [
      ['小鱼', 2, ['团子', '豆包']],
      ['阿布', 3, ['年糕']],
    ],
    patch: {
      failureStage: 'owner_confirm',
      rejectNote: '驳回后领养信息申请人不再可见。',
      confirmStory: DEMO_CONFIRM_STORY,
      proofDate: '2026.01.03',
      proofPhotos: [DEMO_PROOF_PHOTO, DEMO_PROOF_PHOTO],
      proofSubmittedAt: Date.now() - 86400000,
      rejectorName: '芝',
      rejectorRole: '院主',
    },
  },
]

const DEMO_REVIEW_ADOPTIONS = REVIEW_MOCK_CASES.flatMap((item) =>
  item.applicants.map((applicant, index) => {
    const [applicantName, applicantLevel, petNames] = applicant
    return createReviewDemoAdoption(`${item.prefix}-${index + 1}`, item.status, {
      applicantName,
      applicantLevel,
      pets: reviewPets(petNames),
      ...item.patch,
    })
  }),
)

function readJSON(key: string, fallback: unknown): unknown {
  try {
    const raw: unknown = uni.getStorageSync(key)
    if (!raw) return fallback
    if (typeof raw !== 'string') return raw
    const parsed: unknown = JSON.parse(raw)
    return parsed
  } catch {
    return fallback
  }
}

function normalizeId(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim()
}

function normalizePet(pet: unknown, index: number): AdoptionPet | null {
  if (!isRecord(pet)) return null
  const id = normalizeId(pet.id || pet.petId || pet.key) || 'pet-' + index
  return {
    ...pet,
    id,
    name: normalizeId(pet.name) || '猫咪',
    avatar: normalizeId(pet.avatar) || DEFAULT_PET_IMG,
    disabled: Boolean(pet.disabled),
  }
}

function normalizeRejector(record: JsonRecord): AdoptionRejector {
  const failureStage = normalizeId(record.failureStage)
  const isCloudParent = failureStage === 'cloud_parent'
  const source = recordOf(record.rejector)
  return {
    ...source,
    name:
      normalizeId(
        source.name ||
          record.rejectorName ||
          record.rejectedByName ||
          (isCloudParent ? record.cloudParentName : record.ownerName),
      ) || (isCloudParent ? '姜栋' : '院主'),
    avatar:
      normalizeId(
        source.avatar ||
          record.rejectorAvatar ||
          record.rejectedByAvatar ||
          (isCloudParent ? record.cloudParentAvatar : record.ownerAvatar),
      ) || (isCloudParent ? '/static/avatarlog.png' : DEFAULT_OWNER_IMG),
    level:
      Number(
        source.level ||
          record.rejectorLevel ||
          record.rejectedByLevel ||
          (isCloudParent ? record.cloudParentLevel : record.ownerLevel),
      ) || 1,
    role:
      normalizeId(source.role || record.rejectorRole || record.rejectedByRole) ||
      (isCloudParent ? '云家长' : '院主'),
  }
}

/** 保持记录字段完整，同时给所有入口提供同一组稳定字段。 */
export function normalizeAdoptionRecord(record: unknown): AdoptionRecord | null {
  if (!isRecord(record)) return null
  const id = normalizeId(record.id || record.recordId)
  if (!id) return null
  const status = adoptionStatus(record.status || 'pending') ?? 'unknown'
  const sourcePets = Array.isArray(record.pets) ? record.pets : []
  const reapproval = recordOf(record.reapproval)
  return definedFields<AdoptionRecord>({
    ...record,
    rewardAddress: rewardAddress(record.rewardAddress),
    reviewItemId: typeof record.reviewItemId === 'string' ? record.reviewItemId : undefined,
    review: isRecord(record.review)
      ? definedFields({
          ...record.review,
          reviewItemId:
            typeof record.review.reviewItemId === 'string' ? record.review.reviewItemId : undefined,
        })
      : undefined,
    applicantAvatar:
      typeof record.applicantAvatar === 'string' ? record.applicantAvatar : undefined,
    applicantLevel: typeof record.applicantLevel === 'number' ? record.applicantLevel : undefined,
    applicantPawId: typeof record.applicantPawId === 'string' ? record.applicantPawId : undefined,
    reviewHistory: mediaPaths(record.reviewHistory),
    applicationId: typeof record.applicationId === 'string' ? record.applicationId : undefined,
    applicantId: typeof record.applicantId === 'string' ? record.applicantId : undefined,
    applicantUserId:
      typeof record.applicantUserId === 'string' ? record.applicantUserId : undefined,
    userId: typeof record.userId === 'string' ? record.userId : undefined,
    ownerId: typeof record.ownerId === 'string' ? record.ownerId : undefined,
    ownerUserId: typeof record.ownerUserId === 'string' ? record.ownerUserId : undefined,
    yardOwnerId: typeof record.yardOwnerId === 'string' ? record.yardOwnerId : undefined,
    applyText: typeof record.applyText === 'string' ? record.applyText : undefined,
    location: typeof record.location === 'string' ? record.location : undefined,
    locationAddress:
      typeof record.locationAddress === 'string' ? record.locationAddress : undefined,
    address: typeof record.address === 'string' ? record.address : undefined,
    distance: typeof record.distance === 'string' ? record.distance : undefined,
    updatedAt: timestamp(record.updatedAt),
    rejectedAt: timestamp(record.rejectedAt),
    yardId: typeof record.yardId === 'string' ? record.yardId : undefined,
    createdAt: timestamp(record.createdAt),
    proofPhotos: mediaPaths(record.proofPhotos),
    confirmStory: typeof record.confirmStory === 'string' ? record.confirmStory : undefined,
    proofDate: typeof record.proofDate === 'string' ? record.proofDate : undefined,
    ownerNick: typeof record.ownerNick === 'string' ? record.ownerNick : undefined,
    ownerMessage: typeof record.ownerMessage === 'string' ? record.ownerMessage : undefined,
    rejectNote: typeof record.rejectNote === 'string' ? record.rejectNote : undefined,
    failureStage: typeof record.failureStage === 'string' ? record.failureStage : undefined,
    approvedAt: timestamp(record.approvedAt),
    approvedBy: typeof record.approvedBy === 'string' ? record.approvedBy : undefined,
    proofSubmittedAt: timestamp(record.proofSubmittedAt),
    rewardStartedAt: timestamp(record.rewardStartedAt),
    rewardClaimedAt: timestamp(record.rewardClaimedAt),
    rewardOrderSubmittedAt: timestamp(record.rewardOrderSubmittedAt),
    rewardOrderId: typeof record.rewardOrderId === 'string' ? record.rewardOrderId : undefined,
    reviewerId: typeof record.reviewerId === 'string' ? record.reviewerId : undefined,
    applicant: isRecord(record.applicant)
      ? {
          id: normalizeId(record.applicant.id),
          pawId: normalizeId(record.applicant.pawId),
          userId: normalizeId(record.applicant.userId),
          name: normalizeId(record.applicant.name),
          avatar: normalizeId(record.applicant.avatar),
        }
      : undefined,
    id,
    recordId: normalizeId(record.recordId) || id,
    applicationType: 'adoption',
    status,
    cloudParentRequired: Boolean(record.cloudParentRequired),
    cloudParentPawId: normalizeId(
      record.cloudParentPawId || record.cloudParentId || record.cloudOwnerId,
    ),
    cloudParentIds: Array.isArray(record.cloudParentIds)
      ? record.cloudParentIds.map(normalizeId).filter(Boolean)
      : [],
    cloudParentApprovals: Array.isArray(record.cloudParentApprovals)
      ? record.cloudParentApprovals.map(normalizeId).filter(Boolean)
      : [],
    reapproval: {
      available: ADOPTION_REAPPROVAL_ENABLED,
      count: Number(reapproval.count) || Number(record.reapprovalCount) || 0,
      lastAt: timestamp(reapproval.lastAt),
    },
    pets: sourcePets.map(normalizePet).filter((pet): pet is AdoptionPet => pet !== null),
    mediaPaths: mediaPaths(record.mediaPaths),
    yardName: normalizeId(record.yardName || record.ownerName) || '小院',
    ownerName: normalizeId(record.ownerName || record.yardName) || '院主',
    yardTag: normalizeId(record.yardTag) || '小院',
    ownerAvatar: normalizeId(record.ownerAvatar) || DEFAULT_OWNER_IMG,
    ownerPawId: normalizeId(record.ownerPawId),
    applicantName: normalizeId(record.applicantName) || '逢猫',
    rejector: normalizeRejector(record),
  })
}

export function getAdoptions(): AdoptionRecord[] {
  const raw: unknown = readJSON(KEY, [])
  if (!Array.isArray(raw)) return []
  // 旧版审核 mock 可能已经写入本地 storage；不让它覆盖新的 v2 审批样本。
  return raw
    .map(normalizeAdoptionRecord)
    .filter((record): record is AdoptionRecord => record !== null)
    .filter((record) => !String(record.id || '').startsWith('demo-review-'))
}

export function saveAdoptions(list: readonly AdoptionRecord[]): AdoptionRecord[] {
  const normalized = Array.isArray(list)
    ? list
        .map(normalizeAdoptionRecord)
        .filter((record): record is AdoptionRecord => record !== null)
    : []
  uni.setStorageSync(KEY, JSON.stringify(normalized))
  return normalized
}

export function createAdoptionId() {
  return 'ad-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)
}

export function addAdoption(rec: AdoptionApplicationInput): AdoptionRecord | null {
  return addAdoptionFromUnknown(rec)
}

/** Raw mock/API boundary; storage normalizes JS and legacy payloads here. */
export function addAdoptionFromUnknown(rec: unknown): AdoptionRecord | null {
  const source = recordOf(rec)
  const next = normalizeAdoptionRecord({
    ...source,
    id: normalizeId(source.id) || createAdoptionId(),
  })
  if (!next) return null
  const list = getAdoptions().filter((item) => item.id !== next.id)
  list.unshift(next)
  saveAdoptions(list)
  return next
}

/** 更新真实记录；演示记录首次更新时复制为同 ID 的本地记录，保证后续页面仍可查询。 */
export function updateAdoption(
  id: string,
  patch: Partial<AdoptionRecord>,
): AdoptionRecord | false | null {
  return updateAdoptionFromUnknown(id, patch)
}

/** Raw mock/API boundary for older review patches and dynamic facade input. */
export function updateAdoptionFromUnknown(
  id: unknown,
  patch: unknown,
): AdoptionRecord | false | null {
  const recordId = normalizeId(id)
  if (!recordId) return false
  const patchRecord = recordOf(patch)
  const saved = getAdoptions()
  const index = saved.findIndex((item) => item.id === recordId)
  if (index >= 0) {
    const updated = normalizeAdoptionRecord({ ...saved[index], ...patchRecord, id: recordId })
    if (!updated) return false
    saved[index] = updated
    saveAdoptions(saved)
    return getAdoptionById(recordId, { includeDemo: false })
  }

  const demo = getDemoAdoptions().find((item) => item.id === recordId)
  if (!demo) return false
  const localCopy = normalizeAdoptionRecord({ ...demo, ...patchRecord, id: recordId })
  if (!localCopy) return false
  saved.unshift(localCopy)
  saveAdoptions(saved)
  return getAdoptionById(recordId, { includeDemo: false })
}

export function canTransitionAdoption(
  fromStatus: AdoptionStatus,
  toStatus: AdoptionStatus,
): boolean {
  const from = normalizeId(fromStatus)
  const to = normalizeId(toStatus)
  return Boolean(from && to && (from === to || (ADOPTION_TRANSITIONS[from] || []).includes(to)))
}

export function transitionAdoption(
  id: string,
  toStatus: Exclude<AdoptionStatus, 'unknown'>,
  patch: Partial<AdoptionRecord> = {},
): AdoptionRecord | false | null {
  return transitionAdoptionFromUnknown(id, toStatus, patch)
}

/** Raw state-machine boundary for the application facade's validated domain. */
export function transitionAdoptionFromUnknown(
  id: unknown,
  toStatus: unknown,
  patch: unknown = {},
): AdoptionRecord | false | null {
  const record = getAdoptionById(normalizeId(id))
  const nextStatus = normalizeId(toStatus)
  const from = adoptionStatus(record?.status)
  const to = adoptionStatus(nextStatus)
  if (!record || !from || !to || !canTransitionAdoption(from, to)) return null
  const nextPatch: JsonRecord = { ...recordOf(patch), status: nextStatus }
  if (nextStatus === 'rejected') {
    nextPatch.rejectedAt = nextPatch.rejectedAt || Date.now()
    nextPatch.failureStage = nextPatch.failureStage || record.status
    nextPatch.reapproval = {
      ...recordOf(record.reapproval),
      available: ADOPTION_REAPPROVAL_ENABLED,
      lastFailureStage: nextPatch.failureStage,
    }
  }
  return updateAdoptionFromUnknown(record.id, nextPatch)
}

export function canReopenAdoption(idOrRecord: string | AdoptionRecord): boolean {
  return canReopenAdoptionInput(idOrRecord)
}

function canReopenAdoptionInput(idOrRecord: unknown): boolean {
  if (!ADOPTION_REAPPROVAL_ENABLED) return false
  const record = isRecord(idOrRecord) ? idOrRecord : getAdoptionById(normalizeId(idOrRecord))
  const reapproval = record ? recordOf(record.reapproval) : {}
  return Boolean(record && record.status === 'rejected' && reapproval.available)
}

/** 后续重新审批能力的扩展口；当前 mock 明确关闭，不改变现有终态。 */
export function reopenAdoption(
  id: string,
  patch: Partial<AdoptionRecord> = {},
): AdoptionRecord | false | null {
  return reopenAdoptionFromUnknown(id, patch)
}

/** Raw mock/API boundary for the application facade's dynamic domain. */
export function reopenAdoptionFromUnknown(
  id: unknown,
  patch: unknown = {},
): AdoptionRecord | false | null {
  if (!canReopenAdoptionInput(id)) return null
  const record = getAdoptionById(normalizeId(id))
  if (!record) return null
  const reapproval = recordOf(record.reapproval)
  return updateAdoptionFromUnknown(id, {
    ...recordOf(patch),
    status: record.cloudParentRequired ? 'cloud_pending' : 'pending',
    reapproval: { ...reapproval, count: (Number(reapproval.count) || 0) + 1, lastAt: Date.now() },
  })
}

/** 读取已保存记录与演示记录，按真实 recordId 去重，保存记录优先。 */
export function getAdoptionRecords(options: AdoptionReadOptions | false = {}): AdoptionRecord[] {
  const includeDemo = options !== false && options.includeDemo !== false
  const byId = new Map()
  getAdoptions().forEach((record) => byId.set(record.id, record))
  if (includeDemo) {
    getDemoAdoptions().forEach((record) => {
      if (!byId.has(record.id)) byId.set(record.id, record)
    })
  }
  return Array.from(byId.values())
}

export function getAdoptionById(
  id: string,
  options: AdoptionReadOptions | false = {},
): AdoptionRecord | null {
  const recordId = normalizeId(id)
  if (!recordId) return null
  return (
    getAdoptionRecords(options).find(
      (record) => record.id === recordId || record.recordId === recordId,
    ) || null
  )
}

export function setAdoptionPick(payload: AdoptionPickPayload): void {
  uni.setStorageSync(PICK_KEY, JSON.stringify(payload))
}

export function getAdoptionPick(): AdoptionPick {
  const value: unknown = readJSON(PICK_KEY, {})
  if (!isRecord(value)) return {}
  const pets = Array.isArray(value.pets)
    ? value.pets.map(normalizePet).filter((pet): pet is AdoptionPet => pet !== null)
    : undefined
  return {
    ...value,
    ...(pets ? { pets } : {}),
    yardName: typeof value.yardName === 'string' ? value.yardName : undefined,
    ownerName: typeof value.ownerName === 'string' ? value.ownerName : undefined,
    ownerAvatar: typeof value.ownerAvatar === 'string' ? value.ownerAvatar : undefined,
    yardId: typeof value.yardId === 'string' ? value.yardId : undefined,
    ownerPawId: typeof value.ownerPawId === 'string' ? value.ownerPawId : undefined,
  }
}

export function clearAdoptionPick(): void {
  uni.removeStorageSync(PICK_KEY)
}

export function setLastAdoptionId(id: string): void {
  const recordId = normalizeId(id)
  if (recordId) uni.setStorageSync(LAST_ID, recordId)
  else uni.removeStorageSync(LAST_ID)
}

export function getLastAdoptionId(): string {
  return normalizeId(uni.getStorageSync(LAST_ID))
}

/** 内置演示数据：与真实记录使用同一字段形状，并保留宠物、院主和申请媒体。 */
export function getDemoAdoptions(): AdoptionRecord[] {
  return [...DEMO_ADOPTIONS, ...DEMO_REVIEW_ADOPTIONS]
    .map(normalizeAdoptionRecord)
    .filter((record): record is AdoptionRecord => record !== null)
}

/** 领养列表卡片转换：不改写记录 ID，也不丢失申请内容、媒体或身份字段。 */
export function toAdoptionCard(record: unknown): AdoptionCard | null {
  const normalized = normalizeAdoptionRecord(record)
  if (!normalized) return null
  const status = ADOPTION_STATUS_META[normalized.status] || {
    text: '处理中',
    tone: 'grey',
    dot: false,
  }
  const pets = normalized.pets.length
    ? normalized.pets.map((pet) => ({ ...pet, avatar: pet.avatar || DEFAULT_PET_IMG }))
    : [{ id: normalized.id + '-pet-0', name: '猫咪', avatar: DEFAULT_PET_IMG }]
  return {
    ...normalized,
    id: normalized.id,
    recordId: normalized.recordId || normalized.id,
    statusText: status.text,
    statusTone: status.tone,
    statusDot: status.dot,
    pets,
  }
}
