<template>
  <view class="rescue-fund-page" data-qa="qa-rescue-fund-page">
    <PawPageNav title="救助基金" :title-centered="true" background="#f5f5f5" fallback-url="/pages/me/index" />

    <view class="fund-summary" data-qa="qa-rescue-fund-summary">
      <view class="fund-card">
        <text class="fund-card__name">{{ summary.name }}</text>
        <text class="fund-card__balance">{{ summary.balance }}</text>
        <text class="fund-card__label">剩余金额(元)</text>
        <view class="fund-card__stats">
          <view v-for="stat in summary.stats" :key="stat.label" class="fund-card__stat">
            <text>{{ stat.value }}</text>
            <text>{{ stat.label }}</text>
          </view>
        </view>
      </view>
      <view class="fund-note" data-qa="qa-rescue-fund-note">
        <image class="fund-note__icon" src="/static/figma/feature/rescue-fund-info.svg" mode="aspectFit" />
        <text>{{ summary.note }}</text>
      </view>
    </view>

    <view class="fund-tabs" data-qa="qa-rescue-fund-tabs">
      <view v-for="stat in summary.statusStats" :key="stat.status" class="fund-tab"
        :class="{ 'fund-tab--active': activeStatus === stat.status }"
        :data-qa="'qa-rescue-fund-tab-' + stat.status" @tap="selectStatus(stat.status)">
        <text class="fund-tab__count">{{ stat.value }}</text>
        <text class="fund-tab__label" :class="{ 'fund-tab__label--active': activeStatus === stat.status }">{{ stat.label }}</text>
      </view>
    </view>

    <scroll-view class="fund-scroll" scroll-y :show-scrollbar="false">
      <view v-for="item in visibleItems" :key="item.id" class="rescue-card" data-qa="qa-rescue-fund-record"
        :id="'qa-rescue-fund-record-' + item.id" @tap="openDetail(item.id)">
        <view class="rescue-card__head">
          <PawAvatar class="rescue-card__avatar" :src="item.ownerAvatar" :size="41" />
          <view class="rescue-card__author">
            <view class="rescue-card__author-line">
              <text>{{ item.ownerName }}</text>
              <LevelBadge :level="item.ownerLevel || 1" inline />
            </view>
            <text class="muted">{{ item.createdLabel }}</text>
          </view>
          <PawStatusPill class="rescue-card__status" :text="item.statusText" :tone="item.statusTone" />
        </view>
        <text class="rescue-card__amount">¥{{ item.amount }} <text>求助金额</text></text>
        <text class="rescue-card__copy">{{ item.summary }}</text>
        <view class="rescue-card__gallery">
          <image v-for="(src, index) in item.mediaPaths.slice(0, 4)" :key="src + index" :src="src" mode="aspectFill" />
        </view>
        <text class="muted">{{ item.views }}人浏览</text>
      </view>
      <view v-if="!visibleItems.length" class="fund-empty" data-qa="qa-rescue-fund-empty">
        <text>当前暂无救助记录</text>
      </view>
      <view class="fund-scroll__space" />
    </scroll-view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import PawStatusPill from '@/components/PawStatusPill.vue'
import PawAvatar from '@/components/identity/PawAvatar.vue'
import LevelBadge from '@/components/customBadge/LevelBadge.vue'
import { buildRoute } from '@/navigation/routeContracts.ts'
import { getRescueRecords, getRescueReviewSummary } from '@/utils/rescueStorage.ts'
import { createRescueFundListState, type RescueFundListState } from '../services/componentMetadata.ts'

export default defineComponent({
  name: 'RescueFundList',
  components: { PawPageNav, PawStatusPill, PawAvatar, LevelBadge },
  data(): RescueFundListState { return createRescueFundListState() },
  computed: {
    summary() { return getRescueReviewSummary(this.rescueItems) },
    visibleItems() { return this.rescueItems.filter((item) => item.status === this.activeStatus) }
  },
  created() { this.refresh() },
  onShow() { this.refresh() },
  methods: {
    refresh() { this.rescueItems = getRescueRecords() },
    selectStatus(status: string) {
      const next = String(status || '').trim()
      if (this.summary.statusStats.some((item) => item.status === next)) this.activeStatus = next
    },
    openDetail(rescueId: string) {
      const id = String(rescueId || '').trim()
      if (!id) return
      try {
        uni.navigateTo({ url: buildRoute('rescue.detail', { rescueId: id }) })
      } catch {
        uni.showToast({ title: '救助详情暂不可用', icon: 'none' })
      }
    }
  }
})
</script>

