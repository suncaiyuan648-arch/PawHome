<template>
  <view v-if="visible" class="paw-ntc-root" @touchmove.stop.prevent="noop">
    <view class="paw-ntc-mask"></view>
    <view class="paw-ntc-panel" @click.stop>
      <view class="paw-ntc-msg-wrap">
        <text class="paw-ntc-msg">{{ message }}</text>
      </view>
      <view class="paw-ntc-line"></view>
      <view class="paw-ntc-btn" @click="onConfirm">
        <text class="paw-ntc-btn-txt">{{ confirmText }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: "PawNoticeModal",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      default: "",
    },
    confirmText: {
      type: String,
      default: "我知道了",
    },
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
.paw-ntc-root {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
  box-sizing: border-box;
}

.paw-ntc-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: #5b5b5b;
}

.paw-ntc-panel {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 502rpx;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.12);
}

.paw-ntc-msg-wrap {
  padding: 24px 18px 22px;
  box-sizing: border-box;
}

.paw-ntc-msg {
  display: block;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: rgba(120, 120, 120, 1);
  text-align: center;
}

.paw-ntc-line {
  height: 1rpx;
  background: rgba(228, 228, 228, 1);
  margin: 0;
}

.paw-ntc-btn {
  height: 49px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.paw-ntc-btn-txt {
  font-size: 14px;
  font-weight: 500;
  color: rgba(100, 100, 100, 1);
}
</style>
