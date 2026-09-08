<template>
  <PawFeedingOrderList variant="yard" :yard-owner-id="yardOwnerId" :yard-id="yardId" @back="goBack" @detail="openDetail"
    @yard-click="openYard" @user-click="openUser" />
</template>

<script>
import PawFeedingOrderList from '@/components/feeding/PawFeedingOrderList.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { openUserProfile, openYardDetail } from '@/utils/profileNav.js'

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
      const query = [
        'type=yard-owner',
        'yardOwnerId=' + encodeURIComponent(this.yardOwnerId),
        'yardId=' + encodeURIComponent(this.yardId),
        'orderId=' + encodeURIComponent(item.id),
        'id=' + encodeURIComponent(item.id)
      ].join('&')
      uni.navigateTo({ url: '/pages/meMore/feedingDetail?' + query })
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
