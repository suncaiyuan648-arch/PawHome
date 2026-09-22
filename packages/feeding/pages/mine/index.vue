<template>
  <PawFeedingOrderList variant="mine" :user-paw-id="userPawId" :empty-state="emptyState" @back="goBack"
    @detail="openDetail" @yard-click="openYard" @user-click="openUser" />
</template>

<script>
import PawFeedingOrderList from '../../components/PawFeedingOrderList.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { openUserProfile, openYardDetail, SELF_PAW_ID } from '@/utils/profileNav.js'
import { buildRoute } from '@/navigation/routeContracts.js'

export default {
  name: 'MyFeedings',
  components: { PawFeedingOrderList },
  data() {
    return { userPawId: SELF_PAW_ID, emptyState: false }
  },
  onLoad(query = {}) {
    if (query.userPawId || query.pawId) this.userPawId = String(query.userPawId || query.pawId)
    this.emptyState = String(query.state || '') === '30'
  },
  methods: {
    goBack() { goBackSmart({ fallbackUrl: '/pages/me/index' }) },
    openDetail(item) {
      if (!item || !item.id) return
      uni.navigateTo({ url: buildRoute('feeding.order.detail', { orderId: String(item.id), perspective: 'donor' }) })
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
