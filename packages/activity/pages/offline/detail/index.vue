<template>
  <view class="offline-activity-detail-page">
    <image
      v-if="activity"
      class="offline-activity-detail-page__hero-backdrop"
      :class="{ 'offline-activity-detail-page__hero-backdrop--hidden': heroBackdropHidden }"
      :src="activity.cover"
      mode="aspectFill"
      aria-hidden="true"
    />

    <PawPageNav
      :background="navBackground"
      :show-back="!isAtTop"
      :auto-back="false"
      :content-slot-enabled="isAtTop"
      slot-position="custom"
      :slot-style="backSlotStyle"
      @back="goBack"
      @layout="onNavLayout"
    >
      <template #content>
        <OfflineActivityBackButton
          qa="qa-offline-activity-back"
          @back="goBack"
        />
      </template>
    </PawPageNav>

    <scroll-view
      id="offline-activity-detail-scroll"
      class="offline-activity-detail-page__scroll"
      scroll-y
      :enable-flex="true"
      :show-scrollbar="false"
      :bounces="false"
      :upper-threshold="4"
      data-qa="qa-offline-activity-detail"
      @scroll="onScroll"
      @scrolltoupper="onScrollToTop"
      @touchend="scheduleNavReconcile"
    >
      <view class="offline-activity-detail-page__content">
        <image
          v-if="activity"
          class="offline-activity-detail-page__hero-image"
          :style="{ top: -navTotalHeight + 'px' }"
          :src="activity.cover"
          mode="aspectFill"
          :aria-label="activity.detailTitle"
        />
        <view
          class="offline-activity-detail-page__hero-flow"
          :style="{ height: heroSpacerHeight + 'px' }"
        />

        <template v-if="activity">
          <view class="offline-activity-detail-page__summary">
            <view class="offline-activity-detail-page__summary-title-row">
              <text class="offline-activity-detail-page__summary-title">{{
                activity.detailTitle
              }}</text>
              <view
                class="offline-activity-detail-page__summary-status"
                :class="{
                  'offline-activity-detail-page__summary-status--ended': activity.state === 'ended',
                }"
              >
                <text>{{ activity.stateLabel }}</text>
              </view>
            </view>
            <view class="offline-activity-detail-page__tags">
              <text
                v-for="tag in activity.tags"
                :key="tag"
                class="offline-activity-detail-page__tag"
                >{{ tag }}</text
              >
            </view>
            <view
              class="offline-activity-detail-page__meta-row offline-activity-detail-page__meta-row--time"
            >
              <image
                class="offline-activity-detail-page__meta-icon offline-activity-detail-page__meta-icon--time"
                :src="assets.time"
                mode="aspectFit"
                aria-hidden="true"
              />
              <text class="offline-activity-detail-page__meta-label">时间</text>
              <text class="offline-activity-detail-page__meta-value">{{ activity.startText }}</text>
            </view>
            <view
              class="offline-activity-detail-page__meta-row offline-activity-detail-page__meta-row--location"
            >
              <image
                class="offline-activity-detail-page__meta-icon offline-activity-detail-page__meta-icon--location"
                :src="assets.location"
                mode="aspectFit"
                aria-hidden="true"
              />
              <text class="offline-activity-detail-page__meta-label">地点</text>
              <text
                class="offline-activity-detail-page__meta-value offline-activity-detail-page__meta-value--location"
              >
                {{ activity.detailLocation }}
              </text>
              <image
                class="offline-activity-detail-page__navigation-icon"
                :src="assets.navigation"
                mode="aspectFit"
                aria-hidden="true"
              />
            </view>
            <view
              class="offline-activity-detail-page__meta-row offline-activity-detail-page__meta-row--members"
            >
              <image
                class="offline-activity-detail-page__meta-icon offline-activity-detail-page__meta-icon--members"
                :src="assets.members"
                mode="aspectFit"
                aria-hidden="true"
              />
              <text class="offline-activity-detail-page__meta-label">成员</text>
              <PawAvatarStack
                class="offline-activity-detail-page__member-avatars"
                :items="activity.participantAvatars"
                :size="19"
                :overlap="7"
                :max="3"
              />
              <text class="offline-activity-detail-page__member-count"
                >{{ activity.participantCount }} 人已报名</text
              >
            </view>
          </view>

          <view
            class="offline-activity-detail-page__section offline-activity-detail-page__description"
          >
            <text class="offline-activity-detail-page__section-title">活动详情</text>
            <view class="offline-activity-detail-page__description-copy">
              <text
                v-for="line in activity.description"
                :key="line"
                >{{ line }}</text
              >
            </view>
          </view>

          <view
            class="offline-activity-detail-page__section offline-activity-detail-page__organizer"
          >
            <text class="offline-activity-detail-page__section-title">活动发起人</text>
            <view class="offline-activity-detail-page__organizer-profile">
              <image
                class="offline-activity-detail-page__organizer-avatar"
                :src="activity.organizerAvatarLarge"
                mode="aspectFill"
                :aria-label="activity.organizerName"
              />
              <view class="offline-activity-detail-page__organizer-info">
                <view class="offline-activity-detail-page__organizer-name-row">
                  <text class="offline-activity-detail-page__organizer-name">{{
                    activity.organizerName
                  }}</text>
                  <LevelBadge :level="1" />
                </view>
                <text class="offline-activity-detail-page__organizer-events">{{
                  activity.organizerEvents
                }}</text>
                <view class="offline-activity-detail-page__organizer-type">
                  <image
                    class="offline-activity-detail-page__organizer-type-icon"
                    :src="assets.organizerKind"
                    mode="aspectFit"
                    aria-hidden="true"
                  />
                  <text>{{ activity.organizerType }}</text>
                </view>
              </view>
            </view>
          </view>

          <view
            class="offline-activity-detail-page__section offline-activity-detail-page__comments"
          >
            <text class="offline-activity-detail-page__section-title"
              >留言 {{ comments.length }}</text
            >
            <CommentComposer
              class="offline-activity-detail-page__composer"
              :avatar="assets.commentUser"
              placeholder="留下你的想法吧~"
              fluid
              readonly
              data-qa="qa-offline-activity-comment-composer"
              @click="openReplySheet()"
              @voice="onComposerUnavailable"
              @pick-image="onComposerUnavailable"
            />
            <view class="offline-activity-detail-page__comment-list">
              <CommentItem
                v-for="comment in comments"
                :key="comment.id"
                class="offline-activity-detail-page__comment"
                :comment="comment"
                @reply="openReplySheet"
                @like="toggleCommentLike"
              />
            </view>
          </view>

          <view class="offline-activity-detail-page__recommend-heading">
            <image
              class="offline-activity-detail-page__recommend-mark"
              :src="assets.recommendMark"
              mode="aspectFit"
              aria-hidden="true"
            />
            <text>你可能还喜欢</text>
            <image
              class="offline-activity-detail-page__recommend-mark"
              :src="assets.recommendMark"
              mode="aspectFit"
              aria-hidden="true"
            />
          </view>
          <OfflineActivityCard
            v-if="recommendedActivity"
            :activity="recommendedActivity"
            @open="openActivity"
          />
          <view class="offline-activity-detail-page__bottom-space" />
        </template>
        <view
          v-else
          class="offline-activity-detail-page__invalid"
          data-qa="qa-offline-activity-invalid-route"
        >
          <text class="offline-activity-detail-page__invalid-title">活动暂不可用</text>
          <text>请从线下活动列表选择一个有效活动。</text>
          <view
            class="offline-activity-detail-page__invalid-action"
            @tap="goBack"
            >返回活动列表</view
          >
        </view>
      </view>
    </scroll-view>

    <PawFixedActionBar
      v-if="activity"
      class="offline-activity-detail-page__action-bar"
      data-qa="qa-offline-activity-action-bar"
      :actions="shareActions"
      :primary-action="registerAction"
      primary-full-width
      variant="offline-activity"
      @action="onFooterAction"
      @primary="registerForActivity"
    />

    <ShareActionSheet
      v-model:visible="shareSheetVisible"
      :share-data="activityShareData"
      native-wechat-share
      @select="onShareAction"
    />

    <ReplyComposerSheet
      v-model:visible="replySheetVisible"
      :reply-to-name="replyTargetName"
      @send="onReplySend"
      @voice="onComposerUnavailable"
      @pick-image="onComposerUnavailable"
    />
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import LevelBadge from '@/components/customBadge/LevelBadge.vue'
import PawAvatarStack from '@/components/identity/PawAvatarStack.vue'
import PawFixedActionBar, { type PawFixedAction } from '@/components/layout/PawFixedActionBar.vue'
import CommentComposer from '@/components/dynamic/CommentComposer.vue'
import CommentItem from '@/components/dynamic/CommentItem.vue'
import type { CommentItemRecord } from '@/components/dynamic/commentMetadata.ts'
import ReplyComposerSheet from '@/components/ReplyComposerSheet.vue'
import ShareActionSheet, {
  type ShareActionKey,
  type ShareData,
} from '@/components/ShareActionSheet.vue'
import { buildRoute, isPlainRecord, parseRoute } from '@/navigation/routeContracts.ts'
// #ifdef MP-WEIXIN
import { decodeWeixinLoadOptions } from '@/navigation/weixinLoadOptions.ts'
// #endif
import { readPawEventNumber } from '@/utils/pawEventMetadata.ts'
import type { WechatNavLayout } from '@/utils/navLayout.ts'
import OfflineActivityCard from '../../../components/OfflineActivityCard.vue'
import OfflineActivityBackButton from '../../../components/OfflineActivityBackButton.vue'
import { OFFLINE_ACTIVITY_ASSETS } from '../../../services/offlineActivityAssets.ts'
import {
  getOfflineActivityDetail,
  getOfflineActivitySummaries,
  type OfflineActivityDetail,
} from '../../../services/offlineActivityFixtures.ts'

