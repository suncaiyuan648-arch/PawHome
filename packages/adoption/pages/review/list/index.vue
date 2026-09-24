<template>
  <view
    class="review-list-page"
    data-qa="qa-adoption-review-list"
  >
    <PawPageNav
      title="领养审核"
      :title-centered="true"
      background="#f5f5f5"
      fallback-url="/pages/me/index"
    />
    <view
      class="review-tabs"
      data-qa="qa-adoption-review-tabs"
    >
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="review-tab"
        :class="{ 'review-tab--active': activeTab === tab.key }"
        @tap="selectTab(tab.key)"
      >
        <text>{{ tab.label }}</text>
        <text class="review-tab__count">{{ counts[tab.key] }}</text>
      </view>
    </view>
    <scroll-view
      class="review-scroll"
      scroll-y
      :show-scrollbar="false"
    >
      <view
        v-if="actorError"
        class="review-state"
        data-qa="qa-adoption-review-auth-required"
      >
        <text>当前账号没有可验证的审核身份</text>
      </view>
      <view
        v-else-if="!visibleItems.length"
        class="review-state"
        data-qa="qa-adoption-review-empty"
      >
        <text>{{ activeTab === 'pending' ? '暂无待审核领养单' : '暂无已审核领养单' }}</text>
      </view>
      <view
        v-else
        class="review-items"
      >
        <PawAdoptionReviewCard
          v-for="item in visibleItems"
          :key="itemKey(item)"
          :review="item"
          :qa="`qa-adoption-review-card-${itemKey(item)}`"
          @tap="openReview(item)"
        />
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import PawAdoptionReviewCard from '@/components/adoption/PawAdoptionReviewCard.vue'
import { buildRoute } from '@/navigation/routeContracts.ts'
import { getAdoptionRecords } from '@/utils/adoptionStorage.ts'
import {
  createAdoptionReviewQueueCard,
  createAdoptionReviewRecordIndex,
  type AdoptionReviewQueueCardMetadata,
  type AdoptionReviewTab,
} from '@/utils/adoptionReviewMetadata.ts'
import {
  createReviewSessionProvider,
  readAdoptionReviewList,
} from '../../../services/reviewAdapter.ts'
import {
  createAdoptionReviewListPageState,
  type AdoptionReviewListPageState,
} from '../../../services/reviewListMetadata.ts'

export default defineComponent({
  name: 'AdoptionReviewListPage',
  components: { PawPageNav, PawAdoptionReviewCard },
  data(): AdoptionReviewListPageState {
    return createAdoptionReviewListPageState(createReviewSessionProvider())
  },
  computed: {
    visibleItems(): AdoptionReviewQueueCardMetadata[] {
      return this.items[this.activeTab]
    },
    counts(): Record<AdoptionReviewTab, number> {
      return { pending: this.items.pending.length, reviewed: this.items.reviewed.length }
    },
  },
  onShow() {
    this.refresh()
  },
  methods: {
    refresh() {
      const result = readAdoptionReviewList({ actorProvider: this.actorProvider, filter: 'all' })
      const records = createAdoptionReviewRecordIndex(getAdoptionRecords({ includeDemo: false }))
      this.items = {
        pending: result.pending.map((item) =>
          createAdoptionReviewQueueCard(item, records.get(item.applicationId) ?? null),
        ),
        reviewed: result.processed.map((item) =>
          createAdoptionReviewQueueCard(item, records.get(item.applicationId) ?? null),
        ),
      }
      this.actorError = result.diagnostics.actorError
    },
    selectTab(tab: AdoptionReviewTab) {
      this.activeTab = tab
    },
    itemKey(item: AdoptionReviewQueueCardMetadata): string {
      return `${item.recordId}-${item.reviewerRole || ''}`
    },
    openReview(item: AdoptionReviewQueueCardMetadata) {
      try {
        if (item.reviewerRole === 'reviewer') {
          uni.navigateTo({
            url: buildRoute('adoption.jury.detail', {
              reviewItemId: item.reviewItemId,
              businessType: 'adoption',
            }),
          })
          return
        }
        uni.navigateTo({
          url: buildRoute('adoption.review.detail', {
            applicationId: item.applicationId,
            reviewItemId: item.reviewItemId,
            view: 'application',
            reviewerRole: item.reviewerRole,
            reviewerId: item.reviewerId,
          }),
        })
      } catch {
        uni.showToast({ title: '审核详情链接无效', icon: 'none' })
      }
    },
  },
})
</script>

<style scoped>
.review-list-page {
  display: flex;
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  flex-direction: column;
  background: #f5f5f5;
  color: #333;
}
.review-tabs {
  display: flex;
  height: 48px;
  flex: 0 0 48px;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
  box-sizing: border-box;
}
.review-tab {
  position: relative;
  display: flex;
  height: 48px;
  min-width: 100px;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #999;
  font-size: 14px;
}
.review-tab--active {
  color: #222;
  font-weight: 500;
}
.review-tab--active::after {
  position: absolute;
  right: 24px;
  bottom: 0;
  left: 24px;
  height: 2px;
  border-radius: 2px;
  background: #222;
  content: '';
}
.review-tab__count {
  color: inherit;
  font-size: 12px;
}
.review-scroll {
  min-height: 0;
  flex: 1;
  padding: 12px 15px 24px;
  box-sizing: border-box;
}
.review-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.review-state {
  display: flex;
  min-height: 240px;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
  text-align: center;
}
</style>
