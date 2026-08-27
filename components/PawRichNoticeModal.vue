<template>
  <PawDialog
    v-model:visible="visibleProxy"
    variant="rich"
    :title="title"
    :body="body"
    :confirm-text="confirmText"
    :auto-close="true"
    :close-on-mask="true"
    @confirm="$emit('confirm')"
  />
</template>

<script>
import PawDialog from '@/components/overlay/PawDialog.vue'

export default {
  name: 'PawRichNoticeModal',
  components: { PawDialog },
  props: { visible: { type: Boolean, default: false }, title: { type: String, default: '' }, body: { type: String, default: '' }, confirmText: { type: String, default: '我知道了' } },
  emits: ['update:visible', 'confirm'],
  computed: {
    visibleProxy: {
      get() { return this.visible },
      set(value) { this.$emit('update:visible', value) }
    }
  }
}
</script>
