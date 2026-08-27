<template>
  <PawSafeArea class="paw-fixed-action-bar" :class="{ 'paw-fixed-action-bar--safe': safeArea }" :enabled="safeArea">
    <view class="paw-fixed-action-bar__actions">
      <view
        v-for="action in actions"
        :key="action.key"
        class="paw-fixed-action-bar__action"
        :class="{ 'paw-fixed-action-bar__action--disabled': action.disabled }"
        hover-class="paw-fixed-action-bar__action--pressed"
        @tap.stop="onAction(action)"
      >
        <image v-if="action.image" class="paw-fixed-action-bar__icon" :src="action.image" mode="aspectFit" />
        <uni-icons v-else-if="action.icon" class="paw-fixed-action-bar__uni-icon" :type="action.icon" :size="action.iconSize || 21" :color="action.iconColor || '#222'" />
        <text>{{ action.label }}</text>
      </view>
    </view>
    <PawButton
      v-if="primaryAction"
      class="paw-fixed-action-bar__primary"
      :text="primaryAction.label"
      :tone="primaryAction.tone || 'brand'"
      :size="primaryAction.size || 'md'"
      :loading="!!primaryAction.loading"
      :disabled="!!primaryAction.disabled"
      @click="$emit('primary', primaryAction)"
    >
      <image v-if="primaryAction.image" class="paw-fixed-action-bar__primary-icon" :src="primaryAction.image" mode="aspectFit" />
      <text>{{ primaryAction.label }}</text>
    </PawButton>
  </PawSafeArea>
</template>

<script>
import PawButton from '@/components/base/PawButton.vue'
import PawSafeArea from '@/components/base/PawSafeArea.vue'

export default {
  name: 'PawFixedActionBar',
  components: { PawButton, PawSafeArea },
  props: {
    actions: { type: Array, default: () => [] },
    primaryAction: { type: Object, default: null },
    safeArea: { type: Boolean, default: true }
  },
  emits: ['action', 'primary'],
  methods: {
    onAction(action) { if (!action.disabled) this.$emit('action', action) }
  }
}
</script>

<style scoped>
.paw-fixed-action-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: var(--paw-z-footer, 300); display: flex; align-items: center; min-height: 88px; padding: 8px 13px; box-sizing: border-box; border-top: 1px solid #eee; background: #fff; }
.paw-fixed-action-bar--safe { padding-bottom: 8px; }
.paw-fixed-action-bar__actions { display: flex; align-items: center; flex: 0 0 auto; }
.paw-fixed-action-bar__action { display: flex; align-items: center; justify-content: center; flex-direction: column; width: 52px; min-height: 44px; color: #777; font-size: 10px; line-height: 14px; }
.paw-fixed-action-bar__action--disabled { opacity: .45; }
.paw-fixed-action-bar__action--pressed { opacity: .7; transform: scale(.98); }
.paw-fixed-action-bar__icon { width: 21px; height: 21px; margin-bottom: 3px; }
.paw-fixed-action-bar__uni-icon { height: 23px; margin-bottom: 1px; }
.paw-fixed-action-bar__primary { flex: 1; min-width: 0; margin-left: 8px; }
.paw-fixed-action-bar__primary-icon { width: 21px; height: 21px; margin-right: 8px; }
</style>
