<template>
	<view class="feed-page">
		<!-- #ifndef MP-WEIXIN -->
		<image class="h5-status-bar" src="/static/figma/status-bar-feed-orders.png" mode="scaleToFill"></image>
		<!-- #endif -->
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-side nav-left" @click.stop="goBack">
					<image class="nav-back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<text v-if="ownerMode" class="owner-nav-title">小院订单</text>
				<view v-if="ownerMode" class="owner-search"><uni-icons type="search" color="#c7c7c7" :size="14"></uni-icons><text>搜索宠物名字/品种等</text><view class="owner-search-btn">搜一搜</view></view>
				<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
			<view v-if="!ownerMode" class="page-title-line"><text>小院投粮</text><view v-if="navBadge > 0" class="nav-title-badge"><text>{{ navBadge }}</text></view></view>
			<view v-else class="owner-filters"><view>列表展示⌄</view><view>智能排序⌄</view></view>
		</view>

		<scroll-view class="main-scroll" scroll-y :show-scrollbar="false" :bounces="false">
			<view class="list-pad">
				<view
					v-for="item in list"
					:key="item.id"
					class="feed-card"
					@click="openDetail(item)"
				>
					<view class="card-avatar-wrap" @click.stop="openYardRow(item)">
						<image class="card-yard-icon" src="/static/figma/feeding/yard-feed-avatar.png" mode="aspectFill"></image>
					</view>
					<view class="card-mid">
						<view class="name-row" @click.stop="openFeederProfile(item)">
							<text class="name-text">{{ item.name }}</text>
							<LevelCapsule :level="item.level" />
						</view>
						<text v-if="ownerMode" class="weight-line owner-weight">【{{ item.petName }}】云养30天/投粮4斤</text>
						<text v-else class="weight-line">{{ item.weightLine }}</text>
						<text class="time-line">{{ item.time }}</text>
						<view v-if="ownerMode" class="owner-order-state" :class="'owner-order-state--' + item.orderTone"><text class="owner-state-pill">{{ item.orderState }}</text><text>{{ item.orderCopy }}</text></view>
					</view>
					<view v-if="!ownerMode" class="card-right">
						<text
							class="top-status"
							:class="{
								'top-status--red': item.topKind === 'countdown' || item.topKind === 'timeout',
								'top-status--green': item.topKind === 'done',
							}"
						>{{ item.topText }}</text>
						<view class="bottom-tag"><text>{{ item.bottomTag }}</text></view>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import LevelCapsule from "@/components/LevelCapsule.vue";
	import { goBackSmart } from "@/utils/navBack.js";
	import { openUserProfile, openYardDetail } from "@/utils/profileNav.js";
	import { yardFeedOrderRows } from "@/utils/feedingDemo.js";

	export default {
		components: { LevelCapsule },
		data() {
			return {
				statusBarHeight: 20,
				menuRightWidth: 87,
				list: [],
				navBadge: 1,
				ownerMode: false,
			};
		},
		onLoad(query = {}) {
			const sys = uni.getSystemInfoSync();
			this.statusBarHeight = sys.statusBarHeight || 20;
			// #ifdef H5
			this.statusBarHeight = 20;
			// #endif
			// #ifdef MP-WEIXIN
			try {
				const mb = uni.getMenuButtonBoundingClientRect();
				if (mb && mb.left) {
					this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87);
				}
			} catch (e) {}
			// #endif
			this.ownerMode = String(query.state || '') === 'owner';
			if (this.ownerMode) {
				const base = yardFeedOrderRows[0];
				this.list = [
					{ ...base, id:'o1', petName:'小白', orderState:'云养中', orderTone:'blue', orderCopy:'今天已经反馈了，辛苦了！' },
					{ ...base, id:'o2', petName:'小黑', orderState:'云养中', orderTone:'red', orderCopy:'您已超时6天未反馈，请尽快反馈！' },
					{ ...base, id:'o3', petName:'包子脸...', orderState:'全部完成', orderTone:'green', orderCopy:'超额反馈7次，太棒了！' },
					{ ...base, id:'o4', petName:'黑猪', orderState:'待物流签收', orderTone:'orange', orderCopy:'物资运输中，等待小院签收后正式...' },
					{ ...base, id:'o5', petName:'黑猪', orderState:'待云养生效', orderTone:'orange', orderCopy:'等待其他订单云养时间结束后开始' }
				];
			} else this.list = yardFeedOrderRows;
		},
		methods: {
			goBack() {
				goBackSmart({ fallbackUrl: "/pages/me/index" });
			},
			openFeederProfile(item) {
				if (!item) return;
				openUserProfile({
					pawId: item.pawId || "yard-feed-" + item.id,
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
		position:relative;
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
	.h5-status-bar{position:absolute;left:0;top:0;width:100%;height:44px;z-index:100;pointer-events:none}

	.page-title-line { height:56rpx; padding:0 38rpx; display:flex; align-items:center; color:#222; font-size:30rpx; line-height:42rpx; }
	.page-title-line .nav-title-badge { margin-left:2rpx; margin-top:-18rpx; }
	.owner-nav-title { position:absolute; left:30rpx; font-size:30rpx; color:#222; white-space:nowrap; }
	.owner-search { position:absolute; left:250rpx; right:26rpx; height:58rpx; border:2rpx solid #222; border-radius:30rpx; background:#fff; display:flex; align-items:center; padding-left:18rpx; color:#bbb; font-size:22rpx; box-sizing:border-box; overflow:hidden; }
	.owner-search text { margin-left:8rpx; white-space:nowrap; }
	.owner-search-btn { margin-left:auto; height:50rpx; min-width:94rpx; border-radius:28rpx; background:#222; color:#fff; display:flex; align-items:center; justify-content:center; font-size:22rpx; }
	.owner-filters { height:62rpx; display:flex; gap:16rpx; align-items:center; padding:0 16rpx; }
	.owner-filters view { height:46rpx; padding:0 24rpx; border-radius:8rpx; background:#fff; display:flex; align-items:center; color:#555; font-size:22rpx; }

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
		font-weight: 600;
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
		font-weight: 600;
		color: #ffffff;
		line-height: 1;
	}

	.main-scroll {
		flex: 1;
		height: 0;
		box-sizing: border-box;
	}

	.list-pad {
		padding: 8rpx 15px 40rpx;
		padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.feed-card {
		min-height:98px;
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		background: #ffffff;
		border-radius: 24rpx;
		padding: 24rpx;
		margin-bottom: 7px;
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
	.owner-weight { font-size:26rpx; white-space:nowrap; }
	.owner-order-state { margin-top:16rpx; display:flex; align-items:center; gap:8rpx; font-size:22rpx; white-space:nowrap; }
	.owner-state-pill { padding:2rpx 8rpx; border:1rpx solid currentColor; border-radius:6rpx; }
	.owner-order-state--blue { color:#1786ff; }
	.owner-order-state--red { color:#ff3b45; }
	.owner-order-state--green { color:#08bd68; }
	.owner-order-state--orange { color:#ff8a24; }
	.ownerMode .feed-card { padding:20rpx 24rpx; }

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
		max-width: 42%;
	}

	.top-status {
		font-size: 22rpx;
		font-weight: 500;
		line-height: 30rpx;
		text-align: right;
	}

	.top-status--red {
		color: #ff2741;
	}

	.top-status--green {
		color: #07c160;
		padding: 4rpx 12rpx;
		border-radius: 8rpx;
		border: 1rpx solid #07c160;
		box-sizing: border-box;
	}

	.bottom-tag {
		margin-top: auto;
		padding: 8rpx 14rpx;
		border-radius: 8rpx;
		background: #eef2f8;
	}

	.bottom-tag text {
		font-size: 22rpx;
		color: #6b7a99;
		line-height: 30rpx;
	}
</style>
