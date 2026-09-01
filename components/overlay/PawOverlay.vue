<template>
  <view v-if="rendered" class="paw-overlay" :class="[
    `paw-overlay--${placement}`,
    { 'paw-overlay--open': opened, 'paw-overlay--closing': closing }
  ]" :style="{ zIndex: zIndex }">
    <view class="paw-overlay__mask" @tap="onMaskTap" @touchmove.stop.prevent="noop"></view>
    <view class="paw-overlay__content" @tap.stop @touchmove.stop="noop">
      <slot :opened="opened" :closing="closing" />
    </view>
  </view>
</template>

<script>
export default {
  name: 'PawOverlay',
  props: {
    modelValue: { type: Boolean, default: undefined },
    visible: { type: Boolean, default: undefined },
    closeOnMask: { type: Boolean, default: true },
    placement: {
      type: String,
      default: 'center',
      validator: value => ['top', 'center', 'bottom'].includes(value)
    },
    zIndex: { type: [Number, String], default: 10000 },
    enterDuration: { type: Number, default: 180 },
    exitDuration: { type: Number, default: 160 }
  },
  emits: ['update:modelValue', 'update:visible', 'mask-click', 'after-open', 'after-close'],
  data() {
    return { rendered: false, opened: false, closing: false, closeTimer: null, openTimer: null, afterOpenTimer: null }
  },
  computed: {
    openValue() {
      return this.modelValue !== undefined ? this.modelValue : !!this.visible
    }
  },
  watch: {
    openValue: {
      immediate: true,
      handler(value) {
        if (value) this.open()
        else this.close()
      }
    }
  },
  beforeUnmount() {
    this.clearTimers()
  },
  methods: {
    clearTimers() {
      if (this.closeTimer) clearTimeout(this.closeTimer)
      if (this.openTimer) clearTimeout(this.openTimer)
      if (this.afterOpenTimer) clearTimeout(this.afterOpenTimer)
      this.closeTimer = null
      this.openTimer = null
      this.afterOpenTimer = null
    },
    open() {
      this.clearTimers()
      this.closing = false
      this.rendered = true
      this.openTimer = setTimeout(() => {
        this.opened = true
      }, 16)
      this.afterOpenTimer = setTimeout(() => this.$emit('after-open'), 16 + this.enterDuration)
    },
    close() {
      this.clearTimers()
      if (!this.rendered) return
      this.opened = false
      this.closing = true
      this.closeTimer = setTimeout(() => {
        this.rendered = false
        this.closing = false
        this.$emit('after-close')
      }, this.exitDuration)
    },
    emitValue(value) {
      this.$emit('update:modelValue', value)
      this.$emit('update:visible', value)
    },
    onMaskTap() {
      this.$emit('mask-click')
      if (this.closeOnMask) this.emitValue(false)
    },
    noop() { }
  }
}
</script>

<style scoped>
.paw-overlay {
  position: fixed;
  inset: 0;
  pointer-events: auto;
}

.paw-overlay__mask,
.paw-overlay__content {
  position: absolute;
  inset: 0;
}

.paw-overlay__mask {
  background: rgba(0, 0, 0, .65);
  opacity: 0;
  transition: opacity 160ms ease;
}

.paw-overlay__content {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  pointer-events: none;
}

/* slot 包裹层由 uni-app 生成且没有 PawOverlay 的作用域属性。 */
:global(.paw-overlay__content > view) {
  pointer-events: auto;
}

.paw-overlay--top .paw-overlay__content {
  align-items: flex-start;
}

.paw-overlay--bottom .paw-overlay__content {
  align-items: flex-end;
}

.paw-overlay--open .paw-overlay__mask {
  opacity: 1;
}

.paw-overlay--closing .paw-overlay__mask {
  opacity: 0;
}
</style>
