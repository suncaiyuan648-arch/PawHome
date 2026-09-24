<template>
  <view class="animal-page">
    <PawPetRoster v-if="ready" :variant="view === 'roster' ? 'yard' : 'status'" :yard-id="yardId" :yard-name="yardName" :yard-avatar="yardAvatar" @back="goBack" @pet-click="openPetDetail" @owner-click="openOwner" />
    <PawPageNav v-else title="小院宠物" background="#f5f5f5" fallback-url="/pages/me/index" />
    <view v-if="!ready" class="blocked"><text>{{ message }}</text></view>
  </view>
</template>
<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import PawPetRoster from '@/components/PawPetRoster.vue'
import { goBackSmart } from '@/utils/navBack.ts'
import { openUserProfile } from '@/utils/profileNav.ts'
import type { PetRosterCardOwner } from '@/utils/petRosterMockApi.ts'
import type { YardPet } from '@/utils/yardMock.ts'

type YardAnimalView = 'roster' | 'status' | 'long-list'

interface YardAnimalsPageState {
  yardId: string
  yardName: string
  yardAvatar: string
  view: YardAnimalView
  ready: boolean
  message: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function routeText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
}

function decodeRouteText(value: unknown): string {
  const text = routeText(value)
  if (!text) return ''
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

function isYardAnimalView(value: string): value is YardAnimalView {
  return value === 'roster' || value === 'status' || value === 'long-list'
}

export default defineComponent({
  name: 'YardAnimalsPage',
  components: { PawPageNav, PawPetRoster },
  data(): YardAnimalsPageState {
    return { yardId: '', yardName: '', yardAvatar: '', view: 'roster', ready: false, message: '缺少小院 ID，无法读取小院宠物' }
  },
  onLoad(options: unknown = {}) {
    const route = isRecord(options) ? options : {}
    const yardId = routeText(route.yardId)
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(yardId)) return
    this.yardId = yardId
    const requestedView = routeText(route.view || route.state)
    this.view = isYardAnimalView(requestedView) ? requestedView : 'roster'
    this.yardName = decodeRouteText(route.yardName || route.name)
    this.yardAvatar = decodeRouteText(route.yardAvatar)
    this.ready = true
  },
  methods: {
    goBack() { goBackSmart({ fallbackUrl: '/pages/me/index' }) },
    openPetDetail(pet: YardPet) {
      const petId = routeText(pet.id)
      if (!petId) return
      uni.navigateTo({ url: `/packages/animal/pages/detail/index?animalId=${encodeURIComponent(petId)}&yardId=${encodeURIComponent(this.yardId)}&state=35` })
    },
    openOwner(owner: PetRosterCardOwner) {
      if (!owner.pawId) return
      openUserProfile({ pawId: owner.pawId, nickname: owner.name, avatar: owner.avatar })
    }
  }
})
</script>
<style scoped>
.animal-page { width: 100%; height: 100vh; min-height: 0; overflow: hidden; background: #f5f5f5; }
.blocked { display: flex; min-height: 240px; align-items: center; justify-content: center; padding: 24px; color: #888; font-size: 14px; text-align: center; }
</style>
