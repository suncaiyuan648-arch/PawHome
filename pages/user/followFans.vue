<template>
	<view class="ff-page">
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-side nav-left" @click.stop="goBack">
					<image
						class="nav-back-icon"
						src="/static/nav-back-arrow.png"
						mode="aspectFit"
					></image>
				</view>
				<text class="nav-title">{{ pageTitle }}</text>
				<view class="nav-side nav-right">
					<view class="nav-capsule" @click.stop="onCapsule">
						<view class="capsule-more">
							<view class="dot"></view>
							<view class="dot"></view>
							<view class="dot"></view>
						</view>
						<view class="capsule-divider"></view>
						<view class="capsule-target">
							<view class="target-ring"></view>
							<view class="target-dot"></view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="tabs">
			<view
				class="tab-cell"
				:class="{ 'tab-cell--active': listTab === 'follow' }"
				@click="listTab = 'follow'"
			>
				<text class="tab-txt">关注</text>
				<view v-if="listTab === 'follow'" class="tab-line"></view>
			</view>
			<view
				class="tab-cell"
				:class="{ 'tab-cell--active': listTab === 'fans' }"
				@click="listTab = 'fans'"
			>
				<text class="tab-txt">粉丝</text>
				<view v-if="listTab === 'fans'" class="tab-line"></view>
			</view>
		</view>

		<scroll-view
			class="list-scroll"
			scroll-y
			:show-scrollbar="false"
			:bounces="false"
		>
			<view
				v-for="(row, idx) in currentRows"
				:key="listTab + '-' + row.pawId + '-' + idx"
				class="user-row"
			>
				<image class="user-av" :src="row.avatar" mode="aspectFill" @click.stop="openRowProfile(row)"></image>
				<view class="user-mid" @click.stop="openRowProfile(row)">
					<text class="user-name">{{ row.nickname }}</text>
					<text class="user-meta">粉丝 {{ row.fansCount }}</text>
					<text class="user-meta">逢猫号: {{ row.pawId }}</text>
				</view>
				<view
					class="row-follow-btn"
					:class="{ 'row-follow-btn--on': row.followed }"
					@click.stop="toggleRowFollow(row)"
				>
					<text class="row-follow-txt">{{ row.followed ? '已关注' : '关注' }}</text>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import { goBackSmart } from '@/utils/navBack.js'
	import { openUserProfile } from '@/utils/profileNav.js'

	const mockUserRows = () => {
		const one = (i) => ({
			pawId: String(23456789 + i),
			nickname: 'Q',
			avatar: '/static/figma/follow/avatar.png',
			fansCount: 315,
			followed: false
		})
		return [one(0), one(1), one(2), one(3), one(4)]
	}

	export default {
		data() {
			return {
				statusBarHeight: 20,
				pageTitle: '',
				ownerPawId: '',
				listTab: 'follow',
				followingRows: [],
				fansRows: []
			}
		},
		computed: {
			currentRows() {
				return this.listTab === 'follow' ? this.followingRows : this.fansRows
			}
		},
		onLoad(query) {
			const sys = uni.getSystemInfoSync()
			this.statusBarHeight = sys.statusBarHeight || 20
			this.pageTitle = decodeURIComponent(query.nickname || '') || '晓晓'
			this.ownerPawId = decodeURIComponent(query.pawId || '')
			const tab = (query.tab || 'follow').toLowerCase()
			this.listTab = tab === 'fans' ? 'fans' : 'follow'

			const base = mockUserRows()
			this.followingRows = base.map((r) => ({ ...r, fansCount: 315 }))
			this.fansRows = base.map((r) => ({ ...r, fansCount: 315 }))
		},
		methods: {
			goBack() {
				goBackSmart({ fallbackUrl: '/pages/index/index' })
			},
			openRowProfile(row) {
				if (!row || row.pawId === this.ownerPawId) return
				openUserProfile({
					pawId: row.pawId,
					nickname: row.nickname,
					avatar: row.avatar || ''
				})
			},
			onCapsule() {
				uni.showToast({ title: '更多', icon: 'none' })
			},
			toggleRowFollow(row) {
				row.followed = !row.followed
			}
		}
	}
