<template>
  <view class="paw-status" :class="`paw-status--${tone}`"><slot>{{ text }}</slot></view>
</template>

<script>
export default {
  name: 'PawStatusPill',
  props: {
    text: { type: String, default: '' },
    tone: { type: String, default: 'brand' }
  }
}
</script>

<style scoped>
.paw-status { display: inline-flex; align-items: center; justify-content: center; min-height: 34rpx; padding: 0 12rpx; box-sizing: border-box; border-radius: 999rpx; font-size: 20rpx; line-height: 1; white-space: nowrap; }
.paw-status--brand { background: #ffdd00; color: #111111; }
.paw-status--success { background: #dff4bf; color: #407a16; }
.paw-status--warning { background: #fff0d9; color: #cf7610; }
.paw-status--danger { background: #fff0f1; color: #f14e59; border: 1rpx solid #ff8b91; }
.paw-status--neutral { background: #ededed; color: #777777; }
</style>
