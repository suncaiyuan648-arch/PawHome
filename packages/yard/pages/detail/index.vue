<template>
  <view class="detail-shell">
    <PawYardDetailFigma
      v-if="routeReady"
      :state="figmaState"
      :yard-data="yard"
      @pet-click="openPetDetail"
      @pet-list-click="openPetList"
      @rank-user="openRankUser"
      @adopt="openAdoptSheet"
    />
    <AdoptPickCatsSheet
      v-if="routeReady"
      v-model="adoptPickSheetVisible"
      :yard-name="yard.name"
      :yard-id="yardId"
      :cats="adoptionPets"
      :owner-avatar="yard.avatar"
      :owner-paw-id="yard.owner && yard.owner.pawId"
    />
    <view
      v-else
      class="yard-detail-state"
      data-qa="qa-yard-detail-state"
    >
      <text class="yard-detail-state__title">小院详情暂不可用</text>
      <text class="yard-detail-state__copy">请从有效的小院入口重新进入。</text>
    </view>
    <view
      v-if="helpPopup"
      class="help-mask"
    >
      <view
        class="help-dialog"
        :class="{ 'help-dialog--food': helpPopup === 'food-stat' }"
      >
        <text class="help-title">{{ helpContent.title }}</text>
        <view class="help-divider"></view>
        <template v-if="helpPopup === 'food-stat'">
          <view class="food-stat-row"><text>小院累计获得投粮</text><text>999斤</text></view>
          <view class="food-stat-row"><text>小院累计获粮次数</text><text>456次</text></view>
        </template>
        <text
          v-else
          class="help-copy"
          >{{ helpContent.copy }}</text
        >
        <view class="help-footer">我知道了</view>
      </view>
    </view>
    <view
      v-if="overlayState === 'reply-idle' || overlayState === 'reply-input'"
      class="reply-mask"
    >
      <view class="reply-panel">
        <view class="reply-input"
          ><text>{{
            overlayState === 'reply-input'
              ? '这是一个充满希望的季节，希望小猫今年也可以好好地'
              : '说点什么'
          }}</text>
        </view>
        <view class="reply-actions"
          ><uni-icons
            type="mic"
            color="#444"
            :size="20"
          ></uni-icons
          ><uni-icons
            type="image"
            color="#444"
            :size="20"
          ></uni-icons>
          <view class="reply-send">发送</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawYardDetailFigma from '@/components/PawYardDetailFigma.vue'
import AdoptPickCatsSheet from '@/components/AdoptPickCatsSheet.vue'
import { openUserProfile } from '@/utils/profileNav.ts'
import { getPawHomeYardMock, type YardRankItem } from '@/utils/yardMock.ts'
import { readPublicYard } from '../../services/localManagementStorage.ts'
import {
  createYardDetailPageState,
  mergePublicYardDetail,
  resolveYardDetailRoute,
  selectAdoptionPets,
  yardDetailRankUser,
  type YardDetailPageState,
} from '../../services/yardDetailMetadata.ts'

