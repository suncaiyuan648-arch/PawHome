<template>
  <view class="comment-item" :class="{ 'comment-item--reply': !!comment.replyTo }">
    <PawUserIdentity class="comment-item__identity" :avatar="author.avatar" :avatar-size="33" :name="author.name"
      :level="author.level" :owner="author.owner || comment.owner" :tag="author.tag || comment.authorTag || ''" block
      @avatar-click="onUserAvatarClick(comment)" @name-click="onUserNameClick(comment)"
      @membership-click="onMembershipClick" @badge-click="onBadgeClick">
      <VoiceComment v-if="comment.kind === 'voice'" :duration="comment.duration" :playing="playing"
        :bars="comment.voiceBars" @toggle="$emit('voice-play', comment)" />
      <view v-else-if="comment.replyTo" class="comment-item__copy comment-item__copy--reply">
        <view class="comment-item__reply-prefix"><text>回复</text><text class="comment-item__reply-target">{{
          comment.replyTo.name }}</text>
          <LevelCapsule :level="comment.replyTo.level || 1" :inline="true" /><text>：</text>
        </view><text class="comment-item__reply-body" @tap.stop="onReplyTap(comment)">{{ comment.copy || comment.text
          }}</text>
      </view>
      <text v-else class="comment-item__copy" @tap.stop="onReplyTap(comment)">{{ comment.copy || comment.text }}</text>
      <view class="comment-item__meta">
        <view class="comment-item__meta-left"><text>{{ comment.meta }}</text><text class="comment-item__reply"
            @tap.stop="$emit('reply', comment)">回复</text></view>
        <view class="comment-item__like" @tap.stop="$emit('like', comment)">
          <PawLikeIcon :liked="comment.liked" /><text>{{ comment.likes ||
            0 }}</text>
        </view>
      </view>
      <view v-if="comment.children && comment.children.length" class="comment-item__children">
        <view v-for="child in visibleReplies" :key="child.id" class="comment-item comment-item--reply">
          <PawUserIdentity class="comment-item__identity" :avatar="child.author.avatar" :name="child.author.name"
            :avatar-size="33" :level="child.author.level" :owner="child.author.owner || child.owner"
            :tag="child.author.tag || child.authorTag || ''" block @avatar-click="onUserAvatarClick(child)"
            @name-click="onUserNameClick(child)" @membership-click="onMembershipClick" @badge-click="onBadgeClick">
            <VoiceComment v-if="child.kind === 'voice'" :duration="child.duration" :playing="playing"
              :bars="child.voiceBars" @toggle="$emit('voice-play', child)" />
            <view v-else-if="child.replyTo" class="comment-item__copy comment-item__copy--reply">
              <view class="comment-item__reply-prefix"><text>回复</text><text class="comment-item__reply-target">{{
                child.replyTo.name }}</text>
                <LevelCapsule :level="child.replyTo.level || 1" :inline="true" /><text>：</text>
              </view><text class="comment-item__reply-body" @tap.stop="onReplyTap(child)">{{ child.copy || child.text
                }}</text>
            </view>
            <text v-else class="comment-item__copy" @tap.stop="onReplyTap(child)">{{ child.copy || child.text }}</text>
            <view class="comment-item__meta">
              <view class="comment-item__meta-left"><text>{{ child.meta }}</text><text class="comment-item__reply"
                  @tap.stop="$emit('reply', child)">回复</text></view>
              <view class="comment-item__like" @tap.stop="$emit('like', child)">
                <PawLikeIcon :liked="child.liked" /><text>{{ child.likes
                  || 0 }}</text>
              </view>
            </view>
          </PawUserIdentity>
        </view>
        <view v-if="hasHiddenReplies" :id="`qa-dynamic-detail-expand-replies-${comment.id}`"
          class="comment-item__reply-expand" @tap.stop="toggleReplies">
          <PawDivider class="comment-item__expand-line" :width="34" :thickness="0.3" /><text>{{ repliesExpanded
            ? '收起回复' : `展开 ${hiddenReplyCount} 条回复` }}</text>
        </view>
      </view>
    </PawUserIdentity>
  </view>
</template>

