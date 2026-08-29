<template>
	<view class="order-page">
		<PawBottomSheet
			:model-value="sheetVisible"
			class="order-drawer"
			variant="selection-order"
			height="70vh"
			:close-on-mask="true"
			:safe-area="true"
			@update:model-value="onSheetVisibleChange"
			@after-close="goBack"
		>
			<view class="order-sheet-body">
				<view class="sheet-head">
					<text class="title">选择订单</text>
					<view class="close" @tap.stop="closeSheet"><text>×</text></view>
				</view>
				<scroll-view class="sheet-scroll" scroll-y :show-scrollbar="false" :bounces="false" :enable-flex="true">
					<view v-for="i in 2" :key="i" class="order-card">
						<uni-icons :type="i === 1 ? 'checkbox-filled' : 'circle'" :color="i === 1 ? '#ffe000' : '#ddd'" :size="20" />
						<image src="/static/figma/feeding/1472957ded35cdc32a413c0d8aeffd67d583a54a.png" mode="aspectFill" />
						<view class="copy">
							<view class="order-name-line"><text>平安是福</text><LevelCapsule /></view>
							<text>投粮4斤</text>
							<text>2026-2-5 13:23:56</text>
						</view>
						<view class="right"><text>3天23:34:45后超时</text><text>已反馈2/5次</text></view>
					</view>
				</scroll-view>
			</view>
		</PawBottomSheet>
	</view>
</template>

<script>
import { goBackSmart } from '@/utils/navBack.js'
import LevelCapsule from '@/components/LevelCapsule.vue'
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'

export default {
	name: 'PostFeedOrder',
	components: { LevelCapsule, PawBottomSheet },
	data() {
		return { sheetVisible: true }
	},
	methods: {
		closeSheet() {
			this.sheetVisible = false
		},
		onSheetVisibleChange(value) {
			this.sheetVisible = value
		},
		goBack() {
			goBackSmart({ fallbackUrl: '/pages/publishDynamic/postFeed' })
		}
	}
}
</script>

<style scoped>
.order-page {
	min-height: 100vh;
	background: #f5f5f5;
}

:deep(.paw-bottom-sheet--selection-order) {
	background: #f1f1f1;
	border-radius: 13px 13px 0 0;
}

:deep(.paw-bottom-sheet__body) {
	height: 100%;
	min-height: 0;
	display: flex;
	flex-direction: column;
}

.order-sheet-body {
	height: 100%;
	min-height: 0;
	display: flex;
	flex-direction: column;
}

.sheet-head {
	position: relative;
	display: flex;
	align-items: flex-start;
	justify-content: center;
	height: 66px;
	flex: 0 0 66px;
	padding-top: 26px;
	box-sizing: border-box;
}

.title {
	display: block;
	font-size: 16px;
	font-weight: 700;
	line-height: 22px;
	color: #111;
}

.close {
	position: absolute;
	top: 13px;
	right: 13px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
}

.close text {
	font-size: 24px;
	font-weight: 400;
	line-height: 1;
	color: #222;
}

.sheet-scroll {
	flex: 1;
	min-height: 0;
	padding: 0 15px;
	box-sizing: border-box;
}

.order-card {
	height: 98px;
	margin-bottom: 9px;
	padding: 0 10px 0 16px;
	border-top: 1px solid #e4e4e4;
	border-radius: 15px;
	background: #fff;
	display: flex;
	align-items: center;
	box-sizing: border-box;
	column-gap: 8px;
}

.order-card image {
	width: 37px;
	height: 37px;
	border-radius: 50%;
	margin-left: 8px;
	flex: 0 0 37px;
}

.copy {
	min-width: 0;
	margin-left: 0;
	display: flex;
	flex-direction: column;
}

.order-name-line {
	display: flex;
	align-items: center;
	gap: 3px;
	height: 18px;
}

.copy text {
	font-size: 13px;
	line-height: 18px;
	white-space: nowrap;
}

.copy text:last-child {
	font-size: 11px;
	color: #999;
}

.right {
	margin-left: auto;
	align-self: flex-start;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 20px;
	padding-top: 17px;
}

.right text:first-child {
	font-size: 11px;
	line-height: 16px;
	color: #ff384d;
	white-space: nowrap;
}

.right text:last-child {
	font-size: 10px;
	line-height: 15px;
	color: #53617a;
	background: #f0f3f8;
	padding: 2px 5px;
	white-space: nowrap;
}
</style>
