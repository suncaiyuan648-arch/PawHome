<template>
  <view class="paw-tabs" :class="[`paw-tabs--${variant}`, `paw-tabs--indicator-${indicatorSize}`]">
    <view v-for="item in normalizedItems" :key="item.key" class="paw-tabs__item"
      :class="{ 'paw-tabs__item--active': value === item.key }" @tap.stop="select(item.key)">
      <text>{{ item.label }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'PawTabs',
  props: {
    modelValue: { type: [String, Number], default: '' },
    items: { type: Array, default: () => [] },
    variant: { type: String, default: 'text' },
    indicatorSize: { type: String, default: 'small', validator: value => ['none', 'small', 'medium', 'large'].includes(value) }
  },
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
.paw-tabs {
  display: flex;
  align-items: center;
}

.paw-tabs__item {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  margin-right: 18px;
  padding: 0 3px;
  color: #999;
  font-size: 15px;
  line-height: 20px;
  z-index: 0;
}

.paw-tabs__item>text {
  position: relative;
  z-index: 1;
}

.paw-tabs__item--active {
  color: #222;
  font-weight: 700;
}

.paw-tabs__item--active::after {
  content: '';
  position: absolute;
  background: var(--paw-color-brand, #ffe60f);
  z-index: 0;
}

.paw-tabs--indicator-none .paw-tabs__item--active::after {
  display: none;
}

.paw-tabs--indicator-small .paw-tabs__item--active::after {
  right: 3px;
  bottom: 7px;
  left: 3px;
  height: 6px;
  border-radius: 3px;
}

.paw-tabs--indicator-medium .paw-tabs__item--active::after {
  right: 0;
  bottom: 7px;
  left: 0;
  height: 10px;
  border-radius: 5px;
}

.paw-tabs--indicator-large .paw-tabs__item--active::after {
  right: -6px;
  bottom: 7px;
  left: -6px;
  height: 12px;
  border-radius: 6px;
}

.paw-tabs--compact .paw-tabs__item {
  min-height: 36px;
  font-size: 14px;
}

.paw-tabs--yard-detail {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 25px;
}

.paw-tabs--yard-detail .paw-tabs__item {
  width: 66px;
  height: 36px;
  min-height: 36px;
  margin-right: 0;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 0;
  font-size: 15px;
}

.paw-tabs--search {
  align-items: flex-start;
  gap: 30px;
}

.paw-tabs--search .paw-tabs__item {
  width: 30px;
  min-width: 30px;
  height: 30px;
  min-height: 30px;
  margin-right: 0;
  padding: 0;
  box-sizing: border-box;
  font-size: 15px;
  line-height: 20px;
}

.paw-tabs--search .paw-tabs__item--active::after {
  right: 0;
  bottom: 0;
  left: 0;
  height: 3px;
  border-radius: 5px;
}

</style>
