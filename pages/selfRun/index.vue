<template>
	<view class="self-run-page">
		<text class="self-run-placeholder">自营</text>
		<CustomTabber :tab-index="1" />
	</view>
</template>

<script>
import CustomTabber from '@/components/CustomTabber/index.vue'

export default {
	components: { CustomTabber },
	onShow() {
		// #ifdef MP-WEIXIN
		this.$nextTick(() => {
			const cur = getCurrentPages().slice(-1)[0]
			if (cur && typeof cur.getTabBar === 'function') {
				const tb = cur.getTabBar()
				if (tb && typeof tb.setData === 'function') tb.setData({ selected: 1 })
			}
		})
		// #endif
	}
}
</script>

<style scoped>
.self-run-page {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: #f8f8f8;
	box-sizing: border-box;
	padding-bottom: calc(120px + constant(safe-area-inset-bottom));
	padding-bottom: calc(120px + env(safe-area-inset-bottom));
}

.self-run-placeholder {
	font-size: 32rpx;
	color: #8c8c8c;
}
</style>
