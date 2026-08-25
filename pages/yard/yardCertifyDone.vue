<template>
	<PawFlowResult v-if="!showCreated" title="提交成功" body="3个工作日内人工审核，结果将会以系统消息方式通知" button-text="返回小院" @back="goBack" @action="backToYard" />
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
			<text class="ok-title">提交成功</text>
			<text class="ok-desc">3个工作日内人工审核，结果将会以系统消息方式通知</text>
		</view>

		<view class="footer">
			<view class="back-btn" @click="backToYard"><text>返回小院</text></view>
		</view>
		<PawSuccessOverlay :visible="showCreated" mode="created" title="创建成功" body="恭喜您已创建小院，坚持更新动态能\n让小院排名靠前，让更多人看到您的\n小院" button-text="前往认证" @close="showCreated=false" @action="showCreated=false" />
	</view>
</template>

<script>
import PawSuccessOverlay from '@/components/PawSuccessOverlay.vue'
import PawFlowResult from '@/components/PawFlowResult.vue'
export default {
	components:{PawSuccessOverlay,PawFlowResult},
	data() {
		return {
			statusBarHeight: 20,
			menuRightWidth: 87,
			yardName: '',
			showCreated:false
		}
	},
	onLoad(query) {
		const sys = uni.getSystemInfoSync()
		this.statusBarHeight = sys.statusBarHeight || 20
		// #ifdef MP-WEIXIN
		try {
			const mb = uni.getMenuButtonBoundingClientRect()
			if (mb && mb.left) this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87)
		} catch (e) {}
		// #endif
		if (query && query.yardName) {
			const y = decodeURIComponent(query.yardName)
			if (y) this.yardName = y
		}
		if(query&&query.state==='created')this.showCreated=true
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		backToYard() {
			const q = this.yardName ? '?name=' + encodeURIComponent(this.yardName) : ''
			uni.redirectTo({
				url: '/pages/yard/yardCats' + q,
				fail: () => uni.switchTab({ url: '/pages/index/index' })
			})
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
	padding-top: 120rpx;
	padding-left: 48rpx;
	padding-right: 48rpx;
	box-sizing: border-box;
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
	text-align: center;
}
.ok-desc {
	margin-top: 20rpx;
	font-size: 28rpx;
	color: #888;
	line-height: 44rpx;
	text-align: center;
}
.footer {
	padding: 24rpx 32rpx;
	padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
	background: #fff;
	box-sizing: border-box;
}
.back-btn {
	height: 96rpx;
	border-radius: 48rpx;
	background: #ffe60f;
	display: flex;
	align-items: center;
	justify-content: center;
}
.back-btn text {
	font-size: 34rpx;
	font-weight: 700;
	color: #111;
	line-height: 48rpx;
}
</style>
