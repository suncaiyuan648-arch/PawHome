<template>
  <PawAddressForm kind="service" :typing="typing" :initial-address="initialAddress" @save="onSave" />
</template>
<script>
import PawAddressForm from '@/components/address/PawAddressForm.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { getAddressById, saveAddress } from '@/utils/addressMock.js'
export default {
  components: { PawAddressForm },
  data() { return { typing: false, initialAddress: {} } },
  onLoad(options = {}) { this.typing = options.state === 'typing'; if (options.id) this.initialAddress = getAddressById(options.id, 'service') || {} },
  methods: {
    onSave(address) {
      const saved = saveAddress({ ...address, id: this.initialAddress.id || undefined }, 'service')
      const channel = this.getOpenerEventChannel && this.getOpenerEventChannel()
      if (channel && channel.emit) channel.emit('addressSaved', saved)
      uni.showToast({ title: '已保存', icon: 'none' })
      setTimeout(() => goBackSmart({ fallbackUrl: '/pages/meMore/shippingAddress', fallbackLaunch: 'redirectTo' }), 120)
    }
  }
}
</script>
