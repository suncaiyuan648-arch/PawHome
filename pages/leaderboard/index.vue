<template>
	<view class="lb-page">
		<!-- #ifndef MP-WEIXIN -->
		<image class="h5-status-bar" src="/static/figma/leaderboard-top.png" mode="scaleToFill"></image>
		<!-- #endif -->
		<PawPageNav title="排行榜" :auto-back="false" @back="goBack" />

		<view class="tabs">
			<view
				v-for="tab in tabList"
				:key="tab.key"
				class="tab-item"
				:class="{ 'tab-item--active': activeTab === tab.key }"
				@click="onTabChange(tab.key)"
			>
				<text>{{ tab.label }}</text>
				<view v-if="activeTab === tab.key" class="tab-line"></view>
			</view>
		</view>

		<view class="lb-main">
			<view v-if="tabLoading" class="lb-tab-loading">
				<view class="lb-tab-loading-spinner"></view>
				<text class="lb-tab-loading-txt">加载中</text>
			</view>

		<view class="podium-wrap" :class="{ 'lb-content--dim': tabLoading }">
			<view class="podium-card podium-card--2">
				<view class="podium-hero">
					<view class="podium-hero-inner" @click.stop="openLbUser(topThree[1])">
						<view class="podium-avatar-ring podium-avatar-ring--blue">
							<image class="podium-avatar" :src="topThree[1].avatar" mode="aspectFill"></image>
						</view>
						<view class="podium-crown-wrap">
							<image class="podium-crown-img" src="/static/leaderboard-crown.png" mode="aspectFit"></image>
						</view>
					</view>
				</view>
				<view class="podium-card-inner" @click.stop="openLbUser(topThree[1])">
					<view class="podium-name-row">
						<text class="podium-name">{{ topThree[1].name }}</text>
						<LevelCapsule :level="topThree[1].lv" />
					</view>
					<text class="podium-weight">{{ topThree[1].weight }}斤</text>
					<text class="podium-city">{{ topThree[1].city }}</text>
				</view>
			</view>
			<view class="podium-card podium-card--1">
				<view class="podium-hero podium-hero--champ">
					<view class="podium-hero-inner podium-hero-inner--champ" @click.stop="openLbUser(topThree[0])">
						<view class="podium-avatar-ring podium-avatar-ring--gold">
							<image class="podium-avatar" :src="topThree[0].avatar" mode="aspectFill"></image>
						</view>
						<view class="podium-crown-wrap podium-crown-wrap--champ">
							<image class="podium-crown-img" src="/static/leaderboard-crown.png" mode="aspectFit"></image>
						</view>
					</view>
				</view>
				<view class="podium-card-inner" @click.stop="openLbUser(topThree[0])">
					<view class="podium-name-row">
						<text class="podium-name">{{ topThree[0].name }}</text>
						<LevelCapsule :level="topThree[0].lv" />
					</view>
					<text class="podium-weight">{{ topThree[0].weight }}斤</text>
					<text class="podium-city">{{ topThree[0].city }}</text>
				</view>
			</view>
			<view class="podium-card podium-card--3">
				<view class="podium-hero">
					<!-- 季军：皇冠容器在前、头像环在后 + 唯一 key，避免微信端同级 image 复用导致资源串到对方（1、2 名勿改） -->
					<view class="podium-hero-inner podium-hero-inner--third" @click.stop="openLbUser(topThree[2])">
						<view class="podium-crown-wrap">
							<image
								key="lb-podium-3-crown"
								class="podium-crown-img"
								src="/static/leaderboard-crown.png"
								mode="aspectFit"
							></image>
						</view>
						<view class="podium-avatar-ring podium-avatar-ring--orange">
							<image
								key="lb-podium-3-avatar"
								class="podium-avatar"
								:src="topThree[2].avatar"
								mode="aspectFill"
							></image>
						</view>
					</view>
				</view>
				<view class="podium-card-inner" @click.stop="openLbUser(topThree[2])">
					<view class="podium-name-row">
						<text class="podium-name">{{ topThree[2].name }}</text>
						<LevelCapsule :level="topThree[2].lv" />
					</view>
					<text class="podium-weight">{{ topThree[2].weight }}斤</text>
					<text class="podium-city">{{ topThree[2].city }}</text>
				</view>
			</view>
		</view>

		<scroll-view
			class="list-scroll"
			:class="{ 'lb-content--dim': tabLoading }"
			scroll-y
			:show-scrollbar="false"
			:bounces="false"
			:enable-flex="true"
		>
			<view class="list-card">
				<view v-for="row in rankList" :key="activeTab + '-' + row.rank" class="list-row">
					<text class="list-rank">{{ row.rank }}</text>
					<image
						class="list-avatar"
						:src="row.avatar || '/static/user.png'"
						mode="aspectFill"
						@click.stop="openLbUser(row)"
					></image>
					<view class="list-main-line">
						<view class="list-name-with-lv" @click.stop="openLbUser(row)">
							<text class="list-name">{{ row.name }}</text>
							<LevelCapsule :level="row.lv" />
						</view>
						<view class="list-metrics">
							<text class="list-weight">{{ row.weight }}斤</text>
							<text class="list-city">{{ row.city }}</text>
						</view>
					</view>
				</view>
			</view>
			<view class="list-pad-bottom"></view>
		</scroll-view>
		</view>

		<view class="footer" :class="{ 'lb-content--dim': tabLoading }">
			<image class="footer-avatar" src="/static/figma/brand-logo.png" mode="aspectFill" @click.stop="openLbUser(selfRow)"></image>
			<view class="footer-mid" @click.stop="openLbUser(selfRow)">
				<text class="footer-name">{{ selfRow.name }}</text>
				<LevelCapsule :level="selfRow.lv" />
			</view>
			<view class="footer-cols">
				<view class="footer-col">
					<text class="footer-col-main">{{ selfRow.rankLabel }}</text>
					<text class="footer-col-sub">排名</text>
				</view>
				<view class="footer-col">
					<text class="footer-col-main">{{ selfRow.weight }}斤</text>
					<text class="footer-col-sub">投粮</text>
				</view>
				<view class="footer-col">
					<text class="footer-col-main">{{ selfRow.city }}</text>
					<text class="footer-col-sub">城市</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { openUserProfile } from '@/utils/profileNav.js'
