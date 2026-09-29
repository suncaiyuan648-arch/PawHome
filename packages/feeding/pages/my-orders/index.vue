<template>
  <view class="my-orders-page">
    <PawPageNav background="#fff9ed" fallback-url="/pages/me/index" />

    <view class="order-types">
      <view class="order-type order-type--active" data-qa="qa-my-orders-shopping">
        <text>购物订单</text>
      </view>
      <view class="order-type order-type--disabled" data-qa="qa-my-orders-service" @tap="showComingSoon">
        <PawBadge :count="1" size="small" color="#ff4c4c" :offset="[8, -3]">
          <text class="service-order-label">服务订单</text>
        </PawBadge>
      </view>
    </view>

    <view class="status-tabs" data-qa="qa-my-orders-tabs">
      <view
        v-for="item in tabs"
        :key="item.key"
        class="status-tab"
        :class="{ 'status-tab--active': selectedTab === item.key }"
        :data-qa="`qa-my-orders-tab-${item.key}`"
        @tap="selectTab(item.key)"
      >
        <PawBadge :count="item.badge || ''" size="small" color="#ff4c4c" :offset="[8, -19]">
          <text>{{ item.label }}</text>
        </PawBadge>
      </view>
    </view>

    <scroll-view class="orders-scroll" scroll-y :enable-flex="true" :show-scrollbar="false" @scroll="closeMore">
      <view class="orders-list" data-qa="qa-my-orders-list">
        <view v-for="order in visibleOrders" :key="order.key" class="order-card" :data-qa="`qa-my-orders-card-${order.key}`">
          <view class="card-head">
            <text class="order-number">订单编号：{{ order.number }}</text>
            <text class="order-status">{{ order.statusLabel }}</text>
          </view>

          <view class="product-row">
            <view class="product-picture">
              <image class="product-image" src="/static/feed-popup/feed-bag.png" mode="aspectFit" />
            </view>
            <view class="product-details">
              <view class="product-summary">
                <view class="product-line">
                  <text class="product-name">{{ order.product }}</text>
                  <text class="price">¥{{ order.amount }}</text>
                </view>
                <view class="product-line">
                  <text class="product-caption">{{ order.caption }}</text>
                  <text class="quantity">×1</text>
                </view>
              </view>
              <text class="total-price">¥{{ order.amount }}</text>
            </view>
          </view>

          <view v-if="order.countdown" class="countdown">请在{{ order.countdown }}内支付</view>

          <view class="card-footer">
            <PawPopoverMenu
              variant="order-actions"
              :model-value="openMoreKey === order.key"
              :items="moreActions"
              @update:model-value="onMoreVisibilityChange(order.key, $event)"
              @select="onMoreSelect"
            >
              <template #trigger>
                <view class="more-button" :data-qa="`qa-my-orders-more-${order.key}`">
                  <text>更多</text>
                </view>
              </template>
            </PawPopoverMenu>
            <view class="action-buttons">
              <view class="action-button" @tap="showComingSoon">客服</view>
              <view v-if="order.secondaryAction" class="action-button" @tap="showComingSoon">{{ order.secondaryAction }}</view>
            </view>
          </view>
        </view>

        <view v-if="visibleOrders.length === 0" class="empty-state" data-qa="qa-my-orders-empty">
          <text>暂无相关订单</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PawPageNav from '@/components/PawPageNav.vue'
import PawBadge from '@/components/base/PawBadge.vue'
import PawPopoverMenu from '@/components/navigation/PawPopoverMenu.vue'

type OrderTab = 'all' | 'unpaid' | 'unshipped' | 'unreceived' | 'unreviewed'
type ShoppingOrder = {
  key: string
  number: string
  tab: Exclude<OrderTab, 'all'>
  statusLabel: string
  product: string
  caption: string
  amount: number
  countdown?: string
  secondaryAction?: string
}

const ORDER_TABS: { key: OrderTab; label: string; badge?: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'unpaid', label: '待付款', badge: '1' },
  { key: 'unshipped', label: '待发货', badge: '99' },
  { key: 'unreceived', label: '待收货', badge: '13' },
  { key: 'unreviewed', label: '待评价', badge: '5' },
]

// Figma 83:23734 的只读展示数据；购物订单接口接入后由真实订单替换。
const DESIGN_ORDERS: ShoppingOrder[] = [
  { key: 'unpaid', number: 'YCQ092182', tab: 'unpaid', statusLabel: '待付款', product: '云养30天+投粮4斤', caption: '秘书；北京路救助小院；', amount: 168, countdown: '22:49:58:32', secondaryAction: '取消订单' },
  { key: 'unshipped', number: 'YCQ092182', tab: 'unshipped', statusLabel: '待发货', product: '云养30天+投粮4斤', caption: '秘书；北京路救助小院；', amount: 168 },
  { key: 'unreceived', number: 'YCQ092182', tab: 'unreceived', statusLabel: '已发货', product: '云养30天+投粮4斤', caption: '秘书；北京路救助小院；', amount: 168, secondaryAction: '查看物流' },
  { key: 'unreviewed', number: 'YCQ092182', tab: 'unreviewed', statusLabel: '已完成', product: '云养30天+投粮4斤', caption: '秘书；北京路救助小院；', amount: 168, secondaryAction: '再买一单' },
]

