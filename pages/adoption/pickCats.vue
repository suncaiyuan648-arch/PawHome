<template>
	<view class="pick-page">
		<AdoptPickCatsSheet
			v-model="sheetVisible"
			:yard-name="yardName"
			:return-to-apply="returnToApply"
			figma-mode
			@close="onSheetClose"
			@confirmed="onSheetConfirmed"
		/>
	</view>
</template>

<script>
	import AdoptPickCatsSheet from '@/components/AdoptPickCatsSheet.vue'
	import { goBackSmart } from '@/utils/navBack.js'

	export default {
		components: { AdoptPickCatsSheet },
		data() {
			return {
				sheetVisible: false,
				returnToApply: false,
				yardName: '我就是要喂猫'
			}
		},
		onLoad(options) {
			if (options.from === 'apply') this.returnToApply = true
			if (options.yardName) {
				try {
					this.yardName = decodeURIComponent(options.yardName)
				} catch (e) {
					this.yardName = options.yardName
				}
			}
			this.$nextTick(() => {
				this.sheetVisible = true
			})
		},
		methods: {
			onSheetClose() {
				goBackSmart({ fallbackUrl: '/pages/index/index' })
			},
			onSheetConfirmed() {
				if (this.returnToApply) {
					uni.navigateBack()
				}
			}
		}
	}
</script>

<style scoped>
	.pick-page {
		min-height: 100vh;
		background: transparent;
	}
</style>
