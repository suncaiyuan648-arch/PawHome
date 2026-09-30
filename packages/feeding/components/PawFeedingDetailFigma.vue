<template>
  <view
    class="fd-page"
    :class="{
      'fd-page--pet': variant === 92,
      'fd-page--cloud-parent': isCloudParent,
      'fd-page--no-feedback': !shouldShowFeedback,
    }"
  >
    <PawPageNav
      title="投粮详情"
      background="#fff574"
      :auto-back="false"
      @back="goBack"
    />
    <PawToast ref="toast" />

    <view
      v-if="variant === 92"
      class="pet-summary"
    >
      <image
        class="pet-photo"
        src="/static/figma/feeding/7b05bc39e1b8964af873866afe1ca53e7015ac78.png"
        mode="aspectFill"
      />
      <view class="pet-copy">
        <view class="pet-title"
          ><text>小毛毛球</text><text class="green">已云养</text
          ><text class="brown">已连续云养25天</text>
        </view>
        <text class="pet-desc">流浪的时候经常去小卖店偷吃火腿肠<br />被打导致有点怕人</text>
        <view class="pet-tags"
          ><text>极度饥饿</text><text>非常亲人</text><text>男娃</text><text>已绝育</text></view
        >
      </view>
      <view class="pet-meta"
        ><text>云养天数：{{ '\u3000\u3000' }}云养30天/投粮4斤</text
        ><text>下单时间：{{ '\u3000\u3000' }}2026-2-5 13:23:56</text
        ><text>剩余云养天数：{{ '\u3000' }}3/3天</text
        ><text class="blue">订单编号：{{ orderId || 'YCQ092182' }}</text>
        <view
          class="pet-status-line"
          :class="isRewardReceived ? 'pet-status-line--signed' : 'pet-status-line--shipping'"
        >
          <text class="pet-status-tag">{{
            isRewardReceived ? `领养生效中 ${deliveryProgress}` : '待领养生效'
          }}</text>
          <text>{{
            isRewardReceived ? '云养中，小院已签收...' : '物流运输中，等待小院签收...'
          }}</text>
        </view>
      </view>
    </view>

    <view
      v-else-if="isCloudParent"
      class="cloud-parent-summary"
    >
      <view class="cloud-parent-card">
        <view
          class="cloud-pet-module"
          @tap="openCloudPetDetail"
        >
          <PawImage
            class="cloud-pet-image"
            :src="cloudPet.avatar"
            :width="85"
            :height="85"
            :radius="6"
            :preview="false"
            @click="openCloudPetDetail"
          />
          <view class="cloud-pet-copy">
            <view class="cloud-pet-title">
              <view class="cloud-pet-title-left">
                <text class="cloud-pet-name">{{ cloudPet.name }}</text>
                <text class="cloud-pet-status">{{ cloudPet.status }}</text>
              </view>
              <text class="cloud-pet-continuous">已连续云养{{ cloudPet.continuousDays }}天</text>
            </view>
            <text class="cloud-pet-desc">{{ cloudPet.description }}</text>
            <view class="cloud-pet-tags">
              <text
                v-for="(tag, index) in cloudPet.tags"
                :key="`cloud-pet-tag-${index}`"
                >{{ tag }}</text
              >
            </view>
          </view>
        </view>

        <view class="cloud-order-module">
          <view class="cloud-order-row">
            <text class="cloud-order-label">云养天数：</text
            ><text class="cloud-order-value">{{ cloudOrder.cloudDays }}</text>
          </view>
          <view class="cloud-order-row">
            <text class="cloud-order-label">下单时间：</text
            ><text class="cloud-order-value cloud-order-value--muted">{{ cloudOrder.time }}</text>
          </view>
          <view class="cloud-order-row">
            <text class="cloud-order-label">剩余云养天数：</text
            ><text class="cloud-order-value cloud-order-value--muted">{{
              cloudOrder.remainingDays
            }}</text>
          </view>
          <view class="cloud-order-row cloud-order-row--number">
            <text class="cloud-order-label">订单编号：</text>
            <view class="cloud-order-number">
              <text>{{ cloudOrder.orderNo }}</text>
              <view
                class="order-copy-action"
                data-qa="feeding-detail-copy-order"
                @tap.stop="copyOrderNumber(cloudOrder.orderNo)"
              >
                <PawIcon
                  name="actions/copy"
                  :size="12"
                  label="复制订单编号"
                />
              </view>
            </view>
          </view>
          <view
            class="cloud-order-status"
            :class="`cloud-order-status--${cloudOrder.statusTone}`"
          >
            <PawFeedingFeedbackTag
              variant="status"
              :tone="cloudOrder.statusTone"
              :text="cloudOrder.statusText"
            />
            <text class="cloud-order-status-copy">{{ cloudOrder.statusCopy }}</text>
          </view>
        </view>
      </view>
    </view>

    <view
      v-else
      class="order-summary"
    >
      <view class="order-main">
        <PawImage
          class="order-avatar"
          :src="detailView.avatar || (variant === 91 ? avatarImgs[3] : avatarImgs[0])"
          :size="40"
          :radius="20"
          :preview="false"
        />
        <view class="order-copy">
          <view class="order-top">
            <view class="order-identity">
              <text class="order-name">{{
                detailView.userName || detailView.yardName || '平安是福'
              }}</text>
              <LevelBadge :level="detailView.ownerLevel || 1" />
            </view>
            <view class="order-right">
              <PawFeedingFeedbackTag
                :text="feedbackTagText"
                tone="progress"
              />
            </view>
          </view>
          <view class="order-body">
            <text class="order-amount">{{
              detailView.feedAmountLine || (variant === 91 ? '【黑猫】云养30天/投粮4斤' : '投粮4斤')
            }}</text>
            <text class="order-time">{{ detailView.time || '2026-2-5 13:23:56' }}</text>
          </view>
          <view
            v-if="isYardPerspective"
            class="order-status"
            :class="`order-status--${detailStatusTone}`"
          >
            <PawFeedingFeedbackTag
              variant="status"
              :tone="detailStatusTone"
              :text="detailStatusText"
            />
            <text class="order-status-copy">{{ detailStatusCopy }}</text>
          </view>
          <view
            v-else
            class="order-number"
          >
            <text>订单编号：{{ detailView.orderNo || 'YCQ092182' }}</text>
            <view
              class="order-copy-action"
              data-qa="feeding-detail-copy-order"
              @tap.stop="copyOrderNumber(detailView.orderNo || 'YCQ092182')"
            >
              <PawIcon
                name="actions/copy"
                :size="12"
                label="复制订单编号"
              />
            </view>
          </view>
        </view>
      </view>
    </view>

    <view
      class="timeline"
      :class="{ 'timeline--pet': variant === 92 }"
    >
      <view
        v-for="(row, i) in timelineRows"
        :key="`timeline-${i}`"
        class="timeline-row"
      >
        <view class="axis">
          <view class="dot" />
          <view
            v-if="i < timelineRows.length - 1 || logisticsRows.length"
            class="line"
          />
        </view>
        <view class="row-body">
          <view class="row-head">
            <view class="row-date">
              <text>{{ row.day }}</text>
              <text>{{ row.month }}</text>
            </view>
            <text>{{ row.indexText }}</text>
          </view>
          <view class="avatars">
            <image
              v-for="(a, ai) in row.catIcons || avatarImgs"
              :key="`avatar-${i}-${ai}`"
              :src="a"
              mode="aspectFill"
            />
          </view>
          <text class="row-text">{{
            row.text || '今天又来投喂小猫了，感谢幸福人生的投粮...'
          }}</text>
          <view class="photos">
            <image
              v-for="(p, pi) in row.imgs || photoImgs"
              :key="`photo-${i}-${pi}`"
              :src="p"
              mode="aspectFill"
            />
          </view>
          <text
            class="view-link"
            @tap.stop="openTimelineDynamic(row)"
            >查看</text
          >
        </view>
      </view>
      <view
        v-for="(log, index) in logisticsRows"
        :key="`log-${index}`"
        class="log-row"
      >
        <view class="axis">
          <view class="dot" />
          <view
            v-if="index < logisticsRows.length - 1"
            class="line"
          />
        </view>
        <text>{{ log.text || log }}</text
        ><text>{{ log.time || '2026-2-21 17:37' }}</text>
      </view>
    </view>
    <PawFixedActionBar
      v-if="shouldShowFeedback"
      :actions="[calendarAction]"
      :primary-action="feedbackAction"
      :primary-width="90"
      @action="onFooterAction"
      @primary="onFeedback"
    />

    <PawDatePickerSheet
      v-model="feedbackCalendarVisible"
      mode="pet"
      :selected-date="feedbackCalendarDate || feedbackCalendarToday"
      :initial-date="feedbackCalendarToday"
      :today="feedbackCalendarToday"
      :min-date="feedbackCalendarMinDate"
      :max-date="feedbackCalendarMaxDate"
      :cache-key="feedbackCalendarCacheKey"
      :entries="[]"
      :load-month="loadFeedbackCalendarMonth"
      qa="qa-feeding-detail-calendar-sheet"
      @select="onFeedbackCalendarSelect"
    />
  </view>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'

