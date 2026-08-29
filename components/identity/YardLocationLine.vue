<template><view class="yard-location-line"><image class="yard-location-line__icon" src="/static/figma/yard-location-icon.svg" mode="aspectFit" /><text>{{ text }}</text></view></template>

<script>
export default { name: 'YardLocationLine', props: { text: { type: String, default: '' } } }
</script>

<style scoped>
.yard-location-line { display: inline-flex; align-items: center; min-width: 0; gap: 2px; color: #333; font-size: 12px; line-height: 12px; }
.yard-location-line__icon { display: block; flex: 0 0 12px; width: 12px; height: 12px; }
</style>
