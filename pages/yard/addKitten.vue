<template>
	<view class="page">
		<view class="hero-backdrop" aria-hidden="true"></view>
		<view class="hero">
			<PawPageNav background="transparent" :auto-back="false" @back="goBack" />
			<view class="avatar-card" @click="onPickAvatar">
				<image v-if="avatarUrl" class="avatar-img" :src="avatarUrl" mode="aspectFill"></image>
				<template v-else>
					<PawIcon class="cam-icon" name="actions/camera" :size="28" />
					<text class="avatar-tip">{{ avatarTip }}头像</text>
				</template>
			</view>
		</view>

		<scroll-view class="scroll" scroll-y :show-scrollbar="false">
			<view class="scroll-pad">
				<view class="card fields-card">
					<view class="f-row f-row--tap" @click="openSheet('status')">
						<view class="f-label">
							<text>{{ formLabel }}状态</text>
							<text class="req">*</text>
						</view>
						<text class="f-val">{{ form.status }}</text>
						<PawIcon class="f-arrow" name="navigation/chevron-right" :size="8" />
					</view>
					<view class="f-row">
						<view class="f-label">
							<text>{{ formLabel }}名字</text>
							<text class="req">*</text>
						</view>
						<input class="f-input" type="text" :value="form.name" placeholder="填写名字" placeholder-class="ph"
							@input="onNameInput" />
						<view v-if="form.name" class="f-clear" @click.stop="form.name = ''">
							<PawIcon name="navigation/clear" :size="16" label="清除" />
						</view>
					</view>
					<view class="f-row f-row--tap" @click="openSheet('value')">
						<view class="f-label">
							<text>{{ formLabel }}价值</text>
							<text class="req">*</text>
						</view>
						<text class="f-val">{{ petValue }}</text>
						<PawIcon class="f-arrow" name="navigation/chevron-right" :size="8" />
					</view>

					<template v-if="expandMore">
						<view class="f-row f-row--tap" @click="openSheet('personality')">
							<view class="f-label"><text>{{ formLabel }}性格</text></view>
							<text class="f-val" :class="{ 'f-ph': !form.personality }">{{ form.personality || '亲人'
							}}</text>
							<PawIcon class="f-arrow" name="navigation/chevron-right" :size="8" />
						</view>
						<view class="f-row f-row--tap" @click="openBreedPicker">
							<view class="f-label"><text>{{ formLabel }}品种</text></view>
							<text class="f-val">{{ form.breed }}</text>
							<PawIcon class="f-arrow" name="navigation/chevron-right" :size="8" />
						</view>
						<view class="f-row f-row--tap" @click="openSheet('gender')">
							<view class="f-label"><text>{{ formLabel }}性别</text></view>
							<text class="f-val">{{ form.gender }}</text>
							<PawIcon class="f-arrow" name="navigation/chevron-right" :size="8" />
						</view>
						<picker mode="date" :value="birthValue" @change="onBirthChange">
							<view class="f-row f-row--tap">
								<view class="f-label"><text>{{ formLabel }}生日</text></view>
								<text class="f-val">{{ birthDisplay }}</text>
								<PawIcon class="f-arrow" name="navigation/chevron-right" :size="8" />
							</view>
						</picker>
						<view class="f-row f-row--tap" @click="openSheet('neuter')">
							<view class="f-label"><text>绝育</text></view>
							<text class="f-val">{{ form.neuter }}</text>
							<PawIcon class="f-arrow" name="navigation/chevron-right" :size="8" />
						</view>
						<view class="f-row f-row--tap" @click="openSheet('vaccine')">
							<view class="f-label"><text>疫苗</text></view>
							<text class="f-val">{{ form.vaccine }}</text>
							<PawIcon class="f-arrow" name="navigation/chevron-right" :size="8" />
						</view>
					</template>

					<view class="expand-bar" @click="expandMore = !expandMore">
						<text class="expand-txt">补充更多</text>
						<PawIcon class="expand-arrow" :class="{ 'expand-arrow--open': expandMore }"
							name="navigation/expand-arrow" :size="12" />
					</view>
				</view>

				<view class="card card-desc">
					<view class="ta-wrap">
						<textarea class="ta" :value="form.desc" maxlength="200" placeholder="可以单独描述这只猫咪的性格、状况等"
							placeholder-class="ph" @input="onDescInput" />
						<text class="ta-count">{{ descLen }}/200</text>
					</view>
				</view>
			</view>
		</scroll-view>

		<view class="footer">
			<PawButton class="save-btn" size="md" block flush nowrap @click="onSave">
				<text class="save-label">保存</text>
			</PawButton>
		</view>

		<!-- 价值使用页面专属刻度，其余选项统一走选择 Sheet -->
		<PawSelectionSheet v-model="selectionSheetVisible" title="" :items="sheetOptions" :value="currentSheetValue"
			variant="form-selection" :show-close="true" @select="onPickOption" />
		<PawBottomSheet v-model="valueSheetVisible" variant="value-selection" height="497px" :close-on-mask="true"
			:safe-area="true">
			<view class="value-sheet">
				<view class="value-close" @click.stop="closeSheet">
					<PawIcon class="value-close-icon" name="navigation/value-close" :size="26" label="关闭" />
				</view>
				<text class="scale-title">宠物价值</text>
				<view class="scale-value"><text class="scale-yen">￥</text><text class="scale-number">{{ petValue
				}}</text>
				</view>
				<view class="scale-ruler-area">
					<image class="scale-ruler" src="/static/figma/pet-value-ruler.png" mode="aspectFit" />
				</view>
				<text class="scale-hint">用于设置用户申请领养时所需的领养额度</text>
				<text
					class="scale-copy">设置过低会给虐猫人群批量收猫可乘之机，设置过高会导致真正想要领养的人放弃，领养额度只是发起领养申请的门槛，您拥有申请的审核权，请综合宠物的品种、大小等因素合理设置，推荐设置15~30之间</text>
				<PawButton class="scale-save" size="md" block flush nowrap @click="closeSheet"><text>保存价值</text>
				</PawButton>
			</view>
		</PawBottomSheet>
	</view>
