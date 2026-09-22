<template>
  <view class="animal-page">
    <PawPetRoster v-if="ready" variant="mine" :user-paw-id="userId" @back="goBack" @pet-click="openPetDetail" @yard-click="openYardDetail" @yard-pets-click="openYardPets" />
    <PawPageNav v-else title="我的云养宠物" background="#f5f5f5" fallback-url="/pages/me/index" />
    <view v-if="!ready" class="blocked"><text>{{ message }}</text></view>
  </view>
</template>
<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawPetRoster from '@/components/PawPetRoster.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { openYardDetail as navigateToYardDetail } from '@/utils/profileNav.js'

export default {
  name: 'SponsoredAnimalsPage',
  components: { PawPageNav, PawPetRoster },
  data() { return { userId: '', ready: false, message: '缺少用户 ID，无法读取云养宠物' } },
  onLoad(options = {}) {
    const id = String(options.userId || '').trim()
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id)) return
    this.userId = id
    this.ready = true
  },
  methods: {
    goBack() { goBackSmart({ fallbackUrl: '/pages/me/index' }) },
    openPetDetail(pet) {
      const petId = pet && pet.id ? String(pet.id).trim() : ''
      const yardId = pet && pet.yardId ? String(pet.yardId).trim() : ''
      if (!petId || !yardId) return
      uni.navigateTo({ url: `/packages/animal/pages/detail/index?animalId=${encodeURIComponent(petId)}&yardId=${encodeURIComponent(yardId)}&state=35` })
    },
    openYardDetail(yard) { if (yard && yard.id) navigateToYardDetail({ yardId: yard.id, yardName: yard.name }) },
    openYardPets(yard) {
      const yardId = yard && yard.id ? String(yard.id).trim() : ''
      if (!yardId) return
      uni.navigateTo({ url: `/packages/yard/pages/animals/index?yardId=${encodeURIComponent(yardId)}&yardName=${encodeURIComponent(yard.name || '')}` })
    }
  }
}
</script>
<style scoped>
.animal-page { width: 100%; height: 100vh; min-height: 0; overflow: hidden; background: #f5f5f5; }
.blocked { display: flex; min-height: 240px; align-items: center; justify-content: center; padding: 24px; color: #888; font-size: 14px; text-align: center; }
</style>
