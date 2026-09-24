<template>
	<view class="lb-page">
		<PawPageNav title="排行榜" :title-centered="true" :auto-back="false" @back="goBack" />

		<view class="tabs">
			<view v-for="tab in tabList" :key="tab.key" class="tab-item"
				:class="{ 'tab-item--active': activeTab === tab.key }" :style="{ width: tab.width + 'px' }"
				@click="onTabChange(tab.key)">
				<text>{{ tab.label }}</text>
				<view v-if="activeTab === tab.key" class="tab-line"></view>
			</view>
		</view>

		<view class="lb-main">
			<view class="podium-wrap">
				<view class="podium-card podium-card--2">
					<view class="podium-hero">
						<view class="podium-hero-inner" @click.stop="openLbUser(topThree[1])">
							<view class="podium-avatar-ring podium-avatar-ring--blue">
								<image class="podium-avatar" :src="topThree[1].avatar" mode="aspectFill"></image>
							</view>
							<view class="podium-crown-wrap">
								<PawIcon class="podium-crown-img" name="badges/crown-left" :size="21" />
							</view>
						</view>
					</view>
					<view class="podium-card-inner" @click.stop="openLbUser(topThree[1])">
						<view class="podium-name-row">
							<text class="podium-name">{{ topThree[1].name }}</text>
							<LevelBadge :level="topThree[1].lv" />
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
								<PawIcon class="podium-crown-img" name="badges/crown-center" :size="21" />
							</view>
						</view>
					</view>
					<view class="podium-card-inner" @click.stop="openLbUser(topThree[0])">
						<view class="podium-name-row">
							<text class="podium-name">{{ topThree[0].name }}</text>
							<LevelBadge :level="topThree[0].lv" />
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
								<PawIcon key="lb-podium-3-crown" class="podium-crown-img" name="badges/crown-right"
									:size="21" />
							</view>
							<view class="podium-avatar-ring podium-avatar-ring--orange">
								<image key="lb-podium-3-avatar" class="podium-avatar" :src="topThree[2].avatar"
									mode="aspectFill"></image>
							</view>
						</view>
					</view>
					<view class="podium-card-inner" @click.stop="openLbUser(topThree[2])">
						<view class="podium-name-row">
							<text class="podium-name">{{ topThree[2].name }}</text>
							<LevelBadge :level="topThree[2].lv" />
						</view>
						<text class="podium-weight">{{ topThree[2].weight }}斤</text>
						<text class="podium-city">{{ topThree[2].city }}</text>
					</view>
				</view>
			</view>

			<scroll-view class="list-scroll" scroll-y :show-scrollbar="false" :bounces="false" :enable-flex="true">
				<view class="list-card">
					<view v-for="row in rankList" :key="activeTab + '-' + row.rank" class="list-row">
						<text class="list-rank">{{ row.rank }}</text>
						<image class="list-avatar" :src="row.avatar || '/static/user.png'" mode="aspectFill"
							@click.stop="openLbUser(row)"></image>
						<view class="list-main-line">
							<view class="list-name-with-lv" @click.stop="openLbUser(row)">
								<text class="list-name">{{ row.name }}</text>
								<LevelBadge :level="row.lv" />
							</view>
							<view class="list-metrics">
								<text class="list-weight">{{ row.weight }}斤</text>
								<text class="list-city">{{ row.city }}</text>
							</view>
						</view>
					</view>
				</view>
				<view class="list-bottom-spacer" aria-hidden="true"></view>
			</scroll-view>
		</view>

		<view class="footer">
			<image class="footer-avatar" src="/static/figma/brand-logo.png" mode="aspectFill"
				@click.stop="openLbUser(selfRow)"></image>
			<view class="footer-mid" @click.stop="openLbUser(selfRow)">
				<text class="footer-name">{{ selfRow.name }}</text>
				<LevelBadge :level="selfRow.lv" />
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

<script lang="ts">
import { defineComponent } from 'vue'

import { openUserProfile } from '@/utils/profileNav.ts'
import { goBackSmart } from '@/utils/navBack.ts'
import LevelBadge from '@/components/customBadge/LevelBadge.vue'
import PawPageNav from '@/components/PawPageNav.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import { createLeaderboardBoard, createLeaderboardPageMetadata } from '../../services/rankingMetadata.ts'
import type { LeaderboardItem, LeaderboardPageState, LeaderboardTabKey } from '../../services/rankingMetadata.ts'

