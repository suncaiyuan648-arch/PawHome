<template>
  <view class="voice-comment" :class="{ 'voice-comment--playing': playing }" @tap.stop="$emit('toggle')">
    <PawIcon class="voice-comment__icon" name="actions/comment-voice" :size="14" />
    <text class="voice-comment__duration">{{ duration }}</text>
  </view>
</template>

<script>
import PawIcon from '@/components/PawIcon/PawIcon.vue'

export default {
  name: 'VoiceComment',
  components: { PawIcon },
  props: {
    duration: { type: String, default: '2″' },
    playing: { type: Boolean, default: false },
    bars: { type: Array, default: () => [6, 10, 5, 12, 7] }
  },
  emits: ['toggle']
}
</script>

<style scoped>
.voice-comment {
  display: inline-flex;
  align-items: center;
  width: 65px;
  height: 33px;
  padding: 0 0 0 11px;
  box-sizing: border-box;
  border: .5px solid #e6e6e6;
  border-radius: 7px;
  background: #fafafa;
  color: #323232;
}

.voice-comment__icon {
  flex-shrink: 0;
}

.voice-comment__duration {
  margin-left: 6px;
  font-size: 13px;
  font-weight: 500;
  line-height: 16px;
}
</style>
