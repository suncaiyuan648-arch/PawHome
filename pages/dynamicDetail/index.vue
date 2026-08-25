<template>
  <view class="dynamic-page" :class="{ 'comments-empty-state': commentsEmpty }">
    <!-- #ifndef MP-WEIXIN -->
    <image class="h5-status-bar" src="/static/figma/status-bar-white.png" mode="scaleToFill" />
    <!-- #endif -->
    <PawPageNav background="#ffffff" fallback-url="/pages/index/index" />
    <view class="author-row" :style="{ top: (statusBarHeight + 25) + 'px' }" @click="openProfile"><image class="author-avatar" src="/static/figma/feature/45f5fc6ea328c9e88cff7a4504824254458e9e7b.png" mode="aspectFill" /><text class="author-name">{{ commentsEmpty ? '我就是要喂猫' : '芝' }}</text><text class="owner-pill">院主</text></view>
    <view class="notice-line"><text>富贵老师对我就是要喂猫投粮4斤，积善缘，得福报～</text></view>
    <scroll-view class="dynamic-scroll" scroll-y :show-scrollbar="false">
      <image class="hero-image" src="/static/figma/feature/d81342748c84fc1068ceb0af9525bc465f5517e8.png" mode="scaleToFill" />
      <view class="post-card">
        <view class="source-row"><view class="source-avatars"><image v-for="i in 5" :key="i" class="source-avatar" src="/static/figma/dynamic-source-avatar.jpg" mode="aspectFill" /></view><text class="source-label">来自花开富贵投喂的4斤猫粮</text></view>
        <text class="post-copy">哎 又忍不住开始书写小作文　　此时的弟弟应该刚下自习不到20分钟哎 又忍不住开始书写小作文 此时的弟弟应该刚下自习不到20分钟哎 又忍不住开始书写小作文　　此时的弟弟应该刚下自习不到20分钟哎 又忍不住开始书写小作文</text>
        <view class="post-meta"><text>昨天 20:45　江西</text><view class="like-action" @click="liked = !liked"><uni-icons :type="liked ? 'hand-up-filled' : 'hand-up'" :color="liked ? '#ff3b52' : '#777777'" :size="18" /><text>{{ liked ? 33 : 32 }}</text></view></view>
      </view>
      <view class="comments-section">
        <text class="comments-title">共 2026 条评论</text>
        <view v-if="commentsEmpty" class="comment-empty"><image src="/static/figma/dynamic-comment-empty.png" mode="aspectFit" /><text class="comment-empty-title">还没有评论</text><text class="comment-empty-subtitle">快去领养第一只小可爱吧</text><button class="comment-empty-button">抢首评</button></view>
        <template v-else>
        <view class="composer"><image src="/static/avatar.png" mode="aspectFill" /><text>有话要说，告诉她这条路并不孤单</text><uni-icons class="composer-icon" type="chat" color="#999999" :size="17" /></view>
        <view v-for="comment in comments" :key="comment.id" class="comment-row">
          <image class="comment-avatar" src="/static/figma/dynamic-comment-avatar.png" mode="aspectFill" /><view class="comment-main"><view><text class="comment-name">{{ comment.name }}</text><text v-if="comment.owner" class="owner-pill">院主</text></view><text class="comment-copy">{{ comment.copy }}</text><text class="comment-meta">昨天 20:45　江西　回复</text></view><view class="comment-like"><uni-icons type="hand-up-filled" color="#ff3b52" :size="15" /><text>32</text></view>
        </view>
        <text class="expand-copy">展开 4 条回复</text>
        </template>
      </view>
      <view class="rank-strip">
        <view class="rank-main"><image src="/static/figma/dynamic-source-avatar.jpg" mode="aspectFill" /><view><view class="rank-name-row"><text>平安是福</text><text>院主</text></view><text class="rank-stats">13人已投喂 32斤粮</text></view></view>
        <view class="rank-side"><text>小院投喂第一名</text><text>排行榜 〉</text></view>
      </view>
      <view class="yard-summary" @click="openYard">
        <view class="yard-head"><image src="/static/user.png" mode="aspectFill" /><view><view><text class="yard-name">我就是要喂猫</text><text class="verified">已实名</text></view><text class="yard-distance">3.2km 金水区</text></view></view>
        <view class="yard-tags"><PawStatusPill text="6只猫咪" tone="warning" /><PawStatusPill text="已成立2个月" tone="warning" /><PawStatusPill text="入驻4人" tone="warning" /></view>
        <text class="yard-copy">春去秋来二十年的救助流浪猫时间匆匆而去，在此希望每个...</text>
        <view class="yard-gallery"><image v-for="i in 3" :key="i" src="/static/figma/dynamic-yard-photo.png" mode="aspectFill" /></view>
      </view><view class="scroll-spacer" />
      <view class="bottom-bar paw-safe-bottom"><view class="minor-action"><uni-icons type="redo" color="#222222" :size="22" /><text>分享</text></view><view class="minor-action"><uni-icons :type="commentsEmpty ? 'plus' : 'eye'" color="#222222" :size="22" /><text>{{ commentsEmpty ? '入驻' : '去看看' }}</text></view><view class="minor-action"><uni-icons type="heart" color="#222222" :size="22" /><text>领养</text></view><PawPrimaryButton class="feed-button" :text="commentsEmpty ? '投点猫粮' : '云养一只'" @click="feed" /></view>
    </scroll-view>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawPrimaryButton from '@/components/PawPrimaryButton.vue'
