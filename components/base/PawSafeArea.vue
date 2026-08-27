<template><view class="paw-safe-area" :class="{ 'paw-safe-area--disabled': !enabled }"><slot /></view></template>

<script>
export default { name: 'PawSafeArea', props: { enabled: { type: Boolean, default: true } } }
</script>

<style scoped>
.paw-safe-area { min-height: env(safe-area-inset-bottom); padding-bottom: env(safe-area-inset-bottom); box-sizing: border-box; }
.paw-safe-area--disabled { min-height: 0; padding-bottom: 0; }
</style>
