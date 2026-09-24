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

<script lang="ts">
import { eventContract } from '@/utils/componentEvents.ts'

import { defineComponent, type PropType } from 'vue'

import { getAddressList } from '@/utils/addressMock.ts'
import type { AddressKind, AddressRecord } from '@/utils/addressMock.ts'
import { buildRoute } from '@/navigation/routeContracts.ts'

interface PawAddressPickerCardState {
  selectedAddress: AddressRecord | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizeAddress(value: unknown): AddressRecord | null {
  if (!isRecord(value) || value.id === undefined || value.id === null || String(value.id).trim() === '') return null
  return {
    ...value,
    id: String(value.id),
    name: typeof value.name === 'string' ? value.name : '',
    phone: typeof value.phone === 'string' ? value.phone : '',
    regionParts: Array.isArray(value.regionParts)
      ? value.regionParts.filter((part): part is string => typeof part === 'string')
      : [],
    detail: typeof value.detail === 'string' ? value.detail : '',
    isDefault: value.isDefault === true
  }
}

export default defineComponent({
  name: 'PawAddressPickerCard',
  props: {
    kind: { type: String, default: 'shipping' },
		address: { type: Object as PropType<AddressRecord | null>, default: null },
    returnUrl: { type: String, default: '' },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '不对外展示，可放心填写' },
    backgroundColor: { type: String, default: '#fff' },
    useDefaultAddress: { type: Boolean, default: true },
    requestId: { type: String, default: 'address-picker' }
  },
  emits: {
    'select': eventContract<[address: AddressRecord]>(),
  },
	data(): PawAddressPickerCardState {
    return { selectedAddress: null }
  },
  computed: {
		normalizedKind(): AddressKind { return this.kind === 'service' ? 'service' : 'shipping' },
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
        ? getAddressList(this.normalizedKind).find((item) => item.isDefault) || null
        : null)
    },
    openAddressList() {
      const returnUrl = this.returnUrl || ''
      const params: Record<string, string> = {
        kind: this.normalizedKind,
        intent: 'select',
        requestId: this.requestId,
      }
      if (this.selectedAddress && this.selectedAddress.id) params.addressId = String(this.selectedAddress.id)
      const route = buildRoute('address.list', params)
      const query = `${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ''}`
      uni.navigateTo({
        url: route + query,
        events: {
          addressPicked: (payload: unknown = {}) => {
            const address = normalizeAddress(payload)
            if (!address) return
            this.selectedAddress = address
            this.$emit('select', this.selectedAddress)
          }
        }
      })
    }
  }
})
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
