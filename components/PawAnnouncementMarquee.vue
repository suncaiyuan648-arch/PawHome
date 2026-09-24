<template>
  <view
    class="paw-announcement"
    :style="{ height: height + 'px' }"
  >
    <!-- 容器高度固定，当前公告移除时只移除内部文字，不会挤动首页布局。 -->
    <view class="paw-announcement__viewport">
      <view
        v-if="currentItem"
        class="paw-announcement__track"
        :animation="animationData"
        @tap="onTap"
      >
        <text
          class="paw-announcement__bubble"
          :style="{
            height: height + 'px',
            background: currentAppearance.background,
            color: currentAppearance.color,
          }"
          ><text :class="{ 'paw-announcement__text--premium': currentAppearance.premium }">{{
            currentItem.text
          }}</text></text
        >
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import {
  extractAnnouncementItems,
  getAnnouncementFeedingWeightJin,
  normalizeAnnouncement,
  type AnnouncementInput,
  type NormalizedAnnouncement,
} from '@/utils/announcementMetadata'

interface AnnouncementMarqueeState {
  announcementQueue: NormalizedAnnouncement[]
  currentItem: NormalizedAnnouncement | null
  animationData: Record<string, unknown>
  viewportWidth: number
  textWidth: number
  pollTimer: ReturnType<typeof setInterval> | null
  finishTimer: ReturnType<typeof setTimeout> | null
  startTimer: ReturnType<typeof setTimeout> | null
  gapTimer: ReturnType<typeof setTimeout> | null
  reconnectTimer: ReturnType<typeof setTimeout> | null
  socketTask: UniNamespace.SocketTask | null
  destroyed: boolean
  isMounted: boolean
  knownIds: Set<string>
}

function readNodeWidth(
  result: UniNamespace.NodeInfo | UniNamespace.NodeInfo[] | null | undefined,
): number {
  const node = Array.isArray(result) ? result[0] : result
  return node?.width ?? 0
}