import { goBackSmart } from '@/utils/navBack.js'
import LevelCapsule from '@/components/LevelCapsule.vue'
import PawPageNav from '@/components/PawPageNav.vue'

function cloneBoard(payload) {
	return {
		topThree: payload.topThree.map((x) => ({ ...x })),
		rankList: payload.rankList.map((x) => ({ ...x })),
		selfRow: { ...payload.selfRow }
	}
}

/** 各 Tab 独立 mock，对接接口后改为请求返回 */
const TAB_BOARD = {
	day_feed: {
		topThree: [
			{ name: '项子涵', lv: 1, weight: '499', city: '长沙', avatar:'/static/figma/leaderboard-top-1.png' },
			{ name: '项子涵大王', lv: 1, weight: '499', city: '长沙', avatar:'/static/figma/leaderboard-top-2.png' },
			{ name: '平头大王', lv: 1, weight: '499', city: '长沙', avatar:'/static/figma/leaderboard-top-3.png' }
		],
		rankList: [
			{ rank: 4, name: '项子涵186..', lv: 1, weight: '49319', city: '长沙', avatar:'/static/figma/feature/bf6cfd188d6671b8e283e5e5563ece9da7dc2ef8.jpg' },
			{ rank: 5, name: '项子涵', lv: 1, weight: '499', city: '长沙', avatar:'/static/figma/feature/e1f65d79bfde8d6fc9cf263e86080d08f13770fc.jpg' },
			{ rank: 6, name: '项子', lv: 1, weight: '499', city: '长沙', avatar:'/static/figma/feature/92204562aae4aec0c460d32bdc61d58f52e24268.jpg' },
			{ rank: 7, name: '花开富贵', lv: 1, weight: '499', city: '长沙', avatar:'/static/figma/feature/66fd0f7323c88fa771f5da9f675372febcc335ba.jpg' },
			{ rank: 8, name: '平安是福', lv: 1, weight: '499', city: '长沙', avatar:'/static/figma/feature/24a1e03cab61f32251063e6be98887860b879349.jpg' },
			{ rank: 9, name: '晴朗', lv: 1, weight: '499', city: '长沙', avatar:'/static/figma/feature/7266b7871b03ce7a570811a13cbbd71e61491f75.jpg' },
			{ rank: 10, name: '爱心小院', lv: 1, weight: '26543', city: '郑州' },
			{ rank: 11, name: '夜猫子联盟', lv: 1, weight: '24120', city: '重庆' },
			{ rank: 12, name: '投喂小分队', lv: 2, weight: '22001', city: '苏州' }
		],
		selfRow: { name: '逢猫', lv: 1, rankLabel: '未上榜', weight: '5796', city: '长沙' }
	},
	year_feed: {
		topThree: [
			{ name: '晨光小院', lv: 8, weight: '58240', city: '杭州' },
			{ name: '北风投喂站', lv: 6, weight: '49812', city: '北京' },
			{ name: '南岸猫猫屋', lv: 7, weight: '45106', city: '重庆' }
		],
		rankList: [
			{ rank: 4, name: '岁岁平安喵', lv: 5, weight: '428880', city: '成都' },
			{ rank: 5, name: '江海CatHouse', lv: 4, weight: '401256', city: '青岛' },
			{ rank: 6, name: '云端投喂计划', lv: 6, weight: '389440', city: '广州' },
			{ rank: 7, name: '老街喂猫团', lv: 3, weight: '356102', city: '西安' },
			{ rank: 8, name: '小城故事多', lv: 5, weight: '312980', city: '昆明' },
			{ rank: 9, name: '午后阳光院', lv: 4, weight: '298556', city: '厦门' },
			{ rank: 10, name: '城北暖心窝', lv: 2, weight: '265340', city: '天津' },
			{ rank: 11, name: '枫叶小院', lv: 5, weight: '241888', city: '大连' },
			{ rank: 12, name: '巷口喵喵亭', lv: 3, weight: '220060', city: '苏州' }
		],
		selfRow: { name: '逢猫', lv: 1, rankLabel: '第128名', weight: '182340', city: '长沙' }
	},
	day_gain: {
		topThree: [
			{ name: '小院掌柜老李', lv: 4, weight: '168', city: '武汉' },
			{ name: '猫咪驿站阿珍', lv: 3, weight: '142', city: '郑州' },
			{ name: '东门投喂点', lv: 2, weight: '126', city: '合肥' }
		],
		rankList: [
			{ rank: 4, name: '邻里喵食堂', lv: 2, weight: '119', city: '南昌' },
			{ rank: 5, name: '城西小院', lv: 3, weight: '105', city: '石家庄' },
			{ rank: 6, name: '暖冬小院', lv: 1, weight: '98', city: '太原' },
			{ rank: 7, name: '梧桐树下', lv: 4, weight: '92', city: '南宁' },
			{ rank: 8, name: '狸花分部', lv: 2, weight: '86', city: '贵阳' },
			{ rank: 9, name: '善意小院', lv: 1, weight: '79', city: '海口' },
			{ rank: 10, name: '小鱼干补给站', lv: 3, weight: '71', city: '兰州' },
			{ rank: 11, name: '巷尾橘座', lv: 2, weight: '64', city: '银川' },
			{ rank: 12, name: '口袋猫粮库', lv: 1, weight: '58', city: '西宁' }
		],
		selfRow: { name: '逢猫', lv: 1, rankLabel: '第56名', weight: '206', city: '长沙' }
	},
	year_gain: {
		topThree: [
			{ name: '星辰小院', lv: 9, weight: '8960', city: '上海' },
			{ name: '流浪港湾', lv: 7, weight: '7420', city: '深圳' },
			{ name: '四季如春院', lv: 8, weight: '6812', city: '昆明' }
		],
		rankList: [
			{ rank: 4, name: '和风喵喵屋', lv: 6, weight: '6244', city: '无锡' },
			{ rank: 5, name: '青石巷小院', lv: 5, weight: '5890', city: '洛阳' },
			{ rank: 6, name: '椰林投喂站', lv: 4, weight: '5518', city: '三亚' },
			{ rank: 7, name: '暖阳补给台', lv: 6, weight: '5102', city: '哈尔滨' },
			{ rank: 8, name: '银杏小院', lv: 3, weight: '4788', city: '长春' },
			{ rank: 9, name: '烟火气小院', lv: 5, weight: '4396', city: '沈阳' },
			{ rank: 10, name: '江边小猫亭', lv: 4, weight: '4022', city: '福州' },
			{ rank: 11, name: '竹篱小院', lv: 2, weight: '3688', city: '温州' },
			{ rank: 12, name: '归巢小院', lv: 5, weight: '3310', city: '宁波' }
		],
		selfRow: { name: '逢猫', lv: 1, rankLabel: '第402名', weight: '28960', city: '长沙' }
	}
}

