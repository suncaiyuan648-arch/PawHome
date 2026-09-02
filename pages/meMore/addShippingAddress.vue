<template>
  <view v-if="state === 'select'" class="select-page">
    <view class="select-nav">
      <view class="back" @click="goBack">
        <image src="/static/nav-back-arrow.png" mode="aspectFit" />
      </view>
    </view>
    <view class="select-body">
      <text class="section-title">原地址</text>
      <view class="origin-card">
        <view class="pin"><uni-icons type="location-filled" color="#ff851b" :size="19" /></view>
        <view class="address-main">
          <view class="name-line"><text>项子涵</text><text>13366669999</text><text class="default-tag">默认</text></view>
          <text class="address-copy">湖南省 长沙市 雨花区 中意一路167号鼎丰前城2栋2单元18楼天台</text>
        </view>
      </view>
      <text class="section-title new-title">选择新的收货地址</text>
      <view v-for="(item, index) in addresses" :key="index" class="address-card" @click="selected = index">
        <view class="radio" :class="{ selected: selected === index }"><text v-if="selected === index">✓</text></view>
        <view class="address-main">
          <view class="name-line"><text>项子涵</text><text>13366669999</text></view><text class="address-copy">湖南省 长沙市 雨花区
            中意一路167号鼎丰前城2栋2单元18楼天台</text>
        </view><uni-icons type="compose" color="#777" :size="16" />
      </view>
    </view>
    <view class="select-footer">
      <view class="add-button"><text class="add-mark">┘</text><text>添加收货地址</text></view>
    </view>
  </view>
  <PawAddressForm v-else kind="shipping" :typing="typing" :initial-address="initialAddress" @save="onSave" />
</template>
<script>
import PawAddressForm from '@/components/address/PawAddressForm.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { getAddressById, saveAddress } from '@/utils/addressMock.js'
export default {
  components: { PawAddressForm },
  data() { return { typing: false, state: 'form', selected: 1, addresses: [1, 2, 3], pickMode: false, initialAddress: {} } },
  onLoad(options = {}) {
    this.typing = options.state === 'typing'
    this.state = options.state === 'select' ? 'select' : 'form'
    this.pickMode = options.pick === '1' || options.pick === 1
    if (options.id) this.initialAddress = getAddressById(options.id, 'shipping') || {}
  },
  methods: {
    goBack() { goBackSmart({ fallbackUrl: '/pages/meMore/shippingAddress' }) },
    onSave(address) {
      const saved = saveAddress({ ...address, id: this.initialAddress.id || undefined }, 'shipping')
      const channel = this.getOpenerEventChannel && this.getOpenerEventChannel()
      if (channel && channel.emit) channel.emit('addressSaved', saved)
      uni.showToast({ title: '已保存', icon: 'none' })
      setTimeout(() => goBackSmart({ fallbackUrl: '/pages/meMore/shippingAddress', fallbackLaunch: 'redirectTo' }), 120)
    }
  }
}
</script>
<style scoped>
.select-page {
  min-height: 100vh;
  background: #f5f5f5;
  color: #222;
  box-sizing: border-box;
  padding-top: 44px;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif
}

.select-nav {
  height: 44px;
  display: flex;
  align-items: center
}

.back {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center
}

.back image {
  width: 10px;
  height: 18px
}

.select-body {
  padding: 0 15px 118px
}

.section-title {
  display: block;
  margin: 4px 2px 22px;
  font-size: 17px;
  font-weight: 700
}

.origin-card,
.address-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 14px;
  box-sizing: border-box
}

.origin-card {
  height: 90px;
  padding: 15px 14px
}

.pin {
  width: 36px;
  height: 36px;
  margin-right: 12px;
  border-radius: 18px;
  background: #fff2e5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none
}

.address-main {
  flex: 1;
  min-width: 0
}

.name-line {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 14px;
  line-height: 20px
}

.name-line text:first-child {
  font-weight: 500
}

.default-tag {
  padding: 0 3px;
  border: 1px solid #ffe000;
  border-radius: 3px;
  color: #c5a600;
  font-size: 10px;
  line-height: 15px
}

.address-copy {
  display: block;
  margin-top: 3px;
  color: #999;
  font-size: 12px;
  line-height: 15px
}

.new-title {
  margin-top: 42px;
  margin-bottom: 22px
}

.address-card {
  height: 90px;
  margin-bottom: 10px;
  padding: 15px 14px
}

.radio {
  width: 20px;
  height: 20px;
  margin-right: 16px;
  border: 1px solid #d8d8d8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex: none
}

.radio.selected {
  background: #ffe000;
  border-color: #ffe000;
  color: #111;
  font-size: 14px;
  font-weight: 700
}

.select-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 114px;
  padding: 8px 15px 0;
  background: #fff;
  box-sizing: border-box
}

.add-button {
  height: 46px;
  border-radius: 23px;
  background: #ffe000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700
}

.add-mark {
  margin-right: 8px;
  font-size: 23px;
  transform: rotate(90deg)
}
</style>
