<template>
  <view class="assets-page" data-qa="qa-my-assets-page"
    :class="['assets-page--' + mode, { 'assets-page--roster': listState === 'owned' }]">
    <template v-if="mode === 'pets' && listState === 'owned'">
      <PawPetRoster variant="owned" data-qa="qa-my-pets-page" @back="goBack" @feed-click="openFeedPopup" />
    </template>
    <template v-else-if="mode === 'pets'">
      <PawPetRoster variant="yard" :yard-id="yardId" :yard-name="yardName" :yard-avatar="yardAvatar"
        :owner-paw-id="ownerPawId" @back="goBack" @pet-click="openPetDetail" @owner-click="openPetOwner"
        @feed-click="openFeedPopup" />
    </template>

    <template v-else-if="mode === 'medals'">
      <image class="medal-bg" src="/static/figma/medals/medal-page-bg.png" mode="aspectFill" aria-hidden="true" />
      <PawPageNav title="我的勋章" background="transparent" fallback-url="/pages/me/index" />
      <scroll-view class="medal-scroll" scroll-y :show-scrollbar="false" :enable-flex="true">
        <view class="medal-content">
          <view class="medal-profile" data-qa="qa-my-medals-profile">
            <view class="medal-profile-main">
              <image class="profile-photo" src="/static/figma/me-avatar.png" mode="aspectFill" />
              <view class="profile-copy">
                <view class="profile-name-row"><text class="asset-name">浮生孤影</text>
                  <LevelBadge level="1" />
                </view><text class="asset-muted">您的勋章数量超越80%用户</text>
              </view>
            </view>
            <view class="medal-count">
              <image class="medal-laurel medal-laurel--left" src="/static/figma/medals/laurel-left.svg" mode="aspectFit"
                aria-hidden="true" />
              <image class="medal-laurel medal-laurel--right" src="/static/figma/medals/laurel-right.svg"
                mode="aspectFit" aria-hidden="true" />
              <text class="medal-number">0</text>
              <view class="medal-count-label">
                <text class="count-unit">枚勋章</text>
                <PawIcon name="navigation/chevron-right" :size="7" color="#333" />
              </view>
            </view>
          </view>
          <view class="main-medal" data-qa="qa-my-medals-featured" @tap.stop="openNewMedal">
            <image src="/static/figma/medals/guardian-medal.png" mode="aspectFit" />
          </view>
          <text class="recent">最近获得</text>
          <text class="recent-copy">累计投喂10斤</text>
          <text class="earned">已获得 9 枚勋章</text>
          <view class="medal-divider"></view>
          <view class="medal-grid">
            <view v-for="i in 6" :key="i" class="medal-grid-item" :data-qa="'qa-my-medal-' + i"
              @tap.stop="openNewMedal">
              <view class="grid-medal">
                <image src="/static/figma/medals/guardian-medal.png" mode="aspectFit" />
              </view><text>诸邪退散</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </template>

    <template v-else-if="mode === 'map'">
      <PawPageNav title="勋章地图" background="#e4e4e4" fallback-url="/pages/meMore/myAssets?mode=medals" />
      <view class="map-spacer"></view>
      <view class="map-footer" data-qa="qa-medal-map-profile">
        <view class="medal-profile-main">
          <image class="profile-photo" src="/static/figma/me-avatar.png" mode="aspectFill" />
          <view class="profile-copy">
            <view class="profile-name-row"><text class="asset-name">浮生孤影</text>
              <LevelBadge level="1" />
            </view><text class="asset-muted">您的勋章数量超越80%用户</text>
          </view>
        </view>
        <view class="medal-count">
          <image class="medal-laurel medal-laurel--left" src="/static/figma/medals/map-laurel-left.svg" mode="aspectFit"
            aria-hidden="true" />
          <image class="medal-laurel medal-laurel--right" src="/static/figma/medals/map-laurel-right.svg"
            mode="aspectFit" aria-hidden="true" />
          <text class="medal-number">0</text>
          <view class="medal-count-label">
            <text class="count-unit">枚勋章</text>
            <PawIcon name="navigation/chevron-right" :size="7" color="#333" />
          </view>
        </view>
      </view>
    </template>

    <template v-else>
      <PawPageNav background="#eaf5ff" fallback-url="/pages/meMore/myAssets?mode=medals" slot-position="custom"
        :slot-style="{ left: '39px' }">
        <template #content>
          <view class="new-nav-content">
            <text class="new-nav-title">得诸邪避散勋章</text>
          </view>
        </template>
      </PawPageNav>
      <view class="new-medal-card" data-qa="qa-new-medal-card">
        <view class="rules" data-qa="qa-medal-rules" @tap.stop="openMedalRules">规则</view>
        <view class="new-medal-image">
          <image src="/static/figma/medals/guardian-medal.png" mode="aspectFit" />
        </view><text class="new-medal-name">诸邪避散</text><text class="new-medal-state">已获得</text><text
          class="new-medal-sub">连续30天云养猫咪</text>
        <view class="progress-row">
          <view class="progress-fill"></view>
          <view class="progress-check"><uni-icons type="checkmarkempty" color="#1639bf" :size="15" /></view>
        </view><text class="task-state">任务已完成</text><text class="encouragement">你是最棒的！！！</text>
        <view class="claim-button" data-qa="qa-new-medal-confirm" @tap.stop="claimMedal">好的</view>
      </view>
    </template>

    <YardFeedPopup v-if="feedPopupVisible" v-model:visible="feedPopupVisible" :pet-id="feedPetId"
      @feed-order="openFeedOrders" />
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawPetRoster from '@/components/PawPetRoster.vue'
import LevelBadge from '@/components/customBadge/LevelBadge.vue'
import YardFeedPopup from '@/components/YardFeedPopup.vue'
import { openUserProfile } from '@/utils/profileNav.js'

