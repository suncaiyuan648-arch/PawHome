<template>
  <view class="feeding-source-row" @tap.stop="$emit('click')">
    <PawAvatarStack class="feeding-source-row__avatars" :items="feeders" :size="22" :overlap="8" :max="max" />
    <text class="feeding-source-row__text">{{ text }}</text>
  </view>
</template>

<script>
import PawAvatarStack from '@/components/identity/PawAvatarStack.vue'

export default {
  name: 'FeedingSourceRow',
  components: { PawAvatarStack },
  props: {
    feeders: { type: Array, default: () => [] },
    text: { type: String, default: '' },
    max: { type: Number, default: 5 }
  },
  emits: ['click']
}
</script>

<style scoped>
.feeding-source-row { display: flex; align-items: center; justify-content: flex-start; gap: 9px; width: 100%; height: 22px; color: var(--paw-feed-source-text, #384d7b); cursor: pointer; }
.feeding-source-row__avatars { display: block; flex: 0 0 auto; height: 22px; line-height: 0; }
.feeding-source-row :deep(.paw-avatar-stack) { align-items: center; }
.feeding-source-row__text { display: block; flex: 0 1 auto; min-width: 0; max-width: calc(100% - 87px); height: 22px; padding: 0 5px; box-sizing: border-box; border-radius: 4px; background: rgba(245, 245, 245, .85); font-size: 12px; font-weight: 500; line-height: 22px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
