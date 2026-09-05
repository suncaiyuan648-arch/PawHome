<template>
  <PawAdoptionEvidence mode="list" :record-id="recordId" :source="sourceType" :source-type="sourceType"
    :rescue-id="rescueId" />
</template>
<script>
import PawAdoptionEvidence from '@/components/PawAdoptionEvidence.vue'
import { getLastAdoptionId } from '@/utils/adoptionStorage.js'

function decodeValue(value) {
  if (value === undefined || value === null) return ''
  try { return decodeURIComponent(String(value)) } catch (e) { return String(value) }
}

export default {
  components: { PawAdoptionEvidence },
  data() { return { recordId: '', rescueId: '', sourceType: 'adoption' } },
  onLoad(options = {}) {
    const source = decodeValue(options.source || options.sourceType)
    this.sourceType = source === 'rescue' ? 'rescue' : 'adoption'
    if (this.sourceType === 'rescue') {
      this.rescueId = decodeValue(options.rescueId || options.id || options.recordId)
      return
    }
    this.recordId = decodeValue(options.id || options.recordId) || getLastAdoptionId()
  }
}
</script>
