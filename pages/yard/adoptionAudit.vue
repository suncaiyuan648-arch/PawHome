<template>
  <PawAdoptionProofForm v-if="mode === 'proof'" :record-id="isRescue ? '' : recordId" :source="sourceType"
    :source-type="sourceType" :rescue-id="rescueId" @submitted="onProofSubmitted" />
  <view v-else class="audit-page">
    <PawPageNav title="领养申请" fallback-url="/pages/me/index" :auto-back="false" @back="goBack" />
    <scroll-view class="audit-scroll" scroll-y :show-scrollbar="false">
      <view v-if="record" class="audit-content">
        <view class="status-row"><text class="status-title">{{ titleByMode }}</text></view>
        <view v-if="record.applyText" class="card"><text class="apply-body">{{ record.applyText }}</text></view>
        <view class="card">
          <text class="card-title">{{ catSectionTitle }}</text>
          <view class="pet-row">
            <view v-for="(pet, index) in displayPets" :key="pet.id || index" class="pet-cell">
              <image class="pet-avatar" :src="petAvatarSrc(pet)" mode="aspectFill" />
              <text class="pet-name">{{ pet.name }}</text>
            </view>
          </view>
          <view class="yard-row">
            <image class="yard-avatar" :src="record.ownerAvatar" mode="aspectFill" @tap="openAuditOwner" />
            <text class="yard-name" @tap="openAuditOwner">{{ record.ownerName }}</text>
            <YardTagPill :label="record.yardTag" @click="openAuditYard" />
          </view>
        </view>
        <view class="card link-card" @tap="openAdoptInfo">
          <text>领养信息</text>
          <view class="link-value"><text>查看</text><uni-icons type="right" :size="14" color="#999" /></view>
        </view>
        <view class="card link-card" @tap="openApplyContent">
          <text>申请内容</text>
          <view class="link-value"><text>查看</text><uni-icons type="right" :size="14" color="#999" /></view>
        </view>
      </view>
      <view v-else class="empty-state"><text>领养记录不存在</text></view>
    </scroll-view>

    <view v-if="mode === 'ownerPending'" class="audit-bar" data-qa="qa-adoption-audit-actions">
      <PawButton text="查看领养进度" block qa="qa-adoption-audit-owner-progress" @click="openAdoptionProgress" />
    </view>
    <view v-else-if="mode === 'ownerReview'" class="audit-bar audit-bar--dual">
      <PawButton text="拒绝" tone="ghost" block qa="qa-adoption-audit-reject" @click="showReject = true" />
      <PawButton text="同意" block qa="qa-adoption-audit-agree" @click="showAgree = true" />
    </view>
    <view v-else-if="mode === 'ownerConfirm'" class="audit-bar audit-bar--dual">
      <PawButton text="驳回" tone="ghost" block qa="qa-adoption-audit-reject" @click="showReject = true" />
      <PawButton text="确认已领养" block qa="qa-adoption-audit-confirm" @click="showAgree = true" />
    </view>
    <view v-else-if="['agreeDone', 'confirmAgree', 'confirmReject', 'rejectDone'].includes(mode)" class="audit-bar">
      <PawButton :text="resultBtnText" block qa="qa-adoption-audit-next" @click="nextFromResult" />
    </view>

    <PawDialog v-model="showAgree" title="确定同意领养吗" :message="agreeDescription" :show-cancel="true" cancel-text="返回"
      confirm-text="确认" @confirm="onAgree" />
    <PawDialog v-model="showReject" title="驳回" :show-cancel="true" cancel-text="返回" confirm-text="确认"
      :auto-close="false" @confirm="onReject" @cancel="rejectReason = ''">
      <textarea v-model="rejectReason" class="reject-reason" maxlength="120" placeholder="简短说明驳回的原因" />
    </PawDialog>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawButton from '@/components/base/PawButton.vue'
