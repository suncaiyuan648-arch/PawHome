<template>
	<view class="page">
		<!-- #ifndef MP-WEIXIN -->
		<image class="h5-status-bar" src="/static/figma/status-bar-certify.png" mode="scaleToFill"></image>
		<!-- #endif -->
		<view class="hero" :class="{ 'hero--state': figmaState !== 97 }"
			:style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-hit" @click="goBack">
					<image class="nav-back" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<text class="nav-title"></text>
				<view class="nav-cap" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
			<view v-if="figmaState !== 97" class="state-head">
				<text class="state-title">{{ figmaState === 98 ? '已通过认证' : '人工审核中' }}</text>
				<text class="state-sub">基地信息将在小院公示并获得更多曝光</text>
			</view>
		</view>

		<scroll-view class="scroll" scroll-y :show-scrollbar="false">
			<view class="pad">
				<view class="card" :class="{ 'card--readonly': figmaState !== 97 }">
					<view class="f-row">
						<view class="f-label">
							<text>基地/组织名称</text>
							<text class="req">*</text>
						</view>
						<input class="f-input" type="text" :value="form.orgName" placeholder="请输入"
							placeholder-class="ph" @input="onNameInput" />
						<view v-if="form.orgName" class="f-clear" @click.stop="form.orgName = ''"><text>×</text></view>
					</view>
					<view class="f-row f-row--top">
						<view class="f-label f-label--top">
							<text>基地/组织地址</text>
							<text class="req">*</text>
						</view>
						<view class="f-grow">
							<textarea class="f-ta" :value="form.orgAddress" placeholder="请输入详细地址" placeholder-class="ph"
								auto-height maxlength="200" @input="onAddrInput" />
							<view v-if="form.orgAddress" class="f-clear f-clear--float"
								@click.stop="form.orgAddress = ''">
								<text>×</text>
							</view>
						</view>
					</view>
					<view class="photo-row">
						<view class="photo-label">
							<text>大门照片</text>
							<text class="req">*</text>
						</view>
						<view v-if="figmaState === 97" class="photo-cells">
							<view class="photo-sample">
								<image :src="certPhotos[0]" mode="aspectFill"></image><text>示例</text>
							</view>
							<view class="photo-up" @click="pickPhoto(0)">
								<image v-if="photos[0]" class="photo-img" :src="photos[0]" mode="aspectFill"></image>
								<template v-else>
									<uni-icons type="image" color="#b0b0b0" :size="32"></uni-icons>
									<text class="photo-up-txt">上传照片</text>
								</template>
							</view>
						</view>
						<image v-else class="readonly-photo" :src="certPhotos[1]" mode="aspectFill" />
					</view>
					<view class="photo-row">
						<view class="photo-label">
							<text>场地照片</text>
							<text class="req">*</text>
						</view>
						<view v-if="figmaState === 97" class="photo-cells">
							<view class="photo-sample">
								<image :src="certPhotos[1]" mode="aspectFill"></image><text>示例</text>
							</view>
							<view class="photo-up" @click="pickPhoto(1)">
								<image v-if="photos[1]" class="photo-img" :src="photos[1]" mode="aspectFill"></image>
								<template v-else>
									<uni-icons type="image" color="#b0b0b0" :size="32"></uni-icons>
									<text class="photo-up-txt">上传照片</text>
								</template>
							</view>
						</view>
						<image v-else class="readonly-photo" :src="certPhotos[figmaState === 98 ? 0 : 1]"
							mode="aspectFill" />
					</view>
					<view class="photo-row photo-row--last">
						<view class="photo-label">
							<text>流浪动物照片</text>
							<text class="req">*</text>
						</view>
						<view v-if="figmaState === 97" class="photo-cells">
							<view class="photo-sample">
								<image :src="certPhotos[2]" mode="aspectFill"></image><text>示例</text>
							</view>
							<view class="photo-up" @click="pickPhoto(2)">
								<image v-if="photos[2]" class="photo-img" :src="photos[2]" mode="aspectFill"></image>
								<template v-else>
									<uni-icons type="image" color="#b0b0b0" :size="32"></uni-icons>
									<text class="photo-up-txt">上传照片</text>
								</template>
							</view>
						</view>
						<image v-else class="readonly-photo" :src="certPhotos[figmaState === 98 ? 2 : 1]"
							mode="aspectFill" />
					</view>
				</view>
				<text v-if="figmaState === 98" class="state-note">如需修改认证信息请点击 重新认证，如需删除认证信息请点击 删除</text>
				<text v-if="figmaState === 99" class="state-note"><uni-icons type="info" color="#999" :size="13" />
					已提交认证，等待人工审核中</text>
			</view>
		</scroll-view>

		<view v-if="figmaState === 97" class="footer">
			<view class="submit-btn" :class="{ 'submit-btn--disabled': !canSubmit }" @click="onSubmit">
				<text>提交审核</text>
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
			yardName: '',
			form: {
				orgName: '小坏蛋',
				orgAddress: '湖南省长沙市中意一路鼎丰前程国际'
			},
			photos: ['', '', ''],
			figmaState: 97,
			certPhotos: [
				'/static/figma/certify/ca69b21b61516589aa506613e5d3c587881cb57d.png',
				'/static/figma/certify/286f32813e5e08a042caa281128bbd34461231c4.png',
				'/static/figma/certify/a89546330447ad2d777eba860fde4020fa211487.png'
			]
		}
	},
	computed: {
		canSubmit() {
			return (
				(this.form.orgName || '').trim() &&
				(this.form.orgAddress || '').trim() &&
				(this.form.orgAddress || '').trim()
			)
		}
	},
	onLoad(query) {
		const sys = uni.getSystemInfoSync()
		this.statusBarHeight = sys.statusBarHeight || 20
		// #ifdef MP-WEIXIN
		try {
			const mb = uni.getMenuButtonBoundingClientRect()
			if (mb && mb.left) this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87)
		} catch (e) { }
		// #endif
		if (query && query.yardName) {
			const y = decodeURIComponent(query.yardName)
			if (y) this.yardName = y
		}
		let state = Number(query && query.state) || 97
		// #ifdef H5
		const match = window.location.hash.match(/[?&]state=(\d+)/)
		if (match) state = Number(match[1]) || state
		// #endif
		this.figmaState = state
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		onNameInput(e) {
			this.form.orgName = (e.detail.value || '').trimStart()
		},
		onAddrInput(e) {
			this.form.orgAddress = e.detail.value || ''
		},
		pickPhoto(i) {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const p = res.tempFilePaths && res.tempFilePaths[0]
					if (!p) return
					const next = [...this.photos]
					next[i] = p
					this.photos = next
				}
			})
		},
		onSubmit() {
			if (!this.canSubmit) {
				return uni.showToast({ title: '请完善必填项', icon: 'none' })
			}
			uni.redirectTo({
				url: '/pages/yard/yardCats?state=managed&returnHome=1&name=' + encodeURIComponent(this.yardName || '')
			})
		}
	}
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	position: relative;
	display: flex;
	flex-direction: column;
	background: #f0f0f0;
	box-sizing: border-box;
}

