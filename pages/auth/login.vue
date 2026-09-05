<template>
  <view class="login-page paw-page">
    <PawPageNav background="#ffffff" />
    <view class="login-body">
      <view class="brand-block">
        <image class="brand-logo" :src="brandLogo" mode="aspectFill" />
        <text class="brand-slogan">让每一次相逢都有意义</text>
      </view>
      <view class="login-actions">
        <PawPrimaryButton variant="wechat" size="lg" qa="qa-login-wechat" @click="onWechatLogin">
          <PawIcon class="button-icon" name="brand/login-wechat" :size="20" label="微信" />
          <text class="button-icon-label">微信登录</text>
        </PawPrimaryButton>
        <view class="action-gap" />
        <PawPrimaryButton variant="secondary" size="lg" qa="qa-login-phone" @click="onPhoneLogin">
          <PawIcon class="button-icon" name="actions/login-phone" :size="20" label="手机号" />
          <text class="button-icon-label">手机号登录</text>
        </PawPrimaryButton>
        <view class="agreement-row" @tap="toggleAgree">
          <PawCheckbox v-model="agreed" size="small" />
          <text class="agreement-copy">已阅读并同意</text>
          <text class="agreement-link" @tap.stop="openPolicy">《隐私政策》</text>
          <text class="agreement-copy">和</text>
          <text class="agreement-link" @tap.stop="openPolicy">《用户协议》</text>
        </view>
      </view>
    </view>
    <view v-if="showAgreementDialog" class="dialog-mask" @tap="showAgreementDialog = false">
      <view class="agreement-dialog" @tap.stop>
        <text class="dialog-title">隐私政策及用户协议</text>
        <text class="dialog-copy">请先阅读并同意《隐私政策》和《用户协议》后继续登录。</text>
        <view class="dialog-actions">
          <view class="dialog-action dialog-action--cancel" @tap="showAgreementDialog = false">暂不同意</view>
          <view class="dialog-action dialog-action--confirm" @tap="agreeAndClose">同意并继续</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawPrimaryButton from '@/components/PawPrimaryButton.vue'
import PawCheckbox from '@/components/base/PawCheckbox.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import { goBackSmart } from '@/utils/navBack.js'

export default {
  components: { PawPageNav, PawPrimaryButton, PawCheckbox, PawIcon },
  data() { return { brandLogo: '/static/figma/brand-logo.png', agreed: false, showAgreementDialog: false, pendingAction: '' } },
  methods: {
    toggleAgree() { this.agreed = !this.agreed },
    openPolicy() { this.showAgreementDialog = true },
    agreeAndClose() {
      this.agreed = true
      this.showAgreementDialog = false
      const action = this.pendingAction
      this.pendingAction = ''
      if (action === 'wechat') this.loginByWechat()
      if (action === 'phone') this.goPhoneLogin()
    },
    requireAgreement(action) {
      if (this.agreed) return true
      this.pendingAction = action
      this.showAgreementDialog = true
      return false
    },
    onWechatLogin() { if (this.requireAgreement('wechat')) this.loginByWechat() },
    onPhoneLogin() { if (this.requireAgreement('phone')) this.goPhoneLogin() },
    loginByWechat() {
      uni.setStorageSync('PAWHOME_LOGGED_IN', '1')
      uni.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => goBackSmart({ fallbackUrl: '/pages/index/index' }), 300)
    },
    goPhoneLogin() { uni.navigateTo({ url: '/pages/auth/bindPhone' }) }
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #ffffff;
  box-sizing: border-box;
}

.login-body {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  flex-direction: column;
  align-items: center;
  padding: 72px 24px 0;
  box-sizing: border-box;
}

.brand-block {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.brand-logo {
  display: block;
  flex: 0 0 75px;
  width: 75px;
  height: 75px;
  border-radius: 15px;
}

.brand-slogan {
  margin-top: 12px;
  color: #333333;
  font-size: 13px;
  line-height: 18px;
}

.login-actions {
  display: flex;
  width: 100%;
  flex-direction: column;
  margin-top: auto;
  padding-bottom: calc(159px + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.action-gap {
  flex: 0 0 20px;
  height: 20px;
}

.agreement-row {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  margin-top: 30px;
  white-space: nowrap;
}

.agreement-copy,
.agreement-link {
  font-size: 12px;
  line-height: 18px;
}

.agreement-copy {
  color: #999999;
}

.agreement-link {
  color: #5e87cb;
}

.agreement-row .paw-checkbox {
  margin-right: 4px;
}

.button-icon {
  flex: 0 0 20px;
}

.button-icon-label {
  margin-left: 4px;
  line-height: 20px;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 99;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.45);
}

.agreement-dialog {
  width: 100%;
  max-width: 327px;
  overflow: hidden;
  border-radius: 15px;
  background: #ffffff;
}

.dialog-title {
  display: block;
  padding: 24px 20px 12px;
  color: #222222;
  font-size: 17px;
  font-weight: 500;
  line-height: 24px;
  text-align: center;
}

.dialog-copy {
  display: block;
  padding: 0 24px 24px;
  color: #666666;
  font-size: 13px;
  line-height: 20px;
  text-align: center;
}

.dialog-actions {
  display: flex;
  border-top: 1px solid #eeeeee;
}

.dialog-action {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  font-size: 14px;
}

.dialog-action--cancel {
  color: #888888;
}

.dialog-action--confirm {
  background: #ffdd00;
  color: #111111;
  font-weight: 500;
}
</style>
