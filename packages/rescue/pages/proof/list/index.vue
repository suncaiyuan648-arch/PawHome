<template>
  <RescueProofList :record="record" :load-state="loadState" />
</template>

<script>
import RescueProofList from '../../../components/RescueProofList.vue'
import { getRescueById } from '@/utils/rescueStorage.js'
import { buildRoute } from '@/navigation/routeContracts.js'
import { decodeWeixinLoadOptions } from '@/navigation/weixinLoadOptions.js'

export default {
  name: 'RescueProofListPage',
  components: { RescueProofList },
  data() { return { rescueId: '', record: null, loadState: 'idle' } },
  onLoad(options = {}) {
    this.record = null
    this.rescueId = ''
    let params = options
    try {
      // #ifdef MP-WEIXIN
      params = decodeWeixinLoadOptions(options)
      // #endif
      if (!params || typeof params !== 'object' || !params.rescueId) { this.loadState = 'missing-id'; return }
      buildRoute('rescue.proof.list', params)
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
      if (!this.rescueId) { this.loadState = 'missing-id'; return }
      this.loadState = 'loading'
      const record = getRescueById(this.rescueId)
      if (!record) { this.loadState = 'not-found'; return }
      this.record = record
      this.loadState = 'ready'
    }
  }
}
</script>
