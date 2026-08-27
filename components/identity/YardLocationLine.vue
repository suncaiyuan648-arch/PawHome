<template><view class="yard-location-line"><text class="yard-location-line__icon">●</text><text>{{ text }}</text></view></template>

<script>
export default { name: 'YardLocationLine', props: { text: { type: String, default: '' } } }
</script>

<style scoped>
.yard-location-line { display: inline-flex; align-items: center; min-width: 0; color: #333; font-size: 12px; line-height: 12px; }
.yard-location-line__icon { margin-right: 2px; color: #999; font-size: 8px; line-height: 12px; }
</style>
