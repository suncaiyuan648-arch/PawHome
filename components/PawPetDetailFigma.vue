<template>
  <view class="pet-detail-figma" :class="'pet-detail-figma--' + variant">
    <view class="hero-wrap">
      <image class="hero-exact" src="/static/figma/pet-detail/hero-exact.png" mode="aspectFill" />
      <view class="hero-back" @click="$emit('back')" />
      <view class="hero-album" @click="$emit('album')" />
    </view>

    <view class="pet-strip">
      <image v-for="(x, i) in stripItems" :key="i" :class="['strip-avatar', { active: i === 3 }]" :style="{ left: x + 'px' }" :src="i === 3 ? '/static/figma/pet-detail/strip-active.png' : '/static/figma/pet-detail/strip-orange.png'" mode="aspectFill" />
      <view class="strip-triangle" />
    </view>

    <view class="pet-card">
      <view class="pet-heading">
        <view class="pet-title-row"><text class="pet-name">小黄</text><text class="cloud-tag">已云养</text></view>
        <text class="pet-order">4/12</text>
      </view>
      <view class="pet-tags">
        <text>中华田园犬</text><text>男生</text><text>已绝育</text><text>2岁3个月</text>
      </view>
      <text class="pet-copy">小黄是我见过最乖最帅最萌的小猫，饭量很大，<br />希望可以多多投喂猫粮给它</text>
      <view class="yard-row">
        <image class="yard-avatar" src="/static/figma/pet-detail/yard-avatar.png" mode="aspectFill" />
        <text class="yard-name">我就是要喂猫</text>
        <text class="yard-tag">小院</text>
      </view>
    </view>

    <view class="info-card">
      <view class="info-row"><text>心情</text><text>开心</text></view>
      <view class="info-row"><text>状态</text><text>极度饥饿</text></view>
      <view class="info-row"><text>云家长</text><view class="parent-value"><image src="/static/figma/adoption-flow/pet-owner.png" mode="aspectFill" /><text>姜栋</text></view></view>
      <view class="info-row"><text>剩余云养天数</text><text>16/30天</text></view>
      <view class="info-row"><text>剩余粮食</text><text class="link">点击查看图片</text></view>
      <view v-if="variant === 37" class="info-row"><text>投粮详情</text><text class="link">点击查看</text></view>
      <text class="continuous">已连续云养25天</text>
    </view>

    <view class="message-card">
      <text class="message-title">云家长寄语留言板</text>
      <view class="message-row">
        <image class="message-avatar" src="/static/figma/pet-detail/message-avatar.png" mode="aspectFill" />
        <view class="message-body">
          <view class="message-author"><text>姜栋</text><LevelCapsule level="1" /><text class="role">小黄的第3任云家长</text></view>
          <text class="message-copy">给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞</text>
          <view class="message-meta"><text>昨天 20:45&nbsp;&nbsp;江西&nbsp;&nbsp;回复</text><view class="like"><image src="/static/figma/pet-detail/icon-like.png" mode="scaleToFill" /><text>32</text></view></view>
        </view>
      </view>
    </view>

    <view v-if="variant === 35" class="adopt-footer">
      <view class="footer-mini"><image class="footer-icon" src="/static/figma/pet-detail/icon-share.png" mode="scaleToFill" /><text>分享</text></view>
      <view class="footer-mini"><image class="footer-icon" src="/static/figma/pet-detail/icon-join.png" mode="scaleToFill" /><text>入驻</text></view>
      <view class="footer-mini"><image class="footer-icon" src="/static/figma/pet-detail/icon-heart.png" mode="scaleToFill" /><text>领养</text></view>
      <view class="cloud-button"><image class="bowl" src="/static/figma/pet-detail/icon-bowl.png" mode="scaleToFill" /><text>云养一只</text></view>
    </view>
    <view v-else-if="variant === 36" class="manage-footer">
      <view><image class="manage-icon" src="/static/figma/pet-detail/icon-edit.png" mode="scaleToFill" /><text>修改信息</text></view>
      <view><image class="manage-icon" src="/static/figma/pet-detail/icon-manage-pet.png" mode="scaleToFill" /><text>管理宠物</text></view>
      <view><image class="manage-icon" src="/static/figma/pet-detail/icon-album.png" mode="scaleToFill" /><text>管理相册</text></view>
      <view class="danger"><image class="manage-icon" src="/static/figma/pet-detail/icon-delete.png" mode="scaleToFill" /><text>删除宠物</text></view>
    </view>
  </view>
</template>

<script>
import LevelCapsule from '@/components/LevelCapsule.vue'

export default {
  name: 'PawPetDetailFigma',
  components: { LevelCapsule },
  props: {
    variant: { type: Number, default: 35 },
  },
  data() {
    return { stripItems: [8, 59, 110, 161, 220, 271, 322] };
  },
};
</script>

