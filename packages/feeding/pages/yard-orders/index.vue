<template>
  <PawFeedingOrderList variant="yard" :yard-owner-id="yardOwnerId" :yard-id="yardId" @back="goBack" @detail="openDetail"
    @yard-click="openYard" @user-click="openUser" />
</template>

<script>
import PawFeedingOrderList from '../../components/PawFeedingOrderList.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { openUserProfile, openYardDetail } from '@/utils/profileNav.js'
import { buildRoute } from '@/navigation/routeContracts.js'

export default {
  name: 'YardFeedOrders',
  components: { PawFeedingOrderList },
  data() {
    return { yardId: '1', yardOwnerId: 'yard-owner-1' }
  },
  onLoad(query = {}) {
    if (query.yardId) this.yardId = String(query.yardId)
    if (query.yardOwnerId || query.ownerPawId) this.yardOwnerId = String(query.yardOwnerId || query.ownerPawId)
  },
  methods: {
    goBack() { goBackSmart({ fallbackUrl: '/pages/me/index' }) },
    openDetail(item) {
      if (!item || !item.id) return
      uni.navigateTo({ url: buildRoute('feeding.order.detail', { orderId: String(item.id), perspective: 'yard-manager' }) })
    },
    openYard(item) {
      openYardDetail({ yardId: item && item.yardId, yardName: item && item.yardName })
    },
    openUser(item) {
      openUserProfile({
        pawId: item && (item.pawId || item.userPawId),
        nickname: item && item.name,
        avatar: item && (item.yardAvatar || item.avatar)
      })
    }
  }
}
</script>
