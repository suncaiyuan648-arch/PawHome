<template>
  <view class="ev-page" :class="listMode ? 'ev-page--list' : 'ev-page--confirm'" :style="pageStyle">
    <!-- #ifndef MP-WEIXIN -->
    <image v-if="listMode" class="ev-list-top-reference" src="/static/figma/adoption-proof-list-top.png" mode="scaleToFill" />
    <image v-else class="ev-confirm-top-reference" src="/static/figma/adoption-confirm-top.png" mode="scaleToFill" />
    <!-- #endif -->
    <view class="ev-nav"><image src="/static/nav-back-arrow.png" mode="aspectFit"/><text>{{ listMode ? '逢猫' : '确认领养' }}</text><view class="ev-cap"/></view>
    <template v-if="listMode">
      <view class="truth-row"><text>已有 <b>22</b> 人证实为真</text><view>我也来证实</view></view>
      <view class="proof-card"><text class="proof-title">全部证实（2人）</text><view v-for="i in 2" :key="i" class="proof-row"><image src="/static/figma/feeding/2aa0d5e4a47ba5a30dfbda447d2b0e0acab9c94f.png" mode="aspectFill"/><view><view class="proof-author-line"><text>姜栋</text><LevelCapsule /></view><text>给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞</text><text class="muted">昨天 20:45　江西</text></view><text class="like">👍 32</text></view></view>
    </template>
    <template v-else>
      <view class="confirm-actions"><text>取消</text><view>提交</view></view>
      <view class="compare-card"><view v-for="(label,i) in ['小咪流浪时的样子','小咪在新家的样子']" :key="label"><view class="upload"><uni-icons type="image" color="#999" :size="22"/><text>正脸照片/视频</text></view><text>{{label}}</text></view></view>
      <view class="story"><textarea maxlength="500" placeholder="分享您的领养过程以及您领养后的感受"/><text>0/500</text></view>
      <text class="explain">院主和审核团会根据您上传的图片及领养申请来投票<br/>您是否为真实领养</text>
      <view class="examples"><view v-for="i in 2" :key="i"><image src="/static/figma/certify/ca69b21b61516589aa506613e5d3c587881cb57d.png" mode="aspectFill"/><text>示例</text></view></view>
    </template>
  </view>
</template>
<script>
import LevelCapsule from '@/components/LevelCapsule.vue'
export default { name:'PawAdoptionEvidence', components: { LevelCapsule }, props:{mode:{type:String,default:'confirm'}}, data(){return{statusBarHeight:0}}, computed:{listMode(){return this.mode==='list'},pageStyle(){return this.statusBarHeight?{paddingTop:`${this.statusBarHeight}px`}:{}}}, created(){const s=uni.getSystemInfoSync();this.statusBarHeight=s.statusBarHeight||0} }
</script>
<style scoped>
.ev-page{position:relative;min-height:100vh;background:#f5f5f5;color:#333;padding-top:44px;box-sizing:border-box}.ev-list-top-reference{position:absolute;left:0;top:0;width:100%;height:108px;z-index:20;pointer-events:none}.ev-confirm-top-reference{position:absolute;left:0;top:0;width:100%;height:132px;z-index:20;pointer-events:none}.ev-page--confirm{padding-top:0}.ev-page--confirm .ev-nav{height:84px;visibility:hidden}.ev-page--confirm .confirm-actions{visibility:hidden}.ev-nav{height:64px;background:#fff;position:relative;display:flex;align-items:center;justify-content:center}.ev-nav>image{position:absolute;left:16px;width:10px;height:18px}.ev-nav>text{font-size:16px}.ev-cap{position:absolute;right:8px;width:78px;height:30px;border-radius:15px;border:1px solid #eee}.confirm-actions{height:48px;padding:0 15px;display:flex;align-items:center;justify-content:space-between;background:#fff}.confirm-actions>view{width:57px;height:31px;border-radius:3px;background:#ffe000;display:flex;align-items:center;justify-content:center;font-size:13px}.compare-card{height:175px;margin:0 15px;background:#fff;border-radius:9px 9px 0 0;display:flex;justify-content:space-between;padding:22px 47px 0;box-sizing:border-box}.compare-card>view{display:flex;flex-direction:column;align-items:center;gap:9px}.upload{width:106px;height:106px;background:#f5f5f5;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#999}.upload text,.compare-card>view>text{font-size:12px;color:#999}.story{position:relative;height:160px;margin:0 15px;background:#fff;border-top:1px solid #eee}.story textarea{width:100%;height:100%;padding:11px 18px;box-sizing:border-box;font-size:15px}.story>text{position:absolute;right:12px;bottom:11px;font-size:12px;color:#aaa}.explain{display:block;margin:12px 25px 0;font-size:11px;line-height:14px;color:#999}.examples{display:flex;gap:5px;margin:38px 17px}.examples>view{position:relative;width:83px;height:83px}.examples image{width:100%;height:100%}.examples text{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px}.truth-row{height:64px;padding:8px 27px 0;box-sizing:border-box;display:flex;align-items:flex-start;gap:8px}.truth-row text{font-size:14px}.truth-row b{font-size:22px;color:#ff9d00}.truth-row>view{padding:4px 13px;border-radius:14px;background:#ff9d00;color:#fff;font-size:11px}.proof-card{margin:0 15px;padding:24px 15px;background:#fff;border-radius:20px}.proof-title{display:block;text-align:center;font-size:15px;margin-bottom:17px}.proof-row{position:relative;display:flex;gap:9px;margin-bottom:23px}.proof-row image{width:34px;height:34px;border-radius:50%}.proof-row>view{display:flex;flex-direction:column;max-width:235px}.proof-row>view>text{font-size:11px;line-height:13px}.proof-author-line{display:flex;align-items:center;gap:4px;height:16px}.proof-author-line>text{font-size:11px;line-height:13px}.proof-row b{padding:1px 4px;border-radius:3px;background:#543900;color:#fff;font-size:8px}.proof-row .muted{margin-top:6px;color:#999}.like{position:absolute;right:0;bottom:0;font-size:11px;color:#666}
/* #ifdef MP-WEIXIN */
.ev-cap{display:none}
/* #endif */
</style>
