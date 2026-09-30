<template>
  <view
    class="feeding-order-page"
    :class="{ 'feeding-order-page--yard': variant === 'yard' }"
    data-qa="feeding-order-page"
  >
    <PawPageNav
      :title="pageTitle"
      background="#f5f5f5"
      :auto-back="false"
      @back="$emit('back')"
    />

    <view class="feeding-order-content">
      <PawFeedingOrderToolbar
        v-model:keyword="keyword"
        v-model:sort="sort"
        :variant="variant === 'yard' ? 'yard' : 'mine'"
        @search="onSearch"
        @calendar="openCalendar"
      />

      <scroll-view
        class="feeding-order-scroll"
        scroll-y
        :show-scrollbar="false"
      >
        <slot
          name="before-list"
          :items="visibleItems"
        />
        <view
          v-if="loading"
          class="feeding-order-state"
          >加载中...</view
        >
        <view
          v-else-if="emptyState || !visibleItems.length"
          class="feeding-order-state"
        >
          <slot name="empty"
            ><text>{{ emptyText }}</text></slot
          >
        </view>
        <view
          v-else
          class="feeding-order-list"
          data-qa="feeding-order-list"
        >
          <view
            v-for="item in visibleItems"
            :key="item.id"
            class="feeding-order-card"
            data-qa="feeding-order-card"
            @tap="openDetail(item)"
          >
            <view class="feeding-order-card__layout">
              <PawImage
                class="feeding-order-card__avatar"
                :src="variant === 'yard' ? item.userAvatar : item.petAvatar"
                :width="40"
                :height="40"
                :radius="20"
                :preview="false"
                @click="onAvatarClick(item)"
              />

              <view class="feeding-order-card__content">
                <view class="feeding-order-card__top">
                  <view
                    class="feeding-order-card__identity"
                    :class="{ 'feeding-order-card__identity--pet': variant !== 'yard' }"
                    @tap.stop="variant === 'yard' ? openUser(item) : openDetail(item)"
                  >
                    <text class="feeding-order-card__name">{{
                      variant === 'yard' ? item.userName : item.petName
                    }}</text>
                    <LevelBadge
                      v-if="variant === 'yard'"
                      :level="item.level"
                    />
                    <text
                      v-else
                      class="feeding-order-card__pet-status"
                      >{{ item.petStatus }}</text
                    >
                  </view>
                  <PawFeedingFeedbackTag
                    :text="
                      item.feedbackCountText || item.topText || item.feedbackTag || item.statusText
                    "
                    :tone="item.feedbackTone || 'progress'"
                  >
                    <PawBadge
                      v-if="variant === 'mine' && item.statusBadge > 0"
                      :count="item.statusBadge"
                      size="small"
                    />
                  </PawFeedingFeedbackTag>
                </view>

                <view class="feeding-order-card__body">
                  <text class="feeding-order-card__amount">{{
                    variant === 'yard' ? item.feedingLine : item.cloudSpec
                  }}</text>
                  <text class="feeding-order-card__time">{{ item.time }}</text>
                </view>

                <view
                  class="feeding-order-card__status"
                  :class="`feeding-order-card__status--${item.orderTone || item.statusTone || 'green'}`"
                >
                  <PawFeedingFeedbackTag
                    variant="status"
                    :tone="item.orderTone || item.statusTone || 'green'"
                    :text="variant === 'yard' ? item.orderState : item.statusText"
                  />
                  <text
                    class="feeding-order-card__copy"
                    :class="{
                      'feeding-order-card__copy--timeout':
                        variant === 'mine' && item.stateKey === 'cloud-active-timeout',
                    }"
                    >{{ item.orderCopy || item.progressText }}</text
                  >
                </view>
              </view>
            </view>
          </view>
        </view>
        <slot
          name="after-list"
          :items="visibleItems"
        />
      </scroll-view>

      <PawDatePickerSheet
        v-model="calendarVisible"
        mode="total"
        :selected-date="selectedDate || todayDate"
        :initial-date="todayDate"
        :today="todayDate"
        :min-date="calendarMinDate"
        :max-date="calendarMaxDate"
        :cache-key="calendarCacheKey"
        :entries="[]"
        :load-month="loadCalendarMonth"
        qa="qa-feeding-calendar-sheet"
        @select="onDateChange"
      />
    </view>
  </view>
</template>

<script lang="ts">
import { eventContract } from '@/utils/componentEvents.ts'

