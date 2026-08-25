<template>
	<view class="page">
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-side nav-left" @click.stop="goBack">
					<image class="nav-back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<view class="nav-center"></view>
				<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
		</view>

		<view class="content">
			<view class="icon-ok">
				<text class="check">✓</text>
			</view>
			<text class="title">申请成功</text>
			<text class="desc">
				您的领养申请已发送给院主，为防止不正当领养及虐猫群体恶意领养，院主会查看您的历史喂猫投粮记录以及领养记录来决定是否同意，通过后平台将通知您。请注意本领养为爱心领养，如院主索要钱财，请立即举报！
			</text>
		</view>

		<view class="footer">
			<button class="btn" @click="goProgress">查看领养进度</button>
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
				recordId: ''
			}
		},
		onLoad(options) {
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
			if (options.id) this.recordId = decodeURIComponent(options.id)
		},
		methods: {
			goBack() {
				goBackSmart({ fallbackUrl: '/pages/me/index' })
			},
			goProgress() {
				const id = this.recordId
				if (id) {
					uni.redirectTo({
						url: '/pages/meMore/myAdoption?openDetail=' + encodeURIComponent(id)
					})
				} else {
					uni.redirectTo({ url: '/pages/meMore/myAdoption' })
				}
			}
		}
	}
</script>

<style lang="less" scoped>
	.page {
		min-height: 100vh;
		background: #fff;
		display: flex;
		flex-direction: column;
	}
	.nav-wrap {
		flex-shrink: 0;
	}
	.nav-row {
		height: 88rpx;
		display: flex;
		align-items: center;
	}
	.nav-side {
		width: 88rpx;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.nav-back-icon {
		width: 48rpx;
		height: 48rpx;
	}
	.nav-center {
		flex: 1;
	}
	.content {
		flex: 1;
		padding: 80rpx 48rpx 48rpx;
		box-sizing: border-box;
	}
	.icon-ok {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background: #ffdd00;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 48rpx;
	}
	.check {
		font-size: 64rpx;
		font-weight: 700;
		color: #111;
		line-height: 1;
	}
	.title {
		display: block;
		text-align: center;
		font-size: 40rpx;
		font-weight: 700;
		color: #111;
		margin-bottom: 32rpx;
	}
	.desc {
		display: block;
		font-size: 28rpx;
		color: #666;
		line-height: 1.65;
	}
	.footer {
		padding: 24rpx 40rpx calc(40rpx + env(safe-area-inset-bottom));
	}
	.btn {
		height: 96rpx;
		line-height: 96rpx;
		border-radius: 48rpx;
		background: #ffdd00;
		color: #111;
		font-size: 32rpx;
		font-weight: 600;
		border: none;
	}
</style>
