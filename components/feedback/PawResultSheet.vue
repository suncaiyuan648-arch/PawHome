<template>
  <PawBottomSheet v-model="valueProxy" variant="result" :close-on-mask="true" :safe-area="true">
    <view class="paw-result-sheet__content">
      <view class="paw-result-sheet__icon"><uni-icons type="checkmarkempty" color="#222" :size="12" /></view>
      <text class="paw-result-sheet__title">{{ title }}</text>
      <text class="paw-result-sheet__body">{{ description }}</text>
      <PawButton v-if="actionText" class="paw-result-sheet__action" :text="actionText" size="md" @click="$emit('action')" />
    </view>
  </PawBottomSheet>
</template>

<script>
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import PawButton from '@/components/base/PawButton.vue'
export default { name: 'PawResultSheet', components: { PawBottomSheet, PawButton }, props: { modelValue: { type: Boolean, default: false }, title: { type: String, default: '' }, description: { type: String, default: '' }, actionText: { type: String, default: '' } }, emits: ['update:modelValue', 'action'], computed: { valueProxy: { get() { return this.modelValue }, set(value) { this.$emit('update:modelValue', value) } } } }
</script>

<style scoped>
.paw-result-sheet__content { display: flex; align-items: center; flex-direction: column; min-height: 260px; padding: 39px 28px 30px; box-sizing: border-box; }
.paw-result-sheet__icon { display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; background: var(--paw-color-brand, #ffe60f); }
.paw-result-sheet__title { margin-top: 6px; color: #222; font-size: 16px; font-weight: 600; }
.paw-result-sheet__body { margin-top: 47px; color: #666; font-size: 14px; line-height: 18px; text-align: center; white-space: pre-line; }
.paw-result-sheet__action { width: 208px; margin-top: 24px; }
</style>
