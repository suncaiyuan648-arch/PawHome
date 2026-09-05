<template>
	<view class="me-page">
		<PawPageNav :show-back="false" background="#f5f5f5" slot-position="custom" :slot-style="{ left: '0px' }">
			<template #content>
				<view class="nav-menu-hit" data-qa="qa-me-menu" @tap.stop="onMenuTap">
					<uni-icons type="bars" color="#333333" :size="24"></uni-icons>
				</view>
			</template>
		</PawPageNav>
		<scroll-view class="main-scroll" scroll-y :show-scrollbar="false" :enable-flex="true" :bounces="false">
			<view class="scroll-inner">
				<view class="profile-card card card--elevated">
					<view class="profile-card__surface" aria-hidden="true"></view>
					<view class="profile-main">
						<PawImage class="profile-avatar" :src="profileAvatar" :size="65" :radius="32.5" :preview="false"
							:clickable="true" data-qa="qa-me-avatar" @click="openProfileUpload" />
						<view class="profile-info">
							<view class="name-row" data-qa="qa-me-profile">
								<text class="profile-name">浮生孤影</text>
								<view data-qa="qa-me-level" @click.stop="goLevelPage">
									<LevelCapsule level="1" />
								</view>
							</view>
							<text class="paw-id">逢猫号：2876598765</text>
						</view>
						<PawMemberBanner class="profile-card__member-banner" data-qa="qa-me-membership-ribbon"
							:title="membership.title" :progress-text="`距下一级${membership.remainingExp}`"
							@click="goLevelPage" />
					</view>
					<view class="stats-row">
						<view class="stat-cell" data-qa="qa-me-cloud-pets" @click="goMyCloudPets">
							<PawBadge class="stat-badge" text="新反馈" size="small">
								<text class="stat-num">11只</text>
							</PawBadge>
							<text class="stat-label">我的云养宠物</text>
						</view>
						<view class="stat-cell" data-qa="qa-me-my-pets" @click="goMyPets">
							<text class="stat-num">1只</text>
							<text class="stat-label">我的宠物</text>
						</view>
						<view class="stat-cell" data-qa="qa-me-my-adoption" @click="goMyAdoption">
							<PawBadge class="stat-badge" text="新进度" size="small">
								<text class="stat-num">22只</text>
							</PawBadge>
							<text class="stat-label">我的领养</text>
						</view>
						<view class="stat-cell" data-qa="qa-me-medals" @click="goMyMedals">
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
							<PawIcon class="link-chevron" name="navigation/order-chevron-right" :size="10" />
						</view>
					</view>
					<view class="orders-grid">
						<view v-for="(item, i) in orderEntries" :key="i" class="order-item" @click="toast(item.label)">
							<view class="order-icon-wrap">
								<PawBadge :count="item.badge">
									<PawIcon class="order-icon-img" :name="item.iconName" :size="24" />
								</PawBadge>
							</view>
							<text class="order-label">{{ item.label }}</text>
						</view>
					</view>
				</view>

				<view class="yard-card card card--elevated">
					<view class="card-header">
						<text class="card-title card-title--blue">我的小院</text>
						<view class="card-link" @click="goManagedYard">
							<text>查看</text>
							<PawIcon class="link-chevron" name="navigation/yard-link-chevron" :size="8" :rotate="180" />
						</view>
					</view>
					<view class="yard-body">
						<view class="yard-left">
							<view class="yard-line">
								<text class="yard-line-label">今日曝光</text>
								<text class="yard-num">361万</text>
								<text class="yard-line-sub">(昨日12万)</text>
							</view>
							<view class="yard-line">
								<text class="yard-line-label">今日获粮</text>
								<text class="yard-num">361斤</text>
								<text class="yard-line-sub">(昨日1斤)</text>
							</view>
						</view>
						<view class="yard-divider"></view>
						<view class="yard-right">
							<view class="yard-action" @click="goYardFeedOrders">
								<PawBadge :count="9">
									<view class="yard-action-content">
										<PawIcon class="yard-icon-img" name="actions/yard-feed" :size="22" />
										<text class="yard-action-text">投喂订单</text>
									</view>
								</PawBadge>
							</view>
							<view class="yard-action" @click="goAdoptionAudit">
								<PawBadge :count="9">
									<view class="yard-action-content">
										<PawIcon class="yard-icon-img" name="actions/yard-audit" :size="22" />
										<text class="yard-action-text">领养审核</text>
									</view>
								</PawBadge>
							</view>
						</view>
					</view>
				</view>

				<view v-for="review in reviewCards" :key="review.title" class="review-card card card--elevated"
					@click="goJuryPanel(review.reviewType)">
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
						<PawVoteRatioBar class="poll-bar" :real-percent="review.realPercent"
							:fake-percent="review.fakePercent" :real-label="`${review.realPercent}%（挺真实）`"
							:fake-label="`${review.fakePercent}%`" :min-fake-width="48" :height="26" />
					</view>
				</view>
			</view>
		</scroll-view>
		<CustomTabber :tab-index="3" />

		<view v-if="drawerOpen" class="drawer-backdrop" @click="closeDrawer"></view>
		<view v-if="drawerOpen" class="drawer-shell" :class="{ 'drawer-shell--show': drawerAnim }" @click.stop>
			<scroll-view class="drawer-scroll" scroll-y :show-scrollbar="false">
				<view class="drawer-pad">
					<view v-for="(section, si) in menuSections" :key="si" class="menu-section">
						<view v-for="(label, ri) in section" :key="ri" class="menu-row" @click="onMenuRow(label)">
							<text class="menu-row-label">{{ label }}</text>
							<PawChevron class="menu-row-chevron" :size="10" />
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
		<PawBottomSheet v-model:visible="avatarSheetVisible" variant="profile-upload" height="379px"
			:close-on-mask="true" :safe-area="true" :z-index="10060" @after-close="onProfileUploadClosed">
			<view class="profile-upload-sheet" data-qa="qa-me-avatar-sheet" @tap.stop>
				<view class="profile-upload-head">
					<text class="profile-upload-title">更换头像</text>
					<text class="profile-upload-skip" data-qa="qa-me-avatar-cancel" @tap="closeProfileUpload">取消</text>
				</view>
				<PawImage class="profile-upload-avatar" :src="profileAvatar" :size="95" :radius="47.5"
					:preview="false" />
				<text class="profile-upload-copy">选择一张新头像，让大家更容易认出你</text>
				<view class="profile-upload-actions">
					<view class="profile-upload-action" data-qa="qa-me-avatar-album" @tap="chooseAvatar">
						<text>从相册选择</text>
					</view>
					<view class="profile-upload-action" data-qa="qa-me-avatar-camera" @tap="takeAvatar"><text>拍照</text>
					</view>
				</view>
			</view>
		</PawBottomSheet>
	</view>
