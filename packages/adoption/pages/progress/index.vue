<template>
  <view
    class="adoption-progress-page"
    :class="{ 'has-footer': primaryAction }"
  >
    <PawPageNav
      :title="navTitle"
      :background="navBackground"
      fallback-url="/packages/adoption/pages/mine/index"
    />

    <scroll-view
      class="adoption-progress-page__scroll"
      scroll-y
      :show-scrollbar="false"
    >
      <view
        v-if="loading"
        class="adoption-progress-page__state"
        data-qa="qa-adoption-progress-loading"
      >
        <text>正在读取领养申请…</text>
      </view>
      <view
        v-else-if="loadError"
        class="adoption-progress-page__state adoption-progress-page__state--empty"
        data-qa="qa-adoption-progress-empty"
      >
        <PawIcon
          name="navigation/clock"
          :size="22"
          color="#999"
        />
        <text>{{ loadError }}</text>
        <text class="adoption-progress-page__state-hint">请从“我的领养”重新打开对应申请。</text>
      </view>
      <AdoptionProgressView
        v-else-if="record"
        :record="record"
        :view="view"
        :presentation="presentation"
      />
    </scroll-view>

    <PawFixedActionBar
      v-if="primaryAction"
      :primary-action="primaryAction"
      primary-full-width
      @primary="onPrimaryAction"
    />
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import PawFixedActionBar from '@/components/layout/PawFixedActionBar.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import { buildRoute } from '@/navigation/routeContracts.ts'
import AdoptionProgressView from '../../components/AdoptionProgressView.vue'
import { beginReward, readAdoptionProgress, statusPresentation } from '../../services/progress.ts'
import {
  createAdoptionProgressPageState,
  createAdoptionProgressPrimaryAction,
  isAdoptionProgressPrimaryAction,
  normalizeAdoptionProgressRecord,
  resolveAdoptionProgressRoute,
  type AdoptionProgressPageState,
} from '../../services/progressPageMetadata.ts'

export default defineComponent({
  name: 'AdoptionProgressPage',
  components: { PawPageNav, PawFixedActionBar, PawIcon, AdoptionProgressView },
  data(): AdoptionProgressPageState {
    return createAdoptionProgressPageState()
  },
  computed: {
    presentation() {
      return statusPresentation(this.record)
    },
    navTitle() {
      if (this.view === 'adoption-info') return '领养信息'
      if (this.view === 'application') return '申请内容'
      return '领养进度'
    },
    navBackground() {
      return this.view === 'adoption-info'
        ? '#f5f5f5'
        : 'linear-gradient(to bottom, #fffcdc 0%, #fff 13.225%, #f5f5f5 21.49%, #f5f5f5 100%)'
    },
    primaryAction() {
      return this.record ? createAdoptionProgressPrimaryAction(this.presentation, this.view) : null
    },
  },
  onLoad(options: unknown = {}) {
    const route = resolveAdoptionProgressRoute(options)
    if (!route.ok) {
      this.applicationId = ''
      this.view = 'progress'
      this.loadError = route.message
      this.record = null
      return
    }
    this.applicationId = route.applicationId
    this.view = route.view
    this.loadRecord()
  },
  onShow() {
    if (this.applicationId) this.loadRecord()
  },
  methods: {
    loadRecord() {
      this.loading = true
      this.loadError = ''
      this.record = null
      const result = readAdoptionProgress(this.applicationId, { actorProvider: this.actorProvider })
      this.loading = false
      if (!result.success) {
        this.loadError =
          result.error && result.error.code === 'MISSING_ID'
            ? '缺少领养申请 ID'
            : (result.error && result.error.message) || '找不到这条领养申请'
        return
      }
      this.record = normalizeAdoptionProgressRecord(result.data)
    },
    onPrimaryAction(action: import('@/components/layout/PawFixedActionBar.vue').PawFixedAction) {
      if (!isAdoptionProgressPrimaryAction(action) || !this.record || !this.applicationId) return
      if (action.key === 'confirm-adoption') {
        uni.navigateTo({
          url: buildRoute('adoption.confirmation', { applicationId: this.applicationId }),
        })
        return
      }
      if (action.key === 'claim-reward') {
        const result = beginReward(this.applicationId, { actorProvider: this.actorProvider })
        if (!result.success) {
          uni.showToast({
            title: (result.error && result.error.message) || '暂时无法领取奖励',
            icon: 'none',
          })
          return
        }
        this.record = normalizeAdoptionProgressRecord(result.data)
        uni.navigateTo({
          url: `/packages/adoption/pages/reward/claim/index?applicationId=${encodeURIComponent(this.applicationId)}`,
        })
      }
    },
  },
})
</script>

<style scoped>
.adoption-progress-page {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  background: linear-gradient(to bottom, #fffcdc 0%, #fff 13.225%, #f5f5f5 21.49%, #f5f5f5 100%);
  color: #333;
  font-family: var(--paw-font-family, -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif);
}

.adoption-progress-page__scroll {
  min-height: 0;
  flex: 1;
  box-sizing: border-box;
}

.adoption-progress-page.has-footer .adoption-progress-page__scroll {
  padding-bottom: calc(100px + env(safe-area-inset-bottom));
}

.adoption-progress-page__state {
  display: flex;
  min-height: 240px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  padding: 24px;
  box-sizing: border-box;
  color: #777;
  font-size: 15px;
  line-height: 22px;
  text-align: center;
}

.adoption-progress-page__state-hint {
  color: #aaa;
  font-size: 13px;
  line-height: 20px;
}

.adoption-progress-page__state--empty {
  color: #666;
}
</style>
