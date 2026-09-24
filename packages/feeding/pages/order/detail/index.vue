<template>
  <PawFeedingDetailFigma
    v-if="useFigma"
    :variant="figmaVariant || (detailPerspective === 'yard-owner' ? 91 : 90)"
    :perspective="detailPerspective"
    :order-detail="mockDetail"
    :order-id="orderId"
    :record-id="recordId"
    :delivery-status="deliveryStatus"
    :delivery-progress="deliveryProgress"
    :show-feedback="detailPerspective === 'yard-owner' || figmaVariant === 91"
    @feedback="onFeedback"
  />
  <view
    v-else
    class="order-page"
    data-qa="qa-feeding-order-detail"
  >
    <PawPageNav
      title="订单详情"
      :title-centered="true"
      background="#f5f5f5"
      fallback-url="/pages/me/index"
    />
    <scroll-view
      class="order-scroll"
      scroll-y
      :show-scrollbar="false"
    >
      <view
        v-if="hidden"
        class="order-state order-state--hidden"
        data-qa="qa-feeding-order-hidden"
      >
        <text class="order-state__title">订单已隐藏</text>
        <text class="order-state__copy"
          >隐藏只影响当前账号的列表展示，小院履约记录不会被修改。</text
        >
        <button
          class="order-action"
          data-qa="qa-feeding-order-unhide"
          @tap="toggleHidden(false)"
        >
          恢复显示
        </button>
      </view>
      <view
        v-else-if="model && model.data && model.data.order"
        class="order-content"
      >
        <view
          class="order-card"
          data-qa="qa-feeding-order-summary"
        >
          <view class="order-card__head">
            <view>
              <text class="order-card__type">{{ orderTypeLabel(model.data.order.orderType) }}</text>
              <text class="order-card__id">订单 {{ model.data.order.orderId }}</text>
            </view>
            <PawStatusPill
              :text="statusLabel(model.data.order.status)"
              :tone="statusTone(model.data.order.status)"
            />
          </view>
          <view class="order-facts">
            <text v-if="model.data.order.yardId">小院：{{ model.data.order.yardId }}</text>
            <text v-if="model.data.order.animalId">动物：{{ model.data.order.animalId }}</text>
            <text v-if="model.data.order.applicationId"
              >领养申请：{{ model.data.order.applicationId }}</text
            >
            <text v-if="model.data.order.createdAt"
              >创建时间：{{ model.data.order.createdAt }}</text
            >
          </view>
        </view>
        <view
          class="order-card"
          data-qa="qa-feeding-order-access"
        >
          <text class="order-card__title">订单可见性</text>
          <text class="order-card__copy"
            >当前订单仅展示当前账号有权限读取的摘要。隐藏是个人展示偏好，不会删除订单。</text
          >
          <button
            class="order-action order-action--muted"
            data-qa="qa-feeding-order-hide"
            @tap="toggleHidden(true)"
          >
            隐藏订单
          </button>
        </view>
      </view>
      <view
        v-else
        class="order-state"
        data-qa="qa-feeding-order-empty"
      >
        <text class="order-state__title">订单详情暂不可用</text>
        <text class="order-state__copy">请从“我的投喂”或消息中的有效订单链接进入。</text>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import PawStatusPill from '@/components/PawStatusPill.vue'
import PawFeedingDetailFigma from '../../../components/PawFeedingDetailFigma.vue'
import {
  getFeedingOrderDetail,
  type FeedingOrderDetail,
  type FeedingOrderDetailPerspective,
} from '../../../services/orderMockApi.ts'
import { readPersistedOrderDetail } from '../../../services/orderRuntime.ts'
import { readOrderVisibility, setOrderHidden } from '../../../services/orderVisibilityStorage.ts'

type FeedingOrderDetailModel = Extract<
  Awaited<ReturnType<typeof readPersistedOrderDetail>>,
  { success: true }
