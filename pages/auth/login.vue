<template>
  <view class="login-page paw-page">
    <PawPageNav background="#ffffff" />
    <view class="brand-block">
      <image class="brand-logo" :src="brandLogo" mode="aspectFill" />
      <text class="brand-slogan">让每一次相逢都有意义</text>
    </view>
    <view class="login-actions paw-safe-bottom">
      <PawPrimaryButton variant="wechat" @click="onWechatLogin"><uni-icons type="weixin" color="#ffffff" :size="18" /><text class="button-icon-label">微信登录</text></PawPrimaryButton>
      <view class="action-gap" />
      <PawPrimaryButton variant="secondary" @click="onPhoneLogin"><uni-icons type="phone" color="#333333" :size="17" /><text class="button-icon-label">手机号登录</text></PawPrimaryButton>
      <view class="agreement-row" role="checkbox" :aria-checked="agreed" @click="toggleAgree">
        <view class="agreement-check" :class="{ 'agreement-check--active': agreed }"><text v-if="agreed">✓</text></view>
        <text class="agreement-copy">已阅读并同意</text>
        <text class="agreement-link" @click.stop="openPolicy">《隐私政策》</text>
        <text class="agreement-copy">和</text>
        <text class="agreement-link" @click.stop="openPolicy">《用户协议》</text>
      </view>
    </view>
    <view v-if="showAgreementDialog" class="dialog-mask" @click="showAgreementDialog = false">
      <view class="agreement-dialog" @click.stop>
        <text class="dialog-title">隐私政策及用户协议</text>
        <text class="dialog-copy">请先阅读并同意《隐私政策》和《用户协议》后继续登录。</text>
        <view class="dialog-actions">
          <view class="dialog-action dialog-action--cancel" @click="showAgreementDialog = false">暂不同意</view>
          <view class="dialog-action dialog-action--confirm" @click="agreeAndClose">同意并继续</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import PawPageNav from '@/components/PawPageNav.vue'
import PawPrimaryButton from '@/components/PawPrimaryButton.vue'

export default {
  components: { PawPageNav, PawPrimaryButton },
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
      setTimeout(() => uni.navigateBack(), 300)
    },
    goPhoneLogin() { uni.navigateTo({ url: '/pages/auth/bindPhone' }) }
  }
}
</script>

<style scoped>
.login-page { position: relative; height: 100vh; overflow: hidden; background: #ffffff; }
.brand-block { display: flex; flex-direction: column; align-items: center; margin-top: 136rpx; }
.brand-logo { width: 150rpx; height: 150rpx; border-radius: 24rpx; }
.brand-slogan { margin-top: 24rpx; color: #333333; font-size: 24rpx; line-height: 34rpx; }
.login-actions { position: fixed; right: 48rpx; bottom: calc(312rpx + env(safe-area-inset-bottom)); left: 48rpx; }
.action-gap { height: 36rpx; }
.agreement-row { display: flex; align-items: center; justify-content: flex-start; min-height: 64rpx; margin-top: 34rpx; padding-left: 96rpx; }
.agreement-check { display: flex; align-items: center; justify-content: center; width: 22rpx; height: 22rpx; margin-right: 8rpx; box-sizing: border-box; border: 2rpx solid #b5b5b5; border-radius: 50%; color: #111111; font-size: 16rpx; }
.agreement-check--active { border-color: #ffdd00; background: #ffdd00; }
.agreement-copy, .agreement-link { font-size: 20rpx; line-height: 30rpx; }
.agreement-copy { color: #999999; }
.agreement-link { color: #5e87cb; }
.agreement-row>.agreement-copy,.agreement-row>.agreement-link { display: none; }
.button-icon-label { margin-left: 8rpx; }
.dialog-mask { position: fixed; inset: 0; z-index: 99; display: flex; align-items: center; justify-content: center; padding: 40rpx; box-sizing: border-box; background: rgba(0, 0, 0, 0.45); }
.agreement-dialog { width: 100%; overflow: hidden; border-radius: 28rpx; background: #ffffff; }
.dialog-title { display: block; padding: 42rpx 32rpx 20rpx; color: #222222; font-size: 34rpx; font-weight: 500; text-align: center; }
.dialog-copy { display: block; padding: 0 40rpx 36rpx; color: #666666; font-size: 26rpx; line-height: 40rpx; text-align: center; }
.dialog-actions { display: flex; border-top: 1rpx solid #eeeeee; }
.dialog-action { display: flex; flex: 1; align-items: center; justify-content: center; min-height: 92rpx; font-size: 28rpx; }
.dialog-action--cancel { color: #888888; }
.dialog-action--confirm { background: #ffdd00; color: #111111; font-weight: 500; }
</style>
