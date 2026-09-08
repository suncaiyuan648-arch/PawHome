<template>
  <view class="af-page"
    :class="['af-frame-' + frameNumber, { 'af-gradient': gradientTop, 'af-has-footer': hasFooter }]">
    <PawPageNav :title="navTitle" :background="navBackground" fallback-url="/pages/me/index" />

    <scroll-view class="af-scroll" scroll-y :show-scrollbar="false">
      <view class="af-content">
        <view v-if="showStatusHeading" class="af-heading">
          <PawIcon v-if="statusIconName" class="af-heading-status-image" :name="statusIconName"
            :size="statusIconSize" />
          <text>{{ statusText }}</text>
        </view>

        <view v-if="progressMode" class="af-progress-card" data-qa="qa-adoption-flow-progress">
          <view class="af-progress-stage">
            <view class="af-progress-track" :class="'is-step-' + progressStep" aria-hidden="true">
              <view class="af-progress-line"></view>
              <view class="af-progress-line__active"></view>
              <view v-for="step in progressCheckSteps" :key="step.key" class="af-progress-node"
                :class="{ active: step.active }" :style="{ left: step.offset }">
                <view class="af-progress-node__circle">
                  <PawIcon name="actions/selection-check" :size="9" />
                </view>
              </view>
              <view class="af-progress-medal" :class="{ muted: frameNumber !== 57 }">
                <PawIcon name="badges/adoption-reward" :size="22" />
              </view>
            </view>
            <view class="af-progress-labels">
              <text class="af-progress-label af-progress-label--success">领养成功</text>
              <text class="af-progress-label af-progress-label--owner">院主确认</text>
              <view v-if="progressReviewing" class="af-progress-label af-progress-label--review">
                <text>评审中</text>
                <uni-icons type="right" color="#fd6302" :size="11" />
              </view>
              <text class="af-progress-label af-progress-label--reward" :class="{ active: frameNumber === 57 }"
                data-qa="qa-adoption-flow-claim-reward" @tap="onRewardAction">{{ rewardClaimed ? '已领取' : '抽取奖励'
                }}</text>
            </view>
          </view>
          <text class="af-progress-percent">{{ progressPercent }}</text>
        </view>

        <view v-if="showApplyCard" class="af-card af-apply-card" :class="{ 'with-user': showApplicant }">
          <view v-if="showApplicant" class="af-user-line">
            <PawImage class="af-user-avatar" :src="applicantAvatar" :size="34" :radius="17" :preview="false" />
            <text>{{ applicantName }}</text>
            <view class="af-role-tag">申请人</view>
          </view>
          <text class="af-apply-copy">{{ applyCopy }}</text>
          <view class="af-apply-photos">
            <PawImage v-for="(photo, index) in applyPhotos" :key="index" class="af-apply-photo" :src="photo"
              display-mode="fixed" :width="106" :height="106" :radius="4" :preview="false" />
          </view>
        </view>

        <view v-if="showProofCard" class="af-card af-proof-card">
          <view class="af-proof-photos">
            <view v-for="item in proofItems" :key="item.label" class="af-proof-item">
              <PawImage class="af-proof-photo" :src="proofPhoto" display-mode="fixed" :width="106" :height="106"
                :radius="3" :preview="true" />
              <text class="af-proof-date">2026.01.03</text>
              <text class="af-proof-label">{{ item.label }}</text>
            </view>
          </view>
          <text class="af-proof-copy">{{ proofCopy }}</text>
        </view>

        <PawAdoptionPetsCard v-if="showPets" :title="petTitle" :pets="displayPets" :yard-name="ownerName"
          :yard-id="record && record.yardId" :yard-avatar="ownerAvatar" :yard-tag="yardTag" :show-add="false"
          :show-owner="showOwner" :pet-clickable="true" :yard-clickable="true" :min-height="showOwner ? 231 : 160"
          :margin-bottom="10" qa-prefix="qa-adoption-flow-pet-" @pet-click="openPetDetail"
          @yard-click="openYardDetail" />

        <template v-if="showAdoptionInfo">
          <view class="af-card af-location-card" data-qa="qa-adoption-flow-location" @tap="openLocation">
            <view class="af-location-label"><uni-icons type="location" color="#777" :size="13" /><text>小院位置</text>
            </view>
            <text class="af-location-name">{{ locationName }}</text>
            <view class="af-location-action">
              <text class="af-distance">{{ distance }}</text>
              <PawIcon class="af-location-chevron" name="navigation/chevron-right" :size="16" />
            </view>
          </view>
          <view class="af-card af-location-copy"><text>{{ locationCopy }}</text></view>
          <view class="af-card af-contact-card">
            <view class="af-contact-head">
              <PawImage class="af-contact-avatar" :src="contactAvatar" :size="34" :radius="17" :preview="false"
                @tap.stop="openOwnerProfile" />
              <text @tap.stop="openOwnerProfile">{{ contactName }}</text>
              <PawOwnerBadge class="af-contact-owner" @tap.stop="openOwnerProfile" />
              <view class="af-contact-link" @tap="openContact"><text>联系方式</text><uni-icons type="right" color="#aaa"
                  :size="13" /></view>
            </view>
            <text class="af-contact-copy">{{ contactCopy }}</text>
          </view>
        </template>

        <PawAdoptionRejectReason v-if="showRejectReason" :rejector="record && record.rejector" :note="rejectNote" />
        <view v-if="showInfoLink" class="af-card af-link-row" @tap="openFrame(48)">
          <text>领养信息</text>
          <view><text>查看</text><uni-icons type="right" color="#bbb" :size="14" /></view>
        </view>
        <view v-if="showApplyLink" class="af-card af-link-row" data-qa="qa-adoption-flow-application-link"
          @tap="openApplyContent">
          <text>申请内容</text>
          <view><text>查看</text><uni-icons type="right" color="#bbb" :size="14" /></view>
        </view>
      </view>
    </scroll-view>

    <PawFixedActionBar v-if="footerMode" :secondary-action="secondaryAction" :primary-action="singlePrimaryAction"
      @secondary="onFooterAction" @primary="onFooterAction" />

    <PawDialog v-model="showContact" variant="jury-vote-result" title="院主联系方式" :show-cancel="true" cancel-text="返回"
      confirm-text="复制" :auto-close="false" :close-on-mask="true" @confirm="copyContact">
      <view class="af-contact-dialog" data-qa="qa-adoption-contact-dialog">
        <input class="af-contact-dialog__input" :value="contactPhone" disabled data-qa="qa-adoption-contact-input" />
      </view>
    </PawDialog>

    <PawRewardOrderSheet v-model="showRewardSheet" :record-id="resolvedRecordId" @submitted="onRewardSubmitted" />
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawFixedActionBar from '@/components/layout/PawFixedActionBar.vue'
import PawDialog from '@/components/overlay/PawDialog.vue'
import PawOwnerBadge from '@/components/identity/PawOwnerBadge.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawAdoptionPetsCard from '@/components/PawAdoptionPetsCard.vue'
import PawAdoptionRejectReason from '@/components/adoption/PawAdoptionRejectReason.vue'
import PawImage from '@/components/base/PawImage.vue'
import PawRewardOrderSheet from '@/components/adoption/PawRewardOrderSheet.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { adoptionPetAvatarSrc } from '@/utils/adoptionPetDisplay.js'
import { openUserProfile, openYardDetail } from '@/utils/profileNav.js'
import {
  getLastAdoptionId,
  getDemoAdoptions
} from '@/utils/adoptionStorage.js'
import {
  advanceApplication,
  getApplication
} from '@/utils/applicationMockApi.js'

