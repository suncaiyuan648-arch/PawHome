<template>
  <view class="yard-info-card" @click.stop="$emit('click')">
    <image class="yard-info-card__avatar" :src="safeAvatar" mode="aspectFill"></image>
    <view class="yard-info-card__main">
      <view class="yard-info-card__title-row">
        <text class="yard-info-card__name">{{ name }}</text>
        <view v-if="verified" class="yard-info-card__badge"><text>已实名</text></view>
      </view>
      <text class="yard-info-card__loc">{{ locationLine }}</text>
      <view class="yard-info-card__tags">
        <text v-for="(t, i) in tags" :key="'tag-' + i" class="yard-info-card__tag">{{ t }}</text>
      </view>
      <text class="yard-info-card__desc">{{ desc }}</text>
      <scroll-view v-if="thumbUrls.length" class="yard-info-card__scroll" scroll-x :show-scrollbar="false" :enable-flex="true">
        <view class="yard-info-card__scroll-inner">
          <image
            v-for="(u, i) in thumbUrls"
            :key="'th-' + i"
            class="yard-info-card__thumb"
            :src="thumbSrc(u)"
            mode="aspectFill"
          ></image>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import { safeImgSrc } from "@/utils/safeImgSrc.js";

export default {
  name: "YardInfoSummaryCard",
  props: {
    avatar: {
      type: String,
      default: "/static/avatar.png",
    },
    name: {
      type: String,
      default: "",
    },
    verified: {
      type: Boolean,
      default: true,
    },
    /** 例如：3.2km 金水区 */
    locationLine: {
      type: String,
      default: "",
    },
    tags: {
      type: Array,
      default: () => [],
    },
    desc: {
      type: String,
      default: "",
    },
    thumbUrls: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    safeAvatar() {
      return safeImgSrc(this.avatar, "/static/avatar.png");
    },
  },
  methods: {
    thumbSrc(u) {
      return safeImgSrc(u, "/static/avatarlog.png");
    },
  },
};
</script>

<style lang="less" scoped>
.yard-info-card {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 16px 12px 24px;
  margin: 0 12px 16px;
  background: #fafafa;
  border-radius: 12px;
  box-sizing: border-box;
}

.yard-info-card__avatar {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  flex-shrink: 0;
  background: #eee;
}

.yard-info-card__main {
  flex: 1;
  min-width: 0;
  margin-left: 12px;
}

.yard-info-card__title-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.yard-info-card__name {
  font-size: 16px;
  font-weight: 600;
  color: rgba(51, 51, 51, 1);
}

.yard-info-card__badge {
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(230, 247, 255, 1);
  font-size: 11px;
  font-weight: 500;
  color: rgba(22, 119, 255, 1);
}

.yard-info-card__loc {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: rgba(140, 140, 140, 1);
}

.yard-info-card__tags {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.yard-info-card__tag {
  font-size: 22rpx;
  font-weight: 500;
  color: rgba(238, 128, 2, 1);
  background: rgba(254, 250, 218, 1);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.yard-info-card__desc {
  display: block;
  margin-top: 10px;
  font-size: 13px;
  line-height: 20px;
  color: rgba(80, 80, 80, 1);
}

.yard-info-card__scroll {
  margin-top: 12px;
  width: 100%;
  white-space: nowrap;
}

.yard-info-card__scroll-inner {
  display: inline-flex;
  flex-direction: row;
  gap: 8px;
}

.yard-info-card__thumb {
  width: 96px;
  height: 96px;
  border-radius: 8px;
  flex-shrink: 0;
  background: #e8e8e8;
}
</style>
