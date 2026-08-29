<template>
  <view class="extra-page paw-page" :class="'extra-page--' + mode">
    <PawPageNav :title="title" background="#f5f5f5" fallback-url="/pages/me/index" />
    <scroll-view class="extra-scroll" scroll-y :show-scrollbar="false">
      <template v-if="mode === 'support'">
        <view v-for="item in supportList" :key="item.id" class="support-row"><image :src="item.avatar" mode="aspectFill" /><view><text class="support-name">{{ item.name }}</text><text class="support-copy">被申请领养了　<text class="muted">1小时前</text></text><view class="support-yard"><image src="/static/avatar.png" mode="aspectFill" /><text>平安是福</text><PawStatusPill text="小院" tone="warning" /></view></view></view>
        <view class="support-hint"><text>所有被你云养过的流浪动物，都在这座城市的角落等待领养，逢猫将持续为它们找寻合适的领养人</text><view class="support-link"><text>我帮助过的动物</text><uni-icons type="right" color="#aaa" :size="12" /></view></view>
      </template>
      <template v-else-if="mode === 'quota-detail'">
        <view class="detail-card paw-surface"><view class="increase-mark">增</view><text class="detail-amount">+1.90</text><text class="detail-success">增加成功</text><view v-for="row in detailRows" :key="row.label" class="detail-row"><text>{{ row.label }}</text><text>{{ row.value }}</text></view></view>
        <view class="order-card paw-surface"><view><text class="order-title">订单详情</text><text>查看原订单 ›</text></view><view><text>云养 豆豆</text><text>3天</text></view></view>
      </template>
      <template v-else>
        <view class="quota-card paw-surface"><uni-icons class="quota-chart" type="wallet-filled" color="#25bf5d" :size="38" /><text>我的领养额度</text><text class="quota-amount">¥99.00</text></view>
        <view class="refund-card paw-surface"><text class="refund-title">退款说明</text><text>• 投喂云养会增加同等金额的领养额度；</text><text>• 领养额度有效期一年，超时额度将失效；</text><text>• 主动撤回领养申请或超时7天未领养成功将自动恢复额度；</text></view>
        <view class="ledger paw-surface"><text class="ledger-title">领养额度明细</text><view v-for="item in ledger" :key="item.id" class="ledger-row" @click="openDetail"><view><text>{{ item.name }}</text><text class="muted">2025-05-12</text></view><view><text>{{ item.amount }}</text><text class="muted">剩余领养额度99</text></view></view></view>
      </template>
    </scroll-view>
    <view v-if="showInsufficient" class="insufficient-mask"><view class="insufficient-dialog"><text class="insufficient-title">领养额度不足</text><text class="insufficient-copy">您的领养额度不足，暂时无法领养这只宠物；投喂云养获得小院的宠物都可增加等同金额的领养额度，快去投喂云养后再来吧；</text><view class="insufficient-action">我知道了</view></view></view>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawStatusPill from '@/components/PawStatusPill.vue'
export default {
  components: { PawPageNav, PawStatusPill },
  data() { return { mode: 'support', supportList: [
    { id: 1, name: '小白', avatar: '/static/figma/feature/f4348f6f415792a279a216f5422aabc6f064ce25.jpg' }, { id: 2, name: '小苹果', avatar: '/static/figma/feature/a7e819e25e2ebbe3e40d655a2ccedfb5b6dd4e52.jpg' }, { id: 3, name: '小苹果', avatar: '/static/figma/feature/a7e819e25e2ebbe3e40d655a2ccedfb5b6dd4e52.jpg' }
  ], ledger: [
    { id: 1, name: '云养3天豆豆', amount: '' }, { id: 2, name: '领养菠萝', amount: '-100' }, { id: 3, name: '云养7天豆豆', amount: '+300' }, { id: 4, name: '领养小黑失败-额度返还', amount: '+100' }, { id: 5, name: '领养小黑', amount: '-100' }
  ], showInsufficient:false, detailRows: [
    { label: '交易方式', value: '投喂云养获得' }, { label: '交易时间', value: '2026-01-30 13:53:12' }, { label: '交易场景', value: '领养额度' }, { label: '交易单号', value: '76465456563563453563653' }
  ] } },
  computed: { title() { return { support: '助力领养', quota: '领养额度', 'quota-detail': '明细详情' }[this.mode] || '领养' } },
  onLoad(options) { const mode = String(options.mode || 'support'); this.mode = ['support', 'quota', 'quota-detail'].includes(mode) ? mode : 'support'; this.showInsufficient = options.popup === 'insufficient' },
  methods: { openDetail() { uni.navigateTo({ url: '/pages/adoption/extras?mode=quota-detail' }) } }
}
</script>