<style lang="less" scoped>
.pet-detail-figma{position:relative;width:375px;height:1232px;overflow:hidden;background:#f5f5f5;color:#333;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Helvetica Neue',sans-serif;box-sizing:border-box}.hero-wrap{position:relative;width:375px;height:375px}.hero-exact{display:block;width:375px;height:375px}.hero-back{position:absolute;left:4px;top:40px;width:46px;height:48px}.hero-album{position:absolute;right:8px;bottom:0;width:72px;height:48px}.pet-strip{position:relative;width:375px;height:96px;background:#fff}.strip-avatar{position:absolute;top:29px;width:40px;height:40px;border-radius:50%}.strip-avatar.active{top:22px;width:56px;height:56px}.strip-triangle{position:absolute;left:180px;bottom:3px;width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-bottom:11px solid #fff;filter:drop-shadow(0 -1px 0 rgba(0,0,0,.02))}.pet-card{position:absolute;left:15px;top:471px;width:345px;height:220px;padding:13px 22px 14px;border-radius:19px;background:#fff;box-sizing:border-box}.pet-heading{height:31px;display:flex;align-items:flex-start;justify-content:space-between}.pet-title-row{display:flex;align-items:center}.pet-name{font-size:19px;line-height:25px;font-weight:700;color:#262626}.cloud-tag{margin-left:9px;margin-top:1px;padding:2px 7px;border-radius:5px;background:#c9ff69;color:#274b00;font-size:10px;line-height:17px}.pet-order{padding-top:7px;color:#999;font-size:11px}.pet-tags{height:31px;display:flex;align-items:flex-start;gap:5px}.pet-tags text{height:19px;padding:1px 12px;border-radius:10px;background:#ccff71;color:#1b3600;font-size:11px;line-height:17px;box-sizing:border-box}.pet-copy{display:block;height:76px;padding-top:3px;color:#4a4a4a;font-size:13px;line-height:22px;box-sizing:border-box}.yard-row{height:55px;display:flex;align-items:center}.yard-avatar{width:31px;height:31px;border-radius:50%}.yard-name{margin-left:10px;color:#333;font-size:13px}.yard-tag{margin-left:7px;padding:2px 6px;border-radius:5px;background:#fff231;color:#5c5100;font-size:9px}.info-card{position:absolute;left:15px;top:699px;width:345px;height:203px;padding:14px 22px 29px;border-radius:19px;background:#fff;box-sizing:border-box}.pet-detail-figma--37 .info-card{height:237px}.info-row{height:32px;display:flex;align-items:center;justify-content:space-between;color:#777;font-size:13px}.info-row>text:last-child{color:#555}.info-row .link{color:#087cff!important}.parent-value{display:flex;align-items:center;color:#555}.parent-value image{width:22px;height:22px;margin-right:6px;border-radius:50%}.continuous{position:absolute;right:22px;bottom:9px;padding:1px 5px;border-radius:3px;background:#c98d55;color:#fff;font-size:9px;line-height:15px}.message-card{position:absolute;left:15px;top:912px;width:345px;height:200px;padding:27px 15px 18px;border-radius:19px;background:#fff;box-sizing:border-box}.pet-detail-figma--37 .message-card{top:946px;height:201px}.message-title{display:block;text-align:center;color:#333;font-size:15px;line-height:22px}.message-row{display:flex;margin-top:16px}.message-avatar{width:34px;height:34px;border-radius:50%;flex-shrink:0}.message-body{flex:1;min-width:0;margin-left:6px}.message-author{height:18px;display:flex;align-items:center;color:#555;font-size:11px}.level{margin-left:4px;padding:0 4px;border-radius:4px;background:#503500;color:#fff;font-size:8px;line-height:14px}.role{margin-left:4px;padding:0 5px;border-radius:5px;background:#fff03a;color:#5a5100;font-size:8px;line-height:14px}.message-copy{display:block;height:36px;overflow:hidden;color:#333;font-size:11px;line-height:12px}.message-meta{display:flex;align-items:center;justify-content:space-between;margin-top:8px;color:#999;font-size:10px}.like{display:flex;align-items:center;gap:6px;padding-right:1px;color:#666}.like image{width:16px;height:16px}.adopt-footer,.manage-footer{position:absolute;left:0;right:0;bottom:0;height:88px;background:#fff;border-top:1px solid #eee;box-sizing:border-box}.adopt-footer{display:flex;align-items:flex-start;padding:8px 18px}.footer-mini{width:48px;display:flex;flex-direction:column;align-items:center;color:#888;font-size:10px}.footer-icon{width:22px;height:22px;margin-bottom:2px}.cloud-button{width:188px;height:43px;margin-left:7px;border-radius:24px;background:#ffe000;display:flex;align-items:center;justify-content:center;gap:9px;color:#222;font-size:15px;font-weight:700}.bowl{width:27px;height:22px}.manage-footer{display:flex;align-items:flex-start;justify-content:space-between;padding:22px 20px;color:#777;font-size:11px}.manage-footer view{display:flex;align-items:center;white-space:nowrap}.manage-icon{width:16px;height:16px;margin-right:5px}.manage-footer .danger{color:#ff334d}
</style>
