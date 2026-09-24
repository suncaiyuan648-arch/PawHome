<template>
  <PawResultPage :status="failed ? 'failure' : 'success'" :nav-title="navTitle" :content-top="contentTop" :title="title"
    :description="body" :description-max-width="descriptionMaxWidth" :action-text="buttonText"
    :action-width="actionWidth" :action-height="actionHeight" :failure-icon-name="failureIconName"
    :failure-tone="failureTone" @back="$emit('back')" @action="$emit('action')" />
</template>

<script lang="ts">
import { eventContract } from '@/utils/componentEvents.ts'
import { defineComponent } from 'vue'

import PawResultPage from '@/components/feedback/PawResultPage.vue'
export default defineComponent({
  name: 'PawFlowResult',
  components: { PawResultPage },
  props: {
    title: { type: String, default: '' },
    body: { type: String, default: '' },
    buttonText: { type: String, default: '' },
    failed: Boolean,
    navTitle: { type: String, default: '' },
    contentTop: { type: [Number, String], default: 38 },
    descriptionMaxWidth: { type: [Number, String], default: '' },
    actionWidth: { type: [Number, String], default: 209 },
    actionHeight: { type: [Number, String], default: 45 },
    failureIconName: { type: String, default: '' },
    failureTone: { type: String, default: 'muted' }
  },
  emits: {
    'back': eventContract<[]>(),
    'action': eventContract<[]>(),
  }
})
</script>
