<template>
  <RescueDetailView :record="record" :load-state="loadState" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import RescueDetailView from '../../components/RescueDetailView.vue'
import { getRescueById } from '@/utils/rescueStorage.ts'
import { createRescueRecordPageState, resolveRescueRecordLoadRoute } from '../../services/componentMetadata.ts'

export default defineComponent({
  name: 'RescueDetailPage',
  components: { RescueDetailView },
  data() { return createRescueRecordPageState() },
  onLoad(options: unknown = {}) {
    this.record = null
    this.rescueId = ''
    const route = resolveRescueRecordLoadRoute(options, 'rescue.detail')
    if (!route.ok) { this.loadState = route.loadState; return }
    this.rescueId = route.rescueId
    this.refresh()
  },
  onShow() {
    if (this.rescueId) this.refresh()
    else if (this.loadState !== 'invalid-params') this.loadState = 'missing-id'
  },
  methods: {
    refresh() {
      this.record = null
      if (!this.rescueId) { this.loadState = 'missing-id'; return }
      this.loadState = 'loading'
      const record = getRescueById(this.rescueId)
      if (!record) { this.loadState = 'not-found'; return }
      this.record = record
      this.loadState = 'ready'
    }
  }
})
</script>
