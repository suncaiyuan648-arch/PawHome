<template>
  <view
    class="container"
    :class="{ 'state-scrolled': pageState === 'dynamic-scrolled' || hideTopActions }"
    @wheel.capture="onFeedWheel"
    @pointerdown.capture="onFeedPointerStart"
    @pointermove.capture="onFeedPointerMove"
    @pointerup.capture="onFeedPointerEnd"
    @pointercancel.capture="onFeedPointerEnd"
  >
    <!-- #ifndef MP-WEIXIN -->
    <image
      class="h5-status-bar"
      :src="
        activeFeedTab === 'yard'
          ? '/static/figma/home-header-yard-exact.png'
          : '/static/figma/home-header-exact.png'
      "
      mode="scaleToFill"
    ></image>
    <!-- #endif -->
    <view class="container1">
      <image
        class="container1-bg"
        src="/static/homebg1.png"
      ></image>
      <view class="title">
        <view class="title-content">
          <view
            class="city"
            @click="goCitySelect"
          >
            <text>{{ selectedCity }}</text>
            <image
              class="city-icon"
              src="/static/jiao.png"
            ></image>
          </view>
          <text
            class="title-txt"
            :class="{ 'title-txt--yard': activeFeedTab === 'yard' }"
            >首页</text
          >
          <text
            v-if="activeFeedTab === 'yard'"
            class="service-title"
            >宠物服务</text
          >
        </view>
      </view>
    </view>
    <view
      class="container2"
      :class="{ hidden: hideTopActions }"
    >
      <image
        class="container2-bg"
        src="/static/homebg2.png"
      ></image>
      <view class="box2">
        <view class="search">
          <PawSearchBar
            class="home-search-bar"
            :readonly="true"
            :placeholder="activeFeedTab === 'yard' ? '蓝金渐层' : '小院号'"
            @tap="openSearchPage"
            @search="openSearchPage"
          />
          <view
            class="search-btn"
            @click="openLeaderboard"
            ><text>排行榜</text></view
          >
        </view>
        <view class="home-announcement">
          <PawAnnouncementMarquee
            ref="homeAnnouncement"
            :items="announcementItems"
            :speed="82"
            :gap="1000"
            :poll-url="announcementPollUrl"
            :ws-url="announcementWsUrl"
          />
        </view>
      </view>
      <view
        id="qa-home-service-shortcuts"
        class="home-service-shortcuts"
      >
        <view
          v-for="shortcut in homeServiceShortcuts"
          :id="'qa-home-service-' + shortcut.key"
          :key="shortcut.key"
          class="home-service-shortcut"
          :aria-label="shortcut.label"
        >
          <view class="home-service-shortcut-icon-stage">
            <PawIcon
              :name="shortcut.icon"
              :size="serviceShortcutIconSize(shortcut.sourceSize)"
              class="home-service-shortcut-icon"
            />
          </view>
          <text
            :id="'qa-home-service-label-' + shortcut.key"
            class="home-service-shortcut-label"
          >{{ shortcut.label }}</text>
        </view>
      </view>
      <view
        id="qa-home-promo-entries"
        class="home-promo-grid"
      >
        <view
          id="qa-home-promo-rescue"
          class="home-promo-card home-promo-card--rescue"
          aria-label="救助池"
        >
          <image
            class="home-rescue-title-graphic"
            src="/static/figma/home/rescue-pool-title.svg"
            mode="aspectFit"
            aria-label="救助池"
          />
          <view class="home-rescue-preview">
            <text class="home-rescue-vote">投出你今天的宝贵一票</text>
            <image
              class="home-rescue-thumb"
              src="/static/figma/home/rescue-pool-thumb.png"
              mode="aspectFill"
            />
            <text class="home-rescue-desc">小猫腿上受伤了无法走路...</text>
            <text class="home-rescue-followers">121人关注</text>
          </view>
        </view>
        <view
          id="qa-home-promo-adoption-gift"
          class="home-promo-card home-promo-card--adoption"
          aria-label="领养有礼"
        >
          <image
            class="home-promo-title-graphic"
            src="/static/figma/home/adoption-gift-title.svg"
            mode="aspectFit"
            aria-label="领养有礼"
          />
          <text class="home-promo-caption">鼓励真实领养</text>
          <image
            class="home-promo-thumb"
            src="/static/figma/home/adoption-gift-thumb.png"
            mode="aspectFill"
          />
        </view>
        <view
          id="qa-home-promo-offline-activity"
          class="home-promo-card home-promo-card--activity"
          aria-label="线下活动"
        >
          <image
            class="home-promo-title-graphic"
            src="/static/figma/home/offline-activity-title.svg"
            mode="aspectFit"
            aria-label="线下活动"
          />
          <text class="home-promo-caption home-promo-caption--activity">真实线下领养</text>
          <image
            class="home-promo-thumb"
            src="/static/figma/home/offline-activity-thumb.png"
            mode="aspectFill"
          />
        </view>
      </view>
    </view>
    <view
      class="tab"
      :class="{ 'tab-scrolled': hideTopActions }"
    >
      <view class="tab-left">
        <view
          v-for="tab in feedTabs"
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeFeedTab === tab.key }"
          @click="changeFeedTab(tab.key)"
          >{{ tab.label }}
        </view>
      </view>
      <PawPopoverMenu
        v-model="showSortDropdown"
        :items="sortOptions"
        :active-key="selectedSort"
        @select="selectSort"
      >
        <template #trigger>
          <view class="tab-right">
            <text class="tab-right-text">{{ selectedSort }}</text>
            <image
              class="tab-right-icon"
              src="/static/jiantou.png"
            ></image>
          </view>
        </template>
      </PawPopoverMenu>
    </view>
    <!-- 列表区用 flex 占满剩余高度；去掉 enhanced，避免微信小程序触摸/图层异常 -->
    <scroll-view
      class="feed-scroll"
      scroll-y="true"
      :enable-flex="true"
      :bounces="false"
      :refresher-enabled="true"
      refresher-default-style="none"
      refresher-background="transparent"
      :refresher-triggered="refresherTriggered"
      scroll-with-animation
      :scroll-into-view="scrollIntoViewId"
      :upper-threshold="4"
      :lower-threshold="80"
      :show-scrollbar="false"
      @scroll="handleFeedScroll"
      @scrolltoupper="onFeedScrollToUpper"
      @touchstart.capture="onFeedTouchStart"
      @touchmove.capture="onFeedTouchMove"
      @touchend.capture="onFeedTouchEnd"
      @touchcancel.capture="onFeedTouchEnd"
      @refresherpulling="onRefresherPulling"
      @refresherrefresh="onPullRefresh"
      @scrolltolower="onReachBottom"
    >
      <view class="feed-scroll-inner">
        <view id="feed-top-anchor"></view>
        <view
          v-if="showRefreshIndicator"
          class="refresh-indicator"
        >
          <view class="spinner"></view>
          <text class="refresh-text">{{ isRefreshing ? '正在刷新...' : '松开刷新' }}</text>
        </view>
        <view
          v-if="isDynamicEmpty"
          class="home-empty"
        >
          <image
            class="home-empty-art"
            src="/static/figma/home/empty-dynamic.png"
            mode="aspectFit"
          ></image>
          <text class="home-empty-title">还没有动态</text>
          <text class="home-empty-subtitle">这个城市好像还没有人发布</text>
        </view>
        <view
          v-else-if="activeFeedTab === 'yard'"
          class="home-yard-list"
        >
          <YardSummaryCard
            v-for="yard in yardCards"
            :key="yard.id"
            class="home-yard-card"
            :yard="yardModel(yard)"
            variant="list"
            @click="goYardDetail"
          />
        </view>
        <view
          v-else
          class="paw-list"
          :class="{ 'tab-switching': isTabSwitching }"
        >
          <view
            v-for="(column, columnIndex) in feedColumns"
            :key="'feed-column-' + columnIndex"
            class="paw-column"
          >
            <FeedCard
              v-for="entry in column"
              :key="'fc-' + entry.index"
              :item="entry.item"
              @click="goDetail"
              @user-click="openAuthorProfile"
              @like="toggleFeedCardLike(entry.index)"
            />
          </view>
        </view>
        <view
          v-if="!isDynamicEmpty && activeFeedTab !== 'yard' && (isLoadingMore || !hasMore)"
          id="qa-home-load-more"
          class="load-more-indicator"
        >
          <view
            v-if="isLoadingMore"
            class="load-more-loading"
          >
            <view
              id="qa-home-load-more-spinner"
              class="spinner"
            ></view>
            <text class="load-more-text">加载中...</text>
          </view>
          <text
            v-else
            class="load-more-text"
            >已经到底了</text
          >
        </view>
      </view>
    </scroll-view>
    <view
      v-if="showBackTopBtn"
      class="back-top-btn"
      @click="backToTop"
    >
      <view class="back-top-arrow"></view>
      <text class="back-top-text">TOP</text>
    </view>
    <CustomTabber :tab-index="0" />
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import CustomTabber from '@/components/CustomTabber/index.vue'
import PawAnnouncementMarquee from '@/components/PawAnnouncementMarquee.vue'
import PawPopoverMenu from '@/components/navigation/PawPopoverMenu.vue'
import PawSearchBar from '@/components/navigation/PawSearchBar.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import type { PawIconName } from '@/components/PawIcon/PawIcon.types.ts'
import FeedCard from '@/components/dynamic/FeedCard.vue'
import YardSummaryCard from '@/components/yard/YardSummaryCard.vue'
import { readPawEventNumber } from '@/utils/pawEventMetadata.ts'
import { openUserProfile } from '@/utils/profileNav.ts'
import { getPawHomeYardMock } from '@/utils/yardMock.ts'
import type { YardMock } from '@/utils/yardMock.ts'
import {
  createHomeAnnouncementMocks,
  createHomeFeedMockCards,
  createHomeFeedTabMocks,
  createHomeYardCardMocks,
  type HomeAnnouncementMockMetadata,
  type HomeFeedCardMetadata,
  type HomeFeedTabKey,
  type HomeFeedTabMetadata,
  type HomeYardCardMetadata,
} from '@/utils/homeFeedMockData.ts'

