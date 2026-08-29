<template>
	<view class="customTabber">
		<PawBottomSheet
			:model-value="showPublishPanel"
			variant="publish"
			height="70vh"
			:close-on-mask="true"
			:safe-area="true"
			@update:model-value="setPublishPanelVisible"
		>
			<view class="publish-sheet-body">
				<view class="publish-sheet-head">
					<text class="publish-sheet-title">发布动态</text>
					<view class="publish-sheet-close" @click.stop="closePublishPanel"><text>×</text></view>
				</view>
				<view class="publish-action publish-action--primary" @click.stop="onPublishPost">
					<view class="publish-action-title-row"><text class="publish-action-title">发动态</text><image class="publish-action-arrow" src="/static/youjiantou.png" mode="aspectFit"></image></view>
					<text class="publish-action-desc">院主院主，快来更新小院的动态吧</text>
				</view>
				<view class="publish-option-row">
					<view class="publish-option-column" @click.stop="onPublishCatYard">
						<text class="publish-option-label">创建小院</text>
						<view class="publish-option publish-option--cat"><view class="publish-option-title-row"><text>流浪动物小院</text><image src="/static/youjiantou.png" mode="aspectFit"></image></view><text>为小毛娃撰粮</text></view>
					</view>
					<view class="publish-option-column" @click.stop="onPublishHelp">
						<text class="publish-option-label">发起求助</text>
						<view class="publish-option publish-option--help"><view class="publish-option-title-row"><text>流浪动物救助</text><image src="/static/youjiantou.png" mode="aspectFit"></image></view><text>为小毛娃救治绝育</text></view>
					</view>
				</view>
			</view>
		</PawBottomSheet>
		<view class="customTabberItem" :class="{'active':activeItem === 0}" @click="changeTabber(0)">
			<text>
				首页
			</text>
		</view>
		<view class="customTabberItem" :class="{'active':activeItem === 1}" @click="changeTabber(1)"><text>自营</text>
		</view>
		<view class="customContent" @click="openPublishPanel">
			<view class="fab-bg">
				<image class="customImage" src="/static/fabu.png" mode="aspectFit"></image>
			</view>
		</view>
		<view class="customTabberItem" :class="{'active':activeItem === 2}" @click="changeTabber(2)">
			<view class="tab-label-wrap">
				<text>消息</text>
				<view class="message"><text>99+</text></view>
			</view>
		</view>
		<view class="customTabberItem" :class="{'active':activeItem === 3}" @click="changeTabber(3)"><text>我</text>
		</view>
	</view>
</template>

<script>
	import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'

	export default {
		name: "CustomBabber",
		components: { PawBottomSheet },
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
		watch: {
			tabIndex: {
				immediate: true,
				handler(n) {
					this.activeItem = n
				}
			}
		},
		methods: {
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
		position: absolute;
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

	:deep(.paw-bottom-sheet--publish) {
		background: #fff;
		border-radius: 15px 15px 0 0;
	}

	:deep(.paw-bottom-sheet--publish .paw-bottom-sheet__body) {
		height: 100%;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}

	.publish-sheet-body {
		height: 100%;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}

	.publish-sheet-head {
		position: relative;
		height: 30px;
		flex: 0 0 30px;
	}

	.publish-sheet-title {
		display: block;
		margin-left: 13px;
		color: #1f1f1f;
		font-size: 24px;
		font-weight: 700;
		line-height: 30px;
	}

	.publish-sheet-close {
		position: absolute;
		right: -4px;
		top: -8px;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.publish-sheet-close text {
		color: #2f2f2f;
		font-size: 30px;
		font-weight: 400;
		line-height: 1;
	}

	.publish-action {
		box-sizing: border-box;
		border-radius: 14px;
	}

	.publish-action--primary {
		height: 104px;
		margin-top: 13px;
		padding: 29px 13px;
		background: #ffe60f;
	}

	.publish-action-title-row,
	.publish-option-title-row {
		display: flex;
		align-items: center;
	}

	.publish-action-title {
		color: #222;
		font-size: 24px;
		font-weight: 700;
		line-height: 29px;
	}

	.publish-action-arrow {
		width: 11px;
		height: 11px;
		margin-left: 8px;
	}

	.publish-action-desc {
		display: block;
		margin-top: 1px;
		color: #3c3c3c;
		font-size: 13px;
		line-height: 18px;
	}

	.publish-option-row {
		display: flex;
		column-gap: 12px;
		margin-top: 31px;
	}

	.publish-option-column {
		min-width: 0;
		flex: 1;
	}

	.publish-option-label {
		display: block;
		margin: 0 0 16px 13px;
		color: #222;
		font-size: 20px;
		font-weight: 700;
		line-height: 25px;
	}

	.publish-option {
		height: 75px;
		padding: 17px 13px;
		border-radius: 12px;
		box-sizing: border-box;
	}

	.publish-option--cat { background: #d4f08a; }
	.publish-option--help { background: #ff4148; }

	.publish-option-title-row text {
		color: #2c2c2c;
		font-size: 16px;
		font-weight: 700;
		line-height: 21px;
	}

	.publish-option-title-row image {
		width: 9px;
		height: 9px;
		margin-left: 6px;
	}

	.publish-option > text:last-child {
		display: block;
		margin-top: 1px;
		color: #606060;
		font-size: 13px;
		line-height: 18px;
	}

	.publish-option--help .publish-option-title-row text,
	.publish-option--help > text:last-child {
		color: #fff;
	}
</style>
