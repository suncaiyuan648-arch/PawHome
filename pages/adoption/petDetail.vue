<template>
  <view class="pd-page" :class="{ 'pd-page--figma': figmaVariant }">
    <PawPetDetailFigma v-if="figmaVariant" :variant="figmaVariant" @back="goBack" @album="openAlbum" />
    <template v-else>
    <!-- 顶部大图轮播 + 状态栏渐变 + 返回 -->
    <view class="pd-hero">
      <swiper
        :key="'sw-' + currentPet.id"
        class="pd-swiper"
        :style="{ height: galleryHeightPx + 'px' }"
        :current="galleryIndex"
        :circular="galleryUrls.length > 1"
        :indicator-dots="galleryUrls.length > 1"
        indicator-color="rgba(255,255,255,0.35)"
        indicator-active-color="rgba(255,255,255,0.95)"
        :autoplay="false"
        @change="onGalleryChange"
      >
        <swiper-item v-for="(src, gi) in galleryUrls" :key="currentPet.id + '-g-' + gi" class="pd-swiper-item">
          <image class="pd-swiper-img" :src="src" mode="aspectFill" />
        </swiper-item>
      </swiper>
      <view class="pd-hero-grad" />
      <view class="pd-nav" :style="{ paddingTop: statusBarHeight + 'px' }">
        <view class="pd-nav-hit" @click="goBack">
          <image class="pd-nav-back" src="/static/nav-back-arrow.png" mode="aspectFit" />
        </view>
        <view class="pd-album-hit" @click="openAlbum"><uni-icons type="images" color="#ffffff" :size="20" /><text>相册</text></view>
      </view>
    </view>

    <scroll-view class="pd-scroll" scroll-y :show-scrollbar="false" :enable-flex="true">
      <!-- 待领养横向头像：点击切换当前宠物 -->
      <view class="pd-strip-wrap">
        <scroll-view class="pd-strip-scroll" scroll-x :show-scrollbar="false" :enable-flex="true">
          <view class="pd-strip-inner">
            <view
              v-for="(p, pi) in adoptablePets"
              :key="p.id"
              class="pd-strip-item"
              :class="{ 'pd-strip-item--on': pi === activeIndex }"
              @click="selectPet(pi)"
            >
              <image class="pd-strip-av" :src="p.avatar" mode="aspectFill" />
              <view v-if="pi === activeIndex" class="pd-strip-tri" />
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="pd-card">
        <view class="pd-card-head">
          <view class="pd-card-head-left">
            <text class="pd-name">{{ currentPet.name }}</text>
            <view class="pd-status"><text>{{ currentPet.statusLabel }}</text></view>
          </view>
          <text class="pd-seq">{{ positionText }}</text>
        </view>
        <view class="pd-tags">
          <view v-for="(t, ti) in currentPet.tags" :key="'t-' + ti" class="pd-tag"><text>{{ t }}</text></view>
        </view>
        <text class="pd-desc">{{ currentPet.desc }}</text>

        <view class="pd-yard" @click="openYardDetail">
          <image class="pd-yard-av" :src="yard.avatar" mode="aspectFill" />
          <view class="pd-yard-mid">
            <view class="pd-yard-name-row">
              <text class="pd-yard-name">{{ yard.name }}</text>
              <YardTagPill />
            </view>
          </view>
          <text class="pd-yard-stat">已在小院获得猫粮{{ yard.foodJin }}斤</text>
        </view>
      </view>

      <view v-if="!figmaVariant" class="pd-yard-intro">
        <text class="pd-yard-intro-txt">{{ yard.intro }}</text>
      </view>

	  <view v-if="figmaVariant" class="pd-info-card">
		<view><text>心情</text><text>开心</text></view>
		<view><text>状态</text><text>极度饥饿</text></view>
		<view><text>云家长</text><text class="pd-parent"><image src="/static/figma/adoption-flow/pet-owner.png" mode="aspectFill"></image>姜栋</text></view>
		<view><text>剩余云养天数</text><text>16/30天</text></view>
		<view><text>剩余粮食</text><text class="pd-link">点击查看图片</text></view>
		<view v-if="figmaVariant === 37"><text>投粮详情</text><text class="pd-link">点击查看</text></view>
		<text class="pd-remain-badge">已连续云养25天</text>
	  </view>
	  <view v-if="figmaVariant" class="pd-message-card">
		<text class="pd-message-title">云家长寄语留言板</text>
		<view class="pd-message-row"><image src="/static/figma/adoption-flow/pet-owner.png" mode="aspectFill"></image><view><view class="pd-message-name"><text>姜栋</text><text class="pd-level">Lv1</text><text class="pd-role">小黄的第3任云家长</text></view><text class="pd-message-copy">给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞</text><text class="pd-message-meta">昨天 20:45　江西　回复</text></view><view class="pd-like"><uni-icons type="hand-up-filled" color="#ff334d" :size="15"></uni-icons><text>32</text></view></view>
	  </view>

      <view class="pd-pad-bottom" />
    </scroll-view>

    <view v-if="!figmaVariant" class="pd-tabber-wrap">
      <DetailTabber :joined="yardJoined" @adopt="openAdoptFlow" @join="onYardJoin" @leave="onYardLeave" />
    </view>

    <AdoptEntryHintModal v-model:visible="showAdoptEntryHint" :message="pawAdoptEntryMsg" @confirm="onAdoptEntryHintConfirm" />
    <AdoptPickCatsSheet
      v-model="adoptPickVisible"
      :yard-name="yard.name"
      :yard-id="yardId"
      :owner-avatar="yard.avatar"
    />
    </template>
  </view>
