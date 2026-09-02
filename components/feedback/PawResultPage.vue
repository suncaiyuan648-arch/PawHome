<template>
  <view class="paw-result-page">
    <PawPageNav :title="navTitle" :title-centered="true" background="#ffffff" :fallback-url="fallbackUrl"
      :auto-back="false" @back="$emit('back')" />
    <view class="paw-result-page__content" :class="`paw-result-page__content--${status}`" :style="contentStyle">
      <view class="paw-result-page__icon">
        <PawIcon v-if="status !== 'failure'" name="status/check" :size="60" label="成功" />
        <uni-icons v-else type="closeempty" color="#666" :size="34" />
      </view>
      <text class="paw-result-page__title">{{ title }}</text>
      <text v-if="description" class="paw-result-page__description">{{ description }}</text>
    </view>
    <view class="paw-result-page__action-wrap" :style="actionStyle">
      <PawButton class="paw-result-page__action" :class="{ 'paw-result-page__action--failure': status === 'failure' }"
        :text="actionText" :tone="status === 'failure' ? 'secondary' : 'brand'" :size="actionButtonSize" block flush
        @click="$emit('action')" />
    </view>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawButton from '@/components/base/PawButton.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'

export default {
  name: 'PawResultPage',
  components: { PawPageNav, PawButton, PawIcon },
  props: {
    status: { type: String, default: 'success' },
    navTitle: { type: String, default: '' },
    contentTop: { type: [Number, String], default: 38 },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    actionText: { type: String, default: '' },
    actionWidth: { type: [Number, String], default: 209 },
    actionHeight: { type: [Number, String], default: 45 },
    fallbackUrl: { type: String, default: '/pages/index/index' }
  },
  emits: ['back', 'action'],
  computed: {
    contentStyle() {
      return { paddingTop: `${Number(this.contentTop) || 38}px` }
    },
    actionButtonSize() {
      return Number(this.actionHeight) >= 48 ? 'result' : 'lg'
    },
    actionStyle() {
      return {
        width: `${Number(this.actionWidth) || 209}px`,
        height: `${Number(this.actionHeight) || 45}px`
      }
    }
  }
}
</script>

<style scoped>
.paw-result-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #fff;
}

.paw-result-page__content {
  display: flex;
  flex: 1;
  align-items: center;
  flex-direction: column;
  padding: 38px 34px 0;
  box-sizing: border-box;
}

.paw-result-page__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--paw-color-brand, #ffe60f);
  opacity: 0;
  transform: scale(.72);
  animation: paw-result-icon-in 180ms var(--paw-ease-enter, ease) forwards;
}

.paw-result-page__content--failure .paw-result-page__icon {
  background: #e7e7e7;
}

.paw-result-page__title {
  margin-top: 14px;
  color: #333;
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
  opacity: 0;
  animation: paw-result-content-in 180ms 80ms var(--paw-ease-enter, ease) forwards;
}

.paw-result-page__description {
  width: 100%;
  margin-top: 55px;
  color: #666;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  text-align: center;
  white-space: pre-line;
  opacity: 0;
  animation: paw-result-content-in 180ms 80ms var(--paw-ease-enter, ease) forwards;
}

.paw-result-page__action-wrap {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  margin: 0 auto calc(171px + env(safe-area-inset-bottom));
}

.paw-result-page__action {
  width: 100%;
  height: 100%;
  min-height: 0;
  margin: 0;
  padding: 0;
}

.paw-result-page__action--failure {
  color: #333;
}

@keyframes paw-result-icon-in {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes paw-result-content-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