import { defineComponent, type PropType } from 'vue'

import PawBadge from '@/components/base/PawBadge.vue'
import PawImage from '@/components/base/PawImage.vue'
import PawFeedingFeedbackTag from '@/components/feeding/PawFeedingFeedbackTag.vue'
import LevelBadge from '@/components/customBadge/LevelBadge.vue'
import PawPageNav from '@/components/PawPageNav.vue'
import PawDatePickerSheet, { type PawDatePickerEntry } from './PawDatePickerSheet.vue'
import PawFeedingOrderToolbar from './PawFeedingOrderToolbar.vue'
import { getFeedingOrders, type FeedingOrderVariant } from '../services/orderMockApi.ts'
import {
  createFeedingOrderListItems,
  createFeedingOrderListPageState,
  type FeedingOrderListItem,
  type FeedingOrderListPageState,
} from '../services/orderListMetadata.ts'

const DEFAULT_CALENDAR_TODAY = '2026-02-05'

function normalizeCalendarDate(value: string): string {
  const match = String(value || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (!match) return ''
  return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
}

function shiftCalendarMonth(value: string, amount: number): string {
  const match = normalizeCalendarDate(value).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return ''
  const date = new Date(Number(match[1]), Number(match[2]) - 1 + amount, Number(match[3]))
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

export default defineComponent({
  name: 'PawFeedingOrderList',
  components: {
    PawBadge,
    PawImage,
    PawFeedingFeedbackTag,
    LevelBadge,
    PawPageNav,
    PawDatePickerSheet,
    PawFeedingOrderToolbar,
  },
  props: {
    variant: { type: String as PropType<FeedingOrderVariant>, default: 'mine' },
    userPawId: { type: [String, Number], default: '' },
    yardOwnerId: { type: [String, Number], default: '' },
    yardId: { type: [String, Number], default: '1' },
    emptyState: { type: Boolean, default: false },
    emptyText: { type: String, default: '暂无投粮订单' },
  },
  emits: {
    back: eventContract<[]>(),
    detail: eventContract<[item: FeedingOrderListItem]>(),
    'yard-click': eventContract<[item: FeedingOrderListItem]>(),
    'user-click': eventContract<[item: FeedingOrderListItem]>(),
  },
  data(): FeedingOrderListPageState {
    return createFeedingOrderListPageState()
  },
  computed: {
    pageTitle() {
      return this.variant === 'yard' ? '小院订单' : '我的投粮'
    },
    visibleItems(): FeedingOrderListItem[] {
      return this.items
    },
    todayDate(): string {
      const dates = this.calendarEntries
        .map((entry) => entry.date)
        .filter(Boolean)
        .sort()
      return dates[dates.length - 1] || DEFAULT_CALENDAR_TODAY
    },
    calendarMinDate(): string {
      const dates = this.calendarEntries
        .map((entry) => entry.date)
        .filter(Boolean)
        .sort()
      const earliest = dates[0]
      return earliest && earliest < this.todayDate
        ? earliest
        : shiftCalendarMonth(this.todayDate, -12)
    },
    calendarMaxDate(): string {
      const dates = this.calendarEntries
        .map((entry) => entry.date)
        .filter(Boolean)
        .sort()
      const latest = dates[dates.length - 1]
      return latest && latest > this.todayDate ? latest : shiftCalendarMonth(this.todayDate, 12)
    },
    calendarCacheKey(): string {
      const itemKey = this.items.map((item) => `${item.id}:${item.time || ''}`).join(',')
      return [this.variant, this.yardId, this.yardOwnerId, this.keyword, itemKey].join('|')
    },
    calendarEntries(): PawDatePickerEntry[] {
      if (this.variant !== 'yard') return []
      return this.items.reduce<PawDatePickerEntry[]>((entries, item) => {
        const match = String(item.time || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
        if (!match) return entries
        const date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
        entries.push({
          id: item.id,
          date,
          count: 1,
          label: `${item.petName || '小动物'} · ${item.orderState || '待反馈'}`,
          tone: item.orderTone === 'red' ? 'red' : item.orderTone === 'green' ? 'green' : 'orange',
        })
        return entries
      }, [])
    },
  },
  watch: {
    variant: 'loadOrders',
    userPawId: 'loadOrders',
    yardOwnerId: 'loadOrders',
    yardId: 'loadOrders',
    sort: 'loadOrders',
  },
  created() {
    this.loadOrders()
  },
  methods: {
    onSearch(value: string) {
      this.keyword = value
      this.loadOrders()
    },
    onDateChange(date: string) {
      this.selectedDate = date
    },
    openCalendar() {
      this.calendarVisible = true
    },
    loadCalendarMonth(month: string): PawDatePickerEntry[] {
      const normalizedMonth = String(month || '').slice(0, 7)
      return this.calendarEntries.filter((entry) => entry.date.slice(0, 7) === normalizedMonth)
    },
    loadOrders() {
      if (this.emptyState) {
        this.items = []
        return
      }
      this.loading = true
      getFeedingOrders({
        variant: this.variant,
        userPawId: String(this.userPawId || ''),
        yardOwnerId: String(this.yardOwnerId || ''),
        yardId: String(this.yardId || ''),
        keyword: this.keyword,
        sort: this.sort,
      })
        .then((result) => {
          this.items = createFeedingOrderListItems(result.data.items, this.variant)
        })
        .finally(() => {
          this.loading = false
        })
    },
    openDetail(item: FeedingOrderListItem) {
      this.$emit('detail', item)
    },
    onAvatarClick(item: FeedingOrderListItem) {
      if (this.variant === 'yard') this.openUser(item)
      else this.openDetail(item)
    },
    openYard(item: FeedingOrderListItem) {
      this.$emit('yard-click', item)
    },
    openUser(item: FeedingOrderListItem) {
      this.$emit('user-click', item)
    },
  },
})
</script>

<style scoped>
.feeding-order-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f5f5;
}

.feeding-order-page--yard {
  height: 100vh;
  overflow: hidden;
  --order-name-size: 14px;
  --order-spec-size: 14px;
  --order-spec-weight: 500;
  --order-time-size: 12px;
  --order-copy-size: 12px;
}

.feeding-order-content {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: 8px 16px 0;
  box-sizing: border-box;
}

.feeding-order-scroll {
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 10px;
  padding-bottom: 20px;
  box-sizing: border-box;
}

.feeding-order-page--yard .feeding-order-scroll {
  height: 0;
}

.feeding-order-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 20px;
}

.feeding-order-card {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 14px 16px 15px;
  box-sizing: border-box;
  border-radius: 14px;
  background: #ffffff;
  color: #333333;
}

.feeding-order-page--yard .feeding-order-card {
  min-height: 128px;
}

.feeding-order-card__layout,
.feeding-order-card__top,
.feeding-order-card__identity,
.feeding-order-card__status {
  display: flex;
  align-items: center;
}

.feeding-order-card__layout {
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.feeding-order-card__content {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
}

.feeding-order-card__top {
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  width: 100%;
}

.feeding-order-card__identity {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  gap: 6px;
}

.feeding-order-card__identity--pet {
  gap: 7px;
}

.feeding-order-card__avatar {
  flex: 0 0 40px;
  overflow: hidden;
}

.feeding-order-card__name {
  min-width: 0;
  overflow: hidden;
  font-size: var(--order-name-size, 16px);
  line-height: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feeding-order-card__pet-status {
  flex: 0 0 auto;
  padding: 2px 6px;
  border-radius: 5px;
  background: #b9f567;
  color: #3f6e2f;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
}

.feeding-order-card__body {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.feeding-order-card__amount {
  color: #333333;
  font-size: var(--order-spec-size, 16px);
  font-weight: var(--order-spec-weight, 400);
  line-height: 22px;
}

.feeding-order-card__time {
  color: #999999;
  font-size: var(--order-time-size, 13px);
  line-height: 18px;
}

.feeding-order-card__status {
  gap: 6px;
  min-width: 0;
}

.feeding-order-card__copy {
  min-width: 0;
  overflow: hidden;
  color: #1292ff;
  font-size: var(--order-copy-size, 13px);
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feeding-order-card__copy--timeout {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feeding-order-card__status--red .feeding-order-card__copy {
  color: #ff3838;
}

.feeding-order-card__status--green .feeding-order-card__copy {
  color: #1fcf91;
}

.feeding-order-card__status--orange .feeding-order-card__copy {
  color: #ff9f43;
}

.feeding-order-page--yard .feeding-order-card__status--green .feeding-order-card__copy {
  color: #12ca7a;
}

.feeding-order-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  color: #999999;
  font-size: 14px;
}
</style>
