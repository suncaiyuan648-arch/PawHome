<template>
  <view class="pet-detail-figma" :class="'pet-detail-figma--' + variant">
    <PawPageNav background="transparent" :auto-back="false" @back="$emit('back')" @layout="onNavLayout" />
    <view class="detail-scroll-stage" :style="{ marginTop: `-${navOverlayOffset}px` }">
      <scroll-view class="detail-scroll" scroll-y :show-scrollbar="false" :bounces="false" :enable-flex="true">
        <view class="hero-wrap">
          <image class="hero-exact" :src="heroSource" mode="aspectFill" @tap="onHeroTap" />
          <view class="hero-album" :class="{ 'hero-album--readonly': !canManage }" @tap="onAlbumTap">
            <PawIcon name="actions/album" :size="13" />
            <text>相册</text>
            <PawChevron v-if="canManage" class="hero-album-chevron" :size="8" />
          </view>
        </view>

        <scroll-view class="pet-strip" scroll-x :show-scrollbar="false" :enable-flex="true">
          <view class="strip-inner">
            <view v-for="(item, i) in stripItems" :key="item.id || i" class="strip-item"
              :class="{ active: i === petIndex }" @tap.stop="onStripTap(i)">
              <image class="strip-avatar" :src="item.avatar || '/static/figma/pet-detail/strip-orange.png'"
                mode="aspectFill" />
              <view v-if="i === petIndex" class="strip-triangle" />
            </view>
          </view>
        </scroll-view>

        <view class="pet-card">
          <view class="pet-heading">
            <view class="pet-title-row"><text class="pet-name">{{ displayPet.name }}</text><text class="cloud-tag">{{
              displayPet.statusLabel }}</text></view>
            <text class="pet-order">{{ petIndex + 1 }}/{{ petTotal }}</text>
          </view>
          <view class="pet-tags">
            <text v-for="(tag, index) in displayPet.tags" :key="index">{{ tag }}</text>
          </view>
          <text class="pet-copy">{{ displayPet.desc }}</text>
          <view class="yard-row">
            <image class="yard-avatar" :src="displayYard.avatar" mode="aspectFill" />
            <text class="yard-name">{{ displayYard.name }}</text>
            <text class="yard-tag">小院</text>
            <text class="yard-stat">来到小院已经<text class="yard-stat-emphasis">32天</text>了</text>
          </view>
        </view>

        <view class="info-card">
          <view class="info-row"><text>心情</text><text>开心</text></view>
          <view class="info-row"><text>状态</text><text>极度饥饿</text></view>
          <view class="info-row"><text>云家长</text><text>姜栋</text></view>
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
              <view class="message-author"><text>姜栋</text>
                <LevelCapsule level="1" /><text class="role">{{ displayPet.name }}的第3任云家长</text>
              </view>
              <text class="message-copy">给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞</text>
              <view class="message-meta"><text>昨天 20:45&nbsp;&nbsp;江西&nbsp;&nbsp;回复</text>
                <view class="like">
                  <PawIcon name="actions/like" :size="15" /><text>32</text>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view class="detail-scroll-bottom"
          :class="{ 'detail-scroll-bottom--fixed-footer': variant === 35 || variant === 36 }" />
      </scroll-view>
    </view>

    <PawFixedActionBar v-if="variant === 35" :actions="footerActions" :primary-action="primaryAction"
      @action="onFooterAction" @primary="onFooterPrimary" />
    <view v-else-if="variant === 36" class="manage-footer">
      <view data-qa="pet-detail-footer-edit" @tap="emitManageAction('edit')">
        <PawIcon name="actions/edit" :size="16" /><text>修改信息</text>
      </view>
      <view data-qa="pet-detail-footer-manage-pet" @tap="emitManageAction('manage-pet')">
        <PawIcon name="actions/manage-pet" :size="16" />
        <text>管理宠物</text>
      </view>
      <view data-qa="pet-detail-footer-album" @tap="emitManageAction('album')">
        <PawIcon name="actions/manage-album" :size="16" /><text>管理相册</text>
      </view>
      <view class="danger" data-qa="pet-detail-footer-delete" @tap="emitManageAction('delete')">
        <PawIcon name="actions/delete" :size="16" /><text>删除宠物</text>
      </view>
    </view>
  </view>
</template>

<script>
import LevelCapsule from '@/components/LevelCapsule.vue'
import PawPageNav from '@/components/PawPageNav.vue'
import PawFixedActionBar from '@/components/layout/PawFixedActionBar.vue'
import PawChevron from '@/components/base/PawChevron.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import { getWechatNavLayout } from '@/utils/navLayout.js'
import { getPawHomeYardMock } from '@/utils/yardMock.js'

