<template>
  <view class="paw-popover-menu">
    <view class="paw-popover-menu__trigger" @tap.stop="toggle"><slot name="trigger" /></view>
    <view v-if="openValue" class="paw-popover-menu__mask" @tap.stop="close"></view>
    <view v-if="openValue" class="paw-popover-menu__panel" @tap.stop>
      <view v-for="item in items" :key="item.key || item" class="paw-popover-menu__item" :class="{ active: activeKey === (item.key || item) }" @tap.stop="select(item)">
        <text>{{ item.label || item }}</text><text v-if="activeKey === (item.key || item)" class="paw-popover-menu__check">✓</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'PawPopoverMenu',
  props: { modelValue: { type: Boolean, default: false }, items: { type: Array, default: () => [] }, activeKey: { type: [String, Number], default: '' } },
  emits: ['update:modelValue', 'select'],
  computed: { openValue() { return this.modelValue } },
  methods: {
    toggle() { this.$emit('update:modelValue', !this.openValue) },
    close() { this.$emit('update:modelValue', false) },
    select(item) { this.$emit('select', item.key || item); this.close() }
  }
}
</script>

<style scoped>
.paw-popover-menu { position: relative; z-index: var(--paw-z-popover, 800); }
.paw-popover-menu__trigger { position: relative; z-index: 2; }
.paw-popover-menu__mask { position: fixed; inset: 0; z-index: 0; }
.paw-popover-menu__panel { position: absolute; top: 33px; right: 6px; z-index: 1; width: 149px; padding: 10px 0; box-sizing: border-box; border-radius: 8px; background: rgba(255, 255, 255, .98); box-shadow: 0 4px 12px rgba(0, 0, 0, .14); }
.paw-popover-menu__item { position: relative; display: flex; align-items: center; height: 37px; padding: 0 15px; box-sizing: border-box; color: #999; font-size: 12px; white-space: nowrap; }
.paw-popover-menu__item.active { color: #333; font-weight: 500; }
.paw-popover-menu__check { position: absolute; right: 14px; color: #222; font-size: 16px; font-weight: 700; }
</style>