interface OfflineActivityDetailPageState {
  assets: typeof OFFLINE_ACTIVITY_ASSETS
  activity: OfflineActivityDetail | null
  navTotalHeight: number
  showScrolledNav: boolean
  comments: CommentItemRecord[]
  replySheetVisible: boolean
  replyTarget: CommentItemRecord | null
  nextCommentId: number
  shareActions: PawFixedAction[]
  shareSheetVisible: boolean
}

// Keep the visual state stable near the top while the scroll-view settles.
const NAV_SHOW_SCROLL_TOP = 48
const NAV_HIDE_SCROLL_TOP = 24
const NAV_RECONCILE_DELAY_MS = 100
const NAV_RECONCILE_MAX_SAMPLES = 15

interface NavReconcileState {
  token: number
  timer: ReturnType<typeof setTimeout> | null
}

const navReconcileStates = new WeakMap<object, NavReconcileState>()

function readActivityId(options: unknown): string {
  const query: Record<string, unknown> = {
    // #ifdef MP-WEIXIN
    ...decodeWeixinLoadOptions(options),
    // #endif
    // #ifndef MP-WEIXIN
    ...(isPlainRecord(options) ? options : {}),
    // #endif
  }
  const activityId = typeof query.activityId === 'string' ? query.activityId : ''
  const target = buildRoute('activity.offline.detail', { activityId })
  return parseRoute(target).params.activityId
}