import PawStatusPill from '@/components/PawStatusPill.vue'
import { openUserProfile } from '@/utils/profileNav.js'
export default {
  components: { PawPageNav, PawPrimaryButton, PawStatusPill },
  data() { return { statusBarHeight: 20, liked: false, yardId: '1', commentsEmpty: false, comments: [
    { id: 1, name: '姜栋', owner: true, copy: '给我点赞给我点赞给我点赞给我点赞给我点赞' },
    { id: 2, name: '花开春晓', owner: false, copy: '2″ 语音' },
    { id: 3, name: '姜栋', owner: true, copy: '回复 花开春晓：谢谢啊啊啊啊啊啊谢谢' }
  ] } },
  onLoad(query) {
    const s = uni.getSystemInfoSync()
    this.statusBarHeight = s.statusBarHeight || 20
    // #ifdef H5
    this.statusBarHeight = 44
    // #endif
    if (query && query.yardId) this.yardId = String(query.yardId)
    this.commentsEmpty = !!(query && query.state === 'comments-empty')
  },
  methods: {
    openProfile() { openUserProfile({ pawId: 'owner-1', nickname: '芝', avatar: '/static/user.png' }) },
    openYard() { uni.navigateTo({ url: `/pages/commodityDetails/index?id=${encodeURIComponent(this.yardId)}` }) },
    feed() { uni.showToast({ title: '已进入云养投喂', icon: 'none' }) }
  }
}
</script>

