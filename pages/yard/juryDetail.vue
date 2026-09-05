<template>
  <view class="jury-detail-page" data-qa="qa-jury-detail">
    <view class="jury-detail-hero" :class="{ 'jury-detail-hero--voted': voted }">
      <PawPageNav title="逢猫评审团" background="#1866fc" :light="true" :title-centered="true" :auto-back="false"
        @back="goBack" />
      <view class="jury-detail-hero__copy">
        <text class="jury-detail-hero__title">{{ voted ? '感谢您的认真审查' : 'Ta的领养是真的吗？' }}</text>
        <text class="jury-detail-hero__subtitle">
          {{ voted ? '您的宝贵意见是逢猫审查虚假领养的重要参考' : '请您审查该申请人是否为虚假领养及虐猫群体的恶意领养' }}
        </text>
      </view>
    </view>

    <scroll-view class="jury-detail-scroll" scroll-y :show-scrollbar="false" data-qa="qa-jury-detail-scroll">
      <view v-if="item" class="jury-detail-content">
        <view v-if="voted" class="jury-detail-card jury-vote-summary" data-qa="qa-jury-detail-vote-summary">
          <PawVoteRatioBar :real-percent="voteStats.realPercent" :fake-percent="voteStats.fakePercent"
            :real-label="`${voteStats.realPercent}%`" :fake-label="`${voteStats.fakePercent}%`" :height="30" />
          <view class="jury-vote-summary__legend">
            <view class="jury-vote-summary__side">
              <text>挺真实{{ selectedVote === 'real' ? '(已选)' : '' }}</text>
              <text class="jury-vote-summary__count">{{ voteStats.realCount }}人投票</text>
            </view>
            <view class="jury-vote-summary__side jury-vote-summary__side--right">
              <text>有点假{{ selectedVote === 'fake' ? '(已选)' : '' }}</text>
              <text class="jury-vote-summary__count">{{ voteStats.fakeCount }}人投票</text>
            </view>
          </view>
        </view>

        <view class="jury-detail-card jury-evidence-card" data-qa="qa-jury-detail-evidence">
          <view class="jury-evidence-card__items">
            <view v-for="evidence in (item.detailEvidence || item.evidence)" :key="evidence.id"
              class="jury-evidence-card__item">
              <PawImage class="jury-evidence-card__image" :src="evidence.src" display-mode="fixed" :width="106"
                :height="106" :radius="3" :preview-urls="detailEvidenceUrls" :preview-index="evidenceIndex(evidence)"
                data-qa="qa-jury-detail-evidence-image" />
              <text class="jury-evidence-card__date">{{ evidence.date }}</text>
              <text class="jury-evidence-card__label">{{ evidence.label }}</text>
            </view>
          </view>
          <text class="jury-detail-card__body">{{ item.applyText }}</text>
        </view>

        <view class="jury-detail-card jury-application-card" data-qa="qa-jury-detail-application">
          <view class="jury-application-card__identity" data-qa="qa-jury-applicant" @tap.stop="openApplicant">
            <PawAvatar :src="item.applicantAvatar" :size="34" :clickable="true" @click="openApplicant" />
            <text class="jury-application-card__name">{{ item.applicantName }}</text>
            <view class="jury-application-card__tag"><text>申请人</text></view>
          </view>
          <text class="jury-detail-card__body">{{ item.application.text }}</text>
          <view v-if="item.application.media.length" class="jury-application-card__media">
            <PawImage v-for="(media, index) in item.application.media" :key="media.id"
              class="jury-application-card__media-image" :src="media.src" display-mode="fixed" :width="106"
              :height="106" :radius="3" :preview-urls="applicationMediaUrls" :preview-index="index"
              data-qa="qa-jury-application-media-image" />
          </view>
        </view>

        <view class="jury-detail-card jury-pets-card" data-qa="qa-jury-detail-pets">
          <text class="jury-pets-card__title">申请领养的猫咪（{{ item.pets.length }}）</text>
          <view class="jury-pets-card__list">
            <view v-for="pet in item.pets" :key="pet.id" class="jury-pets-card__pet" :data-qa="`qa-jury-pet-${pet.id}`"
              @tap.stop="openPet(pet)">
              <PawAvatar :src="pet.avatar" :size="48" :clickable="true" @click="openPet(pet)" />
              <text>{{ pet.name }}</text>
            </view>
          </view>
          <view class="jury-pets-card__owner" data-qa="qa-jury-yard" @tap.stop="openOwner">
            <PawAvatar :src="item.yard.avatar || item.ownerAvatar" :size="34" :clickable="true" @click="openOwner" />
            <text>{{ item.ownerName }}</text>
            <view class="jury-pets-card__owner-tag"><text>小院</text></view>
          </view>
        </view>
        <view class="jury-detail-scroll__space"></view>
      </view>
      <view v-else class="jury-detail-empty" data-qa="qa-jury-detail-empty">
        <text>暂时找不到这条评审内容</text>
      </view>
    </scroll-view>

    <PawJuryActionBar :voted="voted" :next-label="nextLabel" @share="shareItem" @vote="vote" @next="goNext" />
    <PawNoticeModal v-model:visible="showVoteLimitModal" :message="voteLimitMessage" @confirm="closeVoteLimit" />
    <PawJuryVoteDialog v-model="showVoteResult" :selected-vote="selectedVote || 'real'"
      :real-percent="voteStats.realPercent" :fake-percent="voteStats.fakePercent" :real-vote-count="voteStats.realCount"
      :fake-vote-count="voteStats.fakeCount" @close="onVoteDialogClose" @back="onVoteDialogBack"
      @next="onVoteDialogNext" />
    <ShareActionSheet v-model:visible="shareSheetVisible" :share-data="juryShareData" @select="onShareAction" />
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawAvatar from '@/components/identity/PawAvatar.vue'
import PawImage from '@/components/base/PawImage.vue'
import PawNoticeModal from '@/components/PawNoticeModal.vue'
import PawJuryActionBar from '@/components/PawJuryActionBar.vue'
import PawJuryVoteDialog from '@/components/PawJuryVoteDialog.vue'
import PawVoteRatioBar from '@/components/PawVoteRatioBar.vue'
import ShareActionSheet from '@/components/ShareActionSheet.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { PAW_MSG_VOTE_DAY_LIMIT } from '@/utils/pawNoticeMessages.js'
import { JURY_ITEM_STATUS } from '@/utils/juryMock.js'
import { openUserProfile, openYardDetail } from '@/utils/profileNav.js'
import {
  getJuryItemById,
  getJuryItems,
  getJuryVoteLimitState,
  writeJuryVote
} from '@/utils/juryStorage.js'

