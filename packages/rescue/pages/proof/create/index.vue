<template>
  <RescueProofForm :rescue-id="rescueId" :record="record" :load-state="loadState" @submitted="onSubmitted" />
</template>

<script>
import RescueProofForm from '../../../components/RescueProofForm.vue'
import { getRescueById } from '@/utils/rescueStorage.js'
import { buildRoute } from '@/navigation/routeContracts.js'
import { decodeWeixinLoadOptions } from '@/navigation/weixinLoadOptions.js'

export default {
  name: 'RescueProofCreatePage',
  components: { RescueProofForm },
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
      buildRoute('rescue.proof.create', params)
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
    },
    onSubmitted() {
      if (!this.rescueId) return
      try {
        const url = buildRoute('rescue.proof.list', { rescueId: this.rescueId })
        // Replace the form so both entry paths (detail → form and list → form)
        // land on the same refreshed proof list after a successful submission.
        uni.redirectTo({ url })
      } catch (error) {
        uni.showToast({ title: '证实已处理，请返回列表查看', icon: 'none' })
      }
    }
  }
}
</script>
