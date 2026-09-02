<template>
  <view class="paw-nav-placeholder" :style="placeholderStyle" data-qa="page-nav-placeholder">
    <view class="paw-nav" :style="navStyle" data-qa="page-nav">
      <view class="paw-nav__row" :style="rowStyle" data-qa="page-nav-row">
        <view class="paw-nav__back" :class="{ 'paw-nav__back--hidden': !showBack }" :style="backStyle" role="button"
          aria-label="返回" data-qa="page-nav-back" @click.stop="onBack">
          <PawIcon name="navigation/back" size="md" color="#282827" label="返回" />
        </view>

        <view v-if="$slots.content" class="paw-nav__content" :style="contentStyle" data-qa="page-nav-content">
          <slot name="content" />
        </view>
        <text v-else class="paw-nav__title" :class="{ 'paw-nav__title--light': light }" :style="titleStyle">{{ title
        }}</text>

        <!-- Transparent reserve only. WeChat renders the native capsule itself. -->
        <view class="paw-nav__native-reserve" :style="reserveStyle" aria-hidden="true" />
      </view>
    </view>
  </view>
</template>

<script>
import { getWechatNavLayout } from '@/utils/navLayout.js'
import { goBackSmart } from '@/utils/navBack.js'
import PawIcon from '@/components/PawIcon/PawIcon.vue'

export default {
  name: 'PawPageNav',
  components: { PawIcon },
  props: {
    title: { type: String, default: '' },
    titleCentered: { type: Boolean, default: false },
    background: { type: String, default: 'transparent' },
    light: { type: Boolean, default: false },
    showBack: { type: Boolean, default: true },
    autoBack: { type: Boolean, default: true },
    fallbackUrl: { type: String, default: '/pages/index/index' },
    contentInsetLeft: { type: Number, default: 44 },
    backHitWidth: { type: Number, default: 44 }
  },
  emits: ['back', 'layout'],
  data() {
    return { nav: getWechatNavLayout() }
  },
  computed: {
    placeholderStyle() {
      return { height: this.nav.totalHeight + 'px' }
    },
    navStyle() {
      return { paddingTop: this.nav.statusBarHeight + 'px', background: this.background }
    },
    rowStyle() {
      return { height: this.nav.navBarHeight + 'px' }
    },
    backStyle() {
      return { width: this.backHitWidth + 'px' }
    },
    contentStyle() {
      return {
        left: this.contentInsetLeft + 'px',
        right: this.nav.rightReservedWidth + 'px'
      }
    },
    titleStyle() {
      if (this.titleCentered) {
        return {
          left: '0px',
          right: '0px'
        }
      }
      return {
        left: '44px',
        right: this.nav.rightReservedWidth + 'px'
      }
    },
    reserveStyle() {
      return { width: this.nav.rightReservedWidth + 'px' }
    }
  },
  mounted() {
    this.$emit('layout', { ...this.nav })
  },
  methods: {
    onBack() {
      this.$emit('back')
      if (this.autoBack) goBackSmart({ fallbackUrl: this.fallbackUrl })
    }
  }
}
</script>

<style scoped>
.paw-nav-placeholder {
  position: relative;
  width: 100%;
  flex: 0 0 auto;
  box-sizing: border-box;
}

.paw-nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: var(--paw-z-nav, 200);
  width: 100%;
  box-sizing: border-box;
}

.paw-nav__row {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.paw-nav__back {
  position: absolute;
  top: 50%;
  left: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  box-sizing: border-box;
  transform: translateY(-50%);
}

.paw-nav__content {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 4;
  display: flex;
  min-width: 0;
  align-items: center;
  overflow: hidden;
}

.paw-nav__back--hidden {
  visibility: hidden;
  pointer-events: none;
}

.paw-nav__title {
  position: absolute;
  top: 50%;
  overflow: hidden;
  color: #1f1f1f;
  font-size: 17px;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  transform: translateY(-50%);
}

.paw-nav__title--light {
  color: #ffffff;
}

.paw-nav__native-reserve {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  pointer-events: none;
}
</style>

<style>
/* #ifdef MP-WEIXIN */
:host {
  display: block;
  width: 100%;
}

/* #endif */
</style>
