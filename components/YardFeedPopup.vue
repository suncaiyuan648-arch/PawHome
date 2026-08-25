<template>
  <view class="yfp-host">
  <view v-if="visible" class="yfp-root" @touchmove.stop.prevent="noop">
    <view class="yfp-mask" @tap="close"></view>
    <view class="yfp-sheet" @tap.stop>
      <view class="yfp-close-hit" @tap="close">
        <text class="yfp-close-x">×</text>
      </view>

      <view class="yfp-head">
        <view class="yfp-title">
          <text class="yfp-title-reg">加入</text>
          <text class="yfp-title-num">{{ heroFormatted }}</text>
          <text class="yfp-title-reg">位逢猫侠，一起照顾流浪猫</text>
        </view>
        <text class="yfp-sub">支付成功后平台将猫粮寄给该小院</text>
        <text class="yfp-sub">院主会在规定时间内喂猫并向您反馈</text>
      </view>

      <view class="yfp-cards-wrap">
        <view class="yfp-cards">
          <view
            v-for="pkg in packages"
            :key="pkg.key"
            class="yfp-card-col"
            @tap="selectKey(pkg.key)"
          >
            <view
              class="yfp-card"
              :class="{ 'yfp-card--on': selectedKey === pkg.key }"
            >
              <!-- 图1：图标与「0.4斤/5斤/15斤」同一水平线；0.4=粮粒图3，5=碗图2，15=粮袋图3 -->
              <view class="yfp-card-top-row">
                <image class="yfp-card-icon-img" :src="pkg.iconSrc" mode="aspectFit" />
                <text class="yfp-card-weight">{{ pkg.weightLabel }}</text>
              </view>
              <text class="yfp-card-price">{{ pkg.priceLabel }}</text>
            </view>
            <text class="yfp-card-feedback">{{ pkg.feedback }}</text>
          </view>
        </view>
      </view>

      <view class="yfp-learn" @tap="onLearnFood">
        <text class="yfp-learn-txt">了解猫粮</text>
        <text class="yfp-learn-arr">›</text>
      </view>

      <view class="yfp-pay-hit" @tap="onPay">
        <view class="yfp-pay-btn">
          <text class="yfp-pay-txt">{{ payButtonLine }}</text>
        </view>
      </view>

      <view class="yfp-agree-row" @tap.stop="toggleAgree">
        <view class="yfp-check" :class="{ 'yfp-check--on': agreed }">
          <text v-if="agreed" class="yfp-check-mark">✓</text>
        </view>
        <view class="yfp-agree-txt-wrap">
          <text class="yfp-agree-plain">已经阅读完</text>
          <text class="yfp-agree-link" @tap.stop="openAgreement('feed')">《投喂协议》</text>
          <text class="yfp-agree-plain">和</text>
          <text class="yfp-agree-link" @tap.stop="openAgreement('fraud')">《防诱导诈骗提醒》</text>
        </view>
      </view>

      <view class="yfp-safe" />
    </view>
  </view>

  <!-- 投喂成功（设计稿下半屏，不含顶栏）：黄勾 + 文案 + 查看订单 -->
  <view v-if="successVisible" class="yfs-root" @touchmove.stop.prevent="noop">
    <view class="yfs-mask" @tap="closeSuccess"></view>
    <view class="yfs-sheet" @tap.stop>
      <view class="yfs-close-hit" @tap="closeSuccess">
        <text class="yfs-close-x">×</text>
      </view>
      <view class="yfs-head">
        <view class="yfs-badge">
          <text class="yfs-check">✓</text>
        </view>
        <text class="yfs-title">投喂成功</text>
      </view>
      <view class="yfs-poem">
        <text class="yfs-line">饿了就睡 醒了就找</text>
        <text class="yfs-line">日子浑浑噩噩</text>
        <text class="yfs-line">谢谢你给我一口粮</text>
        <text class="yfs-line">也给我一点盼头</text>
      </view>
      <view class="yfs-btn-hit" @tap="goFeedOrder">
        <view class="yfs-btn">
          <text class="yfs-btn-txt">查看投喂订单</text>
        </view>
      </view>
      <view class="yfs-safe" />
    </view>
  </view>
  </view>
</template>

<script>
/**
 * 小院底部「投喂」弹窗（设计稿 rectangle 34626785）
 */
