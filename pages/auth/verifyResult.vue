<template>
	<view class="result-page">
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-side nav-left" @click.stop="goBack">
					<image class="nav-back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<text class="nav-title">{{ isSuccess ? '认证结果' : '' }}</text>
				<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
		</view>

		<view class="center-wrap" :class="{ 'center-wrap--success': isSuccess }">
			<view class="icon-wrap" :class="{ 'icon-wrap--success': isSuccess }">
				<text class="icon-glyph">{{ isSuccess ? '✓' : '×' }}</text>
			</view>
			<text class="main-title">{{ isSuccess ? '实名认证通过' : '认证失败' }}</text>
			<text v-if="!isSuccess" class="sub-title">人脸核验失败，请稍后重试</text>
		</view>

		<view class="footer-bar">
			<view
				class="action-btn"
				:class="{ 'action-btn--success': isSuccess, 'action-btn--fail': !isSuccess }"
				@click="onActionTap"
			>
				<text>{{ isSuccess ? '创建小院' : '返回' }}</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			statusBarHeight: 20,
			menuRightWidth: 87,
			isSuccess: true
		}
	},
	onLoad(query) {
		this.isSuccess = !(query && query.status === 'fail')
		const sys = uni.getSystemInfoSync()
		this.statusBarHeight = sys.statusBarHeight || 20
		// #ifdef H5
		this.statusBarHeight = 44
		// #endif
		// #ifdef MP-WEIXIN
		try {
			const mb = uni.getMenuButtonBoundingClientRect()
			if (mb && mb.left) this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87)
		} catch (e) {}
		// #endif
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		onActionTap() {
			if (this.isSuccess) {
				uni.navigateTo({ url: '/pages/yard/createCatYard' })
				return
			}
			uni.navigateBack()
		}
	}
}
</script>

<style scoped>
.result-page { min-height: 100vh; background: #fff; display: flex; flex-direction: column; }
.nav-wrap { flex-shrink: 0; background: #fff; }
.nav-row { height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 8rpx; box-sizing: border-box; }
.nav-side { min-width: 80rpx; display: flex; align-items: center; }
.nav-left { padding: 8rpx 24rpx 8rpx 16rpx; justify-content: center; }
.nav-back-icon { width: 20rpx; height: 36rpx; }
.nav-title { font-size: 40rpx; font-weight: 500; color: #222; line-height: 52rpx; }

.center-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; padding-top: 38px; box-sizing: border-box; }
.center-wrap--success { padding-top: 101px; }
.icon-wrap {
	width: 120rpx; height: 120rpx; border-radius: 50%;
	background: #e7e7e7; display: flex; align-items: center; justify-content: center;
}
.icon-wrap--success { background: #ffe60f; }
.icon-glyph { font-size: 64rpx; color: #6d6d6d; line-height: 1; }
.icon-wrap--success .icon-glyph { color: #1f1f1f; font-weight: 700; }
.main-title { margin-top: 14px; font-size: 15px; font-weight: 500; color: #1f1f1f; line-height: 22px; }
.sub-title { margin-top: 66px; font-size: 12px; color: #666; line-height: 18px; }

.footer-bar { padding: 0 0 calc(177px + env(safe-area-inset-bottom)); box-sizing: border-box; display:flex;justify-content:center; }
.action-btn { width:87px;height:35px; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
.action-btn text { font-size: 12px; font-weight: 500; line-height: 18px; }
.action-btn--success { background: #ffe60f; }
.action-btn--success { width: 244px; height: 42px; border-radius: 21px; }
.action-btn--success text { color: #1f1f1f; }
.action-btn--fail { background: #efefef; }
.action-btn--fail text { color: #2f2f2f; }
</style>
