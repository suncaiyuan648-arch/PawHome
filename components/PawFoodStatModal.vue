<template>
  <view v-if="visible" class="pfs-root" @touchmove.stop.prevent="noop">
    <view class="pfs-mask" @tap="onConfirm"></view>
    <view class="pfs-panel" @tap.stop>
      <text class="pfs-title">{{ title }}</text>
      <view class="pfs-rows">
        <view class="pfs-row">
          <text class="pfs-label">{{ labelJin }}</text>
          <text class="pfs-value">{{ totalJinDisplay }}</text>
        </view>
        <view class="pfs-row">
          <text class="pfs-label">{{ labelTimes }}</text>
          <text class="pfs-value">{{ totalTimesDisplay }}</text>
        </view>
      </view>
      <view class="pfs-line"></view>
      <view class="pfs-btn" @tap="onConfirm">
        <text class="pfs-btn-txt">{{ confirmText }}</text>
      </view>
    </view>
  </view>
</template>

<script>
/** 已获粮：两行统计 + 「我知道了」 */
export default {
  name: "PawFoodStatModal",
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: "已获粮" },
    totalJin: { type: [String, Number], default: "999" },
    totalTimes: { type: [String, Number], default: "456" },
    labelJin: { type: String, default: "小院累计获得投粮" },
    labelTimes: { type: String, default: "小院累计获粮次数" },
    unitJin: { type: String, default: "斤" },
    unitTimes: { type: String, default: "次" },
    confirmText: { type: String, default: "我知道了" },
  },
  emits: ["update:visible", "confirm"],
  computed: {
    totalJinDisplay() {
      return `${this.totalJin}${this.unitJin}`;
    },
    totalTimesDisplay() {
      return `${this.totalTimes}${this.unitTimes}`;
    },
  },
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
.pfs-root {
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

.pfs-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: #5b5b5b;
}

.pfs-panel {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 502rpx;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  padding: 40rpx 32rpx 0;
  box-sizing: border-box;
}

.pfs-title {
  display: block;
  text-align: center;
  font-size: 34rpx;
  font-weight: 700;
  color: #111;
  line-height: 48rpx;
}

.pfs-rows {
  margin-top: 36rpx;
  margin-bottom: 36rpx;
  padding: 0 8rpx;
}

.pfs-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.pfs-row:last-child {
  margin-bottom: 0;
}

.pfs-label {
  font-size: 28rpx;
  color: rgba(120, 120, 120, 1);
  flex: 1;
  min-width: 0;
  padding-right: 24rpx;
}

.pfs-value {
  font-size: 28rpx;
  font-weight: 500;
  color: #111;
  flex-shrink: 0;
}

.pfs-line {
  height: 1rpx;
  background: rgba(228, 228, 228, 1);
  margin: 0 -32rpx;
}

.pfs-btn {
  padding: 28rpx 32rpx 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pfs-btn-txt {
  font-size: 32rpx;
  font-weight: 500;
  color: rgba(140, 140, 140, 1);
}
</style>