const ASSET_ROOT = '/static/figma/adoption-flow/'

function pageOptions() {
  try {
    const pages = getCurrentPages()
    const page = pages && pages[pages.length - 1]
    return (page && (page.options || (page.$page && page.$page.options))) || {}
  } catch (e) {
    return {}
  }
}

function queryValue(value) {
  return value === undefined || value === null ? '' : decodeURIComponent(String(value))
}

export default {
  name: 'PawAdoptionFlowFigma',
  components: { PawPageNav, PawFixedActionBar, PawDialog, PawOwnerBadge, PawIcon, PawAdoptionPetsCard, PawAdoptionRejectReason, PawImage, PawRewardOrderSheet },
  props: {
    frame: { type: [Number, String], default: '' },
    recordId: { type: String, default: '' },
    openContact: { type: Boolean, default: false }
  },
  data() {
    return {
      record: null,
      resolvedRecordId: '',
      showContact: false,
      showRewardSheet: false,
      assets: {
        applyOne: ASSET_ROOT + '04a93fa17267335f49e6e818f8caa78dd3afc80b.png',
        applyTwo: ASSET_ROOT + 'b61b026ea991c01c6257c909021245fd64956837.png',
        petOne: ASSET_ROOT + 'e435a06f02d1fc46102464a34d8d58adf66e97bb.png',
        petTwo: ASSET_ROOT + '06034d7f1be7897c6f56e74b047d3499044297a1.png',
        owner: ASSET_ROOT + '45f5fc6ea328c9e88cff7a4504824254458e9e7b.png',
        applicant: ASSET_ROOT + 'db5da0781d7667c3490af5cfa74dd2fc7cf1ac01.png',
        contact: ASSET_ROOT + '07acee523d24ba7ebaf21ec60dee542f1e3fdcd4.png',
        proof: ASSET_ROOT + 'e81f2c2074a7772e8fbca3d3828b3a751f5cb5bb.png'
      }
    }
  },
  watch: {
    recordId: { immediate: true, handler() { this.loadRecord() } },
    openContact: { immediate: true, handler(value) { this.showContact = Boolean(value) } }
  },
  computed: {
    frameNumber() {
      const explicitFrame = Number(this.frame)
      if ([48, 49].includes(explicitFrame)) return explicitFrame
      const framesByStatus = {
        // 申请者页面只消费申请者状态；审批者和评审团有各自的页面。
        cloud_pending: 44,
        cloud_rejected: 45,
        pending: 44,
        rejected: 45,
        pickup: 54,
        owner_confirm: 55,
        owner_confirm_pending: 55,
        owner_confirm_rejected: 45,
        jury_confirm: 56,
        jury_confirm_pending: 56,
        jury_confirm_rejected: 45,
        adoption_confirmed: 57,
        reward: 57,
        reward_done: 57,
        abandoned: 45
      }
      return framesByStatus[this.record && this.record.status] || 44
    },
    navTitle() {
      if (this.frameNumber === 48) return '领养信息'
      if (this.frameNumber === 49) return '申请内容'
      if (this.progressMode) return '领养进度'
      return '领养申请'
    },
    navBackground() {
      if (this.frameNumber === 48) return '#f5f5f5'
      return 'linear-gradient(to bottom, #fffcdc 0%, #ffffff 100%)'
    },
    statusText() {
      if (this.record && this.record.status === 'cloud_pending') return '等待云家长审核中......'
      if (this.record && this.record.status === 'adoption_confirmed') return '领养确认成功'
      if (this.record && this.record.status === 'abandoned') return '已放弃领养'
      return ({
        44: '等待院主审核中......', 45: '已拒绝领养申请', 46: '等待院主审核中......',
        47: '等待云家长审核中......', 50: '院主已同意，待申请人前往领养',
        51: '申请人已领养，待院主确认', 52: '审批未通过，流程已结束', 53: '领养确认成功',
        54: '院主已同意，待申请人前往领养', 55: '申请人已领养，待院主确认',
        56: '院主确认成功，待评审团确认', 57: '恭喜您！获得领养礼物！'
      })[this.frameNumber] || '领养申请'
    },
    rejectedStatus() { return this.frameNumber === 45 },
    statusIconName() {
      if (this.frameNumber === 54) return 'status/check'
      if (this.frameNumber === 44) return 'navigation/clock'
      if (this.rejectedStatus) return 'status/rejected'
      return 'status/check'
    },
    statusIconSize() { return [44, 45, 54].includes(this.frameNumber) ? 17 : 19 },
    yellowTop() { return false },
    gradientTop() { return this.frameNumber !== 48 },
    progressMode() { return this.frameNumber >= 55 && this.frameNumber <= 57 },
    progressStep() { return this.frameNumber === 55 ? 1 : this.frameNumber === 56 ? 2 : 4 },
    progressPercent() { return this.frameNumber === 57 ? '100%' : '0%' },
    progressCheckSteps() {
      return [
        { key: 'adoption', offset: '0px', active: this.progressStep >= 1 },
        { key: 'owner', offset: '28.185%', active: this.progressStep >= 2 }
      ]
    },
    progressReviewing() { return this.frameNumber === 56 },
    rewardClaimed() { return Boolean(this.record && this.record.status === 'reward_done') },
    showStatusHeading() { return ![48, 49].includes(this.frameNumber) },
    showApplicant() { return false },
    showApplyCard() { return [44, 45, 49].includes(this.frameNumber) },
    showProofCard() { return [55, 56, 57].includes(this.frameNumber) },
    showPets() { return [44, 45, 49, 54, 55, 56, 57].includes(this.frameNumber) },
    showOwner() { return this.showPets },
    showAdoptionInfo() { return [48, 54].includes(this.frameNumber) },
    showRejectReason() { return this.frameNumber === 45 },
    showInfoLink() { return [55, 56, 57].includes(this.frameNumber) },
    showApplyLink() { return [54, 55, 56, 57].includes(this.frameNumber) },
    petTitle() { return this.frameNumber === 57 ? '领走的猫咪' : '申请领养的猫咪' },
    footerMode() {
      if (this.frameNumber === 54) return 'dual'
      return ''
    },
    hasFooter() { return !!this.footerMode },
    singlePrimaryAction() {
      if (this.record && this.record.status === 'reward_done') return null
      if (this.record && this.record.status === 'adoption_confirmed') {
        return { key: 'start-reward', label: '开始申请猫粮', qa: 'qa-adoption-flow-start-reward' }
      }
      const actions = {
        50: { key: 'open-evidence', label: '确认领养领猫粮', qa: 'qa-adoption-flow-open-evidence' },
        54: { key: 'open-evidence', label: '确认领养抽猫粮', qa: 'qa-adoption-flow-open-evidence' },
        53: { key: 'start-reward', label: '开始申请猫粮', qa: 'qa-adoption-flow-start-reward' }
      }
      return actions[this.frameNumber] || null
    },
    secondaryAction() {
      if (this.frameNumber !== 54) return null
      return { key: 'abandon-adoption', label: '放弃领养', qa: 'qa-adoption-flow-abandon' }
    },
    displayPets() {
      const list = this.record && Array.isArray(this.record.pets) ? this.record.pets : []
      if (list.length) return list.map(p => ({ ...p, name: p.name || '猫咪', avatar: adoptionPetAvatarSrc(p) }))
      return [{ name: '奥利奥', avatar: this.assets.petOne }, { name: '呗呗', avatar: this.assets.petTwo }]
    },
    applicantName() { return (this.record && this.record.applicantName) || '逢猫' },
    applicantAvatar() { return (this.record && this.record.applicantAvatar) || this.assets.applicant },
    ownerName() { return (this.record && (this.record.ownerNick || this.record.ownerName || this.record.yardName)) || '我就是要喂猫' },
    ownerAvatar() { return (this.record && this.record.ownerAvatar) || this.assets.owner },
    yardTag() { return (this.record && this.record.yardTag) || '小院' },
    applyCopy() { return (this.record && this.record.applyText) || '你好，我希望可以为小猫提供安全、稳定的生活环境，也愿意承担长期照顾和医疗责任。' },
    applyPhotos() {
      const media = this.record && Array.isArray(this.record.mediaPaths) ? this.record.mediaPaths.filter(Boolean) : []
      return [media[0] || this.assets.applyOne, media[1] || this.assets.applyTwo]
    },
    proofPhoto() { return (this.record && this.record.proofPhotos && this.record.proofPhotos[0]) || this.assets.proof },
    proofItems() { return [{ label: '来到逢猫' }, { label: '有家啦' }] },
    proofCopy() { return (this.record && this.record.confirmStory) || '我第一次去的时候小猫一直躲着我，去了几次都没有逮到，后来终于把小猫带回了家。' },
    locationName() { return (this.record && this.record.location) || '鼎丰前城小区' },
    distance() { return (this.record && this.record.distance) || '7.2km' },
    locationCopy() { return (this.record && this.record.locationCopy) || '请携带精灵包前往抓捕，抓捕过程中请不要直接接触，若抓捕成功，请在条件允许的情况下为小精灵进行一次基础体检和绝育。' },
    contactName() { return (this.record && this.record.ownerNick) || '芝' },
    contactAvatar() { return (this.record && this.record.ownerAvatar) || this.assets.contact },
    contactCopy() { return (this.record && this.record.ownerMessage) || '如果领养的话可以联系我，我带你指路，最好带上笼子和网兜，小猫害怕陌生人靠近会跑远。' },
    contactPhone() {
      return (this.record && (this.record.ownerPhone || this.record.ownerMobile || this.record.contactPhone)) || '19078676542'
    },
    rejectNote() { return (this.record && this.record.rejectNote) || '当前申请暂未通过，请关注其他小院。' },
    locationAddress() {
      const value = this.record && this.record.locationAddress
      return value || (this.record && this.record.address) || this.locationName
    },
    navigationLocation() {
      const record = this.record || {}
      const location = record.location && typeof record.location === 'object' ? record.location : {}
      const latitude = Number(record.latitude ?? record.locationLatitude ?? location.latitude)
      const longitude = Number(record.longitude ?? record.locationLongitude ?? location.longitude)
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
      return { latitude, longitude }
    }
  },
  methods: {
    loadRecord() {
      const options = pageOptions()
      const id = queryValue(this.recordId || options.id || options.recordId || getLastAdoptionId() || 'demo-pending')
      this.resolvedRecordId = id
      const result = getApplication('adoption', id)
      this.record = result.success ? result.data : (getDemoAdoptions().find(item => item.id === id) || null)
    },
    flowUrl(frame) {
      return '/pages/meMore/adoptionFlow?frame=' + encodeURIComponent(frame) + '&id=' + encodeURIComponent(this.resolvedRecordId)
    },
    openFrame(frame) { uni.navigateTo({ url: this.flowUrl(frame) }) },
    openApplyContent() {
      this.openFrame(49)
    },
    openPetDetail(pet, index) {
      const petId = pet && (pet.id || pet.petId || pet.yardPetId) ? String(pet.id || pet.petId || pet.yardPetId) : ''
      const params = [
        'state=35',
        'managed=0',
        `idx=${encodeURIComponent(index)}`,
        petId && `petId=${encodeURIComponent(petId)}`,
        `yardId=${encodeURIComponent((this.record && this.record.yardId) || '1')}`,
        `yardName=${encodeURIComponent(this.ownerName || '')}`
      ].filter(Boolean).join('&')
      uni.navigateTo({ url: '/pages/adoption/petDetail?' + params })
    },
    openYardDetail() {
      openYardDetail({
        yardId: (this.record && this.record.yardId) || '1',
        yardName: this.ownerName
      })
    },
    openLocation() {
      const location = this.navigationLocation
      if (!location || typeof uni.openLocation !== 'function') {
        uni.showModal({
          title: '暂无法导航',
          content: `${this.locationName}\n${this.locationAddress}\n当前地址还没有配置地图坐标，请补充后重试。`,
          showCancel: false
        })
        return
      }
      uni.openLocation({
        ...location,
        name: this.locationName,
        address: this.locationAddress,
        scale: 16,
        fail: () => uni.showToast({ title: '暂时无法打开地图', icon: 'none' })
      })
    },
    openContact() { this.showContact = true },
    openOwnerProfile() {
      openUserProfile({
        pawId: (this.record && (this.record.ownerPawId || this.record.ownerId)) || 'owner-1',
        nickname: this.contactName,
        avatar: this.contactAvatar
      })
    },
    copyContact() {
      uni.setClipboardData({
        data: this.contactPhone,
        success: () => uni.showToast({ title: '已复制', icon: 'none' })
      })
    },
    openRewardSheet() {
      if (this.frameNumber !== 57) return
      this.showRewardSheet = true
    },
    onRewardAction() {
      if (this.rewardClaimed) {
        uni.showToast({ title: '待接入订单详情页', icon: 'none' })
        return
      }
      this.openRewardSheet()
    },
    onRewardSubmitted(payload = {}) {
      this.showRewardSheet = false
      const orderId = payload.order && payload.order.id ? `&orderId=${encodeURIComponent(payload.order.id)}` : ''
      uni.navigateTo({
        url: `/pages/adoption/result?variant=80&id=${encodeURIComponent(this.resolvedRecordId)}${orderId}`
      })
    },
    goBack() { goBackSmart({ fallbackUrl: '/pages/me/index' }) },
    onFooterAction(action) {
      const key = action && action.key
      if (key === 'abandon-adoption') {
        const result = advanceApplication('adoption', this.resolvedRecordId, 'abandoned', { abandonedAt: Date.now() })
        if (!result.success) {
          uni.showToast({ title: result.error.message, icon: 'none' })
          return
        }
        this.record = result.data
        return
      }
      if (key === 'open-evidence') {
        uni.navigateTo({ url: '/pages/meMore/adoptionConfirm?recordId=' + encodeURIComponent(this.resolvedRecordId) })
        return
      }
      if (key === 'start-reward') {
        const result = advanceApplication('adoption', this.resolvedRecordId, 'reward', { rewardStartedAt: Date.now() })
        if (!result.success) {
          uni.showToast({ title: result.error.message, icon: 'none' })
          return
        }
        this.record = result.data
        uni.navigateTo({ url: '/pages/adoption/submitOrder?recordId=' + encodeURIComponent(this.resolvedRecordId) })
        return
      }
    }
  }
}
</script>

