<template>
  <PawBottomSheet v-model="valueProxy" :variant="variant" :close-on-mask="true" :safe-area="true">
    <text class="paw-selection-sheet__title">{{ title }}</text>
    <view v-if="layout === 'cards'" class="paw-selection-sheet__cards"><view v-for="item in normalizedItems" :key="item.key" class="paw-selection-sheet__card" :class="{ selected: selected === item.key }" @tap.stop="select(item.key)"><text>{{ item.label }}</text></view></view>
    <view v-else class="paw-selection-sheet__list"><view v-for="item in normalizedItems" :key="item.key" class="paw-selection-sheet__row" @tap.stop="select(item.key)"><text>{{ item.label }}</text><text v-if="selected === item.key">✓</text></view></view>
    <PawButton v-if="confirmText" class="paw-selection-sheet__confirm" :text="confirmText" size="lg" @click="confirm" />
  </PawBottomSheet>
</template>

<script>
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import PawButton from '@/components/base/PawButton.vue'
export default { name: 'PawSelectionSheet', components: { PawBottomSheet, PawButton }, props: { modelValue: { type: Boolean, default: false }, title: { type: String, default: '' }, items: { type: Array, default: () => [] }, value: { type: [String, Number], default: '' }, layout: { type: String, default: 'list' }, variant: { type: String, default: 'selection' }, confirmText: { type: String, default: '' } }, emits: ['update:modelValue', 'update:value', 'select', 'confirm'], data() { return { selected: this.value } }, watch: { value(value) { this.selected = value } }, computed: { normalizedItems() { return this.items.map((item, index) => typeof item === 'string' || typeof item === 'number' ? { key: item, label: String(item) } : { key: item.key !== undefined ? item.key : index, label: item.label || item.value || '' }) }, valueProxy: { get() { return this.modelValue }, set(value) { this.$emit('update:modelValue', value) } } }, methods: { select(key) { this.selected = key; this.$emit('update:value', key); this.$emit('select', key); if (!this.confirmText) this.$emit('update:modelValue', false) }, confirm() { this.$emit('confirm', this.selected); this.$emit('update:modelValue', false) } } }
</script>

<style scoped>
.paw-selection-sheet__title { display: block; padding: 24px 21px 16px; color: #333; font-size: 18px; font-weight: 700; }
.paw-selection-sheet__cards { display: flex; justify-content: center; gap: 21px; padding: 0 21px 20px; }
.paw-selection-sheet__card { display: flex; align-items: center; justify-content: center; width: 155px; height: 102px; border-radius: 10px; background: #fff; box-shadow: 0 0 4px rgba(0, 0, 0, .08); color: #999; font-size: 20px; font-weight: 700; }
.paw-selection-sheet__card.selected { border: 3px solid var(--paw-color-brand, #ffe60f); box-shadow: none; color: #333; }
.paw-selection-sheet__list { padding: 0 12px; }
.paw-selection-sheet__row { display: flex; align-items: center; justify-content: space-between; height: 58px; padding: 0 12px; border-bottom: 1px solid #f5f5f5; border-radius: 8px; color: #999; font-size: 14px; font-weight: 500; }
.paw-selection-sheet__row text:last-child { color: #333; font-size: 18px; }
.paw-selection-sheet__confirm { display: flex; width: calc(100% - 30px); margin: 20px auto; }
</style>
