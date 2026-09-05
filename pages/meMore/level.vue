<template>
	<view class="level-page">
		<!-- #ifndef MP-WEIXIN -->
		<image class="level-top-reference" src="/static/figma/level-top.png" mode="scaleToFill"></image>
		<!-- #endif -->
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-side nav-left" @click.stop="goBack">
					<image class="nav-back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
		</view>

		<view class="main-body">
			<view class="scroll-inner">
				<view class="user-row">
					<view class="user-avatar">
						<text class="user-avatar-txt">逢猫</text>
					</view>
					<text class="user-name">{{ nickname }}</text>
				</view>

				<view class="level-card">
					<text class="level-main">{{ levelMainText }}</text>
					<text class="level-title">{{ levelTitle }}</text>
					<view class="progress-block">
						<view class="progress-top-row">
							<text class="progress-lv-tip">{{ isMax ? 'MAX' : 'LV.' + userLevel }}</text>
						</view>
						<view class="progress-track">
							<view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
						</view>
						<text v-if="!isMax" class="progress-nums">{{ progressNumText }}</text>
					</view>
				</view>

				<view class="stats-row">
					<view class="stat-col">
						<text class="stat-val">{{ formatComma(stats.grainJin) }}斤</text>
						<text class="stat-lab">累计投粮</text>
					</view>
					<view class="stat-col">
						<text class="stat-val">{{ formatComma(stats.feedCatJin) }}天</text>
						<text class="stat-lab">累计喂猫</text>
					</view>
					<view class="stat-col">
						<text class="stat-val">{{ stats.daysOnPlatform }}天</text>
						<text class="stat-lab">来到逢猫</text>
					</view>
				</view>

				<view class="menu-card">
					<view v-for="(row, i) in menuRows" :key="i" class="menu-row"
						:class="{ 'menu-row--last': i === menuRows.length - 1 }" @click="onMenu(row)">
						<text class="menu-txt">{{ row.label }}</text>
						<image class="menu-chevron" src="/static/me/link-chevron.png" mode="aspectFit"></image>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { goBackSmart } from '@/utils/navBack.js'
import { getMemberLevelTitle } from '@/utils/memberLevel.js'


export default {
	data() {
		return {
			statusBarHeight: 20,
			menuRightWidth: 87,
			nickname: '亮亮',
			maxLevel: 8,
			userLevel: 8,
			progressCurrentJin: 20000,
			progressTargetJin: 300000,
			stats: {
				grainJin: 30001,
				feedCatJin: 432,
				daysOnPlatform: 734
			},
			menuRows: [
				{ label: '年度报告', key: 'annual' },
				{ label: '我帮助过的动物', key: 'helped' },
				{ label: '了解等级与升级说明', key: 'rules' }
			]
		}
	},
	computed: {
		isMax() {
			return this.userLevel >= this.maxLevel
		},
		levelMainText() {
			return 'LV.' + this.userLevel
		},
		levelTitle() {
			return getMemberLevelTitle(this.userLevel, this.maxLevel)
		},
		progressPercent() {
			if (this.isMax) return 100
			if (!this.progressTargetJin) return 0
			return Math.min(
				100,
				Math.round((this.progressCurrentJin / this.progressTargetJin) * 1000) / 10
			)
		},
		progressNumText() {
			return this.progressCurrentJin + '斤/' + this.progressTargetJin + '斤'
		}
	},
	onLoad(query) {
		this.layoutScroll()
		if (query && String(query.variant) === '64') {
			this.userLevel = 7
			this.stats = { grainJin: 20001, feedCatJin: 432, daysOnPlatform: 734 }
		}
		if (query && String(query.variant) === '63') {
			this.userLevel = 8
			this.stats = { grainJin: 30001, feedCatJin: 432, daysOnPlatform: 734 }
		}
		if (query && (query.max === '1' || query.max === 'true')) {
			this.userLevel = this.maxLevel
			this.stats = {
				grainJin: 30001,
				feedCatJin: 432,
				daysOnPlatform: 734
			}
		}
		if (query && query.nickname) {
			this.nickname = decodeURIComponent(query.nickname)
		}
	},
	onShow() {
		this.layoutScroll()
	},
	methods: {
		layoutScroll() {
			const sys = uni.getSystemInfoSync()
			this.statusBarHeight = sys.statusBarHeight || 20
			// #ifdef MP-WEIXIN
			try {
				const mb = uni.getMenuButtonBoundingClientRect()
				if (mb && mb.left) {
					this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87)
				}
			} catch (e) { }
			// #endif
		},
		goBack() {
			goBackSmart({ fallbackUrl: '/pages/me/index' })
		},
		formatComma(n) {
			const s = String(Math.round(Number(n) || 0))
			return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
		},
		onMenu(row) {
			if (row.key === 'rules') {
				uni.navigateTo({ url: '/pages/meMore/levelRules' })
				return
			}
			if (row.key === 'annual') {
				uni.navigateTo({ url: '/pages/meMore/annualReport' })
				return
			}
			if (row.key === 'helped') {
				uni.navigateTo({ url: '/pages/meMore/helpedAnimals' })
				return
			}
			uni.showToast({ title: row.label, icon: 'none' })
		}
	}
}
</script>

