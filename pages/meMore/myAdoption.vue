<template>
	<view class="adopt-page">
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-side nav-left" @click.stop="goBack">
					<image
						class="nav-back-icon"
						src="/static/nav-back-arrow.png"
						mode="aspectFit"
					></image>
				</view>
				<view class="nav-title-wrap">
					<text class="nav-title-text">我的领养</text>
					<view v-if="listBadgeCount > 0" class="nav-title-badge">
						<text>{{ listBadgeCount > 99 ? '99+' : listBadgeCount }}</text>
					</view>
				</view>
				<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
			<view class="page-heading"><text>我的领养</text><view v-if="listBadgeCount > 0" class="nav-title-badge"><text>{{ listBadgeCount > 99 ? '99+' : listBadgeCount }}</text></view></view>
		</view>

		<scroll-view
			class="main-scroll"
			scroll-y
			:show-scrollbar="false"
			:bounces="false"
		>
			<view class="list-pad">
				<view v-if="pageState === 'empty'" class="empty-state">
					<image src="/static/figma/empty-adoption.png" mode="scaleToFill"></image>
					<text class="empty-title">还没有领养</text>
					<text class="empty-copy">快去领养一只小动物吧</text>
				</view>
				<view
					v-for="item in pageState === 'empty' ? [] : adoptionList"
					:key="item.id"
					class="adopt-card"
					@click="onCardTap(item)"
				>
					<view class="card-head">
						<image
							class="head-avatar"
							:src="item.ownerAvatar"
							mode="aspectFill"
							@click.stop="openOwnerProfile(item)"
						></image>
						<view class="head-main" @click.stop="openOwnerProfile(item)">
							<view class="head-name-row">
								<text class="head-name">{{ item.ownerName }}</text>
								<view class="head-tag"><text>{{ item.yardTag }}</text></view>
							</view>
						</view>
						<view class="status-wrap">
							<view
								class="status-pill"
								:class="'status-pill--' + item.statusTone"
							>
								<text class="status-pill-text">{{ item.statusText }}</text>
								<view v-if="item.statusDot" class="status-dot"></view>
							</view>
						</view>
					</view>
					<scroll-view
						class="card-pets-scroll"
						scroll-x
						:show-scrollbar="false"
						:enable-flex="true"
					>
						<view class="card-pets-row">
							<view
								v-for="(pet, pi) in item.pets"
								:key="pi"
								class="pet-cell"
							>
								<image class="pet-avatar" :src="pet.avatar" mode="aspectFill" />
								<text class="pet-name">{{ pet.name }}</text>
							</view>
						</view>
					</scroll-view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import { goBackSmart } from '@/utils/navBack.js'
	import { openUserProfile } from '@/utils/profileNav.js'
	import { getAdoptions, getDemoAdoptions } from '@/utils/adoptionStorage.js'
	import { adoptionPetAvatarSrc } from '@/utils/adoptionPetDisplay.js'

	const petImg = '/static/figma/pets/adoption-dog.png'
	const ownerImg = '/static/figma/pets/adoption-owner.png'

	function hashId(id) {
		const s = String(id || '')
		let h = 0
		for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
		return h
	}

	/** 无 pets 时的演示占位：条数与头像组合随记录变化，避免每条都是五只相同猫 */
	const FALLBACK_PET_SETS = [
		[{ name: '小灰灰', avatar: petImg }],
		[
			{ name: '奥利奥', avatar: '/static/home-feed-1.png' },
			{ name: '呗呗', avatar: '/static/home-feed-2.png' }
		],
		[
			{ name: '奥利奥', avatar: '/static/home-feed-1.png' },
			{ name: '呗呗', avatar: '/static/home-feed-2.png' },
			{ name: '豆豆', avatar: '/static/avatarlog.png' }
		],
		[
			{ name: '咪咪', avatar: '/static/home-feed-2.png' },
			{ name: '小黄', avatar: '/static/home-feed-1.png' }
		],
		[{ name: '呗呗', avatar: '/static/home-feed-2.png' }]
	]

	function petsFallbackForRecord(r) {
		const idx = hashId(r && r.id) % FALLBACK_PET_SETS.length
		return FALLBACK_PET_SETS[idx].map((p) => ({ ...p }))
	}

	function recordToCard(r) {
		const map = {
			pending: { text: '等待院主审核', tone: 'red', dot: true },
			rejected: { text: '申请拒绝', tone: 'red', dot: true },
			pickup: { text: '待你就去领养', tone: 'green', dot: true },
			owner_confirm: { text: '待院主确认', tone: 'green', dot: true },
			jury_confirm: { text: '待评审团确认', tone: 'green', dot: true },
			reward: { text: '获得奖励待领取', tone: 'green', dot: true },
			reward_done: { text: '奖励已领取', tone: 'grey', dot: false },
			abandoned: { text: '已放弃领养', tone: 'grey', dot: false }
		}
		const s = map[r.status] || { text: '处理中', tone: 'grey', dot: false }
		const sourcePets =
			r.pets && r.pets.length
				? r.pets.map((p) => ({
						avatar: adoptionPetAvatarSrc(p),
						name: p.name || '猫咪'
					}))
				: petsFallbackForRecord(r)
		const pets = Array.from({ length: 5 }, (_, index) => ({
			...(sourcePets[index % sourcePets.length] || { avatar: petImg, name: '小灰灰' }),
			name: '小灰灰'
		}))
		return {
			id: r.id,
			ownerPawId: r.ownerPawId,
			ownerName: '平安是福',
			yardTag: r.yardTag || '小院',
			ownerAvatar: ownerImg,
			statusText: s.text,
			statusTone: s.tone,
			statusDot: s.dot,
			pets
		}
	}

	export default {
		data() {
			return {
				pageState: 'list',
				statusBarHeight: 20,
				menuRightWidth: 87,
				adoptionList: []
			}
		},
		computed: {
			listBadgeCount() {
				return this.pageState === 'empty' ? 0 : 7
			}
		},
		onLoad(options) {
			this.pageState = options.state === 'empty' ? 'empty' : 'list'
			const sys = uni.getSystemInfoSync()
			this.statusBarHeight = sys.statusBarHeight || 20
			// #ifdef H5
			this.statusBarHeight = 44
			// #endif
			// #ifdef MP-WEIXIN
			try {
				const mb = uni.getMenuButtonBoundingClientRect()
				if (mb && mb.left) {
					this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87)
				}
			} catch (e) {}
			// #endif
			if (options.openDetail) {
				const id = decodeURIComponent(options.openDetail)
				this.$nextTick(() => {
					setTimeout(() => {
						uni.navigateTo({
							url: '/pages/meMore/adoptionDetail?id=' + encodeURIComponent(id)
						})
					}, 80)
				})
			}
		},
		onShow() {
			if (this.pageState !== 'empty') this.refreshAdoptionList()
		},
		methods: {
			refreshAdoptionList() {
				const saved = getAdoptions()
				const demos = getDemoAdoptions()
				const byId = new Map()
				saved.forEach((r) => {
					if (r && r.id) byId.set(r.id, recordToCard(r))
				})
				demos.forEach((r) => {
					if (r && r.id && !byId.has(r.id)) byId.set(r.id, recordToCard(r))
				})
				const base = Array.from(byId.values())
				const statuses = [
					['等待院主审核','red',true],['申请拒绝','red',true],['待你前去领养','green',true],['已放弃领养','grey',false],['待院主确认','green',true],
					['领养驳回','red',true],['院主已确认','green',true],['评审驳回','red',true],['待抽取奖励','green',true],['领养完成','green',true]
				]
				this.adoptionList = Array.from({ length: 10 }, (_, index) => {
					const source = base[index % Math.max(base.length, 1)] || recordToCard({ id: 'demo-' + index, status: 'pending' })
					const state = statuses[index]
					return { ...source, id: source.id + '-view-' + index, statusText: state[0], statusTone: state[1], statusDot: state[2], ownerAvatar: ownerImg, pets: Array.from({ length: 5 }, () => ({ name: '小灰灰', avatar: petImg })) }
				})
			},
			goBack() {
				goBackSmart({ fallbackUrl: '/pages/me/index' })
			},
			onCardTap(item) {
				if (!item.id) return
				uni.navigateTo({
					url: '/pages/meMore/adoptionDetail?id=' + encodeURIComponent(item.id)
				})
			},
			openOwnerProfile(item) {
				if (!item) return
				openUserProfile({
					pawId: item.ownerPawId || 'adopt-owner-' + (item.id || item.ownerName),
					nickname: item.ownerName,
					avatar: item.ownerAvatar || ''
				})
			}
		}
	}
