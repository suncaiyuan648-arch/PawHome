<template>
	<view class="annual-page">
		<view class="annual-bg-grad"></view>
		<view class="annual-map-layer">
			<image class="annual-map-img" src="/static/me/annual-report-bg.png" mode="widthFix" />
		</view>
		<PawPageNav title="年度报告" background="transparent" :light="true" fallback-url="/packages/account/pages/level/index" />
		<view class="page-inner">
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
import PawPageNav from '@/components/PawPageNav.vue'

export default {
  components: { PawPageNav },
  data() {
    return {
      report: {
        year: 2026,
        adoptCount: 5,
        grainJin: 23,
        animalCount: 14,
        luckyAdopted: 3,
        cityCount: 13
      }
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
