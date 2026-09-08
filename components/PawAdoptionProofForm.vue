<template>
  <view class="proof-page" data-qa="qa-rescue-proof-form">
    <PawPageNav title="证实信息" :title-centered="true" :background="navBackground" :fallback-url="fallbackUrl"
      :auto-back="false" @back="goBack" />
    <scroll-view class="proof-scroll" scroll-y :show-scrollbar="false" :enable-flex="true">
      <view class="proof-body">
        <text class="section-title">基本信息</text>
        <view class="form-card form-card--basic">
          <view class="form-row">
            <text class="form-label">您的姓名<text class="required">*</text></text>
            <input v-model="name" class="form-input" data-qa="qa-rescue-proof-name" placeholder="请填写您的真实姓名"
              maxlength="30" />
          </view>
          <view class="form-row">
            <text class="form-label">与申请人关系<text class="required">*</text></text>
            <input v-model="relation" class="form-input" data-qa="qa-rescue-proof-relation" placeholder="请填写您的真实姓名"
              maxlength="30" />
          </view>
        </view>

        <view class="form-card note-card">
          <textarea v-model="note" data-qa="qa-rescue-proof-note" maxlength="200" placeholder="申请人是您的...您了解的情况是..." />
          <text class="counter">{{ note.length }}/200</text>
        </view>

        <text class="section-title real-title">实名认证</text>
        <text class="real-hint">身份证信息仅用于实名认证，严格保密不会展示给其他人</text>
        <view class="form-card form-card--single">
          <view class="form-row form-row--single">
            <text class="form-label">身份证号<text class="required">*</text></text>
            <input v-model="idNo" class="form-input" data-qa="qa-rescue-proof-id" type="idcard" placeholder="请填写您的身份证号"
              maxlength="18" />
          </view>
        </view>

        <view class="notice"><uni-icons type="info" color="#999"
            :size="16" /><text>感谢您的热心参与，如果您深入了解过此申请人和动物的事件，请您如实填写真实身份、真实情况。同时提醒您，您需要对证实内容的真实性负责，如有不实，需承担相应法律责任。</text>
        </view>
        <view class="agreement" data-qa="qa-rescue-proof-agreement" @tap="agreementChecked = !agreementChecked">
          <PawCheckbox class="agreement-checkbox" :model-value="agreementChecked" size="small" inline
            @change="agreementChecked = $event" /><text>已经阅读《<text class="agreement-link">隐私政策</text>》、《<text
              class="agreement-link">用户协议</text>》和《<text class="agreement-link">证明人承诺</text>》</text>
        </view>
      </view>
    </scroll-view>
    <PawFixedActionBar :primary-full-width="true" :primary-action="submitAction" @primary="submit" />
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawFixedActionBar from '@/components/layout/PawFixedActionBar.vue'
import PawCheckbox from '@/components/base/PawCheckbox.vue'
import { goBackSmart } from '@/utils/navBack.js'
import { SELF_PAW_ID } from '@/utils/profileNav.js'
import { getRescueById, addRescueProof, hasRescueProofByUser } from '@/utils/rescueStorage.js'