function normalizeTab(value: unknown): OrderTab {
  return ORDER_TABS.some((item) => item.key === value) ? value as OrderTab : 'all'
}

export default defineComponent({
  name: 'MyShoppingOrders',
  components: { PawPageNav, PawBadge, PawPopoverMenu },
  data() {
    return {
      selectedTab: 'all' as OrderTab,
      tabs: ORDER_TABS,
      orders: DESIGN_ORDERS,
      moreActions: [{ key: 'delete', label: '删除订单' }],
      openMoreKey: '',
    }
  },
  computed: {
    visibleOrders(): ShoppingOrder[] {
      return this.selectedTab === 'all'
        ? this.orders
        : this.orders.filter((order) => order.tab === this.selectedTab)
    },
  },
  onLoad(query: Record<string, unknown> = {}) {
    this.selectedTab = normalizeTab(query.tab)
  },
  methods: {
    selectTab(tab: OrderTab) {
      this.selectedTab = tab
      this.openMoreKey = ''
    },
    onMoreVisibilityChange(key: string, open: boolean) {
      this.openMoreKey = open ? key : ''
    },
    closeMore() {
      if (this.openMoreKey) this.openMoreKey = ''
    },
    onMoreSelect() {
      this.openMoreKey = ''
      this.showComingSoon()
    },
    showComingSoon() {
      uni.showToast({ title: '暂未接入', icon: 'none' })
    },
  },
})
</script>

<style scoped>
.my-orders-page { display: flex; flex-direction: column; height: 100vh; background: linear-gradient(#fff9ed 0, #f8f8f8 188px); color: #242424; }
.order-types { display: flex; flex: none; align-items: center; height: 50px; padding: 0 18px; gap: 35px; background: #fff9ed; }
.order-type { display: flex; align-items: flex-start; justify-content: center; gap: 3px; height: 100%; padding-top: 11px; box-sizing: border-box; font-size: 18px; color: #9b9b9b; }
.order-type--active { color: #202020; font-weight: 700; border-bottom: 3px solid #f54d49; }
.order-type--disabled { opacity: .8; }
.service-order-label { display: inline-block; font-size: 18px; line-height: 24px; }
.status-tabs { display: flex; flex: none; align-items: center; gap: 5px; padding: 10px 10px 9px; background: #fff9ed; }
.status-tab { position: relative; display: flex; flex: 1; align-items: center; justify-content: center; min-width: 0; height: 30px; box-sizing: border-box; border: 1px solid transparent; border-radius: 16px; background: #fff; color: #666; font-size: 12px; white-space: nowrap; }
.status-tab--active { border-color: #f1514b; color: #e94a44; }
.orders-scroll { flex: 1; min-height: 0; }
.orders-list { display: flex; flex-direction: column; gap: 10px; padding: 8px 10px calc(24px + env(safe-area-inset-bottom)); }
.order-card { display: flex; flex-direction: column; gap: 9px; min-height: 204px; padding: 17px 14px 15px; box-sizing: border-box; border-radius: 24px; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,.025); }
.card-head, .product-row, .card-footer, .action-buttons { display: flex; align-items: center; }
.card-head { justify-content: space-between; min-height: 20px; }
.order-number { font-size: 12px; color: #333; }
.order-status { font-size: 13px; color: #f1514b; }
.product-row { align-items: flex-start; gap: 10px; min-width: 0; }
.product-picture { display: flex; flex: none; align-items: center; justify-content: center; width: 78px; height: 78px; border-radius: 6px; background: #f6f6f6; }
.product-image { width: 56px; height: 56px; }
.product-details { display: flex; flex: 1; flex-direction: column; justify-content: space-between; align-self: stretch; min-width: 0; }
.product-summary { display: flex; flex-direction: column; gap: 8px; min-width: 0; padding-top: 2px; }
.product-line { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; min-width: 0; }
.product-name { overflow: hidden; min-width: 0; font-size: 14px; font-weight: 700; white-space: nowrap; text-overflow: ellipsis; }
.product-caption { overflow: hidden; min-width: 0; color: #999; font-size: 11px; white-space: nowrap; text-overflow: ellipsis; }
.price { flex: none; color: #333; font-family: 'D-DIN-PRO', 'DIN Alternate', sans-serif; font-size: 12px; font-weight: 500; }
.quantity { flex: none; color: #999; font-size: 11px; }
.total-price { align-self: flex-end; color: #000; font-family: 'D-DIN', 'DIN Alternate', sans-serif; font-size: 20px; font-weight: 700; line-height: 1; }
.countdown { align-self: flex-end; color: #ff4c4c; font-family: 'Source Han Sans CN', 'PingFang SC', sans-serif; font-size: 14px; font-weight: 400; line-height: 20px; }
.card-footer { justify-content: space-between; min-height: 30px; margin-top: auto; }
.more-button { display: flex; align-items: center; min-width: 44px; height: 30px; color: #999; font-size: 12px; }
.action-buttons { justify-content: flex-end; gap: 8px; }
.action-button { display: flex; align-items: center; justify-content: center; min-width: 68px; height: 29px; padding: 0 10px; box-sizing: border-box; border: 1px solid #d8d8d8; border-radius: 16px; color: #555; font-size: 12px; }
.empty-state { display: flex; align-items: center; justify-content: center; min-height: 220px; color: #999; font-size: 13px; }
</style>
