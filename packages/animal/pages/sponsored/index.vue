<template>
  <view class="animal-page">
    <PawPetRoster
      v-if="ready"
      variant="mine"
      :user-paw-id="userId"
      @back="goBack"
      @pet-click="openPetDetail"
      @yard-click="openYardDetail"
      @yard-pets-click="openYardPets"
    />
    <PawPageNav
      v-else
      title="我的云养宠物"
      background="#f5f5f5"
      fallback-url="/pages/me/index"
    />
    <view
      v-if="!ready"
      class="blocked"
      ><text>{{ message }}</text></view
    >
  </view>
</template>
<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import PawPetRoster from '@/components/PawPetRoster.vue'
import { goBackSmart } from '@/utils/navBack.ts'
import { openYardDetail as navigateToYardDetail } from '@/utils/profileNav.ts'
import {
  createAnimalRosterEntryPageState,
  normalizeAnimalRosterEntryUserId,
  type AnimalRosterEntryPageState,
} from '@/packages/animal/services/rosterEntryMetadata.ts'
import type { PetRosterYardInfo } from '@/utils/petRosterMockApi.ts'
import type { YardPet } from '@/utils/yardMock.ts'

export default defineComponent({
  name: 'SponsoredAnimalsPage',
  components: { PawPageNav, PawPetRoster },
  data(): AnimalRosterEntryPageState {
    return createAnimalRosterEntryPageState('sponsored')
  },
  onLoad(options: unknown = {}) {
    const id = normalizeAnimalRosterEntryUserId(options)
    if (!id) return
    this.userId = id
    this.ready = true
  },
  methods: {
    goBack() {
      goBackSmart({ fallbackUrl: '/pages/me/index' })
    },
    openPetDetail(pet: YardPet) {
      const petId = pet.id.trim()
      const yardId = typeof pet.yardId === 'string' ? pet.yardId.trim() : ''
      if (!petId || !yardId) return
      uni.navigateTo({
        url: `/packages/animal/pages/detail/index?animalId=${encodeURIComponent(petId)}&yardId=${encodeURIComponent(yardId)}&state=35`,
      })
    },
    openYardDetail(yard: PetRosterYardInfo) {
      if (yard.id) navigateToYardDetail({ yardId: yard.id, yardName: yard.name })
    },
    openYardPets(yard: PetRosterYardInfo) {
      const yardId = yard.id.trim()
      if (!yardId) return
      uni.navigateTo({
        url: `/packages/yard/pages/animals/index?yardId=${encodeURIComponent(yardId)}&yardName=${encodeURIComponent(yard.name)}`,
      })
    },
  },
})
</script>
<style scoped>
.animal-page {
  width: 100%;
  height: 100vh;
  min-height: 0;
  overflow: hidden;
  background: #f5f5f5;
}
.blocked {
  display: flex;
  min-height: 240px;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #888;
  font-size: 14px;
  text-align: center;
}
</style>
