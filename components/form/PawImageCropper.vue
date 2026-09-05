<template>
  <PawOverlay v-model:visible="visibleProxy" :close-on-mask="false" placement="center" :z-index="10060">
    <view class="paw-image-cropper" data-qa="paw-image-cropper" @tap.stop>
      <view class="paw-image-cropper__header">
        <text class="paw-image-cropper__title">设置头像</text>
        <view class="paw-image-cropper__close" data-qa="paw-image-cropper-cancel" @tap.stop="onCancel">
          <PawIcon name="navigation/close" :size="18" label="关闭" />
        </view>
      </view>

      <view class="paw-image-cropper__stage" :style="stageStyle">
        <view class="paw-image-cropper__image" v-if="imageReady" :style="imageStyle">
          <image :src="imagePath" mode="scaleToFill" />
        </view>
        <view v-else class="paw-image-cropper__loading">
          <text>正在加载图片…</text>
        </view>
        <view class="paw-image-cropper__frame" aria-hidden="true"></view>
        <view class="paw-image-cropper__touch-layer" @touchstart.stop="onTouchStart"
          @touchmove.stop.prevent="onTouchMove" @touchend.stop="onTouchEnd" @touchcancel.stop="onTouchEnd"></view>
      </view>

      <view class="paw-image-cropper__zoom-row">
        <view class="paw-image-cropper__zoom-action" data-qa="paw-image-cropper-zoom-out" @tap.stop="adjustScale(-0.1)">
          <text>−</text>
        </view>
        <text class="paw-image-cropper__hint">拖动图片调整位置，双指缩放</text>
        <view class="paw-image-cropper__zoom-action" data-qa="paw-image-cropper-zoom-in" @tap.stop="adjustScale(0.1)">
          <text>＋</text>
        </view>
      </view>

      <view class="paw-image-cropper__actions">
        <PawButton class="paw-image-cropper__button paw-image-cropper__button--cancel" tone="secondary" size="md" block
          :disabled="loading" @click="onCancel">取消</PawButton>
        <PawButton class="paw-image-cropper__button" tone="brand" size="md" block :loading="loading"
          :disabled="!imageReady" data-qa="paw-image-cropper-confirm" @click="onConfirm">设为头像</PawButton>
      </view>

      <canvas canvas-id="paw-image-cropper-canvas" class="paw-image-cropper__canvas" :width="cropSizePx"
        :height="cropSizePx" :style="canvasStyle"></canvas>
    </view>
  </PawOverlay>
</template>

<script>
import PawButton from '@/components/base/PawButton.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawOverlay from '@/components/overlay/PawOverlay.vue'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const touchPoint = touch => ({
  x: Number(touch && (touch.clientX !== undefined ? touch.clientX : touch.pageX)) || 0,
  y: Number(touch && (touch.clientY !== undefined ? touch.clientY : touch.pageY)) || 0
})

const touchDistance = touches => {
  if (!touches || touches.length < 2) return 0
  const first = touchPoint(touches[0])
  const second = touchPoint(touches[1])
  return Math.sqrt(Math.pow(second.x - first.x, 2) + Math.pow(second.y - first.y, 2))
}

