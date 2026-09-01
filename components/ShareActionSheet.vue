<template>
  <PawBottomSheet v-model:visible="visibleProxy" variant="share" height="371px" :close-on-mask="true" :safe-area="true"
    :z-index="10040">
    <view class="share-action-sheet">
      <text class="share-action-sheet__title">分享至</text>

      <view class="share-action-sheet__main-row">
        <view v-for="item in mainActions" :key="item.key" class="share-action-sheet__cell"
          hover-class="share-action-sheet__cell--pressed" @tap.stop="onPick(item.key)">
          <view class="share-action-sheet__bubble">
            <image class="share-action-sheet__bubble-bg" :src="item.bubble" mode="aspectFit" />
            <PawIcon class="share-action-sheet__icon" :class="`share-action-sheet__icon--${item.key}`"
              :name="item.iconName" :size="item.iconSize" />
          </view>
          <text class="share-action-sheet__label">{{ item.label }}</text>
        </view>
      </view>

      <image class="share-action-sheet__line" src="/static/figma/share-action-sheet/divider.svg" mode="aspectFit" />

      <view class="share-action-sheet__report-cell" hover-class="share-action-sheet__cell--pressed"
        @tap.stop="onPick('report')">
        <view class="share-action-sheet__bubble">
          <image class="share-action-sheet__bubble-bg" src="/static/figma/share-action-sheet/report-bubble.svg"
            mode="aspectFit" />
          <PawIcon class="share-action-sheet__icon share-action-sheet__icon--report" name="brand/share-report"
            :size="27" />
        </view>
        <text class="share-action-sheet__label">举报</text>
      </view>

      <view class="share-action-sheet__close" hover-class="share-action-sheet__close--pressed" @tap.stop="close">
        <image class="share-action-sheet__close-bg" src="/static/figma/share-action-sheet/close-bg.svg"
          mode="aspectFit" />
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
  props: { visible: { type: Boolean, default: false } },
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
    close() {
      this.$emit('update:visible', false)
      this.$emit('close')
    },
    onPick(key) {
      this.$emit('select', key)
      this.close()
    }
  }
}
</script>

<style scoped>
.share-action-sheet {
  position: relative;
  width: 100%;
  height: 337px;
  box-sizing: border-box;
}

.share-action-sheet__title {
  position: absolute;
  top: 23px;
  left: 20px;
  display: block;
  width: 42px;
  height: 20px;
  color: #999;
  font-size: 14px;
  line-height: 20px;
  white-space: nowrap;
}

.share-action-sheet__main-row {
  position: absolute;
  top: 60px;
  left: 20px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  width: 320px;
  height: 67px;
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
  position: relative;
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
}

.share-action-sheet__bubble-bg,
.share-action-sheet__icon,
.share-action-sheet__close-bg,
.share-action-sheet__close-icon {
  position: absolute;
  display: block;
}

.share-action-sheet__bubble-bg {
  inset: 0;
  width: 48px;
  height: 48px;
}

.share-action-sheet__icon--poster {
  top: 10px;
  left: 10px;
}

.share-action-sheet__icon--link {
  top: 10px;
  left: 9px;
}

.share-action-sheet__icon--wechat {
  top: 12px;
  left: 11px;
}

.share-action-sheet__icon--moments {
  top: 5px;
  left: 5px;
}

.share-action-sheet__icon--report {
  top: 11px;
  left: 10px;
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
  position: absolute;
  top: 144px;
  left: 0;
  display: block;
  width: 100%;
  height: 0.7px;
}

.share-action-sheet__report-cell {
  position: absolute;
  top: 161px;
  left: 20px;
}

.share-action-sheet__close {
  position: absolute;
  top: 280px;
  left: 159px;
  width: 57px;
  height: 57px;
}

.share-action-sheet__close-bg {
  inset: 0;
  width: 57px;
  height: 57px;
}

.share-action-sheet__close-icon {
  top: 23px;
  left: 23px;
}

.share-action-sheet__cell--pressed .share-action-sheet__bubble,
.share-action-sheet__close--pressed {
  transform: scale(.94);
  transition: transform 120ms ease;
}
</style>
