<template>
  <view class="fd-page" :class="{ 'fd-page--pet': variant === 92 }">
    <view class="fd-top" :style="fdTopStyle">
      <!-- #ifndef MP-WEIXIN -->
      <view class="fd-status"><text>9:41</text><view class="fd-status-icons"><uni-icons type="bars" color="#111" :size="14"/><uni-icons type="circle-filled" color="#111" :size="10"/></view></view>
      <!-- #endif -->
      <view class="fd-nav"><image src="/static/nav-back-arrow.png" mode="aspectFit"/><text>投粮详情</text><!-- #ifndef MP-WEIXIN --><view class="fd-menu"><uni-icons type="more-filled" color="#333" :size="18"/><view class="menu-separator"/><uni-icons type="circle-filled" color="#111" :size="14"/></view><!-- #endif --></view>
    </view>

    <view v-if="variant === 92" class="pet-summary">
      <image class="pet-photo" src="/static/figma/feeding/7b05bc39e1b8964af873866afe1ca53e7015ac78.png" mode="aspectFill" />
      <view class="pet-copy">
        <view class="pet-title"><text>小毛毛球</text><text class="green">已云养</text><text class="brown">已连续云养25天</text></view>
        <text class="pet-desc">流浪的时候经常去小卖店偷吃火腿肠<br/>被打导致有点怕人</text>
        <view class="pet-tags"><text>极度饥饿</text><text>非常亲人</text><text>男娃</text><text>已绝育</text></view>
      </view>
      <view class="pet-meta"><text>云养天数：　　云养30天/投粮4斤</text><text>下单时间：　　2026-2-5 13:23:56</text><text>剩余云养天数：　3/3天</text><text class="blue">订单编号：YCQ092182□</text><text class="orange">待领养生效　物流运输中，等待小院签...</text></view>
    </view>

    <view v-else class="order-summary">
      <view class="order-main">
        <image class="order-avatar" :src="variant === 91 ? feedImgs[7] : feedImgs[0]" mode="aspectFill" />
        <view class="order-copy">
          <view><text class="order-name">平安是福</text><text class="yard-pill">{{ variant === 91 ? '黑猫' : '小院' }}</text></view>
          <text class="order-amount">{{ variant === 91 ? '【黑猫】云养30天/投粮4斤' : '投粮4斤' }}</text>
          <text class="order-time">2026-2-5 13:23:56</text>
        </view>
        <view class="order-right"><text class="timeout">{{ variant === 90 ? '3天23:34:45后超时' : '' }}</text><text class="progress">已反馈2/5次</text></view>
      </view>
      <view v-if="variant === 91" class="waiting"><text>云养中</text> 云家长还在等您今天的反馈，不要忘了哟！</view>
      <view v-else class="order-number">订单编号：YCQ092182□</view>
    </view>

    <view class="timeline" :class="{ 'timeline--pet': variant === 92 }">
      <view v-for="i in 3" :key="i" class="timeline-row">
        <view class="axis"><view class="dot"/><view v-if="i < 3" class="line"/></view>
        <view class="row-body">
          <view class="row-head"><text>23</text><text>{{ 4 - i }}/5</text></view>
          <view class="avatars"><image v-for="a in avatarImgs" :key="a" :src="a" mode="aspectFill"/></view>
          <text class="row-text">{{ i === 1 ? '你家的猫咪被我照顾的很好，别担心' : '今天又来投喂小猫了，感谢幸福人生的投粮...' }}</text>
          <view class="photos"><image v-for="p in photoImgs" :key="p" :src="p" mode="aspectFill"/></view>
          <text class="view-link">查看</text>
        </view>
      </view>
      <view v-for="(log, index) in logs" :key="log" class="log-row"><view class="log-dot"/><text>{{ log }}</text><text>2026-2-21 17:37</text></view>
    </view>
    <view class="feedback">反馈</view>
  </view>
</template>

<script>
const base = '/static/figma/feeding/'
export default {
  name: 'PawFeedingDetailFigma',
  props: { variant: { type: Number, default: 90 } },
  data() {
    const hashes = ['2aa0d5e4a47ba5a30dfbda447d2b0e0acab9c94f','663a44c6cdee9de9df233539fac35f7f3f908376','f575bdfc31f25882d8cc6f35223e98ec2b1c1bf2','2e4db61734b5d15cca204e0947d81a871ea9a8b6','d81342748c84fc1068ceb0af9525bc465f5517e8','badf7f54fe66571722f8b3aa5742e6abbb479c44','409928f32c3a7f2126933ffbfe038b58d6dd26cc','1472957ded35cdc32a413c0d8aeffd67d583a54a']
    const feedImgs = hashes.map(h => `${base}${h}.png`)
    return { statusBarHeight: 0, feedImgs, avatarImgs: feedImgs.slice(0,4), photoImgs: feedImgs.slice(4,7), logs:['已签收','已发货','仓库分拣打包中','已下单'] }
  },
  computed: {
    fdTopStyle() {
      if (!this.statusBarHeight) return {}
      return { paddingTop: `${this.statusBarHeight}px`, height: `${this.statusBarHeight + 63}px` }
    }
  },
  created() {
    const systemInfo = uni.getSystemInfoSync()
    this.statusBarHeight = systemInfo.statusBarHeight || 0
  },
}
</script>