function toCommentRecord(comment: OfflineActivityDetail['comments'][number]): CommentItemRecord {
  return {
    id: comment.id,
    author: { name: comment.author, avatar: comment.avatar, level: comment.level },
    copy: comment.body,
    meta: comment.meta,
    likes: comment.likes,
    liked: false,
  }
}

export default defineComponent({
  name: 'OfflineActivityDetailPage',
  components: {
    PawPageNav,
    OfflineActivityBackButton,
    LevelBadge,
    PawAvatarStack,
    PawFixedActionBar,
    OfflineActivityCard,
    CommentComposer,
    CommentItem,
    ReplyComposerSheet,
    ShareActionSheet,
  },
  data(): OfflineActivityDetailPageState {
    return {
      assets: OFFLINE_ACTIVITY_ASSETS,
      activity: null,
      navTotalHeight: 0,
      showScrolledNav: false,
      comments: [],
      replySheetVisible: false,
      replyTarget: null,
      nextCommentId: 1,
      shareActions: [
        {
          key: 'share',
          label: '分享',
          image: OFFLINE_ACTIVITY_ASSETS.share,
          qa: 'qa-offline-activity-share',
        },
      ],
      shareSheetVisible: false,
    }
  },
  computed: {
    isAtTop(): boolean {
      return !this.showScrolledNav
    },
    heroSpacerHeight(): number {
      return Math.max(0, 371 - this.navTotalHeight)
    },
    navBackground(): string {
      return this.isAtTop ? 'transparent' : '#fff'
    },
    replyTargetName(): string {
      return this.replyTarget?.author?.name || ''
    },
    registerAction(): PawFixedAction | null {
      if (!this.activity) return null
      return {
        key: 'register',
        label: this.activity.state === 'ended' ? '活动已结束' : '报名参与',
        disabled: this.activity.state === 'ended',
        tone: this.activity.state === 'ended' ? 'secondary' : 'brand',
        qa: 'qa-offline-activity-register',
      }
    },
    activityShareData(): ShareData {
      if (!this.activity) return {}
      return {
        title: this.activity.detailTitle,
        path: buildRoute('activity.offline.detail', { activityId: this.activity.activityId }),
        imageUrl: this.activity.cover,
      }
    },
    heroBackdropHidden(): boolean {
      return !this.isAtTop
    },
    backSlotStyle(): Record<string, string> {
      return {
        left: '7px',
        right: '0px',
        justifyContent: 'flex-start',
      }
    },
    recommendedActivity() {
      return getOfflineActivitySummaries('ongoing').find(
        (item) => item.activityId !== (this.activity && this.activity.activityId),
      )
    },
  },
  onLoad(options: unknown = {}) {
    try {
      const activityId = readActivityId(options)
      this.activity = getOfflineActivityDetail(activityId) || null
      this.comments = this.activity ? this.activity.comments.map(toCommentRecord) : []
    } catch {
      this.activity = null
      this.comments = []
    }
  },
  onShareAppMessage() {
    if (!this.activity) return { title: '线下活动' }
    this.shareSheetVisible = false
    return {
      title: this.activity.detailTitle,
      path: buildRoute('activity.offline.detail', { activityId: this.activity.activityId }),
      imageUrl: this.activity.cover,
    }
  },
  onShareTimeline() {
    if (!this.activity) return { title: '线下活动' }
    return {
      title: this.activity.detailTitle,
      query: `activityId=${encodeURIComponent(this.activity.activityId)}`,
      imageUrl: this.activity.cover,
    }
  },
  onUnload() {
    const state = navReconcileStates.get(this)
    if (state?.timer) clearTimeout(state.timer)
    navReconcileStates.delete(this)
  },
  methods: {
    onNavLayout(layout: WechatNavLayout) {
      this.navTotalHeight = layout.totalHeight
    },
    onScroll(event: unknown) {
      const scrollTop = readPawEventNumber(event, 'scrollTop')
      this.updateNavForScrollTop(scrollTop)
      this.scheduleNavReconcile()
    },
    onScrollToTop() {
      this.showScrolledNav = false
      this.scheduleNavReconcile()
    },
    updateNavForScrollTop(scrollTop: number) {
      if (scrollTop <= NAV_HIDE_SCROLL_TOP) this.showScrolledNav = false
      else if (scrollTop >= NAV_SHOW_SCROLL_TOP) this.showScrolledNav = true
    },
    scheduleNavReconcile() {
      const state = navReconcileStates.get(this) || { token: 0, timer: null }
      if (state.timer) clearTimeout(state.timer)
      state.token += 1
      navReconcileStates.set(this, state)
      this.sampleNavPosition(state, state.token, null, NAV_RECONCILE_MAX_SAMPLES)
    },
    sampleNavPosition(
      state: NavReconcileState,
      token: number,
      previousTop: number | null,
      remainingSamples: number,
    ) {
      state.timer = setTimeout(() => {
        state.timer = null
        uni
          .createSelectorQuery()
          .in(this)
          .select('#offline-activity-detail-scroll')
          .scrollOffset((offset) => {
            if (navReconcileStates.get(this) !== state || state.token !== token) return
            if (!offset || Array.isArray(offset)) return
            const scrollTop = offset.scrollTop
            if (typeof scrollTop !== 'number') return
            this.updateNavForScrollTop(scrollTop)
            if (
              scrollTop > NAV_HIDE_SCROLL_TOP &&
              remainingSamples > 1 &&
              (previousTop === null || Math.abs(scrollTop - previousTop) > 0.5)
            ) {
              this.sampleNavPosition(state, token, scrollTop, remainingSamples - 1)
            }
          })
          .exec()
      }, NAV_RECONCILE_DELAY_MS)
    },
    goBack() {
      const listUrl = buildRoute('activity.offline.list')
      const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
      const previous = pages.length > 1 ? pages[pages.length - 2] : null
      const previousRoute = previous && (previous.route || previous.$page?.route)
      if (previousRoute === listUrl.slice(1)) {
        uni.navigateBack({
          delta: 1,
          fail: () => uni.redirectTo({ url: listUrl, fail: () => uni.reLaunch({ url: listUrl }) }),
        })
        return
      }
      uni.redirectTo({ url: listUrl, fail: () => uni.reLaunch({ url: listUrl }) })
    },
    openActivity(activityId: string) {
      try {
        uni.navigateTo({
          url: buildRoute('activity.offline.detail', { activityId }),
          animationType: 'slide-in-right',
          animationDuration: 180,
        })
      } catch {
        uni.showToast({ title: '活动暂不可用', icon: 'none' })
      }
    },
    registerForActivity() {
      if (!this.activity || this.activity.state === 'ended') return
      uni.showToast({ title: '报名功能暂未开放', icon: 'none' })
    },
    onFooterAction(action: PawFixedAction) {
      if (action.key === 'share' && this.activity) this.shareSheetVisible = true
    },
    onShareAction(key: ShareActionKey, shareData: ShareData) {
      if (key === 'wechat') return
      if (key === 'moments') {
        uni.showToast({ title: '请从右上角菜单分享到朋友圈', icon: 'none' })
        return
      }
      if (key === 'link') {
        const path = typeof shareData.path === 'string' ? shareData.path : ''
        if (!path) return
        uni.setClipboardData({
          data: path,
          success: () => uni.showToast({ title: '小程序页面路径已复制', icon: 'none' }),
        })
        return
      }
      uni.showToast({
        title: key === 'poster' ? '海报功能暂未开放' : '举报功能暂未开放',
        icon: 'none',
      })
    },
    openReplySheet(comment?: CommentItemRecord) {
      this.replyTarget = comment || null
      this.replySheetVisible = true
    },
    onReplySend(text: string) {
      const target = this.replyTarget
      this.comments.unshift({
        id: `local-comment-${this.nextCommentId++}`,
        author: { name: '我', avatar: this.assets.commentUser },
        copy: text,
        meta: '刚刚',
        likes: 0,
        liked: false,
        ...(target ? { replyTo: { name: target.author?.name || '' } } : {}),
      })
      this.replyTarget = null
      uni.showToast({ title: '留言仅本次浏览可见', icon: 'none' })
    },
    toggleCommentLike(comment: CommentItemRecord) {
      comment.liked = !comment.liked
      comment.likes = Math.max(0, Number(comment.likes || 0) + (comment.liked ? 1 : -1))
    },
    onComposerUnavailable() {
      uni.showToast({ title: '语音和图片留言暂未开放', icon: 'none' })
    },
  },
})
</script>

