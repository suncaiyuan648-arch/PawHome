<template>
  <view class="paw-divider" :style="dividerStyle" aria-hidden="true" />
</template>

<script>
function cssLength(value) {
  return typeof value === 'number' ? `${value}px` : String(value)
}

export default {
  name: 'PawDivider',
  props: {
    width: { type: [Number, String], default: 34 },
    thickness: { type: [Number, String], default: 0.3 },
    color: { type: String, default: '#CBCCCC' }
  },
  computed: {
    dividerStyle() {
      return {
        width: cssLength(this.width),
        height: cssLength(this.thickness),
        backgroundColor: this.color
      }
    }
  }
}
</script>

<style scoped>
.paw-divider {
  display: inline-block;
  flex: 0 0 auto;
  box-sizing: border-box;
  vertical-align: middle;
}
</style>
