<template>
  <view class="yard-detail-figma" :class="'state-' + activeState">
    <!-- #ifndef MP-WEIXIN -->
    <image class="h5-status-bar" src="/static/figma/yard-detail-top.png" mode="scaleToFill" />
    <!-- #endif -->
    <PawPageNav background="#ffffff" :content-inset-left="37" fallback-url="/pages/index/index" :auto-back="false"
      @back="goBack">
      <template #content>
        <view class="yard-owner-nav">
          <PawAvatar :src="owner.avatar" :size="32" :clickable="true" @click="openOwnerProfile" />
          <text class="owner-name" @tap.stop="openOwnerProfile">{{ owner.name }}</text>
          <PawOwnerBadge class="yard-owner-badge" />
        </view>
      </template>
    </PawPageNav>
    <view class="notice-line">
      <PawAnnouncementMarquee :items="announcementItems" :height="20" :speed="82" :gap="1000" color="#333333" />
    </view>

    <view class="yard-summary" @tap.stop="$emit('yard-click', yard)">
      <view class="yard-summary__info-row">
        <PawAvatar class="yard-summary__cover" :src="yard.avatar" :size="92" shape="rounded" />
        <view class="yard-summary__details">
          <view class="yard-summary__identity">
            <view class="yard-summary__name-row"><text class="yard-summary__name">{{ yard.name }}</text>
              <PawVerifiedBadge v-if="yard.verified !== false" />
            </view>
            <YardLocationLine :text="yard.location" />
          </view>
          <view class="yard-summary__metrics">
            <view class="yard-summary__tags"><text v-for="(tag, index) in yard.tags" :key="index"
                class="yard-summary__tag">{{ tag }}</text></view>
            <view class="yard-summary__stats">
              <view class="yard-summary__stat"><text class="yard-summary__stat-value">999斤</text><text
                  class="yard-summary__stat-label">已获粮</text></view>
              <view class="yard-summary__stat"><text class="yard-summary__stat-value">13只</text><text
                  class="yard-summary__stat-label">帮助领养</text></view>
              <view class="yard-summary__stat"><text class="yard-summary__stat-value">3天2小时</text><text
                  class="yard-summary__stat-label">平均反馈时长</text></view>
            </view>
          </view>
        </view>
        <image class="yard-summary__sound" src="/static/laba.png" mode="aspectFit" />
      </view>
      <scroll-view class="pet-strip" scroll-x :show-scrollbar="false">
        <view class="pet-strip-row">
          <view class="pet-item" v-for="pet in petItems" :key="pet.id" @tap.stop="openPetDetail(pet)">
            <image :src="pet.avatar" mode="aspectFill" /><text>{{ pet.name }}</text>
          </view><uni-icons class="pet-next" type="right" :size="19" color="#c8c8c8" @tap.stop="openPetList" />
        </view>
      </scroll-view>
      <view class="yard-intro"><text>{{ introCopy }}</text><text v-if="!expandedIntro" class="more-word"
          @tap.stop="expandedIntro = true">... 全文</text><text v-else class="more-word"
          @tap.stop="expandedIntro = false">
          收起</text></view>
      <view class="yard-meta"><text>{{ yard.district }}</text>
        <view><text>点赞{{ yard.stats.likes }}</text><text>入驻{{ yard.stats.members }}人</text><text>分享{{ yard.stats.shares
        }}</text></view>
      </view>
    </view>

    <view v-if="activeState !== 'dynamic-empty'" class="yard-rank-section">
      <YardFeedRankStrip :feed-summary="yard.stats.feedSummary" :seamless-items="rankItems"
        @leaderboard="$emit('leaderboard')" @rank-user="$emit('rank-user', $event)" />
    </view>

    <view class="yard-tabs-section">
      <PawTabs class="detail-tabs" :model-value="activeState === 'feeding' ? 'feeding' : 'dynamic'" :items="detailTabs"
        variant="yard-detail" indicator-size="medium" @change="switchState" />

      <view class="yard-tabs-content" :style="tabContentStyle">
        <view v-if="activeState === 'dynamic-empty'" class="dynamic-empty">
          <image src="/static/figma/yard-detail/empty-dynamic.png" mode="aspectFill" />
          <text class="empty-title">院主佛系，还没发过动态</text>
          <view class="remind-btn" @click="showRemind">催一下</view>
        </view>

        <view v-else-if="activeState === 'feeding'" class="feeding-list">
          <view class="feeding-row" v-for="n in 4" :key="n">
            <image src="/static/figma/yard-feeding-avatar.png?v=2" mode="aspectFill" /><text
              class="feeding-name">平安是福</text>
            <LevelCapsule :level="1" /><text class="feeding-copy">投粮200克 已反馈2/5次</text>
          </view>
        </view>

        <view v-else class="dynamic-feed">
          <view class="post-card" v-for="post in postCount" :key="post">
            <view class="post-layout">
              <PawAvatar class="post-avatar" :src="'/static/figma/yard-post-owner-original.png'" :size="34" />
              <view class="post-content">
                <view class="post-head"><text class="post-name">姜栋</text>
                  <PawOwnerBadge />
                </view>
                <FeedingSourceRow class="post-source" :feeders="postFeeders" text="来自花开富贵投喂的4斤猫粮" />
                <text class="post-copy">{{ postCopy }}</text>
                <text class="post-full">全文</text>
                <image v-if="post === 1" class="post-single" src="/static/figma/yard-post-single-exact.png"
                  mode="aspectFill" />
                <view v-else class="post-grid">
                  <image v-for="n in gridCount" :key="n" src="/static/figma/yard-post-grid-exact.png"
                    mode="aspectFill" />
                </view>
                <view class="post-time">
                  <view class="post-time-info"><text>昨天 20:45　江西</text><text class="post-reply">回复</text></view>
                  <view class="post-like">
                    <PawLikeIcon :liked="false" /><text>32</text>
                  </view>
                </view>
                <CommentThread class="yard-comment-thread" :comments="yardComments.slice(0, commentCount)"
                  :comment-preview-count="3" @user-click="openCommentUser" @reply="openReplySheet"
                  @like="$emit('comment-like', $event)" />
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <PawFixedActionBar :actions="footerActions" :primary-action="primaryAction" @action="onFooterAction"
      @primary="openPetList" />
    <ShareActionSheet v-model:visible="shareSheetVisible" />
    <ReplyComposerSheet v-model:visible="replySheetVisible" :reply-to-name="replyTargetName" @send="onReplySend"
      @voice="onComposerVoice" @pick-image="onComposerPickImage" />
  </view>