</template>

<script>
import PawSelectionSheet from '@/components/overlay/PawSelectionSheet.vue'
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import PawButton from '@/components/base/PawButton.vue'
import PawPageNav from '@/components/PawPageNav.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'

const STATUS_OPTS = ['待领养', '已领养', '失踪', '死亡']
const GENDER_OPTS = ['男生', '女生']
const NEUTER_OPTS = ['未绝育', '已绝育']
const VACCINE_OPTS = ['未接种', '接种中', '已接种']
const BREED_OPTS = ['蓝金', '金渐层', '银渐层', '英短', '美短', '中华田园猫']
const PERSONALITY_OPTS = ['非常亲人', '亲人', '不亲人']

export default {
	components: { PawSelectionSheet, PawBottomSheet, PawButton, PawPageNav, PawIcon },
	data() {
		return {
			petKind: 'cat',
			yardName: '',
			avatarUrl: '',
			expandMore: false,
			birthValue: '2020-06-27',
			form: {
				status: '待领养',
				name: '小坏蛋',
				breed: '白猫',
				gender: '男生',
				neuter: '未绝育',
				vaccine: '接种中',
				personality: '',
				desc: ''
			},
			mediaList: [],
			sheetKind: '',
			petValue: 15,
			personalityValue: 50
		}
	},
	computed: {
		formLabel() {
			return this.petKind === 'dog' ? '狗狗' : '猫猫'
		},
		avatarTip() {
			return this.petKind === 'dog' ? '小狗' : '小猫'
		},
		birthDisplay() {
			const p = (this.birthValue || '').split('-')
			if (p.length !== 3) return '请选择生日'
			return `${p[0]}年${Number(p[1])}月${Number(p[2])}日`
		},
		descLen() {
			return (this.form.desc || '').length
		},
		sheetOptions() {
			switch (this.sheetKind) {
				case 'status':
					return STATUS_OPTS
				case 'gender':
					return GENDER_OPTS
				case 'neuter':
					return NEUTER_OPTS
				case 'vaccine':
					return VACCINE_OPTS
				case 'personality':
					return PERSONALITY_OPTS
				default:
					return []
			}
		},
		currentSheetValue() {
			const map = { status: 'status', gender: 'gender', neuter: 'neuter', vaccine: 'vaccine', personality: 'personality' }
			return map[this.sheetKind] ? this.form[map[this.sheetKind]] : ''
		},
		selectionSheetVisible: {
			get() {
				return !!this.sheetKind && this.sheetKind !== 'value'
			},
			set(value) {
				if (!value) this.closeSheet()
			}
		},
		valueSheetVisible: {
			get() {
				return this.sheetKind === 'value'
			},
			set(value) {
				if (!value) this.closeSheet()
			}
		}
	},
	onLoad(query) {
		if (query && (query.kind === 'dog' || query.type === 'dog')) {
			this.petKind = 'dog'
			this.form.breed = '金毛'
			this.form.personality = '非常亲人'
		} else {
			this.form.breed = '蓝金'
			this.form.personality = '亲人'
		}
		if (query && query.state === 'more') this.expandMore = true
		if (query && query.yardName) {
			const y = decodeURIComponent(query.yardName)
			if (y) this.yardName = y
		}
		const popupMap = { status: 'status', value: 'value', gender: 'gender', sterilization: 'neuter', vaccine: 'vaccine', personality: 'personality' }
		if (query && popupMap[query.popup]) {
			this.expandMore = true
			this.sheetKind = popupMap[query.popup]
			if (query.popup === 'status') this.form.status = '失踪'
			if (query.popup === 'vaccine') this.form.vaccine = '已接种'
			if (query.popup === 'personality') this.form.personality = '非常亲人'
		}
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		onNameInput(e) {
			this.form.name = (e.detail.value || '').trimStart()
		},
		onDescInput(e) {
			this.form.desc = e.detail.value || ''
		},
		onBirthChange(e) {
			this.birthValue = e.detail.value || this.birthValue
		},
		openBreedPicker() {
			const kind = this.petKind === 'dog' ? 'dog' : 'cat'
			uni.navigateTo({
				url: '/pages/yard/breedPicker?kind=' + kind,
				events: {
					breedPicked: (payload = {}) => {
						const b = (payload.breed || '').trim()
						if (b) this.form.breed = b
					}
				},
				success: (res) => {
					res.eventChannel.emit('initBreed', { breed: this.form.breed })
				}
			})
		},
		openSheet(kind) {
			this.sheetKind = kind
		},
		closeSheet() {
			this.sheetKind = ''
		},
		isOptionSelected(opt) {
			const k = this.sheetKind
			if (k === 'status') return opt === this.form.status
			if (k === 'gender') return opt === this.form.gender
			if (k === 'neuter') return opt === this.form.neuter
			if (k === 'vaccine') return opt === this.form.vaccine
			if (k === 'personality') return opt === this.form.personality
			return false
		},
		onPickOption(opt) {
			const k = this.sheetKind
			if (k === 'status') this.form.status = opt
			else if (k === 'gender') this.form.gender = opt
			else if (k === 'neuter') this.form.neuter = opt
			else if (k === 'vaccine') this.form.vaccine = opt
			else if (k === 'personality') this.form.personality = opt
			this.closeSheet()
		},
		onScaleChange(e) {
			const value = Number(e.detail.value || 0)
			if (this.sheetKind === 'value') this.petValue = value
			else this.personalityValue = value
		},
		onPickAvatar() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const p = res.tempFilePaths && res.tempFilePaths[0]
					if (p) this.avatarUrl = p
				}
			})
		},
		pickMedia() {
			uni.chooseImage({
				count: 9 - this.mediaList.length,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const arr = res.tempFilePaths || []
					this.mediaList = this.mediaList.concat(arr).slice(0, 9)
				}
			})
		},
		removeMedia(i) {
			this.mediaList.splice(i, 1)
		},
		onSave() {
			if (!this.form.name.trim()) return uni.showToast({ title: '请填写名字', icon: 'none' })
			if (!this.form.breed) return uni.showToast({ title: '请选择品种', icon: 'none' })
			uni.showToast({ title: '已保存', icon: 'none' })
		}
	}
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	position: relative;
	background: #f6f8fa;
	box-sizing: border-box;
}

