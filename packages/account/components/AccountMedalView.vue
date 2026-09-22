<template>
  <view class="medal-page" :class="'medal-page--' + variant">
    <PawPageNav :title="title" background="#f5f5f5" fallback-url="/pages/me/index" />
    <scroll-view v-if="variant === 'list'" class="medal-scroll" scroll-y :show-scrollbar="false">
      <image class="medal-bg" src="/static/figma/medals/medal-page-bg.png" mode="aspectFill" aria-hidden="true" />
      <view class="medal-card">
        <view class="medal-profile"><image src="/static/figma/me-avatar.png" mode="aspectFill" /><view><text>浮生孤影</text><text class="muted">勋章数量 0</text></view></view>
        <image class="featured" src="/static/figma/medals/guardian-medal.png" mode="aspectFit" />
        <text class="section-title">最近获得</text><text class="muted">累计投喂10斤</text>
        <view class="medal-grid"><view v-for="i in 6" :key="i"><image src="/static/figma/medals/guardian-medal.png" mode="aspectFit" /><text>诸邪退散</text></view></view>
      </view>
    </scroll-view>
    <view v-else class="medal-state">
      <image class="featured" src="/static/figma/medals/guardian-medal.png" mode="aspectFit" />
      <text class="section-title">{{ variant === 'map' ? '勋章地图' : '诸邪避散勋章' }}</text>
      <text class="muted">{{ variant === 'map' ? '勋章地图数据将在读取后展示' : '连续30天云养猫咪' }}</text>
      <view v-if="variant === 'achievement'" class="readonly-button" @tap="showReadOnly">已获得</view>
    </view>
  </view>
</template>
<script>
import PawPageNav from '@/components/PawPageNav.vue'
export default {
  name: 'AccountMedalView',
  components: { PawPageNav },
  props: { variant: { type: String, default: 'list' } },
  computed: { title() { return this.variant === 'map' ? '勋章地图' : this.variant === 'achievement' ? '勋章成就' : '我的勋章' } },
  methods: { showReadOnly() { uni.showToast({ title: '勋章状态只读展示', icon: 'none' }) } }
}
</script>
<style scoped>
.medal-page { display: flex; width: 100%; height: 100vh; min-height: 0; flex-direction: column; overflow: hidden; background: #f5f5f5; color: #222; }
.medal-scroll { position: relative; flex: 1; min-height: 0; }
.medal-bg { position: absolute; inset: 0; width: 100%; height: 100%; opacity: .22; }
.medal-card { position: relative; z-index: 1; padding: 18px 16px 36px; text-align: center; }
.medal-profile { display: flex; align-items: center; gap: 12px; text-align: left; }
.medal-profile image { width: 64px; height: 64px; border-radius: 50%; }
.medal-profile text { display: block; font-size: 16px; line-height: 24px; }
.muted { margin-top: 4px; color: #888; font-size: 13px; }
.featured { display: block; width: 164px; height: 164px; margin: 22px auto; }
.section-title { display: block; margin-top: 12px; font-size: 16px; font-weight: 500; }
.medal-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; margin-top: 24px; }
.medal-grid view { display: flex; width: 96px; flex-direction: column; align-items: center; font-size: 12px; }
.medal-grid image { width: 72px; height: 72px; }
.medal-state { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; }
.readonly-button { margin-top: 20px; padding: 9px 28px; border-radius: 999px; background: #e8e8e8; color: #666; font-size: 14px; }
</style>
