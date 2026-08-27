<template>
	<view class="settings-page">
		<view class="settings-nav" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="settings-nav-row"><view class="settings-back" @click="goBack"><image src="/static/nav-back-arrow.png" mode="aspectFit" /></view><text>设置</text></view>
		</view>
		<view class="settings-body">
			<view class="settings-card">
				<PawOptionRow label="个人信息" @click="tapRow('个人信息')" />
				<view class="settings-divider"></view>
				<PawOptionRow label="收货地址" @click="tapRow('收货地址')" />
			</view>

			<view class="settings-card">
				<PawOptionRow label="账号与安全" @click="tapRow('账号与安全')" />
			</view>

			<view class="settings-card">
				<PawOptionRow label="客服帮助" @click="tapRow('客服帮助')" />
				<view class="settings-divider"></view>
				<PawOptionRow label="意见反馈" @click="tapRow('意见反馈')" />
				<view class="settings-divider"></view>
				<PawOptionRow label="平台协议" @click="tapRow('平台协议')" />
				<view class="settings-divider"></view>
				<PawOptionRow label="关于逢猫" @click="tapRow('关于逢猫')" />
			</view>

			<view class="settings-card settings-card--logout" @click="onLogout">
				<text class="settings-logout-text">退出登录</text>
			</view>
		</view>
	</view>
</template>

<script>
	import PawOptionRow from '@/components/form/PawOptionRow.vue'

	export default {
		components: { PawOptionRow },
		data(){return{statusBarHeight:20}},
		onLoad(){const s=uni.getSystemInfoSync();this.statusBarHeight=s.statusBarHeight||20
			// #ifdef H5
			this.statusBarHeight=44
			// #endif
		},
		methods: {
			goBack(){uni.navigateBack()},
			tapRow(name) {
				if (name === '收货地址') {
					uni.navigateTo({
						url: '/pages/meMore/shippingAddress',
						fail: (err) => {
							uni.redirectTo({
								url: '/pages/meMore/shippingAddress',
								fail: () => {
									uni.showToast({
										title: (err && err.errMsg) || '页面打开失败',
										icon: 'none'
									})
								}
							})
						}
					})
					return
				}
				uni.showToast({ title: name, icon: 'none' })
			},
			onLogout() {
				uni.showModal({
					title: '提示',
					content: '确定要退出登录吗？',
					success: (res) => {
						if (res.confirm) {
							uni.showToast({ title: '已退出', icon: 'none' })
						}
					}
				})
			}
		}
	}
</script>

<style scoped>
	.settings-page {
		min-height: 100vh;
		background: #f7f8fa;
		box-sizing: border-box;
	}
	.settings-nav{background:#f7f8fa}.settings-nav-row{position:relative;height:44px;display:flex;align-items:center;justify-content:center}.settings-nav-row>text{font-size:17px;font-weight:400}.settings-back{position:absolute;left:4px;top:0;width:44px;height:44px;display:flex;align-items:center;justify-content:center}.settings-back image{width:10px;height:18px}

	.settings-body {
		padding: 21px 15px 48rpx;
		padding-bottom: calc(48rpx + constant(safe-area-inset-bottom));
		padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.settings-card {
		background: #ffffff;
		border-radius: 8px;
		margin-bottom: 8px;
		overflow: hidden;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
		box-sizing: border-box;
	}

	.settings-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 13px 17px;
		box-sizing: border-box;
	}

	.settings-row-label {
		flex: 1;
		min-width: 0;
		font-size: 15px;
		font-weight: 400;
		color: #111111;
		line-height: 42rpx;
	}

	.settings-chevron {
		width: 22rpx;
		height: 22rpx;
		margin-left: 16rpx;
		flex-shrink: 0;
		opacity: 0.38;
	}

	.settings-divider {
		height: 1rpx;
		background: #f0f0f0;
		margin-left: 12px;
	}

	.settings-card--logout {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 13px 12px;
		margin-bottom: 0;
	}

	.settings-logout-text {
		font-size: 13px;
		font-weight: 400;
		color: #888888;
		line-height: 42rpx;
		text-align: center;
	}
</style>