export default defineComponent({
  components: { PawYardDetailFigma, AdoptPickCatsSheet },
  data(): YardDetailPageState {
    return createYardDetailPageState(getPawHomeYardMock())
  },
  computed: {
    helpContent() {
      return this.helpPopup === 'feedback-stat'
        ? {
            title: '平均反馈时长',
            copy: '院主共反馈78次，平均反馈时长3天2小时；平均反馈时长指的是院主自投粮物流签收后的平均上传动态反馈时间，未计算次数内的反馈不计入',
          }
        : {
            title: '帮助领养',
            copy: '截止目前，院主已从43位领养人中仔细筛选出23人，并成功为13只猫咪找到新家，沉福它们，感谢院主和领养人不辞辛苦的坚持与努力',
          }
    },
    adoptionPets() {
      return selectAdoptionPets(this.yard.pets)
    },
  },
  onLoad(options: unknown = {}) {
    const route = resolveYardDetailRoute(options)
    if (!route) {
      uni.showToast({ title: '小院参数无效', icon: 'none' })
      return
    }
    this.yardId = route.yardId
    this.yard = { ...this.yard, id: route.yardId }
    this.refreshYard()
    this.routeReady = true
    this.figmaState = route.figmaState
    this.overlayState = route.overlayState
    this.helpPopup = route.helpPopup
  },
  onShareAppMessage() {
    return {
      title: '我就是要喂猫｜一起照顾流浪猫',
      path: `/packages/yard/pages/detail/index?yardId=${encodeURIComponent(this.yardId)}`,
      imageUrl: '/static/figma/yard-cover-exact.png',
    }
  },
  onShareTimeline() {
    return {
      title: '我就是要喂猫｜一起照顾流浪猫',
      query: `id=${encodeURIComponent(this.yardId)}`,
      imageUrl: '/static/figma/yard-cover-exact.png',
    }
  },
  onShow() {
    if (this.yardId) this.refreshYard()
  },
  methods: {
    refreshYard() {
      const publicYard = readPublicYard(this.yardId)
      if (publicYard.success && publicYard.data && publicYard.data.record) {
        const record = publicYard.data.record
        this.yard = mergePublicYardDetail(this.yard, record, this.yardId)
      }
    },
    openPetDetail(pet: { id: string }) {
      if (!pet.id) return
      uni.navigateTo({
        url:
          '/packages/animal/pages/detail/index?animalId=' +
          encodeURIComponent(pet.id) +
          '&yardId=' +
          encodeURIComponent(this.yardId || '1'),
      })
    },
    openPetList() {
      uni.navigateTo({
        url:
          '/packages/yard/pages/animals/index?state=roster&name=' +
          encodeURIComponent('我就是要喂猫') +
          '&yardId=' +
          encodeURIComponent(this.yardId || '1'),
      })
    },
    openRankUser(item: YardRankItem) {
      openUserProfile(yardDetailRankUser(item))
    },
    openAdoptSheet() {
      this.adoptPickSheetVisible = true
    },
  },
})
</script>

<style scoped>
page {
  background: #fff;
}

.detail-shell {
  min-height: 100vh;
}

.yard-detail-state {
  min-height: 100vh;
  padding: 220px 32px 0;
  box-sizing: border-box;
  text-align: center;
  background: #fff;
}

.yard-detail-state__title,
.yard-detail-state__copy {
  display: block;
}

.yard-detail-state__title {
  color: #333;
  font-size: 18px;
  font-weight: 500;
}

.yard-detail-state__copy {
  margin-top: 12px;
  color: #999;
  font-size: 14px;
}

.reply-mask {
  position: fixed;
  inset: 0;
  z-index: 900;
  background: #5b5b5b;
}

.reply-panel {
  position: absolute;
  left: 0;
  right: 0;
  top: 410px;
  height: 130px;
  background: #fff;
  border-radius: 14px 14px 0 0;
  overflow: hidden;
}

.reply-input {
  height: 75px;
  margin: 10px 12px 0;
  padding: 9px 14px;
  border-radius: 12px;
  background: #f5f5f7;
  box-sizing: border-box;
  color: #555;
  font-size: 14px;
  line-height: 18px;
}

.reply-actions {
  height: 45px;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 0 24px;
}

.reply-send {
  margin-left: auto;
  width: 54px;
  height: 30px;
  border-radius: 16px;
  background: #fff259;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.help-mask {
  position: fixed;
  inset: 0;
  z-index: 950;
  background: #5b5b5b;
}

.help-dialog {
  position: absolute;
  left: 40px;
  top: 260px;
  width: 295px;
  height: 234px;
  border-radius: 19px;
  background: #fff;
  overflow: hidden;
  box-sizing: border-box;
}

.help-title {
  display: block;
  height: 51px;
  line-height: 51px;
  text-align: center;
  font-size: 20px;
  font-weight: 500;
  color: #222;
}

.help-divider {
  height: 1px;
  margin: 0 22px;
  background: #f0f0f0;
}

.help-copy {
  display: flex;
  height: 130px;
  padding: 19px 34px 14px;
  align-items: flex-start;
  justify-content: center;
  box-sizing: border-box;
  text-align: center;
  color: #999;
  font-size: 14px;
  line-height: 16px;
}

.help-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 51px;
  border-top: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 15px;
}

.help-dialog--food {
  left: 62px;
  width: 251px;
  height: 214px;
}

.food-stat-row {
  height: 44px;
  padding: 0 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #999;
  font-size: 14px;
}

.food-stat-row text:last-child {
  color: #333;
  font-size: 16px;
}
</style>
