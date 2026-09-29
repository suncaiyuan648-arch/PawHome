<template>
  <view
    class="paw-fixed-action-bar"
    :class="{
      'paw-fixed-action-bar--safe': safeArea,
      'paw-fixed-action-bar--primary-full': primaryFullWidth,
      'paw-fixed-action-bar--primary-end': primaryEnd,
      'paw-fixed-action-bar--stacked': stacked,
      'paw-fixed-action-bar--dual': secondaryAction,
      'paw-fixed-action-bar--offline-activity': variant === 'offline-activity',
    }"
  >
    <view
      v-if="stacked"
      class="paw-fixed-action-bar__top"
    >
      <slot name="top"></slot>
    </view>
    <view class="paw-fixed-action-bar__content">
      <button
        v-for="action in actions"
        :key="action.key"
        class="paw-fixed-action-bar__action"
        :class="{ 'paw-fixed-action-bar__action--disabled': action.disabled }"
        :data-qa="action.qa || null"
        hover-class="paw-fixed-action-bar__action--pressed"
        @tap="onAction(action)"
      >
        <PawIcon
          v-if="action.iconName"
          class="paw-fixed-action-bar__paw-icon"
          :name="action.iconName"
          :size="action.iconSize || 21"
          :color="action.iconColor || '#222222'"
          :label="action.label"
        />
        <image
          v-else-if="action.image"
          class="paw-fixed-action-bar__icon"
          :src="action.image"
          mode="aspectFit"
        />
        <uni-icons
          v-else-if="action.icon"
          class="paw-fixed-action-bar__uni-icon"
          :type="action.icon"
          :size="action.iconSize || 21"
          :color="action.iconColor || '#222'"
        />
        <text>{{ action.label }}</text>
      </button>
      <PawButton
        v-if="secondaryAction"
        class="paw-fixed-action-bar__secondary"
        :qa="secondaryAction.qa || ''"
        :text="secondaryAction.label"
        :tone="secondaryAction.tone || 'ghost'"
        :size="secondaryAction.size || 'md'"
        :shape="secondaryAction.shape || 'rounded'"
        block
        flush
        nowrap
        :loading="!!secondaryAction.loading"
        :disabled="!!secondaryAction.disabled"
        :style="secondaryStyle"
        @click="$emit('secondary', secondaryAction)"
      >
        <PawIcon
          v-if="secondaryAction.iconName"
          class="paw-fixed-action-bar__secondary-paw-icon"
          :name="secondaryAction.iconName"
          :size="secondaryAction.iconSize || 32"
          :color="secondaryAction.iconColor || '#282827'"
        />
        <image
          v-else-if="secondaryAction.image"
          class="paw-fixed-action-bar__secondary-icon"
          :src="secondaryAction.image"
          mode="aspectFit"
        />
        <text
          v-else
          class="paw-fixed-action-bar__secondary-label"
          >{{ secondaryAction.label }}</text
        >
      </PawButton>
      <PawButton
        v-if="primaryAction"
        class="paw-fixed-action-bar__primary"
        :class="{
          'paw-fixed-action-bar__primary--full': primaryFullWidth,
          'paw-fixed-action-bar__primary--disabled': primaryAction.disabled,
        }"
        :qa="primaryAction.qa || ''"
        :text="primaryAction.label"
        :tone="primaryAction.tone || 'brand'"
        :size="primaryAction.size || 'md'"
        block
        flush
        :shape="primaryAction.shape || (secondaryAction ? 'rounded' : 'pill')"
        nowrap
        :loading="!!primaryAction.loading"
        :disabled="!!primaryAction.disabled"
        :style="primaryStyle"
        @click="$emit('primary', primaryAction)"
      >
        <PawIcon
          v-if="primaryAction.iconName"
          class="paw-fixed-action-bar__primary-paw-icon"
          :name="primaryAction.iconName"
          :size="primaryAction.iconSize || 32"
          :color="primaryAction.iconColor || '#282827'"
        />
        <image
          v-else-if="primaryAction.image"
          class="paw-fixed-action-bar__primary-icon"
          :src="primaryAction.image"
          mode="aspectFit"
        />
        <text class="paw-fixed-action-bar__primary-label">{{ primaryAction.label }}</text>
      </PawButton>
    </view>
  </view>
</template>

<script lang="ts">
import { eventContract } from '@/utils/componentEvents.ts'

import { defineComponent, type PropType } from 'vue'