export default {
	components: { LevelCapsule, PawPageNav },
	data() {
		const initial = cloneBoard(TAB_BOARD.day_feed)
		return {
			activeTab: 'day_feed',
			tabLoading: false,
			_tabLoadTimer: null,
			tabList: [
				{ key: 'day_feed', label: '日投粮榜' },
				{ key: 'year_feed', label: '年投粮榜' },
				{ key: 'day_gain', label: '日获粮榜' },
				{ key: 'year_gain', label: '年获粮榜' }
			],
			topThree: initial.topThree,
			rankList: initial.rankList,
			selfRow: initial.selfRow
		}
	},
	onLoad() {},
	beforeDestroy() {
		if (this._tabLoadTimer) {
			clearTimeout(this._tabLoadTimer)
			this._tabLoadTimer = null
		}
	},
	methods: {
		goBack() {
			goBackSmart({ fallbackUrl: '/pages/index/index' })
		},
		openLbUser(row) {
			if (!row || !row.name) return
			openUserProfile({
				pawId: row.pawId || 'lb-' + this.activeTab + '-' + (row.rank != null ? row.rank : row.name),
				nickname: row.name,
				avatar: row.avatar || '/static/user.png'
			})
		},
		onTabChange(key) {
			if (key === this.activeTab || this.tabLoading) return
			this.activeTab = key
			this.tabLoading = true
			if (this._tabLoadTimer) clearTimeout(this._tabLoadTimer)
			this._tabLoadTimer = setTimeout(() => {
				const pack = TAB_BOARD[key]
				if (pack) {
					const next = cloneBoard(pack)
					this.topThree = next.topThree
					this.rankList = next.rankList
					this.selfRow = next.selfRow
				}
				this.tabLoading = false
				this._tabLoadTimer = null
			}, 520)
		}
	}
}
</script>

