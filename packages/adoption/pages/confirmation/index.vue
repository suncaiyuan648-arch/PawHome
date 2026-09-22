<template>
  <view v-if="invalid" class="confirmation-invalid">
    <PawPageNav title="确认领养" background="#f5f5f5" fallback-url="/packages/adoption/pages/mine/index" />
    <view class="confirmation-invalid__body"><text>缺少领养申请 ID，无法提交确认材料。</text></view>
  </view>
  <PawAdoptionEvidence v-else mode="confirm" :record-id="recordId" @submitted="onSubmitted" />
</template>
<script>
import PawAdoptionEvidence from '../../components/PawAdoptionEvidence.vue'
import PawPageNav from '@/components/PawPageNav.vue'
import { buildRoute } from '@/navigation/routeContracts.js'
export default {
  components: { PawAdoptionEvidence, PawPageNav },
  data() { return { recordId: '', invalid: false } },
  onLoad(options = {}) {
    this.recordId = String(options.applicationId || options.id || options.recordId || '').trim()
    this.invalid = !this.recordId
  },
  methods: {
    onSubmitted() {
      if (!this.recordId) return
      try { uni.redirectTo({ url: buildRoute('adoption.result', { applicationId: this.recordId, outcome: 'confirmation-submitted' }) }) } catch (error) { uni.showToast({ title: '结果页暂不可用', icon: 'none' }) }
    }
  }
}
</script>
<style scoped>
.confirmation-invalid { min-height: 100vh; background: #f5f5f5; }
.confirmation-invalid__body { display: flex; min-height: 240px; align-items: center; justify-content: center; padding: 24px; color: #888; font-size: 14px; text-align: center; }
</style>
