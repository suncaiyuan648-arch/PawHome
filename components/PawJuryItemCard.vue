<template>
  <view class="paw-jury-item-card" :class="{ 'paw-jury-item-card--done': isFinished }" :data-jury-id="itemId"
    :data-qa="qa || 'qa-jury-item-card'" @tap="emitClick">
    <view class="paw-jury-item-card__header">
      <view class="paw-jury-item-card__identity" data-qa="qa-jury-item-identity" @tap.stop="emitIdentityClick">
        <PawAvatar class="paw-jury-item-card__avatar" :src="applicantAvatar" :size="41" :clickable="true"
          @click="emitIdentityClick" />
        <view class="paw-jury-item-card__identity-copy">
          <view class="paw-jury-item-card__name-row">
            <text class="paw-jury-item-card__name">{{ applicantName }}</text>
            <LevelCapsule v-if="applicantLevel" :level="applicantLevel" />
          </view>
          <text v-if="createdAtText" class="paw-jury-item-card__date">{{ createdAtText }}</text>
        </view>
      </view>

      <PawStatusPill class="paw-jury-item-card__status" :text="statusText" :tone="statusTone" variant="outline" />
    </view>

    <view class="paw-jury-item-card__vote" data-qa="qa-jury-item-vote-ratio">
      <PawVoteRatioBar :real-percent="realPercent" :fake-percent="fakePercent" :real-label="`${realPercent}% (挺真实)`"
        :fake-label="`${fakePercent}%`" :min-fake-width="48" />
      <view v-if="showVoteLegend" class="paw-jury-item-card__vote-legend">
        <view class="paw-jury-item-card__vote-side">
          <text class="paw-jury-item-card__vote-label">挺真实</text>
          <text class="paw-jury-item-card__vote-count">{{ realVoteCount }}人投票</text>
        </view>
        <view class="paw-jury-item-card__vote-side paw-jury-item-card__vote-side--right">
          <text class="paw-jury-item-card__vote-label">有点假</text>
          <text class="paw-jury-item-card__vote-count">{{ fakeVoteCount }}人投票</text>
        </view>
      </view>
    </view>

    <text v-if="bodyText" class="paw-jury-item-card__body">{{ bodyText }}</text>

    <view v-if="normalizedEvidence.length" class="paw-jury-item-card__evidence" data-qa="qa-jury-item-evidence">
      <view v-for="(evidence, index) in normalizedEvidence" :key="evidence.id || `${itemId}-evidence-${index}`"
        class="paw-jury-item-card__evidence-item" :style="evidenceStyle" @tap.stop="emitEvidenceClick(evidence, index)">
        <image class="paw-jury-item-card__evidence-image" :style="evidenceImageStyle" :src="evidence.src"
          mode="aspectFill" />
        <view v-if="showEvidenceMeta && (evidence.date || evidence.label)" class="paw-jury-item-card__evidence-caption">
          <text v-if="evidence.date" class="paw-jury-item-card__evidence-date">{{ evidence.date }}</text>
          <text v-if="evidence.label" class="paw-jury-item-card__evidence-label">{{ evidence.label }}</text>
        </view>
      </view>
    </view>

    <view v-if="rewardText" class="paw-jury-item-card__footer">
      <text class="paw-jury-item-card__reward">{{ rewardText }}</text>
    </view>

    <slot name="extra" />
  </view>
</template>

<script>
import PawAvatar from '@/components/identity/PawAvatar.vue'
import LevelCapsule from '@/components/LevelCapsule.vue'
import PawStatusPill from '@/components/PawStatusPill.vue'
import PawVoteRatioBar from '@/components/PawVoteRatioBar.vue'
import { safeImgSrc } from '@/utils/safeImgSrc.js'

const DEFAULT_EVIDENCE_IMAGE = '/static/figma/jury-e81f2c2074a7772e8fbca3d3828b3a751f5cb5bb.png'

function clampPercent(value, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(0, Math.min(100, number))
}

