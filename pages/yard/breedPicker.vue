<template>
	<view class="page">
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-hit" @click="goBack">
					<image class="nav-back" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<view class="search-bar">
					<uni-icons type="search" color="#b0b0b0" :size="18"></uni-icons>
					<input
						class="search-input"
						type="text"
						:value="searchKey"
						:placeholder="searchPlaceholder"
						placeholder-class="search-ph"
						@input="onSearchInput"
					/>
				</view>
				<view class="nav-cap" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
		</view>

		<scroll-view class="main-scroll" scroll-y :show-scrollbar="false">
			<view class="list-card">
				<view v-if="filteredBreeds.length === 0 && searchKey.trim()" class="list-empty">
					<text>暂无匹配品种</text>
				</view>
				<view
					v-for="(b, i) in filteredBreeds"
					:key="'b-' + i + '-' + b"
					class="list-item"
					@click="selectBreed(b)"
				>
					<text class="list-txt">{{ b }}</text>
					<text v-if="b === selected" class="list-check">✓</text>
				</view>
				<view class="sup-row" @click="openSupplement">
					<text class="sup-txt">看来还没有人输入过这个品种，帮我们补充吧！</text>
					<uni-icons type="right" color="#c8c8c8" :size="16"></uni-icons>
				</view>
			</view>
		</scroll-view>

		<view v-if="showSup" class="sup-mask" @click="closeSupplement"></view>
		<view v-if="showSup" class="sup-overlay" @click="closeSupplement">
			<view class="sup-panel" @click.stop>
				<text class="sup-title">{{ supDialogTitle }}</text>
				<input
					class="sup-input"
					type="text"
					:value="supInput"
					placeholder="请输入"
					placeholder-class="sup-placeholder"
					@input="onSupInput"
				/>
				<view class="sup-hline"></view>
				<view class="sup-btns">
					<view class="sup-btn sup-btn--cancel" @click="closeSupplement"><text>取消</text></view>
					<view class="sup-vline"></view>
					<view
						class="sup-btn sup-btn--ok"
						:class="{ 'sup-btn--disabled': !supInputTrim }"
						@click="submitSupplement"
					>
						<text>提交</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 补充品种提交成功（图2） -->
		<view v-if="showSupResult" class="res-mask" @click.stop></view>
		<view v-if="showSupResult" class="res-overlay">
			<view class="res-panel">
				<text class="res-title">提交成功</text>
				<text class="res-body">
					我们已收到您补充的品种，会尽快补充，最快1小时内补充上去；您可以先选择其他品种，稍后重新选择，补充后将不会另行通知您
				</text>
				<view class="res-hline"></view>
				<view class="res-ok" @click="onSupResultOk"><text>好的</text></view>
			</view>
		</view>
	</view>
</template>

<script>
const BASE_CAT = ['白猫', '橘猫', '狸花猫', '三花猫', '简州猫', '奶牛猫', '英短', '美短']
const BASE_DOG = ['中华田园犬', '比熊', '哈士奇', '阿拉斯加', '萨摩耶', '泰迪', '柴犬', '柯基']

