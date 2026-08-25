<template>
	<view class="page">
		<view class="hero" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-hit" @click="goBack">
					<image class="nav-back" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<view class="nav-cap" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
			<view class="avatar-card" @click="onPickAvatar">
				<image v-if="avatarUrl" class="avatar-img" :src="avatarUrl" mode="aspectFill"></image>
				<template v-else>
					<uni-icons class="cam-icon" type="camera" color="#222" :size="28"></uni-icons>
					<text class="avatar-tip">{{ avatarTip }}头像</text>
				</template>
			</view>
		</view>

		<scroll-view class="scroll" scroll-y :show-scrollbar="false">
			<view class="scroll-pad">
				<view class="card">
					<view class="f-row f-row--tap" @click="openSheet('status')">
						<view class="f-label">
							<text>{{ formLabel }}状态</text>
							<text class="req">*</text>
						</view>
						<text class="f-val">{{ form.status }}</text>
						<uni-icons type="right" color="#C8C8C8" :size="16"></uni-icons>
					</view>
					<view class="f-row">
						<view class="f-label">
							<text>{{ formLabel }}名字</text>
							<text class="req">*</text>
						</view>
						<input
							class="f-input"
							type="text"
							:value="form.name"
							placeholder="填写名字"
							placeholder-class="ph"
							@input="onNameInput"
						/>
						<view v-if="form.name" class="f-clear" @click.stop="form.name = ''"><text>×</text></view>
					</view>
					<view class="f-row f-row--tap" @click="openSheet('value')">
						<view class="f-label">
							<text>{{ formLabel }}价值</text>
							<text class="req">*</text>
						</view>
						<text class="f-val">{{ petValue }}</text>
						<uni-icons type="right" color="#C8C8C8" :size="16"></uni-icons>
					</view>

					<template v-if="expandMore">
						<view class="f-row f-row--tap" @click="openSheet('personality')">
							<view class="f-label"><text>{{ formLabel }}性格</text></view>
							<text class="f-val" :class="{ 'f-ph': !form.personality }">{{ form.personality || '亲人' }}</text>
							<uni-icons type="right" color="#C8C8C8" :size="16"></uni-icons>
						</view>
						<view class="f-row f-row--tap" @click="openBreedPicker">
							<view class="f-label"><text>{{ formLabel }}品种</text></view>
							<text class="f-val">{{ form.breed }}</text>
							<uni-icons type="right" color="#C8C8C8" :size="16"></uni-icons>
						</view>
						<view class="f-row f-row--tap" @click="openSheet('gender')">
							<view class="f-label"><text>{{ formLabel }}性别</text></view>
							<text class="f-val">{{ form.gender }}</text>
							<uni-icons type="right" color="#C8C8C8" :size="16"></uni-icons>
						</view>
						<picker mode="date" :value="birthValue" @change="onBirthChange">
							<view class="f-row f-row--tap">
								<view class="f-label"><text>{{ formLabel }}生日</text></view>
								<text class="f-val">{{ birthDisplay }}</text>
								<uni-icons type="right" color="#C8C8C8" :size="16"></uni-icons>
							</view>
						</picker>
						<view class="f-row f-row--tap" @click="openSheet('neuter')">
							<view class="f-label"><text>绝育</text></view>
							<text class="f-val">{{ form.neuter }}</text>
							<uni-icons type="right" color="#C8C8C8" :size="16"></uni-icons>
						</view>
						<view class="f-row f-row--tap" @click="openSheet('vaccine')">
							<view class="f-label"><text>疫苗</text></view>
							<text class="f-val">{{ form.vaccine }}</text>
							<uni-icons type="right" color="#C8C8C8" :size="16"></uni-icons>
						</view>
					</template>

					<view class="expand-bar" @click="expandMore = !expandMore">
						<text class="expand-txt">补充更多</text>
						<uni-icons :type="expandMore ? 'top' : 'bottom'" color="#A8A8A8" :size="13"></uni-icons>
					</view>
				</view>

				<view class="card card-desc">
					<view class="ta-wrap">
						<textarea
							class="ta"
							:value="form.desc"
							maxlength="200"
							placeholder="可以单独描述这只猫咪的性格、状况等"
							placeholder-class="ph"
							@input="onDescInput"
						/>
						<text class="ta-count">{{ descLen }}/200</text>
					</view>
				</view>
			</view>
		</scroll-view>

		<view class="footer">
			<view class="save-btn" @click="onSave"><text>保存</text></view>
		</view>

		<!-- 通用底部选择 -->
		<view v-if="sheetKind" class="pick-mask" @click="closeSheet"></view>
		<view v-if="sheetKind" class="pick-sheet" :class="{ 'pick-sheet--scale': sheetKind === 'value' }" @click.stop>
			<view class="pick-close" @click="closeSheet"><text>×</text></view>
			<view v-if="sheetKind === 'value'" class="scale-sheet">
				<text class="scale-title">宠物价值</text>
				<text class="scale-value">￥{{ petValue }}</text>
				<image class="scale-ruler" src="/static/figma/pet-value-ruler.png" mode="scaleToFill" />
				<text class="scale-hint">用于设置用户申请领养时所需的领养额度</text>
				<text class="scale-copy">设置过低会给虐猫人群批量收猫可乘之机，设置过高会导致真正想要领养的人放弃，领养额度只是货币约束申请的门槛，您拥有申请的审核权，请综合宠物的品种、大小等因素合理设置，推荐设置15~30之间</text>
				<view class="scale-save" @click="closeSheet"><text>保存价值</text></view>
			</view>
			<view v-else class="pick-card">
				<view
					v-for="(opt, oi) in sheetOptions"
					:key="'o-' + oi"
					class="pick-item"
					@click="onPickOption(opt)"
				>
					<text class="pick-label">{{ opt }}</text>
					<text v-if="isOptionSelected(opt)" class="pick-check">✓</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