<style scoped>
.extra-page{height:100vh;overflow:hidden}.extra-scroll{height:calc(100vh - 150rpx)}.support-row{display:flex;min-height:144rpx;padding:18rpx 38rpx;box-sizing:border-box;border-bottom:1rpx solid #eee;background:#fff}.support-row>image{width:94rpx;height:94rpx;margin-right:22rpx;border-radius:50%}.support-name,.support-copy{display:block;font-size:27rpx;line-height:38rpx}.support-yard{display:flex;align-items:center;gap:8rpx;margin-top:6rpx;font-size:22rpx}.support-yard image{width:28rpx;height:28rpx;border-radius:50%}.muted{display:block;color:#aaa;font-size:21rpx}.support-hint{position:fixed;right:20rpx;bottom:40rpx;left:20rpx;padding:26rpx 32rpx;border-radius:24rpx;background:#f3f3f3;color:#aaa;font-size:24rpx}.support-link{display:block;margin-top:12rpx;text-align:right}.quota-card{display:flex;flex-direction:column;align-items:center;margin:20rpx 26rpx;padding:48rpx}.quota-chart{margin-bottom:24rpx}.quota-amount{margin-top:8rpx;font-size:54rpx;font-weight:700}.refund-card,.ledger,.detail-card,.order-card{margin:28rpx 26rpx;padding:32rpx}.refund-card text{display:block;margin-top:12rpx;font-size:23rpx;line-height:34rpx}.refund-title,.ledger-title,.order-title{font-size:30rpx!important;font-weight: 500;text-align:center}.ledger-title{text-align:left}.ledger-row{display:flex;justify-content:space-between;padding:16rpx 0;border-bottom:1rpx solid #eee;font-size:25rpx}.ledger-row>view:last-child{text-align:right}.detail-card{display:flex;flex-direction:column;align-items:center}.increase-mark{display:flex;align-items:center;justify-content:center;width:74rpx;height:74rpx;border-radius:50%;background:#f9bd00;color:#fff;font-size:30rpx}.detail-amount{margin-top:14rpx;font-size:58rpx;font-weight:700}.detail-success{margin:20rpx 0 38rpx;color:#999}.detail-row{display:flex;justify-content:space-between;width:100%;padding:15rpx 0;color:#444;font-size:24rpx}.detail-row text:first-child{color:#999}.order-card>view{display:flex;justify-content:space-between;padding:10rpx 0;font-size:24rpx}
.extra-page--support,.extra-page--support .extra-scroll{background:#fff}.extra-page--support .extra-scroll{margin-top:-8px;height:calc(100vh - 67px)}.extra-page--support .support-row{height:83px;min-height:83px;padding:12px 19px}.extra-page--support .support-row>image{width:50px;height:50px;margin-right:14px}.extra-page--support .support-hint{position:absolute;left:10px;right:10px;top:580px;bottom:auto;height:89px;padding:13px 16px;border-radius:13px;box-sizing:border-box;font-size:12px}.extra-page--support .support-link{display:flex;align-items:center;justify-content:flex-end;gap:2px;margin-top:13px}
.extra-page--quota .extra-scroll{height:calc(100vh - 102px)}.extra-page--quota .quota-card{height:179px;margin:7px 13px 0;padding:26px;box-sizing:border-box}.extra-page--quota .quota-chart{margin-bottom:19px}.extra-page--quota .refund-card{height:174px;margin:16px 13px 0;padding:18px 16px;box-sizing:border-box}.extra-page--quota .refund-card .refund-title+text{margin-top:22px}.extra-page--quota .refund-card>text:not(.refund-title){line-height:17px}.extra-page--quota .refund-card>text:not(.refund-title):not(:first-of-type){margin-top:0}.extra-page--quota .ledger{height:349px;margin:18px 13px 0;padding:22px 16px 16px;box-sizing:border-box}.extra-page--quota .ledger-title{display:block;margin-bottom:6px}.extra-page--quota .ledger-row{height:57px;padding:7px 0;box-sizing:border-box}
.extra-page--quota-detail .detail-card{height:333px;margin:-11px 13px 0;padding:16px;box-sizing:border-box}.extra-page--quota-detail .order-card{height:96px;margin:12px 13px 0;padding:12px;box-sizing:border-box}
.insufficient-mask{position:fixed;inset:0;z-index:900;background:#5b5b5b;display:flex;align-items:center;justify-content:center}.insufficient-dialog{width:295px;height:233px;border-radius:18px;background:#fff;overflow:hidden;transform:translateY(-35px)}.insufficient-title{display:block;margin-top:16px;text-align:center;font-size:20px;font-weight: 500}.insufficient-copy{display:block;margin:35px 35px 0;color:#999;font-size:14px;line-height:16px}.insufficient-action{height:49px;margin-top:38px;border-top:1px solid #eee;display:flex;align-items:center;justify-content:center;color:#999;font-size:16px}
</style>
