<template>
	<view class="rules-page">
		<!-- #ifndef MP-WEIXIN -->
		<image class="h5-level-top" src="/static/figma/level-rules-top.png" mode="scaleToFill"></image>
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
				<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
		</view>

		<view class="main-body">
			<view class="card">
				<text class="card-h1">升级说明</text>

				<text class="sec-title">基础说明</text>
				<view class="bullet">
					<text class="bullet-dot">·</text>
					<text class="bullet-txt">最高账号等级为8级，封顶后不再升级，但继续累计；</text>
				</view>

				<text class="sec-title">投喂量计算</text>
				<view class="bullet">
					<text class="bullet-dot">·</text>
					<text class="bullet-txt">投喂量和喂猫量将叠加计算；</text>
				</view>
				<view class="bullet">
					<text class="bullet-dot">·</text>
					<text class="bullet-txt">同一账号在iOS、安卓、小程序的投喂量都会纳入统计；</text>
				</view>
				<view class="bullet">
					<text class="bullet-dot">·</text>
					<text class="bullet-txt">每日投喂量计算无上限；</text>
				</view>

				<text class="sec-title">数据更新说明</text>
				<view class="bullet">
					<text class="bullet-dot">·</text>
					<text class="bullet-txt">当日数据次日14:00后更新；</text>
				</view>
			</view>

			<view class="card card--table">
				<text class="card-h1">等级说明</text>

				<view class="table-head">
					<text class="th th--lv">等级</text>
					<text class="th th--req">达成条件</text>
					<text class="th th--pri">特权</text>
				</view>

				<view
					v-for="(row, i) in levelTable"
					:key="i"
					class="table-row"
				>
					<text class="td td--lv">{{ row.lv }}</text>
					<view class="td td--req">
						<text class="td-dot">·</text>
						<text class="td-txt">{{ row.req }}</text>
					</view>
					<view class="td td--pri">
						<text class="td-dot">·</text>
						<text class="td-txt">{{ row.pri }}</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { goBackSmart } from '@/utils/navBack.js'

	const LEVEL_TABLE = [
		{ lv: 'LV.1', req: '投喂 1-10斤', pri: '投票1票/天，领养3次/天' },
		{ lv: 'LV.2', req: '投喂 11-50斤', pri: '投票5票/天，领养5次/天' },
		{
			lv: 'LV.3',
			req: '投喂 51-200斤',
			pri: '投票10票/天，领养10次/天，语音5条/天'
		},
		{
			lv: 'LV.4',
			req: '投喂 201-800斤',
			pri: '投票50票/天，领养15次/天，语音10条/天'
		},
		{
			lv: 'LV.5',
			req: '投喂 801-3000斤',
			pri: '投票100票/天，领养20次/天，语音20条/天'
		},
		{
			lv: 'LV.6',
			req: '投喂 3001-10000斤',
			pri: '投票200票/天，领养25次/天，语音100条/天'
		},
		{
			lv: 'LV.7',
			req: '投喂 10001-30000斤',
			pri: '投票500票/天，领养30次/天，语音200条/天'
		},
		{
			lv: 'LV.8',
			req: '投喂 30001+斤',
			pri: '投票无限，领养无限，语音无限'
		}
	]

	export default {
		data() {
			return {
				statusBarHeight: 20,
				menuRightWidth: 87,
				levelTable: LEVEL_TABLE
			}
		},
		onLoad() {
			this.layoutNav()
		},
		onShow() {
			this.layoutNav()
		},
		methods: {
			layoutNav() {
				const sys = uni.getSystemInfoSync()
				this.statusBarHeight = sys.statusBarHeight || 20
				// #ifdef MP-WEIXIN
				try {
					const mb = uni.getMenuButtonBoundingClientRect()
					if (mb && mb.left) {
						this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87)
					}
				} catch (e) {}
				// #endif
			},
			goBack() {
				goBackSmart({ fallbackUrl: '/pages/meMore/level' })
			}
		}
	}
</script>

<style scoped>
	.rules-page {
		position: relative;
		min-height: 100vh;
		background: #f3f4f6;
		box-sizing: border-box;
		padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
	}

	.nav-wrap {
		flex-shrink: 0;
		background: #f3f4f6;
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
		padding: 76rpx 30rpx 24rpx;
		box-sizing: border-box;
	}

	.card {
		background: #ffffff;
		border-radius: 20rpx;
		padding: 22rpx 16rpx 26rpx;
		box-sizing: border-box;
		margin-bottom: 44rpx;
		box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
	}
	/* #ifndef MP-WEIXIN */
	.rules-page { min-height: 1355px; }
	/* #endif */

	.h5-level-top {
		position: absolute;
		left: 0;
		top: 0;
		width: 375px;
		height: 100px;
		z-index: 20;
		pointer-events: none;
	}
	.main-body > .card:first-child { padding-bottom:80rpx; }

	.card--table {
		padding-bottom: 28rpx;
	}

	.card-h1 {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: #111111;
		line-height: 42rpx;
		margin-bottom: 12rpx;
	}

	.sec-title {
		display: block;
		font-size: 24rpx;
		font-weight: 700;
		color: #111111;
		line-height: 34rpx;
		margin-top: 8rpx;
		margin-bottom: 4rpx;
	}

	.card-h1 + .sec-title {
		margin-top: 0;
	}

	.bullet {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		margin-bottom: 2rpx;
	}

	.bullet-dot {
		font-size: 28rpx;
		color: #666666;
		line-height: 40rpx;
		margin-right: 8rpx;
		flex-shrink: 0;
	}

	.bullet-txt {
		flex: 1;
		font-size: 22rpx;
		font-weight: 400;
		color: #555555;
		line-height: 32rpx;
	}

	.table-head {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding-bottom: 16rpx;
		border-bottom: 1rpx solid #eeeeee;
		margin-bottom: 8rpx;
	}

	.th {
		font-size: 22rpx;
		font-weight: 500;
		color: #b0b0b0;
		line-height: 32rpx;
	}

	.th--lv {
		width: 88rpx;
		flex-shrink: 0;
	}

	.th--req {
		flex: 1;
		padding-right: 12rpx;
		min-width: 0;
	}

	.th--pri {
		flex: 1.15;
		min-width: 0;
	}

	.table-row {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		min-height: 210rpx;
		padding: 30rpx 0;
		box-sizing:border-box;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.table-row:last-child {
		border-bottom: none;
	}

	.td {
		font-size: 24rpx;
		line-height: 36rpx;
		color: #444444;
	}

	.td--lv {
		width: 88rpx;
		flex-shrink: 0;
		font-weight: 700;
		color: #8b6914;
		padding-top: 2rpx;
	}

	.td--req,
	.td--pri {
		flex: 1;
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		min-width: 0;
	}

	.td--pri {
		flex: 1.15;
	}

	.td-dot {
		color: #999999;
		margin-right: 6rpx;
		flex-shrink: 0;
		font-size: 24rpx;
		line-height: 36rpx;
	}

	.td-txt {
		flex: 1;
		font-size: 24rpx;
		color: #444444;
		line-height: 36rpx;
		min-width: 0;
	}
</style>
