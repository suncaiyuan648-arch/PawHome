<template>
  <view class="yfp-host">
    <PawBottomSheet v-model:visible="visibleProxy" variant="feed" height="599px" :close-on-mask="true"
      :safe-area="false" :z-index="10050">
      <view class="yfp-sheet" @tap.stop>
        <view class="yfp-close-hit" @tap="close">
          <PawIcon class="yfp-close" name="navigation/close" :size="12" label="关闭" />
        </view>

        <view class="yfp-title">
          <text>加入</text><text class="yfp-title-number">{{ heroFormatted }}</text><text>位逢猫侠，一起照顾流浪猫</text>
        </view>
        <text class="yfp-sub yfp-sub--first">支付成功后平台将猫粮寄给该小院</text>
        <text class="yfp-sub yfp-sub--second">院主会在规定时间内喂猫并向您反馈</text>

        <view class="yfp-cards">
          <view v-for="pkg in packages" :key="pkg.key" class="yfp-card-col" :class="`yfp-card-col--${pkg.key}`"
            @tap="selectKey(pkg.key)">
            <view class="yfp-card" :class="{ 'yfp-card--selected': selectedKey === pkg.key }">
              <view class="yfp-card-top-row">
                <PawIcon class="yfp-card-icon" :class="`yfp-card-icon--${pkg.key}`" :name="pkg.iconName"
                  :size="pkg.iconSize" />
                <text class="yfp-card-weight">{{ pkg.weightLabel }}</text>
              </view>
              <text class="yfp-card-price">{{ pkg.priceLabel }}</text>
            </view>
            <text class="yfp-card-feedback">{{ pkg.feedback }}</text>
          </view>
        </view>

        <view class="yfp-learn" @tap="onLearnFood">
          <text>了解猫粮</text>
          <PawIcon name="navigation/chevron-right" :size="7" />
        </view>

        <view class="yfp-rules">
          <text class="yfp-rules-title">云养300天权益：</text>
          <text v-for="(right, index) in feedRights" :key="index" class="yfp-rule-line">{{ index + 1 }}.{{ right
          }}</text>
        </view>

        <PawButton class="yfp-pay-btn" size="md" tone="brand" block @click="onPay">
          <text class="yfp-pay-amount">{{ selectedPkg.payPriceLabel }}</text><text class="yfp-pay-unit">元</text><text
            class="yfp-pay-copy">给小咪们投喂{{ selectedPkg.payJinLabel }}猫粮</text>
        </PawButton>

        <view class="yfp-agree-row">
          <PawCheckbox v-model="agreed" />
          <view class="yfp-agree-text">
            <text class="yfp-agree-plain">已经阅读完</text>
            <text class="yfp-agree-link" @tap.stop="openAgreement('feed')">《投喂协议》</text>
            <text class="yfp-agree-plain">和</text>
            <text class="yfp-agree-link" @tap.stop="openAgreement('fraud')">《防诱导诈骗提醒》</text>
          </view>
        </view>
      </view>
    </PawBottomSheet>

    <PawResultSheet v-model="successVisible" title="投喂成功" description="饿了就睡 醒了就找\n日子浑浑噩噩\n谢谢你给我一口粮\n也给我一点盼头"
      action-text="查看投喂订单" @action="onFeedOrder" />
  </view>
</template>

<script>
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import PawResultSheet from '@/components/feedback/PawResultSheet.vue'
import PawButton from '@/components/base/PawButton.vue'
import PawCheckbox from '@/components/base/PawCheckbox.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'

