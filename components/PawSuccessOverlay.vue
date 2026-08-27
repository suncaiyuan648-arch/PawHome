<template>
  <view>
    <PawResultSheet v-if="mode === 'feeding'" v-model="visibleProxy" title="投喂成功" :description="body" action-text="查看投喂订单" @action="$emit('action')" />
    <PawBottomSheet v-else v-model="visibleProxy" variant="result" :safe-area="true" :close-on-mask="true">
      <view class="legacy-success">
        <PawIconButton class="legacy-success__close" icon="closeempty" :icon-size="18" @click="close" />
        <view class="legacy-success__icon"><uni-icons type="checkmarkempty" color="#222" :size="34" /></view>
        <text class="legacy-success__title">{{ title }}</text>
        <text class="legacy-success__body">{{ body }}</text>
        <view v-if="mode === 'created'" class="legacy-success__benefits"><view><text>进行组织基地认证</text><text>通过认证后将获得</text></view><view><text>获得更多曝光</text><text>标识</text></view></view>
        <PawButton class="legacy-success__action" :text="buttonText" size="md" @click="$emit('action')" />
      </view>
    </PawBottomSheet>
  </view>
</template>

<script>
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import PawResultSheet from '@/components/feedback/PawResultSheet.vue'
import PawButton from '@/components/base/PawButton.vue'
import PawIconButton from '@/components/base/PawIconButton.vue'

export default {
  name: 'PawSuccessOverlay',
  components: { PawBottomSheet, PawResultSheet, PawButton, PawIconButton },
  props: { visible: { type: Boolean, default: false }, compact: Boolean, mode: { type: String, default: 'default' }, title: String, body: String, buttonText: String },
  emits: ['close', 'action'],
  computed: {
    visibleProxy: {
      get() { return this.visible },
      set(value) { if (!value) this.$emit('close') }
    }
  },
  methods: { close() { this.$emit('close') } }
}
</script>

<style scoped>
.legacy-success { position: relative; display: flex; align-items: center; flex-direction: column; min-height: 374px; padding: 42px 28px 30px; box-sizing: border-box; }
.legacy-success__close { position: absolute; top: 4px; right: 6px; }
.legacy-success__icon { display: flex; align-items: center; justify-content: center; width: 60px; height: 60px; border-radius: 50%; background: var(--paw-color-brand, #ffe60f); }
.legacy-success__title { margin-top: 14px; color: #222; font-size: 16px; font-weight: 600; }
.legacy-success__body { margin-top: 38px; color: #666; font-size: 14px; line-height: 20px; text-align: center; white-space: pre-line; }
.legacy-success__benefits { display: flex; gap: 18px; margin-top: 25px; color: #777; font-size: 11px; text-align: center; }
.legacy-success__benefits view { display: flex; align-items: center; flex-direction: column; gap: 7px; }
.legacy-success__action { width: 208px; margin-top: auto; }
</style>
