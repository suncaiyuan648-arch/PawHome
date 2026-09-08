<template>
  <view class="paw-address-picker" :class="{ 'is-picked': Boolean(selectedAddress) }"
    :style="{ backgroundColor: backgroundColor }" @tap="openAddressList">
    <view class="paw-address-picker__icon">
      <image class="paw-address-picker__icon-circle" src="/static/figma/create-yard/address-pin-circle.svg"
        mode="aspectFit" />
      <image class="paw-address-picker__icon-pin" src="/static/figma/create-yard/address-pin.png" mode="aspectFit" />
    </view>
    <view class="paw-address-picker__main">
      <view class="paw-address-picker__line">
        <text class="paw-address-picker__title">{{ selectedAddress ? addressDetail : emptyTitle }}</text>
        <view class="paw-address-picker__action">
          <text>{{ selectedAddress ? '修改' : '添加' }}</text>
          <image src="/static/figma/create-yard/arrow-right.svg" mode="aspectFit" />
        </view>
      </view>
      <text class="paw-address-picker__sub">{{ selectedAddress ? selectedAddress.name + ' ' + selectedAddress.phone :
        emptySubtitle }}</text>
    </view>
  </view>
</template>

<script>
import { getAddressList } from '@/utils/addressMock.js'

export default {
  name: 'PawAddressPickerCard',
  props: {
    kind: { type: String, default: 'shipping' },
    address: { type: Object, default: null },
    returnUrl: { type: String, default: '' },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '不对外展示，可放心填写' },
    backgroundColor: { type: String, default: '#fff' },
    useDefaultAddress: { type: Boolean, default: true }
  },
  emits: ['select'],
  data() {
    return { selectedAddress: null }
  },
  computed: {
    normalizedKind() { return this.kind === 'service' ? 'service' : 'shipping' },
    emptyTitle() {
      if (this.title) return this.title
      return this.normalizedKind === 'service' ? '请填写服务地址' : '请填写收货地址，用于接收猫粮'
    },
    emptySubtitle() { return this.subtitle },
    addressDetail() {
      if (!this.selectedAddress) return ''
      return [...(this.selectedAddress.regionParts || []), this.selectedAddress.detail || ''].filter(Boolean).join(' ')
    }
  },
  watch: {
    address: { deep: true, handler() { this.syncAddress() } },
    kind() { this.syncAddress() }
  },
  created() { this.syncAddress() },
  methods: {
    syncAddress() {
      this.selectedAddress = this.address || (this.useDefaultAddress
        ? getAddressList(this.normalizedKind).find(item => item.isDefault) || null
        : null)
    },
    openAddressList() {
      const selectedId = this.selectedAddress && this.selectedAddress.id
        ? `&selectedId=${encodeURIComponent(this.selectedAddress.id)}`
        : ''
      const returnUrl = this.returnUrl || ''
      uni.navigateTo({
        url: `/pages/meMore/shippingAddress?kind=${this.normalizedKind}&pick=1${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ''}${selectedId}`,
        events: {
          addressPicked: (payload = {}) => {
            if (!payload || !payload.id) return
            this.selectedAddress = { ...payload, id: String(payload.id) }
            this.$emit('select', this.selectedAddress)
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.paw-address-picker {
  display: flex;
  width: 100%;
  height: 68px;
  align-items: center;
  box-sizing: border-box;
  padding: 0 8px 0 6px;
  border-radius: 20px;
  background: #fff;
}

.paw-address-picker__icon {
  position: relative;
  display: flex;
  flex: 0 0 35px;
  width: 35px;
  height: 35px;
  align-items: center;
  justify-content: center;
}

.paw-address-picker__icon-circle {
  display: block;
  width: 35px;
  height: 35px;
}

.paw-address-picker__icon-pin {
  position: absolute;
  top: 8px;
  left: 8px;
  display: block;
  width: 20px;
  height: 19px;
}

.paw-address-picker__main {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  flex-direction: column;
  margin-left: 13px;
}

.paw-address-picker__line {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
}

.paw-address-picker__title {
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paw-address-picker__sub {
  display: block;
  margin-top: 2px;
  overflow: hidden;
  color: #999;
  font-size: 13px;
  line-height: 19px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paw-address-picker__action {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 2px;
  margin-left: 8px;
  color: #fd6302;
  font-size: 13px;
  line-height: 20px;
}

.paw-address-picker__action image {
  display: block;
  width: 16px;
  height: 16px;
}
</style>