>
type PersistedOrderType = FeedingOrderDetailModel['data']['order']['orderType']
type FeedingOrderFigmaVariant = 0 | 90 | 91 | 92

interface FeedingOrderDetailPageState {
  orderId: string
  recordId: string
  model: FeedingOrderDetailModel | null
  mockDetail: FeedingOrderDetail | null
  hidden: boolean
  useFigma: boolean
  figmaVariant: FeedingOrderFigmaVariant
  detailPerspective: FeedingOrderDetailPerspective | ''
  deliveryStatus: string
  deliveryProgress: string
  legacyMode: boolean
  actorProvider: () => unknown
}

const ORDER_STATUS_LABELS: Readonly<Record<string, string>> = Object.freeze({
  shipping: '运输中',
  delivered: '已送达',
  completed: '已完成',
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export default defineComponent({
  name: 'FeedingOrderDetailPage',
  components: { PawPageNav, PawStatusPill, PawFeedingDetailFigma },
  data(): FeedingOrderDetailPageState {
    return {
      orderId: '',
      recordId: '',
      model: null,
      mockDetail: null,
      hidden: false,
      useFigma: false,
      figmaVariant: 0,
      detailPerspective: '',
      deliveryStatus: 'shipping',
      deliveryProgress: '0/3',
      legacyMode: false,
      actorProvider: () =>
        typeof uni !== 'undefined' ? uni.getStorageSync('PAWHOME_ACTOR_SESSION') : null,
    }
  },
  onLoad(options: unknown = {}) {
    this.orderId = this.readOption(options, ['orderId', 'id', 'recordId'])
    this.recordId = this.readOption(options, ['recordId', 'id', 'orderId'])
    this.detailPerspective = this.normalizePerspective(
      this.readOption(options, ['perspective', 'type']),
    )
    this.figmaVariant = this.normalizeVariant(this.readOption(options, ['variant']))
    if (!this.figmaVariant && this.detailPerspective)
      this.figmaVariant = this.detailPerspective === 'yard-owner' ? 91 : 90
    this.legacyMode = Boolean(this.figmaVariant || this.detailPerspective)
    this.deliveryStatus = this.readOption(options, ['deliveryStatus']) || 'shipping'
    this.deliveryProgress = this.readOption(options, ['deliveryProgress']) || '0/3'
    this.refresh()
  },
  onShow() {
    if (this.orderId) this.refresh()
  },
  methods: {
    readOption(options: unknown, names: readonly string[]): string {
      if (!isRecord(options)) return ''
      for (const name of names) {
        const value = options[name]
        if (value !== undefined && value !== null && String(value).trim())
          return String(value).trim()
      }
      return ''
    },
    normalizeVariant(value: string): FeedingOrderFigmaVariant {
      const variant = Number(value)
      return variant === 90 || variant === 91 || variant === 92 ? variant : 0
    },
    normalizePerspective(value: string): FeedingOrderDetailPerspective | '' {
      const perspective = String(value || '')
      if (['yard-manager', 'yard-owner', 'yard', 'owner'].includes(perspective)) return 'yard-owner'
      if (['donor', 'cloud-parent', 'cloud', 'mine'].includes(perspective)) return 'cloud-parent'
      return ''
    },
    refresh() {
      const visibility = readOrderVisibility({
        actorProvider: this.actorProvider,
        orderId: this.orderId,
      })
      this.hidden = Boolean(
        visibility.success &&
        visibility.data.items.some((item) => item.orderId === this.orderId && item.hidden),
      )
      if (this.hidden) {
        this.model = null
        this.mockDetail = null
        this.useFigma = false
        return
      }
      readPersistedOrderDetail(this.orderId, {
        actorProvider: this.actorProvider,
        hiddenEntries: visibility.success ? visibility.data.items : [],
      })
        .then((result) => {
          if (result && result.success) {
            this.model = result
            this.mockDetail = null
            this.useFigma = false
            return
          }
          this.loadLegacyMock()
        })
        .catch(() => this.loadLegacyMock())
    },
    loadLegacyMock() {
      if (!this.legacyMode) {
        this.model = null
        this.mockDetail = null
        this.useFigma = false
        return
      }
      getFeedingOrderDetail({
        type: this.detailPerspective || (this.figmaVariant === 91 ? 'yard-owner' : 'cloud-parent'),
        orderId: this.orderId,
      })
        .then((result) => {
          if (result && result.success) {
            this.model = null
            this.mockDetail = result.data
            this.useFigma = true
          } else {
            this.model = null
            this.mockDetail = null
            this.useFigma = false
          }
        })
        .catch(() => {
          this.model = null
          this.mockDetail = null
          this.useFigma = false
        })
    },
    toggleHidden(hidden: boolean) {
      const result = setOrderHidden(this.orderId, hidden, { actorProvider: this.actorProvider })
      if (!result.success) {
        uni.showToast({ title: '订单状态未保存', icon: 'none' })
        return
      }
      this.hidden = hidden
      if (!hidden) this.refresh()
      uni.showToast({ title: hidden ? '已隐藏订单' : '已恢复显示', icon: 'none' })
    },
    onFeedback(detail: FeedingOrderDetail) {
      const value = detail
      const query = [
        'type=yard-owner',
        'yardOwnerId=' + encodeURIComponent(value.yardOwnerId || 'yard-owner-1'),
        'yardId=' + encodeURIComponent(value.yardId || '1'),
        'orderId=' + encodeURIComponent(value.orderId || this.orderId || ''),
      ].join('&')
      uni.navigateTo({ url: '/packages/dynamic/pages/editor/index?' + query })
    },
    orderTypeLabel(type: PersistedOrderType) {
      return type === 'adoption_gift' ? '领养赠礼' : '普通投喂'
    },
    statusLabel(status: string) {
      return ORDER_STATUS_LABELS[status] || '处理中'
    },
    statusTone(status: string): 'success' | 'brand' | 'warning' {
      return status === 'completed' ? 'success' : status === 'delivered' ? 'brand' : 'warning'
    },
  },
})
</script>

<style scoped>
.order-page {
  min-height: 100vh;
  box-sizing: border-box;
  background: #f5f5f5;
  color: #333;
}
.order-scroll {
  box-sizing: border-box;
  min-height: 0;
  height: calc(100vh - 44px);
  padding: 12px 16px 28px;
}
.order-card {
  margin-bottom: 12px;
  padding: 16px;
  border-radius: 10px;
  background: #fff;
}
.order-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.order-card__type,
.order-card__id,
.order-card__title,
.order-card__copy,
.order-facts {
  display: block;
}
.order-card__type {
  color: #222;
  font-size: 17px;
  font-weight: 500;
  line-height: 24px;
}
.order-card__id {
  margin-top: 4px;
  color: #999;
  font-size: 12px;
  line-height: 17px;
}
.order-card__title {
  color: #222;
  font-size: 15px;
  font-weight: 500;
  line-height: 22px;
}
.order-card__copy,
.order-facts {
  margin-top: 10px;
  color: #888;
  font-size: 13px;
  line-height: 20px;
}
.order-facts {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.order-action {
  height: 36px;
  margin-top: 16px;
  padding: 0 18px;
  border: 0;
  border-radius: 18px;
  background: #222;
  color: #fff;
  font-size: 13px;
  line-height: 36px;
}
.order-action--muted {
  background: #f0f0f0;
  color: #555;
}
.order-action::after {
  border: 0;
}
.order-state {
  display: flex;
  min-height: 300px;
  box-sizing: border-box;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.order-state__title {
  color: #555;
  font-size: 16px;
  line-height: 23px;
}
.order-state__copy {
  max-width: 285px;
  margin-top: 8px;
  color: #999;
  font-size: 13px;
  line-height: 20px;
}
</style>