export default {
  name: 'JuryDetailPage',
  components: { PawPageNav, PawAvatar, PawImage, PawNoticeModal, PawJuryActionBar, PawJuryVoteDialog, PawVoteRatioBar, ShareActionSheet },
  data() {
    return {
      itemId: '',
      reviewType: '',
      item: null,
      selectedVote: '',
      showVoteResult: false,
      shareSheetVisible: false,
      showVoteLimitModal: false,
      voteLimitMessage: PAW_MSG_VOTE_DAY_LIMIT
    }
  },
  computed: {
    voted() {
      const item = this.item || {}
      return Boolean(item.hasVoted || item.vote || item.status === JURY_ITEM_STATUS.voted || item.status === JURY_ITEM_STATUS.closed)
    },
    voteStats() {
      const source = (this.item && (this.item.voteStats || this.item.voteStatistics)) || {}
      if (this.voted) {
        return {
          realPercent: 50,
          fakePercent: 50,
          realCount: 32,
          fakeCount: 32
        }
      }
      const realPercent = Number(source.realPercent ?? source.real ?? 0)
      const fakePercent = Number(source.fakePercent ?? source.fake ?? 0)
      return {
        realPercent: Number.isFinite(realPercent) ? realPercent : 0,
        fakePercent: Number.isFinite(fakePercent) ? fakePercent : 0,
        realCount: source.realCount ?? 0,
        fakeCount: source.fakeCount ?? 0
      }
    },
    queueItems() {
      const filter = this.reviewType ? { reviewType: this.reviewType } : {}
      return getJuryItems({ ...filter, includeClosed: false })
    },
    pendingQueueItems() {
      return this.queueItems.filter(item => item.status === JURY_ITEM_STATUS.pending)
    },
    detailEvidenceUrls() {
      return (this.item && (this.item.detailEvidence || this.item.evidence) || []).map(entry => entry.src)
    },
    applicationMediaUrls() {
      return (this.item && this.item.application && this.item.application.media || []).map(entry => entry.src)
    },
    juryShareData() {
      const item = this.item || {}
      const reviewType = item.reviewType || this.reviewType || 'adoption'
      const evidence = item.detailEvidence || item.evidence || []
      const media = item.application && item.application.media || []
      // 评审证据通常是更轻量的分享封面；没有证据时再回退到申请材料或头像。
      const imageUrl = (evidence[0] && evidence[0].src) || (media[0] && media[0].src) || item.applicantAvatar || ''
      const title = reviewType === 'rescue' ? '逢猫救助评审' : '逢猫领养评审'
      const query = [
        `itemId=${encodeURIComponent(item.id || this.itemId)}`,
        `id=${encodeURIComponent(item.id || this.itemId)}`,
        `reviewType=${encodeURIComponent(reviewType)}`
      ].join('&')
      return {
        type: 'jury-review',
        reviewType,
        itemId: item.id || this.itemId,
        title,
        summary: item.summary || item.applyText || '',
        applicantName: item.applicantName || '',
        yardName: item.yardName || item.ownerName || '',
        petNames: (item.pets || []).map(pet => pet.name),
        imageUrl,
        path: `/pages/yard/juryDetail?${query}`,
        query
      }
    },
    nextItem() {
      const currentIndex = this.queueItems.findIndex(entry => entry.id === this.itemId)
      const startIndex = currentIndex >= 0 ? currentIndex + 1 : 0
      return this.queueItems.slice(startIndex).find(item => item.status === JURY_ITEM_STATUS.pending) || null
    },
    nextLabel() {
      if (!this.nextItem) return '返回评审团'
      const nextIndex = this.pendingQueueItems.findIndex(entry => entry.id === this.nextItem.id)
      return `下一个（${nextIndex + 1}/${this.pendingQueueItems.length}）`
    }
  },
  onLoad(options = {}) {
    this.itemId = String(options.itemId || options.id || '')
    this.reviewType = this.normalizeReviewType(options.reviewType || options.type || options.juryType)
    this.refreshItem()
    if (options.popup === 'vote-real' || options.popup === 'vote-fake') {
      this.selectedVote = options.popup === 'vote-real' ? 'real' : 'fake'
      this.showVoteResult = true
    }
  },
  onShow() {
    if (this.itemId) this.refreshItem()
  },
  onShareAppMessage() {
    const share = this.juryShareData
    return {
      title: share.title,
      path: share.path,
      imageUrl: share.imageUrl || undefined
    }
  },
  onShareTimeline() {
    const share = this.juryShareData
    return {
      title: share.title,
      query: share.query,
      imageUrl: share.imageUrl || undefined
    }
  },
  methods: {
    refreshItem() {
      const filter = this.reviewType ? { reviewType: this.reviewType } : {}
      const item = getJuryItemById(this.itemId, filter) || getJuryItems(filter)[0] || null
      this.item = item
      if (!item) return
      if (!this.itemId) this.itemId = item.id
      this.selectedVote = item.vote || ''
    },
    goBack() {
      const type = this.reviewType ? `?reviewType=${encodeURIComponent(this.reviewType)}` : ''
      goBackSmart({ fallbackUrl: `/pages/yard/juryPanel${type}` })
    },
    vote(value) {
      if (this.voted) return
      const result = writeJuryVote(this.itemId, value, getJuryVoteLimitState())
      if (!result.ok) {
        if (result.reason === 'vote-limit') this.showVoteLimitModal = true
        else uni.showToast({ title: '当前评审不可投票', icon: 'none' })
        return
      }
      this.selectedVote = result.vote
      this.refreshItem()
      this.showVoteResult = true
    },
    closeVoteLimit() {
      this.showVoteLimitModal = false
    },
    onVoteDialogClose() {
      this.showVoteResult = false
      this.refreshItem()
    },
    onVoteDialogBack() {
      this.showVoteResult = false
      this.refreshItem()
    },
    onVoteDialogNext() {
      this.showVoteResult = false
      this.goNext()
    },
    goNext() {
      if (!this.nextItem) {
        const type = this.reviewType ? `&reviewType=${encodeURIComponent(this.reviewType)}` : ''
        goBackSmart({ fallbackUrl: `/pages/yard/juryPanel?tab=finished${type}` })
        return
      }
      const id = encodeURIComponent(this.nextItem.id)
      const type = this.reviewType ? `&reviewType=${encodeURIComponent(this.reviewType)}` : ''
      uni.redirectTo({ url: `/pages/yard/juryDetail?itemId=${id}&id=${id}${type}` })
    },
    shareItem() {
      if (!this.item) return
      this.shareSheetVisible = true
    },
    onShareAction(key, shareData) {
      const payload = shareData && shareData.path ? shareData : this.juryShareData
      if (key === 'link') {
        uni.setClipboardData({
          data: payload.path,
          success: () => uni.showToast({ title: '评审链接已复制', icon: 'none' })
        })
        return
      }
      if (key === 'wechat' || key === 'moments') {
        uni.showToast({ title: '请使用微信分享面板完成分享', icon: 'none' })
        return
      }
      if (key === 'poster') {
        uni.showToast({ title: '评审海报生成中', icon: 'none' })
        return
      }
      if (key === 'report') {
        uni.showToast({ title: '已收到举报反馈', icon: 'none' })
      }
    },
    evidenceIndex(evidence) {
      return (this.item && (this.item.detailEvidence || this.item.evidence) || []).findIndex(entry => entry.id === evidence.id)
    },
    openApplicant() {
      if (!this.item || !this.item.applicant) return
      openUserProfile({
        pawId: this.item.applicant.pawId || this.item.applicantId,
        nickname: this.item.applicantName,
        avatar: this.item.applicantAvatar
      })
    },
    openOwner() {
      if (!this.item) return
      openYardDetail({ yardId: this.item.yardId, yardName: this.item.yardName || this.item.ownerName })
    },
    openPet(pet) {
      const petId = String(pet && (pet.yardPetId || pet.sourcePetId || pet.petId || pet.id) || '').trim()
      if (!petId) return
      const yardId = encodeURIComponent(this.item && this.item.yardId || '1')
      const yardName = encodeURIComponent(this.item && this.item.yardName || '')
      const yardQuery = yardName ? `&yardName=${yardName}` : ''
      uni.navigateTo({
        url: `/pages/adoption/petDetail?petId=${encodeURIComponent(petId)}&yardId=${yardId}&managed=0&state=0${yardQuery}`
      })
    },
    normalizeReviewType(value) {
      const type = value === undefined || value === null ? '' : String(value).trim().toLowerCase()
      return type === 'rescue' || type === 'adoption' ? type : ''
    }
  }
}
</script>

