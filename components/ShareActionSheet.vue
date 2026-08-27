<template>
  <PawBottomSheet v-model:visible="visibleProxy" variant="share" :close-on-mask="true" :safe-area="true" :z-index="10040">
    <text class="share-action-sheet__title">分享至</text>
    <view class="share-action-sheet__row share-action-sheet__row--main">
      <view v-for="item in mainActions" :key="item.key" class="share-action-sheet__cell" @tap.stop="onPick(item.key)">
        <view class="share-action-sheet__bubble" :class="`share-action-sheet__bubble--${item.key}`"><uni-icons :type="item.icon" :size="item.iconSize" :color="item.iconColor" /></view>
        <text class="share-action-sheet__label">{{ item.label }}</text>
      </view>
    </view>
    <view class="share-action-sheet__line"></view>
    <view class="share-action-sheet__row"><view class="share-action-sheet__cell" @tap.stop="onPick('report')"><view class="share-action-sheet__bubble share-action-sheet__bubble--report"><uni-icons type="info-filled" :size="22" color="#fff" /></view><text class="share-action-sheet__label">举报</text></view></view>
    <view class="share-action-sheet__close-wrap"><view class="share-action-sheet__close" @tap.stop="close"><text>×</text></view></view>
  </PawBottomSheet>
</template>

<script>
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'

export default {
  name: 'ShareActionSheet',
  components: { PawBottomSheet },
  props: { visible: { type: Boolean, default: false } },
  emits: ['update:visible', 'select', 'close'],
  data() { return { mainActions: [
    { key: 'poster', label: '生成海报', icon: 'images-filled', iconSize: 22, iconColor: '#fff' },
    { key: 'link', label: '复制链接', icon: 'link', iconSize: 22, iconColor: '#fff' },
    { key: 'wechat', label: '微信', icon: 'weixin', iconSize: 26, iconColor: '#07c160' },
    { key: 'moments', label: '朋友圈', icon: 'pyq', iconSize: 26, iconColor: '#576b95' }
  ] } },
  computed: { visibleProxy: { get() { return this.visible }, set(value) { this.$emit('update:visible', value) } } },
  methods: {
    close() { this.$emit('update:visible', false); this.$emit('close') },
    onPick(key) { this.$emit('select', key); this.close() }
  }
}
</script>

<style scoped>
.share-action-sheet__title { display: block; padding: 23px 20px 0; color: #999; font-size: 14px; line-height: 20px; }
.share-action-sheet__row { display: flex; align-items: flex-start; padding: 16px 20px 0; }
.share-action-sheet__row--main { justify-content: space-between; padding-top: 17px; }
.share-action-sheet__cell { display: flex; flex-direction: column; align-items: center; width: 48px; flex-shrink: 0; }
.share-action-sheet__row--main .share-action-sheet__cell { flex: 1; width: 0; }
.share-action-sheet__bubble { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%; }
.share-action-sheet__bubble--poster { background: #ffeb3b; }
.share-action-sheet__bubble--link { background: #ff9800; }
.share-action-sheet__bubble--wechat, .share-action-sheet__bubble--moments { background: #ececec; }
.share-action-sheet__bubble--report { background: #ff5252; }
.share-action-sheet__label { max-width: 72px; margin-top: 5px; color: #999; font-size: 12px; line-height: 17px; text-align: center; }
.share-action-sheet__line { height: 1px; margin: 16px 20px 0; background: #e9e9e9; }
.share-action-sheet__close-wrap { display: flex; justify-content: center; padding: 36px 0 16px; }
.share-action-sheet__close { display: flex; align-items: center; justify-content: center; width: 57px; height: 57px; border-radius: 50%; background: #f5f5f5; }
.share-action-sheet__close text { color: #111; font-size: 28px; font-weight: 300; line-height: 1; }
</style>
