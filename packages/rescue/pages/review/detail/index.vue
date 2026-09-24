<template>
  <view class="review-detail" data-qa="qa-rescue-review-detail">
    <PawPageNav title="救助审核详情" :title-centered="true" background="#f5f5f5" fallback-url="/packages/rescue/pages/review/list/index" />
    <scroll-view class="review-detail__scroll" scroll-y :show-scrollbar="false">
      <view v-if="model.item" class="review-detail__content">
        <view class="detail-card detail-card--head">
          <view class="detail-card__title-row">
            <text class="detail-card__title">{{ model.item.summary || model.item.description || '救助申请审核' }}</text>
            <PawStatusPill :text="statusLabel(model.item.status)" :tone="statusTone(model.item.status)" />
          </view>
          <text class="detail-card__meta">救助单 {{ model.item.rescueId }} · 审核项 {{ model.item.reviewItemId }}</text>
          <view class="detail-card__facts">
            <text v-if="model.item.ownerName">申请人：{{ model.item.ownerName }}</text>
            <text v-if="model.item.amount !== undefined">求助金额：¥{{ model.item.amount }}</text>
            <text v-if="model.item.createdLabel">提交时间：{{ model.item.createdLabel }}</text>
            <text v-if="model.item.applicationStatus">平台申请状态：{{ model.item.applicationStatus }}</text>
          </view>
        </view>

        <view class="detail-card" data-qa="qa-rescue-review-evidence">
          <text class="detail-card__section-title">救助说明</text>
          <text class="detail-card__copy">{{ model.item.detail || model.item.description || model.item.summary || '暂无说明' }}</text>
          <view v-if="model.item.media && model.item.media.length" class="detail-media">
            <image v-for="(src, index) in model.item.media" :key="src + index" :src="src" mode="aspectFill" />
          </view>
        </view>

        <view class="detail-card detail-card--notice">
          <text class="detail-card__notice-title">审核规则</text>
          <text class="detail-card__copy">请根据现有救助材料作出一次审核决定。审核结果只更新评审状态，不会发起打款。</text>
        </view>

        <view v-if="model.canWrite" class="detail-actions" data-qa="qa-rescue-review-actions">
          <PawButton text="否决救助" tone="danger" size="md" shape="rounded" qa="qa-rescue-review-reject" :loading="busy" @click="submit('rejected')" />
          <PawButton text="通过救助" tone="dark" size="md" shape="rounded" qa="qa-rescue-review-approve" :loading="busy" @click="submit('approved')" />
        </view>
        <view v-else class="detail-closed" data-qa="qa-rescue-review-closed">
          <text>该审核已处理，审核动作已关闭。</text>
        </view>
      </view>
      <view v-else class="review-detail__empty" data-qa="qa-rescue-review-detail-empty">
        <text>{{ emptyCopy }}</text>
        <text class="review-detail__empty-hint">请从当前账号的审核任务进入真实审核项。</text>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import PawButton from '@/components/base/PawButton.vue'
import PawStatusPill from '@/components/PawStatusPill.vue'
import type { RescueReviewActionResult, RescueReviewDetailResult } from '../../../services/reviewActionAdapter.ts'
import { createReviewSessionProvider, readRescueReviewDetail } from '../../../services/reviewAdapter.ts'
import { applyRescueReviewAction } from '../../../services/reviewActionAdapter.ts'
import { produceLocalActionNotification } from '../../../services/messageStore.ts'

type RescueReviewStatus = RescueReviewActionResult['fromStatus']
type RescueReviewOutcome = Extract<RescueReviewActionResult['toStatus'], 'approved' | 'rejected'>

interface RescueReviewDetailPageState {
  reviewItemId: string
  rescueId: string
  businessType: string
  model: RescueReviewDetailResult
  busy: boolean
  fromTaskCenter: boolean
  actorProvider: ReturnType<typeof createReviewSessionProvider>
}

interface RescueNotificationAuthorizationContext {
  readonly actor: { readonly id: string }
  readonly message: { readonly businessType: string; readonly reviewItemId?: string }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function readQueryText(options: unknown, key: string): string {
  if (!isRecord(options)) return ''
  const value = options[key]
  return typeof value === 'string' ? value.trim() : ''
}

function readPageRoute(page: unknown): string {
  if (!isRecord(page)) return ''
  if (typeof page.route === 'string' && page.route) return page.route
  const nestedPage = page.$page
  return isRecord(nestedPage) && typeof nestedPage.route === 'string' ? nestedPage.route : ''
}

function findApplicantId(record: Readonly<Record<string, unknown>>): string {
  const applicant = isRecord(record.applicant) ? record.applicant : {}
  const candidates = [record.applicantId, record.applicantUserId, applicant.id, applicant.pawId]
  return candidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0) || ''
}

function emptyReviewDetail(reason = 'NOT_LOADED'): RescueReviewDetailResult {
  return {
    actor: null,
    item: null,
    canRead: false,
    canWrite: false,
    readOnly: true,
    reason,
    diagnostics: { actorError: { code: reason } },
  }
}