<style lang="less" scoped>
.jury-detail-page {
  display: flex;
  width: 100%;
  height: 100vh;
  flex-direction: column;
  background: #f5f5f5;
}

.jury-detail-hero {
  display: flex;
  height: 279px;
  min-height: 279px;
  flex-direction: column;
  background: #1866fc;
}

.jury-detail-hero__copy {
  display: flex;
  flex-direction: column;
  padding: 45px 26px 0;
  box-sizing: border-box;
}

.jury-detail-hero__title {
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
}

.jury-detail-hero__subtitle {
  margin-top: 6px;
  color: #d9e6ff;
  font-size: 12px;
  line-height: 17px;
  white-space: nowrap;
}

.jury-detail-scroll {
  position: relative;
  z-index: 2;
  flex: 1 1 auto;
  height: 0;
  min-height: 0;
  margin-top: -86px;
  box-sizing: border-box;
}

.jury-detail-content {
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  gap: 10px;
  padding: 0 15px;
  box-sizing: border-box;
}

.jury-detail-card {
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  box-sizing: border-box;
  border-radius: 9px;
  background: #fff;
}

.jury-vote-summary {
  gap: 5px;
  padding: 19px 22px 13px;
}

.jury-vote-summary__legend {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.jury-vote-summary__side {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
  color: #333;
  font-size: 12px;
  line-height: 17px;
}

.jury-vote-summary__side--right {
  align-items: flex-end;
  text-align: right;
}

.jury-vote-summary__count {
  color: #999;
  font-size: 11px;
  line-height: 15px;
}

.jury-evidence-card {
  min-height: 250px;
  gap: 11px;
  padding: 19px 18px 15px;
}

.jury-evidence-card__items {
  display: flex;
  justify-content: center;
  gap: 30px;
}

.jury-evidence-card__item {
  display: flex;
  width: 106px;
  flex: 0 0 106px;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.jury-evidence-card__image {
  display: block;
  width: 106px;
  height: 106px;
  border-radius: 3px;
  background: #eee;
}

.jury-evidence-card__date,
.jury-evidence-card__label {
  color: #333;
  font-size: 12px;
  line-height: 17px;
  text-align: center;
  white-space: nowrap;
}

.jury-evidence-card__label {
  color: #999;
}

.jury-detail-card__body {
  display: block;
  color: #333;
  font-size: 14px;
  line-height: 1.45;
  white-space: pre-line;
  word-break: break-word;
}

.jury-application-card {
  gap: 14px;
  padding: 20px 17px;
  box-shadow: 0 -1px 4px rgba(0, 0, 0, .05);
}

.jury-application-card__identity,
.jury-pets-card__owner {
  display: flex;
  align-items: center;
  gap: 6px;
}

.jury-application-card__name,
.jury-pets-card__owner>text {
  color: #333;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.jury-application-card__tag,
.jury-pets-card__owner-tag {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 16px;
  padding: 0 5px;
  border-radius: 8px;
  background: #ee8002;
  color: #fff;
  font-size: 10px;
  line-height: 15px;
}

.jury-application-card__media {
  display: flex;
  gap: 4px;
  margin-top: 2px;
}

.jury-application-card__media-image {
  display: block;
  width: 106px;
  height: 106px;
  border-radius: 3px;
  background: #eee;
}

.jury-pets-card {
  gap: 0;
  padding: 15px 18px 12px;
}

.jury-pets-card__title {
  color: #333;
  font-size: 16px;
  line-height: 22px;
}

.jury-pets-card__list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 27px;
}

.jury-pets-card__pet {
  display: flex;
  width: 49px;
  flex: 0 0 49px;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: #333;
  font-size: 14px;
  line-height: 20px;
}

.jury-pets-card__owner {
  margin-top: 43px;
}

.jury-pets-card__owner-tag {
  background: #fff463;
  color: #333;
}

.jury-detail-scroll__space {
  height: 110px;
  flex: 0 0 110px;
}

.jury-detail-empty {
  display: flex;
  min-height: 220px;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}
</style>
