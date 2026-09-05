<template>
  <view class="dynamic-page" :class="{ 'comments-empty-state': commentsEmpty }">
    <PawPageNav background="#ffffff" :content-inset-left="37" fallback-url="/pages/index/index" @layout="onNavLayout">
      <!-- 作者信息与返回按钮共用原生导航行，右侧胶囊由微信原生渲染。 -->
      <template #content>
        <view id="qa-dynamic-detail-nav-author" class="author-row" @tap.stop="openProfile">
          <PawAvatar :src="author.avatar" :size="34" :clickable="true" @click="openProfile" />
          <text class="author-name">{{ author.name }}</text>
          <PawOwnerBadge v-if="!commentsEmpty" class="author-owner-badge" />
        </view>
      </template>
    </PawPageNav>

    <view class="notice-line" :style="{ top: contentTop + 'px' }">
      <PawAnnouncementMarquee :items="announcementItems" :height="20" :speed="82" :gap="1000" color="#333333" />
    </view>

    <scroll-view class="dynamic-scroll" :style="scrollStyle" scroll-y :show-scrollbar="false">
      <view class="post-section">
        <DynamicMediaViewer :items="mediaItems" />
        <view class="post-card">
          <FeedingSourceRow :feeders="feeders" text="来自花开富贵投喂的4斤猫粮" @click="openFeeders" />
          <text class="post-copy">哎 又忍不住开始书写小作文 此时的弟弟应该刚下自习不到20分钟哎 又忍不住开始书写小作文 此时的弟弟应该刚下自习不到20分钟哎 又忍不住开始书写小作文
            此时的弟弟应该刚下自习不到20分钟</text>
          <view class="post-meta">
            <text>昨天 20:45　江西</text>
            <view class="like-action" @tap.stop="toggleLike">
              <PawLikeIcon :liked="liked" />
              <text :class="{ liked: liked }">{{ likes }}</text>
            </view>
          </view>
        </view>

        <view class="comments-section">
          <CommentThread :comments="comments" :empty="commentsEmpty" total="共 2026 条评论" :comment-preview-count="3"
            @user-click="openCommentUser" @reply="openReplySheet" @like="toggleCommentLike" @voice-play="onVoicePlay"
            @empty-action="openReplySheet">
            <template #before>
              <CommentComposer :avatar="currentUser.avatar" readonly @click="openReplySheet" @voice="onComposerVoice"
                @pick-image="onComposerPickImage" />
            </template>
          </CommentThread>
        </view>
      </view>

      <view class="rank-section">
        <YardFeedRankStrip feed-summary="13人已投喂 32斤粮" :seamless-items="rankItems" @leaderboard="openLeaderboard"
          @rank-user="openRankUser" />
      </view>

      <view class="yard-section">
        <YardSummaryCard :yard="yard" variant="detail" :show-gallery="true" @click="openYard" />
      </view>
      <view class="scroll-spacer"></view>
    </scroll-view>

    <PawFixedActionBar :actions="footerActions" :primary-action="primaryAction" @action="onFooterAction"
      @primary="onPrimaryAction" />
    <ReplyComposerSheet v-model:visible="replySheetVisible" :reply-to-name="replyTargetName" @send="onReplySend"
      @voice="onComposerVoice" @pick-image="onComposerPickImage" />
    <ShareActionSheet v-model:visible="shareSheetVisible" />
    <AdoptPickCatsSheet v-model="adoptPickSheetVisible" :yard-name="yard.name" :yard-id="yardId" :cats="adoptionPets"
      :owner-avatar="yard.avatar" :owner-paw-id="yard.owner && yard.owner.pawId" />
    <YardFeedPopup v-if="commentsEmpty" v-model:visible="feedPopupVisible" @learn-food="onLearnFood"
      @agreement="onAgreement" @feed-order="onFeedOrder" />
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
import ShareActionSheet from '@/components/ShareActionSheet.vue'
import AdoptPickCatsSheet from '@/components/AdoptPickCatsSheet.vue'
import YardFeedRankStrip from '@/components/yard/YardFeedRankStrip.vue'
import YardSummaryCard from '@/components/yard/YardSummaryCard.vue'
import YardFeedPopup from '@/components/YardFeedPopup.vue'
import PawLikeIcon from '@/components/base/PawLikeIcon.vue'
import { getWechatNavLayout } from '@/utils/navLayout.js'
import { openUserProfile } from '@/utils/profileNav.js'
import { getPawHomeYardMock } from '@/utils/yardMock.js'

