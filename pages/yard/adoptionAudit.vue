<template>
  <view v-if="mode === 'list'" class="audit-list-page" data-qa="qa-adoption-audit-list">
    <PawPageNav title="领养审核" background="#f5f5f5" fallback-url="/pages/me/index" :auto-back="false" @back="goBack" />
    <scroll-view class="audit-list-scroll" scroll-y :show-scrollbar="false" :bounces="false">
      <view class="audit-list-content">
        <view class="audit-tabs" data-qa="qa-adoption-audit-tabs">
          <view v-for="tab in reviewTabs" :key="tab.key" class="audit-tab"
            :class="{ 'audit-tab--active': reviewTab === tab.key }" :data-qa="`qa-adoption-audit-tab-${tab.key}`"
            @tap="switchReviewTab(tab.key)">
            <text>{{ tab.label }}</text>
            <text class="audit-tab__count">{{ tab.count }}</text>
          </view>
        </view>

        <view v-if="!reviewList.length" class="audit-list-empty" data-qa="qa-adoption-audit-empty">
          <text>{{ reviewTab === 'pending' ? '暂无待审核领养单' : '暂无已审核领养单' }}</text>
        </view>
        <PawAdoptionReviewCard v-for="item in reviewList" :key="`${item.recordId}-${item.reviewerRole}`" :review="item"
          :qa="`qa-adoption-audit-card-${item.recordId}-${item.reviewerRole}`" @tap="openReview(item)" />
      </view>
    </scroll-view>
  </view>
  <view v-else class="audit-page"
    :class="{ 'audit-page--with-actions': canAct, 'audit-page--owner-confirm': ['ownerConfirm', 'ownerConfirmed', 'ownerConfirmRejected'].includes(mode) }">
    <PawPageNav :title="reviewPageTitle" :background="reviewNavBackground" fallback-url="/pages/me/index"
      :auto-back="false" @back="goBack" />
    <scroll-view class="audit-scroll" scroll-y :show-scrollbar="false">
      <view v-if="record && ['info', 'application'].includes(mode)" class="audit-content">
        <view v-if="mode === 'info'" class="card">
          <text class="card-title">小院信息</text>
          <view class="manager-info-row"><text>小院名称</text><text>{{ record.yardName || record.ownerName }}</text></view>
          <view class="manager-info-row"><text>小院位置</text><text>{{ record.location || '暂未填写' }}</text></view>
          <view class="manager-info-row"><text>联系方式</text><text>{{ record.ownerNick || '暂未填写' }}</text></view>
          <text class="manager-info-copy">{{ record.ownerMessage || '院主暂未补充小院说明。' }}</text>
        </view>
        <view v-else class="card">
          <text class="card-title">申请内容</text>
          <text class="apply-body">{{ record.applyText || '申请人暂未填写申请内容。' }}</text>
          <view v-if="record.mediaPaths && record.mediaPaths.length" class="media-row">
            <image v-for="(src, index) in record.mediaPaths.slice(0, 2)" :key="src + index" class="media-image"
              :src="src" mode="aspectFill" />
          </view>
        </view>
      </view>
      <view v-else-if="record && ['ownerConfirm', 'ownerConfirmed', 'ownerConfirmRejected'].includes(mode)"
        class="audit-content audit-content--owner-confirm">
        <view class="owner-confirm-top">
          <view class="status-row">
            <PawIcon :name="statusIconName" :size="17" />
            <text class="status-title">{{ titleByMode }}</text>
          </view>
          <view class="owner-confirm-proof card">
            <view class="owner-confirm-proof__photos">
              <view v-for="(photo, index) in ownerConfirmProofPhotos" :key="photo + index"
                class="owner-confirm-proof__item">
                <PawImage class="owner-confirm-proof__photo" :src="photo" display-mode="fixed" :width="106"
                  :height="106" :radius="4" :preview="true" :preview-urls="ownerConfirmProofPhotos"
                  :preview-index="index" />
                <text class="owner-confirm-proof__date">{{ ownerConfirmProofDate }}</text>
                <text class="owner-confirm-proof__label">{{ index === 0 ? '来到逢猫' : '有家啦' }}</text>
              </view>
            </view>
            <text class="owner-confirm-proof__copy">{{ ownerConfirmProofCopy }}</text>
          </view>
        </view>
        <view class="card link-card" @tap="openAuditSubpage('info')">
          <text>领养信息</text>
          <view class="link-value"><text>查看</text>
            <PawIcon name="navigation/chevron-right" :size="14" />
          </view>
        </view>
        <view class="card link-card" @tap="openAuditSubpage('application')">
          <text>申请内容</text>
          <view class="link-value"><text>查看</text>
            <PawIcon name="navigation/chevron-right" :size="14" />
          </view>
        </view>
      </view>
      <view v-else-if="record" class="audit-content">
        <view class="status-row">
          <PawIcon :name="statusIconName" :size="17" />
          <text class="status-title">{{ titleByMode }}</text>
        </view>
        <view class="audit-application-card">
          <view class="audit-applicant-row">
            <PawImage class="audit-applicant-avatar" :src="applicantAvatar" :size="34" :radius="17" :preview="false" />
            <text class="audit-applicant-name">{{ applicantName }}</text>
            <view class="audit-applicant-tag"><text>申请人</text></view>
          </view>
          <text class="apply-body">{{ record.applyText || '申请人暂未填写申请内容。' }}</text>
          <view class="media-row">
            <PawImage v-for="(src, index) in applicationPhotos" :key="src + index" class="media-image" :src="src"
              display-mode="fixed" :width="106" :height="106" :radius="4" :preview="true"
              :preview-urls="applicationPhotos" :preview-index="index" />
          </view>
        </view>

        <PawAdoptionPetsCard :title="catSectionTitle" :pets="displayPets"
          :yard-name="record.yardName || record.ownerName" :yard-id="record.yardId" :yard-avatar="record.ownerAvatar"
          :yard-tag="record.yardTag || '小院'" :show-add="false" :show-owner="true" :pet-clickable="true"
          :yard-clickable="true" :min-height="231" :margin-bottom="0" qa-prefix="qa-adoption-audit-pet-"
          @pet-click="openPetDetail" @yard-click="openYardDetail" />
        <PawAdoptionRejectReason v-if="showRejectReason" :rejector="record.rejector" :note="record.rejectNote" />
      </view>
      <view v-else class="empty-state"><text>领养记录不存在</text></view>
    </scroll-view>

    <PawFixedActionBar v-if="canAct" :secondary-action="reviewRejectAction" :primary-action="reviewAgreeAction"
      @secondary="showReject = true" @primary="showAgree = true" />

    <PawDialog v-model="showAgree" variant="adoption-confirm" :title="agreeDialogTitle" :message="agreeDescription"
      :show-cancel="true" cancel-text="返回" confirm-text="确认" @confirm="onAgree" />
    <PawDialog v-if="mode === 'ownerConfirm'" v-model="showReject" variant="adoption-confirm" title="确认驳回已领养申请吗"
      message="驳回后领养信息申请人不再可见。" :show-cancel="true" cancel-text="返回" confirm-text="确认" @confirm="onReject" />
    <PawDialog v-else v-model="showReject" variant="adoption-reject" title="驳回" :show-cancel="true" cancel-text="返回"
      confirm-text="确认" :confirm-enabled="hasRejectReason" :auto-close="false" @confirm="onReject"
      @cancel="rejectReason = ''">
      <textarea v-model="rejectReason" class="reject-reason" maxlength="120" placeholder="简短说明驳回的原因"
        placeholder-style="color:#999;" />
    </PawDialog>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawFixedActionBar from '@/components/layout/PawFixedActionBar.vue'
