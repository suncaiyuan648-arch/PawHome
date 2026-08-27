<template>
  <view class="comment-thread">
    <text v-if="total" class="comment-thread__title">{{ total }}</text>
    <slot name="before" />
    <PawEmptyState v-if="empty" image="/static/figma/dynamic-comment-empty.png" title="还没有评论" action-text="抢首评" compact @action="$emit('empty-action')" />
    <template v-else>
      <CommentItem v-for="comment in visibleComments" :key="comment.id" :comment="comment" :playing="playingId === comment.id" @user-click="$emit('user-click', $event)" @reply="$emit('reply', $event)" @like="$emit('like', $event)" @voice-play="onVoicePlay" />
      <view v-if="hiddenCount > 0" class="comment-thread__expand" @tap.stop="expanded = !expanded"><text>{{ expanded ? '收起' : `展开 ${hiddenCount} 条回复` }}</text></view>
    </template>
    <slot name="after" />
  </view>
</template>

<script>
import CommentItem from '@/components/dynamic/CommentItem.vue'
import PawEmptyState from '@/components/feedback/PawEmptyState.vue'

export default {
  name: 'CommentThread',
  components: { CommentItem, PawEmptyState },
  props: {
    comments: { type: Array, default: () => [] },
    total: { type: String, default: '' },
    empty: { type: Boolean, default: false },
    replyPreviewCount: { type: Number, default: 2 }
  },
  emits: ['user-click', 'reply', 'like', 'voice-play', 'expand-replies', 'empty-action'],
  data() { return { expanded: false, playingId: null } },
  computed: {
    visibleComments() { return this.expanded ? this.comments : this.comments.slice(0, this.replyPreviewCount) },
    hiddenCount() { return Math.max(0, this.comments.length - this.replyPreviewCount) }
  },
  methods: {
    onVoicePlay(comment) {
      this.playingId = this.playingId === comment.id ? null : comment.id
      this.$emit('voice-play', comment)
    }
  }
}
</script>

<style scoped>
.comment-thread { padding: 0 13px 30px; box-sizing: border-box; }
.comment-thread__title { display: block; margin-bottom: 8px; color: #333; font-size: 14px; font-weight: 500; line-height: 20px; }
.comment-thread__expand { margin: 14px 0 0 41px; color: #616161; font-size: 12px; font-weight: 500; line-height: 18px; }
</style>