<script>
import PawUserIdentity from '@/components/identity/PawUserIdentity.vue'
import VoiceComment from '@/components/dynamic/VoiceComment.vue'
import LevelCapsule from '@/components/LevelCapsule.vue'
import PawLikeIcon from '@/components/base/PawLikeIcon.vue'
import PawDivider from '@/components/base/PawDivider.vue'

export default {
  name: 'CommentItem',
  components: { PawUserIdentity, VoiceComment, LevelCapsule, PawLikeIcon, PawDivider },
  props: {
    comment: { type: Object, default: () => ({}) },
    playing: { type: Boolean, default: false },
    replyPreviewCount: { type: Number, default: 1 }
  },
  emits: ['user-click', 'reply', 'like', 'voice-play', 'expand-replies'],
  data() { return { repliesExpanded: false } },
  computed: {
    author() { return this.comment.author || this.comment },
    replies() { return this.comment.children || [] },
    visibleReplies() { return this.repliesExpanded ? this.replies : this.replies.slice(0, this.replyPreviewCount) },
    hiddenReplyCount() { return Math.max(0, this.replies.length - this.replyPreviewCount) },
    hasHiddenReplies() { return this.hiddenReplyCount > 0 }
  },
  methods: {
    onUserAvatarClick(comment) { this.$emit('user-click', comment) },
    onUserNameClick(comment) { this.$emit('user-click', comment) },
    onReplyTap(comment) { this.$emit('reply', comment) },
    onMembershipClick() { },
    onBadgeClick() { },
    toggleReplies() {
      this.repliesExpanded = !this.repliesExpanded
      this.$emit('expand-replies', { comment: this.comment, expanded: this.repliesExpanded })
    }
  }
}
</script>

<style scoped>
.comment-item {
  display: flex;
  align-items: flex-start;
  min-height: 52px;
  padding: 0;
}

.comment-item--first {
  min-height: 81px;
}

.comment-item--second {
  min-height: 83px;
}

.comment-item--voice {
  min-height: 83px;
}

.comment-item--reply {
  min-height: 0;
  padding-left: 30px;
  box-sizing: border-box;
}

.comment-item__identity {
  display: flex;
  flex: 1 1 auto;
  width: 100%;
  align-items: flex-start;
  min-width: 0;
  padding: 0;
  box-sizing: border-box;
}

.comment-item__identity :deep(.paw-user-identity) {
  display: flex;
  flex: 1 1 auto;
  width: 100%;
  align-items: flex-start;
  min-width: 0;
  padding: 0;
  box-sizing: border-box;
}

.comment-item__identity :deep(.paw-avatar) {
  width: 33px !important;
  height: 33px !important;
  padding: 0;
}

.comment-item__identity :deep(.paw-user-identity__content) {
  flex: 0 0 calc(100% - 42px);
  width: calc(100% - 42px);
  min-width: 0;
}

.comment-item__identity :deep(.paw-user-identity__name) {
  color: #adadad;
  font-weight: 400;
}

.comment-item__copy :deep(.voice-comment) {
  margin-top: 5px;
}

.comment-item__copy {
  display: block;
  margin-top: 5px;
  color: #333;
  font-size: 13px;
  line-height: 18px;
  word-break: break-all;
}

.comment-item__copy--reply {
  display: block;
}

.comment-item__copy--reply text {
  display: inline;
}

.comment-item__reply-prefix {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  vertical-align: middle;
}

.comment-item__reply-prefix :deep(.level-capsule),
.comment-item__reply-prefix :deep(.level-capsule__inline) {
  display: inline-flex;
  margin: 0;
}

.comment-item__reply-body {
  min-width: 0;
}

.comment-item__reply-target {
  color: #adadad;
}

.comment-item__meta {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  box-sizing: border-box;
  color: #8c8c8c;
  font-size: 12px;
  line-height: 16px;
}

.comment-item__children {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.comment-item__children .comment-item--reply {
  padding-left: 0;
}

.comment-item__reply-expand {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 0;
  color: #616161;
  font-size: 12px;
  font-weight: 500;
  line-height: 17px;
}

.comment-item__meta-left {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
}

.comment-item__reply {
  margin-left: 10px;
  color: #616161;
}

.comment-item__like {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-left: auto;
  color: #777;
  font-size: 13px;
}

.comment-item__like text.liked {
  color: #ff3b52;
}
</style>
