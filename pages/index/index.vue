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
		<image class="h5-status-bar" :src="activeFeedTab === 'yard' ? '/static/figma/home-header-yard-exact.png' : '/static/figma/home-header-exact.png'" mode="scaleToFill"></image>
		<!-- #endif -->
		<view class="container1">
			<image class="container1-bg" src="/static/homebg1.png"></image>
			<view class="title">
				<view class="title-content">
					<view class="city" @click="goCitySelect">
						<text>{{ selectedCity }}</text>
						<image class="city-icon" src="/static/jiao.png"></image>
					</view>
					<text class="title-txt" :class="{ 'title-txt--yard': activeFeedTab === 'yard' }">首页</text>
					<text v-if="activeFeedTab === 'yard'" class="service-title">宠物服务</text>
				</view>
			</view>
		</view>
		<view class="container2" :class="{ hidden: hideTopActions }">
			<image class="container2-bg" src="/static/homebg2.png"></image>
			<view class="box2">
				<view class="search">
					<view class="search-input" @click="openSearchPage">
						<view class="search-left">
							<image class="search-icon" src="/static/fangdajing.png"></image>
							<view class="search-text">{{ activeFeedTab === 'yard' ? '蓝金渐层' : '小院号' }}</view>
						</view>
						<view class="search-right">搜一搜</view>
					</view>
					<view class="search-btn" @click="openLeaderboard"><text>排行榜</text></view>
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
		</view>
		<view class="tab" :class="{ 'tab-scrolled': hideTopActions }">
			<view class="tab-left">
				<view
					v-for="tab in feedTabs"
					:key="tab.key"
					class="tab-item"
					:class="{ active: activeFeedTab === tab.key }"
					@click="changeFeedTab(tab.key)"
				>{{ tab.label }}</view>
			</view>
			<PawPopoverMenu v-model="showSortDropdown" :items="sortOptions" :active-key="selectedSort" @select="selectSort">
				<template #trigger>
					<view class="tab-right">
						<text class="tab-right-text">{{ selectedSort }}</text>
						<image class="tab-right-icon" src="/static/jiantou.png"></image>
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
			@scroll="handleFeedScroll"
			@scrolltoupper="onFeedScrollToUpper"
			@touchstart.capture="onFeedTouchStart"
			@touchmove.capture="onFeedTouchMove"
			@touchend.capture="onFeedTouchEnd"
			@touchcancel.capture="onFeedTouchEnd"
			@refresherpulling="onRefresherPulling"
			@refresherrefresh="onPullRefresh"
			@scrolltolower="onReachBottom"
			:upper-threshold="4"
			:lower-threshold="80"
			:show-scrollbar="false"
		>
			<view class="feed-scroll-inner">
			<view id="feed-top-anchor"></view>
			<view v-if="showRefreshIndicator" class="refresh-indicator">
				<view class="spinner"></view>
				<text class="refresh-text">{{ isRefreshing ? '正在刷新...' : '松开刷新' }}</text>
			</view>
			<view v-if="isDynamicEmpty" class="home-empty">
				<image class="home-empty-art" src="/static/figma/home/empty-dynamic.png" mode="aspectFit"></image>
				<text class="home-empty-title">还没有动态</text>
				<text class="home-empty-subtitle">这个城市好像还没有人发布</text>
			</view>
			<view v-else-if="activeFeedTab === 'yard'" class="home-yard-list">
					<YardSummaryCard v-for="yard in yardCards" :key="yard.id" class="home-yard-card" :yard="yardModel(yard)" variant="list" @click="goYardDetail" />
			</view>
			<view v-else class="paw-list" :class="{ 'tab-switching': isTabSwitching }">
				<view class="paw-column" v-for="(column, columnIndex) in feedColumns" :key="'feed-column-' + columnIndex">
				<FeedCard v-for="entry in column" :key="'fc-' + entry.index" :item="entry.item" @click="goDetail" @user-click="openAuthorProfile" @like="toggleFeedCardLike(entry.index)" />
				</view>
			</view>
			<view
				v-if="!isDynamicEmpty && activeFeedTab !== 'yard' && (isLoadingMore || !hasMore)"
				id="qa-home-load-more"
				class="load-more-indicator"
			>
				<view v-if="isLoadingMore" class="load-more-loading">
					<view id="qa-home-load-more-spinner" class="spinner"></view>
					<text class="load-more-text">加载中...</text>
				</view>
				<text v-else class="load-more-text">已经到底了</text>
			</view>
			</view>
		</scroll-view>
		<view v-if="showBackTopBtn" class="back-top-btn" @click="backToTop">
			<view class="back-top-arrow"></view>
			<text class="back-top-text">TOP</text>
		</view>
		<!-- #ifndef MP-WEIXIN -->
		<CustomTabber :tab-index="0" />
		<!-- #endif -->
	</view>
