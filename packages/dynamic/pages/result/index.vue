<template>
  <PawFlowResult :title="resultTitle" :body="successBody" button-text="查看动态" @back="goBack" @action="viewFeed" />
</template>

<script>
import { goBackSmart } from '@/utils/navBack.js'
import PawFlowResult from '@/components/PawFlowResult.vue'

const SUCCESS_BODY = '动态已发布，感谢你分享喂猫过程。'

export default {
  name: 'DynamicPublishResultPage',
  components: { PawFlowResult },
  data() {
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
    }
  },
  onLoad(options = {}) {
    this.publishedDynamicId = String(options.dynamicId || '').trim()
    this.resultOutcome = options.outcome === 'feedback-published' ? 'feedback-published' : 'published'
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
        url: `/packages/dynamic/pages/deep-link/index?dynamicId=${encodeURIComponent(this.publishedDynamicId)}`
      })
    }
  }
}
</script>
