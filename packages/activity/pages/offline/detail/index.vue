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
      background="transparent"
      :show-back="false"
      :auto-back="false"
      slot-position="custom"
      :slot-style="backSlotStyle"
      @layout="onNavLayout"
    >
      <template #content>
        <view
          class="offline-activity-detail-page__back-hit"
          data-qa="qa-offline-activity-back"
          aria-label="返回"
          role="button"
          @tap.stop="goBack"
        >
          <image
            class="offline-activity-detail-page__back-icon"
            :src="assets.back"
            mode="aspectFit"
            aria-hidden="true"
          />
        </view>
      </template>
    </PawPageNav>

    <scroll-view
      class="offline-activity-detail-page__scroll"
      scroll-y
      :enable-flex="true"
      :show-scrollbar="false"
      :bounces="false"
      data-qa="qa-offline-activity-detail"
      @scroll="onScroll"
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
              <text class="offline-activity-detail-page__summary-title">{{ activity.detailTitle }}</text>
              <view class="offline-activity-detail-page__summary-status">
                <text>{{ activity.stateLabel }}</text>
              </view>
            </view>
            <view class="offline-activity-detail-page__tags">
              <text
                v-for="tag in activity.tags"
                :key="tag"
                class="offline-activity-detail-page__tag"
              >{{ tag }}</text>
            </view>
            <view class="offline-activity-detail-page__meta-row offline-activity-detail-page__meta-row--time">
              <image
                class="offline-activity-detail-page__meta-icon offline-activity-detail-page__meta-icon--time"
                :src="assets.time"
                mode="aspectFit"
                aria-hidden="true"
              />
              <text class="offline-activity-detail-page__meta-label">时间</text>
              <text class="offline-activity-detail-page__meta-value">{{ activity.startText }}</text>
            </view>
            <view class="offline-activity-detail-page__meta-row offline-activity-detail-page__meta-row--location">
              <image
                class="offline-activity-detail-page__meta-icon offline-activity-detail-page__meta-icon--location"
                :src="assets.location"
                mode="aspectFit"
                aria-hidden="true"
              />
              <text class="offline-activity-detail-page__meta-label">地点</text>
              <text class="offline-activity-detail-page__meta-value offline-activity-detail-page__meta-value--location">
                {{ activity.detailLocation }}
              </text>
              <image
                class="offline-activity-detail-page__navigation-icon"
                :src="assets.navigation"
                mode="aspectFit"
                aria-hidden="true"
              />
            </view>
            <view class="offline-activity-detail-page__meta-row offline-activity-detail-page__meta-row--members">
              <image
                class="offline-activity-detail-page__meta-icon offline-activity-detail-page__meta-icon--members"
                :src="assets.members"
                mode="aspectFit"
                aria-hidden="true"
              />
              <text class="offline-activity-detail-page__meta-label">成员</text>
              <view class="offline-activity-detail-page__member-avatars">
                <image
                  v-for="(avatar, index) in activity.participantAvatars"
                  :key="avatar"
                  class="offline-activity-detail-page__member-avatar"
                  :class="{ 'offline-activity-detail-page__member-avatar--overlap': index > 0 }"
                  :src="avatar"
                  mode="aspectFill"
                />
              </view>
              <text class="offline-activity-detail-page__member-count">{{ activity.participantCount }} 人已报名</text>
            </view>
          </view>

          <view class="offline-activity-detail-page__section offline-activity-detail-page__description">
            <text class="offline-activity-detail-page__section-title">活动详情</text>
            <view class="offline-activity-detail-page__description-copy">
              <text
                v-for="line in activity.description"
                :key="line"
              >{{ line }}</text>
            </view>
          </view>

          <view class="offline-activity-detail-page__section offline-activity-detail-page__organizer">
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
                  <text class="offline-activity-detail-page__organizer-name">{{ activity.organizerName }}</text>
                  <LevelBadge :level="1" />
                </view>
                <text class="offline-activity-detail-page__organizer-events">{{ activity.organizerEvents }}</text>
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

          <view class="offline-activity-detail-page__section offline-activity-detail-page__comments">
            <text class="offline-activity-detail-page__section-title">留言 15</text>
            <view class="offline-activity-detail-page__composer">
              <image
                class="offline-activity-detail-page__composer-user"
                :src="assets.commentUser"
                mode="aspectFill"
              />
              <view class="offline-activity-detail-page__composer-input">
                <text>留下你的想法吧~</text>
                <view class="offline-activity-detail-page__composer-tools">
                  <image
                    class="offline-activity-detail-page__composer-mic"
                    :src="assets.commentMic"
                    mode="aspectFit"
                    aria-hidden="true"
                  />
                  <image
                    class="offline-activity-detail-page__composer-emoji"
                    :src="assets.commentEmoji"
                    mode="aspectFit"
                    aria-hidden="true"
                  />
                </view>
              </view>
            </view>
            <view class="offline-activity-detail-page__comment-list">
              <view
                v-for="comment in activity.comments"
                :key="comment.id"
                class="offline-activity-detail-page__comment"
              >
                <image
                  class="offline-activity-detail-page__comment-avatar"
                  :src="comment.avatar"
                  mode="aspectFill"
                />
                <view class="offline-activity-detail-page__comment-main">
                  <view class="offline-activity-detail-page__comment-author-row">
                    <text class="offline-activity-detail-page__comment-author">{{ comment.author }}</text>
                    <LevelBadge :level="comment.level" />
                  </view>
                  <text class="offline-activity-detail-page__comment-body">{{ comment.body }}</text>
                  <view class="offline-activity-detail-page__comment-meta">
                    <text class="offline-activity-detail-page__comment-time">{{ comment.meta }}</text>
                    <text class="offline-activity-detail-page__comment-reply">回复</text>
                    <view class="offline-activity-detail-page__comment-likes">
                      <image
                        class="offline-activity-detail-page__like-icon"
                        :src="assets.like"
                        mode="aspectFit"
                        aria-hidden="true"
                      />
                      <text>{{ comment.likes }}</text>
                    </view>
                  </view>
                </view>
              </view>
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
          >返回活动列表</view>
        </view>
      </view>
    </scroll-view>

    <view
      v-if="activity"
      class="offline-activity-detail-page__action-bar"
      data-qa="qa-offline-activity-action-bar"
    >
      <button
        class="offline-activity-detail-page__share"
        open-type="share"
        aria-label="分享"
        data-qa="qa-offline-activity-share"
      >
        <image
          class="offline-activity-detail-page__share-icon"
          :src="assets.share"
          mode="aspectFit"
          aria-hidden="true"
        />
        <text>分享</text>
      </button>
      <button
        class="offline-activity-detail-page__register"
        hover-class="offline-activity-detail-page__register--pressed"
        data-qa="qa-offline-activity-register"
        @tap="registerForActivity"
      >报名参与</button>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import LevelBadge from '@/components/customBadge/LevelBadge.vue'
