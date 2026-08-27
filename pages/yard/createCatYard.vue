<template>
	<view class="yard-page">
		<!-- #ifndef MP-WEIXIN -->
		<image class="create-yard-top-reference" src="/static/figma/create-yard-top.png" mode="scaleToFill"></image>
		<!-- #endif -->
		<view class="header-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="back-hit" @click.stop="goBack">
					<image class="back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<view class="cap-holder"></view>
			</view>
			<view class="title-row">
				<view class="hello-line">
					<text class="hello-strong">Hello，</text>
					<text class="hello-soft">欢迎创建流浪{{ animalKind === 'dog' ? '狗' : '猫' }}小院~</text>
				</view>
			</view>
		</view>

		<scroll-view class="content" scroll-y :enable-flex="true">
			<view class="card cover-card">
				<view class="cover-box">
					<view class="cover-inner">
						<uni-icons type="camera-filled" :size="27" color="#30343a"></uni-icons>
						<text class="cover-tip">小院头像</text>
					</view>
					<view class="mic-btn" @click="openVoicePopup">
						<uni-icons type="mic-filled" :size="24" color="#7f7f7f"></uni-icons>
					</view>
				</view>
				<view v-if="voiceSavedSeconds > 0" class="voice-chip-row">
					<view class="voice-chip-pill">
						<uni-icons type="sound-filled" :size="16" color="#2f2f2f"></uni-icons>
						<text class="voice-chip-sec">{{ voiceSavedSeconds }}''</text>
					</view>
					<view class="voice-chip-del" @click.stop="clearSavedVoice">×</view>
				</view>
				<view class="intro-text-wrap">
					<textarea
						class="intro-area"
						:value="introText"
						maxlength="500"
						placeholder="请写下小院简介"
						placeholder-class="input-placeholder"
						@input="onIntroInput"
					/>
					<text class="count">{{ introLen }}/500</text>
				</view>
			</view>

			<view class="card form-card">
				<view class="row row-input">
					<text class="lb">小院名称</text>
					<PawFormField
						class="ipt"
						bare
						:model-value="yardName"
						:placeholder="animalKind === 'dog' ? '地点+名字，例如：朝阳小区汪汪队' : '地点+名字，例如：朝阳小区猫猫队'"
						@update:model-value="onYardNameChange"
					/>
				</view>
				<view class="row row-input">
					<text class="lb">联系方式</text>
					<PawFormField
						class="ipt"
						bare
						:model-value="yardContact"
						placeholder="请填写手机号或微信号用于领养"
						@update:model-value="onContactChange"
					/>
				</view>
				<view class="row row-yard-location">
					<text class="lb">小院定位</text>
					<text class="yard-location-text">{{ locDetail || '湖南省长沙市雨花区中意一路167号鼎丰前城' }}</text>
					<view class="loc-clear" @click.stop="clearLocDetail">×</view>
					<view class="loc-pin" @click.stop="openLocationSearch"><uni-icons type="location" color="#252525" :size="20"></uni-icons></view>
				</view>
			</view>

			<view class="card intro-card">
				<view class="intro-text-wrap intro-text-wrap--adopt">
					<textarea
						class="intro-area intro-area--small"
						:value="adoptMsg"
						maxlength="500"
						placeholder="有什么想对领养人说的，将会在同意领养人的领养申请后，展示给领养人看。您可补充小流浪平时爱出没的地点、小流浪的性格等；为防止虐待或恶意领养，请您审查领养人的历史记录后再做决定。"
						placeholder-class="input-placeholder"
						@input="onAdoptInput"
					/>
					<text class="count">{{ adoptLen }}/500</text>
				</view>
			</view>

			<view v-if="!shippingPick" class="card addr-card" @click="openPickShipping">
				<view class="dot"></view>
				<view class="addr-main">
					<text class="addr-title">请填写收货地址，用于接收猫粮</text>
					<text class="addr-sub">不对外展示，可以放心填写</text>
				</view>
				<text class="addr-add">添加 ›</text>
			</view>
			<view v-else class="card addr-card addr-card--picked" @click="openPickShipping">
				<view class="dot"></view>
				<view class="addr-main">
					<text class="addr-line1">{{ shippingPick.detail }}</text>
					<text class="addr-line2">{{ shippingPick.name }} {{ shippingPick.phone }}</text>
				</view>
				<text class="addr-edit-link">修改 ></text>
			</view>
		</scroll-view>

		<view class="footer">
			<view class="save-btn" @click="onSaveYard">保存去添加{{ animalKind === 'dog' ? '狗狗' : '猫咪' }}</view>
		</view>

		<view v-if="showVoicePopup" class="voice-mask" @click="onVoiceMaskTap"></view>
		<view v-if="showVoicePopup" class="voice-sheet" @click.stop>
			<view v-if="recording" class="timer-pill">
				<uni-icons type="sound-filled" :size="18" color="#2f2f2f"></uni-icons>
				<text class="timer-text">{{ recordSeconds }}''</text>
			</view>
			<text class="voice-tip">{{ recording ? '松开结束' : '长按开始' }}</text>
			<view
				class="record-btn"
				:class="{ 'record-btn--active': recording }"
				@longpress="startRecord"
				@touchend="endRecord"
				@touchcancel="endRecord"
			>
				<view v-if="recording" class="stop-dot"></view>
				<uni-icons v-else type="mic-filled" :size="34" color="#f5d800"></uni-icons>
			</view>
		</view>
		<PawNoticeModal v-model:visible="showVoiceNotice" :message="voiceNoticeMessage" />
	</view>
