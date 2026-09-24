<template>
  <view class="task-page">
    <PawPageNav title="我的任务" background="#f5f5f5" />
    <view class="task-content">
      <view class="task-summary" data-qa="qa-account-tasks-summary">
        <text class="task-summary__title">任务中心</text>
        <text class="task-summary__copy">只展示当前账号可读取的业务任务</text>
      </view>

      <view class="task-tabs" data-qa="qa-account-tasks-tabs">
        <view v-for="tab in tabs" :key="tab.key" class="task-tab" :class="{ 'task-tab--active': activeTab === tab.key }"
          :data-qa="`qa-account-tasks-tab-${tab.key}`" @tap="activeTab = tab.key">
          <text>{{ tab.label }}</text>
          <text v-if="tab.key === 'pending' && pendingCount" class="task-tab__count">{{ pendingCount }}</text>
        </view>
      </view>

      <view v-if="actorError" class="task-state task-state--auth" data-qa="qa-account-tasks-auth-required">
        <text class="task-state__title">暂时无法读取任务</text>
        <text class="task-state__copy">当前账号还没有可验证的身份信息，请完成登录后重试。</text>
        <button class="task-state__action" data-qa="qa-account-tasks-login" @tap="goLogin">去登录</button>
      </view>

      <PawEmptyState v-else-if="!visibleTasks.length" compact title="暂无任务" description="新的业务进度会显示在这里" />

      <scroll-view v-else class="task-list" scroll-y :show-scrollbar="false" data-qa="qa-account-tasks-list">
        <view v-for="task in visibleTasks" :key="task.taskId" class="task-card" :data-qa="`qa-account-task-${task.taskId}`"
          @tap="onTaskTap(task)">
          <view class="task-card__head">
            <view class="task-card__title-wrap">
              <text class="task-card__business">{{ task.businessLabel }}</text>
              <text class="task-card__action">{{ task.actionLabel }}</text>
            </view>
            <PawStatusPill :text="task.statusLabel" :tone="statusTone(task.status)" variant="outline" />
          </view>
          <view class="task-card__meta">
            <text>业务编号 {{ task.businessId }}</text>
            <text v-if="task.reviewItemId">审核项 {{ task.reviewItemId }}</text>
          </view>
          <view class="task-card__footer">
            <text class="task-card__role">{{ roleLabel(task.actorRole) }}</text>
            <text class="task-card__hint">{{ canOpen(task) ? '查看详情' : '详情待接入' }}</text>
          </view>
        </view>
      </scroll-view>

      <text v-if="diagnosticText" class="task-diagnostics" data-qa="qa-account-tasks-diagnostics">{{ diagnosticText }}</text>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import PawEmptyState from '@/components/feedback/PawEmptyState.vue'
import PawStatusPill from '@/components/PawStatusPill.vue'
import {
	createAccountTaskPageState,
	filterAccountTaskCards,
	getAccountTaskRoleLabel,
	getAccountTaskStatusTone,
	type AccountTaskCard,
	type AccountTaskPageState,
} from '../../services/taskListMetadata.ts'
import { readAccountTasks } from '../../services/tasksRuntime.ts'
import { taskCards, taskDetailTarget } from '../../services/taskPageModel.ts'
import { buildRoute } from '@/navigation/routeContracts.ts'

// The canonical createTaskAdapter/createActorProvider/createDomainTaskReaders
// contracts remain the source-level governance seam.  The page binds to the
// package-local runtime so registering this subpackage cannot hoist the root
// adoption/rescue adapters into the 1.5 MiB main package.