export default {
  name: 'YardFeedPopup',
  components: { PawBottomSheet, PawResultSheet, PawButton, PawCheckbox, PawIcon },
  props: {
    visible: { type: Boolean, default: false },
    heroCount: { type: Number, default: 1199999 },
    paymentParams: { type: Object, default: null }
  },
  emits: ['update:visible', 'pay', 'payment-success', 'learn-food', 'agreement', 'feed-order'],
  data() {
    return {
      successVisible: false,
      paymentPending: false,
      selectedKey: 'c',
      agreed: true,
      feedRights: [
        '您购买的15斤猫粮将寄往小院；',
        '院主将会在接下来300天用这15斤猫粮喂“豆豆”；',
        '每周至少反馈1次“豆豆”的投喂视频图片，尽量做到一天一反馈，由于恶劣天气、院主临时有事等各种因素无法保证每天反馈；',
        '院主及时更新“豆豆”的情况；',
        '您获得豆豆的优先领养权；',
        '云领养期间，申请领养需要您的同意才会发送给院主审核；'
      ],
      packages: [
        { key: 'a', jin: 0.4, weightLabel: '0.4斤', price: 6.9, priceLabel: '6.9元', feedback: '云养3天', payPriceLabel: '6.9', payJinLabel: '0.4斤', iconName: 'brand/feed-kibble', iconSize: 20 },
        { key: 'b', jin: 4, weightLabel: '4斤', price: 29.9, priceLabel: '29.9元', feedback: '云养30天', payPriceLabel: '29.9', payJinLabel: '4斤', iconName: 'brand/feed-bowl', iconSize: 32 },
        { key: 'c', jin: 40, weightLabel: '40斤', price: 299.9, priceLabel: '299.9元', feedback: '云养300天', payPriceLabel: '119.9', payJinLabel: '15斤', iconName: 'brand/feed-bag', iconSize: 43 }
      ]
    }
  },
  computed: {
    visibleProxy: {
      get() { return this.visible },
      set(value) { this.$emit('update:visible', value) }
    },
    heroFormatted() {
      try { return Number(this.heroCount).toLocaleString('zh-CN') } catch (error) { return String(this.heroCount) }
    },
    selectedPkg() { return this.packages.find(pkg => pkg.key === this.selectedKey) || this.packages[2] }
  },
  watch: {
    visible(value) {
      if (value) {
        this.agreed = true
        this.successVisible = false
        this.paymentPending = false
      }
    }
  },
  methods: {
    close() { this.$emit('update:visible', false) },
    selectKey(key) { if (!this.paymentPending) this.selectedKey = key },
    onLearnFood() { this.$emit('learn-food') },
    openAgreement(which) { this.$emit('agreement', which) },
    onPay() {
      if (this.paymentPending) return
      if (!this.agreed) {
        this.$emit('agreement', 'required')
        return
      }

      const pkg = this.selectedPkg
      const payload = { key: pkg.key, jin: pkg.jin, price: pkg.price, feedbackTimes: 1 }
      this.$emit('pay', payload)

      const params = this.paymentParams || {}
      const required = ['timeStamp', 'nonceStr', 'package', 'signType', 'paySign']
      if (!required.every(key => params[key])) {
        uni.showToast({ title: '支付服务暂未配置', icon: 'none' })
        return
      }

      this.paymentPending = true
      const done = () => this.onPaymentSuccess(payload)
      const failed = error => {
        this.paymentPending = false
        if (!error || error.errMsg !== 'requestPayment:fail cancel') uni.showToast({ title: '支付未完成', icon: 'none' })
      }
      if (typeof wx !== 'undefined' && typeof wx.requestPayment === 'function') {
        wx.requestPayment({ ...params, success: done, fail: failed })
      } else if (typeof uni !== 'undefined' && typeof uni.requestPayment === 'function') {
        uni.requestPayment({ ...params, success: done, fail: failed })
      } else {
        this.paymentPending = false
        uni.showToast({ title: '当前环境不支持支付', icon: 'none' })
      }
    },
    onPaymentSuccess(payload) {
      this.paymentPending = false
      this.$emit('update:visible', false)
      this.successVisible = true
      this.$emit('payment-success', payload)
    },
    onFeedOrder() {
      this.successVisible = false
      this.$emit('feed-order')
    }
  }
}
</script>

<style lang="less" scoped>
.yfp-sheet {
  position: relative;
  width: 100%;
  height: 599px;
  box-sizing: border-box;
  overflow: hidden;
  background: #fff;
  border-radius: 20px 20px 0 0;
  color: #333;
  font-family: 'Source Han Sans CN', 'PingFang SC', sans-serif;
}