<style scoped>
.af-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  background: #f5f5f5;
  color: #333;
  font-family: var(--paw-font-family, -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif);
}

.af-page.af-gradient {
  background: linear-gradient(to bottom, #fffcdc 0%, #fff 13.225%, #f5f5f5 21.49%, #f5f5f5 100%);
}

.af-scroll {
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
}

.af-content {
  padding: 0 15px 24px;
  box-sizing: border-box;
}

.af-has-footer .af-content {
  padding-bottom: calc(100px + env(safe-area-inset-bottom));
}

.af-heading {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 71px;
  padding: 26px 3px 16px;
  box-sizing: border-box;
}

.af-heading text {
  color: #111;
  font-size: 20px;
  font-weight: 700;
  line-height: 29px;
}

.af-heading-status-image,
.af-heading .uni-icons {
  margin-top: 5px;
  flex-shrink: 0;
}

.af-card {
  margin-bottom: 10px;
  padding: 15px;
  box-sizing: border-box;
  border-radius: 6px;
  background: #fff;
}

.af-apply-card {
  padding: 9px 10px;
}

.af-apply-card.with-user {
  min-height: 329px;
  padding-top: 11px;
}

.af-user-line,
.af-contact-head,
.af-location-label {
  display: flex;
  align-items: center;
}

.af-user-line {
  min-height: 34px;
  margin: 0 8px 9px;
  gap: 6px;
}

.af-user-avatar,
.af-contact-avatar {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 50%;
}

.af-user-line text,
.af-contact-head>text {
  font-size: 14px;
}

.af-role-tag {
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 10px;
  line-height: 15px;
}

.af-role-tag {
  background: #ff9d4d;
  color: #fff;
}

.af-apply-copy {
  display: block;
  margin: 0 7px;
  overflow: hidden;
  font-size: 15px;
  line-height: 15.5px;
}

.af-apply-photos {
  display: flex;
  gap: 2px;
  margin: 39px 0 0;
}

.with-user .af-apply-photos {
  margin-left: 8px;
}

.af-apply-photo {
  width: 106px;
  height: 106px;
  border-radius: 4px;
}

.af-proof-card {
  min-height: 250px;
  padding: 19px 18px 10px;
}

.af-proof-photos {
  display: flex;
  justify-content: center;
  gap: 45px;
}

.af-proof-item {
  width: 106px;
  text-align: center;
}

.af-proof-photo {
  display: block;
  width: 106px;
  height: 106px;
  border-radius: 3px;
}

.af-proof-date,
.af-proof-label {
  display: block;
  font-size: 12px;
  line-height: 16px;
}

.af-proof-label {
  color: #999;
}

.af-proof-copy {
  display: block;
  margin-top: 8px;
  overflow: hidden;
  font-size: 14px;
  line-height: 20px;
}

.af-location-card {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 50px;
  padding: 0 14px;
  font-size: 14px;
}

.af-location-label {
  gap: 3px;
  flex-shrink: 0;
}

.af-location-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.af-distance {
  color: #777;
}

.af-location-action {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-left: auto;
  flex-shrink: 0;
}

.af-location-chevron {
  flex-shrink: 0;
}

.af-location-copy {
  min-height: 151px;
  padding: 8px 10px;
}

.af-location-copy text {
  display: block;
  overflow: hidden;
  color: #8b8b8b;
  font-size: 15px;
  line-height: normal;
}

.af-contact-card {
  min-height: 199px;
  padding: 9px 10px;
}

.af-contact-head {
  min-height: 34px;
  gap: 6px;
}

.af-contact-owner {
  margin-left: 0;
}

.af-contact-link {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  color: #888;
  font-size: 13px;
}

.af-contact-copy {
  display: block;
  margin-top: 10px;
  overflow: hidden;
  font-size: 16px;
  font-weight: 500;
  line-height: normal;
}

.af-contact-dialog {
  padding: 20px 20px;
  box-sizing: border-box;
}

.af-contact-dialog__input {
  display: block;
  width: 100%;
  height: 72px;
  padding: 0 12px;
  box-sizing: border-box;
  border-radius: 10px;
  background: #f5f5f5;
  color: #111;
  font-size: 24px;
  font-weight: 700;
  line-height: 72px;
  text-align: center;
  opacity: 1;
}

.af-link-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 50px;
  padding: 0 17px;
  font-size: 16px;
}

