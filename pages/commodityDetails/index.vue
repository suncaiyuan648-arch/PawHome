<template>
  <view class="detail-shell">
    <PawYardDetailFigma :state="figmaState" />
    <view v-if="helpPopup" class="help-mask">
      <view class="help-dialog" :class="{ 'help-dialog--food': helpPopup === 'food-stat' }">
        <text class="help-title">{{ helpContent.title }}</text><view class="help-divider"></view>
        <template v-if="helpPopup === 'food-stat'"><view class="food-stat-row"><text>小院累计获得投粮</text><text>999斤</text></view><view class="food-stat-row"><text>小院累计获粮次数</text><text>456次</text></view></template>
        <text v-else class="help-copy">{{ helpContent.copy }}</text><view class="help-footer">我知道了</view>
      </view>
    </view>
    <view v-if="overlayState === 'reply-idle' || overlayState === 'reply-input'" class="reply-mask">
      <view class="reply-panel">
        <view class="reply-input"><text>{{ overlayState === 'reply-input' ? '这是一个充满希望的季节，希望小猫今年也可以好好地' : '说点什么' }}</text></view>
        <view class="reply-actions"><uni-icons type="mic" color="#444" :size="20"></uni-icons><uni-icons type="image" color="#444" :size="20"></uni-icons><view class="reply-send">发送</view></view>
      </view>
    </view>
    <view v-if="overlayState === 'feed-popup'" class="feed-mask">
      <view class="feed-sheet">
        <view class="feed-sheet-head"><text>加入1,199,999位逢猫侠，一起照顾流浪猫</text><uni-icons type="closeempty" color="#222" :size="18"></uni-icons></view>
        <text class="feed-sheet-copy">支付成功后平台将猫粮寄给该小院\n院主会在规定时间内喂猫并向您反馈</text>
        <view class="feed-options"><view v-for="item in feedOptions" :key="item.jin" class="feed-option" :class="{ selected:item.selected }"><image :src="item.img" mode="aspectFit"></image><text>{{ item.jin }}</text><text>{{ item.price }}</text><text>{{ item.days }}</text></view></view>
        <text class="feed-more">了解猫粮　›</text>
        <text class="feed-rules">云养300天权益：\n1.您购买的15斤猫粮寄给小院；\n2.院主将会在接下来300天用这15斤猫粮喂“豆豆”；\n3.每周至少反馈1次“豆豆”的投喂视频图片，尽量做到一天一反馈；\n4.院主及时更新“豆豆”的情况；\n5.您获得豆豆的优先领养权；\n6.云领养期间，申请领养需要您的同意才会发送给院主审核；</text>
        <view class="feed-confirm"></view>
        <view class="feed-agreement"><image src="/static/yard-joined-checked.png" mode="aspectFit" /><text>已经阅读完 <b>《投喂协议》</b> 和 <b>《防诱导诈骗提醒》</b></text></view>
      </view>
    </view>
  </view>
</template>

<script>
import PawYardDetailFigma from '@/components/PawYardDetailFigma.vue'

export default {
  components: { PawYardDetailFigma },
  data() {
    return { figmaState: 'dynamic', overlayState: '', helpPopup: '', feedOptions: [
      { jin:'0.4斤', price:'6.9元', days:'云养3天', img:'/static/feed-popup/feed-kibble.png' },
      { jin:'4斤', price:'29.9元', days:'云养30天', img:'/static/feed-popup/feed-bowl.png' },
      { jin:'40斤', price:'299.9元', days:'云养300天', img:'/static/feed-popup/feed-bag.png', selected:true }
    ] }
  },
  computed: { helpContent() { return this.helpPopup === 'feedback-stat' ? { title:'平均反馈时长', copy:'院主共反馈78次，平均反馈时长3天2小时；平均反馈时长指的是院主自投粮物流签收后的平均上传动态反馈时间，未计算次数内的反馈不计入' } : { title:'帮助领养', copy:'截止目前，院主已从43位领养人中仔细筛选出23人，并成功为13只猫咪找到新家，沉福它们，感谢院主和领养人不辞辛苦的坚持与努力' } } },
  onLoad(options = {}) {
    const allowed = ['dynamic', 'dynamic-empty', 'feeding', 'dynamic-expanded']
    this.figmaState = allowed.includes(options.state) ? options.state : 'dynamic'
    this.overlayState = ['reply-idle', 'reply-input', 'feed-popup'].includes(options.state) ? options.state : ''
    this.helpPopup = ['help-adopt', 'feedback-stat', 'food-stat'].includes(options.popup) ? options.popup : ''
  }
}
</script>

