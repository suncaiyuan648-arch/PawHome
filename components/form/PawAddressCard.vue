<template><view class="paw-address-card" @tap.stop="$emit('click', address)"><view class="paw-address-card__icon"><uni-icons type="location-filled" color="#ff7a33" :size="20" /></view><view class="paw-address-card__body"><view><text class="paw-address-card__name">{{ address.name }}</text><text class="paw-address-card__phone">{{ address.phone }}</text><text v-if="address.isDefault" class="paw-address-card__default">默认</text></view><text class="paw-address-card__detail">{{ address.detail }}</text></view><uni-icons v-if="mode !== 'select'" type="compose" color="#c8c8c8" :size="20" /></view></template>

<script>
export default { name: 'PawAddressCard', props: { address: { type: Object, default: () => ({}) }, mode: { type: String, default: 'display' } }, emits: ['click'] }
</script>

<style scoped>
.paw-address-card { display: flex; align-items: flex-start; padding: 14px 12px; border-radius: 8px; background: #fff; }
.paw-address-card__icon { width: 28px; padding-top: 1px; }
.paw-address-card__body { flex: 1; min-width: 0; }
.paw-address-card__name { color: #333; font-size: 14px; font-weight: 500; }
.paw-address-card__phone { margin-left: 10px; color: #333; font-size: 13px; }
.paw-address-card__default { margin-left: 8px; padding: 2px 5px; border-radius: 4px; background: var(--paw-color-brand-soft, #fff463); color: #333; font-size: 10px; }
.paw-address-card__detail { display: block; margin-top: 8px; color: #666; font-size: 12px; line-height: 18px; }
</style>
