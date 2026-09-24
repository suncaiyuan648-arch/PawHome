<template>
  <PawFeedingOrderList variant="yard" :yard-owner-id="yardOwnerId" :yard-id="yardId" @back="goBack" @detail="openDetail"
    @yard-click="openYard" @user-click="openUser" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawFeedingOrderList from '../../components/PawFeedingOrderList.vue'
import { goBackSmart } from '@/utils/navBack.ts'
import { openUserProfile, openYardDetail } from '@/utils/profileNav.ts'
import { buildRoute } from '@/navigation/routeContracts.ts'
import {
  createYardFeedingOrdersPageState,
  readFeedingRouteText,
  type FeedingOrderListItem,
  type YardFeedingOrdersPageState
} from '../../services/orderListMetadata.ts'

export default defineComponent({
  name: 'YardFeedOrders',
  components: { PawFeedingOrderList },
  data(): YardFeedingOrdersPageState { return createYardFeedingOrdersPageState() },
  onLoad(query: unknown = {}) {
    this.yardId = readFeedingRouteText(query, 'yardId') || this.yardId
    this.yardOwnerId = readFeedingRouteText(query, 'yardOwnerId') || readFeedingRouteText(query, 'ownerPawId') || this.yardOwnerId
  },
  methods: {
    goBack() { goBackSmart({ fallbackUrl: '/pages/me/index' }) },
    openDetail(item: FeedingOrderListItem) {
      if (!item.id) return
      uni.navigateTo({ url: buildRoute('feeding.order.detail', { orderId: item.id, perspective: 'yard-manager' }) })
    },
    openYard(item: FeedingOrderListItem) {
      openYardDetail({ yardId: item.yardId, yardName: item.yardName })
    },
    openUser(item: FeedingOrderListItem) {
      openUserProfile({
        pawId: item.pawId || item.userPawId,
        nickname: item.name,
        avatar: item.yardAvatar || item.avatar
      })
    }
  }
})
</script>
