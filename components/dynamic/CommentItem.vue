<template>
  <view class="comment-item" :class="{ 'comment-item--reply': !!comment.replyTo }">
    <PawUserIdentity class="comment-item__identity" :avatar="author.avatar" :name="author.name" :level="author.level" :owner="author.owner || comment.owner" block @click="$emit('user-click', comment)">
      <VoiceComment v-if="comment.kind === 'voice'" :duration="comment.duration" :playing="playing" :bars="comment.voiceBars" @toggle="$emit('voice-play', comment)" />
      <view v-else-if="comment.replyTo" class="comment-item__copy comment-item__copy--reply"><text>回复</text><text class="comment-item__reply-target">{{ comment.replyTo.name }}</text><LevelCapsule :level="comment.replyTo.level || 1" :inline="true" /><text class="comment-item__reply-body">：{{ comment.copy || comment.text }}</text></view>
      <text v-else class="comment-item__copy">{{ comment.copy || comment.text }}</text>
      <view class="comment-item__meta"><view class="comment-item__meta-left"><text>{{ comment.meta }}</text><text class="comment-item__reply" @tap.stop="$emit('reply', comment)">回复</text></view><view class="comment-item__like" @tap.stop="$emit('like', comment)"><image :src="comment.liked ? '/static/figma/dynamic-detail/comment-like.svg' : '/static/figma/dynamic-detail/like-icon.svg'" mode="aspectFit" /><text>{{ comment.likes || 0 }}</text></view></view>
    </PawUserIdentity>
  </view>
</template>

<script>
import PawUserIdentity from '@/components/identity/PawUserIdentity.vue'
import VoiceComment from '@/components/dynamic/VoiceComment.vue'
import LevelCapsule from '@/components/LevelCapsule.vue'

export default {
  name: 'CommentItem',
  components: { PawUserIdentity, VoiceComment, LevelCapsule },
  props: { comment: { type: Object, default: () => ({}) }, playing: { type: Boolean, default: false } },
  emits: ['user-click', 'reply', 'like', 'voice-play'],
  computed: { author() { return this.comment.author || this.comment } }
}
</script>

<style scoped>
.comment-item { display: flex; align-items: flex-start; min-height: 52px; margin-top: 16px; }
.comment-item--first { min-height: 81px; margin-top: 19px; }
.comment-item--second { min-height: 83px; margin-top: 12px; }
.comment-item--voice { min-height: 83px; }
.comment-item--reply { min-height: 80px; margin-top: 7px; padding-left: 30px; box-sizing: border-box; }
.comment-item__identity { display: flex; flex: 1 1 auto; width: 100%; align-items: flex-start; min-width: 0; box-sizing: border-box; }
.comment-item__identity :deep(.paw-user-identity) { display: flex; flex: 1 1 auto; width: 100%; min-width: 0; box-sizing: border-box; }
.comment-item__identity :deep(.paw-avatar) { width: 33px !important; height: 33px !important; }
.comment-item__identity :deep(.paw-user-identity__content) { flex: 0 0 calc(100% - 42px); width: calc(100% - 42px); min-width: 0; }
.comment-item__identity :deep(.paw-user-identity__name) { color: #adadad; font-weight: 400; }
.comment-item__copy :deep(.voice-comment) { margin-top: 5px; }
.comment-item__copy { display: block; margin-top: 5px; color: #333; font-size: 13px; line-height: 18px; word-break: break-all; }
.comment-item__copy--reply { display: block; }
.comment-item__copy--reply text { display: inline; }
.comment-item__copy--reply :deep(.level-capsule),
.comment-item__copy--reply :deep(.level-capsule__inline) { display: inline-flex; vertical-align: middle; margin: 0 3px; }
.comment-item__reply-body { min-width: 0; }
.comment-item__reply-target { color: #adadad; }
.comment-item__meta { display: flex; width: 100%; align-items: center; justify-content: space-between; margin-top: 6px; box-sizing: border-box; color: #8c8c8c; font-size: 12px; line-height: 16px; }
.comment-item__meta-left { display: flex; flex: 1 1 auto; min-width: 0; align-items: center; }
.comment-item__reply { margin-left: 10px; color: #616161; }
.comment-item__like { display: inline-flex; flex-shrink: 0; align-items: center; justify-content: flex-end; gap: 4px; margin-left: auto; color: #777; font-size: 13px; }
.comment-item__like image { width: 13px; height: 14px; }
.comment-item__like text.liked { color: #ff3b52; }
</style>