export default defineComponent({
  name: 'RescueReviewDetailPage',
  components: { PawPageNav, PawButton, PawStatusPill },
  data(): RescueReviewDetailPageState {
    return {
      reviewItemId: '',
      rescueId: '',
      businessType: '',
      model: emptyReviewDetail(),
      busy: false,
      fromTaskCenter: false,
      actorProvider: createReviewSessionProvider(),
    }
  },
  computed: {
    emptyCopy(): string {
      if (!this.reviewItemId) return '缺少审核项 ID'
      if (this.model.item === null && this.model.reason === 'NOT_FOUND') return '找不到这条审核项'
      if (this.model.item === null && this.model.reason === 'REVIEW_READ_DENIED') return '当前账号没有该审核项的访问权限'
      return '审核详情暂不可用'
    },
  },
  onLoad(options: unknown = {}) {
    this.fromTaskCenter = this.wasOpenedFromTaskCenter()
    this.businessType = readQueryText(options, 'businessType')
    this.reviewItemId = readQueryText(options, 'reviewItemId')
    this.rescueId = readQueryText(options, 'rescueId')
    if (this.businessType === 'rescue') this.refresh()
    else this.model = emptyReviewDetail('INVALID_BUSINESS_TYPE')
  },
  onShow() {
    if (this.reviewItemId && this.businessType === 'rescue') this.refresh()
  },
  methods: {
    wasOpenedFromTaskCenter() {
      try {
        const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
        const previous: unknown = pages.length > 1 ? pages[pages.length - 2] : null
        return readPageRoute(previous) === 'packages/account/pages/tasks/index'
      } catch {
        return false
      }
    },
    refresh() {
      this.model = readRescueReviewDetail({ actorProvider: this.actorProvider, reviewItemId: this.reviewItemId, rescueId: this.rescueId })
    },
    statusLabel(status: RescueReviewStatus): string {
      const labels: Record<RescueReviewStatus, string> = { pending: '待审核', approved: '已通过', rejected: '已否决' }
      return labels[status]
    },
    statusTone(status: RescueReviewStatus): 'success' | 'danger' | 'warning' {
      return status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning'
    },
    submit(outcome: RescueReviewOutcome) {
      if (!this.model.item || !this.model.canWrite || this.busy) return
      this.busy = true
      try {
        const result = applyRescueReviewAction({
          actorProvider: this.actorProvider,
          reviewItemId: this.model.item.reviewItemId,
          rescueId: this.model.item.rescueId,
          outcome,
          idempotencyKey: `rescue-review:${this.model.item.reviewItemId}:${outcome}`,
        })
        this.notifyReviewAction(result)
        uni.showToast({ title: outcome === 'approved' ? '已通过救助' : '已否决救助', icon: 'none' })
        if (this.fromTaskCenter) {
          this.$nextTick(() => {
            try {
              uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/packages/account/pages/tasks/index' }) })
            } catch {
              uni.reLaunch({ url: '/packages/account/pages/tasks/index' })
            }
          })
          return
        }
        this.refresh()
      } catch (error: unknown) {
        const code = isRecord(error) && typeof error.code === 'string' ? error.code : ''
        uni.showToast({ title: code === 'INVALID_TRANSITION' ? '该审核已处理' : '审核暂未提交', icon: 'none' })
        this.refresh()
      } finally {
        this.busy = false
      }
    },
    notifyReviewAction(action: RescueReviewActionResult) {
      if (!this.model.canRead || !this.model.item) return
      const recipientId = findApplicantId(this.model.record)
      if (!recipientId) return
      produceLocalActionNotification({
        action,
        recipientId,
        businessType: 'rescue',
        businessId: action.rescueId,
        reviewItemId: action.reviewItemId,
        category: 'service',
        title: action.toStatus === 'approved' ? '救助审核已通过' : '救助审核未通过',
        preview: action.toStatus === 'approved' ? '你的救助申请已通过审核。' : '你的救助申请审核未通过，请查看详情。',
        authorize: ({ actor, message }: RescueNotificationAuthorizationContext) => actor.id === action.actorId
          && message.businessType === 'rescue'
          && message.reviewItemId === action.reviewItemId,
        actorProvider: this.actorProvider,
      })
    },
  },
})
</script>

<style scoped>
.review-detail { display: flex; width: 100%; height: 100vh; min-height: 100vh; box-sizing: border-box; flex-direction: column; background: #f5f5f5; color: #333; }
.review-detail__scroll { min-height: 0; flex: 1 1 auto; padding: 10px 15px 24px; box-sizing: border-box; }
.review-detail__content { padding-bottom: 12px; }
.detail-card { margin-bottom: 10px; padding: 16px; border-radius: 10px; background: #fff; }
.detail-card__title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.detail-card__title { min-width: 0; flex: 1 1 auto; color: #222; font-size: 17px; font-weight: 500; line-height: 24px; }
.detail-card__meta, .detail-card__facts, .detail-card__copy, .detail-closed, .review-detail__empty-hint { color: #888; font-size: 13px; line-height: 20px; }
.detail-card__meta { display: block; margin-top: 8px; word-break: break-all; }
.detail-card__facts { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-top: 14px; }
.detail-card__section-title, .detail-card__notice-title { display: block; color: #222; font-size: 15px; font-weight: 500; line-height: 22px; }
.detail-card__copy { display: block; margin-top: 8px; word-break: break-all; }
.detail-card--notice { background: #fffbea; }
.detail-card__notice-title { color: #745b19; }
.detail-media { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
.detail-media image { width: 78px; height: 78px; border-radius: 4px; }
.detail-actions { display: flex; gap: 10px; padding: 2px 0 12px; }
.detail-actions .paw-button { min-width: 0; flex: 1 1 0; }
.detail-closed { padding: 14px; border-radius: 8px; background: #ededed; text-align: center; }
.review-detail__empty { display: flex; min-height: 280px; flex-direction: column; align-items: center; justify-content: center; color: #666; font-size: 15px; text-align: center; }
.review-detail__empty-hint { margin-top: 8px; color: #999; }
</style>
