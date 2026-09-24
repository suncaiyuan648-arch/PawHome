<template>
  <view class="pd-page" :class="{ 'pd-page--figma': figmaVariant }">
    <PawPetDetailFigma v-if="figmaVariant" :variant="figmaVariant" :managed="managedPet" :pet="currentPet"
      :pets="adoptablePets" :pet-index="activeIndex" :pet-total="adoptablePets.length" :yard="yard" :joined="yardJoined"
      @back="goBack" @album="openAlbum" @preview-image="previewPetImage" @select-pet="selectPet"
      @footer-action="onFigmaFooterAction" @footer-primary="onFigmaFooterPrimary"
      @message-user-click="openMessageUser" />
    <template v-else>
      <PawPageNav background="transparent" :auto-back="false" @back="goBack" @layout="onNavLayout" />
      <view class="pd-default-stage" :style="{ marginTop: `-${navOverlayOffset}px` }">
        <!-- 顶部大图轮播，系统导航由 PawPageNav 统一提供。 -->
        <view class="pd-hero">
          <swiper :key="'sw-' + currentPet.id" class="pd-swiper" :style="{ height: galleryHeightPx + 'px' }"
            :current="galleryIndex" :circular="galleryUrls.length > 1" :indicator-dots="galleryUrls.length > 1"
            indicator-color="rgba(255,255,255,0.35)" indicator-active-color="rgba(255,255,255,0.95)" :autoplay="false"
            @change="onGalleryChange">
            <swiper-item v-for="(src, gi) in galleryUrls" :key="currentPet.id + '-g-' + gi" class="pd-swiper-item">
              <image class="pd-swiper-img" :src="src" mode="aspectFill" @tap="previewPetImage(src)" />
            </swiper-item>
          </swiper>
          <view class="pd-hero-grad" />
          <view class="pd-album-hit" :style="{ top: navOverlayOffset + 'px', right: navRightReservedWidth + 'px' }"
            @click="openAlbum"><uni-icons type="images" color="#ffffff" :size="20" /><text>相册</text></view>
        </view>

        <scroll-view class="pd-scroll" scroll-y :show-scrollbar="false" :enable-flex="true">
          <!-- 待领养横向头像：点击切换当前宠物 -->
          <view class="pd-strip-wrap">
            <scroll-view class="pd-strip-scroll" scroll-x :show-scrollbar="false" :enable-flex="true">
              <view class="pd-strip-inner">
                <view v-for="(p, pi) in adoptablePets" :key="p.id" class="pd-strip-item"
                  :class="{ 'pd-strip-item--on': pi === activeIndex }" @click="selectPet(pi)">
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
                  <YardBadge :yard-id="yardId" :yard-name="yard.name" />
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
            <view><text>云家长</text><text class="pd-parent">
                <image src="/static/figma/adoption-flow/pet-owner.png" mode="aspectFill"></image>姜栋
              </text></view>
            <view><text>剩余云养天数</text><text>16/30天</text></view>
            <view><text>剩余粮食</text><text class="pd-link">点击查看图片</text></view>
            <view v-if="figmaVariant === 37"><text>投粮详情</text><text class="pd-link">点击查看</text></view>
            <text class="pd-remain-badge">已连续云养25天</text>
          </view>
          <view v-if="figmaVariant" class="pd-message-card">
            <text class="pd-message-title">云家长寄语留言板</text>
            <view class="pd-message-row">
              <image src="/static/figma/adoption-flow/pet-owner.png" mode="aspectFill"></image>
              <view>
                <view class="pd-message-name"><text>姜栋</text>
                  <LevelBadge level="1" /><text class="pd-role">小黄的第3任云家长</text>
                </view><text class="pd-message-copy">给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞给我点赞</text><text
                  class="pd-message-meta">昨天 20:45&#x3000;江西&#x3000;回复</text>
              </view>
              <view class="pd-like">
                <PawLikeIcon :liked="true" /><text>32</text>
              </view>
            </view>
          </view>

          <view class="pd-pad-bottom" />
        </scroll-view>
      </view>

      <view v-if="!figmaVariant" class="pd-tabber-wrap">
        <DetailTabber :joined="yardJoined" :pet-id="currentPet && currentPet.id" @adopt="openAdoptFlow"
          @join="onYardJoin" @leave="onYardLeave" @feed-order="openFeedOrders" @learn-food="showLearnFood" />
      </view>

    </template>

    <AdoptEntryHintModal v-model:visible="showAdoptEntryHint" :message="pawAdoptEntryMsg"
      @confirm="onAdoptEntryHintConfirm" />
    <AdoptPickCatsSheet v-model="adoptPickVisible" :yard-name="yard.name" :yard-id="yardId"
      :owner-avatar="yard.avatar" />
    <YardFeedPopup v-if="figmaVariant === 35" v-model:visible="figmaFeedPopupVisible"
      :pet-id="currentPet && currentPet.id" @learn-food="showLearnFood" @feed-order="openFeedOrders" />
    <ShareActionSheet v-if="figmaVariant === 35" v-model:visible="figmaShareSheetVisible" />
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { goBackSmart } from "@/utils/navBack.ts";
import DetailTabber from "./components/DetailTabber.vue";
import AdoptEntryHintModal from "./components/AdoptEntryHintModal.vue";
import AdoptPickCatsSheet from "@/components/AdoptPickCatsSheet.vue";
import YardBadge from "@/components/customBadge/YardBadge.vue";
import PawPetDetailFigma from "./components/PawPetDetailFigma.vue";
import LevelBadge from "@/components/customBadge/LevelBadge.vue";
import YardFeedPopup from "@/components/YardFeedPopup.vue";
import ShareActionSheet from "@/components/ShareActionSheet.vue";
import PawPageNav from "@/components/PawPageNav.vue";
import { shouldShowAdoptEntryHint, dismissAdoptEntryHint } from "@/utils/adoptEntryGate.ts";
import { PAW_MSG_ADOPT_DAY_LIMIT } from "@/utils/pawNoticeMessages.ts";
import { getPawHomeYardMock } from "@/utils/yardMock.ts";
import PawLikeIcon from "@/components/base/PawLikeIcon.vue";
import { openUserProfile } from "@/utils/profileNav.ts";
import { getWechatNavLayout } from "@/utils/navLayout.ts";
import { readPawEventNumber } from '@/utils/pawEventMetadata.ts'
import { buildRoute } from "@/navigation/routeContracts.ts";
import { readLocalAnimal, readPublicAnimal } from '../../services/localManagementStorage.ts';
import type { WechatNavLayout } from '@/utils/navLayout.ts'
import type { YardComment, YardMock, YardPet } from '@/utils/yardMock.ts'
import {
  createPetDetailFigmaVariantPets,
  normalizePetDetailRecord,
  PET_DETAIL_FIGMA_OWNER_AVATAR,
} from '@/utils/petDetailMetadata.ts'

