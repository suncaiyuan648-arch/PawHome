<template><view class="paw-owner-badge"><text>院主</text></view></template>

<script>
export default { name: 'PawOwnerBadge' }
</script>

<style scoped>
.paw-owner-badge { display: inline-flex; flex-shrink: 0; align-items: center; justify-content: center; height: 16px; padding: 0 5px; box-sizing: border-box; border-radius: 8px; background: var(--paw-owner-bg, #ffecef); color: var(--paw-owner-text, #ff0038); font-size: 10px; font-weight: 500; line-height: 16px; white-space: nowrap; vertical-align: middle; }
</style>
