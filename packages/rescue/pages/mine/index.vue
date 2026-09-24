<template>
  <view class="rescue-mine-page" data-qa="qa-rescue-mine">
    <PawPageNav title="我的救助" :title-centered="true" background="#f5f5f5" fallback-url="/pages/me/index" />
    <view class="mine-tabs" data-qa="qa-rescue-mine-tabs">
      <view v-for="tab in tabs" :key="tab.key" class="mine-tab" :class="{ 'mine-tab--active': activeFilter === tab.key }"
        @tap="selectFilter(tab.key)"><text>{{ tab.label }}</text><text>{{ count(tab.key) }}</text></view>
    </view>
    <scroll-view class="mine-scroll" scroll-y :show-scrollbar="false">
      <view v-if="actorError" class="mine-state" data-qa="qa-rescue-mine-auth-required">
        <text>登录后才能查看你发起的救助</text>
      </view>
      <view v-else-if="!visibleItems.length" class="mine-state" data-qa="qa-rescue-mine-empty">
        <text>暂无救助申请</text>
      </view>
      <view v-else class="mine-list">
        <view v-for="item in visibleItems" :key="item.rescueId" class="mine-card"
          :data-qa="`qa-rescue-mine-item-${item.rescueId}`" @tap="openProgress(item)">
          <view class="mine-card__head"><text class="mine-card__title">救助申请 {{ item.rescueId }}</text><PawStatusPill :text="statusLabel(item.applicationStatus)" :tone="statusTone(item.applicationStatus)" variant="outline" /></view>
          <text v-if="item.summary" class="mine-card__summary">{{ item.summary }}</text>
          <text class="mine-card__meta">{{ item.createdAt || '已提交' }}</text>
          <text class="mine-card__hint">查看救助进度</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import PawStatusPill from '@/components/PawStatusPill.vue'
import { buildRoute } from '@/navigation/routeContracts.ts'
import {
	countRescueMineItems,
	createRescueMinePageState,
	getRescueMineStatusPresentation,
	isMineFilter,
	type RescueMinePageState
} from '../../services/mineMetadata.ts'
import type { MineFilter, MineItem, MineStatus } from '../../services/mineReader.ts'
import { readRescueMinePage } from '../../services/mineReader.ts'

const ACTOR_SESSION_KEY = 'PAWHOME_ACTOR_SESSION'

export default defineComponent({
  name: 'RescueMinePage',
  components: { PawPageNav, PawStatusPill },
  data(): RescueMinePageState {
    return createRescueMinePageState()
  },
  computed: {
    visibleItems() { return this.model.items },
  },
  onShow() { this.refresh() },
  methods: {
    actorProvider(): unknown {
      try { return uni.getStorageSync(ACTOR_SESSION_KEY) || null } catch { return null }
    },
    refresh() {
      const result = readRescueMinePage({ actorProvider: () => this.actorProvider(), filter: this.activeFilter })
      this.model = result
      this.actorError = result.diagnostics.actorError
    },
    selectFilter(filter: MineFilter) { if (!isMineFilter(filter) || this.activeFilter === filter) return; this.activeFilter = filter; this.refresh() },
    count(filter: MineFilter) {
      return countRescueMineItems(this.model.items, filter)
    },
    statusLabel(status: MineStatus) { return getRescueMineStatusPresentation(status).label },
    statusTone(status: MineStatus) { return getRescueMineStatusPresentation(status).tone },
    openProgress(item: MineItem) {
      if (!item || !item.rescueId) return
      try { uni.navigateTo({ url: buildRoute('rescue.progress', { rescueId: item.rescueId }) }) } catch { uni.showToast({ title: '救助进度暂不可用', icon: 'none' }) }
    },
  },
})
</script>

<style scoped>
.rescue-mine-page { display: flex; width: 100%; height: 100vh; min-height: 100vh; flex-direction: column; background: #f5f5f5; color: #333; }
.mine-tabs { display: flex; height: 48px; flex: 0 0 48px; align-items: center; padding: 0 10px; background: #fff; border-bottom: 1px solid #e8e8e8; }
.mine-tab { display: flex; min-width: 0; flex: 1; height: 48px; align-items: center; justify-content: center; gap: 3px; color: #999; font-size: 12px; }
.mine-tab--active { color: #222; font-weight: 500; }
.mine-scroll { min-height: 0; flex: 1; padding: 12px 15px 24px; box-sizing: border-box; }
.mine-list { display: flex; flex-direction: column; gap: 10px; }
.mine-card { display: flex; flex-direction: column; gap: 7px; padding: 15px; border-radius: 10px; background: #fff; }
.mine-card__head { display: flex; align-items: center; gap: 8px; }
.mine-card__title { min-width: 0; flex: 1; color: #222; font-size: 15px; line-height: 22px; }
.mine-card__summary { color: #555; font-size: 13px; line-height: 20px; }
.mine-card__meta, .mine-card__hint { color: #999; font-size: 12px; line-height: 18px; }
.mine-card__hint { padding-top: 6px; border-top: 1px solid #f0f0f0; color: #555; text-align: right; }
.mine-state { display: flex; min-height: 240px; align-items: center; justify-content: center; color: #999; font-size: 14px; text-align: center; }
</style>
