<template>
  <view class="paw-image"
    :class="[`paw-image--${normalizedDisplayMode}`, { 'paw-image--interactive': preview || clickable }]"
    :style="containerStyle" @tap.stop="onTap">
    <image class="paw-image__content" :src="resolvedSrc" :mode="imageMode" :lazy-load="lazyLoad" @load="onLoad"
      @error="onError" />
    <slot />
  </view>
</template>

<script>
import { safeImgSrc } from '@/utils/safeImgSrc.js'

function asCssSize(value) {
  if (value === undefined || value === null || value === '') return ''
  return typeof value === 'number' ? `${value}px` : String(value)
}

function normalizeUrl(value) {
  if (typeof value !== 'string') return ''
  const url = value.trim()
  return /^(?:\/|https?:\/\/|wxfile:\/\/|cloud:\/\/)/i.test(url) ? url : ''
}

function sourceUrl(value) {
  if (typeof value === 'string') return normalizeUrl(value)
  if (!value || typeof value !== 'object') return ''
  return normalizeUrl(value.src || value.url || value.path || value.image)
}

function isPackagedImageUrl(url) {
  return /^\/static\//i.test(url)
}

function preparePreviewImageUrl(url) {
  if (!isPackagedImageUrl(url) || typeof uni === 'undefined' || typeof uni.compressImage !== 'function') {
    return Promise.resolve(url)
  }

  return new Promise((resolve) => {
    const fallback = (error) => {
      console.warn('[PawHome][PawImage] packaged preview image preparation failed, using source path', {
        url,
        error
      })
      resolve(url)
    }

    try {
      uni.compressImage({
        src: url,
        compressedWidth: 1080,
        success: (result) => resolve(normalizeUrl(result && result.tempFilePath) || url),
        fail: fallback
      })
    } catch (error) {
      fallback(error)
    }
  })
}

export default {
  name: 'PawImage',
  props: {
    src: { type: String, default: '' },
    fallback: { type: String, default: '/static/home-feed-1.png' },
    // square: 由 size/width 生成等宽高；fixed: 使用传入的 width/height；original: 保持原比例宽度展示。
    displayMode: { type: String, default: 'square' },
    size: { type: [Number, String], default: '' },
    width: { type: [Number, String], default: '' },
    height: { type: [Number, String], default: '' },
    radius: { type: [Number, String], default: '' },
    preview: { type: Boolean, default: true },
    clickable: { type: Boolean, default: false },
    previewUrls: { type: Array, default: () => [] },
    previewIndex: { type: Number, default: 0 },
    lazyLoad: { type: Boolean, default: false }
  },
  emits: ['click', 'preview', 'preview-opened', 'load', 'error'],
  computed: {
    resolvedSrc() {
      return safeImgSrc(this.src, this.fallback)
    },
    normalizedDisplayMode() {
      return ['square', 'fixed', 'original'].includes(this.displayMode) ? this.displayMode : 'square'
    },
    imageMode() {
      return this.normalizedDisplayMode === 'original' ? 'widthFix' : 'aspectFill'
    },
    containerStyle() {
      const squareSize = asCssSize(this.size || this.width || this.height)
      const width = asCssSize(this.normalizedDisplayMode === 'square' ? (this.size || this.width || this.height) : (this.width || this.size))
      const height = asCssSize(this.normalizedDisplayMode === 'fixed' ? (this.height || this.size) : (this.normalizedDisplayMode === 'square' ? squareSize : ''))
      const style = {}
      if (width) style.width = width
      if (height) style.height = height
      if (this.radius !== '') style.borderRadius = asCssSize(this.radius)
      return style
    }
  },
  methods: {
    onTap(event) {
      this.$emit('click', event)
      if (!this.preview) return

      const current = sourceUrl(this.src) || sourceUrl(this.resolvedSrc)
      const urls = Array.from(new Set([
        ...this.previewUrls.map(sourceUrl).filter(Boolean),
        current
      ].filter(Boolean)))
      if (!urls.length) {
        uni.showToast({ title: '暂无可预览图片', icon: 'none' })
        return
      }

      const currentIndex = Math.max(0, urls.indexOf(current) >= 0 ? urls.indexOf(current) : this.previewIndex)
      this.$emit('preview', { current, currentIndex, urls })
      Promise.all(urls.map(preparePreviewImageUrl)).then((preparedUrls) => {
        const preparedCurrentIndex = Math.min(currentIndex, preparedUrls.length - 1)
        try {
          uni.previewImage({
            current: preparedCurrentIndex,
            urls: preparedUrls,
            success: () => this.$emit('preview-opened', {
              current: preparedUrls[preparedCurrentIndex],
              currentIndex: preparedCurrentIndex,
              urls: preparedUrls
            }),
            fail: (error) => {
              console.error('[PawHome][PawImage] previewImage failed', {
                current: preparedUrls[preparedCurrentIndex],
                currentIndex: preparedCurrentIndex,
                urls: preparedUrls,
                error
              })
              uni.showToast({ title: '图片预览失败，请稍后重试', icon: 'none' })
            }
          })
        } catch (error) {
          console.error('[PawHome][PawImage] previewImage threw', error)
          uni.showToast({ title: '图片预览失败，请稍后重试', icon: 'none' })
        }
      })
    },
    onLoad(event) { this.$emit('load', event) },
    onError(event) { this.$emit('error', event) }
  }
}
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