<style scoped>
.lb-page {
	position:relative;
	height: 100vh;
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	background: linear-gradient(180deg, #fffdf5 0%, #fffdf7 50%, #f8f8f8 100%);
	box-sizing: border-box;
}
.h5-status-bar{position:absolute;left:0;top:0;width:100%;height:128px;z-index:100;pointer-events:none}

.nav-wrap {
	flex-shrink: 0;
	background: transparent;
}

.nav-row {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-left: 8rpx;
	box-sizing: border-box;
}

.nav-left {
	width: 80rpx;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.nav-back-icon {
	width: 20rpx;
	height: 36rpx;
}

.nav-title {
	position: absolute;
	left: 50%;
	transform: translateX(-50%);
	font-size: 34rpx;
	font-weight: 500;
	color: #1a1a1a;
}

.nav-cap-spacer,
.nav-right {
	flex-shrink: 0;
	height: 1px;
}

.tabs {
	flex-shrink: 0;
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-around;
	padding: 8rpx 12rpx 0;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.06);
}

.tab-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-bottom: 12rpx;
}

.tab-item text {
	font-size: 26rpx;
	color: #8a8a8a;
}

.tab-item--active text {
	color: #1a1a1a;
	font-weight: 500;
}

.tab-line {
	margin-top: 8rpx;
	width: 48rpx;
	height: 6rpx;
	border-radius: 3rpx;
	background: #ffd60a;
}

.lb-main {
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
	position: relative;
}

.lb-tab-loading {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	z-index: 20;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: rgba(255, 248, 232, 0.82);
	pointer-events: none;
}

.lb-tab-loading-spinner {
	width: 52rpx;
	height: 52rpx;
	border: 4rpx solid rgba(0, 0, 0, 0.06);
	border-top-color: #e8b41a;
	border-radius: 50%;
	animation: lb-tab-spin 0.7s linear infinite;
}