export default {
  name: 'PawJuryItemCard',
  components: { PawAvatar, LevelCapsule, PawStatusPill, PawVoteRatioBar },
  props: {
    item: { type: Object, default: () => ({}) },
    evidenceSize: { type: [Number, String], default: 112 },
    showVoteLegend: { type: Boolean, default: false },
    showEvidenceMeta: { type: Boolean, default: false },
    qa: { type: String, default: '' }
  },
  emits: ['click', 'identity-click', 'evidence-click'],
  computed: {
    itemId() {
      return String(this.item.id || this.item.itemId || this.item.juryId || '')
    },
    applicant() {
      return this.item.applicant || this.item.user || this.item.author || {}
    },
    applicantName() {
      return this.item.displayName || this.item.name || this.item.ownerName || this.item.applicantName || this.item.userName || this.applicant.name || '逢猫'
    },
    applicantAvatar() {
      return this.item.displayAvatar || this.item.avatar || this.item.applicantAvatar || this.item.userAvatar || this.item.ownerAvatar || this.applicant.avatar || ''
    },
    applicantLevel() {
      return this.item.applicantLevel || this.item.userLevel || this.item.level || this.applicant.level || ''
    },
    createdAtText() {
      const value = this.item.createdAtText || this.item.createdAt || this.item.date || ''
      const match = String(value).match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
      return match ? `${match[1]}.${String(match[2]).padStart(2, '0')}.${String(match[3]).padStart(2, '0')}` : value
    },
    isFinished() {
      return Boolean(this.item.done || this.item.finished || ['done', 'ended', 'finished', 'voted', 'closed'].includes(this.item.status))
    },
    statusText() {
      return this.item.statusText || (this.isFinished ? '投票结束' : '投票中')
    },
    statusTone() {
      return this.isFinished ? 'danger' : 'success'
    },
    realPercent() {
      const ratio = this.item.voteRatio || this.item.ratio || {}
      const stats = this.item.voteStats || this.item.voteStatistics || {}
      const real = clampPercent(
        ratio.real !== undefined
          ? ratio.real
          : (this.item.realPercent !== undefined
            ? this.item.realPercent
            : (stats.realPercent !== undefined ? stats.realPercent : (stats.real !== undefined ? stats.real : 50))),
        50
      )
      const fake = clampPercent(
        ratio.fake !== undefined
          ? ratio.fake
          : (this.item.fakePercent !== undefined
            ? this.item.fakePercent
            : (stats.fakePercent !== undefined ? stats.fakePercent : (stats.fake !== undefined ? stats.fake : 100 - real))),
        100 - real
      )
      const total = real + fake
      return total > 0 ? Math.round(real / total * 1000) / 10 : 50
    },
    fakePercent() {
      return Math.round((100 - this.realPercent) * 10) / 10
    },
    voteCounts() {
      return this.item.votes || this.item.voteCounts || this.item.voteStats || this.item.vote || {}
    },
    realVoteCount() {
      return this.voteCounts.real !== undefined ? this.voteCounts.real : (this.item.realVotes || 0)
    },
    fakeVoteCount() {
      return this.voteCounts.fake !== undefined ? this.voteCounts.fake : (this.item.fakeVotes || 0)
    },
    bodyText() {
      return this.item.summary || this.item.body || this.item.content || this.item.text || this.item.description || this.item.applyText || (this.item.application && this.item.application.text) || ''
    },
    normalizedEvidence() {
      const source = this.item.evidence || this.item.evidenceImages || this.item.proofImages || []
      if (!Array.isArray(source)) return []
      return source.filter(Boolean).map((entry, index) => {
        const value = typeof entry === 'string' ? { src: entry } : entry
        return {
          ...value,
          id: value.id || value.evidenceId || `${this.itemId}-evidence-${index}`,
          src: safeImgSrc(value.src || value.url || value.image || DEFAULT_EVIDENCE_IMAGE, DEFAULT_EVIDENCE_IMAGE),
          date: value.date || value.createdAt || '',
          label: value.label || value.caption || value.title || ''
        }
      })
    },
    rewardText() {
      const reward = this.item.reward
      if (!this.rewardReady) return ''
      if (typeof reward === 'string') return reward
      return this.item.rewardText || (reward && (reward.text || reward.label)) || ''
    },
    rewardReady() {
      const rewardStatus = String(this.item.rewardStatus || this.item.reward?.status || '').toLowerCase()
      return this.item.rewardIssued === true
        || ['issued', 'completed', 'finished'].includes(rewardStatus)
        || this.item.workflowStatus === 'closed'
        || this.item.status === 'closed'
    },
    evidenceStyle() {
      const value = typeof this.evidenceSize === 'number' ? `${this.evidenceSize}px` : this.evidenceSize
      return { width: value, flexBasis: value }
    },
    evidenceImageStyle() {
      const value = typeof this.evidenceSize === 'number' ? `${this.evidenceSize}px` : this.evidenceSize
      return { width: value, height: value }
    }
  },
  methods: {
    emitClick(event) {
      this.$emit('click', this.item, event)
    },
    emitIdentityClick(event) {
      this.$emit('identity-click', this.applicant, event)
    },
    emitEvidenceClick(evidence, index) {
      this.$emit('evidence-click', evidence, index, this.item)
    }
  }
}
</script>

