<template>
  <button
    class="paw-button"
    :class="[`paw-button--${variant}`, { 'paw-button--disabled': disabled, 'paw-button--loading': loading }]"
    :disabled="disabled || loading"
    :loading="loading"
    :form-type="formType"
    @click="$emit('click', $event)"
  >
    <slot>{{ text }}</slot>
  </button>
</template>

<script>
export default {
  name: 'PawPrimaryButton',
  props: {
    text: { type: String, default: '' },
    variant: { type: String, default: 'brand' },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    formType: { type: String, default: '' }
  },
  emits: ['click']
}
</script>

<style scoped>
.paw-button { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 100rpx; margin: 0; padding: 0 28rpx; box-sizing: border-box; border: 0; border-radius: 999rpx; font-size: 30rpx; font-weight: 600; line-height: 1; }
.paw-button::after { display: none; }
.paw-button--brand { background: #ffdd00; color: #111111; }
.paw-button--wechat { background: #18c267; color: #ffffff; }
.paw-button--secondary { background: #eeeeee; color: #222222; }
.paw-button--ghost { background: #ffffff; color: #222222; border: 2rpx solid #dddddd; }
.paw-button--disabled { background: #eeeeee; color: #aaaaaa; }
.paw-button--loading { opacity: 0.78; }
</style>
