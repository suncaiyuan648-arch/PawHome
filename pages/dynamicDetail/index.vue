<template>
  <view class="dynamic-page" :class="{ 'comments-empty-state': commentsEmpty }">
    <!-- #ifndef MP-WEIXIN -->
    <image class="h5-status-bar" src="/static/figma/status-bar-white.png" mode="aspectFit" />
    <!-- #endif -->
    <PawPageNav background="#ffffff" back-icon="/static/figma/dynamic-detail/back-icon.svg" fallback-url="/pages/index/index">
      <template #right>
        <view class="dynamic-nav-menu">
          <image class="dynamic-nav-menu__more" src="/static/figma/dynamic-detail/nav-more.svg" mode="aspectFit" />
          <view class="dynamic-nav-menu__divider"></view>
          <image class="dynamic-nav-menu__close" src="/static/figma/dynamic-detail/nav-close.svg" mode="aspectFit" />
        </view>
      </template>
    </PawPageNav>

    <view class="author-row" :style="authorRowStyle" @tap.stop="openProfile">
      <PawAvatar :src="author.avatar" :size="34" />
      <text class="author-name">{{ author.name }}</text>
      <PawOwnerBadge v-if="!commentsEmpty" />
    </view>

    <view class="notice-line" :style="{ top: contentTop + 'px' }">
      <PawAnnouncementMarquee :items="announcementItems" :height="20" :speed="82" :gap="1000" background-color="#fffbdc" color="#333333" />
    </view>

    <scroll-view class="dynamic-scroll" :style="scrollStyle" scroll-y :show-scrollbar="false">
      <view class="post-section">
        <DynamicMediaViewer :items="mediaItems" />
        <view class="post-card">
          <FeedingSourceRow :feeders="feeders" text="来自花开富贵投喂的4斤猫粮" @click="openFeeders" />
          <text class="post-copy">哎 又忍不住开始书写小作文       此时的弟弟应该刚下自习不到20分钟哎 又忍不住开始书写小作文       此时的弟弟应该刚下自习不到20分钟哎 又忍不住开始书写小作文       此时的弟弟应该刚下自习不到20分钟</text>
          <view class="post-meta">
            <text>昨天 20:45　江西</text>
            <view class="like-action" @tap.stop="toggleLike">
              <image src="/static/figma/dynamic-detail/like-icon.svg" mode="aspectFit" />
              <text :class="{ liked: liked }">{{ likes }}</text>
            </view>
          </view>
        </view>

        <view class="comments-section">
          <CommentThread
            :comments="comments"
            :empty="commentsEmpty"
            total="共 2026 条评论"
            :reply-preview-count="3"
            :reply-count="4"
            @user-click="openCommentUser"
            @reply="openReplySheet"
            @like="toggleCommentLike"
            @voice-play="onVoicePlay"
            @empty-action="openReplySheet"
          >
            <template #before>
              <CommentComposer :avatar="currentUser.avatar" readonly @click="openReplySheet" @voice="onComposerVoice" @pick-image="onComposerPickImage" />
            </template>
          </CommentThread>
        </view>
      </view>

      <view class="rank-section">
        <YardFeedRankStrip
          variant="detail"
          feed-summary="13人已投喂 32斤粮"
          :seamless-items="rankItems"
          @leaderboard="openLeaderboard"
          @rank-user="openRankUser"
        />
      </view>

      <view class="yard-section">
        <YardSummaryCard :yard="yard" variant="detail" :show-gallery="true" @click="openYard" />
      </view>
      <view class="scroll-spacer"></view>
    </scroll-view>

    <PawFixedActionBar :actions="footerActions" :primary-action="primaryAction" @action="onFooterAction" @primary="feed" />
    <ReplyComposerSheet v-model:visible="replySheetVisible" @send="onReplySend" @voice="onComposerVoice" @pick-image="onComposerPickImage" />
  </view>
</template>

<script>
import PawAnnouncementMarquee from '@/components/PawAnnouncementMarquee.vue'
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
import { getWechatNavLayout } from '@/utils/navLayout.js'
import { openUserProfile } from '@/utils/profileNav.js'

const DYNAMIC_DETAIL_ASSET = '/static/figma/dynamic-detail/'

