<template>
  <view
    class="paw-card"
    :style="cardStyle"
  >
    <view
      v-if="title || $slots.title"
      class="paw-card__head"
    >
      <slot name="title">
        <text class="paw-card__title">{{ title }}</text>
      </slot>
    </view>
    <view class="paw-card__body">
      <slot />
    </view>
    <view
      v-if="$slots.footer"
      class="paw-card__footer"
    >
      <slot name="footer" />
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PawCard',
  options: {
    // The card root is the layout box so parent classes, styles, and margins
    // apply to the actual card instead of an extra WeChat custom-component host.
    // #ifdef MP-WEIXIN
    virtualHost: true,
    // #endif
  },
  props: {
    title: { type: String, default: '' },
    width: { type: [String, Number], default: '100%' },
    gap: { type: [String, Number], default: '0' },
    padding: { type: [String, Number], default: '20px' },
    border: { type: [String, Boolean], default: 'none' },
  },
  computed: {
    cardStyle() {
      return {
        width: this.normalizedWidth,
        gap: this.normalizedGap,
        padding: this.normalizedPadding,
        border: this.normalizedBorder,
      }
    },
    normalizedWidth() {
      if (typeof this.width === 'number') return `${this.width}px`
      return String(this.width || '100%')
    },
    normalizedGap() {
      if (typeof this.gap === 'number') return `${this.gap}px`
      return String(this.gap || '0')
    },
    normalizedPadding() {
      if (typeof this.padding === 'number') return `${this.padding}px`
      return String(this.padding || '0')
    },
    normalizedBorder() {
      if (this.border === true) return '1px solid #f0f0f0'
      if (this.border === false) return 'none'
      return String(this.border || 'none')
    },
  },
})
</script>

<style scoped>
.paw-card {
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  box-sizing: border-box;
  border-radius: 10px;
  background: #fff;
}

.paw-card__head,
.paw-card__body,
.paw-card__footer {
  min-width: 0;
  box-sizing: border-box;
}

.paw-card__head {
  flex: 0 0 auto;
  color: #333;
  font-size: 16px;
  font-weight: 500;
  line-height: 23px;
}

.paw-card__body {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  color: #333333;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}

.paw-card__footer {
  flex: 0 0 auto;
}

.paw-card__title {
  color: #333333;
  font-size: 16px;
  font-weight: 500;
  line-height: 23px;
}
</style>
