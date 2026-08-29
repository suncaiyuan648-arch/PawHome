<template>
	<PawFeedingDetailFigma v-if="figmaVariant" :variant="figmaVariant" />
	<view v-else class="detail-page">
		<view class="nav-wrap nav-wrap--yellow" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-side nav-left" @click.stop="goBack">
					<image class="nav-back-icon" src="/static/nav-back-arrow.png" mode="aspectFit"></image>
				</view>
				<text class="nav-title-center">投喂详情</text>
				<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
		</view>

		<scroll-view class="main-scroll" scroll-y :show-scrollbar="false" :bounces="false">
			<view class="content-pad" v-if="detail">
				<view class="order-head">
					<view class="head-top">
						<view class="head-avatar-wrap" @click.stop="openYardFromDetail">
							<image class="head-yard-icon" src="/static/me/yard-feed.svg" mode="aspectFit"></image>
						</view>
						<view class="head-info">
							<view class="title-row">
								<text class="yard-name" @click.stop="openOwnerFromDetail">{{ detail.yardName }}</text>
								<YardTagPill :label="detail.yardTag" @click.stop="openYardFromDetail" />
							</view>
							<text class="feed-line feed-line--bold">{{ detail.feedAmountLine }}</text>
							<text class="time-small">{{ detail.time }}</text>
						</view>
						<view class="head-right-col">
							<text
								class="head-status"
								:class="detail.headerStatusTone === 'green' ? 'head-status--green' : 'head-status--red'"
							>{{ detail.headerStatusText }}</text>
							<view class="progress-pill">
								<text>已反馈{{ detail.feedbackProgress }}次</text>
							</view>
						</view>
					</view>
					<view class="order-no-row">
						<text class="order-no-label">订单编号: {{ detail.orderNo }}</text>
						<text class="copy-link" @click.stop="copyOrderNo">复制</text>
					</view>
				</view>

				<view class="timeline-block">
					<view v-for="(row, ti) in detail.timeline" :key="'t' + ti" class="tl-item">
						<view class="tl-axis">
							<view class="tl-dot"></view>
							<view v-if="showTimelineLineAfter(ti)" class="tl-line"></view>
						</view>
						<view class="tl-body">
							<view class="tl-head-row">
								<text class="tl-date">{{ row.day }} {{ row.month }}</text>
								<text class="tl-index">{{ row.indexText }}</text>
							</view>
							<view class="cat-icons">
								<image
									v-for="(ci, ciIdx) in row.catIcons"
									:key="ciIdx"
									class="cat-icon"
									:src="safeImgSrc(ci)"
									mode="aspectFill"
								></image>
							</view>
							<text class="tl-text">{{ row.text }}</text>
							<view class="tl-imgs">
								<image
									v-for="(im, ii) in row.imgs"
									:key="ii"
									class="tl-thumb"
									:src="safeImgSrc(im)"
									mode="aspectFill"
								></image>
							</view>
							<text class="tl-view" @click.stop="previewTimeline(row)">查看</text>
						</view>
					</view>
					<view
						v-for="(lg, li) in detail.logistics"
						:key="'l' + li"
						class="tl-item tl-item--logistics"
					>
						<view class="tl-axis">
							<view class="tl-dot"></view>
							<view v-if="li < detail.logistics.length - 1" class="tl-line"></view>
						</view>
						<view class="tl-body tl-body--logistics">
							<view class="lg-inner-row">
								<text class="lg-text">{{ lg.text }}</text>
								<text class="lg-time">{{ lg.time }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>

		<view class="fab-feedback" @click="onFeedbackTap">
			<text>反馈</text>
		</view>
	</view>
	<view v-if="showFoodSummary" class="food-summary-mask"><view class="food-summary-dialog"><text class="food-summary-title">投粮</text><view class="food-summary-row"><text>晓晓累计投粮数量</text><text>879斤</text></view><view class="food-summary-row"><text>晓晓累计投粮次数</text><text>456次</text></view><view class="food-summary-action">我知道了</view></view></view>
</template>

<script>
	import { feedingDetailById } from "@/utils/feedingDemo.js";
	import { goBackSmart } from "@/utils/navBack.js";
	import { openUserProfile, openYardDetail } from "@/utils/profileNav.js";
	import { safeImgSrc } from "@/utils/safeImgSrc.js";
	import YardTagPill from "@/components/YardTagPill.vue";
	import PawFeedingDetailFigma from "@/components/PawFeedingDetailFigma.vue";

	export default {
		components: { YardTagPill, PawFeedingDetailFigma },
		data() {
			return {
				statusBarHeight: 20,
				menuRightWidth: 87,
				detail: null,
				recordId: "",
				figmaVariant: 0,
				showFoodSummary: false,
			};
		},
		onLoad(options) {
			this.resolveFigmaVariant(options);
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
			const id = options.id ? decodeURIComponent(options.id) : "";
			this.recordId = id;
			this.detail = feedingDetailById[id] || feedingDetailById.f1;
			this.showFoodSummary = options.popup === 'food-summary';
		},
		methods: {
			resolveFigmaVariant(options = {}) {
				let value = Number(options.variant) || 0;
				// #ifdef H5
				const match = window.location.hash.match(/[?&]variant=(\d+)/);
				if (match) value = Number(match[1]) || value;
				// #endif
				this.figmaVariant = value;
			},
			safeImgSrc,
			showTimelineLineAfter(ti) {
				const t = this.detail && this.detail.timeline;
				const n = t ? t.length : 0;
				if (ti < n - 1) return true;
				const log = this.detail && this.detail.logistics;
				return !!(log && log.length);
			},
			goBack() {
				goBackSmart({ fallbackUrl: "/pages/me/index" });
			},
			openOwnerFromDetail() {
				const d = this.detail;
				if (!d) return;
				openUserProfile({
					pawId: d.ownerPawId || "feeding-" + this.recordId,
					nickname: d.yardName,
					avatar: d.avatar || "",
				});
			},
			openYardFromDetail() {
				const d = this.detail;
				if (!d) return;
				openYardDetail({ yardId: d.yardId || "1", yardName: d.yardName });
			},
			copyOrderNo() {
				const no = this.detail && this.detail.orderNo;
				if (!no) return;
				uni.setClipboardData({
					data: String(no),
					success: () => uni.showToast({ title: "已复制", icon: "none" }),
				});
			},
			previewTimeline(row) {
				const urls = (row && row.imgs || []).map((src) => this.safeImgSrc(src)).filter(Boolean);
				if (!urls.length) return;
				uni.previewImage({ current: urls[0], urls });
			},
			onFeedbackTap() {
				uni.showToast({ title: "反馈", icon: "none" });
			},
		},
	};
</script>

<style scoped>
	.detail-page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #f5f5f5;
		box-sizing: border-box;
	}

	.nav-wrap {
		flex-shrink: 0;
	}

	.nav-wrap--yellow {
		background: #ffdd00;
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
		justify-content: center;
	}

	.nav-back-icon {
		width: 40rpx;
		height: 40rpx;
		display: block;
	}

	.nav-title-center {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		font-size: 34rpx;
		font-weight: 500;
		color: #111111;
		line-height: 48rpx;
		max-width: 50%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.main-scroll {
		flex: 1;
		height: 0;
		box-sizing: border-box;
	}

	.content-pad {
		padding: 20rpx 24rpx 100rpx;
		padding-bottom: calc(100rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.order-head {
		background: #ffffff;
		border-radius: 24rpx;
		padding: 28rpx 24rpx;
		box-sizing: border-box;
		margin-bottom: 20rpx;
	}

	.head-top {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
	}

	.head-avatar-wrap {
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

	.head-yard-icon {
		width: 52rpx;
		height: 52rpx;
		display: block;
	}

	.head-info {
		flex: 1;
		min-width: 0;
		margin-left: 20rpx;
	}

	.head-right-col {
		flex-shrink: 0;
		margin-left: 12rpx;
		max-width: 40%;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 12rpx;
	}

	.title-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-wrap: wrap;
		gap: 12rpx;
	}

	.yard-name {
		font-size: 30rpx;
		font-weight: 500;
		color: #111111;
		line-height: 42rpx;
	}

	.feed-line {
		display: block;
		margin-top: 10rpx;
		font-size: 26rpx;
		color: #333333;
		line-height: 36rpx;
	}

	.feed-line--bold {
		font-weight: 500;
	}

	.time-small {
		display: block;
		margin-top: 8rpx;
		font-size: 22rpx;
		color: #999999;
		line-height: 30rpx;
	}

	.head-status {
		font-size: 22rpx;
		font-weight: 500;
		line-height: 30rpx;
		text-align: right;
	}

	.head-status--red {
		color: #ff2741;
	}

	.head-status--green {
		color: #07c160;
	}

	.order-no-row {
		margin-top: 24rpx;
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-wrap: wrap;
		gap: 16rpx;
	}

	.order-no-label {
		font-size: 24rpx;
		color: #666666;
		line-height: 34rpx;
	}

	.copy-link {
		font-size: 24rpx;
		color: #2b7cff;
		line-height: 34rpx;
	}

	.progress-pill {
		padding: 8rpx 16rpx;
		border-radius: 8rpx;
		background: #eef2f8;
	}

	.progress-pill text {
		font-size: 24rpx;
		color: #666666;
		line-height: 34rpx;
	}

	.timeline-block {
		background: #ffffff;
		border-radius: 24rpx;
		padding: 28rpx 24rpx 16rpx;
		box-sizing: border-box;
		margin-bottom: 20rpx;
	}

	.tl-item {
		display: flex;
		flex-direction: row;
		align-items: stretch;
	}

	.tl-axis {
		width: 32rpx;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 8rpx;
	}

	.tl-dot {
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		background: #ffdd00;
		flex-shrink: 0;
	}

	.tl-line {
		flex: 1;
		width: 2rpx;
		min-height: 40rpx;
		background: #e8e8e8;
		margin-top: 8rpx;
	}

	.tl-body {
		flex: 1;
		min-width: 0;
		padding-left: 16rpx;
		padding-bottom: 36rpx;
	}

	.tl-item--logistics:last-child .tl-body {
		padding-bottom: 8rpx;
	}

	.tl-body--logistics {
		padding-bottom: 28rpx;
	}

	.lg-inner-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
		width: 100%;
	}

	.tl-head-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16rpx;
	}

	.tl-date {
		font-size: 26rpx;
		font-weight: 500;
		color: #111111;
		line-height: 36rpx;
	}

	.tl-index {
		font-size: 24rpx;
		color: #999999;
		line-height: 34rpx;
	}

	.cat-icons {
		display: flex;
		flex-direction: row;
		gap: 12rpx;
		margin-bottom: 16rpx;
		flex-wrap: wrap;
	}

	.cat-icon {
		width: 56rpx;
		height: 56rpx;
		border-radius: 50%;
		background: #f5f5f5;
	}

	.tl-text {
		font-size: 26rpx;
		color: #333333;
		line-height: 40rpx;
		display: block;
		margin-bottom: 16rpx;
	}

	.tl-imgs {
		display: flex;
		flex-direction: row;
		gap: 12rpx;
		flex-wrap: wrap;
		margin-bottom: 12rpx;
	}

	.tl-thumb {
		width: 160rpx;
		height: 160rpx;
		border-radius: 12rpx;
		background: #f0f0f0;
	}

	.tl-view {
		font-size: 26rpx;
		color: #2b7cff;
		line-height: 36rpx;
	}

	.tl-item--logistics .lg-text {
		font-size: 26rpx;
		color: #333333;
		line-height: 36rpx;
		flex: 1;
		min-width: 0;
	}

	.tl-item--logistics .lg-time {
		font-size: 24rpx;
		color: #999999;
		line-height: 34rpx;
		flex-shrink: 0;
	}

	.fab-feedback {
		position: fixed;
		right: 32rpx;
		bottom: calc(28rpx + env(safe-area-inset-bottom));
		min-width: 100rpx;
		height: 64rpx;
		padding: 0 32rpx;
		border-radius: 999rpx;
		background: #ffdd00;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 6rpx 18rpx rgba(0, 0, 0, 0.1);
		box-sizing: border-box;
		z-index: 100;
	}

	.fab-feedback text {
		font-size: 26rpx;
		font-weight: 500;
		color: #111111;
		line-height: 36rpx;
	}
	.food-summary-mask{position:fixed;inset:0;z-index:900;background:#5b5b5b;display:flex;align-items:center;justify-content:center}.food-summary-dialog{width:251px;height:223px;border-radius:18px;background:#fff;overflow:hidden;padding:0 22px;box-sizing:border-box;transform:translateY(-35px)}.food-summary-title{display:block;margin-top:17px;padding-bottom:16px;border-bottom:1px solid #eee;text-align:center;font-size:20px;font-weight: 500}.food-summary-row{height:43px;display:flex;align-items:center;justify-content:space-between;color:#888;font-size:14px}.food-summary-row text:last-child{color:#555}.food-summary-action{height:49px;margin:5px -22px 0;border-top:1px solid #eee;display:flex;align-items:center;justify-content:center;color:#999;font-size:16px}
</style>