const PENDING_FIRST_MEDAL_KEY = 'pawhome.pendingFirstMedal'

function isPendingFirstMedal(value) {
  return value === true || value === 1 || value === '1' || value === 'true' || Boolean(value && typeof value === 'object')
}

export default {
  components: { PawPageNav, PawIcon, PawPetRoster, LevelBadge, YardFeedPopup },
  data() {
    return {
      mode: 'pets', listState: '', feedPopupVisible: false, feedPetId: '',
      yardId: '1',
      yardName: '我就是要喂猫',
      yardAvatar: '/static/figma/yard-cover-exact.png',
      ownerPawId: 'owner-1'
    }
  },
  onLoad(options = {}) {
    const requestedMode = String(options.mode || 'pets')
    const pendingFirstMedal = isPendingFirstMedal(uni.getStorageSync(PENDING_FIRST_MEDAL_KEY))
      || ['1', 'true'].includes(String(options.first || '').toLowerCase())
    this.mode = requestedMode === 'medals' && pendingFirstMedal
      ? 'new'
      : (['pets', 'medals', 'map', 'new'].includes(requestedMode) ? requestedMode : 'pets')
    this.listState = options.state === 'owned' ? 'owned' : ''
    if (options.yardId) this.yardId = String(options.yardId)
    if (options.yardName) this.yardName = decodeURIComponent(String(options.yardName))
    if (requestedMode === 'medals' && pendingFirstMedal) {
      uni.removeStorageSync(PENDING_FIRST_MEDAL_KEY)
    }
  },
  methods: {
    goBack() {
      if (this.mode === 'new') {
        this.openMedalList()
        return
      }
      uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/me/index' }) })
    },
    openPetDetail(pet) {
      const petId = pet && pet.id ? String(pet.id) : ''
      if (!petId) return
      uni.navigateTo({
        url: '/pages/adoption/petDetail?state=35&managed=0&petId=' + encodeURIComponent(petId) +
          '&yardId=' + encodeURIComponent(this.yardId)
      })
    },
    openPetOwner(owner) {
      if (!owner || !owner.pawId) return
      openUserProfile({ pawId: owner.pawId, nickname: owner.name, avatar: owner.avatar })
    },
    openNewMedal() { uni.navigateTo({ url: '/pages/meMore/myAssets?mode=new' }) },
    openMedalList() {
      uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/meMore/myAssets?mode=medals' }) })
    },
    openMedalRules() { uni.showToast({ title: '勋章规则', icon: 'none' }) },
    claimMedal() {
      uni.removeStorageSync(PENDING_FIRST_MEDAL_KEY)
      this.openMedalList()
    },
    openFeedPopup(pet) {
      const petId = pet && pet.id ? String(pet.id) : ''
      if (!petId) return
      this.feedPetId = petId
      this.feedPopupVisible = true
    },
    openFeedOrders() { uni.navigateTo({ url: '/pages/meMore/yardFeedOrders' }) }
  }
}
</script>