import { buildRoute, isPlainRecord, parseRoute } from '@/navigation/routeContracts.ts'
// #ifdef MP-WEIXIN
import { decodeWeixinLoadOptions } from '@/navigation/weixinLoadOptions.ts'
// #endif
import { goBackSmart } from '@/utils/navBack.ts'
import { readPawEventNumber } from '@/utils/pawEventMetadata.ts'
import type { WechatNavLayout } from '@/utils/navLayout.ts'
import OfflineActivityCard from '../../../components/OfflineActivityCard.vue'
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
  scrollTop: number
}

function readActivityId(options: unknown): string {
  let query: Record<string, unknown>
  // #ifdef MP-WEIXIN
  query = decodeWeixinLoadOptions(options)
  // #endif
  // #ifndef MP-WEIXIN
  query = isPlainRecord(options) ? options : {}
  // #endif
  const activityId = typeof query.activityId === 'string' ? query.activityId : ''
  const target = buildRoute('activity.offline.detail', { activityId })
  return parseRoute(target).params.activityId
}

export default defineComponent({
  name: 'OfflineActivityDetailPage',
  components: { PawPageNav, LevelBadge, OfflineActivityCard },
  data(): OfflineActivityDetailPageState {
    return {
      assets: OFFLINE_ACTIVITY_ASSETS,
      activity: null,
      navTotalHeight: 0,
      scrollTop: 0,
    }
  },
  computed: {
    heroSpacerHeight(): number {
      return Math.max(0, 371 - this.navTotalHeight)
    },
    backSlotStyle(): Record<string, string> {
      return {
        left: '7px',
        right: '0px',
        justifyContent: 'flex-start',
      }
    },
    heroBackdropHidden(): boolean {
      return this.scrollTop > 0
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
    } catch {
      this.activity = null
    }
  },
  onShareAppMessage() {
    if (!this.activity) return { title: '线下活动' }
    return {
      title: this.activity.detailTitle,
      path: buildRoute('activity.offline.detail', { activityId: this.activity.activityId }),
      imageUrl: this.activity.cover,
    }
  },
  methods: {
    onNavLayout(layout: WechatNavLayout) {
      this.navTotalHeight = layout.totalHeight
    },
    onScroll(event: unknown) {
      this.scrollTop = readPawEventNumber(event, 'scrollTop')
    },
    goBack() {
      goBackSmart({ fallbackUrl: buildRoute('activity.offline.list') })
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
      uni.showToast({ title: '报名功能暂未开放', icon: 'none' })
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
  opacity: 1;
}

.offline-activity-detail-page__hero-backdrop--hidden {
  opacity: 0;
}

.offline-activity-detail-page__back-hit {
  display: flex;
  flex: 0 0 42px;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
}

.offline-activity-detail-page__back-icon {
  display: block;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
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
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  margin-left: 12px;
}

.offline-activity-detail-page__member-avatar {
  display: block;
  flex: 0 0 19px;
  width: 19px;
  height: 19px;
  border: 1px solid #fff;
  border-radius: 50%;
  box-sizing: border-box;
}

.offline-activity-detail-page__member-avatar--overlap {
  margin-left: -7px;
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
  display: flex;
  flex: 0 0 34px;
  align-items: center;
  min-width: 0;
  margin-top: 27px;
  gap: 11px;
}

.offline-activity-detail-page__composer-user {
  display: block;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
}

.offline-activity-detail-page__composer-input {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: space-between;
  height: 33px;
  min-width: 0;
  padding: 0 10px 0 15px;
  border-radius: 15px;
  background: #f4f4f5;
  color: #b2b2b2;
  font-size: 13px;
  line-height: 17px;
  box-sizing: border-box;
}

.offline-activity-detail-page__composer-tools {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
}

.offline-activity-detail-page__composer-mic {
  display: block;
  flex: 0 0 13px;
  width: 13px;
  height: 17.15px;
}

.offline-activity-detail-page__composer-emoji {
  display: block;
  flex: 0 0 17px;
  width: 17px;
  height: 17px;
}

.offline-activity-detail-page__comment-list {
  display: flex;
  flex-direction: column;
  margin-top: 22px;
  gap: 18px;
}

.offline-activity-detail-page__comment {
  display: flex;
  flex: 0 0 83px;
  min-width: 0;
  gap: 7px;
}

.offline-activity-detail-page__comment-avatar {
  display: block;
  flex: 0 0 33px;
  width: 33px;
  height: 33px;
  border-radius: 50%;
}

.offline-activity-detail-page__comment-main {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
}

.offline-activity-detail-page__comment-author-row {
  display: flex;
  flex: 0 0 17px;
  align-items: center;
  gap: 6px;
}

.offline-activity-detail-page__comment-author {
  display: block;
  color: #666;
  font-size: 13px;
  line-height: 17px;
}

.offline-activity-detail-page__comment-body {
  display: -webkit-box;
  flex: 0 0 36px;
  margin-top: 4px;
  overflow: hidden;
  color: #333;
  font-size: 13px;
  line-height: 18px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.offline-activity-detail-page__comment-meta {
  display: flex;
  flex: 0 0 17px;
  align-items: center;
  min-width: 0;
  margin-top: 5px;
  color: #8c8c8c;
  font-size: 12px;
  line-height: 17px;
}

.offline-activity-detail-page__comment-time {
  display: block;
  flex: 0 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.offline-activity-detail-page__comment-reply {
  display: block;
  flex: 0 0 auto;
  margin-left: 10px;
  color: #616161;
}

.offline-activity-detail-page__comment-likes {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  margin-left: auto;
  color: #686868;
  font-size: 13px;
  font-weight: 500;
  gap: 5px;
}

.offline-activity-detail-page__like-icon {
  display: block;
  flex: 0 0 13px;
  width: 13px;
  height: 14px;
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
  z-index: 300;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  width: 100%;
  height: 101px;
  padding: 10px 18px 34px 23px;
  border-top: 0.5px solid rgba(0, 0, 0, 0.05);
  background: #fff;
  box-sizing: border-box;
  gap: 16px;
}

/* #ifdef MP-WEIXIN */
.offline-activity-detail-page__action-bar {
  height: calc(67px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
}

/* #endif */

.offline-activity-detail-page__share {
  display: flex;
  flex: 0 0 30px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 47px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #2c2c2c;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
}

.offline-activity-detail-page__share::after,
.offline-activity-detail-page__register::after {
  border: 0;
}

.offline-activity-detail-page__share-icon {
  display: block;
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
  margin-bottom: 3px;
}

.offline-activity-detail-page__register {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 47px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 23.5px;
  background: #ffe60f;
  color: #333;
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  white-space: nowrap;
}

.offline-activity-detail-page__register--pressed {
  opacity: 0.7;
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
