<template>
  <view class="adoption-progress-timeline" data-qa="qa-adoption-progress-timeline">
    <view class="adoption-progress-timeline__track" :class="`is-step-${step}`" aria-hidden="true">
      <view class="adoption-progress-timeline__line" />
      <view class="adoption-progress-timeline__active" :style="{ width: percent }" />
      <view v-for="item in markers" :key="item.key" class="adoption-progress-timeline__marker"
        :class="{ active: step >= item.step }" :style="{ left: item.offset }">
        <view class="adoption-progress-timeline__dot">
          <PawIcon v-if="step >= item.step" name="actions/selection-check" :size="9" />
        </view>
      </view>
      <view class="adoption-progress-timeline__reward" :class="{ active: step >= 4 }">
        <PawIcon name="badges/adoption-reward" :size="22" />
      </view>
    </view>
    <view class="adoption-progress-timeline__labels">
      <text :class="{ active: step >= 1 }">领养成功</text>
      <text :class="{ active: step >= 2 }">院主确认</text>
      <text :class="{ active: step >= 3 }">评审中</text>
      <text :class="{ active: step >= 4 }">{{ step >= 4 ? '抽取奖励' : '奖励' }}</text>
    </view>
    <text class="adoption-progress-timeline__percent">{{ percent }}</text>
  </view>
</template>

<script lang="ts">import { defineComponent } from 'vue'

import PawIcon from '@/components/PawIcon/PawIcon.vue'

export default defineComponent({
  name: 'AdoptionProgressTimeline',
  components: { PawIcon },
  props: {
    step: { type: Number, default: 1 },
    percent: { type: String, default: '0%' }
  },
  computed: {
    markers() {
      return [
        { key: 'adoption', step: 1, offset: '0%' },
        { key: 'owner', step: 2, offset: '28%' },
        { key: 'review', step: 3, offset: '57%' }
      ]
    }
  }
})
</script>

<style scoped>
.adoption-progress-timeline {
  position: relative;
  display: block;
  min-height: 72px;
  padding: 21px 13px 9px 10px;
  box-sizing: border-box;
  border-radius: 6px;
  background: #fff;
}

.adoption-progress-timeline__track {
  position: relative;
  height: 20px;
  margin-right: 2px;
}

.adoption-progress-timeline__line,
.adoption-progress-timeline__active {
  position: absolute;
  top: 8px;
  left: 0;
  height: 3px;
  border-radius: 3px;
}

.adoption-progress-timeline__line {
  right: 0;
  background: #eee;
}

.adoption-progress-timeline__active {
  background: #ff6900;
}

.adoption-progress-timeline__marker {
  position: absolute;
  top: 0;
  width: 20px;
  height: 20px;
  transform: translateX(-50%);
}

.adoption-progress-timeline__marker:first-of-type {
  transform: translateX(0);
}

.adoption-progress-timeline__dot {
  display: flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 50%;
  background: #fff;
}

.adoption-progress-timeline__marker.active .adoption-progress-timeline__dot {
  border-color: #ff6900;
  background: #ff6900;
  color: #fff;
}

.adoption-progress-timeline__reward {
  position: absolute;
  top: -1px;
  right: -1px;
  display: flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  opacity: .35;
}

.adoption-progress-timeline__reward.active {
  opacity: 1;
}

.adoption-progress-timeline__labels {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 5px;
  color: #aaa;
  font-size: 11px;
  line-height: 16px;
}

.adoption-progress-timeline__labels text.active {
  color: #fd6302;
}

.adoption-progress-timeline__percent {
  position: absolute;
  top: 5px;
  right: 13px;
  color: #aaa;
  font-size: 11px;
  line-height: 16px;
}
</style>

