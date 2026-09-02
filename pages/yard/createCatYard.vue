<template>
	<view class="yard-page">
		<PawPageNav background="#defa93" fallback-url="/pages/yard/catGuide" />

		<view class="yard-heading" data-qa="create-yard-heading">
			<text class="hello-strong">Hello</text>
			<text class="hello-soft">，欢迎创建流浪{{ animalKind === 'dog' ? '狗' : '猫' }}小院~</text>
		</view>

		<scroll-view class="content" scroll-y :enable-flex="true" :show-scrollbar="false">
			<view class="content-inner">
				<view class="card cover-card" data-qa="create-yard-intro-card">
					<view class="cover-top">
						<view class="cover-inner">
							<image class="cover-camera" src="/static/figma/create-yard/camera.svg" mode="aspectFit" />
							<text class="cover-tip">小院头像</text>
						</view>
						<view v-if="voiceSavedSeconds <= 0" class="mic-btn" data-qa="create-yard-record"
							@tap="openVoicePopup">
							<image class="mic-icon" src="/static/figma/create-yard/mic.svg" mode="aspectFit" />
						</view>
					</view>

					<view v-if="voiceSavedSeconds > 0" class="voice-chip-row">
						<view class="voice-chip-pill">
							<image class="voice-chip-icon" src="/static/figma/voice/record-audio.svg"
								mode="aspectFit" />
							<text class="voice-chip-sec">{{ voiceSavedSeconds }}″</text>
						</view>
						<view class="voice-chip-del" data-qa="create-yard-record-delete" @tap.stop="clearSavedVoice">
							<image src="/static/figma/create-yard/clear.svg" mode="aspectFit" />
						</view>
					</view>

					<view class="intro-text-wrap">
						<textarea class="intro-area" :value="introText" maxlength="500" placeholder="请写下小院简介"
							placeholder-class="create-yard-placeholder" @input="onIntroInput" />
						<text class="count">{{ introLen }}/500</text>
					</view>
				</view>

				<view class="card form-card" data-qa="create-yard-form">
					<view class="form-row form-row--input">
						<view class="form-row__content">
							<text class="form-label">小院名称</text>
							<view class="form-control">
								<input class="form-input" :value="yardName" maxlength="40"
									:placeholder="animalKind === 'dog' ? '地点+名字，例如：朝阳小区汪汪队' : '地点+名字，例如：朝阳小区猫猫队'"
									placeholder-class="create-yard-placeholder" @input="onYardNameInput" />
							</view>
						</view>
						<image class="row-chevron" src="/static/figma/create-yard/arrow-right.svg" mode="aspectFit" />
					</view>

					<view class="form-row form-row--input">
						<view class="form-row__content">
							<text class="form-label">联系方式</text>
							<view class="form-control">
								<input class="form-input" :value="yardContact" maxlength="40"
									placeholder="请填写手机号或微信号用于领养" placeholder-class="create-yard-placeholder"
									@input="onContactInput" />
							</view>
						</view>
						<image class="row-chevron" src="/static/figma/create-yard/arrow-right.svg" mode="aspectFit" />
					</view>

					<view class="form-row form-row--location" @tap="openLocationSearch">
						<text class="form-label">小院定位</text>
						<text class="location-value">{{ locDetail || '湖南省长沙市雨花区中意一路167号鼎丰前城' }}</text>
						<view class="location-actions">
							<view class="location-clear" data-qa="create-yard-location-clear"
								@tap.stop="clearLocDetail">
								<image src="/static/figma/create-yard/clear.svg" mode="aspectFit" />
							</view>
							<view class="location-pin" data-qa="create-yard-location" @tap.stop="openLocationSearch">
								<image src="/static/figma/create-yard/location-pin.svg" mode="aspectFit" />
							</view>
						</view>
					</view>
				</view>

				<view class="card adopt-card">
					<view class="intro-text-wrap intro-text-wrap--adopt">
						<textarea class="intro-area intro-area--adopt" :value="adoptMsg" maxlength="500"
							placeholder="有什么想对领养人说的，将会在您同意领养人的领养申请后，展示给领养人看。您可补充小流浪平时爱出没的地点，小流浪的性格等，为防止虐猫群体恶意领养，请您审查领养人的历史记录后再做决定。"
							placeholder-class="create-yard-placeholder" @input="onAdoptInput" />
						<text class="count">{{ adoptLen }}/500</text>
					</view>
				</view>

				<view v-if="!shippingPick" class="card addr-card" @tap="openPickShipping">
					<view class="address-icon">
						<image class="address-icon__circle" src="/static/figma/create-yard/address-pin-circle.svg"
							mode="aspectFit" />
						<image class="address-icon__pin" src="/static/figma/create-yard/address-pin.png"
							mode="aspectFit" />
					</view>
					<view class="addr-main">
						<text class="addr-title">请填写收货地址，用于接收猫粮</text>
						<text class="addr-sub">不对外展示，可放心填写</text>
					</view>
					<view class="addr-action">
						<text>添加</text>
						<image src="/static/figma/create-yard/arrow-right.svg" mode="aspectFit" />
					</view>
				</view>
				<view v-else class="card addr-card addr-card--picked" @tap="openPickShipping">
					<view class="address-icon">
						<image class="address-icon__circle" src="/static/figma/create-yard/address-pin-circle.svg"
							mode="aspectFit" />
						<image class="address-icon__pin" src="/static/figma/create-yard/address-pin.png"
							mode="aspectFit" />
					</view>
					<view class="addr-main">
						<text class="addr-line1">{{ shippingPick.detail }}</text>
						<text class="addr-line2">{{ shippingPick.name }} {{ shippingPick.phone }}</text>
					</view>
					<view class="addr-action addr-action--edit">
						<text>修改</text>
						<image src="/static/figma/create-yard/arrow-right.svg" mode="aspectFit" />
					</view>
				</view>
			</view>
		</scroll-view>

		<PawSafeArea class="footer-safe">
			<view class="footer">
				<view class="save-btn" data-qa="create-yard-save" @tap="onSaveYard">保存去添加{{ animalKind === 'dog' ? '狗狗'
					: '猫咪' }}</view>
			</view>
		</PawSafeArea>

		<PawVoiceRecorderSheet :visible="showVoicePopup" :recording="recording" :duration="recordSeconds"
			@update:visible="onVoiceSheetVisibleChange" @record-start="startRecord" @record-end="endRecord" />
		<PawRealNamePrompt :visible="showRealNamePrompt" type="real-name" @update:visible="showRealNamePrompt = $event"
			@confirm="goRealName" />
		<PawNoticeModal v-model:visible="showVoiceNotice" :message="voiceNoticeMessage" />
	</view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawSafeArea from '@/components/base/PawSafeArea.vue'
