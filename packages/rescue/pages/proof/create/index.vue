<template>
  <RescueProofForm :rescue-id="rescueId" :record="record" :load-state="loadState" @submitted="onSubmitted" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import RescueProofForm from '../../../components/RescueProofForm.vue'
import { getRescueById } from '@/utils/rescueStorage.ts'
import { buildRoute } from '@/navigation/routeContracts.ts'
import { createRescueRecordPageState, resolveRescueRecordLoadRoute } from '../../../services/componentMetadata.ts'

export default defineComponent({
  name: 'RescueProofCreatePage',
  components: { RescueProofForm },
  data() { return createRescueRecordPageState() },
  onLoad(options: unknown = {}) {
    this.record = null
    this.rescueId = ''
    const route = resolveRescueRecordLoadRoute(options, 'rescue.proof.create')
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
    },
    onSubmitted() {
      if (!this.rescueId) return
      try {
        const url = buildRoute('rescue.proof.list', { rescueId: this.rescueId })
        // Replace the form so both entry paths (detail → form and list → form)
        // land on the same refreshed proof list after a successful submission.
        uni.redirectTo({ url })
      } catch {
        uni.showToast({ title: '证实已处理，请返回列表查看', icon: 'none' })
      }
    }
  }
})
</script>
