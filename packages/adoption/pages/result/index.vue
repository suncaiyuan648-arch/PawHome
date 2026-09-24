<template>
  <PawFlowResult v-bind="config" @back="goBack" @action="onAction" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawFlowResult from '@/components/PawFlowResult.vue'
import { goBackSmart } from '@/utils/navBack.ts'
import { buildRoute } from '@/navigation/routeContracts.ts'
import {
  createAdoptionResultPageState,
  getAdoptionResultConfig,
  normalizeAdoptionResultRouteOptions,
  type AdoptionResultPageState,
} from '@/packages/adoption/services/resultMetadata.ts'

export default defineComponent({
  components: { PawFlowResult },
  data(): AdoptionResultPageState {
    return createAdoptionResultPageState()
  },
  computed: {
    config() {
      return getAdoptionResultConfig(this.variant)
    }
  },
  onLoad(options: unknown = {}) {
    const state = normalizeAdoptionResultRouteOptions(options)
    this.variant = state.variant
    this.outcome = state.outcome
    this.recordId = state.recordId
    this.orderId = state.orderId
    this.nextMode = state.nextMode
    this.reviewerRole = state.reviewerRole
    this.reviewerId = state.reviewerId
  },
  methods: {
    goBack() {
      goBackSmart({ fallbackUrl: buildRoute('adoption.mine', {}), fallbackLaunch: 'redirectTo' })
    },
    recordQuery(separator: string = '?') {
      return this.recordId ? `${separator}id=${encodeURIComponent(this.recordId)}` : ''
    },
    orderDetailQuery() {
      const params = []
      if (this.recordId) params.push(`id=${encodeURIComponent(this.recordId)}`)
      if (this.orderId) params.push(`orderId=${encodeURIComponent(this.orderId)}`)
      return params.length ? `?${params.join('&')}` : ''
    },
    onAction() {
      if (['review-approved', 'adoption-confirmed-by-owner', 'review-rejected'].includes(this.outcome) && this.nextMode) {
        try {
          const url = buildRoute('adoption.review.detail', {
            applicationId: this.recordId,
            mode: this.nextMode,
            ...(this.reviewerRole ? { reviewerRole: this.reviewerRole } : {}),
            ...(this.reviewerId ? { reviewerId: this.reviewerId } : {})
          })
          uni.redirectTo({ url, fail: () => this.goBack() })
        } catch { this.goBack() }
        return
      }
      if (this.outcome === 'reward-claimed' && this.orderId) {
        try {
          uni.navigateTo({ url: buildRoute('feeding.order.detail', { orderId: this.orderId, perspective: 'donor' }) })
        } catch { this.goBack() }
        return
      }
      if (this.recordId) {
        try {
          uni.redirectTo({ url: buildRoute('adoption.progress', { applicationId: this.recordId }) })
        } catch { this.goBack() }
        return
      }
      this.goBack()
    }
  }
})
</script>
