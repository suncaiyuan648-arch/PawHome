<template>
  <view class="proof-list" data-qa="qa-rescue-proof-list">
    <PawPageNav title="证实救助" :title-centered="true" :background="navBackground" :fallback-url="fallbackUrl" />
    <scroll-view class="proof-list__scroll" scroll-y :show-scrollbar="false">
      <template v-if="record">
        <view class="proof-list__summary">
          <text>已有</text><text class="proof-list__count">{{ proofCount }}</text><text>人证实为真</text>
          <PawButton :text="alreadySubmitted ? '已证实' : '我也来证实'" :tone="alreadySubmitted ? 'secondary' : 'accent'"
            size="xs" shape="rounded" :disabled="alreadySubmitted" qa="qa-rescue-proof-open-create" @click="openCreate" />
        </view>
        <view class="proof-list__card">
          <view class="proof-list__heading"><text>全部证实</text><text>({{ proofs.length }}人)</text></view>
          <view v-if="proofs.length" class="proof-list__items">
            <view v-for="proof in proofs" :key="proof.id" class="proof-item">
              <PawAvatar :src="proof.avatar" :size="40" :clickable="true" @click="openProofUser(proof)" />
              <view class="proof-item__body">
                <view class="proof-item__name" @tap="openProofUser(proof)"><text>{{ proof.name }}</text><LevelBadge :level="proof.level || 1" inline /></view>
                <text class="proof-item__meta">{{ proof.relationship }} · {{ proof.meta }}</text>
                <text class="proof-item__story">{{ proof.story }}</text>
              </view>
            </view>
          </view>
          <view v-else class="proof-list__empty" data-qa="qa-rescue-proof-empty"><text>暂时还没有证实信息</text></view>
        </view>
      </template>
      <view v-else class="proof-list__state" data-qa="qa-rescue-proof-list-empty">
        <PawIcon name="navigation/clock-disabled" :size="22" color="#999" label="证实列表不可用" />
        <text>{{ emptyCopy }}</text>
        <text class="proof-list__state-hint">请从救助详情重新打开证实列表。</text>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawButton from '@/components/base/PawButton.vue'
import PawAvatar from '@/components/identity/PawAvatar.vue'
import LevelBadge from '@/components/customBadge/LevelBadge.vue'
import { SELF_PAW_ID, openUserProfile } from '@/utils/profileNav.ts'
import { buildRoute } from '@/navigation/routeContracts.ts'
import { hasRescueProofByUser, type RescueRecord } from '@/utils/rescueStorage.ts'
import { normalizedProofList, proofCount, type NormalizedRescueProof } from '../services/proof.ts'
import { type RescueLoadState } from '../services/componentMetadata.ts'

export default defineComponent({
  name: 'RescueProofList',
  components: { PawPageNav, PawIcon, PawButton, PawAvatar, LevelBadge },
  props: {
    record: { type: Object as PropType<RescueRecord | null>, default: null },
    loadState: { type: String as PropType<RescueLoadState>, default: 'idle' }
  },
  computed: {
    navBackground() { return 'linear-gradient(to bottom, #fffcdc 0%, #ffffff 100%)' },
    fallbackUrl() {
      if (!this.record) return '/pages/me/index'
      try { return buildRoute('rescue.detail', { rescueId: this.record.id }) } catch { return '/pages/me/index' }
    },
    proofs() { return normalizedProofList(this.record) },
    proofCount() { return proofCount(this.record) },
    alreadySubmitted() { return Boolean(this.record && hasRescueProofByUser(this.record, SELF_PAW_ID)) },
    emptyCopy() {
      if (this.loadState === 'missing-id') return '缺少救助单 ID'
      if (this.loadState === 'invalid-params') return '救助单 ID 无效'
      if (this.loadState === 'not-found') return '找不到这条救助记录'
      return '证实列表暂不可用'
    }
  },
  methods: {
    openCreate() {
      if (!this.record || this.alreadySubmitted) return
      try { uni.navigateTo({ url: buildRoute('rescue.proof.create', { rescueId: this.record.id }) }) } catch { uni.showToast({ title: '证实表单暂不可用', icon: 'none' }) }
    },
    openProofUser(proof: NormalizedRescueProof) {
      if (!proof) return
      const candidate = proof.pawId || proof.userId || proof.id
      const pawId = typeof candidate === 'string' || typeof candidate === 'number' ? candidate : null
      openUserProfile({ pawId, nickname: proof.name, avatar: proof.avatar })
    }
  }
})
</script>

<style scoped>
.proof-list { display: flex; width: 100%; height: 100vh; min-height: 100vh; flex-direction: column; background: linear-gradient(to bottom, #fffcdc 0%, #fff 13.225%, #f5f5f5 21.49%, #f5f5f5 100%); color: #333; }
.proof-list__scroll { min-height: 0; flex: 1 1 auto; box-sizing: border-box; padding: 0 15px 24px; }
.proof-list__summary { display: flex; min-height: 42px; align-items: center; gap: 4px; padding: 6px 8px; box-sizing: border-box; color: #333; font-size: 12px; line-height: 18px; white-space: nowrap; }
.proof-list__count { color: #ee8002; font-size: 22px; line-height: 26px; }
.proof-list__summary .paw-button { min-width: 84px; margin-left: auto; }
.proof-list__card { margin: 0 0 24px; padding: 22px 15px; border-radius: 20px; background: #fff; }
.proof-list__heading { display: flex; align-items: baseline; justify-content: center; gap: 8px; margin-bottom: 17px; color: #333; font-size: 15px; line-height: 21px; }
.proof-list__items { display: flex; flex-direction: column; gap: 15px; }
.proof-item { display: flex; align-items: flex-start; gap: 9px; }
.proof-item__body { display: flex; min-width: 0; flex: 1 1 auto; flex-direction: column; }
.proof-item__name { display: flex; align-items: center; gap: 4px; color: #333; font-size: 14px; line-height: 20px; }
.proof-item__name>text:first-child { max-width: 68%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.proof-item__meta { margin-top: 1px; color: #999; font-size: 12px; line-height: 17px; }
.proof-item__story { margin-top: 5px; color: #555; font-size: 13px; line-height: 20px; word-break: break-all; }
.proof-list__empty { display: flex; min-height: 140px; align-items: center; justify-content: center; color: #999; font-size: 13px; }
.proof-list__state { display: flex; min-height: 360px; flex-direction: column; align-items: center; justify-content: center; gap: 9px; color: #888; font-size: 14px; line-height: 20px; text-align: center; }
.proof-list__state-hint { color: #aaa; font-size: 12px; }
</style>
