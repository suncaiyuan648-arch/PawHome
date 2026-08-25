<template>
	<view class="page" :class="{ 'page--alternate': alternateMode }">
		<!-- #ifndef MP-WEIXIN -->
		<image class="h5-status-bar" src="/static/figma/status-bar-publish-feed.png" mode="scaleToFill"></image>
		<!-- #endif -->
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-hit" @click="goBack">
					<image class="nav-back" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<text class="nav-title">发布动态</text>
				<view class="nav-cap" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
			<view class="tool-row">
				<text class="btn-cancel" @click="goBack">取消</text>
				<view class="btn-post" @click="onPublish"><text>发表</text></view>
			</view>
		</view>

		<scroll-view class="main" scroll-y :show-scrollbar="false" :bounces="false" :enable-flex="true">
			<view class="pad">
				<view class="card">
					<view class="ta-wrap">
						<textarea
							class="ta"
							:value="content"
							maxlength="500"
							placeholder="分享喂猫过程"
							placeholder-class="ph"
							@input="onContentInput"
						/>
						<text class="ta-count">{{ contentLen }}/500</text>
					</view>
					<view class="media-row">
						<image v-for="src in mediaList" :key="src" class="media-preview" :src="src" mode="aspectFill"></image>
						<view class="media-add" @click="pickMedia">
						<uni-icons type="image" color="#b0b0b0" :size="40"></uni-icons>
						<text class="media-txt">照片/视频</text>
						</view>
					</view>
				</view>

				<view class="card card-feed">
					<view class="feed-head">
						<text class="feed-lb">反馈</text>
						<view v-if="!selectedOrder" class="feed-link" @click="openOrderSheet">
							<text>选择投粮订单</text>
							<text class="feed-arr">›</text>
						</view>
						<view v-else class="feed-link" @click="openOrderSheet">
							<text>已选择</text>
							<text class="feed-arr">›</text>
						</view>
					</view>

					<view v-if="selectedOrder" class="order-box">
						<image v-if="alternateMode" class="order-avatar" src="/static/figma/feeding/yard-feed-avatar.png" mode="aspectFill"></image>
						<view class="order-top">
							<view class="order-name-row" @click.stop="openOrderUser(selectedOrder)">
								<text class="order-name">{{ selectedOrder.userName }}</text>
								<view class="lv-cap"><text class="lv-cap__txt">Lv{{ selectedOrder.level }}</text></view>
							</view>
							<text v-if="selectedOrder.timedOut" class="order-timeout">已超时</text>
							<text v-else class="order-countdown">{{ selectedOrder.countdown }}</text>
						</view>
						<text class="order-kg">投粮{{ selectedOrder.kg }}斤</text>
						<view class="order-bottom">
							<text class="order-time">{{ selectedOrder.time }}</text>
							<view class="order-tag"><text>{{ selectedOrder.feedbackTag }}</text></view>
						</view>
					</view>

					<view class="cat-block">
						<text class="cat-title">本次投喂的小院猫咪 ({{ alternateMode ? 0 : pickedCats.length }})</text>
						<view class="cat-row">
							<view v-for="cat in pickedCats" :key="cat.name" class="cat-pet"><image :src="cat.avatar" mode="aspectFill"></image><text>{{ cat.name }}</text></view>
							<view class="cat-add" @click="onAddCats">
								<view class="cat-plus"><uni-icons type="plusempty" color="#111" :size="22"></uni-icons></view>
								<text class="cat-add-txt">去添加</text>
							</view>
							<template v-if="!alternateMode"><text v-for="(n, i) in yardCatNames" :key="'c-' + i" class="cat-name">{{ n }}</text></template>
						</view>
					</view>
				</view>

				<view class="foot-tip">
					<text>
						爱心人士投喂您的小院后，需在物流签收7天内选择投喂的小院猫咪进行反馈，照片需包含爱心人士手写姓名的纸条，您的爱心与反馈是爱心人士的动力，感谢您的付出。
					</text>
				</view>
			</view>
		</scroll-view>

		<view v-if="showOrderSheet" class="sheet-mask" @click="closeOrderSheet"></view>
		<view v-if="showOrderSheet" class="order-sheet" @click.stop>
			<view class="sheet-head">
				<text class="sheet-title">选择订单</text>
				<view class="sheet-x" @click="closeOrderSheet"><text>×</text></view>
			</view>
			<scroll-view class="sheet-scroll" scroll-y :show-scrollbar="false" :bounces="false" :enable-flex="true">
				<view
					v-for="(o, i) in mockOrders"
					:key="o.id"
					class="order-card"
					:class="{ 'order-card--on': tempOrderId === o.id }"
					@click.stop="selectOrder(o)"
				>
					<view class="oc-radio">
						<view v-if="tempOrderId === o.id" class="oc-dot"><text class="oc-check">✓</text></view>
						<view v-else class="oc-ring"></view>
					</view>
					<view class="oc-body">
						<view class="oc-top">
							<view class="oc-name-row" @click.stop="openOrderUser(o)">
								<text class="oc-name">{{ o.userName }}</text>
								<view class="lv-cap"><text class="lv-cap__txt">Lv{{ o.level }}</text></view>
							</view>
							<text v-if="o.timedOut" class="oc-timeout">已超时</text>
							<text v-else class="oc-countdown">{{ o.countdown }}</text>
						</view>
						<text class="oc-kg">投粮{{ o.kg }}斤</text>
						<view class="oc-foot">
							<text class="oc-time">{{ o.time }}</text>
							<view class="oc-tag"><text>{{ o.feedbackTag }}</text></view>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
