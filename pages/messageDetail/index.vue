<template>
  <view class="detail-page paw-page" :class="{ 'detail-page--white': type === 'interaction' }">
    <PawPageNav :title="pageTitle" :background="type === 'interaction' ? '#ffffff' : '#f5f5f5'" fallback-url="/pages/message/index" />
    <scroll-view class="detail-scroll" scroll-y :show-scrollbar="false">
      <template v-if="type === 'service'">
        <view v-for="item in serviceItems" :key="item.id" class="service-block">
          <text class="service-time">{{ item.time }}</text>
          <view class="service-card paw-surface">
            <text class="service-title">{{ item.title }}</text>
            <text class="service-copy">{{ item.copy }}</text>
            <view class="service-link-row"><text class="service-link">去查看</text><text class="service-chevron">›</text></view>
          </view>
        </view>
      </template>
      <template v-else-if="type === 'interaction'">
        <view v-for="item in interactionItems" :key="item.id" class="interaction-row">
          <image class="interaction-avatar" :src="item.avatar" mode="aspectFill" />
          <view class="interaction-main">
            <text class="interaction-name">{{ item.name }}</text>
            <view class="interaction-copy-row"><text class="interaction-copy">{{ item.copy }}</text><text class="interaction-time">{{ item.time }}</text></view>
          </view>
          <image v-if="item.thumb" class="interaction-thumb" :src="item.thumb" mode="aspectFill" />
        </view>
      </template>
      <template v-else>
        <view v-for="item in activityItems" :key="item.id" class="activity-card paw-surface">
          <image class="activity-image" :src="item.image" mode="aspectFill" />
          <text class="activity-title">{{ item.title }}</text>
          <view class="activity-meta">
            <image class="activity-brand" src="/static/figma/brand-logo.png" mode="aspectFill" />
            <text class="activity-account">逢猫官方账号</text><text class="activity-time">{{ item.time }}</text>
          </view>
        </view>
      </template>
      <view class="scroll-spacer" />
    </scroll-view>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
export default {
  components: { PawPageNav },
  data() {
    return {
      type: 'service',
      serviceItems: [
        { id: 1, time: '14:41', title: '退款成功', copy: '您的退款申请已通过，订单退款成功' },
        { id: 2, time: '08-27  13:20', title: '服务完成', copy: '喂养师完成服务，已上传服务报告' },
        { id: 3, time: '08-26  17:26', title: '接单成功', copy: '已有喂养师接单，可与喂养师沟通服务事宜' },
        { id: 4, time: '08-25  04:31', title: '下单成功', copy: '您已下单成功，等待接单中' }
      ],
      interactionItems: [
		{ id: 1, name: '仔仔熊', copy: '评论了你：不要灰心，不要灰心，不要灰心', time: '1小时前', avatar: '/static/figma/message/interaction-avatar-1.png', thumb: '/static/figma/interaction-thumb-1.jpg' },
		{ id: 2, name: '青苹果味雪饼', copy: '点赞了你的动态', time: '1小时前', avatar: '/static/figma/message/interaction-avatar-2.png', thumb: '/static/figma/interaction-thumb-1.jpg' },
		{ id: 3, name: '青苹果味雪饼', copy: '关注了你', time: '1小时前', avatar: '/static/figma/message/interaction-avatar-2.png', thumb: '' }
      ],
      activityItems: [
        { id: 1, title: '合肥！明珠广场线下领养活动5月27号开始！', time: '1小时前', image: '/static/figma/activity-hefei.jpg' },
        { id: 2, title: '长沙！德思勤广场线下领养活动4月29号开始！', time: '04-28', image: '/static/figma/activity-changsha.jpg' }
      ]
    }
  },
  computed: { pageTitle() { return { service: '服务订单消息', interaction: '互动消息', activity: '活动消息' }[this.type] || '消息' } },
  onLoad(options) {
    const type = String(options.type || 'service')
    this.type = ['service', 'interaction', 'activity'].includes(type) ? type : 'service'
  }
}
</script>

<style scoped>
.detail-page { height: 100vh; overflow: hidden; }
.detail-page--white { background: #ffffff; }
.detail-scroll { height: calc(100vh - 160rpx); box-sizing: border-box; }
.service-block { padding: 0 30rpx; }
.service-time { display: block; padding: 44rpx 0; color: #999999; font-size: 24rpx; text-align: center; }
.service-block:first-child .service-time { padding: 14rpx 0; }
.service-card { padding: 28rpx 30rpx 0; }
.service-title { display: block; color: #222222; font-size: 30rpx; font-weight: 500; }
.service-copy { display: block; margin-top: 10rpx; padding-bottom: 28rpx; color: #666666; font-size: 24rpx; line-height: 36rpx; }
.service-link-row { display: flex; align-items: center; justify-content: space-between; min-height: 126rpx; border-top: 1rpx solid #eeeeee; }
.service-link { color: #00a8d8; font-size: 30rpx; font-weight: 500; }
.service-chevron { color: #999999; font-size: 48rpx; font-weight: 300; }
.interaction-row { display: flex; align-items: flex-start; min-height: 142rpx; margin-left: 32rpx; padding: 20rpx 30rpx 20rpx 0; box-sizing: border-box; border-bottom: 1rpx solid #eeeeee; }
.interaction-avatar { flex: 0 0 auto; width: 96rpx; height: 96rpx; border-radius: 50%; }
.interaction-main { min-width: 0; flex: 1; margin-left: 20rpx; }
.interaction-name { display: block; color: #222222; font-size: 28rpx; line-height: 40rpx; }
.interaction-copy-row { display: flex; align-items: baseline; margin-top: 4rpx; }
.interaction-copy { overflow: hidden; max-width: 360rpx; color: #333333; font-size: 26rpx; line-height: 36rpx; text-overflow: ellipsis; white-space: nowrap; }
.interaction-time { flex: 0 0 auto; margin-left: 10rpx; color: #999999; font-size: 20rpx; }
.interaction-thumb { flex: 0 0 auto; width: 88rpx; height: 88rpx; margin-left: 12rpx; border-radius: 4rpx; }
.activity-card { overflow: hidden; margin: 16rpx 30rpx 30rpx; }
.activity-image { display: block; width: 100%; height: 288rpx; }
.activity-title { display: block; padding: 18rpx 20rpx 16rpx; color: #222222; font-size: 28rpx; line-height: 40rpx; }
.activity-meta { display: flex; align-items: center; padding: 0 20rpx 24rpx; }
.activity-brand { width: 26rpx; height: 26rpx; border-radius: 50%; }
.activity-account, .activity-time { margin-left: 10rpx; color: #999999; font-size: 22rpx; }
.scroll-spacer { height: calc(40rpx + env(safe-area-inset-bottom)); }
</style>
