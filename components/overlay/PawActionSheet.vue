<template>
  <PawBottomSheet v-model="valueProxy" variant="action" :close-on-mask="true" :safe-area="true">
    <view v-for="item in items" :key="item.key" class="paw-action-sheet__item" :class="{ danger: item.tone === 'danger' }" @tap.stop="select(item)"><text>{{ item.label }}</text></view>
  </PawBottomSheet>
</template>

<script>
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
export default { name: 'PawActionSheet', components: { PawBottomSheet }, props: { modelValue: { type: Boolean, default: false }, items: { type: Array, default: () => [] } }, emits: ['update:modelValue', 'select'], computed: { valueProxy: { get() { return this.modelValue }, set(value) { this.$emit('update:modelValue', value) } } }, methods: { select(item) { this.$emit('select', item); this.$emit('update:modelValue', false) } } }
</script>

<style scoped>
.paw-action-sheet__item { display: flex; align-items: center; justify-content: center; height: 52px; color: #999; font-size: 15px; font-weight: 500; }
.paw-action-sheet__item + .paw-action-sheet__item { border-top: 1px solid #f3f3f3; }
.paw-action-sheet__item.danger { color: var(--paw-color-danger, #ff3d3d); }
</style>
