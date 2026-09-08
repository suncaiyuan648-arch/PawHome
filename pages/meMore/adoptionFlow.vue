<template>
  <PawApplicantRescueFlow v-if="applicationType === 'rescue'" :rescue-id="applicationId" />
  <PawAdoptionFlowFigma v-else :frame="frame" :record-id="applicationId" :open-contact="openContact" />
</template>

<script>
import PawAdoptionFlowFigma from '@/components/PawAdoptionFlowFigma.vue'
import PawApplicantRescueFlow from '@/components/PawApplicantRescueFlow.vue'
export default {
  components: { PawAdoptionFlowFigma, PawApplicantRescueFlow },
  data() { return { frame: '', applicationId: '', applicationType: 'adoption', openContact: false } },
  onLoad(options) {
    const source = String(options && (options.type || options.source || options.sourceType) || '').toLowerCase()
    this.applicationType = source === 'rescue' ? 'rescue' : 'adoption'
    this.applicationId = this.applicationType === 'rescue'
      ? (options && (options.rescueId || options.id || options.recordId) || '')
      : (options && (options.id || options.recordId) || '')
    this.openContact = options && options.popup === 'contact'
    let value = Number(options && options.frame)
    // H5 刷新子包路由时，查询参数有时只保留在 hash 中。
    // #ifdef H5
    if ((!value || value < 44 || value > 57) && typeof window !== 'undefined') {
      const match = window.location.hash.match(/[?&]frame=(\d+)/)
      if (match) value = Number(match[1])
    }
    // #endif
    if (value >= 44 && value <= 57) this.frame = value
    if (options && options.notice === 'order-detail-pending') {
      setTimeout(() => uni.showToast({ title: '待接入订单详情页', icon: 'none' }), 180)
    }
  }
}
</script>