<style scoped>
.assets-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  position: relative;
  overflow: hidden;
  background: #f5f5f5;
  color: #222;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Arial, sans-serif
}

.assets-page--medals {
  height: 100vh;
  min-height: 0;
  background: #fff;
}

.medal-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none
}

.medal-scroll {
  flex: 1 1 auto;
  height: 0;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}

.medal-content {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 100%;
  padding-bottom: 32px;
  box-sizing: border-box;
}

.medal-profile {
  flex: 0 0 auto;
  position: relative;
  z-index: 1;
  height: 97px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 9px 15px 16px;
  box-sizing: border-box
}

.medal-profile-main {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 11px;
  min-width: 0
}

.profile-photo {
  width: 72px;
  height: 72px;
  border: 1.5px solid #fff;
  border-radius: 50%;
  box-sizing: border-box
}

.profile-copy {
  flex: 1 1 auto;
  min-width: 0
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 5px
}

.asset-name {
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap
}

.asset-muted {
  display: block;
  margin-top: 4px;
  color: #898989;
  font-size: 12px;
  white-space: nowrap
}

.medal-count {
  position: relative;
  z-index: 1;
  height: 64px;
  flex: 0 0 95px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box
}

.medal-number {
  font-size: 36px;
  font-weight: 500;
  line-height: 40px;
  position: relative;
  z-index: 1
}

.medal-count-label {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 18px;
  white-space: nowrap
}

.count-unit {
  font-size: 13px;
  color: #555;
}

.medal-laurel {
  position: absolute;
  z-index: 0;
  top: 5px;
  width: 21px;
  height: 45px;
  pointer-events: none
}

.medal-laurel--left {
  left: 0
}

.medal-laurel--right {
  right: 0
}

.main-medal {
  flex: 0 0 auto;
  position: relative;
  z-index: 1;
  display: block;
  width: 164px;
  height: 164px;
  margin: 8px auto 17px;
  border-radius: 50%
}

.recent,
.recent-copy,
.earned {
  flex: 0 0 auto;
  position: relative;
  z-index: 1;
  display: block;
  text-align: center
}

.recent {
  color: #999;
  font-size: 12px
}

.recent-copy {
  margin-top: 3px;
  color: #666;
  font-size: 16px
}

.earned {
  margin-top: 31px;
  color: #666;
  font-size: 16px
}

.medal-divider {
  flex: 0 0 auto;
  position: relative;
  z-index: 1;
  height: 1px;
  margin: 15px 15px 0;
  background: #eee
}

.medal-grid {
  flex: 0 0 auto;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  column-gap: 5px;
  row-gap: 10px;
  box-sizing: border-box;
  padding: 30px 23px 0
}

.medal-grid-item {
  flex: 0 0 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 13px
}

.medal-grid image {
  width: 82px;
  height: 82px;
  margin-bottom: 7px;
  border-radius: 50%
}

.assets-page--map {
  height: 100vh;
  min-height: 0;
  background: #e1e1e1
}

.map-spacer {
  flex: 1 1 auto;
  min-height: 0
}