<style scoped>
.offline-activity-detail-page {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  background: #f5f6f6;
  box-sizing: border-box;
}

.offline-activity-detail-page__hero-backdrop {
  position: absolute;
  z-index: 0;
  top: 0;
  left: 0;
  display: block;
  width: 100%;
  height: 371px;
}

.offline-activity-detail-page__hero-backdrop--hidden {
  opacity: 0;
}

.offline-activity-detail-page__scroll {
  position: relative;
  z-index: 1;
  display: block;
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  height: 0;
}

.offline-activity-detail-page__content {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  background: transparent;
}

.offline-activity-detail-page__hero-image {
  position: absolute;
  z-index: 0;
  left: 0;
  display: block;
  width: 100%;
  height: 371px;
}

.offline-activity-detail-page__hero-flow {
  position: relative;
  flex: 0 0 auto;
  width: 100%;
}

.offline-activity-detail-page__summary {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 0 0 174px;
  flex-direction: column;
  width: 100%;
  height: 174px;
  min-width: 0;
  margin-top: -17px;
  padding: 14px 15px 16px;
  border-radius: 15px 15px 10px 10px;
  background: #fff;
  box-sizing: border-box;
}

.offline-activity-detail-page__summary-title-row {
  display: flex;
  flex: 0 0 22px;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  gap: 8px;
}