import PawImage from '@/components/base/PawImage.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawToast from './feedback/PawToast.vue'
import PawFeedingFeedbackTag from '@/components/feeding/PawFeedingFeedbackTag.vue'
import LevelBadge from '@/components/customBadge/LevelBadge.vue'
import PawFixedActionBar from '@/components/layout/PawFixedActionBar.vue'
import type { PawFixedAction } from '@/components/layout/PawFixedActionBar.vue'
import PawPageNav from '@/components/PawPageNav.vue'
import { goBackSmart } from '@/utils/navBack.ts'
import type { FeedingOrderDetail, FeedingLogisticsEntry } from '../services/orderMockApi.ts'
import PawDatePickerSheet, { type PawDatePickerEntry } from './PawDatePickerSheet.vue'
import {
  createEmptyFeedingOrderDetail,
  createFeedingDetailFigmaState,
  createFeedingTimelineFallback,
  type FeedingCloudOrderSummary,
  type FeedingCloudPetSummary,
  type FeedingDetailFigmaState,
  type FeedingFeedbackAction,
  type FeedingTimelineRow,
} from '../services/detailMetadata.ts'

type ClipboardApi = Pick<typeof uni, 'setClipboardData' | 'hideToast'>

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isClipboardApi(value: unknown): value is ClipboardApi {
  return isRecord(value) && typeof value.setClipboardData === 'function'
}