.map-footer {
  flex: 0 0 153px;
  width: 100%;
  height: 153px;
  padding: 17px 15px 43px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px 10px 0 0;
  box-sizing: border-box
}

.map-footer .profile-photo {
  width: 72px;
  height: 72px
}

.map-footer .profile-copy {
  flex: 1 1 auto;
  min-width: 0
}

.assets-page--new {
  height: 100vh;
  min-height: 0;
  background: #eaf5ff
}

.new-nav-content {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  min-width: 0;
}

.new-nav-title {
  flex: 0 0 auto;
  color: #222;
  font-size: 17px;
  font-weight: 700;
  line-height: 22px;
  white-space: nowrap;
}

.rules {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 5px 11px;
  border-radius: 14px;
  background: #c9d9ea;
  color: #6f8194;
  font-size: 12px
}

.new-medal-card {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  width: calc(100% - 48px);
  margin: 23px auto 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border-radius: 24px 24px 0 0;
  overflow: hidden
}

.new-medal-image {
  width: 164px;
  height: 164px;
  margin-top: 70px;
  border-radius: 50%
}

.new-medal-name {
  margin-top: 26px;
  font-size: 20px;
  font-weight: 700
}

.new-medal-state {
  margin-top: 3px;
  color: #666;
  font-size: 16px
}

.new-medal-sub {
  margin-top: 5px;
  color: #aaa;
  font-size: 13px
}

.progress-row {
  position: relative;
  width: 274px;
  height: 20px;
  margin-top: 48px
}

.progress-fill {
  position: absolute;
  left: 0;
  right: 0;
  top: 9px;
  height: 5px;
  border-radius: 4px;
  background: #1639bf
}

.progress-check {
  position: absolute;
  right: -4px;
  top: 0;
  width: 19px;
  height: 19px;
  border: 2px solid #1639bf;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: #1639bf;
  font-size: 14px;
  font-weight: 700;
  box-sizing: border-box
}

.task-state {
  margin-top: 2px;
  color: #aaa;
  font-size: 13px
}

.encouragement {
  margin-top: 52px;
  color: #b7b7b7;
  font-size: 14px
}

.claim-button {
  width: 201px;
  height: 49px;
  margin-top: 16px;
  border-radius: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, #f6e0aa, #e9ca76);
  color: #7a4200;
  font-size: 16px;
  font-weight: 700
}

.main-medal,
.grid-medal,
.new-medal-image {
  position: relative;
  overflow: hidden;
  border-radius: 50%
}

.main-medal image,
.new-medal-image image {
  position: absolute;
  left: -27px;
  top: -27px;
  width: 218px;
  height: 218px
}

.grid-medal {
  width: 82px;
  height: 82px;
  margin-bottom: 7px
}

.medal-grid .grid-medal image {
  position: absolute;
  left: -14px;
  top: -14px;
  width: 110px;
  height: 110px;
  margin: 0;
  border-radius: 0
}

.assets-page--medals .medal-profile {
  padding-top: 5px;
  padding-bottom: 20px
}

.assets-page--medals .main-medal {
  margin-bottom: 24px
}

.assets-page--medals .medal-divider {
  margin-top: 9px
}

.assets-page--medals .medal-grid {
  row-gap: 10px;
  padding: 17px 17px 0
}

.assets-page--medals .grid-medal {
  width: 110px;
  height: 110px;
  margin-bottom: -8px
}

.assets-page--medals .grid-medal image {
  left: 0;
  top: 0;
  width: 110px;
  height: 110px
}

.assets-page--map .map-footer {
  padding-top: 14px;
  padding-bottom: 46px
}

.assets-page--new .progress-fill {
  top: 4px
}

.assets-page--new .progress-check {
  top: -5px
}

.assets-page--new .encouragement {
  margin-top: 49px
}

.assets-page--new .claim-button {
  margin-top: 13px
}

.assets-page--roster {
  padding-top: 0;
  overflow: auto
}
</style>
