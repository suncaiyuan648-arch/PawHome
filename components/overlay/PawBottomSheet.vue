<template>
  <PawOverlay :model-value="openValue" placement="bottom" :close-on-mask="closeOnMask" :z-index="zIndex"
    :enter-duration="180" :exit-duration="200" @update:model-value="setValue" @update:visible="setValue"
    @after-open="$emit('after-open')" @after-close="$emit('after-close')">
    <template #default="{ opened, closing }">
      <PawSafeArea class="paw-bottom-sheet" :enabled="safeArea" :class="[
        `paw-bottom-sheet--${variant}`,
        { 'paw-bottom-sheet--open': opened, 'paw-bottom-sheet--closing': closing, 'paw-bottom-sheet--safe': safeArea, 'paw-bottom-sheet--fixed': !!height }
      ]" :style="sheetStyle" @tap.stop>
        <view v-if="showHandle" class="paw-bottom-sheet__handle"></view>
        <slot name="header" />
        <view class="paw-bottom-sheet__body">
          <slot />
        </view>
        <slot name="footer" />
      </PawSafeArea>
    </template>
  </PawOverlay>
</template>

<script>
import PawOverlay from '@/components/overlay/PawOverlay.vue'
import PawSafeArea from '@/components/base/PawSafeArea.vue'

export default {
  name: 'PawBottomSheet',
  components: { PawOverlay, PawSafeArea },
  props: {
    modelValue: { type: Boolean, default: undefined },
    visible: { type: Boolean, default: undefined },
    variant: { type: String, default: 'default' },
    closeOnMask: { type: Boolean, default: true },
    safeArea: { type: Boolean, default: true },
    lockScroll: { type: Boolean, default: true },
    height: { type: [String, Number], default: '' },
    zIndex: { type: [String, Number], default: 10020 },
    showHandle: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'update:visible', 'after-open', 'after-close'],
  computed: {
    openValue() { return this.modelValue !== undefined ? this.modelValue : !!this.visible },
    sheetStyle() {
      if (!this.height) return {}
      return { height: typeof this.height === 'number' ? `${this.height}px` : this.height }
    }
  },
  methods: {
    setValue(value) {
      this.$emit('update:modelValue', value)
      this.$emit('update:visible', value)
    }
  }
}
</script>

<style scoped>
.paw-bottom-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  background: #fff;
  border-radius: var(--paw-radius-sheet, 20px) var(--paw-radius-sheet, 20px) 0 0;
  transform: translateY(100%);
  transition: transform var(--paw-motion-sheet, 260ms) var(--paw-ease-standard, ease);
}

.paw-bottom-sheet.paw-bottom-sheet--publish {
  background: #fff;
  border-radius: 20px 20px 0 0;
}

.paw-bottom-sheet.paw-bottom-sheet--publish .paw-bottom-sheet__body {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.paw-bottom-sheet.paw-bottom-sheet--composer {
  padding: 15px;
}

.paw-bottom-sheet.paw-bottom-sheet--form-selection {
  background: #f5f5f5;
}

.paw-bottom-sheet.paw-bottom-sheet--value-selection {
  background: #f8f8f8;
}

.paw-bottom-sheet--open {
  transform: translateY(0);
}

.paw-bottom-sheet--closing {
  transform: translateY(100%);
  transition-duration: 200ms;
  transition-timing-function: var(--paw-ease-exit, ease-in);
}

.paw-bottom-sheet__body {
  min-height: 0;
}

.paw-bottom-sheet--fixed .paw-bottom-sheet__body {
  height: 100%;
  min-height: 0;
}

.paw-bottom-sheet__handle {
  width: 36px;
  height: 4px;
  margin: 8px auto 0;
  border-radius: 2px;
  background: #ddd;
}
</style>
