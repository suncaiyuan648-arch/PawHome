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
      uni.redirectTo({ url: `/pages/adoption/result?variant=84&id=${encodeURIComponent(this.recordId)}` })
    }
  }
}
</script>