.offline-activity-detail-page__summary-title {
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  color: #333;
  font-size: 18px;
  font-weight: 500;
  line-height: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.offline-activity-detail-page__summary-status {
  display: flex;
  flex: 0 0 46px;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 20px;
  border-radius: 2px;
  background: #ff477e;
  color: #fff;
  font-size: 12px;
  line-height: 20px;
}

.offline-activity-detail-page__summary-status--ended {
  background: #aaa;
}

.offline-activity-detail-page__tags {
  display: flex;
  flex: 0 0 18px;
  align-items: center;
  margin-top: 11px;
  gap: 7px;
}

.offline-activity-detail-page__tag {
  display: flex;
  flex: 0 0 52px;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 18px;
  border-radius: 3px;
  background: #f4f4f4;
  color: #666;
  font-size: 11px;
  line-height: 18px;
  white-space: nowrap;
}

.offline-activity-detail-page__meta-row {
  display: flex;
  flex: 0 0 17px;
  align-items: center;
  min-width: 0;
  color: #333;
  font-size: 12px;
  line-height: 17px;
  white-space: nowrap;
}

.offline-activity-detail-page__meta-row--time {
  flex-basis: 16px;
  height: 16px;
  margin-top: 11px;
}

.offline-activity-detail-page__meta-row--location {
  margin-top: 15px;
}

.offline-activity-detail-page__meta-row--members {
  flex-basis: 19px;
  height: 19px;
  margin-top: 15px;
}

.offline-activity-detail-page__meta-icon {
  display: block;
  flex: 0 0 auto;
}

.offline-activity-detail-page__meta-icon--time {
  width: 12px;
  height: 12px;
  margin-right: 6px;
}

.offline-activity-detail-page__meta-icon--location {
  width: 14px;
  height: 14px;
  margin-right: 4px;
}

.offline-activity-detail-page__meta-icon--members {
  width: 15px;
  height: 15px;
  margin-right: 3px;
}

.offline-activity-detail-page__meta-label {
  display: block;
  flex: 0 0 24px;
  width: 24px;
}

.offline-activity-detail-page__meta-value {
  display: block;
  flex: 0 1 auto;
  min-width: 0;
  margin-left: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.offline-activity-detail-page__meta-value--location {
  flex: 1 1 auto;
  margin-left: 12px;
}

.offline-activity-detail-page__navigation-icon {
  display: block;
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
  margin-left: 6px;
}

.offline-activity-detail-page__member-avatars {
  flex: 0 0 auto;
  margin-left: 12px;
}

.offline-activity-detail-page__member-count {
  display: block;
  flex: 0 0 auto;
  margin-left: 6px;
}

.offline-activity-detail-page__section {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  border-radius: 10px;
  background: #fff;
  box-sizing: border-box;
}

.offline-activity-detail-page__description {
  height: 102px;
  margin-top: 8px;
  padding: 14px 15px;
}

.offline-activity-detail-page__section-title {
  display: block;
  flex: 0 0 auto;
  color: #333;
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
}

.offline-activity-detail-page__description-copy {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
  color: #333;
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
}

.offline-activity-detail-page__organizer {
  height: 117px;
  margin-top: 8px;
  padding: 14px 15px;
}

.offline-activity-detail-page__organizer-profile {
  display: flex;
  flex: 0 0 56px;
  align-items: flex-start;
  min-width: 0;
  margin-top: 13px;
  gap: 11px;
}

.offline-activity-detail-page__organizer-avatar {
  display: block;
  flex: 0 0 56px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
}

.offline-activity-detail-page__organizer-info {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  margin-top: -2px;
}

.offline-activity-detail-page__organizer-name-row {
  display: flex;
  flex: 0 0 20px;
  align-items: center;
  gap: 6px;
}

.offline-activity-detail-page__organizer-name {
  display: block;
  color: #333;
  font-size: 15px;
  font-weight: 500;
  line-height: 20px;
}

.offline-activity-detail-page__organizer-events {
  display: block;
  flex: 0 0 16px;
  margin-top: 1px;
  color: #888;
  font-size: 12px;
  line-height: 16px;
}

.offline-activity-detail-page__organizer-type {
  display: flex;
  flex: 0 0 15px;
  align-items: center;
  margin-top: 1px;
  color: #888;
  font-size: 11px;
  line-height: 15px;
  gap: 5px;
}

.offline-activity-detail-page__organizer-type-icon {
  display: block;
  flex: 0 0 13px;
  width: 13px;
  height: 13px;
}

.offline-activity-detail-page__comments {
  min-height: 341px;
  margin-top: 8px;
  padding: 12px 15px 16px;
}

.offline-activity-detail-page__comments > .offline-activity-detail-page__section-title {
  font-size: 14px;
  line-height: 18px;
}

.offline-activity-detail-page__composer {
  margin-top: 27px;
}

.offline-activity-detail-page__comment-list {
  display: flex;
  flex-direction: column;
  margin-top: 22px;
  gap: 18px;
}

.offline-activity-detail-page__comment {
  min-width: 0;
}

.offline-activity-detail-page__recommend-heading {
  display: flex;
  flex: 0 0 16px;
  align-items: center;
  justify-content: center;
  margin: 14px 0 18px;
  color: #333;
  font-size: 13px;
  font-weight: 500;
  line-height: 16px;
  gap: 10px;
}

.offline-activity-detail-page__recommend-mark {
  display: block;
  flex: 0 0 12.1532px;
  width: 12.1532px;
  height: 7.4829px;
}

.offline-activity-detail-page__bottom-space {
  flex: 0 0 110px;
  width: 100%;
  height: 110px;
}

.offline-activity-detail-page__action-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 300;
}

.offline-activity-detail-page__invalid {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 440px;
  padding: 0 24px;
  color: #888;
  font-size: 13px;
  text-align: center;
  gap: 12px;
}

.offline-activity-detail-page__invalid-title {
  color: #333;
  font-size: 16px;
  font-weight: 500;
}

.offline-activity-detail-page__invalid-action {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  margin-top: 8px;
  padding: 0 18px;
  border-radius: 18px;
  background: #ffe60f;
  color: #333;
}
</style>