export default {
  name: "YardFeedPopup",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    heroCount: {
      type: Number,
      default: 1199999,
    },
  },
  emits: ["update:visible", "pay", "learn-food"],
  data() {
    return {
      successVisible: false,
      selectedKey: "c",
      agreed: true,
      packages: [
        {
          key: "a",
          jin: 0.4,
          weightLabel: "0.4斤",
          price: 6.9,
          priceLabel: "6.9元",
          feedback: "反馈1次",
          iconSrc: "/static/feed-popup/feed-kibble.png",
        },
        {
          key: "b",
          jin: 5,
          weightLabel: "5斤",
          price: 39.9,
          priceLabel: "39.9元",
          feedback: "反馈5次",
          iconSrc: "/static/feed-popup/feed-bowl.png",
        },
        {
          key: "c",
          jin: 15,
          weightLabel: "15斤",
          price: 119.9,
          priceLabel: "119.9元",
          feedback: "反馈15次",
          iconSrc: "/static/feed-popup/feed-bag.png",
        },
      ],
    };
  },
  computed: {
    heroFormatted() {
      try {
        return Number(this.heroCount).toLocaleString("zh-CN");
      } catch (e) {
        return String(this.heroCount);
      }
    },
    selectedPkg() {
      return this.packages.find((p) => p.key === this.selectedKey) || this.packages[2];
    },
    payButtonLine() {
      const p = this.selectedPkg;
      return `${p.priceLabel}给小咪们投喂${p.weightLabel}猫粮`;
    },
  },
  watch: {
    visible(v) {
      if (v) {
        this.agreed = true;
        this.successVisible = false;
      }
    },
  },
  methods: {
    noop() {},
    close() {
      this.$emit("update:visible", false);
    },
    selectKey(key) {
      this.selectedKey = key;
    },
    toggleAgree() {
      this.agreed = !this.agreed;
    },
    onLearnFood() {
      this.$emit("learn-food");
      uni.showToast({ title: "猫粮说明（演示）", icon: "none" });
    },
    openAgreement(which) {
      uni.showToast({
        title: which === "feed" ? "投喂协议（演示）" : "防诱导诈骗提醒（演示）",
        icon: "none",
      });
    },
    onPay() {
      if (!this.agreed) {
        uni.showToast({ title: "请先阅读并勾选协议", icon: "none" });
        return;
      }
      const p = this.selectedPkg;
      this.$emit("pay", {
        key: p.key,
        jin: p.jin,
        price: p.price,
        feedbackTimes: p.key === "a" ? 1 : p.key === "b" ? 5 : 15,
      });
      this.$emit("update:visible", false);
      this.successVisible = true;
    },
    closeSuccess() {
      this.successVisible = false;
    },
    goFeedOrder() {
      this.closeSuccess();
      uni.navigateTo({
        url: "/pages/meMore/yardFeedOrders",
        fail: () =>
          uni.switchTab({
            url: "/pages/me/index",
            fail: () => uni.showToast({ title: "订单入口（演示）", icon: "none" }),
          }),
      });
    },
  },
};
</script>

<style lang="less" scoped>
/* 设计稿 375 宽 → rpx 按 750 换算 */
@yfp-yellow: rgba(255, 215, 0, 1);
@yfp-card-grey: rgba(242, 242, 242, 1);
@yfp-text: rgba(51, 51, 51, 1);
@yfp-muted: rgba(139, 139, 139, 1);
@yfp-feedback: rgba(102, 102, 102, 1);
@yfp-link: rgba(81, 125, 219, 1);

.yfp-root {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 10050;
}

.yfp-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  background: rgba(0, 0, 0, 0.45);
}

.yfp-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  width: 100%;
  min-height: 846rpx;
  box-sizing: border-box;
  padding: 48rpx 46rpx 24rpx;
  background: #ffffff;
  border-radius: 40rpx 40rpx 0 0;
}

.yfp-close-hit {
  position: absolute;
  top: 46rpx;
  right: 32rpx;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.yfp-close-x {
  font-size: 40rpx;
  line-height: 1;
  color: rgba(122, 122, 119, 1);
}

.yfp-head {
  padding-right: 56rpx;
  margin-bottom: 32rpx;
}

.yfp-title {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: baseline;
  font-size: 32rpx;
  line-height: 48rpx;
  color: @yfp-text;
  margin-bottom: 16rpx;
}

.yfp-title-reg {
  font-weight: 500;
}

.yfp-title-num {
  font-weight: 700;
}

.yfp-sub {
  display: block;
  font-size: 24rpx;
  line-height: 32rpx;
  font-weight: 400;
  color: @yfp-muted;
  margin-top: 4rpx;
}

.yfp-cards-wrap {
  width: 100%;
  margin-bottom: 16rpx;
}

.yfp-cards {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
}

.yfp-card-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 188rpx;
}

