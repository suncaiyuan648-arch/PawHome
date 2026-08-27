<template>
  <view class="paw-empty-state" :class="{ 'paw-empty-state--compact': compact }">
    <image v-if="image" class="paw-empty-state__image" :src="image" mode="aspectFit" />
    <text class="paw-empty-state__title">{{ title }}</text>
    <text v-if="description" class="paw-empty-state__description">{{ description }}</text>
    <PawButton v-if="actionText" class="paw-empty-state__action" text="" tone="ghost" size="sm" @click="$emit('action')"><text>{{ actionText }}</text></PawButton>
  </view>
</template>

<script>
import PawButton from '@/components/base/PawButton.vue'
export default { name: 'PawEmptyState', components: { PawButton }, props: { image: { type: String, default: '' }, title: { type: String, default: '' }, description: { type: String, default: '' }, actionText: { type: String, default: '' }, compact: { type: Boolean, default: false } }, emits: ['action'] }
</script>

<style scoped>
.paw-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 20px; box-sizing: border-box; color: #666; }
.paw-empty-state--compact { min-height: 260px; padding: 24px 20px; }
.paw-empty-state__image { width: 78px; height: 79px; }
.paw-empty-state__title { margin-top: 8px; color: #666; font-size: 14px; line-height: 20px; }
.paw-empty-state__description { margin-top: 4px; color: #999; font-size: 12px; line-height: 17px; }
.paw-empty-state__action { width: 76px; margin-top: 12px; padding: 0; }
</style>
