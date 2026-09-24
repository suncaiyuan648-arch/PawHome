<template>
	<PawFlowResult :failed="!isSuccess" navTitle="认证结果" content-top="91" :title="isSuccess ? '实名认证通过' : '认证失败'"
		:body="isSuccess ? '' : '人脸核验失败，请稍后重试'" :button-text="isSuccess ? '创建小院' : '返回'" action-width="245"
		action-height="48" @back="goBack" @action="onActionTap" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawFlowResult from '@/components/PawFlowResult.vue'

interface VerificationResultPageState { isSuccess: boolean }

function queryRecord(options: unknown): Record<string, unknown> {
	return options !== null && typeof options === 'object' && !Array.isArray(options)
		? options as Record<string, unknown>
		: {}
}

export default defineComponent({
	components: { PawFlowResult },
	data(): VerificationResultPageState {
		return { isSuccess: true }
	},
	onLoad(query: unknown = {}) {
		const params = queryRecord(query)
		this.isSuccess = params.outcome !== 'failure' && params.status !== 'fail'
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		onActionTap() {
			if (this.isSuccess) {
				uni.navigateTo({ url: '/packages/yard/pages/create/index' })
				return
			}
			uni.navigateBack()
		}
	}
})
</script>
