<template>
	<view class="message-page">
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row">
				<view class="nav-side nav-left" @click="goBack">
					<image class="nav-back-icon" src="/static/zuojiantou.png" mode="aspectFit"></image>
				</view>
				<text class="nav-title">消息</text>
				<view class="nav-side nav-right" :style="{ width: menuRightWidth + 'px' }"></view>
			</view>
		</view>
		<scroll-view class="main-scroll" scroll-y :show-scrollbar="false" enhanced :bounces="false">
			<view class="msg-list">
				<view
					v-for="(row, idx) in messageRows"
					:key="idx"
					class="msg-row"
					:class="{ 'msg-row--last': idx === messageRows.length - 1 }"
					@click="onRowTap(row)"
				>
					<view v-if="row.iconComposite" class="msg-icon-circle msg-icon-circle--composite">
						<image
							class="msg-icon-stack msg-icon-stack--bg"
							src="/static/message-icons/order-icon-bg.png"
							mode="aspectFill"
						></image>
						<image
							class="msg-icon-stack msg-icon-stack--fg"
							src="/static/message-icons/order-icon-fg.png"
							mode="aspectFit"
						></image>
					</view>
					<view v-else class="msg-icon-circle" :style="{ background: row.iconColor }">
						<uni-icons :type="row.iconType" color="#FFFFFF" :size="22"></uni-icons>
					</view>
					<view class="msg-main">
						<view class="msg-line1">
							<text class="msg-name">{{ row.title }}</text>
							<view class="msg-right">
								<text class="msg-time">{{ row.time }}</text>
								<view v-if="row.badge > 0" class="msg-badge">
									<text>{{ row.badge > 99 ? '99+' : row.badge }}</text>
								</view>
							</view>
						</view>
						<text class="msg-preview">{{ row.preview }}</text>
					</view>
				</view>
			</view>
		</scroll-view>
		<!-- #ifndef MP-WEIXIN -->
		<CustomTabber :tab-index="2" />
		<!-- #endif -->
	</view>
</template>

<script>
	import CustomTabber from '@/components/CustomTabber/index.vue'
	import { goBackSmart } from '@/utils/navBack.js'

	export default {
		components: { CustomTabber },
		data() {
			return {
				statusBarHeight: 20,
				menuRightWidth: 87,
				messageRows: [
					{
						title: '互动消息',
						preview: '家和万事兴点赞了你的动态',
						time: '11:05',
						badge: 3,
						iconType: 'hand-up-filled',
						iconColor: '#F86C47',
						type: 'interaction'
					},
					{
						title: '订单消息',
						preview: '订单已发货',
						time: '11:05',
						badge: 3,
						iconComposite: true,
						type: 'order'
					},
					{
						title: '服务订单消息',
						preview: '您的订单已被喂养师xxx接单，喂...',
						time: '11:05',
						badge: 3,
						iconType: 'chatbubble-filled',
						iconColor: '#3D88FC',
						type: 'service'
					},
					{
						title: '系统通知',
						preview: '近期反馈的订单退款未到账问题...',
						time: '11:05',
						badge: 3,
						iconType: 'sound-filled',
						iconColor: '#F9B804',
						type: 'system'
					},
					{
						title: '活动消息',
						preview: '合肥明珠广场领养活动7月12日开...',
						time: '4/23',
						badge: 3,
						iconType: 'notification-filled',
						iconColor: '#FF0061',
						type: 'activity'
					},
					{
						title: '宠物消息',
						preview: '合肥明珠广场领养活动7月12日开...',
						time: '4/23',
						badge: 3,
						iconType: 'home-filled',
						iconColor: '#FFA65A',
						type: 'pet'
					}
				]
			}
		},
		onLoad() {
			const sys = uni.getSystemInfoSync()
			this.statusBarHeight = sys.statusBarHeight || 20
			// #ifdef MP-WEIXIN
			try {
				const mb = uni.getMenuButtonBoundingClientRect()
				if (mb && mb.left) {
					this.menuRightWidth = Math.max(sys.windowWidth - mb.left, 87)
				}
			} catch (e) {}
			// #endif
		},
		onShow() {
			// #ifdef MP-WEIXIN
			this.$nextTick(() => {
				const cur = getCurrentPages().slice(-1)[0]
				if (cur && typeof cur.getTabBar === 'function') {
					const tb = cur.getTabBar()
					if (tb && typeof tb.setData === 'function') tb.setData({ selected: 2 })
				}
			})
			// #endif
		},
		methods: {
			goBack() {
				goBackSmart({ fallbackUrl: '/pages/index/index' })
			},
			openSubscribeHint() {
				uni.showToast({ title: '请在设置中开启消息通知', icon: 'none' })
			},
			onRowTap(row) {
				if (row.type === 'pet') {
					uni.navigateTo({ url: '/pages/adoption/extras?mode=support' })
					return
				}
				if (['service', 'interaction', 'activity'].includes(row.type)) {
					uni.navigateTo({ url: '/pages/messageDetail/index?type=' + encodeURIComponent(row.type) })
					return
				}
				uni.showToast({ title: row.title, icon: 'none' })
			}
		}
	}