export default {
  name: 'PawAdoptionProofForm',
  components: { PawPageNav, PawFixedActionBar, PawCheckbox },
  props: {
    rescueId: { type: String, default: '' }
  },
  emits: ['submitted'],
  data() {
    return { name: '', relation: '', note: '', idNo: '', agreementChecked: true }
  },
  created() {
    this.agreementChecked = true
  },
  computed: {
    navBackground() {
      return 'linear-gradient(180deg, #fffcdc 0%, #ffffff 13.225%, #f5f5f5 21.49%, #f5f5f5 100%) 0 0 / 100% 100vh no-repeat, #f5f5f5'
    },
    resolvedRescueId() { return this.rescueId },
    alreadySubmitted() {
      return this.resolvedRescueId ? hasRescueProofByUser(this.resolvedRescueId, SELF_PAW_ID) : false
    },
    fallbackUrl() {
      if (this.resolvedRescueId) return `/pages/feature/index?mode=rescue-detail&id=${encodeURIComponent(this.resolvedRescueId)}`
      return '/pages/me/index'
    },
    canSubmit() {
      return !this.alreadySubmitted && [this.name, this.relation, this.note, this.idNo].every(value => String(value || '').trim()) && this.agreementChecked
    },
    submitAction() { return { key: 'submit-proof', label: '提交', qa: 'qa-rescue-proof-submit' } }
  },
  methods: {
    goBack() { goBackSmart({ fallbackUrl: this.fallbackUrl }) },
    submit() {
      if (this.alreadySubmitted) {
        uni.showToast({ title: '已证实', icon: 'none' })
        return
      }
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
        pawId: SELF_PAW_ID,
        source: 'rescue',
        rescueId: this.resolvedRescueId
      }
      if (!this.resolvedRescueId || !getRescueById(this.resolvedRescueId)) {
        uni.showToast({ title: '救助记录不存在', icon: 'none' })
        return
      }
      const updated = addRescueProof(this.resolvedRescueId, submission)
      if (!updated || !getRescueById(this.resolvedRescueId)) {
        uni.showToast({ title: '证实信息提交失败', icon: 'none' })
        return
      }
      uni.showToast({ title: '已提交', icon: 'none' })
      this.$emit('submitted', submission)
    }
  }
}
</script>

<style scoped>
.proof-page {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  box-sizing: border-box;
  background-color: #f6f8fa;
  background-image: linear-gradient(180deg, #fffcdc 0%, #ffffff 13.225%, #f5f5f5 21.49%, #f5f5f5 100%);
  background-position: 0 0;
  background-repeat: no-repeat;
  background-size: 100% 100vh;
  color: #333
}

.proof-scroll {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box
}

.proof-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 8px 12px 112px;
  box-sizing: border-box
}

.section-title {
  display: block;
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 500
}

.form-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  padding: 8px 12px;
  border-radius: 8px;
  background: #fff
}

.form-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  padding: 19px 0;
  box-sizing: border-box;
  border-bottom: .5px solid #f6f8fa
}

.form-row--single {
  border-bottom: 0
}

.form-card--single {
  padding: 0
}

.form-card--single .form-row {
  padding: 23px 12px
}

.form-label {
  flex: 0 0 auto;
  color: #282827;
  font-size: 14px;
  line-height: 20px;
  white-space: nowrap
}

.required {
  color: #ff3449
}

.form-input {
  flex: 1 1 auto;
  min-width: 0;
  text-align: right;
  color: #333;
  font-size: 14px;
  line-height: 20px
}

.note-card {
  position: relative;
  min-width: 0;
  flex: 0 1 auto;
  padding: 0;
  margin: 10px 0 0;
  border-radius: 9px;
  box-shadow: 0 -1px 4px rgba(0, 0, 0, .05)
}

.note-card textarea {
  display: block;
  min-width: 0;
  flex: 1 1 auto;
  padding: 12px;
  box-sizing: border-box;
  color: #929296;
  font-size: 14px;
  line-height: 21px
}

.counter {
  position: absolute;
  right: 10px;
  bottom: 10px;
  color: #aaa;
  font-size: 12px
}

.real-title {
  margin: 18px 0 4px
}

.real-hint {
  display: block;
  margin: 0 0 12px;
  color: #ee8002;
  font-size: 12px
}

.notice {
  display: flex;
  min-width: 0;
  gap: 6px;
  margin: 10px 0 0;
  color: #999
}

.notice>text {
  min-width: 0;
  flex: 1 1 auto;
  font-size: 12px;
  line-height: 18px
}

.agreement {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  margin: 14px 0 0;
  color: #666
}

.agreement>text {
  min-width: 0;
  flex: 1 1 auto;
  font-size: 12px;
  line-height: 16px
}

.agreement-link {
  color: #3978db
}
</style>
