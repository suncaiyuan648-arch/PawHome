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

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import { readDynamicRecord } from '@/packages/dynamic/services/reader.js'

function actorProvider() {
  try { return typeof uni !== 'undefined' && uni && typeof uni.getStorageSync === 'function' ? uni.getStorageSync('PAWHOME_ACTOR_SESSION') : null } catch (error) { return null }
}

export default {
  name: 'DynamicDeepLinkPage',
  components: { PawPageNav },
  data() { return { dynamicId: '', status: 'loading' } },
  onLoad(options = {}) {
    this.dynamicId = typeof options.dynamicId === 'string' ? options.dynamicId : ''
    const channel = typeof this.getOpenerEventChannel === 'function' ? this.getOpenerEventChannel() : null
    if (channel && typeof channel.on === 'function') channel.on('pawhome.message.deep-link', () => {})
    const session = actorProvider()
    const actor = session && session.actor ? session.actor : session
    const result = readDynamicRecord(this.dynamicId, { actor, requireActor: true, allowPublic: true })
    if (!result.record) {
      this.status = result.code || 'empty'
      return
    }
    this.status = 'ready'
    const query = `dynamicId=${encodeURIComponent(this.dynamicId)}`
    uni.redirectTo({ url: `/packages/dynamic/pages/detail/index?${query}` })
  },
}
</script>

<style scoped>
.dynamic-link-page { min-height: 100vh; box-sizing: border-box; background: #fff; color: #333; }
.dynamic-link-state { display: flex; min-height: 320px; box-sizing: border-box; flex-direction: column; align-items: center; justify-content: center; padding: 32px; text-align: center; }
.dynamic-link-state__title { color: #555; font-size: 16px; line-height: 23px; }
.dynamic-link-state__copy { max-width: 280px; margin-top: 8px; color: #999; font-size: 13px; line-height: 20px; }
</style>
