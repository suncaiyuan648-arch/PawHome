<template>
  <PawBottomSheet v-model="visibleProxy" variant="reward-address" height="495px" :close-on-mask="true"
    :safe-area="false" :z-index="10060" @after-close="$emit('closed')">
    <view class="reward-order-sheet" data-qa="qa-adoption-reward-sheet" @tap.stop>
      <view class="reward-order-sheet__header">
        <view class="reward-order-sheet__header-spacer" />
        <view class="reward-order-sheet__close" data-qa="qa-reward-sheet-close" @tap="close">
          <PawIcon name="navigation/close" :size="16" label="关闭" />
        </view>
      </view>

      <view class="reward-order-sheet__copy">
        <text class="reward-order-sheet__eyebrow">百位审查官中超90%认为您的领养为真</text>
        <text class="reward-order-sheet__headline">恭喜您，抽中[逢猫]猫粮5斤!</text>
      </view>

      <text class="reward-order-sheet__section-title">填写您的收货地址</text>
      <PawAddressPickerCard :address="selectedAddress" kind="shipping" :use-default-address="false"
        :return-url="returnUrl" title="请填写收货地址，用于接收奖励" background-color="#f7f7f7" @select="onAddressSelected" />
      <text class="reward-order-sheet__hint">提交后地址不可修改，请谨慎填写</text>

      <view class="reward-order-sheet__submit" data-qa="qa-reward-sheet-submit"
        :class="{ disabled: !selectedAddress || submitting }" @tap="submit">
        <text>提交订单</text>
      </view>
    </view>
  </PawBottomSheet>
</template>

<script>
import PawBottomSheet from '@/components/overlay/PawBottomSheet.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawAddressPickerCard from '@/components/address/PawAddressPickerCard.vue'
import { advanceApplication, createRewardOrder, getApplication } from '@/utils/applicationMockApi.js'
import { buildRoute } from '@/navigation/routeContracts.js'

export default {
  name: 'PawRewardOrderSheet',
  components: { PawBottomSheet, PawIcon, PawAddressPickerCard },
  props: {
    modelValue: { type: Boolean, default: false },
    recordId: { type: String, default: '' }
  },
  emits: ['update:modelValue', 'submitted', 'closed'],
  data() {
    return { selectedAddress: null, selectedAddressId: '', submitting: false }
  },
  computed: {
    visibleProxy: {
      get() { return this.modelValue },
      set(value) { this.$emit('update:modelValue', value) }
    },
    resolvedRecordId() { return String(this.recordId || '') },
    returnUrl() {
      const pages = getCurrentPages()
      const page = pages && pages[pages.length - 1]
      const route = page && page.route
      return route
        ? `/${route}`
        : (this.resolvedRecordId
          ? buildRoute('adoption.progress', { applicationId: this.resolvedRecordId })
          : '/packages/adoption/pages/mine/index')
    }
  },
  watch: {
    modelValue(value) {
      if (value) this.loadAddress()
    },
    recordId() { this.loadAddress() }
  },
  created() { this.loadAddress() },
  methods: {
    actorProvider() {
      try { return typeof uni !== 'undefined' && uni && typeof uni.getStorageSync === 'function' ? uni.getStorageSync('PAWHOME_ACTOR_SESSION') : null } catch (error) { return null }
    },
    loadAddress() {
      const applicationResult = this.resolvedRecordId
        ? getApplication('adoption', this.resolvedRecordId, { actorProvider: () => this.actorProvider(), requireActor: true })
        : null
      const application = applicationResult && applicationResult.success ? applicationResult.data : null
      const saved = application && application.rewardAddress
      this.selectedAddress = saved || null
      this.selectedAddressId = this.selectedAddress && this.selectedAddress.id ? String(this.selectedAddress.id) : ''
    },
    onAddressSelected(address) {
      if (!address || !address.id) return
      this.selectedAddress = { ...address, id: String(address.id) }
      this.selectedAddressId = String(address.id)
    },
    close() { this.visibleProxy = false },
    submit() {
      if (!this.selectedAddress || this.submitting) {
        if (!this.selectedAddress) uni.showToast({ title: '请先填写收货地址', icon: 'none' })
        return
      }
      const id = this.resolvedRecordId
      if (!id) {
        uni.showToast({ title: '缺少领养单 ID', icon: 'none' })
        return
      }
      this.submitting = true

      const actorOptions = { actorProvider: () => this.actorProvider() }
      const currentResult = getApplication('adoption', id, { ...actorOptions, requireActor: true })
      if (!currentResult.success) return this.fail(currentResult.error && currentResult.error.message)
      const current = currentResult.data
      if (current && current.status === 'adoption_confirmed') {
        const started = advanceApplication('adoption', id, 'reward', { rewardStartedAt: Date.now() }, actorOptions)
        if (!started.success) return this.fail(started.error && started.error.message)
      }

      const order = createRewardOrder(id, this.selectedAddress, actorOptions)
      if (!order.success) return this.fail(order.error && order.error.message)
      const result = advanceApplication('adoption', id, 'reward_done', {
        rewardAddress: { ...this.selectedAddress },
        rewardOrderId: order.data.id,
        rewardOrderSubmittedAt: Date.now()
      }, actorOptions)
      if (!result.success) return this.fail(result.error && result.error.message)

      this.submitting = false
      this.$emit('submitted', { order: order.data, record: result.data, recordId: id })
      this.visibleProxy = false
    },
    fail(message) {
      this.submitting = false
      uni.showToast({ title: message || '提交订单失败', icon: 'none' })
    }
  }
}
</script>

<style scoped>
.reward-order-sheet {
  display: flex;
  width: 100%;
  height: 495px;
  flex-direction: column;
  box-sizing: border-box;
  padding: 0 10px 43px;
}

.reward-order-sheet__header {
  display: flex;
  height: 45px;
  flex: 0 0 45px;
  align-items: center;
  justify-content: space-between;
}

.reward-order-sheet__header-spacer,
.reward-order-sheet__close {
  width: 32px;
  height: 32px;
}

.reward-order-sheet__close {
  display: flex;
  align-items: center;
  justify-content: center;
}

.reward-order-sheet__copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #333;
  text-align: center;
}

.reward-order-sheet__eyebrow {
  display: block;
  font-size: 14px;
  line-height: 20px;
}

.reward-order-sheet__headline {
  display: block;
  margin-top: 7px;
  color: #222;
  font-size: 19px;
  font-weight: 700;
  line-height: 26px;
}

.reward-order-sheet__section-title {
  display: block;
  margin: 46px 0 15px 16px;
  color: #333;
  font-size: 15px;
  line-height: 21px;
}

.reward-order-sheet__hint {
  display: block;
  margin: 13px 0 0 16px;
  color: #aaa;
  font-size: 11px;
  line-height: 16px;
}

.reward-order-sheet__submit {
  display: flex;
  height: 47px;
  flex: 0 0 47px;
  align-items: center;
  justify-content: center;
  margin: auto 5px 0;
  border-radius: 24px;
  background: #ffe60f;
}

.reward-order-sheet__submit.disabled {
  opacity: .45;
}

.reward-order-sheet__submit text {
  color: #222;
  font-size: 16px;
  font-weight: 500;
  line-height: 22px;
}
</style>