.yfp-close-hit {
  position: absolute;
  top: 0;
  right: 12px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.yfp-close {
  display: block;
}

.yfp-title {
  position: absolute;
  left: 25px;
  top: 23px;
  right: 46px;
  height: 24px;
  overflow: hidden;
  color: #333;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  white-space: nowrap;
}

.yfp-title-number {
  font-weight: 700;
}

.yfp-sub {
  position: absolute;
  left: 25px;
  color: #8b8b8b;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  white-space: nowrap;
}

.yfp-sub--first {
  top: 56px;
}

.yfp-sub--second {
  top: 74px;
}

.yfp-cards {
  position: absolute;
  left: 23px;
  top: 115px;
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.yfp-card-col {
  position: relative;
  flex: 0 0 94px;
  width: 94px;
  height: 119px;
}

.yfp-card {
  position: relative;
  width: 94px;
  height: 100px;
  box-sizing: border-box;
  border-radius: 20px;
  background: #f7f7f7;
}

.yfp-card--selected {
  margin-top: 4px;
  height: 96px;
  background: #ffe60f;
}

.yfp-card-top-row {
  position: absolute;
  inset: 0;
}

.yfp-card-icon {
  position: absolute;
  display: block;
}

.yfp-card-icon--a {
  left: 14px;
  top: 33px;
}

.yfp-card-icon--b {
  left: 14.5px;
  top: 24px;
}

.yfp-card-icon--c {
  left: 8px;
  top: 17px;
}

.yfp-card-weight {
  position: absolute;
  color: #333;
  font-size: 15px;
  font-weight: 500;
  line-height: 22px;
  white-space: nowrap;
}

.yfp-card-col--a .yfp-card-weight {
  left: 40px;
  top: 24px;
}

.yfp-card-col--b .yfp-card-weight {
  left: 52.5px;
  top: 24px;
}

.yfp-card-col--c .yfp-card-weight {
  left: 53px;
  top: 28px;
}

.yfp-card-price {
  position: absolute;
  top: 61px;
  left: 0;
  width: 94px;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  line-height: 13px;
  text-align: center;
  white-space: nowrap;
}

.yfp-card-feedback {
  position: absolute;
  top: 101px;
  left: 0;
  width: 94px;
  color: #666;
  font-size: 12px;
  font-weight: 400;
  line-height: 13px;
  text-align: center;
  white-space: nowrap;
}

.yfp-learn {
  position: absolute;
  top: 256px;
  left: 287px;
  display: flex;
  align-items: center;
  height: 18px;
  color: #a9a9a9;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
}

.yfp-learn .paw-icon {
  margin-left: 4px;
}

.yfp-rules {
  position: absolute;
  display: flex;
  flex-direction: column;
  top: 284px;
  left: 23px;
  width: 329px;
  height: 202px;
  margin: 0;
  overflow: hidden;
  color: #999;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  white-space: normal;
}

.yfp-rules-title,
.yfp-rule-line {
  display: block;
  flex: 0 0 auto;
}

.yfp-pay-btn {
  position: absolute;
  left: 25px;
  top: 511px;
  width: 325px;
  height: 47px;
  min-height: 47px;
  padding: 0;
  border-radius: 23.5px;
  box-sizing: border-box;
  white-space: nowrap;
}

.yfp-pay-amount {
  font-size: 24px;
  font-weight: 700;
  line-height: 36px;
}

.yfp-pay-unit,
.yfp-pay-copy {
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
}

.yfp-agree-row {
  position: absolute;
  top: 558px;
  left: 41px;
  display: flex;
  align-items: center;
  width: 290px;
  height: 36px;
}

.yfp-agree-text {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  white-space: nowrap;
}

.yfp-agree-plain,
.yfp-agree-link {
  font-size: 12px;
  line-height: 16px;
}

.yfp-agree-plain {
  color: #666;
}

.yfp-agree-link {
  color: #517ddb;
}
</style>