</template>

<script>
import { goBackSmart } from '@/utils/navBack.js'
import PawPageNav from '@/components/PawPageNav.vue'
import PawAnnouncementMarquee from '@/components/PawAnnouncementMarquee.vue'
import PawAvatar from '@/components/identity/PawAvatar.vue'
import PawOwnerBadge from '@/components/identity/PawOwnerBadge.vue'
import PawVerifiedBadge from '@/components/identity/PawVerifiedBadge.vue'
import YardLocationLine from '@/components/identity/YardLocationLine.vue'
import LevelCapsule from '@/components/LevelCapsule.vue'
import FeedingSourceRow from '@/components/dynamic/FeedingSourceRow.vue'
import YardFeedRankStrip from '@/components/yard/YardFeedRankStrip.vue'
import PawFixedActionBar from '@/components/layout/PawFixedActionBar.vue'
import CommentThread from '@/components/dynamic/CommentThread.vue'
import PawTabs from '@/components/navigation/PawTabs.vue'
import ReplyComposerSheet from '@/components/ReplyComposerSheet.vue'
import ShareActionSheet from '@/components/ShareActionSheet.vue'
import PawLikeIcon from '@/components/base/PawLikeIcon.vue'
import { openUserProfile } from '@/utils/profileNav.js'
import { getPawHomeYardMock } from '@/utils/yardMock.js'

