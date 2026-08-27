<template><view class="paw-icon-button" hover-class="paw-icon-button--pressed" @tap.stop="$emit('click', $event)"><image v-if="src" :src="src" mode="aspectFit" /><uni-icons v-else-if="icon" :type="icon" :size="iconSize" :color="color" /></view></template>

<script>
export default { name: 'PawIconButton', props: { src: { type: String, default: '' }, icon: { type: String, default: '' }, iconSize: { type: Number, default: 18 }, color: { type: String, default: '#333' } }, emits: ['click'] }
</script>

<style scoped>
.paw-icon-button { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; }
.paw-icon-button image { width: 22px; height: 22px; }
.paw-icon-button--pressed { opacity: .72; transform: scale(.98); }
</style>
