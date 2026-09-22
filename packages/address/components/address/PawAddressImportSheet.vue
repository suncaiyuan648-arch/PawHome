<template>
  <PawBottomSheet v-model="visibleProxy" variant="address-import" :height="sheetHeight" :close-on-mask="true"
    :safe-area="true" :z-index="10050">
    <view class="address-import-sheet" :class="`address-import-sheet--${mode}`" data-qa="address-import-sheet">
      <view class="address-import-sheet__header">
        <text class="address-import-sheet__title">{{ mode === 'service' ? '选择服务地址' : '从微信地址导入' }}</text>
        <PawIcon class="address-import-sheet__close" name="navigation/close" :size="16" label="关闭" @tap.stop="close" />
      </view>

      <scroll-view v-if="mode === 'service'" class="address-import-sheet__list" scroll-y :show-scrollbar="false">
        <view v-for="(address, index) in normalizedAddresses" :key="address.id || index"
          class="address-import-sheet__item" :data-qa="`service-address-item-${index}`"
          @tap.stop="selectServiceAddress(address)">
          <view class="address-import-sheet__pin">
            <uni-icons type="location-filled" color="#ff7a33" :size="18" />
          </view>
          <view class="address-import-sheet__copy">
            <view class="address-import-sheet__identity">
              <text class="address-import-sheet__name">{{ address.name }}</text>
              <text class="address-import-sheet__phone">{{ address.phone }}</text>
            </view>
            <text class="address-import-sheet__detail">{{ formatDetail(address) }}</text>
          </view>
          <PawIcon class="address-import-sheet__arrow" name="navigation/chevron-right" :size="16" flip="horizontal" />
        </view>
        <view v-if="!normalizedAddresses.length" class="address-import-sheet__empty">
          <text>暂无服务地址，请先添加服务地址</text>
        </view>
      </scroll-view>

      <view v-else class="address-import-sheet__wechat">
        <text class="address-import-sheet__wechat-copy">将从微信收货地址中读取联系人、手机号和详细地址，确认后自动回填。</text>
        <view class="address-import-sheet__wechat-button" data-qa="address-wechat-request"
          @tap.stop="requestWechatAddress">
          <text>从微信地址获取</text>
        </view>
      </view>
    </view>
  </PawBottomSheet>
</template>

<script>
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'

export default {
  name: 'PawAddressImportSheet',
  components: { PawBottomSheet, PawIcon },
  props: {
    visible: { type: Boolean, default: false },
    mode: { type: String, default: 'service' },
    addresses: { type: Array, default: () => [] }
  },
  emits: ['update:visible', 'select', 'request-wechat'],
  computed: {
    visibleProxy: {
      get() { return this.visible },
      set(value) { this.$emit('update:visible', value) }
    },
    sheetHeight() {
      return this.mode === 'service' ? '420px' : '260px'
    },
    normalizedAddresses() {
      return Array.isArray(this.addresses) ? this.addresses : []
    }
  },
  methods: {
    formatDetail(address = {}) {
      return [...(address.regionParts || []), address.detail || ''].filter(Boolean).join(' ')
    },
    close() {
      this.visibleProxy = false
    },
    selectServiceAddress(address) {
      this.$emit('select', address)
      this.visibleProxy = false
    },
    requestWechatAddress() {
      this.$emit('request-wechat')
    }
  }
}
</script>

<style scoped>
.address-import-sheet {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  box-sizing: border-box;
  background: #fff;
}

.address-import-sheet__header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  padding: 0 20px;
  box-sizing: border-box;
}

.address-import-sheet__title {
  color: #222;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
}

.address-import-sheet__close {
  display: flex;
  flex: 0 0 auto;
}

.address-import-sheet__list {
  flex: 1 1 auto;
  min-height: 0;
  padding: 0 15px 10px;
  box-sizing: border-box;
}

.address-import-sheet__item {
  display: flex;
  min-height: 72px;
  align-items: center;
  gap: 10px;
  padding: 10px 5px;
  border-bottom: 1px solid #f0f0f0;
  box-sizing: border-box;
}

.address-import-sheet__pin {
  display: flex;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
}

.address-import-sheet__copy {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 5px;
}

.address-import-sheet__identity {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.address-import-sheet__name,
.address-import-sheet__phone,
.address-import-sheet__detail {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.address-import-sheet__name {
  color: #333;
  font-size: 15px;
  font-weight: 500;
  line-height: 20px;
}

.address-import-sheet__phone,
.address-import-sheet__detail {
  color: #888;
  font-size: 12px;
  line-height: 18px;
}

.address-import-sheet__arrow {
  display: flex;
  flex: 0 0 auto;
}

.address-import-sheet__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: #999;
  font-size: 13px;
}

.address-import-sheet__wechat {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 20px;
  padding: 0 20px 24px;
  box-sizing: border-box;
}

.address-import-sheet__wechat-copy {
  color: #777;
  font-size: 14px;
  line-height: 22px;
}

.address-import-sheet__wechat-button {
  display: flex;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  background: #ffe600;
}

.address-import-sheet__wechat-button text {
  color: #222;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}
</style>
