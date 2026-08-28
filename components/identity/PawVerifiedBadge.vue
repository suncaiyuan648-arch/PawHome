<template><view class="paw-verified-badge"><text>已实名</text></view></template>

<script>
export default { name: 'PawVerifiedBadge' }
</script>

<style scoped>
.paw-verified-badge { display: inline-flex; flex-shrink: 0; align-items: center; justify-content: center; height: 16px; padding: 0 7px; box-sizing: border-box; border-radius: 10.5px; background: var(--paw-verified-bg, #fffaf0); color: var(--paw-verified-text, #a9731d); font-size: 10px; font-weight: 500; line-height: 16px; white-space: nowrap; vertical-align: middle; }
</style>