import PawImage from '@/components/base/PawImage.vue'
import PawDialog from '@/components/overlay/PawDialog.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawAdoptionPetsCard from '@/components/PawAdoptionPetsCard.vue'
import PawAdoptionRejectReason from '@/components/adoption/PawAdoptionRejectReason.vue'
import PawAdoptionReviewCard from '@/components/adoption/PawAdoptionReviewCard.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { openYardDetail } from '@/utils/profileNav.js'
import { getAdoptionById, getAdoptionRecords } from '@/utils/adoptionStorage.js'
import { advanceApplication, getApplication } from '@/utils/applicationMockApi.js'
import { getAdoptionReviewList } from '@/utils/adoptionReviewMockApi.js'

function decodeValue(value) {
  if (value === undefined || value === null) return ''
  try { return decodeURIComponent(String(value)) } catch (e) { return String(value) }
}

const ASSET_ROOT = '/static/figma/adoption-flow/'

export default {
  components: {
    PawPageNav,
    PawFixedActionBar,
    PawImage,
    PawDialog,
    PawIcon,
    PawAdoptionPetsCard,
    PawAdoptionRejectReason,
    PawAdoptionReviewCard
  },
  data() {
    return {
      mode: 'list',
      reviewerId: '',
      reviewerRole: 'all',
      recordId: '',
      record: null,
      reviewTab: 'pending',
      reviewList: [],
      showAgree: false,
      showReject: false,
      rejectReason: ''
    }
  },
  computed: {
    reviewTabs() {
      return [
        { key: 'pending', label: '待审核', count: this.getReviewCount('pending') },
        { key: 'reviewed', label: '已审核', count: this.getReviewCount('reviewed') }
      ]
    },
    reviewPageTitle() {
      if (this.mode === 'info') return '小院信息'
      if (this.mode === 'application') return '申请内容'
      if (this.mode === 'list') return '领养审核'
      return '领养申请'
    },
    reviewNavBackground() {
      return 'var(--paw-color-adoption-review-bg, #fcf276)'
    },
    canAct() {
      return ['ownerReview', 'cloudReview', 'ownerConfirm'].includes(this.mode)
    },
    reviewRejectAction() {
      return {
        key: 'reject',
        label: this.mode === 'ownerConfirm' ? '驳回' : '拒绝',
        tone: 'ghost',
        shape: 'rounded',
        qa: 'qa-adoption-audit-reject'
      }
    },
    reviewAgreeAction() {
      return {
        key: 'agree',
        label: this.mode === 'ownerConfirm' ? '确认已领养' : '同意',
        tone: 'brand',
        shape: 'rounded',
        qa: 'qa-adoption-audit-agree'
      }
    },
    statusIconName() {
      if (['rejectDone', 'confirmReject', 'ownerConfirmRejected', 'cloudRejectDone'].includes(this.mode)) return 'status/rejected'
      if (['ownerConfirm', 'ownerConfirmed'].includes(this.mode)) return 'status/check'
      return 'navigation/clock'
    },
    showRejectReason() {
      return ['rejectDone', 'confirmReject', 'cloudRejectDone'].includes(this.mode)
    },
    applicantName() {
      return (this.record && this.record.applicantName) || '逢猫'
    },
    applicantAvatar() {
      return (this.record && this.record.applicantAvatar) || '/static/figma/home/feed-avatar.png'
    },
    applicationPhotos() {
      const media = this.record && Array.isArray(this.record.mediaPaths)
        ? this.record.mediaPaths.filter(Boolean)
        : []
      return [
        media[0] || ASSET_ROOT + '04a93fa17267335f49e6e818f8caa78dd3afc80b.png',
        media[1] || ASSET_ROOT + 'b61b026ea991c01c6257c909021245fd64956837.png'
      ]
    },
    ownerConfirmProofPhotos() {
      const photos = this.record && Array.isArray(this.record.proofPhotos)
        ? this.record.proofPhotos.filter(Boolean)
        : []
      const fallback = ASSET_ROOT + 'e81f2c2074a7772e8fbca3d3828b3a751f5cb5bb.png'
      return [photos[0] || fallback, photos[1] || photos[0] || fallback]
    },
    ownerConfirmProofDate() {
      const value = this.record && this.record.proofDate
      return typeof value === 'string' && value.trim() ? value : '2026.01.03'
    },
    ownerConfirmProofCopy() {
      return (this.record && this.record.confirmStory)
        || '我第一次去的时候小猫一直躲着我，去了几次都没有逮到，后来我买了一个网，趁着小猫睡着的时候我一个网兜给盖上去了，终于把小猫猫带回家了'
    },
    isCloudParentReview() { return this.reviewerRole === 'cloud_parent' || this.mode === 'cloudReview' || this.mode === 'cloudAgreeWaiting' || this.mode === 'cloudAgreeDone' || this.mode === 'cloudRejectDone' },
    hasRejectReason() { return Boolean(String(this.rejectReason || '').trim()) },
    agreeDialogTitle() {
      return this.mode === 'ownerConfirm' ? '确认已领养吗' : '确定同意领养吗'
    },
    agreeDescription() {
      if (this.isCloudParentReview) return '同意后申请将发给院主，由院主再次审核，为防止虐猫群体恶意领养，请您点击申请人头像审查领养人的历史记录后再做决定。'
      if (this.mode === 'ownerConfirm') return '请确认小动物已经找到新家，并且健康快乐的生活了。'
      return '同意后申请人可以查看小院位置（非收货地址）、您的联系方式以及您的领养留言。为防止虐猫群体恶意领养，请您点击申请人头像审查领养人的历史记录后再做决定。'
    },
    titleByMode() {
      return {
        cloudReview: '待云家长审批', cloudAgreeWaiting: '待云家长审批', cloudAgreeDone: '云家长已同意', cloudRejectDone: '云家长已拒绝',
        ownerReview: '待院主审批', ownerPending: '院主已同意',
        ownerConfirm: '待院主确认', ownerConfirmed: '院主已确认', ownerConfirmRejected: '院主已驳回', agreeDone: '院主已同意',
        confirmAgree: '院主已确认', confirmReject: '院主已拒绝', rejectDone: '院主已拒绝', success: '院主已确认',
        info: '小院信息', application: '申请内容'
      }[this.mode] || '领养申请'
    },
    resultBtnText() {
      return ['agreeDone', 'cloudAgreeDone', 'cloudAgreeWaiting'].includes(this.mode)
        ? '查看领养进度'
        : this.mode === 'confirmAgree' ? '查看领养进度' : '查看详情'
    },
    displayPets() {
      const pets = this.record && Array.isArray(this.record.pets) ? this.record.pets : []
      return pets.length ? pets : [{ name: '奥利奥', avatar: '/static/figma/adoption-flow/pet-orange.png' }]
    },
    catSectionTitle() {
      return this.mode === 'success' ? '领走的猫咪' : '申请领养的猫咪'
    }
  },
  onLoad(options = {}) {
    const requestedMode = String(options.mode || '').trim()
    if (requestedMode) this.mode = requestedMode
    this.recordId = decodeValue(options.id || options.recordId)
    this.reviewerId = decodeValue(options.reviewerId || options.userId || options.actorId)
    this.reviewerRole = this.normalizeReviewerRole(options.reviewerRole || options.role) || 'all'
    if (!requestedMode && !this.recordId) {
      this.mode = 'list'
      this.loadReviewList()
      return
    }
    this.loadRecord()
    this.reviewerRole = this.resolveReviewerRole(this.reviewerRole, this.reviewerId, this.record)
    const resolvedMode = this.modeForRecord(this.record, this.reviewerRole)
    this.mode = requestedMode && this.isActionModeCompatible(requestedMode, this.record)
      ? requestedMode
      : resolvedMode
    this.showAgree = options.popup === 'agree'
    this.showReject = options.popup === 'reject'
  },
  onShow() {
    if (this.mode === 'list') this.loadReviewList()
    else {
      this.loadRecord()
      this.syncActionMode()
    }
  },
  methods: {
    getReviewCount(tab) {
      return getAdoptionReviewList({ tab, reviewerRole: this.reviewerRole, reviewerId: this.reviewerId }).length
    },
    loadReviewList() {
      this.reviewList = getAdoptionReviewList({
        tab: this.reviewTab,
        reviewerRole: this.reviewerRole,
        reviewerId: this.reviewerId
      })
    },
    switchReviewTab(tab) {
      if (!['pending', 'reviewed'].includes(tab) || this.reviewTab === tab) return
      this.reviewTab = tab
      this.loadReviewList()
    },
    openReview(item) {
      if (!item || !item.recordId) return
      const query = [
        `id=${encodeURIComponent(item.recordId)}`,
        `reviewerRole=${encodeURIComponent(item.reviewerRole)}`,
        `reviewerId=${encodeURIComponent(item.reviewerId || '')}`,
        item.detailMode && `mode=${encodeURIComponent(item.detailMode)}`
      ].filter(Boolean).join('&')
      uni.navigateTo({ url: `/pages/yard/adoptionAudit?${query}` })
    },
    loadRecord() {
      const result = this.recordId ? getApplication('adoption', this.recordId) : null
      this.record = result && result.success
        ? result.data
        : getAdoptionById(this.recordId) || (!this.recordId ? getAdoptionRecords()[0] : null)
      if (this.record && !this.recordId) this.recordId = this.record.id
    },
    refreshRecord() {
      const result = getApplication('adoption', this.recordId, {
        reviewerRole: this.reviewerRole,
        reviewerId: this.reviewerId
      })
      if (result.success) this.record = result.data
      return result
    },
    isActionModeCompatible(mode, record) {
      const validStatuses = {
        cloudReview: ['cloud_pending'],
        ownerReview: ['pending'],
        ownerConfirm: ['owner_confirm', 'owner_confirm_pending']
      }[mode]
      return !validStatuses || Boolean(record && validStatuses.includes(record.status))
    },
    syncActionMode() {
      if (!this.record || !['cloudReview', 'ownerReview', 'ownerConfirm'].includes(this.mode)) return
      if (this.isActionModeCompatible(this.mode, this.record)) return
      this.mode = this.modeForRecord(this.record, this.reviewerRole)
      this.showAgree = false
      this.showReject = false
      this.rejectReason = ''
    },
    refreshActionRecord() {
      const actionMode = this.mode
      const result = this.refreshRecord()
      if (!result.success) return result
      if (!this.isActionModeCompatible(actionMode, result.data)) {
        this.mode = this.modeForRecord(result.data, this.reviewerRole)
        this.showAgree = false
        this.showReject = false
        this.rejectReason = ''
        uni.showToast({ title: '审核状态已更新，请重新操作', icon: 'none' })
        return { ...result, success: false, stale: true }
      }
      return result
    },
    goBack() { goBackSmart({ fallbackUrl: '/pages/me/index' }) },
    openPetDetail(pet, index) {
      const petId = pet && (pet.id || pet.petId || pet.yardPetId)
        ? String(pet.id || pet.petId || pet.yardPetId)
        : ''
      const params = [
        'state=35',
        'managed=0',
        `idx=${encodeURIComponent(index)}`,
        petId && `petId=${encodeURIComponent(petId)}`,
        `yardId=${encodeURIComponent((this.record && this.record.yardId) || '1')}`,
        `yardName=${encodeURIComponent(((this.record && (this.record.yardName || this.record.ownerName)) || ''))}`
      ].filter(Boolean).join('&')
      uni.navigateTo({ url: '/pages/adoption/petDetail?' + params })
    },
    openYardDetail() {
      if (!this.record) return
      openYardDetail({
        yardId: this.record.yardId || '1',
        yardName: this.record.yardName || this.record.ownerName || '小院'
      })
    },
    openAuditSubpage(nextMode) {
      const frame = nextMode === 'application' ? 49 : 48
      uni.navigateTo({
        url: `/pages/meMore/adoptionFlow?frame=${frame}&id=${encodeURIComponent(this.recordId)}`
      })
    },
    goMode(nextMode) {
      const role = this.reviewerRole ? `&reviewerRole=${encodeURIComponent(this.reviewerRole)}` : ''
      const reviewer = this.reviewerId ? `&reviewerId=${encodeURIComponent(this.reviewerId)}` : ''
      uni.redirectTo({ url: `/pages/yard/adoptionAudit?mode=${nextMode}&id=${encodeURIComponent(this.recordId)}${role}${reviewer}` })
    },
    openReviewResult(variant, nextMode) {
      const params = [
        `variant=${encodeURIComponent(variant)}`,
        `id=${encodeURIComponent(this.recordId)}`,
        `nextMode=${encodeURIComponent(nextMode)}`,
        this.reviewerRole && `reviewerRole=${encodeURIComponent(this.reviewerRole)}`,
        this.reviewerId && `reviewerId=${encodeURIComponent(this.reviewerId)}`
      ].filter(Boolean).join('&')
      uni.redirectTo({ url: `/pages/adoption/result?${params}` })
    },
    onAgree() {
      const current = this.refreshActionRecord()
      if (!current.success) return
      const isCloud = this.isCloudParentReview
      const nextStatus = isCloud ? 'pending' : this.mode === 'ownerConfirm' ? 'jury_confirm_pending' : 'pickup'
      const result = advanceApplication('adoption', this.recordId, nextStatus, {
        approvedAt: Date.now(),
        approvedBy: isCloud ? 'cloud_parent' : 'owner',
        ...(isCloud ? { cloudParentApprovedAt: Date.now(), reviewerId: this.reviewerId } : {}),
        ...(this.mode === 'ownerConfirm' ? { ownerConfirmedAt: Date.now() } : {})
      })
      if (!result.success) {
        const latest = this.refreshRecord()
        const changed = latest.success && !this.isActionModeCompatible(this.mode, latest.data)
        if (latest.success) {
          this.record = latest.data
          this.syncActionMode()
        }
        uni.showToast({
          title: changed ? '审核状态已更新，请重新操作' : (result.error.message || '当前状态不能执行此操作'),
          icon: 'none'
        })
        return
      }
      this.showAgree = false
      const cloudNextMode = isCloud
        ? (result.data && result.data.status === 'cloud_pending' ? 'cloudAgreeWaiting' : 'cloudAgreeDone')
        : ''
      const nextMode = isCloud ? cloudNextMode : this.mode === 'ownerConfirm' ? 'ownerConfirmed' : 'ownerPending'
      if (['cloudReview', 'ownerReview'].includes(this.mode)) {
        this.openReviewResult('81', nextMode)
        return
      }
      if (this.mode === 'ownerConfirm') {
        this.openReviewResult('82', nextMode)
        return
      }
      this.goMode(nextMode)
    },
    onReject() {
      const current = this.refreshActionRecord()
      if (!current.success) return
      const ownerConfirmAction = this.mode === 'ownerConfirm'
      const reason = String(this.rejectReason || '').trim()
      if (!ownerConfirmAction && !reason) {
        uni.showToast({ title: '请填写驳回原因', icon: 'none' })
        return
      }
      const rejector = this.record && this.record.rejector ? this.record.rejector : {
        name: this.isCloudParentReview ? '姜栋' : ((this.record && this.record.ownerName) || '院主'),
        avatar: (this.record && this.record.ownerAvatar) || '/static/figma/home/yard-avatar.png',
        level: 1,
        role: this.isCloudParentReview ? '云家长' : '院主'
      }
      this.showReject = false
      this.rejectReason = ''
      const result = advanceApplication('adoption', this.recordId, 'rejected', {
        rejectNote: ownerConfirmAction ? '驳回后领养信息申请人不再可见。' : reason,
        failureStage: this.isCloudParentReview ? 'cloud_parent' : ownerConfirmAction ? 'owner_confirm' : 'owner_review',
        rejectorName: rejector.name,
        rejectorAvatar: rejector.avatar,
        rejectorLevel: rejector.level,
        rejectorRole: rejector.role,
        rejector
      })
      if (!result.success) {
        this.refreshRecord()
        this.syncActionMode()
        uni.showToast({ title: result.error.message || '当前状态不能驳回', icon: 'none' })
        return
      }
      if (ownerConfirmAction) {
        this.openReviewResult('83', 'ownerConfirmRejected')
        return
      }
      this.refreshRecord()
      this.mode = this.isCloudParentReview ? 'cloudRejectDone' : this.mode === 'ownerConfirm' ? 'confirmReject' : 'rejectDone'
    },
    nextFromResult() {
      if (['agreeDone', 'cloudAgreeWaiting', 'cloudAgreeDone'].includes(this.mode)) return this.openAdoptionProgress()
      if (['confirmAgree', 'ownerConfirmed'].includes(this.mode)) return this.openAdoptionProgress()
      if (this.mode === 'confirmReject') return this.goBack()
      return this.goBack()
    },
    openAdoptionProgress() {
      uni.redirectTo({ url: `/pages/meMore/adoptionFlow?type=adoption&id=${encodeURIComponent(this.recordId)}` })
    },
    normalizeReviewerRole(value) {
      const role = String(value || '').trim().toLowerCase()
      return ['cloud_parent', 'cloud-parent', 'cloud', 'owner', 'yard_owner', 'yard-owner'].includes(role)
        ? (['cloud_parent', 'cloud-parent', 'cloud'].includes(role) ? 'cloud_parent' : 'owner')
        : ''
    },
    resolveReviewerRole(explicitRole, reviewerId, record) {
      if (explicitRole) return explicitRole
      const id = String(reviewerId || '').trim()
      if (id && record) {
        const cloudId = record.cloudParentPawId || record.cloudParentId || record.cloudOwnerId || ''
        if (cloudId && id === String(cloudId)) return 'cloud_parent'
        if (record.ownerPawId && id === String(record.ownerPawId)) return 'owner'
      }
      if (record && (record.status === 'cloud_pending' || record.failureStage === 'cloud_parent')) return 'cloud_parent'
      return 'owner'
    },
    modeForRecord(record, role) {
      if (!record) return role === 'cloud_parent' ? 'cloudReview' : 'ownerReview'
      if (role === 'cloud_parent') {
        if (record.status === 'cloud_pending' && Array.isArray(record.cloudParentApprovals)
          && record.cloudParentApprovals.includes(this.reviewerId)) return 'cloudAgreeWaiting'
        if (record.status === 'cloud_pending') return 'cloudReview'
        if (record.status === 'rejected' && record.failureStage === 'cloud_parent') return 'cloudRejectDone'
        if (record.status === 'pending') return 'cloudAgreeDone'
        return 'cloudReview'
      }
      if (record.status === 'pending') return 'ownerReview'
      if (record.status === 'pickup') return 'ownerPending'
      if (['owner_confirm', 'owner_confirm_pending'].includes(record.status)) return 'ownerConfirm'
      if (record.status === 'rejected' && record.failureStage === 'owner_review') return 'rejectDone'
      if (record.status === 'rejected' && record.failureStage === 'owner_confirm') return 'ownerConfirmRejected'
      if (['jury_confirm', 'jury_confirm_pending'].includes(record.status)) return 'ownerConfirmed'
      return 'ownerReview'
    },
  }
}
</script>

