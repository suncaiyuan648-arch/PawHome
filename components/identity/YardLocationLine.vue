<template><view class="yard-location-line"><uni-icons class="yard-location-line__icon" type="location-filled" color="#999999" :size="12" /><text>{{ text }}</text></view></template>

<script>
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue'

export default { name: 'YardLocationLine', components: { uniIcons }, props: { text: { type: String, default: '' } } }
</script>

<style scoped>
.yard-location-line { display: inline-flex; align-items: center; min-width: 0; gap: 2px; color: #333; font-size: 12px; line-height: 12px; }
.yard-location-line__icon { flex: 0 0 12px; width: 12px; height: 12px; }
</style>
