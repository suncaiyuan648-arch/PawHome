<template>
  <PawAdoptionProofForm :rescue-id="rescueId" @submitted="onSubmitted" />
</template>

<script>
import PawAdoptionProofForm from '@/components/PawAdoptionProofForm.vue'

function decodeValue(value) {
  if (value === undefined || value === null) return ''
  try { return decodeURIComponent(String(value)) } catch (e) { return String(value) }
}

export default {
  components: { PawAdoptionProofForm },
  data() { return { rescueId: '' } },
  onLoad(options = {}) {
    const source = decodeValue(options.source || options.sourceType)
    if (source !== 'rescue') {
      uni.showToast({ title: '当前页面仅支持救助证实', icon: 'none' })
      uni.navigateBack()
      return
    }
    this.rescueId = decodeValue(options.rescueId || options.id || options.recordId)
  },
  methods: {
    onSubmitted() {
      const id = encodeURIComponent(this.rescueId)
      uni.redirectTo({ url: `/pages/meMore/rescueProofList?source=rescue&rescueId=${id}&id=${id}` })
    }
  }
}
</script>
