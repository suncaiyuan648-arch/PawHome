<template>
	<view class="feed-page">
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-side nav-left" @click.stop="goBack">
					<image class="nav-back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
			<view class="page-title-line"><text>我的投粮</text><view v-if="navBadge > 0" class="nav-title-badge"><text>{{ navBadge }}</text></view></view>
		</view>

		<scroll-view class="main-scroll" scroll-y :show-scrollbar="false" :bounces="false">
			<view v-if="emptyState" class="feeding-empty">
				<image class="feeding-empty-image" src="/static/me/browsing-empty.png" mode="widthFix"></image>
				<text class="feeding-empty-title">还没有投喂</text>
				<text class="feeding-empty-copy">快去投喂第一只小可爱吧</text>
			</view>
			<view v-else class="list-pad">
				<view
					v-for="item in list"
					:key="item.id"
					class="feed-card"
					@click="openDetail(item)"
				>
					<view class="card-avatar-wrap" @click.stop="openYardRow(item)">
						<image class="card-yard-icon" src="/static/figma/feeding/my-feed-avatar.png" mode="aspectFill"></image>
					</view>
					<view class="card-mid">
						<view class="name-row" @click.stop="openFeederProfile(item)">
							<text class="name-text">{{ item.name }}</text>
							<LevelCapsule :level="item.level" />
							<YardTagPill @click.stop="openYardRow(item)" />
						</view>
						<text class="weight-line">{{ item.weightLine }}</text>
						<text class="time-line">{{ item.time }}</text>
					</view>
					<view class="card-right">
						<view class="status-row">
							<view class="status-outline" :class="'status-outline--' + item.statusTone">
								<text class="status-outline-text">{{ item.statusText }}</text>
								<view v-if="item.statusBadge > 0" class="status-num-badge">
									<text>{{ item.statusBadge }}</text>
								</view>
							</view>
						</view>
						<text class="progress-text">已反馈{{ item.progress }}次</text>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import LevelCapsule from "@/components/LevelCapsule.vue";
	import YardTagPill from "@/components/YardTagPill.vue";
	import { goBackSmart } from "@/utils/navBack.js";
	import { openUserProfile, openYardDetail } from "@/utils/profileNav.js";
	import { myFeedingRows } from "@/utils/feedingDemo.js";

	export default {
		components: { LevelCapsule, YardTagPill },
		data() {
			return {
				statusBarHeight: 20,
				menuRightWidth: 87,
				list: [],
				navBadge: 7,
				emptyState: false,
			};
		},
		onLoad(query = {}) {
			const sys = uni.getSystemInfoSync();
			this.statusBarHeight = sys.statusBarHeight || 20;
			// #ifdef MP-WEIXIN
			try {
				const mb = uni.getMenuButtonBoundingClientRect();
				if (mb && mb.left) {
					this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87);
				}
			} catch (e) {}
			// #endif
			this.emptyState = String(query.state || '') === '30';
			this.list = this.emptyState ? [] : myFeedingRows;
		},
		methods: {
			goBack() {
				goBackSmart({ fallbackUrl: "/pages/me/index" });
			},
			openFeederProfile(item) {
				if (!item) return;
				openUserProfile({
					pawId: item.pawId || "my-feed-" + item.id,
					nickname: item.name,
					avatar: item.avatar || "",
				});
			},
			openYardRow(item) {
				if (!item) return;
				openYardDetail({ yardId: item.yardId || "1", yardName: item.name });
			},
			openDetail(item) {
				if (!item || !item.id) return;
				uni.navigateTo({
					url: "/pages/meMore/feedingDetail?id=" + encodeURIComponent(item.id),
				});
			},
		},
	};
</script>

<style scoped>
	.feed-page {
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

	.page-title-line { height:56rpx; padding:0 38rpx; display:flex; align-items:center; color:#222; font-size:30rpx; line-height:42rpx; }
	.page-title-line .nav-title-badge { margin-left:2rpx; margin-top:-18rpx; }

	.nav-side {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		min-width: 80rpx;
	}

	.nav-left {
		padding: 8rpx 24rpx 8rpx 16rpx;
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

	.main-scroll {
		flex: 1;
		height: 0;
		box-sizing: border-box;
	}

	.list-pad {
		padding: 16rpx 24rpx 40rpx;
		padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.feed-card {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		background: #ffffff;
		border-radius: 24rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
		box-sizing: border-box;
	}

	.card-avatar-wrap {
		width: 88rpx;
		height: 88rpx;
		border-radius: 50%;
		flex-shrink: 0;
		background: #f5f5f5;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.card-yard-icon {
		width: 100%;
		height: 100%;
		display: block;
	}

	.feeding-empty { min-height:620rpx; display:flex; flex-direction:column; align-items:center; justify-content:center; padding-bottom:80rpx; box-sizing:border-box; }
	.feeding-empty-image { width:210rpx; opacity:.82; }
	.feeding-empty-title { margin-top:22rpx; color:#777; font-size:26rpx; line-height:38rpx; }
	.feeding-empty-copy { margin-top:10rpx; color:#aaa; font-size:24rpx; line-height:34rpx; }

	.card-mid {
		flex: 1;
		min-width: 0;
		margin-left: 20rpx;
	}

	.name-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-wrap: wrap;
		gap: 12rpx;
	}

	.name-text {
		font-size: 30rpx;
		font-weight: 500;
		color: #111111;
		line-height: 42rpx;
	}

	.weight-line {
		display: block;
		margin-top: 8rpx;
		font-size: 26rpx;
		color: #333333;
		line-height: 36rpx;
	}

	.time-line {
		display: block;
		margin-top: 8rpx;
		font-size: 22rpx;
		color: #999999;
		line-height: 30rpx;
	}

	.card-right {
		flex-shrink: 0;
		margin-left: 12rpx;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		min-height: 88rpx;
		justify-content: space-between;
	}

	.status-outline {
		position: relative;
		padding: 6rpx 14rpx;
		border-radius: 8rpx;
		border-width: 1rpx;
		border-style: solid;
		background: #ffffff;
	}

	.status-outline--green {
		border-color: #07c160;
	}

	.status-outline--green .status-outline-text {
		color: #07c160;
	}

	.status-outline-text {
		font-size: 22rpx;
		font-weight: 500;
		line-height: 30rpx;
	}

	.status-num-badge {
		position: absolute;
		top: -10rpx;
		right: -10rpx;
		min-width: 28rpx;
		height: 28rpx;
		padding: 0 6rpx;
		border-radius: 28rpx;
		background: #ff2741;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2rpx solid #ffffff;
		box-sizing: border-box;
	}

	.status-num-badge text {
		font-size: 18rpx;
		font-weight: 500;
		color: #ffffff;
		line-height: 1;
	}

	.progress-text {
		font-size: 22rpx;
		color: #6b7a99;
		line-height: 30rpx;
		margin-top: auto;
		padding-top: 12rpx;
	}
</style>