<style scoped>
.fd-page{position:relative;min-height:100vh;background:#fff;color:#333;font-size:13px}.fd-top{height:99px;background:#fff574}.fd-status{height:36px;padding:11px 16px 0 34px;box-sizing:border-box;display:flex;justify-content:space-between;font-size:15px;font-weight: 500;color:#111}.fd-status-icons{display:flex;align-items:center;gap:6px}.fd-nav{height:63px;position:relative;display:flex;align-items:center;justify-content:center}.fd-nav>image{position:absolute;left:16px;width:10px;height:18px}.fd-nav>text{font-size:16px;font-weight: 500;color:#222}.fd-menu{position:absolute;right:8px;width:78px;height:30px;border:1px solid rgba(0,0,0,.08);border-radius:16px;display:flex;align-items:center;justify-content:center;gap:7px;color:#333}.menu-separator{width:1px;height:18px;background:rgba(0,0,0,.1)}.order-summary{height:150px;padding:23px 17px 0;box-sizing:border-box}.order-main{display:flex;align-items:flex-start}.order-avatar{width:35px;height:35px;border-radius:50%;flex:none}.order-copy{margin-left:8px;display:flex;flex-direction:column}.order-name{font-size:14px}.yard-pill{margin-left:4px;padding:1px 5px;border-radius:4px;background:#ffe646;font-size:9px}.order-amount{margin-top:3px;font-size:14px}.order-time{margin-top:6px;font-size:12px;color:#999}.order-right{margin-left:auto;display:flex;flex-direction:column;align-items:flex-end}.timeout{height:24px;font-size:12px;color:#ff334b}.progress{font-size:11px;color:#52637c;background:#f0f3f8;padding:3px 7px}.order-number{margin:8px 0 0 42px;font-size:12px;color:#0875dc}.waiting{margin:10px 0 0 42px;font-size:11px;color:#ff394a}.waiting>text{border:1px solid #ff394a;border-radius:4px;padding:2px 5px}.timeline{padding:0 15px 78px;box-sizing:border-box}.timeline-row{display:flex;min-height:207px}.axis{width:18px;display:flex;flex-direction:column;align-items:center}.dot,.log-dot{width:8px;height:8px;border-radius:50%;background:#ffe100;border:1px solid #ddd;box-sizing:border-box}.line{width:1px;flex:1;background:#e6e6e6}.row-body{flex:1;padding:0 0 15px 1px}.row-head{display:flex;justify-content:space-between;align-items:center}.row-head text:first-child{font-size:27px;font-weight: 500;color:#3d3d3d}.row-head text:last-child{font-size:15px}.avatars{display:flex;gap:4px;margin-top:9px}.avatars image{width:32px;height:32px;border-radius:50%}.row-text{display:block;margin-top:7px;font-size:13px}.photos{display:flex;gap:7px;margin-top:10px}.photos image{width:57px;height:57px;border-radius:5px}.view-link{display:block;margin-top:3px;font-size:11px;color:#296698}.log-row{height:40px;display:grid;grid-template-columns:18px 1fr auto;align-items:center}.log-row text:last-child{font-size:11px;color:#999}.feedback{position:fixed;right:14px;bottom:15px;width:90px;height:38px;border-radius:20px;background:#ffe000;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight: 500}.pet-summary{height:475px;padding:31px 20px 0;background:#fff;box-sizing:border-box;position:relative}.pet-photo{width:95px;height:95px;border-radius:5px}.pet-copy{position:absolute;left:125px;right:16px;top:28px}.pet-title{display:flex;align-items:center;gap:5px}.pet-title>text:first-child{font-size:17px}.green,.brown{padding:2px 5px;border-radius:4px;font-size:10px}.green{background:#8fd84f}.brown{background:#bc8648;color:#fff}.pet-desc{display:block;margin-top:4px;font-size:13px;line-height:18px;color:#777}.pet-tags{display:flex;gap:5px;margin-top:8px}.pet-tags text{padding:2px 5px;border-radius:3px;background:#f3f3f3;font-size:10px;color:#777}.pet-tags text:first-child{color:#ff4b2f;background:#fff0e8}.pet-meta{margin-top:12px;display:flex;flex-direction:column;gap:8px;font-size:12px;color:#999}.pet-meta .blue{color:#0875dc}.pet-meta .orange{color:#ff7b26}.timeline--pet{padding-top:0}
.fd-page--pet{background:linear-gradient(to bottom,#fff 0,#fff 1135px,#fff476 1135px,#fff476 1303px,#fff 1303px)}
/* #ifdef MP-WEIXIN */
.fd-top{box-sizing:border-box}.fd-status{display:none}.fd-menu{display:none}
/* #endif */
</style>