const FEED_PAGE_SIZE = 10
const FEED_MOCK_TOTAL = 50
const HOME_SERVICE_SHORTCUTS: HomeServiceShortcut[] = [
  { key: 'litter-cleanup', label: '上门铲屎', icon: 'actions/home-litter-cleanup', sourceSize: 50 },
  { key: 'dog-walking', label: '上门遛狗', icon: 'actions/home-dog-walking', sourceSize: 50 },
  {
    key: 'temporary-foster',
    label: '临时寄养',
    icon: 'actions/home-temporary-foster',
    sourceSize: 50,
  },
  { key: 'grooming', label: '上门洗护', icon: 'actions/home-grooming', sourceSize: 53 },
  { key: 'pet-transport', label: '宠物托运', icon: 'actions/home-pet-transport', sourceSize: 50 },
]

interface HomeServiceShortcut {
  key: string
  label: string
  icon: PawIconName
  sourceSize: number
}

function resolveHomeServiceIconMaxSize(windowWidth: unknown): number {
  const width = Number(windowWidth)
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 375
  const entryWidth = (safeWidth - 26) / 5
  return Math.min(53, Math.max(16, Math.floor(entryWidth - 2)))
}

function readHomeServiceIconMaxSize(): number {
  try {
    return resolveHomeServiceIconMaxSize(uni.getSystemInfoSync().windowWidth)
  } catch {
    return resolveHomeServiceIconMaxSize(375)
  }
}

