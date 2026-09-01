<template>
  <view class="paw-checkbox" :class="{ 'paw-checkbox--checked': modelValue, 'paw-checkbox--disabled': disabled }"
    role="checkbox" :aria-checked="modelValue" @tap.stop="toggle">
    <PawIcon v-if="modelValue" class="paw-checkbox__icon" name="actions/agreement-check" :size="13" />
    <view v-else class="paw-checkbox__empty" />
  </view>
</template>

<script>
import PawIcon from '@/components/PawIcon/PawIcon.vue'

export default {
  name: 'PawCheckbox',
  components: { PawIcon },
  props: {
    modelValue: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'change'],
  methods: {
    toggle() {
      if (this.disabled) return
      const value = !this.modelValue
      this.$emit('update:modelValue', value)
      this.$emit('change', value)
    }
  }
}
</script>

<style scoped>
.paw-checkbox {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 28px;
  width: 28px;
  height: 36px;
  box-sizing: border-box;
}

.paw-checkbox__icon {
  position: absolute;
  left: 12px;
  top: 11px;
  display: block;
}

.paw-checkbox__empty {
  position: absolute;
  left: 12px;
  top: 11px;
  display: block;
  width: 12px;
  height: 13px;
  border: 1px solid #a9a9a9;
  border-radius: 50%;
  box-sizing: border-box;
}

.paw-checkbox--disabled {
  opacity: .5;
}
</style>
