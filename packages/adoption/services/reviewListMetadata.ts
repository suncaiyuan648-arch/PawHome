import type { readAdoptionReviewList } from './reviewAdapter.ts'
import type {
  AdoptionReviewQueueCardMetadata,
  AdoptionReviewTab,
} from '@/utils/adoptionReviewMetadata.ts'

export interface AdoptionReviewListTabMetadata {
  key: AdoptionReviewTab
  label: string
}

type AdoptionReviewListResult = ReturnType<typeof readAdoptionReviewList>

export interface AdoptionReviewListPageState {
  activeTab: AdoptionReviewTab
  tabs: AdoptionReviewListTabMetadata[]
  items: Record<AdoptionReviewTab, AdoptionReviewQueueCardMetadata[]>
  actorError: AdoptionReviewListResult['diagnostics']['actorError']
  actorProvider: () => unknown
}

const REVIEW_TABS: readonly AdoptionReviewListTabMetadata[] = Object.freeze([
  { key: 'pending', label: '待审核' },
  { key: 'reviewed', label: '已审核' },
])

export function createAdoptionReviewListPageState(
  actorProvider: () => unknown,
): AdoptionReviewListPageState {
  return {
    activeTab: 'pending',
    tabs: REVIEW_TABS.map((tab) => ({ ...tab })),
    items: { pending: [], reviewed: [] },
    actorError: null,
    actorProvider,
  }
}

export function isAdoptionReviewTab(value: unknown): value is AdoptionReviewTab {
  return value === 'pending' || value === 'reviewed'
}
