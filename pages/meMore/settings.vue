<template>
	<view class="settings-page">
		<PawPageNav title="设置" :title-centered="true" background="#f5f6f9" fallback-url="/pages/me/index" />
		<scroll-view class="settings-scroll" scroll-y :show-scrollbar="false">
			<view class="settings-body">
				<view class="settings-card settings-card--account">
					<PawOptionRow label="个人信息" :height="48" data-qa="qa-settings-profile" @click="tapRow('个人信息')" />
					<PawOptionRow label="收货地址" :height="48" data-qa="qa-settings-address" @click="tapRow('收货地址')" />
				</view>

				<view class="settings-card settings-card--security">
					<PawOptionRow label="账号与安全" :height="52" data-qa="qa-settings-security" @click="tapRow('账号与安全')" />
				</view>

				<view class="settings-card settings-card--support">
					<PawOptionRow label="客服帮助" :height="48" data-qa="qa-settings-help" @click="tapRow('客服帮助')" />
					<PawOptionRow label="意见反馈" :height="44" data-qa="qa-settings-feedback" @click="tapRow('意见反馈')" />
					<PawOptionRow label="平台协议" :height="44" data-qa="qa-settings-agreement" @click="tapRow('平台协议')" />
					<PawOptionRow label="关于逢猫" :height="48" data-qa="qa-settings-about" @click="tapRow('关于逢猫')" />
				</view>

				<view class="settings-card settings-card--logout" data-qa="qa-settings-logout" @tap="onLogout">
					<text class="settings-logout-text">退出登录</text>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import PawOptionRow from '@/components/form/PawOptionRow.vue'
import PawPageNav from '@/components/PawPageNav.vue'

export default {
	components: { PawOptionRow, PawPageNav },
	methods: {
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
					if (!res.confirm) return
					uni.removeStorageSync('PAWHOME_LOGGED_IN')
					uni.reLaunch({ url: '/pages/auth/login' })
				}
			})
		}
	}
}
</script>

<style scoped>
.settings-page {
	display: flex;
	flex-direction: column;
	height: 100vh;
	min-height: 0;
	box-sizing: border-box;
	background: #f5f6f9;
}

.settings-scroll {
	flex: 1 1 auto;
	height: 0;
	min-height: 0;
	width: 100%;
	box-sizing: border-box;
}

.settings-body {
	display: flex;
	flex-direction: column;
	gap: 10px;
	width: 100%;
	box-sizing: border-box;
	padding: 11px 16px 48px;
}

.settings-card {
	width: 100%;
	flex: 0 0 auto;
	box-sizing: border-box;
	border-radius: 10px;
	background: #ffffff;
	overflow: hidden;
}

.settings-card--logout {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 45px;
	margin-top: 10px;
	padding: 0 12px;
}

.settings-logout-text {
	font-size: 15px;
	font-weight: 400;
	line-height: 18px;
	color: #999999;
	text-align: center;
}
</style>