</script>

<style scoped>
	.ff-page {
		height: 100vh;
		background: #ffffff;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
	}

	.nav-wrap {
		flex-shrink: 0;
		background: #ffffff;
	}

	.nav-row {
		position: relative;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 16rpx;
		box-sizing: border-box;
	}

	.nav-side {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		min-width: 160rpx;
	}

	.nav-left {
		justify-content: flex-start;
		padding: 8rpx 16rpx 8rpx 8rpx;
	}

	.nav-back-icon {
		width: 40rpx;
		height: 40rpx;
		display: block;
	}

	.nav-title {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		max-width: 46%;
		font-size: 34rpx;
		font-weight: 500;
		color: #111111;
		line-height: 48rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.nav-right {
		justify-content: flex-end;
		min-width: 160rpx;
	}

	.nav-capsule {
		display: flex;
		flex-direction: row;
		align-items: center;
		width: 174rpx;
		height: 64rpx;
		padding: 0 20rpx;
		box-sizing: border-box;
		border-radius: 37rpx;
		border: 1px solid #e9e9e9;
		background: rgba(255, 255, 255, 0.95);
	}

	.capsule-more {
		flex: 1;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
	}

	.dot {
		width: 8rpx;
		height: 8rpx;
		border-radius: 50%;
		background: #333333;
	}

	.capsule-divider {
		width: 1px;
		height: 40rpx;
		background: #e0e0e0;
		margin: 0 12rpx;
	}

	.capsule-target {
		position: relative;
		width: 36rpx;
		height: 36rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.target-ring {
		position: absolute;
		width: 36rpx;
		height: 36rpx;
		border: 2rpx solid #333333;
		border-radius: 50%;
		box-sizing: border-box;
	}

	.target-dot {
		width: 14rpx;
		height: 14rpx;
		border-radius: 50%;
		background: #333333;
	}

	.tabs {
		flex-shrink: 0;
		display: flex;
		flex-direction: row;
		background: #ffffff;
		padding: 0 48rpx;
		border-bottom: 1rpx solid #f0f0f0;
		box-sizing: border-box;
	}

	.tab-cell {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 28rpx 0 20rpx;
		position: relative;
		box-sizing: border-box;
	}

	.tab-txt {
		font-size: 30rpx;
		font-weight: 500;
		color: #979797;
		line-height: 42rpx;
	}

	.tab-cell--active .tab-txt {
		color: #111111;
		font-weight: 500;
	}

	.tab-line {
		position: absolute;
		left: 50%;
		bottom: 8rpx;
		transform: translateX(-50%);
		width: 72rpx;
		height: 8rpx;
		border-radius: 4rpx;
		background: #ffe60f;
	}

	.list-scroll {
		flex: 1;
		height: 0;
		min-height: 0;
		box-sizing: border-box;
	}

	.user-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 22rpx 32rpx;
		border-bottom: 1rpx solid #f5f5f5;
		box-sizing: border-box;
	}

	.user-av {
		width: 88rpx;
		height: 88rpx;
		border-radius: 50%;
		flex-shrink: 0;
		background: #fff8e6;
	}

	.user-mid {
		flex: 1;
		min-width: 0;
		margin-left: 24rpx;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.user-name {
		font-size: 30rpx;
		font-weight: 500;
		color: #111111;
		line-height: 42rpx;
	}

	.user-meta {
		margin-top: 8rpx;
		font-size: 24rpx;
		font-weight: 400;
		color: #999999;
		line-height: 34rpx;
	}

	.row-follow-btn {
		flex-shrink: 0;
		margin-left: 16rpx;
		height: 46rpx;
		padding: 0 24rpx;
		border-radius: 999rpx;
		background: #fff36a;
		display:flex;
		align-items:center;
		justify-content:center;
	}

	.row-follow-btn--on {
		background: #f0f0f0;
	}

	.row-follow-txt {
		font-size: 24rpx;
		font-weight: 500;
		color: #111111;
	}

	.row-follow-btn--on .row-follow-txt {
		color: #666666;
	}
</style>