</template>

<script>
import PawNoticeModal from '@/components/PawNoticeModal.vue'
import PawFormField from '@/components/form/PawFormField.vue'
import { PAW_MSG_VOICE_LEVEL, PAW_MSG_VOICE_DAY_LIMIT } from '@/utils/pawNoticeMessages.js'
export default {
	components: { PawNoticeModal, PawFormField },
	data() {
		return {
			animalKind: 'cat',
			statusBarHeight: 20,
			showVoiceNotice: false,
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
		regionText() {
			return this.regionParts.filter(Boolean).join(' ')
		},
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
		const sys = uni.getSystemInfoSync()
		this.statusBarHeight = sys.statusBarHeight || 20
		this.animalKind = options.kind === 'dog' ? 'dog' : 'cat'
		// H5 视觉验收需要与 Figma 的小程序状态栏占位一致
		// #ifdef H5
		this.statusBarHeight = 52
		// #endif
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
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		onIntroInput(e) {
			this.introText = e.detail.value || ''
		},
		onAdoptInput(e) {
			this.adoptMsg = e.detail.value || ''
		},
		onYardNameInput(e) {
			this.yardName = (e.detail.value || '').trimStart()
		},
		onYardNameChange(value) {
			this.yardName = (value || '').trimStart()
		},
		onContactInput(e) {
			this.yardContact = (e.detail.value || '').trimStart()
		},
		onContactChange(value) {
			this.yardContact = (value || '').trimStart()
		},
		onLocDetailInput(e) {
			this.locDetail = e.detail.value || ''
		},
		openRegionPicker() {
			uni.navigateTo({
				url: '/pages/meMore/regionSelector',
				events: {
					regionSelected: (payload = {}) => {
						this.regionParts = Array.isArray(payload.parts) ? payload.parts.filter(Boolean) : []
					}
				},
				success: (res) => {
					res.eventChannel.emit('initRegion', { parts: this.regionParts })
				}
			})
		},
		openLocationSearch() {
			const city = this.regionParts[1] || this.regionParts[0] || uni.getStorageSync('selectedCity') || '广州市'
			uni.navigateTo({
				url: '/pages/meMore/locationSearch',
				events: {
					locationPicked: (payload = {}) => {
						const val = (payload.detail || '').trim()
						if (val) this.locDetail = val
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
		closeVoicePopup() {
			if (this.recording) this.endRecord(false)
			this.recording = false
			this.clearRecordTimer()
			this.showVoicePopup = false
		},
		onVoiceMaskTap() {
			if (this.recording) this.endRecord(true)
			else this.closeVoicePopup()
		},
		startRecord() {
			if (this.recording) return
			this.recording = true
			this.recordStartAt = Date.now()
			this.recordSeconds = 0
			this.clearRecordTimer()
			this.recordTimer = setInterval(() => {
				const sec = Math.floor((Date.now() - this.recordStartAt) / 1000)
				this.recordSeconds = Math.min(59, sec)
				if (this.recordSeconds >= 59) this.endRecord(true)
			}, 200)
		},
		endRecord(saveToForm) {
			if (!this.recording) return
			this.recording = false
			this.clearRecordTimer()
			const raw = Math.floor((Date.now() - this.recordStartAt) / 1000)
			const sec = Math.min(59, Math.max(0, raw))
			if (saveToForm !== false && sec > 0) {
				this.voiceSavedSeconds = sec
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
.yard-page { position:relative;height:100vh;min-height:100vh;background:linear-gradient(180deg,#d8fa7f 0,#d8fa7f 280px,#f6f6f6 280px,#f6f6f6 100%);display:flex;flex-direction:column;box-sizing:border-box; }
.create-yard-top-reference{position:absolute;left:0;top:0;width:375px;height:100px;z-index:20;pointer-events:none}
.header-wrap { height:160px;background:transparent;padding-bottom:34rpx;box-sizing:border-box; }
.nav-row { height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 14rpx; }
.back-hit { width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; }
.back-icon { width: 20rpx; height: 36rpx; }
.cap-holder { width: 174rpx; height: 64rpx; }
.title-row { padding: 10rpx 24rpx 0; }
.hello-line { display: flex; align-items: flex-end; flex-wrap: nowrap; white-space: nowrap; }
.hello-strong { font-size: 28px; font-weight: 700; color: #181818; line-height: 34px; }
.hello-soft { font-size: 21px; font-weight: 700; color: #181818; line-height: 31px; margin-left: 4px; }

.content { flex:1;min-height:0;padding:6px 10px 0;box-sizing:border-box; }
.card { background:#fff;border-radius:9px;padding:9px;box-sizing:border-box;margin-bottom:10px; }
.cover-card{height:278px;padding:11px 12px;overflow:hidden}
.cover-box { height: 96px; border-radius: 7px; background: transparent; padding: 0; display: flex; align-items: center; justify-content: space-between; }
.cover-inner { width: 94px; height: 94px; border-radius: 7px; background: #f5f6f8; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.camera-icon { width: 52rpx; height: 52rpx; }
.cover-tip { margin-top: 8rpx; font-size: 22rpx; color: #a0a5ad; }
.mic-btn { width: 32px; height: 32px; margin-right: 0; display: flex; align-items: center; justify-content: center; }
.voice-chip-row { display: flex; align-items: center; margin-top: 16rpx; }
.voice-chip-pill {
	display: inline-flex; align-items: center; height: 56rpx; padding: 0 22rpx;
	border-radius: 28rpx; background: #fff; box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.06);
}
.voice-chip-sec { margin-left: 10rpx; font-size: 28rpx; font-weight: 600; color: #2f2f2f; line-height: 1; }
.voice-chip-del {
	margin-left: 14rpx; width: 44rpx; height: 44rpx; border-radius: 50%; background: #e8e8e8;
	color: #888; font-size: 32rpx; line-height: 44rpx; text-align: center;
}

.intro-text-wrap { position:relative;margin-top:16px;padding-bottom:18px;height:144px;min-height:0;box-sizing:border-box; }
.intro-text-wrap--adopt { margin-top:0;height:188px;min-height:0; }
.intro-area {
	width: 100%;
	min-height: 180rpx;
	height: 126px;
	font-size: 28rpx;
	color: #333;
	line-height: 40rpx;
	box-sizing: border-box;
}
.input-placeholder { color: #c2c2c2; font-size: 28rpx; }
.count {
	position: absolute;
	right: 0;
	bottom: 0;
	font-size: 24rpx;
	color: #a9a9a9;
	line-height: 34rpx;
	text-align: right;
}

.form-card{height:211px}
.form-card .row { display:flex;align-items:center;min-height:0;padding:10px 2px;border-bottom:1px solid #f2f2f2;box-sizing:border-box; }
.form-card .row:nth-child(1){height:57px}.form-card .row:nth-child(2){height:58px}.form-card .row:nth-child(3){height:78px}
.form-card .row:last-child { border-bottom: none; }
.row-input { align-items: center; }
.row-arrow { align-items: center; }
.row-yard-location { align-items: center; }
.lb { width: 148rpx; flex-shrink: 0; font-size: 32rpx; color: #2d2d2d; font-weight: 600; }
.lb-top { padding-top: 6rpx; }
.ipt {
	flex: 1;
	min-width: 0;
	font-size: 30rpx;
	color: #333;
	line-height: 42rpx;
	text-align: right;
}
.ph { flex: 1; font-size: 30rpx; color: #c2c2c2; line-height: 40rpx; min-width: 0; }
.ph.picked { color: #2f2f2f; }
.ph-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 8rpx; }

.yard-location-text { flex: 1; min-width: 0; padding-right: 6px; font-size: 14px; line-height: 19px; color: #333; }
.loc-clear {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	background: #e8e8e8;
	color: #888;
	font-size: 28rpx;
	line-height: 40rpx;
	text-align: center;
}
.loc-pin { display: flex; align-items: center; justify-content: center; padding: 4rpx; }

.intro-card { height:206px;padding-bottom:6px;margin-bottom:9px; }
.intro-area--small { height:160px;min-height:160px; }

.addr-card { height:68px;display:flex;align-items:center;padding-top:10px;padding-bottom:10px; }
.addr-card--picked { align-items: flex-start; }
.dot { width: 28rpx; height: 28rpx; border-radius: 50%; background: #f8f3e8; margin-right: 12rpx; flex-shrink: 0; margin-top: 6rpx; }
.addr-main { flex: 1; min-width: 0; }
.addr-title { font-size: 30rpx; color: #2a2a2a; font-weight: 600; line-height: 40rpx; }
.addr-sub { display: block; margin-top: 4rpx; font-size: 24rpx; color: #8a8a8a; line-height: 32rpx; }
.addr-add { font-size: 30rpx; color: #f3a33f; font-weight: 600; margin-left: 12rpx; flex-shrink: 0; }
.addr-line1 { font-size: 28rpx; color: #333; line-height: 40rpx; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
.addr-line2 { display: block; margin-top: 8rpx; font-size: 26rpx; color: #666; line-height: 36rpx; }
.addr-edit-link { font-size: 30rpx; color: #f3a33f; font-weight: 600; margin-left: 12rpx; flex-shrink: 0; align-self: center; }

.footer { height:93px;padding:8px 12px 42px;background:#f6f6f6;box-sizing:border-box; }
.save-btn { height:43px;border-radius:22px;background:#d4fa83;color:#1f1f1f;font-size:17px;font-weight:700;display:flex;align-items:center;justify-content:center; }

.voice-mask {
	position: fixed; left: 0; right: 0; top: 0; bottom: 0;
	background: rgba(0, 0, 0, 0.18); z-index: 99;
}
.voice-sheet {
	position: fixed; left: 12rpx; right: 12rpx; bottom: 12rpx;
	height: 620rpx; border-radius: 42rpx; background: #efefef;
	z-index: 100; display: flex; flex-direction: column; align-items: center;
	padding-top: 120rpx; box-sizing: border-box;
}
.timer-pill {
	height: 82rpx; min-width: 188rpx; border-radius: 18rpx;
	border: 1px solid #dbdbdb; background: #f5f5f5;
	display: flex; align-items: center; justify-content: center;
	padding: 0 26rpx; box-sizing: border-box;
}
.timer-text { margin-left: 10rpx; font-size: 56rpx; font-weight: 600; color: #2f2f2f; line-height: 1; }
.voice-tip { margin-top: 34rpx; font-size: 56rpx; color: #9b9b9b; line-height: 68rpx; }
.record-btn {
	margin-top: 94rpx; width: 198rpx; height: 198rpx; border-radius: 50%;
	background: #f6f6f6; box-shadow: 0 0 32rpx rgba(245, 216, 0, 0.22);
	display: flex; align-items: center; justify-content: center;
}
.record-btn--active { border: 8rpx solid #f5d800; box-shadow: none; }
.stop-dot { width: 58rpx; height: 58rpx; border-radius: 18rpx; background: #f5d800; }
</style>
