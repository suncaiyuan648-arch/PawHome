<template><PawAdoptionFlowFigma :frame="frameNumber" /></template>

<script>
import PawAdoptionFlowFigma from '@/components/PawAdoptionFlowFigma.vue'
export default {
  components: { PawAdoptionFlowFigma },
  data() { return { frame: 44 } },
  computed: { frameNumber() { return parseInt(this.frame, 10) || 44 } },
  onLoad(options) {
    let value = Number(options && options.frame)
    // H5 刷新子包路由时，查询参数有时只保留在 hash 中。
    // #ifdef H5
    if ((!value || value < 44 || value > 57) && typeof window !== 'undefined') {
      const match = window.location.hash.match(/[?&]frame=(\d+)/)
      if (match) value = Number(match[1])
    }
    // #endif
    if (value >= 44 && value <= 57) this.frame = value
  }
}
</script>