export default defineComponent({
	components: { LevelBadge, PawPageNav, PawIcon },
	data(): LeaderboardPageState {
		return createLeaderboardPageMetadata()
	},
	onLoad() { },
	methods: {
		goBack() {
			goBackSmart({ fallbackUrl: '/pages/index/index' })
		},
		openLbUser(row: LeaderboardItem) {
			if (!row || !row.name) return
			openUserProfile({
				pawId: row.pawId || 'lb-' + this.activeTab + '-' + (row.rank != null ? row.rank : row.name),
				nickname: row.name,
				avatar: row.avatar || '/static/user.png'
			})
		},
		onTabChange(key: LeaderboardTabKey) {
			if (key === this.activeTab) return
			const next = createLeaderboardBoard(key)
			this.activeTab = key
			this.topThree = next.topThree
			this.rankList = next.rankList
			this.selfRow = next.selfRow
		}
	}
})
</script>

<style scoped>
.lb-page {
	position: relative;
	height: 100vh;
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
	background: linear-gradient(180deg, #fffef4 0%, #f4f4f4 100%);
	font-family: "Source Han Sans CN", "PingFang SC", sans-serif;
}

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
	flex: 0 0 26px;
	width: 330px;
	height: 26px;
	margin: 7px auto 0;
	display: flex;
	flex-direction: row;
	align-items: stretch;
	justify-content: flex-start;
	gap: 20px;
	padding: 0;
	box-sizing: border-box;
}

.tab-item {
	position: relative;
	flex: 0 0 auto;
	height: 26px;
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	padding: 0;
	box-sizing: border-box;
}

.tab-item text {
	font-size: 15px;
	font-weight: 400;
	line-height: 22px;
	color: #999;
	white-space: nowrap;
}

.tab-item--active text {
	color: #333;
	font-weight: 500;
}

.tab-line {
	position: absolute;
	left: 50%;
	bottom: 0;
	width: 56px;
	height: 4px;
	margin: 0;
	border-radius: 2px;
	background: #ffe60d;
	transform: translateX(-50%);
}

.lb-main {
	flex: 1;
	min-height: 0;
	margin-top: 8px;
	display: flex;
	flex-direction: column;
	position: relative;
	background: transparent;
}

.podium-wrap {
	position: relative;
	flex: 0 0 219px;
	width: 100%;
	height: 219px;
	padding: 0;
	box-sizing: border-box;
}

.podium-card {
	position: absolute;
	width: 105px;
	height: 136px;
	padding: 0;
	border-radius: 20px 20px 0 0;
	box-sizing: border-box;
	overflow: visible;
}

/* 亚军、季军：同高，底边与冠军对齐（podium-wrap align-items: flex-end） */
.podium-card--2,
.podium-card--3 {
	display: block;
}

