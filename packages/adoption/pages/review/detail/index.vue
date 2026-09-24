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

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import PawFixedActionBar from '@/components/layout/PawFixedActionBar.vue'
import PawImage from '@/components/base/PawImage.vue'
import PawDialog from '@/components/overlay/PawDialog.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawAdoptionPetsCard from '@/components/PawAdoptionPetsCard.vue'
import PawAdoptionRejectReason from '@/components/adoption/PawAdoptionRejectReason.vue'
import PawAdoptionReviewCard from '@/components/adoption/PawAdoptionReviewCard.vue'
import { goBackSmart } from '@/utils/navBack.ts'
import { openYardDetail } from '@/utils/profileNav.ts'
import { getAdoptionRecords } from '@/utils/adoptionStorage.ts'
import type { AdoptionPetMetadata } from '@/utils/adoptionMockData.ts'
import {
  createAdoptionReviewFallbackPets,
  createAdoptionReviewQueueCard,
  normalizeAdoptionReviewRecord,
  type AdoptionReviewActionMode,
  type AdoptionReviewDetailAccess,
  type AdoptionReviewQueueCardMetadata,
  type AdoptionReviewRecordMetadata,
  type AdoptionReviewResultVariant,
  type AdoptionReviewReviewerRole,
  type AdoptionReviewTab,
} from '@/utils/adoptionReviewMetadata.ts'
import { buildRoute } from '@/navigation/routeContracts.ts'
import { createReviewSessionProvider, readAdoptionReviewDetail, readAdoptionReviewList } from '../../../services/reviewAdapter.ts'
import { applyAdoptionReviewAction } from '../../../services/reviewActionAdapter.ts'
import { produceLocalActionNotification } from '../../../services/messageStore.ts'

type AdoptionReviewActionSuccess = ReturnType<typeof applyAdoptionReviewAction>

interface AdoptionReviewActionFailure {
  success: false
  error: { code: string; message: string }
}

type AdoptionReviewActionResult = AdoptionReviewActionSuccess | AdoptionReviewActionFailure

type AdoptionReviewRefreshResult =
  | { success: true; data: AdoptionReviewRecordMetadata; error: null }
  | { success: false; error: { code: string; message: string } }

interface AdoptionReviewPageState {
  mode: string
  reviewerId: string
  reviewerRole: AdoptionReviewReviewerRole
  recordId: string
  reviewItemId: string
  record: AdoptionReviewRecordMetadata | null
  reviewAccess: AdoptionReviewDetailAccess | null
  reviewTab: AdoptionReviewTab
  reviewList: AdoptionReviewQueueCardMetadata[]
  actorProvider: () => unknown
  showAgree: boolean
  showReject: boolean
  rejectReason: string
}

interface AdoptionReviewTabMetadata {
  key: AdoptionReviewTab
  label: string
  count: number
}

