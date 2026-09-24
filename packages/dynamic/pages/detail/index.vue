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

    <view v-if="recordStatus !== 'ready'" class="dynamic-detail-state" :class="{ 'dynamic-detail-state--error': recordStatus === 'error' }"
      data-qa="qa-dynamic-detail-state">
      <text class="dynamic-detail-state__title">{{ recordStatus === 'loading' ? '正在读取动态' : '动态暂不可用' }}</text>
      <text class="dynamic-detail-state__copy">{{ recordStatus === 'loading' ? '正在读取当前动态内容' : '请从有效的动态消息或任务入口重新进入。' }}</text>
    </view>

    <template v-else>
      <view class="notice-line" :style="{ top: contentTop + 'px' }">
        <PawAnnouncementMarquee :items="announcementItems" :height="20" :speed="82" :gap="1000" color="#333333" />
      </view>

      <scroll-view class="dynamic-scroll" :style="scrollStyle" scroll-y :show-scrollbar="false">
        <view class="post-section">
          <view data-qa="qa-dynamic-detail-media"><DynamicMediaViewer :items="mediaItems" /></view>
          <view class="post-card" data-qa="qa-dynamic-detail-post">
            <FeedingSourceRow :feeders="feeders" :text="feedingSourceText" @click="openFeeders" />
            <text class="post-copy" data-qa="qa-dynamic-detail-post-copy">{{ postCopy }}</text>
          <view class="post-meta">
            <text>{{ postMeta }}</text>
            <view class="like-action" @tap.stop="toggleLike">
              <PawLikeIcon :liked="liked" />
              <text :class="{ liked: liked }">{{ likes }}</text>
            </view>
          </view>
          </view>

          <view class="comments-section">
            <CommentThread :comments="comments" :empty="commentsEmpty" :total="commentTotal" :comment-preview-count="3"
              @user-click="openCommentUser" @reply="openReplySheet" @like="toggleCommentLike" @voice-play="onVoicePlay"
              @empty-action="openReplySheet">
              <template #before>
                <CommentComposer :avatar="currentUser.avatar" readonly @click="openReplySheet()" @voice="onComposerVoice"
                  @pick-image="onComposerPickImage" />
              </template>
            </CommentThread>
          </view>
        </view>

        <view v-if="rankItems.length" class="rank-section">
          <YardFeedRankStrip :feed-summary="feedSummary" :seamless-items="rankItems" @leaderboard="openLeaderboard"
            @rank-user="openRankUser" />
        </view>

        <view class="yard-section" data-qa="qa-dynamic-detail-yard-summary">
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
        :owner-avatar="yard.avatar" :owner-paw-id="yard.owner ? yard.owner.pawId : undefined" />
      <YardFeedPopup v-if="commentsEmpty" v-model="feedPopupVisible" @learn-food="onLearnFood"
        @agreement="onAgreement" @feed-order="onFeedOrder" />
    </template>
  </view>
</template>

<script lang="ts">
import { findCommentById, type CommentItemRecord } from '@/components/dynamic/commentMetadata.ts'

import { defineComponent } from 'vue'

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
import { getWechatNavLayout, type WechatNavLayout } from '@/utils/navLayout.ts'
import { openUserProfile } from '@/utils/profileNav.ts'
import { readDynamicRecord, normalizeDynamicRecord } from '@/packages/dynamic/services/reader.ts'
import {
  createDynamicDetailPageState,
  normalizeDynamicDetailRecord,
  normalizeDynamicDetailRoute,
  type DynamicDetailFooterAction,
  type DynamicDetailPageState,
  type DynamicDetailPrimaryAction,
} from '@/packages/dynamic/services/detailMetadata.ts'
import type { YardFeedAgreement } from '@/components/yard/yardFeedPopupMetadata.ts'
import type { YardRankItem } from '@/utils/yardMock.ts'

