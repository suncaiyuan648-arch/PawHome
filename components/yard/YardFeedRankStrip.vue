<template>
  <view class="yard-feed-rank-strip">
    <view v-if="showMetaRow" class="throw-position">
      <view class="throw-text">{{ regionText }}</view>
      <view class="throw-info">
        <view v-for="(lb, i) in statLabels" :key="'stat-' + i" class="throw-label">{{ lb }}</view>
      </view>
    </view>
    <view v-if="showMetaRow" class="throw-line"></view>
    <view class="throw-rank">
      <view class="throw-rank-label">{{ feedSummary }}</view>
      <view class="throw-rank-right" @click.stop="onLeaderboardTap">
        <text>排行榜</text>
        <image class="throw-icon" src="/static/youjiantou.png"></image>
      </view>
    </view>
    <SeamlessScroll
      :items="seamlessItems.length ? seamlessItems : null"
      :rank-title="seamlessRankTitle"
      @user-click="$emit('rank-user', $event)"
    />
  </view>
</template>

<script>
import SeamlessScroll from "@/components/SeamlessScroll.vue";

export default {
  name: "YardFeedRankStrip",
  components: { SeamlessScroll },
  props: {
    showMetaRow: {
      type: Boolean,
      default: true,
    },
    regionText: {
      type: String,
      default: "",
    },
    statLabels: {
      type: Array,
      default: () => [],
    },
    feedSummary: {
      type: String,
      default: "",
    },
    /** 传给 SeamlessScroll；空数组则用组件内置演示数据 */
    seamlessItems: {
      type: Array,
      default: () => [],
    },
    seamlessRankTitle: {
      type: String,
      default: "小院投喂第一名",
    },
  },
  methods: {
    onLeaderboardTap() {
      this.$emit("leaderboard");
    },
  },
};
</script>

<style lang="less" scoped>
.yard-feed-rank-strip {
  margin-bottom: 10px;
}

.throw-position {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
}

.throw-text {
  font-size: 24rpx;
  font-weight: 400;
  letter-spacing: 0px;
  line-height: 33rpx;
  color: rgba(153, 153, 153, 1);
  vertical-align: top;
}

.throw-info {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12rpx;
  max-width: 380rpx;
}

.throw-label {
  font-size: 24rpx;
  font-weight: 400;
  letter-spacing: 0px;
  line-height: 33rpx;
  color: rgba(184, 183, 179, 1);
  vertical-align: top;
}

.throw-line {
  width: 100%;
  height: 1px;
  background-color: rgba(228, 228, 228, 0.55);
  margin: 5px 0;
  padding: 0 12px;
}

.throw-rank {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  margin-bottom: 8px;
}

.throw-rank-label {
  font-size: 28rpx;
  font-weight: 400;
  letter-spacing: 0px;
  line-height: 42rpx;
  color: rgba(51, 51, 51, 1);
  vertical-align: top;
}

.throw-rank-right {
  font-size: 26rpx;
  font-weight: 500;
  letter-spacing: 0px;
  line-height: 28rpx;
  color: rgba(156, 156, 156, 1);
  vertical-align: top;
  display: flex;
  align-items: center;
}

.throw-icon {
  width: 16rpx;
  height: 24rpx;
  margin-left: 16rpx;
}
</style>
