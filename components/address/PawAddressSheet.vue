<template>
  <PawBottomSheet v-model="visibleProxy" variant="address-form" height="82vh" :close-on-mask="true" :safe-area="true"
    :z-index="10030">
    <view class="address-sheet" data-qa="address-form-sheet">
      <view class="address-sheet__header">
        <text class="address-sheet__title">{{ `${editing ? '修改' : '添加'}${kindLabel}地址` }}</text>
        <view class="address-sheet__close" data-qa="address-form-close" @tap="close">
          <PawIcon name="navigation/close" :size="18" label="关闭" />
        </view>
      </view>
      <view class="address-sheet__form">
        <PawAddressForm style="display:flex;width:100%;height:100%;min-height:0;" :kind="kind"
          :initial-address="initialAddress" :embedded="true" @save="onSave" />
      </view>
    </view>
  </PawBottomSheet>
</template>

<script>
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawAddressForm from '@/components/address/PawAddressForm.vue'

export default {
  name: 'PawAddressSheet',
  components: { PawBottomSheet, PawIcon, PawAddressForm },
  props: {
    modelValue: { type: Boolean, default: false },
    kind: { type: String, default: 'shipping' },
    initialAddress: { type: Object, default: () => ({}) }
  },
  emits: ['update:modelValue', 'save'],
  computed: {
    visibleProxy: {
      get() { return this.modelValue },
      set(value) { this.$emit('update:modelValue', value) }
    },
    kindLabel() { return this.kind === 'service' ? '服务' : '收货' },
    editing() { return !!(this.initialAddress && this.initialAddress.id) }
  },
  methods: {
    close() { this.visibleProxy = false },
    onSave(address) { this.$emit('save', address) }
  }
}
</script>

<style scoped>
.address-sheet {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 82vh;
  min-height: 0;
  background: #f5f5f5;
}

.address-sheet__header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 15px;
  background: #f5f5f5;
  box-sizing: border-box;
}

.address-sheet__title {
  color: #222;
  font-size: 17px;
  font-weight: 500;
  line-height: 24px;
}

.address-sheet__close {
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
}

.address-sheet__form {
  flex: 1 1 auto;
  min-height: 0;
  height: 0;
}
</style>