<style scoped>
.rescue-fund-page { display: flex; width: 100%; height: 100vh; min-height: 100vh; flex-direction: column; box-sizing: border-box; background: #f5f5f5; color: #222; }
.fund-summary { display: flex; flex: 0 0 auto; flex-direction: column; }
.fund-card { display: flex; width: calc(100% - 24px); height: 185px; min-height: 185px; flex-direction: column; margin: 10px 12px 0; padding: 18px 19px 20px; box-sizing: border-box; border-radius: 19px; overflow: hidden; background: #ffe766 url('/static/figma/feature/rescue-fund-bg.svg') center / 100% 100% no-repeat; }
.fund-card__name { flex: 0 0 auto; color: #6b4a22; font-size: 16px; font-weight: 700; line-height: 20px; }
.fund-card__balance { align-self: center; margin-top: 20px; color: #6b4a22; font-size: 32px; font-weight: 700; line-height: 38px; }
.fund-card__label { align-self: center; color: #6b4a22; font-size: 12px; line-height: 17px; }
.fund-card__stats { display: flex; width: calc(100% + 14px); margin: 17px -7px 0; }
.fund-card__stat { display: flex; flex: 1 1 0; flex-direction: column; align-items: center; color: #6b4a22; font-size: 12px; line-height: 17px; white-space: nowrap; }
.fund-card__stat>text:first-child { font-size: 15px; font-weight: 700; line-height: 18px; }
.fund-note { display: flex; width: calc(100% - 24px); align-items: center; margin: 16px 12px 0; color: #6b4a22; font-size: 12px; line-height: 17px; white-space: nowrap; }
.fund-note__icon { width: 14px; height: 14px; flex: 0 0 14px; margin-right: 4px; }
.fund-note>text { min-width: 0; flex: 1 1 auto; }
.fund-tabs { display: flex; min-height: 76px; flex: 0 0 76px; align-items: flex-start; padding: 24px 12px 8px; box-sizing: border-box; background: #f5f5f5; }
.fund-tab { display: flex; min-width: 0; flex: 1 1 0; flex-direction: column; align-items: center; color: #999; }
.fund-tab__count { height: 28px; color: #999; font-size: 20px; line-height: 28px; }
.fund-tab--active .fund-tab__count { color: #000; }
.fund-tab__label { min-width: 40px; height: 16px; padding: 0 5px; box-sizing: border-box; border-radius: 8px; color: #999; font-size: 11px; line-height: 16px; text-align: center; white-space: nowrap; }
.fund-tab__label--active { background: #ffe60f; color: #000; }
.fund-scroll { min-height: 0; flex: 1 1 auto; box-sizing: border-box; padding-bottom: 24px; }
.rescue-card { display: flex; width: calc(100% - 30px); flex-direction: column; margin: 10px 15px 0; padding: 15px; box-sizing: border-box; border-radius: 10px; background: #fff; }
.rescue-card__head { display: flex; align-items: center; }
.rescue-card__avatar { flex: 0 0 41px; margin-right: 7px; }
.rescue-card__author { display: flex; min-width: 0; flex: 1 1 auto; flex-direction: column; gap: 4px; }
.rescue-card__author-line { display: flex; min-width: 0; align-items: center; gap: 4px; }
.rescue-card__author-line>text:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rescue-card__status { flex: none; padding-right: 7px; padding-left: 7px; }
.muted { color: #999; font-size: 12px; line-height: 17px; }
.rescue-card__amount { display: block; margin-top: 13px; color: #ff3d48; font-size: 21px; line-height: 27px; }
.rescue-card__amount text { color: #ee8002; font-size: 11px; }
.rescue-card__copy { display: block; margin-top: 13px; color: #333; font-size: 14px; line-height: 20px; word-break: break-all; }
.rescue-card__gallery { display: flex; width: 100%; gap: 4px; margin-top: 19px; }
.rescue-card__gallery image { width: calc((100% - 12px) / 4); height: 78px; flex: none; }
.fund-empty { display: flex; min-height: 160px; align-items: center; justify-content: center; color: #999; font-size: 14px; }
.fund-scroll__space { height: 12px; }
</style>
