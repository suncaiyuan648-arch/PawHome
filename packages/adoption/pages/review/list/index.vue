<template>
  <view class="review-list-page" data-qa="qa-adoption-review-list">
    <PawPageNav title="领养审核" :title-centered="true" background="#f5f5f5" fallback-url="/pages/me/index" />
    <view class="review-tabs" data-qa="qa-adoption-review-tabs">
      <view v-for="tab in tabs" :key="tab.key" class="review-tab"
        :class="{ 'review-tab--active': activeTab === tab.key }" @tap="selectTab(tab.key)">
        <text>{{ tab.label }}</text>
        <text class="review-tab__count">{{ counts[tab.key] }}</text>
      </view>
    </view>
    <scroll-view class="review-scroll" scroll-y :show-scrollbar="false">
      <view v-if="actorError" class="review-state" data-qa="qa-adoption-review-auth-required">
        <text>当前账号没有可验证的审核身份</text>
      </view>
      <view v-else-if="!visibleItems.length" class="review-state" data-qa="qa-adoption-review-empty">
        <text>{{ activeTab === 'pending' ? '暂无待审核领养单' : '暂无已审核领养单' }}</text>
      </view>
      <view v-else class="review-items">
        <PawAdoptionReviewCard v-for="item in visibleItems" :key="itemKey(item)" :review="item"
          :qa="`qa-adoption-review-card-${itemKey(item)}`" @tap="openReview(item)" />
      </view>
    </scroll-view>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawAdoptionReviewCard from '@/components/adoption/PawAdoptionReviewCard.vue'
import { buildRoute } from '@/navigation/routeContracts.js'
import { getAdoptionRecords } from '@/utils/adoptionStorage.js'
import { createReviewSessionProvider, readAdoptionReviewList } from '../../../services/reviewAdapter.js'

function modeForItem(item) {
  if (!item) return ''
  if (item.reviewStatus === 'rejected') {
    if (item.phase === 'cloud_parent') return 'cloudRejectDone'
    if (item.phase === 'owner_confirmation') return 'ownerConfirmRejected'
    return 'rejectDone'
  }
  if (item.reviewStatus === 'approved') {
    if (item.phase === 'cloud_parent') return 'cloudAgreeDone'
    if (item.phase === 'owner_confirmation') return 'ownerConfirmed'
    if (item.phase === 'jury') return 'success'
    return 'ownerPending'
  }
  if (item.phase === 'cloud_parent') return 'cloudReview'
  if (item.phase === 'owner_confirmation') return 'ownerConfirm'
  return item.phase === 'jury' ? 'ownerReview' : 'ownerReview'
}

function statusMeta(item) {
  if (!item) return { text: '状态未知', tone: 'neutral' }
  if (item.reviewStatus === 'rejected') return { text: '已拒绝', tone: 'danger' }
  if (item.reviewStatus === 'approved') return { text: '已通过', tone: 'success' }
  return {
    text: item.phase === 'cloud_parent' ? '待云家长审批' : item.phase === 'owner_confirmation' ? '待院主确认' : item.phase === 'jury' ? '待评审团确认' : '待院主审批',
    tone: 'neutral',
  }
}

function cardForItem(item) {
  const record = getAdoptionRecords({ includeDemo: false }).find(candidate => (
    candidate && (candidate.applicationId === item.applicationId || candidate.id === item.applicationId || candidate.recordId === item.applicationId)
  )) || {}
  const meta = statusMeta(item)
  const pets = Array.isArray(record.pets) ? record.pets : []
  const cloudParents = Array.isArray(record.cloudParentIds) ? record.cloudParentIds : []
  const approvedParents = Array.isArray(record.cloudParentApprovals) ? record.cloudParentApprovals : []
  return {
    ...item,
    id: item.applicationId,
    recordId: item.applicationId,
    reviewerRole: item.reviewerRole,
    reviewerId: item.reviewerId,
    detailMode: modeForItem(item),
    statusText: meta.text,
    statusTone: meta.tone,
    applicant: {
      name: record.applicantName || item.applicantId || '申请人',
      avatar: record.applicantAvatar || '/static/figma/home/feed-avatar.png',
      level: Number(record.applicantLevel) || 1,
      pawId: record.applicantPawId || item.applicantId || '',
    },
    pets,
    cloudApproval: {
      required: cloudParents.length,
      approved: approvedParents.length,
      waiting: item.reviewStatus === 'pending' && item.phase === 'cloud_parent',
    },
    yardId: record.yardId || item.yardId || '',
    yardName: record.yardName || record.ownerName || item.yardName || '小院',
  }
}

export default {
  name: 'AdoptionReviewListPage',
  components: { PawPageNav, PawAdoptionReviewCard },
  data() {
    return {
      activeTab: 'pending',
      tabs: [{ key: 'pending', label: '待审核' }, { key: 'reviewed', label: '已审核' }],
      items: { pending: [], reviewed: [] },
      actorError: null,
      actorProvider: createReviewSessionProvider(),
    }
  },
  computed: {
    visibleItems() { return this.items[this.activeTab] || [] },
    counts() { return { pending: this.items.pending.length, reviewed: this.items.reviewed.length } },
  },
  onShow() { this.refresh() },
  methods: {
    refresh() {
      const result = readAdoptionReviewList({ actorProvider: this.actorProvider, filter: 'all' })
      this.items = {
        pending: (result.pending || []).map(cardForItem),
        reviewed: (result.processed || []).map(cardForItem),
      }
      this.actorError = result.diagnostics && result.diagnostics.actorError
    },
    selectTab(tab) { if (this.items[tab]) this.activeTab = tab },
    itemKey(item) { return `${item && (item.recordId || item.id || '')}-${item && item.reviewerRole || ''}` },
    openReview(item) {
      const applicationId = item && (item.recordId || item.id)
      if (!applicationId) return
      try {
        if (item.reviewerRole === 'reviewer') {
          uni.navigateTo({ url: buildRoute('adoption.jury.detail', {
            reviewItemId: String(item.reviewItemId),
            businessType: 'adoption',
          }) })
          return
        }
        uni.navigateTo({ url: buildRoute('adoption.review.detail', {
          applicationId: String(applicationId),
          reviewItemId: String(item.reviewItemId),
          view: 'application',
          mode: item.detailMode,
          reviewerRole: item.reviewerRole,
          reviewerId: item.reviewerId,
        }) })
      } catch (error) {
        uni.showToast({ title: '审核详情链接无效', icon: 'none' })
      }
    },
  },
}
</script>

<style scoped>
.review-list-page { display: flex; width: 100%; height: 100vh; min-height: 100vh; flex-direction: column; background: #f5f5f5; color: #333; }
.review-tabs { display: flex; height: 48px; flex: 0 0 48px; align-items: center; padding: 0 16px; border-bottom: 1px solid #e8e8e8; background: #fff; box-sizing: border-box; }
.review-tab { position: relative; display: flex; height: 48px; min-width: 100px; align-items: center; justify-content: center; gap: 4px; color: #999; font-size: 14px; }
.review-tab--active { color: #222; font-weight: 500; }
.review-tab--active::after { position: absolute; right: 24px; bottom: 0; left: 24px; height: 2px; border-radius: 2px; background: #222; content: ''; }
.review-tab__count { color: inherit; font-size: 12px; }
.review-scroll { min-height: 0; flex: 1; padding: 12px 15px 24px; box-sizing: border-box; }
.review-items { display: flex; flex-direction: column; gap: 10px; }
.review-state { display: flex; min-height: 240px; align-items: center; justify-content: center; color: #999; font-size: 14px; text-align: center; }
</style>
