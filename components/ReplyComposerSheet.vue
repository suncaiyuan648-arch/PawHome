<template>
  <PawBottomSheet
    v-model:visible="visibleProxy"
    variant="composer"
    :close-on-mask="true"
    :safe-area="true"
    :z-index="10030"
    @after-close="onAfterClose"
  >
    <textarea
      class="reply-composer-sheet__textarea"
      :value="text"
      placeholder="说点什么"
      placeholder-class="reply-composer-sheet__placeholder"
      :maxlength="maxlength"
      :show-confirm-bar="false"
      :adjust-position="true"
      auto-height
      @input="onInput"
    />
    <view class="reply-composer-sheet__bar">
      <view class="reply-composer-sheet__tools">
        <view class="reply-composer-sheet__hit" @tap.stop="$emit('voice')"><image src="/static/figma/dynamic-detail/composer-voice.svg" mode="aspectFit" /></view>
        <view class="reply-composer-sheet__hit" @tap.stop="$emit('pick-image')"><image src="/static/figma/dynamic-detail/composer-emoji.svg" mode="aspectFit" /></view>
      </view>
      <PawButton class="reply-composer-sheet__send" tone="brand-soft" size="xs" :disabled="!hasText" text="发送" @click="onSend" />
    </view>
  </PawBottomSheet>
</template>

<script>
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import PawButton from '@/components/base/PawButton.vue'

export default {
  name: 'ReplyComposerSheet',
  components: { PawBottomSheet, PawButton },
  props: { visible: { type: Boolean, default: false }, maxlength: { type: Number, default: 500 } },
  emits: ['update:visible', 'send', 'voice', 'pick-image'],
  data() { return { text: '' } },
  computed: {
    hasText() { return this.text.trim().length > 0 },
    visibleProxy: {
      get() { return this.visible },
      set(value) { this.$emit('update:visible', value) }
    }
  },
  watch: { visible(value) { if (value) this.text = '' } },
  methods: {
    onInput(event) { this.text = event.detail.value || '' },
    onSend() { const value = this.text.trim(); if (!value) return; this.$emit('send', value); this.$emit('update:visible', false) },
    onAfterClose() { this.text = '' }
  }
}
</script>

<style scoped>
.reply-composer-sheet__textarea { display: block; width: calc(100% - 24px); min-height: 100px; margin: 8px 12px 0; padding: 12px; box-sizing: border-box; border-radius: 13px; background: var(--paw-color-input, #f4f4f5); color: #333; font-size: 13px; line-height: 18px; }
.reply-composer-sheet__placeholder { color: #bdbdc0; font-size: 13px; }
.reply-composer-sheet__bar { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px 12px; }
.reply-composer-sheet__tools { display: flex; align-items: center; gap: 4px; }
.reply-composer-sheet__hit { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; }
.reply-composer-sheet__hit image { width: 17px; height: 17px; }
.reply-composer-sheet__hit:first-child image { width: 13px; height: 17px; }
.reply-composer-sheet__send { width: 54px; padding: 0; }
</style>
