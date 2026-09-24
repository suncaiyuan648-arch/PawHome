<template>
  <view class="page">
    <PawPageNav title="" :title-centered="true" background="#fff" :auto-back="false" @back="goBack" />
    <view class="content" :class="{ 'content--empty': !rescueId }">
      <view v-if="rescueId" class="icon-ok" data-qa="qa-rescue-success-icon">
        <PawIcon name="actions/selection-check" :size="28" label="救助申请成功" />
      </view>
      <PawIcon v-else name="navigation/clock-disabled" :size="24" color="#999" label="救助结果不可用" />
      <text class="title">{{ rescueId ? '救助申请成功' : '救助结果暂不可用' }}</text>
      <text class="desc">{{ rescueId ? '您的救助申请已提交，平台会审核您填写的情况和材料，审核结果会在申请进度中更新。请如实填写救助信息，感谢您对流浪动物的帮助！' : '缺少救助单 ID，请从救助申请或救助列表重新打开。' }}</text>
    </view>
    <view class="footer">
      <PawButton class="success-button" :text="rescueId ? '查看救助进度' : '返回救助列表'" size="lg" block qa="qa-rescue-success-progress" @click="goProgress" />
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import PawButton from '@/components/base/PawButton.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import { goBackSmart } from '@/utils/navBack.ts'
import { getRescueById } from '@/utils/rescueStorage.ts'
import { buildRoute } from '@/navigation/routeContracts.ts'
import { createRescueResultPageState, rescueResultIdFromOptions } from '../../services/componentMetadata.ts'

export default defineComponent({
  components: { PawPageNav, PawButton, PawIcon },
  data() { return createRescueResultPageState() },
  onLoad(options: unknown = {}) {
    const rescueId = rescueResultIdFromOptions(options)
    if (!rescueId || !getRescueById(rescueId, { includeDemo: false })) return
    try {
      buildRoute('rescue.result', { rescueId, outcome: 'application-submitted' })
      this.rescueId = rescueId
    } catch { this.rescueId = '' }
  },
  methods: {
    goBack() { goBackSmart({ fallbackUrl: buildRoute('rescue.fund', {}), fallbackLaunch: 'redirectTo' }) },
    goProgress() {
      if (!this.rescueId) {
        try { uni.redirectTo({ url: buildRoute('rescue.fund', {}) }) } catch { this.goBack() }
        return
      }
      try { uni.redirectTo({ url: buildRoute('rescue.progress', { rescueId: this.rescueId }) }) } catch { this.goBack() }
    }
  }
})
</script>

<style scoped>
.page { width: 100%; min-height: 100vh; display: flex; flex-direction: column; box-sizing: border-box; background: #fff; }
.content { display: flex; flex: 1; flex-direction: column; align-items: center; padding: 28px 60px 0; box-sizing: border-box; }
.content--empty { justify-content: center; padding-top: 0; }
.icon-ok { display: flex; width: 60px; height: 60px; align-items: center; justify-content: center; margin-bottom: 20px; border-radius: 50%; background: #ffe60f; }
.title { display: block; margin: 0 0 60px; color: #111; font-size: 18px; font-weight: 700; line-height: 24px; text-align: center; }
.desc { display: block; align-self: stretch; color: #666; font-size: 16px; font-weight: 500; line-height: 23px; text-align: left; }
.footer { display: flex; flex: 0 0 auto; justify-content: center; padding: 0 83px calc(168px + env(safe-area-inset-bottom)); box-sizing: border-box; }
.success-button { display: flex; width: 100%; height: 45px; min-height: 45px; align-items: center; justify-content: center; padding: 0; border-radius: 22.5px; font-size: 16px; }
</style>
