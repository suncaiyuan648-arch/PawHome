<template>
  <view class="rescue-review-page" data-qa="qa-rescue-review-page">
    <PawPageNav title="救助评审" :title-centered="true" background="#f5f5f5" fallback-url="/pages/me/index" />

    <scroll-view class="rescue-review-scroll" scroll-y :show-scrollbar="false">
      <view class="fund-card">
        <text class="fund-name">{{ fundSummary.name }}</text>
        <text class="fund-balance">{{ fundSummary.balance }}</text>
        <text class="fund-label">剩余金额(元)</text>
        <view class="fund-stats">
          <view v-for="stat in fundSummary.stats" :key="stat.label" class="fund-stat">
            <text>{{ stat.value }}</text>
            <text>{{ stat.label }}</text>
          </view>
        </view>
      </view>

      <view class="fund-note" data-qa="qa-rescue-fund-note">
        <image class="fund-note__icon" src="/static/figma/feature/rescue-fund-info.svg" mode="aspectFit" />
        <text>{{ fundSummary.note }}</text>
      </view>

      <view class="fund-tabs" data-qa="qa-rescue-fund-tabs">
        <view v-for="stat in fundSummary.statusStats" :key="stat.status" class="fund-tab"
          :class="{ 'fund-tab--active': activeFundStatus === stat.status }"
          :data-qa="'qa-rescue-fund-tab-' + stat.status" @tap="selectFundStatus(stat.status)">
          <text class="fund-tab__count">{{ stat.value }}</text>
          <view class="fund-tab__label" :class="{ 'fund-tab__label--active': activeFundStatus === stat.status }">
            <text>{{ stat.label }}</text>
          </view>
        </view>
      </view>

      <view v-for="item in visibleRescueItems" :key="item.id" class="rescue-card paw-surface"
        data-qa="qa-rescue-fund-record" :id="'qa-rescue-fund-record-' + item.id" @tap="openRescueDetail(item.id)">
        <view class="rescue-head">
          <PawAvatar class="rescue-avatar" :src="item.ownerAvatar" :size="41" :clickable="true"
            @click.stop="openRescueOwner(item)" />
          <view class="rescue-author-copy">
            <view class="rescue-author-line">
              <text @tap.stop="openRescueOwner(item)">{{ item.ownerName }}</text>
              <LevelCapsule :level="item.ownerLevel" inline />
            </view>
            <text class="muted">{{ item.createdLabel }}</text>
          </view>
          <PawStatusPill class="rescue-status" :text="item.statusText" :tone="item.statusTone" />
        </view>
        <text class="rescue-amount">¥{{ item.amount }} <text>求助金额</text></text>
        <text class="rescue-copy">{{ item.summary }}</text>
        <view class="rescue-gallery">
          <image v-for="(src, index) in item.mediaPaths.slice(0, 4)" :key="src + index" :src="src" mode="aspectFill" />
        </view>
        <text class="muted">{{ item.views }}人浏览</text>
      </view>
      <view class="rescue-review-scroll__space"></view>
    </scroll-view>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawStatusPill from '@/components/PawStatusPill.vue'
import PawAvatar from '@/components/identity/PawAvatar.vue'
import LevelCapsule from '@/components/LevelCapsule.vue'
import { getRescueRecords, getRescueReviewSummary } from '@/utils/rescueStorage.js'
import { openUserProfile } from '@/utils/profileNav.js'

export default {
  name: 'PawRescueReviewPage',
  components: { PawPageNav, PawStatusPill, PawAvatar, LevelCapsule },
  options: {
    // Keep the page root in normal flow when the component is mounted by the
    // route wrapper on WeChat.
    // #ifdef MP-WEIXIN
    virtualHost: true,
    // #endif
  },
  data() {
    return {
      rescueItems: getRescueRecords(),
      activeFundStatus: 'pending'
    }
  },
  computed: {
    fundSummary() {
      return getRescueReviewSummary(this.rescueItems)
    },
    visibleRescueItems() {
      return this.rescueItems.filter((item) => item.status === this.activeFundStatus)
    }
  },
  onShow() {
    this.rescueItems = getRescueRecords()
  },
  methods: {
    selectFundStatus(status) {
      const nextStatus = String(status || '').trim()
      if (!this.fundSummary.statusStats.some((stat) => stat.status === nextStatus)) return
      this.activeFundStatus = nextStatus
    },
    openRescueOwner(record) {
      if (!record) return
      openUserProfile({
        pawId: record.ownerPawId || (record.applicant && record.applicant.id),
        nickname: record.ownerName,
        avatar: record.ownerAvatar
      })
    },
    openRescueDetail(id) {
      const rescueId = String(id || '').trim()
      if (!rescueId) return
      uni.navigateTo({
        url: `/pages/feature/index?mode=rescue-detail&rescueId=${encodeURIComponent(rescueId)}`
      })
    }
  }
}
</script>

