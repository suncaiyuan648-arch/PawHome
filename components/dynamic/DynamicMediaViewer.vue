<template>
  <view class="dynamic-media-viewer">
    <swiper
      class="dynamic-media-viewer__swiper"
      :current="current"
      :duration="250"
      :circular="false"
      @change="onChange"
    >
      <swiper-item
        v-for="(item, index) in mediaItems"
        :key="item.id || index"
        class="dynamic-media-viewer__item"
      >
        <image
          class="dynamic-media-viewer__image"
          :src="resolveSrc(item)"
          mode="aspectFill"
          @tap.stop="onPreview(item, index)"
        />
      </swiper-item>
    </swiper>
    <view
      v-if="mediaItems.length > 1"
      class="dynamic-media-viewer__dots"
    >
      <view
        v-for="(_, index) in mediaItems"
        :key="index"
        class="dynamic-media-viewer__dot"
        :class="{ active: current === index }"
      ></view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'

import { safeImgSrc } from '@/utils/safeImgSrc.ts'
import {
  createDynamicMediaPreviewPayload,
  createDynamicMediaViewerItems,
  readDynamicMediaIndex,
  type DynamicMediaInput,
  type DynamicMediaPreviewPayload,
  type DynamicMediaViewerItem,
} from '@/utils/dynamicMediaMetadata.ts'

interface DynamicMediaViewerState {
  current: number
}

export default defineComponent({
  name: 'DynamicMediaViewer',
  props: {
    items: { type: Array as PropType<DynamicMediaInput[]>, default: () => [] },
    currentIndex: { type: Number, default: 0 },
    fallback: {
      type: String,
      default: '/static/figma/feature/d81342748c84fc1068ceb0af9525bc465f5517e8.png',
    },
  },
  emits: {
    change: (index: number) => Number.isInteger(index) && index >= 0,
    tap: (payload: DynamicMediaPreviewPayload) => payload !== null && typeof payload === 'object',
    preview: (payload: DynamicMediaPreviewPayload) =>
      payload !== null && typeof payload === 'object',
  },
  data(): DynamicMediaViewerState {
    return { current: this.currentIndex }
  },
  computed: {
    mediaItems(): DynamicMediaViewerItem[] {
      return createDynamicMediaViewerItems(this.items, this.fallback)
    },
  },
  watch: {
    currentIndex(value: number) {
      this.current = value
    },
  },
  methods: {
    resolveSrc(item: DynamicMediaViewerItem) {
      return safeImgSrc(item.src, this.fallback)
    },
    onChange(event: PawEvent) {
      this.current = readDynamicMediaIndex(event, this.mediaItems.length)
      this.$emit('change', this.current)
    },
    onPreview(item: DynamicMediaViewerItem, index: number) {
      const payload = createDynamicMediaPreviewPayload(item, index)
      this.$emit('tap', payload)
      this.$emit('preview', payload)
    },
  },
})
</script>

<style scoped>
.dynamic-media-viewer {
  position: relative;
  width: 304px;
  height: 500px;
  margin: 0 auto;
  overflow: hidden;
  background: #eee;
}
.dynamic-media-viewer__swiper {
  display: block;
  width: 100%;
  height: 100%;
}
.dynamic-media-viewer__item {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.dynamic-media-viewer__image {
  position: absolute;
  top: -3.18%;
  left: 0;
  display: block;
  width: 236.9%;
  height: 106.37%;
  max-width: none;
}
.dynamic-media-viewer__dots {
  position: absolute;
  right: 10px;
  bottom: 8px;
  left: 10px;
  display: flex;
  gap: 3px;
  height: 3px;
}
.dynamic-media-viewer__dot {
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.25);
  transition: opacity 180ms ease;
}
.dynamic-media-viewer__dot.active {
  background: rgba(255, 255, 255, 0.5);
}
</style>