<style scoped>
.level-page {
	position: relative;
	min-height: 100vh;
	background: linear-gradient(180deg, #fff8e8 0%, #f3f4f6 42%, #f3f4f6 100%);
	box-sizing: border-box;
	padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

.level-top-reference {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100px;
	z-index: 20;
	pointer-events: none;
}

.nav-wrap {
	flex-shrink: 0;
	background: transparent;
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

.main-body {
	width: 100%;
	box-sizing: border-box;
}

.scroll-inner {
	padding: 76rpx 30rpx 48rpx;
	box-sizing: border-box;
}

.user-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	margin-bottom: 40rpx;
	padding-left: 38rpx;
}

.user-avatar {
	width: 108rpx;
	height: 108rpx;
	border-radius: 50%;
	background: #ffe60f;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.user-avatar-txt {
	font-size: 26rpx;
	font-weight: 700;
	color: #111111;
}

.user-name {
	margin-left: 20rpx;
	font-size: 34rpx;
	font-weight: 700;
	color: #111111;
	line-height: 48rpx;
}

.level-card {
	margin-left: 12rpx;
	margin-right: 12rpx;
	border-radius: 28rpx;
	padding: 30rpx 50rpx 12rpx;
	box-sizing: border-box;
	background: linear-gradient(180deg, #ffe20a 0%, #ffe20a 58%, #fffdf0 100%);
	box-shadow: 0 8rpx 32rpx rgba(200, 170, 60, 0.2);
}

.level-main {
	display: block;
	font-size: 64rpx;
	font-weight: 700;
	color: #5d4037;
	line-height: 1.05;
	letter-spacing: 2rpx;
}

.level-title {
	display: block;
	margin-top: 32rpx;
	font-size: 40rpx;
	font-weight: 500;
	color: #6d5344;
	line-height: 40rpx;
}

.progress-block {
	margin-top: 36rpx;
	width: 276rpx;
}

.progress-top-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: flex-start;
	margin-bottom: 10rpx;
	min-height: 36rpx;
}

.progress-lv-tip {
	font-size: 24rpx;
	font-weight: 500;
	color: #5d4037;
	line-height: 34rpx;
}

.progress-track {
	height: 12rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.85);
	overflow: hidden;
}

.progress-fill {
	height: 100%;
	border-radius: 999rpx;
	background: linear-gradient(90deg, #d4a012 0%, #c48f0a 100%);
	max-width: 100%;
}

.progress-nums {
	display: block;
	margin-top: 14rpx;
	font-size: 24rpx;
	color: #6d5344;
	line-height: 34rpx;
}

.stats-row {
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	justify-content: space-between;
	margin-top: 64rpx;
	padding: 0 8rpx;
	box-sizing: border-box;
}

.stat-col {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
}

.stat-val {
	font-size: 50rpx;
	font-weight: 500;
	color: #6d5344;
	line-height: 42rpx;
}

.stat-col:nth-child(2) .stat-val,
.stat-col:last-child .stat-val {
	width: 100rpx;
}

.stat-lab {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #9e9e9e;
	line-height: 32rpx;
}

.menu-card {
	margin-top: 334rpx;
	margin-left: 8rpx;
	margin-right: 8rpx;
	background: #ffffff;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.menu-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	padding: 40rpx 28rpx;
	box-sizing: border-box;
	border-bottom: 1rpx solid #f0f0f0;
}

.menu-row--last {
	border-bottom: none;
}

.menu-txt {
	font-size: 28rpx;
	color: #999999;
	line-height: 40rpx;
}

.menu-chevron {
	width: 24rpx;
	height: 24rpx;
	flex-shrink: 0;
	opacity: 0.45;
}
</style>