const DYNAMIC_DETAIL_ASSET = '/static/figma/dynamic-detail/'

// 固定的 UI mock：共 13 条顶层评论，其中 6 条分别预置 1–6 条回复。
// 不在运行时使用随机数，避免刷新后评论数量和页面高度变化影响联调与验收。
const DYNAMIC_DETAIL_COMMENTS = [
  { id: 1, author: { name: '姜栋', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-1.svg`, owner: true }, copy: '给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞', meta: '昨天 20:45  江西', likes: 32, liked: true },
  {
    id: 2, author: { name: '花开春晓', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-2.svg`, level: 1 }, kind: 'voice', duration: '2″', meta: '昨天 20:45  江西', likes: 32, liked: true, children: [
      { id: '2-1', author: { name: '姜栋', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-3.svg`, owner: true }, replyTo: { name: '花开春晓', level: 1 }, copy: '谢啊啊啊啊啊啊啊谢啊啊啊啊啊啊啊', meta: '昨天 20:45  江西', likes: 32, liked: true },
      { id: '2-2', author: { name: '花开春晓', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-2.svg`, level: 1 }, replyTo: { name: '姜栋' }, copy: '一起为小院里的猫咪加油呀', meta: '昨天 20:46  江西', likes: 8, liked: false },
      { id: '2-3', author: { name: '橘子汽水', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-1.svg`, level: 2 }, replyTo: { name: '姜栋' }, copy: '收到，感谢投喂', meta: '昨天 20:47  江西', likes: 5, liked: false },
      { id: '2-4', author: { name: '花开春晓', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-2.svg`, level: 1 }, replyTo: { name: '橘子汽水', level: 2 }, copy: '猫猫们会一直记得大家的帮助', meta: '昨天 20:48  江西', likes: 3, liked: false },
      { id: '2-5', author: { name: '姜栋', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-3.svg`, owner: true }, replyTo: { name: '花开春晓', level: 1 }, copy: '谢谢大家的支持和鼓励', meta: '昨天 20:49  江西', likes: 6, liked: false }
    ]
  },
  { id: 3, author: { name: '小灰灰', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-3.svg`, level: 1 }, copy: '小猫咪能遇到愿意帮助它们的人，真的很幸运。', meta: '昨天 20:52  江西', likes: 12, liked: false },
  {
    id: 4, author: { name: '平安是福', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-1.svg`, level: 1 }, copy: '已经关注小院了，祝猫咪们都能平安长大。', meta: '昨天 21:03  河南', likes: 9, liked: false, children: [
      { id: '4-1', author: { name: '花开春晓', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-2.svg`, level: 1 }, replyTo: { name: '平安是福', level: 1 }, copy: '谢谢你的祝福和支持。', meta: '昨天 21:05  江西', likes: 4, liked: false },
      { id: '4-2', author: { name: '姜栋', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-3.svg`, owner: true }, replyTo: { name: '平安是福', level: 1 }, copy: '猫猫们会继续好好吃饭的。', meta: '昨天 21:06  江西', likes: 3, liked: false }
    ]
  },
  { id: 5, author: { name: '橘子汽水', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-1.svg`, level: 2 }, copy: '这段分享看了好多遍，希望更多人看到小院。', meta: '昨天 21:18  浙江', likes: 6, liked: false },
  {
    id: 6, author: { name: '暖阳', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-2.svg`, level: 1 }, copy: '已投喂，愿每一只小猫都能被温柔对待。', meta: '昨天 21:26  江苏', likes: 15, liked: false, children: [
      { id: '6-1', author: { name: '花开春晓', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-2.svg`, level: 1 }, replyTo: { name: '暖阳', level: 1 }, copy: '收到啦，感谢你的投喂。', meta: '昨天 21:27  江西', likes: 5, liked: false },
      { id: '6-2', author: { name: '小灰灰', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-3.svg`, level: 1 }, replyTo: { name: '暖阳', level: 1 }, copy: '一起给小猫们加油。', meta: '昨天 21:28  江西', likes: 3, liked: false },
      { id: '6-3', author: { name: '平安是福', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-1.svg`, level: 1 }, replyTo: { name: '暖阳', level: 1 }, copy: '谢谢你分享这个小院。', meta: '昨天 21:29  河南', likes: 2, liked: false },
      { id: '6-4', author: { name: '姜栋', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-3.svg`, owner: true }, replyTo: { name: '暖阳', level: 1 }, copy: '大家的心意我们都记下了。', meta: '昨天 21:30  江西', likes: 4, liked: false },
      { id: '6-5', author: { name: '橘子汽水', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-1.svg`, level: 2 }, replyTo: { name: '姜栋', owner: true }, copy: '下次继续来看看猫猫。', meta: '昨天 21:31  浙江', likes: 1, liked: false },
      { id: '6-6', author: { name: '花开春晓', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-2.svg`, level: 1 }, replyTo: { name: '橘子汽水', level: 2 }, copy: '欢迎常来小院玩。', meta: '昨天 21:32  江西', likes: 2, liked: false }
    ]
  },
  { id: 7, author: { name: '爱心小院', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-3.svg`, level: 1 }, copy: '每一份投喂都会变成猫咪们的安心日常。', meta: '昨天 21:40  安徽', likes: 7, liked: false },
  {
    id: 8, author: { name: '晴朗', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-1.svg`, level: 2 }, copy: '小院加油，猫猫加油！', meta: '昨天 21:48  湖北', likes: 5, liked: false, children: [
      { id: '8-1', author: { name: '花开春晓', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-2.svg`, level: 1 }, replyTo: { name: '晴朗', level: 2 }, copy: '谢谢你的鼓励。', meta: '昨天 21:49  江西', likes: 2, liked: false }
    ]
  },
  { id: 9, author: { name: '夜猫子联盟', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-2.svg`, level: 1 }, copy: '晚上看到这条动态也来报到啦。', meta: '昨天 22:01  广东', likes: 8, liked: false },
  {
    id: 10, author: { name: '岁岁平安喵', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-3.svg`, level: 1 }, copy: '感谢小院一直照顾这些流浪猫。', meta: '昨天 22:12  四川', likes: 11, liked: false, children: [
      { id: '10-1', author: { name: '花开春晓', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-2.svg`, level: 1 }, replyTo: { name: '岁岁平安喵', level: 1 }, copy: '谢谢关注，小院会继续努力。', meta: '昨天 22:13  江西', likes: 3, liked: false },
      { id: '10-2', author: { name: '姜栋', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-3.svg`, owner: true }, replyTo: { name: '岁岁平安喵', level: 1 }, copy: '有大家的支持，猫猫们会更安心。', meta: '昨天 22:14  江西', likes: 4, liked: false },
      { id: '10-3', author: { name: '岁岁平安喵', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-3.svg`, level: 1 }, replyTo: { name: '姜栋', owner: true }, copy: '会一直支持你们的。', meta: '昨天 22:15  四川', likes: 2, liked: false }
    ]
  },
  { id: 11, author: { name: '暖阳补给台', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-1.svg`, level: 2 }, copy: '看见大家一起帮助小院，心里暖暖的。', meta: '昨天 22:21  上海', likes: 4, liked: false },
  {
    id: 12, author: { name: '小鱼干补给站', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-2.svg`, level: 1 }, copy: '下次也要记得给小猫们准备小鱼干。', meta: '昨天 22:32  北京', likes: 10, liked: false, children: [
      { id: '12-1', author: { name: '花开春晓', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-2.svg`, level: 1 }, replyTo: { name: '小鱼干补给站', level: 1 }, copy: '记住啦，猫猫们很喜欢。', meta: '昨天 22:33  江西', likes: 2, liked: false },
      { id: '12-2', author: { name: '橘子汽水', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-1.svg`, level: 2 }, replyTo: { name: '小鱼干补给站', level: 1 }, copy: '这个建议很实用。', meta: '昨天 22:34  浙江', likes: 1, liked: false },
      { id: '12-3', author: { name: '姜栋', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-3.svg`, owner: true }, replyTo: { name: '小鱼干补给站', level: 1 }, copy: '感谢大家帮忙照顾猫猫。', meta: '昨天 22:35  江西', likes: 3, liked: false },
      { id: '12-4', author: { name: '花开春晓', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-2.svg`, level: 1 }, replyTo: { name: '姜栋', owner: true }, copy: '一起让小院越来越好。', meta: '昨天 22:36  江西', likes: 2, liked: false }
    ]
  },
  { id: 13, author: { name: '巷口喵喵亭', avatar: `${DYNAMIC_DETAIL_ASSET}comment-avatar-3.svg`, level: 1 }, copy: '为认真照顾猫咪的人点赞。', meta: '昨天 22:44  福建', likes: 6, liked: false }
]

export default {
  name: 'DynamicDetailPage',
  components: { PawAnnouncementMarquee, PawPageNav, PawAvatar, PawOwnerBadge, PawFixedActionBar, DynamicMediaViewer, FeedingSourceRow, CommentComposer, CommentThread, ReplyComposerSheet, ShareActionSheet, AdoptPickCatsSheet, YardFeedRankStrip, YardSummaryCard, YardFeedPopup, PawLikeIcon },
  data() {
    const yard = getPawHomeYardMock()
    return {
      yardId: yard.id,
      dynamicId: 'published-dynamic-1',
      navLayout: getWechatNavLayout(),
      commentsEmpty: false,
      liked: false,
      likes: 32,
      replySheetVisible: false,
      replySheetTarget: null,
      shareSheetVisible: false,
      adoptPickSheetVisible: false,
      feedPopupVisible: false,
      mediaItems: [`${DYNAMIC_DETAIL_ASSET}hero.png`, `${DYNAMIC_DETAIL_ASSET}hero.png`],
      announcementItems: yard.announcementItems,
      author: { name: '芝', avatar: `${DYNAMIC_DETAIL_ASSET}author.png` },
      currentUser: { avatar: `${DYNAMIC_DETAIL_ASSET}current-user.png` },
      feeders: yard.feeders,
      rankItems: yard.rankItems,
      comments: DYNAMIC_DETAIL_COMMENTS,
      yard
    }
  },
  computed: {
    contentTop() {
      const nav = this.navLayout || {}
      const measuredTop = Number(nav.totalHeight || (Number(nav.statusBarHeight || 44) + Number(nav.navBarHeight || 54)))
      // 动态区域紧跟 PawPageNav；公告只在动态内容顶部悬浮，不参与内容排版。
      return measuredTop
    },
    scrollStyle() {
      return {
        top: `${this.contentTop}px`,
        height: `calc(100vh - ${this.contentTop}px)`
      }
    },
    footerActions() {
      return [
        { key: 'share', label: '分享', iconName: 'actions/dynamic-share' },
        { key: 'yard', label: this.commentsEmpty ? '入驻' : '去看看', iconName: 'actions/dynamic-join' },
        { key: 'adopt', label: '领养', iconName: 'actions/dynamic-adopt', qa: 'qa-dynamic-detail-adopt' }
      ]
    },
    primaryAction() {
      return { key: 'feed', label: this.commentsEmpty ? '投点猫粮' : '云养一只', iconName: 'actions/feed', iconSize: 32, size: 'md' }
    },
    replyTargetName() {
      const target = this.replySheetTarget
      const author = target && target.author
      return author && typeof author.name === 'string' ? author.name : ''
    },
    adoptionPets() {
      return (this.yard.pets || []).filter(pet => pet.state === 'pending' || pet.state === 'cloud')
    }
  },
  onLoad(query = {}) {
    this.navLayout = getWechatNavLayout()
    if (query.yardId) this.yardId = String(query.yardId)
    if (query.dynamicId) this.dynamicId = String(query.dynamicId)
    this.commentsEmpty = query.state === 'comments-empty'
    this.author.name = this.commentsEmpty ? '我就是要喂猫' : '芝'
  },
  onShareAppMessage() {
    const state = this.commentsEmpty ? '&state=comments-empty' : ''
    return {
      title: `${this.yard.name}动态`,
      path: `/pages/dynamicDetail/index?yardId=${encodeURIComponent(this.yardId)}&dynamicId=${encodeURIComponent(this.dynamicId)}${state}`,
      imageUrl: this.mediaItems[0]
    }
  },
  onShareTimeline() {
    const state = this.commentsEmpty ? '&state=comments-empty' : ''
    return {
      title: `${this.yard.name}动态`,
      query: `yardId=${encodeURIComponent(this.yardId)}&dynamicId=${encodeURIComponent(this.dynamicId)}${state}`,
      imageUrl: this.mediaItems[0]
    }
  },
  methods: {
    onNavLayout(layout) { this.navLayout = layout },
    toggleLike() { this.liked = !this.liked; this.likes = Math.max(0, this.likes + (this.liked ? 1 : -1)) },
    openProfile() { openUserProfile({ pawId: 'owner-1', nickname: this.author.name, avatar: this.author.avatar }) },
    openYard() { uni.navigateTo({ url: `/pages/commodityDetails/index?id=${encodeURIComponent(this.yardId)}` }) },
    openLeaderboard() { uni.navigateTo({ url: '/pages/leaderboard/index' }) },
    openRankUser(item) { if (item) openUserProfile({ pawId: item.pawId || item.id, nickname: item.text, avatar: item.avatar }) },
    openFeeders() { uni.showToast({ title: '查看投喂记录', icon: 'none' }) },
    onFooterAction(action) {
      if (action.key === 'share') { this.shareSheetVisible = true }
      if (action.key === 'yard') this.openYard()
      if (action.key === 'adopt') this.adoptPickSheetVisible = true
    },
    onPrimaryAction() {
      if (this.commentsEmpty) {
        this.feedPopupVisible = true
        return
      }
      this.openPetList()
    },
    openPetList() {
      uni.navigateTo({
        url: `/pages/yard/yardCats?state=roster&name=${encodeURIComponent(this.yard.name)}&yardId=${encodeURIComponent(this.yardId)}`
      })
    },
    onLearnFood() { uni.showToast({ title: '了解猫粮功能暂未开放', icon: 'none' }) },
    onAgreement(which) { uni.showToast({ title: which === 'required' ? '请先阅读并同意投喂协议' : '阅读弹窗暂未开放', icon: 'none' }) },
    onFeedOrder() { uni.navigateTo({ url: '/pages/meMore/yardFeedOrders' }) },
    openReplySheet(comment) {
      this.replySheetTarget = comment && comment.author ? comment : null
      this.replySheetVisible = true
    },
    onReplySend(text) { uni.showToast({ title: '已发送', icon: 'none' }); this.$emit('reply-send', text) },
    onComposerVoice() { uni.showToast({ title: '语音输入敬请期待', icon: 'none' }) },
    onComposerPickImage() { uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'] }) },
    openCommentUser(comment) { const author = comment && (comment.author || comment); if (author) openUserProfile({ pawId: author.pawId || comment.id, nickname: author.name, avatar: author.avatar }) },
    toggleCommentLike(comment) { if (!comment) return; comment.liked = !comment.liked; comment.likes = Math.max(0, (comment.likes || 0) + (comment.liked ? 1 : -1)) },
    onVoicePlay() { }
  }
}
</script>

<style scoped>
.dynamic-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #fff;
  color: #252525;
  font-family: var(--paw-font-family, -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif);
}

:deep(.paw-nav__back) {
  justify-content: flex-start;
  padding-left: 6px;
}

.author-row {
  display: flex;
  align-items: center;
  flex: 0 1 auto;
  min-width: 0;
  height: 34px;
  column-gap: 5px;
  box-sizing: border-box;
}

.author-name {
  margin-left: 4px;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
}

.author-owner-badge {
  display: block;
  flex: 0 0 auto;
  width: 30px;
  height: 16px;
  line-height: 0;
}

.notice-line {
  position: absolute;
  right: 0;
  left: 0;
  z-index: 30;
  height: 20px;
  overflow: hidden;
  pointer-events: none;
}

.dynamic-scroll {
  position: absolute;
  right: 0;
  left: 0;
  z-index: 1;
  width: 100%;
  box-sizing: border-box;
  background: #f5f5f5;
}

.post-section {
  background: #fff;
}

.post-card {
  width: 100%;
  margin: 0;
  padding: 10px 15px 13px;
  box-sizing: border-box;
}

.post-copy {
  display: block;
  margin-top: 13px;
  color: #333;
  font-size: 15px;
  font-weight: 400;
  line-height: 23px;
  white-space: pre-wrap;
  word-break: break-all;
}

.post-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 13px;
  color: #8c8c8c;
  font-size: 12px;
  line-height: 19px;
}

.like-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #686868;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
}

.like-action .liked {
  color: #ff3b52;
}

.comments-section {
  padding: 0 15px;
  box-sizing: border-box;
  background: #fff;
}

.rank-section,
.yard-section {
  padding: 0 15px;
  box-sizing: border-box;
  background: #fff;
}

.rank-section {
  margin-top: 6px;
}

.yard-section {
  margin-top: 6px;
}

.scroll-spacer {
  height: 100px;
  background: #f5f5f5;
}

.comments-empty-state :deep(.comment-thread__title) {
  margin-bottom: 17px;
}

.comments-empty-state :deep(.comment-thread__empty) {
  margin-top: -5px;
  margin-bottom: -27px;
}

.comments-empty-state :deep(.comment-thread__empty .paw-empty-state__title),
.comments-empty-state :deep(.comment-thread__empty .paw-empty-state__action) {
  position: relative;
  top: 2px;
}

.dynamic-page:not(.comments-empty-state) :deep(.comment-thread) {
  padding-bottom: 30px;
}

.dynamic-page:not(.comments-empty-state) .comments-section {
  margin-bottom: 0;
}
</style>
