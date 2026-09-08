<template>
	<view class="level-page">
		<PawPageNav background="linear-gradient(180deg, #fffcdc 0%, #ffffff 100%)" fallback-url="/pages/me/index" />

		<scroll-view class="level-scroll" scroll-y :show-scrollbar="false" :enable-flex="true">
			<view class="level-content">
				<view class="user-row" data-qa="qa-level-user">
					<image class="level-avatar" src="/static/figma/level-avatar.png" mode="aspectFit" />
					<text class="user-name">{{ nickname }}</text>
				</view>

				<view class="level-card" data-qa="qa-level-card">
					<view class="level-main" aria-label="当前等级">
						<text class="level-prefix">LV.</text>
						<text class="level-number">{{ userLevel }}</text>
					</view>
					<text class="level-title">{{ levelTitle }}</text>

					<view class="progress-block">
						<text class="progress-label" :class="{ 'progress-label--max': isMax }">{{ isMax ? 'MAX' : 'LV.'
							+ userLevel }}</text>
						<view class="progress-track">
							<view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
						</view>
						<text v-if="!isMax" class="progress-numbers">{{ progressNumText }}</text>
					</view>
				</view>

				<view class="stats-row" data-qa="qa-level-stats">
					<view v-for="stat in statItems" :key="stat.label" class="stat-col">
						<text class="stat-value">{{ stat.value }}</text>
						<text class="stat-label">{{ stat.label }}</text>
					</view>
				</view>

				<view class="menu-card" data-qa="qa-level-menu">
					<view v-for="(row, index) in menuRows" :key="row.key" class="menu-row"
						:data-qa="'qa-level-' + row.key"
						:class="{ 'menu-row--first': index === 0, 'menu-row--last': index === menuRows.length - 1 }"
						@tap.stop="onMenu(row)">
						<text class="menu-text">{{ row.label }}</text>
						<image class="menu-chevron" src="/static/me/link-chevron.png" mode="aspectFit"
							aria-hidden="true" />
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import { getMemberLevelTitle } from '@/utils/memberLevel.js'

export default {
	components: { PawPageNav },
	data() {
		return {
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
		levelTitle() {
			return getMemberLevelTitle(this.userLevel, this.maxLevel)
		},
		progressPercent() {
			if (this.isMax) return 100
			if (!this.progressTargetJin) return 0
			return Math.min(100, Math.round((this.progressCurrentJin / this.progressTargetJin) * 1000) / 10)
		},
		progressNumText() {
			return this.progressCurrentJin + '斤/' + this.progressTargetJin + '斤'
		},
		statItems() {
			return [
				{ value: this.formatComma(this.stats.grainJin) + '斤', label: '累计投粮' },
				{ value: this.formatComma(this.stats.feedCatJin) + '天', label: '累计云养' },
				{ value: this.stats.daysOnPlatform + '天', label: '来到逢猫' }
			]
		}
	},
	onLoad(query) {
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
			this.stats = { grainJin: 30001, feedCatJin: 432, daysOnPlatform: 734 }
		}
		if (query && query.nickname) {
			this.nickname = decodeURIComponent(query.nickname)
		}
	},
	methods: {
		formatComma(value) {
			const text = String(Math.round(Number(value) || 0))
			return text.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
		},
		onMenu(row) {
			const routes = {
				annual: '/pages/meMore/annualReport',
				helped: '/pages/meMore/helpedAnimals',
				rules: '/pages/meMore/levelRules'
			}
			const url = routes[row.key]
			if (url) {
				uni.navigateTo({ url })
				return
			}
			uni.showToast({ title: row.label, icon: 'none' })
		}
	}
}
</script>

