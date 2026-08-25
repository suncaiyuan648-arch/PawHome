<template>
	<view class="helped-page">
		<!-- #ifndef MP-WEIXIN -->
		<image class="h5-status-bar" src="/static/figma/status-bar-helped.png" mode="scaleToFill"></image>
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
			<text class="nav-title">我帮助过的动物</text>
		</view>

		<view class="grid-wrap">
			<view
				v-for="(src, i) in photoList"
				:key="i"
				class="grid-cell"
				@click="onThumbTap(i)"
			>
				<image class="grid-img" :src="src" mode="aspectFill"></image>
			</view>
		</view>
	</view>
</template>

<script>
	import { goBackSmart } from '@/utils/navBack.js'

	const mockPhotos = () => Array.from({ length: 11 }, (_, i) => `/static/figma/helped/animal-${String(i + 1).padStart(2, '0')}.${i === 6 ? 'png' : 'jpg'}`)

	export default {
		data() {
			return {
				statusBarHeight: 20,
				menuRightWidth: 87,
				photoList: mockPhotos()
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
				// #ifdef H5
				this.statusBarHeight = 24
				// #endif
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
			},
			onThumbTap(i) {
				uni.previewImage({
					urls: this.photoList,
					current: this.photoList[i]
				})
			}
		}
	}
</script>

<style scoped>
	.helped-page {
		position:relative;
		min-height: 100vh;
		width: 100%;
		background: #f5f7f9;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
	}
	.h5-status-bar{position:absolute;left:0;top:0;width:100%;height:44px;z-index:100;pointer-events:none}

	.nav-wrap {
		flex-shrink: 0;
		background: #f5f7f9;
	}

	.nav-row {
		position: relative;
		height: 44px;
		display: flex;
		flex-direction: row;
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

	.nav-title {
		display: block;
		height: 50px;
		padding-left: 14px;
		font-size: 22px;
		font-weight: 700;
		color: #111111;
		line-height: 50px;
		max-width: none;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		pointer-events: none;
	}

	.grid-wrap {
		width: 100%;
		padding: 0;
		box-sizing: border-box;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-content: flex-start;
	}

	.grid-cell {
		width: 20%;
		padding: 0;
		box-sizing: border-box;
	}

	.grid-img {
		width: 100%;
		height: 75px;
		display: block;
		border-radius: 0;
		background: #f0f0f0;
	}
</style>