export default {
  name: 'PawImageCropper',
  components: { PawButton, PawIcon, PawOverlay },
  props: {
    visible: { type: Boolean, default: false },
    src: { type: String, default: '' },
    cropSize: { type: [Number, String], default: 260 },
    maxScale: { type: Number, default: 3 }
  },
  emits: ['update:visible', 'confirm', 'cancel'],
  data() {
    return {
      imagePath: '',
      imageInfo: null,
      baseWidth: 0,
      baseHeight: 0,
      offsetX: 0,
      offsetY: 0,
      scaleValue: 1,
      loading: false,
      touchState: null
    }
  },
  computed: {
    visibleProxy: {
      get() { return this.visible },
      set(value) { this.$emit('update:visible', value) }
    },
    cropSizePx() {
      const value = Number(this.cropSize)
      return Number.isFinite(value) && value > 0 ? value : 260
    },
    maxScaleValue() {
      return Math.max(1, Number(this.maxScale) || 3)
    },
    imageReady() {
      return !!this.imageInfo && this.baseWidth > 0 && this.baseHeight > 0
    },
    stageStyle() {
      return { width: `${this.cropSizePx}px`, height: `${this.cropSizePx}px` }
    },
    imageStyle() {
      return {
        width: `${this.baseWidth}px`,
        height: `${this.baseHeight}px`,
        left: `${(this.cropSizePx - this.baseWidth) / 2}px`,
        top: `${(this.cropSizePx - this.baseHeight) / 2}px`,
        transform: `translate3d(${this.offsetX}px, ${this.offsetY}px, 0) scale(${this.scaleValue})`
      }
    },
    canvasStyle() {
      return {
        width: `${this.cropSizePx}px`,
        height: `${this.cropSizePx}px`
      }
    }
  },
  watch: {
    visible(value) {
      if (value) this.prepareImage()
      else this.resetState()
    },
    src(value) {
      if (this.visible && value) this.prepareImage()
    }
  },
  methods: {
    prepareImage() {
      const source = String(this.src || '')
      this.imagePath = source
      this.imageInfo = null
      this.baseWidth = 0
      this.baseHeight = 0
      this.offsetX = 0
      this.offsetY = 0
      this.scaleValue = 1
      this.touchState = null
      if (!source || typeof uni === 'undefined' || typeof uni.getImageInfo !== 'function') return

      uni.getImageInfo({
        src: source,
        success: result => {
          if (!this.visible || this.imagePath !== source) return
          const width = Number(result && result.width)
          const height = Number(result && result.height)
          if (!width || !height) return this.onImageError()
          const coverScale = Math.max(this.cropSizePx / width, this.cropSizePx / height)
          this.imageInfo = { width, height }
          this.baseWidth = width * coverScale
          this.baseHeight = height * coverScale
        },
        fail: () => this.onImageError()
      })
    },
    onImageError() {
      this.imageInfo = null
      this.$emit('update:visible', false)
      uni.showToast({ title: '图片读取失败，请重试', icon: 'none' })
    },
    resetState() {
      this.loading = false
      this.touchState = null
    },
    clampOffset() {
      const maxX = Math.max(0, (this.baseWidth * this.scaleValue - this.cropSizePx) / 2)
      const maxY = Math.max(0, (this.baseHeight * this.scaleValue - this.cropSizePx) / 2)
      this.offsetX = clamp(this.offsetX, -maxX, maxX)
      this.offsetY = clamp(this.offsetY, -maxY, maxY)
    },
    adjustScale(delta) {
      if (!this.imageReady) return
      this.scaleValue = clamp(Number((this.scaleValue + delta).toFixed(2)), 1, this.maxScaleValue)
      this.clampOffset()
    },
    onTouchStart(event) {
      if (!this.imageReady) return
      const touches = event && event.touches ? event.touches : []
      if (touches.length >= 2) {
        this.touchState = {
          type: 'pinch',
          distance: touchDistance(touches),
          scale: this.scaleValue
        }
        return
      }
      if (!touches.length) return
      const point = touchPoint(touches[0])
      this.touchState = {
        type: 'drag',
        x: point.x,
        y: point.y,
        offsetX: this.offsetX,
        offsetY: this.offsetY
      }
    },
    onTouchMove(event) {
      if (!this.imageReady || !this.touchState) return
      const touches = event && event.touches ? event.touches : []
      if (touches.length >= 2) {
        if (this.touchState.type !== 'pinch') return
        const distance = touchDistance(touches)
        if (!distance || !this.touchState.distance) return
        this.scaleValue = clamp(this.touchState.scale * distance / this.touchState.distance, 1, this.maxScaleValue)
        this.clampOffset()
        return
      }
      if (this.touchState.type !== 'drag' || !touches.length) return
      const point = touchPoint(touches[0])
      this.offsetX = this.touchState.offsetX + point.x - this.touchState.x
      this.offsetY = this.touchState.offsetY + point.y - this.touchState.y
      this.clampOffset()
    },
    onTouchEnd() {
      this.touchState = null
    },
    getCropRect() {
      const scaledWidth = this.baseWidth * this.scaleValue
      const scaledHeight = this.baseHeight * this.scaleValue
      const visualLeft = (this.cropSizePx - scaledWidth) / 2 + this.offsetX
      const visualTop = (this.cropSizePx - scaledHeight) / 2 + this.offsetY
      const sourceWidth = this.imageInfo.width * this.cropSizePx / scaledWidth
      const sourceHeight = this.imageInfo.height * this.cropSizePx / scaledHeight
      return {
        x: clamp(-visualLeft / scaledWidth * this.imageInfo.width, 0, this.imageInfo.width - sourceWidth),
        y: clamp(-visualTop / scaledHeight * this.imageInfo.height, 0, this.imageInfo.height - sourceHeight),
        width: sourceWidth,
        height: sourceHeight
      }
    },
    onConfirm() {
      if (!this.imageReady || this.loading) return
      if (typeof uni === 'undefined' || typeof uni.createCanvasContext !== 'function' ||
        typeof uni.canvasToTempFilePath !== 'function') {
        this.$emit('confirm', this.imagePath)
        this.visibleProxy = false
        return
      }
      this.loading = true
      const rect = this.getCropRect()
      const context = uni.createCanvasContext('paw-image-cropper-canvas', this)
      context.clearRect(0, 0, this.cropSizePx, this.cropSizePx)
      context.drawImage(this.imagePath, rect.x, rect.y, rect.width, rect.height, 0, 0, this.cropSizePx, this.cropSizePx)
      context.draw(false, () => {
        uni.canvasToTempFilePath({
          canvasId: 'paw-image-cropper-canvas',
          x: 0,
          y: 0,
          width: this.cropSizePx,
          height: this.cropSizePx,
          destWidth: this.cropSizePx,
          destHeight: this.cropSizePx,
          fileType: 'png',
          quality: 1,
          success: result => {
            this.loading = false
            if (!result || !result.tempFilePath) return this.onCropError()
            this.$emit('confirm', result.tempFilePath)
            this.visibleProxy = false
          },
          fail: () => this.onCropError()
        }, this)
      })
    },
    onCropError() {
      this.loading = false
      uni.showToast({ title: '图片裁剪失败，请重试', icon: 'none' })
    },
    onCancel() {
      if (this.loading) return
      this.$emit('cancel')
      this.visibleProxy = false
    }
  }
}
</script>

