<template>
  <PawOverlay
    :model-value="openValue"
    :close-on-mask="canCloseOnMask"
    :z-index="zIndex"
    :exit-duration="160"
    @update:model-value="setValue"
    @update:visible="setValue"
    @after-open="$emit('after-open')"
    @after-close="$emit('after-close')"
  >
    <template #default="{ opened, closing }">
      <view class="paw-dialog__wrap">
        <view class="paw-dialog" :class="[`paw-dialog--${variant}`, { 'paw-dialog--open': opened, 'paw-dialog--closing': closing }]" @tap.stop>
          <text v-if="title" class="paw-dialog__title">{{ title }}</text>
          <text v-if="message || body" class="paw-dialog__message">{{ message || body }}</text>
          <slot />
          <view v-if="showActions" class="paw-dialog__actions">
            <view v-if="showCancel" class="paw-dialog__action paw-dialog__action--cancel" @tap.stop="onCancel"><text>{{ cancelText }}</text></view>
            <view class="paw-dialog__action paw-dialog__action--confirm" :class="{ 'paw-dialog__action--danger': variant === 'destructive' }" @tap.stop="onConfirm">
              <view v-if="confirmLoading" class="paw-dialog__spinner"></view><text>{{ confirmText }}</text>
            </view>
          </view>
        </view>
      </view>
    </template>
  </PawOverlay>
</template>

<script>
import PawOverlay from '@/components/overlay/PawOverlay.vue'

export default {
  name: 'PawDialog',
  components: { PawOverlay },
  props: {
    modelValue: { type: Boolean, default: undefined },
    visible: { type: Boolean, default: undefined },
    variant: { type: String, default: 'alert' },
    title: { type: String, default: '' },
    message: { type: String, default: '' },
    body: { type: String, default: '' },
    confirmText: { type: String, default: '我知道了' },
    cancelText: { type: String, default: '取消' },
    showCancel: { type: Boolean, default: false },
    confirmLoading: { type: Boolean, default: false },
    closeOnMask: { type: Boolean, default: false },
    autoClose: { type: Boolean, default: true },
    zIndex: { type: [String, Number], default: 10000 }
  },
  emits: ['update:modelValue', 'update:visible', 'confirm', 'cancel', 'after-open', 'after-close'],
  computed: {
    openValue() { return this.modelValue !== undefined ? this.modelValue : !!this.visible },
    canCloseOnMask() { return this.variant !== 'destructive' && this.closeOnMask },
    showActions() { return this.showCancel || !!this.confirmText }
  },
  methods: {
    setValue(value) { this.$emit('update:modelValue', value); this.$emit('update:visible', value) },
    onCancel() { this.$emit('cancel'); this.setValue(false) },
    onConfirm() {
      if (this.confirmLoading) return
      this.$emit('confirm')
      if (this.autoClose) this.setValue(false)
    }
  }
}
</script>

<style scoped>
.paw-dialog__wrap { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; padding: 48px; box-sizing: border-box; pointer-events: none; }
.paw-dialog { width: 100%; max-width: 320px; overflow: hidden; box-sizing: border-box; border-radius: 10px; background: #fff; opacity: 0; transform: scale(.96); transition: opacity 180ms var(--paw-ease-enter, ease), transform 180ms var(--paw-ease-enter, ease); pointer-events: auto; }
.paw-dialog--open { opacity: 1; transform: scale(1); }
.paw-dialog--closing { opacity: 0; transform: scale(.98); transition-duration: 160ms; }
.paw-dialog__title { display: block; padding: 20px 20px 0; color: #333; font-size: 15px; font-weight: 700; line-height: 22px; text-align: center; }
.paw-dialog__message { display: block; padding: 22px 20px 20px; color: #787878; font-size: 14px; font-weight: 400; line-height: 20px; text-align: center; white-space: pre-line; }
.paw-dialog:not(.paw-dialog--rich) .paw-dialog__message:first-child { padding-top: 24px; }
.paw-dialog__actions { display: flex; min-height: 49px; border-top: 1px solid #ececec; }
.paw-dialog__action { display: flex; align-items: center; justify-content: center; flex: 1; min-height: 49px; color: #333; font-size: 15px; font-weight: 500; }
.paw-dialog__action + .paw-dialog__action { border-left: 1px solid #ececec; }
.paw-dialog__action--cancel { color: #999; font-weight: 400; }
.paw-dialog__action--danger { color: var(--paw-color-danger, #ff3d3d); }
.paw-dialog__spinner { width: 14px; height: 14px; margin-right: 6px; border: 2px solid rgba(51, 51, 51, .2); border-top-color: currentColor; border-radius: 50%; animation: paw-dialog-spin .8s linear infinite; }
@keyframes paw-dialog-spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
</style>
