<template>
  <PawFeedingDetailFigma :variant="92" :order-id="orderId" :record-id="recordId" :delivery-status="deliveryStatus"
    :delivery-progress="deliveryProgress" />
</template>
<script>
import PawFeedingDetailFigma from '@/components/PawFeedingDetailFigma.vue'
import { getRewardOrderById } from '@/utils/applicationMockApi.js'
export default {
  components: { PawFeedingDetailFigma },
  data() { return { orderId: '', recordId: '', deliveryStatus: 'shipping', deliveryProgress: '0/3' } },
  onLoad(options = {}) {
    this.orderId = String(options.orderId || '')
    this.recordId = String(options.recordId || options.id || '')
    const orderResult = this.orderId ? getRewardOrderById(this.orderId) : null
    const order = orderResult && orderResult.success ? orderResult.data : null
    this.deliveryStatus = String(options.deliveryStatus || (order && order.deliveryStatus) || 'shipping')
    this.deliveryProgress = String(options.deliveryProgress || (order && order.deliveryProgress) || '0/3')
  }
}
</script>
