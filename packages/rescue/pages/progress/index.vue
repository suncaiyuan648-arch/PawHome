<template>
  <RescueApplicantProgress :record="record" :load-state="loadState" />
</template>

<script>
import RescueApplicantProgress from '@/packages/rescue/components/RescueApplicantProgress.vue'
import { buildRoute } from '@/navigation/routeContracts.js'
import { decodeWeixinLoadOptions } from '@/navigation/weixinLoadOptions.js'
import { readRescueProgress } from '../../services/progress.js'

export default {
  name: 'RescueProgressPage',
  components: { RescueApplicantProgress },
  data() {
    return {
      rescueId: '',
      record: null,
      loadState: 'idle'
    }
  },
  onLoad(options = {}) {
    this.record = null
    this.rescueId = ''
    let params = options
    try {
      // #ifdef MP-WEIXIN
      params = decodeWeixinLoadOptions(options)
      // #endif
      if (!params || typeof params !== 'object' || !params.rescueId) {
        this.loadState = 'missing-id'
        return
      }
      // Validate the decoded query against the route contract before reading storage.
      buildRoute('rescue.progress', params)
      this.rescueId = params.rescueId
    } catch (error) {
      this.loadState = 'invalid-params'
      return
    }
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
        try { return uni.getStorageSync('PAWHOME_ACTOR_SESSION') || null } catch (error) { return null }
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
}
</script>