const IMG_A = "/static/home-feed-1.png";

interface AnimalDetailState {
  galleryHeightPx: number
  navOverlayOffset: number
  navRightReservedWidth: number
  galleryIndex: number
  activeIndex: number
  yardId: string
  yardName: string
  yardJoined: boolean
  showAdoptEntryHint: boolean
  pendingOpenAdoptSheetAfterHint: boolean
  pawAdoptEntryMsg: string
  adoptPickVisible: boolean
  figmaFeedPopupVisible: boolean
  figmaShareSheetVisible: boolean
  figmaVariant: number
  managedPet: boolean
  adoptablePets: YardPet[]
  yard: YardMock
}

interface PetDetailFooterActionEvent {
  key: string
}

interface PetImagePreviewPayload {
  current: string
  urls: string[]
}

function queryText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

function normalizePreviewImageUrl(value: string | null | undefined): string {
  if (typeof value !== 'string') return '';
  const url = value.trim();
  if (!url) return '';
  return /^(?:\/|https?:\/\/|wxfile:\/\/|cloud:\/\/)/i.test(url) ? url : '';
}

function normalizePreviewImageUrls(values: readonly string[]): string[] {
  const candidates = Array.isArray(values) ? values : [];
  const urls = candidates
    .map(normalizePreviewImageUrl)
    .filter((url): url is string => Boolean(url));
  return Array.from(new Set(urls));
}

function isPackagedPreviewImageUrl(url: string): boolean {
  return /^\/static\//i.test(url);
}

function preparePreviewImageUrl(url: string): Promise<string> {
  if (!isPackagedPreviewImageUrl(url) || typeof uni === 'undefined' || typeof uni.compressImage !== 'function') {
    return Promise.resolve(url);
  }

  return new Promise<string>((resolve) => {
    uni.compressImage({
      src: url,
      compressedWidth: 1080,
      success: (result) => {
        const tempFilePath = normalizePreviewImageUrl(result && result.tempFilePath);
        resolve(tempFilePath || url);
      },
      fail: (error) => {
        console.warn('[PawHome][petDetail] packaged preview image preparation failed, using source path', {
          url,
          error
        });
        resolve(url);
      }
    });
  });
}

