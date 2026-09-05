<template>
  <view class="paw-vote-ratio-bar" data-qa="qa-vote-ratio-bar">
    <view class="paw-vote-ratio-bar__track" :style="trackStyle" aria-hidden="true">
      <view class="paw-vote-ratio-bar__segment paw-vote-ratio-bar__segment--real"
        :class="{ 'paw-vote-ratio-bar__segment--single': !fakePercent, 'paw-vote-ratio-bar__segment--interactive': interactive, 'paw-vote-ratio-bar__segment--center-labels': centerLabels }"
        :style="realStyle" data-qa="qa-vote-ratio-real" @tap.stop="emitSegmentClick('real')">
        <view v-if="showLabels && realPercent && (realLabel || $slots['real-label'])" class="paw-vote-ratio-bar__label">
          <slot name="real-label">{{ realLabel }}</slot>
        </view>
      </view>
      <view class="paw-vote-ratio-bar__segment paw-vote-ratio-bar__segment--fake"
        :class="{ 'paw-vote-ratio-bar__segment--single': !realPercent, 'paw-vote-ratio-bar__segment--interactive': interactive, 'paw-vote-ratio-bar__segment--center-labels': centerLabels }"
        :style="fakeStyle" data-qa="qa-vote-ratio-fake" @tap.stop="emitSegmentClick('fake')">
        <view v-if="showLabels && fakePercent && (fakeLabel || $slots['fake-label'])" class="paw-vote-ratio-bar__label">
          <slot name="fake-label">{{ fakeLabel }}</slot>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
function clampPercent(value, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(0, Math.min(100, number))
}

export default {
  name: 'PawVoteRatioBar',
  props: {
    realPercent: { type: Number, default: 50 },
    fakePercent: { type: Number, default: 50 },
    realLabel: { type: String, default: '' },
    fakeLabel: { type: String, default: '' },
    showLabels: { type: Boolean, default: true },
    interactive: { type: Boolean, default: false },
    centerLabels: { type: Boolean, default: false },
    minFakeWidth: { type: Number, default: 0 },
    height: { type: [Number, String], default: 26 },
    dividerWidth: { type: Number, default: 8 }
  },
  computed: {
    normalizedPercentages() {
      const real = clampPercent(this.realPercent, 50)
      const fake = clampPercent(this.fakePercent, 50)
      const total = real + fake
      if (total <= 0) return { real: 50, fake: 50 }
      const normalizedReal = Math.round(real / total * 1000) / 10
      return {
        real: normalizedReal,
        fake: Math.round((100 - normalizedReal) * 10) / 10
      }
    },
    realPercent() {
      return this.normalizedPercentages.real
    },
    fakePercent() {
      return this.normalizedPercentages.fake
    },
    trackStyle() {
      const numericHeight = Number(this.height)
      const height = typeof this.height === 'number'
        ? `${this.height}px`
        : (Number.isFinite(numericHeight) ? `${numericHeight}px` : String(this.height))
      const radius = Number.isFinite(numericHeight) ? `${numericHeight / 2}px` : '13px'
      return {
        height,
        borderRadius: radius,
        '--paw-vote-divider-width': `${Math.max(0, Number(this.dividerWidth) || 0)}px`
      }
    },
    realStyle() {
      return { flexBasis: `${this.realPercent}%` }
    },
    fakeStyle() {
      const minWidth = this.fakePercent && this.minFakeWidth > 0 ? `${this.minFakeWidth}px` : '0px'
      return { flexBasis: `${this.fakePercent}%`, minWidth }
    }
  },
  emits: ['segment-click'],
  methods: {
    emitSegmentClick(segment) {
      if (this.interactive) this.$emit('segment-click', segment)
    }
  }
}
</script>

<style scoped>
.paw-vote-ratio-bar {
  display: block;
  width: 100%;
  min-width: 0;
}

.paw-vote-ratio-bar__track {
  display: flex;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  background: transparent;
  border: 0;
}

.paw-vote-ratio-bar__segment {
  display: flex;
  min-width: 0;
  align-items: center;
  box-sizing: border-box;
  overflow: visible;
}

.paw-vote-ratio-bar__segment--interactive {
  cursor: pointer;
}

.paw-vote-ratio-bar__segment--real {
  position: relative;
  z-index: 1;
  flex: 0 1 auto;
  justify-content: flex-start;
  padding-right: var(--paw-vote-divider-width);
  padding-left: 12px;
  margin-right: 0;
  background: #ffe60f;
  clip-path: polygon(0 0, 100% 0, calc(100% - var(--paw-vote-divider-width)) 100%, 0 100%);
}

.paw-vote-ratio-bar__segment--fake {
  flex: 1 1 auto;
  justify-content: flex-end;
  padding-right: 10px;
  padding-left: var(--paw-vote-divider-width);
  background: #1292ff;
  clip-path: polygon(var(--paw-vote-divider-width) 0, 100% 0, 100% 100%, 0 100%);
}

.paw-vote-ratio-bar__segment--single {
  margin-right: 0;
  padding-right: 0;
  padding-left: 12px;
  clip-path: none;
}

.paw-vote-ratio-bar__segment--fake.paw-vote-ratio-bar__segment--single {
  padding-right: 10px;
  padding-left: 0;
  clip-path: none;
}

.paw-vote-ratio-bar__segment--center-labels {
  justify-content: center;
  padding-right: 0;
  padding-left: 0;
}

.paw-vote-ratio-bar__label {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  color: #333;
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
}

.paw-vote-ratio-bar__segment--fake .paw-vote-ratio-bar__label {
  color: #fff;
}
</style>
