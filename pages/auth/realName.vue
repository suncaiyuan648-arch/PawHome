<template>
	<view class="auth-page">
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-side nav-left" @click.stop="goBack">
					<image class="nav-back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
		</view>

		<view class="page-body">
			<text class="page-title">实名认证</text>
			<text class="page-sub">请填写您的实名信息</text>

			<view class="form-wrap">
				<view class="field">
					<text class="field-label">姓名</text>
					<view class="field-input-wrap">
						<input
							class="field-input"
							type="text"
							:value="form.name"
							placeholder="请输入您的真实姓名"
							placeholder-class="field-placeholder"
							@input="onNameInput"
						/>
					</view>
				</view>

				<view class="field">
					<text class="field-label">身份证号</text>
					<view class="field-input-wrap">
						<input
							class="field-input"
							type="text"
							:value="form.idNo"
							placeholder="请输入您的身份证号码"
							placeholder-class="field-placeholder"
							@input="onIdInput"
						/>
					</view>
				</view>
			</view>
		</view>

		<view class="footer-bar">
			<view class="verify-btn" @click="onVerify">
				<text>人脸核验</text>
			</view>
		</view>

		<view v-if="noticeType" class="notice-mask" @click="noticeType = ''">
			<view class="notice-panel" :class="{ 'notice-panel--privacy': noticeType === 'privacy' }" @click.stop>
				<text class="notice-title">{{ noticeType === 'privacy' ? '隐私政策及用户协议' : '实名认证' }}</text>
				<text class="notice-body">{{ noticeType === 'privacy' ? '请仔细阅读《隐私政策》和《用户协议》' : '创建小院需要先实名认证，每人仅能创建一个小院，发布虚假违规信息将永久取消您的小院资格，平台将严格保护您的隐私。' }}</text>
				<view class="notice-actions">
					<view class="notice-btn muted" @click="noticeType = ''"><text>{{ noticeType === 'privacy' ? '拒绝' : '返回' }}</text></view>
					<view class="notice-btn primary" @click="onNoticeConfirm"><text>{{ noticeType === 'privacy' ? '同意' : '开始实名' }}</text></view>
				</view>
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
			noticeType: '',
			form: {
				name: '',
				idNo: ''
			}
		}
	},
	onLoad(options = {}) {
		const sys = uni.getSystemInfoSync()
		this.statusBarHeight = sys.statusBarHeight || 20
		// #ifdef MP-WEIXIN
		try {
			const mb = uni.getMenuButtonBoundingClientRect()
			if (mb && mb.left) this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87)
		} catch (e) {}
		// #endif
		if (options.popup === 'real-name') this.noticeType = 'real-name'
		if (options.popup === 'privacy') this.noticeType = 'privacy'
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		onNameInput(e) {
			this.form.name = (e.detail.value || '').trimStart()
		},
		onIdInput(e) {
			const raw = (e.detail.value || '').replace(/[^0-9xX]/g, '')
			this.form.idNo = raw.toUpperCase()
		},
		isIdCardValid(v) {
			return /^\d{17}[\dX]$/.test((v || '').trim())
		},
		onVerify() {
			if (!this.form.name.trim()) return uni.showToast({ title: '请输入姓名', icon: 'none' })
			if (!this.isIdCardValid(this.form.idNo)) {
				return uni.showToast({ title: '请输入正确身份证号', icon: 'none' })
			}
			uni.showActionSheet({
				itemList: ['模拟核验通过', '模拟核验失败'],
				success: (res) => {
					const status = res.tapIndex === 0 ? 'success' : 'fail'
					uni.navigateTo({ url: '/pages/auth/verifyResult?status=' + status })
				}
			})
		},
		onNoticeConfirm() {
			if (this.noticeType === 'privacy') {
				this.noticeType = ''
				return
			}
			this.noticeType = ''
		}
	}
}
</script>

<style scoped>
.auth-page { min-height: 100vh; background: #fff; display: flex; flex-direction: column; }
.nav-wrap { flex-shrink: 0; background: #fff; }
.nav-row { height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 8rpx; box-sizing: border-box; }
.nav-side { min-width: 80rpx; display: flex; align-items: center; }
.nav-left { padding: 8rpx 24rpx 8rpx 16rpx; justify-content: center; }
.nav-back-icon { width: 20rpx; height: 36rpx; }

.page-body { flex: 1; padding: 33px 27px 24px; box-sizing: border-box; }
.page-title { display: block; font-size: 28px; font-weight: 700; color: #333; line-height: 34px; }
.page-sub { display: block; margin-top: 3px; font-size: 14px; color: #999; line-height: 20px; }

.form-wrap { margin-top: 110px; }
.field { margin-bottom: 36px; }
.field-label { display: block; margin-bottom: 15px; font-size: 14px; font-weight: 500; color: #222; line-height: 20px; }
.field-input-wrap {
	height: 51px;
	border-radius: 26px;
	border: 1rpx solid #ececec;
	background: #fff;
	display: flex;
	align-items: center;
	padding: 0 26rpx;
	box-sizing: border-box;
	box-shadow: 0 3rpx 10rpx rgba(0, 0, 0, 0.03);
}
.field-input { width: 100%; font-size: 13px; color: #222; line-height: 20px; }
.field-placeholder { color: #c0c0c0; font-size: 13px; }

.footer-bar {
	padding: 18rpx 24rpx;
	padding-bottom: calc(36px + env(safe-area-inset-bottom));
	box-sizing: border-box;
	background: #fff;
}
.verify-btn {
	height: 88rpx;
	border-radius: 44rpx;
	background: #ffe60f;
	display: flex;
	align-items: center;
	justify-content: center;
}
.notice-mask { position: fixed; inset: 0; z-index: 100; display: flex; align-items: flex-start; justify-content: center; background: #5b5b5b; }
.notice-panel { width: 316px; margin-top: 241px; overflow: visible; border-radius: 20px; background: #fff; }
.notice-title { display: block; padding: 20px 20px 0; text-align: center; font-size: 16px; line-height: 22px; font-weight: 600; color: #222; }
.notice-body { display: block; min-height: 185px; padding: 38px 27px 24px; box-sizing: border-box; font-size: 13px; line-height: 15px; color: #7c7c7c; }
.notice-actions { position:relative; display: flex; height:51px; border-top: 1px solid #eee; }
.notice-actions:after{content:'';position:absolute;left:316px;top:-1px;width:30px;height:52px;background:#ffe600}
.notice-btn { flex: 1; height: 51px; display: flex; align-items: center; justify-content: center; }
.notice-btn text { font-size: 14px; }
.notice-btn.muted text { color: #999; }
.notice-btn.primary { background: #5b5b5b; }
.notice-btn.primary text { color: #222; }
.notice-panel--privacy{width:317px;margin-top:325px;border-radius:20px}.notice-panel--privacy .notice-title{padding-top:18px}.notice-panel--privacy .notice-body{min-height:72px;padding:20px 27px 16px}.notice-panel--privacy .notice-actions{height:52px}.notice-panel--privacy .notice-actions:after{left:317px}
.verify-btn text { font-size: 14px; font-weight: 600; color: #1d1d1d; line-height: 20px; }
</style>