export default {
  name: 'DynamicDetailPage',
  components: { PawAnnouncementMarquee, PawPageNav, PawAvatar, PawOwnerBadge, PawFixedActionBar, DynamicMediaViewer, FeedingSourceRow, CommentComposer, CommentThread, ReplyComposerSheet, YardFeedRankStrip, YardSummaryCard },
  data() {
    return {
      yardId: '1',
      navLayout: getWechatNavLayout(),
      commentsEmpty: false,
      liked: false,
      likes: 32,
      replySheetVisible: false,
      mediaItems: [`${DYNAMIC_DETAIL_ASSET}hero.png`, `${DYNAMIC_DETAIL_ASSET}hero.png`],
      announcementItems: [{ id: 'feeding-demo-1', text: '广东汕头的花开富贵老师对我就是要喂猫投粮4斤，积善缘，得福报~' }],
      author: { name: '芝', avatar: `${DYNAMIC_DETAIL_ASSET}author.png` },
      currentUser: { avatar: `${DYNAMIC_DETAIL_ASSET}current-user.png` },
      feeders: [1, 2, 3, 4, 5].map(id => ({ id, avatar: `${DYNAMIC_DETAIL_ASSET}source-${id}.png` })),
      rankItems: [{ id: 'rank-1', text: '平安是福', level: 1, avatar: `${DYNAMIC_DETAIL_ASSET}rank-avatar.png`, rankTitle: '小院投喂第一名' }],
      comments: [
        { id: 1, author: { name: '姜栋', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-1.svg`, owner: true }, copy: '给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞', meta: '昨天 20:45  江西', likes: 32, liked: true },
        { id: 2, author: { name: '花开春晓', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-2.svg`, level: 1 }, kind: 'voice', duration: '2″', meta: '昨天 20:45  江西', likes: 32, liked: true },
        { id: 3, author: { name: '姜栋', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-3.svg`, owner: true }, replyTo: { name: '花开春晓', level: 1 }, copy: '谢啊啊啊啊啊啊啊谢啊啊啊啊啊啊啊', meta: '昨天 20:45  江西', likes: 32, liked: true },
        { id: 4, author: { name: '花开春晓', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-2.svg`, level: 1 }, replyTo: { name: '姜栋' }, copy: '一起为小院里的猫咪加油呀', meta: '昨天 20:46  江西', likes: 8, liked: false },
        { id: 5, author: { name: '橘子汽水', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-1.svg`, level: 2 }, replyTo: { name: '姜栋' }, copy: '收到，感谢投喂', meta: '昨天 20:47  江西', likes: 5, liked: false },
        { id: 6, author: { name: '花开春晓', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-2.svg`, level: 1 }, replyTo: { name: '橘子汽水', level: 2 }, copy: '猫猫们会一直记得大家的帮助', meta: '昨天 20:48  江西', likes: 3, liked: false },
        { id: 7, author: { name: '姜栋', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-3.svg`, owner: true }, replyTo: { name: '花开春晓', level: 1 }, copy: '谢谢大家的支持和鼓励', meta: '昨天 20:49  江西', likes: 6, liked: false }
      ],
      yard: {
        name: '我就是要喂猫',
        avatar: `${DYNAMIC_DETAIL_ASSET}yard-avatar.png`,
        verified: true,
        location: '金水区',
        distance: '3.2km',
        tags: ['6只猫咪', '已成立2个月', '入驻4人'],
        description: '春去秋来二十年的救助流浪猫时间匆匆而去，在此希望每个...',
        gallery: [1, 2, 3, 4].map(id => ({ id, src: `${DYNAMIC_DETAIL_ASSET}yard-photo.png`, title: '开饭了开饭了' }))
      }
    }
  },
  computed: {
    contentTop() {
      const nav = this.navLayout || {}
      const measuredTop = Number(nav.statusBarHeight || 44) + Number(nav.navRowOffsetTop || 0) + Number(nav.navRowHeight || 58) + 11
      return Math.max(113, measuredTop)
    },
    authorRowStyle() {
      const nav = this.navLayout || {}
      const statusBarHeight = Number(nav.statusBarHeight || 44)
      const navRowOffsetTop = Number(nav.navRowOffsetTop || 0)
      const navRowHeight = Number(nav.navRowHeight || 58)
      const avatarSize = 34
      const top = statusBarHeight + navRowOffsetTop + Math.max(0, (navRowHeight - avatarSize) / 2)
      return { top: `${top}px` }
    },
    scrollStyle() {
      return { top: `${this.contentTop}px`, height: `calc(100vh - ${this.contentTop}px)` }
    },
    footerActions() {
      return [
        { key: 'share', label: '分享', image: `${DYNAMIC_DETAIL_ASSET}share-icon.svg` },
        { key: 'yard', label: this.commentsEmpty ? '入驻' : '去看看', image: `${DYNAMIC_DETAIL_ASSET}join-icon.svg` },
        { key: 'adopt', label: '领养', image: `${DYNAMIC_DETAIL_ASSET}adopt-icon.svg` }
      ]
    },
    primaryAction() {
      return { key: 'feed', label: this.commentsEmpty ? '投点猫粮' : '云养一只', image: `${DYNAMIC_DETAIL_ASSET}feed-icon.svg`, size: 'md' }
    }
  },
  onLoad(query = {}) {
    this.navLayout = getWechatNavLayout()
    if (query.yardId) this.yardId = String(query.yardId)
    this.commentsEmpty = query.state === 'comments-empty'
    this.author.name = this.commentsEmpty ? '我就是要喂猫' : '芝'
  },
  methods: {
    toggleLike() { this.liked = !this.liked; this.likes = Math.max(0, this.likes + (this.liked ? 1 : -1)) },
    openProfile() { openUserProfile({ pawId: 'owner-1', nickname: this.author.name, avatar: this.author.avatar }) },
    openYard() { uni.navigateTo({ url: `/pages/commodityDetails/index?id=${encodeURIComponent(this.yardId)}` }) },
    openLeaderboard() { uni.navigateTo({ url: '/pages/leaderboard/index' }) },
    openRankUser(item) { if (item) openUserProfile({ pawId: item.pawId || item.id, nickname: item.text, avatar: item.avatar }) },
    openFeeders() { uni.showToast({ title: '查看投喂记录', icon: 'none' }) },
    onFooterAction(action) {
      if (action.key === 'share') { uni.showShareMenu && uni.showShareMenu({ withShareTicket: true }) }
      if (action.key === 'yard') this.openYard()
      if (action.key === 'adopt') uni.showToast({ title: '进入领养流程', icon: 'none' })
    },
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
.dynamic-page { position: relative; width: 100%; height: 100vh; overflow: hidden; background: #fff; color: #252525; font-family: "Source Han Sans CN", "PingFang SC", sans-serif; }
.h5-status-bar { position: absolute; top: 0; left: 0; z-index: 220; width: 100%; height: 44px; pointer-events: none; }
.dynamic-nav-menu { display: flex; align-items: center; justify-content: center; width: 87px; height: 32px; border-radius: 16px; background: #fff; }
.dynamic-nav-menu__more { width: 19px; height: 7px; }
.dynamic-nav-menu__divider { width: 1px; height: 16px; margin: 0 13px; background: #e4e4e4; }
.dynamic-nav-menu__close { width: 18px; height: 18px; }
:deep(.paw-nav__back) { justify-content: flex-start; padding-left: 6px; }
:deep(.paw-nav__back-icon) { width: 24px; height: 24px; }
.author-row { position: absolute; top: 56px; left: 37px; z-index: 210; display: flex; align-items: center; column-gap: 5px; height: 34px; box-sizing: border-box; }
.author-name { margin-left: 4px; color: #333; font-size: 14px; font-weight: 500; line-height: 16px; }
.author-row .paw-owner-badge { margin-left: 0; }
.notice-line { position: absolute; right: 0; left: 0; z-index: 30; height: 20px; overflow: hidden; pointer-events: none; }
.dynamic-scroll { position: absolute; right: 0; left: 0; z-index: 1; width: 100%; box-sizing: border-box; background: #f5f5f5; }
.post-section { background: #fff; }
.post-card { width: 345px; margin: 0 auto; padding: 10px 0 13px; box-sizing: border-box; }
.post-copy { display: block; margin-top: 13px; color: #333; font-size: 15px; font-weight: 400; line-height: 23px; white-space: pre-wrap; word-break: break-all; }
.post-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 13px; color: #8c8c8c; font-size: 12px; line-height: 19px; }
.like-action { display: inline-flex; align-items: center; gap: 5px; color: #686868; font-size: 13px; font-weight: 500; line-height: 18px; }
.like-action image { width: 15px; height: 15px; }
.like-action .liked { color: #ff3b52; }
.comments-section { background: #fff; border-bottom: 6px solid #f5f5f5; }
.rank-section { background: #fff; border-bottom: 6px solid #f5f5f5; }
.yard-section { background: #fff; }
.scroll-spacer { height: 100px; background: #f5f5f5; }
.comments-empty-state :deep(.comment-thread__title) { margin-bottom: 17px; }
.comments-empty-state :deep(.comment-thread__empty) { margin-top: -5px; margin-bottom: -27px; }
.comments-empty-state :deep(.comment-thread__empty .paw-empty-state__title),
.comments-empty-state :deep(.comment-thread__empty .paw-empty-state__action) { position: relative; top: 2px; }
.dynamic-page:not(.comments-empty-state) :deep(.comment-thread) { padding-bottom: 30px; }
.dynamic-page:not(.comments-empty-state) .comments-section { margin-bottom: 0; }
</style>