import PawVoiceRecorderSheet from '@/components/voice/PawVoiceRecorderSheet.vue'
import PawNoticeModal from '@/components/PawNoticeModal.vue'
import PawRealNamePrompt from '@/components/auth/PawRealNamePrompt.vue'
import { isRealNameVerified } from '@/utils/realNameMock.js'
import { PAW_MSG_VOICE_LEVEL, PAW_MSG_VOICE_DAY_LIMIT } from '@/utils/pawNoticeMessages.js'

export default {
	name: 'CreateCatYardPage',
	components: { PawPageNav, PawSafeArea, PawVoiceRecorderSheet, PawNoticeModal, PawRealNamePrompt },
	data() {
		return {
			animalKind: 'cat',
			showVoiceNotice: false,
			showRealNamePrompt: false,
			voiceNoticeMessage: PAW_MSG_VOICE_LEVEL,
			showVoicePopup: false,
			recording: false,
			recordSeconds: 0,
			recordTimer: null,
			recordStartAt: 0,
			voiceSavedSeconds: 0,
			introText: '',
			adoptMsg: '',
			yardName: '',
			yardContact: '',
			regionParts: [],
			locDetail: '',
			shippingPick: null
		}
	},
	computed: {
		introLen() {
			return (this.introText || '').length
		},
		adoptLen() {
			return (this.adoptMsg || '').length
		}
	},
	onUnload() {
		this.clearRecordTimer()
	},
	onLoad(options = {}) {
		this.animalKind = options.kind === 'dog' ? 'dog' : 'cat'
		this.locDetail = '湖南省长沙市雨花区中意一路167号鼎丰前城'
		if (options.state === 'recorded') {
			this.voiceSavedSeconds = 2
			this.shippingPick = {
				id: 'figma-recorded',
				detail: '中意一路鼎丰前城2栋2单元18楼...',
				name: '项子涵',
				phone: '19878675365'
			}
		}
		if (options.popup === 'voice-permission') {
			this.voiceNoticeMessage = PAW_MSG_VOICE_LEVEL
			this.showVoiceNotice = true
		}
		if (options.popup === 'voice-limit') {
			this.voiceNoticeMessage = PAW_MSG_VOICE_DAY_LIMIT
			this.showVoiceNotice = true
		}
		if (options.auth === 'required' || !isRealNameVerified()) this.showRealNamePrompt = true
	},
	methods: {
		doTrim(value) {
			return (value || '').trimStart()
		},
		goRealName() {
			this.showRealNamePrompt = false
			uni.navigateTo({ url: '/pages/auth/realName' })
		},
		onIntroInput(e) {
			this.introText = e.detail.value || ''
		},
		onAdoptInput(e) {
			this.adoptMsg = e.detail.value || ''
		},
		onYardNameInput(e) {
			this.yardName = this.doTrim(e.detail.value)
		},
		onContactInput(e) {
			this.yardContact = this.doTrim(e.detail.value)
		},
		openLocationSearch() {
			const city = this.regionParts[1] || this.regionParts[0] || uni.getStorageSync('selectedCity') || '广州市'
			uni.navigateTo({
				url: '/pages/meMore/locationSearch',
				events: {
					locationPicked: (payload = {}) => {
						const value = (payload.detail || '').trim()
						if (value) this.locDetail = value
					}
				},
				success: (res) => {
					res.eventChannel.emit('initLocation', { city })
				}
			})
		},
		clearLocDetail() {
			this.locDetail = ''
		},
		openPickShipping() {
			uni.navigateTo({
				url: '/pages/meMore/shippingAddress?pick=1',
				events: {
					addressPicked: (payload = {}) => {
						if (!payload || !payload.detail) return
						this.shippingPick = {
							id: payload.id,
							name: payload.name || '',
							phone: payload.phone || '',
							detail: payload.detail || ''
						}
					}
				}
			})
		},
		onSaveYard() {
			const title = (this.yardName || '').trim() || '我就是要喂猫'
			uni.navigateTo({
				url: '/pages/yard/yardCats?name=' + encodeURIComponent(title)
			})
		},
		openVoicePopup() {
			this.showVoicePopup = true
		},
		onVoiceSheetVisibleChange(value) {
			this.showVoicePopup = value
			if (!value && this.recording) this.endRecord(true)
		},
		startRecord() {
			if (this.recording) return
			this.recording = true
			this.recordStartAt = Date.now()
			this.recordSeconds = 0
			this.clearRecordTimer()
			this.recordTimer = setInterval(() => {
				const seconds = Math.floor((Date.now() - this.recordStartAt) / 1000)
				this.recordSeconds = Math.min(59, seconds)
				if (this.recordSeconds >= 59) this.endRecord(true)
			}, 200)
		},
		endRecord(saveToForm = true) {
			if (!this.recording) return
			this.recording = false
			this.clearRecordTimer()
			const seconds = Math.min(59, Math.max(0, Math.floor((Date.now() - this.recordStartAt) / 1000)))
			if (saveToForm !== false && seconds > 0) {
				this.voiceSavedSeconds = seconds
				this.showVoicePopup = false
			}
		},
		clearSavedVoice() {
			this.voiceSavedSeconds = 0
		},
		clearRecordTimer() {
			if (!this.recordTimer) return
			clearInterval(this.recordTimer)
			this.recordTimer = null
		}
	}
}
</script>

