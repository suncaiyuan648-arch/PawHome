<template>
	<view class="annual-page">
		<!-- #ifndef MP-WEIXIN -->
		<image class="h5-status-bar" src="/static/figma/status-bar-annual.png" mode="scaleToFill"></image>
		<!-- #endif -->
		<!-- 蓝色渐变底（设计图主背景） -->
		<view class="annual-bg-grad"></view>
		<!-- 地图亮光素材：与蓝底叠加以去掉黑底感 -->
		<view class="annual-map-layer">
			<image
				class="annual-map-img"
				src="/static/me/annual-report-bg.png"
				mode="widthFix"
			></image>
		</view>

		<view class="page-inner">
			<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
				<view class="nav-row">
					<view class="nav-side nav-left" @click.stop="goBack">
						<image
							class="nav-back-icon"
							src="/static/nav-back-arrow.png"
							mode="aspectFit"
						></image>
					</view>
					<view class="nav-fill"></view>
					<view class="nav-capsule-gap" :style="{ width: menuRightWidth + 'px' }"></view>
				</view>
				<view class="nav-brand-row">
					<view class="nav-fill"></view>
					<view class="nav-brand-wrap" :style="{ width: menuRightWidth + 'px' }">
						<text class="nav-brand-line1">逢猫</text>
						<text class="nav-brand-line2">年度报告</text>
					</view>
				</view>
			</view>

			<view class="copy-block">
				<text class="year-line">{{ report.year }}年</text>
				<view class="lines">
					<text class="body-line">你进行了{{ report.adoptCount }}次领养</text>
					<text class="body-line">投喂的{{ report.grainJin }}斤粮</text>
					<text class="body-line">被{{ report.animalCount }}只流浪动物吃光了</text>
					<text class="body-line">其中有{{ report.luckyAdopted }}只幸运的等到了领养</text>
					<text class="body-line body-line--highlight">爱心足迹遍布{{ report.cityCount }}个城市</text>
				</view>
			</view>

			<view class="page-spacer"></view>

			<text class="footer-quote">从心里感动的一定不是坏事</text>
		</view>
	</view>
</template>

<script>
	import { goBackSmart } from '@/utils/navBack.js'

	export default {
		data() {
			return {
				statusBarHeight: 20,
				menuRightWidth: 87,
				report: {
					year: 2026,
					adoptCount: 5,
					grainJin: 23,
					animalCount: 14,
					luckyAdopted: 3,
					cityCount: 13
				}
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
	.annual-page {
		position: relative;
		min-height: 100vh;
		width: 100%;
		overflow: hidden;
		box-sizing: border-box;
	}
	.h5-status-bar{position:absolute;left:0;top:0;width:100%;height:40px;z-index:10;pointer-events:none}

	.annual-bg-grad {
		position: fixed;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		z-index: 0;
		background: #176ff3;
		pointer-events: none;
	}

	/* 与蓝底 screen 混合：黑底变透，保留白色轮廓与星光 */
	.annual-map-layer {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 54px;
		z-index: 1;
		pointer-events: none;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: flex-end;
		mix-blend-mode: screen;
	}

	.annual-map-img {
		width: 90%;
		display: block;
		vertical-align: bottom;
	}

	.page-inner {
		position: relative;
		z-index: 2;
		min-height: 100vh;
		width: 100%;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
	}

	.nav-wrap {
		flex-shrink: 0;
		padding: 0 8rpx;
		box-sizing: border-box;
	}

	.nav-row {
		position: relative;
		height: 44px;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		box-sizing: border-box;
	}

	.nav-brand-row {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		justify-content: space-between;
		position:absolute;
		right:4px;
		top:108px;
		width:92px;
		margin-top:0;
		padding-bottom: 8rpx;
		box-sizing: border-box;
	}

	.nav-brand-wrap {
		position:relative;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		text-align: right;
		box-sizing: border-box;
		padding-right: 4rpx;
	}
	.nav-brand-wrap::before{content:'';position:absolute;right:-2px;top:-7px;width:92px;height:226px;border-radius:50%;background:rgba(255,255,255,.25);z-index:-1}

	.nav-brand-line1,
	.nav-brand-line2 {
		font-size: 22rpx;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.95);
		line-height: 30rpx;
	}

	.nav-side {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		min-width: 80rpx;
	}

	.nav-left {
		padding: 8rpx 16rpx 8rpx 8rpx;
		margin-left: 4rpx;
		min-width: 72rpx;
		min-height: 72rpx;
		justify-content: center;
	}

	.nav-back-icon {
		width: 40rpx;
		height: 40rpx;
		display: block;
		filter: brightness(0) invert(1);
	}

	.nav-fill {
		flex: 1;
		min-width: 0;
	}

	.nav-capsule-gap {
		flex-shrink: 0;
		height: 1px;
	}

	.copy-block {
		flex-shrink: 0;
		padding: 36rpx 52px 0;
		box-sizing: border-box;
	}

	.year-line {
		display: block;
		font-size: 16px;
		font-weight: 700;
		color: #ffffff;
		line-height: 24px;
		letter-spacing: 2rpx;
		margin-bottom: 8px;
	}

	.lines {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.body-line {
		display: block;
		width: 100%;
		font-size: 30rpx;
		font-weight: 400;
		color: rgba(255, 255, 255, 0.96);
		line-height: 32px;
		margin-bottom: 0;
		text-align: left;
	}

	.body-line--highlight {
		font-size: 36rpx;
		font-weight: 700;
		line-height: 54rpx;
		margin-top: 6px;
		margin-bottom: 0;
		letter-spacing: 1rpx;
	}

	.page-spacer {
		flex: 1;
		min-height: 120rpx;
		width: 100%;
	}

	.footer-quote {
		flex-shrink: 0;
		display: block;
		text-align: center;
		font-size: 26rpx;
		font-weight: 400;
		color: rgba(255, 255, 255, 0.9);
		line-height: 42rpx;
		padding: 0 48rpx 16rpx;
		box-sizing: border-box;
	}
</style>
