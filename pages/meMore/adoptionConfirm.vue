<template>
  <PawAdoptionEvidence mode="confirm" :record-id="recordId" @submitted="onSubmitted" />
</template>
<script>
import PawAdoptionEvidence from '@/components/PawAdoptionEvidence.vue'
import { getLastAdoptionId } from '@/utils/adoptionStorage.js'
export default {
  components: { PawAdoptionEvidence },
  data() { return { recordId: '' } },
  onLoad(options = {}) { this.recordId = options.id || options.recordId || getLastAdoptionId() },
  methods: {
    onSubmitted() {
      const query = this.recordId ? `?variant=84&id=${encodeURIComponent(this.recordId)}` : '?variant=84'
      uni.redirectTo({ url: `/pages/adoption/result${query}` })
    }
  }
}
</script>
