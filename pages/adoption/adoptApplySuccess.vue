<template>
  <view class="page" :class="{ 'page--rescue': applicationType === 'rescue' }">
    <PawPageNav title="" :title-centered="true" background="#fff" :auto-back="false" @back="goBack" />
    <view class="content">
      <view class="icon-ok" data-qa="qa-adoption-success-icon">
        <PawIcon name="actions/selection-check" :size="28" :label="successTitle" />
      </view>
      <text class="title">{{ successTitle }}</text>
      <text class="desc">{{ successDescription }}</text>
    </view>
    <view class="footer">
      <PawButton class="success-button" :text="progressLabel" size="lg" block qa="qa-adoption-success-progress"
        @click="goProgress" />
    </view>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawButton from '@/components/base/PawButton.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { getLastAdoptionId } from '@/utils/adoptionStorage.js'
import { getApplication } from '@/utils/applicationMockApi.js'

function decodeValue(value) { try { return decodeURIComponent(String(value || '')) } catch (e) { return String(value || '') } }

export default {
  components: { PawPageNav, PawButton, PawIcon },
  data() { return { applicationType: 'adoption', applicationId: '' } },
  onLoad(options = {}) {
    const type = String(options.type || options.source || options.sourceType || '').toLowerCase()
    this.applicationType = type === 'rescue' ? 'rescue' : 'adoption'
    const id = decodeValue(this.applicationType === 'rescue'
      ? (options.rescueId || options.id)
      : (options.recordId || options.id || getLastAdoptionId()))
    const result = getApplication(this.applicationType, id, { includeDemo: false })
    this.applicationId = result.success ? id : ''
  },
  methods: {
    goBack() { goBackSmart({ fallbackUrl: '/pages/me/index' }) },
    goProgress() {
      if (!this.applicationId) {
        uni.showToast({ title: '缺少审批单 ID', icon: 'none' })
        return
      }
      const key = this.applicationType === 'rescue' ? 'rescueId' : 'id'
      const query = `?type=${this.applicationType}&${key}=${encodeURIComponent(this.applicationId)}`
      uni.redirectTo({ url: '/pages/meMore/adoptionFlow' + query })
    }
  },
  computed: {
    successTitle() { return this.applicationType === 'rescue' ? '救助申请成功' : '申请成功' },
    successDescription() {
      return this.applicationType === 'rescue'
        ? '您的救助申请已提交，平台会审核您填写的情况和材料，审核结果会在申请进度中更新。请如实填写救助信息，感谢您对流浪动物的帮助！'
        : '您的领养申请已发送给院主，为防止不正当领养及虐猫群体恶意领养，院主会查看您的历史喂猫投粮记录以及领养记录来决定是否同意，通过后平台将通知您。请注意本领养为爱心领养，如院主索要钱财，请立即举报！'
    },
    progressLabel() { return this.applicationType === 'rescue' ? '查看救助进度' : '查看领养进度' }
  }
}
</script>

<style scoped>
.page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: #fff;
}

.content {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  padding: 28px 60px 0;
  box-sizing: border-box;
}

.icon-ok {
  display: flex;
  width: 60px;
  height: 60px;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  border-radius: 50%;
  background: #ffe60f;
}

.title {
  display: block;
  margin: 0 0 60px;
  color: #111;
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
  text-align: center;
}

.desc {
  display: block;
  align-self: stretch;
  color: #666;
  font-size: 16px;
  font-weight: 500;
  line-height: 23px;
  text-align: left;
}

.footer {
  display: flex;
  flex: 0 0 auto;
  justify-content: center;
  padding: 0 83px calc(168px + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.success-button {
  display: flex;
  width: 100%;
  height: 45px;
  min-height: 45px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 22.5px;
  font-size: 16px;
}
</style>