<style scoped>
.level-page {
	display: flex;
	flex-direction: column;
	height: 100vh;
	min-height: 0;
	box-sizing: border-box;
	background: linear-gradient(180deg, #fffcdc 0%, #ffffff 43.577%, #f5f5f5 70.813%, #f5f5f5 100%);
}

.level-scroll {
	flex: 1 1 auto;
	height: 0;
	min-height: 0;
	width: 100%;
	box-sizing: border-box;
}

.level-content {
	display: flex;
	flex-direction: column;
	align-items: stretch;
	box-sizing: border-box;
	min-height: 100%;
	padding: 3px 0 48px;
	background: transparent;
}

.user-row {
	display: flex;
	flex: 0 0 auto;
	align-items: center;
	height: 55px;
	padding-left: 32px;
	box-sizing: border-box;
}

.level-avatar {
	display: block;
	flex: 0 0 auto;
	width: 55px;
	height: 55px;
}

.user-name {
	margin-left: 7px;
	color: #333333;
	font-size: 20px;
	font-weight: 700;
	line-height: 28px;
	white-space: nowrap;
}

.level-card {
	display: flex;
	flex: 0 0 auto;
	flex-direction: column;
	box-sizing: border-box;
	width: calc(100% - 43px);
	height: 163px;
	margin: 19px auto 0;
	padding: 6px 24px 0;
	border-radius: 20px;
	background: linear-gradient(180deg, #ffe60f 0%, #ffe60f 53.108%, #ffffff 100%);
	overflow: hidden;
}

.level-main {
	display: flex;
	flex: 0 0 auto;
	align-items: baseline;
	height: 48px;
	color: #6b4a22;
	font-weight: 700;
	line-height: 48px;
}

.level-prefix {
	font-size: 32px;
}

.level-number {
	font-size: 40px;
}

.level-title {
	display: block;
	flex: 0 0 auto;
	margin-top: 10px;
	color: #6b4a22;
	font-size: 20px;
	font-weight: 700;
	line-height: 28px;
	white-space: nowrap;
}

.progress-block {
	display: flex;
	flex: 0 0 auto;
	flex-direction: column;
	align-items: stretch;
	width: 139px;
	margin-top: 15px;
	color: #6b4a22;
}

.progress-label {
	display: block;
	width: 100%;
	height: 12px;
	font-size: 10px;
	font-weight: 700;
	line-height: 12px;
	text-align: left;
}

.progress-label--max {
	text-align: right;
}

.progress-track {
	display: flex;
	flex: 0 0 auto;
	width: 139px;
	height: 3px;
	margin-top: 2px;
	border-radius: 5px;
	background: rgba(255, 255, 255, 0.88);
	overflow: hidden;
}

.progress-fill {
	height: 100%;
	max-width: 100%;
	border-radius: 5px;
	background: #fbc800;
}

.progress-numbers {
	display: block;
	align-self: flex-start;
	margin-top: 2px;
	font-size: 10px;
	font-weight: 400;
	line-height: 12px;
	white-space: nowrap;
}

.stats-row {
	display: flex;
	flex: 0 0 auto;
	align-items: flex-start;
	justify-content: space-between;
	width: calc(100% - 74px);
	margin: 28px auto 0;
	box-sizing: border-box;
}

.stat-col {
	display: flex;
	flex: 0 0 67px;
	flex-direction: column;
	align-items: center;
	width: 67px;
	text-align: center;
}

.stat-value {
	display: block;
	color: #6b4a22;
	font-size: 24px;
	font-weight: 700;
	line-height: 29px;
	white-space: nowrap;
}

.stat-label {
	display: block;
	margin-top: 9px;
	color: #979797;
	font-size: 15px;
	font-weight: 500;
	line-height: 20px;
	white-space: nowrap;
}

.menu-card {
	display: flex;
	flex: 0 0 auto;
	flex-direction: column;
	width: calc(100% - 36px);
	height: 183px;
	margin: 169px auto 0;
	border-radius: 15px;
	background: #ffffff;
	overflow: hidden;
}

.menu-row {
	display: flex;
	flex: 0 0 61px;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	height: 61px;
	padding: 0 15px;
	box-sizing: border-box;
	background: #ffffff;
}

.menu-text {
	flex: 1 1 auto;
	min-width: 0;
	color: #999999;
	font-size: 14px;
	font-weight: 400;
	line-height: 20px;
}

.menu-chevron {
	display: block;
	flex: 0 0 auto;
	width: 7px;
	height: 11px;
	margin-left: 16px;
}
</style>
