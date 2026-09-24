<template>
	<view class="page">
		<PawPageNav background="#ffffff" fallback-url="/packages/auth/pages/phone-bind/index" />

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

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import { clearAuthContinuation, restoreStoredAuthContinuation } from '@/navigation/authContinuationStorage.ts'

interface SmsVerifyPageState { phone: string; code: string }

function queryRecord(options: unknown): Record<string, unknown> {
	return options !== null && typeof options === 'object' && !Array.isArray(options)
		? options as Record<string, unknown>
		: {}
}

export default defineComponent({
	components: { PawPageNav },
	data(): SmsVerifyPageState {
		return {
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
	onLoad(options: unknown = {}) {
		const phone = queryRecord(options).phone
		if (typeof phone === 'string' && phone) this.phone = decodeURIComponent(phone)
	},
	methods: {
		verifyLogin() {
			if (!this.canSubmit) return
			uni.setStorageSync('PAWHOME_ACTOR_SESSION', { actor: { id: 'local-user', roles: ['applicant'] } })
			uni.showToast({ title: '登录成功', icon: 'success' })
			setTimeout(() => this.resumeAfterLogin(), 300)
		},
		resumeAfterLogin() {
			const restored = restoreStoredAuthContinuation({ authenticated: true })
			if (restored.status !== 'ready' || !restored.target) {
				if (restored.code !== 'NO_CONTINUATION') uni.showToast({ title: '原页面已失效，请重新进入', icon: 'none' })
				clearAuthContinuation()
				uni.navigateBack({ delta: 2, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
				return
			}
			const continuation = restored.continuation
			clearAuthContinuation()
			if (continuation && continuation.messageId) {
				const category = continuation.category ? `&category=${encodeURIComponent(continuation.category)}` : ''
				uni.redirectTo({
					url: `/packages/message/pages/list/index?messageId=${encodeURIComponent(continuation.messageId)}${category}`,
					fail: () => uni.reLaunch({ url: '/pages/message/index' }),
				})
				return
			}
			uni.redirectTo({ url: restored.target.url, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
		}
	}
})
</script>

<style lang="less" scoped>
.page { min-height: 100vh; background: #ffffff; }
.content { padding: 40rpx; }
.title { display: block; font-size: 62rpx; font-weight: 700; color: #222; margin-top: 24rpx; }
.sub { display: block; font-size: 32rpx; color: #999; margin-top: 16rpx; }
.code-input { margin-top: 86rpx; border-bottom: 1rpx solid #ececec; font-size: 54rpx; color: #222; letter-spacing: 28rpx; padding-bottom: 16rpx; }
.resend { display: block; margin-top: 22rpx; text-align: center; color: #bbb; font-size: 34rpx; }
.btn-verify { margin-top: 66rpx; height: 96rpx; line-height: 96rpx; border-radius: 48rpx; background: #ffdd00; color: #111; font-size: 36rpx; font-weight: 700; border: none; }
.btn-verify--disabled { background: #f0e890; color: #aaa; }
.hint { display: block; margin-top: 28rpx; color: #bbb; font-size: 30rpx; }
.content{padding-top:24px}.title{font-size:24px;line-height:30px}.sub{font-size:12px;line-height:18px;margin-top:6px}.resend{font-size:12px}.btn-verify{font-size:16px}.hint{font-size:12px}
</style>
