<template>
  <PawOverlay v-model:visible="visibleProxy" :close-on-mask="false" placement="center" :z-index="10000">
    <view class="real-name-prompt" :class="`real-name-prompt--${type}`" @tap.stop>
      <view class="real-name-prompt__main">
        <text class="real-name-prompt__title">{{ title }}</text>
        <text v-if="type === 'real-name'" class="real-name-prompt__body">
          创建小院需要先实名认证，每人仅能创建一个小院，发布虚假违规信息将永久取消您的小院资格，平台将严格保护您的隐私。
        </text>
        <text v-else class="real-name-prompt__body real-name-prompt__body--privacy">
          请仔细阅读
          <text class="real-name-prompt__link">《隐私政策》</text>
          和
          <text class="real-name-prompt__link">《用户协议》</text>
        </text>
      </view>
      <view class="real-name-prompt__actions">
        <view class="real-name-prompt__action real-name-prompt__action--cancel" @tap.stop="onCancel">
          <text>{{ type === 'privacy' ? '拒绝' : '返回' }}</text>
        </view>
        <view class="real-name-prompt__action real-name-prompt__action--confirm" @tap.stop="onConfirm">
          <text>{{ type === 'privacy' ? '同意' : '开始实名' }}</text>
        </view>
      </view>
    </view>
  </PawOverlay>
</template>

<script>
import PawOverlay from '@/components/overlay/PawOverlay.vue'

export default {
  name: 'PawRealNamePrompt',
  components: { PawOverlay },
  props: {
    visible: { type: Boolean, default: false },
    type: { type: String, default: 'real-name', validator: value => ['real-name', 'privacy'].includes(value) }
  },
  emits: ['update:visible', 'cancel', 'confirm'],
  computed: {
    visibleProxy: {
      get() { return this.visible },
      set(value) { this.$emit('update:visible', value) }
    },
    title() {
      return this.type === 'privacy' ? '隐私政策及用户协议' : '实名认证'
    }
  },
  methods: {
    onCancel() {
      this.$emit('cancel')
      this.visibleProxy = false
    },
    onConfirm() {
      this.$emit('confirm')
      this.visibleProxy = false
    }
  }
}
</script>

<style scoped>
.real-name-prompt {
  width: 317px;
  max-width: calc(100vw - 58px);
  overflow: hidden;
  border-radius: 20px;
  background: #fff;
  transform: translateY(-26px);
}

.real-name-prompt--privacy {
  transform: translateY(0);
}

.real-name-prompt__main {
  display: flex;
  flex-direction: column;
  height: 226px;
  padding: 20px 26px 0;
  box-sizing: border-box;
}

.real-name-prompt--privacy .real-name-prompt__main {
  height: 111px;
  padding-top: 17px;
}

.real-name-prompt__title {
  display: block;
  color: #333;
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
  text-align: center;
  white-space: nowrap;
}

.real-name-prompt--privacy .real-name-prompt__title {
  font-size: 16px;
  font-weight: 500;
  line-height: 22px;
}

.real-name-prompt__body {
  display: block;
  margin-top: 31px;
  color: #686868;
  font-size: 15px;
  font-weight: 400;
  line-height: 22px;
  word-break: break-word;
}

.real-name-prompt--privacy .real-name-prompt__body {
  margin-top: 20px;
  color: #666;
  font-size: 14px;
  line-height: 20px;
  white-space: nowrap;
}

.real-name-prompt__link {
  color: #517ddb;
}

.real-name-prompt__actions {
  display: flex;
  height: 53px;
}

.real-name-prompt__action {
  display: flex;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  height: 53px;
  box-sizing: border-box;
}

.real-name-prompt__action text {
  color: #999;
  font-size: 15px;
  font-weight: 400;
  line-height: 22px;
}

.real-name-prompt__action--confirm {
  background: #ffe60f;
}

.real-name-prompt__action--confirm text {
  color: #000;
  font-weight: 500;
}
</style>