<style scoped>
.rescue-review-page {
  display: flex;
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  flex-direction: column;
  box-sizing: border-box;
  background: #f5f5f5;
  color: #222;
}

.rescue-review-scroll {
  min-height: 0;
  flex: 1 1 auto;
  box-sizing: border-box;
  padding-bottom: 24px;
}

.fund-card {
  display: flex;
  width: calc(100% - 24px);
  height: 185px;
  min-height: 185px;
  flex-direction: column;
  margin: 10px 12px 0;
  padding: 18px 19px 20px;
  box-sizing: border-box;
  border-radius: 19px;
  overflow: hidden;
  background-color: #ffe766;
  background-image: url('/static/figma/feature/rescue-fund-bg.svg');
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
}

.fund-name {
  flex: 0 0 auto;
  color: #6b4a22;
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
}

.fund-balance {
  align-self: center;
  flex: 0 0 auto;
  margin-top: 20px;
  color: #6b4a22;
  font-size: 32px;
  font-weight: 700;
  line-height: 38px;
}

.fund-label {
  align-self: center;
  flex: 0 0 auto;
  color: #6b4a22;
  font-size: 12px;
  line-height: 17px;
}

.fund-stats {
  display: flex;
  width: calc(100% + 14px);
  flex: 0 0 auto;
  align-items: flex-start;
  margin: 17px -7px 0;
}

.fund-stat {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  color: #6b4a22;
  font-size: 12px;
  line-height: 17px;
  white-space: nowrap;
}

.fund-stat>text:first-child {
  color: #6b4a22;
  font-size: 15px;
  font-weight: 700;
  line-height: 18px;
}

.fund-note {
  display: flex;
  width: calc(100% - 24px);
  align-items: center;
  margin: 16px 12px 0;
  padding: 0;
  box-sizing: border-box;
  color: #6b4a22;
  font-size: 12px;
  line-height: 17px;
  white-space: nowrap;
}

.fund-note__icon {
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  margin-right: 4px;
}

.fund-note>text {
  min-width: 0;
  flex: 1 1 auto;
}

.fund-tabs {
  display: flex;
  width: calc(100% - 24px);
  margin: 24px 12px 0;
}

.fund-tab {
  display: flex;
  min-width: 0;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  color: #999;
}

.fund-tab__count {
  height: 28px;
  margin-bottom: 0;
  color: #999;
  font-size: 20px;
  font-weight: 500;
  line-height: 28px;
}

.fund-tab--active .fund-tab__count {
  color: #000;
}

.fund-tab__label {
  display: flex;
  min-width: 40px;
  height: 16px;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border-radius: 8px;
  color: #999;
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
}

.fund-tab__label--active {
  background: #ffe60f;
  color: #000;
}

.rescue-card {
  display: flex;
  width: calc(100% - 30px);
  min-height: 0;
  flex-direction: column;
  margin: 10px 15px 0;
  padding: 15px;
  box-sizing: border-box;
  border-radius: 10px;
}

.rescue-head {
  display: flex;
  align-items: center;
}

.rescue-avatar {
  width: 41px;
  height: 41px;
  flex: 0 0 41px;
  margin-right: 7px;
}

.rescue-author-copy {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
}

.rescue-author-line {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
}

.rescue-author-line>text:first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rescue-status {
  min-height: 21px;
  flex: none;
  padding-right: 7px;
  padding-left: 7px;
}

.muted {
  color: #999;
  font-size: 12px;
  line-height: 17px;
}

.rescue-amount {
  display: block;
  margin-top: 13px;
  color: #ff3d48;
  font-size: 21px;
  line-height: 27px;
}

.rescue-amount text {
  font-size: 11px;
}

.rescue-copy {
  display: block;
  margin-top: 13px;
  color: #333;
  font-size: 14px;
  line-height: 20px;
  word-break: break-all;
}

.rescue-gallery {
  display: flex;
  width: 100%;
  gap: 4px;
  margin-top: 19px;
}

.rescue-gallery image {
  width: calc((100% - 12px) / 4);
  height: 78px;
  flex: none;
}

.rescue-review-scroll__space {
  height: 12px;
}
</style>