</template>

	<script>
	import CustomTabber from "@/components/CustomTabber/index.vue"
	import PawAnnouncementMarquee from "@/components/PawAnnouncementMarquee.vue"
	import PawPopoverMenu from "@/components/navigation/PawPopoverMenu.vue"
	import FeedCard from "@/components/dynamic/FeedCard.vue"
	import YardSummaryCard from "@/components/yard/YardSummaryCard.vue"
	import { openUserProfile } from "@/utils/profileNav.js"

	const FEED_PAGE_SIZE = 10
	const FEED_MOCK_TOTAL = 50
	const FEED_MOCK_TEMPLATES = [
		{ cover: '/static/figma/home/dynamic-left.png', distance: '3.2km', district: '金水区', title: '小猫吃的好开心', liked: false, likes: 37 },
		{ cover: '/static/figma/home/dynamic-right.png', distance: '2.6km', district: '天河区', title: '小猫吃得好开心啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊', liked: true, likes: 32 },
		{ cover: '/static/figma/home/dynamic-left.png', distance: '1.8km', district: '越秀区', title: '今天也有认真吃饭的小猫咪', liked: false, likes: 24 },
		{ cover: '/static/figma/home/dynamic-right.png', distance: '4.1km', district: '海珠区', title: '投喂完成，猫猫们已经排队开饭啦', liked: false, likes: 18 }
	]

	function createMockFeedCards() {
		return Array.from({ length: FEED_MOCK_TOTAL }, (_, index) => {
			const template = FEED_MOCK_TEMPLATES[index % FEED_MOCK_TEMPLATES.length]
			return {
				...template,
				id: `mock-feed-${index + 1}`,
				title: `${template.title} · ${index + 1}`,
				likes: template.likes + (index % 9)
			}
		})
	}

	export default {
		components: {
			CustomTabber,
			PawAnnouncementMarquee,
			PawPopoverMenu,
			FeedCard,
			YardSummaryCard
		},
		onShow() {
			this.searchAnimating = false
			this.showSearchOverlay = false
			this.searchOverlayExpanded = false
			const city = uni.getStorageSync('selectedCity')
			if (city) this.selectedCity = city
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
	data() {
			const mockFeedCards = createMockFeedCards()
			const initialFeedCards = mockFeedCards.slice(0, FEED_PAGE_SIZE)
			return {
				pageState: 'dynamic',
				zan1:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAeCAYAAAA/xX6fAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAAF+SURBVEiJvZdbtoMgDEVPWJ3XpUOqDqA6gMiQpBMz/bjElVK10JaeL1FwmwcJEioVQvAicgXgAUBERudcvFwusWQ91cCYeSCi6+aLiM4lUFcDNLBIRGcRGQFEAEhWv9SpFMbMg153XXdWcHKxR3LxKxVbSER/wH/M7P3S2FUDkSxwzj0AQgj+60DrztyiZVkU+HD/I6AmS+5OKxG5fQVorev7fsifa2xLdQgMIfgC6zzwHNtqIDMPIjKnYdyyziZMabaedOGyLN64x5s50ey7B6U1AIBpmuatORpb/eBT2rizLswmj1uWqbL4+Z05HgCYGX3fD2TqY0wTRqDcRTapDj5szQOapkl0cGTNJ7JGrUlTmmXvyLzbV3WLd2Wr0U+ApvDffgKEKQ7NgXnhbw7MS2NToC19uuWaArd6ZVOgcefaK5sB9/poM+BeH3UoPIvU6OiUsJ5LRWRm5vGTmmp/AdL46ZRAAKAd45va6z4OALquo6MTWYUi0m/AXqu7A58a2QJRlyArAAAAAElFTkSuQmCC',
				zan2:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAcCAYAAAB/E6/TAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAAE4SURBVEiJvZYxVoNAFEXvo05va+EyACcLcQG6iZBduAnX4IRhAR4b25xjZW/NtwiJRCFMQuBVw5n5//Lf8IcRZ8jS1CGtAAeAtFZZFjGxiobkeYHZqmPKK4TlUHwSC+qESG+AszR1VwFZnhc98EUD7Kr0fNAJ3cUujAN1782vpM1oUK9tO22H4qNBmN2fmL0FoK79KFBTjRtKoqq6HHSib/5qEAKthrU0dSSJa6xyEbFbdtb53o+hrv2+WgFYlr1GJm+9or4wu4lYt1ZZFjpYFBt4iaS1LMtskuTH8mNPhli5uUCTV/QOgLSZZY8UguawzsP438Swmmae3DqFIJi+os/9YGrQ4QycFKQQHuYAPbcfEuDjSom/W2OvEB6PQWZPVwItWpB/F8pEVeUxWwIvI0Ees2XfrfUHCTFt74bNhAQAAAAASUVORK5CYII=',
				selectedCity: '广州市',
				announcementItems: [
					{ id: 'feeding-demo-1', text: '广东汕头的花开富贵老师对小院我就是要喂猫投粮400克，积善缘，得福报~' },
					{ id: 'feeding-demo-2', text: '广州天河的橘子汽水为幸福小院投粮300克，愿每只流浪猫都能吃饱~' },
					{ id: 'feeding-demo-3', text: '深圳南山的猫咪守护者为阳光小院投粮500克，谢谢你的温柔投喂！' },
					{ id: 'feeding-demo-4', text: '佛山禅城的小鱼干老师为喵星人之家投粮200克，爱心已送达~' },
					{ id: 'feeding-demo-5', text: '东莞松山湖的春风十里为流浪猫驿站投粮800克，今日猫粮已加满！' },
					{ id: 'feeding-demo-6', text: '珠海香洲的海边散步为暖暖小院投粮350克，让毛孩子不再挨饿~' },
					{ id: 'feeding-demo-7', text: '惠州惠城的星空旅人为猫猫补给站投粮600克，感谢这份爱心！' },
					{ id: 'feeding-demo-8', text: '中山石岐的团团圆圆为有猫小院投粮250克，愿善意一直传递~' },
					{ id: 'feeding-demo-9', text: '江门蓬江的元气满满为街角猫屋投粮450克，猫咪们正在开心用餐~' },
					{ id: 'feeding-demo-10', text: '肇庆端州的晚风为希望小院投粮700克，你的每次投喂都很有意义~' }
				],
				// 接入后端时填写轮询接口或 WebSocket 地址；为空时只播放本地初始公告。
				announcementPollUrl: '',
				announcementWsUrl: '',
				sortOptions: ['最近更新', '离我最近', '只看猫咪', '只看狗狗'],
				selectedSort: '最近更新',
				showSortDropdown: false,
				feedTabs: [
					{ key: 'dynamic', label: '动态' },
					{ key: 'yard', label: '小院' },
					{ key: 'joined', label: '我加入的' }
				],
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
				yardCards: [{ id: 1, variant: 'badges' }, { id: 2, variant: 'org' }],
				feedCards: initialFeedCards
			}
		},
		computed: {
			feedColumns() {
				return [0, 1].map(columnIndex => this.feedCards
					.map((item, index) => ({ item, index }))
					.filter(entry => entry.index % 2 === columnIndex))
			},
			isDynamicEmpty() {
				return this.pageState === 'dynamic-empty'
			},
			showRefreshIndicator() {
				return this.isRefreshing || this.pullingDistance > 20
			}
		},
		onLoad(options = {}) {
			const state = options.state || 'dynamic'
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
		methods: {
			openSearchPage() {
				uni.navigateTo({
					url: '/pages/search/index',
					animationType: 'slide-in-right',
					animationDuration: 120
				})
			},
			openLeaderboard() {
				uni.navigateTo({
					url: '/pages/leaderboard/index',
					animationType: 'slide-in-right',
					animationDuration: 120
				})
			},
			toggleSortDropdown() {
				this.showSortDropdown = !this.showSortDropdown
			},
			selectSort(sort) {
				this.selectedSort = sort
				this.showSortDropdown = false
			},
			yardModel(yard) {
				return {
					name: '我就是要喂猫',
					avatar: '/static/figma/search/yard-avatar-exact.png',
					verified: true,
					distance: '3.2km 金水区',
					location: yard.variant === 'org' ? '合肥市希望流浪动物基地' : '',
					tags: yard.variant === 'badges' ? ['剩余6/21只', '已成立2个月', '入驻4人'] : [],
					description: '春去秋来二十年的救助流浪猫时间匆匆而去，在此希望每个毛孩子都被温柔相待。',
					gallery: [1, 2, 3, 4].map(id => ({ src: '/static/figma/search/yard-gallery-exact.png', title: '开饭了开饭了开饭' }))
				}
			},
			changeFeedTab(tabKey) {
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
			toggleFeedCardLike(idx) {
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
					url: `/pages/citySelect/index?current=${encodeURIComponent(this.selectedCity)}`
				})
			},
			handleFeedScroll(e) {
				const scrollTop = e?.detail?.scrollTop || 0
				const scrollDelta = scrollTop - this.lastFeedScrollTop

				// 无触摸设备用实际滚动方向兜底；头部动画引发的滚动重算在保护期内忽略。
				if (!this.isFeedTouching && Date.now() >= this.suppressScrollIntentUntil && Math.abs(scrollDelta) >= 1) {
					this.queueTopActionsIntent(scrollDelta > 0)
				}

				this.showBackTopBtn = this.hideTopActions && scrollTop > 120
				this.lastFeedScrollTop = scrollTop
			},
			getFeedTouchY(e) {
				const touch = (e?.touches && e.touches[0]) || (e?.changedTouches && e.changedTouches[0])
				if (!touch) return 0
				return Number(touch.clientY !== undefined ? touch.clientY : touch.pageY) || 0
			},
			onFeedTouchStart(e) {
				this.isFeedTouching = true
				this.feedTouchLastY = this.getFeedTouchY(e)
			},
			onFeedTouchMove(e) {
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
			onFeedWheel(e) {
				const deltaY = Number(e?.deltaY || e?.detail?.deltaY || 0)
				if (deltaY > 0) this.queueTopActionsIntent(true)
				if (deltaY < 0) this.queueTopActionsIntent(false)
			},
			onFeedPointerStart(e) {
				this.isFeedPointerActive = true
				this.feedPointerLastY = Number(e?.clientY || e?.pageY || 0)
			},
			onFeedPointerMove(e) {
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
			queueTopActionsIntent(shouldHide) {
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
			setTopActionsState(shouldHide) {
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
			onRefresherPulling(e) {
				this.pullingDistance = e?.detail?.dy || 0
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
					const nextCount = Math.min(this.feedCards.length + this.feedPageSize, this.mockFeedCards.length)
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
			goDetail() {
				uni.navigateTo({
					url: '/pages/dynamicDetail/index?yardId=1'
				})
			},
			goYardDetail() {
				uni.navigateTo({ url: '/pages/commodityDetails/index?id=1' })
			},
			openAuthorProfile() {
				openUserProfile({
					pawId: '100001',
					nickname: '朝阳小区猫猫队',
					avatar: '/static/user.png'
				})
			}
		},
		beforeDestroy() {
			if (this.noMoreHintTimer) clearTimeout(this.noMoreHintTimer)
			if (this.topActionsIntentTimer) clearTimeout(this.topActionsIntentTimer)
			if (this.refreshRequestTimer) clearTimeout(this.refreshRequestTimer)
			if (this.loadMoreRequestTimer) clearTimeout(this.loadMoreRequestTimer)
		}
	}
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
		font-family: var(--paw-font-family, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif);

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
				align-items: center;
				font-size: 15px;
				font-weight: 700;
				letter-spacing: 0px;
				line-height: 20px;
				color: rgba(40, 40, 39, 1);
				vertical-align: top;

				.city-icon {
					margin-left: 3px;
					width: 6px;
					height: 6px;
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
			height: 70px;
			position: relative;
			overflow: hidden;
			isolation: isolate;
			transition: height .28s cubic-bezier(.22, .61, .36, 1);
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
				transition: opacity .28s cubic-bezier(.22, .61, .36, 1);
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
		&.state-scrolled .container1-bg { height: 83px; }
		&.state-scrolled .title { height: 54px; }

		&.state-scrolled .back-top-btn { bottom: 131px; }
		&.state-scrolled .container2-bg { opacity: 0; }
		&.state-scrolled .feed-scroll { border-top: 0; }
		&.state-scrolled .feed-scroll-inner { padding-top: 0; }

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
			transition: transform .28s cubic-bezier(.22, .61, .36, 1), opacity .18s ease;
			will-change: transform, opacity;

			.search-input {
				height: 33px;
				box-sizing: border-box;
				flex: 1;
				border-radius: 17.5px;
				background: rgba(255, 255, 255, 1);
				border: 1.5px solid #1f1e18;
				padding-left: 10px;
				padding-right: 2px;
				display: flex;
				align-items: center;
				justify-content: space-between;

				.search-left {
					display: flex;
					align-items: center;

					.search-icon {
						width: 14px;
						height: 15px;
					}

					.search-text {
						font-size: 14px;
						font-weight: 400;
						color: rgba(217, 217, 217, 1);
						vertical-align: top;
						margin-left: 6px;
					}
				}

				.search-right {
					width: 55px;
					height: 28px;
					border-radius: 14px;
					background: rgba(31, 31, 31, 1);
					font-size: 12px;
					font-weight: 500;
					color: rgba(255, 255, 255, 1);
					display: flex;
					justify-content: center;
					align-items: center;
				}
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
			transition: transform .28s cubic-bezier(.22, .61, .36, 1);
			will-change: transform;
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
			transition: height .28s cubic-bezier(.22, .61, .36, 1), padding .28s cubic-bezier(.22, .61, .36, 1);

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
					transition: color .2s ease, font-weight .2s ease, font-size .2s ease;
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

		.home-yard-top { position: relative; display: flex; align-items: flex-start; }
		.home-yard-avatar { width: 50px; height: 50px; border-radius: 50%; flex-shrink: 0; }
		.home-yard-main { flex: 1; min-width: 0; margin-left: 11px; }
		.home-yard-name-row { display: flex; align-items: center; height: 20px; }
		.home-yard-name { font-size: 14px; font-weight: 700; color: #333; }
		.home-yard-verified { margin-left: 3px; padding: 0 7px; height: 16px; line-height: 16px; border-radius: 10.5px; background: #fffaf0; font-size: 10px; font-weight: 500; color: #a9731d; }
		.home-yard-distance { position:absolute;right:0;top:1px;font-size:11px;line-height:16.5px;color:#999;white-space:nowrap; }
		.home-yard-badges { display: flex; align-items: center; gap: 7px; margin-top: 9px; }
		.home-yard-badges text { height: 16px; box-sizing: border-box; padding: 0 5px; border-radius: 5px; background: #fefada; color: #ee8002; font-size: 11px; font-weight: 500; line-height: 16px; }
		.home-yard-org { display: flex; align-items: center; margin-top: 9px; color: #333; font-size: 12px; line-height: 12px; gap: 3px; }
		.home-yard-desc { display: block; margin-top: 11px; font-size: 12px; line-height: 12px; color: #a1a1a1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
		.home-yard-gallery { height: 114px; margin-top: 15px; white-space: nowrap; }
		.home-yard-card:nth-child(2) .home-yard-gallery { margin-top: 15px; }
		.home-yard-gallery-row { display: inline-flex; }
		.home-yard-photo { width: 97px; margin-right: 5px; }
		.home-yard-photo image { display: block; width: 97px; height: 96px; border-radius: 7px; }
		.home-yard-photo text { display: block; margin-top: 2px; font-size: 11px; line-height: 16px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

		.refresh-indicator {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 8px 0 4px;
			background: #f9fafa;
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
			display:none;
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
			transition: opacity .22s ease, transform .22s ease;
		}

		.paw-column {
			flex: 1;
			width: 0;
			min-width: 0;
		}

		.paw-list.tab-switching {
			opacity: .35;
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
				background: rgba(0, 0, 0, .45);
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

			&.single-line-card .card-label { padding: 8px 9px 0; }

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

		.card:nth-child(2n) .card-img { height: 240px; }

		/* 375px baseline: 5 / 180 / 5 / 180 / 5; wider viewports expand both columns evenly. */
		.paw-list { gap: 5px; margin-top: 0; }
		.card .card-label,
		.card.single-line-card .card-label { padding: 8px 9px 0; }
		.card .card-label .card-label-text {
			display: -webkit-box;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
			overflow: hidden;
		}
		.card:not(.single-line-card) .card-label .card-label-text { height: 38px; }
		.card .card-user { padding: 7px 9px 10px; }
		.card.single-line-card .card-user { padding: 8px 9px 9px; }
		.card.single-line-card .card-label .card-label-text { line-clamp: 1; -webkit-line-clamp: 1; }
		.card .card-user .card-user-icon { border-radius: 50%; }
		&.state-scrolled .feed-scroll,
		&.state-scrolled .feed-scroll-inner { background: #fafafa; }
	}
</style>
