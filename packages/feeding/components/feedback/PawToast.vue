<template>
  <view
    v-if="visible && currentMessage"
    class="paw-toast"
    data-qa="paw-toast"
    role="status"
    aria-live="polite"
    :style="toastStyle"
  >
    <text class="paw-toast__text">{{ currentMessage }}</text>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { getWechatNavLayout, type WechatNavLayout } from '@/utils/navLayout.ts'

interface PawToastState {
  visible: boolean
  currentMessage: string
  nav: WechatNavLayout
  timer: ReturnType<typeof setTimeout> | null
}

export default defineComponent({
  name: 'PawToast',
  options: {
    // #ifdef MP-WEIXIN
    virtualHost: true,
    // #endif
  },
  props: {
    duration: { type: Number, default: 1800 },
    offsetTop: { type: Number, default: 40 },
  },
  data(): PawToastState {
    return {
      visible: false,
      currentMessage: '',
      nav: getWechatNavLayout(),
      timer: null,
    }
  },
  computed: {
    toastStyle() {
      return { top: `${this.nav.totalHeight + this.offsetTop}px` }
    },
  },
  beforeUnmount() {
    this.clearTimer()
  },
  methods: {
    show(message: string, duration?: number) {
      const text = String(message || '').trim()
      if (!text) return
      this.clearTimer()
      this.currentMessage = text
      this.visible = true
      this.timer = setTimeout(
        () => this.hide(),
        Math.max(0, Number(duration ?? this.duration) || 0),
      )
    },
    hide() {
      this.clearTimer()
      this.visible = false
      this.currentMessage = ''
    },
    clearTimer() {
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }
    },
  },
})
</script>

<style scoped>
.paw-toast {
  position: fixed;
  left: 50%;
  z-index: var(--paw-z-toast, 600);
  display: flex;
  max-width: calc(100vw - 48px);
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 8px 14px;
  border-radius: 8px;
  background: rgba(31, 31, 31, 0.92);
  transform: translateX(-50%);
  pointer-events: none;
}

.paw-toast__text {
  overflow: hidden;
  color: #ffffff;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
