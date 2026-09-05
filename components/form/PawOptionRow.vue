<template>
  <view class="paw-option-row" :style="rowStyle" @tap.stop="$emit('click', option)">
    <text class="paw-option-row__label">{{ option.label || label }}</text>
    <text v-if="value || option.value" class="paw-option-row__value">{{ value || option.value }}</text>
    <PawChevron v-else class="paw-option-row__chevron" :size="8" />
  </view>
</template>

<script>
import PawChevron from '@/components/base/PawChevron.vue'

export default {
  name: 'PawOptionRow',
  components: { PawChevron },
  props: {
    option: { type: Object, default: () => ({}) },
    label: { type: String, default: '' },
    value: { type: String, default: '' },
    height: { type: [Number, String], default: 48 }
  },
  emits: ['click'],
  computed: {
    rowStyle() {
      const height = Number(this.height) || 48
      return { height: `${height}px`, minHeight: `${height}px` }
    }
  }
}
</script>

<style scoped>
.paw-option-row {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 16px;
  box-sizing: border-box;
  color: #333333;
  font-size: 15px;
  line-height: 18px;
  background: #ffffff;
}

.paw-option-row__label {
  flex: 1 1 auto;
  min-width: 0;
}

.paw-option-row__value {
  flex: 0 0 auto;
  margin-left: 16px;
  color: #999999;
}

.paw-option-row__chevron {
  flex: 0 0 auto;
  margin-left: 16px;
  opacity: 0.38;
}
</style>
