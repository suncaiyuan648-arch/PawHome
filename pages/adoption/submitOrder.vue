<template>
  <view class="order-page">
    <PawBottomSheet v-model="sheetVisible" variant="order-address" height="495px" :close-on-mask="true"
      :safe-area="false" :z-index="10060" @after-close="goBack">
      <view class="order-sheet" @tap.stop>
        <view class="close" data-qa="submit-order-close" @tap="closeSheet">
          <PawIcon name="navigation/close" :size="16" label="关闭" />
        </view>
        <text class="eyebrow">百位审查官中超90%认为您的领养为真</text>
        <text class="headline">恭喜您，抽中[逢猫]猫粮5斤!</text>
        <text class="section-title">填写您的收货地址</text>
        <view class="address-row" @tap="addAddress">
          <view class="pin">
            <image class="pin-icon" src="/static/figma/create-yard/address-pin.png" mode="aspectFit" />
          </view>
          <view class="address-copy"><text>请填写收货地址，用于接收奖励</text><text>不对外展示，可放心填写</text></view>
          <text class="add">添加 ›</text>
        </view>
        <text class="hint">提交后地址不可修改，请谨慎填写</text>
        <view class="submit" @tap="submit"><text>提交订单</text></view>
      </view>
    </PawBottomSheet>
  </view>
</template>

<script>
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'

export default {
  components: { PawBottomSheet, PawIcon },
  data() {
    return { sheetVisible: true }
  },
  methods: {
    closeSheet() { this.sheetVisible = false },
    goBack() { uni.navigateBack() },
    addAddress() { uni.navigateTo({ url: '/pages/meMore/addShippingAddress' }) },
    submit() { uni.navigateTo({ url: '/pages/adoption/result?variant=80' }) },
  },
}
</script>

<style scoped>
.order-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.order-sheet {
  position: relative;
  width: 100%;
  height: 495px;
  padding: 28px 10px 0;
  box-sizing: border-box;
}

.close {
  position: absolute;
  right: 20px;
  top: 13px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eyebrow {
  display: block;
  margin-left: 49px;
  font-size: 14px;
  line-height: 20px;
  color: #333;
}

.headline {
  display: block;
  margin: 7px 0 0 49px;
  font-size: 19px;
  line-height: 26px;
  font-weight: 700;
  color: #222;
}

.section-title {
  display: block;
  margin: 46px 0 15px 16px;
  font-size: 15px;
  color: #333;
}

.address-row {
  height: 67px;
  border-radius: 20px;
  background: #f7f7f7;
  display: flex;
  align-items: center;
  padding: 0 12px 0 16px;
  box-sizing: border-box;
}

.pin {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.pin-icon {
  width: 18px;
  height: 18px;
}

.address-copy {
  margin-left: 11px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}

.address-copy text:first-child {
  font-size: 13px;
  color: #333;
}

.address-copy text:last-child {
  font-size: 12px;
  color: #aaa;
}

.add {
  font-size: 12px;
  color: #ff7b2f;
}

.hint {
  display: block;
  margin: 13px 0 0 16px;
  font-size: 11px;
  color: #aaa;
}

.submit {
  position: absolute;
  left: 15px;
  right: 15px;
  bottom: 43px;
  height: 47px;
  border-radius: 24px;
  background: #ffe000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit text {
  font-size: 15px;
  color: #222;
}
</style>
