<template>
  <view class="comment-thread">
    <text v-if="total" class="comment-thread__title">{{ total }}</text>
    <slot name="before" />
    <PawEmptyState v-if="empty" class="comment-thread__empty" image="/static/figma/dynamic-comment-empty.png" title="还没有评论" action-text="抢首评" compact @action="$emit('empty-action')" />
    <template v-else>
      <CommentItem v-for="(comment, index) in visibleComments" :key="comment.id" :class="{ 'comment-item--first': index === 0, 'comment-item--second': index === 1, 'comment-item--voice': comment.kind === 'voice' }" :comment="comment" :playing="playingId === comment.id" @user-click="$emit('user-click', $event)" @reply="$emit('reply', $event)" @like="$emit('like', $event)" @voice-play="onVoicePlay" />
      <view v-if="expandCount > 0" id="qa-dynamic-detail-expand-replies" class="comment-thread__expand" @tap.stop="toggleExpanded"><image class="comment-thread__expand-line" src="/static/figma/dynamic-detail/comment-expand.svg" mode="aspectFit" /><text>{{ expanded ? '收起' : `展开 ${expandCount} 条回复` }}</text></view>
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
    replyPreviewCount: { type: Number, default: 2 },
    replyCount: { type: Number, default: 0 }
  },
  emits: ['user-click', 'reply', 'like', 'voice-play', 'expand-replies', 'empty-action'],
  data() { return { expanded: false, playingId: null } },
  computed: {
    visibleComments() { return this.expanded ? this.comments : this.comments.slice(0, this.replyPreviewCount) },
    hiddenCount() { return Math.max(0, this.comments.length - this.replyPreviewCount) },
    expandCount() { return this.replyCount || this.hiddenCount }
  },
  methods: {
    toggleExpanded() {
      this.expanded = !this.expanded
      this.$emit('expand-replies', this.expanded)
    },
    onVoicePlay(comment) {
      this.playingId = this.playingId === comment.id ? null : comment.id
      this.$emit('voice-play', comment)
    }
  }
}
</script>

<style scoped>
.comment-thread { padding: 16px 15px 30px; box-sizing: border-box; }
.comment-thread__title { display: block; margin-bottom: 17px; color: #333; font-size: 13px; font-weight: 500; line-height: 19px; }
.comment-thread__expand { display: flex; align-items: center; gap: 7px; margin: 2px 0 0 10px; color: #616161; font-size: 12px; font-weight: 500; line-height: 17px; }
.comment-thread__expand-line { width: 23px; height: 1px; }
.comment-thread__empty { margin: 0 -15px; }
.comment-thread__empty :deep(.paw-empty-state__title) { color: #666; }
.comment-thread__empty :deep(.paw-button--ghost) { border-width: .6px; border-color: #d9d9d9; color: #333; }
</style>
