<template>
  <view v-if="visible" class="prm-root" @touchmove.stop.prevent="noop">
    <view class="prm-mask" @tap="onConfirm"></view>
    <view class="prm-panel" @tap.stop>
      <text class="prm-title">{{ title }}</text>
      <view class="prm-body-wrap">
        <text class="prm-body">{{ body }}</text>
      </view>
      <view class="prm-line"></view>
      <view class="prm-btn" @tap="onConfirm">
        <text class="prm-btn-txt">{{ confirmText }}</text>
      </view>
    </view>
  </view>
</template>

<script>
/** 标题 + 居中说明文案 + 「我知道了」（小院详情帮助领养、平均反馈时长等） */
export default {
  name: "PawRichNoticeModal",
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: "" },
    body: { type: String, default: "" },
    confirmText: { type: String, default: "我知道了" },
  },
  emits: ["update:visible", "confirm"],
  methods: {
    noop() {},
    onConfirm() {
      this.$emit("update:visible", false);
      this.$emit("confirm");
    },
  },
};
</script>

<style lang="less" scoped>
.prm-root {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 10020;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
  box-sizing: border-box;
}

.prm-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: #5b5b5b;
}

.prm-panel {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 580rpx;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  padding: 40rpx 36rpx 0;
  box-sizing: border-box;
}

.prm-title {
  display: block;
  text-align: center;
  font-size: 34rpx;
  font-weight: 700;
  color: rgba(34, 34, 34, 1);
  line-height: 48rpx;
}

.prm-body-wrap {
  margin-top: 28rpx;
  margin-bottom: 36rpx;
  padding: 0 8rpx;
}

.prm-body {
  display: block;
  text-align: center;
  font-size: 28rpx;
  font-weight: 400;
  line-height: 44rpx;
  color: rgba(120, 120, 120, 1);
}

.prm-line {
  height: 1rpx;
  background: rgba(228, 228, 228, 1);
  margin: 0 -36rpx;
}

.prm-btn {
  padding: 28rpx 32rpx 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.prm-btn-txt {
  font-size: 32rpx;
  font-weight: 500;
  color: rgba(140, 140, 140, 1);
}
</style>
