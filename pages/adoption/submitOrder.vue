<template>
  <view class="order-page">
    <PawRewardOrderSheet v-model="sheetVisible" :record-id="recordId" @submitted="onSubmitted"
      @closed="onSheetClosed" />
  </view>
</template>

<script>
import PawRewardOrderSheet from '@/components/adoption/PawRewardOrderSheet.vue'
import { getLastAdoptionId } from '@/utils/adoptionStorage.js'

export default {
  components: { PawRewardOrderSheet },
  data() {
    return { sheetVisible: true, recordId: '', submittedPayload: null }
  },
  onLoad(options = {}) {
    this.recordId = String(options.recordId || options.id || getLastAdoptionId() || '')
  },
  methods: {
    onSubmitted(payload) { this.submittedPayload = payload },
    onSheetClosed() {
      if (this.submittedPayload && this.submittedPayload.order) {
        const orderId = encodeURIComponent(this.submittedPayload.order.id)
        const recordId = encodeURIComponent(this.submittedPayload.recordId || this.recordId)
        this.submittedPayload = null
        uni.redirectTo({ url: `/pages/adoption/result?variant=80&id=${recordId}&orderId=${orderId}` })
        return
      }
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.order-page {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
}
</style>