import PawDialog from '@/components/overlay/PawDialog.vue'
import YardTagPill from '@/components/YardTagPill.vue'
import PawAdoptionProofForm from '@/components/PawAdoptionProofForm.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { openUserProfile, openYardDetail } from '@/utils/profileNav.js'
import { adoptionPetAvatarSrc } from '@/utils/adoptionPetDisplay.js'
import { getAdoptionById, getAdoptionRecords, transitionAdoption } from '@/utils/adoptionStorage.js'

function decodeValue(value) {
  if (value === undefined || value === null) return ''
  try { return decodeURIComponent(String(value)) } catch (e) { return String(value) }
}

export default {
  components: { PawPageNav, PawButton, PawDialog, YardTagPill, PawAdoptionProofForm },
  data() {
    return {
      mode: 'ownerReview',
      recordId: 'demo-pending',
      sourceType: 'adoption',
      rescueId: '',
      record: null,
      showAgree: false,
      showReject: false,
      rejectReason: ''
    }
  },
  computed: {
    agreeDescription() {
      if (this.mode === 'ownerConfirm') return '确认后申请将进入评审团确认，请确认申请人已经完成线下领养。'
      return '同意后申请人可以查看小院位置和院主联系方式，请确认申请信息真实有效。'
    },
    titleByMode() {
      return {
        ownerReview: '等待院主审核中……', ownerPending: '院主已同意，待申请人前往领养',
        ownerConfirm: '申请人已领养，待院主确认', agreeDone: '已同意领养申请',
        confirmAgree: '已确认领养', confirmReject: '已驳回', rejectDone: '已驳回', success: '领养成功'
      }[this.mode] || '领养申请'
    },
    resultBtnText() { return this.mode === 'agreeDone' ? '好的' : this.mode === 'confirmAgree' ? '进入评审' : '查看详情' },
    isRescue() { return this.sourceType === 'rescue' },
    displayPets() {
      const pets = this.record && Array.isArray(this.record.pets) ? this.record.pets : []
      return pets.length ? pets : [{ name: '奥利奥', avatar: '/static/figma/adoption-flow/pet-orange.png' }]
    },
    catSectionTitle() {
      return `${this.mode === 'success' ? '领走的猫咪' : '申请领养的猫咪'}（${this.displayPets.length}）`
    }
  },
  onLoad(options = {}) {
    this.mode = String(options.mode || 'ownerReview')
    const source = decodeValue(options.source || options.sourceType)
    this.sourceType = source === 'rescue' ? 'rescue' : 'adoption'
    this.rescueId = this.sourceType === 'rescue'
      ? decodeValue(options.rescueId || options.id || options.recordId)
      : ''
    this.recordId = this.sourceType === 'rescue'
      ? ''
      : (decodeValue(options.id || options.recordId) || 'demo-pending')
    if (this.sourceType === 'rescue' && this.mode !== 'proof') {
      uni.showToast({ title: '该救助页面仅支持公开证实', icon: 'none' })
      uni.redirectTo({ url: `/pages/feature/index?mode=rescue-detail&id=${encodeURIComponent(this.rescueId)}` })
      return
    }
    this.loadRecord()
    this.showAgree = options.popup === 'agree'
    this.showReject = options.popup === 'reject'
  },
  onShow() { if (this.mode !== 'proof') this.loadRecord() },
  methods: {
    petAvatarSrc: adoptionPetAvatarSrc,
    loadRecord() {
      this.record = getAdoptionById(this.recordId) || (!this.recordId ? getAdoptionRecords()[0] : null)
      if (this.record && !this.recordId) this.recordId = this.record.id
    },
    goBack() { goBackSmart({ fallbackUrl: '/pages/me/index' }) },
    openAuditOwner() {
      if (!this.record) return
      openUserProfile({ pawId: this.record.ownerPawId || `audit-owner-${this.recordId}`, nickname: this.record.ownerName, avatar: this.record.ownerAvatar })
    },
    openAuditYard() {
      if (!this.record) return
      openYardDetail({ yardId: this.record.yardId || '1', yardName: this.record.yardName || this.record.ownerName })
    },
    openAdoptInfo() { uni.navigateTo({ url: `/pages/meMore/adoptionFlow?frame=48&id=${encodeURIComponent(this.recordId)}` }) },
    openApplyContent() { uni.navigateTo({ url: `/pages/meMore/adoptionApplyContent?id=${encodeURIComponent(this.recordId)}` }) },
    goMode(nextMode) { uni.redirectTo({ url: `/pages/yard/adoptionAudit?mode=${nextMode}&id=${encodeURIComponent(this.recordId)}` }) },
    onAgree() {
      const nextStatus = this.mode === 'ownerConfirm' ? 'jury_confirm' : 'pickup'
      const updated = transitionAdoption(this.recordId, nextStatus, { approvedAt: Date.now(), approvedBy: 'owner' })
      if (!updated) { uni.showToast({ title: '当前状态不能执行此操作', icon: 'none' }); return }
      this.showAgree = false
      this.goMode(this.mode === 'ownerConfirm' ? 'confirmAgree' : 'agreeDone')
    },
    onReject() {
      const reason = String(this.rejectReason || '').trim()
      if (!reason) { uni.showToast({ title: '请填写驳回原因', icon: 'none' }); return }
      const updated = transitionAdoption(this.recordId, 'rejected', { rejectNote: reason, rejectedAt: Date.now() })
      if (!updated) { uni.showToast({ title: '当前状态不能驳回', icon: 'none' }); return }
      this.showReject = false
      this.rejectReason = ''
      this.goMode('rejectDone')
    },
    nextFromResult() {
      if (this.mode === 'agreeDone') return this.openAdoptionProgress()
      if (this.mode === 'confirmAgree') return uni.navigateTo({ url: `/pages/meMore/adoptionFlow?frame=56&id=${encodeURIComponent(this.recordId)}` })
      if (this.mode === 'confirmReject') return this.goBack()
      return this.goBack()
    },
    openAdoptionProgress() {
      uni.redirectTo({ url: `/pages/meMore/adoptionFlow?frame=50&id=${encodeURIComponent(this.recordId)}` })
    },
    onProofSubmitted() {
      if (this.isRescue && this.rescueId) {
        uni.redirectTo({ url: `/pages/feature/index?mode=rescue-detail&id=${encodeURIComponent(this.rescueId)}` })
        return
      }
      this.goBack()
    }
  }
}
</script>