export default defineComponent({
  name: 'AccountTasksPage',
  components: { PawPageNav, PawEmptyState, PawStatusPill },
  data(): AccountTaskPageState {
    return createAccountTaskPageState(() => readAccountTasks())
  },
  computed: {
    visibleTasks(): AccountTaskCard[] {
      return filterAccountTaskCards(this.cards, this.activeTab)
    },
  },
  onShow() {
    this.refresh()
  },
  methods: {
    refresh() {
      const result = this.adapter.read()
      this.model = result
      this.cards = taskCards(result.all)
      this.pendingCount = result.pending.length
      this.actorError = result.diagnostics.actorError
      const skipped = result.diagnostics.skipped
      this.diagnosticText = skipped.length ? '部分业务域暂未提供可读取的持久任务' : ''
    },
    statusTone(status: AccountTaskCard['status']) {
      return getAccountTaskStatusTone(status)
    },
    roleLabel(role: AccountTaskCard['actorRole']) {
      return getAccountTaskRoleLabel(role)
    },
    canOpen(task: AccountTaskCard) {
      return Boolean(taskDetailTarget(task))
    },
    onTaskTap(task: AccountTaskCard) {
      const target = taskDetailTarget(task)
      if (!target) {
        uni.showToast({ title: '该任务详情暂未接入', icon: 'none' })
        return
      }
      uni.navigateTo({ url: buildRoute(target.routeName, target.params) })
    },
    goLogin() {
      uni.navigateTo({ url: '/packages/auth/pages/login/index' })
    },
  },
})
</script>

<style scoped>
.task-page { min-height: 100vh; box-sizing: border-box; background: #f5f5f5; color: #333; }
.task-content { box-sizing: border-box; padding: 18px 16px 32px; }
.task-summary { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
.task-summary__title { color: #222; font-size: 20px; font-weight: 500; line-height: 28px; }
.task-summary__copy { color: #888; font-size: 13px; line-height: 18px; }
.task-tabs { display: flex; height: 44px; margin-bottom: 12px; border-bottom: 1px solid #eaeaea; }
.task-tab { position: relative; display: flex; min-width: 84px; height: 44px; align-items: center; justify-content: center; color: #888; font-size: 14px; line-height: 20px; }
.task-tab--active { color: #222; font-weight: 500; }
.task-tab--active::after { position: absolute; right: 22px; bottom: -1px; left: 22px; height: 2px; border-radius: 2px; background: #222; content: ''; }
.task-tab__count { display: inline-flex; min-width: 16px; height: 16px; margin-left: 4px; align-items: center; justify-content: center; border-radius: 8px; background: #ff5864; color: #fff; font-size: 10px; line-height: 16px; }
.task-list { height: calc(100vh - 190px); }
.task-card { box-sizing: border-box; margin-bottom: 12px; padding: 16px; border-radius: 10px; background: #fff; }
.task-card__head, .task-card__footer, .task-card__meta { display: flex; align-items: center; justify-content: space-between; }
.task-card__title-wrap { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
.task-card__business { color: #888; font-size: 12px; line-height: 17px; }
.task-card__action { overflow: hidden; color: #222; font-size: 16px; font-weight: 500; line-height: 23px; text-overflow: ellipsis; white-space: nowrap; }
.task-card__meta { margin-top: 12px; flex-wrap: wrap; gap: 4px 12px; color: #999; font-size: 12px; line-height: 17px; }
.task-card__footer { margin-top: 14px; padding-top: 10px; border-top: 1px solid #f0f0f0; }
.task-card__role { color: #777; font-size: 12px; line-height: 17px; }
.task-card__hint { color: #555; font-size: 12px; line-height: 17px; }
.task-state { display: flex; min-height: 260px; box-sizing: border-box; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.task-state__title { color: #555; font-size: 15px; line-height: 22px; }
.task-state__copy { max-width: 280px; margin-top: 6px; color: #999; font-size: 13px; line-height: 19px; }
.task-state__action { height: 36px; margin-top: 16px; padding: 0 18px; border: 0; border-radius: 18px; background: #222; color: #fff; font-size: 13px; line-height: 36px; }
.task-state__action::after { border: 0; }
.task-diagnostics { display: block; margin-top: 12px; color: #999; font-size: 11px; line-height: 16px; text-align: center; }
</style>
