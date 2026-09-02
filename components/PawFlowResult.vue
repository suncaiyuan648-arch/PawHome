<template>
  <PawResultPage :status="failed ? 'failure' : 'success'" :nav-title="navTitle" :content-top="contentTop" :title="title"
    :description="body" :action-text="buttonText" :action-width="actionWidth" :action-height="actionHeight"
    @back="$emit('back')" @action="$emit('action')" />
</template>

<script>
import PawResultPage from '@/components/feedback/PawResultPage.vue'
export default {
  name: 'PawFlowResult',
  components: { PawResultPage },
  props: {
    title: String,
    body: String,
    buttonText: String,
    failed: Boolean,
    navTitle: { type: String, default: '' },
    contentTop: { type: [Number, String], default: 38 },
    actionWidth: { type: [Number, String], default: 209 },
    actionHeight: { type: [Number, String], default: 45 }
  },
  emits: ['back', 'action']
}
</script>
