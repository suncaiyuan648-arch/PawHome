<template>
	<view class="me-page">
		<view v-if="pageState === 'profile-upload'" class="profile-underlay"><view class="profile-underlay-nav"><image src="/static/nav-back-arrow.png" mode="aspectFit"></image><text>昵称头像</text></view></view>
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-left" @click.stop="onMenuTap">
					<uni-icons type="bars" color="#333333" :size="24"></uni-icons>
				</view>
				<view class="nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
		</view>
		<scroll-view
			class="main-scroll"
			scroll-y
			:show-scrollbar="false"
			:enable-flex="true"
			:style="{ height: mainScrollPx + 'px' }"
			:bounces="false"
		>
			<view class="scroll-inner">
			<view class="profile-card card card--elevated">
				<view class="chief-ribbon" @click.stop="goLevelPage">
					<text class="chief-title">城市投喂首席官</text>
					<view class="chief-sub-row">
						<text class="chief-sub">距下一级6376</text>
						<image
							class="chief-chevron"
							src="/static/me/link-chevron.png"
							mode="aspectFit"
						></image>
					</view>
				</view>
				<view class="profile-main">
					<image class="profile-avatar" src="/static/figma/me-avatar.png" mode="aspectFill"></image>
					<view class="profile-info">
						<view class="name-row">
							<text class="profile-name">浮生孤影</text>
							<view @click.stop="goLevelPage">
								<LevelCapsule level="1" />
							</view>
						</view>
						<text class="paw-id">逢猫号: 2876598765</text>
					</view>
				</view>
				<view class="stats-row">
					<view class="stat-cell" @click="toast('我的云养宠物')">
						<view class="stat-tag stat-tag--red"><text>新反馈</text></view>
						<text class="stat-num">11只</text>
						<text class="stat-label">我的云养宠物</text>
					</view>
					<view class="stat-cell" @click="goMyPets">
						<text class="stat-num">1只</text>
						<text class="stat-label">我的宠物</text>
					</view>
					<view class="stat-cell" @click="goMyAdoption">
						<view class="stat-tag stat-tag--red"><text>新进度</text></view>
						<text class="stat-num">22只</text>
						<text class="stat-label">我的领养</text>
					</view>
					<view class="stat-cell" @click="goMyMedals">
						<text class="stat-num">1只</text>
						<text class="stat-label">勋章</text>
					</view>
				</view>
			</view>

			<view class="orders-card card card--elevated">
				<view class="card-header">
					<text class="card-title">我的订单</text>
					<view class="card-link" @click="toast('全部订单')">
						<text>全部</text>
						<image
							class="link-chevron"
							src="/static/me/link-chevron.png"
							mode="aspectFit"
						></image>
					</view>
				</view>
				<view class="orders-grid">
					<view
						v-for="(item, i) in orderEntries"
						:key="i"
						class="order-item"
						@click="toast(item.label)"
					>
						<view class="order-icon-wrap">
							<image class="order-icon-img" :src="item.iconSrc" mode="aspectFit"></image>
							<view v-if="item.badge" class="order-badge"><text>{{ item.badge }}</text></view>
						</view>
						<text class="order-label">{{ item.label }}</text>
					</view>
				</view>
			</view>

			<view class="yard-card card card--elevated">
				<view class="card-header">
					<text class="card-title card-title--blue">我的小院</text>
					<view class="card-link" @click="toast('我的小院')">
						<text>查看</text>
						<image
							class="link-chevron"
							src="/static/me/link-chevron.png"
							mode="aspectFit"
						></image>
					</view>
				</view>
				<view class="yard-body">
					<view class="yard-left">
						<view class="yard-line">
							<text class="yard-line-label">今日曝光</text>
							<text class="yard-num">361万</text>
							<text class="yard-line-sub">（昨日12万）</text>
						</view>
						<view class="yard-line">
							<text class="yard-line-label">今日获粮</text>
							<text class="yard-num">361斤</text>
							<text class="yard-line-sub">（昨日1斤）</text>
						</view>
					</view>
					<view class="yard-divider"></view>
					<view class="yard-right">
						<view class="yard-action" @click="goYardFeedOrders">
							<image class="yard-icon-img" src="/static/me/yard-feed.svg" mode="aspectFit"></image>
							<text class="yard-action-text">投喂订单</text>
							<view class="yard-badge"><text>9</text></view>
						</view>
						<view class="yard-action" @click="goAdoptionAudit">
							<image class="yard-icon-img" src="/static/me/yard-audit.svg" mode="aspectFit"></image>
							<text class="yard-action-text">领养审核</text>
							<view class="yard-badge"><text>9</text></view>
						</view>
					</view>
				</view>
			</view>

			<view
				v-for="review in reviewCards"
				:key="review.title"
				class="review-card card card--elevated"
				@click="goJuryPanel"
			>
				<view class="card-header card-header--review">
					<text class="card-title">{{ review.title }}</text>
					<text class="card-sub">{{ review.question }}</text>
				</view>
				<view class="review-body">
					<view class="review-text">{{ reviewText }}</view>
					<view class="review-thumbs">
						<image class="review-img" src="/static/figma/review-dog.jpg" mode="aspectFill"></image>
						<image class="review-img" src="/static/figma/review-cat.png" mode="aspectFill"></image>
					</view>
				</view>
				<view class="poll-wrap">
					<text class="poll-caption">92%（挺真实）</text>
					<view class="poll-result">
						<view class="poll-yellow"></view>
						<view class="poll-blue"><text>8%</text></view>
					</view>
				</view>
			</view>
			</view>
		</scroll-view>
		<!-- #ifndef MP-WEIXIN -->
		<CustomTabber :tab-index="3" />
		<!-- #endif -->

		<view v-if="drawerOpen" class="drawer-backdrop" @click="closeDrawer"></view>
		<view
			v-if="drawerOpen"
			class="drawer-shell"
			:class="{ 'drawer-shell--show': drawerAnim }"
			@click.stop
		>
			<scroll-view class="drawer-scroll" scroll-y :show-scrollbar="false">
				<view
					class="drawer-pad"
					:style="{ paddingTop: Math.max(statusBarHeight, 20) + 29 + 'px' }"
				>
					<view
						v-for="(section, si) in menuSections"
						:key="si"
						class="menu-section"
					>
						<view
							v-for="(label, ri) in section"
							:key="ri"
							class="menu-row"
							@click="onMenuRow(label)"
						>
							<text class="menu-row-label">{{ label }}</text>
							<image
								class="menu-row-chevron"
								src="/static/me/link-chevron.png"
								mode="aspectFit"
							></image>
						</view>
					</view>
					<view class="drawer-settings" @click="onMenuRow('设置')">
						<view class="settings-icon-wrap">
							<uni-icons type="gear" color="#555555" :size="22"></uni-icons>
						</view>
						<text class="settings-text">设置</text>
					</view>
				</view>
			</scroll-view>
		</view>
		<view v-if="pageState === 'profile-upload'" class="profile-upload-mask"></view>
		<view v-if="pageState === 'profile-upload'" class="profile-upload-sheet">
			<text class="profile-upload-skip">晚点再填</text>
			<image class="profile-upload-avatar" src="/static/figma/profile-upload-avatar.png" mode="scaleToFill"></image>
			<text class="profile-upload-title">上传头像</text>
			<text class="profile-upload-copy">逢猫新用户5119</text>
			<view class="profile-upload-divider"></view>
			<view class="profile-upload-btn"><text>完成</text></view>
		</view>
	</view>