import { goBackSmart } from '@/utils/navBack.js'
import { openUserProfile } from '@/utils/profileNav.js'

const MOCK_ORDERS = () => [
	{
		id: '1',
		userName: '平安是福',
		level: 1,
		kg: 4,
		time: '2026-2-5 13:23:56',
		countdown: '3天23:34:45后超时',
		timedOut: false,
		feedbackTag: '已反馈2/5次'
	},
	{
		id: '2',
		userName: '爱心投喂',
		pawId: 'order-user-axtf',
		level: 2,
		kg: 2,
		time: '2026-2-1 10:00:00',
		countdown: '5天12:00:00后超时',
		timedOut: false,
		feedbackTag: '已反馈0/3次'
	}
]

export default {
	data() {
		return {
			statusBarHeight: 20,
			menuRightWidth: 87,
			content: '',
			mediaList: ['/static/figma/adoption-flow/pet-owner.png', '/static/figma/adoption-flow/apply-room.png'],
			selectedOrder: null,
			showOrderSheet: false,
			tempOrderId: '1',
			mockOrders: MOCK_ORDERS(),
			yardCatNames: ['奥利奥', '呗呗'],
			pickedCats: [
				{ name:'奥利奥', avatar:'/static/figma/adoption-flow/pet-orange.png' },
				{ name:'呗呗', avatar:'/static/figma/adoption-flow/apply-dog.png' }
			]
			,alternateMode: false
		}
	},
	computed: {
		contentLen() {
			return (this.content || '').length
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
		if (options.state === 'alternate') {
			this.alternateMode = true
			this.mediaList = ['/static/figma/adoption-flow/pet-owner.png', '/static/figma/adoption-flow/apply-room.png']
			this.selectedOrder = { ...this.mockOrders[0], timedOut: true, countdown: '' }
			this.pickedCats = [
				{ name:'奥利奥', avatar:'/static/figma/adoption-flow/pet-orange.png' },
				{ name:'呗呗', avatar:'/static/figma/adoption-flow/apply-dog.png' }
			]
		}
	},
	methods: {
		goBack() {
			goBackSmart({ fallbackUrl: '/pages/index/index' })
		},
		openOrderUser(o) {
			if (!o) return
			openUserProfile({
				pawId: o.pawId || 'order-' + o.id,
				nickname: o.userName,
				avatar: ''
			})
		},
		onContentInput(e) {
			this.content = e.detail.value || ''
		},
		pickMedia() {
			uni.chooseImage({
				count: 9,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const arr = res.tempFilePaths || []
					this.mediaList = (this.mediaList || []).concat(arr).slice(0, 9)
				}
			})
		},
		openOrderSheet() {
			this.tempOrderId = this.selectedOrder ? this.selectedOrder.id : this.mockOrders[0].id
			this.showOrderSheet = true
		},
		closeOrderSheet() {
			this.showOrderSheet = false
		},
		selectOrder(o) {
			this.tempOrderId = o.id
			this.selectedOrder = { ...o }
			if (this.selectedOrder.id === '1') {
				this.selectedOrder.timedOut = true
				this.selectedOrder.countdown = ''
			}
			this.closeOrderSheet()
		},
		onAddCats() {
			uni.showToast({ title: '去添加小院猫咪', icon: 'none' })
		},
		onPublish() {
			uni.navigateTo({ url: '/pages/publishDynamic/postSuccess' })
		}
	}
}
</script>

