<template>
	<PawFlowResult v-if="!showFeeding" title="发布成功" body="饿了就睡 醒了就找\n日子浑浑噩噩\n谢谢你给我一口粮\n也给我一点盼头" button-text="查看动态" @back="goBack" @action="viewFeed" />
	<view v-else class="page">
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-hit" @click="goBack">
					<image class="nav-back" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<view class="nav-cap" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
		</view>

		<view class="center">
			<view class="ok-icon"><text class="ok-glyph">✓</text></view>
			<text class="ok-title">发布成功</text>
			<view class="poem">
				<text>饿了就睡 醒了就找</text>
				<text>日子浑浑噩噩</text>
				<text>谢谢你给我一口粮</text>
				<text>也给我一点盼头</text>
			</view>
		</view>

		<view class="footer">
			<view class="btn" @click="viewFeed"><text>查看动态</text></view>
		</view>
		<PawSuccessOverlay :visible="showFeeding" mode="feeding" title="投喂成功" body="饿了就睡 醒了就找\n日子浑浑噩噩\n谢谢你给我一口粮\n也给我一点盼头" button-text="查看投喂订单" @close="showFeeding=false" @action="viewFeed" />
	</view>
</template>

<script>
import { goBackSmart } from '@/utils/navBack.js'
import PawSuccessOverlay from '@/components/PawSuccessOverlay.vue'
import PawFlowResult from '@/components/PawFlowResult.vue'

export default {
	components:{PawSuccessOverlay,PawFlowResult},
	data() {
		return {
			statusBarHeight: 20,
			menuRightWidth: 87,
			showFeeding:false
		}
	},
	onLoad(options={}) {
		const sys = uni.getSystemInfoSync()
		this.statusBarHeight = sys.statusBarHeight || 20
		// #ifdef MP-WEIXIN
		try {
			const mb = uni.getMenuButtonBoundingClientRect()
			if (mb && mb.left) this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87)
		} catch (e) {}
		// #endif
		if(options.state==='feeding')this.showFeeding=true
	},
	methods: {
		goBack() {
			goBackSmart({ delta: 2, fallbackUrl: '/pages/index/index' })
		},
		viewFeed() {
			uni.switchTab({ url: '/pages/index/index' })
		}
	}
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	background: #fff;
	box-sizing: border-box;
}
.nav-wrap {
	flex-shrink: 0;
	background: #fff;
}
.nav-row {
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 8rpx;
	box-sizing: border-box;
}
.nav-hit {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.nav-back {
	width: 20rpx;
	height: 36rpx;
}
.nav-cap {
	height: 64rpx;
}
.center {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-top: 100rpx;
	padding-left: 48rpx;
	padding-right: 48rpx;
}
.ok-icon {
	width: 120rpx;
	height: 120rpx;
	border-radius: 50%;
	background: #ffe60f;
	display: flex;
	align-items: center;
	justify-content: center;
}
.ok-glyph {
	font-size: 64rpx;
	color: #111;
	font-weight: 700;
	line-height: 1;
}
.ok-title {
	margin-top: 36rpx;
	font-size: 40rpx;
	font-weight: 700;
	color: #111;
	line-height: 52rpx;
}
.poem {
	margin-top: 28rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	row-gap: 8rpx;
}
.poem text {
	font-size: 28rpx;
	color: #888;
	line-height: 44rpx;
	text-align: center;
}
.footer {
	padding: 24rpx 32rpx;
	padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
	background: #fff;
}
.btn {
	height: 96rpx;
	border-radius: 48rpx;
	background: #ffe60f;
	display: flex;
	align-items: center;
	justify-content: center;
}
.btn text {
	font-size: 34rpx;
	font-weight: 700;
	color: #111;
	line-height: 48rpx;
}
</style>
