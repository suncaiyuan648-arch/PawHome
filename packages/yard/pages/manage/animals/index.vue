<template>
  <view class="manage-animals-page">
    <PawPetRoster
      v-if="ready"
      ref="roster"
      variant="status"
      :managed="true"
      :yard-id="yardId"
      :yard-name="yardName"
      :yard-avatar="yardAvatar"
      @back="goBack"
      @add-pet="onAddPet"
      @edit-yard="openYardEditor"
      :can-edit-yard="ready"
      @pet-click="openPetDetail"
      @feed-click="openFeedPopup"
    />
    <PawPageNav
      v-else
      title="我的小院"
      background="#f5f5f5"
      fallback-url="/pages/me/index"
    />
    <view
      v-if="!ready"
      class="blocked"
      ><text>{{ message }}</text></view
    >
    <YardFeedPopup
      v-if="feedPopupVisible"
      v-model:visible="feedPopupVisible"
      :pet-id="feedPetId"
      @feed-order="openFeedOrders"
    />
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import PawPetRoster from '@/components/PawPetRoster.vue'
import YardFeedPopup from '@/components/YardFeedPopup.vue'
import { goBackSmart } from '@/utils/navBack.ts'
import { buildRoute } from '@/navigation/routeContracts.ts'
import { readLocalYard } from '../../../services/localManagementStorage.ts'
import type { YardPet } from '@/utils/yardMock.ts'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/

interface YardManagedAnimalsPageState {
  yardId: string
  yardName: string
  yardAvatar: string
  ready: boolean
  returnHomeOnBack: boolean
  message: string
  feedPopupVisible: boolean
  feedPetId: string
}

interface YardRosterController {
  loadRoster(): unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function readText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
}

function readName(value: unknown): string {
  const text = readText(value)
  if (!text) return ''
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

function isYardRosterController(value: unknown): value is YardRosterController {
  return isRecord(value) && typeof value.loadRoster === 'function'
}

export default defineComponent({
  name: 'YardManagedAnimalsPage',
  components: { PawPageNav, PawPetRoster, YardFeedPopup },
  data(): YardManagedAnimalsPageState {
    return {
      yardId: '',
      yardName: '我的小院',
      yardAvatar: '/static/figma/yard-cover-exact.png',
      ready: false,
      returnHomeOnBack: false,
      message: '缺少小院 ID，无法读取管理名册',
      feedPopupVisible: false,
      feedPetId: '',
    }
  },
  onLoad(options: unknown = {}) {
    const route = isRecord(options) ? options : {}
    const queryYardId = readText(route.yardId)
    const storedYardId = readText(uni.getStorageSync('PAWHOME_ACTIVE_YARD_ID'))
    const yardId = queryYardId || storedYardId
    if (!SAFE_ID.test(yardId)) return

    this.yardId = yardId
    this.yardName = readName(route.name || route.yardName) || this.yardName
    this.returnHomeOnBack = readText(route.returnHome) === '1'
    this.refreshManagement()
  },
  onShow() {
    if (this.yardId) this.refreshManagement()
  },
  methods: {
    refreshManagement() {
      const result = readLocalYard(this.yardId, {
        actorProvider: () => uni.getStorageSync('PAWHOME_ACTOR_SESSION'),
      })
      if (!result.success) {
        this.message =
          result.error && result.error.code === 'NO_ACTOR'
            ? '请先登录后再管理小院动物'
            : '当前账号没有该小院的动物管理权限'
        this.ready = false
        return
      }
      const record = result.data && result.data.record
      if (record) {
        this.yardName = readText(record.name) || this.yardName
        this.yardAvatar = readText(record.avatar) || this.yardAvatar
      }
      this.ready = true
      this.$nextTick(() => {
        const roster: unknown = this.$refs.roster
        if (isYardRosterController(roster)) void roster.loadRoster()
      })
    },
    openYardEditor() {
      this.refreshManagement()
      if (this.ready) uni.navigateTo({ url: buildRoute('yard.editor', { yardId: this.yardId }) })
    },
    goBack() {
      if (this.returnHomeOnBack) {
        uni.reLaunch({ url: '/pages/index/index' })
        return
      }
      goBackSmart({ fallbackUrl: '/pages/me/index' })
    },
    onAddPet() {
      this.refreshManagement()
      if (!this.ready) return
      uni.showActionSheet({
        itemList: ['添加猫咪', '添加狗狗'],
        success: ({ tapIndex }: UniNamespace.ShowActionSheetRes) => {
          const species = tapIndex === 0 ? 'cat' : tapIndex === 1 ? 'dog' : ''
          if (!species) return
          uni.navigateTo({
            url: `/packages/animal/pages/editor/index?species=${species}&yardId=${encodeURIComponent(this.yardId)}&yardName=${encodeURIComponent(this.yardName)}`,
          })
        },
      })
    },
    openPetDetail(pet: YardPet) {
      const petId = readText(pet.id)
      if (!petId) return
      uni.navigateTo({
        url: `/packages/animal/pages/detail/index?animalId=${encodeURIComponent(petId)}&yardId=${encodeURIComponent(this.yardId)}&state=36`,
      })
    },
    openFeedPopup(pet: YardPet) {
      const petId = readText(pet.id)
      if (!petId) return
      this.feedPetId = petId
      this.feedPopupVisible = true
    },
    openFeedOrders() {
      uni.navigateTo({ url: buildRoute('feeding.yardOrders', { yardId: this.yardId }) })
    },
  },
})
</script>

<style scoped>
.manage-animals-page {
  width: 100%;
  min-height: 100vh;
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