<style scoped>
.page {
	position: relative;
	height: 100vh;
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	background: #f5f5f5;
	box-sizing: border-box;
}
.h5-status-bar { position:absolute; left:0; top:0; width:100%; height:40px; z-index:100; pointer-events:none; }
.nav-wrap {
	flex-shrink: 0;
	background: #fff;
	padding-bottom: 12rpx;
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
.nav-title {
	flex: 1;
	text-align: center;
	font-size: 34rpx;
	font-weight: 700;
	color: #111;
	line-height: 48rpx;
}
.nav-cap {
	height: 64rpx;
}
.tool-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 8rpx 24rpx 0;
	box-sizing: border-box;
}
.btn-cancel {
	font-size: 30rpx;
	color: #333;
	line-height: 44rpx;
}
.btn-post {
	padding: 12rpx 36rpx;
	border-radius: 999rpx;
	background: #ffe60f;
}
.btn-post text {
	font-size: 30rpx;
	font-weight: 700;
	color: #111;
	line-height: 42rpx;
}
.main {
	flex: 1;
	min-height: 0;
	width: 100%;
	box-sizing: border-box;
}
.pad {
	padding: 26px 12px 20px;
	box-sizing: border-box;
}
.card {
	background: #fff;
	border-radius: 24rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	box-sizing: border-box;
}
.ta-wrap {
	position: relative;
	padding-bottom: 40rpx;
	min-height: 200rpx;
}
.ta {
	width: 100%;
	min-height: 200rpx;
	font-size: 30rpx;
	color: #222;
	line-height: 44rpx;
	box-sizing: border-box;
}
.ph {
	color: #c8c8c8;
	font-size: 30rpx;
}
.ta-count {
	position: absolute;
	right: 0;
	bottom: 0;
	font-size: 24rpx;
	color: #b0b0b0;
	line-height: 34rpx;
}
.media-add {
	width: 160rpx;
	height: 160rpx;
	border-radius: 16rpx;
	background: #f2f2f2;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}
.media-row { display:flex; flex-wrap:wrap; gap:4rpx; margin-top:16rpx; }
.media-preview { width:212rpx; height:212rpx; border-radius:6rpx; }
.page--alternate .media-add { width:212rpx; height:212rpx; border-radius:6rpx; }
.page--alternate .btn-post { border-radius:8rpx; padding:10rpx 28rpx; }
.page--alternate .pad { padding-top:52rpx; }
.page--alternate .card:first-child { padding-bottom:44rpx; }
.page--alternate .ta-wrap { height:164rpx; min-height:0; }
.page--alternate .ta { height:120rpx; min-height:0; }
.media-txt {
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #aaa;
	line-height: 32rpx;
}
.card-feed {
	padding-bottom: 20rpx;
}
.feed-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 16rpx;
}
.feed-lb {
	font-size: 30rpx;
	font-weight: 700;
	color: #222;
	line-height: 42rpx;
}
.feed-link {
	display: flex;
	align-items: center;
	column-gap: 4rpx;
}
.feed-link text:first-child {
	font-size: 28rpx;
	color: #999;
	line-height: 40rpx;
}
.feed-arr {
	font-size: 32rpx;
	color: #c8c8c8;
	line-height: 1;
}
.order-box {
	position:relative;
	background: #fafafa;
	border-radius: 16rpx;
	padding: 20rpx 20rpx 16rpx;
	margin-bottom: 24rpx;
	box-sizing: border-box;
}
.order-top {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12rpx;
}
.order-name-row {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 10rpx;
}
.order-name {
	font-size: 30rpx;
	font-weight: 700;
	color: #222;
	line-height: 42rpx;
}
.order-name-row .lv-cap {
	flex-shrink: 0;
	margin-left: 10rpx;
}
.order-timeout {
	font-size: 24rpx;
	color: #ff4d4f;
	line-height: 34rpx;
	flex-shrink: 0;
}
.order-countdown {
	font-size: 22rpx;
	color: #ff4d4f;
	line-height: 32rpx;
	text-align: right;
	max-width: 280rpx;
}
.order-kg {
	display: block;
	margin-top: 8rpx;
	font-size: 28rpx;
	color: #555;
	line-height: 40rpx;
}
.order-bottom {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 12rpx;
}
.order-time {
	font-size: 24rpx;
	color: #b0b0b0;
	line-height: 34rpx;
}
.order-tag {
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	background: #e8f2ff;
	border: 1rpx solid #b3d4ff;
}
.order-tag text {
	font-size: 22rpx;
	color: #2b7de9;
	line-height: 30rpx;
}
.cat-block {
	margin-top: 8rpx;
}
.cat-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #333;
	line-height: 40rpx;
}
.cat-row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	column-gap: 20rpx;
	row-gap: 12rpx;
	margin-top: 16rpx;
}
.cat-add {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100rpx;
}
.cat-plus {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	background: #ffe60f;
	color: #111;
	display:flex;
	align-items:center;
	justify-content:center;
}
.order-avatar { position:absolute; left:18rpx; top:22rpx; width:58rpx; height:58rpx; border-radius:50%; }
.page--alternate .order-box { padding-left:90rpx; }
.cat-pet { width:92rpx; display:flex; flex-direction:column; align-items:center; font-size:22rpx; color:#444; }
.cat-pet image { width:72rpx; height:72rpx; border-radius:50%; }
.cat-pet text { margin-top:6rpx; }
.cat-add-txt {
	margin-top: 6rpx;
	font-size: 22rpx;
	color: #888;
	line-height: 30rpx;
}
.cat-name {
	font-size: 28rpx;
	color: #333;
	line-height: 40rpx;
}
.foot-tip {
	padding: 8rpx 4rpx 32rpx;
}
.foot-tip text {
	font-size: 24rpx;
	color: #a0a0a0;
	line-height: 38rpx;
}

.sheet-mask {
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	z-index: 300;
	background: rgba(0, 0, 0, 0.45);
}
.order-sheet {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 310;
	max-height: 85vh;
	background: #f2f2f2;
	border-radius: 28rpx 28rpx 0 0;
	padding: 20rpx 0 0;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
}
.sheet-head {
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	padding: 8rpx 24rpx 20rpx;
}
.sheet-title {
	font-size: 34rpx;
	font-weight: 700;
	color: #111;
	line-height: 48rpx;
}
.sheet-x {
	position: absolute;
	right: 28rpx;
	top: 4rpx;
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.sheet-x text {
	font-size: 40rpx;
	color: #333;
	line-height: 1;
}
.sheet-scroll {
	flex: 1;
	min-height: 0;
	max-height: 56vh;
	padding: 0 20rpx;
	box-sizing: border-box;
}
.order-card {
	display: flex;
	background: #fff;
	border-radius: 20rpx;
	padding: 24rpx 20rpx;
	margin-bottom: 16rpx;
	box-sizing: border-box;
	column-gap: 16rpx;
}
.order-card--on {
	box-shadow: 0 0 0 3rpx #ffe60f;
}
.oc-radio {
	flex-shrink: 0;
	padding-top: 6rpx;
}
.oc-dot {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	background: #ffe60f;
	display: flex;
	align-items: center;
	justify-content: center;
}
.oc-check {
	font-size: 22rpx;
	color: #111;
	font-weight: 700;
	line-height: 1;
}
.oc-ring {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	border: 3rpx solid #ddd;
	box-sizing: border-box;
}
.oc-body {
	flex: 1;
	min-width: 0;
}
.oc-top {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 12rpx;
}
.oc-name-row {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 10rpx;
}
.oc-name {
	font-size: 30rpx;
	font-weight: 700;
	color: #222;
	line-height: 42rpx;
}
.oc-name-row .lv-cap {
	flex-shrink: 0;
	margin-left: 10rpx;
}
.oc-timeout {
	font-size: 24rpx;
	color: #ff4d4f;
	flex-shrink: 0;
}
.oc-countdown {
	font-size: 22rpx;
	color: #ff4d4f;
	text-align: right;
	max-width: 260rpx;
	line-height: 30rpx;
}
.oc-kg {
	display: block;
	margin-top: 8rpx;
	font-size: 28rpx;
	color: #555;
	line-height: 40rpx;
}
.oc-foot {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 12rpx;
}
.oc-time {
	font-size: 24rpx;
	color: #b0b0b0;
	line-height: 34rpx;
}
.oc-tag {
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	background: #e8f2ff;
	border: 1rpx solid #b3d4ff;
}
.oc-tag text {
	font-size: 22rpx;
	color: #2b7de9;
	line-height: 30rpx;
}
.page:not(.page--alternate) .ta-wrap { height:108px; min-height:0; padding-bottom:0; }
.page:not(.page--alternate) .ta { height:90px; min-height:0; }
.page:not(.page--alternate) .media-add { width:106px; height:106px; border-radius:3px; }
</style>
