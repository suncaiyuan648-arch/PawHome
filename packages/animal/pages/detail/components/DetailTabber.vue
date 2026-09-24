<template>
  <view class="detail-tabber">
    <PawFixedActionBar
      :actions="footerActions"
      :primary-action="primaryAction"
      @action="onFooterAction"
      @primary="openFeed"
    />
    <YardFeedPopup
      v-model:visible="feedPopupVisible"
      :pet-id="petId"
      :payment-params="paymentParams"
      @pay="onFeedPay"
      @payment-success="$emit('feed-success', $event)"
      @learn-food="$emit('learn-food')"
      @agreement="$emit('agreement', $event)"
      @feed-order="$emit('feed-order')"
    />
    <ShareActionSheet
      v-model:visible="shareSheetVisible"
      @select="onShareSheetSelect"
    />
  </view>
</template>

<script lang="ts">
import { eventContract } from '@/utils/componentEvents.ts'

import { defineComponent, type PropType } from 'vue'

import ShareActionSheet from '@/components/ShareActionSheet.vue'
import YardFeedPopup from '@/components/YardFeedPopup.vue'
import PawFixedActionBar from '@/components/layout/PawFixedActionBar.vue'
import type {
  YardFeedPaymentParams,
  YardFeedPaymentPayload,
} from '@/components/yard/yardFeedPopupMetadata.ts'

interface DetailTabberState {
  shareSheetVisible: boolean
  feedPopupVisible: boolean
}

export default defineComponent({
  name: 'DetailTabber',
  components: { ShareActionSheet, YardFeedPopup, PawFixedActionBar },
  props: {
    joined: { type: Boolean, default: false },
    shareUrl: { type: String, default: '' },
    petId: { type: String, default: '' },
    paymentParams: { type: Object as PropType<YardFeedPaymentParams | null>, default: null },
  },
  emits: {
    adopt: eventContract<[]>(),
    join: eventContract<[]>(),
    leave: eventContract<[]>(),
    'share-action': eventContract<[key: string]>(),
    'feed-pay': eventContract<[payload: YardFeedPaymentPayload]>(),
    'feed-success': eventContract<[payload: YardFeedPaymentPayload]>(),
    'learn-food': eventContract<[]>(),
    agreement:
      eventContract<
        [agreement: import('@/components/yard/yardFeedPopupMetadata.ts').YardFeedAgreement]
      >(),
    'feed-order': eventContract<[]>(),
  },
  data(): DetailTabberState {
    return { shareSheetVisible: false, feedPopupVisible: false }
  },
  computed: {
    footerActions() {
      return [
        { key: 'share', label: '分享', image: '/static/fenxiang.png' },
        {
          key: 'join',
          label: this.joined ? '已入驻' : '入驻',
          image: this.joined ? '/static/yard-joined-checked.png' : '/static/ruzhu.png',
        },
        { key: 'adopt', label: '领养', image: '/static/lingyang.png', qa: 'qa-pet-detail-adopt' },
      ]
    },
    primaryAction() {
      return { key: 'feed', label: '立即投喂', tone: 'brand', size: 'md' }
    },
  },
  methods: {
    onFooterAction(action: import('@/components/layout/PawFixedActionBar.vue').PawFixedAction) {
      if (action.key === 'share') this.shareSheetVisible = true
      if (action.key === 'join') this.joined ? this.$emit('leave') : this.$emit('join')
      if (action.key === 'adopt') this.$emit('adopt')
    },
    openFeed() {
      this.feedPopupVisible = true
    },
    onShareSheetSelect(key: string) {
      this.$emit('share-action', key)
    },
    onFeedPay(payload: YardFeedPaymentPayload) {
      this.$emit('feed-pay', payload)
    },
  },
})
</script>

<style scoped>
.detail-tabber {
  position: relative;
}
</style>
