<template>
	<view class="page">
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-side nav-left" @click.stop="goBack">
					<image class="nav-back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
		</view>

		<view class="content">
			<text class="title">输入短信验证码</text>
			<text class="sub">已向您的手机 {{ phoneMasked }} 发送验证码</text>

			<input v-model="code" type="number" maxlength="6" class="code-input" placeholder="      " />
			<text class="resend">重新发送（56）</text>

			<button class="btn-verify" :class="{ 'btn-verify--disabled': !canSubmit }" @click="verifyLogin">
				验证并登录
			</button>
			<text class="hint">接收不到短信</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			statusBarHeight: 20,
			menuRightWidth: 87,
			phone: '',
			code: ''
		}
	},
	computed: {
		phoneMasked() {
			if (!this.phone) return '19366660000'
			return this.phone
		},
		canSubmit() {
			return this.code.trim().length === 6
		}
	},
	onLoad(options) {
		const sys = uni.getSystemInfoSync()
		this.statusBarHeight = sys.statusBarHeight || 20
		// #ifdef MP-WEIXIN
		try {
			const mb = uni.getMenuButtonBoundingClientRect()
			if (mb && mb.left) this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87)
		} catch (e) {}
		// #endif
		if (options.phone) this.phone = decodeURIComponent(options.phone)
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		verifyLogin() {
			if (!this.canSubmit) return
			uni.setStorageSync('PAWHOME_LOGGED_IN', '1')
			uni.showToast({ title: '登录成功', icon: 'success' })
			setTimeout(() => {
				uni.navigateBack({ delta: 2 })
			}, 300)
		}
	}
}
</script>

<style lang="less" scoped>
.page { min-height: 100vh; background: #f5f5f5; }
.nav-wrap { background: #f5f5f5; }
.nav-row { height: 88rpx; display: flex; align-items: center; padding: 0 8rpx; }
.nav-side { width: 88rpx; height: 88rpx; display: flex; align-items: center; justify-content: center; }
.nav-back-icon { width: 48rpx; height: 48rpx; }
.content { padding: 40rpx; }
.title { display: block; font-size: 62rpx; font-weight: 700; color: #222; margin-top: 24rpx; }
.sub { display: block; font-size: 32rpx; color: #999; margin-top: 16rpx; }
.code-input { margin-top: 86rpx; border-bottom: 1rpx solid #ececec; font-size: 54rpx; color: #222; letter-spacing: 28rpx; padding-bottom: 16rpx; }
.resend { display: block; margin-top: 22rpx; text-align: center; color: #bbb; font-size: 34rpx; }
.btn-verify { margin-top: 66rpx; height: 96rpx; line-height: 96rpx; border-radius: 48rpx; background: #ffdd00; color: #111; font-size: 36rpx; font-weight: 700; border: none; }
.btn-verify--disabled { background: #f0e890; color: #aaa; }
.hint { display: block; margin-top: 28rpx; color: #bbb; font-size: 30rpx; }
.page,.nav-wrap{background:#fff}.content{transform:translateY(19px)}.title{font-size:24px;line-height:30px}.sub{font-size:12px;line-height:18px;margin-top:6px}.resend{font-size:12px}.btn-verify{font-size:16px}.hint{font-size:12px}
</style>
