<template>
  <view class="paw-search-bar">
    <uni-icons type="search" color="#d2d2d2" :size="14" />
    <input class="paw-search-bar__input" :value="modelValue" :placeholder="placeholder" placeholder-class="paw-search-bar__placeholder" confirm-type="search" @input="$emit('update:modelValue', $event.detail.value || '')" @confirm="$emit('search', modelValue)" />
    <PawButton class="paw-search-bar__button" tone="secondary" size="xs" text="搜一搜" @click="$emit('search', modelValue)" />
  </view>
</template>

<script>
import PawButton from '@/components/base/PawButton.vue'
export default { name: 'PawSearchBar', components: { PawButton }, props: { modelValue: { type: String, default: '' }, placeholder: { type: String, default: '搜索' } }, emits: ['update:modelValue', 'search'] }
</script>

<style scoped>
.paw-search-bar { display: flex; align-items: center; height: 34px; padding: 0 2px 0 10px; box-sizing: border-box; border: 2px solid #2e2e2e; border-radius: 50px; background: #fff; }
.paw-search-bar__input { flex: 1; min-width: 0; height: 30px; margin-left: 6px; color: #333; font-size: 14px; }
.paw-search-bar__placeholder { color: #d8d8d8; font-size: 14px; }
.paw-search-bar__button { width: 55px; padding: 0; border-radius: 14px; background: #1f1f1f; color: #fff; }
</style>