</template>

<script>
import CustomTabber from '@/components/CustomTabber/index.vue'
import LevelCapsule from '@/components/LevelCapsule.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawBadge from '@/components/base/PawBadge.vue'
import PawChevron from '@/components/base/PawChevron.vue'
import PawImage from '@/components/base/PawImage.vue'
import PawMemberBanner from '@/components/PawMemberBanner/PawMemberBanner.vue'
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import PawPageNav from '@/components/PawPageNav.vue'
import PawVoteRatioBar from '@/components/PawVoteRatioBar.vue'
import { getLastAdoptionId } from '@/utils/adoptionStorage.js'
import { getMemberLevelTitle } from '@/utils/memberLevel.js'

export default {
	components: { CustomTabber, LevelCapsule, PawIcon, PawBadge, PawChevron, PawImage, PawMemberBanner, PawBottomSheet, PawPageNav, PawVoteRatioBar },
	data() {
		return {
			pageState: 'default',
			avatarSheetVisible: false,
			profileAvatar: '/static/figma/me-avatar.png',
			membership: {
				level: 8,
				title: getMemberLevelTitle(8),
				remainingExp: 6376
			},
			authChecked: false,
			reviewText:
				'今天不做课间操了，开一个紧急例会，就在昨天，发生了一件骇人听闻的学生袭击老师事件，主犯夏洛...',
			orderEntries: [
				{ label: '全部', iconName: 'actions/order-all', badge: 0 },
				{ label: '待付款', iconName: 'actions/order-pay', badge: 7 },
				{ label: '待发货', iconName: 'actions/order-ship', badge: 7 },
				{ label: '待收货', iconName: 'actions/order-receive', badge: 7 },
				{ label: '待评价', iconName: 'actions/order-review', badge: 7 }
			],
			reviewCards: [
				{ title: '求助评审', question: 'Ta的求助是真的吗？', reviewType: 'rescue', realPercent: 92, fakePercent: 8 },
				{ title: '领养评审', question: 'Ta的领养是真的吗？', reviewType: 'adoption', realPercent: 92, fakePercent: 8 }
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
		if (this.pageState === 'drawer') {
			this.drawerOpen = true
			this.drawerAnim = true
		}
		if (this.pageState === 'profile-upload') this.avatarSheetVisible = true
	},
	onShow() {
		if (!this.ensureLogin()) return
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
		openProfileUpload() {
			this.avatarSheetVisible = true
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
		onProfileUploadClosed() {
			if (this.pageState === 'profile-upload') this.pageState = 'default'
		},
		closeProfileUpload() {
			this.avatarSheetVisible = false
		},
		chooseAvatar() {
			uni.chooseImage({
				count: 1,
				sourceType: ['album'],
				success: (result) => {
					const path = result && result.tempFilePaths && result.tempFilePaths[0]
					if (path) this.profileAvatar = path
					this.closeProfileUpload()
				}
			})
		},
		takeAvatar() {
			uni.chooseImage({
				count: 1,
				sourceType: ['camera'],
				success: (result) => {
					const path = result && result.tempFilePaths && result.tempFilePaths[0]
					if (path) this.profileAvatar = path
					this.closeProfileUpload()
				}
			})
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
			if (label === '我的云养宠物') {
				this.goMyCloudPets()
				return
			}
			if (label === '我的宠物') {
				this.goMyPets()
				return
			}
			if (label === '小院宠物') {
				uni.navigateTo({ url: '/pages/meMore/myAssets?mode=pets' })
				return
			}
			if (label === '我的小院') {
				this.goManagedYard()
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
				uni.navigateTo({ url: '/pages/yard/rescueReview' })
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
			if (label === '我申请的领养') {
				this.goMyAdoption()
				return
			}
			this.toast(label)
		},
		goMyAdoption() {
			uni.navigateTo({ url: '/pages/meMore/myAdoption' })
		},
		goMyCloudPets() {
			uni.navigateTo({ url: '/pages/meMore/myAssets?mode=pets&state=mine' })
		},
		goManagedYard() {
			uni.navigateTo({ url: '/pages/yard/yardCats?state=managed' })
		},
		goAdoptionSupport() {
			uni.navigateTo({ url: '/pages/adoption/extras?mode=support' })
		},
		goMyFeedings() {
			uni.navigateTo({ url: '/pages/meMore/myFeedings' })
		},
		goMyPets() {
			uni.navigateTo({ url: '/pages/meMore/myAssets?mode=pets&state=owned' })
		},
		goMyMedals() {
			uni.navigateTo({ url: '/pages/meMore/myAssets?mode=medals' })
		},
		goYardFeedOrders() {
			uni.navigateTo({ url: '/pages/meMore/yardFeedOrders' })
		},
		goAdoptionAudit() {
			const id = getLastAdoptionId()
			uni.navigateTo({ url: '/pages/yard/adoptionAudit' + (id ? '?id=' + encodeURIComponent(id) : '') })
		},
		goJuryPanel(reviewType = '') {
			if (reviewType === 'rescue') {
				uni.navigateTo({ url: '/pages/yard/rescueReview' })
				return
			}
			const query = reviewType ? `?reviewType=${encodeURIComponent(reviewType)}` : ''
			uni.navigateTo({ url: `/pages/yard/juryPanel${query}` })
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

.nav-menu-hit {
	display: flex;
	width: 44px;
	height: 44px;
	align-items: center;
	justify-content: center;
}

.main-scroll {
	flex: 1;
	height: 0;
	min-height: 0;
	width: 100%;
	box-sizing: border-box;
	padding: 6px 0 0;
	background: #f5f5f5;
}

.scroll-inner {
	padding-bottom: 81px;
	box-sizing: border-box;
}

.card {
	margin: 0 8px 8px;
	background: #ffffff;
	border-radius: 8px;
	box-sizing: border-box;
}

.card--elevated {
	box-shadow: none;
	overflow: hidden;
}

.profile-card {
	position: relative;
	display: flex;
	flex-direction: column;
	height: 145.5px;
	padding: 0;
	gap: 23.5px;
	background: transparent;
	overflow: visible;
}

.profile-card__surface {
	position: absolute;
	top: 11.5px;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 0;
	background: #ffffff;
	border-radius: 8px;
}

.profile-card__member-banner {
	display: flex;
	flex: 0 0 47.6323%;
	align-self: flex-start;
	width: 47.6323%;
	max-width: 171px;
	height: auto;
	aspect-ratio: 171 / 73;
	z-index: 2;
}

.profile-main {
	position: relative;
	display: flex;
	align-items: flex-start;
	flex: 0 0 65px;
	min-height: 65px;
	box-sizing: border-box;
	padding: 11.5px 0 0 8px;
	gap: 9px;
	overflow: visible;
	z-index: 1;
}

.profile-avatar {
	position: relative;
	z-index: 3;
	width: 65px;
	height: 65px;
	margin-top: -11.5px;
	box-sizing: border-box;
	border-radius: 50%;
	flex-shrink: 0;
	background: #f0f0f0;
	border: 3px solid #ffffff;
	box-shadow: none;
}

.profile-info {
	flex: 1;
	min-width: 0;
	padding-top: 8px;
}

.name-row {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 7px;
}

.profile-name {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 16px;
	font-weight: 700;
	color: #111111;
	line-height: 23px;
}

.name-row .lv-cap {
	flex-shrink: 0;
}

.paw-id {
	display: block;
	margin-top: 0;
	font-size: 10px;
	color: #999999;
	line-height: 16px;
}

.stats-row {
	position: static;
	display: flex;
	align-items: center;
	flex: 0 0 auto;
	margin: 0 13px;
	column-gap: 8px;
	padding: 0;
	border-top: 0;
}

.stat-cell {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	position: relative;
	min-width: 0;
	padding-top: 0;
}

.stat-num {
	font-size: 15px;
	font-weight: 700;
	color: #111111;
	line-height: 23px;
}

.stat-label {
	margin-top: 0;
	font-size: 10px;
	color: #888888;
	line-height: 17px;
	text-align: center;
}

.orders-card {
	display: flex;
	flex-direction: column;
	height: 108px;
	padding: 7px 13px 10px;
	gap: 10px;
}

.orders-card .card-header {
	margin-bottom: 0;
}

.card-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 10px;
	padding: 0;
}

.card-header--review {
	align-items: flex-start;
}

.card-title {
	font-size: 14px;
	font-weight: 400;
	color: #111111;
	line-height: 20px;
}

.card-title--blue {
	color: #0887f7;
	font-weight: 500;
}

.card-link {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 2px;
	font-size: 11px;
	color: #999999;
	line-height: 18px;
}

.orders-card .card-link {
	gap: 5px;
}

.card-link .link-chevron {
	width: 10px;
	height: 10px;
	flex-shrink: 0;
}

.card-sub {
	font-size: 11px;
	color: #999999;
	line-height: 16px;
	max-width: 170px;
	text-align: right;
}

.orders-grid {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 2px 0 0;
}

.order-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	min-width: 0;
}

.order-icon-wrap {
	position: relative;
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.order-icon-img {
	filter: none;
}

.order-label {
	font-size: 11px;
	color: #333333;
	line-height: 17px;
	text-align: center;
}

.yard-card {
	display: flex;
	flex-direction: column;
	height: 109px;
	padding: 5px 13px 9px;
	gap: 10px;
}

.yard-card .card-header {
	margin-bottom: 0;
}

.yard-body {
	display: flex;
	align-items: center;
	min-height: 0;
	gap: 24px;
	padding: 0 8px;
}

.yard-left {
	flex: 1;
	min-width: 0;
	padding: 0 8px 0 7px;
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	justify-content: space-between;
	gap: 8px;
}

.yard-line {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 1px;
	text-align: left;
}

.yard-line-label {
	display: block;
	font-size: 11px;
	color: #333333;
	line-height: 18px;
}

.yard-num {
	display: block;
	margin-top: 0;
	font-size: 14px;
	font-weight: 700;
	color: #111111;
	line-height: 24px;
}

.yard-line-sub {
	font-size: 9px;
	color: #999999;
	line-height: 14px;
}

.yard-divider {
	width: 1px;
	background: #e8e8e8;
	flex-shrink: 0;
	align-self: center;
	height: 100%;
}

.yard-right {
	flex-shrink: 0;
	width: 96px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	padding-left: 2px;
}

.yard-action {
	position: relative;
	display: flex;
	align-items: center;
	box-sizing: border-box;
	gap: 4px;
}

.yard-action-content {
	display: flex;
	align-items: center;
	gap: 4px;
}

.yard-icon-img {
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.yard-action-text {
	flex: 0 0 auto;
	font-size: 11px;
	color: #333333;
	line-height: 18px;
	white-space: nowrap;
}

.review-card {
	min-height: 146px;
	padding: 6px 15px 8px;
	display: flex;
	flex-direction: column;
	gap: 10px;
	box-sizing: border-box;
}

.review-card .card-header {
	margin-bottom: 1px;
}

.review-body {
	display: flex;
	align-items: flex-start;
	gap: 7px;
	margin-bottom: 0;
}

.review-text {
	flex: 1;
	width: auto;
	min-width: 0;
	font-size: 11px;
	color: #333333;
	line-height: 13.5px;
	text-align: justify;
	max-height: 42px;
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
	gap: 6px;
}

.review-img {
	width: 55px;
	height: 55px;
	border-radius: 5px;
	background: #f0f0f0;
}

.poll-wrap {
	width: 100%;
	margin-top: 0;
	display: flex;
	align-items: center;
}

.poll-bar {
	width: 100%;
	flex: 1 1 auto;
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
	box-shadow: 4px 0 16px rgba(0, 0, 0, 0.12);
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
	padding: 73px 15px 24px;
	box-sizing: border-box;
}

.menu-section {
	background: #ffffff;
	border-radius: 12px;
	margin-bottom: 10px;
	overflow: hidden;
	box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.menu-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	padding: 13.5px 16px;
	border-bottom: 1px solid #f0f0f0;
	box-sizing: border-box;
}

.menu-row:last-child {
	border-bottom: none;
}

.menu-row-label {
	flex: 1;
	min-width: 0;
	font-size: 14px;
	font-weight: 400;
	color: #111111;
	line-height: 21px;
}

.menu-row-chevron {
	width: 11px;
	height: 11px;
	margin-left: 8px;
	flex-shrink: 0;
	opacity: 0.38;
}

.drawer-settings {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	padding: 12px 8px 12px;
	margin-top: 12px;
}

.settings-icon-wrap {
	width: 44px;
	height: 44px;
	border-radius: 50%;
	background: #ebebeb;
	display: flex;
	align-items: center;
	justify-content: center;
}

.settings-text {
	margin-top: 7px;
	font-size: 12px;
	color: #888888;
	line-height: 17px;
}

.profile-upload-sheet {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
	padding: 20px 20px 28px;
}

.profile-upload-head {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 24px;
	position: relative;
}

.profile-upload-avatar {
	align-self: center;
	flex: 0 0 auto;
	margin-top: 24px;
}

.profile-upload-title {
	font-size: 14px;
	font-weight: 500;
	line-height: 20px;
	color: #222222;
}

.profile-upload-skip {
	position: absolute;
	right: 0;
	font-size: 12px;
	line-height: 20px;
	color: #777777;
}

.profile-upload-copy {
	display: block;
	margin-top: 18px;
	text-align: center;
	font-size: 12px;
	line-height: 18px;
	color: #999999;
}

.profile-upload-actions {
	display: flex;
	margin-top: auto;
	gap: 10px;
}

.profile-upload-action {
	display: flex;
	flex: 1 1 0;
	height: 44px;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	border-radius: 22px;
	background: #ffe600;
	font-size: 14px;
	font-weight: 500;
	line-height: 20px;
	color: #222222;
}

.profile-upload-action:first-child {
	background: #f4f4f4;
	color: #333333;
}

.profile-upload-action text {
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>
