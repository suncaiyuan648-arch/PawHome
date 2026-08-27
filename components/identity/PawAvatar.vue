<template>
  <view
    class="paw-avatar"
    :class="[`paw-avatar--${shape}`, { 'paw-avatar--border': border, 'paw-avatar--interactive': clickable }]"
    :style="avatarStyle"
    @tap.stop="onClick"
  >
    <image class="paw-avatar__image" :src="safeSrc" mode="aspectFill" />
  </view>
</template>

<script>
import { safeImgSrc } from '@/utils/safeImgSrc.js'

export default {
  name: 'PawAvatar',
  props: {
    src: { type: String, default: '' },
    size: { type: [Number, String], default: 34 },
    fallback: { type: String, default: '/static/user.png' },
    shape: { type: String, default: 'circle' },
    border: { type: Boolean, default: false },
    clickable: { type: Boolean, default: false }
  },
  emits: ['click'],
  computed: {
    safeSrc() { return safeImgSrc(this.src, this.fallback) },
    avatarStyle() {
      const size = typeof this.size === 'number' ? `${this.size}px` : this.size
      return { width: size, height: size }
    }
  },
  methods: { onClick(event) { if (this.clickable) this.$emit('click', event) } }
}
</script>

<style scoped>
.paw-avatar { display: block; overflow: hidden; flex-shrink: 0; background: #f2f2f2; }
.paw-avatar--circle { border-radius: 50%; }
.paw-avatar--rounded { border-radius: 8px; }
.paw-avatar--border { border: 1px solid rgba(0, 0, 0, .06); box-sizing: border-box; }
.paw-avatar--interactive { cursor: pointer; }
.paw-avatar__image { display: block; width: 100%; height: 100%; }
</style>
