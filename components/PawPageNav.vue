<template>
  <view class="paw-nav" :class="{ 'paw-nav--fixed': fixed }" :style="navStyle">
    <view class="paw-nav__row" :style="rowStyle">
      <view
        class="paw-nav__side paw-nav__back"
        :class="{ 'paw-nav__back--hidden': !showBack }"
        role="button"
        aria-label="返回"
        @click.stop="onBack"
      >
        <image class="paw-nav__back-icon" :src="backIcon" mode="aspectFit" />
      </view>
      <text class="paw-nav__title" :class="{ 'paw-nav__title--light': light }">{{ title }}</text>
      <view class="paw-nav__side paw-nav__right" :style="rightStyle">
        <slot name="right" />
      </view>
    </view>
  </view>
</template>

<script>
import { getWechatNavLayout } from '@/utils/navLayout.js'
import { goBackSmart } from '@/utils/navBack.js'

export default {
  name: 'PawPageNav',
  props: {
    title: { type: String, default: '' },
    background: { type: String, default: 'transparent' },
    light: { type: Boolean, default: false },
    fixed: { type: Boolean, default: false },
    showBack: { type: Boolean, default: true },
    autoBack: { type: Boolean, default: true },
    fallbackUrl: { type: String, default: '/pages/index/index' },
    backIcon: { type: String, default: '/static/nav-back-arrow.png' }
  },
  emits: ['back'],
  data() {
    return { nav: getWechatNavLayout() }
  },
  computed: {
    navStyle() {
      return { paddingTop: this.nav.statusBarHeight + 'px', background: this.background }
    },
    rowStyle() {
      return {
        marginTop: this.nav.navRowOffsetTop + 'px',
        height: this.nav.navRowHeight + 'px'
      }
    },
    rightStyle() {
      return {
        width: this.nav.menuWidth + this.nav.menuRightInset + 'px',
        paddingRight: this.nav.menuRightInset + 'px'
      }
    }
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
.paw-nav { position: relative; z-index: 20; box-sizing: border-box; }
.paw-nav--fixed { position: fixed; top: 0; left: 0; right: 0; }
.paw-nav__row { position: relative; display: flex; align-items: center; min-height: 64rpx; box-sizing: border-box; }
.paw-nav__side { position: relative; z-index: 2; display: flex; align-items: center; justify-content: center; min-width: 88rpx; min-height: 88rpx; box-sizing: border-box; }
.paw-nav__right { margin-left: auto; justify-content: flex-start; }
.paw-nav__back--hidden { visibility: hidden; pointer-events: none; }
.paw-nav__back-icon { width: 44rpx; height: 44rpx; }
.paw-nav__title { position: absolute; left: 96rpx; right: 96rpx; overflow: hidden; color: #1f1f1f; font-size: 34rpx; font-weight: 500; line-height: 1.2; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
.paw-nav__title--light { color: #ffffff; }
</style>
