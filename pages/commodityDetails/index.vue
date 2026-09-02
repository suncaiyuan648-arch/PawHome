<template>
  <view class="detail-shell">
    <PawYardDetailFigma :state="figmaState" :yard-data="yard" @pet-click="openPetDetail" @pet-list-click="openPetList"
      @rank-user="openRankUser" />
    <view v-if="helpPopup" class="help-mask">
      <view class="help-dialog" :class="{ 'help-dialog--food': helpPopup === 'food-stat' }">
        <text class="help-title">{{ helpContent.title }}</text>
        <view class="help-divider"></view>
        <template v-if="helpPopup === 'food-stat'">
          <view class="food-stat-row"><text>小院累计获得投粮</text><text>999斤</text></view>
          <view class="food-stat-row"><text>小院累计获粮次数</text><text>456次</text></view>
        </template>
        <text v-else class="help-copy">{{ helpContent.copy }}</text>
        <view class="help-footer">我知道了</view>
      </view>
    </view>
    <view v-if="overlayState === 'reply-idle' || overlayState === 'reply-input'" class="reply-mask">
      <view class="reply-panel">
        <view class="reply-input"><text>{{ overlayState === 'reply-input' ? '这是一个充满希望的季节，希望小猫今年也可以好好地' : '说点什么'
            }}</text>
        </view>
        <view class="reply-actions"><uni-icons type="mic" color="#444" :size="20"></uni-icons><uni-icons type="image"
            color="#444" :size="20"></uni-icons>
          <view class="reply-send">发送</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import PawYardDetailFigma from '@/components/PawYardDetailFigma.vue'
import { openUserProfile } from '@/utils/profileNav.js'
import { getPawHomeYardMock } from '@/utils/yardMock.js'

export default {
  components: { PawYardDetailFigma },
  data() {
    const yard = getPawHomeYardMock()
    return { figmaState: 'dynamic', overlayState: '', helpPopup: '', yardId: yard.id, yard }
  },
  computed: { helpContent() { return this.helpPopup === 'feedback-stat' ? { title: '平均反馈时长', copy: '院主共反馈78次，平均反馈时长3天2小时；平均反馈时长指的是院主自投粮物流签收后的平均上传动态反馈时间，未计算次数内的反馈不计入' } : { title: '帮助领养', copy: '截止目前，院主已从43位领养人中仔细筛选出23人，并成功为13只猫咪找到新家，沉福它们，感谢院主和领养人不辞辛苦的坚持与努力' } } },
  onLoad(options = {}) {
    if (options.id) this.yardId = String(options.id)
    const allowed = ['dynamic', 'dynamic-empty', 'feeding', 'dynamic-expanded']
    this.figmaState = allowed.includes(options.state) ? options.state : 'dynamic'
    this.overlayState = ['reply-idle', 'reply-input'].includes(options.state) ? options.state : ''
    this.helpPopup = ['help-adopt', 'feedback-stat', 'food-stat'].includes(options.popup) ? options.popup : ''
  },
  onShareAppMessage() {
    return {
      title: '我就是要喂猫｜一起照顾流浪猫',
      path: `/pages/commodityDetails/index?id=${encodeURIComponent(this.yardId)}`,
      imageUrl: '/static/figma/yard-cover-exact.png'
    }
  },
  onShareTimeline() {
    return {
      title: '我就是要喂猫｜一起照顾流浪猫',
      query: `id=${encodeURIComponent(this.yardId)}`,
      imageUrl: '/static/figma/yard-cover-exact.png'
    }
  },
  methods: {
    openPetDetail(pet) {
      const petId = pet && pet.id ? String(pet.id) : ''
      if (!petId) return
      uni.navigateTo({
        url: '/pages/adoption/petDetail?state=35&petId=' + encodeURIComponent(petId) +
          '&yardId=' + encodeURIComponent(this.yardId || '1')
      })
    },
    openPetList() {
      uni.navigateTo({
        url: '/pages/yard/yardCats?state=roster&name=' + encodeURIComponent('我就是要喂猫') +
          '&yardId=' + encodeURIComponent(this.yardId || '1')
      })
    },
    openRankUser(item) {
      if (!item) return
      openUserProfile({ pawId: item.pawId || item.id, nickname: item.text, avatar: item.avatar })
    }
  }
}
</script>

<style scoped>
page {
  background: #fff;
}

.detail-shell {
  min-height: 100vh
}

.reply-mask {
  position: fixed;
  inset: 0;
  z-index: 900;
  background: #5b5b5b
}

.reply-panel {
  position: absolute;
  left: 0;
  right: 0;
  top: 410px;
  height: 130px;
  background: #fff;
  border-radius: 14px 14px 0 0;
  overflow: hidden
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
  line-height: 18px
}

.reply-actions {
  height: 45px;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 0 24px
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
  font-size: 13px
}

.help-mask {
  position: fixed;
  inset: 0;
  z-index: 950;
  background: #5b5b5b
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
  box-sizing: border-box
}

.help-title {
  display: block;
  height: 51px;
  line-height: 51px;
  text-align: center;
  font-size: 20px;
  font-weight: 500;
  color: #222
}

.help-divider {
  height: 1px;
  margin: 0 22px;
  background: #f0f0f0
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
  line-height: 16px
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
  font-size: 15px
}

.help-dialog--food {
  left: 62px;
  width: 251px;
  height: 214px
}

.food-stat-row {
  height: 44px;
  padding: 0 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #999;
  font-size: 14px
}

.food-stat-row text:last-child {
  color: #333;
  font-size: 16px
}
</style>
