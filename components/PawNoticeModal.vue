<template>
  <PawDialog
    v-model:visible="visibleProxy"
    variant="alert"
    :message="message"
    :confirm-text="confirmText"
    :auto-close="true"
    :close-on-mask="false"
    @confirm="$emit('confirm')"
  />
</template>

<script>
import PawDialog from '@/components/overlay/PawDialog.vue'

export default {
  name: 'PawNoticeModal',
  components: { PawDialog },
  props: { visible: { type: Boolean, default: false }, message: { type: String, default: '' }, confirmText: { type: String, default: '我知道了' } },
  emits: ['update:visible', 'confirm'],
  computed: {
    visibleProxy: {
      get() { return this.visible },
      set(value) { this.$emit('update:visible', value) }
    }
  }
}
</script>
