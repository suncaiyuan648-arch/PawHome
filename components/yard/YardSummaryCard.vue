<template>
  <view class="yard-summary-card" :class="`yard-summary-card--${variant}`" @tap.stop="$emit('click', yard)">
    <view class="yard-summary-card__top">
      <PawAvatar :src="yard.avatar" :size="50" :clickable="true" @click="$emit('click', yard)" />
      <view class="yard-summary-card__main">
        <view class="yard-summary-card__name-row">
          <view class="yard-summary-card__identity">
            <text class="yard-summary-card__name">{{ yard.name }}</text>
            <PawVerifiedBadge v-if="yard.verified !== false" />
          </view>
          <text v-if="showDistance && distanceLabel" class="yard-summary-card__distance">{{ distanceLabel }}</text>
        </view>
        <YardLocationLine v-if="yard.location && variant !== 'detail'" :text="yard.location" />
        <view v-if="yard.tags && yard.tags.length" class="yard-summary-card__tags"><text
            v-for="(tag, index) in yard.tags" :key="index" class="yard-summary-card__tag">{{ tag }}</text></view>
      </view>
    </view>
    <text v-if="yard.description" class="yard-summary-card__description">{{ yard.description }}</text>
    <scroll-view v-if="showGallery && gallery.length" class="yard-summary-card__gallery" scroll-x
      :show-scrollbar="false">
      <view class="yard-summary-card__gallery-row">
        <view v-for="(photo, index) in gallery" :key="index" class="yard-summary-card__photo"
          @tap.stop="$emit('pet-click', photo)">
          <image :src="photo.src || photo" mode="aspectFill" /><text v-if="photo.title">{{ photo.title }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import PawAvatar from '@/components/identity/PawAvatar.vue'
import PawVerifiedBadge from '@/components/identity/PawVerifiedBadge.vue'
import YardLocationLine from '@/components/identity/YardLocationLine.vue'
import { safeImgSrc } from '@/utils/safeImgSrc.js'

export default {
  name: 'YardSummaryCard',
  components: { PawAvatar, PawVerifiedBadge, YardLocationLine },
  props: {
    yard: { type: Object, default: () => ({}) },
    variant: { type: String, default: 'list' },
    showGallery: { type: Boolean, default: true },
    showDistance: { type: Boolean, default: true }
  },
  emits: ['click', 'pet-click', 'gallery-scroll-end'],
  computed: {
    distanceLabel() {
      if (!this.yard.distance) return ''
      return this.variant === 'detail' && this.yard.location
        ? `${this.yard.distance} ${this.yard.location}`
        : this.yard.distance
    },
    gallery() { return (this.yard.gallery || this.yard.thumbUrls || []).map(item => typeof item === 'string' ? { src: safeImgSrc(item, '/static/avatarlog.png') } : { ...item, src: safeImgSrc(item.src || item.url, '/static/avatarlog.png') }) }
  }
}
</script>

<style scoped>
.yard-summary-card {
  position: relative;
  padding: 14px 12px 15px;
  box-sizing: border-box;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.yard-summary-card--detail {
  height: 236px;
  padding: 14px 0 20px;
  border-radius: 0;
}

.yard-summary-card__top {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.yard-summary-card__main {
  flex: 1;
  min-width: 0;
  margin-left: 11px;
}

.yard-summary-card__name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 20px;
  min-width: 0;
  gap: 12px;
}

.yard-summary-card__identity {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 3px;
}

.yard-summary-card__name {
  overflow: hidden;
  color: #333;
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.yard-summary-card__distance {
  flex: 0 0 auto;
  max-width: 160px;
  overflow: hidden;
  color: #999;
  font-size: 11px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.yard-summary-card__tags {
  display: flex;
  flex-wrap: nowrap;
  gap: 7px;
  margin-top: 9px;
  overflow: hidden;
}

.yard-summary-card__tag {
  height: 16px;
  padding: 0 5px;
  box-sizing: border-box;
  border-radius: 5px;
  background: var(--paw-yard-stat-bg, #fefada);
  color: var(--paw-yard-stat-text, #ee8002);
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
}

.yard-summary-card__description {
  display: block;
  margin-top: 11px;
  overflow: hidden;
  color: #a1a1a1;
  font-size: 12px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.yard-summary-card--detail .yard-summary-card__description {
  line-height: 12px;
}

.yard-summary-card__gallery {
  width: 100%;
  height: 114px;
  margin-top: 15px;
  white-space: nowrap;
}

.yard-summary-card__gallery-row {
  display: inline-flex;
}

.yard-summary-card__photo {
  width: 97px;
  margin-right: 5px;
}

.yard-summary-card__photo image {
  display: block;
  width: 97px;
  height: 96px;
  border-radius: 7px;
  background: #eee;
}

.yard-summary-card__photo text {
  display: block;
  margin-top: 2px;
  overflow: hidden;
  color: #666;
  font-size: 11px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
