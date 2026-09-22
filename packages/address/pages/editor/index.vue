<template>
  <view class="address-edit-page">
    <PawAddressForm ref="addressForm" :kind="kind" :typing="typing" :initial-address="initialAddress"
      @save="onSave" />

    <PawFixedActionBar :primary-action="primaryAction" :primary-full-width="true" @primary="submit" />
  </view>
</template>

<script>
import PawAddressForm from '../../components/address/PawAddressForm.vue'
import PawFixedActionBar from '@/components/layout/PawFixedActionBar.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { getAddressById, saveAddress } from '@/utils/addressMock.js'

export default {
  name: 'AddressEditorPage',
  components: { PawAddressForm, PawFixedActionBar },
  data() {
    return {
      kind: 'shipping',
      typing: false,
      initialAddress: {}
    }
  },
  onLoad(options = {}) {
    this.kind = options.kind === 'service' ? 'service' : 'shipping'
    this.typing = options.state === 'typing'
    if (options.id || options.addressId) this.initialAddress = getAddressById(options.id || options.addressId, this.kind) || {}
  },
  computed: {
    primaryAction() {
      return { key: 'save', qa: 'address-save', label: '保存', size: 'md' }
    }
  },
  methods: {
    submit() {
      if (this.$refs.addressForm && typeof this.$refs.addressForm.save === 'function') {
        this.$refs.addressForm.save()
      }
    },
    onSave(address) {
      const saved = saveAddress({ ...address, id: this.initialAddress.id || undefined }, this.kind)
      const channel = this.getOpenerEventChannel && this.getOpenerEventChannel()
      if (channel && channel.emit) channel.emit('addressSaved', saved)
      uni.showToast({ title: '已保存', icon: 'none' })
      setTimeout(() => goBackSmart({
        fallbackUrl: `/packages/address/pages/list/index?kind=${encodeURIComponent(this.kind)}`,
        fallbackLaunch: 'redirectTo'
      }), 120)
    }
  }
}
</script>

<style scoped>
.address-edit-page {
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  background: #f5f5f5;
}
</style>
