<template>
  <view class="paw-jury-action-bar" data-qa="qa-jury-action-bar">
    <view class="paw-jury-action-bar__content">
      <view class="paw-jury-action-bar__share" data-qa="qa-jury-share" @tap.stop="$emit('share')">
        <PawIcon name="actions/share" :size="18" color="#2c2c2c" label="分享" />
        <text>分享</text>
      </view>

      <view v-if="!voted" class="paw-jury-action-bar__votes" data-qa="qa-jury-vote-actions">
        <PawVoteRatioBar class="paw-jury-action-bar__vote-bar" :real-percent="50" :fake-percent="50" :height="45"
          :divider-width="8" :interactive="true" :center-labels="true" @segment-click="onVoteSegment">
          <template #real-label>
            <text class="paw-jury-action-bar__vote-label">挺真实</text>
          </template>
          <template #fake-label>
            <text class="paw-jury-action-bar__vote-label">有点假</text>
          </template>
        </PawVoteRatioBar>
      </view>

      <PawButton v-else class="paw-jury-action-bar__next" qa="qa-jury-next" text="" size="md" block flush nowrap
        @click="$emit('next')">
        <text>{{ nextLabel }}</text>
      </PawButton>
    </view>
  </view>
</template>

<script>
import PawButton from '@/components/base/PawButton.vue'
import PawIcon from '@/components/PawIcon/PawIcon.vue'
import PawVoteRatioBar from '@/components/PawVoteRatioBar.vue'

export default {
  name: 'PawJuryActionBar',
  components: { PawButton, PawIcon, PawVoteRatioBar },
  props: {
    voted: { type: Boolean, default: false },
    nextLabel: { type: String, default: '下一条（1/1）' }
  },
  emits: ['share', 'vote', 'next'],
  methods: {
    onVoteSegment(segment) {
      this.$emit('vote', segment)
    }
  }
}
</script>

<style scoped>
.paw-jury-action-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: var(--paw-z-footer, 300);
  height: 88px;
  min-height: 88px;
  padding: 7px 18px 34px 20px;
  box-sizing: border-box;
  border-top: .5px solid rgba(0, 0, 0, .05);
  background: #fff;
}

/* #ifdef MP-WEIXIN */
.paw-jury-action-bar {
  padding-bottom: env(safe-area-inset-bottom);
}

/* #endif */

.paw-jury-action-bar__content,
.paw-jury-action-bar__votes {
  display: flex;
  min-width: 0;
  align-items: flex-start;
}

.paw-jury-action-bar__content {
  width: 100%;
  height: 45px;
  align-items: center;
  justify-content: space-between;
}

.paw-jury-action-bar__share {
  display: flex;
  width: 42px;
  flex: 0 0 42px;
  flex-direction: column;
  align-items: center;
  color: #2c2c2c;
  font-size: 11px;
  line-height: 14px;
  white-space: nowrap;
}

.paw-jury-action-bar__share .paw-icon {
  margin-bottom: 1px;
}

.paw-jury-action-bar__votes {
  flex: 1 1 auto;
  gap: 4px;
  margin-left: 8px;
}

.paw-jury-action-bar__next {
  height: 45px;
  min-height: 45px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 23px;
  font-size: 15px;
  font-weight: 700;
  line-height: 21px;
  white-space: nowrap;
}

.paw-jury-action-bar__vote-bar {
  flex: 1 1 auto;
  min-width: 0;
}

.paw-jury-action-bar__vote-label {
  font-size: 15px;
  font-weight: 500;
  line-height: 21px;
}

.paw-jury-action-bar__next {
  flex: 1 1 auto;
  margin-left: 8px;
  background: #ffe60f;
  color: #333;
}

.paw-jury-action-bar__next {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 45px;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
</style>
