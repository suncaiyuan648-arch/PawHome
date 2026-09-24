<template>
  <PawFeedingOrderList variant="mine" :user-paw-id="userPawId" :empty-state="emptyState" @back="goBack"
    @detail="openDetail" @yard-click="openYard" @user-click="openUser" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawFeedingOrderList from '../../components/PawFeedingOrderList.vue'
import { goBackSmart } from '@/utils/navBack.ts'
import { openUserProfile, openYardDetail, SELF_PAW_ID } from '@/utils/profileNav.ts'
import { buildRoute } from '@/navigation/routeContracts.ts'
import {
  createMyFeedingPageState,
  readFeedingRouteText,
  type FeedingOrderListItem,
  type MyFeedingPageState
} from '../../services/orderListMetadata.ts'

export default defineComponent({
  name: 'MyFeedings',
  components: { PawFeedingOrderList },
  data(): MyFeedingPageState { return createMyFeedingPageState(SELF_PAW_ID) },
  onLoad(query: unknown = {}) {
    const userPawId = readFeedingRouteText(query, 'userPawId') || readFeedingRouteText(query, 'pawId')
    if (userPawId) this.userPawId = userPawId
    this.emptyState = readFeedingRouteText(query, 'state') === '30'
  },
  methods: {
    goBack() { goBackSmart({ fallbackUrl: '/pages/me/index' }) },
    openDetail(item: FeedingOrderListItem) {
      if (!item.id) return
      uni.navigateTo({ url: buildRoute('feeding.order.detail', { orderId: item.id, perspective: 'donor' }) })
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
