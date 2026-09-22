<template>
  <PawFlowResult title="反馈发布成功" :body="body" button-text="查看动态" @back="goBack" @action="viewFeed" />
</template>

<script>
import { goBackSmart } from '@/utils/navBack.js'
import PawFlowResult from '@/components/PawFlowResult.vue'

export default {
  name: 'FeedingPublishResultPage',
  components: { PawFlowResult },
  data() {
    return { dynamicId: '', body: '' }
  },
  onLoad(options = {}) {
    this.dynamicId = String(options.dynamicId || '').trim()
    this.body = '动态已发布，感谢你为小院留下真实反馈。'
  },
  methods: {
    goBack() {
      goBackSmart({ delta: 2, fallbackUrl: '/pages/index/index' })
    },
    viewFeed() {
      if (!this.dynamicId) {
        uni.showToast({ title: '动态结果暂不可用', icon: 'none' })
        return
      }
      uni.navigateTo({
        url: `/packages/dynamic/pages/deep-link/index?dynamicId=${encodeURIComponent(this.dynamicId)}`
      })
    }
  }
}
</script>
