<template>
  <view class="offline-activity-list-page">
    <image
      class="offline-activity-list-page__hero"
      :src="assets.listBanner"
      mode="aspectFill"
      aria-hidden="true"
    />

    <PawPageNav
      background="transparent"
      :show-back="false"
      :auto-back="false"
      @layout="onNavLayout"
    />

    <view
      class="offline-activity-list-page__top-space"
      :style="{ height: topSpacerHeight + 'px' }"
    />

    <view class="offline-activity-list-page__tabs">
      <view class="offline-activity-list-page__tab-group">
        <view
          class="offline-activity-list-page__tab"
          :class="{ 'offline-activity-list-page__tab--active': activeState === 'ongoing' }"
          data-qa="qa-offline-activity-tab-ongoing"
          @tap="selectState('ongoing')"
        >
          <text>进行中</text>
          <view
            v-if="activeState === 'ongoing'"
            class="offline-activity-list-page__tab-indicator"
          />
        </view>
        <view
          class="offline-activity-list-page__tab"
          :class="{ 'offline-activity-list-page__tab--active': activeState === 'ended' }"
          data-qa="qa-offline-activity-tab-ended"
          @tap="selectState('ended')"
        >
          <text>已结束</text>
          <view
            v-if="activeState === 'ended'"
            class="offline-activity-list-page__tab-indicator"
          />
        </view>
      </view>
      <view class="offline-activity-list-page__sort">
        <text>马上开始</text>
        <image
          class="offline-activity-list-page__sort-chevron"
          :src="assets.sortChevron"
          mode="aspectFit"
          aria-hidden="true"
        />
      </view>
    </view>

    <scroll-view
      class="offline-activity-list-page__scroll"
      scroll-y
      :enable-flex="true"
      :show-scrollbar="false"
      :bounces="false"
      data-qa="qa-offline-activity-list"
    >
      <view class="offline-activity-list-page__cards">
        <OfflineActivityCard
          v-for="activity in activities"
          :key="activity.activityId"
          :activity="activity"
          inset
          @open="openActivity"
        />
        <view
          v-if="activities.length === 0"
          class="offline-activity-list-page__empty"
        >
          <text>暂时没有活动</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import { buildRoute } from '@/navigation/routeContracts.ts'
import type { WechatNavLayout } from '@/utils/navLayout.ts'
import OfflineActivityCard from '../../../components/OfflineActivityCard.vue'
import { OFFLINE_ACTIVITY_ASSETS } from '../../../services/offlineActivityAssets.ts'
import {
  getOfflineActivitySummaries,
  type OfflineActivityState,
} from '../../../services/offlineActivityFixtures.ts'

interface OfflineActivityListPageState {
  activeState: OfflineActivityState
  assets: typeof OFFLINE_ACTIVITY_ASSETS
  navTotalHeight: number
}

export default defineComponent({
  name: 'OfflineActivityListPage',
  components: { PawPageNav, OfflineActivityCard },
  data(): OfflineActivityListPageState {
    return {
      activeState: 'ongoing',
      assets: OFFLINE_ACTIVITY_ASSETS,
      navTotalHeight: 0,
    }
  },
  computed: {
    topSpacerHeight(): number {
      return Math.max(0, 198 - this.navTotalHeight)
    },
    activities() {
      return getOfflineActivitySummaries(this.activeState)
    },
  },
  methods: {
    onNavLayout(layout: WechatNavLayout) {
      this.navTotalHeight = layout.totalHeight
    },
    selectState(state: OfflineActivityState) {
      this.activeState = state
    },
    openActivity(activityId: string) {
      try {
        uni.navigateTo({
          url: buildRoute('activity.offline.detail', { activityId }),
          animationType: 'slide-in-right',
          animationDuration: 180,
        })
      } catch {
        uni.showToast({ title: '活动暂不可用', icon: 'none' })
      }
    },
  },
})
</script>

<style scoped>
.offline-activity-list-page {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  background: #f5f6f6;
  box-sizing: border-box;
}

.offline-activity-list-page__hero {
  position: absolute;
  z-index: 0;
  top: -38px;
  left: 0;
  display: block;
  width: 100%;
  height: 268px;
}

.offline-activity-list-page__top-space {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  width: 100%;
}

.offline-activity-list-page__tabs {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 0 0 42px;
  align-items: stretch;
  justify-content: space-between;
  width: 100%;
  padding: 0 15px;
  border-radius: 10px 10px 0 0;
  background: #fff;
  box-sizing: border-box;
}

.offline-activity-list-page__tab-group {
  display: flex;
  flex: 0 0 auto;
  align-items: stretch;
  height: 42px;
  gap: 23px;
}

.offline-activity-list-page__tab {
  position: relative;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  height: 42px;
  color: #666;
  font-size: 15px;
  font-weight: 400;
  line-height: 20px;
}

.offline-activity-list-page__tab--active {
  color: #333;
  font-weight: 500;
}

.offline-activity-list-page__tab-indicator {
  position: absolute;
  bottom: 6px;
  left: 50%;
  width: 21px;
  height: 2px;
  border-radius: 2px;
  background: #ff477e;
  transform: translateX(-50%);
}

.offline-activity-list-page__sort {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  height: 42px;
  color: #222;
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
  gap: 7px;
}

.offline-activity-list-page__sort-chevron {
  display: block;
  flex: 0 0 8px;
  width: 5.8px;
  height: 9.8px;
  transform: rotate(90deg) scaleY(-1);
}

.offline-activity-list-page__scroll {
  position: relative;
  z-index: 1;
  display: block;
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  height: 0;
  background: #f5f6f6;
}

.offline-activity-list-page__cards {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 7px 0 24px;
  box-sizing: border-box;
  gap: 8px;
}

.offline-activity-list-page__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  color: #999;
  font-size: 13px;
}
</style>
