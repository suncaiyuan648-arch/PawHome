<template>
  <PawBottomSheet v-model="valueProxy" :variant="variant" :height="sheetHeight" :close-on-mask="true" :safe-area="true">
    <view class="paw-selection-sheet__header" :class="{ 'paw-selection-sheet__header--list': layout !== 'cards' }">
      <text v-if="title" class="paw-selection-sheet__title">{{ title }}</text>
      <PawIcon v-if="showClose" class="paw-selection-sheet__close" name="navigation/close" :size="12" label="关闭"
        @tap.stop="close" />
    </view>
    <view v-if="layout === 'cards'" class="paw-selection-sheet__cards">
      <view v-for="item in normalizedItems" :key="item.key" class="paw-selection-sheet__card"
        :class="{ selected: selected === item.key }" @tap.stop="select(item.key)"><text>{{ item.label }}</text></view>
    </view>
    <view v-else class="paw-selection-sheet__list">
      <view v-for="item in normalizedItems" :key="item.key" class="paw-selection-sheet__row"
        @tap.stop="select(item.key)"><text>{{ item.label }}</text>
        <PawIcon v-if="selected === item.key" class="paw-selection-sheet__check" name="actions/selection-check"
          :size="14.3762" />
      </view>
    </view>
    <view v-if="confirmText" class="paw-selection-sheet__confirm">
      <PawButton class="paw-selection-sheet__confirm-button" :text="confirmText" size="lg" :block="true"
        @click="confirm" />
    </view>
  </PawBottomSheet>
</template>

<script>
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import PawButton from '@/components/base/PawButton.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
export default { name: 'PawSelectionSheet', components: { PawBottomSheet, PawButton, PawIcon }, props: { modelValue: { type: Boolean, default: false }, title: { type: String, default: '' }, items: { type: Array, default: () => [] }, value: { type: [String, Number], default: '' }, layout: { type: String, default: 'list' }, variant: { type: String, default: 'selection' }, confirmText: { type: String, default: '' }, showClose: { type: Boolean, default: false } }, emits: ['update:modelValue', 'update:value', 'select', 'confirm'], data() { return { selected: this.value } }, watch: { value(value) { this.selected = value } }, computed: { normalizedItems() { return this.items.map((item, index) => typeof item === 'string' || typeof item === 'number' ? { key: item, label: String(item) } : { key: item.key !== undefined ? item.key : index, label: item.label || item.value || '' }) }, sheetHeight() { return this.layout === 'cards' ? '315px' : '419px' }, valueProxy: { get() { return this.modelValue }, set(value) { this.$emit('update:modelValue', value) } } }, methods: { select(key) { this.selected = key; this.$emit('update:value', key); this.$emit('select', key); if (!this.confirmText) this.$emit('update:modelValue', false) }, confirm() { this.$emit('confirm', this.selected); this.$emit('update:modelValue', false) }, close() { this.$emit('update:modelValue', false) } } }
</script>

<style scoped>
.paw-selection-sheet__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 21px 0;
  box-sizing: border-box;
}

.paw-selection-sheet__header--list {
  position: relative;
  height: 55px;
  padding: 24px 21px 0;
}

.paw-selection-sheet__title {
  display: block;
  padding: 0;
  color: #333;
  font-size: 18px;
  font-weight: 700;
  line-height: 22px;
}

.paw-selection-sheet__close {
  margin-top: -1px;
  flex-shrink: 0;
}

.paw-selection-sheet__header--list .paw-selection-sheet__close {
  position: absolute;
  top: 23px;
  right: 22px;
  margin: 0;
}

.paw-selection-sheet__cards {
  display: flex;
  justify-content: center;
  gap: 21px;
  margin-top: 39px;
  padding: 0 22px;
  box-sizing: border-box;
}

.paw-selection-sheet__card {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 155px;
  width: 155px;
  height: 102px;
  border: 3px solid transparent;
  border-radius: 10px;
  box-sizing: border-box;
  background: #fff;
  box-shadow: 0 0 4px rgba(0, 0, 0, .08);
  color: #999;
  font-size: 20px;
  font-weight: 700;
}

.paw-selection-sheet__card.selected {
  border-color: var(--paw-color-brand, #ffe60f);
  box-shadow: none;
  color: #333;
}

.paw-selection-sheet__list {
  width: calc(100% - 24px);
  min-height: 16px;
  margin: 0 12px;
  padding: 8px 12px;
  box-sizing: border-box;
  background: #fff;
  border-radius: 8px;
}

.paw-selection-sheet__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 58px;
  min-height: 58px;
  padding: 0 15px;
  border: 0;
  border-radius: 0;
  color: #999;
  font-size: 14px;
  font-weight: 500;
}

.paw-selection-sheet__check {
  display: block;
  flex: 0 0 auto;
}

.paw-selection-sheet__confirm {
  display: flex;
  width: calc(100% - 30px);
  margin: 55px auto 27px;
}

.paw-selection-sheet__confirm-button {
  display: flex;
  width: 100%;
}
</style>
