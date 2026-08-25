<template>
  <view class="yard-detail-figma" :class="'state-' + activeState">
    <!-- #ifndef MP-WEIXIN -->
    <image class="h5-status-bar" src="/static/figma/yard-detail-top.png" mode="scaleToFill" />
    <!-- #endif -->
    <view class="status-space"></view>
    <view class="yd-nav">
      <view class="yd-back" @click="goBack"><image src="/static/nav-back-arrow.png" mode="aspectFit" /></view>
      <image class="owner-avatar" src="/static/figma/yard-owner-exact.png" mode="scaleToFill" />
      <text class="owner-name">芝</text><text class="owner-tag">院主</text>
      <view class="nav-spacer"></view>
      <view class="mini-capsule"><uni-icons type="more-filled" :size="21" color="#333" /><view class="capsule-line"></view><view class="capsule-ring"></view></view>
    </view>
    <view class="notice-line"><text>广东汕头的花开富贵老师对我就是要喂猫投粮4斤，积善缘，得福报~</text></view>

    <view class="yard-summary">
      <view class="yard-main-row">
        <image class="yard-cover" src="/static/figma/yard-cover-exact.png" mode="scaleToFill" />
        <view class="yard-main">
          <view class="yard-name-row"><text class="yard-name">我就是要喂猫</text><text class="verified">已实名</text></view>
          <view class="yard-org"><uni-icons type="auth-filled" :size="13" color="#3c8cff" /><text>合肥市希望流浪动物基地</text></view>
          <view class="yard-pills"><text>剩余6/21日</text><text>已成立2个月</text></view>
          <view class="yard-stats"><view><b>999斤</b><small>已获粮</small></view><view><b>13只</b><small>帮助领养</small></view><view><b>3天2小时</b><small>平均反馈时长</small></view></view>
        </view>
        <view class="sound-btn"><uni-icons type="sound-filled" :size="20" color="#fff" /></view>
      </view>
      <scroll-view class="pet-strip" scroll-x :show-scrollbar="false">
        <view class="pet-strip-row"><view class="pet-item" v-for="n in 6" :key="n"><image src="/static/figma/yard-pet-exact.png?v=2" mode="scaleToFill" /><text>小灰灰</text></view><uni-icons class="pet-next" type="right" :size="19" color="#c8c8c8" /></view>
      </scroll-view>
      <view class="yard-intro"><text>{{ introCopy }}</text><text v-if="!expandedIntro" class="more-word" @click="expandedIntro = true">... 全文</text><text v-else class="more-word" @click="expandedIntro = false"> 收起</text></view>
      <view class="yard-meta"><text>郑州市金水区</text><view><text>点赞1.2w</text><text>入驻280人</text><text>分享78</text></view></view>
    </view>

    <view v-if="activeState !== 'dynamic-empty'" class="rank-area">
      <view class="rank-title"><text>13人已投喂32斤猫粮</text><text>排行榜 ›</text></view>
      <view class="rank-row"><image src="/static/figma/yard-pet-exact.png" mode="aspectFill" /><text>张三</text><text class="rank-level">Lv1</text><text class="rank-right">小院投喂第一名</text></view>
      <view class="rank-row rank-row--second"><image src="/static/figma/yard-detail/owner.png" mode="aspectFill" /><text>平安是福</text><text class="rank-level">Lv1</text><text class="rank-right">小院投喂第二名</text></view>
    </view>

    <view class="detail-tabs"><view :class="{ active: activeState !== 'feeding' }" @click="switchState('dynamic')">动态</view><view :class="{ active: activeState === 'feeding' }" @click="switchState('feeding')">投粮记录</view></view>

    <view v-if="activeState === 'dynamic-empty'" class="dynamic-empty">
      <image src="/static/figma/yard-detail/empty-dynamic.png" mode="aspectFill" />
      <text class="empty-title">院主佛系，还没发过动态</text>
      <view class="remind-btn" @click="showRemind">催一下</view>
    </view>

    <view v-else-if="activeState === 'feeding'" class="feeding-list">
      <view class="feeding-row" v-for="n in 4" :key="n"><image src="/static/figma/yard-feeding-avatar.png?v=2" mode="scaleToFill" /><text class="feeding-name">平安是福</text><text class="feeding-level">Lv1</text><text class="feeding-copy">投粮200克 已反馈2/5次</text></view>
    </view>

    <view v-else class="dynamic-feed">
      <view class="post-card" v-for="post in postCount" :key="post">
        <view class="post-head"><image src="/static/figma/yard-post-owner-exact.png" mode="scaleToFill" /><text class="post-name">姜栋</text><text class="post-owner">院主</text></view>
        <view class="post-source"><view class="tiny-pets"><image v-for="n in 4" :key="n" src="/static/figma/yard-pet-exact.png" mode="aspectFill" /></view><text>来自花开富贵投喂的4斤猫粮</text></view>
        <text class="post-copy">{{ postCopy }}</text>
        <text class="post-full">全文</text>
        <image v-if="post === 1" class="post-single" src="/static/figma/yard-post-single-exact.png" mode="scaleToFill" />
        <view v-else class="post-grid"><image v-for="n in gridCount" :key="n" src="/static/figma/yard-post-grid-exact.png" mode="scaleToFill" /></view>
        <view class="post-time"><text>昨天 20:45　江西　回复</text><uni-icons type="hand-up" :size="16" color="#999" /><text>32</text></view>
        <view class="comment" v-for="c in commentCount" :key="c"><view class="comment-avatar"></view><view class="comment-main"><text>姜栋 <i>院主</i></text><text>给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞</text><small>昨天 20:45　江西　回复</small></view><uni-icons type="hand-up-filled" :size="16" color="#ff3348" /><text>32</text></view>
        <text class="expand-comments">展开 4 条回复</text>
      </view>
    </view>

    <view class="bottom-actions">
      <view class="bottom-small" @click="share"><uni-icons type="redo" :size="23" color="#333" /><text>分享</text></view>
      <view class="bottom-small" @click="toggleJoin"><uni-icons :type="joined ? 'checkbox-filled' : 'plusempty'" :size="23" :color="joined ? '#ffe000' : '#333'" /><text>{{ joined ? '已入驻' : '入驻' }}</text></view>
      <view class="bottom-small"><uni-icons type="heart" :size="23" color="#333" /><text>领养</text></view>
      <view class="bottom-main" @click="feed"><uni-icons type="shop" :size="21" color="#333" /><text>{{ activeState === 'feeding' ? '云养一只' : '投点猫粮' }}</text></view>
    </view>
  </view>
