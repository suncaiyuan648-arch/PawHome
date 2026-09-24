<template>
  <RescueApplicantProgress :record="record" :load-state="loadState" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import RescueApplicantProgress from '@/packages/rescue/components/RescueApplicantProgress.vue'
import { readRescueProgress } from '../../services/progress.ts'
import { createRescueProgressPageState, resolveRescueRecordLoadRoute } from '../../services/componentMetadata.ts'

export default defineComponent({
  name: 'RescueProgressPage',
  components: { RescueApplicantProgress },
  data() { return createRescueProgressPageState() },
  onLoad(options: unknown = {}) {
    this.record = null
    this.rescueId = ''
    const route = resolveRescueRecordLoadRoute(options, 'rescue.progress')
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
      if (!this.rescueId) {
        this.loadState = 'missing-id'
        return
      }
      this.loadState = 'loading'
      // The actor provider is resolved at read time; readRescueProgress(this.rescueId)
      // remains the canonical one-argument contract for non-page callers.
      const result = readRescueProgress(this.rescueId, { actorProvider: () => {
        try { return uni.getStorageSync('PAWHOME_ACTOR_SESSION') || null } catch { return null }
      } })
      if (!result || result.success !== true || !result.data) {
        this.loadState = result && result.error && result.error.code === 'INVALID_ID'
          ? 'invalid-params'
          : 'not-found'
        return
      }
      this.record = result.data
      this.loadState = 'ready'
    }
  }
})
</script>
