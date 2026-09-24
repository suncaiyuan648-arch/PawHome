<template>
  <button class="paw-icon-button" hover-class="paw-icon-button--pressed" :style="buttonStyle" :disabled="disabled"
    :aria-label="label || undefined" @tap.stop="handleTap">
    <PawIcon :name="icon" :size="iconSize" :color="color" :label="label" />
  </button>
</template>

<script lang="ts">
import { eventContract } from '@/utils/componentEvents.ts'

import { defineComponent, type PropType } from 'vue'

import PawIcon from '@/components/PawIcon/PawIcon.vue'
import type { PawIconName, PawIconSize } from '@/components/PawIcon/PawIcon.types'

export default defineComponent({
  name: 'PawIconButton',
  components: { PawIcon },
  props: {
    icon: { type: String as PropType<PawIconName>, required: true },
    iconSize: { type: [String, Number] as unknown as PropType<PawIconSize>, default: 'base' },
    hitSize: { type: Number, default: 44 },
    color: { type: String, default: '#1F2329' },
    label: { type: String, default: '' },
    disabled: { type: Boolean, default: false }
  },
  emits: {
    'click': eventContract<[event: PawEvent]>(),
  },
  computed: {
    buttonStyle() {
      return { width: `${this.hitSize}px`, height: `${this.hitSize}px` }
    }
  },
  methods: {
    handleTap(event: PawEvent) {
      if (!this.disabled) this.$emit('click', event)
    }
  }
})
</script>

<style scoped>
.paw-icon-button {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  line-height: 1;
}

.paw-icon-button::after {
  border: 0;
}

.paw-icon-button--pressed {
  opacity: .72;
  transform: scale(.98);
}
</style>