function showToastRef(value: unknown, message: string): void {
  if (!isRecord(value)) return
  const show = value.show
  if (typeof show === 'function') show.call(value, message)
}

export default defineComponent({
  name: 'PawFeedingDetailFigma',
  components: {
    PawImage,
    PawIcon,
    PawToast,
    PawFeedingFeedbackTag,
    LevelBadge,
    PawFixedActionBar,
    PawDatePickerSheet,
    PawPageNav,
  },
  props: {
    variant: { type: Number, default: 90 },
    orderId: { type: String, default: '' },
    recordId: { type: String, default: '' },
    deliveryStatus: { type: String, default: 'shipping' },
    deliveryProgress: { type: String, default: '0/3' },
    orderDetail: { type: Object as PropType<FeedingOrderDetail | null>, default: null },
    perspective: { type: String, default: '' },
    showFeedback: { type: Boolean, default: true },
  },
  emits: {
    feedback: (detail: FeedingOrderDetail) => detail !== null && typeof detail === 'object',
  },
  data(): FeedingDetailFigmaState {
    return createFeedingDetailFigmaState()
  },
  computed: {
    detailView(): FeedingOrderDetail {
      return this.orderDetail || createEmptyFeedingOrderDetail()
    },
    isYardPerspective() {
      return this.perspective === 'yard-owner' || this.variant === 91
    },
    isCloudParent() {
      return !this.isYardPerspective && this.variant !== 92
    },
    cloudPet(): FeedingCloudPetSummary {
      const detail = this.detailView
      return {
        id: detail.petId || 'roster-cat-2',
        name: detail.petName || '小毛毛球',
        avatar:
          detail.petAvatar || '/static/figma/feeding/2aa0d5e4a47ba5a30dfbda447d2b0e0acab9c94f.png',
        status: detail.petStatus || '已云养',
        continuousDays: detail.petContinuousDays || 25,
        description: detail.petDescription || '流浪的时候经常去小卖店偷吃火腿肠被打导致有点怕人',
        tags: detail.petTags.length ? detail.petTags : ['极度饥饿', '非常亲人', '男娃', '已绝育'],
      }
    },
    cloudOrder(): FeedingCloudOrderSummary {
      const detail = this.detailView
      return {
        cloudDays: detail.cloudDaysText || '云养30天/投粮4斤',
        time: detail.time || '2026-2-5 13:23:56',
        remainingDays: detail.remainingCloudDaysText || '3/3天',
        orderNo: detail.orderNo || 'YCQ092182',
        statusText: detail.deliveryStatusText || '待领养生效',
        statusTone: detail.deliveryStatusTone || 'orange',
        statusCopy: detail.deliveryCopy || '物资运输中，等待小院签收后正式生效…',
      }
    },
    shouldShowFeedback() {
      return this.showFeedback && this.isYardPerspective
    },
    timelineRows(): FeedingTimelineRow[] {
      return this.detailView.timeline.length
        ? this.detailView.timeline
        : createFeedingTimelineFallback()
    },
    logisticsRows(): FeedingLogisticsEntry[] {
      return this.detailView.logistics.length ? this.detailView.logistics : []
    },
    isRewardReceived() {
      return ['signed', 'received', 'delivered'].includes(String(this.deliveryStatus).toLowerCase())
    },
    feedbackAction(): FeedingFeedbackAction {
      return {
        key: 'feedback',
        label: '反馈',
        qa: 'qa-feeding-detail-feedback',
        size: 'md',
        shape: 'pill',
      }
    },
    calendarAction(): PawFixedAction {
      return {
        key: 'calendar',
        label: '日历',
        image: '/packages/feeding/static/calendar.svg',
        iconSize: 21,
        qa: 'qa-feeding-detail-calendar',
      }
    },
    feedbackCalendarEntries(): PawDatePickerEntry[] {
      const date = this.normalizeCalendarDate(this.detailView.time) || '2026-02-05'
      const feedback = this.feedbackTagText
      return [
        {
          id: `${this.orderId || this.detailView.orderId || 'feeding'}-feedback`,
          date,
          count: 1,
          total: 5,
          label: `${this.detailView.petName || '小动物'} · ${feedback}`,
          tone: this.detailStatusTone === 'red' ? 'red' : 'green',
        },
      ]
    },
    feedbackCalendarToday(): string {
      return this.normalizeCalendarDate(this.detailView.time) || '2026-02-05'
    },
    feedbackCalendarMinDate(): string {
      const today = this.feedbackCalendarToday
      const match = today.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (!match) return today
      const date = new Date(Number(match[1]), Number(match[2]) - 1 - 12, Number(match[3]))
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate(),
      ).padStart(2, '0')}`
    },
    feedbackCalendarMaxDate(): string {
      const today = this.feedbackCalendarToday
      const match = today.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (!match) return today
      const date = new Date(Number(match[1]), Number(match[2]) - 1 + 12, Number(match[3]))
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate(),
      ).padStart(2, '0')}`
    },
    feedbackCalendarCacheKey(): string {
      return `${this.orderId || this.detailView.orderId || 'feeding'}:${this.perspective || 'cloud-parent'}`
    },
    feedbackTagText() {
      return `已反馈${this.detailView.feedbackProgress || '2/5'}次`
    },
    detailStatusText() {
      return this.detailView.statusText || this.detailView.headerStatusText || '云养中'
    },
    detailStatusTone() {
      if (this.detailView.statusTone) return this.detailView.statusTone
      return this.detailView.headerStatusTone === 'green' ? 'green' : 'red'
    },
    detailStatusCopy() {
      return (
        this.detailView.statusCopy ||
        this.detailView.waitingCopy ||
        '云家长还在等您今天的反馈，不要忘了哟！'
      )
    },
  },
  methods: {
    goBack() {
      const fallbackUrl = this.isYardPerspective
        ? '/packages/feeding/pages/yard-orders/index'
        : '/packages/feeding/pages/mine/index'
      goBackSmart({ fallbackUrl })
    },
    onFeedback() {
      if (this.perspective) {
        this.$emit('feedback', this.detailView)
        return
      }
      uni.showToast({ title: '反馈', icon: 'none' })
    },
    onFooterAction(action: PawFixedAction) {
      if (action.key !== 'calendar') return
      this.feedbackCalendarDate =
        this.feedbackCalendarDate || this.feedbackCalendarEntries[0]?.date || ''
      this.feedbackCalendarVisible = true
    },
    onFeedbackCalendarSelect(date: string) {
      this.feedbackCalendarDate = date
    },
    loadFeedbackCalendarMonth(month: string): PawDatePickerEntry[] {
      const normalizedMonth = String(month || '').slice(0, 7)
      return this.feedbackCalendarEntries.filter(
        (entry) => entry.date.slice(0, 7) === normalizedMonth,
      )
    },
    normalizeCalendarDate(value: string): string {
      const match = String(value || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
      if (!match) return ''
      return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
    },
    openTimelineDynamic(row: FeedingTimelineRow) {
      const dynamicId = `${this.orderId || 'feeding'}-feedback-${row.indexText.charAt(0)}`
      const yardId = this.detailView.yardId || '1'
      const query = `yardId=${encodeURIComponent(yardId)}&dynamicId=${encodeURIComponent(dynamicId)}`
      uni.navigateTo({ url: `/packages/dynamic/pages/detail/index?${query}` })
    },
    openCloudPetDetail() {
      const petId = this.cloudPet.id
      if (!petId) return
      const yardId = this.detailView.yardId || '1'
      uni.navigateTo({
        url: `/packages/animal/pages/detail/index?animalId=${encodeURIComponent(petId)}&yardId=${encodeURIComponent(yardId)}&state=35`,
      })
    },
    copyOrderNumber(orderNo: string) {
      const value = String(orderNo || '').trim()
      if (!value) return
      const clipboardApi: unknown = typeof wx !== 'undefined' ? wx : uni
      if (!isClipboardApi(clipboardApi)) return
      clipboardApi.setClipboardData({
        data: value,
        showToast: false,
        success: () => {
          if (typeof clipboardApi.hideToast === 'function') clipboardApi.hideToast()
          const toast: unknown = this.$refs.toast
          showToastRef(toast, '已复制')
        },
      })
    },
  },
})
</script>

