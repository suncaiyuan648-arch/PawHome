<template>
	<view class="hist-page">
		<!-- #ifndef MP-WEIXIN -->
		<image class="h5-status-bar" src="/static/figma/status-bar-history.png" mode="scaleToFill"></image>
		<!-- #endif -->
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-side nav-left" @click.stop="goBack">
					<image
						class="nav-back-icon"
						src="/static/nav-back-arrow.png"
						mode="aspectFit"
					></image>
				</view>
				<text class="nav-title">浏览记录</text>
				<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
		</view>

		<view class="tabs">
			<view
				class="tab-item"
				:class="{ 'tab-item--active': activeTab === 'feed' }"
				@click="activeTab = 'feed'"
			>
				<text class="tab-text">动态</text>
			</view>
			<view
				class="tab-item"
				:class="{ 'tab-item--active': activeTab === 'yard' }"
				@click="activeTab = 'yard'"
			>
				<text class="tab-text">小院</text>
			</view>
		</view>

		<scroll-view
			class="main-scroll"
			:class="{ 'main-scroll--white': isCurrentEmpty }"
			scroll-y
			:show-scrollbar="false"
			:bounces="false"
		>
			<view v-if="isCurrentEmpty" class="empty-state">
				<image
					class="empty-illu"
					src="/static/me/browsing-empty.png"
					mode="widthFix"
				></image>
			</view>

			<!-- 动态：双列瀑布流 -->
			<view v-else-if="activeTab === 'feed'" class="masonry">
				<view
					v-for="(item, idx) in feedList"
					:key="'f-' + idx"
					class="hist-card"
					@click="onFeedTap(item)"
				>
					<view class="hist-card-img-wrap">
						<image
							class="hist-card-img"
							:class="{ 'hist-card-img--short': idx % 2 === 1 }"
							:src="item.cover"
							mode="aspectFill"
						></image>
						<view class="loc-pill">
							<uni-icons type="location" color="#ffffff" :size="12"></uni-icons>
							<text class="loc-pill-text">{{ item.distance }} {{ item.district }}</text>
						</view>
					</view>
					<view class="hist-card-title">{{ item.title }}</view>
					<view class="hist-card-foot">
						<view class="hist-foot-left" @click.stop="openUserFromItem(item)">
							<image class="hist-avatar" :src="item.userAvatar" mode="aspectFill"></image>
							<text class="hist-name">{{ item.userName }}</text>
						</view>
						<view class="hist-foot-right" @click.stop="toggleFeedLike(idx)">
							<uni-icons
								:type="item.liked ? 'hand-up-filled' : 'hand-up'"
								:color="item.liked ? '#ff2741' : '#999999'"
								:size="16"
							></uni-icons>
							<text class="hist-like-num">{{ item.likes }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 小院：单列卡片 -->
			<view v-else-if="activeTab === 'yard'" class="yard-list">
				<view
					v-for="(item, idx) in yardList"
					:key="'y-' + idx"
					class="yard-card"
					@click="onYardTap(item)"
				>
					<view class="yard-header">
						<image
							class="yard-avatar"
							:src="item.userAvatar"
							mode="aspectFill"
							@click.stop="openUserFromItem(item)"
						></image>
						<view class="yard-header-mid">
							<view class="yard-title-row" @click.stop="openUserFromItem(item)">
								<text class="yard-nickname">{{ item.userName }}</text>
								<text v-if="item.verified" class="yard-verified">已实名</text>
							</view>
							<view v-if="item.variant === 'badges'" class="yard-badges">
								<view
									v-for="(b, bi) in item.badges"
									:key="bi"
									class="yard-badge"
								>
									<text class="yard-badge-text">{{ b }}</text>
								</view>
							</view>
							<view v-else class="yard-org-row">
								<uni-icons type="auth-filled" color="#1976d2" :size="16"></uni-icons>
								<text class="yard-org-name">{{ item.orgName }}</text>
							</view>
						</view>
						<text class="yard-dist">{{ item.distance }} {{ item.district }}</text>
					</view>
					<text class="yard-desc">{{ item.desc }}</text>
					<scroll-view
						class="yard-gallery-scroll"
						scroll-x
						:show-scrollbar="false"
						:enable-flex="true"
					>
						<view class="yard-gallery-row">
							<view
								v-for="(g, gi) in item.gallery"
								:key="gi"
								class="yard-g-item"
							>
								<image class="yard-g-img" :src="g.img" mode="aspectFill"></image>
								<text class="yard-g-cap">{{ g.caption }}</text>
							</view>
						</view>
					</scroll-view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import { goBackSmart } from '@/utils/navBack.js'
	import { openUserProfile, openYardDetail } from '@/utils/profileNav.js'

	const mockFeed = () => [
		{
			cover: '/static/figma/history/white-cat.jpg',
			title: '小猫吃的好开心',
			distance: '3.2km',
			district: '金水区',
			userAvatar: '/static/figma/history/user.png',
			userName: '朝阳小区猫猫队',
			pawId: '100001',
			yardId: '1',
			likes: 37,
			liked: false
		},
		{
			cover: '/static/figma/history/food.jpg',
			title: '小院午后阳光正好',
			distance: '1.8km',
			district: '二七区',
			userAvatar: '/static/figma/history/user.png',
			userName: '朝阳小区猫猫队',
			pawId: '100001',
			yardId: '2',
			likes: 32,
			liked: true
		},
		{
			cover: '/static/figma/history/pattern.jpg',
			title: '今天多喂了一点粮',
			distance: '5.0km',
			district: '中原区',
			userAvatar: '/static/figma/history/user.png',
			userName: '朝阳小区猫猫队',
			pawId: '100001',
			yardId: '1',
			likes: 24,
			liked: false
		},
		{
			cover: '/static/figma/history/cat-bowl.png',
			title: '猫咪排队吃饭中',
			distance: '2.1km',
			district: '管城区',
			userAvatar: '/static/figma/history/user.png',
			userName: '朝阳小区猫猫队',
			pawId: '100001',
			yardId: '1',
			likes: 41,
			liked: true
		},
		{
			cover: '/static/figma/history/food.jpg',
			title: '新来的橘猫很乖',
			distance: '4.5km',
			district: '惠济区',
			userAvatar: '/static/figma/history/user.png',
			userName: '朝阳小区猫猫队',
			pawId: '100001',
			yardId: '2',
			likes: 18,
			liked: false
		},
		{
			cover: '/static/figma/history/cat-bowl.png',
			title: '投喂记录打卡',
			distance: '900m',
			district: '高新区',
			userAvatar: '/static/figma/history/user.png',
			userName: '朝阳小区猫猫队',
			pawId: '100001',
			yardId: '1',
			likes: 56,
			liked: false
		}
	]

	const galleryMock = () => [
		{ img: '/static/figma/history-yard-gallery.png', caption: '开饭了开饭了开饭' },
		{ img: '/static/figma/history-yard-gallery.png', caption: '开饭了开饭了开饭' },
		{ img: '/static/figma/history-yard-gallery.png', caption: '开饭了开饭了开饭' },
		{ img: '/static/figma/history-yard-gallery.png', caption: '开饭了开饭了开饭' }
	]

	const mockYard = () => [
		{
			yardId: '1',
			userAvatar: '/static/figma/home/yard-avatar.png',
			userName: '我就是要喂猫',
			pawId: 'yard_owner_001',
			verified: true,
			distance: '3.2km',
			district: '金水区',
			variant: 'badges',
			badges: ['6只猫咪', '已成立2个月', '入驻4人'],
			desc: '春去秋来二十年的救助流浪猫时间匆匆而去，在此希望每个...',
			gallery: galleryMock()
		},
		{
			yardId: '2',
			userAvatar: '/static/figma/home/yard-avatar.png',
			userName: '我就是要喂猫',
			pawId: 'yard_owner_001',
			verified: true,
			distance: '3.2km',
			district: '金水区',
			variant: 'org',
			orgName: '合肥市希望流浪动物基地',
			desc: '春去秋来二十年的救助流浪猫时间匆匆而去，在此希望每个...',
			gallery: galleryMock()
		}
	]

	export default {
		data() {
			return {
				statusBarHeight: 20,
				menuRightWidth: 87,
				activeTab: 'feed',
				// 接入接口后：有数据赋值列表，无数据赋 [] 即显示空状态
				feedList: mockFeed(),
				yardList: mockYard()
			}
		},
		computed: {
			isCurrentEmpty() {
				if (this.activeTab === 'feed') return this.feedList.length === 0
				return this.yardList.length === 0
			}
		},
		onLoad(options = {}) {
			const sys = uni.getSystemInfoSync()
			const historyCovers = ['/static/figma/history-feed-1.png?v=2','/static/figma/history-feed-2.png?v=2','/static/figma/history-feed-3.png?v=2','/static/figma/history-feed-4.png?v=2']
			this.feedList = this.feedList.slice(0, 4).map((item, index) => ({ ...item, cover: historyCovers[index], title: '小猫吃的好开心', distance: '3.2km', district: '金水区', likes: index === 1 ? 32 : 37, liked: index === 1 }))
			this.statusBarHeight = sys.statusBarHeight || 20
			// #ifdef H5
			this.statusBarHeight = 44
			// #endif
			if (options.state === 'yard') this.activeTab = 'yard'
			if (options.state === 'empty') {
				this.activeTab = 'yard'
				this.yardList = []
			}
			// #ifdef MP-WEIXIN
			try {
				const mb = uni.getMenuButtonBoundingClientRect()
				if (mb && mb.left) {
					this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87)
				}
			} catch (e) {}
			// #endif
		},
		methods: {
			openUserFromItem(item) {
				openUserProfile({
					pawId: item.pawId,
					nickname: item.userName,
					avatar: item.userAvatar
				})
			},
			goBack() {
				goBackSmart({ fallbackUrl: '/pages/me/index' })
			},
			onFeedTap(item) {
				if (!item) return
				const yardId = item.yardId != null && String(item.yardId).trim() !== '' ? String(item.yardId) : '1'
				uni.navigateTo({
					url: '/pages/dynamicDetail/index?yardId=' + encodeURIComponent(yardId)
				})
			},
			onYardTap(item) {
				if (!item) return
				openYardDetail({
					yardId: item.yardId || '1',
					yardName: item.yardName || item.userName || ''
				})
			},
			toggleFeedLike(idx) {
				const item = this.feedList[idx]
				if (!item) return
				if (item.liked) {
					item.liked = false
					item.likes = Math.max(0, item.likes - 1)
				} else {
					item.liked = true
					item.likes += 1
				}
			}
		}
	}
