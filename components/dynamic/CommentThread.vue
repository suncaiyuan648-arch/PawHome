<template>
  <view class="comment-thread">
    <text v-if="total" class="comment-thread__title">{{ total }}</text>
    <slot name="before" />
    <PawEmptyState v-if="empty" class="comment-thread__empty" image="/static/figma/dynamic-comment-empty.png"
      title="还没有评论" action-text="抢首评" compact @action="$emit('empty-action')" />
    <template v-else>
      <CommentItem v-for="(comment, index) in visibleComments" :key="comment.id"
        :class="{ 'comment-item--first': index === 0, 'comment-item--second': index === 1, 'comment-item--voice': comment.kind === 'voice' }"
        :comment="comment" :playing="playingId === comment.id" @user-click="$emit('user-click', $event)"
        @reply="$emit('reply', $event)" @like="$emit('like', $event)" @voice-play="onVoicePlay" />
      <view v-if="hiddenCommentCount > 0" id="qa-dynamic-detail-expand-comments" class="comment-thread__expand"
        @tap.stop="toggleComments">
        <PawDivider class="comment-thread__expand-line" :width="34" :thickness="0.3" /><text>{{
          commentsExpanded ? '收起评论' : `展开 ${hiddenCommentCount} 条评论` }}</text>
      </view>
    </template>
    <slot name="after" />
  </view>
</template>

<script>
import CommentItem from '@/components/dynamic/CommentItem.vue'
import PawEmptyState from '@/components/feedback/PawEmptyState.vue'
import PawDivider from '@/components/base/PawDivider.vue'

export default {
  name: 'CommentThread',
  components: { CommentItem, PawEmptyState, PawDivider },
  props: {
    comments: { type: Array, default: () => [] },
    total: { type: String, default: '' },
    empty: { type: Boolean, default: false },
    commentPreviewCount: { type: Number, default: 3 }
  },
  emits: ['user-click', 'reply', 'like', 'voice-play', 'expand-comments', 'empty-action'],
  data() { return { commentsExpanded: false, playingId: null } },
  computed: {
    visibleComments() { return this.commentsExpanded ? this.comments : this.comments.slice(0, this.commentPreviewCount) },
    hiddenCommentCount() { return Math.max(0, this.comments.length - this.commentPreviewCount) }
  },
  methods: {
    toggleComments() {
      this.commentsExpanded = !this.commentsExpanded
      this.$emit('expand-comments', this.commentsExpanded)
    },
    onVoicePlay(comment) {
      this.playingId = this.playingId === comment.id ? null : comment.id
      this.$emit('voice-play', comment)
    }
  }
}
</script>

<style scoped>
.comment-thread {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  box-sizing: border-box;
}

.comment-thread__title {
  display: block;
  margin-bottom: 0;
  color: #333;
  font-size: 13px;
  font-weight: 500;
  line-height: 19px;
}

.comment-thread__expand {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  color: #616161;
  font-size: 12px;
  font-weight: 500;
  line-height: 17px;
}

.comment-thread__empty {
  margin: 0;
}

.comment-thread__empty :deep(.paw-empty-state__title) {
  color: #666;
}

.comment-thread__empty :deep(.paw-button--ghost) {
  border-width: .6px;
  border-color: #d9d9d9;
  color: #333;
}
</style>
