<template>
  <view class="dynamic-link-page">
    <PawPageNav title="动态详情" background="#ffffff" fallback-url="/pages/index/index" />
    <view v-if="status === 'loading'" class="dynamic-link-state">
      <text>正在读取动态</text>
    </view>
    <view v-else-if="status !== 'ready'" class="dynamic-link-state">
      <text class="dynamic-link-state__title">动态暂不可用</text>
      <text class="dynamic-link-state__copy">请从有效的动态消息或任务入口重新进入。</text>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import { readDynamicRecord, type DynamicReadCode } from '@/packages/dynamic/services/reader.ts'
import { normalizeDynamicDetailRoute } from '@/packages/dynamic/services/detailMetadata.ts'

interface DynamicDeepLinkPageState {
  dynamicId: string
  status: DynamicReadCode | 'loading' | 'ready' | 'empty'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function actorProvider(): unknown {
  try { return typeof uni !== 'undefined' && uni && typeof uni.getStorageSync === 'function' ? uni.getStorageSync('PAWHOME_ACTOR_SESSION') : null } catch { return null }
}

export default defineComponent({
  name: 'DynamicDeepLinkPage',
  components: { PawPageNav },
  data(): DynamicDeepLinkPageState { return { dynamicId: '', status: 'loading' } },
  onLoad(options: unknown = {}) {
    this.dynamicId = normalizeDynamicDetailRoute(options).dynamicId
    const session = actorProvider()
    const actor = isRecord(session) && session.actor ? session.actor : session
    const result = readDynamicRecord(this.dynamicId, { actor, requireActor: true, allowPublic: true })
    if (!result.record) {
      this.status = result.code || 'empty'
      return
    }
    this.status = 'ready'
    const query = `dynamicId=${encodeURIComponent(this.dynamicId)}`
    uni.redirectTo({ url: `/packages/dynamic/pages/detail/index?${query}` })
  },
})
</script>

<style scoped>
.dynamic-link-page { min-height: 100vh; box-sizing: border-box; background: #fff; color: #333; }
.dynamic-link-state { display: flex; min-height: 320px; box-sizing: border-box; flex-direction: column; align-items: center; justify-content: center; padding: 32px; text-align: center; }
.dynamic-link-state__title { color: #555; font-size: 16px; line-height: 23px; }
.dynamic-link-state__copy { max-width: 280px; margin-top: 8px; color: #999; font-size: 13px; line-height: 20px; }
</style>