import PawButton from '@/components/base/PawButton.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'

export interface PawFixedAction {
  key: string
  label: string
  disabled?: boolean
  loading?: boolean
  qa?: string
  iconName?: string
  icon?: string
  image?: string
  iconSize?: number
  iconColor?: string
  tone?: string
  size?: string
  shape?: string
}

export default defineComponent({
  name: 'PawFixedActionBar',
  components: { PawButton, PawIcon },
  props: {
    actions: { type: Array as PropType<PawFixedAction[]>, default: () => [] },
    secondaryAction: { type: Object as PropType<PawFixedAction | null>, default: null },
    primaryAction: { type: Object as PropType<PawFixedAction | null>, default: null },
    primaryWidth: { type: [Number, String], default: 188 },
    primaryEnd: { type: Boolean, default: false },
    safeArea: { type: Boolean, default: true },
    primaryFullWidth: { type: Boolean, default: false },
    stacked: { type: Boolean, default: false },
    variant: { type: String, default: '' },
  },
  emits: {
    action: eventContract<[action: PawFixedAction]>(),
    primary: eventContract<[action: PawFixedAction]>(),
    secondary: eventContract<[action: PawFixedAction]>(),
  },
  computed: {
    secondaryStyle() {
      return this.secondaryAction && this.secondaryAction.shape === 'rounded'
        ? { borderRadius: '8px' }
        : {}
    },
    primaryStyle() {
      if (!this.primaryAction) return {}
      const style: Record<string, string> = {}
      if (!this.secondaryAction && !this.primaryFullWidth) {
        const width = Number(this.primaryWidth)
        if (Number.isFinite(width) && width > 0) {
          style.width = `${width}px`
          style.flex = `0 0 ${width}px`
        }
      }
      const shape = this.primaryAction.shape || (this.secondaryAction ? 'rounded' : 'pill')
      if (shape === 'rounded') style.borderRadius = '8px'
      return style
    },
  },
  methods: {
    onAction(action: PawFixedAction) {
      if (!action.disabled) this.$emit('action', action)
    },
  },
})
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
  border-top: 0.5px solid rgba(0, 0, 0, 0.05);
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

.paw-fixed-action-bar--primary-end .paw-fixed-action-bar__content {
  justify-content: flex-end;
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
  opacity: 0.45;
}

.paw-fixed-action-bar__action--pressed {
  opacity: 0.7;
  transform: scale(0.98);
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

.paw-fixed-action-bar--dual .paw-fixed-action-bar__content {
  gap: 12px;
  justify-content: flex-end;
}

.paw-fixed-action-bar--dual .paw-fixed-action-bar__secondary,
.paw-fixed-action-bar--dual .paw-fixed-action-bar__primary {
  min-width: 0;
  flex: 1 1 0;
  width: auto;
}

.paw-fixed-action-bar__secondary {
  height: 42px;
  min-height: 42px;
  margin: 0;
}

.paw-fixed-action-bar__secondary-label {
  display: block;
  line-height: 20px;
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

.paw-fixed-action-bar--offline-activity {
  height: 101px;
  min-height: 101px;
  padding: 10px 18px 34px 23px;
}

/* #ifdef MP-WEIXIN */
.paw-fixed-action-bar--offline-activity.paw-fixed-action-bar--safe {
  height: calc(67px + env(safe-area-inset-bottom));
  min-height: calc(67px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
}
/* #endif */

.paw-fixed-action-bar--offline-activity .paw-fixed-action-bar__content {
  height: 47px;
  gap: 16px;
}

.paw-fixed-action-bar--offline-activity .paw-fixed-action-bar__action {
  flex: 0 0 30px;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 47px;
  padding: 0;
  color: #2c2c2c;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
}

.paw-fixed-action-bar--offline-activity .paw-fixed-action-bar__icon {
  width: 18px;
  height: 18px;
  margin-bottom: 3px;
}

.paw-fixed-action-bar--offline-activity .paw-fixed-action-bar__primary {
  flex: 1 1 auto;
  min-width: 0;
  height: 47px;
  min-height: 47px;
  border-radius: 23.5px;
  font-size: 16px;
  font-weight: 700;
}

.paw-fixed-action-bar--offline-activity .paw-fixed-action-bar__primary--disabled {
  background: #eee;
  color: #aaa;
}

.paw-fixed-action-bar--offline-activity .paw-fixed-action-bar__primary-label {
  line-height: 24px;
}
</style>
