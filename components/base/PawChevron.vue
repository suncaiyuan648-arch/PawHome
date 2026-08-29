<template><image class="paw-chevron" :class="`paw-chevron--${direction}`" :src="asset" :style="chevronStyle" mode="aspectFit" aria-hidden="true" /></template>

<script>
export default {
  name: 'PawChevron',
  props: {
    direction: { type: String, default: 'right' },
    size: { type: [Number, String], default: 4 }
  },
  computed: {
    asset() { return '/static/figma/dynamic-detail/chevron-right.svg' },
    chevronStyle() {
      const width = typeof this.size === 'number' ? `${this.size}px` : this.size
      const height = typeof this.size === 'number' ? `${this.size * 2}px` : '8px'
      return { width, height }
    }
  }
}
</script>

<style scoped>
.paw-chevron { display: block; flex: 0 0 auto; }
.paw-chevron--right { transform: rotate(180deg); }
.paw-chevron--left { transform: rotate(0deg); }
.paw-chevron--up { transform: rotate(90deg); }
.paw-chevron--down { transform: rotate(-90deg); }
</style>
