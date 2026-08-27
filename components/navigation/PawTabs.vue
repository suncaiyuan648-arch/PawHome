<template>
  <view class="paw-tabs" :class="`paw-tabs--${variant}`">
    <view
      v-for="item in normalizedItems"
      :key="item.key"
      class="paw-tabs__item"
      :class="{ 'paw-tabs__item--active': value === item.key }"
      @tap.stop="select(item.key)"
    >
      <text>{{ item.label }}</text>
      <view class="paw-tabs__indicator"></view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'PawTabs',
  props: { modelValue: { type: [String, Number], default: '' }, items: { type: Array, default: () => [] }, variant: { type: String, default: 'text' } },
  emits: ['update:modelValue', 'change'],
  computed: {
    value() { return this.modelValue },
    normalizedItems() { return this.items.map((item, index) => typeof item === 'string' ? { key: item, label: item } : { key: item.key !== undefined ? item.key : index, label: item.label }) }
  },
  methods: {
    select(key) { if (key === this.value) return; this.$emit('update:modelValue', key); this.$emit('change', key) }
  }
}
</script>

<style scoped>
.paw-tabs { display: flex; align-items: center; }
.paw-tabs__item { position: relative; display: inline-flex; align-items: center; justify-content: center; min-height: 44px; margin-right: 18px; padding: 0 3px; color: #999; font-size: 15px; line-height: 20px; }
.paw-tabs__item--active { color: #222; font-weight: 700; }
.paw-tabs__indicator { position: absolute; right: 3px; bottom: 7px; left: 3px; z-index: -1; height: 6px; border-radius: 3px; background: transparent; transform: scaleX(0); transition: transform 220ms var(--paw-ease-standard, ease), background-color 180ms ease; }
.paw-tabs__item--active .paw-tabs__indicator { background: var(--paw-color-brand, #ffe60f); transform: scaleX(1); }
.paw-tabs--compact .paw-tabs__item { min-height: 36px; font-size: 14px; }
</style>
