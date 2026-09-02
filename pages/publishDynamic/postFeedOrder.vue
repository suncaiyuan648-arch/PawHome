<template>
	<view class="order-page">
		<PawOrderSelectSheet :model-value="sheetVisible" :orders="orders" :selected-ids="selectedOrderIds"
			@update:model-value="onSheetVisibleChange" @update:selected-ids="selectedOrderIds = $event"
			@after-close="goBack" />
	</view>
</template>

<script>
import { goBackSmart } from '@/utils/navBack.js'
import { getPawHomeYardMock } from '@/utils/yardMock.js'
import PawOrderSelectSheet from '@/components/PawOrderSelectSheet.vue'

export default {
	name: 'PostFeedOrder',
	components: { PawOrderSelectSheet },
	data() {
		const yard = getPawHomeYardMock()
		return {
			sheetVisible: true,
			selectedOrderIds: [yard.feedingOrders[0].id],
			orders: yard.feedingOrders.map(order => ({ ...order, avatar: order.userAvatar }))
		}
	},
	methods: {
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
</style>
