<template>
  <PawBottomSheet v-model:visible="visibleProxy" variant="share" height="371px" :close-on-mask="true" :safe-area="true"
    :z-index="10040">
    <view class="share-action-sheet">
      <text class="share-action-sheet__title">分享至</text>

      <view class="share-action-sheet__main-row">
        <view v-for="item in mainActions" :key="item.key" class="share-action-sheet__cell"
          hover-class="share-action-sheet__cell--pressed" @tap.stop="onPick(item.key)">
          <view class="share-action-sheet__bubble" :style="bubbleStyle(item.bubble)">
            <PawIcon class="share-action-sheet__icon" :name="item.iconName" :size="item.iconSize" />
          </view>
          <text class="share-action-sheet__label">{{ item.label }}</text>
        </view>
      </view>

      <image class="share-action-sheet__line" src="/static/figma/share-action-sheet/divider.svg" mode="aspectFit" />

      <view class="share-action-sheet__report-cell" hover-class="share-action-sheet__cell--pressed"
        @tap.stop="onPick('report')">
        <view class="share-action-sheet__bubble"
          :style="bubbleStyle('/static/figma/share-action-sheet/report-bubble.svg')">
          <PawIcon class="share-action-sheet__icon" name="brand/share-report" :size="27" />
        </view>
        <text class="share-action-sheet__label">举报</text>
      </view>

      <view class="share-action-sheet__close" hover-class="share-action-sheet__close--pressed" @tap.stop="close">
        <PawIcon class="share-action-sheet__close-icon" name="navigation/share-close" :size="11" />
      </view>
    </view>
  </PawBottomSheet>
</template>

<script>
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'

export default {
  name: 'ShareActionSheet',
  components: { PawBottomSheet, PawIcon },
  props: {
    visible: { type: Boolean, default: false },
    // 页面控制器提供当前业务对象，组件只负责把它原样带回选择事件。
    shareData: { type: Object, default: () => ({}) }
  },
  emits: ['update:visible', 'select', 'close'],
  data() {
    return {
      mainActions: [
        {
          key: 'poster',
          label: '生成海报',
          bubble: '/static/figma/share-action-sheet/poster-bubble.svg',
          iconName: 'brand/share-poster',
          iconSize: 27
        },
        {
          key: 'link',
          label: '复制链接',
          bubble: '/static/figma/share-action-sheet/link-bubble.svg',
          iconName: 'brand/share-link',
          iconSize: 29
        },
        {
          key: 'wechat',
          label: '微信',
          bubble: '/static/figma/share-action-sheet/wechat-bubble.svg',
          iconName: 'brand/share-wechat',
          iconSize: 25
        },
        {
          key: 'moments',
          label: '朋友圈',
          bubble: '/static/figma/share-action-sheet/moments-bubble.svg',
          iconName: 'brand/share-moments',
          iconSize: 38
        }
      ]
    }
  },
  computed: {
    visibleProxy: {
      get() { return this.visible },
      set(value) { this.$emit('update:visible', value) }
    }
  },
  methods: {
    bubbleStyle(url) {
      return { backgroundImage: `url(${url})` }
    },
    close() {
      this.$emit('update:visible', false)
      this.$emit('close')
    },
    onPick(key) {
      this.$emit('select', key, this.shareData)
      this.close()
    }
  }
}
</script>

<style scoped>
.share-action-sheet {
  display: flex;
  width: 100%;
  height: 337px;
  min-height: 0;
  flex-direction: column;
  align-items: stretch;
  padding: 23px 20px 0;
  box-sizing: border-box;
}

.share-action-sheet__title {
  display: block;
  flex: 0 0 20px;
  height: 20px;
  color: #999;
  font-size: 14px;
  line-height: 20px;
  white-space: nowrap;
}

.share-action-sheet__main-row {
  display: flex;
  flex: 0 0 67px;
  align-items: flex-start;
  gap: 20px;
  width: 100%;
  max-width: 320px;
  height: 67px;
  margin-top: 17px;
}

.share-action-sheet__cell,
.share-action-sheet__report-cell {
  display: flex;
  flex: 0 0 48px;
  flex-direction: column;
  align-items: center;
  width: 48px;
  height: 67px;
}

.share-action-sheet__bubble {
  display: flex;
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  align-items: center;
  justify-content: center;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
}

.share-action-sheet__icon {
  display: block;
  flex: 0 0 auto;
}

.share-action-sheet__label {
  display: block;
  height: 17px;
  margin-top: 2px;
  color: #999;
  font-size: 12px;
  line-height: 17px;
  text-align: center;
  white-space: nowrap;
}

.share-action-sheet__line {
  display: block;
  flex: 0 0 0.7px;
  width: 100%;
  height: 0.7px;
  margin-top: 17px;
}

.share-action-sheet__report-cell {
  margin-top: 16.3px;
}

.share-action-sheet__close {
  display: flex;
  width: 57px;
  height: 57px;
  flex: 0 0 57px;
  align-items: center;
  justify-content: center;
  margin: 52px auto 0;
  background-image: url('/static/figma/share-action-sheet/close-bg.svg');
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
}

.share-action-sheet__close-icon {
  display: block;
  z-index: 1;
  flex: 0 0 auto;
}

.share-action-sheet__cell--pressed .share-action-sheet__bubble,
.share-action-sheet__close--pressed {
  transform: scale(.94);
  transition: transform 120ms ease;
}
</style>
