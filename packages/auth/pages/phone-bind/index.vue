<template>
	<view class="page">
		<PawPageNav background="#ffffff" fallback-url="/packages/auth/pages/login/index" />

		<view class="content">
			<text class="title">登录后，体验完整功能</text>
			<text class="sub">未注册的手机号验证通过将自动注册</text>

			<view class="phone-row">
				<text class="area">+86 ▾</text>
				<input v-model="phone" type="number" class="phone-input" maxlength="11" placeholder="193 6666 0000" />
			</view>
			<text class="hint">接收不到短信</text>

			<button class="btn-next" :class="{ 'btn-next--disabled': !canNext }" @click="goNext">下一步</button>

			<view class="agreement-row" @click="agreed = !agreed">
				<text class="agree-icon">{{ agreed ? '◉' : '○' }}</text>
				<text class="agree-text">
					已经阅读完
					<text class="link">《隐私政策》</text>
					和
					<text class="link">《用户协议》</text>
				</text>
			</view>
		</view>
	</view>
</template>

<script lang="ts">import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'

interface PhoneBindPageState { phone: string; agreed: boolean }

export default defineComponent({
	components: { PawPageNav },
	data(): PhoneBindPageState {
		return {
			phone: '19366660000',
			agreed: true
		}
	},
	computed: {
		canNext() {
			return this.phone.trim().length >= 11 && this.agreed
		}
	},
	methods: {
		goNext() {
			if (!this.canNext) return
			const p = encodeURIComponent(this.phone.replace(/\s+/g, ''))
			uni.navigateTo({ url: '/packages/auth/pages/sms-verify/index?phone=' + p })
		}
	}
})
</script>

<style lang="less" scoped>
.page { min-height: 100vh; background: #ffffff; }
.content { padding: 40rpx; }
.title { display: block; font-size: 62rpx; font-weight: 700; color: #222; margin-top: 24rpx; }
.sub { display: block; font-size: 30rpx; color: #999; margin-top: 16rpx; }
.phone-row { margin-top: 84rpx; display: flex; align-items: center; border-bottom: 1rpx solid #e6e6e6; padding-bottom: 18rpx; }
.area { font-size: 40rpx; color: #333; }
.phone-input { margin-left: 24rpx; flex: 1; font-size: 44rpx; color: #222; }
.hint { display: block; margin-top: 24rpx; color: #bbb; font-size: 30rpx; }
.btn-next { margin-top: 72rpx; height: 96rpx; line-height: 96rpx; border-radius: 48rpx; background: #ffdd00; color: #111; font-size: 36rpx; font-weight: 700; border: none; }
.btn-next--disabled { background: #f0e890; color: #aaa; }
.agreement-row { margin-top: 38rpx; display: flex; justify-content: center; align-items: center; }
.agree-icon { margin-right: 8rpx; color: #d5a800; font-size: 30rpx; }
.agree-text { color: #999; font-size: 28rpx; }
.link { color: #4b7fda; }
.content{padding-top:24px}.title{font-size:24px;line-height:30px}.sub{font-size:12px;line-height:18px;margin-top:6px}.area{font-size:16px}.phone-input{font-size:18px}.hint{font-size:12px}.btn-next{font-size:16px}.agreement-row{margin-top:19px}.agree-icon{font-size:14px}.agree-text{font-size:12px}
</style>