<style scoped>
.fd-page {
  position: relative;
  min-height: 100vh;
  background: #fff;
  color: #333;
  font-size: 13px;
}

.order-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 23px 17px 0;
  box-sizing: border-box;
}

.cloud-parent-summary {
  background: #fff;
}

.cloud-parent-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 28px 18px 24px;
  box-sizing: border-box;
  border-radius: 16px 16px 0 0;
  background: #fff;
}

.cloud-pet-module {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.cloud-pet-image {
  flex: 0 0 85px;
  overflow: hidden;
}

.cloud-pet-copy {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
}

.cloud-pet-title,
.cloud-pet-title-left,
.cloud-pet-tags,
.cloud-order-row,
.cloud-order-status,
.cloud-order-number {
  display: flex;
  align-items: center;
}

.cloud-pet-title {
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
}

.cloud-pet-title-left {
  flex: 1 1 auto;
  min-width: 0;
  gap: 6px;
}

.cloud-pet-name {
  min-width: 0;
  overflow: hidden;
  font-size: 17px;
  line-height: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloud-pet-status,
.cloud-pet-continuous {
  flex: 0 0 auto;
  padding: 2px 6px;
  border-radius: 5px;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
}

.cloud-pet-status {
  background: #b9f567;
  color: #3f6e2f;
}

.cloud-pet-continuous {
  background: #c9965e;
  color: #fff;
}

.cloud-pet-desc {
  display: -webkit-box;
  overflow: hidden;
  color: #777;
  font-size: 15px;
  line-height: 22px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.cloud-pet-tags {
  flex-wrap: wrap;
  gap: 6px;
}

.cloud-pet-tags text {
  padding: 4px 7px;
  border-radius: 4px;
  background: #f3f3f3;
  color: #777;
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
}

.cloud-pet-tags text:first-child {
  background: #fff0e8;
  color: #ff4b2f;
}

.cloud-order-module {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cloud-order-row {
  min-height: 32px;
  gap: 8px;
}

.cloud-order-label {
  flex: 0 0 30%;
  color: #999;
  font-size: 15px;
  line-height: 22px;
}

.cloud-order-value,
.cloud-order-number {
  flex: 1 1 auto;
  min-width: 0;
  gap: 3px;
  color: #333;
  font-size: 15px;
  line-height: 22px;
}

.cloud-order-value--muted {
  color: #999;
}

.cloud-order-row--number .cloud-order-number {
  color: #0875dc;
}

.order-copy-action {
  display: flex;
  flex: 0 0 20px;
  align-items: center;
  justify-content: center;
  height: 20px;
}

.cloud-order-status {
  gap: 6px;
  min-width: 0;
  margin-top: 3px;
}

.cloud-order-status-copy {
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloud-order-status--orange .cloud-order-status-copy {
  color: #ff7b26;
}

.cloud-order-status--green .cloud-order-status-copy {
  color: #5fba59;
}

.cloud-order-status--red .cloud-order-status-copy {
  color: #ff3838;
}

.cloud-order-status--blue .cloud-order-status-copy {
  color: #1292ff;
}

.order-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.order-avatar {
  flex: 0 0 40px;
  overflow: hidden;
}

.order-copy {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
}

.order-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.order-identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.order-name {
  min-width: 0;
  overflow: hidden;
  font-size: 16px;
  line-height: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.order-amount {
  font-size: 16px;
  line-height: 22px;
}

.order-time {
  color: #999;
  font-size: 13px;
  line-height: 18px;
}

.order-right {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.order-status {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.order-status-copy {
  min-width: 0;
  overflow: hidden;
  color: #1292ff;
  font-size: 13px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-number {
  display: flex;
  align-items: center;
  gap: 3px;
  min-width: 0;
  color: #0875dc;
  font-size: 12px;
  line-height: 18px;
}

.order-right .feeding-feedback-tag {
  flex: 0 0 auto;
}

.order-status .feeding-feedback-tag {
  flex: 0 0 auto;
}

.order-status--red .order-status-copy {
  color: #ff3838;
}

.order-status--green .order-status-copy {
  color: #1fcf91;
}

.order-status--orange .order-status-copy {
  color: #ff9f43;
}

.order-status--blue .order-status-copy {
  color: #1292ff;
}

.timeline {
  padding: 40px 15px 110px;

  box-sizing: border-box;
}

.timeline-row {
  display: flex;
  column-gap: 10px;
  min-height: 207px;
}

.axis {
  position: relative;
  flex: 0 0 18px;
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dot {
  position: relative;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #e1e1e1;
}

.dot::after {
  position: absolute;
  top: 2px;
  left: 2px;
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ffe100;
}

.line {
  width: 1px;
  position: absolute;
  top: 24px;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  background: #e6e6e6;
}

.row-body {
  flex: 1;
  padding: 0 0 15px;
}

.row-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.row-date {
  display: flex;
  align-items: flex-end;
  gap: 4px;
}

.row-date text:first-child {
  font-size: 27px;
  line-height: 32px;
  font-weight: 700;
}

.row-date text:last-child {
  padding-bottom: 2px;
  font-size: 15px;
  line-height: 18px;
}

.row-head > text {
  align-self: center;
  font-size: 15px;
}

.avatars {
  display: flex;
  gap: 4px;
  margin-top: 9px;
}

.avatars image {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.row-text {
  display: block;
  margin-top: 7px;
  font-size: 13px;
}

.photos {
  display: flex;
  gap: 7px;
  margin-top: 10px;
}

.photos image {
  width: 57px;
  height: 57px;
  border-radius: 5px;
}

.view-link {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  color: #296698;
}

.log-row {
  min-height: 40px;
  display: grid;
  grid-template-columns: 18px 1fr auto;
  align-items: center;
}

.log-row > .axis {
  height: 40px;
  box-sizing: border-box;
}

.log-row > text {
  align-self: start;
  margin-top: 8px;
  line-height: 16px;
}

.log-row > text:nth-child(2) {
  margin-left: 10px;
}

.log-row text:last-child {
  font-size: 11px;
  color: #999;
}

.pet-summary {
  padding: 31px 20px 24px;
  background: #fff;
  box-sizing: border-box;
  position: relative;
}

.pet-photo {
  width: 95px;
  height: 95px;
  border-radius: 5px;
}

.pet-copy {
  position: absolute;
  left: 125px;
  right: 16px;
  top: 28px;
}

.pet-title {
  display: flex;
  align-items: center;
  gap: 5px;
}

.pet-title > text:first-child {
  font-size: 17px;
}

.green,
.brown {
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 10px;
}

.green {
  background: #8fd84f;
}

.brown {
  background: #bc8648;
  color: #fff;
}

.pet-desc {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  line-height: 18px;
  color: #777;
}

.pet-tags {
  display: flex;
  gap: 5px;
  margin-top: 8px;
}

.pet-tags text {
  padding: 2px 5px;
  border-radius: 3px;
  background: #f3f3f3;
  font-size: 10px;
  color: #777;
}

.pet-tags text:first-child {
  color: #ff4b2f;
  background: #fff0e8;
}

.pet-meta {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  color: #999;
}

.pet-meta .blue {
  color: #0875dc;
}

.pet-meta .orange {
  color: #ff7b26;
}

.pet-status-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pet-status-tag {
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.pet-status-line--shipping {
  color: #ff7b26;
}

.pet-status-line--shipping .pet-status-tag {
  background: #fff0e8;
  color: #ff7b26;
}

.pet-status-line--signed {
  color: #5fba59;
}

.pet-status-line--signed .pet-status-tag {
  background: #eaf8e8;
  color: #5fba59;
}

.timeline--pet {
  padding-top: 0;
}

.fd-page--no-feedback .timeline {
  padding-bottom: 24px;
}

.fd-page--pet {
  background: #fff;
}
</style>
