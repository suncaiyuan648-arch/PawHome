<template>
  <button
    class="paw-button"
    :class="[
      `paw-button--${tone}`,
      `paw-button--${size}`,
      `paw-button--${shape}`,
      { 'paw-button--block': block, 'paw-button--flush': flush, 'paw-button--nowrap': nowrap, 'paw-button--disabled': disabled, 'paw-button--loading': loading }
    ]"
    :disabled="disabled || loading"
    :loading="loading"
    :form-type="formType"
    hover-class="paw-button--pressed"
    @click="onClick"
  >
    <view v-if="loading" class="paw-button__spinner" aria-hidden="true"></view>
    <slot>{{ text }}</slot>
  </button>
</template>

<script>
export default {
  name: 'PawButton',
  props: {
    text: { type: String, default: '' },
    tone: { type: String, default: 'brand' },
    size: { type: String, default: 'md' },
    shape: { type: String, default: 'pill' },
    block: { type: Boolean, default: false },
    flush: { type: Boolean, default: false },
    nowrap: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    formType: { type: String, default: '' }
  },
  emits: ['click'],
  methods: {
    onClick(event) {
      if (this.disabled || this.loading) return
      this.$emit('click', event)
    }
  }
}
</script>

<style scoped>
.paw-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  margin: 0;
  padding: 0 20px;
  box-sizing: border-box;
  border: 0;
  color: #333;
  font-family: "Source Han Sans CN", "PingFang SC", sans-serif;
  font-size: 15px;
  font-weight: 500;
  line-height: 1;
  transition: transform var(--paw-motion-micro, 120ms) var(--paw-ease-standard, ease), opacity var(--paw-motion-instant, 80ms) ease;
}
.paw-button::after { display: none; }
.paw-button--block { display: flex; width: 100%; }
.paw-button--flush { padding-right: 0; padding-left: 0; }
.paw-button--nowrap { white-space: nowrap; }
.paw-button--xs { height: 30px; min-height: 30px; font-size: 13px; }
.paw-button--sm { height: 33px; min-height: 33px; font-size: 13px; }
.paw-button--md { height: 42px; min-height: 42px; font-size: 15px; }
.paw-button--lg { height: 46px; min-height: 46px; font-size: 16px; }
.paw-button--pill { border-radius: 999px; }
.paw-button--rounded { border-radius: 8px; }
.paw-button--brand { background: var(--paw-color-brand, #ffe60f); color: #333; }
.paw-button--brand-soft { background: var(--paw-color-brand-soft, #fff463); color: #333; }
.paw-button--secondary { background: #eee; color: #333; }
.paw-button--ghost { border: 1px solid var(--paw-color-border-strong, #d9d9d9); background: #fff; color: #333; }
.paw-button--wechat { background: #18c267; color: #fff; }
.paw-button--danger { background: var(--paw-color-danger, #ff3d3d); color: #fff; }
.paw-button--disabled { opacity: 1; }
.paw-button--brand.paw-button--disabled,
.paw-button--brand-soft.paw-button--disabled { background: var(--paw-color-brand-disabled, rgba(255, 244, 99, .5)); color: rgba(51, 51, 51, .5); }
.paw-button--secondary.paw-button--disabled,
.paw-button--ghost.paw-button--disabled { background: #eee; color: #aaa; border-color: transparent; }
.paw-button--pressed { transform: scale(.98); opacity: .92; }
.paw-button__spinner {
  width: 16px;
  height: 16px;
  margin-right: 7px;
  border: 2px solid rgba(51, 51, 51, .22);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: paw-button-spin .8s linear infinite;
}
@keyframes paw-button-spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
</style>