</template>

<script>
	import CustomTabber from '@/components/CustomTabber/index.vue'
	import LevelCapsule from '@/components/LevelCapsule.vue'

	export default {
		components: { CustomTabber, LevelCapsule },
		data() {
			return {
				pageState: 'default',
				statusBarHeight: 20,
				menuRightWidth: 87,
				mainScrollPx: 500,
				authChecked: false,
				reviewText:
					'今天不做课间操了，开一个紧急例会，就在昨天，发生了一件骇人听闻的学生袭击老师事件，主犯夏洛...',
				orderEntries: [
					{ label: '全部', iconSrc: '/static/me/order-all.svg', badge: 0 },
					{ label: '待付款', iconSrc: '/static/me/order-pay.svg', badge: 7 },
					{ label: '待发货', iconSrc: '/static/me/order-ship.svg', badge: 7 },
					{ label: '待收货', iconSrc: '/static/me/order-receive.svg', badge: 7 },
					{ label: '待评价', iconSrc: '/static/me/order-review.svg', badge: 7 }
				],
				reviewCards: [
					{ title: '求助评审', question: 'Ta的求助是真的吗？' },
					{ title: '领养评审', question: 'Ta的领养是真的吗？' }
				],
				drawerOpen: false,
				drawerAnim: false,
				menuSections: [
					['我的宠物', '我的云养宠物'],
					['我的小院', '小院宠物', '投喂订单', '领养审核'],
					['红包卡券', '我的收藏', '历史浏览'],
					['我的投喂订单', '我入驻的小院', '我申请的领养']
				]
			}
		},
		onLoad(options = {}) {
			this.pageState = String(options.state || 'default')
			this.layoutScroll()
			if (this.pageState === 'drawer') {
				this.drawerOpen = true
				this.drawerAnim = true
			}
		},
		onShow() {
			if (!this.ensureLogin()) return
			this.layoutScroll()
			// #ifdef MP-WEIXIN
			this.$nextTick(() => {
				const cur = getCurrentPages().slice(-1)[0]
				if (cur && typeof cur.getTabBar === 'function') {
					const tb = cur.getTabBar()
					if (tb && typeof tb.setData === 'function') tb.setData({ selected: 3 })
				}
			})
			// #endif
		},
		methods: {
			ensureLogin() {
				if (this.pageState === 'drawer' || this.pageState === 'profile-upload') return true
				const loggedIn = !!uni.getStorageSync('PAWHOME_LOGGED_IN')
				if (loggedIn) {
					this.authChecked = true
					return true
				}
				if (!this.authChecked) this.authChecked = true
				uni.navigateTo({ url: '/pages/auth/login' })
				return false
			},
			layoutScroll() {
				const sys = uni.getSystemInfoSync()
				let statusBarHeight = sys.statusBarHeight || 20
				// #ifdef H5
				statusBarHeight = 48
				// #endif
				this.statusBarHeight = statusBarHeight
				const navPx = statusBarHeight + 44
				this.mainScrollPx = Math.max(200, (sys.windowHeight || 600) - navPx)
				// #ifdef MP-WEIXIN
				try {
					const mb = uni.getMenuButtonBoundingClientRect()
					if (mb && mb.left) {
						this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87)
					}
				} catch (e) {}
				// #endif
			},
			onMenuTap() {
				if (this.drawerOpen) {
					this.closeDrawer()
					return
				}
				this.drawerOpen = true
				this.drawerAnim = true
			},
			closeDrawer() {
				this.drawerAnim = false
				setTimeout(() => {
					this.drawerOpen = false
				}, 300)
			},
			onMenuRow(label) {
				this.closeDrawer()
				if (label === '设置') {
					uni.navigateTo({ url: '/pages/meMore/settings' })
					return
				}
				if (label === '历史浏览') {
					uni.navigateTo({ url: '/pages/meMore/browsingHistory' })
					return
				}
				if (label === '我的宠物' || label === '小院宠物') {
					uni.navigateTo({ url: '/pages/meMore/myAssets?mode=pets' })
					return
				}
				if (label === '领养额度') {
					uni.navigateTo({ url: '/pages/adoption/extras?mode=quota' })
					return
				}
				if (label === '我的勋章') {
					uni.navigateTo({ url: '/pages/meMore/myAssets?mode=medals' })
					return
				}
				if (label === '救助基金池') {
					uni.navigateTo({ url: '/pages/feature/index?mode=rescue-fund' })
					return
				}
				if (label === '邀请入驻') {
					uni.navigateTo({ url: '/pages/feature/index?mode=invite' })
					return
				}
				if (label === '投喂订单' || label === '我的投喂订单') {
					uni.navigateTo({ url: '/pages/meMore/yardFeedOrders' })
					return
				}
				this.toast(label)
			},
			goMyAdoption() {
				uni.navigateTo({ url: '/pages/meMore/myAdoption' })
			},
			goAdoptionSupport() {
				uni.navigateTo({ url: '/pages/adoption/extras?mode=support' })
			},
			goMyFeedings() {
				uni.navigateTo({ url: '/pages/meMore/myFeedings' })
			},
			goMyPets() {
				uni.navigateTo({ url: '/pages/meMore/myAssets?mode=pets' })
			},
			goMyMedals() {
				uni.navigateTo({ url: '/pages/meMore/myAssets?mode=medals' })
			},
			goYardFeedOrders() {
				uni.navigateTo({ url: '/pages/meMore/yardFeedOrders' })
			},
			goAdoptionAudit() {
				uni.navigateTo({ url: '/pages/yard/adoptionAudit' })
			},
			goJuryPanel() {
				uni.navigateTo({ url: '/pages/yard/juryPanel' })
			},
			goLevelPage() {
				const name = '浮生孤影'
				uni.navigateTo({
					url: '/pages/meMore/level?nickname=' + encodeURIComponent(name)
				})
			},
			toast(t) {
				if (t === '领养审核') {
					this.goAdoptionAudit()
					return
				}
				uni.showToast({ title: t, icon: 'none' })
			}
		}
	}
