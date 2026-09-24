<template>
  <view class="ff-page">
    <PawPageNav
      :title="pageTitle"
      background="#ffffff"
      fallback-url="/pages/index/index"
    />
    <view class="tabs">
      <view
        class="tab-cell"
        :class="{ 'tab-cell--active': listTab === 'follow' }"
        @click="listTab = 'follow'"
      >
        <text class="tab-txt">关注</text>
        <view
          v-if="listTab === 'follow'"
          class="tab-line"
        ></view>
      </view>
      <view
        class="tab-cell"
        :class="{ 'tab-cell--active': listTab === 'fans' }"
        @click="listTab = 'fans'"
      >
        <text class="tab-txt">粉丝</text>
        <view
          v-if="listTab === 'fans'"
          class="tab-line"
        ></view>
      </view>
    </view>

    <scroll-view
      class="list-scroll"
      scroll-y
      :show-scrollbar="false"
      :bounces="false"
    >
      <view
        v-for="(row, idx) in currentRows"
        :key="listTab + '-' + row.pawId + '-' + idx"
        class="user-row"
      >
        <image
          class="user-av"
          :src="row.avatar"
          mode="aspectFill"
          @click.stop="openRowProfile(row)"
        ></image>
        <view
          class="user-mid"
          @click.stop="openRowProfile(row)"
        >
          <text class="user-name">{{ row.nickname }}</text>
          <text class="user-meta">粉丝 {{ row.fansCount }}</text>
          <text class="user-meta">逢猫号: {{ row.pawId }}</text>
        </view>
        <view
          class="row-follow-btn"
          :class="{ 'row-follow-btn--on': row.followed }"
          @click.stop="toggleRowFollow(row)"
        >
          <text class="row-follow-txt">{{ row.followed ? '已关注' : '关注' }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import { openUserProfile } from '@/utils/profileNav.ts'
import {
  createRelationsPageMetadata,
  normalizeRelationsRouteOptions,
} from '../../services/relationMetadata.ts'
import type { RelationUserRow, RelationsPageState } from '../../services/relationMetadata.ts'

export default defineComponent({
  components: { PawPageNav },
  data(): RelationsPageState {
    return createRelationsPageMetadata()
  },
  computed: {
    currentRows(): RelationUserRow[] {
      return this.listTab === 'follow' ? this.followingRows : this.fansRows
    },
  },
  onLoad(query: unknown = {}) {
    const route = normalizeRelationsRouteOptions(query)
    this.pageTitle = route.pageTitle || '晓晓'
    this.ownerPawId = route.ownerPawId
    this.listTab = route.listTab
  },
  methods: {
    openRowProfile(row: RelationUserRow) {
      if (!row || row.pawId === this.ownerPawId) return
      openUserProfile({
        pawId: row.pawId,
        nickname: row.nickname,
        avatar: row.avatar || '',
      })
    },
    toggleRowFollow(row: RelationUserRow) {
      row.followed = !row.followed
    },
  },
})
</script>

<style scoped>
.ff-page {
  height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.tabs {
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  background: #ffffff;
  padding: 0 48rpx;
  border-bottom: 1rpx solid #f0f0f0;
  box-sizing: border-box;
}

.tab-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28rpx 0 20rpx;
  position: relative;
  box-sizing: border-box;
}

.tab-txt {
  font-size: 30rpx;
  font-weight: 500;
  color: #979797;
  line-height: 42rpx;
}

.tab-cell--active .tab-txt {
  color: #111111;
  font-weight: 500;
}

.tab-line {
  position: absolute;
  left: 50%;
  bottom: 8rpx;
  transform: translateX(-50%);
  width: 72rpx;
  height: 8rpx;
  border-radius: 4rpx;
  background: #ffe60f;
}

.list-scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  box-sizing: border-box;
}

.user-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 22rpx 32rpx;
  border-bottom: 1rpx solid #f5f5f5;
  box-sizing: border-box;
}

.user-av {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  flex-shrink: 0;
  background: #fff8e6;
}

.user-mid {
  flex: 1;
  min-width: 0;
  margin-left: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.user-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #111111;
  line-height: 42rpx;
}

.user-meta {
  margin-top: 8rpx;
  font-size: 24rpx;
  font-weight: 400;
  color: #999999;
  line-height: 34rpx;
}

.row-follow-btn {
  flex-shrink: 0;
  margin-left: 16rpx;
  height: 46rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: #fff36a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.row-follow-btn--on {
  background: #f0f0f0;
}

.row-follow-txt {
  font-size: 24rpx;
  font-weight: 500;
  color: #111111;
}

.row-follow-btn--on .row-follow-txt {
  color: #666666;
}
</style>