</template>

<script>
import { goBackSmart } from '@/utils/navBack.js'

export default {
  name: 'PawYardDetailFigma',
  props: { state: { type: String, default: 'dynamic' } },
  data() {
    return { activeState: this.state, expandedIntro: this.state === 'dynamic-expanded', joined: this.state === 'feeding' }
  },
  computed: {
    introCopy() {
      const short = '小灰灰是去年冬天快过年的时候发现的流浪猫，一开始胆子很小，后来熟了之后才愿意跟我接触，希望多多投喂，谢谢，感谢大家的帮助和支持，我...'
      const long = '小灰灰是去年冬天快过年的时候发现的流浪猫，一开始胆子很小，后来熟了之后才愿意跟我接触，希望多多投喂，谢谢，感谢大家的帮助和支持。我一定会好好照顾这些可爱的小生命，让它们健康成长。小灰灰平时很亲人，也喜欢安静地晒太阳，希望大家持续关注它。'
      return this.expandedIntro ? long : short
    },
    postCount() { return this.activeState === 'dynamic-expanded' ? 2 : 2 }
    ,postCopy() {
      const base = '哎 又忍不住开始书写小作文　　此时的弟弟应该刚下自习不到20分钟 又忍不住开始书写小作文　　此时的弟弟应该刚下自习不到20分钟 又忍不住开始书写小作文...'
      return this.activeState === 'dynamic-expanded' ? base + base : base
    }
    ,commentCount() { return this.activeState === 'dynamic-expanded' ? 4 : 3 }
    ,gridCount() { return this.activeState === 'dynamic-expanded' ? 3 : 9 }
  },
  watch: {
    state(next) { this.activeState = next; this.expandedIntro = next === 'dynamic-expanded' }
  },
  methods: {
    goBack() { goBackSmart({ fallbackUrl: '/pages/index/index' }) },
    switchState(next) { this.activeState = next; this.expandedIntro = false },
    toggleJoin() { this.joined = !this.joined },
    feed() { uni.showToast({ title: this.activeState === 'feeding' ? '选择云养猫咪' : '选择猫粮', icon: 'none' }) },
    share() { uni.showShareMenu && uni.showShareMenu({ withShareTicket: true }) },
    showRemind() { uni.showToast({ title: '已提醒院主', icon: 'none' }) }
  }
}
</script>

