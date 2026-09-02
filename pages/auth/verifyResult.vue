<template>
	<PawFlowResult :failed="!isSuccess" nav-title="认证结果" content-top="91" :title="isSuccess ? '实名认证通过' : '认证失败'"
		:body="isSuccess ? '' : '人脸核验失败，请稍后重试'" :button-text="isSuccess ? '创建小院' : '返回'" action-width="245"
		action-height="48" @back="goBack" @action="onActionTap" />
</template>

<script>
import PawFlowResult from '@/components/PawFlowResult.vue'

export default {
	components: { PawFlowResult },
	data() {
		return { isSuccess: true }
	},
	onLoad(query) {
		this.isSuccess = !(query && query.status === 'fail')
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		onActionTap() {
			if (this.isSuccess) {
				uni.navigateTo({ url: '/pages/yard/createCatYard' })
				return
			}
			uni.navigateBack()
		}
	}
}
</script>
