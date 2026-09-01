<template>
  <PawBottomSheet v-model:visible="visibleProxy" variant="composer" :close-on-mask="true" :safe-area="false"
    :z-index="10030" @after-close="onAfterClose">
    <textarea class="reply-composer-sheet__textarea" :value="text" :placeholder="placeholderText"
      placeholder-class="reply-composer-sheet__placeholder" :maxlength="maxlength" :show-confirm-bar="false"
      :adjust-position="true" auto-height @input="onInput" />
    <view class="reply-composer-sheet__bar">
      <view class="reply-composer-sheet__tools">
        <view class="reply-composer-sheet__hit" @tap.stop="$emit('voice')">
          <PawIcon name="actions/composer-voice" :size="28" />
        </view>
        <view class="reply-composer-sheet__hit" @tap.stop="$emit('pick-image')">
          <PawIcon name="actions/composer-emoji" :size="28" />
        </view>
      </view>
      <PawButton class="reply-composer-sheet__send" tone="brand-soft" size="xs" :disabled="!hasText" text="发送"
        @click="onSend" />
    </view>
  </PawBottomSheet>
</template>

<script>
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import PawButton from '@/components/base/PawButton.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'

export default {
  name: 'ReplyComposerSheet',
  components: { PawBottomSheet, PawButton, PawIcon },
  props: {
    visible: { type: Boolean, default: false },
    maxlength: { type: Number, default: 500 },
    replyToName: { type: String, default: '' }
  },
  emits: ['update:visible', 'send', 'voice', 'pick-image'],
  data() { return { text: '' } },
  computed: {
    hasText() { return this.text.trim().length > 0 },
    placeholderText() { return this.replyToName ? `回复 @${this.replyToName}：` : '说点什么' },
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
.reply-composer-sheet__textarea {
  display: block;
  width: 100%;
  min-height: 100px;
  margin: 0;
  padding: 12px;
  box-sizing: border-box;
  border-radius: 13px;
  background: var(--paw-color-input, #f4f4f5);
  color: #333;
  font-size: 13px;
  line-height: 18px;
}

.reply-composer-sheet__placeholder {
  color: #bdbdc0;
  font-size: 13px;
}

.reply-composer-sheet__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
}

.reply-composer-sheet__tools {
  display: flex;
  align-items: center;
  gap: 4px;
}

.reply-composer-sheet__hit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.reply-composer-sheet__send {
  padding: 0;
}
</style>
