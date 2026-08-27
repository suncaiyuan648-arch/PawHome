<template>
  <view class="voice-comment" :class="{ 'voice-comment--playing': playing }" @tap.stop="$emit('toggle')">
    <uni-icons type="sound" :size="14" color="#384d7b" />
    <view class="voice-comment__wave"><view v-for="(bar, index) in bars" :key="index" class="voice-comment__bar" :style="{ height: `${bar}px` }"></view></view>
    <text class="voice-comment__duration">{{ duration }}</text>
  </view>
</template>

<script>
export default {
  name: 'VoiceComment',
  props: {
    duration: { type: String, default: '2″' },
    playing: { type: Boolean, default: false },
    bars: { type: Array, default: () => [6, 10, 5, 12, 7] }
  },
  emits: ['toggle']
}
</script>

<style scoped>
.voice-comment { display: inline-flex; align-items: center; height: 33px; min-width: 65px; padding: 0 8px; box-sizing: border-box; border: .5px solid #e6e6e6; border-radius: 7px; background: #fafafa; color: #323232; }
.voice-comment__wave { display: inline-flex; align-items: center; gap: 2px; height: 18px; margin-left: 4px; }
.voice-comment__bar { width: 2px; min-height: 4px; border-radius: 2px; background: #384d7b; transform-origin: center; }
.voice-comment--playing .voice-comment__bar { animation: voice-comment-wave 520ms ease-in-out infinite alternate; }
.voice-comment__duration { margin-left: 5px; font-size: 13px; font-weight: 500; line-height: 16px; }
@keyframes voice-comment-wave { from { transform: scaleY(.65); } to { transform: scaleY(1); } }
</style>
