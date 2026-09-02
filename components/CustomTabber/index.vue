<template>
	<view class="customTabber">
		<PawBottomSheet :model-value="showPublishPanel" variant="publish" height="70vh" :close-on-mask="true"
			:safe-area="true" @update:model-value="setPublishPanelVisible">
			<PawPublishSheetContent @post="onPublishPost" @create-yard="onPublishCatYard" @create-help="onPublishHelp"
				@close="closePublishPanel" />
		</PawBottomSheet>
		<view class="customTabberItem" :class="{ 'active': activeItem === 0 }" @tap="changeTabber(0)">
			<text>
				首页
			</text>
		</view>
		<view class="customTabberItem" :class="{ 'active': activeItem === 1 }" @tap="changeTabber(1)"><text>自营</text>
		</view>
		<view class="customContent" data-qa="publish-fab" @tap="openPublishPanel">
			<view class="fab-bg">
				<image class="customImage" src="/static/fabu.png" mode="aspectFit"></image>
			</view>
		</view>
		<view class="customTabberItem" :class="{ 'active': activeItem === 2 }" @tap="changeTabber(2)">
			<view class="tab-label-wrap">
				<text>消息</text>
				<view v-if="messageUnreadCount > 0" class="message"><text>{{ formatUnreadCount(messageUnreadCount)
				}}</text></view>
			</view>
		</view>
		<view class="customTabberItem" :class="{ 'active': activeItem === 3 }" @tap="changeTabber(3)"><text>我</text>
		</view>
	</view>
</template>

<script>
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import PawPublishSheetContent from '@/components/PawPublishSheetContent.vue'
import { getTotalMessageUnreadCount } from '@/utils/messageUnread.js'

export default {
	name: "CustomBabber",
	components: { PawBottomSheet, PawPublishSheetContent },
	props: {
		tabIndex: {
			type: Number,
			default: 0
		}
	},
	data() {
		return {
			activeItem: 0,
			showPublishPanel: false
		};
	},
	computed: {
		messageUnreadCount() {
			return getTotalMessageUnreadCount()
		}
	},
	watch: {
		tabIndex: {
			immediate: true,
			handler(n) {
				this.activeItem = n
			}
		}
	},
	methods: {
		formatUnreadCount(count) {
			return count > 99 ? '99+' : count
		},
		openPublishPanel() {
			this.showPublishPanel = !this.showPublishPanel
		},
		setPublishPanelVisible(value) {
			this.showPublishPanel = value
		},
		closePublishPanel() {
			this.showPublishPanel = false
		},
		onPublishPost() {
			this.closePublishPanel()
			uni.navigateTo({ url: '/pages/publishDynamic/postFeed' })
		},
		onPublishCatYard() {
			this.closePublishPanel()
			uni.navigateTo({ url: '/pages/yard/catGuide' })
		},
		onPublishHelp() {
			this.closePublishPanel()
			uni.navigateTo({ url: '/pages/feature/index?mode=rescue-detail' })
		},
		changeTabber(index) {
			const routes = [
				'/pages/index/index',
				'/pages/selfRun/index',
				'/pages/message/index',
				'/pages/me/index'
			]
			const url = routes[index]
			if (!url) return
			this.activeItem = index
			const pages = getCurrentPages()
			const cur = pages.length ? '/' + pages[pages.length - 1].route : ''
			if (cur === url) return
			// #ifdef MP-WEIXIN
			uni.switchTab({
				url,
				fail: () => {
					uni.reLaunch({ url })
				}
			})
			// #endif
			// #ifndef MP-WEIXIN
			uni.reLaunch({ url })
			// #endif
		},
	}
}
</script>

<style lang="less" scoped>
.customTabber {
	width: 100%;
	height: 73px;
	padding-bottom: 34px;
	position: fixed;
	left: 0;
	bottom: 0;
	display: flex;
	justify-content: space-between;
	align-items: center;
	box-sizing: border-box;
	background: #ffffff;
	z-index: 999;

	.customTabberItem {
		flex: 1;
		height: 100%;
		text-align: center;
		font-family: var(--paw-font-family, -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif);
		font-size: 15px;
		font-weight: 500;
		line-height: 22px;
		color: #8c8c8c;
		text-align: center;
		vertical-align: top;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
	}

	.tab-label-wrap {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0 8px;
	}

	.message {
		position: absolute;
		left: 100%;
		top: -4.5px;
		margin-left: -20px;
		width: 29px;
		min-width: 29px;
		height: 15px;
		padding: 0 4px;
		box-sizing: border-box;
		border-radius: 100px;
		color: #fff;
		background: #ff2741;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 12px;
		font-weight: 500;
		line-height: 1;
	}

	.active {
		color: #333333;
		font-size: 16px;
		font-weight: 500;
	}

	.customContent {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;

		.fab-bg {
			width: 43px;
			height: 32px;
			border-radius: 8px;
			background: #ffe60d;
			display: flex;
			align-items: center;
			justify-content: center;
			transform: translateY(1.5px);
		}

		.customImage {
			width: 32px;
			height: 24px;
		}
	}

}
</style>
