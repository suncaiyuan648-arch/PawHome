<template>
  <view class="animal-page">
    <PawPetRoster v-if="ready" :variant="view === 'roster' ? 'yard' : 'status'" :yard-id="yardId" :yard-name="yardName" :yard-avatar="yardAvatar" @back="goBack" @pet-click="openPetDetail" @owner-click="openOwner" />
    <PawPageNav v-else title="小院宠物" background="#f5f5f5" fallback-url="/pages/me/index" />
    <view v-if="!ready" class="blocked"><text>{{ message }}</text></view>
  </view>
</template>
<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawPetRoster from '@/components/PawPetRoster.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { openUserProfile } from '@/utils/profileNav.js'

export default {
  name: 'YardAnimalsPage',
  components: { PawPageNav, PawPetRoster },
  data() { return { yardId: '', yardName: '', yardAvatar: '', view: 'roster', ready: false, message: '缺少小院 ID，无法读取小院宠物' } },
  onLoad(options = {}) {
    const yardId = String(options.yardId || '').trim()
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(yardId)) return
    this.yardId = yardId
    const requestedView = String(options.view || options.state || '').trim()
    this.view = ['roster', 'status', 'long-list'].includes(requestedView) ? requestedView : 'roster'
    this.yardName = options.yardName || options.name ? decodeURIComponent(String(options.yardName || options.name)) : ''
    this.yardAvatar = options.yardAvatar ? decodeURIComponent(String(options.yardAvatar)) : ''
    this.ready = true
  },
  methods: {
    goBack() { goBackSmart({ fallbackUrl: '/pages/me/index' }) },
    openPetDetail(pet) {
      const petId = pet && pet.id ? String(pet.id).trim() : ''
      if (!petId) return
      uni.navigateTo({ url: `/packages/animal/pages/detail/index?animalId=${encodeURIComponent(petId)}&yardId=${encodeURIComponent(this.yardId)}&state=35` })
    },
    openOwner(owner) { if (owner && owner.pawId) openUserProfile({ pawId: owner.pawId, nickname: owner.name, avatar: owner.avatar }) }
  }
}
</script>
<style scoped>
.animal-page { width: 100%; height: 100vh; min-height: 0; overflow: hidden; background: #f5f5f5; }
.blocked { display: flex; min-height: 240px; align-items: center; justify-content: center; padding: 24px; color: #888; font-size: 14px; text-align: center; }
</style>
