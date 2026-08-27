<template>
  <view class="dynamic-media-viewer">
    <swiper class="dynamic-media-viewer__swiper" :current="current" :duration="250" :circular="false" @change="onChange">
      <swiper-item v-for="(item, index) in mediaItems" :key="item.id || index">
        <image class="dynamic-media-viewer__image" :src="resolveSrc(item)" mode="aspectFill" @tap.stop="onPreview(item, index)" />
      </swiper-item>
    </swiper>
    <view v-if="mediaItems.length > 1" class="dynamic-media-viewer__dots">
      <view v-for="(_, index) in mediaItems" :key="index" class="dynamic-media-viewer__dot" :class="{ active: current === index }"></view>
    </view>
  </view>
</template>

<script>
import { safeImgSrc } from '@/utils/safeImgSrc.js'

export default {
  name: 'DynamicMediaViewer',
  props: {
    items: { type: Array, default: () => [] },
    currentIndex: { type: Number, default: 0 },
    fallback: { type: String, default: '/static/figma/feature/d81342748c84fc1068ceb0af9525bc465f5517e8.png' }
  },
  emits: ['change', 'tap', 'preview'],
  data() { return { current: this.currentIndex } },
  computed: {
    mediaItems() { return this.items.length ? this.items : [this.fallback] }
  },
  watch: { currentIndex(value) { this.current = value } },
  methods: {
    resolveSrc(item) { return safeImgSrc(typeof item === 'string' ? item : item && (item.src || item.url), this.fallback) },
    onChange(event) { this.current = event.detail.current; this.$emit('change', this.current) },
    onPreview(item, index) { this.$emit('tap', { item, index }); this.$emit('preview', { item, index }) }
  }
}
</script>

<style scoped>
.dynamic-media-viewer { position: relative; width: calc(100% - 71px); height: 500px; margin: 22px auto 0; overflow: hidden; background: #eee; }
.dynamic-media-viewer__swiper, .dynamic-media-viewer__image { display: block; width: 100%; height: 100%; }
.dynamic-media-viewer__dots { position: absolute; right: 10px; bottom: 8px; left: 10px; display: flex; gap: 3px; height: 3px; }
.dynamic-media-viewer__dot { flex: 1; height: 3px; border-radius: 2px; background: rgba(255, 255, 255, .25); transition: opacity 180ms ease; }
.dynamic-media-viewer__dot.active { background: rgba(255, 255, 255, .5); }
</style>