<style scoped>
.yard-detail-figma{position:relative;min-height:100vh;padding-bottom:90px;background:#fff;color:#222;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Helvetica Neue',sans-serif}.h5-status-bar{position:absolute;left:0;top:0;width:100%;height:108px;z-index:100;pointer-events:none}.status-space{height:44px}.yd-nav{height:44px;display:flex;align-items:center;padding:0 13px;box-sizing:border-box}.yd-back{width:24px;height:34px;display:flex;align-items:center}.yd-back image{width:9px;height:18px}.owner-avatar{width:32px;height:32px;border-radius:50%;margin-left:4px}.owner-name{margin-left:9px;font-size:14px}.owner-tag,.post-owner{margin-left:6px;padding:2px 5px;border-radius:4px;background:#fff1f3;color:#ff2950;font-size:9px}.nav-spacer{flex:1}.mini-capsule{width:78px;height:30px;border:1px solid #e7e7e7;border-radius:16px;display:flex;align-items:center;justify-content:space-evenly}.capsule-line{width:1px;height:18px;background:#e5e5e5}.capsule-ring{width:13px;height:13px;border:2px solid #222;border-radius:50%}.notice-line{height:20px;overflow:hidden;background:#fff9be;color:#665500;font-size:11px;line-height:20px;white-space:nowrap}.notice-line text{display:block;transform:translateX(-8px)}.yard-summary{padding:9px 13px 0}.yard-main-row{display:flex;align-items:flex-start}.yard-cover{width:92px;height:92px;border-radius:6px}.yard-main{flex:1;min-width:0;margin-left:17px}.yard-name-row{height:22px;display:flex;align-items:center}.yard-name{font-size:16px;font-weight:500}.verified{margin-left:10px;color:#e7a500;font-size:10px}.yard-org{display:flex;align-items:center;gap:3px;height:21px;color:#777;font-size:11px}.yard-pills{display:flex;gap:7px;height:20px}.yard-pills text{padding:2px 6px;border-radius:4px;background:#fff8df;color:#ed9c00;font-size:11px}.yard-stats{display:flex;gap:17px}.yard-stats view{display:flex;flex-direction:column}.yard-stats b{font-size:16px;line-height:20px}.yard-stats small{font-size:10px;color:#aaa;line-height:15px}.sound-btn{width:29px;height:29px;border-radius:50%;background:#ffd800;display:flex;align-items:center;justify-content:center;margin-left:4px;margin-top:6px}.pet-strip{margin-top:11px;white-space:nowrap}.pet-strip-row{display:inline-flex;align-items:flex-start}.pet-item{width:51px;display:flex;flex-direction:column;align-items:center}.pet-item image{width:42px;height:42px;border-radius:50%}.pet-item text{margin-top:3px;color:#777;font-size:10px}.pet-next{margin-top:13px}.yard-intro{position:relative;margin-top:8px;min-height:77px;font-size:14px;line-height:23px}.more-word{color:#5c7197}.yard-meta{height:28px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #eee;color:#aaa;font-size:10px}.yard-meta view{display:flex;gap:14px}.state-dynamic-empty .yard-summary{padding-bottom:29px}.state-dynamic-expanded .yard-intro{min-height:110px}.rank-area{height:92px;overflow:hidden;border-bottom:1px solid #eee}.rank-title{height:31px;display:flex;align-items:center;justify-content:space-between;padding:0 13px;font-size:13px}.rank-title text:last-child{color:#aaa}.rank-row{height:39px;display:flex;align-items:center;padding:0 13px;font-size:13px}.rank-row--second{opacity:.6}.rank-row image{width:27px;height:27px;border-radius:50%;margin-right:7px}.rank-level,.feeding-level{margin-left:5px;padding:1px 5px;border-radius:6px;background:#493100;color:#fff;font-size:9px}.rank-right{margin-left:auto;color:#edbf00;font-size:12px}.detail-tabs{height:54px;display:flex;align-items:center;justify-content:center;gap:44px;border-bottom:1px solid #eee}.detail-tabs view{position:relative;color:#999;font-size:15px;padding:15px 3px}.detail-tabs view.active{color:#222;font-weight:700}.detail-tabs view.active:after{content:'';position:absolute;left:0;right:0;bottom:7px;height:6px;border-radius:3px;background:#ffe400;z-index:-1}.dynamic-empty{height:322px;display:flex;flex-direction:column;align-items:center;padding-top:38px;box-sizing:border-box}.dynamic-empty image{width:165px;height:125px}.empty-title{margin-top:14px;color:#888;font-size:13px}.remind-btn{margin-top:16px;width:76px;height:33px;border:1px solid #e5e5e5;border-radius:17px;display:flex;align-items:center;justify-content:center;font-size:13px}.feeding-list{padding:0 13px}.feeding-row{height:52px;display:flex;align-items:center;border-bottom:1px solid #fafafa}.feeding-row image{width:34px;height:34px;border-radius:50%}.feeding-name{margin-left:8px;color:#999;font-size:14px}.feeding-copy{margin-left:auto;font-size:13px}.dynamic-feed{background:#f6f6f6}.post-card{padding:12px 12px 20px;margin-bottom:9px;background:#fff}.post-card:first-child{padding-bottom:19px}.post-card:nth-child(2){padding-bottom:36px}.post-card:last-child{margin-bottom:0}.post-head{height:36px;display:flex;align-items:center}.post-head>image{width:34px;height:34px;border-radius:50%}.post-name{margin-left:8px;font-size:14px}.post-source{display:flex;align-items:center;margin-left:38px;margin-top:-22px}.tiny-pets{display:flex}.tiny-pets image{width:22px;height:22px;border-radius:50%;margin-right:-4px;border:1px solid #fff}.post-source>text{margin-left:8px;padding:3px 5px;border-radius:4px;background:#edf4ff;color:#58759b;font-size:10px}.post-copy{display:block;margin:8px 0 0 38px;font-size:14px;line-height:21px}.post-full{display:block;margin:9px 0 0 38px;color:#5c7197;font-size:13px}.post-single{display:block;width:144px;height:297px;margin:27px 0 0 38px}.post-grid{display:grid;grid-template-columns:repeat(3,85px);width:263px;gap:4px;margin:27px 38px 0}.post-grid image{width:85px;height:95px}.post-time{height:35px;margin-left:38px;display:flex;align-items:center;color:#999;font-size:10px}.post-time uni-icons{margin-left:auto}.comment{display:flex;align-items:flex-start;margin:2px 0 0 38px;min-height:86px;color:#999;font-size:11px}.comment-avatar{width:22px;height:22px;border-radius:50%;background:#ddd;flex-shrink:0}.comment-main{display:flex;flex:1;flex-direction:column;margin-left:7px;color:#666}.comment-main i{padding:1px 4px;border-radius:4px;background:#fff1f3;color:#ff2950;font-style:normal;font-size:8px}.comment-main small{margin-top:5px;color:#aaa}.expand-comments{display:block;margin-left:70px;font-size:11px;color:#555}.bottom-actions{position:fixed;left:0;right:0;bottom:0;height:90px;padding:8px 13px calc(8px + env(safe-area-inset-bottom));display:flex;align-items:flex-start;background:#fff;border-top:1px solid #eee;box-sizing:border-box;z-index:50}.bottom-small{width:52px;display:flex;flex-direction:column;align-items:center;color:#888;font-size:10px}.bottom-small text{margin-top:2px}.bottom-main{flex:none;width:188px;height:43px;border-radius:23px;background:#ffe000;display:flex;align-items:center;justify-content:center;gap:9px;font-size:16px;font-weight:700}
.state-feeding .yard-intro{height:57px;min-height:57px;overflow:hidden}
.state-feeding .detail-tabs view{padding:21px 3px 9px}
.detail-tabs view{z-index:1}.detail-tabs view.active:after{z-index:-1}
.state-dynamic-expanded .yard-intro{min-height:147px}
.state-dynamic-expanded .post-single{height:330px}
.state-dynamic-expanded .post-card:first-child{padding-bottom:52px}
.state-dynamic-expanded .post-card:nth-child(2){padding-bottom:51px}
/* #ifdef H5 */
.state-dynamic .bottom-actions,.state-dynamic-expanded .bottom-actions{position:absolute}
/* #endif */
</style>
