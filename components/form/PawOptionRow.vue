<template><view class="paw-option-row" @tap.stop="$emit('click', option)"><text>{{ option.label || label }}</text><text class="paw-option-row__value">{{ value || option.value || '›' }}</text></view></template>

<script>
export default { name: 'PawOptionRow', props: { option: { type: Object, default: () => ({}) }, label: { type: String, default: '' }, value: { type: String, default: '' } }, emits: ['click'] }
</script>

<style scoped>
.paw-option-row { display: flex; align-items: center; justify-content: space-between; min-height: 58px; padding: 0 12px; box-sizing: border-box; border-bottom: 1px solid #f5f5f5; color: #333; font-size: 14px; }
.paw-option-row__value { color: #999; }
</style>