<style scoped>
.audit-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  color: #333
}

.audit-scroll {
  flex: 1;
  min-height: 0
}

.audit-content {
  padding: 8px 15px 24px;
  box-sizing: border-box
}

.status-row {
  padding: 8px 3px 18px
}

.status-title {
  font-size: 20px;
  font-weight: 700;
  color: #111
}

.card {
  margin-bottom: 10px;
  padding: 16px;
  border-radius: 10px;
  background: #fff;
  box-sizing: border-box
}

.apply-body {
  display: block;
  font-size: 15px;
  line-height: 1.6;
  color: #333
}

.card-title {
  display: block;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 500;
  color: #222
}

.pet-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18px 15px;
  align-items: flex-start
}

.pet-cell {
  display: flex;
  width: 49px;
  flex-direction: column;
  align-items: center
}

.pet-avatar {
  display: block;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #eee
}

.pet-name {
  display: block;
  width: 100%;
  margin-top: 4px;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px
}

.yard-row {
  display: flex;
  align-items: center;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #f0f0f0
}

.yard-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #eee
}

.yard-name {
  flex: 1;
  min-width: 0;
  margin-left: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px
}

.link-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 50px;
  font-size: 16px
}

.link-value {
  display: flex;
  align-items: center;
  gap: 3px;
  color: #999;
  font-size: 14px
}

.audit-bar {
  display: flex;
  flex-shrink: 0;
  padding: 8px 15px calc(8px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #eee
}

.audit-bar--dual {
  gap: 12px
}

.audit-bar .paw-button {
  flex: 1
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  color: #999
}

.reject-reason {
  display: block;
  width: 100%;
  height: 110px;
  margin: 10px 0;
  padding: 12px;
  box-sizing: border-box;
  border: 0;
  border-radius: 8px;
  background: #f5f5f5;
  font-size: 14px
}
</style>
