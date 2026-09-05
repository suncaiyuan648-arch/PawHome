<template>
  <view class="af-page"
    :class="['af-frame-' + frameNumber, { 'af-yellow': yellowTop, 'af-gradient': gradientTop, 'af-has-footer': hasFooter }]">
    <PawPageNav :title="navTitle" :title-centered="true" :background="navBackground" fallback-url="/pages/me/index" />

    <scroll-view class="af-scroll" scroll-y :show-scrollbar="false">
      <view class="af-content">
        <view class="af-heading">
          <PawIcon v-if="statusIconName" class="af-heading-status-image" :name="statusIconName"
            :size="statusIconSize" />
          <text>{{ statusText }}</text>
        </view>

        <view v-if="progressMode" class="af-progress-card">
          <view class="af-progress-track">
            <view v-for="step in 4" :key="step" class="af-progress-segment" :class="{ active: step <= progressStep }">
              <view class="af-progress-dot">
                <uni-icons v-if="step === 4 && frameNumber === 57" type="medal-filled" color="#ff9800" :size="20" />
                <uni-icons v-else-if="step <= progressStep" type="checkmarkempty" color="#333" :size="9" />
              </view>
            </view>
            <text class="af-progress-percent">{{ progressPercent }}</text>
          </view>
          <view class="af-progress-labels">
            <text v-for="item in progressLabels" :key="item.key"
              :class="{ active: item.active, reward: item.key === 'reward' && frameNumber === 57 }">{{ item.label
              }}</text>
          </view>
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
                :radius="3" :preview="false" />
              <text class="af-proof-date">2026.01.03</text>
              <text class="af-proof-label">{{ item.label }}</text>
            </view>
          </view>
          <text class="af-proof-copy">{{ proofCopy }}</text>
        </view>

        <PawAdoptionPetsCard v-if="showPets" :title="petTitle" :pets="displayPets" :yard-name="ownerName"
          :yard-avatar="ownerAvatar" :yard-tag="yardTag" :show-add="false" :show-owner="showOwner"
          :pet-clickable="false" :yard-clickable="false" :min-height="showOwner ? 231 : 160" :margin-bottom="10"
          qa-prefix="qa-adoption-flow-pet-" />

        <template v-if="showAdoptionInfo">
          <view class="af-card af-location-card">
            <view class="af-location-label"><uni-icons type="location" color="#777" :size="13" /><text>小院位置</text>
            </view>
            <text class="af-location-name">{{ locationName }}</text>
            <text class="af-distance">{{ distance }}</text>
          </view>
          <view class="af-card af-location-copy"><text>{{ locationCopy }}</text></view>
          <view class="af-card af-contact-card" @tap="openContact">
            <view class="af-contact-head">
              <PawImage class="af-contact-avatar" :src="contactAvatar" :size="34" :radius="17" :preview="false" />
              <text>{{ contactName }}</text>
              <PawOwnerBadge class="af-contact-owner" />
              <view class="af-contact-link"><text>联系方式</text><uni-icons type="right" color="#aaa" :size="13" /></view>
            </view>
            <text class="af-contact-copy">{{ contactCopy }}</text>
          </view>
        </template>

        <view v-if="showRejectReason" class="af-card af-link-row" @tap="openRejectReason">
          <text>拒绝说明</text>
          <view><text>查看</text><uni-icons type="right" color="#bbb" :size="14" /></view>
        </view>
        <view v-if="showInfoLink" class="af-card af-link-row" @tap="openFrame(48)">
          <text>领养信息</text>
          <view><text>查看</text><uni-icons type="right" color="#bbb" :size="14" /></view>
        </view>
        <view v-if="showApplyLink" class="af-card af-link-row" @tap="openFrame(49)">
          <text>申请内容</text>
          <view><text>查看</text><uni-icons type="right" color="#bbb" :size="14" /></view>
        </view>
      </view>
    </scroll-view>

    <view v-if="footerMode === 'audit'" class="af-footer af-footer--dual">
      <button class="af-btn af-btn-ghost" data-qa="qa-adoption-flow-reject"
        @tap="onFooterAction({ key: 'audit-reject' })">拒绝</button>
      <button class="af-btn af-btn-yellow" data-qa="qa-adoption-flow-agree"
        @tap="onFooterAction({ key: 'audit-agree' })">同意</button>
    </view>
    <view v-else-if="footerMode === 'confirm'" class="af-footer af-footer--dual">
      <button class="af-btn af-btn-ghost" data-qa="qa-adoption-flow-abandon"
        @tap="onFooterAction({ key: 'confirm-reject' })">驳回</button>
      <button class="af-btn af-btn-yellow" data-qa="qa-adoption-flow-confirm"
        @tap="onFooterAction({ key: 'applicant-confirm' })">确认已领养</button>
    </view>
    <view v-else-if="footerMode === 'pickup'" class="af-footer af-footer--dual">
      <button class="af-btn af-btn-ghost" data-qa="qa-adoption-flow-give-up"
        @tap="onFooterAction({ key: 'give-up' })">放弃领养</button>
      <button class="af-btn af-btn-yellow" data-qa="qa-adoption-flow-pickup"
        @tap="onFooterAction({ key: 'applicant-confirm' })">确认领养抽猫粮</button>
    </view>
    <PawFixedActionBar v-else-if="footerMode === 'single'" :primary-action="singlePrimaryAction"
      @primary="onFooterAction" />

    <PawDialog v-model="showRejectReasonDialog" title="拒绝说明" :message="rejectNote" confirm-text="我知道了"
      :close-on-mask="true" />
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawFixedActionBar from '@/components/layout/PawFixedActionBar.vue'
import PawDialog from '@/components/overlay/PawDialog.vue'
import PawOwnerBadge from '@/components/identity/PawOwnerBadge.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawAdoptionPetsCard from '@/components/PawAdoptionPetsCard.vue'
import PawImage from '@/components/base/PawImage.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { adoptionPetAvatarSrc } from '@/utils/adoptionPetDisplay.js'
import {
  addAdoption,
  getAdoptionById,
  getDemoAdoptions,
  getLastAdoptionId,
  transitionAdoption,
  updateAdoption
} from '@/utils/adoptionStorage.js'

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
  components: { PawPageNav, PawFixedActionBar, PawDialog, PawOwnerBadge, PawIcon, PawAdoptionPetsCard, PawImage },
  props: {
    frame: { type: [Number, String], default: '' },
    recordId: { type: String, default: '' }
  },
  data() {
    return {
      record: null,
      resolvedRecordId: '',
      showRejectReasonDialog: false,
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
    recordId: { immediate: true, handler() { this.loadRecord() } }
  },
  computed: {
    frameNumber() {
      const explicitFrame = Number(this.frame)
      if (explicitFrame >= 44 && explicitFrame <= 57) return explicitFrame
      const framesByStatus = {
        pending: 44,
        rejected: 45,
        pickup: 50,
        owner_confirm: 55,
        jury_confirm: 56,
        reward: 57,
        reward_done: 57,
        abandoned: 53
      }
      return framesByStatus[this.record && this.record.status] || 44
    },
    navTitle() {
      if (this.frameNumber === 48) return '领养信息'
      if (this.frameNumber === 49) return '申请内容'
      return '领养申请'
    },
    navBackground() { return 'transparent' },
    statusText() {
      return ({
        44: '等待院主审核中......', 45: '已拒绝领养申请', 46: '等待院主审核中......',
        47: '等待云家长审核中......', 50: '院主已同意，待申请人前往领养',
        51: '申请人已领养，待院主确认', 52: '已驳回', 53: '领养成功',
        54: '院主已同意，待申请人前往领养', 55: '申请人已领养，待院主确认',
        56: '院主已确认，待评审团确认', 57: '恭喜您！获得领养礼物！'
      })[this.frameNumber] || '领养申请'
    },
    statusIconName() {
      if ([44, 46, 47, 50, 54].includes(this.frameNumber)) return 'navigation/clock-disabled'
      if ([45, 52].includes(this.frameNumber)) return 'navigation/clear'
      return 'status/check'
    },
    statusIconSize() { return [44, 46, 47, 50, 54].includes(this.frameNumber) ? 17 : 19 },
    yellowTop() { return [46, 47, 50, 51, 52, 53].includes(this.frameNumber) },
    gradientTop() { return [44, 45, 54, 55, 56, 57].includes(this.frameNumber) },
    progressMode() { return this.frameNumber >= 55 && this.frameNumber <= 57 },
    progressStep() { return this.frameNumber === 55 ? 1 : this.frameNumber === 56 ? 2 : 4 },
    progressPercent() {
      if (this.frameNumber === 57) return '100%'
      if (this.frameNumber === 56) return '50%'
      if (this.frameNumber === 55) return '25%'
      return '0%'
    },
    progressLabels() {
      return [
        { key: 'success', label: '领养成功', active: this.progressStep >= 1 },
        { key: 'owner', label: '院主确认', active: this.progressStep >= 2 },
        { key: 'review', label: this.frameNumber === 56 ? '评审中' : '', active: false },
        { key: 'reward', label: '抽取奖励', active: this.progressStep >= 4 }
      ]
    },
    showApplicant() { return [46, 47, 49].includes(this.frameNumber) },
    showApplyCard() { return [44, 45, 46, 47, 49].includes(this.frameNumber) },
    showProofCard() { return [51, 52, 53, 55, 56, 57].includes(this.frameNumber) },
    showPets() { return [44, 45, 46, 47, 49, 50, 52, 53, 54, 55, 56, 57].includes(this.frameNumber) },
    showOwner() { return this.showPets && this.frameNumber !== 53 },
    showAdoptionInfo() { return [48, 50, 54].includes(this.frameNumber) },
    showRejectReason() { return this.frameNumber === 45 },
    showInfoLink() { return [51, 52, 53, 55, 56, 57].includes(this.frameNumber) },
    showApplyLink() { return [50, 51, 52, 53, 54, 55, 56, 57].includes(this.frameNumber) },
    petTitle() { return this.frameNumber === 53 ? '领走的猫咪' : '申请领养的猫咪' },
    footerMode() {
      if ([46, 47].includes(this.frameNumber)) return 'audit'
      if (this.frameNumber === 51) return 'confirm'
      if (this.frameNumber === 54) return 'pickup'
      if ([50, 52, 53, 55, 56, 57].includes(this.frameNumber)) return 'single'
      return ''
    },
    hasFooter() { return !!this.footerMode },
    singlePrimaryAction() {
      const actions = {
        50: { key: 'view-detail', label: '查看详情', qa: 'qa-adoption-flow-view-detail' },
        52: { key: 'view-detail', label: '查看详情', qa: 'qa-adoption-flow-view-detail' },
        53: { key: 'view-detail', label: '查看详情', qa: 'qa-adoption-flow-view-detail' },
        55: { key: 'owner-confirm', label: '进入院主确认', qa: 'qa-adoption-flow-owner-confirm' },
        56: { key: 'jury-approve', label: '评审通过', qa: 'qa-adoption-flow-jury-approve' },
        57: { key: 'claim-reward', label: '领取奖励', qa: 'qa-adoption-flow-claim-reward' }
      }
      return actions[this.frameNumber] || null
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
    rejectNote() { return (this.record && this.record.rejectNote) || '当前申请暂未通过，请关注其他小院。' }
  },
  methods: {
    loadRecord() {
      const options = pageOptions()
      const id = queryValue(this.recordId || options.id || options.recordId || getLastAdoptionId() || 'demo-pending')
      this.resolvedRecordId = id
      let record = getAdoptionById(id)
      if (!record) record = getDemoAdoptions().find(item => item.id === id) || null
      this.record = record
    },
    ensureSavedRecord() {
      const id = this.resolvedRecordId
      if (!id) return false
      if (!getAdoptionById(id)) {
        const demo = getDemoAdoptions().find(item => item.id === id)
        if (demo) addAdoption({ ...demo, pets: Array.isArray(demo.pets) ? demo.pets.map(p => ({ ...p })) : [] })
      }
      return !!getAdoptionById(id)
    },
    updateRecord(patch) {
      if (!this.ensureSavedRecord()) {
        uni.showToast({ title: '领养记录不存在', icon: 'none' })
        return false
      }
      const nextStatus = patch && patch.status
      const updated = nextStatus
        ? transitionAdoption(this.resolvedRecordId, nextStatus, { ...patch, status: undefined })
        : updateAdoption(this.resolvedRecordId, patch)
      if (updated) this.record = updated
      return updated
    },
    flowUrl(frame) {
      return '/pages/meMore/adoptionFlow?frame=' + encodeURIComponent(frame) + '&id=' + encodeURIComponent(this.resolvedRecordId)
    },
    openFrame(frame) { uni.navigateTo({ url: this.flowUrl(frame) }) },
    openContact() { uni.navigateTo({ url: '/pages/meMore/adoptionDetail?popup=contact&id=' + encodeURIComponent(this.resolvedRecordId) }) },
    openRejectReason() { this.showRejectReasonDialog = true },
    goBack() { goBackSmart({ fallbackUrl: '/pages/me/index' }) },
    onFooterAction(action) {
      const key = action && action.key
      if (key === 'audit-agree') {
        if (this.updateRecord({ status: 'pickup', approvedAt: Date.now(), approvedBy: 'owner' })) this.openFrame(50)
        return
      }
      if (key === 'audit-reject') {
        if (this.updateRecord({ status: 'rejected', rejectNote: this.rejectNote, rejectedAt: Date.now() })) this.openFrame(45)
        return
      }
      if (key === 'applicant-confirm') {
        if (this.updateRecord({ status: 'owner_confirm', applicantConfirmedAt: Date.now() })) this.openFrame(55)
        return
      }
      if (key === 'confirm-reject') {
        if (this.updateRecord({ status: 'rejected', rejectNote: this.rejectNote, rejectedAt: Date.now() })) this.openFrame(52)
        return
      }
      if (key === 'give-up') {
        if (this.updateRecord({ status: 'abandoned', abandonedAt: Date.now() })) this.openDetail()
        return
      }
      if (key === 'owner-confirm') {
        uni.navigateTo({ url: '/pages/yard/adoptionAudit?mode=ownerConfirm&id=' + encodeURIComponent(this.resolvedRecordId) })
        return
      }
      if (key === 'jury-approve') {
        if (this.updateRecord({ status: 'reward', juryConfirmedAt: Date.now() })) this.openFrame(57)
        return
      }
      if (key === 'claim-reward') {
        uni.navigateTo({ url: '/pages/adoption/submitOrder?recordId=' + encodeURIComponent(this.resolvedRecordId) })
        return
      }
      if (key === 'view-detail') this.openDetail()
    },
    openDetail() { uni.navigateTo({ url: '/pages/meMore/adoptionDetail?id=' + encodeURIComponent(this.resolvedRecordId) }) }
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

.af-page.af-yellow {
  background: linear-gradient(180deg, #fcf276 0, #fcf276 279px, #f5f5f5 279px, #f5f5f5 100%);
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
  align-items: flex-start;
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
  min-height: 285px;
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
  min-height: 110px;
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
  margin-left: auto;
  color: #777;
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
  line-height: 15px;
}

.af-contact-card {
  min-height: 201px;
  padding: 8px 10px;
}

.af-contact-head {
  min-height: 36px;
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
  margin-top: 11px;
  overflow: hidden;
  font-size: 16px;
  font-weight: 500;
  line-height: 16px;
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
  margin-bottom: 10px;
  padding: 25px 17px 8px;
  border-radius: 6px;
  background: #fff;
}

.af-progress-track {
  display: flex;
  align-items: center;
  height: 16px;
}

.af-progress-segment {
  display: flex;
  flex: 1;
  align-items: center;
  height: 16px;
  border-top: 8px solid #dedede;
}

.af-progress-segment.active {
  border-top-color: #ffea00;
}

.af-progress-segment:first-child {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.af-progress-segment:last-of-type {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

.af-progress-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: -1px;
  border-radius: 50%;
  background: #dedede;
}

.af-progress-segment.active .af-progress-dot {
  background: #ffea00;
}

.af-progress-percent {
  margin-left: 3px;
  color: #999;
  font-size: 10px;
}

.af-progress-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  color: #777;
  font-size: 11px;
}

.af-progress-labels text {
  flex: 1;
  white-space: nowrap;
}

.af-progress-labels text:nth-child(2),
.af-progress-labels text:nth-child(3) {
  text-align: center;
}

.af-progress-labels text:last-child {
  text-align: right;
}

.af-progress-labels text.reward {
  flex: 0 0 auto;
  padding: 2px 6px;
  border-radius: 3px;
  background: #7a4a13;
  color: #fff;
}

.af-progress-labels text.active {
  color: #ff6b00;
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

.af-frame-48,
.af-frame-49 {
  background: #f5f5f5;
}
</style>