.af-link-row>view {
  display: flex;
  align-items: center;
  gap: 3px;
  color: #999;
}

.af-progress-card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 72px;
  margin-bottom: 10px;
  box-sizing: border-box;
  border-radius: 10px;
  background: #fff;
}

.af-progress-stage {
  display: flex;
  min-width: 0;
  flex: 0 0 41px;
  flex-direction: column;
  margin: 16px 51px 0 35px;
}

.af-progress-track {
  position: relative;
  top: auto;
  right: auto;
  left: auto;
  width: 100%;
  height: 22px;
  flex: 0 0 22px;
}

.af-progress-line,
.af-progress-line__active {
  position: absolute;
  top: 4.93px;
  right: 0;
  left: 0;
  height: 15px;
}

.af-progress-line::before,
.af-progress-line__active {
  top: 3.5px;
  height: 8px;
  border-radius: 4px;
}

.af-progress-line::before {
  position: absolute;
  right: 0;
  left: 5px;
  background: #ececec;
  content: '';
}

.af-progress-line__active {
  top: 8.43px;
  left: 0;
  right: auto;
  width: 17px;
  background: #ffe60f;
}

.af-progress-track.is-step-2 .af-progress-line__active {
  width: calc(28.185% + 7.5px);
}

.af-progress-track.is-step-4 .af-progress-line__active {
  width: 100%;
}

