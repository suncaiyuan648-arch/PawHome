<template>
  <view
    class="feeding-order-page"
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
        @search="onSearch"
      />

      <scroll-view
        class="feeding-order-scroll"
        scroll-y
        :show-scrollbar="false"
      >
        <slot
          name="before-list"
          :items="items"
        />
        <view
          v-if="loading"
          class="feeding-order-state"
          >加载中...</view
        >
        <view
          v-else-if="emptyState || !items.length"
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
            v-for="item in items"
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
          :items="items"
        />
      </scroll-view>
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
import PawFeedingOrderToolbar from './PawFeedingOrderToolbar.vue'
import { getFeedingOrders, type FeedingOrderVariant } from '../services/orderMockApi.ts'
import {
  createFeedingOrderListItems,
  createFeedingOrderListPageState,
  type FeedingOrderListItem,
  type FeedingOrderListPageState,
} from '../services/orderListMetadata.ts'

export default defineComponent({
  name: 'PawFeedingOrderList',
  components: {
    PawBadge,
    PawImage,
    PawFeedingFeedbackTag,
    LevelBadge,
    PawPageNav,
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
      return this.variant === 'yard' ? '小院投粮' : '我的投粮'
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
  font-size: 16px;
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
  font-size: 16px;
  line-height: 22px;
}

.feeding-order-card__time {
  color: #999999;
  font-size: 13px;
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
  font-size: 13px;
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

.feeding-order-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  color: #999999;
  font-size: 14px;
}
</style>
