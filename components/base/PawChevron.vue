<template><view class="paw-chevron" :class="`paw-chevron--${direction}`" :style="chevronStyle" aria-hidden="true"></view></template>

<script>
export default {
  name: 'PawChevron',
  props: {
    direction: { type: String, default: 'right' },
    size: { type: [Number, String], default: 6 },
    color: { type: String, default: '#999' },
    weight: { type: [Number, String], default: 1.5 }
  },
  computed: {
    chevronStyle() {
      const size = typeof this.size === 'number' ? `${this.size}px` : this.size
      const weight = typeof this.weight === 'number' ? `${this.weight}px` : this.weight
      return { width: size, height: size, borderColor: this.color, borderWidth: `0 ${weight} ${weight} 0` }
    }
  }
}
</script>

<style scoped>
.paw-chevron { display: inline-block; box-sizing: border-box; transform: rotate(-45deg); }
.paw-chevron--left { transform: rotate(135deg); }
.paw-chevron--up { transform: rotate(-135deg); }
.paw-chevron--down { transform: rotate(45deg); }
</style>