.hero {
	background: #fff476;
	min-height: 110px;
	box-sizing: border-box;
	padding-bottom: 20rpx;
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
	flex-shrink: 0;
}

.nav-back {
	width: 20rpx;
	height: 36rpx;
}

.nav-title {
	flex: 1;
	text-align: center;
	font-size: 34rpx;
	font-weight: 700;
	color: #111;
	line-height: 48rpx;
}

.nav-cap {
	flex-shrink: 0;
	height: 64rpx;
}

.scroll {
	flex: 1;
	height: 0;
	width: 100%;
}

.pad {
	padding: 20rpx 24rpx 24rpx;
	padding-bottom: calc(24rpx + 140rpx + env(safe-area-inset-bottom));
}

.card {
	background: #fff;
	border-radius: 24rpx;
	padding: 8rpx 0 24rpx;
	overflow: hidden;
}

.f-row {
	display: flex;
	align-items: center;
	padding: 24rpx 24rpx;
	border-bottom: 1rpx solid #f0f0f0;
	position: relative;
}

.f-row--top {
	align-items: flex-start;
}

.f-label {
	display: flex;
	align-items: center;
	width: 220rpx;
	flex-shrink: 0;
}

.f-label--top {
	padding-top: 8rpx;
}

.f-label text:first-child {
	font-size: 28rpx;
	font-weight: 500;
	color: #222;
	line-height: 40rpx;
}

.req {
	color: #ff4d4f;
	font-size: 24rpx;
	margin-left: 4rpx;
	line-height: 40rpx;
}

.f-input {
	flex: 1;
	min-width: 0;
	text-align: right;
	font-size: 28rpx;
	color: #333;
	line-height: 40rpx;
}