.lb-tab-loading-txt {
	margin-top: 14rpx;
	font-size: 24rpx;
	color: #888;
}

@keyframes lb-tab-spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

.lb-content--dim {
	opacity: 0.4;
	transition: opacity 0.2s ease;
}

.podium-wrap {
	flex-shrink: 0;
	display: flex;
	flex-direction: row;
	align-items: flex-end;
	justify-content: center;
	padding: 76rpx 0 0;
	gap: 8rpx;
	box-sizing: border-box;
}

.podium-card {
	flex: 0 0 212rpx;
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	justify-content: flex-start;
	border-radius: 28rpx 28rpx 0 0;
	overflow: visible;
	box-sizing: border-box;
	padding: 0 8rpx 28rpx;
}

/* 亚军、季军：同高，底边与冠军对齐（podium-wrap align-items: flex-end） */
.podium-card--2,
.podium-card--3 {
	min-height: 300rpx;
}

.podium-card--2 {
	background: linear-gradient(180deg, #c5e0fb 0%, #eaf4ff 48%, #ffffff 92%, #ffffff 100%);
	box-shadow: 0 8rpx 24rpx rgba(100, 160, 220, 0.12);
}

/* 冠军：比两侧更高，底边同一水平线；文字在上，下方留白由渐变过渡到白 */
.podium-card--1 {
	flex: 0 0 224rpx;
	min-height: 352rpx;
	margin-top: 0;
	padding-bottom: 28rpx;
	transform: none;
	z-index: 2;
	background: linear-gradient(
		180deg,
		#ffe566 0%,
		#ffeb8a 22%,
		#fff4c4 42%,
		#fffce8 62%,
		#fffef8 78%,
		#ffffff 90%,
		#ffffff 100%
	);
	box-shadow: 0 12rpx 32rpx rgba(230, 180, 40, 0.18);
}

.podium-card--3 {
	background: linear-gradient(180deg, #ffc8a0 0%, #fff0e6 48%, #ffffff 92%, #ffffff 100%);
	box-shadow: 0 8rpx 24rpx rgba(230, 140, 80, 0.12);
}

.podium-hero {
	position: absolute;
	left: 50%;
	top: 0;
	transform: translate(-50%, -26%);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 3;
	pointer-events: none;
}

.podium-hero-inner {
	position: relative;
	width: 96rpx;
	height: 96rpx;
}

.podium-hero-inner--champ {
	width: 112rpx;
	height: 112rpx;
}

/* 用固定尺寸容器包一层，避免小程序里绝对定位的 image 误撑满父级（第三名曾出现皇冠/头像层级错乱） */
.podium-crown-wrap {
	position: absolute;
	left: -8rpx;
	top: -20rpx;
	width: 44rpx;
	height: 44rpx;
	z-index: 5;
	pointer-events: none;
	overflow: hidden;
}

.podium-crown-wrap--champ {
	width: 50rpx;
	height: 50rpx;
	left: -6rpx;
	top: -22rpx;
}

.podium-crown-img {
	width: 100%;
	height: 100%;
	display: block;
}

.podium-avatar-ring {
	position: relative;
	z-index: 1;
	width: 96rpx;
	height: 96rpx;
	border-radius: 50%;
	box-sizing: border-box;
	overflow: hidden;
	background: #fff;
}

.podium-hero-inner--champ .podium-avatar-ring {
	width: 112rpx;
	height: 112rpx;
}

.podium-avatar-ring--blue {
	border: 6rpx solid #5ba8f0;
}

.podium-avatar-ring--gold {
	border: 7rpx solid #e8b41a;
}

.podium-avatar-ring--orange {
	border: 6rpx solid #f08848;
}

.podium-avatar {
	width: 100%;
	height: 100%;
	border-radius: 50%;
	display: block;
}

.podium-card-inner {
	margin-top: 84rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	flex: 0 0 auto;
	padding-top: 8rpx;
	padding-bottom: 4rpx;
	position: relative;
	z-index: 6;
}

.podium-card--1 .podium-card-inner {
	margin-top: 90rpx;
	padding-top: 8rpx;
}

.podium-name-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	flex-wrap: nowrap;
	max-width: 100%;
	padding: 0 4rpx;
	box-sizing: border-box;
	column-gap: 8rpx;
}

.podium-name {
	font-size: 26rpx;
	font-weight: 500;
	color: #1a1a1a;
	max-width: 9em;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.podium-name-row .lv-cap {
	flex-shrink: 0;
}

.podium-weight {
	margin-top: 16rpx;
	font-size: 36rpx;
	font-weight: 800;
	color: #6b4a22;
	letter-spacing: -0.5rpx;
}

.podium-city {
	margin-top: 10rpx;
	font-size: 22rpx;
	color: #6b4a22;
}

.list-scroll {
	flex: 1;
	min-height: 0;
	width: 100%;
	box-sizing: border-box;
}

.list-card {
	margin: 0 16rpx;
	position: relative;
	z-index: 4;
	background: #fff;
	border-radius: 24rpx 24rpx 0 0;
	overflow: hidden;
	box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.list-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	padding: 20rpx 36rpx;
	border-bottom: 1rpx solid #f2f2f2;
	box-sizing: border-box;
}

.list-row:last-child {
	border-bottom: none;
}

.list-rank {
	width: 64rpx;
	font-family: var(--paw-font-family, -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif);
	font-size: 40rpx;
	font-weight: 700;
	color: #202221;
	flex-shrink: 0;
}

.list-avatar {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	margin-left: 26rpx;
	flex-shrink: 0;
}

.list-main-line {
	flex: 1;
	min-width: 0;
	margin-left: 24rpx;
	display: flex;
	flex-direction: row;
	align-items: center;
	flex-wrap: nowrap;
}

/* 用户名与等级紧邻 */
.list-name-with-lv {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: row;
	align-items: center;
	flex-wrap: nowrap;
	column-gap: 8rpx;
}

.list-name {
	flex: 0 1 auto;
	min-width: 0;
	max-width: 100%;
	font-size: 28rpx;
	font-weight: 500;
	color: #222;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.list-name-with-lv .lv-cap {
	flex-shrink: 0;
}

/* 与左侧昵称区拉开一段距离；斤与城市之间再留空 */
.list-metrics {
	flex-shrink: 0;
	display: flex;
	flex-direction: row;
	align-items: center;
	flex-wrap: nowrap;
	margin-left: 36rpx;
	column-gap: 28rpx;
}

.list-weight {
	font-size: 28rpx;
	font-weight: 700;
	color: #6b4a22;
}

.list-city {
	font-size: 24rpx;
	color: #6b4a22;
}

.list-pad-bottom {
	height: 24rpx;
}

.footer {
	position:absolute;
	left:14px;
	right:14px;
	bottom:0;
	height:140px;
	z-index:20;
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	padding: 16px 18px 0;
	background: linear-gradient(90deg, #e8fbfb, #f7ffff);
	border-radius:12px 12px 0 0;
	border-top: 1rpx solid rgba(0, 0, 0, 0.06);
	box-sizing: border-box;
}

.footer-avatar {
	width: 96rpx;
	height: 96rpx;
	border-radius: 50%;
	flex-shrink: 0;
}

.footer-mid {
	margin-left: 22rpx;
	display: flex;
	flex-direction: row;
	align-items: center;
	flex-wrap: nowrap;
	column-gap: 10rpx;
	min-width: 0;
	flex-shrink: 0;
}

.footer-mid .lv-cap {
	flex-shrink: 0;
}

.footer-name {
	font-size: 44rpx;
	font-weight: 500;
	color: #222;
	max-width: 160rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.footer-cols {
	position:absolute;
	left:18px;
	right:14px;
	top:57px;
	display: flex;
	flex-direction: row;
	justify-content: space-around;
	align-items: center;
	margin-left: 0;
}

.footer-col {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.footer-col-main {
	font-size: 40rpx;
	font-weight: 500;
	color: #1a5080;
}

.footer-col-sub { margin-top:4rpx; color:#777; font-size:22rpx; }

.footer-col:nth-child(2) .footer-col-main,
.footer-col:nth-child(3) .footer-col-main {
	color: #6b4a22;
}
</style>