const STATUS_OPTS = ['待领养', '已领养', '失踪', '死亡']
const GENDER_OPTS = ['男生', '女生']
const NEUTER_OPTS = ['未绝育', '已绝育']
const VACCINE_OPTS = ['未接种', '接种中', '已接种']
const BREED_OPTS = ['蓝金', '金渐层', '银渐层', '英短', '美短', '中华田园猫']
const PERSONALITY_OPTS = ['非常亲人', '亲人', '不亲人']

export default {
	data() {
		return {
			statusBarHeight: 20,
			menuRightWidth: 87,
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
		}
	},
	onLoad(query) {
		const sys = uni.getSystemInfoSync()
		this.statusBarHeight = sys.statusBarHeight || 20
		// #ifdef MP-WEIXIN
		try {
			const mb = uni.getMenuButtonBoundingClientRect()
			if (mb && mb.left) this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87)
		} catch (e) {}
		// #endif
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
	background: #f0f0f0;
	box-sizing: border-box;
}
.hero {
	background: #fff476;
	padding-bottom: 28rpx;
	flex-shrink: 0;
}
.nav-row {
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 8rpx;
	box-sizing: border-box;
}
.nav-hit {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.nav-back {
	width: 20rpx;
	height: 36rpx;
}
.nav-cap {
	height: 64rpx;
}
.avatar-card {
	width: 200rpx;
	height: 200rpx;
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
.cam-icon {
	width: 56rpx;
	height: 56rpx;
}
.avatar-tip {
	margin-top: 10rpx;
	font-size: 24rpx;
	color: #9a9a9a;
	line-height: 34rpx;
}
.scroll {
	flex: 1;
	height: 0;
	width: 100%;
}
.scroll-pad {
	padding: 20rpx 24rpx 24rpx;
	padding-bottom: calc(24rpx + 140rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
}
.card {
	background: #fff;
	border-radius: 24rpx;
	overflow: hidden;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}
.f-row {
	display: flex;
	align-items: center;
	min-height: 118rpx;
	padding: 0 24rpx;
	border-bottom: 1rpx solid #f0f0f0;
	box-sizing: border-box;
}
.f-row:last-of-type {
	border-bottom: none;
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
	font-weight: 600;
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
	width: 44rpx;
	height: 44rpx;
	border-radius: 50%;
	background: #e8e8e8;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.f-clear text {
	font-size: 28rpx;
	color: #888;
	line-height: 1;
}
.expand-bar {
	display: flex;
	align-items: center;
	justify-content: center;
	column-gap: 8rpx;
	padding: 24rpx 0;
	border-top: 1rpx solid #f0f0f0;
}
.expand-txt {
	font-size: 28rpx;
	color: #888;
	line-height: 40rpx;
}
.expand-ico {
	font-size: 24rpx;
	color: #888;
	line-height: 1;
}
.card-desc {
	padding: 20rpx 24rpx 24rpx;
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
	font-weight: 600;
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
	padding: 16rpx 24rpx;
	padding-bottom: calc(36px + env(safe-area-inset-bottom));
	background: #f0f0f0;
	box-sizing: border-box;
}
.save-btn {
	height: 96rpx;
	border-radius: 48rpx;
	background: #ffe60f;
	display: flex;
	align-items: center;
	justify-content: center;
}
.save-btn text {
	font-size: 34rpx;
	font-weight: 700;
	color: #111;
	line-height: 48rpx;
}

.pick-mask {
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	z-index: 300;
	background: #5b5b5b;
}
.pick-sheet {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 310;
	height: 419px;
	background: #f5f5f5;
	border-radius: 12px 12px 0 0;
	padding: 0 8px;
	box-sizing: border-box;
}
.pick-sheet--scale { height: 497px; padding: 0; background: #fff; }
.pick-close {
	position: absolute;
	top: 8px;
	right: 8px;
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 2;
}
.pick-close text {
	font-size: 40rpx;
	color: #333;
	line-height: 1;
	font-weight: 300;
}
.pick-card {
	margin-top: 54px;
	background: #fff;
	border-radius: 6px;
	overflow: hidden;
}
.pick-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 63px;
	padding: 0 18px;
	border-bottom: 1rpx solid #f2f2f2;
	box-sizing: border-box;
}
.pick-item:last-child {
	border-bottom: none;
}
.pick-label {
	font-size: 14px;
	color: #666;
	line-height: 44rpx;
}
.pick-check {
	font-size: 14px;
	color: #222;
	font-weight: 700;
	line-height: 44rpx;
}
.scale-sheet { padding: 60px 11px 16px; box-sizing: border-box; }
.scale-title { display: block; text-align: center; font-size: 15px; font-weight: 600; color: #222; }
.scale-value { display: block; margin-top: 7px; text-align: center; font-size: 22px; font-weight: 700; color: #222; }
.scale-ruler { display: block; width: 309px; height: 66px; margin: 14px auto 0; }
.scale-hint { display: block; margin-top: 49px; text-align: center; font-size: 12px; line-height: 17px; color: #ff7900; }
.scale-copy { display: block; margin: 9px 8px 0; text-align: center; font-size: 10px; line-height: 14px; color: #999; }
.scale-save { height: 44px; margin-top: 101px; border-radius: 22px; background: #ffe600; display: flex; align-items: center; justify-content: center; }
.scale-save text { font-size: 14px; font-weight: 600; color: #222; }
</style>