interface HomePageData {
  pageState: string
  zan1: string
  zan2: string
  selectedCity: string
  homeServiceShortcuts: HomeServiceShortcut[]
  homeServiceIconMaxSize: number
  announcementItems: HomeAnnouncementMockMetadata[]
  announcementPollUrl: string
  announcementWsUrl: string
  sortOptions: string[]
  selectedSort: string
  showSortDropdown: boolean
  feedTabs: HomeFeedTabMetadata[]
  activeFeedTab: HomeFeedTabKey
  isTabSwitching: boolean
  hideTopActions: boolean
  lastFeedScrollTop: number
  feedTouchLastY: number
  isFeedTouching: boolean
  feedPointerLastY: number
  isFeedPointerActive: boolean
  pendingTopActionsHidden: boolean | null
  topActionsIntentTimer: ReturnType<typeof setTimeout> | null
  suppressScrollIntentUntil: number
  refresherTriggered: boolean
  isRefreshing: boolean
  pullingDistance: number
  isLoadingMore: boolean
  refreshRequestTimer: ReturnType<typeof setTimeout> | null
  loadMoreRequestTimer: ReturnType<typeof setTimeout> | null
  hasMore: boolean
  feedPageSize: number
  mockFeedCards: HomeFeedCardMetadata[]
  noMoreHintVisible: boolean
  noMoreHintTimer: ReturnType<typeof setTimeout> | null
  showBackTopBtn: boolean
  scrollIntoViewId: string
  yardCards: HomeYardCardMetadata[]
  feedCards: HomeFeedCardMetadata[]
  searchAnimating?: boolean
  showSearchOverlay?: boolean
  searchOverlayExpanded?: boolean
}

