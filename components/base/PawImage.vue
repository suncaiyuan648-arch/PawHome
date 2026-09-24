<template>
  <view
    class="paw-image"
    :class="[
      `paw-image--${normalizedDisplayMode}`,
      { 'paw-image--interactive': preview || clickable },
    ]"
    :style="containerStyle"
    @tap.stop="onTap"
  >
    <image
      class="paw-image__content"
      :src="resolvedSrc"
      :mode="imageMode"
      :lazy-load="lazyLoad"
      @load="onLoad"
      @error="onError"
    />
    <slot />
  </view>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'

import {
  asPawImageCssSize,
  isPackagedPawImageUrl,
  isPawImageEvent,
  isPawImagePreviewPayload,
  normalizePawImageDisplayMode,
  readCompressedPawImageUrl,
  readPawImageSourceUrl,
  type PawImageDisplayMode,
  type PawImageEvent,
  type PawImagePreviewPayload,
  type PawImagePreviewSource,
} from '@/components/base/pawImageMetadata.ts'
import { safeImgSrc } from '@/utils/safeImgSrc.ts'

function preparePreviewImageUrl(url: string): Promise<string> {
  if (
    !isPackagedPawImageUrl(url) ||
    typeof uni === 'undefined' ||
    typeof uni.compressImage !== 'function'
  ) {
    return Promise.resolve(url)
  }

  return new Promise<string>((resolve) => {
    const fallback = (error: unknown) => {
      console.warn(
        '[PawHome][PawImage] packaged preview image preparation failed, using source path',
        {
          url,
          error,
        },
      )
      resolve(url)
    }

    try {
      uni.compressImage({
        src: url,
        compressedWidth: 1080,
        success: (result: UniNamespace.CompressImageSuccessResult) =>
          resolve(readCompressedPawImageUrl(result) || url),
        fail: fallback,
      })
    } catch (error: unknown) {
      fallback(error)
    }
  })
}

export default defineComponent({
  name: 'PawImage',
  props: {
    src: { type: String, default: '' },
    fallback: { type: String, default: '/static/home-feed-1.png' },
    // square: 由 size/width 生成等宽高；fixed: 使用传入的 width/height；original: 保持原比例宽度展示。
    displayMode: { type: String as PropType<PawImageDisplayMode>, default: 'square' },
    size: { type: [Number, String], default: '' },
    width: { type: [Number, String], default: '' },
    height: { type: [Number, String], default: '' },
    radius: { type: [Number, String], default: '' },
    preview: { type: Boolean, default: true },
    clickable: { type: Boolean, default: false },
    previewUrls: { type: Array as PropType<PawImagePreviewSource[]>, default: () => [] },
    previewIndex: { type: Number, default: 0 },
    lazyLoad: { type: Boolean, default: false },
  },
  emits: {
    click: (event: PawImageEvent) => isPawImageEvent(event),
    preview: (payload: PawImagePreviewPayload) => isPawImagePreviewPayload(payload),
    'preview-opened': (payload: PawImagePreviewPayload) => isPawImagePreviewPayload(payload),
    load: (event: PawImageEvent) => isPawImageEvent(event),
    error: (event: PawImageEvent) => isPawImageEvent(event),
  },
  computed: {
    resolvedSrc() {
      return safeImgSrc(this.src, this.fallback)
    },
    normalizedDisplayMode(): PawImageDisplayMode {
      return normalizePawImageDisplayMode(this.displayMode)
    },
    imageMode() {
      return this.normalizedDisplayMode === 'original' ? 'widthFix' : 'aspectFill'
    },
    containerStyle() {
      const squareSize = asPawImageCssSize(this.size || this.width || this.height)
      const width = asPawImageCssSize(
        this.normalizedDisplayMode === 'square'
          ? this.size || this.width || this.height
          : this.width || this.size,
      )
      const height = asPawImageCssSize(
        this.normalizedDisplayMode === 'fixed'
          ? this.height || this.size
          : this.normalizedDisplayMode === 'square'
            ? squareSize
            : '',
      )
      const style: Record<string, string> = {}
      if (width) style.width = width
      if (height) style.height = height
      if (this.radius !== '') style.borderRadius = asPawImageCssSize(this.radius)
      return style
    },
  },
  methods: {
    onTap(event: PawEvent) {
      this.$emit('click', event)
      if (!this.preview) return

      const current = readPawImageSourceUrl(this.src) || readPawImageSourceUrl(this.resolvedSrc)
      const urls = Array.from(
        new Set(
          [...this.previewUrls.map(readPawImageSourceUrl).filter(Boolean), current].filter(Boolean),
        ),
      )
      if (!urls.length) {
        uni.showToast({ title: '暂无可预览图片', icon: 'none' })
        return
      }

      const currentIndex = Math.max(
        0,
        urls.indexOf(current) >= 0 ? urls.indexOf(current) : this.previewIndex,
      )
      this.$emit('preview', { current, currentIndex, urls })
      Promise.all(urls.map(preparePreviewImageUrl)).then((preparedUrls) => {
        const preparedCurrentIndex = Math.min(currentIndex, preparedUrls.length - 1)
        try {
          uni.previewImage({
            current: preparedUrls[preparedCurrentIndex],
            urls: preparedUrls,
            success: () =>
              this.$emit('preview-opened', {
                current: preparedUrls[preparedCurrentIndex],
                currentIndex: preparedCurrentIndex,
                urls: preparedUrls,
              }),
            fail: (error: unknown) => {
              console.error('[PawHome][PawImage] previewImage failed', {
                current: preparedUrls[preparedCurrentIndex],
                currentIndex: preparedCurrentIndex,
                urls: preparedUrls,
                error,
              })
              uni.showToast({ title: '图片预览失败，请稍后重试', icon: 'none' })
            },
          })
        } catch (error: unknown) {
          console.error('[PawHome][PawImage] previewImage threw', error)
          uni.showToast({ title: '图片预览失败，请稍后重试', icon: 'none' })
        }
      })
    },
    onLoad(event: PawEvent) {
      this.$emit('load', event)
    },
    onError(event: PawEvent) {
      this.$emit('error', event)
    },
  },
})
</script>

<style scoped>
.paw-image {
  display: block;
  min-width: 0;
  overflow: hidden;
  background: #eee;
}

.paw-image--square {
  aspect-ratio: 1 / 1;
}

.paw-image--interactive {
  cursor: pointer;
}

.paw-image__content {
  display: block;
  width: 100%;
  height: 100%;
}

.paw-image--original .paw-image__content {
  height: auto;
}
</style>