.af-progress-node {
  position: absolute;
  top: 4.93px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
}

.af-progress-node__circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #ececec;
}

.af-progress-node.active .af-progress-node__circle {
  background: #ffe60f;
}

.af-progress-node:not(.active) .paw-icon {
  opacity: .5;
}

.af-progress-medal {
  position: absolute;
  top: 0;
  right: -11.2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.af-progress-medal.muted {
  filter: grayscale(1);
  opacity: .62;
}

.af-progress-percent {
  position: absolute;
  top: 20px;
  right: 8px;
  left: auto;
  color: #666;
  font-size: 10px;
  line-height: 14px;
}

.af-progress-labels {
  position: relative;
  top: auto;
  right: auto;
  left: auto;
  width: 100%;
  height: 17px;
  flex: 0 0 17px;
  margin-top: 2px;
}

.af-progress-label {
  position: absolute;
  color: #666;
  font-size: 11px;
  line-height: 15px;
  white-space: nowrap;
}

.af-progress-label--success {
  left: 7.5px;
  transform: translateX(-50%);
}

.af-progress-label--owner {
  left: calc(28.185% + 7.5px);
  transform: translateX(-50%);
}

.af-progress-label--review {
  display: flex;
  align-items: center;
  gap: 2px;
  left: 57.3%;
  color: #fd6302;
}

.af-progress-label--reward {
  right: auto;
  left: 100%;
  transform: translateX(-50%);
  padding: 1px 6px;
  border-radius: 8px;
  background: #ececec;
  color: #333;
  line-height: 15px;
}

.af-progress-label--reward.active {
  background: #ffe60f;
}

.af-progress-label--reward {
  cursor: pointer;
}

.af-footer {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 300;
  display: flex;
  gap: 15px;
  min-height: 88px;
  padding: 7px 14px calc(7px + env(safe-area-inset-bottom));
  box-sizing: border-box;
  background: rgba(255, 255, 255, .96);
  border-top: .5px solid rgba(0, 0, 0, .05);
}

.af-footer--dual {
  align-items: flex-start;
  justify-content: flex-end;
}

.af-btn {
  flex: 1;
  height: 40px;
  margin: 0;
  padding: 0;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 400;
  line-height: 40px;
}

.af-btn::after {
  border: 0;
}

.af-btn-ghost {
  border: 1px solid #eee;
  background: #fff;
  color: #555;
}

.af-btn-yellow {
  border: 1px solid #ffe600;
  background: #ffe600;
  color: #111;
}

/* Figma node 62:31825: the adoption-information view starts directly below
 * the fixed navigation and contains only location, reminder, and owner-note
 * cards on the flat gray canvas. */
.af-frame-48 .af-content {
  padding-top: 5px;
}

.af-frame-48 .af-card {
  border-radius: 9px;
}

.af-frame-48 .af-location-card {
  min-height: 44px;
  padding-right: 8px;
  padding-left: 8px;
  gap: 5px;
}

.af-frame-48 .af-location-copy {
  min-height: 160px;
  padding: 11px 10px;
  box-shadow: 0 -1px 4px rgba(0, 0, 0, .05);
}

.af-frame-48 .af-contact-card {
  min-height: 199px;
  padding: 9px 10px;
  box-shadow: 0 -1px 4px rgba(0, 0, 0, .05);
}

/* The owner-approved state follows Figma node 62:32023. Stable card and
 * typography dimensions stay in px; the page keeps its flex-based content
 * flow and shared fixed action bar spacing. */
.af-frame-54 .af-card {
  margin-bottom: 10px;
  border-radius: 9px;
}

.af-frame-54 .af-location-card {
  min-height: 44px;
  padding-right: 8px;
  padding-left: 8px;
  gap: 5px;
}

.af-frame-54 .af-location-action {
  gap: 3px;
}

.af-frame-54 .af-location-copy {
  min-height: 160px;
  padding: 11px 10px;
}

.af-frame-54 .af-contact-card {
  min-height: 199px;
  padding: 9px 10px;
}

.af-frame-54 .af-link-row {
  min-height: 50px;
}
</style>