export default {
  name: 'PawYardDetailFigma',
  components: { PawPageNav, PawAnnouncementMarquee, PawAvatar, PawOwnerBadge, PawVerifiedBadge, YardLocationLine, LevelCapsule, FeedingSourceRow, YardFeedRankStrip, PawFixedActionBar, CommentThread, PawTabs, ReplyComposerSheet, ShareActionSheet, PawLikeIcon },
  props: {
    state: { type: String, default: 'dynamic' },
    yardData: { type: Object, default: () => getPawHomeYardMock() }
  },
  emits: ['yard-click', 'leaderboard', 'rank-user', 'pet-click', 'pet-list-click', 'adopt', 'comment-user', 'comment-reply', 'comment-like'],
  data() {
    const yardMock = { ...getPawHomeYardMock(), ...this.yardData }
    return {
      activeState: this.state,
      expandedIntro: this.state === 'dynamic-expanded',
      joined: this.state === 'feeding',
      tabContentMinHeight: 0,
      shareSheetVisible: false,
      replySheetVisible: false,
      replySheetTarget: null,
      announcementItems: yardMock.announcementItems,
      detailTabs: [{ key: 'dynamic', label: '动态' }, { key: 'feeding', label: '投粮记录' }],
      owner: yardMock.owner,
      yard: yardMock,
      petItems: yardMock.pets.slice(0, 6).map(pet => ({ id: pet.id, name: pet.name, avatar: pet.avatar })),
      postFeeders: yardMock.postFeeders,
      rankItems: yardMock.rankItems
    }
  },
  computed: {
    tabContentStyle() {
      return this.tabContentMinHeight ? { minHeight: `${this.tabContentMinHeight}px` } : {}
    },
    introCopy() {
      const short = '小灰灰是去年冬天快过年的时候发现的流浪猫，一开始胆子很小，后来熟了之后才愿意跟我接触，希望多多投喂，谢谢，感谢大家的帮助和支持，我...'
      const long = '小灰灰是去年冬天快过年的时候发现的流浪猫，一开始胆子很小，后来熟了之后才愿意跟我接触，希望多多投喂，谢谢，感谢大家的帮助和支持。我一定会好好照顾这些可爱的小生命，让它们健康成长。小灰灰平时很亲人，也喜欢安静地晒太阳，希望大家持续关注它。'
      return this.expandedIntro ? long : short
    },
    postCount() { return this.activeState === 'dynamic-expanded' ? 2 : 2 }
    , postCopy() {
      const base = '哎 又忍不住开始书写小作文　　此时的弟弟应该刚下自习不到20分钟 又忍不住开始书写小作文　　此时的弟弟应该刚下自习不到20分钟 又忍不住开始书写小作文...'
      return this.activeState === 'dynamic-expanded' ? base + base : base
    }
    , commentCount() { return this.activeState === 'dynamic-expanded' ? 4 : 3 }
    , yardComments() { return this.yard.comments || [] }
    , gridCount() { return this.activeState === 'dynamic-expanded' ? 3 : 9 }
    , footerActions() { return [{ key: 'share', label: '分享', image: '/static/fenxiang.png' }, { key: 'join', label: this.joined ? '已入驻' : '入驻', image: this.joined ? '/static/yard-joined-checked.png' : '/static/ruzhu.png' }, { key: 'adopt', label: '领养', image: '/static/lingyang.png' }] }
    , primaryAction() { return { key: 'feed', label: '云养一只', iconName: 'actions/feed', iconSize: 32, size: 'md' } }
    , replyTargetName() {
      const target = this.replySheetTarget
      const author = target && target.author
      return author && typeof author.name === 'string' ? author.name : ''
    }
  },
  watch: {
    state(next) { this.activeState = next; this.expandedIntro = next === 'dynamic-expanded' }
  },
  mounted() {
    this.$nextTick(() => this.captureTabContentHeight())
  },
  methods: {
    goBack() { goBackSmart({ fallbackUrl: '/pages/index/index' }) },
    openOwnerProfile() {
      openUserProfile({ pawId: 'owner-1', nickname: this.owner.name, avatar: this.owner.avatar })
    },
    captureTabContentHeight() {
      uni.createSelectorQuery().in(this).select('.yard-tabs-content').boundingClientRect(rect => {
        if (rect && rect.height > this.tabContentMinHeight) this.tabContentMinHeight = rect.height
      }).exec()
    },
    switchState(next) {
      this.activeState = next
      this.expandedIntro = false
      this.$nextTick(() => this.captureTabContentHeight())
    },
    toggleJoin() { this.joined = !this.joined },
    share() { this.shareSheetVisible = true },
    showRemind() { uni.showToast({ title: '已提醒院主', icon: 'none' }) },
    openPetDetail(pet) { this.$emit('pet-click', pet) },
    openPetList() { this.$emit('pet-list-click') },
    openReplySheet(comment) {
      this.replySheetTarget = comment && comment.author ? comment : null
      this.replySheetVisible = true
      this.$emit('comment-reply', comment)
    },
    onReplySend() { uni.showToast({ title: '已发送', icon: 'none' }) },
    onComposerVoice() { uni.showToast({ title: '语音输入敬请期待', icon: 'none' }) },
    onComposerPickImage() { uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'] }) },
    openCommentUser(comment) {
      this.$emit('comment-user', comment)
      const author = comment && (comment.author || comment)
      if (author) openUserProfile({ pawId: author.pawId || comment.id, nickname: author.name, avatar: author.avatar })
    },
    onFooterAction(action) { if (action.key === 'share') this.share(); if (action.key === 'join') this.toggleJoin(); if (action.key === 'adopt') this.$emit('adopt') }
  }
}
</script>

<style scoped>
.yard-detail-figma {
  position: relative;
  min-height: 100vh;
  padding-bottom: 90px;
  background: #fff;
  color: #222;
  box-sizing: border-box;
  font-family: "Source Han Sans CN", "PingFang SC", sans-serif
}

.h5-status-bar {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 108px;
  z-index: 100;
  pointer-events: none
}

.status-space {
  height: 44px
}

.yd-nav {
  height: 44px;
  display: flex;
  align-items: center;
  padding: 0 13px;
  box-sizing: border-box
}

.yd-back {
  width: 24px;
  height: 34px;
  display: flex;
  align-items: center
}

.yd-back image {
  width: 9px;
  height: 18px
}

.owner-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-left: 4px
}

