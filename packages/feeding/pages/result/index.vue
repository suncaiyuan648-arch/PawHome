<template>
  <PawFlowResult
    title="反馈发布成功"
    :body="body"
    button-text="查看动态"
    @back="goBack"
    @action="viewFeed"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { goBackSmart } from '@/utils/navBack.ts'
import PawFlowResult from '@/components/PawFlowResult.vue'
import {
  createFeedingPublishResultPageState,
  readFeedingRouteText,
  type FeedingPublishResultPageState,
} from '../../services/orderListMetadata.ts'

export default defineComponent({
  name: 'FeedingPublishResultPage',
  components: { PawFlowResult },
  data(): FeedingPublishResultPageState {
    return createFeedingPublishResultPageState()
  },
  onLoad(options: unknown = {}) {
    this.dynamicId = readFeedingRouteText(options, 'dynamicId').trim()
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
        url: `/packages/dynamic/pages/deep-link/index?dynamicId=${encodeURIComponent(this.dynamicId)}`,
      })
    },
  },
})
</script>
