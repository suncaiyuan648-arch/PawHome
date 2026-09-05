<template>
  <view class="yard-feed-lab" data-qa="yard-feed-icon-lab">
    <view class="lab-header">
      <text class="lab-title">yard-feed 图标素材对比</text>
      <text class="lab-description">干净布局：不接入业务卡片、徽标或外层横向居中，仅观察图标自身画布与绘制边界。</text>
    </view>

    <view class="lab-section">
      <view class="section-title-row">
        <text class="section-title">PawIcon 多尺寸</text>
        <text class="section-meta">24×24 design canvas</text>
      </view>
      <view v-for="size in sizes" :key="size" class="icon-row" :data-qa="`yard-feed-size-${size}`">
        <view class="icon-frame" :style="frameStyle(size)">
          <PawIcon name="actions/yard-feed" :size="size" />
        </view>
        <view class="icon-copy">
          <text class="icon-size">{{ size }}px</text>
          <text class="icon-detail">layout {{ size }} × {{ size }}px · source /static/paw-icons/color/actions/yard-feed.svg</text>
        </view>
      </view>
    </view>

    <view class="lab-section raw-section">
      <view class="section-title-row">
        <text class="section-title">原图 150px 预览</text>
        <text class="section-meta">同一运行时 SVG</text>
      </view>
      <view class="raw-frame">
        <image class="raw-image" src="/static/paw-icons/color/actions/yard-feed.svg" mode="aspectFit" />
      </view>
      <text class="raw-detail">viewBox 0 0 24 24 · image layout 150 × 150px</text>
    </view>
  </view>
</template>

<script>
import PawIcon from '@/components/PawIcon/PawIcon.vue'

export default {
  name: 'YardFeedIconLab',
  components: { PawIcon },
  data() {
    return {
      sizes: [16, 19, 22, 24, 28, 32, 48, 64, 96]
    }
  },
  methods: {
    frameStyle(size) {
      return {
        width: `${size}px`,
        height: `${size}px`
      }
    }
  }
}
</script>

<style>
.yard-feed-lab {
  min-height: 100vh;
  padding: 20px 16px 40px;
  box-sizing: border-box;
  background: #f5f6f7;
  color: #202124;
}

.lab-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.lab-title {
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
}

.lab-description,
.section-meta,
.icon-detail,
.raw-detail {
  color: #73777d;
  font-size: 11px;
  line-height: 17px;
}

.lab-section {
  padding: 14px;
  border-radius: 10px;
  background: #ffffff;
  box-sizing: border-box;
}

.raw-section {
  margin-top: 12px;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.icon-row {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 102px;
  border-bottom: 1px solid #f0f1f2;
}

.icon-row:last-child {
  border-bottom: 0;
}

.icon-frame {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  flex: 0 0 auto;
  border: 1px solid #4d8dff;
  background: #ffffff;
  box-sizing: content-box;
}

.icon-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.icon-size {
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
}

.icon-detail {
  word-break: break-all;
}

.raw-frame {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  width: 150px;
  height: 150px;
  border: 1px solid #4d8dff;
  background: #ffffff;
  box-sizing: content-box;
}

.raw-image {
  display: block;
  width: 150px;
  height: 150px;
}

.raw-detail {
  display: block;
  margin-top: 9px;
}
</style>
