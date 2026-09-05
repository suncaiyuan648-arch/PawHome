<template>
  <PawDialog :model-value="modelValue" variant="jury-vote-result" :show-cancel="true" cancel-text="返回"
    :confirm-text="primaryText" :auto-close="false" :close-on-mask="closeOnMask" :z-index="zIndex"
    @update:model-value="onDialogValueChange" @confirm="onNext" @cancel="onBack" @after-open="$emit('after-open')"
    @after-close="$emit('after-close')">
    <view class="paw-jury-vote-dialog" data-qa="qa-jury-vote-dialog" @tap.stop>
      <view class="paw-jury-vote-dialog__main">
        <PawIcon class="paw-jury-vote-dialog__result-icon" :name="resultIcon" :size="60"
          :label="selectedVote === 'fake' ? '有点假' : '挺真实'" />
        <text class="paw-jury-vote-dialog__title">{{ title }}</text>

        <view class="paw-jury-vote-dialog__vote-summary" data-qa="qa-jury-vote-summary">
          <PawVoteRatioBar :real-percent="displayRealPercent" :fake-percent="displayFakePercent"
            :real-label="`${displayRealPercent}%`" :fake-label="`${displayFakePercent}%`" :height="30" />

          <view class="paw-jury-vote-dialog__legend">
            <view class="paw-jury-vote-dialog__legend-side">
              <text class="paw-jury-vote-dialog__legend-label">挺真实{{ selectedVote === 'real' ? '(已选)' : '' }}</text>
              <text class="paw-jury-vote-dialog__legend-count">{{ realVoteCount }}人投票</text>
            </view>
            <view class="paw-jury-vote-dialog__legend-side paw-jury-vote-dialog__legend-side--right">
              <text class="paw-jury-vote-dialog__legend-label">有点假{{ selectedVote === 'fake' ? '(已选)' : '' }}</text>
              <text class="paw-jury-vote-dialog__legend-count">{{ fakeVoteCount }}人投票</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </PawDialog>
</template>

<script>
import PawDialog from '@/components/overlay/PawDialog.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawVoteRatioBar from '@/components/PawVoteRatioBar.vue'

function clampPercent(value, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(0, Math.min(100, number))
}

export default {
  name: 'PawJuryVoteDialog',
  components: { PawDialog, PawIcon, PawVoteRatioBar },
  props: {
    modelValue: { type: Boolean, default: false },
    selectedVote: {
      type: String,
      default: 'real',
      validator: value => ['real', 'fake'].includes(value)
    },
    realPercent: { type: Number, default: 50 },
    fakePercent: { type: Number, default: 50 },
    realVoteCount: { type: [Number, String], default: 32 },
    fakeVoteCount: { type: [Number, String], default: 32 },
    title: { type: String, default: '投票成功' },
    primaryText: { type: String, default: '好的' },
    closeOnMask: { type: Boolean, default: true },
    safeArea: { type: Boolean, default: true },
    height: { type: [String, Number], default: 'calc(266px + env(safe-area-inset-bottom))' },
    zIndex: { type: [String, Number], default: 10020 }
  },
  emits: ['update:modelValue', 'close', 'back', 'next', 'after-open', 'after-close'],
  data() {
    return { pendingCloseReason: '' }
  },
  computed: {
    resultIcon() {
      return this.selectedVote === 'fake' ? 'status/jury-fake' : 'status/jury-real'
    },
    normalizedPercentages() {
      const real = clampPercent(this.realPercent, 50)
      const fake = clampPercent(this.fakePercent, 50)
      const total = real + fake
      if (total <= 0) return { real: 50, fake: 50 }
      return {
        real: Math.round(real / total * 1000) / 10,
        fake: Math.round(fake / total * 1000) / 10
      }
    },
    displayRealPercent() {
      return this.normalizedPercentages.real
    },
    displayFakePercent() {
      return Math.round((100 - this.displayRealPercent) * 10) / 10
    },
    resultPayload() {
      return {
        vote: this.selectedVote,
        realPercent: this.displayRealPercent,
        fakePercent: this.displayFakePercent,
        realVoteCount: this.realVoteCount,
        fakeVoteCount: this.fakeVoteCount
      }
    }
  },
  methods: {
    onDialogValueChange(value) {
      this.$emit('update:modelValue', value)
      if (!value) {
        const reason = this.pendingCloseReason || 'mask'
        this.pendingCloseReason = ''
        this.$emit('close', { reason, ...this.resultPayload })
      }
    },
    onBack() {
      this.pendingCloseReason = 'back'
      this.$emit('back', this.resultPayload)
    },
    onNext() {
      this.$emit('next', this.resultPayload)
      this.$emit('update:modelValue', false)
      this.$emit('close', { reason: 'next', ...this.resultPayload })
    }
  }
}
</script>

<style scoped>
.paw-jury-vote-dialog {
  display: flex;
  width: 100%;
  max-width: none;
  min-height: 0;
  flex-direction: column;
  overflow: visible;
  box-sizing: border-box;
  border-radius: 0;
  background: transparent;
}

.paw-jury-vote-dialog__main {
  display: flex;
  min-height: 0;
  flex-direction: column;
  align-items: center;
  padding: 29px 23px 24px;
  box-sizing: border-box;
}

.paw-jury-vote-dialog__result-icon {
  display: block;
  flex: 0 0 60px;
}

.paw-jury-vote-dialog__title {
  margin-top: 13px;
  color: #000;
  font-size: 18px;
  font-weight: 700;
  line-height: 25px;
  white-space: nowrap;
}

.paw-jury-vote-dialog__vote-summary {
  display: flex;
  width: 100%;
  min-width: 0;
  margin-top: 32px;
  flex-direction: column;
  gap: 5px;
}

.paw-jury-vote-dialog__legend {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.paw-jury-vote-dialog__legend-side {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.paw-jury-vote-dialog__legend-side--right {
  align-items: flex-end;
  text-align: right;
}

.paw-jury-vote-dialog__legend-label {
  color: #333;
  font-size: 12px;
  line-height: 17px;
  white-space: nowrap;
}

.paw-jury-vote-dialog__legend-count {
  color: #999;
  font-size: 11px;
  line-height: 15px;
  white-space: nowrap;
}
</style>
