<template>
    <view class="yard-location-line">
        <PawIcon class="yard-location-line__icon" name="actions/yard-location" :size="12" /><text>{{ text }}</text>
    </view>
</template>

<script>
import PawIcon from '@/components/PawIcon/PawIcon.vue'

export default { name: 'YardLocationLine', components: { PawIcon }, props: { text: { type: String, default: '' } } }
</script>

<style scoped>
.yard-location-line {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    gap: 2px;
    color: #333;
    font-size: 12px;
    line-height: 12px;
}

.yard-location-line__icon {
    display: block;
}
</style>
