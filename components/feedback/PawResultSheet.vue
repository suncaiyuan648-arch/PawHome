<template>
  <PawBottomSheet v-model="valueProxy" variant="result" height="374px" :close-on-mask="true" :safe-area="true">
    <view class="paw-result-sheet__content">
      <view class="paw-result-sheet__close-hit" @tap="close">
        <PawIcon class="paw-result-sheet__close" name="actions/result-close" :size="12" label="关闭" />
      </view>

      <view class="paw-result-sheet__title-row">
        <PawIcon class="paw-result-sheet__icon" name="status/success-check" :size="17.208" />
        <text class="paw-result-sheet__title">{{ title }}</text>
      </view>
      <text class="paw-result-sheet__body">{{ normalizedDescription }}</text>
      <PawButton v-if="actionText" class="paw-result-sheet__action" :text="actionText" size="md"
        @click="$emit('action')" />
    </view>
  </PawBottomSheet>
</template>

<script>
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import PawButton from '@/components/base/PawButton.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'

export default {
  name: 'PawResultSheet',
  components: { PawBottomSheet, PawButton, PawIcon },
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    actionText: { type: String, default: '' }
  },
  emits: ['update:modelValue', 'action', 'close'],
  computed: {
    normalizedDescription() {
      return String(this.description || '').replace(/\\n/g, '\n')
    },
    valueProxy: {
      get() { return this.modelValue },
      set(value) { this.$emit('update:modelValue', value) }
    }
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false)
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.paw-result-sheet__content {
  position: relative;
  width: 100%;
  height: 340px;
  box-sizing: border-box;
}

.paw-result-sheet__close-hit {
  position: absolute;
  top: 0;
  right: 0;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.paw-result-sheet__close {
  display: block;
}

.paw-result-sheet__title-row {
  position: absolute;
  top: 43px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 26px;
}

.paw-result-sheet__icon {
  display: block;
}

.paw-result-sheet__title {
  color: #000;
  font-size: 18px;
  font-weight: 500;
  line-height: 26px;
  white-space: nowrap;
}

.paw-result-sheet__body {
  position: absolute;
  top: 111px;
  left: 50%;
  width: 266px;
  margin: 0;
  transform: translateX(-50%);
  color: #666;
  font-size: 16px;
  font-weight: 500;
  line-height: 23px;
  text-align: center;
  white-space: pre-line;
}

.paw-result-sheet__action {
  position: absolute;
  left: 50%;
  bottom: 4px;
  width: 209px;
  height: 45px;
  min-height: 45px;
  margin: 0;
  transform: translateX(-50%);
  border-radius: 20px;
}
</style>