export default {
  name: 'PawPetDetailFigma',
  components: { LevelCapsule, PawPageNav, PawFixedActionBar, PawChevron, PawIcon },
  emits: ['back', 'album', 'preview-image', 'select-pet', 'footer-action', 'footer-primary'],
  props: {
    variant: { type: Number, default: 35 },
    pet: { type: Object, default: () => ({}) },
    pets: { type: Array, default: () => [] },
    petIndex: { type: Number, default: 3 },
    petTotal: { type: Number, default: 12 },
    joined: { type: Boolean, default: false },
    yard: { type: Object, default: () => getPawHomeYardMock() },
    managed: { type: Boolean, default: false },
  },
  data() {
    return { navOverlayOffset: getWechatNavLayout().totalHeight };
  },
  computed: {
    heroSource() {
      const gallery = this.displayPet.gallery;
      return (Array.isArray(gallery) && gallery[0]) || this.displayPet.avatar || '/static/figma/adoption-flow/pet-hero.png';
    },
    stripItems() {
      const fallback = Array.from({ length: 8 }, (_, index) => ({
        id: `pet-strip-${index + 1}`,
        avatar: '/static/figma/pet-detail/strip-orange.png',
      }));
      const source = this.pets.length ? this.pets : fallback;
      return Array.from({ length: Math.max(8, source.length) }, (_, index) => source[index] || fallback[index % fallback.length]);
    },
    displayPet() {
      return {
        name: '小黄',
        statusLabel: '已云养',
        tags: ['中华田园犬', '男生', '已绝育', '2岁3个月'],
        desc: '小黄是我见过最乖最帅最萌的小猫，饭量很大，希望可以多多投喂猫粮给它',
        ...this.pet,
      };
    },
    displayYard() {
      return { ...getPawHomeYardMock(), ...this.yard };
    },
    footerActions() {
      return [
        { key: 'share', label: '分享', image: '/static/fenxiang.png' },
        { key: 'join', label: this.joined ? '已入驻' : '入驻', image: this.joined ? '/static/yard-joined-checked.png' : '/static/ruzhu.png' },
        { key: 'adopt', label: '领养', image: '/static/lingyang.png' },
      ];
    },
    primaryAction() {
      return { key: 'feed', label: '云养一只', iconName: 'actions/feed', iconSize: 32, size: 'md' };
    },
    canManage() {
      return this.managed || this.variant === 36;
    },
  },
  methods: {
    onHeroTap() {
      this.$emit('preview-image', {
        current: this.heroSource,
        urls: Array.isArray(this.displayPet.gallery) && this.displayPet.gallery.length
          ? this.displayPet.gallery
          : [this.heroSource],
      });
    },
    onAlbumTap() {
      if (this.canManage) this.$emit('album');
    },
    emitManageAction(key) {
      if (this.canManage) this.$emit('footer-action', { key });
    },
    onStripTap(index) {
      if (index !== this.petIndex) this.$emit('select-pet', index);
    },
    onNavLayout(layout) {
      if (layout && Number.isFinite(Number(layout.totalHeight))) this.navOverlayOffset = Number(layout.totalHeight);
    },
    onFooterAction(action) {
      this.$emit('footer-action', action);
    },
    onFooterPrimary(action) {
      this.$emit('footer-primary', action);
    },
  },
};
</script>

<style lang="less" scoped>
.pet-detail-figma {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  min-height: 0;
  overflow: hidden;
  background: #f5f5f5;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
  box-sizing: border-box;
}

.detail-scroll-stage {
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 0;
  overflow: hidden;
}