interface ReviewNotificationAuthorizationContext {
  actor: { id: string }
  message: { businessType: string; reviewItemId?: string }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function errorText(error: unknown, key: 'code' | 'message', fallback: string): string {
  if (!isRecord(error)) return fallback
  const value = error[key]
  return typeof value === 'string' && value.trim() ? value : fallback
}

function reviewActionFailure(error: unknown): AdoptionReviewActionFailure {
  return {
    success: false,
    error: {
      code: errorText(error, 'code', 'REVIEW_ACTION_FAILED'),
      message: errorText(error, 'message', '审核状态保存失败'),
    },
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
}

function isAdoptionReviewActionMode(value: string): value is AdoptionReviewActionMode {
  return value === 'cloudReview' || value === 'ownerReview' || value === 'ownerConfirm'
}

function decodeValue(value: unknown): string {
  if (value === undefined || value === null) return ''
  const text = String(value)
  try { return decodeURIComponent(text) } catch { return text }
}

function recordForApplication(applicationId: string): AdoptionReviewRecordMetadata | null {
  const source = getAdoptionRecords({ includeDemo: false }).find(record => (
    record.applicationId === applicationId || record.id === applicationId || record.recordId === applicationId
  ))
  return normalizeAdoptionReviewRecord(source)
}


export default defineComponent({
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
  data(): AdoptionReviewPageState {
    return {
      mode: 'list',
      reviewerId: '',
      reviewerRole: 'all',
      recordId: '',
      reviewItemId: '',
      record: null,
      reviewAccess: null,
      reviewTab: 'pending',
      reviewList: [],
      actorProvider: createReviewSessionProvider(),
      showAgree: false,
      showReject: false,
      rejectReason: ''
    }
  },
  computed: {
    reviewTabs(): AdoptionReviewTabMetadata[] {
      return [
        { key: 'pending', label: '待审核', count: this.getReviewCount('pending') },
        { key: 'reviewed', label: '已审核', count: this.getReviewCount('reviewed') }
      ]
    },
    reviewPageTitle(): string {
      if (this.mode === 'info') return '小院信息'
      if (this.mode === 'application') return '申请内容'
      if (this.mode === 'list') return '领养审核'
      return '领养申请'
    },
    reviewNavBackground(): string {
      return 'var(--paw-color-adoption-review-bg, #fcf276)'
    },
    canAct(): boolean {
      return ['ownerReview', 'cloudReview', 'ownerConfirm'].includes(this.mode)
    },
    reviewRejectAction(): { key: string; label: string; tone: string; shape: string; qa: string } {
      return {
        key: 'reject',
        label: this.mode === 'ownerConfirm' ? '驳回' : '拒绝',
        tone: 'ghost',
        shape: 'rounded',
        qa: 'qa-adoption-audit-reject'
      }
    },
    reviewAgreeAction(): { key: string; label: string; tone: string; shape: string; qa: string } {
      return {
        key: 'agree',
        label: this.mode === 'ownerConfirm' ? '确认已领养' : '同意',
        tone: 'brand',
        shape: 'rounded',
        qa: 'qa-adoption-audit-agree'
      }
    },
    statusIconName(): string {
      if (['rejectDone', 'confirmReject', 'ownerConfirmRejected', 'cloudRejectDone'].includes(this.mode)) return 'status/rejected'
      if (['ownerConfirm', 'ownerConfirmed'].includes(this.mode)) return 'status/check'
      return 'navigation/clock'
    },
    showRejectReason(): boolean {
      return ['rejectDone', 'confirmReject', 'cloudRejectDone'].includes(this.mode)
    },
    applicantName(): string {
      return (this.record && this.record.applicantName) || '逢猫'
    },
    applicantAvatar(): string {
      return (this.record && this.record.applicantAvatar) || '/static/figma/home/feed-avatar.png'
    },
    applicationPhotos(): string[] {
      const media = this.record?.mediaPaths ?? []
      return [
        media[0] || '/static/figma/adoption-flow/04a93fa17267335f49e6e818f8caa78dd3afc80b.png',
        media[1] || '/static/figma/adoption-flow/b61b026ea991c01c6257c909021245fd64956837.png'
      ]
    },
    ownerConfirmProofPhotos(): string[] {
      const photos = this.record?.proofPhotos ?? []
      const fallback = '/static/figma/adoption-flow/e81f2c2074a7772e8fbca3d3828b3a751f5cb5bb.png'
      return [photos[0] || fallback, photos[1] || photos[0] || fallback]
    },
    ownerConfirmProofDate(): string {
      const value = this.record && this.record.proofDate
      return typeof value === 'string' && value.trim() ? value : '2026.01.03'
    },
    ownerConfirmProofCopy(): string {
      return (this.record && this.record.confirmStory)
        || '我第一次去的时候小猫一直躲着我，去了几次都没有逮到，后来我买了一个网，趁着小猫睡着的时候我一个网兜给盖上去了，终于把小猫猫带回家了'
    },
    isCloudParentReview(): boolean { return this.reviewerRole === 'cloud_parent' || this.mode === 'cloudReview' || this.mode === 'cloudAgreeWaiting' || this.mode === 'cloudAgreeDone' || this.mode === 'cloudRejectDone' },
    hasRejectReason(): boolean { return Boolean(String(this.rejectReason || '').trim()) },
    agreeDialogTitle(): string {
      return this.mode === 'ownerConfirm' ? '确认已领养吗' : '确定同意领养吗'
    },
    agreeDescription(): string {
      if (this.isCloudParentReview) return '同意后申请将发给院主，由院主再次审核，为防止虐猫群体恶意领养，请您点击申请人头像审查领养人的历史记录后再做决定。'
      if (this.mode === 'ownerConfirm') return '请确认小动物已经找到新家，并且健康快乐的生活了。'
      return '同意后申请人可以查看小院位置（非收货地址）、您的联系方式以及您的领养留言。为防止虐猫群体恶意领养，请您点击申请人头像审查领养人的历史记录后再做决定。'
    },
    titleByMode(): string {
      const titles: Record<string, string> = {
        cloudReview: '等待云家长审核中……', cloudAgreeWaiting: '等待云家长审核中……', cloudAgreeDone: '云家长已同意', cloudRejectDone: '云家长已拒绝',
        ownerReview: '等待院主审核中……', ownerPending: '院主已同意',
        ownerConfirm: '待院主确认', ownerConfirmed: '院主已确认', ownerConfirmRejected: '院主已驳回', agreeDone: '院主已同意',
        confirmAgree: '院主已确认', confirmReject: '院主已拒绝', rejectDone: '院主已拒绝', success: '院主已确认',
        info: '小院信息', application: '申请内容'
      }
      return titles[this.mode] || '领养申请'
    },
    resultBtnText(): string {
      return ['agreeDone', 'cloudAgreeDone', 'cloudAgreeWaiting'].includes(this.mode)
        ? '查看领养进度'
        : this.mode === 'confirmAgree' ? '查看领养进度' : '查看详情'
    },
    displayPets(): AdoptionPetMetadata[] {
      const pets = this.record?.pets ?? []
      return pets.length ? pets : createAdoptionReviewFallbackPets()
    },
    catSectionTitle(): string {
      return this.mode === 'success' ? '领走的猫咪' : '申请领养的猫咪'
    }
  },
  onLoad(options: Record<string, unknown> = {}) {
    const requestedMode = String(options.mode || '').trim()
    if (requestedMode) this.mode = requestedMode
    this.recordId = decodeValue(options.id || options.recordId || options.applicationId)
    this.reviewItemId = decodeValue(options.reviewItemId)
    this.reviewerId = decodeValue(options.reviewerId || options.userId || options.actorId)
    this.reviewerRole = this.normalizeReviewerRole(options.reviewerRole || options.role) || 'all'
    if (!requestedMode && !this.recordId) {
      this.mode = 'list'
      this.loadReviewList()
      return
    }
    this.loadRecord()
    if (this.reviewAccess && this.reviewAccess.canRead && this.reviewAccess.item) {
      const resolvedMode = this.modeForRecord(this.record, this.reviewerRole)
      this.mode = ['info', 'application'].includes(requestedMode)
        ? requestedMode
        : resolvedMode
    } else if (!['info', 'application'].includes(requestedMode)) {
      this.mode = requestedMode || 'ownerReview'
    }
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
    getReviewCount(tab: AdoptionReviewTab) {
      const filter = tab === 'pending' ? 'pending' : 'processed'
      const result = readAdoptionReviewList({ actorProvider: this.actorProvider, filter })
      return result.items ? result.items.length : 0
    },
    loadReviewList() {
      const filter = this.reviewTab === 'pending' ? 'pending' : 'processed'
      const result = readAdoptionReviewList({ actorProvider: this.actorProvider, filter })
      this.reviewList = result.items.map((item) => (
        createAdoptionReviewQueueCard(item, recordForApplication(item.applicationId))
      ))
    },
    switchReviewTab(tab: AdoptionReviewTab) {
      if (!['pending', 'reviewed'].includes(tab) || this.reviewTab === tab) return
      this.reviewTab = tab
      this.loadReviewList()
    },
    openReview(item: AdoptionReviewQueueCardMetadata) {
      if (!item.recordId) return
      const query = [
        `id=${encodeURIComponent(item.recordId)}`,
        `applicationId=${encodeURIComponent(item.applicationId)}`,
        `reviewItemId=${encodeURIComponent(item.reviewItemId)}`,
        `reviewerRole=${encodeURIComponent(item.reviewerRole || '')}`,
        `reviewerId=${encodeURIComponent(item.reviewerId || '')}`,
        item.detailMode && `mode=${encodeURIComponent(item.detailMode)}`
      ].filter(Boolean).join('&')
      uni.navigateTo({ url: `/packages/adoption/pages/review/detail/index?${query}` })
    },
    loadRecord() {
      if (!this.recordId) {
        this.record = null
        this.reviewAccess = null
        return
      }
      const result = readAdoptionReviewDetail({
        actorProvider: this.actorProvider,
        applicationId: this.recordId,
        ...(this.reviewItemId ? { reviewItemId: this.reviewItemId } : {}),
        perspective: 'reviewer',
      })
      this.reviewAccess = result
      if (!result.canRead || !result.item) {
        this.record = null
        return
      }
      this.recordId = result.item.applicationId
      this.reviewItemId = result.item.reviewItemId
      this.reviewerRole = result.item.reviewerRole || 'all'
      this.reviewerId = result.item.reviewerId || ''
      this.record = recordForApplication(this.recordId)
      if (!this.record) this.reviewAccess = { ...result, canRead: false, reason: 'NOT_FOUND' }
    },
    refreshRecord(): AdoptionReviewRefreshResult {
      this.loadRecord()
      if (this.reviewAccess?.canRead && this.record) {
        return { success: true, data: this.record, error: null }
      }
      return {
        success: false,
        error: { code: this.reviewAccess?.reason || 'NOT_FOUND', message: '审核记录不可用' },
      }
    },
    isActionModeCompatible(mode: string, record: AdoptionReviewRecordMetadata | null): boolean {
      const statusMap: Readonly<Record<AdoptionReviewActionMode, readonly string[]>> = {
        cloudReview: ['cloud_pending'],
        ownerReview: ['pending'],
        ownerConfirm: ['owner_confirm', 'owner_confirm_pending'],
      }
      const validStatuses = isAdoptionReviewActionMode(mode) ? statusMap[mode] : undefined
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
    refreshActionRecord(): AdoptionReviewRefreshResult | { success: false; stale: true; error: { code: string; message: string } } {
      const actionMode = this.mode
      const result = this.refreshRecord()
      if (!result.success) return result
      if (!this.isActionModeCompatible(actionMode, result.data)) {
        this.mode = this.modeForRecord(result.data, this.reviewerRole)
        this.showAgree = false
        this.showReject = false
        this.rejectReason = ''
        uni.showToast({ title: '审核状态已更新，请重新操作', icon: 'none' })
        return {
          success: false,
          stale: true,
          error: { code: 'STALE_REVIEW', message: '审核状态已更新，请重新操作' },
        }
      }
      return result
    },
    goBack() { goBackSmart({ fallbackUrl: '/pages/me/index' }) },
    openPetDetail(pet: AdoptionPetMetadata, index: number) {
      const petId = [pet.id, pet.petId, pet.yardPetId].find(isNonEmptyString) || ''
      if (!petId) return
      const params = [
        `animalId=${encodeURIComponent(petId)}`,
        `yardId=${encodeURIComponent((this.record && this.record.yardId) || '1')}`,
        'state=35',
        `idx=${encodeURIComponent(String(index))}`,
        `yardName=${encodeURIComponent(((this.record && (this.record.yardName || this.record.ownerName)) || ''))}`
      ].join('&')
      uni.navigateTo({ url: '/packages/animal/pages/detail/index?' + params })
    },
    openYardDetail() {
      if (!this.record) return
      openYardDetail({
        yardId: this.record.yardId || '1',
        yardName: this.record.yardName || this.record.ownerName || '小院'
      })
    },
    openAuditSubpage(nextMode: 'info' | 'application') {
      const frame = nextMode === 'application' ? 49 : 48
      const view = frame === 49 ? 'application' : 'adoption-info'
      try {
        uni.navigateTo({
          url: buildRoute('adoption.progress', { applicationId: this.recordId, view })
        })
      } catch {
        uni.showToast({ title: '申请内容链接无效', icon: 'none' })
      }
    },
    goMode(nextMode: string) {
      const role = this.reviewerRole ? `&reviewerRole=${encodeURIComponent(this.reviewerRole)}` : ''
      const reviewer = this.reviewerId ? `&reviewerId=${encodeURIComponent(this.reviewerId)}` : ''
      uni.redirectTo({ url: `/packages/adoption/pages/review/detail/index?mode=${nextMode}&applicationId=${encodeURIComponent(this.recordId)}${role}${reviewer}` })
    },
    openReviewResult(variant: AdoptionReviewResultVariant, nextMode: string) {
      const outcomeByVariant: Record<AdoptionReviewResultVariant, string> = { '81': 'review-approved', '82': 'adoption-confirmed-by-owner', '83': 'review-rejected' }
      const outcome = outcomeByVariant[variant]
      if (!outcome || !this.recordId) return
      const params = {
        applicationId: this.recordId,
        outcome,
        nextMode,
        ...(this.reviewerRole ? { reviewerRole: this.reviewerRole } : {}),
        ...(this.reviewerId ? { reviewerId: this.reviewerId } : {})
      }
      try { uni.redirectTo({ url: buildRoute('adoption.result', params) }) } catch { uni.showToast({ title: '审核结果暂不可用', icon: 'none' }) }
    },
    onAgree() {
      const current = this.refreshActionRecord()
      if (!current.success) return
      const isCloud = this.isCloudParentReview
      let result: AdoptionReviewActionResult
      try {
        result = applyAdoptionReviewAction({
          actorProvider: this.actorProvider,
          applicationId: this.recordId,
          reviewItemId: this.reviewItemId,
          outcome: 'approved',
          idempotencyKey: `adoption-review-${this.reviewItemId}-approved`,
        })
      } catch (error: unknown) {
        result = reviewActionFailure(error)
      }
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
      this.refreshRecord()
      this.notifyReviewAction(result)
      const cloudNextMode = isCloud
        ? (result.applicationStatus === 'cloud_pending' ? 'cloudAgreeWaiting' : 'cloudAgreeDone')
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
      this.showReject = false
      this.rejectReason = ''
      let result: AdoptionReviewActionResult
      try {
        result = applyAdoptionReviewAction({
          actorProvider: this.actorProvider,
          applicationId: this.recordId,
          reviewItemId: this.reviewItemId,
          outcome: 'rejected',
          reason: ownerConfirmAction ? '驳回后领养信息申请人不再可见。' : reason,
          idempotencyKey: `adoption-review-${this.reviewItemId}-rejected`,
        })
      } catch (error: unknown) {
        result = reviewActionFailure(error)
      }
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
      this.notifyReviewAction(result)
      this.mode = this.isCloudParentReview ? 'cloudRejectDone' : this.mode === 'ownerConfirm' ? 'confirmReject' : 'rejectDone'
    },
    nextFromResult() {
      if (['agreeDone', 'cloudAgreeWaiting', 'cloudAgreeDone'].includes(this.mode)) return this.openAdoptionProgress()
      if (['confirmAgree', 'ownerConfirmed'].includes(this.mode)) return this.openAdoptionProgress()
      if (this.mode === 'confirmReject') return this.goBack()
      return this.goBack()
    },
    openAdoptionProgress() {
      try {
        uni.redirectTo({
          url: buildRoute('adoption.progress', { applicationId: this.recordId })
        })
      } catch {
        uni.showToast({ title: '领养申请链接无效', icon: 'none' })
      }
    },
    notifyReviewAction(action: AdoptionReviewActionSuccess) {
      const record = this.record
      if (!record) return
      const recipientId = [
        record.applicantId,
        record.applicantUserId,
        record.applicant?.id,
        record.applicant?.pawId,
      ].find(isNonEmptyString)
      if (!recipientId) return
      produceLocalActionNotification({
        action,
        recipientId,
        businessType: 'adoption',
        businessId: action.applicationId || this.recordId,
        reviewItemId: action.reviewItemId || this.reviewItemId,
        category: 'system',
        title: action.toStatus === 'approved' ? '领养审核已通过' : '领养审核未通过',
        preview: action.toStatus === 'approved' ? '你的领养申请已进入下一步处理。' : '你的领养申请审核未通过，请查看当前进度。',
        authorize: ({ actor, message }: ReviewNotificationAuthorizationContext) => actor.id === action.actorId
          && message.businessType === 'adoption'
          && message.reviewItemId === (action.reviewItemId || this.reviewItemId),
        actorProvider: this.actorProvider,
      })
    },
    normalizeReviewerRole(value: unknown): '' | 'owner' | 'cloud_parent' {
      const role = String(value || '').trim().toLowerCase()
      return ['cloud_parent', 'cloud-parent', 'cloud', 'owner', 'yard_owner', 'yard-owner'].includes(role)
        ? (['cloud_parent', 'cloud-parent', 'cloud'].includes(role) ? 'cloud_parent' : 'owner')
        : ''
    },
    resolveReviewerRole(explicitRole: string | undefined, reviewerId: string | undefined, record: AdoptionReviewRecordMetadata | null): string {
      if (explicitRole) return String(explicitRole)
      const id = String(reviewerId || '').trim()
      if (id && record) {
        const cloudId = record.cloudParentPawId || record.cloudParentId || record.cloudOwnerId || ''
        if (cloudId && id === String(cloudId)) return 'cloud_parent'
        if (record.ownerPawId && id === String(record.ownerPawId)) return 'owner'
      }
      if (record && (record.status === 'cloud_pending' || record.failureStage === 'cloud_parent')) return 'cloud_parent'
      return 'owner'
    },
    modeForRecord(record: AdoptionReviewRecordMetadata | null, role: string): string {
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
})
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