.podium-card--2 {
	left: calc(50% - 155.5px);
	top: 71px;
	background: linear-gradient(180deg, #87f9fa 0%, #fafaf4 93.015%);
}

/* 冠军：比两侧更高，底边同一水平线；文字在上，下方留白由渐变过渡到白 */
.podium-card--1 {
	left: calc(50% - 50.5px);
	top: 43px;
	width: 105px;
	height: 164px;
	z-index: 2;
	background: linear-gradient(180deg, #fff464 0%, #fafaf4 100%);
}

.podium-card--3 {
	left: calc(50% + 54.5px);
	top: 80px;
	background: linear-gradient(180deg, #ffce7a 0%, #fafaf4 87.868%);
}

.podium-hero {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 0;
	z-index: 3;
	pointer-events: none;
}

.podium-hero-inner {
	position: absolute;
	left: 50%;
	top: -12.5px;
	width: 47px;
	height: 47px;
	transform: translateX(-50%);
	pointer-events: auto;
}

.podium-hero-inner--champ {
	left: calc(50% - 2px);
	top: -27px;
	width: 65px;
	height: 67px;
}

/* 用固定尺寸容器包一层，避免小程序里绝对定位的 image 误撑满父级（第三名曾出现皇冠/头像层级错乱） */
.podium-crown-wrap {
	position: absolute;
	left: -5px;
	top: 0;
	width: 21px;
	height: 21px;
	z-index: 3;
	pointer-events: none;
	overflow: visible;
}

.podium-crown-wrap--champ {
	left: 0;
	top: 10px;
}

.podium-crown-img {
	width: 100%;
	height: 100%;
	display: block;
}

.podium-avatar-ring {
	position: absolute;
	left: 0;
	top: 0;
	width: 47px;
	height: 47px;
	border: 3px solid transparent;
	border-radius: 50%;
	box-sizing: border-box;
	overflow: hidden;
	background: #fff;
	z-index: 2;
}

.podium-hero-inner--champ .podium-avatar-ring {
	left: 5px;
	top: 7px;
	width: 60px;
	height: 60px;
}

.podium-avatar-ring--blue {
	border-color: #58c7d6;
}

.podium-avatar-ring--gold {
	border-color: #e9bb25;
}

.podium-avatar-ring--orange {
	border-color: #f29a4b;
}

.podium-avatar {
	width: 100%;
	height: 100%;
	border-radius: 50%;
	display: block;
}

.podium-card-inner {
	position: absolute;
	left: 0;
	right: 0;
	top: 49px;
	z-index: 6;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 0;
	margin: 0;
	box-sizing: border-box;
}

.podium-card--1 .podium-card-inner {
	top: 52px;
}

.podium-name-row {
	max-width: 100%;
	height: 16px;
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	flex-wrap: nowrap;
	gap: 2px;
	padding: 0;
	box-sizing: border-box;
}

.podium-name {
	max-width: 9em;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 11px;
	font-weight: 400;
	line-height: 16px;
	color: #333;
}

.podium-weight {
	margin-top: 1px;
	font-size: 18px;
	font-weight: 700;
	line-height: 26px;
	color: #6b4a22;
}

.podium-city {
	margin-top: 4px;
	font-size: 12px;
	font-weight: 400;
	line-height: 17px;
	color: #6b4a22;
}

.list-scroll {
	flex: 1;
	min-height: 0;
	width: 100%;
	box-sizing: border-box;
}

.list-card {
	position: relative;
	z-index: 4;
	width: 100%;
	min-height: 461px;
	margin: 0;
	padding: 11px 0 29px;
	background: #fff;
	border-radius: 17px 17px 0 0;
	box-sizing: border-box;
	overflow: hidden;
}

/* 为固定的个人排名卡预留滚动余量，避免遮住榜单末尾的数据 */
.list-bottom-spacer {
	flex: 0 0 96px;
	height: 96px;
	width: 100%;
	background: #fff;
}

.list-row {
	position: relative;
	width: 100%;
	height: 56px;
	padding: 0;
	display: flex;
	flex-direction: row;
	align-items: center;
	box-sizing: border-box;
}

.list-rank {
	position: absolute;
	left: 26px;
	top: 13px;
	width: 24px;
	height: 29px;
	font-family: var(--paw-font-family, -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif);
	font-size: 20px;
	font-weight: 700;
	line-height: 29px;
	color: #202221;
}

.list-avatar {
	position: absolute;
	left: 63px;
	top: 0;
	width: 35px;
	height: 35px;
	margin: 0;
	border-radius: 50%;
}

.list-main-line {
	position: absolute;
	left: 110px;
	right: 15px;
	top: 0;
	height: 35px;
	margin: 0;
	display: block;
	box-sizing: border-box;
}

/* 用户名与等级紧邻 */
.list-name-with-lv {
	position: absolute;
	left: 0;
	top: 0;
	max-width: 150px;
	height: 35px;
	display: flex;
	flex-direction: row;
	align-items: center;
	flex-wrap: nowrap;
	gap: 3px;
}

.list-name {
	min-width: 0;
	max-width: 120px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 14px;
	font-weight: 400;
	line-height: 20px;
	color: #202221;
}

/* 与左侧昵称区拉开一段距离；斤与城市之间再留空 */
.list-metrics {
	position: absolute;
	right: 0;
	top: 0;
	height: 35px;
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 31px;
	white-space: nowrap;
}

.list-weight {
	font-size: 15px;
	font-weight: 500;
	line-height: 20px;
	color: #6b4a22;
}

.list-city {
	font-size: 12px;
	font-weight: 500;
	line-height: 17px;
	color: #6b4a22;
}

.footer {
	position: absolute;
	left: 13px;
	right: 13px;
	bottom: 33px;
	height: 109px;
	z-index: 20;
	box-sizing: border-box;
	background: linear-gradient(180deg, rgba(215, 254, 253, 0.78), rgba(255, 255, 255, 0.72));
	border: 0;
	border-radius: 15px;
	box-shadow: inset 0 0 25px rgba(255, 255, 255, 0.84), inset 0 -10px 22px rgba(164, 235, 232, 0.16);
}

.footer-avatar {
	position: absolute;
	left: 28px;
	top: 11px;
	width: 40px;
	height: 40px;
	border-radius: 50%;
}

.footer-mid {
	position: absolute;
	left: 78px;
	top: 11px;
	height: 33px;
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 4px;
	margin: 0;
}

.footer-name {
	max-width: 160rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 23px;
	font-weight: 500;
	line-height: 33px;
	color: #202221;
}

.footer-cols {
	position: absolute;
	left: 38px;
	right: 38px;
	top: 57px;
	height: 46px;
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	justify-content: space-between;
	margin: 0;
}

.footer-col {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.footer-col-main {
	font-size: 18px;
	font-weight: 700;
	line-height: 26px;
	color: #202221;
}

.footer-col-sub {
	margin-top: 2px;
	font-size: 12px;
	font-weight: 400;
	line-height: 17px;
	color: #515151;
}
</style>