.owner-name {
  margin-left: 9px;
  font-size: 14px
}

.owner-tag,
.post-owner {
  margin-left: 6px;
  padding: 2px 5px;
  border-radius: 4px;
  background: #fff1f3;
  color: #ff2950;
  font-size: 9px
}

.nav-spacer {
  flex: 1
}

.mini-capsule {
  width: 78px;
  height: 30px;
  border: 1px solid #e7e7e7;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: space-evenly
}

.capsule-line {
  width: 1px;
  height: 18px;
  background: #e5e5e5
}

.capsule-ring {
  width: 13px;
  height: 13px;
  border: 2px solid #222;
  border-radius: 50%
}

.notice-line {
  height: 20px;
  overflow: hidden;
  background: transparent;
  color: inherit;
  font-size: inherit;
  line-height: normal;
  white-space: normal
}

.yard-summary {
  padding: 10px 15px 0;
  box-sizing: border-box;
  background: #fff;
  border-bottom: 6px solid #f5f5f5
}

.yard-summary__info-row {
  position: relative;
  display: flex;
  align-items: flex-start;
  width: 100%;
  height: 102.5px
}

.yard-summary__cover {
  width: 92px;
  height: 92px
}

.yard-summary__details {
  display: flex;
  flex: 0 0 183px;
  flex-direction: column;
  width: 183px;
  margin: 2px 0 0 18px
}

.yard-summary__identity {
  display: flex;
  height: 37.5px;
  flex-direction: column;
  gap: 5.5px
}

.yard-summary__name-row {
  display: flex;
  align-items: center;
  height: 16px;
  gap: 3px
}

.yard-summary__name {
  overflow: hidden;
  color: #333;
  font-size: 16px;
  font-weight: 500;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap
}

.yard-summary__identity :deep(.yard-location-line) {
  height: 16px;
  box-sizing: border-box
}

.yard-summary__metrics {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 7px
}

.yard-summary__tags {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 16px;
  white-space: nowrap
}

.yard-summary__tag {
  display: flex;
  height: 16px;
  align-items: center;
  padding: 2px 5px;
  box-sizing: border-box;
  border-radius: 5px;
  background: #fefada;
  color: #ee8002;
  font-size: 11px;
  font-weight: 500;
  line-height: 12px;
  white-space: nowrap
}

