<template>
  <view class="review-page" data-qa="qa-rescue-review-list">
    <PawPageNav title="救助审核" :title-centered="true" background="#f5f5f5" fallback-url="/pages/me/index" />
    <view class="review-intro">
      <text class="review-intro__title">救助基金审核</text>
      <text class="review-intro__copy">只处理当前账号被明确指派的救助评审，审核完成后不可重审或补材料。</text>
    </view>
    <view class="review-tabs" data-qa="qa-rescue-review-tabs">
      <view v-for="tab in tabs" :key="tab.key" class="review-tab"
        :class="{ 'review-tab--active': activeFilter === tab.key }"
        :data-qa="`qa-rescue-review-tab-${tab.key}`" @tap="selectFilter(tab.key)">
        <text>{{ tab.label }}</text>
        <text v-if="tab.key === 'pending' && model.pending.length" class="review-tab__count">{{ model.pending.length }}</text>
      </view>
    </view>

    <view v-if="actorError" class="review-state review-state--locked" data-qa="qa-rescue-review-auth-required">
      <text class="review-state__title">暂时无法读取审核任务</text>
      <text class="review-state__copy">当前账号没有可验证的评审身份，审核任务已安全隐藏。</text>
    </view>
    <scroll-view v-else class="review-list" scroll-y :show-scrollbar="false" data-qa="qa-rescue-review-list-scroll">
      <view v-for="item in visibleItems" :key="item.reviewItemId" class="review-card"
        :data-qa="`qa-rescue-review-item-${item.reviewItemId}`" @tap="openDetail(item)">
        <view class="review-card__head">
          <view class="review-card__title-wrap">
            <text class="review-card__title">{{ item.summary || item.description || '救助申请审核' }}</text>
            <text class="review-card__meta">救助单 {{ item.rescueId }}</text>
          </view>
          <PawStatusPill :text="statusLabel(item.status)" :tone="statusTone(item.status)" variant="outline" />
        </view>
        <view class="review-card__body">
          <text v-if="item.ownerName">申请人：{{ item.ownerName }}</text>
          <text v-if="item.amount !== undefined">求助金额：¥{{ item.amount }}</text>
          <text v-if="item.createdLabel">提交时间：{{ item.createdLabel }}</text>
        </view>
        <text class="review-card__hint">查看审核详情</text>
      </view>
      <view v-if="!visibleItems.length" class="review-empty" data-qa="qa-rescue-review-empty">
        <text>{{ activeFilter === 'pending' ? '暂无待审核救助' : '暂无已处理救助' }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawStatusPill from '@/components/PawStatusPill.vue'
import { createReviewSessionProvider, readRescueReviewList } from '../../../services/reviewAdapter.js'

export default {
  name: 'RescueReviewListPage',
  components: { PawPageNav, PawStatusPill },
  data() {
    return {
      activeFilter: 'pending',
      tabs: [
        { key: 'pending', label: '待审核' },
        { key: 'processed', label: '已处理' },
      ],
      model: { items: [], pending: [], processed: [] },
      actorError: null,
      actorProvider: createReviewSessionProvider(),
    }
  },
  computed: {
    visibleItems() {
      return this.activeFilter === 'pending' ? this.model.pending : this.model.processed
    },
  },
  onShow() { this.refresh() },
  methods: {
    refresh() {
      const result = readRescueReviewList({ actorProvider: this.actorProvider, filter: this.activeFilter })
      this.model = result
      this.actorError = result.diagnostics && result.diagnostics.actorError
    },
    selectFilter(filter) {
      if (this.activeFilter === filter) return
      this.activeFilter = filter
      this.refresh()
    },
    statusLabel(status) {
      return ({ pending: '待审核', approved: '已通过', rejected: '已否决' })[status] || '状态未知'
    },
    statusTone(status) {
      return status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning'
    },
    openDetail(item) {
      if (!item || !item.reviewItemId) return
      uni.navigateTo({ url: `/packages/rescue/pages/review/detail/index?reviewItemId=${encodeURIComponent(item.reviewItemId)}&rescueId=${encodeURIComponent(item.rescueId)}&businessType=rescue` })
    },
  },
}
</script>

<style scoped>
.review-page { display: flex; width: 100%; height: 100vh; min-height: 100vh; box-sizing: border-box; flex-direction: column; background: #f5f5f5; color: #333; }
.review-intro { display: flex; flex: 0 0 auto; flex-direction: column; gap: 4px; padding: 18px 16px 12px; }
.review-intro__title { color: #222; font-size: 20px; font-weight: 500; line-height: 28px; }
.review-intro__copy { color: #888; font-size: 13px; line-height: 19px; }
.review-tabs { display: flex; height: 44px; flex: 0 0 44px; padding: 0 16px; border-bottom: 1px solid #e7e7e7; box-sizing: border-box; }
.review-tab { position: relative; display: inline-flex; min-width: 88px; height: 44px; align-items: center; justify-content: center; color: #888; font-size: 14px; line-height: 20px; }
.review-tab--active { color: #222; font-weight: 500; }
.review-tab--active::after { position: absolute; right: 20px; bottom: -1px; left: 20px; height: 2px; border-radius: 2px; background: #222; content: ''; }
.review-tab__count { display: inline-flex; min-width: 16px; height: 16px; margin-left: 4px; align-items: center; justify-content: center; border-radius: 8px; background: #ff5864; color: #fff; font-size: 10px; line-height: 16px; }
.review-list { min-height: 0; flex: 1 1 auto; box-sizing: border-box; padding: 12px 16px 24px; }
.review-card { margin-bottom: 12px; padding: 15px; border-radius: 10px; background: #fff; }
.review-card__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.review-card__title-wrap { display: flex; min-width: 0; flex: 1 1 auto; flex-direction: column; gap: 4px; }
.review-card__title { overflow: hidden; color: #222; font-size: 15px; line-height: 22px; text-overflow: ellipsis; white-space: nowrap; }
.review-card__meta, .review-card__body, .review-card__hint { color: #999; font-size: 12px; line-height: 17px; }
.review-card__body { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-top: 12px; }
.review-card__hint { display: block; margin-top: 12px; padding-top: 10px; border-top: 1px solid #f0f0f0; color: #555; text-align: right; }
.review-state, .review-empty { display: flex; min-height: 240px; flex-direction: column; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box; text-align: center; }
.review-state__title { color: #555; font-size: 15px; line-height: 22px; }
.review-state__copy { max-width: 280px; margin-top: 6px; color: #999; font-size: 13px; line-height: 19px; }
.review-empty { color: #999; font-size: 14px; }
</style>
