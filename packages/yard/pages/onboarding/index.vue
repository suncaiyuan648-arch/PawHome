<template>
  <view class="guide-page">
    <PawPageNav
      background="#f5f5f5"
      fallback-url="/pages/index/index"
    />

    <scroll-view
      class="main-scroll"
      scroll-y
      :show-scrollbar="false"
      :bounces="false"
      :enable-flex="true"
    >
      <view class="page-body">
        <view class="intro-card">
          <text class="intro-text">
            逢猫小院旨在让流浪猫获得生存的猫粮，并帮助它们找到铁饭碗（领养），
            <text class="intro-text-link">唯有以领养终止流浪</text>
          </text>
          <view
            class="intro-btn"
            data-qa="cat-guide-create"
            @tap="onGoCreate"
          >
            <text>前往创建</text>
            <PawIcon
              name="navigation/action-arrow"
              :size="14"
              label="前往创建"
            />
          </view>
        </view>

        <view class="rule-section">
          <text class="sec-title">院主需要做的</text>
          <view class="rule-card rule-card--duties">
            <view
              v-for="rule in dutiesRules"
              :key="rule.lead"
              class="rule-row"
            >
              <view class="dot dot--green" />
              <text class="rule-txt"
                ><text class="rule-lead">{{ rule.lead }}</text
                >{{ rule.text }}</text
              >
            </view>
          </view>
        </view>

        <view class="rule-section">
          <text class="sec-title">院主不能做的</text>
          <view class="rule-card rule-card--forbidden">
            <view
              v-for="(rule, index) in forbiddenRules"
              :key="index"
              class="rule-row"
            >
              <view class="dot dot--red" />
              <text class="rule-txt">
                <text
                  v-for="(part, partIndex) in rule"
                  :key="partIndex"
                  :class="{ 'danger-link': part.danger }"
                  >{{ part.text }}</text
                >
              </text>
            </view>
            <text class="warn-text">以上违规一经发现将永久封禁并追责</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <PawRealNamePrompt
      :visible="showAuthDialog"
      type="real-name"
      @update:visible="showAuthDialog = $event"
      @confirm="startAuth"
    />
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import PawPageNav from '@/components/PawPageNav.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawRealNamePrompt from '@/components/auth/PawRealNamePrompt.vue'
import { isRealNameVerified } from '@/utils/realNameMock.ts'
import {
  createYardOnboardingMetadata,
  type YardOnboardingMetadata,
} from '../../services/yardOnboardingMetadata.ts'

interface CatGuidePageState extends YardOnboardingMetadata {
  showAuthDialog: boolean
}

export default defineComponent({
  name: 'CatGuidePage',
  components: { PawPageNav, PawIcon, PawRealNamePrompt },
  data(): CatGuidePageState {
    const metadata = createYardOnboardingMetadata()
    return {
      showAuthDialog: false,
      ...metadata,
    }
  },
  methods: {
    onGoCreate() {
      if (isRealNameVerified()) {
        uni.navigateTo({ url: '/packages/yard/pages/create/index' })
        return
      }
      this.showAuthDialog = true
    },
    closeAuthDialog() {
      this.showAuthDialog = false
    },
    startAuth() {
      this.showAuthDialog = false
      uni.navigateTo({ url: '/packages/auth/pages/real-name/index' })
    },
  },
})
</script>

<style lang="less" scoped>
.guide-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
  background: #f5f5f5;
  color: #333;
}

.main-scroll {
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  box-sizing: border-box;
}

.page-body {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 23px;
  padding: 8px 15px 32px;
  box-sizing: border-box;
}

.intro-card {
  display: flex;
  flex: 0 0 141px;
  flex-direction: column;
  width: 100%;
  height: 141px;
  padding: 20px 15px 10px;
  box-sizing: border-box;
  border-radius: 15px;
  background: #fff;
}

.intro-text {
  display: block;
  width: 100%;
  color: #333;
  font-size: 16px;
  line-height: 20px;
}

.intro-text-link {
  font-weight: 500;
  text-decoration: underline;
}

.intro-btn {
  display: flex;
  flex: 0 0 34px;
  width: 107px;
  height: 34px;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: auto;
  margin-left: auto;
  border-radius: 20px;
  background: #defa93;
}

.intro-btn text {
  color: #282827;
  font-size: 15px;
  font-weight: 700;
  line-height: 25px;
  white-space: nowrap;
}

.rule-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.sec-title {
  display: block;
  margin: 0 10px;
  color: #333;
  font-size: 18px;
  font-weight: 700;
  line-height: 22px;
}

.rule-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  border-radius: 15px;
  background: #fff;
}

.rule-card--duties {
  min-height: 407px;
  padding: 24px 15px 20px;
  gap: 16px;
}

.rule-card--forbidden {
  min-height: 219px;
  padding: 24px 15px 15px;
  gap: 12px;
}

.rule-row {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 14px;
}

.dot {
  width: 4px;
  height: 4px;
  flex: 0 0 4px;
  margin-top: 10px;
  border-radius: 50%;
}

.dot--green {
  background: #10c96a;
}

.dot--red {
  background: #ff3d3d;
}

.rule-txt {
  min-width: 0;
  flex: 1 1 auto;
  color: #333;
  font-size: 16px;
  line-height: 20px;
  word-break: break-word;
}

.rule-lead {
  font-weight: 500;
}

.rule-card--forbidden .rule-txt {
  font-size: 15px;
  line-height: 22px;
}

.danger-link {
  color: #ff3d3d;
  text-decoration: underline;
}

.warn-text {
  align-self: center;
  margin-top: auto;
  color: #ff3d3d;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  white-space: nowrap;
}
</style>
