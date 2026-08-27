<template>
  <view class="feed-card" :class="{ 'feed-card--single': item.title && item.title.length < 12 }" @tap.stop="$emit('click', item)">
    <view class="feed-card__image-wrap"><image class="feed-card__image" :src="item.cover" mode="aspectFill" /><view v-if="!item.embeddedLocation && (item.distance || item.district)" class="feed-card__location">● {{ item.distance || '3.2km' }} {{ item.district || '金水区' }}</view></view>
    <text class="feed-card__title">{{ item.title }}</text>
    <view class="feed-card__footer"><view class="feed-card__author" @tap.stop="$emit('user-click', item)"><PawAvatar :src="item.userAvatar" :size="17" /><text>{{ item.userName }}</text></view><view class="feed-card__like" @tap.stop="$emit('like', item)"><uni-icons :type="item.liked ? 'hand-up-filled' : 'hand-up'" :color="item.liked ? '#ff3b52' : '#777'" :size="14" /><text>{{ item.likes }}</text></view></view>
  </view>
</template>

<script>
import PawAvatar from '@/components/identity/PawAvatar.vue'
export default { name: 'FeedCard', components: { PawAvatar }, props: { item: { type: Object, default: () => ({}) } }, emits: ['click', 'user-click', 'like'] }
</script>

<style scoped>
.feed-card { width: 100%; overflow: hidden; border-radius: 4px; background: #feffff; }
.feed-card__image-wrap { position: relative; }
.feed-card__image { display: block; width: 100%; height: 240px; background: #f0f0f0; }
.feed-card__location { position: absolute; right: 4px; bottom: 4px; padding: 2px 4px; border-radius: 8px; background: rgba(0, 0, 0, .45); color: #fff; font-size: 10px; line-height: 12px; }
.feed-card__title { display: -webkit-box; min-height: 19px; margin: 8px 9px 0; overflow: hidden; color: #333; font-size: 13px; font-weight: 500; line-height: 19px; text-overflow: ellipsis; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.feed-card--single .feed-card__title { -webkit-line-clamp: 1; }
.feed-card__footer { display: flex; align-items: center; justify-content: space-between; padding: 7px 9px 10px; }
.feed-card__author, .feed-card__like { display: flex; align-items: center; min-height: 30px; color: #616161; font-size: 11px; }
.feed-card__author text { max-width: 115px; margin-left: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.feed-card__like { gap: 4px; color: #686868; font-size: 13px; }
</style>