</script>

<style scoped>
	.me-page {
		height: 100vh;
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
		justify-content: space-between;
		padding: 0 8rpx 0 4rpx;
		box-sizing: border-box;
	}

	.nav-left {
		padding: 12rpx 24rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.nav-right {
		flex-shrink: 0;
	}

	.main-scroll {
		flex: none;
		width: 100%;
		box-sizing: border-box;
		padding: 12rpx 0 0;
		background: #f5f5f5;
	}

	.scroll-inner {
		padding-bottom: calc(12rpx + 120px + constant(safe-area-inset-bottom));
		padding-bottom: calc(12rpx + 120px + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.card {
		margin: 0 16rpx 16rpx;
		background: #ffffff;
		border-radius: 16rpx;
		box-sizing: border-box;
	}

	.card--elevated {
		box-shadow: none;
		overflow: hidden;
	}

	.profile-card {
		position: relative;
		height: 291rpx;
		padding: 0;
	}

	.chief-ribbon {
		position: absolute;
		right: 0;
		top: 23rpx;
		z-index: 2;
		width: 290rpx;
		height: 103rpx;
		padding: 10rpx 18rpx 8rpx 58rpx;
		box-sizing: border-box;
		background: linear-gradient(118deg, #6a5649 0%, #4d3f36 45%, #352b26 100%);
		clip-path: polygon(0 0, 100% 0, 100% 100%, 14% 100%);
		box-shadow: -4rpx 6rpx 16rpx rgba(0, 0, 0, 0.12);
	}

	.chief-title {
		display: block;
		font-size: 28rpx;
		font-weight: 500;
		color: #fee0c5;
		line-height: 40rpx;
	}

	.chief-sub-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-top: 0;
	}

	.chief-sub {
		font-size: 20rpx;
		color: rgba(255, 255, 255, 0.82);
		line-height: 28rpx;
	}

	.chief-chevron {
		width: 22rpx;
		height: 22rpx;
		margin-left: 6rpx;
		flex-shrink: 0;
		filter: brightness(0) invert(1);
		opacity: 0.88;
	}

	.profile-main {
		position: absolute;
		left: 16rpx;
		top: 0;
		display: flex;
		align-items: flex-start;
		padding-right: 0;
		min-height: 0;
		margin-top: 0;
	}

	.profile-avatar {
		width: 130rpx;
		height: 130rpx;
		border-radius: 50%;
		flex-shrink: 0;
		background: #f0f0f0;
		border: 0;
		box-shadow: none;
	}

	.profile-info {
		flex: 1;
		min-width: 0;
		margin-left: 18rpx;
		padding-top: 39rpx;
	}

	.name-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 14rpx;
	}

	.profile-name {
		font-size: 32rpx;
		font-weight: 700;
		color: #111111;
		line-height: 46rpx;
	}

	.name-row .lv-cap {
		flex-shrink: 0;
	}

	.paw-id {
		display: block;
		margin-top: 0;
		font-size: 20rpx;
		color: #999999;
		line-height: 32rpx;
	}

	.stats-row {
		position: absolute;
		left: 26rpx;
		right: 26rpx;
		top: 177rpx;
		display: flex;
		margin-top: 0;
		padding-top: 0;
		border-top: 0;
	}

	.stat-cell {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		position: relative;
		min-width: 0;
		padding-top: 6rpx;
	}

	.stat-tag {
		position: absolute;
		top: -12rpx;
		right: 4rpx;
		left: auto;
		height: 26rpx;
		padding: 0 6rpx;
		box-sizing: border-box;
		border-radius: 4rpx;
		white-space: nowrap;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stat-tag--red {
		background: #ff2741;
	}

	.stat-tag text {
		font-size: 14rpx;
		font-weight: 500;
		color: #ffffff;
		line-height: 20rpx;
	}

	.stat-num {
		font-size: 30rpx;
		font-weight: 700;
		color: #111111;
		line-height: 46rpx;
	}

	.stat-label {
		margin-top: 0;
		font-size: 20rpx;
		color: #888888;
		line-height: 34rpx;
		text-align: center;
	}

	.orders-card {
		height: 216rpx;
		padding: 14rpx 26rpx 20rpx;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20rpx;
		padding: 0;
	}

	.card-header--review {
		align-items: flex-start;
	}

	.card-title {
		font-size: 28rpx;
		font-weight: 400;
		color: #111111;
		line-height: 40rpx;
	}

	.card-title--blue {
		color: #1976d2;
		font-weight: 500;
	}

	.card-link {
		display: flex;
		flex-direction: row;
		align-items: center;
		font-size: 22rpx;
		color: #999999;
		line-height: 36rpx;
	}

	.card-link .link-chevron {
		width: 24rpx;
		height: 24rpx;
		margin-left: 4rpx;
		flex-shrink: 0;
	}

	.card-sub {
		font-size: 22rpx;
		color: #999999;
		line-height: 32rpx;
		max-width: 340rpx;
		text-align: right;
	}

	.orders-grid {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 4rpx 0 0;
	}

	.order-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 0;
	}

	.order-icon-wrap {
		position: relative;
		width: 48rpx;
		height: 48rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.order-icon-img {
		width: 48rpx;
		height: 48rpx;
		filter: brightness(0.48);
	}

	.order-badge {
		position: absolute;
		right: -6rpx;
		top: -8rpx;
		min-width: 30rpx;
		height: 30rpx;
		padding: 0 8rpx;
		box-sizing: border-box;
		border-radius: 30rpx;
		background: #ff2741;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.order-badge text {
		font-size: 20rpx;
		font-weight: 500;
		color: #ffffff;
		line-height: 1;
	}

	.order-label {
		margin-top: 16rpx;
		font-size: 22rpx;
		color: #333333;
		line-height: 34rpx;
		text-align: center;
	}

	.yard-card {
		height: 218rpx;
		padding: 10rpx 26rpx 18rpx;
	}

	.yard-body {
		display: flex;
		align-items: stretch;
	}

	.yard-left {
		flex: 1;
		min-width: 0;
		padding: 0 16rpx 0 14rpx;
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16rpx;
	}

	.yard-line {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.yard-line-label {
		display: block;
		font-size: 22rpx;
		color: #666666;
		line-height: 40rpx;
	}

	.yard-num {
		display: block;
		margin-top: 4rpx;
		font-size: 28rpx;
		font-weight: 700;
		color: #111111;
		line-height: 48rpx;
	}

	.yard-line-sub {
		font-size: 18rpx;
		color: #999999;
		line-height: 32rpx;
	}

	.yard-divider {
		width: 1rpx;
		background: #e8e8e8;
		flex-shrink: 0;
		margin: 0 12rpx;
		align-self: stretch;
	}

	.yard-right {
		flex-shrink: 0;
		width: 190rpx;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 10rpx;
		padding-left: 4rpx;
	}

	.yard-action {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.yard-icon-img {
		width: 38rpx;
		height: 38rpx;
		flex-shrink: 0;
	}

	.yard-action-text {
		flex: 1;
		font-size: 20rpx;
		color: #333333;
		line-height: 40rpx;
		min-width: 0;
	}

	.yard-badge {
		min-width: 34rpx;
		height: 34rpx;
		padding: 0 10rpx;
		box-sizing: border-box;
		border-radius: 34rpx;
		background: #ff2741;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.yard-badge text {
		font-size: 22rpx;
		font-weight: 500;
		color: #ffffff;
		line-height: 1;
	}

	.review-card {
		height: 292rpx;
		padding: 12rpx 30rpx 0;
		position: relative;
		overflow: visible;
	}

	.review-card .card-header {
		margin-bottom: 22rpx;
	}

	.review-body {
		display: flex;
		align-items: flex-start;
		gap: 14rpx;
		margin-bottom: 0;
	}

	.review-text {
		flex: none;
		width: 400rpx;
		min-width: 0;
		font-size: 22rpx;
		color: #333333;
		line-height: 27rpx;
		text-align: justify;
		max-height: 84rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		word-break: break-word;
	}

	.review-thumbs {
		flex-shrink: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 12rpx;
	}

	.review-img {
		width: 110rpx;
		height: 110rpx;
		border-radius: 10rpx;
		background: #f0f0f0;
	}

	.poll-wrap {
		position: absolute;
		left: 52rpx;
		right: -32rpx;
		bottom: -16rpx;
		height: 92rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.poll-caption {
		font-size: 20rpx;
		color: #555555;
		line-height: 28rpx;
		white-space: nowrap;
		align-self: flex-start;
		padding-top: 16rpx;
	}

	.poll-result {
		position: relative;
		width: 112rpx;
		height: 92rpx;
		flex-shrink: 0;
	}

	.poll-yellow {
		position: absolute;
		left: 0;
		top: 0;
		width: 128rpx;
		height: 92rpx;
		background: #ffe000;
		clip-path: polygon(18rpx 0, 100% 0, 100% 100%, 0 100%);
	}

	.poll-blue {
		position: absolute;
		left: 20rpx;
		top: 0;
		width: 92rpx;
		height: 54rpx;
		border-radius: 27rpx 0 0 27rpx;
		background: #1687ed;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
	}

	.poll-blue text {
		font-size: 22rpx;
		font-weight: 700;
		color: #ffffff;
		line-height: 36rpx;
	}

	.drawer-shell {
		position: fixed;
		left: 0;
		top: 0;
		bottom: 0;
		width: 287px;
		max-width: none;
		z-index: 99999;
		box-sizing: border-box;
		background: #f7f7f7;
		box-shadow: 8rpx 0 32rpx rgba(0, 0, 0, 0.12);
		display: flex;
		flex-direction: column;
		transform: translateX(-102%);
		transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.32, 1);
	}

	.drawer-backdrop {
		position: fixed;
		inset: 0;
		z-index: 99998;
		background: rgba(0, 0, 0, .58);
	}

	.drawer-shell--show {
		transform: translateX(0);
	}

	.drawer-scroll {
		flex: 1;
		height: 100%;
		width: 100%;
		box-sizing: border-box;
	}

	.drawer-pad {
		padding: 0 15px 48rpx;
		box-sizing: border-box;
	}

	.menu-section {
		background: #ffffff;
		border-radius: 24rpx;
		margin-bottom: 20rpx;
		overflow: hidden;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
	}

	.menu-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 27rpx 16px;
		border-bottom: 1rpx solid #f0f0f0;
		box-sizing: border-box;
	}

	.menu-row:last-child {
		border-bottom: none;
	}

	.menu-row-label {
		flex: 1;
		min-width: 0;
		font-size: 28rpx;
		font-weight: 400;
		color: #111111;
		line-height: 42rpx;
	}

	.menu-row-chevron {
		width: 22rpx;
		height: 22rpx;
		margin-left: 16rpx;
		flex-shrink: 0;
		opacity: 0.38;
	}

	.drawer-settings {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding: 12px 8px 24rpx;
		margin-top: 12px;
	}

	.settings-icon-wrap {
		width: 88rpx;
		height: 88rpx;
		border-radius: 50%;
		background: #ebebeb;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.settings-text {
		margin-top: 14rpx;
		font-size: 24rpx;
		color: #888888;
		line-height: 34rpx;
	}

	.profile-upload-mask {
		position: fixed;
		inset: 0;
		z-index: 300;
		background: rgba(0, 0, 0, .58);
	}

	.profile-underlay{position:fixed;inset:0;z-index:299;padding-top:44px;background:#fff;box-sizing:border-box}.profile-underlay-nav{height:44px;display:flex;align-items:center;justify-content:center;position:relative}.profile-underlay-nav image{position:absolute;left:16px;width:10px;height:18px}.profile-underlay-nav text{font-size:17px;color:#222}

	.profile-upload-sheet {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 99999;
		height: 379px;
		border-radius: 20px 20px 0 0;
		background: #fff;
		box-sizing: border-box;
	}
	.profile-upload-sheet:before{content:'';position:absolute;left:0;right:0;top:-11px;height:22px;border-radius:20px 20px 0 0;background:#fff}

	.profile-upload-skip {
		position: absolute;
		right: 18px;
		top: 28px;
		font-size: 12px;
		color: #777;
	}

	.profile-upload-avatar {
		position: absolute;
		left: 140px;
		top: 45px;
		width: 95px;
		height: 75px;
		border-radius: 50%;
		object-fit: cover;
	}

	.profile-upload-title { position:absolute;top:112px;left:0;right:0;text-align:center;font-size:14px;color:#222; }
	.profile-upload-copy { position:absolute;top:166px;left:0;right:0;text-align:center;font-size:12px;color:#999; }
	.profile-upload-divider { position:absolute;left:20px;right:20px;top:200px;height:1px;background:#f0f0f0; }
	.profile-upload-btn {
		position:absolute;
		left:28px;
		right:28px;
		bottom:42px;
		height:49px;
		border-radius:25px;
		background: #ffe600;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		color: #222;
	}
</style>
