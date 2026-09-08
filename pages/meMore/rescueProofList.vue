<template>
  <PawAdoptionEvidence mode="list" source="rescue" source-type="rescue" :rescue-id="rescueId" />
</template>

<script>
import PawAdoptionEvidence from '@/components/PawAdoptionEvidence.vue'

// 救助证实列表独立于领养审核页，不复用领养审核路由。

function decodeValue(value) {
  if (value === undefined || value === null) return ''
  try { return decodeURIComponent(String(value)) } catch (e) { return String(value) }
}

export default {
  components: { PawAdoptionEvidence },
  data() { return { rescueId: '' } },
  onLoad(options = {}) {
    const source = decodeValue(options.source || options.sourceType)
    if (source !== 'rescue') {
      uni.showToast({ title: '当前页面仅支持救助证实', icon: 'none' })
      uni.navigateBack()
      return
    }
    this.rescueId = decodeValue(options.rescueId || options.id || options.recordId)
  }
}
</script>
