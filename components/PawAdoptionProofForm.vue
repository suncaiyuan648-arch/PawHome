<template>
  <view class="proof-page" :data-qa="isRescue ? 'qa-rescue-proof-form' : 'qa-adoption-proof-form'">
    <PawPageNav :title="isRescue ? '我也来证实' : '证实领养'" :fallback-url="fallbackUrl" :auto-back="false" @back="goBack" />
    <scroll-view class="proof-scroll" scroll-y :show-scrollbar="false">
      <view class="proof-body">
        <text class="section-title">基本信息</text>
        <view class="form-card">
          <view class="form-row">
            <text class="form-label">您的姓名<text class="required">*</text></text>
            <input v-model="name" class="form-input" data-qa="qa-rescue-proof-name" placeholder="请填写您的真实姓名"
              maxlength="30" />
          </view>
          <view class="form-row">
            <text class="form-label">与申请人关系<text class="required">*</text></text>
            <input v-model="relation" class="form-input" data-qa="qa-rescue-proof-relation" placeholder="请填写您与申请人的关系"
              maxlength="30" />
          </view>
        </view>

        <view class="form-card note-card">
          <textarea v-model="note" data-qa="qa-rescue-proof-note" maxlength="200" placeholder="申请人是您的……您了解的情况是……" />
          <text class="counter">{{ note.length }}/200</text>
        </view>

        <text class="section-title real-title">实名认证</text>
        <text class="real-hint">身份证信息仅用于实名认证，严格保密不会展示给其他人</text>
        <view class="form-card">
          <view class="form-row form-row--single">
            <text class="form-label">身份证号<text class="required">*</text></text>
            <input v-model="idNo" class="form-input" data-qa="qa-rescue-proof-id" type="idcard" placeholder="请填写您的身份证号"
              maxlength="18" />
          </view>
        </view>

        <view class="notice"><uni-icons type="info" color="#999"
            :size="13" /><text>感谢您的热心参与，如果您深入了解过此申请人和动物的事件，请您如实填写真实身份、真实情况。同时提醒您，您需要对证实内容的真实性负责，如有不实，需承担相应法律责任。</text>
        </view>
        <view class="agreement" data-qa="qa-rescue-proof-agreement" @tap="agreementChecked = !agreementChecked">
          <uni-icons :type="agreementChecked ? 'checkbox-filled' : 'circle'"
            :color="agreementChecked ? '#ffe000' : '#999'" :size="14" /><text>已经阅读《<text
              class="agreement-link">隐私政策</text>》、《<text class="agreement-link">用户协议</text>》和《<text
              class="agreement-link">证明人承诺</text>》</text></view>
      </view>
    </scroll-view>
    <PawFixedActionBar :primary-action="submitAction" @primary="submit" />
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawFixedActionBar from '@/components/layout/PawFixedActionBar.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { getAdoptionById, updateAdoption } from '@/utils/adoptionStorage.js'
import { getRescueById, addRescueProof } from '@/utils/rescueStorage.js'

export default {
  name: 'PawAdoptionProofForm',
  components: { PawPageNav, PawFixedActionBar },
  props: {
    recordId: { type: String, default: '' },
    source: { type: String, default: '' },
    sourceType: { type: String, default: 'adoption' },
    rescueId: { type: String, default: '' }
  },
  emits: ['submitted'],
  data() {
    return { name: '', relation: '', note: '', idNo: '', agreementChecked: false }
  },
  created() {
    this.agreementChecked = !this.isRescue
  },
  computed: {
    contextType() {
      const source = this.source || this.sourceType
      return source === 'rescue' ? 'rescue' : 'adoption'
    },
    isRescue() { return this.contextType === 'rescue' },
    resolvedRescueId() { return this.rescueId || this.recordId },
    fallbackUrl() {
      if (this.isRescue && this.resolvedRescueId) return `/pages/feature/index?mode=rescue-detail&id=${encodeURIComponent(this.resolvedRescueId)}`
      return '/pages/me/index'
    },
    canSubmit() { return [this.name, this.relation, this.note, this.idNo].every(value => String(value || '').trim()) && (!this.isRescue || this.agreementChecked) },
    submitAction() { return { key: 'submit-proof', label: '提交', qa: this.isRescue ? 'qa-rescue-proof-submit' : 'qa-adoption-proof-submit', disabled: !this.canSubmit } }
  },
  methods: {
    goBack() { goBackSmart({ fallbackUrl: this.fallbackUrl }) },
    submit() {
      if (!this.canSubmit) {
        uni.showToast({ title: '请完整填写证实信息并同意相关协议', icon: 'none' })
        return
      }
      const submission = {
        id: 'proof-' + Date.now(),
        name: this.name.trim(),
        relation: this.relation.trim(),
        note: this.note.trim(),
        idLast4: this.idNo.trim().slice(-4),
        createdAt: Date.now(),
        source: this.contextType,
        rescueId: this.isRescue ? this.resolvedRescueId : ''
      }
      if (this.isRescue) {
        if (!this.resolvedRescueId || !getRescueById(this.resolvedRescueId)) {
          uni.showToast({ title: '救助记录不存在', icon: 'none' })
          return
        }
        const updated = addRescueProof(this.resolvedRescueId, submission)
        if (!updated || !getRescueById(this.resolvedRescueId)) {
          uni.showToast({ title: '证实信息提交失败', icon: 'none' })
          return
        }
      } else {
        const record = this.recordId ? getAdoptionById(this.recordId) : null
        if (record && this.recordId) {
          const proofSubmissions = Array.isArray(record.proofSubmissions) ? record.proofSubmissions : []
          updateAdoption(this.recordId, { proofSubmissions: [...proofSubmissions, submission] })
        }
      }
      uni.showToast({ title: '已提交', icon: 'none' })
      this.$emit('submitted', submission)
    }
  }
}
</script>

<style scoped>
.proof-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f3f3f3;
  color: #333
}

.proof-scroll {
  flex: 1;
  min-height: 0
}

.proof-body {
  padding: 8px 12px 112px;
  box-sizing: border-box
}

.section-title {
  display: block;
  margin: 0 2px 14px;
  font-size: 15px;
  font-weight: 500
}

.form-card {
  overflow: hidden;
  border-radius: 10px;
  background: #fff
}

.form-row {
  display: flex;
  align-items: center;
  min-height: 64px;
  padding: 0 12px;
  box-sizing: border-box;
  border-bottom: 1px solid #f1f1f1
}

.form-row--single {
  border-bottom: 0
}

.form-label {
  flex: 0 0 150px;
  font-size: 13px
}

.required {
  color: #ff3449
}

.form-input {
  flex: 1;
  min-width: 0;
  text-align: right;
  font-size: 13px;
  color: #333
}

.note-card {
  position: relative;
  height: 163px;
  margin-top: 10px
}

.note-card textarea {
  width: 100%;
  height: 100%;
  padding: 12px;
  box-sizing: border-box;
  font-size: 15px
}

.counter {
  position: absolute;
  right: 10px;
  bottom: 10px;
  color: #aaa;
  font-size: 12px
}

.real-title {
  margin-top: 18px;
  margin-bottom: 4px
}

.real-hint {
  display: block;
  margin: 0 2px 12px;
  color: #ff7b2f;
  font-size: 12px
}

.notice {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  color: #999
}

.notice>text {
  flex: 1;
  font-size: 11px;
  line-height: 15px
}

.agreement {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 14px 8px 0;
  color: #666
}

.agreement>text {
  flex: 1;
  font-size: 11px;
  line-height: 16px
}

.agreement-link {
  color: #3978db
}
</style>