<style scoped>
.dynamic-page{position:relative;height:100vh;overflow:hidden;background:#fff;color:#252525}.nav-more{display:block;width:60rpx;font-size:24rpx;letter-spacing:3rpx;text-align:center}.dynamic-scroll{height:calc(100vh - 212rpx)}.author-row{position:absolute;left:37px;z-index:30;display:flex;align-items:center;height:34px;padding:0}.author-avatar{width:34px;height:34px;border-radius:50%}.author-name{margin-left:10px;font-size:14px}.owner-pill,.verified{margin-left:4px;padding:1px 4px;border-radius:4px;background:#fff0f2;color:#ff4964;font-size:9px}.notice-line{position:absolute;top:113px;right:0;left:0;z-index:30;overflow:hidden;height:21px;padding:0 9px;background:#fffbd5;font-size:11px;line-height:21px;white-space:nowrap}.hero-image{display:block;width:calc(100% - 140rpx);height:1000rpx;margin-top:22rpx;margin-left:70rpx;background:#eee;object-position:left center}.post-card{padding:18rpx 30rpx 14rpx;border-bottom:1rpx solid #eee}.source-row{display:flex;align-items:center}.source-avatars{display:flex;width:222rpx}.source-avatar{width:48rpx;height:48rpx;margin-right:-7rpx;border:2rpx solid #fff;border-radius:50%;object-position:center bottom}.source-label{flex:1;padding:8rpx 14rpx;background:#f4f6fa;color:#47618c;font-size:22rpx}.post-copy{display:block;margin-top:18rpx;font-size:30rpx;line-height:48rpx}.post-meta{display:flex;justify-content:space-between;color:#999;font-size:22rpx}.like-action{display:flex;gap:10rpx;align-items:center;color:#777;font-size:28rpx}.comments-section{padding:24rpx 30rpx 30rpx;border-bottom:12rpx solid #f5f5f5}.comments-title{display:block;margin-bottom:24rpx;font-size:26rpx}.composer{display:flex;align-items:center;height:68rpx;padding:0 18rpx;border-radius:34rpx;background:#f5f5f5;color:#aaa;font-size:22rpx}.composer image{width:48rpx;height:48rpx;margin-right:14rpx;border-radius:50%}.composer-icon{margin-left:auto;font-size:30rpx}.comment-row{display:flex;align-items:flex-start;margin-top:24rpx}.comment-avatar{flex:0 0 auto;width:64rpx;height:64rpx;border-radius:50%;background:#dedede}.comment-main{min-width:0;flex:1;margin-left:14rpx}.comment-name{color:#8c8c8c;font-size:22rpx}.comment-copy{display:block;margin-top:6rpx;font-size:22rpx;line-height:28rpx}.comment-meta{display:block;margin-top:10rpx;color:#999;font-size:20rpx}.comment-like{display:flex;gap:8rpx;align-items:center;color:#777;font-size:22rpx}.heart{color:#ff3b52;font-size:28rpx}.expand-copy{display:block;margin:14rpx 0 0 78rpx;color:#666;font-size:22rpx}.yard-summary{padding:24rpx 30rpx}.yard-head{display:flex;align-items:center}.yard-head image{width:68rpx;height:68rpx;margin-right:14rpx;border-radius:50%}.yard-name{font-size:26rpx;font-weight:600}.yard-distance{display:block;margin-top:6rpx;color:#999;font-size:20rpx}.yard-tags{display:flex;gap:10rpx;margin-top:16rpx}.yard-copy{display:block;margin-top:16rpx;color:#888;font-size:23rpx;line-height:34rpx}.yard-gallery{display:flex;gap:8rpx;margin-top:16rpx}.yard-gallery image{width:200rpx;height:170rpx;border-radius:10rpx}.scroll-spacer{height:30rpx}.bottom-bar{display:flex;align-items:center;min-height:104rpx;padding:12rpx 28rpx;box-sizing:border-box;border-top:1rpx solid #eee;background:#fff}.minor-action{display:flex;flex-direction:column;align-items:center;width:92rpx;color:#777;font-size:20rpx}.minor-icon{color:#222;font-size:34rpx;line-height:38rpx}.feed-button{flex:1;margin-left:10rpx}
/* #ifdef H5 */
.dynamic-page{height:auto;min-height:100vh;overflow:visible}.dynamic-scroll{height:auto;overflow:visible}
.dynamic-page :deep(.hero-image img){object-position:left center!important}.dynamic-page :deep(.source-avatar img){object-position:center bottom!important}
.dynamic-page :deep(.hero-image>div){background-position:left center!important}.dynamic-page :deep(.source-avatar>div){background-position:center bottom!important}
/* #endif */
.comment-empty{height:250px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#999;font-size:12px}.comment-empty image{width:95px;height:72px}.comment-empty text{margin-top:12px}
.h5-status-bar{position:absolute;left:0;top:0;width:100%;height:40px;z-index:80;pointer-events:none}
.comment-row{margin-top:16px;min-height:52px}.comment-copy{line-height:16px}
.rank-strip{height:84px;padding:8px 14px;box-sizing:border-box;border-top:1px solid #eee;border-bottom:6px solid #f5f5f5;display:flex;align-items:center;justify-content:space-between;background:#fff}
.rank-main{display:flex;align-items:center}.rank-main image{width:38px;height:38px;border-radius:50%;margin-right:8px}.rank-name-row{display:flex;align-items:center;font-size:12px}.rank-name-row text:last-child{margin-left:5px;padding:1px 4px;border-radius:6px;background:#5b3d00;color:#fff;font-size:9px}.rank-stats{display:block;margin-top:7px;font-size:13px;color:#555}.rank-side{display:flex;height:52px;flex-direction:column;align-items:flex-end;justify-content:space-between;font-size:12px;color:#aaa}.rank-side text:first-child{color:#f1b500;font-weight:600}
.comment-empty{height:260px}.comment-empty image{width:78px;height:79px}.comment-empty-title{margin-top:7px;font-size:14px;color:#555}.comment-empty-subtitle{margin-top:3px;font-size:12px;color:#999}.comment-empty-button{width:76px;height:33px;margin-top:12px;padding:0;border:1px solid #e5e5e5;border-radius:18px;background:#fff;color:#555;font-size:13px;line-height:31px}.comment-empty-button::after{display:none}
.comments-section{padding-bottom:40px}.dynamic-page:not(.comments-empty-state) .comments-section{padding-bottom:90px}.bottom-bar{min-height:83px}.yard-summary{padding-bottom:32px}
.comments-empty-state .yard-summary{padding-bottom:39px}
</style>