</script>

<style scoped>
	.message-page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #ffffff;
		box-sizing: border-box;
	}

	.nav-wrap {
		flex-shrink: 0;
		background: #ffffff;
	}

	.nav-row {
		position: relative;
		height: 54px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 12rpx;
		box-sizing: border-box;
	}

	.nav-side {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		min-width: 80rpx;
	}

	.nav-left {
		padding: 12rpx 20rpx;
		min-height: 64rpx;
		box-sizing: border-box;
		justify-content: center;
	}

	.nav-back-icon {
		width: 20rpx;
		height: 36rpx;
	}

	.nav-title {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		font-size: 32rpx;
		font-weight: 500;
		line-height: 46rpx;
		color: #000000;
	}

	.nav-right {
		min-height: 1px;
	}

	.main-scroll {
		flex: 1;
		height: 0;
		box-sizing: border-box;
		padding-bottom: calc(248rpx + constant(safe-area-inset-bottom));
		padding-bottom: calc(248rpx + env(safe-area-inset-bottom));
	}

	.push-strip {
		background: #ffffff;
		padding: 28rpx 32rpx 32rpx;
		border-bottom: 1rpx solid #f2f2f2;
	}

	.push-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 78rpx;
	}

	.push-left {
		display: flex;
		align-items: center;
		flex: 1;
		min-width: 0;
		padding-right: 16rpx;
	}

	.wechat-icon-wrap {
		width: 78rpx;
		height: 78rpx;
		border-radius: 12rpx;
		background: #07c160;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.wechat-icon-glyph {
		font-size: 30rpx;
		font-weight: 500;
		color: #ffffff;
	}

	.push-title {
		margin-left: 22rpx;
		font-size: 32rpx;
		font-weight: 500;
		line-height: 44rpx;
		color: #333333;
	}

	.push-btn {
		flex-shrink: 0;
		padding: 10rpx 26rpx;
		border-radius: 200rpx;
		background: #f7f7f7;
		border: 1rpx solid #e9e9e9;
	}

	.push-btn text {
		font-size: 24rpx;
		font-weight: 500;
		line-height: 34rpx;
		color: #000000;
	}

	.section-title {
		display: block;
		margin: 28rpx 32rpx 8rpx;
		font-size: 36rpx;
		font-weight: 500;
		line-height: 52rpx;
		color: #333333;
	}

	.msg-list {
		background: #ffffff;
	}

	.msg-row {
		display: flex;
		align-items: center;
		padding: 28rpx 32rpx;
		min-height: 152rpx;
		box-sizing: border-box;
		border-bottom: 1rpx solid #f2f2f2;
	}

	.msg-row--last {
		border-bottom-width: 0;
	}

	.msg-icon-circle {
		width: 90rpx;
		height: 90rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.msg-icon-circle--composite {
		position: relative;
		overflow: hidden;
		background: transparent;
	}

	.msg-icon-stack {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
	}

	.msg-icon-stack--bg {
		border-radius: 50%;
	}

	.msg-icon-stack--fg {
		left: 50%;
		top: 50%;
		width: 100%;
		height: 100%;
		transform: translate(-50%, -50%) scale(0.92);
		pointer-events: none;
	}

	.msg-main {
		flex: 1;
		min-width: 0;
		margin-left: 22rpx;
	}

	.msg-line1 {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16rpx;
	}

	.msg-name {
		flex: 1;
		min-width: 0;
		font-size: 30rpx;
		font-weight: 500;
		line-height: 44rpx;
		color: #333333;
	}

	.msg-right {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		justify-content: flex-start;
		gap: 10rpx;
		min-width: 72rpx;
	}

	.msg-time {
		font-size: 22rpx;
		font-weight: 400;
		line-height: 32rpx;
		color: #999999;
		text-align: right;
	}

	.msg-preview {
		display: block;
		margin-top: 6rpx;
		font-size: 28rpx;
		font-weight: 400;
		line-height: 40rpx;
		color: #999999;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.msg-badge {
		min-width: 36rpx;
		height: 34rpx;
		padding: 0 12rpx;
		box-sizing: border-box;
		border-radius: 200rpx;
		background: #ff2741;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.msg-badge text {
		font-size: 24rpx;
		font-weight: 500;
		line-height: 34rpx;
		color: #ffffff;
	}
</style>