.hero-backdrop {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 279px;
	background: #fcf276;
	z-index: 0;
}

.hero {
	position: relative;
	z-index: 1;
	background: transparent;
	padding-bottom: 28rpx;
	flex-shrink: 0;
}

.avatar-card {
	width: 188rpx;
	height: 188rpx;
	margin: 16rpx auto 0;
	background: #fff;
	border-radius: 24rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.avatar-img {
	width: 100%;
	height: 100%;
	border-radius: 24rpx;
}

.avatar-tip {
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #b6b6b8;
	line-height: 34rpx;
}

.scroll {
	flex: 1;
	height: 0;
	width: 100%;
	position: relative;
	z-index: 1;
}

.scroll-pad {
	padding: 6rpx 24rpx 24rpx;
	padding-bottom: calc(24rpx + 59px + env(safe-area-inset-bottom));
	box-sizing: border-box;
}

.card {
	background: #fff;
	border-radius: 16rpx;
	overflow: hidden;
	margin-bottom: 24rpx;
}

.fields-card {
	padding: 8px 12px 11px;
	box-sizing: border-box;
}

.f-row {
	display: flex;
	align-items: center;
	height: 58px;
	min-height: 58px;
	padding: 0;
	box-sizing: border-box;
}

.fields-card .f-row {
	width: 100%;
}

.f-row--tap:active {
	opacity: 0.85;
}

.f-label {
	display: flex;
	align-items: center;
	flex-shrink: 0;
	margin-right: 16rpx;
}

.f-label text:first-child {
	font-size: 30rpx;
	font-weight: 500;
	color: #222;
	line-height: 42rpx;
}

.req {
	color: #ff4d4f;
	font-size: 28rpx;
	margin-left: 4rpx;
	line-height: 42rpx;
}

.f-val {
	flex: 1;
	text-align: right;
	font-size: 30rpx;
	color: #555;
	line-height: 42rpx;
	margin-right: 8rpx;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.f-ph {
	color: #c8c8c8;
}

.f-input {
	flex: 1;
	text-align: right;
	font-size: 30rpx;
	color: #333;
	line-height: 42rpx;
	margin-right: 8rpx;
	min-width: 0;
}

.ph {
	color: #c8c8c8;
	font-size: 28rpx;
}

.f-clear {
	width: 16px;
	height: 16px;
	border-radius: 0;
	background: transparent;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.f-arrow {
	display: block;
}

.expand-bar {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 35px;
	column-gap: 0;
	padding: 0;
}

.expand-txt {
	font-size: 13px;
	color: #999;
	line-height: 1;
}

.expand-arrow {
	display: block;
	margin-left: 3px;
	transform: rotate(-90deg);
}

.expand-arrow--open {
	transform: rotate(90deg);
}

.card-desc {
	padding: 10px 9px 12px;
	height: 202px;
	box-sizing: border-box;
}

.ta-wrap {
	position: relative;
	padding-bottom: 40rpx;
	min-height: 200rpx;
}

.ta {
	width: 100%;
	min-height: 180rpx;
	font-size: 28rpx;
	color: #333;
	line-height: 44rpx;
	box-sizing: border-box;
}

.ta-count {
	position: absolute;
	right: 0;
	bottom: 0;
	font-size: 24rpx;
	color: #b0b0b0;
	line-height: 34rpx;
}

.media-row {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	margin-top: 8rpx;
}

.media-cell {
	position: relative;
	width: 160rpx;
	height: 160rpx;
	border-radius: 16rpx;
	overflow: hidden;
	background: #f2f2f2;
}

.media-img {
	width: 100%;
	height: 100%;
}

.media-del {
	position: absolute;
	top: 6rpx;
	right: 6rpx;
	width: 36rpx;
	height: 36rpx;
	border-radius: 50%;
	background: rgba(255, 59, 48, 0.95);
	display: flex;
	align-items: center;
	justify-content: center;
}

.media-del text {
	color: #fff;
	font-size: 24rpx;
	line-height: 1;
	font-weight: 500;
}

.media-add {
	width: 160rpx;
	height: 160rpx;
	border-radius: 16rpx;
	background: #f5f5f5;
	border: 1rpx dashed #ddd;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
}

.media-add-txt {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #aaa;
	line-height: 30rpx;
	text-align: center;
	padding: 0 8rpx;
}

.footer {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 50;
	padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
	background: #fff;
	box-sizing: border-box;
}

.save-btn {
	width: 100%;
	height: 43px;
	min-height: 43px;
	border-radius: 42px;
	background: #ffdc06;
	display: flex;
	align-items: center;
	justify-content: center;
}

:deep(.save-label) {
	font-size: 17px;
	font-weight: 700;
	color: #282827;
	line-height: 1;
}

.value-sheet {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
	height: 497px;
	padding-top: 57px;
	box-sizing: border-box;
}

.value-close {
	position: absolute;
	top: 21px;
	right: 18px;
	width: 26px;
	height: 26px;
	z-index: 2;
}

.value-close-icon {
	display: block;
}

.scale-title {
	display: block;
	font-size: 15px;
	font-weight: 500;
	line-height: 18px;
	color: #222;
}

.scale-value {
	display: flex;
	align-items: baseline;
	justify-content: center;
	height: 39px;
	margin-top: 5px;
	color: #222;
	font-weight: 700;
}

.scale-yen {
	font-size: 24px;
	line-height: 29px;
}

.scale-number {
	font-size: 32px;
	line-height: 39px;
}

.scale-ruler-area {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 82px;
	margin-top: 14px;
	background: #f2f2f2;
}

.scale-ruler {
	display: block;
	width: 309px;
	height: 66px;
}

.scale-hint {
	display: block;
	margin-top: 24px;
	text-align: center;
	font-size: 14px;
	line-height: 17px;
	color: #ee8002;
}

.scale-copy {
	display: block;
	width: 313px;
	margin-top: 9px;
	text-align: center;
	font-size: 12px;
	line-height: 14px;
	color: #999;
}

.scale-save {
	position: absolute;
	left: 11px;
	right: 13px;
	bottom: 36px;
	width: auto;
	height: 46px;
	min-height: 46px;
	border-radius: 42px;
	background: #ffe60f;
}

:deep(.scale-save text) {
	font-size: 16px;
	font-weight: 700;
	line-height: 1;
	color: #282827;
}
</style>