.yard-summary__tag:nth-child(2) {
  font-size: 12px
}

.yard-summary__stats {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  width: 183px;
  height: 36px;
  margin-left: 1px
}

.yard-summary__stat {
  display: flex;
  height: 36px;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start
}

.yard-summary__stat:nth-child(1) {
  width: 43px
}

.yard-summary__stat:nth-child(2) {
  width: 33px
}

.yard-summary__stat:nth-child(3) {
  width: 66px
}

.yard-summary__stat-value {
  display: block;
  color: #000;
  font-size: 15px;
  font-weight: 700;
  line-height: 22px;
  white-space: nowrap
}

.yard-summary__stat-label {
  display: block;
  margin-top: -2px;
  color: #999;
  font-size: 11px;
  font-weight: 400;
  line-height: 16px;
  white-space: nowrap
}

.yard-summary__sound {
  position: absolute;
  top: 4px;
  right: 0;
  width: 32px;
  height: 32px
}

.pet-strip {
  width: 100%;
  height: 58px;
  margin-top: 13px;
  white-space: nowrap
}

.pet-strip-row {
  display: inline-flex;
  align-items: flex-start;
  height: 58px
}

.pet-item {
  display: flex;
  flex: 0 0 49px;
  width: 49px;
  height: 58px;
  margin-right: 5px;
  flex-direction: column;
  align-items: center
}

.pet-item image {
  display: block;
  width: 40px;
  height: 40px;
  border-radius: 50%
}

.pet-item text {
  display: block;
  margin-top: 2px;
  color: #686868;
  font-size: 13px;
  line-height: 16px;
  white-space: nowrap
}

.pet-next {
  width: 15px;
  flex: 0 0 15px;
  margin-top: 19px
}

.yard-intro {
  position: relative;
  min-height: 69px;
  margin-top: 8px;
  font-size: 15px;
  font-weight: 500;
  line-height: 22.5px;
  color: #282827
}

.more-word {
  font-weight: 400;
  color: #576b95
}

.yard-meta {
  display: flex;
  height: 32px;
  align-items: flex-start;
  justify-content: space-between;
  margin-top: 15px;
  border-bottom: 1px solid #ececec;
  color: #b8b7b3;
  font-size: 11px;
  line-height: 16px
}

.yard-meta>text,
.yard-meta>view {
  padding-top: 8px
}

.yard-meta view {
  display: flex;
  gap: 8px
}

.state-dynamic-empty .yard-summary {
  padding-bottom: 29px
}

.state-dynamic-expanded .yard-intro {
  min-height: 110px
}

.rank-area {
  height: 92px;
  overflow: hidden;
  border-bottom: 1px solid #eee
}

.rank-title {
  height: 31px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 13px;
  font-size: 13px
}

.rank-title text:last-child {
  color: #aaa
}

.rank-row {
  height: 39px;
  display: flex;
  align-items: center;
  padding: 0 13px;
  font-size: 13px
}

.rank-row--second {
  opacity: .6
}

.rank-row image {
  width: 27px;
  height: 27px;
  border-radius: 50%;
  margin-right: 7px
}

.rank-level,
.feeding-level {
  margin-left: 5px;
  padding: 1px 5px;
  border-radius: 6px;
  background: #493100;
  color: #fff;
  font-size: 9px
}

.rank-right {
  margin-left: auto;
  color: #edbf00;
  font-size: 12px
}

.detail-tabs {
  display: flex;
  align-items: center;
  justify-content: center
}

.yard-rank-section,
.yard-tabs-section {
  box-sizing: border-box;
  padding-right: 15px;
  padding-left: 15px;
  background: #fff
}

.yard-rank-section {
  border-bottom: 6px solid #f5f5f5
}

.dynamic-empty {
  height: 322px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 38px;
  box-sizing: border-box
}

.dynamic-empty image {
  width: 165px;
  height: 125px
}

.empty-title {
  margin-top: 14px;
  color: #888;
  font-size: 13px
}

.remind-btn {
  margin-top: 16px;
  width: 76px;
  height: 33px;
  border: 1px solid #e5e5e5;
  border-radius: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px
}

.feeding-list {
  padding: 0
}

.feeding-row {
  height: 52px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #fafafa
}

