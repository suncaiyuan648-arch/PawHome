<template>
  <view class="dynamic-page" :class="{ 'comments-empty-state': commentsEmpty }">
    <!-- #ifndef MP-WEIXIN -->
    <image class="h5-status-bar" src="/static/figma/status-bar-white.png" mode="aspectFit" />
    <!-- #endif -->
    <PawPageNav background="#ffffff" fallback-url="/pages/index/index" />
    <view class="author-row" @tap.stop="openProfile">
      <PawAvatar :src="author.avatar" :size="34" />
      <text class="author-name">{{ author.name }}</text>
      <PawOwnerBadge />
    </view>
    <view class="notice-line"><text>富贵老师对我就是要喂猫投粮4斤，积善缘，得福报～</text></view>

    <scroll-view class="dynamic-scroll" scroll-y :show-scrollbar="false">
      <DynamicMediaViewer :items="mediaItems" />
      <view class="post-card">
        <FeedingSourceRow :feeders="feeders" text="来自花开富贵投喂的4斤猫粮" @click="openFeeders" />
        <text class="post-copy">哎 又忍不住开始书写小作文　　此时的弟弟应该刚下自习不到20分钟哎 又忍不住开始书写小作文 此时的弟弟应该刚下自习不到20分钟哎 又忍不住开始书写小作文　　此时的弟弟应该刚下自习不到20分钟哎 又忍不住开始书写小作文</text>
        <view class="post-meta"><text>昨天 20:45　江西</text><view class="like-action" @tap.stop="toggleLike"><uni-icons :type="liked ? 'hand-up-filled' : 'hand-up'" :color="liked ? '#ff3b52' : '#777777'" :size="18" /><text>{{ likes }}</text></view></view>
      </view>

      <view class="comments-section">
        <CommentComposer :avatar="currentUser.avatar" readonly @click="openReplySheet" @voice="onComposerVoice" @pick-image="onComposerPickImage" />
        <CommentThread
          :comments="comments"
          :empty="commentsEmpty"
          total="共 2026 条评论"
          @user-click="openCommentUser"
          @reply="openReplySheet"
          @like="toggleCommentLike"
          @voice-play="onVoicePlay"
          @empty-action="openReplySheet"
        />
      </view>

      <YardFeedRankStrip
        :show-meta-row="false"
        feed-summary="13人已投喂 32斤粮"
        :seamless-items="rankItems"
        @leaderboard="openLeaderboard"
        @rank-user="openRankUser"
      />
      <YardSummaryCard :yard="yard" variant="detail" :show-gallery="true" @click="openYard" />
      <view class="scroll-spacer"></view>
    </scroll-view>

    <PawFixedActionBar :actions="footerActions" :primary-action="primaryAction" @action="onFooterAction" @primary="feed" />
    <ReplyComposerSheet v-model:visible="replySheetVisible" @send="onReplySend" @voice="onComposerVoice" @pick-image="onComposerPickImage" />
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawAvatar from '@/components/identity/PawAvatar.vue'
import PawOwnerBadge from '@/components/identity/PawOwnerBadge.vue'
import PawFixedActionBar from '@/components/layout/PawFixedActionBar.vue'
import DynamicMediaViewer from '@/components/dynamic/DynamicMediaViewer.vue'
import FeedingSourceRow from '@/components/dynamic/FeedingSourceRow.vue'
import CommentComposer from '@/components/dynamic/CommentComposer.vue'
import CommentThread from '@/components/dynamic/CommentThread.vue'
import ReplyComposerSheet from '@/components/ReplyComposerSheet.vue'
import YardFeedRankStrip from '@/components/yard/YardFeedRankStrip.vue'
import YardSummaryCard from '@/components/yard/YardSummaryCard.vue'
import { openUserProfile } from '@/utils/profileNav.js'

