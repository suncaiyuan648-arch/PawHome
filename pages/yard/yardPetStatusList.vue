<template>
  <view class="ypsl-page">
    <view class="title">
      <image class="back" src="/static/zuojiantou.png" @click="goBack"></image>
      <view class="user-info">
        <image class="user" src="/static/avatar.png" mode="aspectFill" @click.stop="openOwnerProfile"></image>
        <view class="user-name" @click.stop="openOwnerProfile">{{ yardName }}</view>
        <YardTagPill class="yard-tag-pill--ml-px6" @click.stop="openYardHeader" />
      </view>
    </view>
    <WhtNoticeBar
      text="广东汕头的花开富贵老师对小院我就是要喂猫投粮400克，积善缘，得福报~"
      type="success"
      :showIcon="false"
      :scrollable="true"
      :speed="100"
      bgColor="linear-gradient(179.89deg, rgba(255, 243, 133, 1) 0%, rgba(255, 251, 220, 1) 100%)"
      color="rgba(80, 80, 80, 1)"
      radius="0"
    />
    <scroll-view class="ypsl-scroll" scroll-y :bounces="false" :show-scrollbar="false">
      <YardPetStatusListBlock :sections="petSections" :yard-name="yardName" />
      <view class="ypsl-pad-bottom"></view>
    </scroll-view>
    <DetailTabber
      :joined="yardJoined"
      @adopt="openAdoptFlow"
      @join="onYardJoin"
      @leave="onYardLeave"
    />
    <AdoptPickCatsSheet
      v-model="adoptPickVisible"
      :yard-name="yardName"
      :yard-id="yardId"
      owner-avatar="/static/avatar.png"
    />
  </view>
</template>

<script>
import WhtNoticeBar from "@/components/WhtNoticeBar/index.vue";
import DetailTabber from "@/components/DetailTabber.vue";
import YardPetStatusListBlock from "@/components/yard/YardPetStatusListBlock.vue";
import AdoptPickCatsSheet from "@/components/AdoptPickCatsSheet.vue";
import YardTagPill from "@/components/YardTagPill.vue";
import { goBackSmart } from "@/utils/navBack.js";
import { openUserProfile, openYardDetail } from "@/utils/profileNav.js";

const IMG_O = "/static/home-feed-1.png";
const IMG_B = "/static/avatarlog.png";

export default {
  components: {
    WhtNoticeBar,
    DetailTabber,
    YardPetStatusListBlock,
    AdoptPickCatsSheet,
    YardTagPill,
  },
  data() {
    return {
      yardName: "我就是要喂猫",
      yardId: "1",
      yardJoined: false,
      adoptPickVisible: false,
      petSections: [
        {
          key: "pending",
          status: "pending",
          label: "待领养",
          pets: [
            { id: "p1", avatar: IMG_O, name: "奥利奥", breed: "加菲猫" },
            { id: "p2", avatar: IMG_B, name: "呗呗", breed: "金毛" },
            { id: "p3", avatar: IMG_B, name: "呗呗", breed: "金毛" },
            { id: "p4", avatar: IMG_B, name: "呗呗", breed: "金毛" },
            { id: "p5", avatar: IMG_B, name: "呗呗", breed: "金毛" },
          ],
        },
        {
          key: "adopted",
          status: "adopted",
          label: "已领养",
          pets: [
            { id: "a1", avatar: IMG_O, name: "奥利奥", breed: "加菲猫" },
            { id: "a2", avatar: IMG_B, name: "呗呗", breed: "金毛" },
          ],
        },
        {
          key: "missing",
          status: "missing",
          label: "失踪",
          pets: [
            { id: "m1", avatar: IMG_O, name: "奥利奥", breed: "加菲猫" },
            { id: "m2", avatar: IMG_B, name: "呗呗", breed: "金毛" },
          ],
        },
        {
          key: "dead",
          status: "dead",
          label: "死亡",
          pets: [
            { id: "d1", avatar: IMG_O, name: "奥利奥", breed: "加菲猫" },
            { id: "d2", avatar: IMG_B, name: "呗呗", breed: "金毛" },
          ],
        },
      ],
    };
  },
  onLoad(query) {
    if (query && query.yardName) {
      try {
        this.yardName = decodeURIComponent(query.yardName);
      } catch (e) {
        this.yardName = query.yardName;
      }
    }
    if (query && query.yardId) this.yardId = decodeURIComponent(query.yardId);
  },
  methods: {
    goBack() {
      goBackSmart({ fallbackUrl: "/pages/index/index" });
    },
    openOwnerProfile() {
      openUserProfile({
        pawId: "yard_card_owner",
        nickname: this.yardName,
        avatar: "/static/avatar.png",
      });
    },
    openYardHeader() {
      openYardDetail({ yardId: this.yardId || "1", yardName: this.yardName });
    },
    openAdoptFlow() {
      this.adoptPickVisible = true;
    },
    onYardJoin() {
      this.yardJoined = true;
      uni.showToast({ title: "欢迎加入小院", icon: "none" });
    },
    onYardLeave() {
      this.yardJoined = false;
      uni.showToast({ title: "已退出入驻", icon: "none" });
    },
  },
};
</script>

<style lang="less" scoped>
.ypsl-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  box-sizing: border-box;
}

.title {
  flex-shrink: 0;
  width: 100%;
  height: 98px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding-top: 40px;
  position: relative;
  background: #fff;
}

.back {
  position: absolute;
  left: 6px;
  bottom: 8px;
  width: 61px;
  height: 24px;
}

.user-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  position: absolute;
  left: 37px;
  bottom: 5px;
}

.user {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #eee;
}

.user-name {
  margin-left: 9px;
  font-size: 14px;
  font-weight: 500;
  line-height: 20.27px;
  color: rgba(51, 51, 51, 1);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ypsl-scroll {
  flex: 1 1 0;
  height: 0;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}

.ypsl-pad-bottom {
  height: 12px;
}
</style>
