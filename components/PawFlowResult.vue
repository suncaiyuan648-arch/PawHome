<template>
  <PawResultPage :status="failed ? 'failure' : 'success'" :title="title" :description="body" :action-text="buttonText" @back="$emit('back')" @action="$emit('action')" />
</template>

<script>
import PawResultPage from '@/components/feedback/PawResultPage.vue'
export default { name: 'PawFlowResult', components: { PawResultPage }, props: { title: String, body: String, buttonText: String, failed: Boolean }, emits: ['back', 'action'] }
</script>
