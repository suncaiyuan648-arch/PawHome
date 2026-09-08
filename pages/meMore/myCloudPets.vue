<template>
  <view class="cloud-pets-page" data-qa="qa-my-cloud-pets-page">
    <PawPetRoster variant="mine" :user-paw-id="userPawId" @back="goBack" @pet-click="openPetDetail"
      @yard-click="openYardDetail" @yard-pets-click="openYardPets" />
  </view>
</template>

<script>
import PawPetRoster from '@/components/PawPetRoster.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { SELF_PAW_ID, openYardDetail as navigateToYardDetail } from '@/utils/profileNav.js'

export default {
  name: 'MyCloudPets',
  components: { PawPetRoster },
  data() {
    return {
      userPawId: SELF_PAW_ID
    }
  },
  onLoad(options = {}) {
    const userPawId = options.userPawId || options.pawId
    if (userPawId) this.userPawId = String(userPawId)
  },
  methods: {
    goBack() {
      goBackSmart({ fallbackUrl: '/pages/me/index' })
    },
    openPetDetail(pet) {
      const petId = pet && pet.id ? String(pet.id) : ''
      if (!petId) return
      uni.navigateTo({
        url: '/pages/adoption/petDetail?state=35&managed=0&petId=' + encodeURIComponent(petId) +
          '&yardId=' + encodeURIComponent(pet.yardId || '1')
      })
    },
    openYardDetail(yard) {
      navigateToYardDetail({ yardId: yard && yard.id, yardName: yard && yard.name })
    },
    openYardPets(yard) {
      if (!yard || !yard.id) return
      uni.navigateTo({
        url: '/pages/yard/yardCats?state=roster&name=' + encodeURIComponent(yard.name || '') +
          '&yardId=' + encodeURIComponent(yard.id)
      })
    }
  }
}
</script>

<style scoped>
.cloud-pets-page {
  display: flex;
  width: 100%;
  height: 100vh;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  background: #f5f5f5;
  box-sizing: border-box;
}
</style>