export default defineComponent({
  components: {
    CustomTabber,
    PawAnnouncementMarquee,
    PawPopoverMenu,
    PawSearchBar,
    PawIcon,
    FeedCard,
    YardSummaryCard,
  },
  onShow() {
    this.searchAnimating = false
    this.showSearchOverlay = false
    this.searchOverlayExpanded = false
    const city = uni.getStorageSync('selectedCity')
    if (typeof city === 'string' && city) this.selectedCity = city
    this.homeServiceIconMaxSize = readHomeServiceIconMaxSize()
    // #ifdef MP-WEIXIN
    this.$nextTick(() => {
      const cur = getCurrentPages().slice(-1)[0]
      if (cur && typeof cur.getTabBar === 'function') {
        const tb = cur.getTabBar()
        if (tb && typeof tb.setData === 'function') tb.setData({ selected: 0 })
      }
    })
    // #endif
  },
  data(): HomePageData {
    const mockFeedCards = createHomeFeedMockCards(FEED_MOCK_TOTAL)
    const initialFeedCards = mockFeedCards.slice(0, FEED_PAGE_SIZE)
    return {
      pageState: 'dynamic',
      zan1: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAeCAYAAAA/xX6fAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAAF+SURBVEiJvZdbtoMgDEVPWJ3XpUOqDqA6gMiQpBMz/bjElVK10JaeL1FwmwcJEioVQvAicgXgAUBERudcvFwusWQ91cCYeSCi6+aLiM4lUFcDNLBIRGcRGQFEAEhWv9SpFMbMg153XXdWcHKxR3LxKxVbSER/wH/M7P3S2FUDkSxwzj0AQgj+60DrztyiZVkU+HD/I6AmS+5OKxG5fQVorev7fsifa2xLdQgMIfgC6zzwHNtqIDMPIjKnYdyyziZMabaedOGyLN64x5s50ey7B6U1AIBpmuatORpb/eBT2rizLswmj1uWqbL4+Z05HgCYGX3fD2TqY0wTRqDcRTapDj5szQOapkl0cGTNJ7JGrUlTmmXvyLzbV3WLd2Wr0U+ApvDffgKEKQ7NgXnhbw7MS2NToC19uuWaArd6ZVOgcefaK5sB9/poM+BeH3UoPIvU6OiUsJ5LRWRm5vGTmmp/AdL46ZRAAKAd45va6z4OALquo6MTWYUi0m/AXqu7A58a2QJRlyArAAAAAElFTkSuQmCC',
      zan2: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAcCAYAAAB/E6/TAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAAE4SURBVEiJvZYxVoNAFEXvo05va+EyACcLcQG6iZBduAnX4IRhAR4b25xjZW/NtwiJRCFMQuBVw5n5//Lf8IcRZ8jS1CGtAAeAtFZZFjGxiobkeYHZqmPKK4TlUHwSC+qESG+AszR1VwFZnhc98EUD7Kr0fNAJ3cUujAN1782vpM1oUK9tO22H4qNBmN2fmL0FoK79KFBTjRtKoqq6HHSib/5qEAKthrU0dSSJa6xyEbFbdtb53o+hrv2+WgFYlr1GJm+9or4wu4lYt1ZZFjpYFBt4iaS1LMtskuTH8mNPhli5uUCTV/QOgLSZZY8UguawzsP438Swmmae3DqFIJi+os/9YGrQ4QycFKQQHuYAPbcfEuDjSom/W2OvEB6PQWZPVwItWpB/F8pEVeUxWwIvI0Ees2XfrfUHCTFt74bNhAQAAAAASUVORK5CYII=',
      selectedCity: '广州市',
      homeServiceShortcuts: HOME_SERVICE_SHORTCUTS,
      homeServiceIconMaxSize: readHomeServiceIconMaxSize(),
      announcementItems: createHomeAnnouncementMocks(),
      // 接入后端时填写轮询接口或 WebSocket 地址；为空时只播放本地初始公告。
      announcementPollUrl: '',
      announcementWsUrl: '',
      sortOptions: ['最近更新', '离我最近', '只看猫咪', '只看狗狗'],
      selectedSort: '最近更新',
      showSortDropdown: false,
      feedTabs: createHomeFeedTabMocks(),
      activeFeedTab: 'dynamic',
      isTabSwitching: false,
      hideTopActions: false,
      lastFeedScrollTop: 0,
      feedTouchLastY: 0,
      isFeedTouching: false,
      feedPointerLastY: 0,
      isFeedPointerActive: false,
      pendingTopActionsHidden: null,
      topActionsIntentTimer: null,
      suppressScrollIntentUntil: 0,
      refresherTriggered: false,
      isRefreshing: false,
      pullingDistance: 0,
      isLoadingMore: false,
      refreshRequestTimer: null,
      loadMoreRequestTimer: null,
      hasMore: initialFeedCards.length < mockFeedCards.length,
      feedPageSize: FEED_PAGE_SIZE,
      mockFeedCards,
      noMoreHintVisible: false,
      noMoreHintTimer: null,
      showBackTopBtn: false,
      scrollIntoViewId: '',
      yardCards: createHomeYardCardMocks(),
      feedCards: initialFeedCards,
    }
  },
  computed: {
    feedColumns(): Array<Array<{ item: HomeFeedCardMetadata; index: number }>> {
      return [0, 1].map((columnIndex) =>
        this.feedCards
          .map((item, index) => ({ item, index }))
          .filter((entry) => entry.index % 2 === columnIndex),
      )
    },
    isDynamicEmpty() {
      return this.pageState === 'dynamic-empty'
    },
    showRefreshIndicator() {
      return this.isRefreshing || this.pullingDistance > 20
    },
  },
  onLoad(options: Record<string, unknown> = {}) {
    const state = typeof options.state === 'string' ? options.state : 'dynamic'
    this.pageState = state
    if (state === 'filter-sheet') this.showSortDropdown = true
    if (state === 'yard-tab') {
      this.activeFeedTab = 'yard'
      this.selectedSort = '离我最近'
    }
    if (state === 'dynamic-scrolled') {
      this.hideTopActions = true
      this.showBackTopBtn = true
    }
  },
  beforeUnmount() {
    if (this.noMoreHintTimer) clearTimeout(this.noMoreHintTimer)
    if (this.topActionsIntentTimer) clearTimeout(this.topActionsIntentTimer)
    if (this.refreshRequestTimer) clearTimeout(this.refreshRequestTimer)
    if (this.loadMoreRequestTimer) clearTimeout(this.loadMoreRequestTimer)
  },
  methods: {
    serviceShortcutIconSize(sourceSize: number): number {
      return Math.min(sourceSize, this.homeServiceIconMaxSize)
    },
    openSearchPage() {
      uni.navigateTo({
        url: '/packages/discovery/pages/search/index',
        animationType: 'slide-in-right',
        animationDuration: 120,
      })
    },
    openLeaderboard() {
      uni.navigateTo({
        url: '/packages/discovery/pages/ranking/index',
        animationType: 'slide-in-right',
        animationDuration: 120,
      })
    },
    toggleSortDropdown() {
      this.showSortDropdown = !this.showSortDropdown
    },
    selectSort(sort: string | number) {
      if (typeof sort !== 'string') return
      this.selectedSort = sort
      this.showSortDropdown = false
    },
    yardModel(yard: HomeYardCardMetadata): YardMock {
      const base = getPawHomeYardMock()
      return {
        ...base,
        id: String(yard.id),
        distance: `${base.distance} ${base.district}`,
        location: yard.variant === 'org' ? '合肥市希望流浪动物基地' : '',
        tags: yard.variant === 'badges' ? base.tags : [],
      }
    },
    changeFeedTab(tabKey: HomeFeedTabKey) {
      if (this.activeFeedTab === tabKey) return
      this.activeFeedTab = tabKey
      this.isTabSwitching = true
      setTimeout(() => {
        this.isTabSwitching = false
      }, 220)
    },
    closeDropdowns() {
      this.showSortDropdown = false
    },
    toggleFeedCardLike(idx: number) {
      const item = this.feedCards[idx]
      if (!item) return
      if (item.liked) {
        item.liked = false
        item.likes = Math.max(0, item.likes - 1)
      } else {
        item.liked = true
        item.likes += 1
      }
    },
    goCitySelect() {
      uni.navigateTo({
        url: `/packages/discovery/pages/city-picker/index?current=${encodeURIComponent(this.selectedCity)}`,
      })
    },
    handleFeedScroll(e: PawEvent) {
      const scrollTop = readPawEventNumber(e, 'scrollTop')
      const scrollDelta = scrollTop - this.lastFeedScrollTop

      // 无触摸设备用实际滚动方向兜底；头部动画引发的滚动重算在保护期内忽略。
      if (
        !this.isFeedTouching &&
        Date.now() >= this.suppressScrollIntentUntil &&
        Math.abs(scrollDelta) >= 1
      ) {
        this.queueTopActionsIntent(scrollDelta > 0)
      }

      this.showBackTopBtn = this.hideTopActions && scrollTop > 120
      this.lastFeedScrollTop = scrollTop
    },
    getFeedTouchY(e: PawEvent) {
      const touch = (e?.touches && e.touches[0]) || (e?.changedTouches && e.changedTouches[0])
      if (!touch) return 0
      return Number(touch.clientY !== undefined ? touch.clientY : touch.pageY) || 0
    },
    onFeedTouchStart(e: PawEvent) {
      this.isFeedTouching = true
      this.feedTouchLastY = this.getFeedTouchY(e)
    },
    onFeedTouchMove(e: PawEvent) {
      const currentY = this.getFeedTouchY(e)
      const deltaY = currentY - this.feedTouchLastY
      // 手指上滑代表内容向上移动并收起；手指下滑代表展开。
      if (deltaY > 2) this.queueTopActionsIntent(false)
      if (deltaY < -2) this.queueTopActionsIntent(true)
      this.feedTouchLastY = currentY
    },
    onFeedTouchEnd() {
      this.isFeedTouching = false
      // 手势结束立即落地最后一个方向，避免快速滑动后停留在旧状态。
      this.flushTopActionsIntent()
    },
    onFeedWheel(e: PawEvent) {
      const deltaY = Number(e?.deltaY || readPawEventNumber(e, 'deltaY') || 0)
      if (deltaY > 0) this.queueTopActionsIntent(true)
      if (deltaY < 0) this.queueTopActionsIntent(false)
    },
    onFeedPointerStart(e: PawEvent) {
      this.isFeedPointerActive = true
      this.feedPointerLastY = Number(e?.clientY || e?.pageY || 0)
    },
    onFeedPointerMove(e: PawEvent) {
      if (!this.isFeedPointerActive) return
      const currentY = Number(e?.clientY || e?.pageY || 0)
      const deltaY = currentY - this.feedPointerLastY
      if (deltaY > 2) this.queueTopActionsIntent(false)
      if (deltaY < -2) this.queueTopActionsIntent(true)
      this.feedPointerLastY = currentY
    },
    onFeedPointerEnd() {
      if (!this.isFeedPointerActive) return
      this.isFeedPointerActive = false
      this.flushTopActionsIntent()
    },
    queueTopActionsIntent(shouldHide: boolean) {
      // 同方向连续事件不反复延后；方向反转时重置 72ms 防抖，最后动作获胜。
      if (this.pendingTopActionsHidden === shouldHide && this.topActionsIntentTimer) return
      if (this.topActionsIntentTimer) clearTimeout(this.topActionsIntentTimer)
      this.topActionsIntentTimer = null
      this.pendingTopActionsHidden = shouldHide

      // 最后动作与当前状态一致时，只需取消尚未执行的相反动作。
      if (this.hideTopActions === shouldHide) {
        this.pendingTopActionsHidden = null
        return
      }

      this.topActionsIntentTimer = setTimeout(() => this.flushTopActionsIntent(), 72)
    },
    flushTopActionsIntent() {
      if (this.topActionsIntentTimer) clearTimeout(this.topActionsIntentTimer)
      this.topActionsIntentTimer = null
      if (this.pendingTopActionsHidden === null) return
      const shouldHide = this.pendingTopActionsHidden
      this.pendingTopActionsHidden = null
      this.setTopActionsState(shouldHide)
    },
    setTopActionsState(shouldHide: boolean) {
      if (this.hideTopActions === shouldHide) return
      this.hideTopActions = shouldHide
      this.suppressScrollIntentUntil = Date.now() + 320
      this.showBackTopBtn = shouldHide && this.lastFeedScrollTop > 120
      if (this.pageState === 'dynamic-scrolled') this.pageState = 'dynamic'
    },
    onFeedScrollToUpper() {
      if (this.pendingTopActionsHidden === false) this.flushTopActionsIntent()
    },
    backToTop() {
      this.scrollIntoViewId = 'feed-top-anchor'
      if (this.topActionsIntentTimer) clearTimeout(this.topActionsIntentTimer)
      this.topActionsIntentTimer = null
      this.pendingTopActionsHidden = null
      this.setTopActionsState(false)
      this.showBackTopBtn = false
      this.lastFeedScrollTop = 0
      setTimeout(() => {
        this.scrollIntoViewId = ''
      }, 300)
    },
    onRefresherPulling(e: PawEvent) {
      this.pullingDistance = readPawEventNumber(e, 'dy')
      if (this.pullingDistance > 2) this.queueTopActionsIntent(false)
    },
    onPullRefresh() {
      if (this.isRefreshing) return
      if (this.loadMoreRequestTimer) clearTimeout(this.loadMoreRequestTimer)
      this.loadMoreRequestTimer = null
      this.isLoadingMore = false
      this.hasMore = true
      this.refresherTriggered = true
      this.isRefreshing = true
      this.pullingDistance = 0

      this.refreshRequestTimer = setTimeout(() => {
        this.feedCards = this.mockFeedCards.slice(0, this.feedPageSize)
        this.hasMore = this.feedCards.length < this.mockFeedCards.length
        this.isRefreshing = false
        this.refresherTriggered = false
        this.refreshRequestTimer = null
      }, 900)
    },
    onReachBottom() {
      if (this.isRefreshing) return
      if (this.isLoadingMore) return
      if (!this.hasMore) return
      this.isLoadingMore = true

      this.loadMoreRequestTimer = setTimeout(() => {
        const nextCount = Math.min(
          this.feedCards.length + this.feedPageSize,
          this.mockFeedCards.length,
        )
        this.feedCards = this.mockFeedCards.slice(0, nextCount)
        this.hasMore = nextCount < this.mockFeedCards.length
        this.isLoadingMore = false
        this.loadMoreRequestTimer = null
      }, 900)
    },
    showNoMoreHint() {
      this.noMoreHintVisible = true
      if (this.noMoreHintTimer) clearTimeout(this.noMoreHintTimer)
      this.noMoreHintTimer = setTimeout(() => {
        this.noMoreHintVisible = false
      }, 700)
    },
    goDetail(item: HomeFeedCardMetadata) {
      const dynamicId = item.id ? String(item.id) : 'mock-feed-1'
      uni.navigateTo({
        url: `/packages/dynamic/pages/detail/index?yardId=1&dynamicId=${encodeURIComponent(dynamicId)}`,
      })
    },
    goYardDetail() {
      uni.navigateTo({ url: '/packages/yard/pages/detail/index?yardId=1' })
    },
    openAuthorProfile() {
      openUserProfile({
        pawId: '100001',
        nickname: '朝阳小区猫猫队',
        avatar: '/static/user.png',
      })
    },
  },
})
</script>