.detail-scroll {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.hero-wrap {
  position: relative;
  flex: 0 0 auto;
  width: 100%;
  height: 100vw;
  min-height: 375px;
  max-height: 375px;
}

.hero-exact {
  display: block;
  width: 100%;
  height: 100%;
}

.hero-album {
  position: absolute;
  display: flex;
  right: 9px;
  bottom: 12px;
  width: 61px;
  height: 17px;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: 5px;
  background: rgba(0, 0, 0, .3);
  color: #fff;
  font-size: 12px;
  line-height: 11px;
}

.hero-album .hero-album-chevron {
  margin-left: 1px;
}

.pet-strip {
  position: relative;
  flex: 0 0 auto;
  width: 100%;
  height: 96px;
  background: #f5f5f5;
  overflow: hidden;
  box-sizing: border-box;
}

.strip-inner {
  display: flex;
  width: max-content;
  min-width: 100%;
  height: 100%;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  padding: 21px 15px;
  flex-wrap: nowrap;
  box-sizing: border-box;
}

.strip-item {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.strip-avatar {
  display: block;
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.strip-item.active .strip-avatar {
  width: 55px;
  height: 55px;
}

.strip-triangle {
  width: 0;
  height: 0;
  margin-top: 3px;
  border-bottom: 11px solid #fff;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  position: absolute;
  bottom: -15px;
}

.pet-card {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  width: auto;
  min-height: 219px;
  margin: 0 15px;
  padding: 14px 22px;
  gap: 12px;
  border-radius: 20px;
  background: #fff;
  box-sizing: border-box;
}

.pet-heading {
  display: flex;
  min-height: 25px;
  align-items: flex-start;
  justify-content: space-between;
  flex-shrink: 0;
}

.pet-title-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.pet-name {
  font-size: 20px;
  line-height: 25px;
  font-weight: 700;
  color: #282827;
}

.cloud-tag {
  display: inline-flex;
  width: 46px;
  height: 19px;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border-radius: 8px;
  background: #c9ff69;
  color: #333;
  font-size: 11px;
  line-height: 17px;
  box-sizing: border-box;
}

.pet-order {
  padding-top: 3px;
  color: #999;
  font-size: 12px;
  line-height: 18px;
}

.pet-tags {
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  gap: 4px;
  flex-wrap: wrap;
}

.pet-tags text {
  display: inline-flex;
  min-height: 19px;
  align-items: center;
  justify-content: center;
  padding: 2px 14px;
  border-radius: 22px;
  background: #e0ff89;
  color: #000;
  font-size: 12px;
  line-height: 15px;
  box-sizing: border-box;
}

.pet-copy {
  display: block;
  min-height: 42px;
  flex: 1 1 auto;
  color: #282827;
  font-size: 14px;
  line-height: 22px;
}

.yard-row {
  display: flex;
  min-height: 34px;
  align-items: center;
  flex-shrink: 0;
  margin: 0 -4px;
}

.yard-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
}

.yard-name {
  margin-left: 6px;
  color: #333;
  font-size: 14px;
  line-height: 20px;
}

.yard-tag {
  margin-left: 6px;
  padding: 1px 5px;
  border-radius: 8px;
  background: #fff463;
  color: #333;
  font-size: 10px;
  line-height: 14px;
}

.yard-stat {
  margin-left: auto;
  color: #999;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
}

.yard-stat-emphasis {
  color: #666;
}

.info-card {
  display: flex;
  min-height: 203px;
  flex: 0 0 auto;
  flex-direction: column;
  width: auto;
  margin: 9px 15px 0;
  padding: 24px 20px 13px;
  gap: 9px;
  border-radius: 20px;
  background: #fff;
  box-sizing: border-box;
}

.pet-detail-figma--37 .info-card {
  min-height: 237px;
}

.info-row {
  display: flex;
  min-height: 21px;
  align-items: center;
  justify-content: space-between;
  color: #777;
  font-size: 13px;
  line-height: 18px;
}

.info-row>text:last-child {
  color: #333;
}

.info-row .link {
  color: #0a77f5 !important;
}

.continuous {
  align-self: flex-end;
  margin-top: auto;
  padding: 0 5px;
  border-radius: 3px;
  background: #cc9a66;
  color: #fff;
  font-size: 10px;
  line-height: 14px;
}

.message-card {
  display: flex;
  min-height: 201px;
  flex: 0 0 auto;
  flex-direction: column;
  width: auto;
  margin: 9px 15px 0;
  padding: 25px 15px 18px;
  gap: 16px;
  border-radius: 20px;
  background: #fff;
  box-sizing: border-box;
}

.message-title {
  display: block;
  color: #333;
  font-size: 15px;
  line-height: 22px;
  text-align: center;
}

.message-row {
  display: flex;
  min-height: 34px;
  align-items: flex-start;
}

.message-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  flex-shrink: 0
}

.message-body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  margin-left: 6px;
}

.message-author {
  display: inline-flex;
  min-height: 18px;
  align-items: center;
  gap: 4px;
  color: #555;
  font-size: 13px;
  line-height: 18px;
  white-space: nowrap;
}

.role {
  padding: 0 5px;
  border-radius: 8px;
  background: #fff463;
  color: #333;
  font-size: 10px;
  line-height: 16px;
}

.message-copy {
  display: block;
  min-height: 36px;
  color: #333;
  font-size: 13px;
  line-height: 18px;
}

.message-meta {
  display: flex;
  min-height: 18px;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  color: #8c8c8c;
  font-size: 12px;
  line-height: 18px;
}

.like {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-right: 1px;
  color: #666
}

.detail-scroll-bottom {
  height: 32px;
  flex: 0 0 auto;
}

.detail-scroll-bottom--fixed-footer {
  height: 88px;
}

.pet-detail-figma--36 .detail-scroll-bottom--fixed-footer {
  height: 74px;
}

.manage-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 300;
  width: 100%;
  height: 74px;
  min-height: 74px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px env(safe-area-inset-bottom);
  border-radius: 20px 20px 0 0;
  background: rgba(255, 255, 255, .9);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, .04);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-sizing: border-box;
}

.manage-footer view {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #777;
  font-size: 11px;
  font-weight: 400;
  line-height: 16px;
  white-space: nowrap;
}

.manage-footer .danger {
  color: #ff334d
}
</style>
