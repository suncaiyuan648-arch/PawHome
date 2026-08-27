<template>
  <view class="paw-result-page">
    <PawPageNav background="#ffffff" :fallback-url="fallbackUrl" :auto-back="false" @back="$emit('back')" />
    <view class="paw-result-page__content" :class="`paw-result-page__content--${status}`">
      <view class="paw-result-page__icon"><uni-icons :type="status === 'failure' ? 'closeempty' : 'checkmarkempty'" color="#222" :size="34" /></view>
      <text class="paw-result-page__title">{{ title }}</text>
      <text v-if="description" class="paw-result-page__description">{{ description }}</text>
    </view>
    <PawButton class="paw-result-page__action" :text="actionText" size="lg" @click="$emit('action')" />
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawButton from '@/components/base/PawButton.vue'
export default { name: 'PawResultPage', components: { PawPageNav, PawButton }, props: { status: { type: String, default: 'success' }, title: { type: String, default: '' }, description: { type: String, default: '' }, actionText: { type: String, default: '' }, fallbackUrl: { type: String, default: '/pages/index/index' } }, emits: ['back', 'action'] }
</script>

<style scoped>
.paw-result-page { display: flex; flex-direction: column; min-height: 100vh; background: #fff; }
.paw-result-page__content { display: flex; flex: 1; align-items: center; flex-direction: column; padding: 38px 34px 0; box-sizing: border-box; }
.paw-result-page__icon { display: flex; align-items: center; justify-content: center; width: 60px; height: 60px; border-radius: 50%; background: var(--paw-color-brand, #ffe60f); opacity: 0; transform: scale(.72); animation: paw-result-icon-in 180ms var(--paw-ease-enter, ease) forwards; }
.paw-result-page__title { margin-top: 14px; color: #333; font-size: 18px; font-weight: 700; line-height: 24px; opacity: 0; animation: paw-result-content-in 180ms 80ms var(--paw-ease-enter, ease) forwards; }
.paw-result-page__description { width: 100%; margin-top: 55px; color: #666; font-size: 16px; font-weight: 500; line-height: 24px; text-align: center; white-space: pre-line; opacity: 0; animation: paw-result-content-in 180ms 80ms var(--paw-ease-enter, ease) forwards; }
.paw-result-page__action { width: 209px; margin: 0 auto calc(171px + env(safe-area-inset-bottom)); }
@keyframes paw-result-icon-in { to { opacity: 1; transform: scale(1); } }
@keyframes paw-result-content-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
</style>