<style scoped>
.paw-image-cropper {
  display: flex;
  width: calc(100vw - 20px);
  max-width: 360px;
  flex-direction: column;
  align-items: center;
  padding: 18px 20px 20px;
  box-sizing: border-box;
  border-radius: 20px;
  background: #fff;
}

.paw-image-cropper__header {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
}

.paw-image-cropper__title {
  color: #333;
  font-size: 17px;
  font-weight: 700;
  line-height: 24px;
}

.paw-image-cropper__close {
  display: flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
}

.paw-image-cropper__stage {
  position: relative;
  overflow: hidden;
  margin-top: 16px;
  border-radius: 8px;
  background: #151515;
}

.paw-image-cropper__image {
  position: absolute;
  overflow: hidden;
  transform-origin: center center;
}

.paw-image-cropper__image image {
  display: block;
  width: 100%;
  height: 100%;
}

.paw-image-cropper__frame,
.paw-image-cropper__touch-layer {
  position: absolute;
  inset: 0;
}

.paw-image-cropper__frame {
  z-index: 2;
  border: 1px solid rgba(51, 51, 51, .5);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .55);
  border-radius: 8px;
  box-sizing: border-box;
  pointer-events: none;
}

.paw-image-cropper__touch-layer {
  z-index: 3;
}

.paw-image-cropper__loading {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 13px;
}

.paw-image-cropper__zoom-row {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
}

.paw-image-cropper__zoom-action {
  display: flex;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f2f2f2;
  color: #333;
  font-size: 21px;
  line-height: 30px;
}

.paw-image-cropper__hint {
  flex: 1 1 auto;
  min-width: 0;
  color: #999;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}

.paw-image-cropper__actions {
  display: flex;
  width: 100%;
  gap: 12px;
  margin-top: 18px;
}

.paw-image-cropper__button {
  flex: 1 1 0;
  min-width: 0;
}

.paw-image-cropper__button--cancel {
  background: #f2f2f2;
}

.paw-image-cropper__canvas {
  position: fixed;
  left: -1000px;
  top: -1000px;
  opacity: 0;
  pointer-events: none;
}
</style>
