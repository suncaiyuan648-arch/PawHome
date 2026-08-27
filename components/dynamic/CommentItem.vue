<template>
  <view class="comment-item">
    <PawUserIdentity class="comment-item__identity" :avatar="author.avatar" :name="author.name" :level="author.level" :owner="author.owner || comment.owner" @click="$emit('user-click', comment)">
      <VoiceComment v-if="comment.kind === 'voice'" :duration="comment.duration" :playing="playing" :bars="comment.voiceBars" @toggle="$emit('voice-play', comment)" />
      <text v-else class="comment-item__copy">{{ comment.copy || comment.text }}</text>
      <view class="comment-item__meta"><view><text>{{ comment.meta }}</text><text class="comment-item__reply" @tap.stop="$emit('reply', comment)">回复</text></view><view class="comment-item__like" @tap.stop="$emit('like', comment)"><text :class="{ liked: comment.liked }">♥</text><text>{{ comment.likes || 0 }}</text></view></view>
    </PawUserIdentity>
  </view>
</template>

<script>
import PawUserIdentity from '@/components/identity/PawUserIdentity.vue'
import VoiceComment from '@/components/dynamic/VoiceComment.vue'

export default {
  name: 'CommentItem',
  components: { PawUserIdentity, VoiceComment },
  props: { comment: { type: Object, default: () => ({}) }, playing: { type: Boolean, default: false } },
  emits: ['user-click', 'reply', 'like', 'voice-play'],
  computed: { author() { return this.comment.author || this.comment } }
}
</script>

<style scoped>
.comment-item { display: flex; align-items: flex-start; min-height: 52px; margin-top: 16px; }
.comment-item__identity { display: flex; flex: 1; align-items: flex-start; min-width: 0; }
.comment-item__identity :deep(.paw-user-identity__content) { flex: 1; min-width: 0; }
.comment-item__copy { display: block; margin-top: 5px; color: #333; font-size: 13px; line-height: 18px; word-break: break-all; }
.comment-item__meta { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; color: #8c8c8c; font-size: 12px; line-height: 16px; }
.comment-item__reply { margin-left: 10px; color: #616161; }
.comment-item__like { display: inline-flex; align-items: center; gap: 4px; color: #777; font-size: 13px; }
.comment-item__like text:first-child { color: #aaa; font-size: 13px; }
.comment-item__like text:first-child.liked { color: #ff3b52; }
</style>