<style scoped>
.paw-jury-item-card {
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  padding: 10px 15px 23px;
  box-sizing: border-box;
  border-radius: 9px;
  background: #fff;
}

.paw-jury-item-card--done {
  padding-bottom: 15px;
}

.paw-jury-item-card__header,
.paw-jury-item-card__identity,
.paw-jury-item-card__name-row,
.paw-jury-item-card__vote-legend,
.paw-jury-item-card__footer {
  display: flex;
  min-width: 0;
  align-items: center;
}

.paw-jury-item-card__header {
  justify-content: space-between;
  gap: 12px;
}

.paw-jury-item-card__identity {
  min-width: 0;
  flex: 1 1 auto;
  gap: 6px;
}

.paw-jury-item-card__avatar {
  flex: 0 0 41px;
}

.paw-jury-item-card__identity-copy {
  min-width: 0;
  flex: 1 1 auto;
}

.paw-jury-item-card__name-row {
  min-width: 0;
  gap: 3px;
}

.paw-jury-item-card__name {
  min-width: 0;
  overflow: hidden;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paw-jury-item-card__date {
  display: block;
  margin-top: 2px;
  color: #999;
  font-size: 12px;
  line-height: 16px;
}

.paw-jury-item-card__status {
  flex: 0 0 auto;
}

.paw-jury-item-card :deep(.paw-status) {
  font-size: 11px;
}

.paw-jury-item-card__vote {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0;
  margin-top: 7px;
}

.paw-jury-item-card__vote-legend {
  justify-content: space-between;
  gap: 12px;
}

.paw-jury-item-card__vote-side {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.paw-jury-item-card__vote-side--right {
  align-items: flex-end;
  text-align: right;
}

.paw-jury-item-card__vote-label {
  color: #333;
  font-size: 12px;
  line-height: 17px;
  white-space: nowrap;
}

.paw-jury-item-card__vote-count {
  color: #999;
  font-size: 11px;
  line-height: 15px;
  white-space: nowrap;
}

.paw-jury-item-card__body {
  display: block;
  margin-top: 8px;
  color: #333;
  font-size: 15px;
  line-height: 1.5;
  white-space: pre-line;
  word-break: break-word;
}

.paw-jury-item-card__evidence {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 4px;
  margin-top: 11px;
  justify-content: flex-start;
}

.paw-jury-item-card__evidence-item {
  display: flex;
  width: 106px;
  flex: 0 0 106px;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.paw-jury-item-card__evidence-image {
  display: block;
  width: 106px;
  height: 106px;
  border-radius: 6px;
  background: #eee;
}

.paw-jury-item-card__evidence-caption {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.paw-jury-item-card__evidence-date,
.paw-jury-item-card__evidence-label {
  color: #999;
  font-size: 11px;
  line-height: 15px;
  text-align: center;
  white-space: nowrap;
}

.paw-jury-item-card__evidence-label {
  color: #333;
}

.paw-jury-item-card__footer {
  margin-top: 11px;
  justify-content: flex-end;
}

.paw-jury-item-card__reward {
  display: flex;
  height: 20px;
  min-height: 20px;
  align-items: center;
  justify-content: center;
  padding: 0 8px 0 6px;
  box-sizing: border-box;
  border-radius: 4px;
  background: #523400;
  color: #ffdf73;
  font-size: 11px;
  line-height: 20px;
  white-space: nowrap;
}
</style>
