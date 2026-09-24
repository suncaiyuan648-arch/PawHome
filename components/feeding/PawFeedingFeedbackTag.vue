<template>
  <view
    class="feeding-feedback-tag"
    :class="rootClasses"
  >
    <text>{{ text }}</text>
    <slot />
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PawFeedingFeedbackTag',
  options: {
    // #ifdef MP-WEIXIN
    virtualHost: true,
    // #endif
  },
  props: {
    text: { type: String, default: '' },
    tone: { type: String, default: 'progress' },
    variant: { type: String, default: 'feedback' },
  },
  computed: {
    rootClasses() {
      return [`feeding-feedback-tag--${this.variant}`, `feeding-feedback-tag--${this.tone}`]
    },
  },
})
</script>

<style scoped>
.feeding-feedback-tag {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  min-height: 0;
  box-sizing: border-box;
  padding: 2px 5px;
  font-size: 12px;
  line-height: 15px;
  white-space: nowrap;
}

.feeding-feedback-tag--feedback.feeding-feedback-tag--progress {
  background: #f6f6f6;
  color: #384d7b;
}

.feeding-feedback-tag--feedback.feeding-feedback-tag--pending {
  border: 0.5px solid #f4af61;
  border-radius: 5px;
  color: #ed8002;
}

.feeding-feedback-tag--feedback.feeding-feedback-tag--done {
  border: 0.5px solid #4dd79b;
  border-radius: 5px;
  color: #11ca7a;
}

.feeding-feedback-tag--status {
  min-height: 21px;
  height: 21px;
  padding: 0 4px;
  border: 0.5px solid currentColor;
  border-radius: 5px;
  line-height: 1;
}

.feeding-feedback-tag--status.feeding-feedback-tag--blue {
  color: #1292ff;
}

.feeding-feedback-tag--status.feeding-feedback-tag--red {
  color: #ff3838;
}

.feeding-feedback-tag--status.feeding-feedback-tag--green {
  color: #1fcf91;
}

.feeding-feedback-tag--status.feeding-feedback-tag--orange {
  color: #ff9f43;
}
</style>