<style scoped>
.yard-page {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100vh;
	min-height: 100vh;
	overflow: hidden;
	box-sizing: border-box;
	background: linear-gradient(180deg, #defa93 0, #defa93 279px, #f6f8fa 279px, #f6f8fa 100%);
	color: #282827;
}

.yard-heading {
	display: flex;
	flex: 0 0 77px;
	width: 100%;
	align-items: flex-start;
	box-sizing: border-box;
	padding: 11px 12px 0;
	white-space: nowrap;
}

.hello-strong {
	color: #282827;
	font-size: 28px;
	font-weight: 700;
	line-height: 34px;
}

.hello-soft {
	margin-left: 0;
	color: #282827;
	font-size: 22px;
	font-weight: 700;
	line-height: 34px;
}

.content {
	flex: 1 1 auto;
	width: 100%;
	min-height: 0;
	box-sizing: border-box;
	padding: 0 10px;
}

.content-inner {
	display: flex;
	flex-direction: column;
	width: 100%;
	gap: 10px;
	padding-bottom: 16px;
	box-sizing: border-box;
}

.card {
	flex: 0 0 auto;
	width: 100%;
	box-sizing: border-box;
	background: #fff;
}

.cover-card {
	display: flex;
	flex-direction: column;
	height: 279px;
	padding: 12px 12px 8px;
	border-radius: 12px;
}

.cover-top {
	display: flex;
	flex: 0 0 94px;
	width: 100%;
	height: 94px;
	align-items: flex-start;
	justify-content: space-between;
}

.cover-inner {
	display: flex;
	flex: 0 0 94px;
	width: 94px;
	height: 94px;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	border-radius: 12px;
	background: #f6f8fa;
}

.cover-camera {
	display: block;
	width: 28px;
	height: 28px;
}

.cover-tip {
	margin-top: 4px;
	color: #b6b6b8;
	font-size: 12px;
	font-weight: 700;
	line-height: 17px;
	white-space: nowrap;
}

.mic-btn {
	display: flex;
	flex: 0 0 25px;
	width: 25px;
	height: 25px;
	align-items: center;
	align-self: flex-end;
	justify-content: center;
}

.mic-icon {
	display: block;
	width: 25px;
	height: 25px;
}

.voice-chip-row {
	display: flex;
	flex: 0 0 33px;
	width: 100%;
	height: 33px;
	align-items: center;
	gap: 8px;
	margin-top: 5px;
}

.voice-chip-pill {
	display: flex;
	flex: 0 0 65px;
	width: 65px;
	height: 33px;
	align-items: center;
	padding: 0 0 0 11px;
	box-sizing: border-box;
	border: .5px solid #e6e6e6;
	border-radius: 7px;
	background: #fafafa;
}

.voice-chip-icon {
	display: block;
	width: 14px;
	height: 14px;
}

.voice-chip-sec {
	margin-left: 6px;
	color: #282827;
	font-size: 13px;
	font-weight: 500;
	line-height: 18px;
}

.voice-chip-del,
.location-clear {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 16px;
	height: 16px;
}

.voice-chip-del image,
.location-clear image {
	display: block;
	width: 16px;
	height: 16px;
}

.intro-text-wrap {
	position: relative;
	display: flex;
	flex: 1 1 auto;
	width: 100%;
	min-height: 0;
	margin-top: 5px;
	box-sizing: border-box;
}

.intro-text-wrap--adopt {
	height: 100%;
	margin-top: 0;
}

.intro-area {
	display: block;
	width: 100%;
	height: 100%;
	min-height: 0;
	padding: 10px 0 24px;
	box-sizing: border-box;
	color: #282827;
	font-size: 14px;
	line-height: 20px;
}

.intro-area--adopt {
	padding-top: 0;
	padding-bottom: 24px;
}

.count {
	position: absolute;
	right: 0;
	bottom: 0;
	color: #b6b6b8;
	font-size: 13px;
	line-height: 20px;
	text-align: right;
}

.form-card {
	display: flex;
	flex-direction: column;
	padding: 8px 12px;
	border-radius: 8px;
}

.form-row {
	display: flex;
	width: 100%;
	min-width: 0;
	box-sizing: border-box;
	border-bottom: .5px solid #f6f8fa;
}

.form-row--input {
	height: 57px;
	align-items: center;
	justify-content: space-between;
}

.form-row--location {
	min-height: 75px;
	align-items: center;
	gap: 26px;
	border-bottom: 0;
}

.form-row__content {
	display: flex;
	flex: 1 1 auto;
	min-width: 0;
	align-items: center;
	gap: 26px;
}

.form-label {
	flex: 0 0 54px;
	width: 54px;
	color: #282827;
	font-size: 14px;
	font-weight: 500;
	line-height: 20px;
	white-space: nowrap;
}

.form-control {
	flex: 1 1 auto;
	min-width: 0;
}

.form-input {
	display: block;
	width: 100%;
	padding: 0;
	color: #282827;
	font-size: 14px;
	line-height: 20px;
	text-align: left;
}

.create-yard-placeholder {
	color: #a3a39f;
	font-size: 14px;
	font-weight: 400;
}

.row-chevron {
	display: block;
	flex: 0 0 16px;
	width: 16px;
	height: 16px;
	margin-left: 8px;
}

.location-value {
	flex: 1 1 auto;
	min-width: 0;
	color: #333;
	font-size: 14px;
	line-height: 20px;
	word-break: break-all;
}

.location-actions {
	display: flex;
	flex: 0 0 auto;
	align-items: center;
	gap: 8px;
	margin-left: 0;
}

.location-pin {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
}

.location-pin image {
	display: block;
	width: 24px;
	height: 24px;
}

.adopt-card {
	display: flex;
	height: 206px;
	padding: 18px 12px 5px;
	border-radius: 12px;
}

.addr-card {
	display: flex;
	height: 68px;
	align-items: center;
	padding: 0 8px 0 6px;
	border-radius: 20px;
}

.address-icon {
	position: relative;
	display: flex;
	flex: 0 0 35px;
	width: 35px;
	height: 35px;
	align-items: center;
	justify-content: center;
}

.address-icon__circle {
	display: block;
	width: 35px;
	height: 35px;
}

.address-icon__pin {
	position: absolute;
	top: 8px;
	left: 8px;
	display: block;
	width: 20px;
	height: 19px;
}

.addr-main {
	display: flex;
	flex: 1 1 auto;
	min-width: 0;
	flex-direction: column;
	margin-left: 13px;
}

.addr-title,
.addr-line1 {
	color: #333;
	font-size: 14px;
	font-weight: 500;
	line-height: 20px;
	white-space: nowrap;
}

.addr-sub,
.addr-line2 {
	margin-top: 2px;
	color: #999;
	font-size: 13px;
	line-height: 19px;
	white-space: nowrap;
}

.addr-action {
	display: flex;
	flex: 0 0 auto;
	align-items: center;
	gap: 2px;
	margin-left: 8px;
	color: #fd6302;
	font-size: 13px;
	line-height: 20px;
}

.addr-action image {
	display: block;
	width: 16px;
	height: 16px;
}

.footer-safe {
	flex: 0 0 auto;
	width: 100%;
	background: #fff;
}

.footer {
	width: 100%;
	height: 55px;
	padding: 8px 12px 0;
	box-sizing: border-box;
	background: #fff;
}

.save-btn {
	display: flex;
	width: 100%;
	height: 43px;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	border-radius: 22px;
	background: #defa93;
	color: #282827;
	font-size: 16px;
	font-weight: 700;
	line-height: 27px;
	white-space: nowrap;
}
</style>
