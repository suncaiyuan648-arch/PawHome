<template>
  <view class="page">
    <PawPageNav title="" :title-centered="true" background="#fff" :auto-back="false" @back="goBack" />
    <view class="content">
      <view class="icon-ok" data-qa="qa-adoption-success-icon">
        <PawIcon name="actions/selection-check" :size="28" label="申请成功" />
      </view>
      <text class="title">申请成功</text>
      <text
        class="desc">您的领养申请已发送给院主，为防止不正当领养及虐猫群体恶意领养，院主会查看您的历史喂猫投粮记录以及领养记录来决定是否同意，通过后平台将通知您。请注意本领养为爱心领养，如院主索要钱财，请立即举报！</text>
    </view>
    <view class="footer">
      <PawButton class="success-button" text="查看领养进度" size="lg" block qa="qa-adoption-success-progress"
        @click="goProgress" />
    </view>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawButton from '@/components/base/PawButton.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { getLastAdoptionId, getAdoptionById } from '@/utils/adoptionStorage.js'

function decodeValue(value) { try { return decodeURIComponent(String(value || '')) } catch (e) { return String(value || '') } }

export default {
  components: { PawPageNav, PawButton, PawIcon },
  data() { return { recordId: '' } },
  onLoad(options = {}) {
    const id = decodeValue(options.recordId || options.id || getLastAdoptionId())
    this.recordId = getAdoptionById(id, { includeDemo: false }) ? id : ''
  },
  methods: {
    goBack() { goBackSmart({ fallbackUrl: '/pages/me/index' }) },
    goProgress() {
      const query = this.recordId ? `?id=${encodeURIComponent(this.recordId)}` : ''
      uni.redirectTo({ url: '/pages/meMore/adoptionFlow' + query })
    }
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
  padding: 28px 48px 0;
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
  width: 254px;
  max-width: 100%;
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
  padding: 0 0 calc(168px + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.success-button {
  display: flex;
  width: 209px;
  height: 45px;
  min-height: 45px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 22.5px;
  font-size: 16px;
}
</style>
