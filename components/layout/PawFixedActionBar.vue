<template>
  <view class="paw-fixed-action-bar" :class="{
    'paw-fixed-action-bar--safe': safeArea,
    'paw-fixed-action-bar--primary-full': primaryFullWidth,
    'paw-fixed-action-bar--stacked': stacked
  }">
    <view v-if="stacked" class="paw-fixed-action-bar__top">
      <slot name="top"></slot>
    </view>
    <view class="paw-fixed-action-bar__content">
      <button v-for="action in actions" :key="action.key" class="paw-fixed-action-bar__action"
        :class="{ 'paw-fixed-action-bar__action--disabled': action.disabled }" :data-qa="action.qa || null"
        type="default" hover-class="paw-fixed-action-bar__action--pressed" @tap="onAction(action)">
        <PawIcon v-if="action.iconName" class="paw-fixed-action-bar__paw-icon" :name="action.iconName"
          :size="action.iconSize || 21" :color="action.iconColor || '#222222'" :label="action.label" />
        <image v-else-if="action.image" class="paw-fixed-action-bar__icon" :src="action.image" mode="aspectFit" />
        <uni-icons v-else-if="action.icon" class="paw-fixed-action-bar__uni-icon" :type="action.icon"
          :size="action.iconSize || 21" :color="action.iconColor || '#222'" />
        <text>{{ action.label }}</text>
      </button>
      <PawButton v-if="primaryAction" class="paw-fixed-action-bar__primary"
        :class="{ 'paw-fixed-action-bar__primary--full': primaryFullWidth }" :qa="primaryAction.qa || ''"
        :text="primaryAction.label" :tone="primaryAction.tone || 'brand'" :size="primaryAction.size || 'md'" block flush
        nowrap :loading="!!primaryAction.loading" :disabled="!!primaryAction.disabled"
        @click="$emit('primary', primaryAction)">
        <PawIcon v-if="primaryAction.iconName" class="paw-fixed-action-bar__primary-paw-icon"
          :name="primaryAction.iconName" :size="primaryAction.iconSize || 32"
          :color="primaryAction.iconColor || '#282827'" />
        <image v-else-if="primaryAction.image" class="paw-fixed-action-bar__primary-icon" :src="primaryAction.image"
          mode="aspectFit" />
        <text class="paw-fixed-action-bar__primary-label">{{ primaryAction.label }}</text>
      </PawButton>
    </view>
  </view>
</template>

<script>
import PawButton from '@/components/base/PawButton.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'

export default {
  name: 'PawFixedActionBar',
  components: { PawButton, PawIcon },
  props: {
    actions: { type: Array, default: () => [] },
    primaryAction: { type: Object, default: null },
    safeArea: { type: Boolean, default: true },
    primaryFullWidth: { type: Boolean, default: false },
    stacked: { type: Boolean, default: false }
  },
  emits: ['action', 'primary'],
  methods: {
    onAction(action) {
      if (!action.disabled) this.$emit('action', action)
    }
  }
}
</script>

<style scoped>
.paw-fixed-action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--paw-z-footer, 300);
  display: block;
  height: 88px;
  min-height: 88px;
  padding: 7px 18px 0 20px;
  box-sizing: border-box;
  border-top: .5px solid rgba(0, 0, 0, .05);
  background: #fff;
}

.paw-fixed-action-bar--stacked {
  height: 132px;
  min-height: 132px;
}

.paw-fixed-action-bar__top {
  display: flex;
  flex: 0 0 48px;
  width: 100%;
  margin-bottom: 7px;
  align-items: center;
  box-sizing: border-box;
}

.paw-fixed-action-bar--safe {
  padding-bottom: 34px;
}

/* #ifdef MP-WEIXIN */
.paw-fixed-action-bar--safe {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* #endif */

.paw-fixed-action-bar__content {
  display: flex;
  width: 100%;
  min-width: 0;
  height: 42px;
  align-items: flex-start;
  justify-content: space-between;
}

.paw-fixed-action-bar__action {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-direction: column;
  min-width: 21px;
  height: 53px;
  box-sizing: border-box;
  color: #999;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  flex: 0 0 auto;
  margin: 0;
  padding: 5px 0 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  line-height: 14px;
}

.paw-fixed-action-bar__action::after {
  border: 0;
}

.paw-fixed-action-bar__action--disabled {
  opacity: .45;
}

.paw-fixed-action-bar__action--pressed {
  opacity: .7;
  transform: scale(.98);
}

.paw-fixed-action-bar__icon {
  display: block;
  width: 21px;
  height: 21px;
  margin-bottom: 1px;
}

.paw-fixed-action-bar__paw-icon {
  margin-bottom: 1px;
}

.paw-fixed-action-bar__uni-icon {
  width: 21px;
  height: 21px;
  margin-bottom: 1px;
}

.paw-fixed-action-bar__primary {
  flex: 0 0 188px;
  align-self: flex-start;
  width: 188px;
  height: 42px;
  min-height: 42px;
  margin: 0;
  padding: 0;
  border-radius: 42px;
  background: #ffe60f;
  color: #282827;
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
}

.paw-fixed-action-bar__primary--full {
  flex: 1 1 auto;
  width: 100%;
}

.paw-fixed-action-bar__primary :deep(.paw-button) {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.paw-fixed-action-bar__primary-icon {
  display: block;
  width: 32px;
  height: 32px;
  margin-right: 8px;
  flex-shrink: 0;
}

.paw-fixed-action-bar__primary-paw-icon {
  margin-right: 8px;
  flex-shrink: 0;
}

.paw-fixed-action-bar__primary-label {
  display: block;
  line-height: 20px;
  white-space: nowrap;
}
</style>
