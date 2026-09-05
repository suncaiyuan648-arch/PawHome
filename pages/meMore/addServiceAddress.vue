<template>
  <view class="address-edit-page">
    <PawAddressForm ref="addressForm" kind="service" :typing="typing" :initial-address="initialAddress"
      @save="onSave" />

    <PawFixedActionBar :primary-action="primaryAction" :primary-full-width="true" @primary="submit" />
  </view>
</template>

<script>
import PawAddressForm from '@/components/address/PawAddressForm.vue'
import PawFixedActionBar from '@/components/layout/PawFixedActionBar.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { getAddressById, saveAddress } from '@/utils/addressMock.js'

export default {
  name: 'AddServiceAddressPage',
  components: { PawAddressForm, PawFixedActionBar },
  data() {
    return {
      typing: false,
      initialAddress: {}
    }
  },
  onLoad(options = {}) {
    this.typing = options.state === 'typing'
    if (options.id) this.initialAddress = getAddressById(options.id, 'service') || {}
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
      const saved = saveAddress({ ...address, id: this.initialAddress.id || undefined }, 'service')
      const channel = this.getOpenerEventChannel && this.getOpenerEventChannel()
      if (channel && channel.emit) channel.emit('addressSaved', saved)
      uni.showToast({ title: '已保存', icon: 'none' })
      setTimeout(() => goBackSmart({
        fallbackUrl: '/pages/meMore/shippingAddress',
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