<style lang="less" scoped>
.container {
  background: #fff;
  height: 100vh;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  font-family: var(
    --paw-font-family,
    -apple-system,
    BlinkMacSystemFont,
    'PingFang SC',
    'Microsoft YaHei',
    sans-serif
  );

  .h5-status-bar {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 90px;
    z-index: 1200;
    pointer-events: none;
  }

  .container1 {
    flex-shrink: 0;
    width: 100%;
    height: 83px;
    position: relative;
    overflow: visible;

    .container1-bg {
      width: 100%;
      height: 83px;
      position: absolute;
      left: 0;
      top: 0;
      z-index: 1;
    }
  }

  .title {
    width: 100%;
    height: 54px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    box-sizing: border-box;
    padding: 0;
    position: absolute;
    left: 0;
    top: 36px;
    z-index: 60;
    overflow: visible;

    .title-content {
      width: 100%;
      height: 54px;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    }

    .city {
      max-width: 120px;
      position: absolute;
      left: 8px;
      z-index: 80;
      display: flex;
      align-items: flex-end;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0px;
      line-height: 15px;
      color: rgba(40, 40, 39, 1);
      vertical-align: top;

      .city-icon {
        margin-left: 3px;
        width: 6px;
        height: 6px;
        flex-shrink: 0;
      }
    }

    .title-txt {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0px;
      line-height: 20px;
      color: rgba(40, 40, 39, 1);
      text-align: center;
      vertical-align: top;
    }

    .title-txt--yard {
      position: absolute;
      left: 205px;
    }

    .service-title {
      position: absolute;
      left: 122px;
      font-size: 15px;
      font-weight: 400;
      line-height: 20px;
      color: #7e7469;
    }
  }

  .container2 {
    flex-shrink: 0;
    width: 100%;
    height: 269px;
    position: relative;
    overflow: hidden;
    isolation: isolate;
    transition: height 0.28s cubic-bezier(0.22, 0.61, 0.36, 1);
    will-change: height;

    .container2-bg {
      width: 100%;
      height: 80px;
      position: absolute;
      left: 0;
      top: 0;
      z-index: 1;
      opacity: 1;
      pointer-events: none;
      transition: opacity 0.28s cubic-bezier(0.22, 0.61, 0.36, 1);
    }

    .box2 {
      width: 100%;
      height: 70px;
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      padding-top: 8px;
    }
  }

  .container2.hidden {
    height: 20px;
    overflow: hidden;
  }

  .container2.hidden .box2 {
    height: 70px;
  }

  &.state-scrolled .container1,
  &.state-scrolled .container1-bg {
    height: 83px;
  }

  &.state-scrolled .title {
    height: 54px;
  }

  &.state-scrolled .back-top-btn {
    bottom: 131px;
  }

  &.state-scrolled .container2-bg {
    opacity: 0;
  }

  &.state-scrolled .feed-scroll {
    border-top: 0;
  }

  &.state-scrolled .feed-scroll-inner {
    padding-top: 0;
  }

  .search {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    height: 33px;
    flex-shrink: 0;
    margin: 0;
    padding: 0 13px 0 16px;
    box-sizing: border-box;
    opacity: 1;
    transform: translateY(0);
    transform-origin: 50% 0;
    transition:
      transform 0.28s cubic-bezier(0.22, 0.61, 0.36, 1),
      opacity 0.18s ease;
    will-change: transform, opacity;

    .home-search-bar {
      flex: 1;
      min-width: 0;
    }

    .search-btn {
      width: 52px;
      height: 30px;
      margin-left: 14px;
      border-radius: 5px;
      background: rgba(255, 230, 13, 1);
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0px;
      line-height: 18.82px;
      color: rgba(51, 51, 51, 1);
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .home-announcement {
    position: relative;
    z-index: 4;
    display: block;
    width: 100%;
    height: 20px;
    flex-shrink: 0;
    margin-top: 9px;
    box-sizing: border-box;
    transform: translateY(0);
    transition: transform 0.28s cubic-bezier(0.22, 0.61, 0.36, 1);
    will-change: transform;
  }

  .home-service-shortcuts {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    width: 100%;
    height: 69px;
    margin: 0;
    padding: 0 13px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .home-service-shortcut {
    display: flex;
    flex: 0 1 50px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 0;
    width: 50px;
    max-width: 20%;
    height: 69px;
    overflow: visible;
  }

  .home-service-shortcut-icon-stage {
    display: flex;
    flex-shrink: 0;
    align-items: flex-end;
    justify-content: center;
    width: 100%;
    height: 53px;
  }

  .home-service-shortcut-icon {
    flex-shrink: 0;
  }

  .home-service-shortcut-label {
    display: block;
    flex-shrink: 0;
    width: 100%;
    margin-top: 0;
    overflow: hidden;
    font-size: 12px;
    font-weight: 400;
    line-height: 16px;
    color: #333;
    text-align: center;
    white-space: nowrap;
  }

  .home-promo-grid {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1.79fr) repeat(2, minmax(0, 1fr));
    gap: 8px;
    height: 111px;
    min-width: 0;
    margin: 19px 7px 0;
    box-sizing: border-box;
  }

  .home-promo-card {
    position: relative;
    height: 111px;
    min-width: 0;
    border-radius: 10px;
    box-sizing: border-box;
  }

  .home-promo-card--rescue {
    background: linear-gradient(90deg, #ff2651 0%, #fe6583 100%);
  }

  .home-promo-card--adoption {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 11px 0 8px;
    background: linear-gradient(90deg, #f9f95b 0%, #f9f9c9 100%);
  }

  .home-promo-card--activity {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 11px 0 8px;
    background: linear-gradient(90deg, #40b9f8 0%, #aedaf1 100%);
  }

  .home-rescue-title-graphic {
    position: absolute;
    z-index: 2;
    top: -9px;
    left: 11px;
    display: block;
    width: 58px;
    height: 22px;
    pointer-events: none;
  }

  .home-promo-title-graphic {
    display: block;
    flex: 0 0 15px;
    width: 63px;
    height: 15px;
  }

  .home-rescue-preview {
    position: absolute;
    top: 19px;
    right: 7px;
    left: 7px;
    height: 85px;
    border-radius: 10px;
    background: #fff;
    overflow: hidden;
  }

  .home-rescue-vote,
  .home-rescue-desc,
  .home-rescue-followers,
  .home-promo-caption {
    display: block;
    box-sizing: border-box;
  }

  .home-rescue-vote {
    position: absolute;
    top: 2px;
    left: 7px;
    width: 120px;
    overflow: hidden;
    font-size: 12px;
    font-weight: 500;
    line-height: 17px;
    color: #333;
    white-space: nowrap;
  }

  .home-rescue-thumb {
    position: absolute;
    top: 28px;
    left: 5px;
    width: 52px;
    height: 52px;
    border-radius: 5px;
  }

  .home-rescue-desc {
    position: absolute;
    top: 26px;
    left: 62px;
    width: 78px;
    max-width: calc(100% - 66px);
    display: -webkit-box;
    overflow: hidden;
    font-size: 12px;
    line-height: 17px;
    color: #333;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .home-rescue-followers {
    position: absolute;
    bottom: 6px;
    left: 61px;
    width: 52px;
    overflow: hidden;
    font-size: 11px;
    line-height: 16px;
    color: #999;
    white-space: nowrap;
  }

  .home-promo-caption {
    position: static;
    flex: 0 0 17px;
    width: 72px;
    overflow: hidden;
    font-family: 'Source Han Sans CN', 'PingFang SC', sans-serif;
    font-size: 12px;
    font-weight: 400;
    line-height: 17px;
    color: #999;
    text-align: center;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .home-promo-caption--activity {
    color: #fff;
  }

  .home-promo-thumb {
    position: static;
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
    margin: 0;
    border-radius: 5px;
  }

  .container2.hidden .search {
    opacity: 0;
    transform: translateY(-50px);
    pointer-events: none;
  }

  .container2.hidden .home-announcement {
    transform: translateY(-50px);
  }

  .tab {
    position: relative;
    z-index: 3;
    flex-shrink: 0;
    height: 37px;
    width: 100%;
    margin-top: 0;
    padding: 4px 0 6px 11px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    transition:
      height 0.28s cubic-bezier(0.22, 0.61, 0.36, 1),
      padding 0.28s cubic-bezier(0.22, 0.61, 0.36, 1);

    .tab-left {
      flex: 1;
      min-width: 0;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      column-gap: 18px;

      .tab-item {
        display: inline-flex;
        align-items: center;
        font-size: 16px;
        font-weight: 400;
        letter-spacing: 0px;
        line-height: 1;
        color: rgba(151, 151, 151, 1);
        transition:
          color 0.2s ease,
          font-weight 0.2s ease,
          font-size 0.2s ease;
        cursor: pointer;
        flex-shrink: 0;
      }

      .active {
        font-size: 16px;
        font-weight: 700;
        color: rgba(34, 34, 34, 1);
        line-height: 1;
      }
    }

    .tab-right {
      position: relative;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0px;
      line-height: 1;
      color: rgba(34, 34, 34, 1);
      display: flex;
      align-items: center;
      flex-shrink: 0;
      padding-left: 0;
      padding-right: 11px;

      .tab-right-text {
        display: inline-flex;
        align-items: center;
        line-height: 1;
      }

      .tab-right-icon {
        width: 8px;
        height: 4px;
        margin-left: 3px;
        flex-shrink: 0;
        align-self: center;
      }
    }
  }

  .tab.tab-scrolled {
    height: 41px;
    padding: 4px 0 6px 11px;
  }

  .tab.tab-scrolled .tab-left {
    column-gap: 18px;
  }

  .dropdown-mask {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 70;
  }

  .dropdown-menu {
    position: absolute;
    min-width: 96px;
    background: rgba(255, 255, 255, 0.98);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.14);
    overflow: hidden;
    z-index: 90;
  }

  .city-dropdown {
    left: 0;
    top: 26px;
    min-width: 106px;
  }

  .sort-dropdown {
    right: 17px;
    top: 32.5px;
    width: 149px;
    min-width: 149px;
    height: 161px;
    padding-top: 10.5px;
    box-sizing: border-box;
  }

  .dropdown-item {
    height: 37px;
    padding: 0 15px;
    box-sizing: border-box;
    font-size: 12px;
    line-height: 11px;
    color: #999;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .dropdown-item.active {
    color: #333;
    font-weight: 500;
    background: #fff;
  }

  .dropdown-check {
    position: absolute;
    right: 14px;
    top: 25.5px;
    font-size: 16px;
    font-weight: 700;
    color: #222;
  }

  .feed-scroll {
    flex: 1;
    height: 0;
    min-height: 0;
    width: 100%;
    box-sizing: border-box;
    background: #f9fafa;
    border-top: 5px solid #fff;
  }

  .feed-scroll-inner {
    box-sizing: border-box;
    width: 100%;
    padding: 1px 5px 0;
    background: #f9fafa;
    min-height: 100%;
    /* 底栏盖住底部，列表尾部略抬高即可（安全区已在 custom-tab-bar 内处理） */
    padding-bottom: calc(8px + 56px);
  }

  .home-empty {
    min-height: 500px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 117px;
    box-sizing: border-box;
  }

  .home-empty-art {
    width: 139px;
    height: 84px;
  }

  .home-empty-title {
    margin-top: 24px;
    font-size: 14px;
    line-height: 20px;
    color: #666;
  }

  .home-empty-subtitle {
    margin-top: 6px;
    font-size: 12px;
    line-height: 17px;
    color: #999;
  }

  .home-yard-list {
    margin: 0 -5px;
    background: #fafafa;
    padding: 5px 13px 76px;
    min-height: 100%;
    box-sizing: border-box;
  }

  .home-yard-card {
    background: #fff;
    height: 231px;
    box-sizing: border-box;
    border-radius: 8px;
    padding: 14px 12px 15px;
    margin-bottom: 8px;
    overflow: hidden;
  }

  .home-yard-top {
    position: relative;
    display: flex;
    align-items: flex-start;
  }

  .home-yard-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .home-yard-main {
    flex: 1;
    min-width: 0;
    margin-left: 11px;
  }

  .home-yard-name-row {
    display: flex;
    align-items: center;
    height: 20px;
  }

  .home-yard-name {
    font-size: 14px;
    font-weight: 700;
    color: #333;
  }

  .home-yard-verified {
    margin-left: 3px;
    padding: 0 7px;
    height: 16px;
    line-height: 16px;
    border-radius: 10.5px;
    background: #fffaf0;
    font-size: 10px;
    font-weight: 500;
    color: #a9731d;
  }

  .home-yard-distance {
    position: absolute;
    right: 0;
    top: 1px;
    font-size: 11px;
    line-height: 16.5px;
    color: #999;
    white-space: nowrap;
  }

  .home-yard-badges {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 9px;
  }

  .home-yard-badges text {
    height: 16px;
    box-sizing: border-box;
    padding: 0 5px;
    border-radius: 5px;
    background: #fefada;
    color: #ee8002;
    font-size: 11px;
    font-weight: 500;
    line-height: 16px;
  }

  .home-yard-org {
    display: flex;
    align-items: center;
    margin-top: 9px;
    color: #333;
    font-size: 12px;
    line-height: 12px;
    gap: 3px;
  }

  .home-yard-desc {
    display: block;
    margin-top: 11px;
    font-size: 12px;
    line-height: 12px;
    color: #a1a1a1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .home-yard-gallery {
    height: 114px;
    margin-top: 15px;
    white-space: nowrap;
  }

  .home-yard-card:nth-child(2) .home-yard-gallery {
    margin-top: 15px;
  }

  .home-yard-gallery-row {
    display: inline-flex;
  }

  .home-yard-photo {
    width: 97px;
    margin-right: 5px;
  }

  .home-yard-photo image {
    display: block;
    width: 97px;
    height: 96px;
    border-radius: 7px;
  }

  .home-yard-photo text {
    display: block;
    margin-top: 2px;
    font-size: 11px;
    line-height: 16px;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .refresh-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 0 4px;
    background: #f9fafa;
    transform: translateY(-8px);
  }

  ::-webkit-scrollbar {
    display: none;
    width: 0 !important;
    height: 0 !important;
    background: transparent;
  }

  .load-more-indicator {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 14px 0 20px;
    background: #f9fafa;
  }

  .load-more-loading {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .refresh-text,
  .load-more-text {
    font-size: 12px;
    color: rgba(140, 140, 140, 1);
  }

  .refresh-text,
  .load-more-loading .load-more-text {
    margin-left: 6px;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid rgba(87, 107, 149, 0.25);
    border-top-color: rgba(87, 107, 149, 1);
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  .back-top-btn {
    position: fixed;
    right: 32px;
    bottom: 131px;
    width: 40px;
    height: 40px;
    box-sizing: border-box;
    border-radius: 50%;
    background: #fff;
    border: 1px solid #eee;
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 20;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  .back-top-arrow {
    width: 8px;
    height: 8px;
    border-left: 2px solid #555;
    border-top: 2px solid #555;
    transform: rotate(45deg);
    margin-top: 1px;
  }

  .back-top-text {
    display: none;
    margin-top: 2px;
    font-size: 9px;
    line-height: 1;
    letter-spacing: 0.3px;
    color: rgba(255, 255, 255, 0.96);
  }

  .paw-list {
    width: 100%;
    max-width: 100%;
    padding: 0 0 10px;
    box-sizing: border-box;
    display: flex;
    gap: 5px;
    transition:
      opacity 0.22s ease,
      transform 0.22s ease;
  }

  .paw-column {
    flex: 1;
    width: 0;
    min-width: 0;
  }

  .paw-list.tab-switching {
    opacity: 0.35;
    transform: translateY(6px);
  }

  .card {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    display: block;
    box-sizing: border-box;
    overflow: hidden;
    background: #feffff;
    border-radius: 4px;
    margin-bottom: 4px;

    .card-image-wrap {
      position: relative;
    }

    .card-location {
      position: absolute;
      right: 4px;
      bottom: 4px;
      height: 16px;
      padding: 0 4px;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
      color: #fff;
      font-size: 10px;
      line-height: 1;
    }

    .card-img {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      height: 240px;
      display: block;
      box-sizing: border-box;
      background: #f0f0f0;
    }

    .card-label {
      padding: 8px 9px 0;

      .card-label-text {
        font-size: 13px;
        font-weight: 500;
        line-height: 19px;
        color: rgba(51, 51, 51, 1);
        display: -webkit-box;
        line-clamp: 2;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    &.single-line-card .card-label {
      padding: 8px 9px 0;
    }

    .card-user {
      padding: 7px 9px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .card-user-left {
        display: flex;
        align-items: center;

        .card-user-icon {
          width: 17px;
          height: 17px;
          margin-right: 4px;
        }

        .card-user-name {
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0px;
          line-height: 15.93px;
          color: rgba(97, 97, 97, 1);
        }
      }

      .card-user-right {
        display: flex;
        align-items: flex-end;
        line-height: 1;

        .card-user-dianzan {
          width: 14px;
          height: 14px;
          margin-right: 4px;
          margin-bottom: 1px;
          display: block;
          flex-shrink: 0;
        }

        .card-user-num {
          display: inline-flex;
          align-items: center;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0px;
          line-height: 1;
          color: rgba(104, 104, 104, 1);
        }
      }
    }
  }

  .card:nth-child(2n) .card-img {
    height: 240px;
  }

  /* 375px baseline: 5 / 180 / 5 / 180 / 5; wider viewports expand both columns evenly. */
  .paw-list {
    gap: 5px;
    margin-top: 0;
  }

  .card .card-label,
  .card.single-line-card .card-label {
    padding: 8px 9px 0;
  }

  .card .card-label .card-label-text {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card:not(.single-line-card) .card-label .card-label-text {
    height: 38px;
  }

  .card .card-user {
    padding: 7px 9px 10px;
  }

  .card.single-line-card .card-user {
    padding: 8px 9px 9px;
  }

  .card.single-line-card .card-label .card-label-text {
    line-clamp: 1;
    -webkit-line-clamp: 1;
  }

  .card .card-user .card-user-icon {
    border-radius: 50%;
  }

  &.state-scrolled .feed-scroll,
  &.state-scrolled .feed-scroll-inner {
    background: #fafafa;
  }
}
</style>
