<template>
  <view class="paw-album-tag"><text>{{ text }}</text></view>
</template>

<script>
export default {
  name: 'PawAlbumTag',
  props: {
    text: { type: String, default: '置顶' },
  },
}
</script>

<style scoped>
.paw-album-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 29px;
  height: 18px;
  padding: 0 3px;
  border-radius: 3px;
  box-sizing: border-box;
  background: #fccc00;
  color: #333;
  white-space: nowrap;
}

.paw-album-tag text {
  font-size: 11px;
  line-height: 18px;
}
</style>