</script>

<style scoped>
	.adopt-page {
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
		position: relative;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 8rpx;
		box-sizing: border-box;
	}

	.nav-side {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		min-width: 80rpx;
	}

	.nav-left {
		padding: 8rpx 24rpx 8rpx 16rpx;
		margin-left: 4rpx;
		min-width: 72rpx;
		min-height: 72rpx;
		justify-content: center;
	}

	.nav-back-icon {
		width: 40rpx;
		height: 40rpx;
		display: block;
	}

	.nav-title-wrap {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		justify-content: center;
		max-width: 60%;
	}

	.nav-title-text {
		font-size: 34rpx;
		font-weight: 500;
		color: #111111;
		line-height: 48rpx;
	}

	.nav-title-badge {
		margin-left: 6rpx;
		margin-top: 2rpx;
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

	.nav-title-badge text {
		font-size: 20rpx;
		font-weight: 500;
		color: #ffffff;
		line-height: 1;
	}

	.nav-right {
		min-height: 1px;
	}

	.main-scroll {
		flex: 1;
		height: 0;
		box-sizing: border-box;
	}

	.list-pad {
		padding: 16rpx 24rpx 40rpx;
		padding-bottom: calc(40rpx + constant(safe-area-inset-bottom));
		padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.adopt-card {
		background: #ffffff;
		border-radius: 24rpx;
		padding: 24rpx 24rpx 28rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
		box-sizing: border-box;
	}

	.card-head {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-bottom: 24rpx;
	}

	.head-avatar {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		flex-shrink: 0;
		background: #f0f0f0;
	}

	.head-main {
		flex: 1;
		min-width: 0;
		margin-left: 20rpx;
	}

	.head-name-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-wrap: wrap;
		gap: 12rpx;
	}

	.head-name {
		font-size: 30rpx;
		font-weight: 500;
		color: #111111;
		line-height: 42rpx;
	}

	.head-tag {
		padding: 2rpx 12rpx;
		border-radius: 6rpx;
		background: #fff8e6;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.head-tag text {
		font-size: 22rpx;
		font-weight: 500;
		color: #666666;
		line-height: 30rpx;
	}

	.status-wrap {
		flex-shrink: 0;
		margin-left: 12rpx;
	}

	.status-pill {
		position: relative;
		min-height: 44rpx;
		padding: 0 14rpx;
		border-radius: 999rpx;
		border-width: 1rpx;
		border-style: solid;
		background: #ffffff;
		box-sizing: border-box;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
	}

	.status-pill--red {
		border-color: #ff2741;
	}

	.status-pill--red .status-pill-text {
		color: #ff2741;
	}

	.status-pill--green {
		border-color: #07c160;
	}

	.status-pill--green .status-pill-text {
		color: #07c160;
	}

	.status-pill--grey {
		border-color: #d0d0d0;
	}

	.status-pill--grey .status-pill-text {
		color: #888888;
	}

	.status-pill-text {
		font-size: 20rpx;
		font-weight: 500;
		line-height: 1.2;
		white-space: nowrap;
		text-align: center;
	}

	.status-dot {
		position: absolute;
		top: -4rpx;
		right: -4rpx;
		width: 14rpx;
		height: 14rpx;
		border-radius: 50%;
		background: #ff2741;
		border: 2rpx solid #ffffff;
		box-sizing: border-box;
	}

	/* 与小院 PawPetRoster 的状态头像行一致：从左向右排布，多只时可横向滑动 */
	.card-pets-scroll {
		width: 100%;
		padding-top: 16rpx;
		border-top: 1rpx solid #f5f5f5;
		box-sizing: border-box;
	}

	.card-pets-row {
		display: inline-flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 32rpx;
		padding: 0 4rpx 8rpx 0;
		box-sizing: border-box;
	}

	.pet-cell {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 98rpx;
	}

	/* 约 48px 圆头像，对齐小院列表密度 */
	.pet-avatar {
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
		background: #eeeeee;
		flex-shrink: 0;
	}

	.pet-name {
		margin-top: 8rpx;
		font-size: 28rpx;
		font-weight: 500;
		color: #333333;
		line-height: 40rpx;
		text-align: center;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.nav-title-wrap { display: none; }
	.nav-wrap { position: relative; }
	.page-heading { height: 31px; padding: 1px 17px 0; display: flex; align-items: flex-start; color: #222; font-size: 17px; line-height: 25px; box-sizing: border-box; }
	.page-heading .nav-title-badge { margin-top: -10px; }
	.empty-state { padding-top: 189px; display: flex; flex-direction: column; align-items: center; }
	.empty-state image { width: 155px; height: 120px; }
	.empty-title { margin-top: 9px; font-size: 12px; color: #777; }
	.empty-copy { margin-top: 4px; font-size: 10px; color: #bbb; }
	.list-pad { padding: 8px 16px 20px; }
	.adopt-card { height: 155px; margin-bottom: 7px; padding: 14px 10px 9px 17px; border-radius: 12px; box-shadow: none; }
	.card-head { margin-bottom: 20px; }
	.head-avatar { width: 36px; height: 36px; }
	.head-main { margin-left: 5px; }
	.head-main { transform: translateY(5px); }
	.head-name { font-size: 15px; line-height: 22px; }
	.head-tag { padding: 1px 7px; border-radius: 5px; background: #fff7a8; }
	.head-tag text { font-size: 11px; line-height: 16px; color: #333; }
	.status-pill { min-height: 24px; padding: 0 7px; border-radius: 6px; }
	.status-pill-text { font-size: 11px; }
	.card-pets-scroll { padding-top: 0; border-top: 0; }
	.card-pets-row { gap: 14px; padding: 0; }
	.pet-cell { width: 40px; }
	.pet-avatar { width: 40px; height: 40px; }
	.pet-name { margin-top: 4px; font-size: 12px; font-weight: 400; line-height: 17px; }
</style>