export default defineComponent({
  components: {
    DetailTabber,
    AdoptEntryHintModal,
    YardBadge,
    PawPetDetailFigma,
    LevelBadge,
    YardFeedPopup,
    ShareActionSheet,
    PawLikeIcon,
    PawPageNav,
    AdoptPickCatsSheet,
  },
  data(): AnimalDetailState {
    const yard = getPawHomeYardMock();
    return {
      galleryHeightPx: getWechatNavLayout().windowWidth,
      navOverlayOffset: getWechatNavLayout().totalHeight,
      navRightReservedWidth: getWechatNavLayout().rightReservedWidth,
      galleryIndex: 0,
      activeIndex: 0,
      yardId: yard.id,
      yardName: yard.name,
      yardJoined: false,
      showAdoptEntryHint: false,
      pendingOpenAdoptSheetAfterHint: false,
      pawAdoptEntryMsg: PAW_MSG_ADOPT_DAY_LIMIT,
      adoptPickVisible: false,
      figmaFeedPopupVisible: false,
      figmaShareSheetVisible: false,
      figmaVariant: 0,
      managedPet: false,
      adoptablePets: yard.pets.map(pet => ({ ...pet })),
      yard,
    };
  },
  computed: {
    currentPet(): YardPet {
      return this.adoptablePets[this.activeIndex] || this.adoptablePets[0];
    },
    galleryUrls(): string[] {
      return (this.currentPet && this.currentPet.gallery) || [IMG_A];
    },
    positionText(): string {
      if (this.figmaVariant) return `${this.activeIndex + 1}/${this.adoptablePets.length}`;
      const n = this.adoptablePets.length;
      return `${this.activeIndex + 1}/${n}`;
    },
  },
  onLoad(query: Record<string, unknown> = {}) {
    const layout = getWechatNavLayout();
    this.galleryHeightPx = layout.windowWidth;
    this.navOverlayOffset = layout.totalHeight;
    this.navRightReservedWidth = layout.rightReservedWidth;
    const requestedYardName = queryText(query.yardName)
    if (requestedYardName) {
      try {
        this.yardName = decodeURIComponent(requestedYardName);
      } catch {
        this.yardName = requestedYardName;
      }
      this.yard.name = this.yardName;
    }
    const requestedYardId = queryText(query.yardId)
    if (requestedYardId) this.yardId = requestedYardId;
    const rawAnimalId = query.animalId !== undefined ? query.animalId : query.petId;
    const requestedPetId = rawAnimalId !== undefined && rawAnimalId !== ""
      ? decodeURIComponent(String(rawAnimalId))
      : '';
    const requestedIndex = query.idx !== undefined && query.idx !== ""
      ? parseInt(String(query.idx), 10)
      : Number.NaN;
    if (requestedPetId) {
      const petIndex = this.adoptablePets.findIndex(pet => pet.id === requestedPetId);
      if (petIndex >= 0) {
        this.activeIndex = petIndex;
      } else if (!Number.isNaN(requestedIndex) && requestedIndex >= 0) {
        this.activeIndex = Math.min(requestedIndex, this.adoptablePets.length - 1);
      }
    } else if (!Number.isNaN(requestedIndex) && requestedIndex >= 0) {
      const max = this.adoptablePets.length - 1;
      this.activeIndex = Math.min(requestedIndex, max);
    }
    this.galleryIndex = 0;
    // The state query selects a visual reference only.  It must never grant
    // management capability; that comes from a fresh actor/yard/animal read.
    this.figmaVariant = Number(query.state) || 0;
    if (this.figmaVariant >= 35 && this.figmaVariant <= 37) {
      this.adoptablePets = createPetDetailFigmaVariantPets(this.adoptablePets);
      const requestedPetIndexById = requestedPetId
        ? this.adoptablePets.findIndex(pet => pet.id === requestedPetId)
        : -1;
      const requestedPetIndex = requestedPetIndexById >= 0 ? requestedPetIndexById : requestedIndex;
      this.activeIndex = requestedPetIndex >= 0 && requestedPetIndex < this.adoptablePets.length
        ? requestedPetIndex
        : 3;
      this.yard.avatar = PET_DETAIL_FIGMA_OWNER_AVATAR;
    }
    if (query.popup === 'adopt-limit') this.showAdoptEntryHint = true;
    this.refreshAnimal(requestedPetId);
  },
  onShow() {
    this.refreshAnimal(this.currentPet && this.currentPet.id);
  },
  methods: {
    refreshAnimal(requestedPetId: string | null | undefined) {
      const petId = queryText(requestedPetId);
      if (petId) {
        const publicAnimal = readPublicAnimal(petId, { yardId: this.yardId });
        if (publicAnimal.success && publicAnimal.data?.record) {
          const normalized = normalizePetDetailRecord(publicAnimal.data.record, IMG_A);
          if (normalized) {
            const existing = this.adoptablePets.findIndex(pet => pet.id === petId);
            if (existing >= 0) this.adoptablePets.splice(existing, 1, { ...this.adoptablePets[existing], ...normalized });
            else this.adoptablePets.unshift(normalized);
          }
        }
      }
      this.managedPet = false;
      if (petId) {
        const managed = readLocalAnimal(petId, {
          yardId: this.yardId,
          actorProvider: () => uni.getStorageSync('PAWHOME_ACTOR_SESSION')
        });
        this.managedPet = Boolean(managed && managed.success);
      }
      const index = this.adoptablePets.findIndex(pet => pet.id === petId);
      if (index >= 0) this.activeIndex = index;
    },
    onNavLayout(layout: Partial<WechatNavLayout>) {
      if (!layout) return;
      if (Number.isFinite(Number(layout.totalHeight))) this.navOverlayOffset = Number(layout.totalHeight);
      if (Number.isFinite(Number(layout.rightReservedWidth))) {
        this.navRightReservedWidth = Number(layout.rightReservedWidth);
      }
    },
    openAlbum() {
      if (!this.managedPet) return;
      const petId = this.currentPet && this.currentPet.id ? encodeURIComponent(this.currentPet.id) : '';
      try {
        uni.navigateTo({ url: buildRoute('animal.album', { animalId: decodeURIComponent(petId), yardId: String(this.yardId || '') }) });
      } catch {
        uni.showToast({ title: '相册暂不可用', icon: 'none' });
      }
    },
    previewPetImage(payload: string | PetImagePreviewPayload) {
      const payloadRecord = typeof payload === 'string' ? null : payload;
      const payloadUrls = payloadRecord?.urls;
      const requestedUrls = Array.isArray(payloadUrls) && payloadUrls.length ? payloadUrls : this.galleryUrls;
      let urls = normalizePreviewImageUrls(requestedUrls);
      if (!urls.length && requestedUrls !== this.galleryUrls) urls = normalizePreviewImageUrls(this.galleryUrls);
      if (!urls.length) {
        console.warn('[PawHome][petDetail] previewImage skipped: no valid image urls');
        uni.showToast({ title: '暂无可预览图片', icon: 'none' });
        return;
      }

      const requestedCurrent = typeof payload === 'string' ? payload : payloadRecord?.current;
      const normalizedCurrent = normalizePreviewImageUrl(requestedCurrent);
      const current = urls.includes(normalizedCurrent) ? normalizedCurrent : urls[0];
      const currentIndex = urls.indexOf(current);
      if (normalizedCurrent && normalizedCurrent !== current) {
        console.warn('[PawHome][petDetail] previewImage current is not in urls, fallback to first image', {
          current: normalizedCurrent,
          fallback: current
        });
      }

      // 微信原生预览对包内静态路径的解码兼容性弱，先转换为临时文件路径；网络图保持原 URL。
      Promise.all(urls.map(preparePreviewImageUrl)).then(preparedUrls => {
        const preparedCurrent = preparedUrls[currentIndex < 0 ? 0 : currentIndex] || preparedUrls[0];
        uni.previewImage({
          // uni-mp-weixin 对 current 的兼容处理以索引为准，且索引与 urls 始终一一对应。
          current: currentIndex < 0 ? 0 : currentIndex,
          urls: preparedUrls,
          success: () => {
            console.info('[PawHome][petDetail] previewImage opened', {
              current: preparedCurrent,
              currentIndex,
              count: preparedUrls.length
            });
          },
          fail: error => {
            console.error('[PawHome][petDetail] previewImage failed', {
              current: preparedCurrent,
              currentIndex,
              urls: preparedUrls,
              error
            });
            uni.showToast({ title: '图片预览失败，请稍后重试', icon: 'none' });
          },
          complete: result => {
            console.info('[PawHome][petDetail] previewImage complete', {
              current: preparedCurrent,
              currentIndex,
              count: preparedUrls.length,
              errMsg: result && result.errMsg
            });
          }
        });
      });
    },
    goBack() {
      goBackSmart({ fallbackUrl: "/pages/index/index" });
    },
    onGalleryChange(e: PawEvent) {
      const cur = readPawEventNumber(e, 'current');
      if (typeof cur === "number") this.galleryIndex = cur;
    },
    selectPet(pi: number) {
      if (pi === this.activeIndex) return;
      this.activeIndex = pi;
      this.galleryIndex = 0;
    },
    openYardDetail() {
      uni.navigateTo({
		url: `/packages/yard/pages/detail/index?yardId=${encodeURIComponent(this.yardId)}`,
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
    openFeedOrders() {
      uni.navigateTo({ url: '/packages/feeding/pages/yard-orders/index?yardId=1' });
    },
    showLearnFood() {
      uni.showToast({ title: '猫粮说明', icon: 'none' });
    },
    onFigmaFooterAction(action: PetDetailFooterActionEvent) {
      if (action.key === 'share') this.figmaShareSheetVisible = true;
      if (action.key === 'join') this.yardJoined ? this.onYardLeave() : this.onYardJoin();
      if (action.key === 'adopt') this.openAdoptFlow();
      if (this.managedPet && action.key === 'album') this.openAlbum();
      if (this.managedPet && action.key === 'edit') uni.showToast({ title: '修改信息', icon: 'none' });
      if (this.managedPet && action.key === 'manage-pet') uni.showToast({ title: '管理宠物', icon: 'none' });
      if (this.managedPet && action.key === 'delete') uni.showToast({ title: '删除宠物', icon: 'none' });
    },
    onFigmaFooterPrimary() {
      this.figmaFeedPopupVisible = true;
    },
    openMessageUser(comment: YardComment) {
      const author = comment.author;
      if (!author.name) return;
      openUserProfile({
        pawId: author.pawId || `yard-comment-${comment.id || author.name}`,
        nickname: author.name,
        avatar: author.avatar || '/static/avatarlog.png',
      });
    },
  },
});
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

.pd-default-stage {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  background: linear-gradient(180deg,
      rgba(30, 28, 26, 0.55) 0%,
      rgba(30, 28, 26, 0.22) 45%,
      rgba(30, 28, 26, 0) 100%);
}

.pd-page--figma {
  width: 100%;
  height: calc(100vh + 20px);
  min-height: calc(100vh + 20px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pd-album-hit {
  position: absolute;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 6rpx;
  height: 44px;
  padding: 0 12px;
  color: #fff;
  font-size: 22rpx;
}

.pd-scroll {
  flex: 1 1 0;
  height: 0;
  min-height: 0;
  width: 100%;
  padding-bottom: 100px;
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

.pd-info-card {
  position: relative;
  margin: 10px 12px 0;
  padding: 16px 20px 38px;
  background: #fff;
  border-radius: 16px;
  box-sizing: border-box;
}

.pd-info-card>view {
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #666;
  font-size: 14px;
}

.pd-parent {
  display: flex;
  align-items: center;
  color: #555;
}

.pd-parent image {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  margin-right: 7px;
}

.pd-link {
  color: #1686ff;
}

.pd-remain-badge {
  position: absolute;
  right: 22px;
  bottom: 12px;
  padding: 2px 7px;
  border-radius: 4px;
  background: #c8884a;
  color: #fff;
  font-size: 11px;
}

.pd-message-card {
  margin: 10px 12px 24px;
  padding: 20px 16px 28px;
  min-height: 200px;
  background: #fff;
  border-radius: 16px;
  box-sizing: border-box;
}

.pd-message-title {
  display: block;
  text-align: center;
  font-size: 16px;
  color: #333;
}

.pd-message-row {
  position: relative;
  display: flex;
  margin-top: 20px;
}

.pd-message-row>image {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-right: 9px;
}

.pd-message-row>view:nth-child(2) {
  flex: 1;
  min-width: 0;
}

.pd-message-name {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #555;
}

.pd-level {
  padding: 1px 5px;
  background: #4b3100;
  border-radius: 5px;
  color: #fff;
  font-size: 9px;
}

.pd-role {
  padding: 1px 5px;
  background: #ffec3a;
  border-radius: 6px;
  font-size: 9px;
  color: #333;
}

.pd-message-copy {
  display: block;
  font-size: 12px;
  line-height: 14px;
  color: #333;
}

.pd-message-meta {
  display: block;
  margin-top: 10px;
  color: #999;
  font-size: 11px;
}

.pd-like {
  position: absolute;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 12px;
}

.pd-status text {
  font-size: 12px;
  font-weight: 500;
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
  font-weight: 500;
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