</template>

<script>
import { goBackSmart } from "@/utils/navBack.js";
import DetailTabber from "@/components/DetailTabber.vue";
import AdoptEntryHintModal from "@/components/AdoptEntryHintModal.vue";
import AdoptPickCatsSheet from "@/components/AdoptPickCatsSheet.vue";
import YardTagPill from "@/components/YardTagPill.vue";
import PawPetDetailFigma from "@/components/PawPetDetailFigma.vue";
import { shouldShowAdoptEntryHint, dismissAdoptEntryHint } from "@/utils/adoptEntryGate.js";
import { PAW_MSG_ADOPT_DAY_LIMIT } from "@/utils/pawNoticeMessages.js";

const IMG_A = "/static/home-feed-1.png";
const IMG_B = "/static/home-feed-2.png";
const IMG_C = "/static/avatarlog.png";

export default {
  components: {
    DetailTabber,
    AdoptEntryHintModal,
    YardTagPill,
    PawPetDetailFigma,
  },
  data() {
    return {
      statusBarHeight: 20,
      galleryHeightPx: 375,
      galleryIndex: 0,
      activeIndex: 0,
      yardId: "1",
      yardName: "我就是要喂猫",
      yardJoined: false,
      showAdoptEntryHint: false,
      pendingOpenAdoptSheetAfterHint: false,
      pawAdoptEntryMsg: PAW_MSG_ADOPT_DAY_LIMIT,
      adoptPickVisible: false,
	  figmaVariant: 0,
      /** 前 6 条与选猫页 idx 对应；其后为小院「全部宠物状态」列表 petId（p1…d2） */
      adoptablePets: [
        {
          id: "pet-1",
          name: "小黄",
          avatar: IMG_A,
          gallery: [IMG_A, IMG_B, IMG_A, IMG_B],
          statusLabel: "待领养",
          tags: ["中华田园犬", "男生", "已绝育", "2岁3个月"],
          desc: "小黄是我见过最乖最帅最萌的小猫，饭量很大，希望可以多多投喂猫粮给它。",
        },
        {
          id: "pet-2",
          name: "小灰灰",
          avatar: IMG_C,
          gallery: [IMG_C, IMG_B, IMG_C],
          statusLabel: "待领养",
          tags: ["英国短毛猫", "女生", "已绝育", "1岁"],
          desc: "性格温顺，喜欢晒太阳，适合安静家庭领养。",
        },
        {
          id: "pet-3",
          name: "奥利奥",
          avatar: IMG_B,
          gallery: [IMG_B, IMG_A],
          statusLabel: "待领养",
          tags: ["金毛", "男生", "未绝育", "3岁"],
          desc: "活泼好动，需要一定活动空间。",
        },
        {
          id: "pet-4",
          name: "小灰灰",
          avatar: IMG_C,
          gallery: [IMG_C],
          statusLabel: "待领养",
          tags: ["橘猫", "女生", "已绝育", "8个月"],
          desc: "与选猫列表占位同序，对接接口后由后端返回。",
        },
        {
          id: "pet-5",
          name: "小灰灰",
          avatar: IMG_A,
          gallery: [IMG_A, IMG_C],
          statusLabel: "待领养",
          tags: ["混血", "男生", "已绝育", "2岁"],
          desc: "亲人粘人，已适应室内生活。",
        },
        {
          id: "pet-6",
          name: "小灰灰",
          avatar: IMG_B,
          gallery: [IMG_B],
          statusLabel: "待领养",
          tags: ["待补充", "女生", "未绝育", "1岁2个月"],
          desc: "等待志愿者补充档案。",
        },
        {
          id: "p1",
          name: "奥利奥",
          avatar: IMG_A,
          gallery: [IMG_A, IMG_C],
          statusLabel: "待领养",
          tags: ["加菲猫", "男生", "已绝育", "2岁"],
          desc: "圆脸大眼，性格慵懒亲人，适合室内陪伴。",
        },
        {
          id: "p2",
          name: "呗呗",
          avatar: IMG_C,
          gallery: [IMG_C, IMG_A],
          statusLabel: "待领养",
          tags: ["金毛", "女生", "已绝育", "1岁"],
          desc: "温顺活泼，已完成基础免疫与驱虫。",
        },
        {
          id: "p3",
          name: "呗呗",
          avatar: IMG_C,
          gallery: [IMG_C],
          statusLabel: "待领养",
          tags: ["金毛", "男生", "未绝育", "8个月"],
          desc: "精力充沛，正在社会化训练中。",
        },
        {
          id: "p4",
          name: "呗呗",
          avatar: IMG_C,
          gallery: [IMG_C, IMG_B],
          statusLabel: "待领养",
          tags: ["金毛", "女生", "已绝育", "2岁"],
          desc: "亲人黏人，适应小院集体生活。",
        },
        {
          id: "p5",
          name: "呗呗",
          avatar: IMG_C,
          gallery: [IMG_C],
          statusLabel: "待领养",
          tags: ["金毛", "男生", "已绝育", "3岁"],
          desc: "稳重听话，适合有经验家庭。",
        },
        {
          id: "a1",
          name: "奥利奥",
          avatar: IMG_A,
          gallery: [IMG_A],
          statusLabel: "已领养",
          tags: ["加菲猫", "男生", "已绝育", "2岁"],
          desc: "已由爱心人士领养，感谢每一份善意。",
        },
        {
          id: "a2",
          name: "呗呗",
          avatar: IMG_C,
          gallery: [IMG_C],
          statusLabel: "已领养",
          tags: ["金毛", "女生", "已绝育", "1岁"],
          desc: "已进入新家，小院会持续关注回访。",
        },
        {
          id: "m1",
          name: "奥利奥",
          avatar: IMG_A,
          gallery: [IMG_A],
          statusLabel: "失踪",
          tags: ["加菲猫", "男生", "已绝育", "2岁"],
          desc: "走失记录归档中，若有线索请联系小院志愿者。",
        },
        {
          id: "m2",
          name: "呗呗",
          avatar: IMG_C,
          gallery: [IMG_C],
          statusLabel: "失踪",
          tags: ["金毛", "女生", "已绝育", "1岁"],
          desc: "走失记录归档中，若有线索请联系小院志愿者。",
        },
        {
          id: "d1",
          name: "奥利奥",
          avatar: IMG_A,
          gallery: [IMG_A],
          statusLabel: "死亡",
          tags: ["加菲猫", "男生", "已绝育", "2岁"],
          desc: "感谢曾经的陪伴，愿在喵星无病无痛。",
        },
        {
          id: "d2",
          name: "呗呗",
          avatar: IMG_C,
          gallery: [IMG_C],
          statusLabel: "死亡",
          tags: ["金毛", "女生", "已绝育", "1岁"],
          desc: "感谢曾经的陪伴，小院会铭记每一位毛孩子。",
        },
      ],
      yard: {
        avatar: "/static/avatar.png",
        name: "我就是要喂猫",
        foodJin: 32,
        intro:
          "小院专注救助周边流浪动物，定时投喂、绝育与领养对接。欢迎常来看看毛孩子们，您的每一次投喂都是一份善意。",
      },
    };
  },
  computed: {
    currentPet() {
      return this.adoptablePets[this.activeIndex] || this.adoptablePets[0];
    },
    galleryUrls() {
      return (this.currentPet && this.currentPet.gallery) || [IMG_A];
    },
    positionText() {
	  if (this.figmaVariant) return '4/12';
      const n = this.adoptablePets.length;
      return `${this.activeIndex + 1}/${n}`;
    },
  },
  onLoad(query) {
    const sys = uni.getSystemInfoSync();
    this.statusBarHeight = sys.statusBarHeight || 20;
    const w = Number(sys.windowWidth) || 375;
    this.galleryHeightPx = w;
    if (query && query.yardName) {
      try {
        this.yardName = decodeURIComponent(query.yardName);
      } catch (e) {
        this.yardName = query.yardName;
      }
      this.yard.name = this.yardName;
    }
    if (query && query.yardId) this.yardId = String(query.yardId);
    if (query && query.petId !== undefined && query.petId !== "") {
      try {
        const pid = decodeURIComponent(String(query.petId));
        const pi = this.adoptablePets.findIndex((x) => x.id === pid);
        if (pi >= 0) this.activeIndex = pi;
      } catch (e) {
        /* ignore */
      }
    } else if (query && query.idx !== undefined && query.idx !== "") {
      const idx = parseInt(String(query.idx), 10);
      if (!Number.isNaN(idx) && idx >= 0) {
        const max = this.adoptablePets.length - 1;
        this.activeIndex = Math.min(idx, max);
      }
    }
    this.galleryIndex = 0;
	this.figmaVariant = Number(query && query.state) || 0;
	if (this.figmaVariant >= 35 && this.figmaVariant <= 37) {
	  this.adoptablePets = this.adoptablePets.slice(0, 7).map((pet, index) => ({
		...pet,
		avatar: index === 3 ? '/static/figma/adoption-flow/pet-hero.png' : '/static/figma/adoption-flow/pet-orange.png',
		gallery: ['/static/figma/adoption-flow/pet-hero.png'],
		statusLabel: '已云养',
		tags: ['中华田园犬', '男生', '已绝育', '2岁3个月']
	  }));
	  this.activeIndex = 3;
	  this.yard.avatar = '/static/figma/adoption-flow/pet-owner.png';
	}
    if (query && query.popup === 'adopt-limit') this.showAdoptEntryHint = true;
  },
  methods: {
    openAlbum() { uni.navigateTo({ url: '/pages/feature/index?mode=album' }) },
    goBack() {
      goBackSmart({ fallbackUrl: "/pages/index/index" });
    },
    onGalleryChange(e) {
      const cur = e?.detail?.current;
      if (typeof cur === "number") this.galleryIndex = cur;
    },
    selectPet(pi) {
      if (pi === this.activeIndex) return;
      this.activeIndex = pi;
      this.galleryIndex = 0;
    },
    openYardDetail() {
      uni.navigateTo({
        url: `/pages/commodityDetails/index?id=${encodeURIComponent(this.yardId)}`,
      });
    },
    onAdoptEntryHintConfirm() {
      dismissAdoptEntryHint();
      if (this.pendingOpenAdoptSheetAfterHint) {
        this.pendingOpenAdoptSheetAfterHint = false;
        this.$nextTick(() => {
          this.adoptPickVisible = true;
        });
      }
    },
    openAdoptFlow() {
      if (shouldShowAdoptEntryHint()) {
        this.pendingOpenAdoptSheetAfterHint = true;
        this.showAdoptEntryHint = true;
        return;
      }
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
.pd-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  box-sizing: border-box;
}

.pd-hero {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  background: #111;
}

.pd-swiper {
  width: 100%;
  background: #222;
}

.pd-swiper-item {
  width: 100%;
  height: 100%;
}

.pd-swiper-img {
  width: 100%;
  height: 100%;
  display: block;
}

/* 顶部随内容可读：由浅到透明，模拟「跟图走」的顶栏氛围 */
.pd-hero-grad {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 200px;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(30, 28, 26, 0.55) 0%,
    rgba(30, 28, 26, 0.22) 45%,
    rgba(30, 28, 26, 0) 100%
  );
}

.pd-nav {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  z-index: 6;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding-left: 4px;
  box-sizing: border-box;
}

.pd-nav-hit {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pd-page--figma {
  width: 375px;
  height: 1232px;
  min-height: 1232px;
  display: block;
  overflow: visible;
}
.pd-album-hit { display: flex; align-items: center; gap: 6rpx; height: 44px; margin-left: auto; margin-right: 28rpx; color: #fff; font-size: 22rpx; }

.pd-nav-back {
  width: 22px;
  height: 22px;
  filter: brightness(0) invert(1);
}

.pd-scroll {
  flex: 1 1 0;
  height: 0;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}

.pd-strip-wrap {
  background: #fff;
  padding: 16px 0 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.pd-strip-scroll {
  width: 100%;
  white-space: nowrap;
}

.pd-strip-inner {
  display: inline-flex;
  flex-direction: row;
  align-items: flex-end;
  padding: 0 20px 4px;
  gap: 20px;
}

.pd-strip-item {
  position: relative;
  flex-shrink: 0;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 10px;
}

.pd-strip-av {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #eee;
  opacity: 0.72;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.pd-strip-item--on .pd-strip-av {
  width: 60px;
  height: 60px;
  opacity: 1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.pd-strip-tri {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 7px solid #fff;
}

.pd-card {
  margin: 12px 12px 0;
  padding: 18px 16px 16px;
  background: #fff;
  border-radius: 16px;
  box-sizing: border-box;
}

.pd-card-head {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.pd-card-head-left {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.pd-name {
  font-size: 22px;
  font-weight: 700;
  color: #111;
}

.pd-status {
  padding: 2px 10px;
  border-radius: 6px;
  background: #d8ff7a;
}

.pd-info-card { position:relative; margin:10px 12px 0; padding:16px 20px 38px; background:#fff; border-radius:16px; box-sizing:border-box; }
.pd-info-card > view { min-height:32px; display:flex; align-items:center; justify-content:space-between; color:#666; font-size:14px; }
.pd-parent { display:flex; align-items:center; color:#555; }
.pd-parent image { width:22px; height:22px; border-radius:50%; margin-right:7px; }
.pd-link { color:#1686ff; }
.pd-remain-badge { position:absolute; right:22px; bottom:12px; padding:2px 7px; border-radius:4px; background:#c8884a; color:#fff; font-size:11px; }
.pd-message-card { margin:10px 12px 24px; padding:20px 16px 28px; min-height:200px; background:#fff; border-radius:16px; box-sizing:border-box; }
.pd-message-title { display:block; text-align:center; font-size:16px; color:#333; }
.pd-message-row { position:relative; display:flex; margin-top:20px; }
.pd-message-row > image { width:36px; height:36px; border-radius:50%; flex-shrink:0; margin-right:9px; }
.pd-message-row > view:nth-child(2) { flex:1; min-width:0; }
.pd-message-name { display:flex; align-items:center; gap:4px; font-size:12px; color:#555; }
.pd-level { padding:1px 5px; background:#4b3100; border-radius:5px; color:#fff; font-size:9px; }
.pd-role { padding:1px 5px; background:#ffec3a; border-radius:6px; font-size:9px; color:#333; }
.pd-message-copy { display:block; font-size:12px; line-height:14px; color:#333; }
.pd-message-meta { display:block; margin-top:10px; color:#999; font-size:11px; }
.pd-like { position:absolute; right:0; bottom:0; display:flex; align-items:center; gap:5px; color:#666; font-size:12px; }

.pd-status text {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.pd-seq {
  font-size: 14px;
  color: #999;
  flex-shrink: 0;
  margin-left: 8px;
}

.pd-tags {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.pd-tag {
  padding: 4px 10px;
  border-radius: 20px;
  background: #d8ff7a;
}

.pd-tag text {
  font-size: 12px;
  color: #333;
}

.pd-desc {
  display: block;
  font-size: 15px;
  line-height: 24px;
  color: rgba(60, 60, 60, 1);
  margin-bottom: 16px;
}

.pd-yard {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-top: 14px;
  border-top: 1px solid #f0f0f0;
}

.pd-yard-av {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #eee;
  flex-shrink: 0;
}

.pd-yard-mid {
  flex: 1;
  min-width: 0;
  margin-left: 10px;
}

.pd-yard-name-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.pd-yard-name {
  font-size: 15px;
  font-weight: 600;
  color: #222;
}

.pd-yard-stat {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
  max-width: 42%;
  text-align: right;
}

.pd-yard-intro {
  margin: 12px 12px 0;
  padding: 14px 16px;
  background: #fff;
  border-radius: 12px;
  box-sizing: border-box;
}

.pd-yard-intro-txt {
  font-size: 14px;
  line-height: 22px;
  color: #666;
}

.pd-pad-bottom {
  height: 24px;
}

.pd-tabber-wrap {
  flex-shrink: 0;
}
</style>
