<template>
	<view class="ff-page">
		<PawPageNav :title="pageTitle" background="#ffffff" fallback-url="/pages/index/index" />
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
	import PawPageNav from '@/components/PawPageNav.vue'
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
		components: { PawPageNav },
		data() {
			return {
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
		onLoad(query = {}) {
			this.pageTitle = decodeURIComponent(query.nickname || '') || '晓晓'
			this.ownerPawId = decodeURIComponent(query.userId || query.pawId || '')
			const tab = (query.tab || 'following').toLowerCase()
			this.listTab = ['fans', 'followers'].includes(tab) ? 'fans' : 'follow'

			const base = mockUserRows()
			this.followingRows = base.map((r) => ({ ...r, fansCount: 315 }))
			this.fansRows = base.map((r) => ({ ...r, fansCount: 315 }))
		},
		methods: {
			openRowProfile(row) {
				if (!row || row.pawId === this.ownerPawId) return
				openUserProfile({
					pawId: row.pawId,
					nickname: row.nickname,
					avatar: row.avatar || ''
				})
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
