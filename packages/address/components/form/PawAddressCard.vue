<template>
  <view class="paw-address-card" :class="'paw-address-card--' + mode" @tap.stop="onCardTap">
    <view class="paw-address-card__main">
      <image class="paw-address-card__map" src="/static/figma/address/location.svg" mode="aspectFit" />

      <view class="paw-address-card__body">
        <view class="paw-address-card__top">
          <text class="paw-address-card__name">{{ address.name }}</text>
          <text class="paw-address-card__phone">{{ address.phone }}</text>
          <view class="paw-address-card__default-slot" :class="{ 'is-hidden': !address.isDefault }" aria-hidden="true">
            <text>默认</text>
          </view>
        </view>
        <text class="paw-address-card__detail">{{ displayDetail }}</text>
      </view>

      <!-- Keep this column in every state so display/manage transitions do not reflow the address text. -->
      <view class="paw-address-card__edit" :data-qa="'address-edit-' + (address.id || '')" @tap.stop="onEdit">
        <uni-icons v-if="mode !== 'manage'" type="compose" color="#999999" :size="20" />
      </view>
    </view>

    <view v-if="mode === 'manage'" class="paw-address-card__manage">
      <view class="paw-address-card__divider"></view>
      <view class="paw-address-card__manage-main">
        <view class="paw-address-card__default-switch" :data-qa="'address-default-' + (address.id || '')"
          @tap.stop="onSetDefault">
          <PawCheckbox :model-value="!!address.isDefault" @change="onSetDefault" />
          <text class="paw-address-card__default-label">{{ defaultLabel }}</text>
        </view>
        <view class="paw-address-card__delete" :data-qa="'address-delete-' + (address.id || '')" @tap.stop="onDelete">
          <uni-icons type="trash" color="#c8c8c8" :size="18" />
          <text>删除</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import PawCheckbox from '@/components/base/PawCheckbox.vue'

export default {
  name: 'PawAddressCard',
  components: { PawCheckbox },
  props: {
    address: { type: Object, default: () => ({}) },
    mode: {
      type: String,
      default: 'display',
      validator: value => ['display', 'manage', 'select'].includes(value)
    },
    defaultLabel: { type: String, default: '默认收货地址' }
  },
  emits: ['click', 'edit', 'select', 'set-default', 'delete'],
  computed: {
    displayDetail() {
      return [...(this.address.regionParts || []), this.address.detail || ''].filter(Boolean).join(' ')
    }
  },
  methods: {
    onCardTap() {
      if (this.mode === 'select') return this.$emit('select', this.address)
      this.$emit('click', this.address)
    },
    onEdit() {
      if (this.mode !== 'manage') this.$emit('edit', this.address)
    },
    onSetDefault() {
      this.$emit('set-default', this.address.id)
    },
    onDelete() {
      this.$emit('delete', this.address.id)
    }
  }
}
</script>

<style scoped>
.paw-address-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: 8px;
  border-radius: 15px;
  background: #fff;
  box-sizing: border-box;
}

.paw-address-card__main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 17px 12px;
  box-sizing: border-box;
}

.paw-address-card__map {
  flex: 0 0 35px;
  width: 35px;
  height: 35px;
}

.paw-address-card__body {
  flex: 1 1 auto;
  min-width: 0;
  align-self: center;
}

.paw-address-card__top {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  min-height: 19px;
}

.paw-address-card__name,
.paw-address-card__phone {
  flex: 0 0 auto;
  color: #333;
  font-size: 14px;
  line-height: 20px;
  white-space: nowrap;
}

.paw-address-card__name {
  font-weight: 700;
}

.paw-address-card__phone {
  font-weight: 400;
}

.paw-address-card__default-slot {
  display: flex;
  flex: 0 0 26px;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 19px;
  border: 1px solid #f2c94c;
  border-radius: 3px;
  box-sizing: border-box;
}

.paw-address-card__default-slot text {
  color: #d49420;
  font-size: 10px;
  line-height: 12px;
  white-space: nowrap;
}

.paw-address-card__default-slot.is-hidden {
  visibility: hidden;
}

.paw-address-card__detail {
  display: block;
  max-width: 100%;
  margin-top: 4px;
  color: #8e8e8e;
  font-size: 12px;
  line-height: 18px;
  white-space: normal;
  overflow-wrap: break-word;
  word-break: break-all;
}

.paw-address-card__edit {
  display: flex;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  width: 24px;
  min-height: 35px;
  box-sizing: border-box;
}

.paw-address-card__manage {
  padding: 0 12px;
  box-sizing: border-box;
}

.paw-address-card__divider {
  height: 1px;
  background: #eeeeee;
}

.paw-address-card__manage-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 46px;
}

.paw-address-card__default-switch,
.paw-address-card__delete {
  display: inline-flex;
  align-items: center;
}

.paw-address-card__default-switch {
  min-width: 0;
}

.paw-address-card__default-label {
  color: #9a9a9a;
  font-size: 13px;
  line-height: 18px;
  white-space: nowrap;
}

.paw-address-card__delete {
  flex: 0 0 auto;
  color: #c8c8c8;
  font-size: 11px;
  line-height: 16px;
}

.paw-address-card__delete text {
  margin-left: 6px;
}
</style>