.yfp-card {
  width: 188rpx;
  height: 200rpx;
  box-sizing: border-box;
  border-radius: 40rpx;
  background: @yfp-card-grey;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 20rpx 10rpx 14rpx;
}

.yfp-card--on {
  background: @yfp-yellow;
}

.yfp-card-top-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  width: 100%;
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
}

.yfp-card-icon-img {
  width: 52rpx;
  height: 52rpx;
  flex-shrink: 0;
}

.yfp-card-weight {
  font-size: 30rpx;
  font-weight: 500;
  line-height: 1.2;
  color: @yfp-text;
  flex-shrink: 0;
  white-space: nowrap;
}

.yfp-card-price {
  margin-top: 8rpx;
  font-size: 28rpx;
  font-weight: 500;
  line-height: 26rpx;
  color: @yfp-text;
  text-align: center;
}

.yfp-card-feedback {
  margin-top: 16rpx;
  font-size: 24rpx;
  font-weight: 400;
  line-height: 26rpx;
  color: @yfp-feedback;
  text-align: center;
}

.yfp-learn {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 16rpx 0 24rpx;
}

.yfp-learn-txt {
  font-size: 24rpx;
  line-height: 35rpx;
  color: rgba(169, 169, 169, 1);
}

.yfp-learn-arr {
  margin-left: 4rpx;
  font-size: 28rpx;
  line-height: 1;
  color: rgba(169, 169, 169, 1);
}

.yfp-pay-hit {
  display: flex;
  justify-content: center;
}

.yfp-pay-btn {
  width: 650rpx;
  height: 94rpx;
  border-radius: 47rpx;
  background: @yfp-yellow;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 0 24rpx;
}

.yfp-pay-txt {
  font-size: 32rpx;
  font-weight: 700;
  line-height: 44rpx;
  color: @yfp-text;
  text-align: center;
}

.yfp-agree-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  margin-top: 28rpx;
  padding: 0 14rpx 0 8rpx;
}

.yfp-check {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(122, 122, 119, 1);
  flex-shrink: 0;
  margin-top: 4rpx;
  margin-right: 12rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.yfp-check--on {
  border: none;
  background: #ffdd00;
}

.yfp-check-mark {
  font-size: 18rpx;
  font-weight: 700;
  color: #ffffff;
  line-height: 1;
}

.yfp-agree-txt-wrap {
  flex: 1;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
}

.yfp-agree-plain {
  font-size: 24rpx;
  line-height: 35rpx;
  color: @yfp-feedback;
}

.yfp-agree-link {
  font-size: 24rpx;
  line-height: 35rpx;
  color: @yfp-link;
}

.yfp-safe {
  height: env(safe-area-inset-bottom);
  min-height: 16rpx;
}

/* ---------- 投喂成功 ---------- */
.yfs-root {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 10060;
}

.yfs-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  background: rgba(0, 0, 0, 0.45);
}

.yfs-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  width: 100%;
  box-sizing: border-box;
  padding: 56rpx 46rpx 28rpx;
  background: #ffffff;
  border-radius: 40rpx 40rpx 0 0;
}

.yfs-close-hit {
  position: absolute;
  top: 32rpx;
  right: 28rpx;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
}

.yfs-close-x {
  font-size: 40rpx;
  line-height: 1;
  color: rgba(122, 122, 119, 1);
}

.yfs-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  margin-top: 8rpx;
  margin-bottom: 36rpx;
}

.yfs-badge {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: linear-gradient(145deg, #ffe566 0%, #ffdd00 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4rpx 12rpx rgba(255, 200, 0, 0.35);
}

.yfs-check {
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
  line-height: 1;
}

.yfs-title {
  font-size: 36rpx;
  font-weight: 700;
  color: @yfp-text;
}

.yfs-poem {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 24rpx 40rpx;
  box-sizing: border-box;
}

.yfs-line {
  font-size: 28rpx;
  font-weight: 400;
  line-height: 48rpx;
  color: rgba(140, 140, 140, 1);
  text-align: center;
}

.yfs-btn-hit {
  display: flex;
  justify-content: center;
}

.yfs-btn {
  width: 650rpx;
  height: 94rpx;
  border-radius: 47rpx;
  background: @yfp-yellow;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.yfs-btn-txt {
  font-size: 32rpx;
  font-weight: 700;
  color: @yfp-text;
}

.yfs-safe {
  height: env(safe-area-inset-bottom);
  min-height: 16rpx;
}
</style>
