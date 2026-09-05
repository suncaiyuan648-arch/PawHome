<template>
  <view class="paw-checkbox" :class="[
    `paw-checkbox--${size}`,
    {
      'paw-checkbox--checked': modelValue,
      'paw-checkbox--disabled': disabled,
      'paw-checkbox--inline': inline
    }
  ]" role="checkbox" :aria-checked="modelValue" @tap.stop="toggle">
    <view class="paw-checkbox__control" :class="{ 'paw-checkbox__control--checked': modelValue }" :style="visualStyle">
      <PawIcon v-if="modelValue" name="actions/selection-check" :size="checkSize" />
    </view>
  </view>
</template>

<script>
import PawIcon from '@/components/PawIcon/PawIcon.vue'

// Keep the hit area independent from the visual control. These optical sizes
// follow the Figma address-card proportion: the check stays close to half of
// the circle instead of filling the control.
const SIZE_MAP = Object.freeze({ small: 12, middle: 16, large: 22 })
const CHECK_SIZE_MAP = Object.freeze({ small: 6, middle: 9, large: 12 })

export default {
  name: 'PawCheckbox',
  components: { PawIcon },
  props: {
    modelValue: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    size: {
      type: String,
      default: 'middle',
      validator: value => Object.prototype.hasOwnProperty.call(SIZE_MAP, value)
    },
    inline: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'change'],
  computed: {
    visualStyle() {
      const value = SIZE_MAP[this.size] || SIZE_MAP.middle
      return { width: `${value}px`, height: `${value}px` }
    },
    checkSize() {
      return CHECK_SIZE_MAP[this.size] || CHECK_SIZE_MAP.middle
    }
  },
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
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 28px;
  width: 28px;
  height: 36px;
  box-sizing: border-box;
}

.paw-checkbox__control {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border: 1.5px solid #dbdbdb;
  border-radius: 50%;
  background: transparent;
  box-sizing: border-box;
}

.paw-checkbox__control--checked {
  border-color: #ffe546;
  background: #ffe546;
}

.paw-checkbox--disabled {
  opacity: .5;
}

.paw-checkbox--inline {
  height: auto;
  min-height: 0;
}
</style>