<style scoped>
.audit-list-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  box-sizing: border-box;
  background: #f5f5f5;
  color: #333;
}

.audit-list-scroll {
  flex: 1 1 auto;
  min-height: 0;
  height: 0;
  box-sizing: border-box;
}

.audit-list-content {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 10px;
  padding: 10px 15px 24px;
  box-sizing: border-box;
}

.audit-tabs {
  display: flex;
  gap: 8px;
  flex: 0 0 auto;
}

.audit-tab {
  display: inline-flex;
  min-width: 0;
  min-height: 38px;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  gap: 3px;
  box-sizing: border-box;
  padding: 0 12px;
  border-radius: 8px;
  background: #fff;
  color: #666;
  font-size: 15px;
  line-height: 20px;
}

.audit-tab--active {
  background: #ffea00;
  color: #333;
  font-weight: 500;
}

.audit-tab__count {
  color: inherit;
  font-size: 13px;
}

.audit-list-empty {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  color: #999;
  font-size: 14px;
}

.audit-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(to bottom, var(--paw-color-adoption-review-bg, #fcf276) 0, var(--paw-color-adoption-review-bg, #fcf276) 279px, #f5f5f5 279px, #f5f5f5 100%);
  color: #333;
}

.audit-page--owner-confirm {
  background: linear-gradient(to bottom, var(--paw-color-adoption-review-bg, #fcf276) 0, var(--paw-color-adoption-review-bg, #fcf276) 279px, #f5f5f5 279px, #f5f5f5 100%);
}

.audit-scroll {
  flex: 1;
  min-height: 0;
  background: transparent;
}

.audit-content {
  padding: 0 15px 24px;
  box-sizing: border-box;
}

.audit-content--owner-confirm {
  padding-right: 0;
  padding-left: 0;
}

.owner-confirm-top {
  padding: 0 15px 1px;
  box-sizing: border-box;
  background: transparent;
}

.owner-confirm-top .status-row {
  padding-right: 3px;
  padding-left: 3px;
}

.owner-confirm-proof {
  padding: 16px 10px 15px;
}

.owner-confirm-proof__photos {
  display: flex;
  justify-content: center;
  gap: 45px;
}

.owner-confirm-proof__item {
  display: flex;
  width: 106px;
  align-items: center;
  flex-direction: column;
}

.owner-confirm-proof__photo {
  display: block;
  width: 106px;
  height: 106px;
  flex: 0 0 106px;
}

.owner-confirm-proof__date,
.owner-confirm-proof__label {
  display: block;
  font-size: 12px;
  line-height: 16px;
  text-align: center;
}

.owner-confirm-proof__label {
  color: #999;
}

.owner-confirm-proof__copy {
  display: block;
  margin: 8px 8px 0;
  color: #333;
  font-size: 14px;
  line-height: 20px;
  word-break: break-all;
}

.link-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 50px;
  padding: 0 17px;
  font-size: 16px;
}

.audit-content--owner-confirm .link-card {
  margin-right: 15px;
  margin-left: 15px;
}

.link-value {
  display: flex;
  align-items: center;
  gap: 3px;
  color: #999;
  font-size: 14px;
}

.audit-page--with-actions .audit-content {
  padding-bottom: calc(112px + env(safe-area-inset-bottom));
}

.status-row {
  display: flex;
  min-height: 71px;
  align-items: center;
  gap: 7px;
  padding: 26px 3px 16px;
  box-sizing: border-box;
}

.status-title {
  color: #111;
  font-size: 20px;
  font-weight: 700;
  line-height: 29px;
}

.card {
  margin-bottom: 10px;
  padding: 16px;
  border-radius: 10px;
  background: #fff;
  box-sizing: border-box;
}

.card-title {
  display: block;
  margin-bottom: 15px;
  color: #222;
  font-size: 16px;
  font-weight: 500;
}

.audit-application-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  margin-bottom: 10px;
  min-height: 329px;
  padding: 11px 10px 15px;
  background: #fff;
  border-radius: 9px;
  box-shadow: 0 -1px 4px rgba(0, 0, 0, .05);
  box-sizing: border-box;
}

.audit-applicant-row {
  display: flex;
  min-width: 0;
  min-height: 34px;
  align-items: center;
  gap: 6px;
  margin: 0 8px 9px;
}

.audit-applicant-avatar {
  display: block;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 50%;
}

.audit-applicant-name {
  min-width: 0;
  overflow: hidden;
  color: #333;
  font-size: 14px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audit-applicant-tag {
  display: flex;
  height: 16px;
  align-items: center;
  box-sizing: border-box;
  padding: 0 5px;
  border-radius: 8px;
  background: #ee8002;
  color: #fff;
  font-size: 10px;
  line-height: 15px;
}

.apply-body {
  display: block;
  margin: 0 7px;
  color: #333;
  font-size: 15px;
  line-height: 15.5px;
  word-break: break-all;
}

.manager-info-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  color: #666;
  font-size: 14px;
  line-height: 20px;
}

.manager-info-row text:last-child {
  min-width: 0;
  color: #333;
  text-align: right;
}

.manager-info-copy {
  display: block;
  margin-top: 14px;
  color: #666;
  font-size: 14px;
  line-height: 21px;
}

.media-row {
  display: flex;
  gap: 4px;
  margin: 39px 0 0 8px;
}

.media-image {
  display: block;
  width: 106px;
  height: 106px;
  flex: 0 0 106px;
  border-radius: 4px;
}

.card .media-row {
  margin-top: 16px;
  margin-left: 0;
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
  height: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  border: 0;
  background: transparent;
  color: #333;
  font-size: 14px;
  line-height: 20px;
}
</style>
