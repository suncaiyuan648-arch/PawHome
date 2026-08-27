<template><view class="paw-upload-tile" @tap="$emit('select')"><image v-if="src" :src="src" mode="aspectFill" /><slot v-else><text>＋</text></slot></view></template>

<script>
export default { name: 'PawUploadTile', props: { src: { type: String, default: '' } }, emits: ['select'] }
</script>

<style scoped>
.paw-upload-tile { display: flex; align-items: center; justify-content: center; width: 80px; height: 80px; border-radius: 8px; background: #f5f5f5; color: #999; font-size: 28px; overflow: hidden; }
.paw-upload-tile image { width: 100%; height: 100%; }
</style>
