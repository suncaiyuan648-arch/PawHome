<template>
	<view class="auth-page">
		<PawPageNav title="实名认证" :title-centered="true" background="#fff" fallback-url="/pages/yard/catGuide" />

		<view class="page-body">
			<text class="page-sub">请填写您的实名信息</text>

			<view class="form-wrap">
				<view class="field">
					<text class="field-label">姓名</text>
					<view class="field-input-wrap">
						<input class="field-input" type="text" :value="form.name" placeholder="请输入您的真实姓名"
							placeholder-class="field-placeholder" @input="onNameInput" />
					</view>
				</view>

				<view class="field">
					<text class="field-label">身份证号</text>
					<view class="field-input-wrap">
						<input class="field-input" type="text" :value="form.idNo" placeholder="请输入您的身份证号码"
							placeholder-class="field-placeholder" @input="onIdInput" />
					</view>
				</view>
			</view>
		</view>

		<view class="footer-bar">
			<view class="verify-btn" @click="onVerify">
				<text>人脸核验</text>
			</view>
		</view>

		<PawRealNamePrompt :visible="!!noticeType" :type="noticeType || 'real-name'"
			@update:visible="onNoticeVisibleChange" @confirm="onNoticeConfirm" />

		<!-- 人脸核验接口接入前的本地结果模拟，使用共享底部弹层承载选项 -->
		<PawBottomSheet v-model="verifyResultSheetVisible" variant="verify-result-picker" height="220px"
			:close-on-mask="true" :safe-area="false" :z-index="10030">
			<view class="verify-result-sheet" @tap.stop>
				<text class="verify-result-sheet__title">模拟核验结果</text>
				<view class="verify-result-sheet__options">
					<view class="verify-result-sheet__option" @tap="completeVerification('success')">
						<text>模拟核验通过</text>
					</view>
					<view class="verify-result-sheet__option" @tap="completeVerification('fail')">
						<text>模拟核验失败</text>
					</view>
				</view>
				<view class="verify-result-sheet__cancel" @tap="verifyResultSheetVisible = false">
					<text>取消</text>
				</view>
			</view>
		</PawBottomSheet>
	</view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawRealNamePrompt from '@/components/auth/PawRealNamePrompt.vue'
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import { setRealNameVerified } from '@/utils/realNameMock.js'

export default {
	components: { PawPageNav, PawRealNamePrompt, PawBottomSheet },
	data() {
		return {
			noticeType: '',
			verifyResultSheetVisible: false,
			form: {
				name: '',
				idNo: ''
			}
		}
	},
	onLoad(options = {}) {
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
			this.verifyResultSheetVisible = true
		},
		completeVerification(status) {
			const normalizedStatus = status === 'success' ? 'success' : 'fail'
			this.verifyResultSheetVisible = false
			setRealNameVerified(normalizedStatus === 'success')
			uni.navigateTo({ url: '/pages/auth/verifyResult?status=' + normalizedStatus })
		},
		onNoticeVisibleChange(value) {
			if (!value) this.noticeType = ''
		},
		onNoticeConfirm() {
			this.noticeType = ''
		}
	}
}
</script>

<style scoped>
.auth-page {
	min-height: 100vh;
	background: #fff;
	display: flex;
	flex-direction: column;
}

.page-body {
	flex: 1;
	padding: 30px 27px 24px;
	box-sizing: border-box;
}

.page-sub {
	display: block;
	font-size: 14px;
	color: #999;
	line-height: 20px;
}

.form-wrap {
	margin-top: 110px;
}

.field {
	margin-bottom: 36px;
}

.field-label {
	display: block;
	margin-bottom: 15px;
	font-size: 14px;
	font-weight: 500;
	color: #222;
	line-height: 20px;
}

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

.field-input {
	width: 100%;
	font-size: 13px;
	color: #222;
	line-height: 20px;
}

.field-placeholder {
	color: #c0c0c0;
	font-size: 13px;
}

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

.verify-btn text {
	font-size: 14px;
	font-weight: 500;
	color: #1d1d1d;
	line-height: 20px;
}

.verify-result-sheet {
	width: 100%;
	height: 220px;
	padding: 20px 16px 12px;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
}

.verify-result-sheet__title {
	display: block;
	font-size: 16px;
	font-weight: 500;
	line-height: 22px;
	text-align: center;
	color: #222;
}

.verify-result-sheet__options {
	display: flex;
	flex: 1;
	align-items: center;
	justify-content: center;
	gap: 12px;
}

.verify-result-sheet__option,
.verify-result-sheet__cancel {
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
}

.verify-result-sheet__option {
	flex: 1;
	height: 44px;
	border-radius: 22px;
	background: #ffe60f;
}

.verify-result-sheet__option:last-child {
	background: #f5f5f5;
}

.verify-result-sheet__option text,
.verify-result-sheet__cancel text {
	font-size: 14px;
	line-height: 20px;
	color: #222;
}

.verify-result-sheet__cancel {
	height: 28px;
}

.verify-result-sheet__cancel text {
	color: #888;
}
</style>