</script>

<style scoped>
	.hist-page {
		position:relative;
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #f8f8f8;
		box-sizing: border-box;
	}
	.h5-status-bar{position:absolute;left:0;top:0;width:100%;height:44px;z-index:100;pointer-events:none}

	.nav-wrap {
		flex-shrink: 0;
		background: #ffffff;
	}

	.nav-row {
		position: relative;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 8rpx;
		box-sizing: border-box;
	}

	.nav-side {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		min-width: 80rpx;
	}

	.nav-left {
		padding: 8rpx 24rpx 8rpx 16rpx;
		margin-left: 4rpx;
		min-width: 72rpx;
		min-height: 72rpx;
		justify-content: center;
	}

	.nav-back-icon {
		width: 40rpx;
		height: 40rpx;
		display: block;
	}

	.nav-title {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		font-size: 34rpx;
		font-weight: 600;
		color: #111111;
		line-height: 48rpx;
		max-width: 50%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.nav-right {
		min-height: 1px;
	}

	.tabs {
		flex-shrink: 0;
		display: flex;
		flex-direction: row;
		background: #ffffff;
		padding: 0 48rpx;
		border-bottom: 1rpx solid #f0f0f0;
		box-sizing: border-box;
	}

	.tab-item {
		flex: 1;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		padding: 24rpx 0 20rpx;
		position: relative;
		box-sizing: border-box;
	}

	.tab-text {
		font-size: 30rpx;
		font-weight: 400;
		color: #999999;
		line-height: 42rpx;
	}

	.tab-item--active .tab-text {
		font-weight: 600;
		color: #111111;
	}

	.tab-item--active::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: 0;
		transform: translateX(-50%);
		width: 56rpx;
		height: 6rpx;
		background: #ffe60f;
		border-radius: 3rpx;
	}

	.main-scroll {
		flex: 1;
		height: 0;
		box-sizing: border-box;
	}

	.main-scroll--white {
		background: #ffffff;
	}

	.empty-state {
		min-height: 62vh;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80rpx 48rpx 120rpx;
		box-sizing: border-box;
		background: #ffffff;
	}

	.empty-illu {
		width: 160rpx;
	}

	.empty-text {
		font-size: 28rpx;
		color: #b8b8b8;
		line-height: 40rpx;
	}

	.masonry {
		padding: 13px 5px 40rpx;
		padding-bottom: calc(40rpx + constant(safe-area-inset-bottom));
		padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
		display:grid;
		grid-template-columns:repeat(2,minmax(0,1fr));
		gap:4px;
	}

	.hist-card {
		width: 100%;
		display: block;
		vertical-align: top;
		break-inside: avoid;
		-webkit-column-break-inside: avoid;
		page-break-inside: avoid;
		background: #ffffff;
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 0;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
		box-sizing: border-box;
	}

	.hist-card-img-wrap {
		position: relative;
		width: 100%;
	}

	.hist-card-img {
		width: 100%;
		height: 240px;
		display: block;
		background: #f0f0f0;
	}

	.hist-card-img--short {
		height: 240px;
	}

	.loc-pill {
		display: none;
		position: absolute;
		right: 12rpx;
		bottom: 12rpx;
		max-width: calc(100% - 24rpx);
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 6rpx 14rpx;
		border-radius: 999rpx;
		background: rgba(0, 0, 0, 0.48);
		box-sizing: border-box;
	}

	.loc-pill-text {
		margin-left: 4rpx;
		font-size: 20rpx;
		color: #ffffff;
		line-height: 28rpx;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.hist-card-title {
		padding: 16rpx 16rpx 8rpx;
		font-size: 28rpx;
		font-weight: 500;
		color: #333333;
		line-height: 40rpx;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
	}

	.hist-card-foot {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 8rpx 16rpx 16rpx;
		box-sizing: border-box;
	}

	.hist-foot-left {
		display: flex;
		flex-direction: row;
		align-items: center;
		min-width: 0;
		flex: 1;
	}

	.hist-avatar {
		width: 36rpx;
		height: 36rpx;
		border-radius: 50%;
		flex-shrink: 0;
		background: #f0f0f0;
	}

	.hist-name {
		margin-left: 8rpx;
		font-size: 22rpx;
		color: #616161;
		line-height: 32rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.hist-foot-right {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-shrink: 0;
		margin-left: 12rpx;
	}

	.hist-like-num {
		margin-left: 6rpx;
		font-size: 24rpx;
		font-weight: 500;
		color: #686868;
		line-height: 1;
	}

	.yard-list {
		padding: 28rpx 30rpx 40rpx;
		padding-bottom: calc(40rpx + constant(safe-area-inset-bottom));
		padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.yard-card {
		background: #ffffff;
		border-radius: 20rpx;
		padding: 20rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
		box-sizing: border-box;
	}

	.yard-header {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
	}

	.yard-avatar {
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
		flex-shrink: 0;
		background: #f0f0f0;
	}

	.yard-header-mid {
		flex: 1;
		min-width: 0;
		margin-left: 20rpx;
		padding-right: 12rpx;
	}

	.yard-title-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-wrap: wrap;
		gap: 12rpx;
	}

	.yard-nickname {
		font-size: 30rpx;
		font-weight: 600;
		color: #111111;
		line-height: 42rpx;
	}

	.yard-verified {
		font-size: 22rpx;
		font-weight: 500;
		color: #ff6b00;
		line-height: 30rpx;
	}

	.yard-dist {
		flex-shrink: 0;
		font-size: 22rpx;
		color: #999999;
		line-height: 32rpx;
		text-align: right;
		max-width: 160rpx;
	}

	.yard-badges {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 12rpx;
		margin-top: 16rpx;
	}

	.yard-badge {
		padding: 6rpx 16rpx;
		border-radius: 8rpx;
		background: #fff8e6;
	}

	.yard-badge-text {
		font-size: 22rpx;
		font-weight: 500;
		color: #e65100;
		line-height: 30rpx;
	}

	.yard-org-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-top: 16rpx;
		gap: 8rpx;
		min-width: 0;
	}

	.yard-org-name {
		flex: 1;
		min-width: 0;
		font-size: 26rpx;
		color: #555555;
		line-height: 36rpx;
	}

	.yard-desc {
		margin-top: 20rpx;
		font-size: 26rpx;
		color: #999999;
		line-height: 40rpx;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 1;
		overflow: hidden;
	}

	.yard-gallery-scroll {
		width: 100%;
		margin-top: 20rpx;
		white-space: nowrap;
	}

	.yard-gallery-row {
		display: flex;
		flex-direction: row;
		padding-bottom: 4rpx;
	}

	.yard-g-item {
		flex-shrink: 0;
		width: 192rpx;
		margin-right: 12rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.yard-g-item:last-child {
		margin-right: 0;
	}

	.yard-g-img {
		width: 192rpx;
		height: 192rpx;
		border-radius: 12rpx;
		background: #f0f0f0;
		display: block;
	}

	.yard-g-cap {
		margin-top: 10rpx;
		font-size: 22rpx;
		color: #666666;
		line-height: 30rpx;
		text-align: center;
		width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
