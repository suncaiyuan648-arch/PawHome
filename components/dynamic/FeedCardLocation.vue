<template>
  <view v-if="hasLocation" class="feed-card-location" aria-label="定位信息">
    <image class="feed-card-location__icon" src="/static/figma/home/location-pin.svg" mode="aspectFit" />
    <text v-if="distance">{{ distance }}</text>
    <text v-if="district">{{ district }}</text>
  </view>
</template>

<script>
export default {
  name: 'FeedCardLocation',
  props: {
    distance: { type: String, default: '' },
    district: { type: String, default: '' }
  },
  computed: {
    hasLocation() { return Boolean(this.distance || this.district) }
  }
}
</script>

<style scoped>
.feed-card-location { position: absolute; right: 4px; bottom: 3px; display: flex; align-items: flex-start; justify-content: center; gap: 3px; height: 15px; padding: 1px 5px; box-sizing: border-box; border-radius: 5px; background: rgba(0, 0, 0, .3); color: #f6f8fa; font-size: 10px; font-weight: 500; line-height: 11px; white-space: nowrap; }
.feed-card-location__icon { flex: 0 0 7px; width: 7px; height: 13px; }
.feed-card-location text { line-height: 11px; }
</style>