.feeding-row image {
  width: 34px;
  height: 34px;
  border-radius: 50%
}

.feeding-name {
  margin-left: 8px;
  color: #999;
  font-size: 14px
}

.feeding-copy {
  margin-left: auto;
  font-size: 13px
}

.dynamic-feed {
  background: #f6f6f6
}

.post-card {
  padding: 18px 0;
  margin-bottom: 0;
  background: #fff;
  border-bottom: 1px solid #eee
}

.post-card:last-child {
  margin-bottom: 0;
  border-bottom: 0
}

.post-layout {
  display: flex;
  align-items: flex-start;
  column-gap: 8px;
  padding: 0;
  width: 100%;
  box-sizing: border-box
}

.post-avatar {
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  padding: 0;
  margin: 0
}

.post-content {
  display: flex;
  flex: 1 1 0%;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start
}

.post-head {
  display: flex;
  align-items: center;
  width: 100%
}

.post-name {
  font-size: 14px
}

.post-source {
  display: flex;
  align-items: center;
  width: 100%;
  margin-left: 0;
  margin-top: 8px
}

.tiny-pets {
  display: flex
}

.tiny-pets image {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  margin-right: -4px;
  border: 1px solid #fff
}

.post-source>text {
  margin-left: 8px;
  padding: 3px 5px;
  border-radius: 4px;
  background: #edf4ff;
  color: #58759b;
  font-size: 10px
}

.post-copy {
  display: block;
  width: 100%;
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 21px
}

.post-full {
  display: block;
  margin: 8px 0 0;
  color: #5c7197;
  font-size: 13px
}

.post-single {
  display: block;
  width: 144px;
  height: 297px;
  margin: 8px 0 0
}

.post-grid {
  display: grid;
  grid-template-columns: repeat(3, 85px);
  width: 263px;
  gap: 4px;
  margin: 8px 0 0
}

.post-grid image {
  width: 85px;
  height: 95px
}

.post-time {
  min-height: 19px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  color: #8c8c8c;
  font-size: 12px;
  line-height: 19px
}

.yard-comment-thread {
  width: 100%;
  padding: 0 !important;
  margin-top: 8px;
  box-sizing: border-box
}

.post-time-info {
  display: flex;
  align-items: center;
  min-width: 0
}

.post-reply {
  margin-left: 10px;
  color: #616161
}

.post-like {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #686868;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px
}

.comment {
  display: flex;
  align-items: flex-start;
  margin: 2px 0 0 38px;
  min-height: 86px;
  color: #999;
  font-size: 11px
}

.comment-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ddd;
  flex-shrink: 0
}

.comment-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  margin-left: 7px;
  color: #666
}

.comment-main i {
  padding: 1px 4px;
  border-radius: 4px;
  background: #fff1f3;
  color: #ff2950;
  font-style: normal;
  font-size: 8px
}

.comment-main small {
  margin-top: 5px;
  color: #aaa
}

.expand-comments {
  display: block;
  margin-left: 70px;
  font-size: 11px;
  color: #555
}

.bottom-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 90px;
  padding: 8px 13px calc(8px + env(safe-area-inset-bottom));
  display: flex;
  align-items: flex-start;
  background: #fff;
  border-top: 1px solid #eee;
  box-sizing: border-box;
  z-index: 50
}

.bottom-small {
  width: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #888;
  font-size: 10px
}

.bottom-small text {
  margin-top: 2px
}

.bottom-main {
  flex: none;
  width: 188px;
  height: 43px;
  border-radius: 23px;
  background: #ffe000;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  font-size: 16px;
  font-weight: 700
}

.yard-owner-nav {
  display: flex;
  align-items: center;
  height: 32px;
  box-sizing: border-box
}

.yard-owner-nav .owner-name {
  margin-left: 9px
}

.yard-owner-nav .yard-owner-badge {
  margin-left: 6px
}

.state-dynamic-expanded .yard-intro {
  min-height: 147px
}

.state-dynamic-expanded .post-single {
  height: 330px
}

/* #ifdef H5 */
.state-dynamic .bottom-actions,
.state-dynamic-expanded .bottom-actions {
  position: absolute
}

/* #endif */
</style>
