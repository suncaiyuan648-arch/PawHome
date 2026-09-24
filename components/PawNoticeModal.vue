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

<script lang="ts">
import { eventContract } from '@/utils/componentEvents.ts'

import { defineComponent } from 'vue'

import PawDialog from '@/components/overlay/PawDialog.vue'

export default defineComponent({
  name: 'PawNoticeModal',
  components: { PawDialog },
  props: {
    visible: { type: Boolean, default: false },
    message: { type: String, default: '' },
    confirmText: { type: String, default: '我知道了' },
  },
  emits: {
    'update:visible': eventContract<[value: boolean]>(),
    confirm: eventContract<[]>(),
  },
  computed: {
    visibleProxy: {
      get() {
        return this.visible
      },
      set(value: boolean) {
        this.$emit('update:visible', value)
      },
    },
  },
})
</script>
