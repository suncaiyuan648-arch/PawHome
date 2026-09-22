<template>
  <view class="proof-form" data-qa="qa-rescue-proof-form">
    <PawPageNav title="证实信息" :title-centered="true" :background="navBackground" :fallback-url="fallbackUrl" />
    <scroll-view class="proof-form__scroll" scroll-y :show-scrollbar="false" :enable-flex="true">
      <template v-if="record">
        <view class="proof-form__body">
          <text class="section-title">基本信息</text>
          <view class="form-card">
            <view class="form-row">
              <text class="form-label">您的姓名<text class="required">*</text></text>
              <input v-model="name" class="form-input" data-qa="qa-rescue-proof-name" placeholder="请填写您的真实姓名" maxlength="30" />
            </view>
            <view class="form-row">
              <text class="form-label">与申请人关系<text class="required">*</text></text>
              <input v-model="relation" class="form-input" data-qa="qa-rescue-proof-relation" placeholder="请填写您与申请人的关系" maxlength="30" />
            </view>
          </view>

          <view class="form-card form-card--note">
            <textarea v-model="note" data-qa="qa-rescue-proof-note" maxlength="200" placeholder="申请人是您的……您了解的情况是……" />
            <text class="counter">{{ note.length }}/200</text>
          </view>

          <text class="section-title real-title">实名认证</text>
          <text class="real-hint">身份证信息仅用于实名认证，严格保密不会展示给其他人</text>
          <view class="form-card">
            <view class="form-row">
              <text class="form-label">身份证号<text class="required">*</text></text>
              <input v-model="idNo" class="form-input" data-qa="qa-rescue-proof-id" type="idcard" placeholder="请填写您的身份证号" maxlength="18" />
            </view>
          </view>

          <view class="notice"><PawIcon name="navigation/clock-disabled" :size="16" color="#999" label="提示" /><text>请如实填写您了解的救助情况，并对证实内容的真实性负责。</text></view>
          <view class="agreement" data-qa="qa-rescue-proof-agreement" @tap="agreementChecked = !agreementChecked">
            <PawCheckbox class="agreement-checkbox" :model-value="agreementChecked" size="small" inline @change="agreementChecked = $event" />
            <text>已经阅读《<text class="agreement-link">隐私政策</text>》、《<text class="agreement-link">用户协议</text>》和《<text class="agreement-link">证明人承诺</text>》</text>
          </view>
        </view>
      </template>
      <view v-else class="proof-form__state" data-qa="qa-rescue-proof-form-empty">
        <PawIcon name="navigation/clock-disabled" :size="22" color="#999" label="证实表单不可用" />
        <text>{{ emptyCopy }}</text>
        <text class="proof-form__state-hint">请从救助详情重新打开证实表单。</text>
      </view>
    </scroll-view>
    <PawFixedActionBar v-if="record" :primary-full-width="true" :primary-action="submitAction" @primary="submit" />
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawFixedActionBar from '@/components/layout/PawFixedActionBar.vue'
import PawCheckbox from '@/components/base/PawCheckbox.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import { buildRoute } from '@/navigation/routeContracts.js'
import { submitRescueProof, validateProofInput } from '../services/proof.js'

export default {
  name: 'RescueProofForm',
  components: { PawPageNav, PawFixedActionBar, PawCheckbox, PawIcon },
  props: {
    record: { type: Object, default: null },
    loadState: { type: String, default: 'idle' },
    rescueId: { type: String, default: '' }
  },
  emits: ['submitted'],
  data() { return { name: '', relation: '', note: '', idNo: '', agreementChecked: false, submitting: false } },
  computed: {
    navBackground() { return 'linear-gradient(180deg, #fffcdc 0%, #ffffff 13.225%, #f5f5f5 21.49%, #f5f5f5 100%)' },
    fallbackUrl() {
      try { return buildRoute('rescue.detail', { rescueId: this.rescueId }) } catch (error) { return '/pages/me/index' }
    },
    validFields() { return validateProofInput({ name: this.name, relation: this.relation, note: this.note, idNo: this.idNo, agreementChecked: this.agreementChecked }).ok },
    submitAction() {
      return { key: 'submit-proof', label: '提交', qa: 'qa-rescue-proof-submit', disabled: !this.validFields || this.submitting }
    },
    emptyCopy() {
      if (this.loadState === 'missing-id') return '缺少救助单 ID'
      if (this.loadState === 'invalid-params') return '救助单 ID 无效'
      if (this.loadState === 'not-found') return '找不到这条救助记录'
      return '证实表单暂不可用'
    }
  },
  methods: {
    submit() {
      if (this.submitting) return
      const validation = validateProofInput({ name: this.name, relation: this.relation, note: this.note, idNo: this.idNo, agreementChecked: this.agreementChecked })
      if (!validation.ok) { uni.showToast({ title: validation.message, icon: 'none' }); return }
      this.submitting = true
      const result = submitRescueProof(this.rescueId, validation.value)
      this.submitting = false
      if (!result.ok) { uni.showToast({ title: result.message, icon: 'none' }); return }
      uni.showToast({ title: result.duplicate ? '你已经证实过这条救助' : '证实信息已提交', icon: 'none' })
      this.$emit('submitted', { duplicate: result.duplicate, record: result.record })
    }
  }
}
</script>

<style scoped>
.proof-form { display: flex; width: 100%; height: 100vh; min-height: 100vh; flex-direction: column; background: #f5f5f5; color: #333; }
.proof-form__scroll { min-height: 0; flex: 1 1 auto; box-sizing: border-box; padding-bottom: 100px; }
.proof-form__body { padding: 0 15px 24px; }
.section-title { display: block; margin: 15px 4px 9px; color: #333; font-size: 15px; line-height: 21px; }
.form-card { margin-top: 10px; padding: 0 15px; border-radius: 9px; background: #fff; }
.form-row { display: flex; min-height: 53px; align-items: center; border-bottom: .5px solid #eee; }
.form-row:last-child { border-bottom: 0; }
.form-label { width: 112px; flex: 0 0 112px; color: #555; font-size: 14px; line-height: 20px; }
.required { margin-left: 2px; color: #ff3d48; }
.form-input { min-width: 0; flex: 1 1 auto; color: #333; font-size: 14px; line-height: 20px; }
.form-card--note { position: relative; height: 155px; padding: 11px 15px; box-sizing: border-box; }
.form-card--note textarea { width: 100%; height: 100%; box-sizing: border-box; color: #555; font-size: 14px; line-height: 21px; }
.counter { position: absolute; right: 13px; bottom: 10px; color: #aaa; font-size: 12px; line-height: 17px; }
.real-title { margin-top: 22px; }
.real-hint { display: block; margin: 0 4px; color: #999; font-size: 12px; line-height: 17px; }
.notice { display: flex; align-items: flex-start; gap: 5px; margin: 16px 4px 0; color: #999; font-size: 12px; line-height: 18px; }
.notice :deep(.paw-icon) { flex: 0 0 16px; margin-top: 1px; }
.agreement { display: flex; align-items: center; margin: 14px 4px 0; color: #888; font-size: 12px; line-height: 18px; }
.agreement-checkbox { flex: 0 0 28px; margin-right: 2px; }
.agreement-link { color: #555; }
.proof-form__state { display: flex; min-height: 360px; flex-direction: column; align-items: center; justify-content: center; gap: 9px; color: #888; font-size: 14px; line-height: 20px; text-align: center; }
.proof-form__state-hint { color: #aaa; font-size: 12px; }
</style>