export default defineComponent({
  name: 'PawAnnouncementMarquee',
  props: {
    // 支持字符串及 { id, text/content, feedingWeightJin }；结构化规格优先。
    items: { type: Array as PropType<AnnouncementInput[]>, default: () => [] },
    height: { type: Number, default: 20 },
    speed: { type: Number, default: 82 },
    gap: { type: Number, default: 900 },
    backgroundColor: { type: String, default: 'linear-gradient(90deg, #fff385 0%, #fffbdc 100%)' },
    color: { type: String, default: '#505050' },
    // 传入接口地址后自动轮询；不传则不发起网络请求。
    pollUrl: { type: String, default: '' },
    pollInterval: { type: Number, default: 30000 },
    // 传入 WebSocket 地址后自动监听消息；轮询和 WS 可以同时开启。
    wsUrl: { type: String, default: '' },
  },
  emits: {
    queued: (queue: NormalizedAnnouncement[]) => Array.isArray(queue),
    finished: (item: NormalizedAnnouncement['raw']) => item !== undefined,
    click: (item: NormalizedAnnouncement['raw'] | null) => item !== undefined,
  },
  data(): AnnouncementMarqueeState {
    return {
      announcementQueue: [],
      currentItem: null,
      animationData: {},
      viewportWidth: 0,
      textWidth: 0,
      pollTimer: null,
      finishTimer: null,
      startTimer: null,
      gapTimer: null,
      reconnectTimer: null,
      socketTask: null,
      destroyed: false,
      isMounted: false,
      knownIds: new Set<string>(),
    }
  },
  computed: {
    currentAppearance() {
      const weight = this.currentItem ? getAnnouncementFeedingWeightJin(this.currentItem.raw) : null
      if (weight === 40) return { background: '#282827', color: '#E0FF89', premium: true }
      if (weight === 4)
        return { background: 'linear-gradient(90deg, #FFF599 0%, #FFFBDC 100%)', color: '#333333' }
      if (weight === 0.4) return { background: '#FFFBDC', color: '#505050' }
      return { background: this.backgroundColor, color: this.color }
    },
  },
  watch: {
    items: {
      deep: true,
      immediate: true,
      handler(value: AnnouncementInput[]) {
        this.enqueue(value)
      },
    },
  },
  mounted() {
    this.destroyed = false
    this.isMounted = true
    this.$nextTick(() => this.startNext())
    this.startDataSources()
  },
  beforeUnmount() {
    this.cleanup()
  },
  methods: {
    enqueue(value: unknown) {
      const incoming = extractAnnouncementItems(value)

      incoming.forEach((item) => {
        const normalized = normalizeAnnouncement(item)
        if (!normalized || this.knownIds.has(normalized.id)) return
        this.knownIds.add(normalized.id)
        this.announcementQueue.push(normalized)
      })

      if (this.isMounted && !this.currentItem) this.startNext()
      this.$emit('queued', this.announcementQueue.slice())
    },

    startNext() {
      if (this.destroyed || this.currentItem || !this.announcementQueue.length) return
      if (this.gapTimer) {
        clearTimeout(this.gapTimer)
        this.gapTimer = null
      }

      this.currentItem = this.announcementQueue[0]
      this.animationData = {}

      this.$nextTick(() => {
        if (this.destroyed || !this.currentItem) return
        this.measureAndPlay()
      })
    },

    measureAndPlay() {
      const query = uni.createSelectorQuery()
      // #ifdef MP-WEIXIN
      query.in(this)
      // #endif
      query
        .select('.paw-announcement__viewport')
        .boundingClientRect((viewport) => {
          this.viewportWidth = readNodeWidth(viewport) || 375
        })
        .select('.paw-announcement__bubble')
        .boundingClientRect((text) => {
          this.textWidth = readNodeWidth(text)
        })
        .exec(() => {
          if (this.destroyed || !this.currentItem) return
          // 部分基础库首次查询文本宽度会返回 0，使用字号估算兜底，避免动画距离为零。
          if (!this.textWidth) this.textWidth = Math.max(12, this.currentItem.text.length * 13 + 12)
          const distance = Math.max(1, this.viewportWidth + this.textWidth)
          const duration = Math.max(1600, Math.round((distance / Math.max(1, this.speed)) * 1000))

          // 微信小程序对运行时 inline transition 支持不稳定，改用原生 animation 指令。
          const animation = uni.createAnimation({
            duration: 0,
            timingFunction: 'linear',
            delay: 0,
            transformOrigin: '0 50%',
          })
          animation.translateX(this.viewportWidth).step({ duration: 0 })
          this.animationData = animation.export()

          if (this.startTimer) clearTimeout(this.startTimer)
          this.startTimer = setTimeout(() => {
            if (this.destroyed || !this.currentItem) return
            const movingAnimation = uni.createAnimation({
              duration,
              timingFunction: 'linear',
              delay: 0,
              transformOrigin: '0 50%',
            })
            movingAnimation.translateX(-this.textWidth).step()
            this.animationData = movingAnimation.export()
            if (this.finishTimer) clearTimeout(this.finishTimer)
            this.finishTimer = setTimeout(() => this.finishCurrent(), duration + 80)
          }, 80)
        })
    },

    finishCurrent() {
      if (this.destroyed || !this.currentItem) return
      const finished = this.currentItem
      if (this.announcementQueue[0] && this.announcementQueue[0].id === finished.id) {
        this.announcementQueue.shift()
      } else {
        const index = this.announcementQueue.findIndex((item) => item.id === finished.id)
        if (index >= 0) this.announcementQueue.splice(index, 1)
      }

      this.currentItem = null
      this.animationData = {}
      this.$emit('finished', finished.raw)

      if (this.gapTimer) clearTimeout(this.gapTimer)
      this.gapTimer = setTimeout(
        () => {
          this.gapTimer = null
          this.startNext()
        },
        Math.max(0, this.gap),
      )
    },

    startDataSources() {
      if (this.pollUrl && this.pollInterval > 0) {
        this.pollOnce()
        this.pollTimer = setInterval(() => this.pollOnce(), this.pollInterval)
      }
      if (this.wsUrl) this.connectSocket()
    },

    pollOnce() {
      if (this.destroyed || !this.pollUrl) return
      uni.request({
        url: this.pollUrl,
        method: 'GET',
        success: (response) => {
          const payload: unknown = response.data
          if (!this.destroyed) this.enqueue(payload)
        },
      })
    },

    connectSocket() {
      if (this.destroyed || !this.wsUrl || !uni.connectSocket) return
      try {
        this.socketTask = uni.connectSocket({ url: this.wsUrl, success: () => {} })
        if (!this.socketTask) return
        this.socketTask.onMessage((event: UniNamespace.OnSocketMessageCallbackResult<unknown>) => {
          const payload: unknown = event.data
          if (!this.destroyed) this.enqueue(payload)
        })
        this.socketTask.onClose(() => {
          this.socketTask = null
          if (!this.destroyed && this.wsUrl) {
            if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
            this.reconnectTimer = setTimeout(() => this.connectSocket(), 5000)
          }
        })
      } catch {
        // 网络源是可选能力，连接失败不影响首页其他内容。
      }
    },

    onTap() {
      this.$emit('click', this.currentItem ? this.currentItem.raw : null)
    },

    cleanup() {
      if (this.destroyed) return
      this.destroyed = true
      this.isMounted = false
      if (this.pollTimer !== null) clearInterval(this.pollTimer)
      this.pollTimer = null
      const timers = [this.finishTimer, this.startTimer, this.gapTimer, this.reconnectTimer]
      timers.forEach((timer) => {
        if (timer !== null) clearTimeout(timer)
      })
      this.finishTimer = null
      this.startTimer = null
      this.gapTimer = null
      this.reconnectTimer = null
      if (this.socketTask) {
        try {
          this.socketTask.close({})
        } catch {
          // Socket shutdown is best-effort during component teardown.
        }
      }
      this.socketTask = null
    },
  },
})
</script>

<style lang="scss" scoped>
.paw-announcement {
  position: relative;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  background: transparent;
}

.paw-announcement__viewport {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  white-space: nowrap;
}

.paw-announcement__track {
  position: absolute;
  left: 0;
  top: 0;
  display: inline-flex;
  align-items: center;
  height: 20px;
  margin: 0;
  white-space: nowrap;
  will-change: transform;
}

.paw-announcement__bubble {
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  padding: 0 6px;
  border-radius: 4px;
  font-family: var(
    --paw-font-family,
    -apple-system,
    BlinkMacSystemFont,
    'PingFang SC',
    'Microsoft YaHei',
    sans-serif
  );
  font-size: 13px;
  font-weight: 400;
  line-height: 11px;
  text-align: center;
  white-space: nowrap;
}

.paw-announcement__text--premium {
  background: linear-gradient(90deg, #e0ff89 0%, #ffed48 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
