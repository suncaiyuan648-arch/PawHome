<template>
  <PawFlowResult
    :title="resultTitle"
    :body="successBody"
    button-text="查看动态"
    @back="goBack"
    @action="viewFeed"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { goBackSmart } from '@/utils/navBack.ts'
import PawFlowResult from '@/components/PawFlowResult.vue'

type DynamicResultOutcome = 'published' | 'feedback-published'
interface DynamicPublishResultPageState {
  publishedDynamicId: string
  resultOutcome: DynamicResultOutcome
}

function queryRecord(options: unknown): Record<string, unknown> {
  return options !== null && typeof options === 'object' && !Array.isArray(options)
    ? (options as Record<string, unknown>)
    : {}
}

const SUCCESS_BODY = '动态已发布，感谢你分享喂猫过程。'

export default defineComponent({
  name: 'DynamicPublishResultPage',
  components: { PawFlowResult },
  data(): DynamicPublishResultPageState {
    return { publishedDynamicId: '', resultOutcome: 'published' }
  },
  computed: {
    resultTitle() {
      return this.resultOutcome === 'feedback-published' ? '反馈发布成功' : '发布成功'
    },
    successBody() {
      return this.resultOutcome === 'feedback-published'
        ? '动态已发布，感谢你为小院留下真实反馈。'
        : SUCCESS_BODY
    },
  },
  onLoad(options: unknown = {}) {
    const route = queryRecord(options)
    this.publishedDynamicId = typeof route.dynamicId === 'string' ? route.dynamicId.trim() : ''
    this.resultOutcome = route.outcome === 'feedback-published' ? 'feedback-published' : 'published'
  },
  methods: {
    goBack() {
      goBackSmart({ delta: 2, fallbackUrl: '/pages/index/index' })
    },
    viewFeed() {
      if (!this.publishedDynamicId) {
        uni.showToast({ title: '动态结果暂不可用', icon: 'none' })
        return
      }
      uni.navigateTo({
        url: `/packages/dynamic/pages/deep-link/index?dynamicId=${encodeURIComponent(this.publishedDynamicId)}`,
      })
    },
  },
})
</script>