.f-grow {
	flex: 1;
	min-width: 0;
	position: relative;
}

.f-ta {
	width: 100%;
	min-height: 80rpx;
	font-size: 28rpx;
	color: #333;
	line-height: 40rpx;
	text-align: right;
	padding-right: 48rpx;
	box-sizing: border-box;
}

.f-clear {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	background: #e8e8e8;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	margin-left: 8rpx;
}

.f-clear--float {
	position: absolute;
	right: 0;
	top: 4rpx;
	margin-left: 0;
}

.f-clear text {
	font-size: 24rpx;
	color: #888;
	line-height: 1;
}

.ph {
	color: #c8c8c8;
	font-size: 28rpx;
}

.photo-row {
	padding: 24rpx 24rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.photo-row--last {
	border-bottom: none;
}

.photo-label {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
}

.photo-label text:first-child {
	font-size: 28rpx;
	font-weight: 500;
	color: #222;
	line-height: 40rpx;
}

.photo-cells {
	display: flex;
	align-items: stretch;
	column-gap: 20rpx;
	padding-bottom: 24rpx;
}

.photo-sample {
	position: relative;
	overflow: hidden;
	width: 160rpx;
	height: 160rpx;
	border-radius: 16rpx;
	background: #555;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.page::before {
	content: '';
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	height: 307px;
	background: #fff476;
	z-index: 0;
}

.hero,
.scroll,
.footer {
	position: relative;
	z-index: 1
}

.h5-status-bar {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 40px;
	z-index: 100;
	pointer-events: none
}

.hero--state {
	min-height: 175px;
}

.state-head {
	height: 118px;
	padding: 49px 27px 0;
	box-sizing: border-box;
}

.state-title {
	display: block;
	font-size: 22px;
	font-weight: 700;
	color: #333;
}

.state-sub {
	display: block;
	margin-top: 8px;
	font-size: 12px;
	color: #555;
}

.photo-sample image {
	width: 100%;
	height: 100%;
}

.photo-sample text {
	position: absolute;
	left: 0;
	right: 0;
	text-align: center;
	font-size: 26rpx;
	color: #fff;
	line-height: 36rpx;
}

.photo-up {
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
	overflow: hidden;
}

.photo-img {
	width: 100%;
	height: 100%;
}

.photo-up-txt {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #aaa;
	line-height: 30rpx;
}

.card:not(.card--readonly) {
	padding-top: 4px;
	padding-bottom: 5px
}

.card:not(.card--readonly) .f-row {
	height: 68px;
	padding: 12px;
	box-sizing: border-box
}

.card:not(.card--readonly) .f-row--top {
	height: 76px
}

.card:not(.card--readonly) .photo-row {
	height: 121px;
	padding: 0 12px;
	display: flex;
	align-items: center;
	box-sizing: border-box
}

.card:not(.card--readonly) .photo-label {
	width: 154px;
	margin: 0;
	flex-shrink: 0
}

.card:not(.card--readonly) .photo-cells {
	gap: 7px;
	padding: 0
}

.card:not(.card--readonly) .photo-sample,
.card:not(.card--readonly) .photo-up {
	width: 84px;
	height: 84px;
	border-radius: 4px
}

.card--readonly {
	padding-bottom: 0;
}

.card--readonly .f-row {
	min-height: 77px;
	box-sizing: border-box;
}

.card--readonly .f-clear {
	display: none;
}

.card--readonly .photo-row {
	height: 120px;
	padding-top: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.card--readonly .photo-label {
	margin-bottom: 0;
}

.readonly-photo {
	width: 83px;
	height: 83px;
	border-radius: 3px;
	margin-right: 12px;
}

.state-note {
	display: block;
	margin-top: 17px;
	font-size: 12px;
	line-height: 17px;
	color: #999;
}

.hero--state+.scroll .pad {
	padding-top: 0
}

.footer {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 50;
	padding: 16rpx 24rpx;
	padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
	background: #f0f0f0;
	box-sizing: border-box;
}

.submit-btn {
	height: 96rpx;
	border-radius: 48rpx;
	background: #ffe60f;
	display: flex;
	align-items: center;
	justify-content: center;
}

.submit-btn text {
	font-size: 34rpx;
	font-weight: 700;
	color: #111;
	line-height: 48rpx;
}

.submit-btn--disabled {
	background: #e8e8e8;
}

.submit-btn--disabled text {
	color: #b0b0b0;
	font-weight: 500;
}
</style>
