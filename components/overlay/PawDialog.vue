<template>
  <PawOverlay :model-value="openValue" :close-on-mask="canCloseOnMask" :placement="placement" :z-index="zIndex"
    :mask-color="overlayMaskColor" :exit-duration="160" @update:model-value="setValue" @update:visible="setValue"
    @after-open="$emit('after-open')" @after-close="$emit('after-close')">
    <template #default="{ opened, closing }">
      <view class="paw-dialog__wrap" :class="'paw-dialog__wrap--' + variant">
        <view class="paw-dialog"
          :class="[`paw-dialog--${variant}`, { 'paw-dialog--open': opened, 'paw-dialog--closing': closing }]" @tap.stop>
          <text v-if="title" class="paw-dialog__title">{{ title }}</text>
          <text v-if="message || body" class="paw-dialog__message">{{ message || body }}</text>
          <slot />
          <view v-if="showActions" class="paw-dialog__actions">
            <view v-if="showCancel" class="paw-dialog__action paw-dialog__action--cancel" data-qa="paw-dialog-cancel"
              @tap.stop="onCancel"><text>{{
                cancelText }}</text></view>
            <view class="paw-dialog__action paw-dialog__action--confirm"
              :class="{ 'paw-dialog__action--danger': variant === 'destructive' }" data-qa="paw-dialog-confirm"
              @tap.stop="onConfirm">
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
    maskColor: { type: String, default: '' },
    autoClose: { type: Boolean, default: true },
    placement: {
      type: String,
      default: 'center',
      validator: value => ['top', 'center', 'bottom'].includes(value)
    },
    zIndex: { type: [String, Number], default: 10000 }
  },
  emits: ['update:modelValue', 'update:visible', 'confirm', 'cancel', 'after-open', 'after-close'],
  computed: {
    openValue() { return this.modelValue !== undefined ? this.modelValue : !!this.visible },
    canCloseOnMask() { return this.variant !== 'destructive' && this.closeOnMask },
    overlayMaskColor() {
      return this.maskColor || (this.variant === 'destructive' ? 'rgba(0, 0, 0, .15)' : '')
    },
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
.paw-dialog__wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 48px;
  box-sizing: border-box;
  pointer-events: none;
}

.paw-dialog__wrap--destructive {
  padding: 0 30px;
  transform: translateY(-38px);
}

.paw-dialog {
  width: 100%;
  max-width: 320px;
  overflow: hidden;
  box-sizing: border-box;
  border-radius: 10px;
  background: #fff;
  opacity: 0;
  transform: scale(.96);
  transition: opacity 180ms var(--paw-ease-enter, ease), transform 180ms var(--paw-ease-enter, ease);
  pointer-events: auto;
}

.paw-dialog--open {
  opacity: 1;
  transform: scale(1);
}

.paw-dialog--closing {
  opacity: 0;
  transform: scale(.98);
  transition-duration: 160ms;
}

.paw-dialog__title {
  display: block;
  padding: 20px 20px 0;
  color: #333;
  font-size: 15px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
}

.paw-dialog__message {
  display: block;
  padding: 22px 20px 20px;
  color: #787878;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  text-align: center;
  white-space: pre-line;
}

.paw-dialog:not(.paw-dialog--rich) .paw-dialog__message:first-child {
  padding-top: 24px;
}

.paw-dialog__actions {
  display: flex;
  min-height: 49px;
  border-top: 1px solid #ececec;
}

.paw-dialog__action {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 49px;
  color: #333;
  font-size: 15px;
  font-weight: 500;
}

.paw-dialog__action+.paw-dialog__action {
  border-left: 1px solid #ececec;
}

.paw-dialog__action--cancel {
  color: #999;
  font-weight: 400;
}

.paw-dialog__action--danger {
  color: var(--paw-color-danger, #ff3d3d);
}

.paw-dialog__wrap--jury-vote-result {
  padding: 24px;
}

.paw-dialog--jury-vote-result {
  width: 317px;
  max-width: calc(100vw - 48px);
  border-radius: 20px;
}

.paw-dialog--jury-vote-result .paw-dialog__actions {
  min-height: 53px;
  height: 53px;
  border-top: 0;
}

.paw-dialog--jury-vote-result .paw-dialog__action {
  height: 53px;
  min-height: 53px;
  color: #000;
  font-size: 15px;
  font-weight: 500;
}

.paw-dialog--jury-vote-result .paw-dialog__action--cancel {
  color: #999;
  background: #fff;
  font-weight: 400;
}

.paw-dialog--jury-vote-result .paw-dialog__action+.paw-dialog__action {
  border-left: 0;
}

.paw-dialog--jury-vote-result .paw-dialog__action--confirm {
  background: #ffe60f;
}

.paw-dialog--destructive {
  width: 315px;
  max-width: none;
  height: 141px;
  border-radius: 25px;
  padding: 0 21px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  box-shadow: none;
}

.paw-dialog--destructive .paw-dialog__title {
  width: 100%;
  margin: 0 0 32px;
  padding: 0;
  color: #333;
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
  white-space: nowrap;
}

.paw-dialog--destructive .paw-dialog__actions {
  display: flex;
  flex: 0 0 38px;
  align-items: center;
  justify-content: center;
  gap: 19px;
  width: 100%;
  min-height: 38px;
  border-top: 0;
}

.paw-dialog--destructive .paw-dialog__action {
  flex: 0 0 126px;
  width: 126px;
  min-height: 38px;
  height: 38px;
  border: 0;
  border-radius: 20px;
  background: rgba(233, 233, 233, .5);
  color: #333;
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
}

.paw-dialog--destructive .paw-dialog__action+.paw-dialog__action {
  border-left: 0;
}

.paw-dialog--destructive .paw-dialog__action--cancel {
  color: #333;
  font-weight: 700;
}

.paw-dialog--destructive .paw-dialog__action--danger {
  background: #ffe60f;
  color: #333;
}

.paw-dialog__spinner {
  width: 14px;
  height: 14px;
  margin-right: 6px;
  border: 2px solid rgba(51, 51, 51, .2);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: paw-dialog-spin .8s linear infinite;
}

@keyframes paw-dialog-spin {
  from {
    transform: rotate(0);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
