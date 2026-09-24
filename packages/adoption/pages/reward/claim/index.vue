<template>
  <view
    class="order-page"
    :class="{ 'order-page--invalid': invalid }"
  >
    <template v-if="invalid">
      <PawPageNav
        title="领取奖励"
        background="#f5f5f5"
        fallback-url="/packages/adoption/pages/mine/index"
      />
      <view class="order-page__invalid"><text>缺少领养申请 ID，无法领取奖励。</text></view>
    </template>
    <PawRewardOrderSheet
      v-else
      v-model="sheetVisible"
      :record-id="recordId"
      @submitted="onSubmitted"
      @closed="onSheetClosed"
    />
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawRewardOrderSheet from '@/components/adoption/PawRewardOrderSheet.vue'
import PawPageNav from '@/components/PawPageNav.vue'
import { buildRoute } from '@/navigation/routeContracts.ts'
import {
  isRewardOrderSubmittedPayload,
  type RewardOrderSubmittedPayload,
} from '@/utils/rewardOrderMetadata.ts'
import {
  createAdoptionRewardClaimPageState,
  resolveAdoptionPageRecordId,
  type AdoptionRewardClaimPageState,
} from '../../../services/pageInputMetadata.ts'

export default defineComponent({
  components: { PawRewardOrderSheet, PawPageNav },
  data(): AdoptionRewardClaimPageState {
    return createAdoptionRewardClaimPageState()
  },
  onLoad(options: unknown = {}) {
    this.recordId = resolveAdoptionPageRecordId(options, ['applicationId', 'recordId', 'id'])
    this.invalid = !this.recordId
    this.sheetVisible = !this.invalid
  },
  methods: {
    onSubmitted(payload: RewardOrderSubmittedPayload) {
      this.submittedPayload = isRewardOrderSubmittedPayload(payload) ? payload : null
    },
    onSheetClosed() {
      if (this.submittedPayload && this.submittedPayload.order) {
        const submitted = this.submittedPayload
        const applicationId = String(submitted.recordId || this.recordId || '').trim()
        const orderId = String(submitted.order.id || '').trim()
        this.submittedPayload = null
        try {
          uni.redirectTo({
            url: buildRoute('adoption.result', {
              applicationId,
              outcome: 'reward-claimed',
              orderId,
            }),
          })
        } catch {
          uni.showToast({ title: '奖励结果暂不可用', icon: 'none' })
        }
        return
      }
      uni.navigateBack()
    },
  },
})
</script>

<style scoped>
.order-page {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
}
.order-page__invalid {
  display: flex;
  min-height: 240px;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #888;
  font-size: 14px;
  text-align: center;
}
</style>