<style scoped>
page { background: #fff; }
.detail-shell{min-height:100vh}
.reply-mask,.feed-mask{position:fixed;inset:0;z-index:900;background:#5b5b5b}
.reply-panel{position:absolute;left:0;right:0;top:410px;height:130px;background:#fff;border-radius:14px 14px 0 0;overflow:hidden}
.reply-input{height:75px;margin:10px 12px 0;padding:9px 14px;border-radius:12px;background:#f5f5f7;box-sizing:border-box;color:#555;font-size:14px;line-height:18px}
.reply-actions{height:45px;display:flex;align-items:center;gap:18px;padding:0 24px}
.reply-send{margin-left:auto;width:54px;height:30px;border-radius:16px;background:#fff259;color:#333;display:flex;align-items:center;justify-content:center;font-size:13px}
.feed-sheet{position:absolute;left:0;right:0;bottom:0;height:599px;padding:24px 24px 14px;border-radius:18px 18px 0 0;background:#fff;box-sizing:border-box}
.feed-sheet-head{display:flex;align-items:center;justify-content:space-between;font-size:15px;color:#222}.feed-sheet-head>text{font-weight:500;white-space:nowrap}
.feed-sheet-copy{display:block;margin-top:12px;color:#999;font-size:12px;line-height:18px;white-space:pre-line}
.feed-options{display:flex;justify-content:space-between;margin-top:22px}.feed-option{width:94px;height:98px;padding:9px 4px;border-radius:14px;background:#f6f6f6;display:grid;grid-template-columns:34px 1fr;grid-template-rows:38px 24px 20px;align-items:center;text-align:center;box-sizing:border-box}.feed-option.selected{background:#ffe10b}.feed-option image{width:34px;height:34px}.feed-option>text:nth-of-type(1){font-size:16px}.feed-option>text:nth-of-type(2){grid-column:1/3;font-size:14px}.feed-option>text:nth-of-type(3){grid-column:1/3;color:#888;font-size:12px}.feed-option.selected>text:nth-of-type(3){color:#715d00}
.feed-more{display:block;margin-top:16px;text-align:right;color:#999;font-size:12px}.feed-rules{display:block;margin-top:12px;color:#999;font-size:11px;line-height:15px;white-space:pre-line}.feed-confirm{position:absolute;left:25px;right:25px;bottom:41px;height:46px;border-radius:24px;background:#ffe10b}.feed-agreement{position:absolute;left:52px;bottom:11px;display:flex;align-items:center;font-size:11px;color:#777}.feed-agreement image{width:13px;height:13px;margin-right:5px}.feed-agreement b{color:#4285d4;font-weight:400}
.help-mask{position:fixed;inset:0;z-index:950;background:#5b5b5b}.help-dialog{position:absolute;left:40px;top:260px;width:295px;height:234px;border-radius:19px;background:#fff;overflow:hidden;box-sizing:border-box}.help-title{display:block;height:51px;line-height:51px;text-align:center;font-size:20px;font-weight:600;color:#222}.help-divider{height:1px;margin:0 22px;background:#f0f0f0}.help-copy{display:flex;height:130px;padding:19px 34px 14px;align-items:flex-start;justify-content:center;box-sizing:border-box;text-align:center;color:#999;font-size:14px;line-height:16px}.help-footer{position:absolute;left:0;right:0;bottom:0;height:51px;border-top:1px solid #eee;display:flex;align-items:center;justify-content:center;color:#999;font-size:15px}.help-dialog--food{left:62px;width:251px;height:214px}.food-stat-row{height:44px;padding:0 36px;display:flex;align-items:center;justify-content:space-between;color:#999;font-size:14px}.food-stat-row text:last-child{color:#333;font-size:16px}
</style>