export default {
  name: 'DynamicDetailPage',
  components: { PawPageNav, PawAvatar, PawOwnerBadge, PawFixedActionBar, DynamicMediaViewer, FeedingSourceRow, CommentComposer, CommentThread, ReplyComposerSheet, YardFeedRankStrip, YardSummaryCard },
  data() {
    return {
      yardId: '1',
      commentsEmpty: false,
      liked: false,
      likes: 32,
      replySheetVisible: false,
      mediaItems: ['/static/figma/feature/d81342748c84fc1068ceb0af9525bc465f5517e8.png'],
      author: { name: '芝', avatar: '/static/figma/feature/45f5fc6ea328c9e88cff7a4504824254458e9e7b.png' },
      currentUser: { avatar: '/static/avatar.png' },
      feeders: [1, 2, 3, 4, 5].map(id => ({ id, avatar: '/static/figma/dynamic-source-avatar.jpg' })),
      rankItems: [{ id: 'rank-1', text: '平安是福', level: 1, avatar: '/static/user.png', rankTitle: '小院投喂第一名' }],
      comments: [
        { id: 1, author: { name: '姜栋', avatar: '/static/avatarlog.png', level: 1, owner: true }, copy: '给我点赞给我点赞给我点赞给我点赞给我点赞', meta: '昨天 20:45　江西', likes: 32, liked: false },
        { id: 2, author: { name: '花开春晓', avatar: '/static/avatarlog.png', level: 1 }, kind: 'voice', duration: '2″', voiceBars: [6, 10, 5, 12, 7], meta: '昨天 20:45　江西', likes: 8, liked: false },
        { id: 3, author: { name: '姜栋', avatar: '/static/avatarlog.png', level: 1, owner: true }, copy: '回复 花开春晓：谢谢啊啊啊啊啊啊谢谢', meta: '昨天 20:45　江西', likes: 4, liked: false }
      ],
      yard: { name: '我就是要喂猫', avatar: '/static/user.png', verified: true, location: '金水区', distance: '3.2km', tags: ['6只猫咪', '已成立2个月', '入驻4人'], description: '春去秋来二十年的救助流浪猫时间匆匆而去，在此希望每个...', gallery: ['/static/figma/dynamic-yard-photo.png', '/static/figma/dynamic-yard-photo.png', '/static/figma/dynamic-yard-photo.png'] }
    }
  },
  computed: {
    footerActions() { return [{ key: 'share', label: '分享', image: '/static/fenxiang.png' }, { key: 'yard', label: this.commentsEmpty ? '入驻' : '去看看', image: '/static/ruzhu.png' }, { key: 'adopt', label: '领养', image: '/static/lingyang.png' }] },
    primaryAction() { return { key: 'feed', label: this.commentsEmpty ? '投点猫粮' : '云养一只', image: '/static/touwei.png', size: 'md' } }
  },
  onLoad(query = {}) {
    if (query.yardId) this.yardId = String(query.yardId)
    this.commentsEmpty = query.state === 'comments-empty'
  },
  methods: {
    toggleLike() { this.liked = !this.liked; this.likes = Math.max(0, this.likes + (this.liked ? 1 : -1)) },
    openProfile() { openUserProfile({ pawId: 'owner-1', nickname: this.author.name, avatar: this.author.avatar }) },
    openYard() { uni.navigateTo({ url: `/pages/commodityDetails/index?id=${encodeURIComponent(this.yardId)}` }) },
    openLeaderboard() { uni.navigateTo({ url: '/pages/leaderboard/index' }) },
    openRankUser(item) { if (item) openUserProfile({ pawId: item.pawId || item.id, nickname: item.text, avatar: item.avatar }) },
    openFeeders() { uni.showToast({ title: '查看投喂记录', icon: 'none' }) },
    onFooterAction(action) { if (action.key === 'share') { /* 平台分享由页面控制 */; uni.showShareMenu && uni.showShareMenu({ withShareTicket: true }) }; if (action.key === 'yard') this.openYard(); if (action.key === 'adopt') uni.showToast({ title: '进入领养流程', icon: 'none' }) },
    feed() { uni.showToast({ title: '已进入云养投喂', icon: 'none' }) },
    openReplySheet() { this.replySheetVisible = true },
    onReplySend(text) { uni.showToast({ title: '已发送', icon: 'none' }); this.$emit('reply-send', text) },
    onComposerVoice() { uni.showToast({ title: '语音输入敬请期待', icon: 'none' }) },
    onComposerPickImage() { uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'] }) },
    openCommentUser(comment) { const author = comment && (comment.author || comment); if (author) openUserProfile({ pawId: author.pawId || comment.id, nickname: author.name, avatar: author.avatar }) },
    toggleCommentLike(comment) { if (!comment) return; comment.liked = !comment.liked; comment.likes = Math.max(0, (comment.likes || 0) + (comment.liked ? 1 : -1)) },
    onVoicePlay() {}
  }
}
</script>

<style scoped>
.dynamic-page { position: relative; height: 100vh; overflow: hidden; background: #fff; color: #252525; font-family: "Source Han Sans CN", "PingFang SC", sans-serif; }
.h5-status-bar { position: absolute; top: 0; left: 0; z-index: 80; width: 100%; height: 40px; pointer-events: none; }
.author-row { position: absolute; top: 64px; left: 35px; z-index: 30; display: flex; align-items: center; min-height: 34px; }
.author-name { margin-left: 10px; color: #333; font-size: 14px; }
.author-row .paw-owner-badge { margin-left: 4px; }
.notice-line { position: absolute; top: 113px; right: 0; left: 0; z-index: 30; height: 21px; overflow: hidden; padding: 0 9px; background: #fffbd5; color: #665500; font-size: 11px; line-height: 21px; white-space: nowrap; }
.dynamic-scroll { height: calc(100vh - 44px); padding-top: 0; box-sizing: border-box; }
.post-card { padding: 12px 30px 14px; border-bottom: 1px solid #eee; }
.post-copy { display: block; margin-top: 8px; color: #333; font-size: 14px; line-height: 22px; }
.post-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; color: #999; font-size: 12px; }
.like-action { display: inline-flex; align-items: center; gap: 5px; }
.comments-section { border-bottom: 12px solid #f5f5f5; }
.scroll-spacer { height: 110px; }
</style>
