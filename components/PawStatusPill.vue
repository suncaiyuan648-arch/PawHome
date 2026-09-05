<template>
  <view class="paw-status" :class="[`paw-status--${tone}`, `paw-status--${variant}`]">
    <slot>{{ text }}</slot>
  </view>
</template>

<script>
export default {
  name: 'PawStatusPill',
  props: {
    text: { type: String, default: '' },
    tone: { type: String, default: 'neutral' },
    variant: { type: String, default: 'solid' }
  }
}
</script>

<style scoped>
.paw-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 8px;
  box-sizing: border-box;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
}

.paw-status--brand {
  background: var(--paw-color-brand, #ffe60f);
  color: #333;
}

.paw-status--success {
  background: #dff4bf;
  color: #407a16;
}

.paw-status--warning {
  background: #fff0d9;
  color: #cf7610;
}

.paw-status--danger {
  background: #fff0f1;
  color: #f14e59;
  border: 1px solid #ff8b91;
}

.paw-status--neutral {
  background: #ededed;
  color: #777777;
}

.paw-status--outline {
  min-height: 21px;
  height: 21px;
  padding: 0 4px;
  border: .5px solid currentColor;
  border-radius: 5px;
  background: transparent;
  box-sizing: border-box;
}

.paw-status--outline.paw-status--success {
  color: #12ca7a;
}

.paw-status--outline.paw-status--danger {
  color: #ff3d3d;
}

.paw-status--outline.paw-status--warning {
  color: #cf7610;
}

.paw-status--outline.paw-status--neutral {
  color: #777777;
}
</style>
