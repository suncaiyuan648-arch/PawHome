<template>
  <view class="paw-upload-tile" :style="tileStyle" @tap="$emit('select')">
    <image v-if="src" :src="src" mode="aspectFill" />
    <slot v-else><text>＋</text></slot>
  </view>
</template>

<script>
export default {
  name: 'PawUploadTile',
  props: {
    src: { type: String, default: '' },
    size: { type: [Number, String], default: 80 },
    radius: { type: [Number, String], default: 8 }
  },
  emits: ['select'],
  computed: {
    tileStyle() {
      const size = typeof this.size === 'number' ? `${this.size}px` : this.size
      const radius = typeof this.radius === 'number' ? `${this.radius}px` : this.radius
      return { width: size, height: size, borderRadius: radius }
    }
  }
}
</script>

<style scoped>
.paw-upload-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #999;
  font-size: 28px;
  overflow: hidden;
  box-sizing: border-box;
}

.paw-upload-tile image {
  width: 100%;
  height: 100%;
}
</style>