export default defineComponent({
  name: 'DynamicDetailPage',
  components: { PawAnnouncementMarquee, PawPageNav, PawAvatar, PawOwnerBadge, PawFixedActionBar, DynamicMediaViewer, FeedingSourceRow, CommentComposer, CommentThread, ReplyComposerSheet, ShareActionSheet, AdoptPickCatsSheet, YardFeedRankStrip, YardSummaryCard, YardFeedPopup, PawLikeIcon },
  emits: {
    'reply-send': (text: string) => typeof text === 'string',
  },
  data(): DynamicDetailPageState {
    return createDynamicDetailPageState(getWechatNavLayout())
  },
  computed: {
    contentTop() {
      const nav = this.navLayout
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
    footerActions(): DynamicDetailFooterAction[] {
      return [
        { key: 'share', label: '分享', iconName: 'actions/dynamic-share' },
        { key: 'yard', label: this.commentsEmpty ? '入驻' : '去看看', iconName: 'actions/dynamic-join' },
        { key: 'adopt', label: '领养', iconName: 'actions/dynamic-adopt', qa: 'qa-dynamic-detail-adopt' }
      ]
    },
    primaryAction(): DynamicDetailPrimaryAction {
      return { key: 'feed', label: this.commentsEmpty ? '投点猫粮' : '云养一只', iconName: 'actions/feed', iconSize: 32, size: 'md' }
    },
    recordActor(): unknown {
      try {
        const session = typeof uni !== 'undefined' && uni && typeof uni.getStorageSync === 'function'
          ? uni.getStorageSync('PAWHOME_ACTOR_SESSION') : null
        return session && session.actor ? session.actor : session
      } catch {
        return null
      }
    },
    replyTargetName() {
      const target = this.replySheetTarget
      const author = target && target.author
      return author && typeof author.name === 'string' ? author.name : ''
    },
    adoptionPets() {
      return this.yard.pets.filter(pet => pet.state === 'pending' || pet.state === 'cloud')
    }
  },
  onLoad(query: unknown = {}) {
    this.navLayout = getWechatNavLayout()
    const route = normalizeDynamicDetailRoute(query)
    if (route.yardId) this.yardId = route.yardId
    if (route.dynamicId) this.dynamicId = route.dynamicId
    this.commentsEmptyForced = route.commentsEmpty
    this.commentsEmpty = this.commentsEmptyForced
    this.loadRecord()
  },
  onShow() {
    if (this.dynamicId) this.loadRecord()
  },
  onShareAppMessage() {
    const state = this.commentsEmpty ? '&state=comments-empty' : ''
    return {
      title: `${this.yard.name}动态`,
      path: `/packages/dynamic/pages/detail/index?yardId=${encodeURIComponent(this.yardId)}&dynamicId=${encodeURIComponent(this.dynamicId)}${state}`,
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
    loadRecord() {
      this.recordStatus = 'loading'
      const result = readDynamicRecord(this.dynamicId, {
        actor: this.recordActor,
        requireActor: false,
        allowPublic: true,
      })
      const normalized = result.record && normalizeDynamicRecord(result.record)
      const model = normalized && normalizeDynamicDetailRecord(normalized)
      if (!model) {
        this.recordStatus = 'error'
        this.recordError = result.code || 'NOT_FOUND'
        return
      }
      this.recordStatus = 'ready'
      this.recordError = ''
      this.yardId = model.yardId || this.yardId
      this.yard = model.yard
      this.mediaItems = model.mediaItems
      this.announcementItems = model.announcementItems
      this.author = model.author
      this.currentUser = model.currentUser
      this.feeders = model.feeders
      this.rankItems = model.rankItems
      this.comments = model.comments
      this.postCopy = model.copy
      this.postMeta = model.meta
      this.feedingSourceText = model.feedingSource
      this.feedSummary = model.feedSummary
      this.likes = model.likes
      this.liked = model.liked
      this.commentTotal = `共 ${model.commentsTotal} 条评论`
      this.commentsEmpty = this.commentsEmptyForced || model.commentsTotal === 0
      if (this.commentsEmpty) this.comments = []
    },
    onNavLayout(layout: WechatNavLayout) { this.navLayout = layout },
    toggleLike() { this.liked = !this.liked; this.likes = Math.max(0, this.likes + (this.liked ? 1 : -1)) },
    openProfile() { openUserProfile({ pawId: 'owner-1', nickname: this.author.name, avatar: this.author.avatar }) },
    openYard() { uni.navigateTo({ url: `/packages/yard/pages/detail/index?yardId=${encodeURIComponent(this.yardId)}` }) },
    openLeaderboard() { uni.navigateTo({ url: '/packages/discovery/pages/ranking/index' }) },
    openRankUser(item: YardRankItem) {
      openUserProfile({ pawId: item.pawId || item.id, nickname: item.text, avatar: item.avatar })
    },
    openFeeders() { uni.showToast({ title: '查看投喂记录', icon: 'none' }) },
    onFooterAction(action: import('@/components/layout/PawFixedActionBar.vue').PawFixedAction) {
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
        url: `/packages/yard/pages/animals/index?state=roster&name=${encodeURIComponent(this.yard.name)}&yardId=${encodeURIComponent(this.yardId)}`
      })
    },
    onLearnFood() { uni.showToast({ title: '了解猫粮功能暂未开放', icon: 'none' }) },
    onAgreement(which: YardFeedAgreement) {
      uni.showToast({ title: which === 'required' ? '请先阅读并同意投喂协议' : '阅读弹窗暂未开放', icon: 'none' })
    },
    onFeedOrder() { uni.navigateTo({ url: '/packages/feeding/pages/yard-orders/index?yardId=1' }) },
    openReplySheet(comment?: CommentItemRecord) {
      this.replySheetTarget = comment ? findCommentById(this.comments, comment.id) : null
      this.replySheetVisible = true
    },
    onReplySend(text: string) { uni.showToast({ title: '已发送', icon: 'none' }); this.$emit('reply-send', text) },
    onComposerVoice() { uni.showToast({ title: '语音输入敬请期待', icon: 'none' }) },
    onComposerPickImage() { uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'] }) },
    openCommentUser(comment: CommentItemRecord) {
      const author = comment.author || {}
      openUserProfile({ pawId: author.pawId || comment.id, nickname: author.name, avatar: author.avatar })
    },
    toggleCommentLike(comment: CommentItemRecord) {
      comment.liked = !comment.liked
      comment.likes = Math.max(0, Number(comment.likes || 0) + (comment.liked ? 1 : -1))
    },
    onVoicePlay() { }
  }
})
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

.dynamic-detail-state {
  display: flex;
  min-height: 320px;
  box-sizing: border-box;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: #fff;
  text-align: center;
}

.dynamic-detail-state__title {
  color: #555;
  font-size: 16px;
  line-height: 23px;
}

.dynamic-detail-state__copy {
  max-width: 280px;
  margin-top: 8px;
  color: #999;
  font-size: 13px;
  line-height: 20px;
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
