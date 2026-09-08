<template>
  <view class="paw-tag" :class="`paw-tag--${tone}`">
    <text>{{ text }}</text>
  </view>
</template>

<script>
export default {
  name: 'PawTag',
  options: {
    // 标签不增加额外布局盒，避免影响信息行的 flex 对齐。
    // #ifdef MP-WEIXIN
    virtualHost: true,
    // #endif
  },
  props: {
    text: { type: String, default: '' },
    tone: { type: String, default: 'neutral' }
  }
}
</script>

<style scoped>
.paw-tag {
  display: inline-flex;
  max-width: 100%;
  flex: 0 0 auto;
  align-items: center;
  box-sizing: border-box;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f4f4f5;
  color: #666;
  font-size: inherit;
  line-height: 1.25;
  white-space: nowrap;
}

.paw-tag--neutral {
  background: #f4f4f5;
  color: #666;
}
</style>
