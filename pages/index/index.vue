<template>
	<view class="container" :class="{ 'state-scrolled': pageState === 'dynamic-scrolled' }">
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
					<text class="title-txt">首页</text>
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
				<wht-notice-bar class="home-notice-bar" text="　广东汕头的花开富贵老师对小院我就是要喂猫投粮400克，积善缘，得福报~　" type="success" :showIcon="false"
					:scrollable="false" :speed="100" bgColor="rgba(255, 251, 220, 1)" color="rgba(80, 80, 80, 1)"
					radius="0">
				</wht-notice-bar>
			</view>
		</view>
		<!-- #ifndef MP-WEIXIN -->
		<image v-if="pageState !== 'dynamic-scrolled'" class="home-notice-reference" src="/static/figma/home-notice-exact.png" mode="scaleToFill"></image>
		<image v-else class="home-notice-reference home-notice-reference--scrolled" src="/static/figma/home-notice-scrolled-exact.png" mode="scaleToFill"></image>
		<!-- #endif -->
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
			<view class="tab-right" @click.stop="toggleSortDropdown">
				<text class="tab-right-text">{{ selectedSort }}</text>
				<image class="tab-right-icon" src="/static/jiantou.png"></image>
				<view v-if="showSortDropdown" class="dropdown-menu sort-dropdown" @click.stop>
					<view
						v-for="sort in sortOptions"
						:key="sort"
						class="dropdown-item"
						:class="{ active: selectedSort === sort }"
						@click="selectSort(sort)"
					><text>{{ sort }}</text><text v-if="selectedSort === sort" class="dropdown-check">✓</text></view>
				</view>
			</view>
		</view>
		<view v-if="showSortDropdown" class="dropdown-mask" @click="closeDropdowns"></view>
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
			@refresherpulling="onRefresherPulling"
			@refresherrefresh="onPullRefresh"
			@scrolltolower="onReachBottom"
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
				<view class="home-yard-card" v-for="yard in yardCards" :key="yard.id" @click="goYardDetail">
					<view class="home-yard-top">
						<image class="home-yard-avatar" src="/static/figma/search/yard-avatar-exact.png" mode="aspectFill"></image>
						<view class="home-yard-main">
							<view class="home-yard-name-row"><text class="home-yard-name">我就是要喂猫</text><text class="home-yard-verified">已实名</text></view>
							<view v-if="yard.variant === 'badges'" class="home-yard-badges">
								<text>剩余6/21日</text><text>已成立2个月</text><text>入驻4人</text>
							</view>
							<view v-else class="home-yard-org"><uni-icons type="auth-filled" color="#2c8cff" :size="14"></uni-icons><text>合肥市希望流浪动物基地</text></view>
						</view>
						<text class="home-yard-distance">3.2km 金水区</text>
					</view>
					<text class="home-yard-desc">春去秋来二十年的救助流浪猫时间匆匆而去，在此希望每个毛孩子都被温柔相待。</text>
					<scroll-view class="home-yard-gallery" scroll-x :show-scrollbar="false">
						<view class="home-yard-gallery-row"><view v-for="n in 4" :key="n" class="home-yard-photo"><image src="/static/figma/search/yard-gallery-exact.png" mode="aspectFill"></image><text>开饭了开饭了开饭</text></view></view>
					</scroll-view>
				</view>
			</view>
			<view v-else class="paw-list" :class="{ 'tab-switching': isTabSwitching }">
				<view class="paw-column" v-for="(column, columnIndex) in feedColumns" :key="'feed-column-' + columnIndex">
				<view class="card" :class="{ 'single-line-card': entry.item.title.length < 12 }" v-for="entry in column" :key="'fc-' + entry.index">
					<view class="card-image-wrap" @click="goDetail">
						<image class="card-img" mode="aspectFill" :lazy-load="false" :src="entry.item.cover"></image>
						<view v-if="!entry.item.embeddedLocation" class="card-location"><text>● 3.2km 金水区</text></view>
					</view>
					<view class="card-label">
						<view class="card-label-text">{{ entry.item.title }}</view>
					</view>
					<view class="card-user">
						<view class="card-user-left" @click.stop="openAuthorProfile">
							<image class="card-user-icon" src="/static/figma/home/feed-avatar.png" mode="aspectFill"></image>
							<view class="card-user-name">朝阳小区猫猫队</view>
						</view>
						<view class="card-user-right" @click.stop="toggleFeedCardLike(entry.index)">
							<image class="card-user-dianzan" :src="entry.item.liked ? zan2 : zan1" mode="aspectFit"></image>
							<text class="card-user-num">{{ entry.item.likes }}</text>
						</view>
					</view>
				</view>
				</view>
			</view>
			<view v-if="!isDynamicEmpty && activeFeedTab !== 'yard'" class="load-more-indicator">
				<view v-if="isLoadingMore" class="load-more-loading">
					<view class="spinner"></view>
					<text class="load-more-text">加载中...</text>
				</view>
				<text v-else class="load-more-text">{{ hasMore ? '上拉加载更多' : '已经到底啦' }}</text>
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
	import WhtNoticeBar from "@/components/WhtNoticeBar/index.vue"
	import { openUserProfile } from "@/utils/profileNav.js"
	export default {
		components: {
			CustomTabber,
			WhtNoticeBar
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
			return {
				pageState: 'dynamic',
				zan1:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAeCAYAAAA/xX6fAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAAF+SURBVEiJvZdbtoMgDEVPWJ3XpUOqDqA6gMiQpBMz/bjElVK10JaeL1FwmwcJEioVQvAicgXgAUBERudcvFwusWQ91cCYeSCi6+aLiM4lUFcDNLBIRGcRGQFEAEhWv9SpFMbMg153XXdWcHKxR3LxKxVbSER/wH/M7P3S2FUDkSxwzj0AQgj+60DrztyiZVkU+HD/I6AmS+5OKxG5fQVorev7fsifa2xLdQgMIfgC6zzwHNtqIDMPIjKnYdyyziZMabaedOGyLN64x5s50ey7B6U1AIBpmuatORpb/eBT2rizLswmj1uWqbL4+Z05HgCYGX3fD2TqY0wTRqDcRTapDj5szQOapkl0cGTNJ7JGrUlTmmXvyLzbV3WLd2Wr0U+ApvDffgKEKQ7NgXnhbw7MS2NToC19uuWaArd6ZVOgcefaK5sB9/poM+BeH3UoPIvU6OiUsJ5LRWRm5vGTmmp/AdL46ZRAAKAd45va6z4OALquo6MTWYUi0m/AXqu7A58a2QJRlyArAAAAAElFTkSuQmCC',
				zan2:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAcCAYAAAB/E6/TAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAAE4SURBVEiJvZYxVoNAFEXvo05va+EyACcLcQG6iZBduAnX4IRhAR4b25xjZW/NtwiJRCFMQuBVw5n5//Lf8IcRZ8jS1CGtAAeAtFZZFjGxiobkeYHZqmPKK4TlUHwSC+qESG+AszR1VwFZnhc98EUD7Kr0fNAJ3cUujAN1782vpM1oUK9tO22H4qNBmN2fmL0FoK79KFBTjRtKoqq6HHSib/5qEAKthrU0dSSJa6xyEbFbdtb53o+hrv2+WgFYlr1GJm+9or4wu4lYt1ZZFjpYFBt4iaS1LMtskuTH8mNPhli5uUCTV/QOgLSZZY8UguawzsP438Swmmae3DqFIJi+os/9YGrQ4QycFKQQHuYAPbcfEuDjSom/W2OvEB6PQWZPVwItWpB/F8pEVeUxWwIvI0Ees2XfrfUHCTFt74bNhAQAAAAASUVORK5CYII=',
				selectedCity: '广州市',
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
				refresherTriggered: false,
				isRefreshing: false,
				pullingDistance: 0,
				isLoadingMore: false,
				hasMore: true,
				noMoreHintVisible: false,
				noMoreHintTimer: null,
				showBackTopBtn: false,
				scrollIntoViewId: '',
				yardCards: [{ id: 1, variant: 'badges' }, { id: 2, variant: 'org' }],
				feedCards: [
					{ cover: '/static/figma/search/dynamic-left-1.png', embeddedLocation: true, title: '小猫吃的好开心', liked: false, likes: 37 },
					{
						cover: '/static/figma/search/dynamic-right-1.png',
						embeddedLocation: true,
						title: '小猫吃的好开心啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊',
						liked: true,
						likes: 32
					},
					{ cover: '/static/figma/search/dynamic-left-2.png', embeddedLocation: true, title: '小猫吃的好开心', liked: false, likes: 37 },
					{ cover: '/static/figma/search/dynamic-right-2.png', embeddedLocation: true, title: '小猫吃的好开心', liked: false, likes: 37 }
				]
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

				// 使用区间阈值控制显隐，避免在底部因微小滚动反复切换导致抖动
				if (scrollTop <= 28) {
					this.hideTopActions = false
				} else if (scrollTop >= 80) {
					this.hideTopActions = true
				}

				this.showBackTopBtn = this.hideTopActions && scrollTop > 120
				this.lastFeedScrollTop = scrollTop
			},
			backToTop() {
				this.scrollIntoViewId = 'feed-top-anchor'
				this.hideTopActions = false
				this.showBackTopBtn = false
				this.lastFeedScrollTop = 0
				setTimeout(() => {
					this.scrollIntoViewId = ''
				}, 300)
			},
			onRefresherPulling(e) {
				this.pullingDistance = e?.detail?.dy || 0
			},
			onPullRefresh() {
				if (this.isRefreshing) return
				this.refresherTriggered = true
				this.isRefreshing = true
				this.pullingDistance = 0

				setTimeout(() => {
					this.hasMore = true
					this.isRefreshing = false
					this.refresherTriggered = false
				}, 900)
			},
			onReachBottom() {
				if (this.isLoadingMore) return
				if (!this.hasMore) return
				this.isLoadingMore = true

				setTimeout(() => {
					this.isLoadingMore = false
					this.hasMore = false
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

		.h5-status-bar {
			position: absolute;
			left: 0;
			top: 0;
			width: 100%;
			height: 90px;
			z-index: 1200;
			pointer-events: none;
		}

		.home-notice-reference {
			position: absolute;
			left: 0;
			top: 134px;
			width: 375px;
			height: 24px;
			z-index: 1100;
			pointer-events: none;
		}
		.home-notice-reference--scrolled { top: 90px; height: 22px; }

		.container1 {
			flex-shrink: 0;
			width: 100%;
			height: 90px;
			position: relative;
			overflow: visible;

			.container1-bg {
				width: 100%;
				height: 90px;
				position: absolute;
				left: 0;
				top: 0;
				z-index: 1;
			}
		}

		.title {
			width: 100%;
			height: 90px;
			display: flex;
			justify-content: center;
			align-content: center;
			position: relative;
			box-sizing: border-box;
			padding-top: 40px;
			position: absolute;
			left: 0;
			top: 0;
			z-index: 60;
			overflow: visible;

			.title-content {
				width: 100%;
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

			.service-title {
				position: absolute;
				left: 122px;
				font-size: 15px;
				font-weight: 400;
				line-height: 20px;
				color: #8f8f8f;
			}
		}

		.container2 {
			flex-shrink: 0;
			width: 100%;
			height: 67px;
			position: relative;
			overflow: hidden;
			transition: height .25s ease, opacity .25s ease, margin .25s ease;

			.container2-bg {
				width: 100%;
				height: 67px;
				position: absolute;
				left: 0;
				top: 0;
				z-index: 1;
			}

			.box2 {
				width: 100%;
				height: 67px;
				position: absolute;
				left: 0;
				top: 0;
				z-index: 2;
			}
		}

		.container2.hidden {
			height: 0;
			opacity: 0;
			margin: 0;
		}

		&.state-scrolled .container2.hidden {
			height: 19px;
			opacity: 1;
		}

		&.state-scrolled .container1,&.state-scrolled .container1-bg{height:79px}
		&.state-scrolled .title{height:100px}

		&.state-scrolled .container2.hidden .search {
			display: none;
		}

		&.state-scrolled .paw-list {
			margin-top: -224px;
		}
		&.state-scrolled .load-more-indicator{display:none}
		&.state-scrolled .back-top-btn{bottom:129px}

		.search {
			display: flex;
			align-items: center;
			height: 38px;
			margin-bottom: 3px;
			padding: 1px 15px 0;
			box-sizing: border-box;

			.search-input {
				height: 35px;
				box-sizing: border-box;
				transform: translateY(-1.5px);
				flex: 1;
				border-radius: 50px;
				background: rgba(255, 255, 255, 1);
				border: 2px solid;
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
					height: 26px;
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
				width: 50px;
				height: 30px;
				margin-left: 13px;
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

		.home-notice-bar {
			display: block;
			padding-left: 8px;
			box-sizing: border-box;
			width: calc(100% + 8px);
			margin-right: -8px;
			transform: scaleY(0.96);
			transform-origin: center top;
		}

		.tab {
			flex-shrink: 0;
			min-height: 37px;
			width: 100%;
			margin-top: 1px;
			padding: 4px 0 6px 10px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			box-sizing: border-box;

			.tab-left {
				flex: 1;
				min-width: 0;
				display: flex;
				justify-content: flex-start;
				align-items: center;
				column-gap: 20px;

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
					font-size: 18px;
					font-weight: 700;
					color: rgba(34, 34, 34, 1);
					line-height: 1;
				}
			}

			.tab-right {
				position: relative;
				font-size: 15px;
				font-weight: 600;
				letter-spacing: 0px;
				line-height: 1;
				color: rgba(34, 34, 34, 1);
				display: flex;
				align-items: center;
				flex-shrink: 0;
				padding-left: 0;
				padding-right: 8px;

				.tab-right-text {
					display: inline-flex;
					align-items: center;
					line-height: 1;
				}

				.tab-right-icon {
					width: 10px;
					height: 7px;
					margin-left: 3px;
					flex-shrink: 0;
					align-self: center;
				}
			}
		}

		.tab.tab-scrolled {
			padding: 4px 0 6px 10px;
			min-height: 44px;
		}

		.tab.tab-scrolled .tab-left {
			column-gap: 12px;
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
			right: 16px;
			top: 39px;
			width: 150px;
			min-width: 150px;
		}

		.dropdown-item {
			padding: 8.5px 14px;
			font-size: 14px;
			line-height: 20px;
			color: #999;
			white-space: nowrap;
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		.dropdown-item.active {
			color: #333;
			font-weight: 400;
			background: #fff;
		}

		.dropdown-check { font-size: 16px; font-weight: 700; color: #222; }

		.feed-scroll {
			flex: 1;
			height: 0;
			min-height: 0;
			width: 100%;
			box-sizing: border-box;
			background: #fff;
		}

		.feed-scroll-inner {
			box-sizing: border-box;
			width: 100%;
			padding: 0 5px;
			background: #fff;
			min-height: 100%;
			/* 底栏盖住底部，列表尾部略抬高即可（安全区已在 custom-tab-bar 内处理） */
			padding-bottom: calc(8px + 56px);
		}

		.home-empty {
			min-height: 500px;
			display: flex;
			flex-direction: column;
			align-items: center;
			padding-top: 116px;
			box-sizing: border-box;
		}

		.home-empty-art {
			width: 139px;
			height: 84px;
		}

		.home-empty-title {
			margin-top: 28px;
			font-size: 15px;
			line-height: 20px;
			color: #777;
		}

		.home-empty-subtitle {
			margin-top: 6px;
			font-size: 13px;
			line-height: 18px;
			color: #aaa;
		}

		.home-yard-list {
			margin: 0 -5px;
			background: #fafafa;
			padding: 6px 13px 76px;
			min-height: 100%;
			box-sizing: border-box;
		}

		.home-yard-card {
			background: #fff;
			border-radius: 8px;
			padding: 15px 13px 13px;
			margin-bottom: 8px;
			overflow: hidden;
		}

		.home-yard-top { position: relative; display: flex; align-items: flex-start; }
		.home-yard-avatar { width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0; }
		.home-yard-main { flex: 1; min-width: 0; margin-left: 10px; }
		.home-yard-name-row { display: flex; align-items: center; height: 20px; }
		.home-yard-name { font-size: 15px; font-weight: 700; color: #222; }
		.home-yard-verified { margin-left: 8px; font-size: 10px; color: #f59a23; }
		.home-yard-distance { position:absolute;right:0;top:0;padding-top:4px;font-size:11px;color:#aaa;white-space:nowrap; }
		.home-yard-badges { display: flex; align-items: center; gap: 6px; margin-top: 7px; }
		.home-yard-badges text { padding: 3px 7px; border-radius: 4px; background: #fff6df; color: #f08c00; font-size: 10px; line-height: 16px; }
		.home-yard-org { display: flex; align-items: center; margin-top: 7px; color: #666; font-size: 11px; gap: 3px; }
		.home-yard-desc { display: block; margin-top: 11px; font-size: 12px; line-height: 18px; color: #ababab; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
		.home-yard-gallery { margin-top: 8px; white-space: nowrap; }
		.home-yard-card:nth-child(2) .home-yard-gallery { margin-top: 9px; }
		.home-yard-gallery-row { display: inline-flex; }
		.home-yard-photo { width: 96px; margin-right: 6px; }
		.home-yard-photo image { display: block; width: 96px; height: 96px; border-radius: 7px; }
		.home-yard-photo text { display: block; margin-top: 5px; font-size: 11px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

		.refresh-indicator {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 8px 0 4px;
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
			background: #fff;
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
			right: 29px;
			bottom: 129px;
			width: 44px;
			height: 44px;
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
			gap: 3px;
			transition: opacity .22s ease, transform .22s ease;
		}

		.paw-column {
			width: calc((100% - 3px) / 2);
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
			background: #fff;
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
				padding: 9px;

				.card-label-text {
					font-size: 14px;
					font-weight: 500;
					line-height: 18.82px;
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
				padding: 6px 9px;
			}

			.card-user {
				padding: 0 9px 9px 9px;
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

		/* Figma feed grid geometry shared with the search result masonry. */
		.paw-list { gap: 4px; margin-top: 0; }
		.paw-column { width: 180px; flex: none; }
		.paw-column:last-child { width: 181px; }
		.card .card-label,
		.card.single-line-card .card-label { padding: 8px 10px 2px; }
		.card .card-label .card-label-text {
			display: -webkit-box;
			-webkit-line-clamp: 1;
			-webkit-box-orient: vertical;
			overflow: hidden;
		}
		.card:not(.single-line-card) .card-label .card-label-text { height: 38px; }
		.card .card-user { padding: 7px 10px 8px; }
		.card .card-user { padding-top: 5px; padding-bottom: 10px; }
		.card .card-label .card-label-text { line-clamp: 1 !important; -webkit-line-clamp: 1 !important; }
		.card .card-user .card-user-icon { border-radius: 50%; }
		&.state-scrolled .card:not(.single-line-card) .card-user { position: relative; top: -2px; }
		&.state-scrolled .feed-scroll,
		&.state-scrolled .feed-scroll-inner { background: #fafafa; }
	}
</style>
