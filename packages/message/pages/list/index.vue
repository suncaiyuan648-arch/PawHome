<template>
  <view class="notification-page">
    <PawPageNav title="消息" background="#ffffff" fallback-url="/pages/message/index" />
    <view class="notification-content">
      <view class="notification-tabs">
        <view v-for="item in tabs" :key="item.key" class="notification-tab"
          :class="{ 'notification-tab--active': category === item.key }" @tap="selectCategory(item.key)">
          <text>{{ item.label }}</text>
        </view>
      </view>
      <view v-if="actorError" class="notification-state notification-state--auth">
        <text class="notification-state__title">登录后查看消息</text>
        <text class="notification-state__copy">消息只展示当前账号可以读取的通知。</text>
        <button class="notification-action" @tap="goLogin">去登录</button>
      </view>
      <PawEmptyState v-else-if="!items.length" compact title="暂无消息" description="新的业务进度会在这里提醒你" />
      <scroll-view v-else class="notification-list" scroll-y :show-scrollbar="false">
        <view v-for="item in items" :key="item.messageId" class="notification-row" @tap="openMessage(item)">
          <view class="notification-row__main">
            <text class="notification-row__title">{{ item.title }}</text>
            <text class="notification-row__preview">{{ item.preview }}</text>
          </view>
          <text class="notification-row__time">{{ formatTime(item.createdAt) }}</text>
        </view>
      </scroll-view>
      <text v-if="diagnostics" class="notification-diagnostics">{{ diagnostics }}</text>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import PawEmptyState from '@/components/feedback/PawEmptyState.vue'
import { readMessages, resolveMessageDestination, emitMessageDeepLink } from '../../services/messageStore.ts'
import {
  createNotificationListPageMetadata,
  normalizeNotificationRouteOptions,
  type NotificationListPageState,
  type NotificationMessageOpenInput,
} from '../../services/messageListMetadata.ts'
import { saveAuthContinuation } from '@/navigation/authContinuationStorage.ts'

const AUTH_REQUIRED_MESSAGE_ERRORS: ReadonlySet<string> = new Set([
  'AUTH_REQUIRED',
  'NO_ACTOR',
  'ACTOR_PROVIDER_FAILED',
])

function readActorSession(): unknown {
  return typeof uni !== 'undefined' && typeof uni.getStorageSync === 'function'
    ? uni.getStorageSync('PAWHOME_ACTOR_SESSION')
    : null
}

export default defineComponent({
  name: 'NotificationListPage',
  components: { PawPageNav, PawEmptyState },
  data(): NotificationListPageState {
    return createNotificationListPageMetadata(readActorSession)
  },
  onLoad(options: unknown = {}) {
    const routeOptions = normalizeNotificationRouteOptions(options)
    if (routeOptions.category) this.category = routeOptions.category
    this.refresh()
    const messageId = routeOptions.messageId
    if (messageId) this.$nextTick(() => this.openMessage({ messageId }))
  },
  onShow() { this.refresh() },
  methods: {
    refresh() {
      const result = readMessages({ actorProvider: this.actorProvider, category: this.category })
      this.items = result.success ? result.data.items : []
      this.actorError = result.success ? null : result.error
      const skipped = result.diagnostics && result.diagnostics.skipped || []
      this.diagnostics = skipped.length ? '部分消息记录已被安全忽略' : ''
    },
    selectCategory(category: NotificationListPageState['category']) {
      this.category = category
      this.refresh()
    },
    openMessage(item: NotificationMessageOpenInput) {
      if (!item || !item.messageId) return
      const result = resolveMessageDestination(item.messageId, { actorProvider: this.actorProvider })
      if (result.success !== true) {
        const errorCode = result.error?.code || ''
        if (AUTH_REQUIRED_MESSAGE_ERRORS.has(errorCode)) {
          if (!item.deepLink) {
            uni.showToast({ title: '消息目标暂不可用', icon: 'none' })
            return
          }
          const saved = saveAuthContinuation({ target: item.deepLink, messageId: item.messageId, category: item.category })
          if (!saved.success) {
            uni.showToast({ title: '消息目标暂不可用', icon: 'none' })
            return
          }
          uni.navigateTo({ url: '/packages/auth/pages/login/index' })
          return
        }
        uni.showToast({ title: '消息目标暂不可用', icon: 'none' })
        return
      }
      uni.navigateTo({
        url: result.data.target.url,
        success: ({ eventChannel }) => { emitMessageDeepLink(eventChannel, result) },
      })
    },
    goLogin() { uni.navigateTo({ url: '/packages/auth/pages/login/index' }) },
    formatTime(value: NotificationListPageState['items'][number]['createdAt']) {
      const text = value || ''
      return text.length > 16 ? text.slice(5, 16).replace('T', ' ') : text
    },
  },
})
</script>

<style scoped>
.notification-page { min-height: 100vh; box-sizing: border-box; background: #f5f5f5; color: #333; }
.notification-content { box-sizing: border-box; padding: 12px 16px 28px; }
.notification-tabs { display: flex; overflow-x: auto; height: 42px; margin-bottom: 12px; border-bottom: 1px solid #e9e9e9; }
.notification-tab { position: relative; display: flex; min-width: 54px; height: 42px; align-items: center; justify-content: center; color: #999; font-size: 13px; line-height: 18px; }
.notification-tab + .notification-tab { margin-left: 12px; }
.notification-tab--active { color: #222; font-weight: 500; }
.notification-tab--active::after { position: absolute; right: 12px; bottom: -1px; left: 12px; height: 2px; border-radius: 2px; background: #222; content: ''; }
.notification-list { height: calc(100vh - 178px); }
.notification-row { display: flex; min-height: 76px; box-sizing: border-box; align-items: flex-start; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #ededed; background: #fff; }
.notification-row__main { display: flex; min-width: 0; flex-direction: column; padding-right: 12px; }
.notification-row__title { overflow: hidden; color: #222; font-size: 15px; font-weight: 500; line-height: 22px; text-overflow: ellipsis; white-space: nowrap; }
.notification-row__preview { overflow: hidden; margin-top: 4px; color: #777; font-size: 13px; line-height: 20px; text-overflow: ellipsis; white-space: nowrap; }
.notification-row__time { flex: 0 0 auto; color: #aaa; font-size: 11px; line-height: 20px; }
.notification-state { display: flex; min-height: 300px; box-sizing: border-box; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.notification-state__title { color: #555; font-size: 16px; line-height: 23px; }
.notification-state__copy { max-width: 280px; margin-top: 8px; color: #999; font-size: 13px; line-height: 20px; }
.notification-action { height: 36px; margin-top: 16px; padding: 0 18px; border: 0; border-radius: 18px; background: #222; color: #fff; font-size: 13px; line-height: 36px; }
.notification-action::after { border: 0; }
.notification-diagnostics { display: block; margin-top: 12px; color: #999; font-size: 11px; line-height: 16px; text-align: center; }
</style>
