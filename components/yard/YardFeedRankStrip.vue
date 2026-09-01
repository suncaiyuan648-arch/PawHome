<template>
  <view class="yard-feed-rank-strip">
    <view class="detail-rank__top">
      <SeamlessScroll class="detail-rank__scroll" :items="seamlessItems.length ? seamlessItems : null"
        :rank-title="seamlessRankTitle" @user-click="$emit('rank-user', $event)" />
    </view>
    <view class="detail-rank__bottom">
      <text class="detail-rank__summary">{{ feedSummary }}</text>
      <view class="detail-rank__leaderboard" @tap.stop="onLeaderboardTap"><text>排行榜</text>
        <PawChevron class="detail-rank__chevron" />
      </view>
    </view>
  </view>
</template>

<script>
import SeamlessScroll from "@/components/SeamlessScroll.vue";
import PawChevron from "@/components/base/PawChevron.vue";

export default {
  name: "YardFeedRankStrip",
  components: { SeamlessScroll, PawChevron },
  props: {
    feedSummary: {
      type: String,
      default: "",
    },
    /** 传给 SeamlessScroll；空数组时不使用演示数据 */
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
  width: 100%;
  height: 77px;
  margin: 0;
  background: #fff;
  overflow: hidden;
}

.detail-rank__top {
  height: 39px;
  box-sizing: border-box;
  overflow: hidden;
  border-bottom: .2px solid #ececec;
}

.detail-rank__scroll :deep(.css-scroll-container) {
  height: 39px;
  padding: 0;
  box-sizing: border-box;
}

.detail-rank__scroll :deep(.scroll-item) {
  height: 39px;
  padding: 0;
}

.detail-rank__scroll :deep(.info-name) {
  font-size: 13px;
}

.detail-rank__scroll :deep(.ranking) {
  font-size: 13px;
}

.detail-rank__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 38px;
  padding: 0;
  box-sizing: border-box;
}

.detail-rank__summary {
  color: #333;
  font-size: 14px;
  line-height: 20px;
}

.detail-rank__leaderboard {
  display: inline-flex;
  align-items: center;
  color: #9c9c9c;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
}

.detail-rank__chevron {
  margin-left: 6px;
}
</style>
