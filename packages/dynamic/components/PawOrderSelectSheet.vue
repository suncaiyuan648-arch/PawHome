<template>
	<PawBottomSheet :model-value="visibleProxy" variant="selection-order" :height="height" :close-on-mask="true"
		:safe-area="true" @update:model-value="onSheetValueChange" @after-close="$emit('after-close')">
		<view class="order-sheet">
			<view class="sheet-head">
				<text class="sheet-title">选择订单</text>
				<view class="sheet-close" @tap.stop="close">
					<image class="sheet-close-icon" src="/static/figma/publish/order-close.svg" mode="aspectFit">
					</image>
				</view>
			</view>

			<scroll-view class="sheet-scroll" scroll-y :show-scrollbar="false" :bounces="false" :enable-flex="true">
				<view class="order-list">
					<view v-for="order in orders" :key="order.id" class="order-card"
						:class="{ 'order-card--selected': isSelected(order.id) }" :data-order-id="order.id"
						@tap.stop="toggleOrder(order)">
						<view class="order-check" aria-hidden="true">
							<image class="order-check-icon" :src="isSelected(order.id) ? selectedIcon : unselectedIcon"
								mode="aspectFit"></image>
						</view>

						<view class="order-avatar-region">
							<image class="order-avatar" :src="order.avatar || fallbackAvatar" mode="aspectFill"></image>
						</view>

						<view class="order-content">
							<view class="order-top">
								<view class="order-identity" @tap.stop="emitOrderUser(order)">
									<text class="order-name">{{ order.userName }}</text>
									<LevelBadge :level="order.level" />
								</view>
								<text v-if="order.timedOut" class="order-timeout">已超时</text>
								<text v-else class="order-countdown">{{ order.countdown }}</text>
							</view>
							<text class="order-amount">投粮{{ order.kg }}斤</text>
							<view class="order-bottom">
								<text class="order-time">{{ order.time }}</text>
								<PawFeedingFeedbackTag :text="order.feedbackTag" tone="progress" />
							</view>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>
	</PawBottomSheet>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'

import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import PawFeedingFeedbackTag from '@/components/feeding/PawFeedingFeedbackTag.vue'
import LevelBadge from '@/components/customBadge/LevelBadge.vue'
import type { PublishEditorOrder } from '../services/publishEditorMetadata.ts'

const FIGMA_ORDER_AVATAR = '/static/figma/publish/order-avatar.png'

interface PawOrderSelectSheetState {
	selectedIcon: string
	unselectedIcon: string
	fallbackAvatar: string
}

export default defineComponent({
	name: 'PawOrderSelectSheet',
	components: { PawBottomSheet, PawFeedingFeedbackTag, LevelBadge },
	props: {
		modelValue: { type: Boolean, default: false },
		orders: { type: Array as PropType<PublishEditorOrder[]>, default: () => [] },
		selectedIds: { type: Array as PropType<string[]>, default: () => [] },
		height: { type: [String, Number], default: '70vh' }
	},
	emits: {
		'update:modelValue': (value: boolean) => typeof value === 'boolean',
		'update:selectedIds': (ids: string[]) => Array.isArray(ids) && ids.every(id => typeof id === 'string'),
		'order-user-click': (order: PublishEditorOrder) => Boolean(order && typeof order.id === 'string'),
		'after-close': () => true,
	},
	data(): PawOrderSelectSheetState {
		return {
			selectedIcon: '/static/figma/publish/order-selected.svg',
			unselectedIcon: '/static/figma/publish/order-unselected.svg',
			fallbackAvatar: FIGMA_ORDER_AVATAR
		}
	},
	computed: {
		visibleProxy: {
			get() {
				return this.modelValue
			},
			set(value: boolean) {
				this.$emit('update:modelValue', value)
			}
		}
	},
	methods: {
		isSelected(id: string): boolean {
			return this.selectedIds.some(selectedId => selectedId === id)
		},
		toggleOrder(order: PublishEditorOrder) {
			const id = order.id
			const current = this.selectedIds.slice()
			const next = this.isSelected(order.id)
				? current.filter(selectedId => selectedId !== id)
				: current.concat(id)
			this.$emit('update:selectedIds', next)
		},
		emitOrderUser(order: PublishEditorOrder) {
			this.$emit('order-user-click', order)
		},
		close() {
			this.visibleProxy = false
		},
		onSheetValueChange(value: boolean) {
			this.visibleProxy = value
		}
	}
})
</script>

<style scoped>
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

.order-sheet {
	height: 100%;
	min-height: 0;
	display: flex;
	flex-direction: column;
}

.sheet-head {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 66px;
	flex: 0 0 66px;
	padding-top: 4px;
	box-sizing: border-box;
}

.sheet-title {
	font-size: 16px;
	font-weight: 700;
	line-height: 22px;
	color: #111;
}

.sheet-close {
	position: absolute;
	top: 13px;
	right: 13px;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.sheet-close-icon {
	width: 13px;
	height: 13px;
}

.sheet-scroll {
	flex: 1;
	min-height: 0;
	padding: 0 15px;
	box-sizing: border-box;
}

.order-list {
	display: flex;
	flex-direction: column;
	gap: 9px;
	padding-bottom: 12px;
}

.order-card {
	width: 100%;
	height: 98px;
	flex: 0 0 98px;
	padding: 0 10px 0 17px;
	border-top: 1px solid #e4e4e4;
	border-radius: 15px;
	background: #fff;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	gap: 8px;
}

.order-check {
	width: 18px;
	height: 18px;
	flex: 0 0 18px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 7px;
}

.order-check-icon {
	width: 18px;
	height: 18px;
}

.order-avatar-region {
	width: 37px;
	height: 37px;
	flex: 0 0 37px;
	display: flex;
	align-items: center;
	justify-content: flex-start;
}

.order-avatar {
	width: 37px;
	height: 37px;
	border-radius: 50%;
}

.order-content {
	min-width: 0;
	flex: 1 1 auto;
	height: 76px;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	justify-content: center;
}

.order-top,
.order-bottom {
	width: 100%;
	min-width: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
}

.order-identity {
	min-width: 0;
	display: flex;
	align-items: center;
	gap: 3px;
}

.order-name {
	min-width: 0;
	font-size: 15px;
	font-weight: 400;
	line-height: 20px;
	color: #222;
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
}

.order-timeout,
.order-countdown {
	flex: 0 0 auto;
	font-size: 14px;
	line-height: 18px;
	color: #ff3d3d;
	white-space: nowrap;
}

.order-amount {
	align-self: flex-start;
	margin-top: 4px;
	font-size: 14px;
	font-weight: 500;
	line-height: 18px;
	color: #333;
}

.order-time {
	min-width: 0;
	font-size: 12px;
	line-height: 16px;
	color: #999;
	white-space: nowrap;
}
</style>