export default {
	data() {
		return {
			statusBarHeight: 20,
			menuRightWidth: 87,
			kind: 'cat',
			searchKey: '',
			customList: [],
			selected: '',
			showSup: false,
			supInput: '',
			showSupResult: false,
			pendingSupBreed: ''
		}
	},
	computed: {
		supInputTrim() {
			return (this.supInput || '').trim()
		},
		searchPlaceholder() {
			return this.kind === 'dog' ? '输入狗狗品种' : '输入猫咪品种'
		},
		supDialogTitle() {
			return this.kind === 'dog' ? '补充狗狗品种' : '补充猫咪品种'
		},
		allBreeds() {
			const base = this.kind === 'dog' ? [...BASE_DOG] : [...BASE_CAT]
			const merged = [...base, ...this.customList]
			return [...new Set(merged)]
		},
		filteredBreeds() {
			const q = (this.searchKey || '').trim()
			if (!q) return this.allBreeds
			return this.allBreeds.filter((b) => b.includes(q))
		}
	},
	onLoad(query) {
		this.kind = query && query.kind === 'dog' ? 'dog' : 'cat'
		const sys = uni.getSystemInfoSync()
		this.statusBarHeight = sys.statusBarHeight || 20
		// #ifdef MP-WEIXIN
		try {
			const mb = uni.getMenuButtonBoundingClientRect()
			if (mb && mb.left) this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87)
		} catch (e) {}
		// #endif
		const ch = this.getOpenerEventChannel && this.getOpenerEventChannel()
		if (ch && typeof ch.on === 'function') {
			ch.on('initBreed', (payload = {}) => {
				const b = (payload.breed || '').trim()
				if (!b) return
				this.selected = b
				const base = this.kind === 'dog' ? BASE_DOG : BASE_CAT
				if (base.indexOf(b) === -1 && this.customList.indexOf(b) === -1) {
					this.customList = [b, ...this.customList]
				}
			})
		}
		if (query && query.popup === 'supplement') {
			this.supInput = '非洲猫'
			this.showSup = true
		}
		if (query && query.popup === 'supplement-input') {
			this.supInput = ''
			this.showSup = true
		}
		if (query && query.popup === 'supplement-success') this.showSupResult = true
	},
	methods: {
		emitPick(breed) {
			const ch = this.getOpenerEventChannel && this.getOpenerEventChannel()
			if (ch && typeof ch.emit === 'function') {
				ch.emit('breedPicked', { breed })
			}
			uni.navigateBack()
		},
		goBack() {
			uni.navigateBack()
		},
		onSearchInput(e) {
			this.searchKey = e.detail.value || ''
		},
		onSupInput(e) {
			this.supInput = e.detail.value || ''
		},
		selectBreed(b) {
			this.selected = b
			this.emitPick(b)
		},
		openSupplement() {
			this.supInput = ''
			this.showSup = true
		},
		closeSupplement() {
			this.showSup = false
			this.supInput = ''
		},
		submitSupplement() {
			const v = this.supInputTrim
			if (!v) return
			this.pendingSupBreed = v
			this.closeSupplement()
			this.showSupResult = true
		},
		onSupResultOk() {
			const v = (this.pendingSupBreed || '').trim()
			this.showSupResult = false
			this.pendingSupBreed = ''
			if (!v) return
			if (this.customList.indexOf(v) === -1) this.customList.push(v)
			this.emitPick(v)
		}
	}
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	background: #f5f5f5;
	box-sizing: border-box;
}
.nav-wrap {
	flex-shrink: 0;
	background: #f5f5f5;
}
.nav-row {
	height: 44px;
	display: flex;
	align-items: center;
	padding: 0 8rpx 12rpx;
	box-sizing: border-box;
	column-gap: 12rpx;
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
.search-bar {
	flex: 1;
	min-width: 0;
	height: 64rpx;
	border-radius: 32rpx;
	background: #ececec;
	display: flex;
	align-items: center;
	padding: 0 20rpx;
	column-gap: 12rpx;
	box-sizing: border-box;
}
.search-input {
	flex: 1;
	min-width: 0;
	font-size: 28rpx;
	color: #333;
	line-height: 40rpx;
	height: 64rpx;
}
.search-ph {
	color: #b0b0b0;
	font-size: 28rpx;
}
.nav-cap {
	flex-shrink: 0;
	height: 64rpx;
}
.main-scroll {
	flex: 1;
	height: 0;
	width: 100%;
	box-sizing: border-box;
}
.list-card {
	margin: 0 24rpx 24rpx;
	background: #fff;
	border-radius: 20rpx;
	overflow: hidden;
}
.list-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 28rpx 28rpx;
	border-bottom: 1rpx solid #f0f0f0;
	box-sizing: border-box;
}
.list-empty {
	padding: 40rpx 28rpx;
	text-align: center;
}
.list-empty text {
	font-size: 28rpx;
	color: #b0b0b0;
	line-height: 40rpx;
}
.list-txt {
	font-size: 32rpx;
	color: #222;
	line-height: 44rpx;
}
.list-check {
	font-size: 32rpx;
	color: #111;
	font-weight: 700;
	line-height: 44rpx;
}
.sup-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 28rpx 28rpx 36rpx;
	border-top: 1rpx solid #f5f5f5;
	box-sizing: border-box;
}
.sup-txt {
	flex: 1;
	padding-right: 16rpx;
	font-size: 26rpx;
	color: #a8a8a8;
	line-height: 38rpx;
}

.sup-mask {
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	z-index: 400;
	background: #5b5b5b;
}
.sup-overlay {
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	z-index: 410;
	display: flex;
	align-items: flex-start;
	justify-content: center;
	padding: 250px 40px 0;
	box-sizing: border-box;
}
.sup-panel {
	width: 100%;
	max-width: 295px;
	background: #fff;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.12);
}
.sup-title {
	display: block;
	text-align: center;
	padding: 27px 16px 18px;
	font-size: 32rpx;
	font-weight: 500;
	color: #333;
	line-height: 44rpx;
}
.sup-input {
	margin: 0 30px 36px;
	min-height: 72px;
	height: 72px;
	line-height: 48rpx;
	padding: 36rpx 24rpx;
	border-radius: 16rpx;
	background: #f2f2f2;
	font-size: 30rpx;
	color: #222;
	box-sizing: border-box;
	text-align: center;
}
.sup-placeholder {
	color: #b8b8b8;
	font-size: 30rpx;
	text-align: center;
}
.sup-hline {
	height: 1rpx;
	background: #e5e5e5;
}
.sup-btns {
	display: flex;
	align-items: stretch;
	min-height: 51px;
}
.sup-btn {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
}
.sup-btn text {
	font-size: 32rpx;
	line-height: 44rpx;
}
.sup-btn--cancel text {
	color: #8e8e93;
	font-weight: 400;
}
.sup-btn--ok text {
	color: #222;
	font-weight: 500;
}
.sup-btn--disabled text {
	color: #c8c8c8;
	font-weight: 400;
}
.sup-vline {
	width: 1rpx;
	background: #e5e5e5;
	flex-shrink: 0;
}

.res-mask {
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	z-index: 420;
	background: #5b5b5b;
}
.res-overlay {
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	z-index: 430;
	display: flex;
	align-items: flex-start;
	justify-content: center;
	padding: 260px 40px 0;
	box-sizing: border-box;
}
.res-panel {
	width: 100%;
	max-width: 295px;
	background: #fff;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.12);
}
.res-title {
	display: block;
	text-align: center;
	padding: 40rpx 32rpx 24rpx;
	font-size: 34rpx;
	font-weight: 700;
	color: #333;
	line-height: 48rpx;
}
.res-body {
	display: block;
	padding: 0 36rpx 36rpx;
	font-size: 28rpx;
	color: #888;
	line-height: 44rpx;
	text-align: center;
}
.res-hline {
	height: 1rpx;
	background: #e5e5e5;
}
.res-ok {
	padding: 28rpx 0;
	display: flex;
	align-items: center;
	justify-content: center;
}
.res-ok text {
	font-size: 32rpx;
	color: #666;
	line-height: 44rpx;
}
</style>
